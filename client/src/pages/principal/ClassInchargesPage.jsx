import React, { useState, useEffect } from "react";
import {
  fetchPrincipalClasses,
  fetchClassIncharges,
  createClassInchargeApi,
  updateClassInchargeApi,
  deleteClassInchargeApi,
} from "../../services/api";
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  X,
  User,
  Mail,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

const ClassInchargesPage = () => {
  const [classes, setClasses] = useState([]);
  const [classIncharges, setClassIncharges] = useState([]);
  const [isLoadingIncharges, setIsLoadingIncharges] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  // Modal state
  const [isInchargeModalOpen, setIsInchargeModalOpen] = useState(false);
  const [editingIncharge, setEditingIncharge] = useState(null);
  const [inchargeForm, setInchargeForm] = useState({
    name: "",
    email: "",
    password: "",
    assignedClassId: "",
  });
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  useEffect(() => {
    loadClassIncharges();
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await fetchPrincipalClasses();
      setClasses(data.classes || []);
    } catch (err) {
      // silently fail for class list (used only in dropdown)
    }
  };

  const loadClassIncharges = async () => {
    setIsLoadingIncharges(true);
    try {
      const data = await fetchClassIncharges();
      setClassIncharges(data.classIncharges || []);
    } catch (err) {
      setApiError(
        err.response?.data?.message || "Failed to load class incharges."
      );
    } finally {
      setIsLoadingIncharges(false);
    }
  };

  const handleOpenInchargeModal = (incharge = null) => {
    setEditingIncharge(incharge);
    if (incharge) {
      let initialClassVal = "";
      if (incharge.assignedClass) {
        if (incharge.assignedClass.section && incharge.assignedClass.name?.includes("(")) {
          initialClassVal = `${incharge.assignedClass._id}__${incharge.assignedClass.section}`;
        } else {
          initialClassVal = incharge.assignedClass._id || "";
        }
      }
      setInchargeForm({
        name: incharge.name || "",
        email: incharge.email || "",
        password: "",
        assignedClassId: initialClassVal,
      });
    } else {
      setInchargeForm({ name: "", email: "", password: "", assignedClassId: "" });
    }
    setIsInchargeModalOpen(true);
  };

  const handleCloseInchargeModal = () => {
    setIsInchargeModalOpen(false);
    setEditingIncharge(null);
  };

  const handleInchargeFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingForm(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      if (editingIncharge) {
        await updateClassInchargeApi(editingIncharge._id, inchargeForm);
        setApiSuccess("Class Incharge updated successfully!");
      } else {
        await createClassInchargeApi(inchargeForm);
        setApiSuccess("Class Incharge created successfully!");
      }
      handleCloseInchargeModal();
      loadClassIncharges();
      loadClasses();
    } catch (err) {
      setApiError(err.response?.data?.message || "Operation failed.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDeleteIncharge = async (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to delete Class Incharge "${name}"?`
      )
    ) {
      try {
        await deleteClassInchargeApi(id);
        setApiSuccess(`Class Incharge "${name}" deleted.`);
        loadClassIncharges();
        loadClasses();
      } catch (err) {
        setApiError(
          err.response?.data?.message || "Failed to delete Class Incharge."
        );
      }
    }
  };

  return (
    <div className="page-section">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Class Incharges</h2>
          <p className="page-subtitle">
            Create, update, or remove Class Incharge user accounts.
          </p>
        </div>
        <button
          className="btn-create-incharge"
          onClick={() => handleOpenInchargeModal()}
        >
          <Plus size={16} />
          <span>Add New Class Incharge</span>
        </button>
      </div>

      {/* Feedback Banners */}
      {apiSuccess && (
        <div className="alert-banner alert-success">
          <CheckCircle2 className="alert-icon" />
          <span>{apiSuccess}</span>
          <button
            onClick={() => setApiSuccess(null)}
            className="btn-close-alert"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {apiError && (
        <div className="alert-banner alert-error">
          <AlertCircle className="alert-icon" />
          <span>{apiError}</span>
          <button
            onClick={() => setApiError(null)}
            className="btn-close-alert"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Table */}
      {isLoadingIncharges ? (
        <div className="tab-loading">
          <Loader2 className="spinner-large" />
          <p>Loading Class Incharges...</p>
        </div>
      ) : classIncharges.length === 0 ? (
        <div className="empty-state">
          <UserCheck className="w-12 h-12" style={{ color: "#94a3b8" }} />
          <h4>No Class Incharges Found</h4>
          <p>Click the button above to add a new Class Incharge user.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Teacher Name</th>
                <th>Teacher ID</th>
                <th>Email / Username</th>
                <th>Assigned Class</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classIncharges.map((inc) => (
                <tr key={inc._id}>
                  <td>
                    <div className="table-user-cell">
                      <div className="avatar-mini">
                        <UserCheck size={16} className="text-emerald" />
                      </div>
                      <span className="font-semibold">{inc.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono-id" style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "3px 8px", borderRadius: "4px", fontSize: "0.85rem", color: "#334155", fontWeight: "600" }}>
                      {inc.teacherId || "N/A"}
                    </span>
                  </td>
                  <td>{inc.email}</td>
                  <td>
                    {inc.assignedClass ? (
                      <span className="badge-class">{inc.assignedClass.name}</span>
                    ) : (
                      <span className="unassigned-pill">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        inc.isActive ? "active" : "inactive"
                      }`}
                    >
                      {inc.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action edit"
                        onClick={() => handleOpenInchargeModal(inc)}
                        title="Edit Class Incharge"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="btn-action delete"
                        onClick={() => handleDeleteIncharge(inc._id, inc.name)}
                        title="Delete Class Incharge"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isInchargeModalOpen && (
        <div className="modal-overlay" onClick={handleCloseInchargeModal}>
          <div
            className="modal-content max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {editingIncharge ? "Edit Class Incharge" : "Create Class Incharge"}
              </h2>
              <button
                className="modal-close-btn"
                onClick={handleCloseInchargeModal}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInchargeFormSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" />
                  <input
                    type="text"
                    required
                    value={inchargeForm.name}
                    onChange={(e) =>
                      setInchargeForm({ ...inchargeForm, name: e.target.value })
                    }
                    placeholder="e.g. Dr. Rajesh Sharma"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email / Username</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    required
                    value={inchargeForm.email}
                    onChange={(e) =>
                      setInchargeForm({ ...inchargeForm, email: e.target.value })
                    }
                    placeholder="rajesh.incharge@school.edu"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {editingIncharge
                    ? "New Password (leave blank to keep unchanged)"
                    : "Password"}
                </label>
                <div className="input-wrapper">
                  <Key className="input-icon" />
                  <input
                    type="password"
                    required={!editingIncharge}
                    value={inchargeForm.password}
                    onChange={(e) =>
                      setInchargeForm({
                        ...inchargeForm,
                        password: e.target.value,
                      })
                    }
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Class (Optional)</label>
                <select
                  className="custom-select"
                  value={inchargeForm.assignedClassId}
                  onChange={(e) =>
                    setInchargeForm({
                      ...inchargeForm,
                      assignedClassId: e.target.value,
                    })
                  }
                >
                  <option value="">-- No Class Assigned --</option>
                  {classes.flatMap((cls) => {
                    if (cls.hasSections && cls.sections && cls.sections.length > 0) {
                      return [
                        <option key={cls._id} value={cls._id}>
                          {cls.name} (General Class Incharge)
                        </option>,
                        ...cls.sections.map((sec) => (
                          <option key={`${cls._id}__${sec.name}`} value={`${cls._id}__${sec.name}`}>
                            {cls.name} – {sec.name}
                          </option>
                        )),
                      ];
                    }
                    return [
                      <option key={cls._id} value={cls._id}>
                        {cls.name} (Grade {cls.grade})
                      </option>,
                    ];
                  })}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseInchargeModal}
                  disabled={isSubmittingForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isSubmittingForm}
                >
                  {isSubmittingForm ? (
                    <>
                      <Loader2 className="spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {editingIncharge ? "Update Incharge" : "Create Incharge"}
                      </span>
                      <Sparkles size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassInchargesPage;
