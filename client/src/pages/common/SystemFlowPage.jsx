import React, { useState } from "react";
import {
  ShieldCheck,
  UserCheck,
  BookOpen,
  GraduationCap,
  Lock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Workflow,
  Key,
  Database,
  Layers,
  FileSpreadsheet,
  Users,
  Check,
  Shield,
  FileText,
  RefreshCw,
  Sliders,
  Upload,
  Plus,
  Trash2,
  Edit2,
  LayoutDashboard,
  UserCircle,
  Search,
  Bell,
  MessageSquareWarning,
  Calendar,
  ClipboardList,
  Award,
  BarChart3,
  TrendingUp,
  School,
  Settings,
  Mail,
  ChevronRight,
  Clock,
  Send,
  AlertTriangle,
  FolderTree,
} from "lucide-react";

const SystemFlowPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  // Tab definitions for interactive workflow filtering
  const tabs = [
    { id: "all", label: "Complete System Overview", icon: <Workflow size={15} /> },
    { id: "principal", label: "Principal Workflows", icon: <ShieldCheck size={15} /> },
    { id: "class_incharge", label: "Class Incharge Workflows", icon: <UserCheck size={15} /> },
    { id: "teacher", label: "Subject Teacher Workflows", icon: <BookOpen size={15} /> },
    { id: "student", label: "Student Workflows", icon: <GraduationCap size={15} /> },
    { id: "crosscutting", label: "Shared Engines (Sync & Broadcast)", icon: <RefreshCw size={15} /> },
  ];

  // 1. Bi-Directional Class Incharge Sync Flow Steps
  const syncFlowSteps = [
    {
      step: "1",
      title: "Assignment Initiation",
      subtitle: "Principal Action",
      desc: "Principal assigns or changes a Class Incharge from Classes section (per-class or per-section) OR Teachers Directory OR Manage Class Incharges.",
      icon: <Plus className="text-indigo-600" size={20} />,
      badge: "Principal Action",
    },
    {
      step: "2",
      title: "Backend Sync Engine",
      subtitle: "principalController / syncHelper",
      desc: "Atomic database updates synchronize User, Teacher, and Class records without duplication, maintaining single source of truth.",
      icon: <RefreshCw className="text-purple-600" size={20} />,
      badge: "Atomic Single-Source Sync",
    },
    {
      step: "3",
      title: "Persistent Storage",
      subtitle: "MongoDB Document Update",
      desc: "Simultaneously updates Class.classIncharge, sections.$.classIncharge, User.role/assignedClass, and Teacher.role/assignedClass.",
      icon: <Database className="text-emerald-600" size={20} />,
      badge: "Persistent across Refresh",
    },
    {
      step: "4",
      title: "Multi-Section Sync",
      subtitle: "Real-Time Reflection",
      desc: "Teacher Name, Auto Teacher-ID, and Assigned Class update instantaneously across Classes Grid, Teachers Directory, and Incharges Roster.",
      icon: <CheckCircle2 className="text-blue-600" size={20} />,
      badge: "Real-Time Synchronization",
    },
  ];

  // 2. Principal Workflow Steps
  const principalWorkflowSteps = [
    {
      step: "1",
      title: "School & Session Setup",
      subtitle: "Settings Module",
      desc: "Initialize Academic Year (e.g. 2025-2026), CBSE Affiliation Number, School Code, and administrative details.",
      icon: <Settings className="text-indigo-600" size={20} />,
      badge: "Settings & Config",
    },
    {
      step: "2",
      title: "Classes & Multi-Sections",
      subtitle: "Classes Module",
      desc: "Configure classes in natural ascending order (LKG to 12th). Toggle Single Class mode or Multi-Section mode (Section A, B, C, D).",
      icon: <FolderTree className="text-purple-600" size={20} />,
      badge: "Ascending Class Hierarchy",
    },
    {
      step: "3",
      title: "Faculty & Bulk Import",
      subtitle: "Teachers Directory",
      desc: "Add teachers with Auto Teacher ID (TCH-XXXX) or bulk upload faculty via CSV and Excel (.xlsx) rosters with validation.",
      icon: <FileSpreadsheet className="text-emerald-600" size={20} />,
      badge: "CSV / XLSX Import & Export",
    },
    {
      step: "4",
      title: "Incharge & Subject Mapping",
      subtitle: "Faculty Allocation",
      desc: "Assign Class Incharges with 3-way synchronization and map Subject Teachers to specific classes, sections, and subjects.",
      icon: <Users className="text-blue-600" size={20} />,
      badge: "Course & Incharge Mapping",
    },
  ];

  // 3. Class Incharge Workflow Steps
  const inchargeWorkflowSteps = [
    {
      step: "1",
      title: "Scoped Workspace Login",
      subtitle: "Role-Based Routing",
      desc: "Class Incharge logs into workspace strictly isolated to their assigned class and sections with role-guarded security.",
      icon: <LayoutDashboard className="text-emerald-600" size={20} />,
      badge: "Scoped Class Access",
    },
    {
      step: "2",
      title: "Class Roster & Subject Audit",
      subtitle: "My Class Management",
      desc: "Inspect class sections, monitor assigned Subject Teachers, verify mapped courses, and export teacher roster to Excel.",
      icon: <BookOpen className="text-indigo-600" size={20} />,
      badge: "Faculty Roster & Export",
    },
    {
      step: "3",
      title: "Student Enrollment & Registry",
      subtitle: "Student Directory",
      desc: "Enroll students into assigned class, manage Student IDs (STU-XXXX), assign roll numbers, and maintain active rosters.",
      icon: <GraduationCap className="text-purple-600" size={20} />,
      badge: "Student Management",
    },
    {
      step: "4",
      title: "Attendance & Marks Oversight",
      subtitle: "Performance Evaluation",
      desc: "Track monthly attendance records (Present, Absent, Leave) and audit monthly test marks submitted by Subject Teachers.",
      icon: <BarChart3 className="text-blue-600" size={20} />,
      badge: "Attendance & Marks Audit",
    },
  ];

  // 4. Subject Teacher Workflow Steps
  const teacherWorkflowSteps = [
    {
      step: "1",
      title: "Teacher Dashboard Access",
      subtitle: "Assigned Courses",
      desc: "Subject Teacher accesses personalized dashboard displaying assigned classes, sections, and subjects mapped by Principal.",
      icon: <LayoutDashboard className="text-blue-600" size={20} />,
      badge: "Assigned Subjects Scope",
    },
    {
      step: "2",
      title: "Month & Test Selection",
      subtitle: "Evaluation Criteria",
      desc: "Select Academic Month (April - March) and Test Type (Monthly Test 1-3, Midterm, Pre-Board, Final Exam).",
      icon: <Calendar className="text-indigo-600" size={20} />,
      badge: "Exam Type & Month Filter",
    },
    {
      step: "3",
      title: "Monthly Test Marks Entry",
      subtitle: "Evaluation Grid",
      desc: "Enter and edit student marks with dynamic validation against maximum marks and threshold constraints.",
      icon: <ClipboardList className="text-purple-600" size={20} />,
      badge: "Real-Time Marks Validation",
    },
    {
      step: "4",
      title: "Result Submission & Analytics",
      subtitle: "Score Compilation",
      desc: "Submit scores for automatic GPA, percentage, and grade calculations. View class-wise pass percentages and subject averages.",
      icon: <TrendingUp className="text-emerald-600" size={20} />,
      badge: "Automated Grading Engine",
    },
  ];

  // 5. Student Workflow Steps
  const studentWorkflowSteps = [
    {
      step: "1",
      title: "Student Portal Authentication",
      subtitle: "Personal Record Scope",
      desc: "Student logs into personal dashboard displaying verified Student ID, Roll Number, Class & Section details.",
      icon: <Key className="text-amber-600" size={20} />,
      badge: "Read-Only Personal Scope",
    },
    {
      step: "2",
      title: "Monthly Test Performance",
      subtitle: "Scorecard Overview",
      desc: "Inspect month-by-month test results across all subjects, overall score percentages, and grade achievements.",
      icon: <Award className="text-emerald-600" size={20} />,
      badge: "Monthly Test Scorecard",
    },
    {
      step: "3",
      title: "Subject-Wise Deep Dive",
      subtitle: "Subject Analytics",
      desc: "View granular test marks history, highest score comparisons, subject teacher feedback, and academic growth trends.",
      icon: <BookOpen className="text-indigo-600" size={20} />,
      badge: "Subject Breakdown",
    },
    {
      step: "4",
      title: "Attendance & Communication",
      subtitle: "Student Services",
      desc: "Track monthly attendance percentages, read school circulars/notices, and submit student grievances to administration.",
      icon: <MessageSquareWarning className="text-purple-600" size={20} />,
      badge: "Attendance & Grievances",
    },
  ];

  // 6. Cross-Cutting Services: Complaints & Circulars Steps
  const complaintsWorkflowSteps = [
    {
      step: "1",
      title: "Grievance Submission",
      subtitle: "Multi-Role Origin",
      desc: "Students, Subject Teachers, and Class Incharges submit grievances with category, title, description, and priority level.",
      icon: <MessageSquareWarning className="text-amber-600" size={20} />,
      badge: "Student / Teacher / Incharge",
    },
    {
      step: "2",
      title: "Central Administrative Triage",
      subtitle: "Principal Inbox",
      desc: "Principal inspects incoming complaints in a centralized dashboard filtered by status (Pending, In Progress, Resolved).",
      icon: <ShieldCheck className="text-indigo-600" size={20} />,
      badge: "Principal Triage & Audit",
    },
    {
      step: "3",
      title: "In-line Administrative Action",
      subtitle: "Status Update & Notes",
      desc: "Principal updates resolution state, adds administrative feedback notes, and coordinates corrective actions.",
      icon: <Edit2 className="text-purple-600" size={20} />,
      badge: "Resolution Workflow",
    },
    {
      step: "4",
      title: "Auditable Ticket Closure",
      subtitle: "User Feedback",
      desc: "Submitting user receives real-time status update with official remarks and timestamped audit trail.",
      icon: <CheckCircle2 className="text-emerald-600" size={20} />,
      badge: "Audited Closure",
    },
  ];

  const notificationsWorkflowSteps = [
    {
      step: "1",
      title: "Circular Drafting & Targeting",
      subtitle: "Principal Authority",
      desc: "Principal creates notices with Title, Body, Priority (Low, Normal, High, Urgent), and Target Audience filter.",
      icon: <Send className="text-indigo-600" size={20} />,
      badge: "Principal Broadcast Engine",
    },
    {
      step: "2",
      title: "Audience Segmentation",
      subtitle: "Role-Based Dispatch",
      desc: "Notices are dispatched dynamically: All School, Teachers & Incharges Only, or Student Portals.",
      icon: <Users className="text-purple-600" size={20} />,
      badge: "Targeted Audience Delivery",
    },
    {
      step: "3",
      title: "Real-Time In-App Alerting",
      subtitle: "Notification Banners",
      desc: "Priority notification pills and alert badges appear in user headers, with instant banner popups for urgent circulars.",
      icon: <Bell className="text-amber-600" size={20} />,
      badge: "Priority Notification Alert",
    },
    {
      step: "4",
      title: "Archival & Read History",
      subtitle: "Historical Records",
      desc: "Recipients review active and archived announcements in their dedicated notifications portal with category badges.",
      icon: <Clock className="text-emerald-600" size={20} />,
      badge: "Circular Archival Roster",
    },
  ];

  // Detailed Role Cards Data
  const rolesData = [
    {
      id: "principal",
      title: "Principal Admin",
      roleCode: "ROLES.PRINCIPAL",
      badgeColor: "purple",
      icon: <ShieldCheck size={24} />,
      scope: "System-Wide Administrative Authority",
      description: "Highest administrative authority. Oversees school classes (LKG to 12th in ascending order), faculty directory, class incharges, subject teacher mapping, bulk CSV/XLSX imports, complaints, notifications, and school settings.",
      features: [
        "Access Principal Dashboard with real-time academic KPIs and statistics",
        "Manage School Classes from LKG to Grade 12th in ascending order",
        "Configure Single Class or Multi-Section mode (Section A, B, C, D)",
        "Assign Class Incharges with automatic 3-way synchronization across all pages",
        "Map Subject Teachers to specific classes, sections, and academic courses",
        "Faculty Directory with Auto-Generated Teacher IDs (TCH-XXXX)",
        "Bulk import faculty records via CSV and Excel (.xlsx) spreadsheets",
        "Export Teacher Rosters and Class Configurations to Excel",
        "Centralized Complaints & Grievances Triage, investigation, and resolution",
        "School-wide Broadcast Engine for Circulars & Notifications with priority levels",
        "Manage School Settings (Academic Sessions, CBSE Board Affiliation, Address)",
        "Principal Profile management and account security credentials",
      ],
      restrictions: [
        "None (Full administrative control across all system modules & database collections)",
      ],
      route: "/principal/*",
    },
    {
      id: "class_incharge",
      title: "Class Incharge / Class Teacher",
      roleCode: "ROLES.CLASS_INCHARGE",
      badgeColor: "emerald",
      icon: <UserCheck size={24} />,
      scope: "Single Assigned Class & Sections Scope",
      description: "Academic lead responsible for managing their specific assigned class roster, student enrollment, monthly attendance, and auditing subject teacher test marks evaluations.",
      features: [
        "Access Class Incharge Workspace isolated strictly to assigned class & sections",
        "View Assigned Class Details & Section Roster (e.g., Class 1, Class 10)",
        "Student Directory & Enrollment with Auto Student IDs (STU-XXXX) and Roll Numbers",
        "Monthly Student Attendance Tracker (Present, Absent, Leave records)",
        "Monitor Mapped Subject Teachers & Course assignments for the class",
        "Export Class Subject Teacher and Student Rosters to Excel",
        "Audit Student Monthly Test Marks across all subjects with performance trends",
        "Inspect individual student performance cards and academic history",
        "Submit Grievances and Feedback directly to the Principal",
        "Receive and view school-wide Circulars and urgent notifications",
      ],
      restrictions: [
        "Cannot create, edit, or delete Teachers or assign other Class Incharges",
        "Cannot add, delete, or alter school-level classes or global section configurations",
        "Restricted strictly to their assigned class (cannot access or modify other classes)",
        "Cannot modify school configurations or system settings",
      ],
      route: "/class-incharge/*",
    },
    {
      id: "subject_teacher",
      title: "Subject Teacher",
      roleCode: "ROLES.SUBJECT_TEACHER",
      badgeColor: "blue",
      icon: <BookOpen size={24} />,
      scope: "Assigned Subjects & Classes Scope",
      description: "Educator focused on subject instruction, administering monthly tests, and evaluating student performance for their assigned classes and sections.",
      features: [
        "Access Subject Teacher Workbench displaying mapped classes and subjects",
        "Filter evaluations by Class, Section, Academic Month (Apr - Mar), and Test Type",
        "Enter and edit student test scores with real-time Max Marks validation",
        "Automatic GPA, percentage, and grade calculation upon score entry",
        "View student class roster and individual academic progress for mapped subjects",
        "Export subject test marks sheets to Excel spreadsheets",
        "Submit Grievances and feedback to the Principal",
        "Receive school circulars, exam schedule notifications, and administrative notices",
      ],
      restrictions: [
        "Cannot assign Class Incharges or alter class structures or section configurations",
        "Cannot enter or edit marks for unassigned subjects or other teachers' courses",
        "Cannot modify student rosters or school-level academic settings",
      ],
      route: "/teacher/*",
    },
    {
      id: "student",
      title: "Student",
      roleCode: "ROLES.STUDENT",
      badgeColor: "amber",
      icon: <GraduationCap size={24} />,
      scope: "Self Personal Academic Record Scope",
      description: "End-user student viewing personal monthly test scores, subject performance, attendance records, and academic progress reports.",
      features: [
        "Access Personal Student Dashboard with verified Student ID and Roll Number",
        "View overall GPA, percentage, and monthly test performance summaries",
        "Subject-wise breakdown of marks across Monthly Tests, Midterms, and Finals",
        "Track personal monthly attendance percentages and academic growth trends",
        "View official Teacher feedback and remarks on test evaluations",
        "Submit Student Grievances directly to school administration",
        "Read school circulars, event announcements, and holiday notices",
        "Access personal student profile information",
      ],
      restrictions: [
        "Strictly read-only access to own personal academic records",
        "Cannot view scores, grades, or personal details of any other students",
        "Cannot insert, edit, or tamper with test scores or attendance entries",
      ],
      route: "/student/*",
    },
  ];

  // Comprehensive RBAC Matrix reflecting all implemented modules
  const matrixFeatures = [
    { feature: "Access Principal Dashboard & Analytics", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Manage School Classes (LKG to 12th in Ascending Order)", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Configure Class Sections (A, B, C, D) & Multi-Section Mode", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Assign Class Incharges (with 3-Way Atomic Synchronization)", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Faculty Directory & Auto Teacher-ID (TCH-XXXX)", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Bulk Import Teachers via CSV and Excel (.xlsx) Files", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Map Subject Teachers to Class, Section, and Subject", principal: true, incharge: false, teacher: false, student: false },
    { feature: "School Settings & Academic Sessions Configuration", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Class Incharge Workspace (Scoped to Assigned Class)", principal: true, incharge: true, teacher: false, student: false },
    { feature: "Student Enrollment & Roll Number Management", principal: true, incharge: true, teacher: false, student: false },
    { feature: "Monthly Student Attendance Tracking (Present / Absent / Leave)", principal: true, incharge: true, teacher: false, student: false },
    { feature: "Audit Class Subject Test Marks & Performance Cards", principal: true, incharge: true, teacher: false, student: false },
    { feature: "Export Class Rosters & Teacher Mappings to Excel", principal: true, incharge: true, teacher: true, student: false },
    { feature: "Enter & Edit Monthly Test Marks with Score Validation", principal: false, incharge: false, teacher: true, student: false },
    { feature: "View Personal Test Marks, Percentage & Performance Trends", principal: false, incharge: false, teacher: false, student: true },
    { feature: "Submit Grievances / Complaints to Administration", principal: false, incharge: true, teacher: true, student: true },
    { feature: "Central Complaints Management & Grievance Resolution", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Broadcast Circulars & Notifications with Priority Levels", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Receive School Announcements & Exam Circulars", principal: true, incharge: true, teacher: true, student: true },
    { feature: "Access System Flow & Architecture Documentation", principal: true, incharge: true, teacher: true, student: true },
  ];

  return (
    <div className="tch-container" style={{ paddingBottom: "40px" }}>
      {/* ── HEADER BANNER ── */}
      <div className="pl-welcome-banner" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)" }}>
        <div className="pl-banner-content">
          <div className="pl-banner-badge" style={{ background: "rgba(99, 102, 241, 0.25)", border: "1px solid #818cf8", color: "#c7d2fe" }}>
            <Workflow size={15} />
            <span>Complete System Flow &amp; Enterprise Architecture</span>
          </div>

          <h1 className="pl-banner-title">
            System Flow, Workflows &amp; Access Control (RBAC)
          </h1>

          <p className="pl-banner-subtitle">
            Comprehensive architectural documentation covering all features implemented across Principal Admin, Class Incharge, Subject Teachers, and Students — including classes in ascending order, bi-directional incharge synchronization, attendance, monthly evaluations, complaints, and notifications.
          </p>

          <div className="pl-banner-meta-row">
            <div className="pl-meta-pill">
              <Shield size={14} />
              <span>Security Model: <strong>JWT + Role Middleware (RBAC)</strong></span>
            </div>
            <div className="pl-meta-pill">
              <RefreshCw size={14} />
              <span>Sync Model: <strong>3-Way Persistence Engine</strong></span>
            </div>
            <div className="pl-meta-pill">
              <FolderTree size={14} />
              <span>Classes Hierarchy: <strong>LKG to 12th Ascending</strong></span>
            </div>
          </div>
        </div>

        <div className="pl-banner-actions">
          <button className="tch-btn tch-btn-primary" onClick={() => window.print()} title="Print Architecture">
            <FileText size={15} />
            <span>Print System Flow</span>
          </button>
        </div>
      </div>

      {/* ── INTERACTIVE WORKFLOW FILTER TABS ── */}
      <div style={{ marginTop: "24px", marginBottom: "20px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "10px",
              border: activeTab === tab.id ? "2px solid #6366f1" : "1px solid #e2e8f0",
              background: activeTab === tab.id ? "#eef2ff" : "#ffffff",
              color: activeTab === tab.id ? "#4338ca" : "#475569",
              fontWeight: activeTab === tab.id ? "700" : "500",
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── 1. PRINCIPAL WORKFLOW PIPELINE ── */}
      {(activeTab === "all" || activeTab === "principal") && (
        <div className="tch-table-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div className="modal-title-wrap" style={{ marginBottom: "20px" }}>
            <ShieldCheck className="text-purple-600" size={24} />
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                1. Principal Administrative &amp; School Governance Workflow
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "2px 0 0 0" }}>
                How the Principal initializes academic sessions, manages classes from LKG to 12th, imports faculty, maps subjects, and broadcasts notices
              </p>
            </div>
          </div>

          <div className="sys-flow-pipeline" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {principalWorkflowSteps.map((s, idx) => (
              <React.Fragment key={idx}>
                <div className="flow-step-card highlight" style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px", position: "relative" }}>
                  <div className="step-number" style={{ background: "#7c3aed", color: "#ffffff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.8rem", marginBottom: "10px" }}>
                    {s.step}
                  </div>
                  <div style={{ marginBottom: "8px" }}>{s.icon}</div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "700", color: "#0f172a" }}>{s.title}</h4>
                  <p style={{ margin: "0 0 10px 0", fontSize: "0.8rem", color: "#64748b", lineHeight: "1.4" }}>{s.desc}</p>
                  <span className="step-tech-tag" style={{ background: "#f5f3ff", color: "#6d28d9", fontSize: "0.72rem", padding: "3px 8px", borderRadius: "6px", fontWeight: "600" }}>
                    {s.badge}
                  </span>
                </div>
                {idx < principalWorkflowSteps.length - 1 && (
                  <div className="flow-arrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                    <ArrowRight size={22} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. CLASS INCHARGE WORKFLOW PIPELINE ── */}
      {(activeTab === "all" || activeTab === "class_incharge") && (
        <div className="tch-table-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div className="modal-title-wrap" style={{ marginBottom: "20px" }}>
            <UserCheck className="text-emerald-600" size={24} />
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                2. Class Incharge Academic Management Workflow
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "2px 0 0 0" }}>
                How the Class Incharge oversees assigned class sections, enrolls students, tracks attendance, and audits subject evaluation
              </p>
            </div>
          </div>

          <div className="sys-flow-pipeline" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {inchargeWorkflowSteps.map((s, idx) => (
              <React.Fragment key={idx}>
                <div className="flow-step-card highlight" style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px", position: "relative" }}>
                  <div className="step-number" style={{ background: "#059669", color: "#ffffff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.8rem", marginBottom: "10px" }}>
                    {s.step}
                  </div>
                  <div style={{ marginBottom: "8px" }}>{s.icon}</div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "700", color: "#0f172a" }}>{s.title}</h4>
                  <p style={{ margin: "0 0 10px 0", fontSize: "0.8rem", color: "#64748b", lineHeight: "1.4" }}>{s.desc}</p>
                  <span className="step-tech-tag" style={{ background: "#ecfdf5", color: "#047857", fontSize: "0.72rem", padding: "3px 8px", borderRadius: "6px", fontWeight: "600" }}>
                    {s.badge}
                  </span>
                </div>
                {idx < inchargeWorkflowSteps.length - 1 && (
                  <div className="flow-arrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                    <ArrowRight size={22} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. SUBJECT TEACHER WORKFLOW PIPELINE ── */}
      {(activeTab === "all" || activeTab === "teacher") && (
        <div className="tch-table-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div className="modal-title-wrap" style={{ marginBottom: "20px" }}>
            <BookOpen className="text-blue-600" size={24} />
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                3. Subject Teacher Monthly Test &amp; Marks Evaluation Workflow
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "2px 0 0 0" }}>
                How Subject Teachers access mapped courses, select academic months, enter validated scores, and submit evaluations
              </p>
            </div>
          </div>

          <div className="sys-flow-pipeline" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {teacherWorkflowSteps.map((s, idx) => (
              <React.Fragment key={idx}>
                <div className="flow-step-card highlight" style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px", position: "relative" }}>
                  <div className="step-number" style={{ background: "#2563eb", color: "#ffffff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.8rem", marginBottom: "10px" }}>
                    {s.step}
                  </div>
                  <div style={{ marginBottom: "8px" }}>{s.icon}</div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "700", color: "#0f172a" }}>{s.title}</h4>
                  <p style={{ margin: "0 0 10px 0", fontSize: "0.8rem", color: "#64748b", lineHeight: "1.4" }}>{s.desc}</p>
                  <span className="step-tech-tag" style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: "0.72rem", padding: "3px 8px", borderRadius: "6px", fontWeight: "600" }}>
                    {s.badge}
                  </span>
                </div>
                {idx < teacherWorkflowSteps.length - 1 && (
                  <div className="flow-arrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                    <ArrowRight size={22} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. STUDENT ACADEMIC WORKFLOW PIPELINE ── */}
      {(activeTab === "all" || activeTab === "student") && (
        <div className="tch-table-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div className="modal-title-wrap" style={{ marginBottom: "20px" }}>
            <GraduationCap className="text-amber-600" size={24} />
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                4. Student Scorecard &amp; Academic Performance Workflow
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "2px 0 0 0" }}>
                How students authenticate to view personal test marks, subject grades, monthly attendance, and school announcements
              </p>
            </div>
          </div>

          <div className="sys-flow-pipeline" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {studentWorkflowSteps.map((s, idx) => (
              <React.Fragment key={idx}>
                <div className="flow-step-card highlight" style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px", position: "relative" }}>
                  <div className="step-number" style={{ background: "#d97706", color: "#ffffff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.8rem", marginBottom: "10px" }}>
                    {s.step}
                  </div>
                  <div style={{ marginBottom: "8px" }}>{s.icon}</div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "700", color: "#0f172a" }}>{s.title}</h4>
                  <p style={{ margin: "0 0 10px 0", fontSize: "0.8rem", color: "#64748b", lineHeight: "1.4" }}>{s.desc}</p>
                  <span className="step-tech-tag" style={{ background: "#fffbeb", color: "#b45309", fontSize: "0.72rem", padding: "3px 8px", borderRadius: "6px", fontWeight: "600" }}>
                    {s.badge}
                  </span>
                </div>
                {idx < studentWorkflowSteps.length - 1 && (
                  <div className="flow-arrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                    <ArrowRight size={22} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. CROSS-CUTTING: COMPLAINTS & CIRCULARS ── */}
      {(activeTab === "all" || activeTab === "crosscutting") && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "20px", marginBottom: "24px" }}>
          {/* Complaints Redressal Pipeline */}
          <div className="tch-table-card" style={{ padding: "20px" }}>
            <div className="modal-title-wrap" style={{ marginBottom: "16px" }}>
              <MessageSquareWarning className="text-amber-600" size={22} />
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Grievance &amp; Complaints Redressal Pipeline
                </h3>
                <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>
                  Submission by Student/Teacher/Incharge to Principal Triage
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {complaintsWorkflowSteps.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ background: "#fef3c7", color: "#b45309", padding: "6px", borderRadius: "6px" }}>
                    {c.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.88rem", color: "#1e293b" }}>{c.step}. {c.title}</strong>
                      <span style={{ fontSize: "0.7rem", background: "#f1f5f9", padding: "1px 6px", borderRadius: "4px", color: "#64748b" }}>{c.badge}</span>
                    </div>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b", lineHeight: "1.35" }}>{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Centralized Notifications Broadcast Pipeline */}
          <div className="tch-table-card" style={{ padding: "20px" }}>
            <div className="modal-title-wrap" style={{ marginBottom: "16px" }}>
              <Bell className="text-indigo-600" size={22} />
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Central Circulars &amp; Notification Broadcast
                </h3>
                <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>
                  Targeted notice broadcasting with priority alerts
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {notificationsWorkflowSteps.map((n, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ background: "#ede9fe", color: "#6d28d9", padding: "6px", borderRadius: "6px" }}>
                    {n.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.88rem", color: "#1e293b" }}>{n.step}. {n.title}</strong>
                      <span style={{ fontSize: "0.7rem", background: "#f1f5f9", padding: "1px 6px", borderRadius: "4px", color: "#64748b" }}>{n.badge}</span>
                    </div>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b", lineHeight: "1.35" }}>{n.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BI-DIRECTIONAL CLASS INCHARGE ASSIGNMENT WORKFLOW DIAGRAM ── */}
      {(activeTab === "all" || activeTab === "principal" || activeTab === "crosscutting") && (
        <div className="tch-table-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div className="modal-title-wrap" style={{ marginBottom: "20px" }}>
            <RefreshCw className="text-emerald" size={22} />
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Bi-Directional Class Incharge 3-Way Synchronization Architecture
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "2px 0 0 0" }}>
                How Class Incharge assignments automatically update across Classes, Teachers Directory, and Manage Class Incharges in real time
              </p>
            </div>
          </div>

          <div className="sys-flow-pipeline" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {syncFlowSteps.map((s, idx) => (
              <React.Fragment key={idx}>
                <div className="flow-step-card highlight" style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px", position: "relative" }}>
                  <div className="step-number" style={{ background: "#059669", color: "#ffffff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.8rem", marginBottom: "10px" }}>
                    {s.step}
                  </div>
                  <div style={{ marginBottom: "8px" }}>{s.icon}</div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: "700", color: "#0f172a" }}>{s.title}</h4>
                  <p style={{ margin: "0 0 10px 0", fontSize: "0.8rem", color: "#64748b", lineHeight: "1.4" }}>{s.desc}</p>
                  <span className="step-tech-tag" style={{ background: "#ecfdf5", color: "#047857", fontSize: "0.72rem", padding: "3px 8px", borderRadius: "6px", fontWeight: "600" }}>
                    {s.badge}
                  </span>
                </div>
                {idx < syncFlowSteps.length - 1 && (
                  <div className="flow-arrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                    <ArrowRight size={22} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Synchronization Locations Summary Box */}
          <div style={{ marginTop: "20px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "14px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Sliders size={18} className="text-purple-600" style={{ marginTop: "2px" }} />
              <div>
                <strong style={{ fontSize: "0.85rem", color: "#1e293b", display: "block" }}>1. Principal → Classes</strong>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Direct incharge dropdown visible by default in class detail modal to assign/change top-level or section incharge.</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Users size={18} className="text-blue-600" style={{ marginTop: "2px" }} />
              <div>
                <strong style={{ fontSize: "0.85rem", color: "#1e293b", display: "block" }}>2. Principal → Teachers Directory</strong>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Toggling role to Class Incharge prompts 'Select Class' dialog and automatically synchronizes Teacher ID &amp; assignment.</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <UserCheck size={18} className="text-emerald-600" style={{ marginTop: "2px" }} />
              <div>
                <strong style={{ fontSize: "0.85rem", color: "#1e293b", display: "block" }}>3. Principal → Manage Class Incharges</strong>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Dedicated directory shows Teacher Name, Teacher ID, and Assigned Class with full edit/reassign synchronization.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AUTHENTICATION & ROUTING PIPELINE ── */}
      <div className="tch-table-card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div className="modal-title-wrap" style={{ marginBottom: "20px" }}>
          <Workflow className="text-indigo-600" size={22} />
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              Authentication &amp; Role-Based Routing Architecture
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "2px 0 0 0" }}>
              How users authenticate and get routed to their isolated workspace environment via JWT + ProtectedRoute
            </p>
          </div>
        </div>

        <div className="sys-flow-pipeline">
          <div className="flow-step-card">
            <div className="step-number">1</div>
            <div className="step-icon blue">
              <Key size={20} />
            </div>
            <h4>User Login</h4>
            <p>User submits credentials at <code>/login</code></p>
            <span className="step-tech-tag">POST /api/auth/login</span>
          </div>

          <div className="flow-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="flow-step-card">
            <div className="step-number">2</div>
            <div className="step-icon purple">
              <ShieldCheck size={20} />
            </div>
            <h4>Token &amp; Role Check</h4>
            <p>Server verifies JWT bearer token and injects verified role claims</p>
            <span className="step-tech-tag">authMiddleware</span>
          </div>

          <div className="flow-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="flow-step-card">
            <div className="step-number">3</div>
            <div className="step-icon green">
              <Workflow size={20} />
            </div>
            <h4>AppRoutes Evaluator</h4>
            <p><code>ProtectedRoute</code> enforces <code>hasRole()</code> security boundary</p>
            <span className="step-tech-tag">React Router v7</span>
          </div>

          <div className="flow-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="flow-step-card highlight">
            <div className="step-number">4</div>
            <div className="step-icon amber">
              <Database size={20} />
            </div>
            <h4>Authorized Portal</h4>
            <p>Renders role-specific Layout &amp; API Data scope</p>
            <span className="step-tech-tag">Scoped Workspace</span>
          </div>
        </div>
      </div>

      {/* ── ROLE HIERARCHY & DETAILED PERMISSIONS ── */}
      <div className="modal-title-wrap" style={{ marginTop: "10px", marginBottom: "12px" }}>
        <Layers className="text-emerald" size={22} />
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
            Role Hierarchy &amp; Permission Structure
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "2px 0 0 0" }}>
            Complete breakdown of features, capabilities, and boundaries across all 4 system roles
          </p>
        </div>
      </div>

      <div className="sys-roles-grid">
        {rolesData.map((r) => (
          <div key={r.id} className={`sys-role-card ${r.badgeColor}`}>
            <div className="role-card-header">
              <div className={`role-icon-box ${r.badgeColor}`}>
                {r.icon}
              </div>
              <div className="role-title-wrap">
                <h3>{r.title}</h3>
                <span className="role-code-tag">{r.roleCode}</span>
              </div>
              <span className={`scope-badge ${r.badgeColor}`}>{r.scope}</span>
            </div>

            <p className="role-description">{r.description}</p>

            <div className="role-sections-wrapper">
              <div className="role-section-block">
                <div className="block-title text-green">
                  <CheckCircle2 size={16} />
                  <span>Authorized Features &amp; Capabilities</span>
                </div>
                <ul className="role-feature-list">
                  {r.features.map((f, idx) => (
                    <li key={idx}>
                      <Check size={14} className="check-icon" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="role-section-block">
                <div className="block-title text-red">
                  <Lock size={16} />
                  <span>Access Restrictions &amp; Boundaries</span>
                </div>
                <ul className="role-restriction-list">
                  {r.restrictions.map((rst, idx) => (
                    <li key={idx}>
                      <XCircle size={14} className="cross-icon" />
                      <span>{rst}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="role-card-footer">
              <span className="route-label">Primary Portal Route:</span>
              <code className="route-code">{r.route}</code>
            </div>
          </div>
        ))}
      </div>

      {/* ── PERMISSIONS COMPARATIVE MATRIX TABLE ── */}
      <div className="tch-table-card" style={{ marginTop: "24px" }}>
        <div className="tch-toolbar" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="modal-title-wrap">
            <Lock size={20} className="modal-title-icon text-emerald" />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                Role Access Control (RBAC) Comparison Matrix
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                Comprehensive module and feature availability matrix across all 4 system roles
              </p>
            </div>
          </div>
        </div>

        <div className="tch-table-wrapper">
          <table className="tch-table">
            <thead>
              <tr>
                <th>System Feature / Module</th>
                <th style={{ textAlign: "center" }}>Principal Admin</th>
                <th style={{ textAlign: "center" }}>Class Incharge</th>
                <th style={{ textAlign: "center" }}>Subject Teacher</th>
                <th style={{ textAlign: "center" }}>Student</th>
              </tr>
            </thead>
            <tbody>
              {matrixFeatures.map((m, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{m.feature}</td>
                  <td style={{ textAlign: "center" }}>
                    {m.principal ? (
                      <span className="matrix-badge allow">
                        <CheckCircle2 size={14} /> Allowed
                      </span>
                    ) : (
                      <span className="matrix-badge deny">
                        <Lock size={14} /> Denied
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {m.incharge ? (
                      <span className="matrix-badge allow">
                        <CheckCircle2 size={14} /> Allowed
                      </span>
                    ) : (
                      <span className="matrix-badge deny">
                        <Lock size={14} /> Denied
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {m.teacher ? (
                      <span className="matrix-badge allow">
                        <CheckCircle2 size={14} /> Allowed
                      </span>
                    ) : (
                      <span className="matrix-badge deny">
                        <Lock size={14} /> Denied
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {m.student ? (
                      <span className="matrix-badge allow">
                        <CheckCircle2 size={14} /> Allowed
                      </span>
                    ) : (
                      <span className="matrix-badge deny">
                        <Lock size={14} /> Denied
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemFlowPage;
