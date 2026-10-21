import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppDispatch";
import { fetchMyMarksThunk } from "../../redux/slices/marksSlice";
import { fetchMyAcademicsApi } from "../../services/api";
import {
  BookOpen,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  Star,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  User,
  GraduationCap,
} from "lucide-react";

// ── SVG Line Chart ──────────────────────────────────────────────────────────
const LineChart = ({ points, width = 280, height = 80, color = "#6366f1" }) => {
  if (!points || points.length < 2) return null;
  const maxY = Math.max(...points.map((p) => p.y), 1);
  const minY = Math.min(...points.map((p) => p.y), 0);
  const range = maxY - minY || 1;
  const padX = 20;
  const padY = 12;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const coords = points.map((p, i) => ({
    x: padX + (i / (points.length - 1)) * chartW,
    y: padY + chartH - ((p.y - minY) / range) * chartH,
    label: p.label,
    val: p.y,
  }));

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {/* Grid lines */}
      {[0, 0.5, 1].map((t, i) => (
        <line
          key={i}
          x1={padX}
          x2={width - padX}
          y1={padY + chartH * (1 - t)}
          y2={padY + chartH * (1 - t)}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}
      {/* Area fill */}
      <path
        d={`${pathD} L ${coords[coords.length - 1].x} ${padY + chartH} L ${coords[0].x} ${padY + chartH} Z`}
        fill={color}
        opacity="0.08"
      />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Data points */}
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={4} fill={color} stroke="white" strokeWidth="2" />
          <text x={c.x} y={height - 2} textAnchor="middle" fontSize="9" fill="#94a3b8">{c.label}</text>
          <text x={c.x} y={c.y - 8} textAnchor="middle" fontSize="9" fill={color} fontWeight="700">{c.val}</text>
        </g>
      ))}
    </svg>
  );
};

// ── Grade badge ────────────────────────────────────────────────────────────
const gradeBadge = (pct) => {
  if (pct >= 90) return { grade: "A+", color: "#10b981", bg: "#d1fae5" };
  if (pct >= 80) return { grade: "A", color: "#10b981", bg: "#d1fae5" };
  if (pct >= 70) return { grade: "B+", color: "#3b82f6", bg: "#dbeafe" };
  if (pct >= 60) return { grade: "B", color: "#6366f1", bg: "#eef2ff" };
  if (pct >= 50) return { grade: "C", color: "#f59e0b", bg: "#fef9c3" };
  if (pct >= 35) return { grade: "D", color: "#f97316", bg: "#ffedd5" };
  return { grade: "F", color: "#ef4444", bg: "#fee2e2" };
};

const SubjectCard = ({ subjectName, examResults = [], color, teacher, teacherId, teacherEmail, code }) => {
  const [expanded, setExpanded] = useState(false);

  const totalObtained = examResults.reduce((s, e) => s + e.marksObtained, 0);
  const totalMax = examResults.reduce((s, e) => s + e.maxMarks, 0);
  const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  const { grade, color: gradeColor, bg: gradeBg } = gradeBadge(overallPct);

  // Progress bar
  const EXAM_ORDER = ["Unit Test", "Mid Term", "Final Exam", "Assignment", "Quiz", "Practical"];
  const orderedResults = EXAM_ORDER.map((t) => examResults.find((e) => e.examType === t)).filter(Boolean);

  const linePoints = orderedResults.map((e) => ({
    label: e.examType.split(" ")[0].slice(0, 3),
    y: e.maxMarks > 0 ? Math.round((e.marksObtained / e.maxMarks) * 100) : 0,
  }));

  const hasTeacher = teacher && teacher !== "Not Assigned";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "14px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        border: `1px solid #e2e8f0`,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.13)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)")}
    >
      {/* Card Header */}
      <div
        style={{
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: expanded ? "1px solid #e2e8f0" : "none",
          background: `linear-gradient(135deg, ${color}12 0%, transparent 100%)`,
          cursor: "pointer",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "10px",
              background: `${color}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color,
              flexShrink: 0,
            }}
          >
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1e293b" }}>{subjectName}</h4>
              {code && (
                <span style={{ fontSize: "0.72rem", background: "#e0e7ff", color: "#3730a3", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                  {code}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
              <span style={{ fontSize: "0.8rem", color: hasTeacher ? "#334155" : "#94a3b8", fontWeight: 500 }}>
                Faculty: <strong>{hasTeacher ? `${teacher}${teacherId ? ` (${teacherId})` : ""}` : "Not Assigned"}</strong>
              </span>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{examResults.length} exam(s)</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {totalMax > 0 ? (
            <>
              {/* Grade badge */}
              <div style={{ background: gradeBg, color: gradeColor, borderRadius: "8px", padding: "4px 12px", fontWeight: 800, fontSize: "1rem" }}>
                {grade}
              </div>
              {/* Percentage */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{overallPct}%</div>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{totalObtained}/{totalMax}</div>
              </div>
            </>
          ) : (
            <span style={{ background: "#f1f5f9", color: "#94a3b8", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>
              No tests recorded
            </span>
          )}
          {/* Toggle */}
          <div style={{ color: "#94a3b8" }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: "4px", background: "#f1f5f9" }}>
        <div
          style={{
            height: "100%",
            width: `${overallPct}%`,
            background: overallPct >= 70 ? color : overallPct >= 50 ? "#f59e0b" : "#ef4444",
            transition: "width 0.8s ease",
            borderRadius: "0 2px 2px 0",
          }}
        />
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div style={{ padding: "20px" }}>
          {/* Line chart */}
          {linePoints.length >= 2 && (
            <div style={{ marginBottom: "20px", overflowX: "auto" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>
                Performance Trend (% by Exam)
              </div>
              <LineChart points={linePoints} color={color} />
            </div>
          )}

          {/* Exam Details Table */}
          {examResults.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "0.88rem" }}>
              No marks entered for this subject yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "8px 12px" }}>Exam Type</th>
                    <th style={{ padding: "8px 12px" }}>Date</th>
                    <th style={{ padding: "8px 12px" }}>Marks Obtained</th>
                    <th style={{ padding: "8px 12px" }}>Max Marks</th>
                    <th style={{ padding: "8px 12px" }}>Percentage</th>
                    <th style={{ padding: "8px 12px" }}>Grade</th>
                    <th style={{ padding: "8px 12px" }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {examResults.map((exam, i) => {
                    const pct = exam.maxMarks > 0 ? Math.round((exam.marksObtained / exam.maxMarks) * 100) : 0;
                    const gb = gradeBadge(pct);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: "#1e293b" }}>{exam.examType}</td>
                        <td style={{ padding: "8px 12px", color: "#64748b" }}>
                          {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding: "8px 12px", fontWeight: 700, color: "#0f172a" }}>{exam.marksObtained}</td>
                        <td style={{ padding: "8px 12px", color: "#64748b" }}>{exam.maxMarks}</td>
                        <td style={{ padding: "8px 12px", fontWeight: 600 }}>{pct}%</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ background: gb.bg, color: gb.color, padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                            {gb.grade}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px", color: "#64748b" }}>{exam.remarks || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SUBJECT_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#3b82f6",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
];

const StudentSubjects = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [academics, setAcademics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetchMyAcademicsApi();
        if (res.success) {
          setAcademics(res);
        }
      } catch (err) {
        console.error("Failed to load student subjects:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    dispatch(fetchMyMarksThunk());
  }, [dispatch]);

  const assignedSubjects = academics?.assignedSubjects || [];
  const marks = academics?.marks || [];
  const summary = academics?.summary || {
    totalMarksObtained: 0,
    totalMaxMarks: 0,
    overallPercentage: 0,
    overallGrade: "N/A",
  };

  // Group marks by subject
  const subjectGroups = useMemo(() => {
    const map = {};
    // First seed with all assigned subjects
    assignedSubjects.forEach((sub, i) => {
      map[sub.name] = {
        name: sub.name,
        code: sub.code,
        teacher: sub.teacher,
        teacherId: sub.teacherId,
        teacherEmail: sub.teacherEmail,
        exams: [],
        color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
      };
    });

    // Populate exams from marks
    marks.forEach((m) => {
      if (!map[m.subjectName]) {
        map[m.subjectName] = {
          name: m.subjectName,
          code: "",
          teacher: "Not Assigned",
          teacherId: "",
          teacherEmail: "",
          exams: [],
          color: SUBJECT_COLORS[Object.keys(map).length % SUBJECT_COLORS.length],
        };
      }
      map[m.subjectName].exams.push(m);
    });

    return Object.values(map);
  }, [assignedSubjects, marks]);

  const overallGrade = gradeBadge(summary.overallPercentage);

  return (
    <div className="tch-container" style={{ paddingBottom: "40px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "6px" }}>
          <div style={{ width: 44, height: 44, background: "#eef2ff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
            <BarChart2 size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#1e293b" }}>My Subjects &amp; Marks</h1>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
              {user?.classStandard ? `Class ${user.classStandard}${user?.section ? ` - ${user.section}` : ""}` : ""} — View your subject teachers and test marks
            </p>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Overall Average", val: marks.length > 0 ? `${summary.overallPercentage}%` : "Pending", icon: <TrendingUp size={20} />, color: "#6366f1", bg: "#eef2ff" },
          { label: "Overall Grade", val: marks.length > 0 ? overallGrade.grade : "N/A", icon: <Award size={20} />, color: overallGrade.color, bg: overallGrade.bg },
          { label: "Total Tests", val: marks.length, icon: <Star size={20} />, color: "#10b981", bg: "#d1fae5" },
          { label: "Assigned Subjects", val: assignedSubjects.length, icon: <BookOpen size={20} />, color: "#3b82f6", bg: "#dbeafe" },
        ].map((stat, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "14px", border: "1px solid #e2e8f0" }}>
            <div style={{ width: 44, height: 44, borderRadius: "10px", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: stat.color || "#1e293b", lineHeight: 1 }}>{stat.val}</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Subject Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          Loading your subjects and marks...
        </div>
      ) : subjectGroups.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "14px", padding: "48px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
          <BookOpen size={40} color="#94a3b8" style={{ marginBottom: "12px" }} />
          <h3 style={{ margin: "0 0 8px", color: "#475569" }}>No Subjects Configured Yet</h3>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>
            Your class incharge or principal has not assigned subjects to your class yet. Check back soon!
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {subjectGroups.map((group) => (
            <SubjectCard
              key={group.name}
              subjectName={group.name}
              code={group.code}
              teacher={group.teacher}
              teacherId={group.teacherId}
              teacherEmail={group.teacherEmail}
              examResults={group.exams}
              color={group.color}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentSubjects;
