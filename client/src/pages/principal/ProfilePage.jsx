import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppDispatch";
import { updateUser } from "../../redux/slices/authSlice";
import { updateProfileApi } from "../../services/api";
import {
  User,
  Mail,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
  Save,
  Loader2,
  GraduationCap,
  BadgeCheck,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  School,
  Award,
  Clock,
} from "lucide-react";

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'edit' | 'security'
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    education: user?.education || "",
    password: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const startEditing = (tab = "edit") => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      education: user?.education || "",
      password: "",
      confirmPassword: "",
    });
    setFormErrors({});
    setApiError(null);
    setApiSuccess(null);
    setActiveTab(tab);
  };

  const handleCancel = () => {
    setActiveTab("overview");
    setFormErrors({});
    setApiError(null);
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Full name is required.";
    if (!form.email.trim()) errors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Please enter a valid email address.";
    if (form.password && form.password.length < 6)
      errors.password = "Password must be at least 6 characters long.";
    if (form.password && form.password !== form.confirmPassword)
      errors.confirmPassword = "Passwords do not match.";
    return errors;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        education: form.education.trim(),
      };
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      const data = await updateProfileApi(payload);
      dispatch(updateUser(data.user));
      setApiSuccess("Profile updated successfully!");
      setActiveTab("overview");
    } catch (err) {
      setApiError(
        err.response?.data?.message || "Failed to update profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Get initials for avatar
  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "PR";

  const roleLabel = {
    PRINCIPAL: "Principal / Head Administrator",
    CLASS_INCHARGE: "Class Incharge",
    SUBJECT_TEACHER: "Subject Teacher",
    STUDENT: "Student",
  };

  return (
    <div className="profile-page-wrapper">
      {/* ── HERO BANNER ── */}
      <div className="profile-hero-card">
        <div className="profile-hero-bg-pattern" />
        <div className="profile-hero-content">
          <div className="profile-avatar-box">
            <span className="profile-avatar-text">{initials}</span>
            <span className="profile-avatar-badge" title="Active Account">
              <BadgeCheck size={16} />
            </span>
          </div>

          <div className="profile-hero-meta">
            <div className="profile-badge-row">
              <span className="profile-role-chip">
                <ShieldCheck size={14} />
                {roleLabel[user?.role] || user?.role || "PRINCIPAL"}
              </span>
              <span className="profile-status-chip">
                <span className="status-dot" />
                Active Account
              </span>
            </div>
            <h1 className="profile-hero-name">{user?.name || "Principal Admin"}</h1>
            <p className="profile-hero-email">
              <Mail size={14} />
              <span>{user?.email}</span>
            </p>
          </div>

          <div className="profile-hero-actions">
            {activeTab === "overview" ? (
              <button
                className="profile-btn-primary"
                onClick={() => startEditing("edit")}
              >
                <Edit3 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button className="profile-btn-secondary" onClick={handleCancel}>
                <X size={16} />
                <span>Cancel Editing</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── QUICK STATS STRIP ── */}
      <div className="profile-stats-strip">
        <div className="profile-stat-card">
          <div className="stat-icon-bg icon-purple">
            <School size={20} />
          </div>
          <div className="stat-text">
            <span className="stat-label">Institution Portal</span>
            <span className="stat-value">School TMS</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="stat-icon-bg icon-indigo">
            <Award size={20} />
          </div>
          <div className="stat-text">
            <span className="stat-label">Highest Qualification</span>
            <span className="stat-value">
              {user?.education || "M.Ed, Ph.D. Management"}
            </span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="stat-icon-bg icon-emerald">
            <ShieldCheck size={20} />
          </div>
          <div className="stat-text">
            <span className="stat-label">Access Level</span>
            <span className="stat-value">Super Admin Privileges</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="stat-icon-bg icon-amber">
            <Clock size={20} />
          </div>
          <div className="stat-text">
            <span className="stat-label">Account Status</span>
            <span className="stat-value">Verified & Active</span>
          </div>
        </div>
      </div>

      {/* ── FEEDBACK ALERTS ── */}
      {apiSuccess && (
        <div className="profile-alert profile-alert-success">
          <CheckCircle2 size={18} />
          <span>{apiSuccess}</span>
          <button onClick={() => setApiSuccess(null)} className="alert-close-btn">
            <X size={16} />
          </button>
        </div>
      )}
      {apiError && (
        <div className="profile-alert profile-alert-error">
          <AlertCircle size={18} />
          <span>{apiError}</span>
          <button onClick={() => setApiError(null)} className="alert-close-btn">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── TABS NAVIGATION ── */}
      <div className="profile-tabs-bar">
        <button
          className={`profile-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <User size={16} />
          <span>Profile Overview</span>
        </button>
        <button
          className={`profile-tab-btn ${activeTab === "edit" ? "active" : ""}`}
          onClick={() => startEditing("edit")}
        >
          <Edit3 size={16} />
          <span>Edit Details</span>
        </button>
        <button
          className={`profile-tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => startEditing("security")}
        >
          <Lock size={16} />
          <span>Password & Security</span>
        </button>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="profile-content-body">
        {activeTab === "overview" && (
          <div className="profile-overview-grid">
            {/* Left Card — Personal & Academic */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="card-title-wrap">
                  <GraduationCap size={20} className="card-title-icon" />
                  <h3>Personal &amp; Professional Info</h3>
                </div>
                <button
                  className="card-quick-edit"
                  onClick={() => startEditing("edit")}
                >
                  <Edit3 size={14} />
                  <span>Edit</span>
                </button>
              </div>

              <div className="profile-details-list">
                <div className="detail-item">
                  <div className="detail-icon">
                    <User size={16} />
                  </div>
                  <div className="detail-info">
                    <label>Full Name</label>
                    <p>{user?.name || "Not specified"}</p>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <Mail size={16} />
                  </div>
                  <div className="detail-info">
                    <label>Email / Username</label>
                    <p>{user?.email || "Not specified"}</p>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <Calendar size={16} />
                  </div>
                  <div className="detail-info">
                    <label>Qualification / Education</label>
                    <p>{user?.education || "M.Ed, Ph.D. in Education Management"}</p>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="detail-info">
                    <label>Role</label>
                    <p>{roleLabel[user?.role] || user?.role || "Principal Admin"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card — Admin Privileges & System Scope */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="card-title-wrap">
                  <Sparkles size={20} className="card-title-icon" />
                  <h3>System Scope &amp; Permissions</h3>
                </div>
              </div>

              <div className="profile-privileges-list">
                <div className="privilege-pill">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <div>
                    <strong>Full Class Management</strong>
                    <p>Create, inspect, and update classes from LKG to 12th Grade.</p>
                  </div>
                </div>

                <div className="privilege-pill">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <div>
                    <strong>Class Incharge Control</strong>
                    <p>Assign, reassign, or create Class Incharge teacher accounts.</p>
                  </div>
                </div>

                <div className="privilege-pill">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <div>
                    <strong>Test &amp; Subject Monitoring</strong>
                    <p>Oversee subject test schedules, student marks, and analytics.</p>
                  </div>
                </div>

                <div className="privilege-pill">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <div>
                    <strong>Global Administrative Settings</strong>
                    <p>Modify institution settings, academic years, and system defaults.</p>
                  </div>
                </div>
              </div>

              <div className="security-shortcut-box">
                <Lock size={16} />
                <span>Want to update your password?</span>
                <button
                  className="security-link-btn"
                  onClick={() => startEditing("security")}
                >
                  Change Password →
                </button>
              </div>
            </div>
          </div>
        )}

        {(activeTab === "edit" || activeTab === "security") && (
          <div className="profile-card form-card">
            <div className="profile-card-header">
              <div className="card-title-wrap">
                {activeTab === "edit" ? (
                  <>
                    <Edit3 size={20} className="card-title-icon" />
                    <h3>Edit Profile Details</h3>
                  </>
                ) : (
                  <>
                    <Lock size={20} className="card-title-icon" />
                    <h3>Password &amp; Security Settings</h3>
                  </>
                )}
              </div>
              <p className="card-subtitle">
                {activeTab === "edit"
                  ? "Update your personal details below."
                  : "Change your account password securely."}
              </p>
            </div>

            <form onSubmit={handleSave} className="profile-form-grid">
              {activeTab === "edit" && (
                <>
                  <div className="form-group col-span-2">
                    <label className="form-label">Full Name</label>
                    <div
                      className={`input-wrapper ${
                        formErrors.name ? "has-error" : ""
                      }`}
                    >
                      <User className="input-icon" size={18} />
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        disabled={isSaving}
                      />
                    </div>
                    {formErrors.name && (
                      <span className="field-error">{formErrors.name}</span>
                    )}
                  </div>

                  <div className="form-group col-span-2">
                    <label className="form-label">Email / Username</label>
                    <div
                      className={`input-wrapper ${
                        formErrors.email ? "has-error" : ""
                      }`}
                    >
                      <Mail className="input-icon" size={18} />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="principal@school.com"
                        disabled={isSaving}
                      />
                    </div>
                    {formErrors.email && (
                      <span className="field-error">{formErrors.email}</span>
                    )}
                  </div>

                  <div className="form-group col-span-2">
                    <label className="form-label">Education / Qualification</label>
                    <div className="input-wrapper">
                      <GraduationCap className="input-icon" size={18} />
                      <input
                        type="text"
                        name="education"
                        value={form.education}
                        onChange={handleChange}
                        placeholder="e.g. M.Ed, Ph.D. in Education Management"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "security" && (
                <>
                  <div className="form-group col-span-2">
                    <label className="form-label">
                      New Password{" "}
                      <span className="form-label-hint">
                        (Minimum 6 characters)
                      </span>
                    </label>
                    <div
                      className={`input-wrapper ${
                        formErrors.password ? "has-error" : ""
                      }`}
                    >
                      <Key className="input-icon" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter new password"
                        disabled={isSaving}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {formErrors.password && (
                      <span className="field-error">{formErrors.password}</span>
                    )}
                  </div>

                  <div className="form-group col-span-2">
                    <label className="form-label">Confirm New Password</label>
                    <div
                      className={`input-wrapper ${
                        formErrors.confirmPassword ? "has-error" : ""
                      }`}
                    >
                      <Key className="input-icon" size={18} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter new password"
                        disabled={isSaving}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    {formErrors.confirmPassword && (
                      <span className="field-error">
                        {formErrors.confirmPassword}
                      </span>
                    )}
                  </div>
                </>
              )}

              <div className="profile-form-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary profile-save-btn"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="spinner" size={16} />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
