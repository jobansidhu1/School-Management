import React, { useState, useEffect, useMemo } from "react";
import { Chart } from "react-google-charts";
import { useAppSelector, useAppDispatch } from "../../hooks/useAppDispatch";
import { getStudentsThunk } from "../../redux/slices/studentSlice";
import {
  fetchClassInchargeDashboard,
  fetchDailyAttendanceApi,
  fetchMonthlyAttendanceApi,
  bulkMarkAttendanceApi,
} from "../../services/api";
import {
  UserCheck,
  Mail,
  CheckCircle2,
  BookOpen,
  Users,
  Loader2,
  AlertCircle,
  GraduationCap,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Calendar,
  ShieldCheck,
  BarChart3,
  PieChart as PieChartIcon,
  Check,
  X,
  Clock,
  Save,
  Download,
  Award,
  Filter,
} from "lucide-react";
import * as XLSX from "xlsx";

const ClassInchargeDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { students } = useAppSelector((state) => state.students);
  const totalStudents = students?.length || 0;

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ── Tab Management ──
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "daily_attendance" | "monthly_attendance"

  // ── Daily Attendance State ──
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSection, setSelectedSection] = useState("A");
  const [dailyRoster, setDailyRoster] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceSuccessMsg, setAttendanceSuccessMsg] = useState("");
  const [attendanceErrorMsg, setAttendanceErrorMsg] = useState("");

  // ── Monthly Attendance State ──
  const [monthlyMonth, setMonthlyMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [monthlyData, setMonthlyData] = useState(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [monthlyErrorMsg, setMonthlyErrorMsg] = useState("");

  useEffect(() => {
    loadDashboard();
    dispatch(getStudentsThunk());
  }, [dispatch]);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchClassInchargeDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Export Subject Teachers Roster to Excel
  const handleExportRoster = () => {
    if (!dashboardData?.subjectTeachers || dashboardData.subjectTeachers.length === 0) return;

    const exportRows = dashboardData.subjectTeachers.map((st) => ({
      Subject: st.subject,
      Section: st.section || "A",
      "Teacher Name": st.teacher?.name || "Unassigned",
      "Teacher ID": st.teacher?.teacherId || "N/A",
      Email: st.teacher?.email || "N/A",
      "Academic Year": st.academicYear || dashboardData?.assignedClass?.academicYear || "2025-2026",
      "Class Assigned": dashboardData?.assignedClass?.name || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subject Teachers");
    XLSX.writeFile(workbook, `Class_${dashboardData?.assignedClass?.name || "Incharge"}_Roster.xlsx`);
  };

  // Filtered Subject Teachers
  const filteredTeachers = (dashboardData?.subjectTeachers || []).filter((st) => {
    const matchSubject = (st.subject || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchName = (st.teacher?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchEmail = (st.teacher?.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchSubject || matchName || matchEmail;
  });

  // Students sorted in sequence by Student ID (e.g. STU001, STU002, ...)
  const sortedStudents = [...(students || [])].sort((a, b) => {
    const idA = String(a.studentId || "");
    const idB = String(b.studentId || "");
    return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
  });

  const assignedClassName =
    dashboardData?.assignedClass?.name || user?.assignedClass?.name || "Not Assigned";
  const assignedGrade =
    dashboardData?.assignedClass?.grade || user?.assignedClass?.grade || "N/A";
  const academicYear =
    dashboardData?.assignedClass?.academicYear || "2025-2026";
  const totalTeachers = dashboardData?.totalSubjectTeachers || 0;
  const totalStudentsDisplay = totalStudents;

  // ── Attendance Loading & Handlers ──
  const targetGrade = assignedGrade !== "N/A" ? assignedGrade : assignedClassName?.replace(/[^0-9]/g, "") || assignedClassName;

  const loadDailyAttendance = async () => {
    if (!targetGrade || targetGrade === "Not Assigned") return;
    setLoadingDaily(true);
    setAttendanceErrorMsg("");
    setAttendanceSuccessMsg("");
    try {
      const res = await fetchDailyAttendanceApi({
        classStandard: targetGrade,
        section: selectedSection,
        date: attendanceDate,
      });
      if (res && res.success) {
        setDailyRoster(res.students || []);
        setDailySummary(res.summary || null);
      }
    } catch (err) {
      console.error("loadDailyAttendance error:", err);
      setAttendanceErrorMsg(err.response?.data?.message || "Failed to load daily attendance roster.");
    } finally {
      setLoadingDaily(false);
    }
  };

  const loadMonthlyAttendance = async () => {
    if (!targetGrade || targetGrade === "Not Assigned") return;
    setLoadingMonthly(true);
    setMonthlyErrorMsg("");
    try {
      const res = await fetchMonthlyAttendanceApi({
        classStandard: targetGrade,
        section: selectedSection,
        month: monthlyMonth,
      });
      if (res && res.success) {
        setMonthlyData(res);
      }
    } catch (err) {
      console.error("loadMonthlyAttendance error:", err);
      setMonthlyErrorMsg(err.response?.data?.message || "Failed to load monthly attendance summary.");
    } finally {
      setLoadingMonthly(false);
    }
  };

  useEffect(() => {
    if (activeTab === "daily_attendance") {
      loadDailyAttendance();
    } else if (activeTab === "monthly_attendance") {
      loadMonthlyAttendance();
    }
  }, [activeTab, attendanceDate, selectedSection, monthlyMonth, targetGrade]);

  const handleStatusChange = (studentId, newStatus) => {
    setDailyRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleRemarksChange = (studentId, remarks) => {
    setDailyRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  const handleMarkAll = (status) => {
    setDailyRoster((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    setAttendanceSuccessMsg("");
    setAttendanceErrorMsg("");
    try {
      const records = dailyRoster.map((s) => ({
        studentId: s.studentId,
        date: attendanceDate,
        status: s.status === "Unmarked" ? "Present" : s.status,
        remarks: s.remarks || "",
        classStandard: targetGrade,
        section: selectedSection,
      }));

      const res = await bulkMarkAttendanceApi({
        classStandard: targetGrade,
        section: selectedSection,
        date: attendanceDate,
        records,
      });

      if (res && res.success) {
        setAttendanceSuccessMsg(`Successfully saved attendance records for ${res.count || records.length} student(s) on ${attendanceDate}.`);
        await loadDailyAttendance();
      }
    } catch (err) {
      console.error("Save attendance error:", err);
      setAttendanceErrorMsg(err.response?.data?.message || "Failed to save attendance records.");
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleExportMonthly = () => {
    if (!monthlyData?.students || monthlyData.students.length === 0) return;
    const exportRows = monthlyData.students.map((st) => ({
      "Roll No": st.rollno || "N/A",
      "Student ID": st.studentId,
      "Student Name": st.studentName,
      "Class": st.classStandard,
      "Section": st.section || "A",
      "Present Days": st.presentDays,
      "Absent Days": st.absentDays,
      "Late Days": st.lateDays,
      "Half Days": st.halfDays,
      "Total Marked Days": st.totalDays,
      "Attendance %": `${st.attendancePercentage}%`,
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Summary");
    XLSX.writeFile(wb, `Class_${assignedClassName}_Attendance_${monthlyMonth}.xlsx`);
  };

  // ── Google Charts Analytics Data ──────────────────────────────────────
  const genderDistributionData = useMemo(() => {
    if (!students || students.length === 0) {
      return [
        ["Gender", "Students"],
        ["No Enrolled Students", 1],
      ];
    }
    let male = 0;
    let female = 0;
    let other = 0;
    students.forEach((s) => {
      const g = (s.gender || "").toLowerCase().trim();
      if (g.startsWith("m") || g === "boy") male++;
      else if (g.startsWith("f") || g === "girl") female++;
      else other++;
    });
    const rows = [["Gender", "Students"]];
    if (male > 0) rows.push(["Male / Boys", male]);
    if (female > 0) rows.push(["Female / Girls", female]);
    if (other > 0) rows.push(["Other / Unspecified", other]);
    if (rows.length === 1) rows.push(["Enrolled Students", students.length]);
    return rows;
  }, [students]);

  const subjectMappingStatusData = useMemo(() => {
    const teachers = dashboardData?.subjectTeachers || [];
    if (teachers.length === 0) {
      return [
        ["Status", "Count"],
        ["No Subjects Configured", 1],
      ];
    }
    const assigned = teachers.filter((st) => st.teacher && (st.teacher.name || st.teacher._id)).length;
    const vacant = teachers.length - assigned;
    return [
      ["Status", "Count"],
      ["Educator Assigned", assigned],
      ["Vacant / Pending", vacant],
    ];
  }, [dashboardData]);

  const sectionDistributionData = useMemo(() => {
    const secMap = {};

    // 1. Check if assigned class has sections
    const assignedSections = dashboardData?.assignedClass?.sections || [];
    if (assignedSections.length > 0) {
      assignedSections.forEach((s) => {
        const name = typeof s === "string" ? s : s.name;
        secMap[name] = 0;
      });
    }

    // 2. Count enrolled students
    if (students && students.length > 0) {
      students.forEach((s) => {
        const sec = s.section ? (s.section.startsWith("Sec") ? s.section : `Section ${s.section}`) : "Section A";
        secMap[sec] = (secMap[sec] || 0) + 1;
      });
    }

    const entries = Object.entries(secMap);
    if (entries.length === 0) {
      return [
        ["Section", "Students", { role: "style" }],
        ["Section A", students?.length || 0, "#10b981"],
      ];
    }

    const colors = ["#10b981", "#059669", "#047857", "#34d399", "#6ee7b7"];
    return [
      ["Section", "Students", { role: "style" }],
      ...entries.map(([sec, count], idx) => [
        sec,
        count,
        colors[idx % colors.length],
      ]),
    ];
  }, [students, dashboardData]);

  return (
    <div className="tch-container">
      {/* ── WELCOME HERO BANNER ── */}
      <div className="pl-welcome-banner emerald-gradient">
        <div className="pl-banner-content">
          <div className="pl-banner-badge emerald">
            <CheckCircle2 size={15} />
            <span>Authenticated Class Incharge Portal</span>
          </div>

          <h1 className="pl-banner-title">
            Welcome back, {user?.name || "Class Incharge"}! 👋
          </h1>

          <p className="pl-banner-subtitle">
            Manage academic performance, oversee subject teacher allocations, and track test evaluations for <strong>{assignedClassName}</strong>.
          </p>

          <div className="pl-banner-meta-row">
            <div className="pl-meta-pill">
              <Mail size={14} />
              <span>{user?.email}</span>
            </div>
            <div className="pl-meta-pill highlight emerald">
              <GraduationCap size={14} />
              <span>Assigned Class: <strong>{assignedClassName}</strong> (Grade {assignedGrade})</span>
            </div>
            <div className="pl-meta-pill">
              <Calendar size={14} />
              <span>Session: <strong>{academicYear}</strong></span>
            </div>
          </div>
        </div>

        <div className="pl-banner-actions">
          <button className="tch-btn tch-btn-secondary" onClick={loadDashboard} title="Refresh Workspace">
            <RefreshCw size={15} className={isLoading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
          {totalTeachers > 0 && (
            <button className="tch-btn tch-btn-outline" onClick={handleExportRoster} title="Export Roster">
              <FileSpreadsheet size={15} />
              <span>Export Roster</span>
            </button>
          )}
        </div>
      </div>

      {/* ── ERROR ALERT ── */}
      {error && (
        <div className="tch-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── LOADING STATE ── */}
      {isLoading ? (
        <div className="tab-loading">
          <Loader2 className="spinner-large spin" size={36} />
          <p>Loading Class Incharge workspace data...</p>
        </div>
      ) : (
        <>
          {/* ── STATS METRICS GRID ── */}
          <div className="tch-stats-grid">
            <div className="tch-stat-card">
              <div className="tch-stat-icon blue">
                <GraduationCap size={22} />
              </div>
              <div>
                <span className="tch-stat-value">{assignedClassName}</span>
                <span className="tch-stat-label">Grade {assignedGrade} • Active Incharge</span>
              </div>
            </div>

            <div className="tch-stat-card">
              <div className="tch-stat-icon purple">
                <Users size={22} />
              </div>
              <div>
                <span className="tch-stat-value">{totalTeachers} Teachers</span>
                <span className="tch-stat-label">Mapped Subject Educators</span>
              </div>
            </div>

            <div className="tch-stat-card">
              <div className="tch-stat-icon green">
                <GraduationCap size={22} />
              </div>
              <div>
                <span className="tch-stat-value">{totalStudentsDisplay} Students</span>
                <span className="tch-stat-label">Enrolled in Class</span>
              </div>
            </div>

            <div className="tch-stat-card">
              <div className="tch-stat-icon blue">
                <Calendar size={22} />
              </div>
              <div>
                <span className="tch-stat-value">{academicYear}</span>
                <span className="tch-stat-label">Current Academic Session</span>
              </div>
            </div>

            <div className="tch-stat-card">
              <div className="tch-stat-icon blue">
                <UserCheck size={22} />
              </div>
              <div>
                <span className="tch-stat-value">Active</span>
                <span className="tch-stat-label">Class Incharge Authorization</span>
              </div>
            </div>
          </div>

          {/* ── WORKSPACE TABS NAVIGATION ── */}
          <div style={{ display: "flex", gap: "10px", marginTop: "24px", marginBottom: "24px", borderBottom: "2px solid #e2e8f0", paddingBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => setActiveTab("overview")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "10px",
                border: "none",
                fontWeight: 700,
                fontSize: "0.92rem",
                cursor: "pointer",
                background: activeTab === "overview" ? "#059669" : "#f1f5f9",
                color: activeTab === "overview" ? "#ffffff" : "#475569",
                boxShadow: activeTab === "overview" ? "0 4px 12px rgba(5,150,105,0.25)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <Users size={17} />
              <span>Overview &amp; Roster</span>
            </button>

            <button
              onClick={() => setActiveTab("daily_attendance")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "10px",
                border: "none",
                fontWeight: 700,
                fontSize: "0.92rem",
                cursor: "pointer",
                background: activeTab === "daily_attendance" ? "#059669" : "#f1f5f9",
                color: activeTab === "daily_attendance" ? "#ffffff" : "#475569",
                boxShadow: activeTab === "daily_attendance" ? "0 4px 12px rgba(5,150,105,0.25)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <Calendar size={17} />
              <span>Daily Student Attendance</span>
              {dailySummary && (
                <span style={{ background: activeTab === "daily_attendance" ? "rgba(255,255,255,0.25)" : "#e2e8f0", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700 }}>
                  {dailySummary.markedTotal}/{dailySummary.totalStudents}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("monthly_attendance")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "10px",
                border: "none",
                fontWeight: 700,
                fontSize: "0.92rem",
                cursor: "pointer",
                background: activeTab === "monthly_attendance" ? "#059669" : "#f1f5f9",
                color: activeTab === "monthly_attendance" ? "#ffffff" : "#475569",
                boxShadow: activeTab === "monthly_attendance" ? "0 4px 12px rgba(5,150,105,0.25)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <BarChart3 size={17} />
              <span>Monthly Attendance Summary</span>
              {monthlyData?.classSummary && (
                <span style={{ background: activeTab === "monthly_attendance" ? "rgba(255,255,255,0.25)" : "#e2e8f0", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700 }}>
                  {monthlyData.classSummary.averagePercentage}% Avg
                </span>
              )}
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 1: OVERVIEW & SUBJECT TEACHERS
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <>
          {/* ── GRAPHICAL ACADEMIC ANALYTICS (react-google-charts) ── */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ background: "#dcfce7", color: "#059669", padding: "8px", borderRadius: "10px", display: "flex" }}>
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#1e293b" }}>
                  Class Analytics &amp; Student Demographics
                </h3>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                  Real-time graphical insights for {assignedClassName} (Grade {assignedGrade})
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              {/* Chart 1: Student Gender Distribution */}
              <div className="tch-table-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>Student Gender Demographics</span>
                  <span style={{ fontSize: "0.75rem", background: "#f0fdf4", color: "#166534", padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>Donut Chart</span>
                </div>
                <Chart
                  chartType="PieChart"
                  width="100%"
                  height="250px"
                  data={genderDistributionData}
                  options={{
                    pieHole: 0.45,
                    backgroundColor: "transparent",
                    chartArea: { width: "90%", height: "80%" },
                    colors: ["#3b82f6", "#ec4899", "#8b5cf6"],
                    legend: { position: "bottom", textStyle: { color: "#475569", fontSize: 12 } },
                    pieSliceTextStyle: { fontSize: 12, fontWeight: "bold" },
                  }}
                  loader={<div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Loading Chart...</div>}
                />
              </div>

              {/* Chart 2: Subject Educator Allocation */}
              <div className="tch-table-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>Subject Educator Mapping</span>
                  <span style={{ fontSize: "0.75rem", background: "#ecfdf5", color: "#059669", padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>Donut Chart</span>
                </div>
                <Chart
                  chartType="PieChart"
                  width="100%"
                  height="250px"
                  data={subjectMappingStatusData}
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

              {/* Chart 3: Section Enrollment Distribution */}
              <div className="tch-table-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>Section Enrollment Breakdown</span>
                  <span style={{ fontSize: "0.75rem", background: "#eff6ff", color: "#2563eb", padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>Column Chart</span>
                </div>
                <Chart
                  chartType="ColumnChart"
                  width="100%"
                  height="250px"
                  data={sectionDistributionData}
                  options={{
                    backgroundColor: "transparent",
                    chartArea: { width: "85%", height: "65%" },
                    legend: { position: "none" },
                    colors: ["#10b981"],
                    hAxis: {
                      textStyle: { color: "#64748b", fontSize: 11 },
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
            </div>
          </div>

          {/* ── MAIN CONTENT GRID ── */}
          <div className="pl-dashboard-grid">
            {/* Left Column: Subject Teachers Roster */}
            <div className="pl-grid-main">
              <div className="tch-table-card">
                <div className="tch-toolbar" style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <div className="modal-title-wrap">
                    <BookOpen size={20} className="modal-title-icon text-emerald" />
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                        Assigned Subject Teachers Roster
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                        Teachers mapped to teach subjects in {assignedClassName}
                      </p>
                    </div>
                  </div>

                  <div className="tch-search-box" style={{ maxWidth: "280px" }}>
                    <Search size={16} className="tch-search-icon" />
                    <input
                      type="text"
                      placeholder="Search subject or teacher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="tch-table-wrapper">
                  <table className="tch-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Section</th>
                        <th>Assigned Educator</th>
                        <th>Teacher ID</th>
                        <th>Email Contact</th>
                        <th>Academic Year</th>
                        <th style={{ textAlign: "right" }}>Mapping Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTeachers.length > 0 ? (
                        filteredTeachers.map((st, idx) => (
                          <tr key={st.assignmentId || idx}>
                            <td>
                              <div className="teacher-subject-tag emerald-tag">
                                <BookOpen size={14} />
                                <span>{st.subject}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: "0.75rem", background: "#e0e7ff", color: "#3730a3", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" }}>
                                {st.section ? (st.section.startsWith("Sec") ? st.section : `Section ${st.section}`) : "Section A"}
                              </span>
                            </td>
                            <td>
                              <div className="tch-user-cell">
                                <div className="tch-avatar male">
                                  {st.teacher?.name ? st.teacher.name.charAt(0).toUpperCase() : "T"}
                                </div>
                                <div>
                                  <span className="tch-user-name">{st.teacher?.name || "Unassigned"}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontFamily: "monospace", fontSize: "0.82rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#334155", fontWeight: "600" }}>
                                {st.teacher?.teacherId || "N/A"}
                              </span>
                            </td>
                            <td className="tch-email-cell">
                              <Mail size={13} />
                              <span>{st.teacher?.email || "No email linked"}</span>
                            </td>
                            <td>
                              <span className="qual-badge">{st.academicYear || academicYear}</span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <span className="role-badge subject">Active Educator</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="tch-empty-td">
                            <div className="tch-empty-state">
                              <BookOpen size={36} className="text-slate-400" />
                              <p className="empty-title">No Subject Teachers Assigned</p>
                              <p className="empty-desc">
                                {searchTerm
                                  ? "No records match your search query."
                                  : `Subject teachers mapped to ${assignedClassName} will appear here.`}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── STUDENTS PANEL (SEQUENTIAL IDs) ── */}
              <div className="tch-table-card" style={{ marginTop: "24px" }}>
                <div className="tch-toolbar" style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <div className="modal-title-wrap">
                    <Users size={20} className="modal-title-icon text-emerald" />
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                        Enrolled Students Directory ({totalStudentsDisplay})
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                        Active class students listed in sequential ID order
                      </p>
                    </div>
                  </div>
                </div>

                <div className="tch-table-wrapper" style={{ maxHeight: "380px", overflowY: "auto" }}>
                  <table className="tch-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Username</th>
                        <th>Roll No</th>
                        <th>Class / Section</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedStudents.length > 0 ? (
                        sortedStudents.map((s) => (
                          <tr key={s._id || s.studentId}>
                            <td>
                              <span style={{ fontWeight: 700, color: "#0f766e", fontFamily: "monospace" }}>
                                {s.studentId}
                              </span>
                            </td>
                            <td>
                              <span className="tch-user-name" style={{ fontWeight: 600, color: "#1e293b" }}>
                                {s.studentName}
                              </span>
                            </td>
                            <td>
                              <span style={{ background: "#eff6ff", color: "#3b82f6", padding: "2px 8px", borderRadius: "999px", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600 }}>
                                {s.username || "N/A"}
                              </span>
                            </td>
                            <td>{s.rollno || "N/A"}</td>
                            <td>
                              <span className="qual-badge">
                                {s.classStandard ? `Class ${s.classStandard}` : assignedClassName} {s.section ? `(${s.section})` : ""}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="tch-empty-td">
                            <div className="tch-empty-state">
                              <Users size={32} className="text-slate-400" />
                              <p className="empty-title">No Students Enrolled</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Class Summary & Guidelines */}
            <div className="pl-grid-sidebar">
              {/* Class Info Card */}
              <div className="pl-widget-card">
                <div className="pl-widget-header">
                  <GraduationCap size={18} className="text-emerald" />
                  <h4>Class Details Summary</h4>
                </div>
                <div className="pl-widget-body">
                  <div className="pl-info-row">
                    <span className="info-label">Class Name:</span>
                    <span className="info-val font-bold">{assignedClassName}</span>
                  </div>
                  <div className="pl-info-row">
                    <span className="info-label">Grade Level:</span>
                    <span className="info-val">Grade {assignedGrade}</span>
                  </div>
                  <div className="pl-info-row">
                    <span className="info-label">Total Subject Teachers:</span>
                    <span className="info-val highlight">{totalTeachers} Teachers</span>
                  </div>
                  <div className="pl-info-row">
                    <span className="info-label">Total Students:</span>
                    <span className="info-val highlight">{totalStudentsDisplay} Students</span>
                  </div>
                  <div className="pl-info-row">
                    <span className="info-label">Class Incharge:</span>
                    <span className="info-val">{user?.name}</span>
                  </div>
                  <div className="pl-info-row">
                    <span className="info-label">Incharge Email:</span>
                    <span className="info-val font-mono">{user?.email}</span>
                  </div>
                </div>
              </div>

              {/* Guidelines Widget */}
              <div className="pl-widget-card">
                <div className="pl-widget-header">
                  <ShieldCheck size={18} className="text-emerald" />
                  <h4>Incharge Responsibilities</h4>
                </div>
                <div className="pl-widget-body">
                  <ul className="pl-checklist">
                    <li>
                      <CheckCircle2 size={16} className="text-emerald" />
                      <span>Monitor subject teacher allocations for {assignedClassName}</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-emerald" />
                      <span>Ensure monthly test marks are recorded on schedule</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-emerald" />
                      <span>Review student performance analytics &amp; report cards</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="text-emerald" />
                      <span>Maintain class discipline &amp; academic record alignment</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          </>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 2: DAILY ATTENDANCE MARKER
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "daily_attendance" && (
            <div className="tch-table-card" style={{ padding: "24px" }}>
              {/* Header Toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Calendar size={22} style={{ color: "#059669" }} />
                    Daily Attendance Marker: {assignedClassName} (Section {selectedSection})
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.84rem", color: "#64748b" }}>
                    Select date to record student attendance or perform authorized corrections. Records persist to MongoDB with your user ID.
                  </p>
                </div>

                {/* Filter and Date Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Date:</span>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.86rem",
                        fontWeight: 600,
                        color: "#1e293b",
                        background: "#ffffff",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Section:</span>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.86rem",
                        fontWeight: 600,
                        color: "#1e293b",
                        background: "#ffffff",
                      }}
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>

                  <button
                    onClick={loadDailyAttendance}
                    disabled={loadingDaily}
                    className="tch-btn tch-btn-secondary"
                    style={{ padding: "7px 12px" }}
                    title="Reload date attendance"
                  >
                    <RefreshCw size={15} className={loadingDaily ? "spin" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Feedback Notifications */}
              {attendanceSuccessMsg && (
                <div style={{ background: "#dcfce7", color: "#166534", border: "1px solid #86efac", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <CheckCircle2 size={18} />
                  <span>{attendanceSuccessMsg}</span>
                </div>
              )}

              {attendanceErrorMsg && (
                <div style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <AlertCircle size={18} />
                  <span>{attendanceErrorMsg}</span>
                </div>
              )}

              {/* Quick Summary Metric Badges */}
              {dailySummary && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Enrolled Students</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b" }}>{dailySummary.totalStudents}</div>
                  </div>

                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 600 }}>Present</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#15803d" }}>{dailySummary.presentCount}</div>
                  </div>

                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#991b1b", fontWeight: 600 }}>Absent</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#b91c1c" }}>{dailySummary.absentCount}</div>
                  </div>

                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#92400e", fontWeight: 600 }}>Late</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#b45309" }}>{dailySummary.lateCount}</div>
                  </div>

                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#1e40af", fontWeight: 600 }}>Half Day</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1d4ed8" }}>{dailySummary.halfDayCount}</div>
                  </div>

                  <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#6b21a8", fontWeight: 600 }}>Attendance Rate</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#7e22ce" }}>{dailySummary.attendancePercentage}%</div>
                  </div>
                </div>
              )}

              {/* Action Bar: Quick Preset Buttons & Save Attendance */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleMarkAll("Present")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "1px solid #86efac",
                      background: "#f0fdf4",
                      color: "#166534",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Check size={14} /> Mark All Present
                  </button>

                  <button
                    onClick={() => handleMarkAll("Absent")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "1px solid #fca5a5",
                      background: "#fef2f2",
                      color: "#991b1b",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <X size={14} /> Mark All Absent
                  </button>
                </div>

                <button
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance || dailyRoster.length === 0}
                  style={{
                    padding: "9px 22px",
                    borderRadius: "10px",
                    border: "none",
                    background: savingAttendance ? "#94a3b8" : "#059669",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    cursor: savingAttendance ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
                  }}
                >
                  {savingAttendance ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                  <span>{savingAttendance ? "Saving to Database..." : "Save Daily Attendance"}</span>
                </button>
              </div>

              {/* Daily Attendance Student Table */}
              {loadingDaily ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px" }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Fetching daily attendance roster...</p>
                </div>
              ) : dailyRoster.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <Users size={36} style={{ margin: "0 auto 12px", color: "#cbd5e1" }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "1rem", color: "#64748b" }}>No students enrolled for Class {targetGrade} (Section {selectedSection}).</p>
                </div>
              ) : (
                <div className="tch-table-wrapper" style={{ maxHeight: "550px", overflowY: "auto" }}>
                  <table className="tch-table">
                    <thead>
                      <tr>
                        <th style={{ width: "70px" }}>Roll No</th>
                        <th style={{ width: "110px" }}>Student ID</th>
                        <th>Student Name</th>
                        <th style={{ minWidth: "320px" }}>Attendance Status</th>
                        <th>Remarks / Reason</th>
                        <th style={{ textAlign: "right" }}>Record Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyRoster.map((st) => (
                        <tr key={st.studentId} style={{ background: st.status === "Absent" ? "#fef2f2" : "inherit" }}>
                          <td style={{ fontWeight: 600, color: "#64748b" }}>{st.rollno || "—"}</td>
                          <td>
                            <span style={{ fontWeight: 700, color: "#0f766e", fontFamily: "monospace" }}>
                              {st.studentId}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: "#1e293b" }}>{st.studentName}</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {[
                                { key: "Present", color: "#15803d", bg: "#dcfce7", border: "#86efac" },
                                { key: "Absent", color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
                                { key: "Late", color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
                                { key: "Half Day", color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" },
                              ].map((pill) => {
                                const isSelected = st.status === pill.key;
                                return (
                                  <button
                                    key={pill.key}
                                    type="button"
                                    onClick={() => handleStatusChange(st.studentId, pill.key)}
                                    style={{
                                      padding: "5px 12px",
                                      borderRadius: "6px",
                                      fontSize: "0.8rem",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      transition: "all 0.15s ease",
                                      border: isSelected ? `2px solid ${pill.color}` : "1px solid #cbd5e1",
                                      background: isSelected ? pill.bg : "#ffffff",
                                      color: isSelected ? pill.color : "#64748b",
                                      boxShadow: isSelected ? `0 2px 6px ${pill.border}` : "none",
                                    }}
                                  >
                                    {pill.key}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Add note (e.g. sick leave)..."
                              value={st.remarks || ""}
                              onChange={(e) => handleRemarksChange(st.studentId, e.target.value)}
                              style={{
                                width: "100%",
                                maxWidth: "220px",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.8rem",
                                background: "#ffffff",
                              }}
                            />
                          </td>
                          <td style={{ textAlign: "right", fontSize: "0.75rem", color: "#64748b" }}>
                            {st.attendanceId ? (
                              <div>
                                <span style={{ color: "#059669", fontWeight: 700 }}>● Recorded</span>
                                {st.markedBy && <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>by {st.markedBy}</div>}
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>Unsaved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 3: MONTHLY ATTENDANCE SUMMARY
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "monthly_attendance" && (
            <div className="tch-table-card" style={{ padding: "24px" }}>
              {/* Header Toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                    <BarChart3 size={22} style={{ color: "#059669" }} />
                    Monthly Attendance Summary: {assignedClassName} (Section {selectedSection})
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.84rem", color: "#64748b" }}>
                    Student-wise cumulative attendance records, present days, absent days, and percentage calculations.
                  </p>
                </div>

                {/* Filter and Date Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Month:</span>
                    <input
                      type="month"
                      value={monthlyMonth}
                      onChange={(e) => setMonthlyMonth(e.target.value)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.86rem",
                        fontWeight: 600,
                        color: "#1e293b",
                        background: "#ffffff",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Section:</span>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.86rem",
                        fontWeight: 600,
                        color: "#1e293b",
                        background: "#ffffff",
                      }}
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>

                  <button
                    onClick={loadMonthlyAttendance}
                    disabled={loadingMonthly}
                    className="tch-btn tch-btn-secondary"
                    style={{ padding: "7px 12px" }}
                    title="Reload monthly summary"
                  >
                    <RefreshCw size={15} className={loadingMonthly ? "spin" : ""} />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={handleExportMonthly}
                    disabled={!monthlyData?.students || monthlyData.students.length === 0}
                    className="tch-btn tch-btn-outline"
                    style={{ padding: "7px 14px", borderColor: "#059669", color: "#059669" }}
                    title="Export Monthly Attendance to Excel"
                  >
                    <Download size={15} />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>

              {monthlyErrorMsg && (
                <div style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <AlertCircle size={18} />
                  <span>{monthlyErrorMsg}</span>
                </div>
              )}

              {/* Class Monthly Performance Bar */}
              {monthlyData?.classSummary && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Enrolled Students</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b" }}>{monthlyData.classSummary.totalStudents}</div>
                  </div>

                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 600 }}>Sessions Held</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#15803d" }}>{monthlyData.classSummary.totalSessions} Days</div>
                  </div>

                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 600 }}>Total Present</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#15803d" }}>{monthlyData.classSummary.totalPresent}</div>
                  </div>

                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#991b1b", fontWeight: 600 }}>Total Absent</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#b91c1c" }}>{monthlyData.classSummary.totalAbsent}</div>
                  </div>

                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#92400e", fontWeight: 600 }}>Total Late</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#b45309" }}>{monthlyData.classSummary.totalLate}</div>
                  </div>

                  <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#6b21a8", fontWeight: 600 }}>Average Rate</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#7e22ce" }}>{monthlyData.classSummary.averagePercentage}%</div>
                  </div>
                </div>
              )}

              {/* Monthly Attendance Table */}
              {loadingMonthly ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px" }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Computing monthly attendance summary...</p>
                </div>
              ) : !monthlyData?.students || monthlyData.students.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <BarChart3 size={36} style={{ margin: "0 auto 12px", color: "#cbd5e1" }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "1rem", color: "#64748b" }}>No attendance records found for {monthlyMonth}.</p>
                </div>
              ) : (
                <div className="tch-table-wrapper" style={{ maxHeight: "550px", overflowY: "auto" }}>
                  <table className="tch-table">
                    <thead>
                      <tr>
                        <th style={{ width: "70px" }}>Roll No</th>
                        <th style={{ width: "110px" }}>Student ID</th>
                        <th>Student Name</th>
                        <th style={{ textAlign: "center" }}>Present</th>
                        <th style={{ textAlign: "center" }}>Absent</th>
                        <th style={{ textAlign: "center" }}>Late</th>
                        <th style={{ textAlign: "center" }}>Half Day</th>
                        <th style={{ textAlign: "center" }}>Total Marked</th>
                        <th style={{ textAlign: "right" }}>Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.students.map((st) => {
                        const pct = st.attendancePercentage || 0;
                        const badgeColor =
                          pct >= 75
                            ? { bg: "#dcfce7", color: "#166534", border: "#86efac", label: "Eligible" }
                            : pct >= 60
                            ? { bg: "#fef3c7", color: "#92400e", border: "#fde68a", label: "Warning" }
                            : { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", label: "Low Attendance" };

                        return (
                          <tr key={st.studentId}>
                            <td style={{ fontWeight: 600, color: "#64748b" }}>{st.rollno || "—"}</td>
                            <td>
                              <span style={{ fontWeight: 700, color: "#0f766e", fontFamily: "monospace" }}>
                                {st.studentId}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: "#1e293b" }}>{st.studentName}</span>
                            </td>
                            <td style={{ textAlign: "center", fontWeight: 700, color: "#15803d" }}>
                              {st.presentDays}
                            </td>
                            <td style={{ textAlign: "center", fontWeight: 700, color: "#b91c1c" }}>
                              {st.absentDays}
                            </td>
                            <td style={{ textAlign: "center", fontWeight: 700, color: "#b45309" }}>
                              {st.lateDays}
                            </td>
                            <td style={{ textAlign: "center", fontWeight: 700, color: "#1d4ed8" }}>
                              {st.halfDays}
                            </td>
                            <td style={{ textAlign: "center", fontWeight: 700, color: "#475569" }}>
                              {st.totalDays}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <span
                                style={{
                                  background: badgeColor.bg,
                                  color: badgeColor.color,
                                  border: `1px solid ${badgeColor.border}`,
                                  padding: "3px 10px",
                                  borderRadius: "12px",
                                  fontSize: "0.8rem",
                                  fontWeight: 800,
                                }}
                              >
                                {pct}% • {badgeColor.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClassInchargeDashboard;
