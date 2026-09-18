/**
 * TripMap.jsx  —  Phase 7: Interactive Map Component
 *
 * Uses OpenStreetMap tiles + react-leaflet.
 * Shows:
 *   - Destination marker (flag)
 *   - Attraction markers (colour-coded by category)
 *   - Numbered day markers from the itinerary
 *   - Route polyline connecting itinerary stops in order
 *   - Walking difficulty colour on route segments
 *   - Popup on each marker with name, score, difficulty
 *   - Distance and route summary panel
 *
 * Props:
 *   destination   — Destination document (has .location.coordinates [lng,lat])
 *   attractions   — Array of Attraction documents
 *   itinerary     — Itinerary document (has .items[])
 *   height        — CSS height string (default '480px')
 */

import { useEffect, useRef } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './TripMap.css'

// ─── Fix Leaflet default icon paths broken by bundlers ───────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Custom coloured div-icon factory ────────────────────────────────────────
const makeIcon = (emoji, color, label = '') =>
  L.divIcon({
    className: '',
    html: `
      <div class="map-marker map-marker--${color}" role="img" aria-label="${label}">
        <span class="map-marker__emoji">${emoji}</span>
      </div>`,
    iconSize:   [40, 44],
    iconAnchor: [20, 44],
    popupAnchor:[0,  -44],
  })

const makeNumberedIcon = (num, color) =>
  L.divIcon({
    className: '',
    html: `
      <div class="map-marker map-marker--${color} map-marker--numbered" aria-label="Stop ${num}">
        <span class="map-marker__num">${num}</span>
      </div>`,
    iconSize:   [36, 40],
    iconAnchor: [18, 40],
    popupAnchor:[0,  -40],
  })

// ─── Icon catalogue by attraction category ───────────────────────────────────
const CATEGORY_ICONS = {
  heritage:      { emoji: '🏛️', color: 'blue'   },
  nature:        { emoji: '🌿', color: 'green'  },
  religious:     { emoji: '🕌', color: 'yellow' },
  museum:        { emoji: '🖼️', color: 'purple' },
  park:          { emoji: '🌳', color: 'green'  },
  beach:         { emoji: '🏖️', color: 'teal'   },
  shopping:      { emoji: '🛍️', color: 'pink'   },
  food:          { emoji: '🍽️', color: 'orange' },
  entertainment: { emoji: '🎭', color: 'red'    },
  other:         { emoji: '📍', color: 'gray'   },
}

const DIFFICULTY_COLOR = { easy: '#16a34a', moderate: '#d97706', difficult: '#dc2626' }

// ─── Auto-fit bounds ──────────────────────────────────────────────────────────
function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] })
    } else if (positions.length === 1) {
      map.setView(positions[0], 13)
    }
  }, [positions, map])
  return null
}

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversine([lng1, lat1], [lng2, lat2]) {
  const R  = 6371
  const dL = ((lat2 - lat1) * Math.PI) / 180
  const dl = ((lng2 - lng1) * Math.PI) / 180
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dl / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Route summary card ───────────────────────────────────────────────────────
function RouteSummary({ stops, totalDistanceKm }) {
  if (!stops.length) return null
  return (
    <div className="trip-map__summary" role="region" aria-label="Route summary">
      <div className="trip-map__summary-header">
        <span aria-hidden="true">🗺️</span>
        <h3>Route Summary</h3>
      </div>
      <div className="trip-map__summary-stats">
        <div className="trip-map__stat">
          <span className="trip-map__stat-value">{stops.length}</span>
          <span className="trip-map__stat-label">Stops</span>
        </div>
        <div className="trip-map__stat">
          <span className="trip-map__stat-value">{totalDistanceKm.toFixed(1)} km</span>
          <span className="trip-map__stat-label">Total Distance</span>
        </div>
        <div className="trip-map__stat">
          <span className="trip-map__stat-value">{Math.round(totalDistanceKm * 12)} min</span>
          <span className="trip-map__stat-label">Est. Travel</span>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export function TripMap({ destination, attractions = [], itinerary, height = '480px' }) {
  // Destination centre — fallback to Bengaluru if missing
  const destCoords = destination?.location?.coordinates?.length === 2 &&
    (destination.location.coordinates[0] !== 0 || destination.location.coordinates[1] !== 0)
      ? [destination.location.coordinates[1], destination.location.coordinates[0]]  // [lat, lng]
      : [12.9716, 77.5946]

  // Build an ordered list of stops from the itinerary (attraction type only)
  const itineraryStops = []
  if (itinerary?.items) {
    const attrMap = {}
    attractions.forEach((a) => { attrMap[String(a._id)] = a })

    let stopNum = 0
    itinerary.items
      .filter((i) => i.type === 'attraction' && i.attraction)
      .forEach((item) => {
        stopNum++
        const attrId = typeof item.attraction === 'object' ? String(item.attraction._id) : String(item.attraction)
        const attr   = attrMap[attrId]
        const coords = attr?.location?.coordinates
        if (coords && (coords[0] !== 0 || coords[1] !== 0)) {
          itineraryStops.push({
            num:         stopNum,
            title:       item.title,
            dayNumber:   item.dayNumber,
            startTime:   item.startTime,
            latLng:      [coords[1], coords[0]],
            coords:      coords,
            difficulty:  attr?.accessibility?.walkingDifficulty || 'moderate',
            a11yScore:   attr?.accessibility?.accessibilityScore || 0,
            duration:    item.durationMinutes,
            transport:   item.transportMode,
            attraction:  attr,
          })
        }
      })
  }

  // All positions for bounds fitting
  const allPositions = [
    destCoords,
    ...itineraryStops.map((s) => s.latLng),
    ...attractions
      .filter((a) => a.location?.coordinates?.[0] !== 0)
      .map((a) => [a.location.coordinates[1], a.location.coordinates[0]]),
  ]

  // Route polyline points (only itinerary stops with valid coords)
  const routePoints = itineraryStops.map((s) => s.latLng)

  // Colour route by day
  const DAY_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  const routeByDay = {}
  itineraryStops.forEach((s) => {
    if (!routeByDay[s.dayNumber]) routeByDay[s.dayNumber] = []
    routeByDay[s.dayNumber].push(s.latLng)
  })

  // Total distance
  let totalDistanceKm = 0
  for (let i = 1; i < itineraryStops.length; i++) {
    totalDistanceKm += haversine(itineraryStops[i - 1].coords, itineraryStops[i].coords)
  }

  // Attractions without itinerary (just show on map)
  const standaloneAttrs = attractions.filter((a) => {
    const coords = a.location?.coordinates
    return coords && (coords[0] !== 0 || coords[1] !== 0) &&
      !itineraryStops.some((s) => s.attraction && String(s.attraction._id) === String(a._id))
  })

  return (
    <div className="trip-map-wrapper">
      <RouteSummary stops={itineraryStops} totalDistanceKm={totalDistanceKm} />

      <div className="trip-map__container" style={{ height }}>
        <MapContainer
          center={destCoords}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          {/* OpenStreetMap tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds positions={allPositions} />

          {/* Destination marker */}
          <Marker
            position={destCoords}
            icon={makeIcon('🏙️', 'primary', `Destination: ${destination?.name || 'City'}`)}
          >
            <Popup>
              <div className="map-popup">
                <p className="map-popup__title">🏙️ {destination?.name}</p>
                <p className="map-popup__sub">{destination?.state}</p>
                {destination?.accessibilityRating && (
                  <p className="map-popup__score">♿ Accessibility: {destination.accessibilityRating}/5</p>
                )}
              </div>
            </Popup>
          </Marker>

          {/* Route polylines — one per day, colour-coded */}
          {Object.entries(routeByDay).map(([day, points]) => (
            points.length > 1 && (
              <Polyline
                key={`day-${day}`}
                positions={points}
                pathOptions={{
                  color:  DAY_COLORS[(parseInt(day) - 1) % DAY_COLORS.length],
                  weight: 4,
                  opacity: 0.8,
                  dashArray: '8 4',
                }}
              />
            )
          ))}

          {/* Itinerary stop markers — numbered */}
          {itineraryStops.map((stop) => (
            <Marker
              key={`stop-${stop.num}`}
              position={stop.latLng}
              icon={makeNumberedIcon(
                stop.num,
                DAY_COLORS[(stop.dayNumber - 1) % DAY_COLORS.length].replace('#', '') === '6366f1'
                  ? 'indigo'
                  : 'blue'
              )}
            >
              <Popup maxWidth={260}>
                <div className="map-popup">
                  <p className="map-popup__badge">Day {stop.dayNumber} · Stop {stop.num}</p>
                  <p className="map-popup__title">{stop.title}</p>
                  {stop.startTime && <p className="map-popup__sub">⏰ {stop.startTime}</p>}
                  {stop.duration   && <p className="map-popup__sub">⏱️ {stop.duration} min visit</p>}
                  {stop.transport  && stop.transport !== 'none' && (
                    <p className="map-popup__sub">🚗 by {stop.transport}</p>
                  )}
                  {stop.a11yScore > 0 && (
                    <p className="map-popup__score">♿ Accessibility: {stop.a11yScore}/10</p>
                  )}
                  <span
                    className={`map-popup__difficulty map-popup__difficulty--${stop.difficulty}`}
                  >
                    🚶 {stop.difficulty} walking
                  </span>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -44]} opacity={0.95}>
                {stop.title}
              </Tooltip>
            </Marker>
          ))}

          {/* Standalone attraction markers (not in itinerary) */}
          {standaloneAttrs.map((attr) => {
            const cfg  = CATEGORY_ICONS[attr.category] || CATEGORY_ICONS.other
            const latlng = [attr.location.coordinates[1], attr.location.coordinates[0]]
            return (
              <Marker
                key={attr._id}
                position={latlng}
                icon={makeIcon(cfg.emoji, cfg.color, attr.name)}
                opacity={0.65}
              >
                <Popup maxWidth={240}>
                  <div className="map-popup">
                    <p className="map-popup__title">{attr.name}</p>
                    <p className="map-popup__sub">{attr.category}</p>
                    {attr.accessibility?.accessibilityScore > 0 && (
                      <p className="map-popup__score">
                        ♿ {attr.accessibility.accessibilityScore}/10
                      </p>
                    )}
                    <span className={`map-popup__difficulty map-popup__difficulty--${attr.accessibility?.walkingDifficulty || 'moderate'}`}>
                      🚶 {attr.accessibility?.walkingDifficulty || 'moderate'} walking
                    </span>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {/* Day legend */}
      {Object.keys(routeByDay).length > 0 && (
        <div className="trip-map__legend" role="list" aria-label="Day legend">
          {Object.keys(routeByDay).map((day) => (
            <div key={day} className="trip-map__legend-item" role="listitem">
              <span
                className="trip-map__legend-dot"
                style={{ background: DAY_COLORS[(parseInt(day) - 1) % DAY_COLORS.length] }}
                aria-hidden="true"
              />
              <span>Day {day}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Simple destination/attraction map (no itinerary, no route) ───────────────
export function DestinationMap({ destination, attractions = [], height = '360px' }) {
  const destCoords = destination?.location?.coordinates?.length === 2 &&
    (destination.location.coordinates[0] !== 0 || destination.location.coordinates[1] !== 0)
      ? [destination.location.coordinates[1], destination.location.coordinates[0]]
      : [20.5937, 78.9629] // India centre

  const validAttrs = attractions.filter(
    (a) => a.location?.coordinates?.[0] !== 0 || a.location?.coordinates?.[1] !== 0
  )

  const allPositions = [
    destCoords,
    ...validAttrs.map((a) => [a.location.coordinates[1], a.location.coordinates[0]]),
  ]

  return (
    <div className="trip-map__container" style={{ height }}>
      <MapContainer center={destCoords} zoom={12} style={{ width: '100%', height: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={allPositions} />

        {/* Destination */}
        <Marker position={destCoords} icon={makeIcon('🏙️', 'primary', destination?.name)}>
          <Popup>
            <div className="map-popup">
              <p className="map-popup__title">🏙️ {destination?.name}</p>
              <p className="map-popup__sub">{destination?.state}</p>
            </div>
          </Popup>
        </Marker>

        {/* Attractions */}
        {validAttrs.map((attr) => {
          const cfg    = CATEGORY_ICONS[attr.category] || CATEGORY_ICONS.other
          const latlng = [attr.location.coordinates[1], attr.location.coordinates[0]]
          return (
            <Marker key={attr._id} position={latlng} icon={makeIcon(cfg.emoji, cfg.color, attr.name)}>
              <Popup maxWidth={220}>
                <div className="map-popup">
                  <p className="map-popup__title">{attr.name}</p>
                  <p className="map-popup__sub">{attr.category}</p>
                  {attr.accessibility?.accessibilityScore > 0 && (
                    <p className="map-popup__score">♿ {attr.accessibility.accessibilityScore}/10</p>
                  )}
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>{attr.name}</Tooltip>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default TripMap
