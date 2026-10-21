import React, { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppDispatch";
import { logout } from "../../redux/slices/authSlice";
import {
  GraduationCap,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  UserCircle,
  AlertTriangle,
  Workflow,
  BookOpen,
  BarChart2,
  ClipboardList,
} from "lucide-react";

const StudentLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  const handleLogout = () => {
    setUserPopoverOpen(false);
    dispatch(logout());
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setUserPopoverOpen(false);
      }
    };
    if (userPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userPopoverOpen]);

  const navItems = [
    {
      to: "/student/dashboard",
      icon: <UserCircle className="sidebar-nav-icon" />,
      label: "Dashboard & Attendance",
    },
    {
      to: "/student/subjects",
      icon: <BookOpen className="sidebar-nav-icon" />,
      label: "My Subjects & Marks",
    },
    {
      to: "/student/complaints",
      icon: <AlertTriangle className="sidebar-nav-icon" />,
      label: "My Complaints & Reports",
    },
    {
      to: "/student/system-flow",
      icon: <Workflow className="sidebar-nav-icon" />,
      label: "System Flow Info",
    },
  ];

  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "ST";

  return (
    <div className="pl-root">
      {sidebarOpen && (
        <div
          className="pl-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`pl-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="pl-sidebar-brand">
          <div className="pl-brand-icon-wrap indigo-theme">
            <GraduationCap className="pl-brand-icon" />
          </div>
          <div className="pl-brand-text">
            <span className="pl-brand-name">School TMS</span>
            <span className="pl-brand-role">Student Portal</span>
          </div>
          <button
            className="pl-sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="pl-sidebar-nav">
          <p className="pl-nav-section-label">Student Workspace</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `pl-nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span className="pl-nav-link-text">{item.label}</span>
              <ChevronRight className="pl-nav-chevron" size={14} />
            </NavLink>
          ))}
        </nav>

        {/* USER FOOTER */}
        <div className="pl-sidebar-user-section" ref={popoverRef}>
          {userPopoverOpen && (
            <div className="pl-user-popover">
              <div className="pl-popover-header">
                <div className="pl-popover-avatar">
                  <span>{initials}</span>
                </div>
                <div className="pl-popover-info">
                  <span className="pl-popover-name">{user?.name}</span>
                  <span className="pl-popover-email">{user?.email}</span>
                </div>
              </div>

              <div className="pl-popover-divider" />

              <button
                className="pl-popover-item pl-popover-logout"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <button
            className={`pl-sidebar-user ${userPopoverOpen ? "active" : ""}`}
            onClick={() => setUserPopoverOpen(!userPopoverOpen)}
            aria-label="User Menu"
          >
            <div className="pl-user-initials-avatar">
              <span>{initials}</span>
            </div>
            <div className="pl-user-info">
              <span className="pl-user-name">{user?.name || "Student"}</span>
              <span className="pl-user-role">{user?.role || "STUDENT"}</span>
            </div>
            <ChevronRight size={15} className="pl-user-chevron" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="pl-main-area">
        <header className="pl-topbar">
          <button
            className="pl-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="pl-topbar-brand">
            <ShieldCheck className="pl-topbar-shield" />
            <div>
              <h1 className="pl-topbar-title">Student Portal</h1>
              <p className="pl-topbar-subtitle">
                Issue Reporting &amp; Academic Workspace
              </p>
            </div>
          </div>

          <div className="pl-topbar-right">
            <div className="pl-topbar-user-chip">
              <div className="pl-topbar-avatar">
                <span className="pl-topbar-avatar-initials">{initials}</span>
              </div>
              <span className="pl-topbar-username">{user?.name || "Student"}</span>
            </div>

            <button
              onClick={handleLogout}
              className="btn-logout-small"
              title="Sign Out"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="pl-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
