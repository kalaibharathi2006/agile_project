const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const Attraction = require('../models/Attraction');

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

    // Update trip status
    await Trip.findByIdAndUpdate(trip._id, { status: 'planned' });

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
