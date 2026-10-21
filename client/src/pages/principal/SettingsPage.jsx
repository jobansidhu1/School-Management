import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppDispatch";
import { logout } from "../../redux/slices/authSlice";
import {
  fetchSchoolSettingsApi,
  updateSchoolSettingsApi,
  addAcademicSessionApi,
} from "../../services/api";
import {
  Settings,
  Sliders,
  Bell,
  Lock,
  Database,
  Globe,
  CheckCircle2,
  Save,
  Shield,
  FileText,
  LogOut,
  Building2,
  Calendar,
  Plus,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Award,
} from "lucide-react";

const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // New Academic Session Input State
  const [newSessionInput, setNewSessionInput] = useState("");
  const [isAddingSession, setIsAddingSession] = useState(false);

  const [settings, setSettings] = useState({
    name: "Delhi Public Senior Secondary School",
    code: "DPS-1002",
    affiliationNumber: "CBSE/AFF/2025-26/0942",
    board: "CBSE",
    contactEmail: "principal@school.com",
    contactNumber: "+91 98765 43210",
    address: "123 Knowledge Park, Education Hub",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110001",
    website: "https://school.edu",
    principalName: user?.name || "Principal Admin",
    currentSession: "2025-2026",
    academicSessions: [
      { name: "2024-2025", isCurrent: false },
      { name: "2025-2026", isCurrent: true },
      { name: "2026-2027", isCurrent: false },
    ],
    term: "Term 1",
    passingPercentage: "33%",
    resultPublishing: "Manual Review Required",
    emailNotifications: true,
    autoBackup: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchSchoolSettingsApi();
      if (res.school) {
        setSettings((prev) => ({
          ...prev,
          ...res.school,
        }));
      }
    } catch (err) {
      setErrorMsg("Failed to load school settings from server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSaved(false);
    try {
      const res = await updateSchoolSettingsApi(settings);
      if (res.school) {
        setSettings(res.school);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSession = async () => {
    if (!newSessionInput.trim()) return;
    setIsAddingSession(true);
    setErrorMsg(null);
    try {
      const res = await addAcademicSessionApi({
        sessionName: newSessionInput.trim(),
        isCurrent: false,
      });
      if (res.school) {
        setSettings(res.school);
      }
      setNewSessionInput("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to add academic session.");
    } finally {
      setIsAddingSession(false);
    }
  };

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h2 className="page-title">School &amp; Academic Settings</h2>
          <p className="page-subtitle">
            Manage school institutional profile, active academic sessions, and administrative policies.
          </p>
        </div>
      </div>

      {saved && (
        <div className="alert-banner alert-success" style={{ marginBottom: "20px" }}>
          <CheckCircle2 className="alert-icon" />
          <span>School information &amp; academic settings saved successfully to MongoDB!</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert-banner alert-error" style={{ marginBottom: "20px" }}>
          <AlertCircle className="alert-icon" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="tab-loading">
          <Loader2 className="spinner-large" />
          <p>Loading school settings from database...</p>
        </div>
      ) : (
        <div className="settings-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
          {/* Card 1: School Profile & Institutional Information */}
          <div className="card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", color: "#4f46e5" }}>
              <Building2 size={22} />
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#1e293b" }}>School Profile</h3>
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label className="form-label">School Name</label>
              <input
                type="text"
                name="name"
                value={settings.name || ""}
                onChange={handleChange}
                placeholder="e.g. Delhi Public School"
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div className="form-group">
                <label className="form-label">School Code</label>
                <input
                  type="text"
                  name="code"
                  value={settings.code || ""}
                  onChange={handleChange}
                  placeholder="e.g. DPS-1002"
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Affiliation Board</label>
                <select
                  name="board"
                  value={settings.board || "CBSE"}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                >
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State Board">State Board</option>
                  <option value="IB">IB</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label className="form-label">Affiliation Number / License</label>
              <input
                type="text"
                name="affiliationNumber"
                value={settings.affiliationNumber || ""}
                onChange={handleChange}
                placeholder="e.g. CBSE/AFF/2025-26/0942"
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={settings.contactEmail || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  name="contactNumber"
                  value={settings.contactNumber || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label className="form-label">Campus Address</label>
              <input
                type="text"
                name="address"
                value={settings.address || ""}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  value={settings.city || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  name="state"
                  value={settings.state || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={settings.pincode || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Academic Sessions & Session Management */}
          <div className="card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", color: "#4f46e5" }}>
              <Calendar size={22} />
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#1e293b" }}>Academic Sessions</h3>
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label">Active Academic Session (Default for Classes &amp; Tests)</label>
              <select
                name="currentSession"
                value={settings.currentSession || "2025-2026"}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontWeight: 600, color: "#4f46e5" }}
              >
                {(settings.academicSessions || []).map((sess, idx) => {
                  const sName = typeof sess === "string" ? sess : sess.name;
                  return (
                    <option key={idx} value={sName}>
                      {sName} {sess.isCurrent ? "★ (Active)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Add New Session Box */}
            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px dashed #cbd5e1", marginBottom: "16px" }}>
              <label className="form-label" style={{ fontSize: "0.85rem", marginBottom: "8px" }}>
                Add New Academic Session:
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="e.g. 2026-2027"
                  value={newSessionInput}
                  onChange={(e) => setNewSessionInput(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
                <button
                  type="button"
                  onClick={handleAddSession}
                  disabled={isAddingSession || !newSessionInput.trim()}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "#4f46e5", color: "#ffffff", borderRadius: "8px", border: "none", fontWeight: 600, cursor: "pointer" }}
                >
                  {isAddingSession ? <Loader2 size={15} className="spinner" /> : <Plus size={15} />}
                  <span>Add</span>
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label">Active Term / Semester</label>
              <select
                name="term"
                value={settings.term || "Term 1"}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
              >
                <option value="Term 1">Term 1 (Mid-Term Exam Period)</option>
                <option value="Term 2">Term 2 (Final Exam Period)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Minimum Passing Percentage</label>
              <input
                type="text"
                name="passingPercentage"
                value={settings.passingPercentage || "33%"}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>

          {/* Card 3: Security & Governance */}
          <div className="card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", color: "#4f46e5" }}>
              <Shield size={22} />
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#1e293b" }}>Governance &amp; Automation</h3>
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label">Test Result Publishing Policy</label>
              <select
                name="resultPublishing"
                value={settings.resultPublishing || "Manual Review Required"}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
              >
                <option value="Manual Review Required">Principal Review &amp; Approval Required</option>
                <option value="Auto Publish">Auto-Publish by Class Incharges</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem", color: "#334155" }}>
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={!!settings.emailNotifications}
                  onChange={handleChange}
                  style={{ width: "18px", height: "18px" }}
                />
                Enable System Email Notifications for Teachers
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem", color: "#334155" }}>
                <input
                  type="checkbox"
                  name="autoBackup"
                  checked={!!settings.autoBackup}
                  onChange={handleChange}
                  style={{ width: "18px", height: "18px" }}
                />
                Automated Nightly MongoDB Database Backups
              </label>
            </div>

            <div style={{ marginTop: "24px", padding: "14px", background: "#f1f5f9", borderRadius: "10px", fontSize: "0.85rem", color: "#475569" }}>
              <strong>Principal Authority:</strong> School profile details and active academic sessions configured here apply globally across all student assessments and grade rosters.
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-submit"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 28px", background: "#4f46e5", color: "#ffffff", borderRadius: "10px", border: "none", fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer" }}
        >
          {isSaving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
          <span>{isSaving ? "Saving to Database..." : "Save Settings"}</span>
        </button>

        <button
          onClick={() => {
            dispatch(logout());
            navigate("/login");
          }}
          className="btn-cancel"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "10px", fontWeight: 600, cursor: "pointer" }}
        >
          <LogOut size={16} />
          <span>Logout Account</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
