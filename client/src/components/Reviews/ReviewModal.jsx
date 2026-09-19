import { useState } from 'react';
import './ReviewModal.css';

function StarRatingInput({ label, value, onChange, id, required = false }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="rm-field">
      <label className="rm-label" id={`${id}-label`}>
        {label} {required && <span className="rm-required">*</span>}
      </label>
      <div
        className="rm-star-group"
        role="radiogroup"
        aria-labelledby={`${id}-label`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = (hover || value) >= star;
          return (
            <button
              type="button"
              key={star}
              className={`rm-star-btn ${isFilled ? 'filled' : ''}`}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${star} of 5 stars`}
              role="radio"
              aria-checked={value === star}
            >
              ★
            </button>
          );
        })}
        <span className="rm-rating-text">
          {value > 0 ? `${value} / 5` : 'Select rating'}
        </span>
      </div>
    </div>
  );
}

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  entityType,
  entityId,
  entityName,
  initialData = null,
}) {
  const [rating, setRating] = useState(initialData?.rating || 5);
  const [accessibilityRating, setAccessibilityRating] = useState(
    initialData?.accessibilityRating || 5
  );
  const [staffHelpfulness, setStaffHelpfulness] = useState(
    initialData?.staffHelpfulness || 5
  );
  const [wheelchairAccessible, setWheelchairAccessible] = useState(
    initialData?.wheelchairAccessible ?? true
  );
  const [title, setTitle] = useState(initialData?.title || '');
  const [comment, setComment] = useState(initialData?.comment || '');
  const [accessibilityComment, setAccessibilityComment] = useState(
    initialData?.accessibilityComment || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Please provide an overall rating');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        entityType,
        entityId,
        rating,
        accessibilityRating,
        staffHelpfulness,
        wheelchairAccessible,
        title: title.trim(),
        comment: comment.trim(),
        accessibilityComment: accessibilityComment.trim(),
      });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to submit review'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rm-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rm-title"
    >
      <div
        className="rm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rm-header">
          <div>
            <h2 id="rm-title" className="rm-heading">
              Write a Review
            </h2>
            <p className="rm-subheading">
              Sharing your experience for{' '}
              <strong>{entityName || 'this destination'}</strong>
            </p>
          </div>
          <button
            type="button"
            className="rm-close-btn"
            onClick={onClose}
            aria-label="Close review dialog"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rm-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rm-form">
          <div className="rm-ratings-grid">
            <StarRatingInput
              id="overall-rating"
              label="Overall Experience"
              value={rating}
              onChange={setRating}
              required
            />
            <StarRatingInput
              id="a11y-rating"
              label="♿ Accessibility Rating"
              value={accessibilityRating}
              onChange={setAccessibilityRating}
            />
            <StarRatingInput
              id="staff-rating"
              label="🤝 Staff Helpfulness & Support"
              value={staffHelpfulness}
              onChange={setStaffHelpfulness}
            />
          </div>

          <div className="rm-field">
            <label className="rm-label">Wheelchair Accessible?</label>
            <div className="rm-segmented-control" role="group">
              <button
                type="button"
                className={`rm-segment ${wheelchairAccessible === true ? 'active' : ''}`}
                onClick={() => setWheelchairAccessible(true)}
              >
                ♿ Yes, fully accessible
              </button>
              <button
                type="button"
                className={`rm-segment ${wheelchairAccessible === false ? 'active' : ''}`}
                onClick={() => setWheelchairAccessible(false)}
              >
                ⚠️ Limited or Inaccessible
              </button>
            </div>
          </div>

          <div className="rm-field">
            <label htmlFor="rm-review-title" className="rm-label">
              Review Title
            </label>
            <input
              id="rm-review-title"
              type="text"
              className="rm-input"
              placeholder="e.g. Wonderful step-free pathways and helpful staff!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              required
            />
          </div>

          <div className="rm-field">
            <label htmlFor="rm-review-comment" className="rm-label">
              General Review
            </label>
            <textarea
              id="rm-review-comment"
              className="rm-textarea"
              rows={3}
              placeholder="Tell others about your visit, attractions enjoyed, atmosphere..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          <div className="rm-field a11y-box">
            <label htmlFor="rm-a11y-comment" className="rm-label">
              ♿ Accessibility Feedback & Specifics
            </label>
            <span className="rm-hint">
              Mention ramps, elevators, sensory quiet zones, braille/audio guides, accessible restrooms, etc.
            </span>
            <textarea
              id="rm-a11y-comment"
              className="rm-textarea"
              rows={3}
              placeholder="Details on physical terrain, door widths, restroom access, noise levels..."
              value={accessibilityComment}
              onChange={(e) => setAccessibilityComment(e.target.value)}
            />
          </div>

          <div className="rm-actions">
            <button
              type="button"
              className="rm-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rm-btn-submit"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Verified Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
