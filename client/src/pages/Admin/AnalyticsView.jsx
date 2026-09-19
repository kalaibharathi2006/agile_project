import { useState, useEffect } from 'react';
import { getAnalyticsOverview, getAccessibilityReports } from '../../services/adminService';
import './AnalyticsView.css';

export default function AnalyticsView() {
  const [overview, setOverview] = useState(null);
  const [a11yReport, setA11yReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overRes, a11yRes] = await Promise.all([
        getAnalyticsOverview(),
        getAccessibilityReports(),
      ]);
      setOverview(overRes.data);
      setA11yReport(a11yRes.data);
    } catch (err) {
      setError('Failed to fetch analytics from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="av-loading">Loading real-time MongoDB analytics...</div>;
  }

  if (error) {
    return (
      <div className="av-error">
        <p>⚠️ {error}</p>
        <button onClick={fetchAnalytics} className="av-retry-btn">Retry</button>
      </div>
    );
  }

  const { users, trips, popularDestinations, popularAttractions } = overview || {};
  const { userPreferences, tripAccessibility, reviewsAccessibility } = a11yReport || {};

  return (
    <div className="av-container">
      {/* KPI Top Cards */}
      <div className="av-kpi-grid">
        <div className="av-kpi-card">
          <span className="av-kpi-icon">👥</span>
          <div>
            <span className="av-kpi-val">{users?.total ?? 0}</span>
            <span className="av-kpi-label">Total Users ({users?.active ?? 0} Active)</span>
          </div>
        </div>

        <div className="av-kpi-card">
          <span className="av-kpi-icon">🗺️</span>
          <div>
            <span className="av-kpi-val">{trips?.total ?? 0}</span>
            <span className="av-kpi-label">Total Trips Created</span>
          </div>
        </div>

        <div className="av-kpi-card">
          <span className="av-kpi-icon">♿</span>
          <div>
            <span className="av-kpi-val">
              {tripAccessibility?.avgAccessibilityScore ? `${tripAccessibility.avgAccessibilityScore}/10` : '—'}
            </span>
            <span className="av-kpi-label">Avg Trip Accessibility Score</span>
          </div>
        </div>

        <div className="av-kpi-card">
          <span className="av-kpi-icon">🛡️</span>
          <div>
            <span className="av-kpi-val">{reviewsAccessibility?.verifiedReviews ?? 0}</span>
            <span className="av-kpi-label">Verified A11y Reviews</span>
          </div>
        </div>
      </div>

      {/* Row 1: Trips Status & Activity */}
      <div className="av-row-2col">
        {/* Trips by Status */}
        <section className="av-card">
          <h3 className="av-card-title">📊 Trips by Status</h3>
          <p className="av-card-subtitle">Distribution across booking & execution lifecycles</p>
          <div className="av-status-bars">
            {Object.entries(trips?.byStatus || {}).map(([st, count]) => {
              const pct = trips.total > 0 ? Math.round((count / trips.total) * 100) : 0;
              return (
                <div key={st} className="av-status-item">
                  <div className="av-status-label-row">
                    <span className="av-status-badge text-capitalize">{st}</span>
                    <span className="av-status-numbers">{count} trips ({pct}%)</span>
                  </div>
                  <div className="av-bar-track">
                    <div className={`av-bar-fill fill-${st}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="av-card">
          <h3 className="av-card-title">🏛️ Most Popular Destinations</h3>
          <p className="av-card-subtitle">Highest traveler volume and accessibility ratings</p>
          {popularDestinations?.length === 0 ? (
            <p className="av-empty-note">No trips logged to destinations yet.</p>
          ) : (
            <div className="av-table-wrap">
              <table className="av-table">
                <thead>
                  <tr>
                    <th>Destination</th>
                    <th>State</th>
                    <th style={{ textAlign: 'right' }}>Trips</th>
                    <th style={{ textAlign: 'right' }}>Avg A11y</th>
                  </tr>
                </thead>
                <tbody>
                  {popularDestinations.map((d) => (
                    <tr key={d.destinationId}>
                      <td className="fw-600">{d.name}</td>
                      <td className="text-muted">{d.state || 'India'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="av-pill-blue">{d.tripCount}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="av-pill-green">★ {d.avgScore}/10</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Row 2: Popular Attractions & Review Analytics */}
      <div className="av-row-2col">
        {/* Popular Attractions */}
        <section className="av-card">
          <h3 className="av-card-title">✨ Top Reviewed Attractions</h3>
          <p className="av-card-subtitle">Places receiving highest engagement and accessibility insights</p>
          {popularAttractions?.length === 0 ? (
            <p className="av-empty-note">No attraction reviews recorded yet.</p>
          ) : (
            <div className="av-attraction-list">
              {popularAttractions.map((attr) => (
                <div key={attr.attractionId} className="av-attr-item">
                  <div>
                    <strong className="av-attr-name">{attr.name}</strong>
                    <span className="av-attr-cat">{attr.category}</span>
                  </div>
                  <div className="av-attr-scores">
                    <span className="av-pill-stars">★ {attr.avgRating}/5</span>
                    <span className="av-pill-a11y">♿ {attr.avgAccessibility}/5</span>
                    <span className="text-muted text-sm">({attr.reviewCount} rev)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Accessibility Review Feedback Metrics */}
        <section className="av-card">
          <h3 className="av-card-title">💬 Accessibility Review Feedback</h3>
          <p className="av-card-subtitle">Live aggregation of traveler-submitted observations</p>
          <div className="av-stats-metrics-grid">
            <div className="av-metric-tile">
              <span className="av-metric-num">{reviewsAccessibility?.totalReviews ?? 0}</span>
              <span className="av-metric-sub">Total Community Reviews</span>
            </div>
            <div className="av-metric-tile">
              <span className="av-metric-num text-success">
                {reviewsAccessibility?.verifiedReviews ?? 0}
              </span>
              <span className="av-metric-sub">Admin Verified Reviews</span>
            </div>
            <div className="av-metric-tile">
              <span className="av-metric-num text-primary">
                {reviewsAccessibility?.wheelchairAffirmed ?? 0}
              </span>
              <span className="av-metric-sub">Wheelchair Affirmed</span>
            </div>
            <div className="av-metric-tile">
              <span className="av-metric-num text-warning">
                {reviewsAccessibility?.avgStaffHelpfulness ?? 0} / 5
              </span>
              <span className="av-metric-sub">Staff Helpfulness Rating</span>
            </div>
          </div>
        </section>
      </div>

      {/* Row 3: Story 2 — Accessibility Usage Reports */}
      <section className="av-card av-full-width">
        <div className="av-card-header-flex">
          <div>
            <h3 className="av-card-title">♿ Accessibility Usage Reports</h3>
            <p className="av-card-subtitle">
              Live MongoDB breakdown of user preferences, mobility profiles, and special requirements
            </p>
          </div>
          <span className="av-badge-live">Live DB Aggregation</span>
        </div>

        <div className="av-a11y-report-grid">
          {/* Feature Demands */}
          <div className="av-report-box">
            <h4 className="av-box-title">Required Accessibility Features</h4>
            <div className="av-feature-bars">
              {[
                { label: 'Wheelchair Access', count: userPreferences?.featureUsage?.wheelchair || 0 },
                { label: 'Elevator / Lift', count: userPreferences?.featureUsage?.elevator || 0 },
                { label: 'Accessible Restroom', count: userPreferences?.featureUsage?.accessibleRestroom || 0 },
                { label: 'Seating & Frequent Rest', count: userPreferences?.featureUsage?.seatingRest || 0 },
                { label: 'Elderly Traveler Support', count: userPreferences?.featureUsage?.elderlySupport || 0 },
                { label: 'Traveling with Caregiver', count: userPreferences?.featureUsage?.caregiverSupport || 0 },
              ].map((f) => (
                <div key={f.label} className="av-feat-row">
                  <span className="av-feat-name">{f.label}</span>
                  <div className="av-feat-track">
                    <div
                      className="av-feat-fill"
                      style={{
                        width: `${userPreferences?.totalProfiles > 0
                          ? Math.round((f.count / userPreferences.totalProfiles) * 100)
                          : 0}%`,
                      }}
                    />
                  </div>
                  <span className="av-feat-count">{f.count} users</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobility Levels */}
          <div className="av-report-box">
            <h4 className="av-box-title">Mobility Profile Distribution</h4>
            <div className="av-dist-list">
              {[
                { label: 'Full Mobility', count: userPreferences?.mobilityDistribution?.full || 0, icon: '🚶' },
                { label: 'Limited Walking', count: userPreferences?.mobilityDistribution?.limited || 0, icon: '🦯' },
                { label: 'Wheelchair User', count: userPreferences?.mobilityDistribution?.wheelchair || 0, icon: '♿' },
                { label: 'Assisted Mobility', count: userPreferences?.mobilityDistribution?.assisted || 0, icon: '🤝' },
              ].map((m) => (
                <div key={m.label} className="av-dist-card">
                  <span className="av-dist-icon">{m.icon}</span>
                  <div>
                    <span className="av-dist-val">{m.count}</span>
                    <span className="av-dist-lbl">{m.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Travel Pace */}
          <div className="av-report-box">
            <h4 className="av-box-title">Travel Pace Preferences</h4>
            <div className="av-pace-group">
              {[
                { label: 'Slow & Gentle', count: userPreferences?.paceDistribution?.slow || 0, color: '#10b981' },
                { label: 'Moderate', count: userPreferences?.paceDistribution?.moderate || 0, color: '#3b82f6' },
                { label: 'Fast & Active', count: userPreferences?.paceDistribution?.fast || 0, color: '#f59e0b' },
              ].map((p) => (
                <div key={p.label} className="av-pace-item">
                  <div className="av-pace-header">
                    <span>{p.label}</span>
                    <strong>{p.count}</strong>
                  </div>
                  <div className="av-pace-track">
                    <div
                      className="av-pace-fill"
                      style={{
                        background: p.color,
                        width: `${userPreferences?.totalProfiles > 0
                          ? Math.round((p.count / userPreferences.totalProfiles) * 100)
                          : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
