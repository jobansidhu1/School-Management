import React, { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/useAppDispatch";
import {
  getTeachersThunk,
  createTeacherThunk,
  updateTeacherThunk,
  deleteTeacherThunk,
  bulkImportTeachersThunk,
  addLocalTeachers,
  updateLocalTeacherRole,
  addSingleLocalTeacher,
  deleteLocalTeacher,
} from "../../../redux/slices/teacherSlice";
import {
  Users,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { fetchPrincipalClasses } from "../../../services/api";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const TeacherList = () => {
  const dispatch = useAppDispatch();
  const { teachers } = useAppSelector((state) => state.teachers);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [availableClasses, setAvailableClasses] = useState([]);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [fileDataPreview, setFileDataPreview] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef(null);

  // Add/Edit Manual Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    teacherId: "",
    fullName: "",
    email: "",
    contactNumber: "",
    qualification: "",
    gender: "Male",
    role: "SUBJECT_TEACHER",
    assignedClass: "",
  });

  // Local notifications
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    dispatch(getTeachersThunk());
    fetchPrincipalClasses()
      .then((data) => setAvailableClasses(data.classes || []))
      .catch(() => {});
  }, [dispatch]);

  const showToast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Process imported rows from CSV or XLSX
  const processRawRows = (rows, fileTitle) => {
    if (!rows || rows.length === 0) {
      setImportError("The uploaded file is empty.");
      return;
    }

    const formatted = rows.map((row, idx) => {
      // Find keys flexibly
      const keys = Object.keys(row);
      const getKeyVal = (possibleNames) => {
        const foundKey = keys.find((k) =>
          possibleNames.some((p) => k.toLowerCase().trim() === p.toLowerCase())
        );
        return foundKey ? String(row[foundKey] || "").trim() : "";
      };

      const idVal = getKeyVal(["id", "teacher id", "teacherid", "tch_id", "code", "emp id"]) || `TCH00${idx + 5}`;
      const nameVal = getKeyVal(["name", "teacher name", "fullname", "full name", "name of teacher"]) || `Teacher ${idx + 1}`;
      const emailVal = getKeyVal(["email", "email address", "emailid", "mail"]) || `${nameVal.toLowerCase().replace(/\s+/g, ".")}@example.com`;
      const phoneVal = getKeyVal(["phone number", "phone", "contact no.", "contact no", "contact number", "mobile"]) || "9810000000";
      const qualVal = getKeyVal(["qualification", "education", "degree", "qualifications"]) || "B.Ed";
      const genderVal = getKeyVal(["gender", "sex"]) || "Male";
      const rawRole = getKeyVal(["role", "teacher role", "designation", "role type"]);

      let roleVal = "SUBJECT_TEACHER";
      if (rawRole) {
        const lowerRole = rawRole.toLowerCase();
        if (lowerRole.includes("incharge") || lowerRole.includes("class")) {
          roleVal = "CLASS_INCHARGE";
        } else if (lowerRole.includes("subject") || lowerRole.includes("teacher")) {
          roleVal = "SUBJECT_TEACHER";
        }
      }

      return {
        _id: `imp-${Date.now()}-${idx}`,
        teacherId: idVal,
        fullName: nameVal,
        email: emailVal,
        contactNumber: phoneVal,
        qualification: qualVal,
        gender: genderVal,
        role: roleVal,
      };
    });

    setFileDataPreview(formatted);
    setFileName(fileTitle);
    setImportError("");
  };

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError("");
    const fileExt = file.name.split(".").pop().toLowerCase();

    if (fileExt === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processRawRows(results.data, file.name);
        },
        error: (err) => {
          setImportError(`CSV Parsing Error: ${err.message}`);
        },
      });
    } else if (fileExt === "xlsx" || fileExt === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const workbook = XLSX.read(bstr, { type: "binary" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          processRawRows(rawData, file.name);
        } catch (err) {
          setImportError(`Excel Parsing Error: ${err.message}`);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setImportError("Please upload a valid CSV (.csv) or Excel (.xlsx, .xls) file.");
    }
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    if (fileDataPreview.length === 0) return;
    setImporting(true);

    try {
      // Send to server or update local state
      dispatch(addLocalTeachers(fileDataPreview));
      dispatch(bulkImportTeachersThunk(fileDataPreview));
      showToast(`Successfully imported ${fileDataPreview.length} teachers!`, "success");
      setIsImportModalOpen(false);
      setFileDataPreview([]);
      setFileName("");
    } catch (err) {
      showToast("Import error occurred.", "error");
    } finally {
      setImporting(false);
    }
  };

  // Role Change Modal State
  const [selectClassModalOpen, setSelectClassModalOpen] = useState(false);
  const [teacherToAssignClass, setTeacherToAssignClass] = useState(null);
  const [selectedClassIdForRole, setSelectedClassIdForRole] = useState("");
  const [selectedSectionForRole, setSelectedSectionForRole] = useState("");

  // Build flat list of class+section options for the assign-class dropdown
  const classWithSectionOptions = availableClasses.flatMap((cls) => {
    if (cls.hasSections && cls.sections && cls.sections.length > 0) {
      return cls.sections.map((sec) => ({
        classId: cls._id,
        className: cls.name,
        grade: cls.grade,
        section: sec.name,
        label: `${cls.name} – ${sec.name}`,
        value: `${cls._id}__${sec.name}`,
      }));
    }
    // Single section — default to "A"
    return [{
      classId: cls._id,
      className: cls.name,
      grade: cls.grade,
      section: cls.section || "A",
      label: `${cls.name} – Section ${cls.section || "A"}`,
      value: `${cls._id}__${cls.section || "A"}`,
    }];
  });

  // Handle Role Change in table
  const handleRoleToggle = async (teacher, newRole) => {
    if (newRole === "CLASS_INCHARGE") {
      setTeacherToAssignClass(teacher);
      setSelectedClassIdForRole("");
      setSelectedSectionForRole("");
      setSelectClassModalOpen(true);
    } else {
      dispatch(updateLocalTeacherRole({ id: teacher._id || teacher.teacherId, role: newRole }));
      if (teacher._id && !teacher._id.startsWith("demo") && !teacher._id.startsWith("imp")) {
        await dispatch(updateTeacherThunk({ id: teacher._id, teacherData: { role: newRole } }));
        dispatch(getTeachersThunk());
      }
      showToast(`Role updated for ${teacher.fullName} to Subject Teacher`, "success");
    }
  };

  const handleConfirmRoleWithClass = async () => {
    if (!teacherToAssignClass || !selectedClassIdForRole) return;
    const classObj = availableClasses.find((c) => c._id === selectedClassIdForRole);
    const className = classObj
      ? selectedSectionForRole
        ? `${classObj.name} – Section ${selectedSectionForRole}`
        : classObj.name
      : "";

    dispatch(updateLocalTeacherRole({ id: teacherToAssignClass._id || teacherToAssignClass.teacherId, role: "CLASS_INCHARGE" }));
    if (teacherToAssignClass._id && !teacherToAssignClass._id.startsWith("demo") && !teacherToAssignClass._id.startsWith("imp")) {
      await dispatch(updateTeacherThunk({
        id: teacherToAssignClass._id,
        teacherData: {
          role: "CLASS_INCHARGE",
          assignedClassId: selectedClassIdForRole,
          assignedClass: className,
          assignedSection: selectedSectionForRole || "A",
        },
      }));
      dispatch(getTeachersThunk());
    }
    showToast(`Assigned ${teacherToAssignClass.fullName} as Class Incharge for ${className}!`, "success");
    setSelectClassModalOpen(false);
    setTeacherToAssignClass(null);
    setSelectedClassIdForRole("");
    setSelectedSectionForRole("");
  };

  // Handle Open Add/Edit Modal
  const handleOpenFormModal = (teacher = null) => {
    setEditingTeacher(teacher);
    if (teacher) {
      setFormData({
        teacherId: teacher.teacherId || "",
        fullName: teacher.fullName || "",
        email: teacher.email || "",
        contactNumber: teacher.contactNumber || "",
        qualification: teacher.qualification || "",
        gender: teacher.gender || "Male",
        role: teacher.role || "SUBJECT_TEACHER",
        assignedClass: teacher.assignedClass || "",
      });
    } else {
      setFormData({
        teacherId: `TCH00${(teachers?.length || 0) + 1}`,
        fullName: "",
        email: "",
        contactNumber: "",
        qualification: "",
        gender: "Male",
        role: "SUBJECT_TEACHER",
        assignedClass: "",
      });
    }
    setIsFormModalOpen(true);
  };

  // Save manual teacher
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      showToast("Full Name and Email are required.", "error");
      return;
    }

    if (editingTeacher) {
      dispatch(updateLocalTeacherRole({ id: editingTeacher._id, role: formData.role }));
      if (editingTeacher._id && !editingTeacher._id.startsWith("demo") && !editingTeacher._id.startsWith("imp")) {
        await dispatch(updateTeacherThunk({ id: editingTeacher._id, teacherData: formData }));
        dispatch(getTeachersThunk());
      }
      showToast("Teacher record updated successfully!", "success");
    } else {
      const newTeacher = {
        _id: `man-${Date.now()}`,
        ...formData,
      };
      dispatch(addSingleLocalTeacher(newTeacher));
      await dispatch(createTeacherThunk(formData));
      dispatch(getTeachersThunk());
      showToast("New teacher added successfully!", "success");
    }

    setIsFormModalOpen(false);
  };

  // Delete Teacher
  const handleDeleteTeacher = (teacher) => {
    if (window.confirm(`Are you sure you want to delete teacher ${teacher.fullName}?`)) {
      dispatch(deleteLocalTeacher(teacher._id || teacher.teacherId));
      if (teacher._id && !teacher._id.startsWith("demo") && !teacher._id.startsWith("imp")) {
        dispatch(deleteTeacherThunk(teacher._id));
      }
      showToast("Teacher deleted.", "success");
    }
  };

  // Export Data to CSV
  const handleExportData = () => {
    const exportRows = filteredTeachers.map((t) => ({
      ID: t.teacherId,
      Name: t.fullName,
      Email: t.email,
      "Phone Number": t.contactNumber,
      Qualification: t.qualification,
      Gender: t.gender,
      Role: t.role === "CLASS_INCHARGE" ? "Class Incharge" : "Subject Teacher",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");
    XLSX.writeFile(workbook, `Teachers_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Filtered List
  const filteredTeachers = (teachers || []).filter((t) => {
    const matchesSearch =
      (t.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.teacherId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.contactNumber || "").includes(searchTerm) ||
      (t.qualification || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === "ALL"
        ? true
        : roleFilter === "CLASS_INCHARGE"
        ? t.role === "CLASS_INCHARGE"
        : t.role !== "CLASS_INCHARGE";

    const matchesGender =
      genderFilter === "ALL" ? true : (t.gender || "").toLowerCase() === genderFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesGender;
  });

  // Calculate statistics
  const totalCount = teachers?.length || 0;
  const classInchargeCount = teachers?.filter((t) => t.role === "CLASS_INCHARGE").length || 0;
  const subjectTeacherCount = totalCount - classInchargeCount;

  return (
    <div className="tch-container">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`tch-toast ${toastMsg.type}`}>
          {toastMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toastMsg.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="tch-header">
        <div className="tch-header-left">
          <div className="tch-icon-badge">
            <Users size={24} />
          </div>
          <div>
            <h1 className="tch-title">Teachers Directory &amp; Management</h1>
            <p className="tch-subtitle">
              Import CSV/XLSX file, view tabular record, and toggle roles as Class Incharge or Subject Teacher.
            </p>
          </div>
        </div>

        <div className="tch-header-actions">
          <button className="tch-btn tch-btn-secondary" onClick={() => setIsImportModalOpen(true)}>
            <Upload size={16} />
            <span>Import CSV / Excel</span>
          </button>
          <button className="tch-btn tch-btn-outline" onClick={handleExportData}>
            <Download size={16} />
            <span>Export Data</span>
          </button>
          <button className="tch-btn tch-btn-primary" onClick={() => handleOpenFormModal()}>
            <Plus size={16} />
            <span>Add Teacher</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="tch-stats-grid">
        <div className="tch-stat-card">
          <div className="tch-stat-icon blue">
            <Users size={20} />
          </div>
          <div>
            <span className="tch-stat-value">{totalCount}</span>
            <span className="tch-stat-label">Total Teachers</span>
          </div>
        </div>

        <div className="tch-stat-card">
          <div className="tch-stat-icon purple">
            <UserCheck size={20} />
          </div>
          <div>
            <span className="tch-stat-value">{classInchargeCount}</span>
            <span className="tch-stat-label">Class Incharges</span>
          </div>
        </div>

        <div className="tch-stat-card">
          <div className="tch-stat-icon green">
            <User size={20} />
          </div>
          <div>
            <span className="tch-stat-value">{subjectTeacherCount}</span>
            <span className="tch-stat-label">Subject Teachers</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="tch-toolbar">
        <div className="tch-search-box">
          <Search size={18} className="tch-search-icon" />
          <input
            type="text"
            placeholder="Search by ID, Name, Email, Phone, Qualification..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="tch-clear-btn" onClick={() => setSearchTerm("")}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="tch-filters">
          <div className="tch-filter-item">
            <Filter size={15} />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="ALL">All Roles</option>
              <option value="CLASS_INCHARGE">Class Incharge</option>
              <option value="SUBJECT_TEACHER">Subject Teacher (Default)</option>
            </select>
          </div>

          <div className="tch-filter-item">
            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
              <option value="ALL">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Tabular View */}
      <div className="tch-table-card">
        <div className="tch-table-wrapper">
          <table className="tch-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Qualification</th>
                <th>Gender</th>
                <th>Role</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((tch) => {
                  const isClassIncharge = tch.role === "CLASS_INCHARGE";
                  return (
                    <tr key={tch._id || tch.teacherId} className={isClassIncharge ? "highlight-row" : ""}>
                      <td className="font-mono-id">{tch.teacherId}</td>
                      <td>
                        <div className="tch-user-cell">
                          <div className={`tch-avatar ${tch.gender === "Female" ? "female" : "male"}`}>
                            {tch.fullName ? tch.fullName.charAt(0).toUpperCase() : "T"}
                          </div>
                          <div>
                            <span className="tch-user-name">{tch.fullName}</span>
                            {tch.assignedClass && (
                              <span style={{ fontSize: "0.72rem", background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "10px", marginLeft: "6px", fontWeight: "600" }}>
                                {tch.assignedClass}
                              </span>
                            )}
                            {tch.assignedSubjects && tch.assignedSubjects.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                                {tch.assignedSubjects.map((subj, sIdx) => (
                                  <span key={sIdx} style={{ fontSize: "0.68rem", background: "#f3e8ff", color: "#6b21a8", padding: "1px 6px", borderRadius: "8px", border: "1px solid #d8b4fe" }}>
                                    {subj}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="tch-email-cell">
                        <Mail size={13} />
                        <span>{tch.email}</span>
                      </td>
                      <td className="tch-phone-cell">
                        <Phone size={13} />
                        <span>{tch.contactNumber || "N/A"}</span>
                      </td>
                      <td>
                        <span className="qual-badge">{tch.qualification || "B.Ed"}</span>
                      </td>
                      <td>
                        <span className={`gender-chip ${tch.gender ? tch.gender.toLowerCase() : "male"}`}>
                          {tch.gender || "Male"}
                        </span>
                      </td>
                      <td>
                        {/* Interactive Role Toggle */}
                        <div className="tch-role-select-wrapper">
                          <select
                            className={`tch-role-select ${isClassIncharge ? "incharge" : "subject"}`}
                            value={tch.role || "SUBJECT_TEACHER"}
                            onChange={(e) => handleRoleToggle(tch, e.target.value)}
                          >
                            <option value="CLASS_INCHARGE">Class Incharge</option>
                            <option value="SUBJECT_TEACHER">Subject Teacher (Default)</option>
                          </select>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="tch-action-buttons">
                          <button
                            className="tch-action-btn edit"
                            onClick={() => handleOpenFormModal(tch)}
                            title="Edit Details"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            className="tch-action-btn delete"
                            onClick={() => handleDeleteTeacher(tch)}
                            title="Delete Teacher"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="tch-empty-td">
                    <div className="tch-empty-state">
                      <Users size={36} />
                      <p className="empty-title">No teachers found</p>
                      <p className="empty-desc">
                        {searchTerm
                          ? "No matching records found. Try adjusting your search query or filters."
                          : "Click 'Import CSV / Excel' or 'Add Teacher' to create teacher records."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── IMPORT CSV / EXCEL MODAL ── */}
      {isImportModalOpen && (
        <div className="tch-modal-overlay">
          <div className="tch-modal-content large">
            <div className="tch-modal-header">
              <div className="modal-title-wrap">
                <FileSpreadsheet className="modal-title-icon" />
                <div>
                  <h2>Import Teachers Data</h2>
                  <p>Upload a .csv or .xlsx / .xls file to bulk import teachers</p>
                </div>
              </div>
              <button className="tch-modal-close" onClick={() => setIsImportModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="tch-modal-body">
              {/* File Drop Area */}
              <div
                className="tch-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <Upload size={32} className="dropzone-icon" />
                <p className="dropzone-title">
                  {fileName ? `File Selected: ${fileName}` : "Click to select CSV or Excel (.xlsx) file"}
                </p>
                <p className="dropzone-hint">
                  Expected Columns: <strong>ID, Name, Email, Phone Number, Qualification, Gender, Role</strong>
                </p>
                <p className="dropzone-note">
                  * If role is not specified, teachers are automatically set as <strong>Subject Teacher</strong> by default.
                </p>
              </div>

              {importError && (
                <div className="tch-error-banner">
                  <AlertCircle size={16} />
                  <span>{importError}</span>
                </div>
              )}

              {/* Data Preview */}
              {fileDataPreview.length > 0 && (
                <div className="tch-preview-section">
                  <div className="preview-header">
                    <h3>Preview Data ({fileDataPreview.length} rows detected)</h3>
                    <span className="preview-badge">Ready for import</span>
                  </div>

                  <div className="tch-preview-table-wrapper">
                    <table className="tch-table compact">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone Number</th>
                          <th>Qualification</th>
                          <th>Gender</th>
                          <th>Assigned Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fileDataPreview.slice(0, 10).map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.teacherId}</td>
                            <td>{row.fullName}</td>
                            <td>{row.email}</td>
                            <td>{row.contactNumber}</td>
                            <td>{row.qualification}</td>
                            <td>{row.gender}</td>
                            <td>
                              <span className={`role-badge ${row.role === "CLASS_INCHARGE" ? "incharge" : "subject"}`}>
                                {row.role === "CLASS_INCHARGE" ? "Class Incharge" : "Subject Teacher (Default)"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {fileDataPreview.length > 10 && (
                      <p className="preview-more-count">
                        + {fileDataPreview.length - 10} more rows will be imported...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="tch-modal-footer">
              <button
                className="tch-btn tch-btn-outline"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setFileDataPreview([]);
                  setFileName("");
                }}
              >
                Cancel
              </button>
              <button
                className="tch-btn tch-btn-primary"
                disabled={fileDataPreview.length === 0 || importing}
                onClick={handleConfirmImport}
              >
                {importing ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirm &amp; Import ({fileDataPreview.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT TEACHER MODAL ── */}
      {isFormModalOpen && (
        <div className="tch-modal-overlay">
          <div className="tch-modal-content">
            <div className="tch-modal-header">
              <div className="modal-title-wrap">
                <UserCheck className="modal-title-icon" />
                <h2>{editingTeacher ? "Edit Teacher Details" : "Add New Teacher"}</h2>
              </div>
              <button className="tch-modal-close" onClick={() => setIsFormModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="tch-modal-body grid-form">
                <div className="form-group">
                  <label>Teacher ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TCH005"
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number / Contact No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 9810000000"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Ed, M.Sc. Mathematics"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Role Assignment</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="SUBJECT_TEACHER">Subject Teacher (Default)</option>
                    <option value="CLASS_INCHARGE">Class Incharge</option>
                  </select>
                </div>

                {formData.role === "CLASS_INCHARGE" && (
                  <div className="form-group full-width">
                    <label>Assigned Class</label>
                    <select
                      value={formData.assignedClass}
                      onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                    >
                      <option value="">-- Select Class --</option>
                      {availableClasses.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name} (Grade {cls.grade})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="tch-modal-footer">
                <button
                  type="button"
                  className="tch-btn tch-btn-outline"
                  onClick={() => setIsFormModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="tch-btn tch-btn-primary">
                  {editingTeacher ? "Save Changes" : "Add Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SELECT CLASS MODAL WHEN TOGGLING ROLE TO CLASS INCHARGE ── */}
      {selectClassModalOpen && teacherToAssignClass && (
        <div className="tch-modal-overlay">
          <div className="tch-modal-content">
            <div className="tch-modal-header">
              <div className="modal-title-wrap">
                <UserCheck className="modal-title-icon" />
                <h2>Assign Class for {teacherToAssignClass.fullName}</h2>
              </div>
              <button className="tch-modal-close" onClick={() => setSelectClassModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="tch-modal-body">
              <p style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "16px" }}>
                Please select the class that <strong>{teacherToAssignClass.fullName}</strong> will be responsible for as Class Incharge.
              </p>

              <div className="form-group">
                <label style={{ fontWeight: "600", marginBottom: "6px", display: "block" }}>Select Class &amp; Section</label>
                <select
                  className="custom-select"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  value={selectedClassIdForRole ? `${selectedClassIdForRole}__${selectedSectionForRole}` : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setSelectedClassIdForRole("");
                      setSelectedSectionForRole("");
                      return;
                    }
                    const [classId, section] = val.split("__");
                    setSelectedClassIdForRole(classId);
                    setSelectedSectionForRole(section || "A");
                  }}
                >
                  <option value="">-- Choose Class &amp; Section --</option>
                  {classWithSectionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="tch-modal-footer">
              <button
                type="button"
                className="tch-btn tch-btn-outline"
                onClick={() => setSelectClassModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tch-btn tch-btn-primary"
                disabled={!selectedClassIdForRole}
                onClick={handleConfirmRoleWithClass}
              >
                Confirm &amp; Assign Class Incharge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherList;
