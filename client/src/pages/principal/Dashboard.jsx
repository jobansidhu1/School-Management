import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Chart } from "react-google-charts";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppDispatch";
import { logout } from "../../redux/slices/authSlice";
import {
  fetchPrincipalClasses,
  fetchClassDetails,
  fetchClassIncharges,
  createClassInchargeApi,
  updateClassInchargeApi,
  deleteClassInchargeApi,
  updateClassSectionsApi,
} from "../../services/api";
import {
  ShieldCheck,
  LogOut,
  User,
  Mail,
  CheckCircle2,
  Users,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  X,
  ChevronRight,
  UserCheck,
  GraduationCap,
  Loader2,
  AlertCircle,
  Sparkles,
  Key,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";

const PrincipalDashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // Active Tab: "classes" | "incharges"
  const [activeTab, setActiveTab] = useState("classes");

  // Data states
  const [classes, setClasses] = useState([]);
  const [classIncharges, setClassIncharges] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingIncharges, setIsLoadingIncharges] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  // Class Detail & Sections Modal State
  const [selectedClass, setSelectedClass] = useState(null);
  const [isLoadingClassDetail, setIsLoadingClassDetail] = useState(false);
  const [hasSections, setHasSections] = useState(false);
  const [sectionsList, setSectionsList] = useState([]);
  const [isSavingSections, setIsSavingSections] = useState(false);

  // Class Incharge Form Modal State
  const [isInchargeModalOpen, setIsInchargeModalOpen] = useState(false);
  const [editingIncharge, setEditingIncharge] = useState(null); // null for create, object for edit
  const [inchargeForm, setInchargeForm] = useState({
    name: "",
    email: "",
    password: "",
    assignedClassId: "",
  });
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Fetch initial data
  useEffect(() => {
    loadClasses();
    loadClassIncharges();
  }, []);

  const loadClasses = async () => {
    setIsLoadingClasses(true);
    try {
      const data = await fetchPrincipalClasses();
      setClasses(data.classes || []);
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to load classes.");
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const loadClassIncharges = async () => {
    setIsLoadingIncharges(true);
    try {
      const data = await fetchClassIncharges();
      setClassIncharges(data.classIncharges || []);
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to load class incharges.");
    } finally {
      setIsLoadingIncharges(false);
    }
  };

  const handleOpenClassDetail = async (classId) => {
    setIsLoadingClassDetail(true);
    setSelectedClass(null);
    try {
      const data = await fetchClassDetails(classId);
      setSelectedClass(data.classDetails);
      setHasSections(data.classDetails.hasSections || false);
      setSectionsList(
        data.classDetails.sections && data.classDetails.sections.length > 0
          ? data.classDetails.sections.map((s) => ({
              name: s.name,
              classIncharge: s.classIncharge?._id || s.classIncharge || "",
            }))
          : []
      );
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to fetch class details.");
    } finally {
      setIsLoadingClassDetail(false);
    }
  };

  const handleToggleHasSections = (enabled) => {
    setHasSections(enabled);
    if (enabled && sectionsList.length === 0) {
      setSectionsList([
        { name: "Section A", classIncharge: "" },
        { name: "Section B", classIncharge: "" },
        { name: "Section C", classIncharge: "" },
        { name: "Section D", classIncharge: "" },
      ]);
    }
  };

  const handleAddSection = () => {
    const charCode = 65 + sectionsList.length;
    const defaultName = charCode <= 90 ? `Section ${String.fromCharCode(charCode)}` : `Section ${sectionsList.length + 1}`;
    const customName = window.prompt("Enter section name:", defaultName);
    if (customName && customName.trim()) {
      setSectionsList([
        ...sectionsList,
        { name: customName.trim(), classIncharge: "" },
      ]);
    }
  };

  const handleRemoveSection = (index) => {
    setSectionsList(sectionsList.filter((_, i) => i !== index));
  };

  const handleSectionInchargeChange = (index, inchargeId) => {
    const updated = [...sectionsList];
    updated[index].classIncharge = inchargeId;
    setSectionsList(updated);
  };

  const handleSaveSectionsConfig = async () => {
    if (!selectedClass) return;
    setIsSavingSections(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const res = await updateClassSectionsApi(selectedClass._id, {
        hasSections,
        sections: sectionsList,
      });
      setSelectedClass(res.classDetails);
      setHasSections(res.classDetails.hasSections || false);
      setSectionsList(
        res.classDetails.sections && res.classDetails.sections.length > 0
          ? res.classDetails.sections.map((s) => ({
              name: s.name,
              classIncharge: s.classIncharge?._id || s.classIncharge || "",
            }))
          : []
      );
      setApiSuccess("Class sections updated successfully!");
      loadClasses();
      loadClassIncharges();
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to save class sections.");
    } finally {
      setIsSavingSections(false);
    }
  };

  // Open Create/Edit Modal for Class Incharge
  const handleOpenInchargeModal = (incharge = null) => {
    setEditingIncharge(incharge);
    if (incharge) {
      setInchargeForm({
        name: incharge.name || "",
        email: incharge.email || "",
        password: "", // Optional on edit
        assignedClassId: incharge.assignedClass?._id || "",
      });
    } else {
      setInchargeForm({
        name: "",
        email: "",
        password: "",
        assignedClassId: "",
      });
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
        // Edit Class Incharge
        await updateClassInchargeApi(editingIncharge._id, inchargeForm);
        setApiSuccess("Class Incharge updated successfully!");
      } else {
        // Create Class Incharge
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
    if (window.confirm(`Are you sure you want to delete Class Incharge "${name}"?`)) {
      try {
        await deleteClassInchargeApi(id);
        setApiSuccess(`Class Incharge "${name}" deleted.`);
        loadClassIncharges();
        loadClasses();
      } catch (err) {
        setApiError(err.response?.data?.message || "Failed to delete Class Incharge.");
      }
    }
  };

  // ── Google Charts Analytics Data ──────────────────────────────────────
  const teacherDistributionData = useMemo(() => {
    if (!classes || classes.length === 0) {
      return [["Class", "Subject Teachers", { role: "style" }, { role: "annotation" }]];
    }
    return [
      ["Class", "Subject Teachers", { role: "style" }, { role: "annotation" }],
      ...classes.map((cls) => [
        cls.name,
        cls.totalSubjectTeachers || 0,
        "#4f46e5",
        String(cls.totalSubjectTeachers || 0),
      ]),
    ];
  }, [classes]);

  const inchargeCoverageData = useMemo(() => {
    if (!classes || classes.length === 0) {
      return [["Status", "Classes"]];
    }
    const assigned = classes.filter(
      (c) => c.classIncharge || (c.hasSections && c.sections?.some((s) => s.classIncharge))
    ).length;
    const unassigned = classes.length - assigned;
    return [
      ["Status", "Classes"],
      ["Assigned", assigned],
      ["Unassigned", unassigned],
    ];
  }, [classes]);

  const sectionStructureData = useMemo(() => {
    if (!classes || classes.length === 0) {
      return [["Structure", "Count"]];
    }
    const multi = classes.filter((c) => c.hasSections).length;
    const single = classes.length - multi;
    return [
      ["Structure", "Count"],
      ["Single Section", single],
      ["Multi-Section", multi],
    ];
  }, [classes]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-badge">
            <ShieldCheck className="brand-icon" />
          </div>
          <div>
            <h1 className="header-title">Super Admin / Principal Dashboard</h1>
            <p className="header-subtitle">School Academic & Test Management System</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="user-profile-chip">
            <div className="avatar-circle">
              <User className="avatar-icon" />
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || "Principal"}</span>
              <span className="user-role-tag">{user?.role || "PRINCIPAL"}</span>
            </div>
          </div>

          <button onClick={handleLogout} className="btn-logout" title="Sign Out">
            <LogOut className="logout-icon" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="dashboard-main">
        {/* Banner */}
        <section className="welcome-banner">
          <div className="banner-content">
            <div className="verified-badge">
              <CheckCircle2 className="check-icon" />
              <span>Full Administrative Access</span>
            </div>
            <h2>School Overview & Management</h2>
            <p>
              View complete class details from LKG to Class 12, inspect assigned Class Incharges & Subject Teachers, and manage Class Incharge accounts.
            </p>
          </div>
        </section>

        {/* Feedback Banners */}
        {apiSuccess && (
          <div className="alert-banner alert-success">
            <CheckCircle2 className="alert-icon" />
            <span>{apiSuccess}</span>
            <button onClick={() => setApiSuccess(null)} className="btn-close-alert">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {apiError && (
          <div className="alert-banner alert-error">
            <AlertCircle className="alert-icon" />
            <span>{apiError}</span>
            <button onClick={() => setApiError(null)} className="btn-close-alert">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── GRAPHICAL ACADEMIC ANALYTICS (react-google-charts) ── */}
        {classes.length > 0 && (
          <section style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#eef2ff", color: "#4f46e5", padding: "8px", borderRadius: "10px", display: "flex" }}>
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#1e293b" }}>
                    Academic Structure &amp; Allocation Analytics
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                    Interactive visual breakdown of subject teachers and incharge mappings
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              {/* Chart 1: Subject Teachers per Class */}
              <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>Subject Teachers Allocation by Class</span>
                  <span style={{ fontSize: "0.75rem", background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>Column Chart</span>
                </div>
                <Chart
                  chartType="ColumnChart"
                  width="100%"
                  height="260px"
                  data={teacherDistributionData}
                  options={{
                    backgroundColor: "transparent",
                    chartArea: { width: "88%", height: "65%" },
                    legend: { position: "none" },
                    colors: ["#4f46e5"],
                    hAxis: {
                      textStyle: { color: "#64748b", fontSize: 10 },
                      slantedText: true,
                      slantedTextAngle: 30,
                    },
                    vAxis: {
                      minValue: 0,
                      textStyle: { color: "#64748b", fontSize: 11 },
                      gridlines: { color: "#f1f5f9" },
                    },
                    animation: {
                      startup: true,
                      duration: 800,
                      easing: "out",
                    },
                  }}
                  loader={<div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Loading Chart...</div>}
                />
              </div>

              {/* Chart 2: Class Incharge Allocation Coverage */}
              <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>Class Incharge Coverage</span>
                  <span style={{ fontSize: "0.75rem", background: "#ecfdf5", color: "#059669", padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>Donut Chart</span>
                </div>
                <Chart
                  chartType="PieChart"
                  width="100%"
                  height="260px"
                  data={inchargeCoverageData}
                  options={{
                    pieHole: 0.45,
                    backgroundColor: "transparent",
                    chartArea: { width: "90%", height: "80%" },
                    colors: ["#10b981", "#f59e0b"],
                    legend: { position: "bottom", textStyle: { color: "#475569", fontSize: 12 } },
                    pieSliceTextStyle: { fontSize: 12, fontWeight: "bold" },
                  }}
                  loader={<div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Loading Chart...</div>}
                />
              </div>

              {/* Chart 3: Single vs Multi Section Distribution */}
              <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>Class Section Structure</span>
                  <span style={{ fontSize: "0.75rem", background: "#eff6ff", color: "#2563eb", padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>Donut Chart</span>
                </div>
                <Chart
                  chartType="PieChart"
                  width="100%"
                  height="260px"
                  data={sectionStructureData}
                  options={{
                    pieHole: 0.45,
                    backgroundColor: "transparent",
                    chartArea: { width: "90%", height: "80%" },
                    colors: ["#3b82f6", "#8b5cf6"],
                    legend: { position: "bottom", textStyle: { color: "#475569", fontSize: 12 } },
                    pieSliceTextStyle: { fontSize: 12, fontWeight: "bold" },
                  }}
                  loader={<div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Loading Chart...</div>}
                />
              </div>
            </div>
          </section>
        )}

        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === "classes" ? "active" : ""}`}
            onClick={() => setActiveTab("classes")}
          >
            <BookOpen className="tab-icon" />
            <span>Classes (LKG - 12th)</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "incharges" ? "active" : ""}`}
            onClick={() => setActiveTab("incharges")}
          >
            <UserCheck className="tab-icon" />
            <span>Manage Class Incharges</span>
          </button>
        </div>

        {/* TAB 1: SCHOOL CLASSES */}
        {activeTab === "classes" && (
          <section className="tab-section">
            <div className="section-header">
              <h3>School Classes Roster</h3>
              <span className="section-badge">{classes.length} Classes Registered</span>
            </div>

            {isLoadingClasses ? (
              <div className="tab-loading">
                <Loader2 className="spinner-large" />
                <p>Loading school classes...</p>
              </div>
            ) : (
              <div className="classes-grid">
                {classes.map((cls) => (
                  <div
                    key={cls._id}
                    className="class-card"
                    onClick={() => handleOpenClassDetail(cls._id)}
                  >
                    <div className="class-card-header">
                      <div className="class-icon-bg">
                        <GraduationCap className="class-icon" />
                      </div>
                      <div>
                        <h4>{cls.name}</h4>
                        <span className="class-subtext">Grade {cls.grade}</span>
                      </div>
                    </div>

                    <div className="class-card-body">
                      {/* Sections / Incharge Highlight Box */}
                      {cls.hasSections && cls.sections && cls.sections.length > 0 ? (
                        <div className="incharge-highlight-box sections-badge-box">
                          <span className="highlight-label flex-between">
                            <span>Sections ({cls.sections.length})</span>
                            <span className="sections-pill-tag">Multi-Section</span>
                          </span>
                          <div className="sections-chips-row">
                            {cls.sections.slice(0, 4).map((sec, i) => (
                              <span key={i} className="sec-chip">
                                {sec.name}
                              </span>
                            ))}
                            {cls.sections.length > 4 && (
                              <span className="sec-chip more">+{cls.sections.length - 4}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="incharge-highlight-box">
                          <span className="highlight-label">Class Incharge</span>
                          {cls.classIncharge ? (
                            <div className="incharge-user-row">
                              <UserCheck className="icon-incharge text-emerald" />
                              <span className="incharge-name">{cls.classIncharge.name}</span>
                            </div>
                          ) : (
                            <span className="unassigned-text">Not Assigned</span>
                          )}
                        </div>
                      )}

                      <div className="teachers-count-row">
                        <Users className="w-4 h-4 text-purple" />
                        <span>{cls.totalSubjectTeachers} Subject Teacher(s)</span>
                      </div>
                    </div>

                    <div className="class-card-footer">
                      <span>Click to view details</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: MANAGE CLASS INCHARGES */}
        {activeTab === "incharges" && (
          <section className="tab-section">
            <div className="section-header">
              <div>
                <h3>Class Incharge User Management</h3>
                <p className="sub-p">Create, update, or remove Class Incharge user accounts</p>
              </div>
              <button
                className="btn-create-incharge"
                onClick={() => handleOpenInchargeModal()}
              >
                <Plus className="w-4 h-4" />
                <span>Add New Class Incharge</span>
              </button>
            </div>

            {isLoadingIncharges ? (
              <div className="tab-loading">
                <Loader2 className="spinner-large" />
                <p>Loading Class Incharges...</p>
              </div>
            ) : classIncharges.length === 0 ? (
              <div className="empty-state">
                <UserCheck className="w-12 h-12 text-slate-500" />
                <h4>No Class Incharges Found</h4>
                <p>Click the button above to add a new Class Incharge user.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
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
                              <UserCheck className="w-4 h-4 text-emerald" />
                            </div>
                            <span className="font-semibold">{inc.name}</span>
                          </div>
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
                          <span className={`status-pill ${inc.isActive ? "active" : "inactive"}`}>
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
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              className="btn-action delete"
                              onClick={() => handleDeleteIncharge(inc._id, inc.name)}
                              title="Delete Class Incharge"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* CLASS DETAIL MODAL */}
      {(selectedClass || isLoadingClassDetail) && (
        <div className="modal-overlay" onClick={() => setSelectedClass(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {isLoadingClassDetail ? (
              <div className="tab-loading p-8">
                <Loader2 className="spinner-large" />
                <p>Fetching class roster details...</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <div>
                    <span className="modal-subtitle">Class Details</span>
                    <h2>{selectedClass.name}</h2>
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={() => setSelectedClass(null)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="modal-body">
                  {/* SECTIONS MANAGEMENT SECTION */}
                  <div className="detail-section section-config-box">
                    <div className="section-title-row flex-between">
                      <div className="flex-align-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-600" />
                        <h3>Class Sections Management</h3>
                      </div>
                      <div className="sections-toggle-wrapper">
                        <span className="toggle-label-text">
                          {hasSections ? "Sections Enabled" : "Enable Sections"}
                        </span>
                        <button
                          type="button"
                          className={`toggle-switch ${hasSections ? "active" : ""}`}
                          onClick={() => handleToggleHasSections(!hasSections)}
                        >
                          <span className="toggle-knob" />
                        </button>
                      </div>
                    </div>

                    {hasSections ? (
                      <div className="sections-container mt-4">
                        <div className="sections-header-bar">
                          <span className="sections-count-label">
                            Configured Sections ({sectionsList.length})
                          </span>
                          <button
                            type="button"
                            className="btn-add-section-action"
                            onClick={handleAddSection}
                            title="Add New Section"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Section</span>
                          </button>
                        </div>

                        <div className="sections-cards-grid mt-3">
                          {sectionsList.map((sec, idx) => (
                            <div key={idx} className="section-card-box">
                              <div className="section-card-header">
                                <span className="section-title-badge">{sec.name}</span>
                                {sectionsList.length > 1 && (
                                  <button
                                    type="button"
                                    className="btn-remove-section"
                                    onClick={() => handleRemoveSection(idx)}
                                    title="Delete Section"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <div className="section-card-body">
                                <label className="select-label">Section Incharge:</label>
                                <select
                                  className="custom-select-sm"
                                  value={sec.classIncharge || ""}
                                  onChange={(e) =>
                                    handleSectionInchargeChange(idx, e.target.value)
                                  }
                                >
                                  <option value="">-- Unassigned --</option>
                                  {selectedClass.availableIncharges?.map((inc) => (
                                    <option key={inc._id} value={inc._id}>
                                      {inc.name} ({inc.email})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="sections-save-footer mt-4">
                          <button
                            type="button"
                            className="btn-save-sections"
                            onClick={handleSaveSectionsConfig}
                            disabled={isSavingSections}
                          >
                            {isSavingSections ? (
                              <>
                                <Loader2 className="spinner w-4 h-4" />
                                <span>Saving Sections...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Save Sections & Incharges</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="sections-disabled-notice mt-2">
                        <p>
                          Single class mode is active. Toggle "Enable Sections" above to split this class into sections (Section A, B, C, D) and assign section incharges.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CLASS INCHARGE (SINGLE INCHARGE OR SUMMARY) */}
                  <div className="detail-section highlight-incharge-section">
                    <div className="section-title-row">
                      <ShieldCheck className="w-5 h-5 text-emerald" />
                      <h3>Class Incharge</h3>
                      <span className="badge-featured">Key Official</span>
                    </div>

                    {selectedClass.classIncharge ? (
                      <div className="incharge-card-detail">
                        <div className="incharge-avatar">
                          <UserCheck className="w-6 h-6 text-white" />
                        </div>
                        <div className="incharge-info">
                          <h4>{selectedClass.classIncharge.name}</h4>
                          <span className="incharge-email">
                            <Mail className="w-3.5 h-3.5" /> {selectedClass.classIncharge.email}
                          </span>
                        </div>
                        <span className="status-pill active">Assigned Incharge</span>
                      </div>
                    ) : (
                      <div className="no-incharge-notice">
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                        <span>
                          {hasSections
                            ? "Class sections are active above. Assign incharges per section!"
                            : "No main Class Incharge currently assigned to this class."}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* SUBJECT TEACHERS LIST */}
                  <div className="detail-section">
                    <div className="section-title-row">
                      <Users className="w-5 h-5 text-purple-400" />
                      <h3>Assigned Subject Teachers</h3>
                    </div>

                    {selectedClass.subjectTeachers && selectedClass.subjectTeachers.length > 0 ? (
                      <div className="teachers-list">
                        {selectedClass.subjectTeachers.map((st, index) => (
                          <div key={index} className="teacher-list-item">
                            <div className="teacher-subject-tag">
                              <BookOpen className="w-4 h-4" />
                              <span>{st.subject}</span>
                            </div>
                            <div className="teacher-detail-meta">
                              <span className="teacher-name">{st.teacher?.name || "Unassigned"}</span>
                              <span className="teacher-email">{st.teacher?.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-subtext">No subject teachers mapped yet.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT CLASS INCHARGE MODAL */}
      {isInchargeModalOpen && (
        <div className="modal-overlay" onClick={handleCloseInchargeModal}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingIncharge ? "Edit Class Incharge" : "Create Class Incharge"}</h2>
              <button className="modal-close-btn" onClick={handleCloseInchargeModal}>
                <X className="w-5 h-5" />
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
                    onChange={(e) => setInchargeForm({ ...inchargeForm, name: e.target.value })}
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
                    onChange={(e) => setInchargeForm({ ...inchargeForm, email: e.target.value })}
                    placeholder="rajesh.incharge@school.edu"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {editingIncharge ? "New Password (leave blank to keep unchanged)" : "Password"}
                </label>
                <div className="input-wrapper">
                  <Key className="input-icon" />
                  <input
                    type="password"
                    required={!editingIncharge}
                    value={inchargeForm.password}
                    onChange={(e) => setInchargeForm({ ...inchargeForm, password: e.target.value })}
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Class (Optional)</label>
                <select
                  className="custom-select"
                  value={inchargeForm.assignedClassId}
                  onChange={(e) => setInchargeForm({ ...inchargeForm, assignedClassId: e.target.value })}
                >
                  <option value="">-- No Class Assigned --</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} (Grade {cls.grade})
                    </option>
                  ))}
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
                <button type="submit" className="btn-submit" disabled={isSubmittingForm}>
                  {isSubmittingForm ? (
                    <>
                      <Loader2 className="spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>{editingIncharge ? "Update Incharge" : "Create Incharge"}</span>
                      <Sparkles className="w-4 h-4" />
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

export default PrincipalDashboard;
