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
} from "lucide-react";

const SystemFlowPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  const syncFlowSteps = [
    {
      step: "1",
      title: "Assignment Initiation",
      subtitle: "Principal Action",
      desc: "Principal assigns a teacher as Class Incharge from Classes section OR Teachers Directory (with 'Select Class' option) OR Manage Class Incharges.",
      icon: <Plus className="text-indigo-600" size={20} />,
      badge: "Principal Action",
    },
    {
      step: "2",
      title: "Backend Sync Engine",
      subtitle: "syncHelper.js Processing",
      desc: "Atomic database updates link User, Teacher, and Class records without creating duplicate records.",
      icon: <RefreshCw className="text-purple-600" size={20} />,
      badge: "Single Source of Truth",
    },
    {
      step: "3",
      title: "Persistent Storage",
      subtitle: "MongoDB Document Update",
      desc: "Updates Class.classIncharge, User.role & assignedClass, and Teacher.role & assignedClass in DB.",
      icon: <Database className="text-emerald-600" size={20} />,
      badge: "Persistent across Refresh",
    },
    {
      step: "4",
      title: "Multi-Section Sync",
      subtitle: "Automatic Frontend Reflection",
      desc: "Teacher Name, Teacher ID, and Assigned Class update simultaneously across Classes, Teachers Directory, and Manage Class Incharges.",
      icon: <CheckCircle2 className="text-blue-600" size={20} />,
      badge: "Real-Time Synchronization",
    },
  ];

  const rolesData = [
    {
      id: "principal",
      title: "Principal Admin",
      roleCode: "ROLES.PRINCIPAL",
      badgeColor: "purple",
      icon: <ShieldCheck size={24} />,
      scope: "System-Wide Administrative Authority",
      description: "Highest administrative authority. Oversees school classes (LKG-12th), faculty directory, class incharges, CSV/XLSX imports, and system settings.",
      features: [
        "Access Principal Dashboard with real-time analytics & KPIs",
        "Manage School Classes from LKG to Grade 12th & Section configurations",
        "Assign Class Incharge directly from Principal → Classes modal (visible by default)",
        "Assign Class Incharge from Principal → Teachers Directory with 'Select Class' option",
        "Manage Class Incharges list with Teacher Name, Teacher ID, and Assigned Class",
        "Automatic 3-way synchronization across Classes, Teachers, & Manage Class Incharges",
        "Bulk import teacher records via CSV & Excel (.xlsx/.xls) files",
        "Export Teacher Roster & Class Data to Excel spreadsheets",
        "Manage Principal Profile details & account security",
        "Access System Settings, System Flow documentation, and Logout",
      ],
      restrictions: [
        "None (Full administrative access across all system modules & endpoints)",
      ],
      route: "/principal/*",
    },
    {
      id: "class_incharge",
      title: "Class Incharge / Class Teacher",
      roleCode: "ROLES.CLASS_INCHARGE",
      badgeColor: "emerald",
      icon: <UserCheck size={24} />,
      scope: "Single Assigned Class Scope",
      description: "Academic lead responsible for managing their specific assigned class, subject teacher mappings, and student test evaluations.",
      features: [
        "Access Class Incharge Workspace Dashboard for assigned class",
        "View Assigned Class Details & Section Roster (e.g. Class 1, Class 5)",
        "Monitor Mapped Subject Teachers & Subject Course assignments",
        "Export Assigned Class Subject Teacher Roster to Excel",
        "Oversee Student Monthly Test Marks & evaluation statuses",
        "View Student Directory for the assigned class",
        "Access Personal Profile & System Flow documentation",
      ],
      restrictions: [
        "Cannot create, edit, or delete Teachers or Class Incharges",
        "Cannot add, remove, or reconfigure school-level classes or sections",
        "Restricted strictly to their assigned class (cannot access other classes)",
        "Cannot modify global system settings or principal configurations",
      ],
      route: "/class-incharge/*",
    },
    {
      id: "subject_teacher",
      title: "Subject Teacher",
      roleCode: "ROLES.SUBJECT_TEACHER",
      badgeColor: "blue",
      icon: <BookOpen size={24} />,
      scope: "Assigned Subjects & Courses Scope",
      description: "Educator focused on subject instruction and entering student monthly test evaluations for their mapped subjects.",
      features: [
        "View Assigned Subjects & Course Class Mappings",
        "Enter & Edit Monthly Test Scores for students in mapped subjects",
        "View Student Roster for assigned subject classes",
        "Track Subject-Wise Academic Performance & marks entry status",
      ],
      restrictions: [
        "Cannot assign Class Incharges or alter class structures",
        "Cannot access unassigned subjects or other teachers' entries",
        "Cannot modify school configurations or teacher accounts",
      ],
      route: "/teacher/*",
    },
    {
      id: "student",
      title: "Student",
      roleCode: "ROLES.STUDENT",
      badgeColor: "amber",
      icon: <GraduationCap size={24} />,
      scope: "Self Personal Record Scope",
      description: "End-user student viewing personal academic monthly test scores, subject performance, and report summaries.",
      features: [
        "View Personal Monthly Test Marks & Subject Performance summaries",
        "Track Subject-Wise Academic Growth & Evaluation Grades",
        "View Personal Student Profile Information",
      ],
      restrictions: [
        "Strictly read-only access to own personal academic records",
        "Cannot view scores, grades, or records of other students",
        "Cannot edit, insert, or alter any test scores or class data",
      ],
      route: "/student/*",
    },
  ];

  const matrixFeatures = [
    { feature: "Access Principal Dashboard & Analytics", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Manage School Classes (LKG - Grade 12th)", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Assign Incharge directly from Classes Section", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Assign Incharge from Teachers with Select Class", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Manage Class Incharges (Name, ID, Class)", principal: true, incharge: false, teacher: false, student: false },
    { feature: "3-Way Assignment Synchronization", principal: true, incharge: false, teacher: false, student: false },
    { feature: "Import Teachers via CSV / XLSX File", principal: true, incharge: false, teacher: false, student: false },
    { feature: "View Assigned Class Workspace & Roster", principal: true, incharge: true, teacher: false, student: false },
    { feature: "Export Subject Teacher Roster to Excel", principal: true, incharge: true, teacher: false, student: false },
    { feature: "Enter & Evaluate Subject Test Scores", principal: false, incharge: false, teacher: true, student: false },
    { feature: "View Personal Test Marks & Academic Report", principal: false, incharge: false, teacher: false, student: true },
  ];

  return (
    <div className="tch-container" style={{ paddingBottom: "40px" }}>
      {/* ── HEADER BANNER ── */}
      <div className="pl-welcome-banner" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)" }}>
        <div className="pl-banner-content">
          <div className="pl-banner-badge" style={{ background: "rgba(99, 102, 241, 0.25)", border: "1px solid #818cf8", color: "#c7d2fe" }}>
            <Workflow size={15} />
            <span>System Architecture &amp; Synchronized Access Flow</span>
          </div>

          <h1 className="pl-banner-title">
            System Flow &amp; Access Control (RBAC)
          </h1>

          <p className="pl-banner-subtitle">
            Complete visual documentation of system hierarchy, bi-directional Class Incharge synchronization, role permissions, and access control boundaries implemented in School TMS.
          </p>

          <div className="pl-banner-meta-row">
            <div className="pl-meta-pill">
              <Shield size={14} />
              <span>Security Model: <strong>JWT + Role Middleware</strong></span>
            </div>
            <div className="pl-meta-pill">
              <RefreshCw size={14} />
              <span>Sync Model: <strong>3-Way Persistence Engine</strong></span>
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

      {/* ── SYNCHRONIZED CLASS INCHARGE ASSIGNMENT WORKFLOW DIAGRAM ── */}
      <div className="tch-table-card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div className="modal-title-wrap" style={{ marginBottom: "20px" }}>
          <RefreshCw className="text-emerald" size={22} />
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              Bi-Directional Class Incharge Synchronization Flow
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "2px 0 0 0" }}>
              How Class Incharge assignments automatically update across Classes, Teachers Directory, and Manage Class Incharges
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
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Direct dropdown visible by default in class detail modal to assign/change incharge.</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <Users size={18} className="text-blue-600" style={{ marginTop: "2px" }} />
            <div>
              <strong style={{ fontSize: "0.85rem", color: "#1e293b", display: "block" }}>2. Principal → Teachers Directory</strong>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Toggling role to Class Incharge triggers 'Select Class' prompt for target class.</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <UserCheck size={18} className="text-emerald-600" style={{ marginTop: "2px" }} />
            <div>
              <strong style={{ fontSize: "0.85rem", color: "#1e293b", display: "block" }}>3. Principal → Manage Class Incharges</strong>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Shows Teacher Name, Teacher ID, and Assigned Class automatically updated.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── AUTHENTICATION & ROUTING PIPELINE ── */}
      <div className="tch-table-card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div className="modal-title-wrap" style={{ marginBottom: "20px" }}>
          <Workflow className="text-indigo-600" size={22} />
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              Authentication &amp; Role-Based Routing Architecture
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "2px 0 0 0" }}>
              How users authenticate and get routed to their isolated workspace environment
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
            <p>User submits email &amp; password at <code>/login</code></p>
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
            <p>Server validates JWT token and verifies user role claim</p>
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
            <p><code>ProtectedRoute</code> enforces <code>hasRole()</code> boundary</p>
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
            Complete breakdown of features, capabilities, and boundaries per role
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
                  <span>Authorized Features &amp; Implemented Capabilities</span>
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
                Feature availability across all 4 system user roles
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
