import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getReviews,
  createReview,
  voteHelpful,
  verifyReview,
  deleteReview,
} from '../../services/reviewService';
import ReviewModal from './ReviewModal';
import './ReviewSection.css';

export default function ReviewSection({ entityType, entityId, entityName }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Sorting
  const [selectedRating, setSelectedRating] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [wheelchairOnly, setWheelchairOnly] = useState(false);
  const [sortOption, setSortOption] = useState('newest');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const isAdmin = user?.role === 'admin';

  const fetchReviewsData = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getReviews({
        entityType,
        entityId,
        rating: selectedRating || undefined,
        isVerified: verifiedOnly ? 'true' : undefined,
        wheelchairAccessible: wheelchairOnly ? 'true' : undefined,
        sort: sortOption,
      });
      setReviews(res.data || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      setError('Could not load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, selectedRating, verifiedOnly, wheelchairOnly, sortOption]);

  useEffect(() => {
    fetchReviewsData();
  }, [fetchReviewsData]);

  const handleWriteClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    setIsModalOpen(true);
  };

  const handleReviewSubmit = async (reviewData) => {
    await createReview(reviewData);
    setActionSuccess('Your review has been submitted successfully!');
    setTimeout(() => setActionSuccess(null), 4000);
    fetchReviewsData();
  };

  const handleHelpfulClick = async (reviewId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    try {
      const res = await voteHelpful(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? {
                ...r,
                helpfulCount: res.helpfulCount,
                hasVoted: res.hasVoted,
              }
            : r
        )
      );
    } catch (err) {
      console.error('Failed to vote helpful', err);
    }
  };

  const handleVerifyToggle = async (reviewId, currentStatus) => {
    try {
      const res = await verifyReview(reviewId, !currentStatus);
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? res.data : r))
      );
      setActionSuccess(
        !currentStatus
          ? 'Review verified as Accessible Experience!'
          : 'Verification status removed.'
      );
      setTimeout(() => setActionSuccess(null), 4000);
      fetchReviewsData();
    } catch (err) {
      alert('Failed to update verification status');
    }
  };

  const handleDeleteClick = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      setActionSuccess('Review deleted.');
      setTimeout(() => setActionSuccess(null), 3000);
      fetchReviewsData();
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  // Calculate percentage bar width safely
  const getBarWidth = (count, total) => {
    if (!total || total === 0) return '0%';
    return `${Math.round((count / total) * 100)}%`;
  };

  return (
    <section className="rs-container" aria-labelledby="reviews-heading">
      <div className="rs-header-row">
        <div>
          <h2 id="reviews-heading" className="rs-title">
            Accessibility Reviews & Verification
          </h2>
          <p className="rs-subtitle">
            Community-verified feedback for inclusive and accessible travel
          </p>
        </div>
        <button
          type="button"
          className="rs-btn-write"
          onClick={handleWriteClick}
        >
          ⭐ Write a Review
        </button>
      </div>

      {actionSuccess && (
        <div className="rs-alert-success" role="status">
          ✅ {actionSuccess}
        </div>
      )}

      {/* Summary Score Breakdown */}
      {summary && (
        <div className="rs-summary-card">
          <div className="rs-score-col">
            <div className="rs-score-big">
              {summary.avgRating > 0 ? summary.avgRating.toFixed(1) : '—'}
            </div>
            <div className="rs-stars-display" aria-label={`Average ${summary.avgRating} out of 5 stars`}>
              {'★'.repeat(Math.round(summary.avgRating || 0))}
              {'☆'.repeat(5 - Math.round(summary.avgRating || 0))}
            </div>
            <span className="rs-score-count">
              {summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          <div className="rs-bars-col">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.starsBreakdown?.[star] || 0;
              return (
                <div key={star} className="rs-bar-row">
                  <span className="rs-bar-star-label">{star} ★</span>
                  <div className="rs-bar-track">
                    <div
                      className="rs-bar-fill"
                      style={{ width: getBarWidth(count, summary.totalReviews) }}
                    />
                  </div>
                  <span className="rs-bar-count">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="rs-a11y-stats-col">
            <h3 className="rs-a11y-stats-title">Accessibility Highlights</h3>
            <div className="rs-highlight-item">
              <span className="rs-highlight-icon">♿</span>
              <div>
                <strong>
                  {summary.avgAccessibilityRating > 0
                    ? `${summary.avgAccessibilityRating.toFixed(1)} / 5`
                    : 'N/A'}
                </strong>
                <span className="rs-highlight-label">A11y Rating</span>
              </div>
            </div>
            <div className="rs-highlight-item">
              <span className="rs-highlight-icon">🟢</span>
              <div>
                <strong>{summary.wheelchairAccessiblePercent}%</strong>
                <span className="rs-highlight-label">Wheelchair Verified</span>
              </div>
            </div>
            <div className="rs-highlight-item">
              <span className="rs-highlight-icon">🤝</span>
              <div>
                <strong>
                  {summary.avgStaffHelpfulness > 0
                    ? `${summary.avgStaffHelpfulness.toFixed(1)} / 5`
                    : 'N/A'}
                </strong>
                <span className="rs-highlight-label">Staff Support</span>
              </div>
            </div>
            <div className="rs-highlight-item">
              <span className="rs-highlight-icon">🛡️</span>
              <div>
                <strong>{summary.verifiedReviewsCount}</strong>
                <span className="rs-highlight-label">Admin Verified</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Sort Toolbar */}
      <div className="rs-toolbar" role="toolbar" aria-label="Review Filters">
        <div className="rs-filter-chips">
          <button
            type="button"
            className={`rs-chip ${selectedRating === '' ? 'active' : ''}`}
            onClick={() => setSelectedRating('')}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              className={`rs-chip ${selectedRating === String(s) ? 'active' : ''}`}
              onClick={() => setSelectedRating(selectedRating === String(s) ? '' : String(s))}
            >
              {s} ★
            </button>
          ))}
        </div>

        <div className="rs-toggles-group">
          <label className="rs-checkbox-label">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
            />
            🛡️ Verified Only
          </label>
          <label className="rs-checkbox-label">
            <input
              type="checkbox"
              checked={wheelchairOnly}
              onChange={(e) => setWheelchairOnly(e.target.checked)}
            />
            ♿ Wheelchair Accessible
          </label>

          <select
            className="rs-sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            aria-label="Sort reviews"
          >
            <option value="newest">Most Recent</option>
            <option value="rating_high">Highest Rated</option>
            <option value="rating_low">Lowest Rated</option>
            <option value="helpful">Most Helpful</option>
            <option value="accessibility">Highest Accessibility</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="rs-loading">Loading community accessibility reviews...</div>
      ) : error ? (
        <div className="rs-error">{error}</div>
      ) : reviews.length === 0 ? (
        <div className="rs-empty">
          <span className="rs-empty-icon">📝</span>
          <h3>No reviews match your filter</h3>
          <p>Be the first to share accessibility insights for this place!</p>
          <button
            type="button"
            className="rs-btn-write rs-empty-btn"
            onClick={handleWriteClick}
          >
            Write the First Review
          </button>
        </div>
      ) : (
        <div className="rs-list">
          {reviews.map((rev) => {
            const isAuthor = user && rev.user?._id === user._id;
            const canDelete = isAuthor || isAdmin;
            const isReviewerVoted =
              rev.hasVoted ||
              (user && rev.helpfulUsers && rev.helpfulUsers.includes(user._id));

            return (
              <article key={rev._id} className="rs-card">
                <div className="rs-card-header">
                  <div className="rs-user-info">
                    <div className="rs-avatar">
                      {rev.user?.avatar ? (
                        <img src={rev.user.avatar} alt="" />
                      ) : (
                        <span>{rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : 'U'}</span>
                      )}
                    </div>
                    <div>
                      <div className="rs-user-name-row">
                        <span className="rs-user-name">
                          {rev.user?.name || 'Anonymous Traveler'}
                        </span>
                        {rev.user?.role === 'admin' && (
                          <span className="rs-badge-admin">Admin</span>
                        )}
                        {rev.isVerified && (
                          <span
                            className="rs-badge-verified"
                            title={
                              rev.verifiedBy?.name
                                ? `Verified by ${rev.verifiedBy.name}`
                                : 'Verified by Inclusive Travel Moderator'
                            }
                          >
                            🛡️ Verified Accessible Experience
                          </span>
                        )}
                      </div>
                      <span className="rs-review-date">
                        {new Date(rev.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="rs-badges-row">
                    <span className="rs-pill-rating">★ {rev.rating} / 5</span>
                    {rev.accessibilityRating && (
                      <span className="rs-pill-a11y">
                        ♿ A11y: {rev.accessibilityRating} / 5
                      </span>
                    )}
                    {rev.wheelchairAccessible !== undefined && (
                      <span
                        className={`rs-pill-tag ${
                          rev.wheelchairAccessible ? 'tag-wheelchair-yes' : 'tag-wheelchair-no'
                        }`}
                      >
                        {rev.wheelchairAccessible ? '♿ Wheelchair Yes' : '⚠️ Limited Access'}
                      </span>
                    )}
                  </div>
                </div>

                {rev.title && <h3 className="rs-card-title">{rev.title}</h3>}
                <p className="rs-card-comment">{rev.comment}</p>

                {rev.accessibilityComment && (
                  <div className="rs-a11y-callout">
                    <div className="rs-a11y-callout-header">
                      <span>♿ Accessibility Notes & Observations</span>
                      {rev.staffHelpfulness && (
                        <span className="rs-staff-score">
                          Staff Helpfulness: {rev.staffHelpfulness} / 5
                        </span>
                      )}
                    </div>
                    <p className="rs-a11y-callout-text">{rev.accessibilityComment}</p>
                  </div>
                )}

                <div className="rs-card-footer">
                  <button
                    type="button"
                    className={`rs-btn-helpful ${isReviewerVoted ? 'voted' : ''}`}
                    onClick={() => handleHelpfulClick(rev._id)}
                    aria-label={`Mark review as helpful. Currently ${rev.helpfulCount || 0} helpful votes`}
                  >
                    👍 Helpful ({rev.helpfulCount || 0})
                  </button>

                  <div className="rs-card-actions-right">
                    {isAdmin && (
                      <button
                        type="button"
                        className={`rs-btn-verify-action ${
                          rev.isVerified ? 'verified' : 'unverified'
                        }`}
                        onClick={() => handleVerifyToggle(rev._id, rev.isVerified)}
                      >
                        {rev.isVerified ? '✓ Verified (Click to Revoke)' : '🛡️ Verify Review'}
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        className="rs-btn-delete"
                        onClick={() => handleDeleteClick(rev._id)}
                        aria-label="Delete this review"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Review Modal Dialog */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleReviewSubmit}
        entityType={entityType}
        entityId={entityId}
        entityName={entityName}
      />
    </section>
  );
}
