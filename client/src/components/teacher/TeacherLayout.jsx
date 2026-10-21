import React, { useState, useRef, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppDispatch";
import { logout } from "../../redux/slices/authSlice";
import useNotificationSound from "../../hooks/useNotificationSound";
import { connectSocket, disconnectSocket } from "../../services/socketService";
import { fetchUnreadNotificationCountApi, markNotificationReadApi } from "../../services/api";
import {
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  UserCircle,
  LayoutDashboard,
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  MessageSquare,
} from "lucide-react";

// ── In-App Notification Toast ───────────────────────────────────────────────
const NotificationToast = ({ notification, onClose, onRead }) => {
  const priorityClass =
    notification.priority === "Urgent"
      ? "toast-urgent"
      : notification.priority === "Important"
      ? "toast-important"
      : "toast-normal";

  return (
    <div className={`teacher-ntf-toast ${priorityClass}`}>
      <div className="teacher-ntf-toast-icon">
        {notification.priority === "Urgent" ? (
          <AlertTriangle size={20} />
        ) : notification.priority === "Important" ? (
          <AlertCircle size={20} />
        ) : (
          <Bell size={20} />
        )}
      </div>
      <div className="teacher-ntf-toast-body">
        <div className="teacher-ntf-toast-header">
          <span className="teacher-ntf-toast-from">From: {notification.senderName}</span>
          <span className={`teacher-ntf-toast-priority ${priorityClass}`}>
            {notification.priority}
          </span>
        </div>
        <h4 className="teacher-ntf-toast-title">{notification.title}</h4>
        <p className="teacher-ntf-toast-msg">{notification.message}</p>
        <div className="teacher-ntf-toast-actions">
          <button
            className="teacher-ntf-toast-read-btn"
            onClick={() => {
              if (notification._id) onRead(notification._id);
              onClose();
            }}
          >
            <CheckCircle size={13} /> Acknowledge
          </button>
          <button className="teacher-ntf-toast-close-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── TeacherLayout ─────────────────────────────────────────────────────────────
const TeacherLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastQueue, setToastQueue] = useState([]);   // active toast notifications
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("ntf_sound_enabled");
    return saved !== null ? saved === "true" : true;
  });
  const prevUnreadRef = useRef(0);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("ntf_sound_enabled", String(next));
      window.dispatchEvent(new CustomEvent("ntf_sound_toggle", { detail: next }));
      return next;
    });
  };

  useEffect(() => {
    const handleSoundToggle = (e) => {
      if (e.detail !== undefined) {
        setSoundEnabled(e.detail);
      }
    };
    window.addEventListener("ntf_sound_toggle", handleSoundToggle);
    return () => window.removeEventListener("ntf_sound_toggle", handleSoundToggle);
  }, []);

  const { playNotificationSound } = useNotificationSound();

  const handleLogout = () => {
    setUserPopoverOpen(false);
    disconnectSocket();
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

  // ── Poll unread count (fallback for environments where socket may fail) ──
  const pollUnreadCount = useCallback(async () => {
    try {
      const res = await fetchUnreadNotificationCountApi();
      if (res.success) {
        const newCount = res.unreadCount || 0;
        // Detect increase without socket event (extra safety)
        if (newCount > prevUnreadRef.current) {
          const delta = newCount - prevUnreadRef.current;
          if (soundEnabled) {
            playNotificationSound("normal");
          }
        }
        prevUnreadRef.current = newCount;
        setUnreadCount(newCount);
      }
    } catch (_) {
      // Silently ignore polling errors (user might be logged out)
    }
  }, [soundEnabled, playNotificationSound]);

  // Poll every 30 seconds
  useEffect(() => {
    if (!user) return;
    pollUnreadCount(); // initial fetch
    const timer = setInterval(pollUnreadCount, 30000);
    return () => clearInterval(timer);
  }, [user, pollUnreadCount]);

  // ── Socket.IO: real-time notification delivery ─────────────────────────
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = connectSocket(token);

    socket.on("new_notification", (notification) => {
      // Increment unread badge
      setUnreadCount((prev) => prev + 1);
      prevUnreadRef.current = (prevUnreadRef.current || 0) + 1;

      // Add to toast queue
      setToastQueue((prev) => [
        ...prev,
        { ...notification, toastId: Date.now() + Math.random() },
      ]);

      // Play sound based on priority
      if (soundEnabled) {
        const level =
          notification.priority === "Urgent"
            ? "urgent"
            : notification.priority === "Important"
            ? "important"
            : "normal";
        playNotificationSound(level);
      }
    });

    return () => {
      socket.off("new_notification");
    };
  }, [user, soundEnabled, playNotificationSound]);

  // Auto-dismiss normal toasts after 8s; urgent/important after 15s
  useEffect(() => {
    if (toastQueue.length === 0) return;

    const latest = toastQueue[toastQueue.length - 1];
    const timeout =
      latest.priority === "Urgent" || latest.priority === "Important" ? 15000 : 8000;

    const timer = setTimeout(() => {
      setToastQueue((prev) => prev.filter((t) => t.toastId !== latest.toastId));
    }, timeout);

    return () => clearTimeout(timer);
  }, [toastQueue]);

  const dismissToast = (toastId) => {
    setToastQueue((prev) => prev.filter((t) => t.toastId !== toastId));
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationReadApi(notificationId);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_) {}
  };

  const navItems = [
    {
      to: "/teacher/dashboard",
      icon: <LayoutDashboard className="sidebar-nav-icon" />,
      label: "Teacher Dashboard",
    },
    {
      to: "/teacher/notifications",
      icon: <Bell className="sidebar-nav-icon" />,
      label: "Notifications",
      badge: unreadCount,
    },
    {
      to: "/teacher/complaints",
      icon: <MessageSquare className="sidebar-nav-icon" />,
      label: "Complaints & Issues",
    },
  ];

  // Get initials for avatar
  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "ST";

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
          <div className="pl-brand-icon-wrap blue-theme">
            <UserCheck className="pl-brand-icon blue" />
          </div>
          <div className="pl-brand-text">
            <span className="pl-brand-name">School TMS</span>
            <span className="pl-brand-role text-blue">Teacher Portal</span>
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
          <p className="pl-nav-section-label">Teacher Workspace</p>
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
              {/* Unread badge */}
              {item.badge > 0 && (
                <span className="teacher-sidebar-badge">{item.badge > 99 ? "99+" : item.badge}</span>
              )}
              <ChevronRight className="pl-nav-chevron" size={14} />
            </NavLink>
          ))}
        </nav>

        {/* Sound Toggle */}
        <div className="teacher-sound-toggle">
          <button
            className={`teacher-sound-btn ${soundEnabled ? "on" : "off"}`}
            onClick={toggleSound}
            title={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
          >
            {soundEnabled ? "🔔 Sound ON" : "🔕 Sound OFF"}
          </button>
        </div>

        {/* ── USER CARD AT BOTTOM ── */}
        <div className="pl-sidebar-user-section" ref={popoverRef}>
          {/* Popover Panel */}
          {userPopoverOpen && (
            <div className="pl-user-popover">
              {/* Popover Header */}
              <div className="pl-popover-header">
                <div className="pl-popover-avatar blue">
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
                to="/teacher/dashboard"
                className="pl-popover-item"
                onClick={() => {
                  setUserPopoverOpen(false);
                  setSidebarOpen(false);
                }}
              >
                <UserCircle size={16} />
                <span>My Profile</span>
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
            onClick={() => setUserPopoverOpen(!userPopoverOpen)}
            aria-label="User Menu"
          >
            <div className="pl-user-initials-avatar blue">
              <span>{initials}</span>
            </div>
            <div className="pl-user-info">
              <span className="pl-user-name">{user?.name || "Subject Teacher"}</span>
              <span className="pl-user-role">{user?.role || "SUBJECT_TEACHER"}</span>
            </div>
            <ChevronRight size={15} className="pl-user-chevron" />
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
            <ShieldCheck className="pl-topbar-shield blue" />
            <div>
              <h1 className="pl-topbar-title">Subject Teacher Portal</h1>
              <p className="pl-topbar-subtitle">
                Academic Performance &amp; Test Management Workspace
              </p>
            </div>
          </div>

          <div className="pl-topbar-right">
            {/* Notification Bell in Topbar */}
            <NavLink
              to="/teacher/notifications"
              className="teacher-topbar-bell"
              title="View Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="teacher-topbar-bell-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </NavLink>

            <div className="pl-topbar-user-chip">
              <div className="pl-topbar-avatar blue">
                <span className="pl-topbar-avatar-initials">{initials}</span>
              </div>
              <span className="pl-topbar-username">
                {user?.name || "Subject Teacher"}
              </span>
            </div>

            <button onClick={handleLogout} className="btn-logout-small" title="Sign Out">
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="pl-page-content">
          <Outlet />
        </main>
      </div>

      {/* ── NOTIFICATION TOAST STACK ── */}
      <div className="teacher-toast-stack" aria-live="polite">
        {toastQueue.map((notif) => (
          <NotificationToast
            key={notif.toastId}
            notification={notif}
            onClose={() => dismissToast(notif.toastId)}
            onRead={handleMarkRead}
          />
        ))}
      </div>
    </div>
  );
};

export default TeacherLayout;
