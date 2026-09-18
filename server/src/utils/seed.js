/**
 * Seed script: populates MongoDB with sample Indian tourism data
 * Run: node src/utils/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Destination = require('../models/Destination');
const Attraction = require('../models/Attraction');
const Hotel = require('../models/Hotel');
const User = require('../models/User');

const connectDB = require('../config/database');

const destinations = [
  {
    name: 'Chennai', state: 'Tamil Nadu', country: 'India',
    description: 'The gateway to South India, Chennai offers a rich blend of culture, heritage, and modern amenities with good accessibility infrastructure.',
    shortDescription: 'Cultural capital of South India with beaches and temples',
    location: { type: 'Point', coordinates: [80.2707, 13.0827] },
    climate: 'Tropical', bestTimeToVisit: 'November to February',
    accessibilityRating: 3.5, wheelchairFriendly: true, publicTransportAccessible: true,
    accessibilityNotes: 'Metro rail is wheelchair accessible. Major tourist spots have ramps.',
    totalAttractions: 8, popularityScore: 90,
    tags: ['beach', 'culture', 'heritage', 'temples', 'food'],
    images: [],
  },
  {
    name: 'Ooty', state: 'Tamil Nadu', country: 'India',
    description: 'Known as the Queen of Hill Stations, Ooty offers cool weather and stunning landscapes. Moderate accessibility with hilly terrain.',
    shortDescription: 'Queen of Hill Stations with tea gardens and scenic beauty',
    location: { type: 'Point', coordinates: [76.6952, 11.4102] },
    climate: 'Cool & Pleasant', bestTimeToVisit: 'April to June',
    accessibilityRating: 2.5, wheelchairFriendly: false, publicTransportAccessible: true,
    accessibilityNotes: 'Hilly terrain limits wheelchair access. Toy train is accessible.',
    totalAttractions: 6, popularityScore: 85,
    tags: ['hills', 'nature', 'tea', 'scenic', 'cool climate'],
    images: [],
  },
  {
    name: 'Madurai', state: 'Tamil Nadu', country: 'India',
    description: 'The Temple City of India, Madurai is home to the magnificent Meenakshi Amman Temple and rich cultural heritage.',
    shortDescription: 'Ancient temple city — home to Meenakshi Amman Temple',
    location: { type: 'Point', coordinates: [78.1198, 9.9252] },
    climate: 'Hot & Humid', bestTimeToVisit: 'October to March',
    accessibilityRating: 3.0, wheelchairFriendly: true, publicTransportAccessible: true,
    accessibilityNotes: 'Meenakshi Temple has wheelchair access at main entrance.',
    totalAttractions: 7, popularityScore: 88,
    tags: ['temples', 'heritage', 'culture', 'religion', 'history'],
    images: [],
  },
  {
    name: 'Thanjavur', state: 'Tamil Nadu', country: 'India',
    description: 'The rice bowl of Tamil Nadu, home to the UNESCO World Heritage Brihadeeswarar Temple.',
    shortDescription: 'UNESCO World Heritage temple city and cultural hub',
    location: { type: 'Point', coordinates: [79.1378, 10.7870] },
    climate: 'Tropical', bestTimeToVisit: 'October to February',
    accessibilityRating: 3.2, wheelchairFriendly: true, publicTransportAccessible: false,
    accessibilityNotes: 'Brihadeeswarar Temple has level access in outer areas.',
    totalAttractions: 5, popularityScore: 75,
    tags: ['temples', 'UNESCO', 'heritage', 'art', 'history'],
    images: [],
  },
  {
    name: 'Coimbatore', state: 'Tamil Nadu', country: 'India',
    description: 'The Manchester of South India, a gateway to Ooty and home to Marudhamalai Temple.',
    shortDescription: 'Industrial city and gateway to the Nilgiris',
    location: { type: 'Point', coordinates: [76.9558, 11.0168] },
    climate: 'Semi-arid', bestTimeToVisit: 'November to February',
    accessibilityRating: 3.0, wheelchairFriendly: false, publicTransportAccessible: true,
    totalAttractions: 4, popularityScore: 70,
    tags: ['city', 'temples', 'gateway', 'shopping'],
    images: [],
  },
  {
    name: 'Tiruchirappalli', state: 'Tamil Nadu', country: 'India',
    description: 'Home to the iconic Rock Fort Temple, Srirangam Island, and vibrant bazaars.',
    shortDescription: 'Historic city with Rock Fort and river island temples',
    location: { type: 'Point', coordinates: [78.7047, 10.7905] },
    climate: 'Tropical', bestTimeToVisit: 'October to March',
    accessibilityRating: 2.8, wheelchairFriendly: false, publicTransportAccessible: true,
    accessibilityNotes: 'Rock Fort has steep stairs — not accessible. Ranganathaswamy Temple has ramps.',
    totalAttractions: 5, popularityScore: 78,
    tags: ['temples', 'heritage', 'rock fort', 'history'],
    images: [],
  },
  {
    name: 'Bengaluru', state: 'Karnataka', country: 'India',
    description: 'The Silicon Valley of India with vibrant parks, museums, and a pleasant climate year-round.',
    shortDescription: 'Tech capital with beautiful parks and year-round pleasant weather',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    climate: 'Pleasant', bestTimeToVisit: 'October to February',
    accessibilityRating: 4.0, wheelchairFriendly: true, publicTransportAccessible: true,
    accessibilityNotes: 'Metro has lifts at all stations. Many parks are wheelchair accessible.',
    totalAttractions: 8, popularityScore: 92,
    tags: ['city', 'parks', 'museums', 'shopping', 'food', 'tech'],
    images: [],
  },
  {
    name: 'Kochi', state: 'Kerala', country: 'India',
    description: 'The Queen of the Arabian Sea with Chinese fishing nets, colonial heritage, and beautiful backwaters.',
    shortDescription: 'Historic port city with backwaters and colonial charm',
    location: { type: 'Point', coordinates: [76.2673, 9.9312] },
    climate: 'Tropical', bestTimeToVisit: 'October to February',
    accessibilityRating: 3.8, wheelchairFriendly: true, publicTransportAccessible: true,
    accessibilityNotes: 'Fort Kochi area is relatively flat. Some backwater cruise boats have ramps.',
    totalAttractions: 7, popularityScore: 89,
    tags: ['backwaters', 'heritage', 'beach', 'colonial', 'food', 'culture'],
    images: [],
  },
];

const getAttractions = (destMap) => [
  // Chennai attractions
  {
    name: 'Marina Beach',
    destination: destMap['Chennai'],
    description: "World's second longest beach, perfect for morning walks with wide, level promenade.",
    category: 'beach',
    location: { type: 'Point', coordinates: [80.2825, 13.0500] },
    address: 'Marina Beach Road, Chennai',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: false, accessibleRestroom: true,
      seatingAvailable: true, parkingAvailable: true, guidedToursAvailable: false,
      accessibilityScore: 7, walkingDifficulty: 'easy',
      surfaceType: 'Paved promenade and sandy beach',
      accessibilityNotes: 'Wide paved promenade suitable for wheelchairs. Sand may be difficult.',
    },
    openingHours: 'Open 24 hours', entryFee: 0, averageVisitDurationMinutes: 90,
    rating: 4.2, reviewCount: 1200, tags: ['beach', 'promenade', 'sunset'],
  },
  {
    name: 'Government Museum Chennai',
    destination: destMap['Chennai'],
    description: 'One of the oldest museums in India with excellent accessibility facilities.',
    category: 'museum',
    location: { type: 'Point', coordinates: [80.2622, 13.0710] },
    address: 'Pantheon Road, Egmore, Chennai',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: true, accessibleRestroom: true,
      seatingAvailable: true, parkingAvailable: true, guidedToursAvailable: true,
      accessibilityScore: 9, walkingDifficulty: 'easy',
      surfaceType: 'Smooth tiled floors throughout',
      accessibilityNotes: 'Fully wheelchair accessible with ramps and lifts. Rest areas available.',
    },
    openingHours: '9:30 AM - 5:00 PM (Closed Fridays)', entryFee: 20,
    averageVisitDurationMinutes: 120, rating: 4.4, reviewCount: 850,
    tags: ['museum', 'culture', 'history', 'art'],
  },
  {
    name: 'Kapaleeshwarar Temple',
    destination: destMap['Chennai'],
    description: 'Ancient Shiva temple in Mylapore with stunning Dravidian architecture.',
    category: 'religious',
    location: { type: 'Point', coordinates: [80.2685, 13.0339] },
    address: 'Mylapore, Chennai',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: false, accessibleRestroom: true,
      seatingAvailable: true, parkingAvailable: false, accessibilityScore: 6,
      walkingDifficulty: 'easy', surfaceType: 'Stone flooring, some steps',
      accessibilityNotes: 'Wheelchair ramp at main entrance. Devotees assist with entry.',
    },
    openingHours: '5:30 AM - 12:00 PM, 4:00 PM - 9:30 PM', entryFee: 0,
    averageVisitDurationMinutes: 60, rating: 4.5, reviewCount: 2100,
    tags: ['temple', 'religion', 'architecture', 'culture'],
  },
  // Bengaluru attractions
  {
    name: 'Lalbagh Botanical Garden',
    destination: destMap['Bengaluru'],
    description: 'A stunning 240-acre botanical garden with paved paths and excellent accessibility.',
    category: 'nature',
    location: { type: 'Point', coordinates: [77.5867, 12.9502] },
    address: 'Mavalli, Bengaluru',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: false, accessibleRestroom: true,
      seatingAvailable: true, parkingAvailable: true, guidedToursAvailable: true,
      accessibilityScore: 9, walkingDifficulty: 'easy',
      surfaceType: 'Well-paved paths throughout',
      accessibilityNotes: 'Excellent wheelchair accessibility. Many seating areas and shade.',
    },
    openingHours: '6:00 AM - 7:00 PM', entryFee: 20,
    averageVisitDurationMinutes: 120, rating: 4.6, reviewCount: 3200,
    tags: ['nature', 'garden', 'walk', 'flowers', 'relaxation'],
  },
  {
    name: 'Visvesvaraya Industrial & Technological Museum',
    destination: destMap['Bengaluru'],
    description: 'Interactive science museum with excellent accessibility for all visitors.',
    category: 'museum',
    location: { type: 'Point', coordinates: [77.5920, 12.9722] },
    address: 'Kasturba Road, Bengaluru',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: true, accessibleRestroom: true,
      seatingAvailable: true, parkingAvailable: true, guidedToursAvailable: true,
      accessibilityScore: 10, walkingDifficulty: 'easy',
      surfaceType: 'Smooth floors, all levels accessible by lift',
      accessibilityNotes: 'Fully accessible. Staff trained to assist visitors with disabilities.',
    },
    openingHours: '10:00 AM - 6:00 PM', entryFee: 60,
    averageVisitDurationMinutes: 150, rating: 4.3, reviewCount: 1800,
    tags: ['museum', 'science', 'technology', 'interactive', 'family'],
  },
  // Kochi attractions
  {
    name: 'Chinese Fishing Nets',
    destination: destMap['Kochi'],
    description: 'Iconic Chinese fishing nets at Fort Kochi beach with level waterfront promenade.',
    category: 'heritage',
    location: { type: 'Point', coordinates: [76.2455, 9.9636] },
    address: 'Fort Kochi Beach, Kochi',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: false, accessibleRestroom: false,
      seatingAvailable: true, parkingAvailable: true, accessibilityScore: 7,
      walkingDifficulty: 'easy', surfaceType: 'Paved waterfront promenade',
      accessibilityNotes: 'Level promenade accessible. Restrooms nearby but may not be accessible.',
    },
    openingHours: '6:00 AM - 7:00 PM', entryFee: 0,
    averageVisitDurationMinutes: 60, rating: 4.1, reviewCount: 2400,
    tags: ['heritage', 'waterfront', 'photography', 'sunset'],
  },
  {
    name: 'Kerala Folklore Museum',
    destination: destMap['Kochi'],
    description: 'Three-storey museum showcasing Kerala folklore with elevator access.',
    category: 'museum',
    location: { type: 'Point', coordinates: [76.3087, 9.9585] },
    address: 'Thevara, Ernakulam, Kochi',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: true, accessibleRestroom: true,
      seatingAvailable: true, parkingAvailable: true, guidedToursAvailable: true,
      accessibilityScore: 8, walkingDifficulty: 'easy',
      surfaceType: 'Smooth wood and tile flooring',
      accessibilityNotes: 'Elevator to all floors. Guided tour available for visually impaired.',
    },
    openingHours: '9:30 AM - 6:00 PM', entryFee: 100,
    averageVisitDurationMinutes: 90, rating: 4.5, reviewCount: 650,
    tags: ['museum', 'culture', 'folklore', 'art', 'heritage'],
  },
  // Madurai attractions
  {
    name: 'Meenakshi Amman Temple',
    destination: destMap['Madurai'],
    description: 'One of the most magnificent temples in India with partially accessible pathways.',
    category: 'religious',
    location: { type: 'Point', coordinates: [78.1198, 9.9195] },
    address: 'Madurai City Center, Madurai',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: false, accessibleRestroom: true,
      seatingAvailable: true, parkingAvailable: true, accessibilityScore: 6,
      walkingDifficulty: 'moderate', surfaceType: 'Stone and marble flooring',
      accessibilityNotes: 'Wheelchair access at East Tower. Inner sanctum has steps. Guides assist.',
    },
    openingHours: '5:00 AM - 12:30 PM, 4:00 PM - 10:00 PM', entryFee: 50,
    averageVisitDurationMinutes: 120, rating: 4.7, reviewCount: 5200,
    tags: ['temple', 'religion', 'architecture', 'UNESCO', 'culture'],
  },
  // Thanjavur attractions
  {
    name: 'Brihadeeswarar Temple',
    destination: destMap['Thanjavur'],
    description: 'UNESCO World Heritage Chola-era temple with level outer courtyard access.',
    category: 'heritage',
    location: { type: 'Point', coordinates: [79.1318, 10.7830] },
    address: 'Thanjavur City, Thanjavur',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: false, accessibleRestroom: true,
      seatingAvailable: true, parkingAvailable: true, accessibilityScore: 7,
      walkingDifficulty: 'moderate', surfaceType: 'Stone courtyard, some uneven areas',
      accessibilityNotes: 'Outer courtyard is wheelchair accessible. Inner shrine has steep steps.',
    },
    openingHours: '6:00 AM - 8:30 PM', entryFee: 0,
    averageVisitDurationMinutes: 90, rating: 4.8, reviewCount: 3800,
    tags: ['UNESCO', 'temple', 'heritage', 'architecture', 'history'],
  },
];

const getHotels = (destMap) => [
  {
    name: 'ITC Grand Chola Chennai',
    destination: destMap['Chennai'],
    description: 'Luxury hotel with exceptional accessibility facilities and award-winning service.',
    starRating: 5, pricePerNight: 12000, priceCategory: 'luxury',
    location: { type: 'Point', coordinates: [80.2249, 13.0070] },
    address: '63, Mount Road, Guindy, Chennai',
    phone: '+91-44-22200000',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: true, accessibleRooms: true,
      accessibleRestroom: true, rampAccess: true, parkingAvailable: true,
      accessiblePool: true, visualAlerts: true, accessibilityScore: 10,
      accessibilityNotes: 'Fully accessible property. Dedicated accessible rooms with roll-in showers.',
    },
    amenities: ['Pool', 'Spa', 'Restaurant', 'Gym', 'WiFi', 'Valet Parking', 'Accessible Rooms'],
    rating: 4.8, reviewCount: 1200,
  },
  {
    name: 'Taj Coromandel Chennai',
    destination: destMap['Chennai'],
    description: 'Iconic 5-star hotel with excellent wheelchair accessibility and central location.',
    starRating: 5, pricePerNight: 10000, priceCategory: 'luxury',
    location: { type: 'Point', coordinates: [80.2461, 13.0565] },
    address: 'Nungambakkam High Road, Chennai',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: true, accessibleRooms: true,
      accessibleRestroom: true, rampAccess: true, parkingAvailable: true,
      accessibilityScore: 9, accessibilityNotes: 'Accessible rooms available. Helpful concierge.',
    },
    amenities: ['Pool', 'Spa', 'Multiple Restaurants', 'Gym', 'WiFi', 'Business Center'],
    rating: 4.7, reviewCount: 980,
  },
  {
    name: 'Hotel Sangam Thanjavur',
    destination: destMap['Thanjavur'],
    description: 'Comfortable hotel near Brihadeeswarar Temple with good accessibility.',
    starRating: 3, pricePerNight: 3500, priceCategory: 'mid-range',
    location: { type: 'Point', coordinates: [79.1350, 10.7865] },
    address: 'Trichy Road, Thanjavur',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: true, accessibleRooms: false,
      accessibleRestroom: true, rampAccess: true, parkingAvailable: true,
      accessibilityScore: 7, accessibilityNotes: 'Ramp at entrance, lift to all floors.',
    },
    amenities: ['Restaurant', 'WiFi', 'Parking', 'Room Service', 'AC'],
    rating: 4.0, reviewCount: 320,
  },
  {
    name: 'Marriott Bengaluru',
    destination: destMap['Bengaluru'],
    description: 'Modern luxury hotel with comprehensive disability access throughout the property.',
    starRating: 5, pricePerNight: 8000, priceCategory: 'luxury',
    location: { type: 'Point', coordinates: [77.6099, 12.9698] },
    address: '10, Someshwar Layout, Whitefield Road, Bengaluru',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: true, accessibleRooms: true,
      accessibleRestroom: true, rampAccess: true, parkingAvailable: true,
      accessiblePool: false, visualAlerts: true, accessibilityScore: 10,
      accessibilityNotes: 'Multiple accessible rooms. Pool lift available. Staff disability awareness trained.',
    },
    amenities: ['Pool', 'Spa', 'Restaurant', 'Gym', 'WiFi', 'Accessible Parking'],
    rating: 4.6, reviewCount: 890,
  },
  {
    name: 'Fort House Hotel Kochi',
    destination: destMap['Kochi'],
    description: 'Heritage boutique hotel by the waterfront with modern accessibility retrofits.',
    starRating: 4, pricePerNight: 5000, priceCategory: 'mid-range',
    location: { type: 'Point', coordinates: [76.2452, 9.9638] },
    address: '2/6A Calvathy Road, Fort Kochi',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: true, accessibleRooms: true,
      accessibleRestroom: true, rampAccess: true, parkingAvailable: false,
      accessibilityScore: 7, accessibilityNotes: 'Accessible rooms on ground floor available.',
    },
    amenities: ['Restaurant', 'WiFi', 'Waterfront View', 'Room Service'],
    rating: 4.4, reviewCount: 420,
  },
  {
    name: 'Hotel Heritage Madurai',
    destination: destMap['Madurai'],
    description: 'Well-located heritage hotel near Meenakshi Temple with basic accessibility.',
    starRating: 3, pricePerNight: 2800, priceCategory: 'mid-range',
    location: { type: 'Point', coordinates: [78.1190, 9.9210] },
    address: 'West Perumal Maistry Street, Madurai',
    accessibility: {
      wheelchairAccessible: true, elevatorAvailable: true, accessibleRooms: false,
      accessibleRestroom: false, rampAccess: true, parkingAvailable: true,
      accessibilityScore: 5, accessibilityNotes: 'Lift available. Ramp at entrance.',
    },
    amenities: ['Restaurant', 'WiFi', 'Parking', 'AC', 'Room Service'],
    rating: 3.9, reviewCount: 280,
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Promise.all([
      Destination.deleteMany({}),
      Attraction.deleteMany({}),
      Hotel.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing destinations, attractions, hotels');

    // Insert destinations
    const insertedDestinations = await Destination.insertMany(destinations);
    console.log(`✅ Inserted ${insertedDestinations.length} destinations`);

    // Build destination name -> _id map
    const destMap = {};
    insertedDestinations.forEach((d) => { destMap[d.name] = d._id; });

    // Insert attractions
    const attractionsData = getAttractions(destMap);
    const insertedAttractions = await Attraction.insertMany(attractionsData);
    console.log(`✅ Inserted ${insertedAttractions.length} attractions`);

    // Insert hotels
    const hotelsData = getHotels(destMap);
    const insertedHotels = await Hotel.insertMany(hotelsData);
    console.log(`✅ Inserted ${insertedHotels.length} hotels`);

    // Create admin user
    const existingAdmin = await User.findOne({ email: 'admin@inclusivetrip.com' });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin User',
        email: 'admin@inclusivetrip.com',
        password: 'Admin@12345',
        role: 'admin',
      });
      console.log('✅ Admin user created: admin@inclusivetrip.com / Admin@12345');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Destinations: ${insertedDestinations.length}`);
    console.log(`   Attractions:  ${insertedAttractions.length}`);
    console.log(`   Hotels:       ${insertedHotels.length}`);
    console.log('\n🔐 Admin Login:');
    console.log('   Email:    admin@inclusivetrip.com');
    console.log('   Password: Admin@12345');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
