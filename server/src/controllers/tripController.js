const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const Attraction = require('../models/Attraction');
const Hotel = require('../models/Hotel');
const { computeTripScores } = require('../services/scoringService');

// @desc    Create a new trip
// @route   POST /api/trips
// @access  Private
exports.createTrip = async (req, res, next) => {
  try {
    const tripData = { ...req.body, user: req.user._id };
    const trip = await Trip.create(tripData);
    await trip.populate('destination', 'name state');
    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all trips for logged-in user
// @route   GET /api/trips
// @access  Private
exports.getTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({ user: req.user._id })
      .populate('destination', 'name state images')
      .populate('hotel', 'name starRating')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: trips.length, data: trips });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trip
// @route   GET /api/trips/:id
// @access  Private
exports.getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id })
      .populate('destination')
      .populate('hotel');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }
    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a trip
// @route   PUT /api/trips/:id
// @access  Private
exports.updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('destination').populate('hotel');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    // Recalculate totalDays in itinerary if dates were updated
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / msPerDay) + 1);
    await Itinerary.findOneAndUpdate({ trip: trip._id }, { totalDays });

    // Recalculate scores based on updated requirements or hotel
    const itinerary = await Itinerary.findOne({ trip: trip._id });
    if (itinerary) {
      const attractionIds = itinerary.items
        .filter((i) => i.type === 'attraction' && i.attraction)
        .map((i) => (typeof i.attraction === 'object' ? i.attraction._id : i.attraction));
      const attractions = await Attraction.find({ _id: { $in: attractionIds } });
      const hotel = trip.hotel ? await Hotel.findById(trip.hotel) : null;
      const scores = computeTripScores(trip.travelRequirements || {}, attractions, hotel);
      trip.accessibilityScore = scores.accessibilityScore;
      trip.comfortScore = scores.comfortScore;
      trip.overallSuitabilityScore = scores.overallSuitabilityScore;
      await trip.save();
    }

    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};


// @desc    Assign or remove hotel from trip
// @route   PUT /api/trips/:id/hotel
// @access  Private
exports.assignHotel = async (req, res, next) => {
  try {
    const { hotelId } = req.body;
    const update = hotelId ? { hotel: hotelId } : { $unset: { hotel: 1 } };
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      update,
      { new: true }
    ).populate('destination').populate('hotel');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }
    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};


// @desc    Delete a trip
// @route   DELETE /api/trips/:id
// @access  Private
exports.deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }
    // Also delete associated itinerary
    await Itinerary.deleteOne({ trip: req.params.id });
    res.status(200).json({ success: true, message: 'Trip deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate itinerary for a trip
// @route   POST /api/trips/:id/itinerary
// @access  Private
exports.generateItinerary = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id }).populate('destination');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    // Calculate number of days
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / msPerDay) + 1);

    // Fetch accessible attractions for this destination
    const accessibilityQuery = { destination: trip.destination._id, isActive: true };
    if (trip.travelRequirements.requiresWheelchair) {
      accessibilityQuery['accessibility.wheelchairAccessible'] = true;
    }

    const attractions = await Attraction.find(accessibilityQuery)
      .sort({ 'accessibility.accessibilityScore': -1 })
      .limit(totalDays * 3);

    // Generate day-wise itinerary
    const items = [];
    let order = 0;

    for (let day = 1; day <= totalDays; day++) {
      const dayAttractions = attractions.slice((day - 1) * 3, day * 3);
      const pace = trip.travelRequirements.travelPace;
      const restInterval = trip.travelRequirements.restBreakIntervalMinutes || 90;

      // Breakfast
      items.push({
        dayNumber: day, startTime: '08:00', endTime: '09:00',
        type: 'meal', title: 'Breakfast', description: 'Start your day with a good meal',
        durationMinutes: 60, isMealBreak: true, order: order++,
        location: { type: 'Point', coordinates: [0, 0] },
      });

      let currentHour = 9;

      dayAttractions.forEach((attraction, idx) => {
        const visitDuration = pace === 'slow' ? attraction.averageVisitDurationMinutes * 1.5
          : pace === 'fast' ? attraction.averageVisitDurationMinutes * 0.75
          : attraction.averageVisitDurationMinutes;

        items.push({
          dayNumber: day,
          startTime: `${String(Math.floor(currentHour)).padStart(2, '0')}:00`,
          endTime: `${String(Math.floor(currentHour + visitDuration / 60)).padStart(2, '0')}:30`,
          type: 'attraction',
          title: attraction.name,
          description: attraction.description,
          attraction: attraction._id,
          durationMinutes: Math.round(visitDuration),
          distanceFromPreviousMeters: 800,
          transportMode: trip.travelRequirements.requiresWheelchair ? 'taxi' : 'walk',
          accessibilityNotes: attraction.accessibility?.accessibilityNotes,
          order: order++,
          location: attraction.location,
        });
        currentHour += visitDuration / 60;

        // Add rest break if needed
        if ((idx + 1) % 2 === 0 && currentHour < 18) {
          items.push({
            dayNumber: day,
            startTime: `${String(Math.floor(currentHour)).padStart(2, '0')}:00`,
            endTime: `${String(Math.floor(currentHour) + 1).padStart(2, '0')}:00`,
            type: 'rest',
            title: 'Rest Break',
            description: 'Take a comfortable rest break',
            durationMinutes: trip.travelRequirements.restBreakDurationMinutes || 20,
            isRestBreak: true,
            order: order++,
            location: { type: 'Point', coordinates: [0, 0] },
          });
          currentHour += 0.5;
        }

        // Lunch after second attraction
        if (idx === 1) {
          items.push({
            dayNumber: day,
            startTime: `${String(Math.floor(currentHour)).padStart(2, '0')}:00`,
            endTime: `${String(Math.floor(currentHour) + 1).padStart(2, '0')}:30`,
            type: 'meal', title: 'Lunch', description: 'Enjoy a local meal',
            durationMinutes: 90, isMealBreak: true, order: order++,
            location: { type: 'Point', coordinates: [0, 0] },
          });
          currentHour += 1.5;
        }
      });

      // Dinner
      items.push({
        dayNumber: day, startTime: '19:00', endTime: '20:30',
        type: 'meal', title: 'Dinner', description: 'End your day with a relaxing dinner',
        durationMinutes: 90, isMealBreak: true, order: order++,
        location: { type: 'Point', coordinates: [0, 0] },
      });

      // Hotel rest
      items.push({
        dayNumber: day, startTime: '20:30', endTime: '22:00',
        type: 'hotel', title: 'Hotel Rest', description: 'Return to hotel and rest',
        hotel: trip.hotel, durationMinutes: 90, order: order++,
        location: { type: 'Point', coordinates: [0, 0] },
      });
    }

    // Save or update itinerary
    const itinerary = await Itinerary.findOneAndUpdate(
      { trip: trip._id },
      { trip: trip._id, totalDays, items, generatedAt: new Date(), lastModifiedAt: new Date() },
      { new: true, upsert: true }
    );

    // ── Phase 6: Compute & persist real accessibility scores ──
    const hotel = trip.hotel ? await Hotel.findById(trip.hotel) : null;
    const scores = computeTripScores(trip.travelRequirements || {}, attractions, hotel);
    await Trip.findByIdAndUpdate(trip._id, {
      status: 'planned',
      accessibilityScore:      scores.accessibilityScore,
      comfortScore:            scores.comfortScore,
      overallSuitabilityScore: scores.overallSuitabilityScore,
    });

    res.status(201).json({ success: true, data: itinerary });
  } catch (error) {
    next(error);
  }
};

// @desc    Get itinerary for a trip
// @route   GET /api/trips/:id/itinerary
// @access  Private
exports.getItinerary = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }
    const itinerary = await Itinerary.findOne({ trip: req.params.id }).populate('items.attraction');
    if (!itinerary) {
      return res.status(404).json({ success: false, message: 'Itinerary not generated yet.' });
    }
    res.status(200).json({ success: true, data: itinerary });
  } catch (error) {
    next(error);
  }
};

// @desc    Update itinerary manually
// @route   PUT /api/trips/:id/itinerary
// @access  Private
exports.updateItinerary = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }
    const itinerary = await Itinerary.findOneAndUpdate(
      { trip: req.params.id },
      { ...req.body, lastModifiedAt: new Date(), $inc: { version: 1 } },
      { new: true }
    );
    res.status(200).json({ success: true, data: itinerary });
  } catch (error) {
    next(error);
  }
};

// @desc    Modify a specific item in the itinerary
// @route   PUT /api/trips/:id/itinerary/item/:itemId
// @access  Private
exports.modifyItineraryItem = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const itinerary = await Itinerary.findOne({ trip: req.params.id });
    if (!itinerary) {
      return res.status(404).json({ success: false, message: 'Itinerary not found.' });
    }

    const item = itinerary.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Itinerary item not found.' });
    }

    const {
      title,
      startTime,
      endTime,
      durationMinutes,
      transportMode,
      description,
      accessibilityNotes,
      type,
    } = req.body;

    if (title !== undefined) item.title = title;
    if (startTime !== undefined) item.startTime = startTime;
    if (endTime !== undefined) item.endTime = endTime;
    if (durationMinutes !== undefined) item.durationMinutes = durationMinutes;
    if (transportMode !== undefined) item.transportMode = transportMode;
    if (description !== undefined) item.description = description;
    if (accessibilityNotes !== undefined) item.accessibilityNotes = accessibilityNotes;
    if (type !== undefined) item.type = type;

    itinerary.lastModifiedAt = new Date();
    itinerary.version = (itinerary.version || 1) + 1;
    await itinerary.save();
    await itinerary.populate('items.attraction');

    res.status(200).json({ success: true, data: itinerary });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new item/break to the itinerary
// @route   POST /api/trips/:id/itinerary/item
// @access  Private
exports.addItineraryItem = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const itinerary = await Itinerary.findOne({ trip: req.params.id });
    if (!itinerary) {
      return res.status(404).json({ success: false, message: 'Itinerary not found.' });
    }

    const {
      dayNumber = 1,
      startTime = '10:00',
      endTime = '11:00',
      type = 'rest',
      title = 'Custom Activity',
      description = '',
      durationMinutes = 60,
      transportMode = 'walk',
      accessibilityNotes = '',
      attraction = null,
    } = req.body;

    const maxOrder = itinerary.items.reduce((max, i) => Math.max(max, i.order || 0), 0);

    const newItem = {
      dayNumber: Number(dayNumber),
      startTime,
      endTime,
      type,
      title,
      description,
      durationMinutes: Number(durationMinutes),
      transportMode,
      accessibilityNotes,
      isRestBreak: type === 'rest',
      isMealBreak: type === 'meal',
      order: maxOrder + 1,
      location: { type: 'Point', coordinates: [0, 0] },
    };
    if (attraction) newItem.attraction = attraction;

    itinerary.items.push(newItem);
    itinerary.lastModifiedAt = new Date();
    itinerary.version = (itinerary.version || 1) + 1;
    await itinerary.save();
    await itinerary.populate('items.attraction');

    res.status(201).json({ success: true, data: itinerary });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an item from the itinerary
// @route   DELETE /api/trips/:id/itinerary/item/:itemId
// @access  Private
exports.deleteItineraryItem = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const itinerary = await Itinerary.findOne({ trip: req.params.id });
    if (!itinerary) {
      return res.status(404).json({ success: false, message: 'Itinerary not found.' });
    }

    itinerary.items.pull({ _id: req.params.itemId });
    itinerary.lastModifiedAt = new Date();
    itinerary.version = (itinerary.version || 1) + 1;
    await itinerary.save();
    await itinerary.populate('items.attraction');

    res.status(200).json({ success: true, data: itinerary });
  } catch (error) {
    next(error);
  }
};

// @desc    Smart adaptation & schedule recalculation
// @route   POST /api/trips/:id/itinerary/adapt
// @access  Private
exports.adaptItinerary = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id })
      .populate('destination')
      .populate('hotel');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const itinerary = await Itinerary.findOne({ trip: req.params.id });
    if (!itinerary) {
      return res.status(404).json({ success: false, message: 'Itinerary not found.' });
    }

    // Group items by day
    const byDay = {};
    for (let d = 1; d <= itinerary.totalDays; d++) {
      byDay[d] = [];
    }
    itinerary.items.forEach((item) => {
      const d = item.dayNumber || 1;
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(item);
    });

    const formatTime = (minutes) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    // For each day, cascade times sequentially
    Object.keys(byDay).forEach((dayStr) => {
      const dayItems = byDay[dayStr];
      let currentMinute = 8 * 60; // 08:00 start

      dayItems.forEach((item, idx) => {
        const duration = Number(item.durationMinutes) || 60;
        if (idx === 0 && item.isMealBreak && item.title.toLowerCase().includes('breakfast')) {
          item.startTime = '08:00';
          item.endTime = '09:00';
          currentMinute = 9 * 60;
        } else {
          item.startTime = formatTime(currentMinute);
          item.endTime = formatTime(currentMinute + duration);
          currentMinute += duration;
          currentMinute += 15; // 15-min travel/buffer
        }
        item.order = idx;
      });
    });

    itinerary.lastModifiedAt = new Date();
    itinerary.version = (itinerary.version || 1) + 1;
    await itinerary.save();
    await itinerary.populate('items.attraction');

    // Re-score trip using scoringService
    const attractionIds = itinerary.items
      .filter((i) => i.type === 'attraction' && i.attraction)
      .map((i) => (typeof i.attraction === 'object' ? i.attraction._id : i.attraction));

    const attractions = await Attraction.find({ _id: { $in: attractionIds } });
    const hotel = trip.hotel ? await Hotel.findById(trip.hotel) : null;
    const scores = computeTripScores(trip.travelRequirements || {}, attractions, hotel);

    await Trip.findByIdAndUpdate(trip._id, {
      accessibilityScore: scores.accessibilityScore,
      comfortScore: scores.comfortScore,
      overallSuitabilityScore: scores.overallSuitabilityScore,
    });

    res.status(200).json({ success: true, data: itinerary, scores });
  } catch (error) {
    next(error);
  }
};

