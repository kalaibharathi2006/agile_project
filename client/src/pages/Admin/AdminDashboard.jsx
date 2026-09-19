import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getAdminDestinations,
  createDestination,
  deleteDestination,
  getAdminAttractions,
  createAttraction,
  deleteAttraction,
  getAdminHotels,
  createHotel,
  deleteHotel,
  getAdminReviews,
  verifyReviewAdmin,
  deleteReviewAdmin,
  getAdminPartners,
  createPartner,
  updatePartner,
  deletePartner,
} from '../../services/adminService';
import AnalyticsView from './AnalyticsView';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <main className="ad-page">
      <div className="container">
        {/* Header */}
        <header className="ad-header">
          <div className="ad-header-text">
            <span className="ad-badge">Admin Control Center</span>
            <h1 className="ad-title">Platform Administration</h1>
            <p className="ad-subtitle">
              Manage users, accessibility verifications, travel inventory, partners, and analytics.
            </p>
          </div>
          <div className="ad-admin-card">
            <span className="ad-admin-avatar">{user?.name?.charAt(0) || 'A'}</span>
            <div>
              <span className="ad-admin-name">{user?.name}</span>
              <span className="ad-admin-role">Super Admin</span>
            </div>
          </div>
        </header>

        {toast && (
          <div className={`ad-toast ad-toast--${toast.type}`} role="status">
            {toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="ad-tabs" role="tablist" aria-label="Admin Sections">
          {[
            { id: 'analytics', label: '📊 Analytics & Reports' },
            { id: 'users', label: '👥 Users' },
            { id: 'destinations', label: '🏛️ Destinations' },
            { id: 'attractions', label: '✨ Attractions' },
            { id: 'hotels', label: '🏨 Hotels' },
            { id: 'reviews', label: '🛡️ Reviews & A11y Verification' },
            { id: 'partners', label: '🤝 Partners' },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`ad-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Panels */}
        <div className="ad-tab-content">
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'users' && <UsersTab showToast={showToast} />}
          {activeTab === 'destinations' && <DestinationsTab showToast={showToast} />}
          {activeTab === 'attractions' && <AttractionsTab showToast={showToast} />}
          {activeTab === 'hotels' && <HotelsTab showToast={showToast} />}
          {activeTab === 'reviews' && <ReviewsTab showToast={showToast} />}
          {activeTab === 'partners' && <PartnersTab showToast={showToast} />}
        </div>
      </div>
    </main>
  );
}

/* ==========================================
   USERS TAB
   ========================================== */
function UsersTab({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({ search, role: roleFilter });
      setUsers(res.data || []);
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleToggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change ${u.name}'s role to ${newRole}?`)) return;
    try {
      await updateUserRole(u._id, newRole);
      showToast(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleToggleStatus = async (u) => {
    try {
      await toggleUserStatus(u._id);
      showToast(`User ${u.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle status', 'error');
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${u.name}?`)) return;
    try {
      await deleteUser(u._id);
      showToast('User deleted');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <div>
          <h2 className="ad-panel-title">Users Management</h2>
          <p className="ad-panel-sub">Manage platform traveler accounts and administrator roles</p>
        </div>
        <div className="ad-search-bar">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ad-input"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="ad-select"
          >
            <option value="all">All Roles</option>
            <option value="user">Travelers (Users)</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="ad-loading">Loading users…</div>
      ) : users.length === 0 ? (
        <div className="ad-empty">No users found matching query.</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="ad-user-row">
                      <span className="ad-user-circle">{u.name?.charAt(0) || 'U'}</span>
                      <strong className="ad-user-name">{u.name}</strong>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`ad-tag ${u.role === 'admin' ? 'ad-tag-admin' : 'ad-tag-user'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`ad-tag ${u.isActive ? 'ad-tag-active' : 'ad-tag-inactive'}`}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="ad-btn-group">
                      <button
                        type="button"
                        className="ad-btn-action"
                        onClick={() => handleToggleRole(u)}
                        title="Change role"
                      >
                        {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                      <button
                        type="button"
                        className="ad-btn-action"
                        onClick={() => handleToggleStatus(u)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="ad-btn-action ad-btn-danger"
                        onClick={() => handleDelete(u)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   DESTINATIONS TAB
   ========================================== */
function DestinationsTab({ showToast }) {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDest, setNewDest] = useState({
    name: '',
    state: '',
    description: '',
    climate: 'Tropical',
    accessibilityRating: 4.0,
    wheelchairFriendly: true,
  });

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const res = await getAdminDestinations();
      setDestinations(res.data || []);
    } catch {
      showToast('Failed to load destinations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createDestination(newDest);
      showToast('Destination created successfully');
      setShowAddModal(false);
      setNewDest({ name: '', state: '', description: '', climate: 'Tropical', accessibilityRating: 4.0, wheelchairFriendly: true });
      fetchDestinations();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create destination', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete destination "${name}"?`)) return;
    try {
      await deleteDestination(id);
      showToast('Destination deleted');
      fetchDestinations();
    } catch {
      showToast('Failed to delete destination', 'error');
    }
  };

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <div>
          <h2 className="ad-panel-title">Destinations Management</h2>
          <p className="ad-panel-sub">Manage cities, regions, and accessibility scores</p>
        </div>
        <button className="ad-btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Destination
        </button>
      </div>

      {loading ? (
        <div className="ad-loading">Loading destinations…</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Destination</th>
                <th>State</th>
                <th>A11y Rating</th>
                <th>Wheelchair</th>
                <th>Attractions</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {destinations.map((d) => (
                <tr key={d._id}>
                  <td className="fw-600">{d.name}</td>
                  <td>{d.state}</td>
                  <td>★ {d.accessibilityRating || '—'} / 5</td>
                  <td>{d.wheelchairFriendly ? '♿ Yes' : '⚠️ Limited'}</td>
                  <td>{d.totalAttractions || 0} places</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="ad-btn-action ad-btn-danger"
                      onClick={() => handleDelete(d._id, d.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="ad-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Destination</h3>
            <form onSubmit={handleCreate} className="ad-modal-form">
              <input
                className="ad-input"
                placeholder="Destination Name (e.g. Udaipur)"
                value={newDest.name}
                onChange={(e) => setNewDest({ ...newDest, name: e.target.value })}
                required
              />
              <input
                className="ad-input"
                placeholder="State (e.g. Rajasthan)"
                value={newDest.state}
                onChange={(e) => setNewDest({ ...newDest, state: e.target.value })}
                required
              />
              <textarea
                className="ad-input"
                placeholder="Description & Accessibility Overview"
                rows={3}
                value={newDest.description}
                onChange={(e) => setNewDest({ ...newDest, description: e.target.value })}
                required
              />
              <div className="ad-modal-actions">
                <button type="button" className="ad-btn-action" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ad-btn-primary">
                  Create Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   ATTRACTIONS TAB
   ========================================== */
function AttractionsTab({ showToast }) {
  const [attractions, setAttractions] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAttr, setNewAttr] = useState({
    name: '',
    destination: '',
    category: 'heritage',
    entryFee: 0,
    averageVisitDurationMinutes: 60,
    wheelchairAccessible: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attrRes, destRes] = await Promise.all([
        getAdminAttractions(),
        getAdminDestinations(),
      ]);
      setAttractions(attrRes.data || []);
      setDestinations(destRes.data || []);
      if (destRes.data?.length > 0 && !newAttr.destination) {
        setNewAttr((prev) => ({ ...prev, destination: destRes.data[0]._id }));
      }
    } catch {
      showToast('Failed to load attractions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAttraction({
        name: newAttr.name,
        destination: newAttr.destination,
        category: newAttr.category,
        entryFee: Number(newAttr.entryFee),
        averageVisitDurationMinutes: Number(newAttr.averageVisitDurationMinutes),
        accessibility: {
          wheelchairAccessible: newAttr.wheelchairAccessible,
          accessibilityScore: 8,
        },
      });
      showToast('Attraction created');
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create attraction', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete attraction "${name}"?`)) return;
    try {
      await deleteAttraction(id);
      showToast('Attraction deleted');
      fetchData();
    } catch {
      showToast('Failed to delete attraction', 'error');
    }
  };

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <div>
          <h2 className="ad-panel-title">Attractions Management</h2>
          <p className="ad-panel-sub">Manage heritage sites, parks, and cultural points of interest</p>
        </div>
        <button className="ad-btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Attraction
        </button>
      </div>

      {loading ? (
        <div className="ad-loading">Loading attractions…</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Attraction</th>
                <th>Destination</th>
                <th>Category</th>
                <th>Entry Fee</th>
                <th>Duration</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attractions.map((a) => (
                <tr key={a._id}>
                  <td className="fw-600">{a.name}</td>
                  <td>{a.destination?.name || '—'}</td>
                  <td className="text-capitalize">{a.category}</td>
                  <td>{a.entryFee === 0 ? 'Free' : `₹${a.entryFee}`}</td>
                  <td>{a.averageVisitDurationMinutes || 60} mins</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="ad-btn-action ad-btn-danger"
                      onClick={() => handleDelete(a._id, a.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="ad-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Attraction</h3>
            <form onSubmit={handleCreate} className="ad-modal-form">
              <input
                className="ad-input"
                placeholder="Attraction Name"
                value={newAttr.name}
                onChange={(e) => setNewAttr({ ...newAttr, name: e.target.value })}
                required
              />
              <select
                className="ad-select"
                value={newAttr.destination}
                onChange={(e) => setNewAttr({ ...newAttr, destination: e.target.value })}
                required
              >
                {destinations.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.state})
                  </option>
                ))}
              </select>
              <select
                className="ad-select"
                value={newAttr.category}
                onChange={(e) => setNewAttr({ ...newAttr, category: e.target.value })}
              >
                <option value="heritage">Heritage</option>
                <option value="nature">Nature</option>
                <option value="religious">Religious</option>
                <option value="museum">Museum</option>
                <option value="beach">Beach</option>
                <option value="park">Park</option>
                <option value="food">Food</option>
              </select>
              <div className="ad-modal-actions">
                <button type="button" className="ad-btn-action" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ad-btn-primary">
                  Save Attraction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   HOTELS TAB
   ========================================== */
function HotelsTab({ showToast }) {
  const [hotels, setHotels] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHotel, setNewHotel] = useState({
    name: '',
    destination: '',
    starRating: 4,
    pricePerNight: 3500,
    priceCategory: 'moderate',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hRes, dRes] = await Promise.all([getAdminHotels(), getAdminDestinations()]);
      setHotels(hRes.data || []);
      setDestinations(dRes.data || []);
      if (dRes.data?.length > 0 && !newHotel.destination) {
        setNewHotel((prev) => ({ ...prev, destination: dRes.data[0]._id }));
      }
    } catch {
      showToast('Failed to load hotels', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createHotel({
        name: newHotel.name,
        destination: newHotel.destination,
        starRating: Number(newHotel.starRating),
        pricePerNight: Number(newHotel.pricePerNight),
        priceCategory: newHotel.priceCategory,
        accessibility: {
          wheelchairAccessible: true,
          elevatorAvailable: true,
          accessibleRooms: true,
          accessibilityScore: 8,
        },
      });
      showToast('Hotel created successfully');
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create hotel', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete hotel "${name}"?`)) return;
    try {
      await deleteHotel(id);
      showToast('Hotel deleted');
      fetchData();
    } catch {
      showToast('Failed to delete hotel', 'error');
    }
  };

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <div>
          <h2 className="ad-panel-title">Hotels Management</h2>
          <p className="ad-panel-sub">Manage partner accommodations and accessible rooms</p>
        </div>
        <button className="ad-btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Hotel
        </button>
      </div>

      {loading ? (
        <div className="ad-loading">Loading hotels…</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Hotel Name</th>
                <th>Destination</th>
                <th>Stars</th>
                <th>Category</th>
                <th>Price / Night</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((h) => (
                <tr key={h._id}>
                  <td className="fw-600">{h.name}</td>
                  <td>{h.destination?.name || '—'}</td>
                  <td>{'⭐'.repeat(h.starRating || 3)}</td>
                  <td className="text-capitalize">{h.priceCategory}</td>
                  <td>₹{(h.pricePerNight || 0).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="ad-btn-action ad-btn-danger"
                      onClick={() => handleDelete(h._id, h.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="ad-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Accessible Hotel</h3>
            <form onSubmit={handleCreate} className="ad-modal-form">
              <input
                className="ad-input"
                placeholder="Hotel Name"
                value={newHotel.name}
                onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                required
              />
              <select
                className="ad-select"
                value={newHotel.destination}
                onChange={(e) => setNewHotel({ ...newHotel, destination: e.target.value })}
                required
              >
                {destinations.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.state})
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="ad-input"
                placeholder="Price Per Night (₹)"
                value={newHotel.pricePerNight}
                onChange={(e) => setNewHotel({ ...newHotel, pricePerNight: e.target.value })}
                required
              />
              <div className="ad-modal-actions">
                <button type="button" className="ad-btn-action" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ad-btn-primary">
                  Save Hotel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   REVIEWS & ACCESSIBILITY VERIFICATION TAB
   ========================================== */
function ReviewsTab({ showToast }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await getAdminReviews({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setReviews(res.data || []);
    } catch {
      showToast('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const handleVerify = async (r) => {
    const nextStatus = !r.isVerified;
    try {
      await verifyReviewAdmin(r._id, nextStatus);
      showToast(
        nextStatus
          ? 'Review verified as Accessible Experience!'
          : 'Review verification revoked.'
      );
      fetchReviews();
    } catch {
      showToast('Failed to update verification status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently remove this review?')) return;
    try {
      await deleteReviewAdmin(id);
      showToast('Review removed');
      fetchReviews();
    } catch {
      showToast('Failed to delete review', 'error');
    }
  };

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <div>
          <h2 className="ad-panel-title">Reviews & Accessibility Verification Queue</h2>
          <p className="ad-panel-sub">
            Review community feedback and grant the "Verified Accessible Experience" trust badge
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ad-select"
        >
          <option value="all">All Reviews</option>
          <option value="unverified">Pending Verification</option>
          <option value="verified">Verified Accessible Only</option>
        </select>
      </div>

      {loading ? (
        <div className="ad-loading">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="ad-empty">No reviews in this queue.</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Reviewer</th>
                <th>Entity Type</th>
                <th>Overall</th>
                <th>A11y Rating</th>
                <th>Feedback & Notes</th>
                <th>Verification</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td>
                    <strong>{r.user?.name || 'Anonymous'}</strong>
                    <span className="text-muted d-block text-sm">{r.user?.email}</span>
                  </td>
                  <td>
                    <span className="ad-tag ad-tag-user text-capitalize">{r.entityType}</span>
                  </td>
                  <td>★ {r.rating}/5</td>
                  <td>
                    <span className="av-pill-a11y">♿ {r.accessibilityRating || '—'}/5</span>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <p className="fw-600 mb-1">{r.title || 'Review'}</p>
                    <p className="text-sm text-muted line-clamp-2">{r.comment}</p>
                    {r.accessibilityComment && (
                      <div className="ad-a11y-snippet">♿ {r.accessibilityComment}</div>
                    )}
                  </td>
                  <td>
                    {r.isVerified ? (
                      <span className="ad-badge-verified">🛡️ Verified</span>
                    ) : (
                      <span className="ad-badge-pending">⏳ Pending</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="ad-btn-group">
                      <button
                        className={`ad-btn-action ${r.isVerified ? '' : 'ad-btn-verify'}`}
                        onClick={() => handleVerify(r)}
                      >
                        {r.isVerified ? 'Revoke Badge' : '✓ Verify A11y'}
                      </button>
                      <button
                        className="ad-btn-action ad-btn-danger"
                        onClick={() => handleDelete(r._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   PARTNERS TAB
   ========================================== */
function PartnersTab({ showToast }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: '',
    category: 'transport',
    city: '',
    state: '',
    phone: '',
    email: '',
    discountPercentage: 10,
    isVerified: true,
  });

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await getAdminPartners();
      setPartners(res.data || []);
    } catch {
      showToast('Failed to load partners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createPartner({
        ...newPartner,
        discountPercentage: Number(newPartner.discountPercentage),
      });
      showToast('Partner added to directory');
      setShowAddModal(false);
      setNewPartner({
        name: '',
        category: 'transport',
        city: '',
        state: '',
        phone: '',
        email: '',
        discountPercentage: 10,
        isVerified: true,
      });
      fetchPartners();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add partner', 'error');
    }
  };

  const handleToggleVerified = async (p) => {
    try {
      await updatePartner(p._id, { isVerified: !p.isVerified });
      showToast(`Partner verification status updated`);
      fetchPartners();
    } catch {
      showToast('Failed to update partner', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove partner "${name}"?`)) return;
    try {
      await deletePartner(id);
      showToast('Partner removed');
      fetchPartners();
    } catch {
      showToast('Failed to delete partner', 'error');
    }
  };

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <div>
          <h2 className="ad-panel-title">Partner Directory & Management</h2>
          <p className="ad-panel-sub">
            Accessible transport providers, equipment rental services, certified guides, and hotels
          </p>
        </div>
        <button className="ad-btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Partner
        </button>
      </div>

      {loading ? (
        <div className="ad-loading">Loading partners…</div>
      ) : partners.length === 0 ? (
        <div className="ad-empty">No partners registered yet.</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Category</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Special Discount</th>
                <th>Verified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong className="fw-600">{p.name}</strong>
                    <span className="text-muted d-block text-sm">{p.description}</span>
                  </td>
                  <td className="text-capitalize">
                    <span className="ad-tag ad-tag-user">{p.category}</span>
                  </td>
                  <td>{p.city ? `${p.city}, ${p.state}` : p.state || 'India'}</td>
                  <td>
                    <span className="d-block">{p.phone}</span>
                    <span className="text-muted text-sm">{p.email}</span>
                  </td>
                  <td>
                    {p.discountPercentage > 0 ? (
                      <span className="av-pill-green">{p.discountPercentage}% OFF</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`ad-btn-status-toggle ${p.isVerified ? 'verified' : 'unverified'}`}
                      onClick={() => handleToggleVerified(p)}
                    >
                      {p.isVerified ? '🛡️ Verified' : '⚪ Unverified'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="ad-btn-action ad-btn-danger"
                      onClick={() => handleDelete(p._id, p.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="ad-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Accessible Travel Partner</h3>
            <form onSubmit={handleCreate} className="ad-modal-form">
              <input
                className="ad-input"
                placeholder="Partner Name (e.g. Royal Mobility Vans)"
                value={newPartner.name}
                onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                required
              />
              <select
                className="ad-select"
                value={newPartner.category}
                onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value })}
              >
                <option value="transport">Accessible Transport</option>
                <option value="equipment">Mobility Equipment Rental</option>
                <option value="guide">Certified Inclusive Guide</option>
                <option value="hotel">Accessible Hotel Partner</option>
                <option value="attraction">Attraction Operator</option>
                <option value="other">Other Accessibility Service</option>
              </select>
              <div className="ad-form-grid-2">
                <input
                  className="ad-input"
                  placeholder="City (e.g. Chennai)"
                  value={newPartner.city}
                  onChange={(e) => setNewPartner({ ...newPartner, city: e.target.value })}
                />
                <input
                  className="ad-input"
                  placeholder="State (e.g. Tamil Nadu)"
                  value={newPartner.state}
                  onChange={(e) => setNewPartner({ ...newPartner, state: e.target.value })}
                />
              </div>
              <div className="ad-form-grid-2">
                <input
                  className="ad-input"
                  placeholder="Phone"
                  value={newPartner.phone}
                  onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                />
                <input
                  className="ad-input"
                  placeholder="Email"
                  value={newPartner.email}
                  onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                />
              </div>
              <input
                type="number"
                className="ad-input"
                placeholder="Discount Percentage (e.g. 15)"
                value={newPartner.discountPercentage}
                onChange={(e) => setNewPartner({ ...newPartner, discountPercentage: e.target.value })}
              />
              <div className="ad-modal-actions">
                <button type="button" className="ad-btn-action" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ad-btn-primary">
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
