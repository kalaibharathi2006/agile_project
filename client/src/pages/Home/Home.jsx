import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/Button/Button'
import './Home.css'


function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <main className="home">
      {/* Hero Section */}
      <section className="home__hero" aria-labelledby="hero-heading">
        <div className="home__hero-content container">
          <div className="home__badge">
            <span>🇮🇳 Exploring India Accessibly</span>
          </div>

          <h1 id="hero-heading" className="home__title">
            Travel India with
            <span className="home__title-highlight"> Confidence</span>
          </h1>

          <p className="home__subtitle">
            Personalized trip planning for elderly travelers, families with young children,
            and people with mobility needs. Every journey, beautifully accessible.
          </p>

          <div className="home__cta">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="lg">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="primary" size="lg">Start Planning Free</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">Sign In</Button>
                </Link>
              </>
            )}
          </div>

          <div className="home__stats">
            <div className="home__stat">
              <span className="home__stat-number">8+</span>
              <span className="home__stat-label">Indian Destinations</span>
            </div>
            <div className="home__stat">
              <span className="home__stat-number">100%</span>
              <span className="home__stat-label">Accessibility Focused</span>
            </div>
            <div className="home__stat">
              <span className="home__stat-number">Free</span>
              <span className="home__stat-label">To Use</span>
            </div>
          </div>
        </div>

        <div className="home__hero-visual" aria-hidden="true">
          <div className="home__hero-card home__hero-card--1">
            <span className="home__hero-card-icon">♿</span>
            <span>Wheelchair Friendly</span>
          </div>
          <div className="home__hero-card home__hero-card--2">
            <span className="home__hero-card-icon">👴</span>
            <span>Elder Friendly</span>
          </div>
          <div className="home__hero-card home__hero-card--3">
            <span className="home__hero-card-icon">👨‍👩‍👧</span>
            <span>Family Trips</span>
          </div>
          <div className="home__globe">🌍</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home__features" aria-labelledby="features-heading">
        <div className="container">
          <h2 id="features-heading" className="home__section-title">
            Designed for Every Traveler
          </h2>
          <p className="home__section-sub">
            We believe travel should be possible for everyone, at every age, with every need.
          </p>

          <div className="home__features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="home__feature-card">
                <div className="home__feature-icon" aria-hidden="true">{f.icon}</div>
                <h3 className="home__feature-title">{f.title}</h3>
                <p className="home__feature-desc">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Teaser */}
      <section className="home__destinations" aria-labelledby="dest-heading">
        <div className="container">
          <h2 id="dest-heading" className="home__section-title">
            Popular Indian Destinations
          </h2>
          <div className="home__dest-grid">
            {DESTINATIONS.map((d) => (
              <div key={d.name} className="home__dest-card">
                <div className="home__dest-emoji" aria-hidden="true">{d.emoji}</div>
                <h3 className="home__dest-name">{d.name}</h3>
                <p className="home__dest-state">{d.state}</p>
                <div className="home__dest-score">
                  <span className="home__dest-score-bar" style={{ '--score': d.score + '%' }} />
                  <span className="home__dest-score-label">Accessibility {d.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="home__cta-banner" aria-labelledby="cta-heading">
        <div className="container">
          <h2 id="cta-heading" className="home__cta-title">
            Ready to plan your accessible journey?
          </h2>
          <p className="home__cta-text">
            Join thousands of travelers who plan smarter, safer trips with Inclusive Trip Designer.
          </p>
          {!isAuthenticated && (
            <Link to="/register">
              <Button variant="secondary" size="lg">Create Free Account</Button>
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}

const FEATURES = [
  {
    icon: '♿',
    title: 'Accessibility Scoring',
    description:
      'Every destination, attraction, and hotel is rated for wheelchair access, elevator availability, accessible restrooms, and more.',
  },
  {
    icon: '🗺️',
    title: 'Smart Itinerary',
    description:
      'AI-powered day-by-day trip planning that factors in walking distance, rest breaks, meal stops, and your mobility needs.',
  },
  {
    icon: '🏨',
    title: 'Accessible Hotels',
    description:
      'Find hotels with ground-floor rooms, wide doorways, grab rails, and other essential accessibility features.',
  },
  {
    icon: '🚌',
    title: 'Transport Planning',
    description:
      'Get transport recommendations suited to your requirements — accessible buses, taxis, and private vehicles.',
  },
  {
    icon: '⭐',
    title: 'Community Reviews',
    description:
      'Real accessibility feedback from travelers like you — verified and trustworthy accessibility information.',
  },
  {
    icon: '📱',
    title: 'Easy to Use',
    description:
      'Large text, high contrast, keyboard navigation — our UI is designed for everyone, including those new to technology.',
  },
]

const DESTINATIONS = [
  { emoji: '🏛️', name: 'Chennai',       state: 'Tamil Nadu',  score: 78 },
  { emoji: '🌿', name: 'Ooty',          state: 'Tamil Nadu',  score: 65 },
  { emoji: '🕌', name: 'Madurai',       state: 'Tamil Nadu',  score: 72 },
  { emoji: '🏯', name: 'Thanjavur',     state: 'Tamil Nadu',  score: 68 },
  { emoji: '🌆', name: 'Bengaluru',     state: 'Karnataka',   score: 82 },
  { emoji: '🌴', name: 'Kochi',         state: 'Kerala',      score: 75 },
]

export default Home
