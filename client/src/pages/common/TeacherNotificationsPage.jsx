import React, { useState, useEffect, useRef } from "react";
import { useAppSelector } from "../../hooks/useAppDispatch";
import {
  fetchTeachers,
  sendNotificationApi,
  fetchTeacherNotificationsApi,
  fetchSentNotificationsApi,
  markNotificationReadApi,
} from "../../services/api";
import useNotificationSound from "../../hooks/useNotificationSound";
import {
  Bell,
  Send,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  MailCheck,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  X,
  MessageSquare,
  ShieldCheck,
  Check,
  Volume2,
  VolumeX,
} from "lucide-react";

const TeacherNotificationsPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isPrincipal = user?.role === "PRINCIPAL";

  const [activeTab, setActiveTab] = useState(isPrincipal ? "compose" : "inbox");

  // Common State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Principal Composer State
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const [recipientType, setRecipientType] = useState("ALL"); // ALL, INDIVIDUAL, MULTIPLE
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [sending, setSending] = useState(false);

  // Sent Notifications (Principal)
  const [sentNotifications, setSentNotifications] = useState([]);

  // Teacher Inbox State
  const [inbox, setInbox] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [alarmNotification, setAlarmNotification] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("ntf_sound_enabled");
    return saved !== null ? saved === "true" : true;
  });
  const alarmPlayedRef = useRef(false);

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

  // Fetch Teachers (For Principal Composer)
  const loadTeachers = async () => {
    if (!isPrincipal) return;
    setLoadingTeachers(true);
    try {
      const res = await fetchTeachers();
      if (res.success) {
        setTeachers(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load teachers roster:", err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Fetch Sent Notifications History (Principal)
  const loadSentNotifications = async () => {
    if (!isPrincipal) return;
    setLoading(true);
    try {
      const res = await fetchSentNotificationsApi();
      if (res.success) {
        setSentNotifications(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch sent notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Teacher Inbox Notifications
  const loadTeacherInbox = async () => {
    if (isPrincipal) return;
    setLoading(true);
    try {
      const res = await fetchTeacherNotificationsApi();
      if (res.success) {
        setInbox(res.data || []);
        setUnreadCount(res.unreadCount || 0);

        // Alarm indicator for unread urgent messages
        const unreadUrgent = (res.data || []).find(
          (n) => !n.isRead && (n.priority === "Urgent" || n.priority === "Important")
        );
        if (unreadUrgent) {
          setAlarmNotification(unreadUrgent);
          // Play alarm sound (only once per page load)
          if (soundEnabled && !alarmPlayedRef.current) {
            alarmPlayedRef.current = true;
            const level = unreadUrgent.priority === "Urgent" ? "urgent" : "important";
            playNotificationSound(level);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch inbox notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPrincipal) {
      loadTeachers();
      loadSentNotifications();
    } else {
      loadTeacherInbox();
    }
  }, [isPrincipal]);

  // Handle Multi-Teacher Select
  const toggleTeacherSelect = (teacherId) => {
    if (recipientType === "INDIVIDUAL") {
      setSelectedTeacherIds([teacherId]);
    } else {
      if (selectedTeacherIds.includes(teacherId)) {
        setSelectedTeacherIds(selectedTeacherIds.filter((id) => id !== teacherId));
      } else {
        setSelectedTeacherIds([...selectedTeacherIds, teacherId]);
      }
    }
  };

  const handleSelectAllTeachersInList = () => {
    const filteredIds = filteredTeachers.map((t) => t._id);
    setSelectedTeacherIds(filteredIds);
  };

  const handleClearTeacherSelection = () => {
    setSelectedTeacherIds([]);
  };

  // Send Notification Submit
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Please fill out notification title and message body.");
      return;
    }

    if (recipientType !== "ALL" && selectedTeacherIds.length === 0) {
      setError("Please select at least one teacher recipient.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const payload = {
        title,
        message,
        priority,
        recipientType,
        recipientTeacherIds: recipientType === "ALL" ? [] : selectedTeacherIds,
      };

      const res = await sendNotificationApi(payload);
      if (res.success) {
        setSuccessMsg(res.message || "Notification sent successfully!");
        setTitle("");
        setMessage("");
        setPriority("Normal");
        setSelectedTeacherIds([]);
        loadSentNotifications();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  // Mark As Read
  const handleOpenNotification = async (notif) => {
    setSelectedNotification(notif);
    if (!notif.isRead && !isPrincipal) {
      try {
        await markNotificationReadApi(notif._id);
        loadTeacherInbox();
      } catch (err) {
        console.error("Failed to mark read:", err);
      }
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.email.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const getPriorityBadge = (p) => {
    switch (p) {
      case "Urgent":
        return <span className="ntf-priority urgent"><AlertTriangle size={12} /> Urgent</span>;
      case "Important":
        return <span className="ntf-priority important"><AlertCircle size={12} /> Important</span>;
      default:
        return <span className="ntf-priority normal"><Info size={12} /> Normal</span>;
    }
  };

  return (
    <div className="ntf-container">
      {/* Top Banner */}
      <div className="ntf-header">
        <div>
          <h1 className="ntf-title">Teacher Announcements &amp; Notifications</h1>
          <p className="ntf-subtitle">
            {isPrincipal
              ? "Broadcast messages, urgent instructions, or private announcements directly to teachers."
              : "Read official announcements and administrative notices sent by the Principal."}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="ntf-tab-buttons">
          {isPrincipal ? (
            <>
              <button
                className={`ntf-tab-btn ${activeTab === "compose" ? "active" : ""}`}
                onClick={() => setActiveTab("compose")}
              >
                <Send size={16} /> Send Announcement
              </button>
              <button
                className={`ntf-tab-btn ${activeTab === "sent" ? "active" : ""}`}
                onClick={() => setActiveTab("sent")}
              >
                <MailCheck size={16} /> Sent History ({sentNotifications.length})
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className={`ntf-tab-btn ${activeTab === "inbox" ? "active" : ""}`}
                onClick={() => setActiveTab("inbox")}
              >
                <Bell size={16} /> Inbox {unreadCount > 0 && <span className="ntf-count-badge">{unreadCount}</span>}
              </button>
              <button
                className="ntf-sound-toggle-btn"
                onClick={toggleSound}
                title={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alarm Popup Modal for Unread Urgent Messages */}
      {alarmNotification && (
        <div className="ntf-alarm-backdrop">
          <div className="ntf-alarm-modal">
            <div className="ntf-alarm-icon-wrap">
              <Bell size={32} className="ntf-alarm-ring-icon" />
            </div>
            <h3>Urgent Announcement Alert!</h3>
            <p className="ntf-alarm-sender">From: {alarmNotification.senderName}</p>
            <h4 className="ntf-alarm-title">{alarmNotification.title}</h4>
            <p className="ntf-alarm-body">{alarmNotification.message}</p>
            {!soundEnabled && (
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                🔕 Sound is muted — click the sound icon in the header to enable.
              </p>
            )}
            <div className="ntf-alarm-actions">
              <button
                className="ntf-btn primary"
                onClick={() => {
                  handleOpenNotification(alarmNotification);
                  setAlarmNotification(null);
                }}
              >
                Read &amp; Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Alerts */}
      {successMsg && (
        <div className="cmp-alert success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="cmp-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── PRINCIPAL COMPOSER TAB ── */}
      {isPrincipal && activeTab === "compose" && (
        <div className="ntf-grid">
          <form onSubmit={handleSendNotification} className="ntf-card composer-card">
            <h3 className="ntf-card-title"><Send size={18} /> Compose Teacher Announcement</h3>

            {/* Priority Selection */}
            <div className="ntf-form-group">
              <label>Message Importance Level</label>
              <div className="ntf-priority-selector">
                {["Normal", "Important", "Urgent"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`ntf-priority-btn ${p.toLowerCase()} ${priority === p ? "selected" : ""}`}
                    onClick={() => setPriority(p)}
                  >
                    {p === "Urgent" && <AlertTriangle size={14} />}
                    {p === "Important" && <AlertCircle size={14} />}
                    {p === "Normal" && <Info size={14} />}
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="ntf-form-group">
              <label>Announcement Title *</label>
              <input
                type="text"
                placeholder="e.g. Urgent Faculty Meeting at 3:00 PM"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="cmp-input"
                required
              />
            </div>

            {/* Message Body */}
            <div className="ntf-form-group">
              <label>Message Content *</label>
              <textarea
                rows={6}
                placeholder="Write clear details for teachers..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="cmp-input textarea"
                required
              />
            </div>

            <button
              type="submit"
              className="cmp-btn primary full-width"
              disabled={sending}
            >
              {sending ? "Sending..." : "Send Notification"}
            </button>
          </form>

          {/* Recipient Selection Side Panel */}
          <div className="ntf-card recipients-card">
            <h3 className="ntf-card-title"><Users size={18} /> Target Recipients</h3>

            {/* Recipient Mode Tabs */}
            <div className="ntf-mode-selector">
              <button
                type="button"
                className={`ntf-mode-btn ${recipientType === "ALL" ? "active" : ""}`}
                onClick={() => {
                  setRecipientType("ALL");
                  setSelectedTeacherIds([]);
                }}
              >
                All Teachers ({teachers.length})
              </button>
              <button
                type="button"
                className={`ntf-mode-btn ${recipientType === "INDIVIDUAL" ? "active" : ""}`}
                onClick={() => {
                  setRecipientType("INDIVIDUAL");
                  setSelectedTeacherIds([]);
                }}
              >
                Single Teacher
              </button>
              <button
                type="button"
                className={`ntf-mode-btn ${recipientType === "MULTIPLE" ? "active" : ""}`}
                onClick={() => setRecipientType("MULTIPLE")}
              >
                Select Multiple ({selectedTeacherIds.length})
              </button>
            </div>

            {/* Recipient List & Search */}
            {recipientType === "ALL" ? (
              <div className="ntf-all-target-info">
                <ShieldCheck size={40} className="ntf-target-icon" />
                <h4>Broadcasting to All Teachers</h4>
                <p>This message will be delivered to every active Class Incharge and Subject Teacher.</p>
              </div>
            ) : (
              <div className="ntf-teacher-picker">
                <div className="ntf-picker-header">
                  <div className="cmp-search-box small">
                    <Search size={15} />
                    <input
                      type="text"
                      placeholder="Search teacher by name..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                    />
                  </div>
                  {recipientType === "MULTIPLE" && (
                    <div className="ntf-picker-actions">
                      <button
                        type="button"
                        className="ntf-link-btn"
                        onClick={handleSelectAllTeachersInList}
                      >
                        Select All
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        className="ntf-link-btn"
                        onClick={handleClearTeacherSelection}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <div className="ntf-teacher-list">
                  {loadingTeachers ? (
                    <p className="ntf-loading">Loading teachers roster...</p>
                  ) : filteredTeachers.length === 0 ? (
                    <p className="ntf-empty">No teachers found.</p>
                  ) : (
                    filteredTeachers.map((t) => {
                      const isSelected = selectedTeacherIds.includes(t._id);
                      return (
                        <div
                          key={t._id}
                          className={`ntf-teacher-item ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleTeacherSelect(t._id)}
                        >
                          <div className="ntf-teacher-checkbox">
                            {isSelected ? <Check size={14} /> : null}
                          </div>
                          <div className="ntf-teacher-details">
                            <span className="ntf-teacher-name">{t.name}</span>
                            <span className="ntf-teacher-role">{t.role} {t.email}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SENT HISTORY TAB (PRINCIPAL) ── */}
      {isPrincipal && activeTab === "sent" && (
        <div className="ntf-card">
          <div className="ntf-card-header">
            <h3><MailCheck size={18} /> Sent Announcements Log</h3>
            <button className="cmp-btn secondary" onClick={loadSentNotifications}>
              <RefreshCw size={15} className={loading ? "spin-slow" : ""} /> Refresh Log
            </button>
          </div>

          {sentNotifications.length === 0 ? (
            <div className="cmp-empty-state">
              <MessageSquare size={40} className="cmp-empty-icon" />
              <h3>No Notifications Sent Yet</h3>
              <p>Sent announcements and recipient delivery status will be listed here.</p>
            </div>
          ) : (
            <div className="ntf-sent-list">
              {sentNotifications.map((notif) => (
                <div key={notif._id} className="ntf-sent-item">
                  <div className="ntf-sent-head">
                    <div className="ntf-sent-title-wrap">
                      <h4>{notif.title}</h4>
                      {getPriorityBadge(notif.priority)}
                      <span className="ntf-type-tag">Target: {notif.recipientType}</span>
                    </div>
                    <span className="ntf-time">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="ntf-sent-msg">{notif.message}</p>
                  <div className="ntf-sent-recipients">
                    <strong>Recipients ({notif.recipients?.length || 0}):</strong>
                    <div className="ntf-recipient-pills">
                      {notif.recipients?.map((r, i) => (
                        <span key={i} className={`ntf-rec-pill ${r.isRead ? "read" : "unread"}`}>
                          {r.teacher?.name || "Teacher"} {r.isRead ? "✓ Read" : "• Unread"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TEACHER INBOX TAB ── */}
      {!isPrincipal && activeTab === "inbox" && (
        <div className="ntf-card">
          <div className="ntf-card-header">
            <h3><Bell size={18} /> My Received Announcements</h3>
            <button className="cmp-btn secondary" onClick={loadTeacherInbox}>
              <RefreshCw size={15} className={loading ? "spin-slow" : ""} /> Refresh Inbox
            </button>
          </div>

          {inbox.length === 0 ? (
            <div className="cmp-empty-state">
              <Bell size={40} className="cmp-empty-icon" />
              <h3>Inbox is Empty</h3>
              <p>You have no notifications or announcements from the Principal.</p>
            </div>
          ) : (
            <div className="ntf-inbox-list">
              {inbox.map((item) => (
                <div
                  key={item._id}
                  className={`ntf-inbox-item ${!item.isRead ? "unread" : ""}`}
                  onClick={() => handleOpenNotification(item)}
                >
                  <div className="ntf-inbox-left">
                    <div className={`ntf-status-indicator ${!item.isRead ? "unread" : ""}`} />
                    <div>
                      <div className="ntf-inbox-title-row">
                        <h4 className="ntf-inbox-title">{item.title}</h4>
                        {getPriorityBadge(item.priority)}
                        {!item.isRead && <span className="ntf-unread-tag">UNREAD</span>}
                      </div>
                      <p className="ntf-inbox-snippet">{item.message}</p>
                      <div className="ntf-inbox-meta">
                        <span>From: {item.senderName}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <button className="cmp-action-btn">
                    Read Message
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DETAIL READ MODAL ── */}
      {selectedNotification && (
        <div className="cmp-modal-overlay">
          <div className="cmp-modal">
            <div className="cmp-modal-header">
              <div className="ntf-modal-title-row">
                <h3>{selectedNotification.title}</h3>
                {getPriorityBadge(selectedNotification.priority)}
              </div>
              <button
                className="cmp-close-btn"
                onClick={() => setSelectedNotification(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="cmp-modal-body">
              <div className="ntf-detail-meta">
                <p><strong>From:</strong> {selectedNotification.senderName}</p>
                <p><strong>Date &amp; Time:</strong> {new Date(selectedNotification.createdAt).toLocaleString()}</p>
              </div>
              <div className="ntf-detail-content">
                <p>{selectedNotification.message}</p>
              </div>
            </div>
            <div className="cmp-modal-footer">
              <button
                className="cmp-btn primary"
                onClick={() => setSelectedNotification(null)}
              >
                Close Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherNotificationsPage;
