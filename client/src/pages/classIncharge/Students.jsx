import React, { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppDispatch";
import {
  getStudentsThunk,
  createStudentThunk,
  updateStudentThunk,
  deleteStudentThunk,
  bulkImportStudentsThunk,
  addSingleLocalStudent,
  updateLocalStudent,
  deleteLocalStudent,
} from "../../redux/slices/studentSlice";
import {
  Users,
  Upload,
  Download,
  Plus,
  Search,
  Trash2,
  Edit,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const Students = () => {
  const dispatch = useAppDispatch();
  const { students, loading } = useAppSelector((state) => state.students);
  const [searchTerm, setSearchTerm] = useState("");

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [fileDataPreview, setFileDataPreview] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef(null);

  // Add/Edit Manual Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
    rollno: "",
    dob: "",
    age: "",
    gender: "Male",
    address: "",
    guardianNo: "",
    username: "",
    classStandard: "",
  });

  // Local notifications
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    dispatch(getStudentsThunk());
  }, [dispatch]);

  // Auto-generate username: first 3 letters from name + classStandard + section + rollno (e.g. job12b13)
  const generateUsername = (classStandard, name, rollno, section = "") => {
    const nameClean = (name || "").replace(/[^a-zA-Z]/g, "");
    const namePart = nameClean.slice(0, 3).toLowerCase();
    const classClean = (classStandard || "")
      .toString()
      .toLowerCase()
      .replace(/class/g, "")
      .replace(/th|st|nd|rd/g, "")
      .replace(/[^0-9a-z]/g, "");
    const secClean = (section || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    const rollClean = (rollno || "")
      .toString()
      .replace(/[^0-9a-zA-Z]/g, "")
      .toLowerCase();

    return `${namePart}${classClean}${secClean}${rollClean}` || namePart;
  };

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
      const keys = Object.keys(row);
      const getKeyVal = (possibleNames) => {
        const foundKey = keys.find((k) =>
          possibleNames.some((p) => k.toLowerCase().trim() === p.toLowerCase())
        );
        return foundKey !== undefined && row[foundKey] !== undefined && row[foundKey] !== null 
          ? String(row[foundKey]).trim() 
          : "";
      };

      let idVal = getKeyVal(["id", "student id", "studentid"]);
      if (idVal && !idVal.toUpperCase().startsWith("STU")) {
        idVal = `STU${idVal.toString().padStart(3, "0")}`;
      } else if (!idVal) {
        idVal = `STU${String(idx + 1).padStart(3, "0")}`;
      }

      const nameVal = getKeyVal(["student name", "name", "fullname"]) || `Student ${idx + 1}`;
      const rawRollNo = getKeyVal(["rollno", "roll no", "roll number"]);
      const rollNoVal = rawRollNo !== "" ? rawRollNo : `R${idx + 1}`;
      const dobVal = getKeyVal(["dob", "date of birth", "birth date"]) || "";
      const ageVal = getKeyVal(["age"]) || "";
      const genderVal = getKeyVal(["gender", "sex"]) || "Male";
      const addressVal = getKeyVal(["address", "location"]) || "";
      const guardianNoVal = getKeyVal(["gardian no", "guardian no", "guardian number", "parent contact"]) || "";
      const classStandardValRaw = getKeyVal(["class", "standard", "grade", "class standard"]) || "";
      const sectionVal = getKeyVal(["section", "sec"]) || "";
      const classStandardVal = classStandardValRaw + (sectionVal ? " " + sectionVal : "");

      return {
        _id: `imp-${Date.now()}-${idx}`,
        studentId: idVal,
        studentName: nameVal,
        rollno: rollNoVal,
        dob: dobVal,
        age: ageVal,
        gender: genderVal,
        address: addressVal,
        guardianNo: guardianNoVal,
        classStandard: classStandardVal,
        username: generateUsername(classStandardVal, nameVal, rollNoVal),
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
      // Send to backend — the thunk fulfilled handler updates Redux state automatically
      const result = await dispatch(bulkImportStudentsThunk(fileDataPreview)).unwrap();
      showToast(`Successfully imported ${result.students?.length || fileDataPreview.length} students!`, "success");
      setIsImportModalOpen(false);
      setFileDataPreview([]);
      setFileName("");
      // Refresh from DB to ensure state is fully in sync with DB
      dispatch(getStudentsThunk());
    } catch (err) {
      showToast(err.message || err || "Import error occurred.", "error");
    } finally {
      setImporting(false);
    }
  };

  // Handle Open Add/Edit Modal
  const handleOpenFormModal = (student = null) => {
    setEditingStudent(student);
    if (student) {
      setFormData({
        studentId: student.studentId || "",
        studentName: student.studentName || "",
        rollno: student.rollno || "",
        dob: student.dob || "",
        age: student.age || "",
        gender: student.gender || "Male",
        address: student.address || "",
        guardianNo: student.guardianNo || "",
        classStandard: student.classStandard || "",
      });
    } else {
      // Find next sequential STU ID
      const existingNums = (students || [])
        .map((s) => {
          const m = String(s.studentId || "").match(/^STU(\d+)$/i);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => n > 0);
      const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
      setFormData({
        studentId: `STU${String(nextNum).padStart(3, "0")}`,
        studentName: "",
        rollno: "",
        dob: "",
        age: "",
        gender: "Male",
        address: "",
        guardianNo: "",
        classStandard: "",
      });
    }
    setIsFormModalOpen(true);
  };

  // Save manual student
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentName || !formData.rollno) {
      showToast("Student Name and Roll No are required.", "error");
      return;
    }

    try {
      const studentPayload = {
        ...formData,
        username: formData.username || generateUsername(formData.classStandard, formData.studentName, formData.rollno),
      };

      if (editingStudent) {
        dispatch(updateLocalStudent({ id: editingStudent._id, data: studentPayload }));
        await dispatch(updateStudentThunk({ id: editingStudent._id, studentData: studentPayload })).unwrap();
        showToast("Student record updated successfully!", "success");
      } else {
        const newStudent = {
          _id: `man-${Date.now()}`,
          ...studentPayload,
        };
        dispatch(addSingleLocalStudent(newStudent));
        await dispatch(createStudentThunk(studentPayload)).unwrap();
        showToast("New student added successfully!", "success");
      }
      dispatch(getStudentsThunk());
      setIsFormModalOpen(false);
    } catch (err) {
      showToast(err.error || err.message || "Error saving student.", "error");
    }
  };

  // Delete Student
  const handleDeleteStudent = async (student) => {
    if (window.confirm(`Are you sure you want to delete student ${student.studentName}?`)) {
      try {
        dispatch(deleteLocalStudent(student._id));
        await dispatch(deleteStudentThunk(student._id)).unwrap();
        showToast("Student deleted.", "success");
      } catch (err) {
        showToast(err.message || "Error deleting student.", "error");
      }
    }
  };

  // Export Data to CSV
  const handleExportData = () => {
    const exportRows = filteredStudents.map((s) => ({
      ID: s.studentId,
      "Student Name": s.studentName,
      "Roll No": s.rollno,
      DOB: s.dob,
      Age: s.age,
      Gender: s.gender,
      Address: s.address,
      "Guardian No": s.guardianNo,
      Class: s.classStandard,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, `Students_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Filtered List - Sorted in sequence by student ID (STU001, STU002, ...)
  const filteredStudents = (students || [])
    .filter((s) => {
      return (
        (s.studentName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.rollno || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.studentId || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      const idA = String(a.studentId || "");
      const idB = String(b.studentId || "");
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
    });

  const totalCount = students?.length || 0;

  return (
    <div className="tch-container" style={{ padding: "24px" }}>
      {toastMsg && (
        <div className={`tch-toast ${toastMsg.type}`}>
          {toastMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toastMsg.msg}</span>
        </div>
      )}

      <div className="tch-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems: "center" }}>
        <div className="tch-header-left" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div className="tch-icon-badge" style={{ background: "#eff6ff", color: "#3b82f6", padding: "12px", borderRadius: "8px" }}>
            <Users size={24} />
          </div>
          <div>
            <h1 className="tch-title" style={{ margin: 0, fontSize: "1.5rem", color: "#1e293b" }}>Students Directory</h1>
            <p className="tch-subtitle" style={{ margin: 0, color: "#64748b" }}>
              Import CSV/XLSX file, view tabular records, or add students manually.
            </p>
          </div>
        </div>

        <div className="tch-header-actions" style={{ display: "flex", gap: "12px" }}>
          <button className="tch-btn tch-btn-secondary" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => setIsImportModalOpen(true)}>
            <Upload size={16} />
            <span>Import CSV / Excel</span>
          </button>
          <button className="tch-btn tch-btn-outline" style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={handleExportData}>
            <Download size={16} />
            <span>Export Data</span>
          </button>
          <button className="tch-btn tch-btn-primary" style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => handleOpenFormModal()}>
            <Plus size={16} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      <div className="tch-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        <div className="tch-stat-card" style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="tch-stat-icon blue" style={{ background: "#eff6ff", color: "#3b82f6", padding: "12px", borderRadius: "50%" }}>
            <Users size={20} />
          </div>
          <div>
            <div className="tch-stat-value" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{totalCount}</div>
            <div className="tch-stat-label" style={{ color: "#64748b", fontSize: "0.9rem" }}>Total Students</div>
          </div>
        </div>
      </div>

      <div className="tch-toolbar" style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div className="tch-search-box" style={{ display: "flex", alignItems: "center", background: "#fff", padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", width: "300px" }}>
          <Search size={18} className="tch-search-icon" style={{ color: "#94a3b8", marginRight: "8px" }} />
          <input
            type="text"
            placeholder="Search by Name, Roll No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: "none", outline: "none", width: "100%" }}
          />
          {searchTerm && (
            <button className="tch-clear-btn" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setSearchTerm("")}>
              <X size={14} style={{ color: "#94a3b8" }} />
            </button>
          )}
        </div>
      </div>

      <div className="tch-table-card" style={{ background: "#fff", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <div className="tch-table-wrapper" style={{ overflowX: "auto" }}>
          <table className="tch-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "16px", color: "#475569" }}>ID</th>
                <th style={{ padding: "16px", color: "#475569" }}>Student Name</th>
                <th style={{ padding: "16px", color: "#475569" }}>Username</th>
                <th style={{ padding: "16px", color: "#475569" }}>Roll No</th>
                <th style={{ padding: "16px", color: "#475569" }}>DOB</th>
                <th style={{ padding: "16px", color: "#475569" }}>Age</th>
                <th style={{ padding: "16px", color: "#475569" }}>Gender</th>
                <th style={{ padding: "16px", color: "#475569" }}>Address</th>
                <th style={{ padding: "16px", color: "#475569" }}>Guardian No</th>
                <th style={{ padding: "16px", color: "#475569", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
                    <Loader2 size={36} className="spin" style={{ marginBottom: "16px", color: "#3b82f6" }} />
                    <p>Loading students...</p>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student._id || student.studentId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "16px" }}>{student.studentId}</td>
                    <td style={{ padding: "16px", fontWeight: "500", color: "#1e293b" }}>{student.studentName}</td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ background: "#eff6ff", color: "#3b82f6", padding: "3px 10px", borderRadius: "999px", fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 600 }}>
                        {student.username || generateUsername(student.classStandard, student.studentName, student.rollno)}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>{student.rollno}</td>
                    <td style={{ padding: "16px" }}>{student.dob}</td>
                    <td style={{ padding: "16px" }}>{student.age}</td>
                    <td style={{ padding: "16px" }}>{student.gender}</td>
                    <td style={{ padding: "16px" }}>{student.address}</td>
                    <td style={{ padding: "16px" }}>{student.guardianNo}</td>
                    <td style={{ padding: "16px", textAlign: "right" }}>
                      <div className="tch-action-buttons" style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          className="tch-action-btn edit"
                          onClick={() => handleOpenFormModal(student)}
                          title="Edit Details"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#3b82f6" }}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="tch-action-btn delete"
                          onClick={() => handleDeleteStudent(student)}
                          title="Delete Student"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                <td colSpan={9} className="tch-empty-td" style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
                    <div className="tch-empty-state">
                      <Users size={36} style={{ marginBottom: "16px" }} />
                      <p className="empty-title" style={{ fontSize: "1.2rem", color: "#1e293b", margin: "0 0 8px" }}>No students found</p>
                      <p className="empty-desc" style={{ margin: 0 }}>
                        {searchTerm
                          ? "No matching records found. Try adjusting your search query."
                          : "Click 'Import CSV / Excel' or 'Add Student' to create records."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* IMPORT CSV / EXCEL MODAL */}
      {isImportModalOpen && (
        <div className="tch-modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="tch-modal-content large" style={{ background: "#fff", borderRadius: "12px", width: "90%", maxWidth: "800px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="tch-modal-header" style={{ padding: "24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="modal-title-wrap" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <FileSpreadsheet size={24} color="#3b82f6" />
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Import Students Data</h2>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Upload a .csv or .xlsx file to bulk import students</p>
                </div>
              </div>
              <button className="tch-modal-close" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setIsImportModalOpen(false)}>
                <X size={24} color="#64748b" />
              </button>
            </div>

            <div className="tch-modal-body" style={{ padding: "24px", overflowY: "auto" }}>
              <div
                className="tch-dropzone"
                onClick={() => fileInputRef.current?.click()}
                style={{ border: "2px dashed #cbd5e1", borderRadius: "8px", padding: "40px", textAlign: "center", cursor: "pointer", background: "#f8fafc" }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <Upload size={32} color="#94a3b8" style={{ marginBottom: "12px" }} />
                <p style={{ margin: "0 0 8px", fontWeight: "500" }}>
                  {fileName ? `File Selected: ${fileName}` : "Click to select CSV or Excel (.xlsx) file"}
                </p>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
                  Expected Columns: <strong>ID, Student Name, Roll No, Class, DOB, Age, Gender, Address, Guardian No</strong>
                </p>
              </div>

              {importError && (
                <div className="tch-error-banner" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fef2f2", color: "#ef4444", padding: "12px", borderRadius: "8px", marginTop: "16px" }}>
                  <AlertCircle size={16} />
                  <span>{importError}</span>
                </div>
              )}

              {fileDataPreview.length > 0 && (
                <div className="tch-preview-section" style={{ marginTop: "24px" }}>
                  <div className="preview-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Preview Data ({fileDataPreview.length} rows detected)</h3>
                  </div>

                  <div className="tch-preview-table-wrapper" style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                    <table className="tch-table compact" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ padding: "12px" }}>Name</th>
                          <th style={{ padding: "12px" }}>Roll No</th>
                          <th style={{ padding: "12px" }}>DOB</th>
                          <th style={{ padding: "12px" }}>Address</th>
                          <th style={{ padding: "12px" }}>Guardian No</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fileDataPreview.slice(0, 10).map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                            <td style={{ padding: "12px" }}>{row.studentName}</td>
                            <td style={{ padding: "12px" }}>{row.rollno}</td>
                            <td style={{ padding: "12px" }}>{row.dob}</td>
                            <td style={{ padding: "12px" }}>{row.address}</td>
                            <td style={{ padding: "12px" }}>{row.guardianNo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="tch-modal-footer" style={{ padding: "24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                className="tch-btn tch-btn-outline"
                style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}
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
                style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", opacity: fileDataPreview.length === 0 ? 0.5 : 1 }}
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

      {/* ADD / EDIT STUDENT MODAL */}
      {isFormModalOpen && (
        <div className="tch-modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="tch-modal-content" style={{ background: "#fff", borderRadius: "12px", width: "90%", maxWidth: "600px", display: "flex", flexDirection: "column" }}>
            <div className="tch-modal-header" style={{ padding: "24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="modal-title-wrap" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Users size={24} color="#3b82f6" />
                <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{editingStudent ? "Edit Student Details" : "Add New Student"}</h2>
              </div>
              <button className="tch-modal-close" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setIsFormModalOpen(false)}>
                <X size={24} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="tch-modal-body grid-form" style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", maxHeight: "60vh", overflowY: "auto" }}>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: "500", color: "#475569" }}>Student Name</label>
                  <input
                    type="text"
                    required
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    value={formData.studentName}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData({ ...formData, studentName: newName, username: generateUsername(formData.classStandard, newName, formData.rollno) });
                    }}
                  />
                </div>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: "500", color: "#475569" }}>Roll No</label>
                  <input
                    type="text"
                    required
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    value={formData.rollno}
                    onChange={(e) => {
                      const newRoll = e.target.value;
                      setFormData({ ...formData, rollno: newRoll, username: generateUsername(formData.classStandard, formData.studentName, newRoll) });
                    }}
                  />
                </div>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "span 2" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: "500", color: "#475569" }}>Class / Standard</label>
                  <input
                    type="text"
                    placeholder="e.g. 12"
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    value={formData.classStandard}
                    onChange={(e) => {
                      const newClass = e.target.value;
                      setFormData({ ...formData, classStandard: newClass, username: generateUsername(newClass, formData.studentName, formData.rollno) });
                    }}
                  />
                </div>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "span 2" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: "500", color: "#475569" }}>Auto-Generated Username</label>
                  <input
                    type="text"
                    readOnly
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#3b82f6", fontFamily: "monospace", fontWeight: 600, cursor: "not-allowed" }}
                    value={formData.username || generateUsername(formData.classStandard, formData.studentName, formData.rollno)}
                  />
                </div>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: "500", color: "#475569" }}>Date of Birth (DOB)</label>
                  <input
                    type="date"
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    value={formData.dob ? (formData.dob.split("-").length === 3 ? (formData.dob.split("-")[0].length === 4 ? formData.dob : formData.dob.split("-").reverse().join("-")) : "") : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const parts = val.split("-");
                        setFormData({ ...formData, dob: `${parts[2]}-${parts[1]}-${parts[0]}` });
                      } else {
                        setFormData({ ...formData, dob: "" });
                      }
                    }}
                  />
                </div>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: "500", color: "#475569" }}>Age</label>
                  <input
                    type="number"
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: "500", color: "#475569" }}>Gender</label>
                  <select
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: "500", color: "#475569" }}>Guardian No</label>
                  <input
                    type="text"
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    value={formData.guardianNo}
                    onChange={(e) => setFormData({ ...formData, guardianNo: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: "500", color: "#475569" }}>Address</label>
                  <textarea
                    rows={3}
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "none" }}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="tch-modal-footer" style={{ padding: "24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  className="tch-btn tch-btn-outline"
                  style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}
                  onClick={() => setIsFormModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tch-btn tch-btn-primary"
                  style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                >
                  <CheckCircle2 size={16} />
                  <span>{editingStudent ? "Save Changes" : "Add Student"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
