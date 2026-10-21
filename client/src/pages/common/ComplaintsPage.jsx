import React, { useState, useEffect } from "react";
import { useAppSelector } from "../../hooks/useAppDispatch";
import {
  fetchComplaintsApi,
  createComplaintApi,
  updateComplaintStatusApi,
} from "../../services/api";
import {
  AlertTriangle,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Send,
  Building,
  User,
  MapPin,
  Calendar,
  Tag,
  Shield,
  X,
  FileText,
  ChevronDown,
} from "lucide-react";

const COMPLAINT_CATEGORIES = [
  "Electricity Issue",
  "Water Problem",
  "Washroom Problem",
  "Classroom Issue",
  "Furniture Damage",
  "Cleanliness",
  "Fan/AC Issue",
  "Light Issue",
  "Internet/Network Problem",
  "Laboratory Issue",
  "Library Issue",
  "Safety Concern",
  "Other General Problem",
];

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];

const ComplaintsPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isPrincipal = user?.role === "PRINCIPAL";

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    classOrDepartment: "",
    category: "Electricity Issue",
    subject: "",
    description: "",
    location: "",
    priority: "Medium",
    attachmentUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Status Update State (Principal)
  const [updateStatusVal, setUpdateStatusVal] = useState("Pending");
  const [updateRemarkVal, setUpdateRemarkVal] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (roleFilter && isPrincipal) params.role = roleFilter;

      const res = await fetchComplaintsApi(params);
      if (res.success) {
        setComplaints(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
      setError("Failed to load complaints. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [categoryFilter, statusFilter, priorityFilter, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadComplaints();
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await createComplaintApi(formData);
      if (res.success) {
        setSuccessMsg(`Complaint ${res.data?.complaintId || ""} submitted successfully!`);
        setShowCreateModal(false);
        setFormData({
          classOrDepartment: "",
          category: "Electricity Issue",
          subject: "",
          description: "",
          location: "",
          priority: "Medium",
          attachmentUrl: "",
        });
        loadComplaints();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdatingStatus(true);
    try {
      const res = await updateComplaintStatusApi(selectedComplaint._id, {
        status: updateStatusVal,
        remark: updateRemarkVal,
      });
      if (res.success) {
        setSuccessMsg(`Complaint ${selectedComplaint.complaintId} status updated to ${updateStatusVal}!`);
        setSelectedComplaint(res.data);
        loadComplaints();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update complaint status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openDetail = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateStatusVal(complaint.status);
    setUpdateRemarkVal(complaint.responseRemark || "");
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <span className="cmp-badge pending"><Clock size={12} /> Pending</span>;
      case "In Progress":
        return <span className="cmp-badge in-progress"><RefreshCw size={12} className="spin-slow" /> In Progress</span>;
      case "Resolved":
        return <span className="cmp-badge resolved"><CheckCircle size={12} /> Resolved</span>;
      case "Rejected":
        return <span className="cmp-badge rejected"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="cmp-badge">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Urgent":
        return <span className="cmp-priority urgent"><AlertTriangle size={12} /> Urgent</span>;
      case "High":
        return <span className="cmp-priority high">High</span>;
      case "Medium":
        return <span className="cmp-priority medium">Medium</span>;
      case "Low":
        return <span className="cmp-priority low">Low</span>;
      default:
        return <span className="cmp-priority">{priority}</span>;
    }
  };

  return (
    <div className="cmp-container">
      {/* Top Banner */}
      <div className="cmp-header">
        <div>
          <h1 className="cmp-title">Complaints &amp; Issue Reporting</h1>
          <p className="cmp-subtitle">
            {isPrincipal
              ? "Inspect, manage, filter, and resolve all school facility and administrative complaints."
              : "Report maintenance, facility, or administrative problems directly to school administration."}
          </p>
        </div>
        <div className="cmp-header-actions">
          <button
            className="cmp-btn primary"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusCircle size={18} />
            <span>New Complaint</span>
          </button>
          <button className="cmp-btn secondary" onClick={loadComplaints} title="Refresh">
            <RefreshCw size={16} className={loading ? "spin-slow" : ""} />
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="cmp-alert success">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="cmp-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="cmp-filter-card">
        <form onSubmit={handleSearchSubmit} className="cmp-search-box">
          <Search size={18} className="cmp-search-icon" />
          <input
            type="text"
            placeholder="Search by Complaint ID, Subject, Name, Location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="cmp-search-btn">Search</button>
        </form>

        <div className="cmp-filter-group">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="cmp-select"
          >
            <option value="">All Categories</option>
            {COMPLAINT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cmp-select"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="cmp-select"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((pr) => (
              <option key={pr} value={pr}>{pr}</option>
            ))}
          </select>

          {/* Role Filter (Principal only) */}
          {isPrincipal && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="cmp-select"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="CLASS_INCHARGE">Class Incharges</option>
              <option value="SUBJECT_TEACHER">Subject Teachers</option>
            </select>
          )}
        </div>
      </div>

      {/* Complaints Table / List */}
      <div className="cmp-table-card">
        {loading ? (
          <div className="cmp-loading-state">
            <div className="loader-spinner"></div>
            <p>Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="cmp-empty-state">
            <FileText size={48} className="cmp-empty-icon" />
            <h3>No Complaints Found</h3>
            <p>No complaints match your criteria or none have been submitted yet.</p>
            <button
              className="cmp-btn primary"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusCircle size={16} /> Submit First Complaint
            </button>
          </div>
        ) : (
          <div className="cmp-table-wrapper">
            <table className="cmp-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Subject &amp; Category</th>
                  <th>Complainant</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <span className="cmp-id-pill">{c.complaintId}</span>
                    </td>
                    <td>
                      <div className="cmp-subject-cell">
                        <strong className="cmp-subject">{c.subject}</strong>
                        <span className="cmp-category-tag">{c.category}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cmp-user-cell">
                        <span className="cmp-user-name">{c.complainantName}</span>
                        <span className="cmp-user-role">{c.complainantRole}</span>
                      </div>
                    </td>
                    <td>
                      <span className="cmp-loc"><MapPin size={13} /> {c.location}</span>
                    </td>
                    <td>{getPriorityBadge(c.priority)}</td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td>
                      <span className="cmp-date">
                        {new Date(c.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td>
                      <button
                        className="cmp-action-btn"
                        onClick={() => openDetail(c)}
                        title="View Details"
                      >
                        <Eye size={16} /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE COMPLAINT MODAL ── */}
      {showCreateModal && (
        <div className="cmp-modal-overlay">
          <div className="cmp-modal">
            <div className="cmp-modal-header">
              <h3>Submit New Complaint</h3>
              <button
                className="cmp-close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateComplaint} className="cmp-modal-body">
              <div className="cmp-form-grid">
                <div className="cmp-form-group">
                  <label>Complainant Name</label>
                  <input
                    type="text"
                    value={user?.name || ""}
                    disabled
                    className="cmp-input disabled"
                  />
                </div>
                <div className="cmp-form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={user?.role || ""}
                    disabled
                    className="cmp-input disabled"
                  />
                </div>
                <div className="cmp-form-group">
                  <label>Class / Department</label>
                  <input
                    type="text"
                    placeholder="e.g. 10th-A / Science Dept"
                    value={formData.classOrDepartment}
                    onChange={(e) =>
                      setFormData({ ...formData, classOrDepartment: e.target.value })
                    }
                    className="cmp-input"
                  />
                </div>
                <div className="cmp-form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="cmp-input"
                    required
                  >
                    {COMPLAINT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="cmp-form-group full-width">
                  <label>Subject / Short Title *</label>
                  <input
                    type="text"
                    placeholder="Brief summary of the problem"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="cmp-input"
                    required
                  />
                </div>
                <div className="cmp-form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204, 2nd Floor, Main Block"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="cmp-input"
                    required
                  />
                </div>
                <div className="cmp-form-group">
                  <label>Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="cmp-input"
                  >
                    {PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>{pr}</option>
                    ))}
                  </select>
                </div>
                <div className="cmp-form-group full-width">
                  <label>Detailed Description *</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the issue in detail..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="cmp-input textarea"
                    required
                  />
                </div>
                <div className="cmp-form-group full-width">
                  <label>Attachment URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.attachmentUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, attachmentUrl: e.target.value })
                    }
                    className="cmp-input"
                  />
                </div>
              </div>

              <div className="cmp-modal-footer">
                <button
                  type="button"
                  className="cmp-btn secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cmp-btn primary"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Complaint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DETAIL & STATUS UPDATE MODAL ── */}
      {showDetailModal && selectedComplaint && (
        <div className="cmp-modal-overlay">
          <div className="cmp-modal large">
            <div className="cmp-modal-header">
              <div className="cmp-detail-head">
                <span className="cmp-id-pill">{selectedComplaint.complaintId}</span>
                <h3>{selectedComplaint.subject}</h3>
              </div>
              <button
                className="cmp-close-btn"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="cmp-modal-body">
              {/* Complaint Summary Meta */}
              <div className="cmp-detail-grid">
                <div className="cmp-detail-item">
                  <label>Complainant</label>
                  <span>{selectedComplaint.complainantName} ({selectedComplaint.complainantRole})</span>
                </div>
                <div className="cmp-detail-item">
                  <label>Class / Dept</label>
                  <span>{selectedComplaint.classOrDepartment || "General"}</span>
                </div>
                <div className="cmp-detail-item">
                  <label>Category</label>
                  <span className="cmp-category-tag">{selectedComplaint.category}</span>
                </div>
                <div className="cmp-detail-item">
                  <label>Location</label>
                  <span><MapPin size={14} /> {selectedComplaint.location}</span>
                </div>
                <div className="cmp-detail-item">
                  <label>Priority</label>
                  <span>{getPriorityBadge(selectedComplaint.priority)}</span>
                </div>
                <div className="cmp-detail-item">
                  <label>Current Status</label>
                  <span>{getStatusBadge(selectedComplaint.status)}</span>
                </div>
                <div className="cmp-detail-item full-width">
                  <label>Date &amp; Time Submitted</label>
                  <span>{new Date(selectedComplaint.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="cmp-detail-block">
                <h4>Description</h4>
                <p className="cmp-desc-text">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.attachmentUrl && (
                <div className="cmp-detail-block">
                  <h4>Attachment</h4>
                  <a
                    href={selectedComplaint.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cmp-link"
                  >
                    View Attached Document / Image
                  </a>
                </div>
              )}

              {/* Status Update Form for Principal */}
              {isPrincipal ? (
                <form onSubmit={handleUpdateStatus} className="cmp-update-section">
                  <h4 className="cmp-section-title">
                    <Shield size={16} /> Update Status &amp; Add Official Remark
                  </h4>
                  <div className="cmp-update-grid">
                    <div className="cmp-form-group">
                      <label>Set Status</label>
                      <select
                        value={updateStatusVal}
                        onChange={(e) => setUpdateStatusVal(e.target.value)}
                        className="cmp-input"
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                    <div className="cmp-form-group full-width">
                      <label>Official Response / Remark</label>
                      <textarea
                        rows={3}
                        placeholder="Add response note for the complainant..."
                        value={updateRemarkVal}
                        onChange={(e) => setUpdateRemarkVal(e.target.value)}
                        className="cmp-input textarea"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="cmp-btn primary"
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? "Saving..." : "Save Status & Remark"}
                  </button>
                </form>
              ) : (
                selectedComplaint.responseRemark && (
                  <div className="cmp-detail-block remark-box">
                    <h4>Administration Response</h4>
                    <p>{selectedComplaint.responseRemark}</p>
                    <small>Responded at: {selectedComplaint.respondedAt ? new Date(selectedComplaint.respondedAt).toLocaleString() : "N/A"}</small>
                  </div>
                )
              )}

              {/* History Timeline */}
              {selectedComplaint.statusHistory && selectedComplaint.statusHistory.length > 0 && (
                <div className="cmp-history-section">
                  <h4>Tracking &amp; Status History</h4>
                  <ul className="cmp-history-list">
                    {selectedComplaint.statusHistory.map((hist, idx) => (
                      <li key={idx} className="cmp-history-item">
                        <div className="cmp-history-dot" />
                        <div className="cmp-history-content">
                          <div className="cmp-history-head">
                            <strong>{hist.status}</strong>
                            <small>{new Date(hist.updatedAt).toLocaleString()}</small>
                          </div>
                          <p>{hist.remark || "No remark provided."}</p>
                          <span className="cmp-history-by">Updated by: {hist.updatedBy}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
