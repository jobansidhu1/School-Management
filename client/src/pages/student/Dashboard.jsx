import React, { useState, useEffect, useMemo } from "react";
import { Chart } from "react-google-charts";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppDispatch";
import { fetchCurrentUser } from "../../redux/slices/authSlice";
import { fetchMyAttendanceThunk } from "../../redux/slices/marksSlice";
import { fetchMyAcademicsApi } from "../../services/api";
import {
  User,
  Hash,
  BookOpen,
  Calendar,
  MapPin,
  Phone,
  GraduationCap,
  ShieldCheck,
  Mail,
  CheckCircle2,
  TrendingUp,
  Clock,
  AlertCircle,
  Star,
  BarChart3,
  Award,
  FileText,
  Printer,
  X,
  Filter,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

// Grade badge helper
const getGradeBadge = (pct) => {
  if (pct >= 90) return { grade: "A+", label: "Outstanding", color: "#10b981", bg: "#d1fae5" };
  if (pct >= 80) return { grade: "A", label: "Excellent", color: "#10b981", bg: "#d1fae5" };
  if (pct >= 70) return { grade: "B+", label: "Very Good", color: "#3b82f6", bg: "#dbeafe" };
  if (pct >= 60) return { grade: "B", label: "Good", color: "#6366f1", bg: "#eef2ff" };
  if (pct >= 50) return { grade: "C", label: "Average", color: "#f59e0b", bg: "#fef9c3" };
  if (pct >= 35) return { grade: "D", label: "Pass", color: "#f97316", bg: "#ffedd5" };
  return { grade: "F", label: "Needs Improvement", color: "#ef4444", bg: "#fee2e2" };
};

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e"];

const StudentDashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { attendance = [], attendanceStats, monthlyAttendance = [] } = useAppSelector((state) => state.academic);

  const [academics, setAcademics] = useState(null);
  const [loadingAcademics, setLoadingAcademics] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedExamType, setSelectedExamType] = useState("ALL");
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState("ALL");
  const [showAllAttendance, setShowAllAttendance] = useState(false);
  const [reportCardOpen, setReportCardOpen] = useState(false);

  const loadStudentData = async () => {
    try {
      setLoadingAcademics(true);
      const [acadRes] = await Promise.all([
        fetchMyAcademicsApi(),
        dispatch(fetchCurrentUser()),
        dispatch(fetchMyAttendanceThunk()),
      ]);

      if (acadRes && acadRes.success) {
        setAcademics(acadRes);
      }
    } catch (err) {
      console.error("Error loading student academics:", err);
    } finally {
      setLoadingAcademics(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [dispatch]);

  // Student Profile Data
  const studentInfo = academics?.student || user || {};
  const classInfo = academics?.classDetails || {};
  const schoolInfo = academics?.school || {};
  const assignedSubjects = academics?.assignedSubjects || [];
  const allMarks = academics?.marks || [];
  const subjectPerformance = academics?.subjectPerformance || [];
  const monthlyHistory = academics?.monthlyHistory || [];
  const summary = academics?.summary || {
    totalMarksObtained: 0,
    totalMaxMarks: 0,
    overallPercentage: 0,
    overallGrade: "N/A",
    totalTestsTaken: 0,
    totalSubjectsCount: assignedSubjects.length,
    status: "Pending Evaluation",
  };
  const hasMarks = academics?.hasMarks && allMarks.length > 0;

  // Filtered marks
  const filteredMarks = useMemo(() => {
    return allMarks.filter((m) => {
      if (selectedExamType !== "ALL" && m.examType !== selectedExamType) {
        return false;
      }
      if (selectedMonth !== "ALL") {
        const dateStr = m.examDate || m.createdAt;
        if (!dateStr || !dateStr.startsWith(selectedMonth)) {
          return false;
        }
      }
      return true;
    });
  }, [allMarks, selectedMonth, selectedExamType]);

  // Unique months available in marks
  const availableMonths = useMemo(() => {
    const set = new Map();
    allMarks.forEach((m) => {
      const dateStr = m.examDate || m.createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = d.toLocaleString("en-US", { month: "short", year: "numeric" });
          if (!set.has(key)) set.set(key, label);
        }
      }
    });
    return Array.from(set.entries()).map(([key, label]) => ({ key, label }));
  }, [allMarks]);

  // Available attendance months
  const availableAttendanceMonths = useMemo(() => {
    const set = new Map();
    (attendance || []).forEach((a) => {
      if (a.date) {
        const d = new Date(a.date);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = d.toLocaleString("en-US", { month: "short", year: "numeric" });
          if (!set.has(key)) set.set(key, label);
        }
      }
    });
    return Array.from(set.entries()).map(([key, label]) => ({ key, label }));
  }, [attendance]);

  // Filtered attendance records based on selected month
  const filteredAttendance = useMemo(() => {
    if (selectedAttendanceMonth === "ALL") return attendance || [];
    return (attendance || []).filter((a) => {
      if (!a.date) return false;
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === selectedAttendanceMonth;
    });
  }, [attendance, selectedAttendanceMonth]);

  // Attendance stats (filtered)
  const attStats = useMemo(() => {
    const list = filteredAttendance;
    const present = list.filter((a) => a.status === "Present").length;
    const absent = list.filter((a) => a.status === "Absent").length;
    const late = list.filter((a) => a.status === "Late").length;
    const halfDay = list.filter((a) => a.status === "Half Day").length;
    const total = list.length;
    const rate = total > 0 ? Math.round(((present + halfDay * 0.5) / total) * 100) : 0;
    return { present, absent, late, halfDay, total, rate };
  }, [filteredAttendance]);

  const displayedAttendance = useMemo(() => {
    const sorted = [...filteredAttendance].sort((a, b) => new Date(b.date) - new Date(a.date));
    return showAllAttendance ? sorted : sorted.slice(0, 10);
  }, [filteredAttendance, showAllAttendance]);

  // Attendance Column Chart Data (Real Data only)
  const attendanceColumnData = useMemo(() => {
    return [
      ["Status", "Days", { role: "style" }],
      ["Present", attStats.present, "#10b981"],
      ["Absent", attStats.absent, "#ef4444"],
      ["Late", attStats.late, "#f59e0b"],
      ["Half Day", attStats.halfDay, "#3b82f6"],
    ];
  }, [attStats]);

  // Subject Performance Chart Data (Using real MongoDB data only, no fake data)
  const subjectPerformanceColumnData = useMemo(() => {
    if (!hasMarks || subjectPerformance.length === 0) return null;
    const valid = subjectPerformance.filter((s) => s.max > 0);
    if (valid.length === 0) return null;

    return [
      ["Subject", "Score (%)", { role: "style" }],
      ...valid.map((s, i) => [
        s.subjectName,
        s.percentage,
        CHART_COLORS[i % CHART_COLORS.length],
      ]),
    ];
  }, [hasMarks, subjectPerformance]);

  const statusColor = {
    Present: { bg: "#dcfce7", color: "#16a34a" },
    Absent: { bg: "#fee2e2", color: "#dc2626" },
    Late: { bg: "#fef9c3", color: "#ca8a04" },
    "Half Day": { bg: "#dbeafe", color: "#2563eb" },
  };

  const overallGradeInfo = getGradeBadge(summary.overallPercentage);

  return (
    <div className="tch-container" style={{ paddingBottom: "40px" }}>
      {/* ── WELCOME HERO BANNER ── */}
      <div
        className="pl-welcome-banner"
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 50%, #6366f1 100%)",
          borderRadius: "16px",
          padding: "28px 32px",
          marginBottom: "24px",
          boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.3)",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "8px", padding: "4px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={14} color="white" />
                <span style={{ color: "white", fontSize: "0.8rem", fontWeight: 700 }}>STUDENT PORTAL</span>
              </div>
              {schoolInfo.currentSession && (
                <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: "8px", padding: "4px 10px", fontSize: "0.78rem", fontWeight: 600 }}>
                  Session: {schoolInfo.currentSession}
                </span>
              )}
            </div>
            <h1 style={{ color: "white", margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>
              Welcome back, {studentInfo.studentName || studentInfo.name || "Student"}! 👋
            </h1>
            <p style={{ color: "rgba(255,255,255,0.88)", margin: "6px 0 0", fontSize: "0.95rem" }}>
              Track your subject test marks, exam percentages, and official academic performance.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {[
              { icon: <Hash size={13} />, label: "Student ID", val: studentInfo.studentId },
              { icon: <GraduationCap size={13} />, label: "Class", val: classInfo.name ? `${classInfo.name}${studentInfo.section ? " (" + studentInfo.section + ")" : ""}` : (studentInfo.classStandard ? `Class ${studentInfo.classStandard}` : "N/A") },
              { icon: <BookOpen size={13} />, label: "Roll No", val: studentInfo.rollno },
            ].map((pill, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.8)" }}>{pill.icon}</span>
                <span style={{ color: "white", fontSize: "0.85rem" }}>
                  {pill.label}: <strong>{pill.val || "N/A"}</strong>
                </span>
              </div>
            ))}

            <button
              onClick={() => setReportCardOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 18px",
                borderRadius: "10px",
                background: "#ffffff",
                color: "#4338ca",
                border: "none",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <FileText size={16} /> View &amp; Print Report Card
            </button>
          </div>
        </div>
      </div>

      {/* ── ACADEMIC PERFORMANCE SUMMARY STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          {
            label: "Overall Score",
            val: hasMarks ? `${summary.overallPercentage}%` : "Pending",
            sub: hasMarks ? `Grade ${summary.overallGrade} • ${summary.performanceLabel}` : "No marks yet",
            icon: <Award size={22} />,
            color: "#4f46e5",
            bg: "#eef2ff",
          },
          {
            label: "Marks Obtained",
            val: hasMarks ? `${summary.totalMarksObtained} / ${summary.totalMaxMarks}` : "0 / 0",
            sub: `${summary.totalTestsTaken} tests recorded`,
            icon: <Star size={22} />,
            color: "#10b981",
            bg: "#d1fae5",
          },
          {
            label: "Assigned Subjects",
            val: assignedSubjects.length,
            sub: `${assignedSubjects.filter((s) => s.teacher && s.teacher !== "Not Assigned").length} teachers mapped`,
            icon: <BookOpen size={22} />,
            color: "#3b82f6",
            bg: "#dbeafe",
          },
          {
            label: "Attendance Rate",
            val: attStats.total > 0 ? `${attStats.rate}%` : "N/A",
            sub: `${attStats.present} present of ${attStats.total} days`,
            icon: <CheckCircle2 size={22} />,
            color: "#059669",
            bg: "#ecfdf5",
          },
          {
            label: "Academic Status",
            val: hasMarks ? summary.status : "Pending Evaluation",
            sub: hasMarks && summary.overallPercentage >= 35 ? "Eligible for Promotion" : "Term in progress",
            icon: <Sparkles size={22} />,
            color: summary.status === "Pass" ? "#16a34a" : "#ca8a04",
            bg: summary.status === "Pass" ? "#f0fdf4" : "#fefce8",
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                background: stat.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: stat.color,
                flexShrink: 0,
              }}
            >
              {stat.icon}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#1e293b", lineHeight: 1.1 }}>
                {stat.val}
              </div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginTop: "3px" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {stat.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── ASSIGNED SUBJECTS & SUBJECT TEACHERS DIRECTORY ── */}
      <div style={{ background: "#ffffff", borderRadius: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                Assigned Subjects &amp; Subject Teachers
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                Official subject curriculum and assigned faculty for {classInfo.name || "Class"} Section {studentInfo.section || "A"}
              </p>
            </div>
          </div>
          <span style={{ fontSize: "0.8rem", color: "#475569", background: "#f1f5f9", padding: "4px 12px", borderRadius: "999px", fontWeight: 600 }}>
            {assignedSubjects.length} Assigned Subjects
          </span>
        </div>

        {assignedSubjects.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px", color: "#94a3b8" }}>
            No subjects configured for your class yet.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {assignedSubjects.map((sub, i) => {
              const perf = subjectPerformance.find((p) => p.subjectName.toLowerCase() === sub.name.toLowerCase());
              const hasTeacher = sub.teacher && sub.teacher !== "Not Assigned";
              const grade = perf && perf.max > 0 ? getGradeBadge(perf.percentage) : null;

              return (
                <div
                  key={i}
                  style={{
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                      <h4 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700, color: "#1e293b" }}>
                        {sub.name}
                      </h4>
                      {sub.code && (
                        <span style={{ fontSize: "0.72rem", background: "#e0e7ff", color: "#3730a3", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
                          {sub.code}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: hasTeacher ? "#e0f2fe" : "#f1f5f9",
                          color: hasTeacher ? "#0284c7" : "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {hasTeacher ? sub.teacher[0] : "?"}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: hasTeacher ? "#1e293b" : "#94a3b8" }}>
                          {sub.teacher}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          {sub.teacherId ? `Teacher ID: ${sub.teacherId}` : sub.teacherEmail || "Pending assignment"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {perf && perf.tests.length > 0 ? `${perf.tests.length} tests completed` : "No tests recorded"}
                    </span>
                    {grade ? (
                      <span style={{ background: grade.bg, color: grade.color, padding: "3px 8px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700 }}>
                        {grade.grade} ({perf.percentage}%)
                      </span>
                    ) : (
                      <span style={{ background: "#f1f5f9", color: "#94a3b8", padding: "3px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 600 }}>
                        Pending marks
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MONTHLY TEST PERFORMANCE & SUBJECT-WISE RESULTS ── */}
      <div style={{ background: "#ffffff", borderRadius: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "10px", background: "#fdf4ff", color: "#c026d3", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                Monthly Test Performance &amp; Subject Results
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                Verified test scores, maximum marks, percentages, and performance timeline
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {availableMonths.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.84rem",
                    background: "#ffffff",
                    color: "#1e293b",
                    fontWeight: 500,
                  }}
                >
                  <option value="ALL">All Months ({allMarks.length})</option>
                  {availableMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Exam:</span>
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.84rem",
                  background: "#ffffff",
                  color: "#1e293b",
                  fontWeight: 500,
                }}
              >
                <option value="ALL">All Types</option>
                <option value="Unit Test">Unit Test</option>
                <option value="Mid Term">Mid Term</option>
                <option value="Final Exam">Final Exam</option>
                <option value="Assignment">Assignment</option>
                <option value="Quiz">Quiz</option>
                <option value="Practical">Practical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Empty State: when no test marks have been published */}
        {!hasMarks || allMarks.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1px dashed #cbd5e1",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#f1f5f9",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <BookOpen size={28} />
            </div>
            <h4 style={{ margin: "0 0 8px", fontSize: "1.15rem", fontWeight: 700, color: "#334155" }}>
              No Monthly Test Results Published Yet
            </h4>
            <p style={{ margin: "0 auto 16px", maxWidth: "540px", fontSize: "0.88rem", color: "#64748b", lineHeight: 1.5 }}>
              Monthly tests and periodic assessments have not yet been recorded or published by your subject teachers for this term. As soon as marks are entered, your subject-wise results, percentages, and official report card will be dynamically populated here.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", background: "#eff6ff", color: "#1d4ed8", padding: "6px 14px", borderRadius: "6px", fontWeight: 600 }}>
              <ShieldCheck size={14} /> Data is secured and fetched strictly from verified MongoDB records.
            </div>
          </div>
        ) : (
          <div>
            {/* Visual Analytics Chart based on actual scores */}
            {subjectPerformanceColumnData && (
              <div style={{ marginBottom: "28px", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b" }}>
                    Subject-wise Average Score Analytics
                  </span>
                  <span style={{ fontSize: "0.74rem", background: "#ede9fe", color: "#6d28d9", padding: "3px 8px", borderRadius: "6px", fontWeight: 700 }}>
                    Actual Student Scores
                  </span>
                </div>
                <Chart
                  chartType="ColumnChart"
                  width="100%"
                  height="220px"
                  data={subjectPerformanceColumnData}
                  options={{
                    backgroundColor: "transparent",
                    chartArea: { width: "88%", height: "65%" },
                    legend: { position: "none" },
                    bar: { groupWidth: "45%" },
                    hAxis: {
                      textStyle: { color: "#64748b", fontSize: 11, fontWeight: "600" },
                    },
                    vAxis: {
                      title: "Score (%)",
                      titleTextStyle: { color: "#64748b", fontSize: 11, italic: false },
                      minValue: 0,
                      maxValue: 100,
                      textStyle: { color: "#64748b", fontSize: 11 },
                      gridlines: { color: "#e2e8f0" },
                    },
                    animation: {
                      startup: true,
                      duration: 600,
                      easing: "out",
                    },
                  }}
                  loader={<div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>Loading Chart...</div>}
                />
              </div>
            )}

            {/* Month-wise History Summary Timeline */}
            {monthlyHistory.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 700, color: "#334155" }}>
                  Month-wise Assessment History
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                  {monthlyHistory.map((m, idx) => {
                    const grade = getGradeBadge(m.percentage);
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "#ffffff",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          padding: "14px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1e293b" }}>
                            {m.monthLabel}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                            {m.tests.length} tests • {m.totalObtained}/{m.totalMax} marks
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ background: grade.bg, color: grade.color, padding: "3px 8px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 700 }}>
                            {m.percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Detailed Subject-wise Results Table */}
            <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 700, color: "#334155" }}>
              Detailed Test Results ({filteredMarks.length} Records)
            </h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569", textAlign: "left" }}>
                    <th style={{ padding: "12px 14px", fontWeight: 600 }}>Subject</th>
                    <th style={{ padding: "12px 14px", fontWeight: 600 }}>Exam Type</th>
                    <th style={{ padding: "12px 14px", fontWeight: 600 }}>Date</th>
                    <th style={{ padding: "12px 14px", fontWeight: 600 }}>Marks Obtained</th>
                    <th style={{ padding: "12px 14px", fontWeight: 600 }}>Max Marks</th>
                    <th style={{ padding: "12px 14px", fontWeight: 600, width: "150px" }}>Percentage</th>
                    <th style={{ padding: "12px 14px", fontWeight: 600 }}>Grade</th>
                    <th style={{ padding: "12px 14px", fontWeight: 600 }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarks.map((exam, i) => {
                    const pct = exam.maxMarks > 0 ? Math.round((exam.marksObtained / exam.maxMarks) * 100) : 0;
                    const grade = getGradeBadge(pct);
                    const formattedDate = exam.examDate
                      ? new Date(exam.examDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : new Date(exam.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

                    return (
                      <tr
                        key={exam._id || i}
                        style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1e293b" }}>
                          {exam.subjectName}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 600 }}>
                            {exam.examType}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: "0.82rem" }}>
                          {formattedDate}
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                          {exam.marksObtained}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>
                          {exam.maxMarks}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: grade.color }} />
                            </div>
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", minWidth: "36px" }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: grade.bg, color: grade.color, padding: "3px 8px", borderRadius: "6px", fontSize: "0.76rem", fontWeight: 700 }}>
                            {grade.grade}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: "0.8rem" }}>
                          {exam.remarks || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── ATTENDANCE OVERVIEW & LOGS ── */}
      <div style={{ background: "#ffffff", borderRadius: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "24px" }}>
        {/* Attendance Header with Month Filter */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "10px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                  Attendance History &amp; Monthly Analysis
                </h3>
                {attStats.total > 0 && (
                  <span
                    style={{
                      background: attStats.rate >= 75 ? "#dcfce7" : attStats.rate >= 60 ? "#fef9c3" : "#fee2e2",
                      color: attStats.rate >= 75 ? "#16a34a" : attStats.rate >= 60 ? "#ca8a04" : "#dc2626",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {attStats.rate}% Overall Rate
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                Live daily attendance logged directly by authorized Class Incharge
              </p>
            </div>
          </div>

          {/* Month Selector Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={15} color="#64748b" />
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>Period:</span>
            <select
              value={selectedAttendanceMonth}
              onChange={(e) => setSelectedAttendanceMonth(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.84rem",
                background: "#ffffff",
                color: "#1e293b",
                fontWeight: 600,
              }}
            >
              <option value="ALL">All Recorded Dates ({attendance.length})</option>
              {availableAttendanceMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Attendance Content: Left column stats/chart, Right column date logs */}
        {attendance.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1px dashed #cbd5e1",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#f1f5f9",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <Calendar size={24} />
            </div>
            <h4 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 700, color: "#334155" }}>
              No Attendance Records Logged Yet
            </h4>
            <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b" }}>
              Your Class Incharge has not yet logged attendance for your class and section. Once attendance is submitted, daily and monthly breakdowns will appear here in real-time.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "20px" }}>
            {/* Left: Analytics and Cards */}
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                {[
                  { label: "Present Days", val: attStats.present, color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
                  { label: "Absent Days", val: attStats.absent, color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                  { label: "Late Arrivals", val: attStats.late, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
                  { label: "Half Days", val: attStats.halfDay, color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: s.bg,
                      borderRadius: "10px",
                      padding: "12px 14px",
                      border: `1px solid ${s.border}`,
                    }}
                  >
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Status Distribution {selectedAttendanceMonth !== "ALL" ? `(${selectedAttendanceMonth})` : "(Overall)"}
                </div>
                <Chart
                  chartType="ColumnChart"
                  width="100%"
                  height="160px"
                  data={attendanceColumnData}
                  options={{
                    backgroundColor: "transparent",
                    chartArea: { width: "86%", height: "65%" },
                    legend: { position: "none" },
                    hAxis: { textStyle: { color: "#64748b", fontSize: 11, fontWeight: "600" } },
                    vAxis: { minValue: 0, textStyle: { color: "#64748b", fontSize: 11 }, gridlines: { color: "#e2e8f0" } },
                  }}
                  loader={<div style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>Loading Chart...</div>}
                />
              </div>

              {/* Monthly breakdown chips if available */}
              {monthlyAttendance.length > 1 && (
                <div style={{ marginTop: "14px" }}>
                  <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>
                    Monthly Rates
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {monthlyAttendance.map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedAttendanceMonth(m.month === selectedAttendanceMonth ? "ALL" : m.month)}
                        style={{
                          background: selectedAttendanceMonth === m.month ? "#4f46e5" : "#f1f5f9",
                          color: selectedAttendanceMonth === m.month ? "#ffffff" : "#334155",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>{m.month}</span>
                        <span style={{ opacity: 0.85 }}>({m.percentage}%)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Date-wise Logs */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                  Daily Records ({displayedAttendance.length} of {filteredAttendance.length})
                </div>
                {filteredAttendance.length > 10 && (
                  <button
                    type="button"
                    onClick={() => setShowAllAttendance((prev) => !prev)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#4f46e5",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "2px 6px",
                    }}
                  >
                    {showAllAttendance ? "Show Recent 10" : `View All (${filteredAttendance.length})`}
                  </button>
                )}
              </div>

              {displayedAttendance.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "28px 0", fontSize: "0.85rem" }}>
                  No attendance records found for this period.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "330px", overflowY: "auto", paddingRight: "4px" }}>
                  {displayedAttendance.map((rec, i) => {
                    const sc = statusColor[rec.status] || { bg: "#f1f5f9", color: "#64748b" };
                    const d = new Date(rec.date);
                    return (
                      <div
                        key={i}
                        style={{
                          background: "#ffffff",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          border: "1px solid #e2e8f0",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#1e293b" }}>
                            {d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
                            {rec.classStandard ? `Class ${rec.classStandard}${rec.section ? ` - ${rec.section}` : ""}` : ""}
                            {rec.remarks ? ` • Note: ${rec.remarks}` : ""}
                          </div>
                        </div>

                        <span
                          style={{
                            background: sc.bg,
                            color: sc.color,
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            letterSpacing: "0.3px",
                          }}
                        >
                          {rec.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── REGISTERED STUDENT PROFILE DETAILS ── */}
      <div className="tch-table-card" style={{ background: "#ffffff", borderRadius: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
        <div className="tch-toolbar" style={{ borderBottom: "1px solid #e2e8f0", padding: "20px" }}>
          <div className="modal-title-wrap" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <User size={20} style={{ color: "#4f46e5" }} />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Personal &amp; Enrollment Information</h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>Official records authenticated from MongoDB</p>
            </div>
          </div>
        </div>
        <div style={{ padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
            {[
              { icon: <Hash size={18} />, label: "Student ID", val: studentInfo.studentId, color: "#4f46e5", bg: "#eef2ff" },
              { icon: <Mail size={18} />, label: "Username", val: studentInfo.username, color: "#3b82f6", bg: "#eff6ff", mono: true },
              { icon: <User size={18} />, label: "Full Name", val: studentInfo.studentName || studentInfo.name, color: "#10b981", bg: "#d1fae5" },
              { icon: <BookOpen size={18} />, label: "Roll Number", val: studentInfo.rollno, color: "#f59e0b", bg: "#fef9c3" },
              { icon: <GraduationCap size={18} />, label: "Class / Section", val: classInfo.name ? `${classInfo.name} - Section ${studentInfo.section || "A"}` : (studentInfo.classStandard ? `Class ${studentInfo.classStandard} - ${studentInfo.section || "A"}` : "N/A"), color: "#8b5cf6", bg: "#ede9fe" },
              { icon: <Calendar size={18} />, label: "Date of Birth", val: studentInfo.dob, color: "#ec4899", bg: "#fce7f3" },
              { icon: <User size={18} />, label: "Gender", val: studentInfo.gender, color: "#64748b", bg: "#f1f5f9" },
              { icon: <MapPin size={18} />, label: "Residential Address", val: studentInfo.address, color: "#ef4444", bg: "#fee2e2" },
              { icon: <Phone size={18} />, label: "Guardian Contact", val: studentInfo.guardianNo, color: "#10b981", bg: "#d1fae5" },
            ].map((field, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ width: 38, height: 38, borderRadius: "10px", background: field.bg, display: "flex", alignItems: "center", justifyContent: "center", color: field.color, flexShrink: 0 }}>
                  {field.icon}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>{field.label}</p>
                  <p style={{ margin: "3px 0 0", fontSize: "0.92rem", fontWeight: 700, color: "#1e293b", fontFamily: field.mono ? "monospace" : "inherit" }}>
                    {field.val || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── OFFICIAL REPORT CARD MODAL / PRINTABLE VIEW ── */}
      {reportCardOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setReportCardOpen(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header Actions (Excluded in Print) */}
            <div
              className="no-print"
              style={{
                padding: "16px 24px",
                background: "#1e1b4b",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Award size={20} color="#a5b4fc" />
                <span style={{ fontWeight: 700, fontSize: "1rem" }}>Official Student Progress Report Card</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 16px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <Printer size={15} /> Print / Save as PDF
                </button>
                <button
                  type="button"
                  onClick={() => setReportCardOpen(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "none",
                    color: "#ffffff",
                    borderRadius: "8px",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* PRINTABLE REPORT CARD SHEET */}
            <div
              id="report-card-print-area"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "32px 36px",
                background: "#ffffff",
                color: "#1e293b",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              }}
            >
              {/* School Header */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #1e293b", paddingBottom: "18px", marginBottom: "20px" }}>
                <div style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", fontWeight: 700 }}>
                  Affiliated to {schoolInfo.board || "CBSE"} • Affiliation No: {schoolInfo.affiliationNumber || "CBSE/AFF/2025-26"} • School Code: {schoolInfo.code || "SCH-1001"}
                </div>
                <h1 style={{ margin: "6px 0 2px", fontSize: "1.75rem", fontWeight: 800, color: "#1e1b4b" }}>
                  {schoolInfo.name || "School Test Management System"}
                </h1>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569" }}>
                  {schoolInfo.address || "123 Knowledge Park"}, {schoolInfo.city || "New Delhi"}, {schoolInfo.state || "Delhi"} • Email: {schoolInfo.contactEmail || "admin@school.com"}
                </p>
                <div style={{ marginTop: "12px", display: "inline-block", background: "#f1f5f9", padding: "4px 18px", borderRadius: "999px", fontSize: "0.85rem", fontWeight: 800, color: "#312e81", border: "1px solid #cbd5e1" }}>
                  ACADEMIC PROGRESS REPORT CARD • SESSION {schoolInfo.currentSession || "2025-2026"}
                </div>
              </div>

              {/* Student Metadata Box */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "24px",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.86rem",
                }}
              >
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: 600 }}>STUDENT NAME</span>
                  <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>{studentInfo.studentName || studentInfo.name}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: 600 }}>STUDENT ID</span>
                  <strong style={{ color: "#4f46e5", fontFamily: "monospace", fontSize: "0.95rem" }}>{studentInfo.studentId}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: 600 }}>ROLL NUMBER</span>
                  <strong style={{ color: "#0f172a" }}>{studentInfo.rollno}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: 600 }}>CLASS &amp; SECTION</span>
                  <strong style={{ color: "#0f172a" }}>{classInfo.name || studentInfo.classStandard} - {studentInfo.section || "A"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: 600 }}>CLASS INCHARGE</span>
                  <strong style={{ color: "#0f172a" }}>{classInfo.classIncharge || "Not Assigned"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: 600 }}>DATE OF ISSUE</span>
                  <strong style={{ color: "#0f172a" }}>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
                </div>
              </div>

              {/* Subject-Wise Report Sheet Table */}
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ margin: "0 0 8px", fontSize: "0.92rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  I. Scholastic Academic Performance
                </h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", border: "1px solid #cbd5e1" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1", textAlign: "left", color: "#334155" }}>
                      <th style={{ padding: "10px", borderRight: "1px solid #e2e8f0" }}>S.No</th>
                      <th style={{ padding: "10px", borderRight: "1px solid #e2e8f0" }}>Subject</th>
                      <th style={{ padding: "10px", borderRight: "1px solid #e2e8f0" }}>Subject Teacher</th>
                      <th style={{ padding: "10px", borderRight: "1px solid #e2e8f0", textAlign: "center" }}>Max Marks</th>
                      <th style={{ padding: "10px", borderRight: "1px solid #e2e8f0", textAlign: "center" }}>Obtained</th>
                      <th style={{ padding: "10px", borderRight: "1px solid #e2e8f0", textAlign: "center" }}>Percentage</th>
                      <th style={{ padding: "10px", borderRight: "1px solid #e2e8f0", textAlign: "center" }}>Grade</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                          No marks entered yet for this academic session.
                        </td>
                      </tr>
                    ) : (
                      subjectPerformance.map((sub, idx) => {
                        const grade = getGradeBadge(sub.percentage);
                        const isPass = sub.max > 0 ? sub.percentage >= 35 : null;

                        return (
                          <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                            <td style={{ padding: "10px", borderRight: "1px solid #e2e8f0", textAlign: "center", color: "#64748b" }}>
                              {idx + 1}
                            </td>
                            <td style={{ padding: "10px", borderRight: "1px solid #e2e8f0", fontWeight: 700, color: "#1e293b" }}>
                              {sub.subjectName}
                            </td>
                            <td style={{ padding: "10px", borderRight: "1px solid #e2e8f0", color: "#475569" }}>
                              {sub.teacher} {sub.teacherId ? `(${sub.teacherId})` : ""}
                            </td>
                            <td style={{ padding: "10px", borderRight: "1px solid #e2e8f0", textAlign: "center", color: "#64748b" }}>
                              {sub.max > 0 ? sub.max : "—"}
                            </td>
                            <td style={{ padding: "10px", borderRight: "1px solid #e2e8f0", textAlign: "center", fontWeight: 700, color: "#0f172a" }}>
                              {sub.max > 0 ? sub.obtained : "—"}
                            </td>
                            <td style={{ padding: "10px", borderRight: "1px solid #e2e8f0", textAlign: "center", fontWeight: 600 }}>
                              {sub.max > 0 ? `${sub.percentage}%` : "—"}
                            </td>
                            <td style={{ padding: "10px", borderRight: "1px solid #e2e8f0", textAlign: "center" }}>
                              {sub.max > 0 ? (
                                <span style={{ fontWeight: 800, color: grade.color }}>{grade.grade}</span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td style={{ padding: "10px", textAlign: "center", fontWeight: 700 }}>
                              {isPass === true ? (
                                <span style={{ color: "#16a34a" }}>Pass</span>
                              ) : isPass === false ? (
                                <span style={{ color: "#dc2626" }}>Fail</span>
                              ) : (
                                <span style={{ color: "#94a3b8" }}>Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {subjectPerformance.length > 0 && (
                    <tfoot>
                      <tr style={{ background: "#f8fafc", fontWeight: 800, borderTop: "2px solid #cbd5e1" }}>
                        <td colSpan={3} style={{ padding: "12px", borderRight: "1px solid #e2e8f0", textAlign: "right" }}>
                          GRAND TOTAL &amp; AGGREGATE
                        </td>
                        <td style={{ padding: "12px", borderRight: "1px solid #e2e8f0", textAlign: "center" }}>
                          {summary.totalMaxMarks}
                        </td>
                        <td style={{ padding: "12px", borderRight: "1px solid #e2e8f0", textAlign: "center", color: "#4f46e5" }}>
                          {summary.totalMarksObtained}
                        </td>
                        <td style={{ padding: "12px", borderRight: "1px solid #e2e8f0", textAlign: "center", color: "#4f46e5" }}>
                          {summary.overallPercentage}%
                        </td>
                        <td style={{ padding: "12px", borderRight: "1px solid #e2e8f0", textAlign: "center", color: overallGradeInfo.color }}>
                          {overallGradeInfo.grade}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", color: summary.status === "Pass" ? "#16a34a" : "#ca8a04" }}>
                          {summary.status.toUpperCase()}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Grading Legend & Co-Scholastic Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px", marginBottom: "32px", fontSize: "0.8rem" }}>
                <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontWeight: 700, color: "#334155", marginBottom: "4px" }}>CBSE Grading Scale:</div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", color: "#64748b" }}>
                    <span><strong>A+</strong>: 90-100%</span>
                    <span><strong>A</strong>: 80-89%</span>
                    <span><strong>B+</strong>: 70-79%</span>
                    <span><strong>B</strong>: 60-69%</span>
                    <span><strong>C</strong>: 50-59%</span>
                    <span><strong>D</strong>: 35-49%</span>
                    <span><strong>F</strong>: Below 35%</span>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Attendance Record:</div>
                  <div style={{ color: "#64748b" }}>
                    Total Sessions: <strong>{attStats.total}</strong> • Present: <strong>{attStats.present}</strong> ({attStats.rate}%) • Late: <strong>{attStats.late}</strong>
                  </div>
                </div>
              </div>

              {/* Official Signature Lines */}
              <div style={{ marginTop: "48px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", textAlign: "center", paddingTop: "20px" }}>
                <div>
                  <div style={{ borderTop: "1px solid #0f172a", width: "80%", margin: "0 auto 6px" }}></div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>Class Incharge</span>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>({classInfo.classIncharge || "Signature"})</div>
                </div>
                <div>
                  <div style={{ borderTop: "1px solid #0f172a", width: "80%", margin: "0 auto 6px" }}></div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>Parent / Guardian</span>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>(Signature)</div>
                </div>
                <div>
                  <div style={{ borderTop: "1px solid #0f172a", width: "80%", margin: "0 auto 6px" }}></div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>Principal</span>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>({schoolInfo.principalName || "Principal Admin"})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
