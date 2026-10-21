import React, { useState, useEffect } from "react";
import {
  fetchPrincipalClasses,
  fetchClassDetails,
  updateClassSectionsApi,
  assignClassInchargeApi,
  assignSubjectTeacherPrincipalApi,
  deleteSubjectTeacherPrincipalApi,
} from "../../services/api";
import {
  GraduationCap,
  Users,
  BookOpen,
  UserCheck,
  ChevronRight,
  X,
  Mail,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";

const ClassesPage = () => {
  // Helper: returns true if a stored section value matches a section card name.
  // Handles cases like stored "A" matching displayed "Section A", or exact match.
  const sectionMatches = (storedSection, cardName) => {
    if (!storedSection || !cardName) return false;
    if (storedSection === cardName) return true;
    // "Section A" -> last word "A"; "A" stored -> match
    const lastWord = cardName.split(' ').pop();
    return storedSection === lastWord;
  };

  const [classes, setClasses] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  // Class Detail & Sections Modal
  const [selectedClass, setSelectedClass] = useState(null);
  const [isLoadingClassDetail, setIsLoadingClassDetail] = useState(false);
  const [hasSections, setHasSections] = useState(false);
  const [sectionsList, setSectionsList] = useState([]);
  const [isSavingSections, setIsSavingSections] = useState(false);
  const [selectedInchargeId, setSelectedInchargeId] = useState("");
  const [isAssigningIncharge, setIsAssigningIncharge] = useState(false);

  // Subject Teacher Assignment
  const [selectedSubjectTeacherId, setSelectedSubjectTeacherId] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [selectedSectionForSubject, setSelectedSectionForSubject] = useState("");
  const [isAssigningSubjectTeacher, setIsAssigningSubjectTeacher] = useState(false);

  useEffect(() => {
    loadClasses();
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

  const handleOpenClassDetail = async (classId) => {
    setIsLoadingClassDetail(true);
    setSelectedClass(null);
    try {
      const data = await fetchClassDetails(classId);
      setSelectedClass(data.classDetails);
      // classIncharge is populated object with _id, name, email
      setSelectedInchargeId(
        data.classDetails.classIncharge?._id
          ? String(data.classDetails.classIncharge._id)
          : ""
      );
      setHasSections(data.classDetails.hasSections || false);
      setSectionsList(
        data.classDetails.sections && data.classDetails.sections.length > 0
          ? data.classDetails.sections.map((s) => ({
            name: s.name,
            // classIncharge in sections is populated as User object; store its _id string
            classIncharge:
              s.classIncharge && typeof s.classIncharge === "object"
                ? String(s.classIncharge._id)
                : s.classIncharge
                  ? String(s.classIncharge)
                  : "",
          }))
          : []
      );
      // Reset Subject Teacher inputs
      setSelectedSubjectTeacherId("");
      setSubjectInput("");
      setSelectedSectionForSubject("");
    } catch (err) {
      setApiError(
        err.response?.data?.message || "Failed to fetch class details."
      );
    } finally {
      setIsLoadingClassDetail(false);
    }
  };

  const handleAssignSubjectTeacher = async () => {
    if (!selectedClass || !selectedSubjectTeacherId || !subjectInput) return;
    setIsAssigningSubjectTeacher(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const payload = {
        teacherId: selectedSubjectTeacherId,
        subject: subjectInput,
        section: selectedSectionForSubject || (hasSections ? sectionsList[0]?.name : ""),
      };
      const res = await assignSubjectTeacherPrincipalApi(selectedClass._id, payload);
      setSelectedClass(res.classDetails);
      setSelectedSubjectTeacherId("");
      setSubjectInput("");
      setApiSuccess("Subject Teacher assigned successfully!");
      loadClasses();
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to assign Subject Teacher.");
    } finally {
      setIsAssigningSubjectTeacher(false);
    }
  };

  const handleUnassignSubjectTeacher = async (assignmentId, subject, section) => {
    if (!selectedClass || !assignmentId) return;
    if (!window.confirm(`Are you sure you want to unassign subject teacher for ${subject} (${section || "Class"})?`)) return;
    setApiError(null);
    setApiSuccess(null);
    try {
      const res = await deleteSubjectTeacherPrincipalApi(selectedClass._id, assignmentId);
      setSelectedClass(res.classDetails);
      setApiSuccess(`Subject Teacher for ${subject} unassigned successfully!`);
      loadClasses();
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to unassign Subject Teacher.");
    }
  };

  const handleAssignClassIncharge = async (inchargeId) => {
    if (!selectedClass) return;
    setIsAssigningIncharge(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const res = await assignClassInchargeApi(selectedClass._id, inchargeId);
      setSelectedClass(res.classDetails);
      setSelectedInchargeId(res.classDetails.classIncharge?._id || "");
      setApiSuccess("Class Incharge assigned and synchronized across all sections successfully!");
      loadClasses();
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to assign Class Incharge.");
    } finally {
      setIsAssigningIncharge(false);
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
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to save class sections.");
    } finally {
      setIsSavingSections(false);
    }
  };

  return (
    <div className="page-section">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">School Classes</h2>
          <p className="page-subtitle">
            View all classes from LKG to Grade 12, configure sections & incharges.
          </p>
        </div>
        <span className="page-badge">{classes.length} Classes</span>
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

      {/* Classes Grid */}
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
                {cls.hasSections && cls.sections && cls.sections.length > 0 ? (
                  <div className="incharge-highlight-box sections-badge-box">
                    <span className="highlight-label flex-between">
                      <span>Sections ({cls.sections.length})</span>
                      <span className="sections-pill-tag">Multi-Section</span>
                    </span>
                    <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {cls.sections.slice(0, 4).map((sec, i) => (
                        <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px", paddingBottom: "4px", borderBottom: i < Math.min(cls.sections.length, 4) - 1 ? "1px solid #e2e8f0" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                            <span className="sec-chip" style={{ flexShrink: 0 }}>{sec.name}</span>
                            {sec.classIncharge ? (
                              <span style={{ fontSize: "0.72rem", color: "#065f46", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
                                <UserCheck size={11} style={{ display: "inline", marginRight: "3px", verticalAlign: "middle" }} />
                                {sec.classIncharge.name || sec.classIncharge} {sec.classIncharge.teacherId && sec.classIncharge.teacherId !== "N/A" ? `[${sec.classIncharge.teacherId}]` : ""}
                              </span>
                            ) : (
                              <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontStyle: "italic" }}>Unassigned</span>
                            )}
                          </div>
                          {cls.subjectTeachers?.filter(st => sectionMatches(st.section, sec.name)).length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", paddingLeft: "4px" }}>
                              {cls.subjectTeachers.filter(st => sectionMatches(st.section, sec.name)).map((st, idx) => (
                                <span key={idx} style={{ fontSize: "0.65rem", background: "#f3e8ff", color: "#6b21a8", padding: "1px 6px", borderRadius: "8px", border: "1px solid #d8b4fe", whiteSpace: "nowrap" }}>
                                  {st.teacher?.name?.split(" ")[0] || "Unassigned"} {st.teacher?.teacherId && st.teacher.teacherId !== "N/A" ? `[${st.teacher.teacherId}]` : ""} ({st.subject})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {cls.sections.length > 4 && (
                        <span className="sec-chip more" style={{ alignSelf: "flex-start" }}>+{cls.sections.length - 4} more</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="incharge-highlight-box">
                    <span className="highlight-label">Class Incharge</span>
                    {cls.classIncharge ? (
                      <div className="incharge-user-row">
                        <UserCheck className="icon-incharge text-emerald" />
                        <span className="incharge-name">
                          {cls.classIncharge.name} {cls.classIncharge.teacherId && cls.classIncharge.teacherId !== "N/A" ? `[${cls.classIncharge.teacherId}]` : ""}
                        </span>
                      </div>
                    ) : (
                      <span className="unassigned-text">Not Assigned</span>
                    )}
                    {cls.subjectTeachers?.length > 0 && (
                      <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {cls.subjectTeachers.map((st, idx) => (
                          <span key={idx} style={{ fontSize: "0.65rem", background: "#f3e8ff", color: "#6b21a8", padding: "2px 6px", borderRadius: "8px", border: "1px solid #d8b4fe", whiteSpace: "nowrap" }}>
                            {st.teacher?.name?.split(" ")[0] || "Unassigned"} {st.teacher?.teacherId && st.teacher.teacherId !== "N/A" ? `[${st.teacher.teacherId}]` : ""} ({st.subject})
                          </span>
                        ))}
                      </div>
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

      {/* CLASS DETAIL & SECTIONS MODAL */}
      {(selectedClass || isLoadingClassDetail) && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedClass(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
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
                    <X size={20} />
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
                                    <option key={String(inc._id)} value={String(inc._id)}>
                                      {inc.name} [{inc.teacherId || "N/A"}] ({inc.email}){inc.assignedClass ? ` — ${inc.assignedClass}` : ""}
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

                  {/* CLASS INCHARGE */}
                  <div className="detail-section highlight-incharge-section">
                    <div className="section-title-row flex-between" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="flex-align-center gap-2" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ShieldCheck className="w-5 h-5 text-emerald" />
                        <h3>Class Incharge Assignment</h3>
                      </div>
                      {hasSections ? (
                        <span className="badge-featured" style={{ background: "#ede9fe", color: "#6d28d9" }}>Per-Section</span>
                      ) : (
                        <span className="badge-featured">Synchronized</span>
                      )}
                    </div>

                    {hasSections && selectedClass.sections && selectedClass.sections.length > 0 ? (
                      /* Multi-section: use populated selectedClass.sections directly */
                      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "4px" }}>
                          Each section's incharge is managed in the <strong>Class Sections Management</strong> panel above. Save the sections config to apply changes.
                        </p>
                        {selectedClass.sections.map((sec, idx) => {
                          // Use the populated classIncharge object directly from the API response
                          const inc = sec.classIncharge && typeof sec.classIncharge === "object" ? sec.classIncharge : null;
                          return (
                            <div key={idx} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "10px 14px", borderRadius: "8px",
                              background: inc ? "#f0fdf4" : "#fafafa",
                              border: `1px solid ${inc ? "#86efac" : "#e2e8f0"}`
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{
                                  fontWeight: "700", fontSize: "0.8rem",
                                  background: "#e0e7ff", color: "#3730a3",
                                  padding: "2px 10px", borderRadius: "12px"
                                }}>
                                  {sec.name}
                                </span>
                                {inc ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div style={{
                                      width: "28px", height: "28px", borderRadius: "50%",
                                      background: "linear-gradient(135deg,#10b981,#059669)",
                                      display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>
                                      <UserCheck size={14} color="white" />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: "600", fontSize: "0.85rem", color: "#065f46" }}>{inc.name}</div>
                                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{inc.email}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic" }}>
                                    No incharge assigned
                                  </span>
                                )}
                              </div>
                              {inc && (
                                <span style={{
                                  fontSize: "0.72rem", fontWeight: "600",
                                  background: "#dcfce7", color: "#166534",
                                  padding: "2px 8px", borderRadius: "10px"
                                }}>Assigned</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Single-section: show top-level incharge + assign dropdown */
                      <>
                        {selectedClass.classIncharge ? (
                          <div className="incharge-card-detail" style={{ marginBottom: "12px" }}>
                            <div className="incharge-avatar">
                              <UserCheck className="w-6 h-6 text-white" />
                            </div>
                            <div className="incharge-info">
                              <h4>{selectedClass.classIncharge.name}</h4>
                              <span className="incharge-email">
                                <Mail size={13} /> {selectedClass.classIncharge.email}
                              </span>
                            </div>
                            <span className="status-pill active">
                              Assigned Incharge
                            </span>
                          </div>
                        ) : (
                          <div className="no-incharge-notice" style={{ marginBottom: "12px" }}>
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                            <span>No Class Incharge currently assigned to this class.</span>
                          </div>
                        )}

                        {/* Direct Assign Class Incharge Dropdown */}
                        <div className="assign-incharge-wrapper" style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                            Assign / Change Class Incharge:
                          </label>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <select
                              className="custom-select"
                              style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                              value={selectedInchargeId}
                              disabled={isAssigningIncharge}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedInchargeId(val);
                                handleAssignClassIncharge(val);
                              }}
                            >
                              <option value="">-- No Class Incharge Assigned --</option>
                              {selectedClass.availableIncharges?.map((inc) => {
                                return (
                                  <option key={String(inc._id)} value={String(inc._id)}>
                                    {inc.name} ({inc.email}){inc.assignedClass ? ` — Assigned: ${inc.assignedClass}` : ""}
                                  </option>
                                );
                              })}
                            </select>
                            {isAssigningIncharge && <Loader2 className="spinner w-5 h-5 text-emerald" style={{ animation: "spin 1s linear infinite" }} />}
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "6px", marginBottom: 0 }}>
                            Assigning a teacher automatically updates their role to Class Incharge and synchronizes Teachers & Class Incharges sections.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* SUBJECT TEACHERS */}
                  <div className="detail-section">
                    <div className="section-title-row">
                      <Users className="w-5 h-5 text-purple-400" />
                      <h3>Assigned Subject Teachers</h3>
                    </div>

                    {/* Add Assignment Form */}
                    <div className="assign-incharge-wrapper" style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                        Assign Subject Teacher:
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                        {hasSections && selectedClass.sections?.length > 0 && (
                          <select
                            className="custom-select"
                            style={{ flex: 1, minWidth: "120px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                            value={selectedSectionForSubject}
                            onChange={(e) => setSelectedSectionForSubject(e.target.value)}
                            disabled={isAssigningSubjectTeacher}
                          >
                            <option value="">-- Select Section --</option>
                            {selectedClass.sections.map((sec, idx) => (
                              <option key={idx} value={sec.name}>{sec.name}</option>
                            ))}
                          </select>
                        )}
                        <select
                          className="custom-select"
                          style={{ flex: 1, minWidth: "140px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          value={subjectInput}
                          onChange={(e) => setSubjectInput(e.target.value)}
                          disabled={isAssigningSubjectTeacher}
                        >
                          <option value="">-- Select Subject --</option>
                          {[
                            ...new Set([
                              ...(selectedClass.gradeSubjects || []),
                              ...(selectedClass.classSubjects || []),
                              ...(selectedClass.subjectTeachers || []).map((st) => st.subject),
                            ]),
                          ].map((subj, idx) => (
                            <option key={idx} value={subj}>{subj}</option>
                          ))}
                        </select>
                        <select
                          className="custom-select"
                          style={{ flex: 2, minWidth: "200px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          value={selectedSubjectTeacherId}
                          onChange={(e) => setSelectedSubjectTeacherId(e.target.value)}
                          disabled={isAssigningSubjectTeacher}
                        >
                          <option value="">-- Select Teacher --</option>
                          {selectedClass.availableIncharges?.map((inc) => (
                            <option key={String(inc._id)} value={String(inc._id)}>
                              {inc.name} [{inc.teacherId || "N/A"}] ({inc.email})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn-save-sections"
                          style={{ padding: "8px 16px", borderRadius: "6px", whiteSpace: "nowrap", flex: "none" }}
                          onClick={handleAssignSubjectTeacher}
                          disabled={isAssigningSubjectTeacher || !selectedSubjectTeacherId || !subjectInput || (hasSections && !selectedSectionForSubject)}
                        >
                          {isAssigningSubjectTeacher ? <Loader2 className="spinner w-4 h-4" /> : "Assign"}
                        </button>
                      </div>
                    </div>

                    {selectedClass.subjectTeachers && selectedClass.subjectTeachers.length > 0 ? (
                      <div className="teachers-list">
                        {selectedClass.subjectTeachers.map((st, index) => (
                          <div key={st.assignmentId || index} className="teacher-list-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                              <div className="teacher-subject-tag">
                                <BookOpen className="w-4 h-4" />
                                <span>{st.subject}</span>
                              </div>
                              {st.section && (
                                <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#4f46e5", background: "#e0e7ff", padding: "2px 8px", borderRadius: "10px" }}>
                                  {st.section.startsWith("Sec") ? st.section : `Section ${st.section}`}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                              <div className="teacher-detail-meta" style={{ textAlign: "right" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                                  <span className="teacher-name">{st.teacher?.name || "Unassigned"}</span>
                                  {st.teacher?.teacherId && (
                                    <span style={{ fontFamily: "monospace", fontSize: "0.75rem", background: "#f1f5f9", padding: "1px 6px", borderRadius: "4px", color: "#334155", fontWeight: "600" }}>
                                      {st.teacher.teacherId}
                                    </span>
                                  )}
                                </div>
                                <span className="teacher-email">{st.teacher?.email}</span>
                              </div>
                              <button
                                type="button"
                                className="btn-action delete"
                                style={{ padding: "6px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer" }}
                                title="Unassign Subject Teacher"
                                onClick={() => handleUnassignSubjectTeacher(st.assignmentId, st.subject, st.section)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-subtext">
                        No subject teachers mapped yet. Use the form above to assign teachers.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
