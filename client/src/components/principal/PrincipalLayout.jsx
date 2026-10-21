import React, { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppDispatch";
import { logout } from "../../redux/slices/authSlice";
import {
  ShieldCheck,
  LogOut,
  User,
  Users,
  BookOpen,
  UserCheck,
  GraduationCap,
  Menu,
  X,
  ChevronRight,
  ChevronUp,
  UserCircle,
  Settings,
  Workflow,
  AlertTriangle,
  Bell,
} from "lucide-react";

const PrincipalLayout = () => {
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

  // Close popover when clicking outside
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
      to: "/principal/classes",
      icon: <BookOpen className="sidebar-nav-icon" />,
      label: "Classes (LKG – 12th)",
    },
    {
      to: "/principal/teachers",
      icon: <Users className="sidebar-nav-icon" />,
      label: "Teachers Directory",
    },
    {
      to: "/principal/class-incharges",
      icon: <UserCheck className="sidebar-nav-icon" />,
      label: "Manage Class Incharges",
    },
    {
      to: "/principal/complaints",
      icon: <AlertTriangle className="sidebar-nav-icon" />,
      label: "Complaints & Issues",
    },
    {
      to: "/principal/notifications",
      icon: <Bell className="sidebar-nav-icon" />,
      label: "Notify Teachers",
    },
    {
      to: "/principal/profile",
      icon: <UserCircle className="sidebar-nav-icon" />,
      label: "Principal Profile",
    },
    {
      to: "/principal/settings",
      icon: <Settings className="sidebar-nav-icon" />,
      label: "Settings",
    },
    {
      to: "/principal/system-flow",
      icon: <Workflow className="sidebar-nav-icon" />,
      label: "System & Access Flow",
    },
  ];

  // Get initials for avatar
  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="pl-root">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="pl-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`pl-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Brand */}
        <div className="pl-sidebar-brand">
          <div className="pl-brand-icon-wrap">
            <GraduationCap className="pl-brand-icon" />
          </div>
          <div className="pl-brand-text">
            <span className="pl-brand-name">School TMS</span>
            <span className="pl-brand-role">Principal Portal</span>
          </div>
          <button
            className="pl-sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="pl-sidebar-nav">
          <p className="pl-nav-section-label">Management</p>
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

        {/* ── USER CARD AT BOTTOM (clickable, opens popover) ── */}
        <div className="pl-sidebar-user-section" ref={popoverRef}>
          {/* Popover Panel */}
          {userPopoverOpen && (
            <div className="pl-user-popover">
              {/* Popover Header */}
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

              {/* Profile link */}
              <NavLink
                to="/principal/profile"
                className="pl-popover-item"
                onClick={() => {
                  setUserPopoverOpen(false);
                  setSidebarOpen(false);
                }}
              >
                <UserCircle size={16} />
                <span>My Profile</span>
              </NavLink>

              {/* Settings link */}
              <NavLink
                to="/principal/settings"
                className="pl-popover-item"
                onClick={() => {
                  setUserPopoverOpen(false);
                  setSidebarOpen(false);
                }}
              >
                <Settings size={16} />
                <span>Settings</span>
              </NavLink>

              <div className="pl-popover-divider" />

              {/* Logout */}
              <button className="pl-popover-item pl-popover-logout" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Clickable user card */}
          <button
            className={`pl-sidebar-user ${userPopoverOpen ? "active" : ""}`}
            onClick={() => {
              navigate("/principal/profile");
              setSidebarOpen(false);
            }}
            aria-label="Open Principal Profile"
          >
            <div className="pl-user-initials-avatar">
              <span>{initials}</span>
            </div>
            <div className="pl-user-info">
              <span className="pl-user-name">{user?.name || "Principal Admin"}</span>
              <span className="pl-user-role">{user?.role || "PRINCIPAL"}</span>
            </div>
            <ChevronRight
              size={15}
              className="pl-user-chevron"
            />
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="pl-main-area">
        {/* Top Header */}
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
              <h1 className="pl-topbar-title">Principal Dashboard</h1>
              <p className="pl-topbar-subtitle">
                School Academic &amp; Test Management
              </p>
            </div>
          </div>

          <div className="pl-topbar-right">
            <button 
              className="pl-topbar-user-chip clickable"
              onClick={() => navigate("/principal/profile")}
              title="View Profile"
            >
              <div className="pl-topbar-avatar">
                <span className="pl-topbar-avatar-initials">{initials}</span>
              </div>
              <span className="pl-topbar-username">
                {user?.name || "Principal Admin"}
              </span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="pl-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PrincipalLayout;
