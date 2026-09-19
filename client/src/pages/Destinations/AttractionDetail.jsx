import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getAttraction } from '../../services/destinationService'
import { getAttractionScores } from '../../services/scoringService'
import Loading from '../../components/Loading/Loading'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import { AttractionScoreCard } from '../../components/AccessibilityScoreCard/AccessibilityScoreCard'
import { ScorePill, AccessibilityFeatures } from '../../components/AccessibilityBadge/AccessibilityBadge'
import ReviewSection from '../../components/Reviews/ReviewSection'
import './AttractionDetail.css'

const CATEGORY_ICON = {
  heritage: '🏛️', nature: '🌿', religious: '🕌', museum: '🖼️',
  park: '🌳', beach: '🏖️', shopping: '🛍️', food: '🍽️', entertainment: '🎭', other: '📍',
}

function AttractionDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [attraction, setAttraction] = useState(null)
  const [scoreData,  setScoreData]  = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  useEffect(() => {
    getAttraction(id)
      .then((res) => setAttraction(res.data))
      .catch(() => setError('Attraction not found.'))
      .finally(() => setLoading(false))
  }, [id])

  // Fetch live scores once the attraction is loaded
  useEffect(() => {
    if (!attraction) return
    getAttractionScores(id)
      .then((res) => setScoreData(res.data))
      .catch(() => {}) // non-fatal
  }, [attraction, id])

  if (loading) return <Loading message="Loading attraction..." fullPage />
  if (error)   return (
    <main className="container" style={{ paddingTop: '4rem' }}>
      <ErrorMessage message={error} />
      <button onClick={() => navigate(-1)} className="attr-detail__back-btn">← Go Back</button>
    </main>
  )
  if (!attraction) return null

  const a   = attraction.accessibility || {}
  const dest = attraction.destination

  return (
    <main className="attr-detail">
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="attr-detail__breadcrumb">
          <Link to="/destinations">Destinations</Link>
          <span aria-hidden="true"> / </span>
          {dest && <Link to={`/destinations/${dest._id || dest}`}>{dest.name || 'Destination'}</Link>}
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{attraction.name}</span>
        </nav>

        <div className="attr-detail__layout animate-fade-in">
          {/* Main */}
          <section className="attr-detail__main" aria-labelledby="attr-name">
            <div className="attr-detail__hero-row">
              <span className="attr-detail__emoji" aria-hidden="true">
                {CATEGORY_ICON[attraction.category] || '📍'}
              </span>
              <div>
                <span className="attr-detail__category">{attraction.category}</span>
                <h1 id="attr-name" className="attr-detail__name">{attraction.name}</h1>
                {dest && (
                  <p className="attr-detail__location">
                    📍 {dest.name || ''}{dest.state ? `, ${dest.state}` : ''}
                  </p>
                )}
                {attraction.address && (
                  <p className="attr-detail__address">🏠 {attraction.address}</p>
                )}
              </div>
            </div>

            {attraction.description && (
              <p className="attr-detail__desc">{attraction.description}</p>
            )}

            {/* Quick info */}
            <div className="attr-detail__quick-info">
              {attraction.openingHours && (
                <div className="attr-detail__info-item">
                  <span className="attr-detail__info-icon" aria-hidden="true">⏰</span>
                  <div>
                    <p className="attr-detail__info-label">Opening Hours</p>
                    <p className="attr-detail__info-value">{attraction.openingHours}</p>
                  </div>
                </div>
              )}
              <div className="attr-detail__info-item">
                <span className="attr-detail__info-icon" aria-hidden="true">💰</span>
                <div>
                  <p className="attr-detail__info-label">Entry Fee</p>
                  <p className="attr-detail__info-value">
                    {attraction.entryFee === 0 ? 'Free' : `₹${attraction.entryFee}`}
                  </p>
                </div>
              </div>
              {attraction.averageVisitDurationMinutes && (
                <div className="attr-detail__info-item">
                  <span className="attr-detail__info-icon" aria-hidden="true">⏱️</span>
                  <div>
                    <p className="attr-detail__info-label">Visit Duration</p>
                    <p className="attr-detail__info-value">{attraction.averageVisitDurationMinutes} min</p>
                  </div>
                </div>
              )}
              {attraction.bestTimeToVisit && (
                <div className="attr-detail__info-item">
                  <span className="attr-detail__info-icon" aria-hidden="true">🗓️</span>
                  <div>
                    <p className="attr-detail__info-label">Best Time</p>
                    <p className="attr-detail__info-value">{attraction.bestTimeToVisit}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Sidebar: Full Accessibility Score Card */}
          <aside className="attr-detail__sidebar" aria-labelledby="a11y-heading">
            {/* Full score card using live API data */}
            <AttractionScoreCard
              accessibility={
                // Merge live API scores into the DB accessibility object
                scoreData
                  ? {
                      ...a,
                      accessibilityScore: scoreData.scores?.overallScore ?? a.accessibilityScore,
                    }
                  : a
              }
            />

            {/* Tags */}
            {attraction.tags?.length > 0 && (
              <div className="attr-detail__tags">
                <h3 className="attr-detail__tags-title">Tags</h3>
                <div className="attr-detail__tags-list">
                  {attraction.tags.map((t) => (
                    <span key={t} className="attr-detail__tag">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Back button */}
            <button
              className="attr-detail__back-btn"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              ← Back
            </button>
          </aside>
        </div>

        {/* Phase 10: Reviews & Accessibility Verification */}
        <ReviewSection
          entityType="attraction"
          entityId={attraction._id}
          entityName={attraction.name}
        />
      </div>
    </main>
  )
}

export default AttractionDetail
