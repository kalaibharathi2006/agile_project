import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar/Navbar'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'

// Pages
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Dashboard from './pages/Dashboard/Dashboard'
import Profile from './pages/Profile/Profile'
import Destinations from './pages/Destinations/Destinations'
import DestinationDetail from './pages/Destinations/DestinationDetail'
import AttractionDetail from './pages/Destinations/AttractionDetail'
import MyTrips from './pages/Trips/MyTrips'
import CreateTrip from './pages/Trips/CreateTrip'
import TripDetail from './pages/Trips/TripDetail'
import Hotels from './pages/Hotels/Hotels'
import HotelDetail from './pages/Hotels/HotelDetail'

import './App.css'


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/"          element={<Home />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />

          {/* Phase 4: Destination Discovery (public — browseable without login) */}
          <Route path="/destinations"          element={<Destinations />} />
          <Route path="/destinations/:id"      element={<DestinationDetail />} />
          <Route path="/attractions/:id"       element={<AttractionDetail />} />

          {/* Phase 8: Hotels & Accessible Accommodations (public — browseable without login) */}
          <Route path="/hotels"                element={<Hotels />} />
          <Route path="/hotels/:id"            element={<HotelDetail />} />

          {/* ── Protected routes ── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ── Phase 5: Trip Planner (protected) ── */}
          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <MyTrips />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/new"
            element={
              <ProtectedRoute>
                <CreateTrip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id"
            element={
              <ProtectedRoute>
                <TripDetail />
              </ProtectedRoute>
            }
          />


          {/* Catch-all → Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

