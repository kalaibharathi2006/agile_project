import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getDestinations } from '../../services/destinationService'
import Loading from '../../components/Loading/Loading'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import { ScorePill } from '../../components/AccessibilityBadge/AccessibilityBadge'
import './Destinations.css'

/* ── Difficulty pill helper ── */
const STATES = ['All', 'Tamil Nadu', 'Karnataka', 'Kerala', 'Maharashtra', 'Rajasthan', 'Delhi']

const STAR_ICONS = { 0: '⭐', 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '⭐⭐⭐⭐', 5: '⭐⭐⭐⭐⭐' }

function DestinationCard({ dest }) {
  const score = dest.accessibilityRating ? Math.round(dest.accessibilityRating * 2) : 0 // convert 0-5 → 0-10
  return (
    <Link
      to={`/destinations/${dest._id}`}
      className="dest-card"
      aria-label={`${dest.name}, ${dest.state} — Accessibility rating ${dest.accessibilityRating} out of 5`}
    >
      <div className="dest-card__top">
        <div className="dest-card__emoji" aria-hidden="true">
          {getDestinationEmoji(dest.name)}
        </div>
        {dest.wheelchairFriendly && (
          <span className="dest-card__wc-badge" aria-label="Wheelchair friendly">♿</span>
        )}
      </div>

      <div className="dest-card__body">
        <h3 className="dest-card__name">{dest.name}</h3>
        <p className="dest-card__state">📍 {dest.state}, {dest.country || 'India'}</p>

        {dest.shortDescription && (
          <p className="dest-card__desc">{dest.shortDescription}</p>
        )}

        <div className="dest-card__meta">
          {dest.bestTimeToVisit && (
            <span className="dest-card__meta-item">🗓️ {dest.bestTimeToVisit}</span>
          )}
          {dest.totalAttractions > 0 && (
            <span className="dest-card__meta-item">🏛️ {dest.totalAttractions} attractions</span>
          )}
        </div>

        <div className="dest-card__footer">
          <ScorePill score={score} max={10} label="Accessibility" />
          {dest.publicTransportAccessible && (
            <span className="dest-card__transport" aria-label="Public transport accessible">🚌 Transport</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ message }) {
  return (
    <div className="destinations__empty" role="status">
      <span className="destinations__empty-icon" aria-hidden="true">🔍</span>
      <h3>No destinations found</h3>
      <p>{message || 'Try adjusting your search or filters.'}</p>
    </div>
  )
}

function Destinations() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [destinations, setDestinations] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [total, setTotal]               = useState(0)
  const [totalPages, setTotalPages]     = useState(1)

  // Filters
  const [search,          setSearch]          = useState(searchParams.get('search') || '')
  const [state,           setState]           = useState(searchParams.get('state') || '')
  const [wheelchairOnly,  setWheelchairOnly]  = useState(searchParams.get('wheelchair') === 'true')
  const [page,            setPage]            = useState(Number(searchParams.get('page')) || 1)

  const fetchDestinations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 9 }
      if (search.trim())  params.search           = search.trim()
      if (state)          params.state            = state
      if (wheelchairOnly) params.wheelchairFriendly = 'true'

      const res = await getDestinations(params)
      setDestinations(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch {
      setError('Failed to load destinations. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [search, state, wheelchairOnly, page])

  useEffect(() => { fetchDestinations() }, [fetchDestinations])

  // Sync filters to URL
  useEffect(() => {
    const params = {}
    if (search)         params.search    = search
    if (state)          params.state     = state
    if (wheelchairOnly) params.wheelchair = 'true'
    if (page > 1)       params.page      = page
    setSearchParams(params, { replace: true })
  }, [search, state, wheelchairOnly, page, setSearchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchDestinations()
  }

  const resetFilters = () => {
    setSearch('')
    setState('')
    setWheelchairOnly(false)
    setPage(1)
  }

  return (
    <main className="destinations-page">
      <div className="container">
        {/* Header */}
        <div className="destinations__header animate-fade-in">
          <div>
            <h1 className="destinations__title">Explore Destinations</h1>
            <p className="destinations__subtitle">
              {total > 0 ? `${total} accessible destinations across India` : 'Discover accessible travel destinations across India'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <section className="destinations__filters" aria-label="Search and filter destinations">
          <form className="destinations__search-row" onSubmit={handleSearch}>
            <div className="destinations__search-wrap">
              <span className="destinations__search-icon" aria-hidden="true">🔍</span>
              <input
                id="dest-search"
                type="search"
                className="destinations__search-input"
                placeholder="Search destinations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search destinations"
              />
            </div>
            <button type="submit" className="destinations__search-btn" aria-label="Search">
              Search
            </button>
          </form>

          <div className="destinations__filter-row">
            <label className="destinations__filter-label" htmlFor="state-filter">State:</label>
            <select
              id="state-filter"
              className="destinations__filter-select"
              value={state}
              onChange={(e) => { setState(e.target.value); setPage(1) }}
              aria-label="Filter by state"
            >
              {STATES.map((s) => (
                <option key={s} value={s === 'All' ? '' : s}>{s}</option>
              ))}
            </select>

            <label className="destinations__filter-checkbox" htmlFor="wheelchair-filter">
              <input
                id="wheelchair-filter"
                type="checkbox"
                checked={wheelchairOnly}
                onChange={(e) => { setWheelchairOnly(e.target.checked); setPage(1) }}
                aria-label="Show wheelchair friendly only"
              />
              <span>♿ Wheelchair friendly only</span>
            </label>

            {(search || state || wheelchairOnly) && (
              <button className="destinations__reset-btn" onClick={resetFilters} type="button">
                ✕ Clear filters
              </button>
            )}
          </div>
        </section>

        {/* Content */}
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

        {loading ? (
          <Loading message="Loading destinations..." />
        ) : destinations.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="destinations__grid" aria-label="Destinations list">
              {destinations.map((dest) => (
                <DestinationCard key={dest._id} dest={dest} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="destinations__pagination" aria-label="Pagination">
                <button
                  className="destinations__page-btn"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  ← Prev
                </button>
                <span className="destinations__page-info" aria-current="page">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="destinations__page-btn"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  )
}

/* helper: consistent emoji per city name */
function getDestinationEmoji(name) {
  const map = {
    chennai: '🌊', ooty: '🌿', madurai: '🕌', thanjavur: '🏯',
    coimbatore: '🏭', tiruchirappalli: '🏛️', bengaluru: '🌆',
    kochi: '🌴', mysuru: '🏰', jaipur: '🎪', goa: '🏖️',
  }
  return map[name?.toLowerCase()] || '🗺️'
}

export default Destinations
