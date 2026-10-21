import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Chart } from 'react-google-charts';
import { useAppSelector } from '../../hooks/useAppDispatch';
import {
  fetchTeacherDashboardApi,
  fetchComplaintsApi,
  fetchTeacherNotificationsApi,
  createMarksApi,
  fetchStudentsApi,
  fetchDailyAttendanceApi,
  fetchMonthlyAttendanceApi,
  bulkMarkAttendanceApi,
} from '../../services/api';
import {
  Clock,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Bell,
  ChevronRight,
  PlusCircle,
  AlertCircle,
  Info,
  BarChart3,
  FileEdit,
  Check,
  X,
  Award,
  Calendar,
  Users,
  Download,
  Save,
  CheckCircle2,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Attendance Modal State ──
  const [attendanceModal, setAttendanceModal] = useState(null);
  const [attModalTab, setAttModalTab] = useState("daily"); // "daily" | "monthly"
  const [attDate, setAttDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attMonth, setAttMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [attRoster, setAttRoster] = useState([]);
  const [attSummary, setAttSummary] = useState(null);
  const [attMonthlyData, setAttMonthlyData] = useState(null);
  const [attLoading, setAttLoading] = useState(false);
  const [savingAtt, setSavingAtt] = useState(false);
  const [attSuccessMsg, setAttSuccessMsg] = useState("");
  const [attErrorMsg, setAttErrorMsg] = useState("");

  // ── Marks Entry Modal State ──
  const [marksModal, setMarksModal] = useState(null);
  const [modalStudents, setModalStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [examType, setExamType] = useState("Unit Test");
  const [examDate, setExamDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [maxMarks, setMaxMarks] = useState(100);
  const [marksInputs, setMarksInputs] = useState({});
  const [savingMarks, setSavingMarks] = useState(false);
  const [marksSuccessMsg, setMarksSuccessMsg] = useState("");
  const [marksErrorMsg, setMarksErrorMsg] = useState("");

  // ── Attendance Modal Handlers ──
  const openAttendanceModal = async (assignment) => {
    setAttendanceModal(assignment);
    setAttModalTab("daily");
    setAttSuccessMsg("");
    setAttErrorMsg("");
    await loadTeacherDailyAttendance(assignment, attDate);
  };

  const loadTeacherDailyAttendance = async (assignment, dateVal) => {
    const targetAssignment = assignment || attendanceModal;
    if (!targetAssignment) return;
    setAttLoading(true);
    setAttErrorMsg("");
    setAttSuccessMsg("");
    try {
      const classGrade = targetAssignment.classDetails?.grade || targetAssignment.classDetails?.name?.replace(/[^0-9]/g, "");
      const res = await fetchDailyAttendanceApi({
        classStandard: classGrade,
        section: targetAssignment.section || "A",
        date: dateVal || attDate,
      });
      if (res && res.success) {
        setAttRoster(res.students || []);
        setAttSummary(res.summary || null);
      }
    } catch (err) {
      console.error("loadTeacherDailyAttendance error:", err);
      setAttErrorMsg(err.response?.data?.message || "Failed to load attendance for this class.");
    } finally {
      setAttLoading(false);
    }
  };

  const loadTeacherMonthlyAttendance = async (assignment, monthVal) => {
    const targetAssignment = assignment || attendanceModal;
    if (!targetAssignment) return;
    setAttLoading(true);
    setAttErrorMsg("");
    try {
      const classGrade = targetAssignment.classDetails?.grade || targetAssignment.classDetails?.name?.replace(/[^0-9]/g, "");
      const res = await fetchMonthlyAttendanceApi({
        classStandard: classGrade,
        section: targetAssignment.section || "A",
        month: monthVal || attMonth,
      });
      if (res && res.success) {
        setAttMonthlyData(res);
      }
    } catch (err) {
      console.error("loadTeacherMonthlyAttendance error:", err);
      setAttErrorMsg(err.response?.data?.message || "Failed to load monthly attendance.");
    } finally {
      setAttLoading(false);
    }
  };

  const handleAttStatusChange = (studentId, newStatus) => {
    setAttRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleAttRemarksChange = (studentId, remarks) => {
    setAttRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  const handleAttMarkAll = (status) => {
    setAttRoster((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSaveTeacherAttendance = async () => {
    if (!attendanceModal) return;
    setSavingAtt(true);
    setAttSuccessMsg("");
    setAttErrorMsg("");
    try {
      const classGrade = attendanceModal.classDetails?.grade || attendanceModal.classDetails?.name?.replace(/[^0-9]/g, "");
      const records = attRoster.map((s) => ({
        studentId: s.studentId,
        date: attDate,
        status: s.status === "Unmarked" ? "Present" : s.status,
        remarks: s.remarks || "",
        classStandard: classGrade,
        section: attendanceModal.section || "A",
        subject: attendanceModal.subject || "",
      }));

      const res = await bulkMarkAttendanceApi({
        classStandard: classGrade,
        section: attendanceModal.section || "A",
        date: attDate,
        records,
      });

      if (res && res.success) {
        setAttSuccessMsg(`Attendance saved successfully for ${res.count || records.length} students on ${attDate}.`);
        await loadTeacherDailyAttendance(attendanceModal, attDate);
      }
    } catch (err) {
      console.error("Teacher attendance save error:", err);
      setAttErrorMsg(err.response?.data?.message || "Failed to record attendance.");
    } finally {
      setSavingAtt(false);
    }
  };

  const openMarksModal = async (assignment) => {
    setMarksModal(assignment);
    setMarksSuccessMsg("");
    setMarksErrorMsg("");
    setStudentsLoading(true);
    try {
      const classGrade = assignment.classDetails?.grade || assignment.classDetails?.name?.replace(/[^0-9]/g, "");
      const res = await fetchStudentsApi({
        classStandard: classGrade,
        section: assignment.section || "A",
      });
      const students = res.students || [];
      setModalStudents(students);
      const initial = {};
      students.forEach((st) => {
        initial[st.studentId] = { marksObtained: "", remarks: "" };
      });
      setMarksInputs(initial);
    } catch (err) {
      console.error("Error loading students for marks entry:", err);
      setMarksErrorMsg("Failed to load students for this class.");
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleSaveMarks = async () => {
    if (!marksModal) return;
    setSavingMarks(true);
    setMarksSuccessMsg("");
    setMarksErrorMsg("");

    try {
      const records = [];
      modalStudents.forEach((st) => {
        const input = marksInputs[st.studentId];
        if (input && input.marksObtained !== "" && !isNaN(Number(input.marksObtained))) {
          records.push({
            studentId: st.studentId,
            studentRef: st._id,
            subjectName: marksModal.subject,
            classStandard: st.classStandard,
            section: st.section || marksModal.section,
            examType,
            examDate,
            marksObtained: Number(input.marksObtained),
            maxMarks: Number(maxMarks) || 100,
            remarks: input.remarks || "",
          });
        }
      });

      if (records.length === 0) {
        setMarksErrorMsg("Please enter marks for at least one student.");
        setSavingMarks(false);
        return;
      }

      const res = await createMarksApi({ records });
      if (res.success) {
        setMarksSuccessMsg(`Successfully saved marks for ${records.length} student(s)! Authorized updates are now live.`);
      }
    } catch (err) {
      console.error("Failed to save marks:", err);
      setMarksErrorMsg(err.response?.data?.message || "Failed to save marks.");
    } finally {
      setSavingMarks(false);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [dashRes, complaintsRes, notifsRes] = await Promise.allSettled([
          fetchTeacherDashboardApi(),
          fetchComplaintsApi(),
          fetchTeacherNotificationsApi(),
        ]);

        if (dashRes.status === "fulfilled" && dashRes.value.success) {
          setDashboardData(dashRes.value);
        } else if (dashRes.status === "rejected") {
          setError(
            dashRes.reason?.response?.data?.message ||
              'An error occurred while fetching dashboard data'
          );
        }

        if (complaintsRes.status === "fulfilled" && complaintsRes.value.success) {
          setComplaints(complaintsRes.value.data || []);
        }

        if (notifsRes.status === "fulfilled" && notifsRes.value.success) {
          setNotifications(notifsRes.value.data || []);
          setUnreadNotifCount(notifsRes.value.unreadCount || 0);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'An error occurred while fetching dashboard data'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const { teacher, assignments } = dashboardData || {};

  // Status counts for Complaints
  const pendingComplaints = complaints.filter((c) => c.status === "Pending").length;
  const inProgressComplaints = complaints.filter((c) => c.status === "In Progress").length;
  const resolvedComplaints = complaints.filter((c) => c.status === "Resolved").length;

  // ── Google Charts Data ──────────────────────────────────────
  const teachingWorkloadData = useMemo(() => {
    const subjCount = {};
    if (assignments && assignments.length > 0) {
      assignments.forEach((a) => {
        const name = a.subject || "General";
        subjCount[name] = (subjCount[name] || 0) + 1;
      });
    } else if (teacher?.assignedSubjects && teacher.assignedSubjects.length > 0) {
      teacher.assignedSubjects.forEach((subj) => {
        subjCount[subj] = 1;
      });
    }

    const entries = Object.entries(subjCount);
    if (entries.length === 0) {
      return [
        ["Subject", "Assigned Classes", { role: "style" }],
        ["None Assigned", 0, "#94a3b8"],
      ];
    }

    const colors = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#06b6d4"];
    return [
      ["Subject", "Assigned Classes", { role: "style" }],
      ...entries.map(([subject, count], idx) => [
        subject,
        count,
        colors[idx % colors.length],
      ]),
    ];
  }, [assignments, teacher]);

  const complaintsChartData = useMemo(() => {
    if (pendingComplaints + inProgressComplaints + resolvedComplaints === 0) {
      return [
        ["Status", "Complaints"],
        ["No Complaints", 1],
      ];
    }
    const rows = [["Status", "Complaints"]];
    if (pendingComplaints > 0) rows.push(["Pending", pendingComplaints]);
    if (inProgressComplaints > 0) rows.push(["In Progress", inProgressComplaints]);
    if (resolvedComplaints > 0) rows.push(["Resolved", resolvedComplaints]);
    return rows;
  }, [pendingComplaints, inProgressComplaints, resolvedComplaints]);

  const complaintsCategoryData = useMemo(() => {
    const catMap = {};
    if (complaints && complaints.length > 0) {
      complaints.forEach((c) => {
        const cat = c.category || c.subject || "General";
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
    }

    const entries = Object.entries(catMap);
    if (entries.length === 0) {
      return [
        ["Category", "Issues", { role: "style" }],
        ["No Complaints", 0, "#8b5cf6"],
      ];
    }

    const colors = ["#8b5cf6", "#f59e0b", "#6366f1", "#10b981", "#ef4444", "#3b82f6"];
    return [
      ["Category", "Issues", { role: "style" }],
      ...entries.map(([category, count], idx) => [
        category,
        count,
        colors[idx % colors.length],
      ]),
    ];
  }, [complaints]);

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '24px', color: 'red', textAlign: 'center' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* ── WELCOME BANNER ── */}
      <div style={{ 
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
        borderRadius: '16px', 
        padding: '32px', 
        color: 'white',
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>
            Welcome back, {teacher?.fullName || user?.name}!
          </h2>
          <p style={{ color: '#bfdbfe', marginTop: '12px', fontSize: '1.1rem', maxWidth: '600px' }}>
            This is your Subject Teacher Dashboard. Track assigned classes, view announcements from the Principal, and monitor facility complaint statuses.
          </p>
        </div>
        <div style={{
          position: 'absolute',
          right: '-20px',
          bottom: '-40px',
          opacity: 0.1,
          transform: 'rotate(-15deg)',
          fontSize: '150px'
        }}>
          👨‍🏫
        </div>
      </div>

      {/* ── PROFILE & QUICK STATS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>📋</span> Profile Info
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>Teacher ID:</span>
              <span style={{ color: '#334155', fontWeight: '600' }}>{teacher?.teacherId || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>Department:</span>
              <span style={{ color: '#334155', fontWeight: '600' }}>{teacher?.department || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>Designation:</span>
              <span style={{ color: '#334155', fontWeight: '600' }}>{teacher?.designation || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>📚</span> Quick Stats
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
                {assignments?.length || 0}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
                Total Assignments
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
                {new Set(assignments?.map(a => a.subject)).size || 0}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
                Unique Subjects
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── GRAPHICAL ACADEMIC & COMPLAINTS ANALYTICS (react-google-charts) ── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: '#eff6ff', color: '#2563eb', padding: '8px', borderRadius: '10px', display: 'flex' }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>
              Academic &amp; Operations Visual Analytics
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Teaching allocation across classes &amp; facility resolution status powered by react-google-charts
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Chart 1: Teaching Workload by Subject */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Subject Teaching Allocation</span>
              <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>Column Chart</span>
            </div>
            <Chart
              chartType="ColumnChart"
              width="100%"
              height="250px"
              data={teachingWorkloadData}
              options={{
                backgroundColor: 'transparent',
                chartArea: { width: '85%', height: '65%' },
                legend: { position: 'none' },
                colors: ['#3b82f6'],
                hAxis: {
                  textStyle: { color: '#64748b', fontSize: 11 },
                },
                vAxis: {
                  minValue: 0,
                  textStyle: { color: '#64748b', fontSize: 11 },
                  gridlines: { color: '#f1f5f9' },
                },
                animation: {
                  startup: true,
                  duration: 800,
                  easing: 'out',
                },
              }}
              loader={<div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading Chart...</div>}
            />
          </div>

          {/* Chart 2: Complaints Status Breakdown */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Complaints Resolution Status</span>
              <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>Donut Chart</span>
            </div>
            <Chart
              chartType="PieChart"
              width="100%"
              height="250px"
              data={complaintsChartData}
              options={{
                pieHole: 0.45,
                backgroundColor: 'transparent',
                chartArea: { width: '90%', height: '80%' },
                colors: ['#f59e0b', '#6366f1', '#10b981'],
                legend: { position: 'bottom', textStyle: { color: '#475569', fontSize: 12 } },
                pieSliceTextStyle: { fontSize: 12, fontWeight: 'bold' },
              }}
              loader={<div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading Chart...</div>}
            />
          </div>

          {/* Chart 3: Complaints by Category */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Complaints by Category</span>
              <span style={{ fontSize: '0.75rem', background: '#f3e8ff', color: '#7e22ce', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>Bar Chart</span>
            </div>
            <Chart
              chartType="BarChart"
              width="100%"
              height="250px"
              data={complaintsCategoryData}
              options={{
                backgroundColor: 'transparent',
                chartArea: { width: '70%', height: '70%' },
                legend: { position: 'none' },
                colors: ['#8b5cf6'],
                hAxis: {
                  minValue: 0,
                  textStyle: { color: '#64748b', fontSize: 11 },
                  gridlines: { color: '#f1f5f9' },
                },
                vAxis: {
                  textStyle: { color: '#64748b', fontSize: 11 },
                },
                animation: {
                  startup: true,
                  duration: 800,
                  easing: 'out',
                },
              }}
              loader={<div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading Chart...</div>}
            />
          </div>
        </div>
      </div>

      {/* ── COMPLAINTS STATUS & RECENT NOTIFICATIONS SECTION ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Complaints Status Panel */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} color="#6366f1" />
              <span>Complaints &amp; Facility Issues</span>
            </h3>
            <Link
              to="/teacher/complaints"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#4f46e5',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              <PlusCircle size={14} /> New Issue
            </Link>
          </div>

          {/* Status Breakdown Badges (Pending, In Progress, Resolved) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#b45309' }}>
                {pendingComplaints}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                <Clock size={12} /> Pending
              </div>
            </div>

            <div style={{ background: '#e0e7ff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#4338ca' }}>
                {inProgressComplaints}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                <RefreshCw size={12} /> In Progress
              </div>
            </div>

            <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#15803d' }}>
                {resolvedComplaints}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                <CheckCircle size={12} /> Resolved
              </div>
            </div>
          </div>

          {/* Recent Complaints List */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Issues Submitted
            </div>
            {complaints.length === 0 ? (
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No complaints submitted yet. Report electricity, water, washroom, or facility issues.
              </div>
            ) : (
              complaints.slice(0, 3).map((cmp) => {
                const statusStyle =
                  cmp.status === 'Resolved'
                    ? { bg: '#dcfce7', text: '#15803d' }
                    : cmp.status === 'In Progress'
                    ? { bg: '#e0e7ff', text: '#4338ca' }
                    : { bg: '#fef3c7', text: '#b45309' };

                return (
                  <div
                    key={cmp._id}
                    style={{
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.88rem', color: '#1e293b' }}>
                        {cmp.subject}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        {cmp.category} • {cmp.location}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        background: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                    >
                      {cmp.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <Link
            to="/teacher/complaints"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#4f46e5',
              fontWeight: '600',
              fontSize: '0.85rem',
              textDecoration: 'none',
              paddingTop: '8px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            Manage &amp; Track All Complaints <ChevronRight size={15} />
          </Link>
        </div>

        {/* Notifications Preview Panel */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={20} color="#2563eb" />
              <span>Principal Announcements</span>
            </h3>
            {unreadNotifCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                }}
              >
                {unreadNotifCount} Unread
              </span>
            )}
          </div>

          {/* Recent Notifications List */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Latest Messages Received
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No notifications received yet. Announcements from Principal will appear here.
              </div>
            ) : (
              notifications.slice(0, 3).map((notif) => {
                const isUrgent = notif.priority === 'Urgent';
                const isImportant = notif.priority === 'Important';
                const badgeColor = isUrgent
                  ? { bg: '#fee2e2', text: '#991b1b' }
                  : isImportant
                  ? { bg: '#fef3c7', text: '#92400e' }
                  : { bg: '#eff6ff', text: '#1e40af' };

                return (
                  <div
                    key={notif._id}
                    style={{
                      padding: '10px 12px',
                      background: notif.isRead ? '#f8fafc' : '#f0fdf4',
                      borderRadius: '8px',
                      border: notif.isRead ? '1px solid #e2e8f0' : '1px solid #bbf7d0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.88rem', color: '#1e293b' }}>
                        {notif.title}
                      </span>
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          background: badgeColor.bg,
                          color: badgeColor.text,
                        }}
                      >
                        {notif.priority}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {notif.message}
                    </p>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      From: {notif.senderName} • {new Date(notif.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Link
            to="/teacher/notifications"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#2563eb',
              fontWeight: '600',
              fontSize: '0.85rem',
              textDecoration: 'none',
              paddingTop: '8px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            Open Notifications Inbox <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {/* ── ASSIGNED CLASSES TABLE ── */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🎓</span> Assigned Classes &amp; Subjects
          </h3>
        </div>
        
        {assignments && assignments.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Class &amp; Section</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Subject</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Class Incharge</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Grade Level</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment, index) => {
                  const classInfo = assignment.classDetails || {};
                  
                  // Find the class incharge name for this specific section, fallback to general class incharge
                  let inchargeName = 'Not Assigned';
                  
                  if (classInfo.sections && Array.isArray(classInfo.sections)) {
                    const sectionMatch = classInfo.sections.find(s => s.name === assignment.section);
                    if (sectionMatch && sectionMatch.classIncharge) {
                      inchargeName = sectionMatch.classIncharge.name || sectionMatch.classIncharge.email;
                    } else if (classInfo.classIncharge) {
                      inchargeName = classInfo.classIncharge.name || classInfo.classIncharge.email;
                    }
                  } else if (classInfo.classIncharge) {
                    inchargeName = classInfo.classIncharge.name || classInfo.classIncharge.email;
                  }

                  return (
                    <tr 
                      key={assignment._id || index}
                      style={{ 
                        borderBottom: index === assignments.length - 1 ? 'none' : '1px solid #e2e8f0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            background: '#eff6ff', 
                            color: '#2563eb', 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '8px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '1.1rem'
                          }}>
                            {classInfo.name?.[0] || '-'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{classInfo.name || 'Unknown Class'}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Section: {assignment.section || 'A'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          background: '#f0fdf4', 
                          color: '#16a34a', 
                          padding: '4px 12px', 
                          borderRadius: '999px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          border: '1px solid #bbf7d0'
                        }}>
                          {assignment.subject}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            color: '#64748b'
                          }}>
                            👤
                          </div>
                          <span style={{ color: '#334155', fontWeight: '500' }}>
                            {inchargeName}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: '#64748b' }}>
                        {classInfo.grade || 'N/A'}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => openMarksModal(assignment)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.84rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                          <FileEdit size={14} /> Enter / Update Marks
                        </button>

                        <button
                          onClick={() => openAttendanceModal(assignment)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: '#f0fdf4',
                            color: '#16a34a',
                            border: '1px solid #86efac',
                            borderRadius: '8px',
                            fontSize: '0.84rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginLeft: '8px',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                        >
                          <Calendar size={14} /> Attendance
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
            <h4 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#334155' }}>No Assignments Found</h4>
            <p style={{ margin: 0 }}>You currently have no classes or subjects assigned to you.</p>
          </div>
        )}
      </div>

      {/* ── TEACHER MARKS ENTRY MODAL ── */}
      {marksModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMarksModal(null);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} color="#a5b4fc" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                    Enter Marks: {marksModal.subject}
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#c7d2fe' }}>
                  Class: {marksModal.classDetails?.name || 'Class'} (Section {marksModal.section || 'A'}) • Authorized Subject Teacher Marks Entry
                </p>
              </div>
              <button
                onClick={() => setMarksModal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Assessment Meta Row */}
            <div
              style={{
                padding: '16px 24px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Assessment Type
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    background: '#ffffff',
                    color: '#1e293b',
                    fontWeight: '500',
                  }}
                >
                  <option value="Unit Test">Unit Test</option>
                  <option value="Mid Term">Mid Term</option>
                  <option value="Final Exam">Final Exam</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Practical">Practical</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Exam / Test Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    background: '#ffffff',
                    color: '#1e293b',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Maximum Marks
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value) || 100)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    background: '#ffffff',
                    color: '#1e293b',
                  }}
                />
              </div>
            </div>

            {/* Banners */}
            {marksSuccessMsg && (
              <div style={{ margin: '12px 24px 0', padding: '12px 16px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={18} /> {marksSuccessMsg}
              </div>
            )}
            {marksErrorMsg && (
              <div style={{ margin: '12px 24px 0', padding: '12px 16px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} /> {marksErrorMsg}
              </div>
            )}

            {/* Students Marks Input Table */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {studentsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Loading enrolled students...
                </div>
              ) : modalStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No students found in this class and section.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Roll No</th>
                      <th style={{ padding: '10px 12px' }}>Student ID</th>
                      <th style={{ padding: '10px 12px' }}>Student Name</th>
                      <th style={{ padding: '10px 12px', width: '140px' }}>Marks (out of {maxMarks})</th>
                      <th style={{ padding: '10px 12px' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalStudents.map((st) => {
                      const input = marksInputs[st.studentId] || { marksObtained: '', remarks: '' };
                      return (
                        <tr key={st._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', fontWeight: '600', color: '#1e293b' }}>
                            {st.rollno}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#6366f1', fontFamily: 'monospace', fontWeight: '600' }}>
                            {st.studentId}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: '500', color: '#334155' }}>
                            {st.studentName}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="number"
                              min="0"
                              max={maxMarks}
                              placeholder="e.g. 85"
                              value={input.marksObtained}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMarksInputs((prev) => ({
                                  ...prev,
                                  [st.studentId]: {
                                    ...prev[st.studentId],
                                    marksObtained: val,
                                  },
                                }));
                              }}
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.88rem',
                                fontWeight: '600',
                                color: '#0f172a',
                              }}
                            />
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="text"
                              placeholder="Optional remarks"
                              value={input.remarks}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMarksInputs((prev) => ({
                                  ...prev,
                                  [st.studentId]: {
                                    ...prev[st.studentId],
                                    remarks: val,
                                  },
                                }));
                              }}
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.82rem',
                                color: '#334155',
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Updates will be immediately accessible on the Student Portal.
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMarksModal(null)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMarks}
                  disabled={savingMarks || modalStudents.length === 0}
                  style={{
                    padding: '8px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: savingMarks ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: savingMarks ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {savingMarks ? 'Saving...' : 'Publish & Save Marks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ATTENDANCE MANAGEMENT MODAL ── */}
      {attendanceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '950px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} color="#10b981" />
                  <span>
                    Class Attendance: {attendanceModal.classDetails?.name || 'Class'} (Section {attendanceModal.section || 'A'})
                  </span>
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                  Subject: <strong>{attendanceModal.subject}</strong> • Authorized Subject Teacher Attendance
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAttendanceModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#ffffff', padding: '0 24px' }}>
              <button
                type="button"
                onClick={() => {
                  setAttModalTab('daily');
                  loadTeacherDailyAttendance(attendanceModal, attDate);
                }}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  background: 'none',
                  borderBottom: attModalTab === 'daily' ? '3px solid #10b981' : '3px solid transparent',
                  color: attModalTab === 'daily' ? '#059669' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Calendar size={15} />
                <span>Daily Attendance</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttModalTab('monthly');
                  loadTeacherMonthlyAttendance(attendanceModal, attMonth);
                }}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  background: 'none',
                  borderBottom: attModalTab === 'monthly' ? '3px solid #10b981' : '3px solid transparent',
                  color: attModalTab === 'monthly' ? '#059669' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <BarChart3 size={15} />
                <span>Monthly Summary</span>
              </button>
            </div>

            {/* Banners */}
            {attSuccessMsg && (
              <div style={{ margin: '12px 24px 0', padding: '10px 16px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', fontSize: '0.86rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> {attSuccessMsg}
              </div>
            )}
            {attErrorMsg && (
              <div style={{ margin: '12px 24px 0', padding: '10px 16px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '0.86rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {attErrorMsg}
              </div>
            )}

            {/* ── TAB 1: DAILY ATTENDANCE ── */}
            {attModalTab === 'daily' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Date & Preset Controls */}
                <div style={{ padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Date:</span>
                    <input
                      type="date"
                      value={attDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setAttDate(newDate);
                        loadTeacherDailyAttendance(attendanceModal, newDate);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: '#1e293b',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleAttMarkAll('Present')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: '1px solid #86efac',
                        background: '#f0fdf4',
                        color: '#166534',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ✓ All Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAttMarkAll('Absent')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: '1px solid #fca5a5',
                        background: '#fef2f2',
                        color: '#991b1b',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ✕ All Absent
                    </button>
                  </div>
                </div>

                {/* Daily Summary Metrics Bar */}
                {attSummary && (
                  <div style={{ padding: '10px 24px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                    <span style={{ color: '#64748b' }}>Total: <strong>{attSummary.totalStudents}</strong></span>
                    <span style={{ color: '#16a34a' }}>Present: <strong>{attSummary.presentCount}</strong></span>
                    <span style={{ color: '#dc2626' }}>Absent: <strong>{attSummary.absentCount}</strong></span>
                    <span style={{ color: '#d97706' }}>Late: <strong>{attSummary.lateCount}</strong></span>
                    <span style={{ color: '#2563eb' }}>Half Day: <strong>{attSummary.halfDayCount}</strong></span>
                    <span style={{ color: '#7c3aed' }}>Rate: <strong>{attSummary.attendancePercentage}%</strong></span>
                  </div>
                )}

                {/* Students Attendance Table */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
                  {attLoading ? (
                    <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      Loading daily roster...
                    </div>
                  ) : attRoster.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No students found for this class and section.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                          <th style={{ padding: '8px 10px', width: '60px' }}>Roll</th>
                          <th style={{ padding: '8px 10px', width: '90px' }}>ID</th>
                          <th style={{ padding: '8px 10px' }}>Student Name</th>
                          <th style={{ padding: '8px 10px', minWidth: '280px' }}>Status</th>
                          <th style={{ padding: '8px 10px' }}>Remarks</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Info</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attRoster.map((st) => (
                          <tr key={st.studentId} style={{ borderBottom: '1px solid #f1f5f9', background: st.status === 'Absent' ? '#fef2f2' : 'inherit' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#64748b' }}>{st.rollno}</td>
                            <td style={{ padding: '8px 10px', color: '#0f766e', fontFamily: 'monospace', fontWeight: 700 }}>{st.studentId}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>{st.studentName}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {[
                                  { key: 'Present', color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
                                  { key: 'Absent', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
                                  { key: 'Late', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
                                  { key: 'Half Day', color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe' },
                                ].map((pill) => {
                                  const isSelected = st.status === pill.key;
                                  return (
                                    <button
                                      key={pill.key}
                                      type="button"
                                      onClick={() => handleAttStatusChange(st.studentId, pill.key)}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        border: isSelected ? `2px solid ${pill.color}` : '1px solid #cbd5e1',
                                        background: isSelected ? pill.bg : '#ffffff',
                                        color: isSelected ? pill.color : '#64748b',
                                      }}
                                    >
                                      {pill.key}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="text"
                                placeholder="Note"
                                value={st.remarks || ''}
                                onChange={(e) => handleAttRemarksChange(st.studentId, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.78rem',
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '0.72rem', color: '#64748b' }}>
                              {st.attendanceId ? (
                                <span style={{ color: '#16a34a', fontWeight: 700 }}>● Saved</span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>Unsaved</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Daily Footer */}
                <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Attendance records are stored in MongoDB with your recording user ID.
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setAttendanceModal(null)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#475569',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTeacherAttendance}
                      disabled={savingAtt || attRoster.length === 0}
                      style={{
                        padding: '7px 20px',
                        borderRadius: '6px',
                        border: 'none',
                        background: savingAtt ? '#94a3b8' : '#10b981',
                        color: '#ffffff',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: savingAtt ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {savingAtt ? 'Saving...' : 'Save Attendance'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: MONTHLY SUMMARY ── */}
            {attModalTab === 'monthly' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Month:</span>
                    <input
                      type="month"
                      value={attMonth}
                      onChange={(e) => {
                        const newMonth = e.target.value;
                        setAttMonth(newMonth);
                        loadTeacherMonthlyAttendance(attendanceModal, newMonth);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: '#1e293b',
                      }}
                    />
                  </div>

                  {attMonthlyData?.classSummary && (
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                      Sessions Held: <strong>{attMonthlyData.classSummary.totalSessions} Days</strong> • Class Avg: <strong>{attMonthlyData.classSummary.averagePercentage}%</strong>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
                  {attLoading ? (
                    <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      Loading monthly summary...
                    </div>
                  ) : !attMonthlyData?.students || attMonthlyData.students.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No records found for {attMonth}.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                          <th style={{ padding: '8px 10px', width: '60px' }}>Roll</th>
                          <th style={{ padding: '8px 10px', width: '90px' }}>ID</th>
                          <th style={{ padding: '8px 10px' }}>Student Name</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center' }}>Present</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center' }}>Absent</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center' }}>Late</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center' }}>Total Marked</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Attendance %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attMonthlyData.students.map((st) => (
                          <tr key={st.studentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#64748b' }}>{st.rollno}</td>
                            <td style={{ padding: '8px 10px', color: '#0f766e', fontFamily: 'monospace', fontWeight: 700 }}>{st.studentId}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>{st.studentName}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>{st.presentDays}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{st.absentDays}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#d97706', fontWeight: 700 }}>{st.lateDays}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>{st.totalDays}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                background: st.attendancePercentage >= 75 ? '#dcfce7' : st.attendancePercentage >= 60 ? '#fef3c7' : '#fee2e2',
                                color: st.attendancePercentage >= 75 ? '#166534' : st.attendancePercentage >= 60 ? '#92400e' : '#991b1b',
                              }}>
                                {st.attendancePercentage}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setAttendanceModal(null)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
