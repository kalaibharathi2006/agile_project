/**
 * Comprehensive Backend API & Integration Test Suite
 * Covers:
 * - API Status Codes & Health
 * - Authentication & Token verification
 * - Role Authorization (Admin vs Traveler 403/200)
 * - Validation & Error Handling
 * - MongoDB CRUD (Destinations, Hotels, Reviews, Partners)
 * - Accessibility Verification Workflow
 * - MongoDB Analytics Aggregation (User/Trip Analytics, A11y Usage Reports)
 *
 * Run with: npm test (or node tests/api.test.js)
 */

const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

// Load models
const User = require('../src/models/User');
const Destination = require('../src/models/Destination');
const Hotel = require('../src/models/Hotel');
const Review = require('../src/models/Review');
const Partner = require('../src/models/Partner');
const Trip = require('../src/models/Trip');
const UserPreferences = require('../src/models/UserPreferences');

// Require express app
const app = require('../src/server');

let server;
let baseUrl;
let regularUserToken = '';
let adminUserToken = '';
let regularUserId = '';
let adminUserId = '';
let testDestId = '';
let testReviewId = '';
let testPartnerId = '';

// Helper for making HTTP requests
function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = { ...headers };
    let postData = '';

    if (body) {
      postData = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Test Runner
const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

/* ============================================================
   TEST DEFINITIONS
   ============================================================ */

// 1. Health & Status Codes
test('1.1 Health endpoint returns 200 and healthy status', async () => {
  const res = await request('GET', '/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
});

test('1.2 Root endpoint returns 200 and API metadata', async () => {
  const res = await request('GET', '/');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(typeof res.body.message, 'string');
});

test('1.3 Unknown route returns 404 with error message', async () => {
  const res = await request('GET', '/api/non-existent-route-xyz');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
});

// 2. Authentication & Authorization
test('2.1 User registration rejects missing fields with 400', async () => {
  const res = await request('POST', '/api/auth/register', {}, { email: 'bad@test.com' });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
});

test('2.2 Regular user login returns 200 and JWT token', async () => {
  const uniqueEmail = `traveler_${Date.now()}@test.com`;
  const regRes = await request('POST', '/api/auth/register', {}, {
    name: 'Test Traveler',
    email: uniqueEmail,
    password: 'Password@123',
  });
  assert.strictEqual(regRes.status, 201);
  assert.ok(regRes.body.token);
  regularUserToken = regRes.body.token;
  regularUserId = regRes.body.user._id || regRes.body.user.id;
});

test('2.3 Admin login returns 200 and admin role JWT', async () => {
  // Ensure admin exists
  let admin = await User.findOne({ email: 'admin_test@test.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Test Admin',
      email: 'admin_test@test.com',
      password: 'AdminPassword@123',
      role: 'admin',
    });
  }

  const loginRes = await request('POST', '/api/auth/login', {}, {
    email: 'admin_test@test.com',
    password: 'AdminPassword@123',
  });
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.body.user.role, 'admin');
  adminUserToken = loginRes.body.token;
  adminUserId = loginRes.body.user._id;
});

test('2.4 Protected route rejects unauthenticated request with 401', async () => {
  const res = await request('GET', '/api/trips');
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('2.5 Admin route rejects regular traveler with 403 Forbidden', async () => {
  const res = await request('GET', '/api/admin/users', {
    Authorization: `Bearer ${regularUserToken}`,
  });
  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.success, false);
});

test('2.6 Admin route grants access to admin user with 200', async () => {
  const res = await request('GET', '/api/admin/users', {
    Authorization: `Bearer ${adminUserToken}`,
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
});

// 3. Destinations & Hotels
test('3.1 Public destinations route returns list of destinations', async () => {
  const res = await request('GET', '/api/destinations');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.data));
  if (res.body.data.length > 0) {
    testDestId = res.body.data[0]._id;
  }
});

test('3.2 Hotels route supports accessibility filters', async () => {
  const res = await request('GET', '/api/hotels?wheelchairAccessible=true');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.data));
});

// 4. Phase 10: Reviews & Accessibility Verification
test('4.1 Create review with accessibility ratings and wheelchair feedback', async () => {
  if (!testDestId) {
    const d = await Destination.create({
      name: 'Test Destination',
      state: 'Test State',
      description: 'A test destination',
    });
    testDestId = d._id.toString();
  }

  const reviewPayload = {
    entityType: 'destination',
    entityId: testDestId,
    rating: 5,
    accessibilityRating: 4,
    wheelchairAccessible: true,
    staffHelpfulness: 5,
    title: 'Fantastic Step-Free Access and Smooth Boardwalks',
    comment: 'Had a wonderful time exploring with my electric wheelchair.',
    accessibilityComment: 'Ramps are wide with non-slip surfaces. Accessible restrooms available near main entrance.',
  };

  const res = await request('POST', '/api/reviews', {
    Authorization: `Bearer ${regularUserToken}`,
  }, reviewPayload);

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.rating, 5);
  assert.strictEqual(res.body.data.wheelchairAccessible, true);
  testReviewId = res.body.data._id;
});

test('4.2 GET reviews returns dynamic ratings summary & breakdown', async () => {
  const res = await request('GET', `/api/reviews?entityType=destination&entityId=${testDestId}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.summary);
  assert.ok(res.body.summary.avgRating > 0);
  assert.ok(res.body.summary.starsBreakdown);
  assert.strictEqual(typeof res.body.summary.wheelchairAccessiblePercent, 'number');
});

test('4.3 Vote review as helpful increments counter', async () => {
  assert.ok(testReviewId, 'Test review must exist');
  const res = await request('POST', `/api/reviews/${testReviewId}/helpful`, {
    Authorization: `Bearer ${adminUserToken}`,
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.helpfulCount, 1);
  assert.strictEqual(res.body.hasVoted, true);
});

test('4.4 Admin verifies accessibility review and grants trust badge', async () => {
  assert.ok(testReviewId, 'Test review must exist');
  const res = await request('PUT', `/api/reviews/${testReviewId}/verify`, {
    Authorization: `Bearer ${adminUserToken}`,
  }, { isVerified: true });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.isVerified, true);
  assert.ok(res.body.data.verifiedBy);
});

// 5. Phase 11: Admin & Partner Management
test('5.1 Admin creates new Partner in directory', async () => {
  const partnerPayload = {
    name: 'Accessible Cabs Express',
    category: 'transport',
    description: 'Wheelchair ramp accessible cabs with safety locks',
    phone: '+91 99999 11111',
    email: 'cabs@accessiblecabs.test',
    city: 'Chennai',
    state: 'Tamil Nadu',
    discountPercentage: 15,
    isVerified: true,
  };

  const res = await request('POST', '/api/admin/partners', {
    Authorization: `Bearer ${adminUserToken}`,
  }, partnerPayload);

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.name, 'Accessible Cabs Express');
  testPartnerId = res.body.data._id;
});

test('5.2 Admin updates Partner details', async () => {
  assert.ok(testPartnerId, 'Partner ID must exist');
  const res = await request('PUT', `/api/admin/partners/${testPartnerId}`, {
    Authorization: `Bearer ${adminUserToken}`,
  }, { discountPercentage: 20 });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.discountPercentage, 20);
});

// 6. Phase 12: Analytics & Reporting (MongoDB aggregation pipelines)
test('6.1 GET /api/admin/analytics/overview returns real aggregation counts', async () => {
  const res = await request('GET', '/api/admin/analytics/overview', {
    Authorization: `Bearer ${adminUserToken}`,
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.users);
  assert.ok(res.body.data.users.total >= 2); // traveler + admin
  assert.ok(res.body.data.trips);
  assert.ok(res.body.data.trips.byStatus);
  assert.ok(Array.isArray(res.body.data.popularDestinations));
});

test('6.2 GET /api/admin/analytics/accessibility returns live preference breakdowns', async () => {
  // Create sample preferences
  await UserPreferences.findOneAndUpdate(
    { user: regularUserId },
    {
      requiresWheelchair: true,
      requiresElevator: true,
      mobilityLevel: 'wheelchair',
      travelPace: 'slow',
    },
    { upsert: true, new: true }
  );

  const res = await request('GET', '/api/admin/analytics/accessibility', {
    Authorization: `Bearer ${adminUserToken}`,
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.userPreferences);
  assert.ok(res.body.data.userPreferences.featureUsage);
  assert.ok(res.body.data.userPreferences.featureUsage.wheelchair >= 1);
  assert.ok(res.body.data.reviewsAccessibility);
  assert.ok(res.body.data.reviewsAccessibility.verifiedReviews >= 1);
});

// Cleanup test items
test('7.1 Cleanup test review and test partner', async () => {
  if (testReviewId) {
    const res = await request('DELETE', `/api/reviews/${testReviewId}`, {
      Authorization: `Bearer ${adminUserToken}`,
    });
    assert.strictEqual(res.status, 200);
  }
  if (testPartnerId) {
    const res = await request('DELETE', `/api/admin/partners/${testPartnerId}`, {
      Authorization: `Bearer ${adminUserToken}`,
    });
    assert.strictEqual(res.status, 200);
  }
});

/* ============================================================
   EXECUTION HARNESS
   ============================================================ */
async function run() {
  console.log('🧪 Starting Inclusive Trip Designer Test Suite...\n');

  // Start test server on random port
  const TEST_PORT = 5099;
  server = app.listen(TEST_PORT);
  baseUrl = `http://localhost:${TEST_PORT}`;

  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed (${tests.length} total)`);
  console.log(`========================================\n`);

  server.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
