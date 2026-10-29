import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://school-management-fmai.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API Calls
export const loginApi = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const getMeApi = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const updateProfileApi = async (data) => {
  const response = await api.put("/auth/profile", data);
  return response.data;
};

// Principal Classes API Calls
export const fetchPrincipalClasses = async () => {
  const response = await api.get("/principal/classes");
  return response.data;
};

export const fetchClassDetails = async (classId) => {
  const response = await api.get(`/principal/classes/${classId}`);
  return response.data;
};

export const updateClassSectionsApi = async (classId, data) => {
  const response = await api.put(`/principal/classes/${classId}/sections`, data);
  return response.data;
};

export const assignClassInchargeApi = async (classId, classInchargeId) => {
  const response = await api.put(`/principal/classes/${classId}/incharge`, { classInchargeId });
  return response.data;
};

export const assignSubjectTeacherPrincipalApi = async (classId, data) => {
  const response = await api.post(`/principal/classes/${classId}/subject-teachers`, data);
  return response.data;
};

export const deleteSubjectTeacherPrincipalApi = async (classId, assignmentId) => {
  const response = await api.delete(`/principal/classes/${classId}/subject-teachers/${assignmentId}`);
  return response.data;
};

// Principal School & Academic Session API Calls
export const fetchSchoolSettingsApi = async () => {
  const response = await api.get("/principal/school");
  return response.data;
};

export const updateSchoolSettingsApi = async (data) => {
  const response = await api.put("/principal/school", data);
  return response.data;
};

export const addAcademicSessionApi = async (data) => {
  const response = await api.post("/principal/academic-sessions", data);
  return response.data;
};

// Principal Class Incharge CRUD API Calls
export const fetchClassIncharges = async () => {
  const response = await api.get("/principal/class-incharges");
  return response.data;
};

export const createClassInchargeApi = async (data) => {
  const response = await api.post("/principal/class-incharges", data);
  return response.data;
};

export const updateClassInchargeApi = async (id, data) => {
  const response = await api.put(`/principal/class-incharges/${id}`, data);
  return response.data;
};

export const deleteClassInchargeApi = async (id) => {
  const response = await api.delete(`/principal/class-incharges/${id}`);
  return response.data;
};

// Class Incharge API Calls
export const fetchClassInchargeDashboard = async () => {
  const response = await api.get("/class-incharge/dashboard");
  return response.data;
};

export const assignSubjectTeacherApi = async (data) => {
  const response = await api.post("/class-incharge/assign-teacher", data);
  return response.data;
};

export const createTeacherCredentialsApi = async (data) => {
  const response = await api.post("/class-incharge/create-credentials", data);
  return response.data;
};

// Class Incharge Subject CRUD
export const fetchClassSubjectsApi = async () => {
  const response = await api.get("/class-incharge/subjects");
  return response.data;
};

export const createClassSubjectApi = async (name) => {
  const response = await api.post("/class-incharge/subjects", { name });
  return response.data;
};

export const updateClassSubjectApi = async (index, name) => {
  const response = await api.put(`/class-incharge/subjects/${index}`, { name });
  return response.data;
};

export const deleteClassSubjectApi = async (index) => {
  const response = await api.delete(`/class-incharge/subjects/${index}`);
  return response.data;
};

// Teacher Management API Calls
export const fetchTeachers = async (params = {}) => {
  const response = await api.get("/teachers", { params });
  return response.data;
};

export const createTeacherApi = async (data) => {
  const response = await api.post("/teachers", data);
  return response.data;
};

export const updateTeacherApi = async (id, data) => {
  const response = await api.put(`/teachers/${id}`, data);
  return response.data;
};

export const deleteTeacherApi = async (id) => {
  const response = await api.delete(`/teachers/${id}`);
  return response.data;
};

export const bulkImportTeachersApi = async (teachers) => {
  const response = await api.post("/teachers/bulk-import", { teachers });
  return response.data;
};

// Complaints API Calls
export const fetchComplaintsApi = async (params = {}) => {
  const response = await api.get("/complaints", { params });
  return response.data;
};

export const fetchComplaintByIdApi = async (id) => {
  const response = await api.get(`/complaints/${id}`);
  return response.data;
};

export const createComplaintApi = async (data) => {
  const response = await api.post("/complaints", data);
  return response.data;
};

export const updateComplaintStatusApi = async (id, data) => {
  const response = await api.put(`/complaints/${id}/status`, data);
  return response.data;
};

// Notifications API Calls
export const sendNotificationApi = async (data) => {
  const response = await api.post("/notifications", data);
  return response.data;
};

export const fetchTeacherNotificationsApi = async () => {
  const response = await api.get("/notifications/teacher");
  return response.data;
};

export const fetchSentNotificationsApi = async () => {
  const response = await api.get("/notifications/sent");
  return response.data;
};

export const markNotificationReadApi = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const fetchUnreadNotificationCountApi = async () => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};

// Dashboard API Calls
export const fetchTeacherDashboardApi = async () => {
  const response = await api.get("/dashboard/teacher");
  return response.data;
};

// Students API Calls
export const fetchStudentsApi = async (params = {}) => {
  const response = await api.get("/students", { params });
  return response.data;
};

export const fetchMyAcademicsApi = async () => {
  const response = await api.get("/academic/my-academics");
  return response.data;
};

export const createStudentApi = async (data) => {
  const response = await api.post("/students", data);
  return response.data;
};

export const updateStudentApi = async (id, data) => {
  const response = await api.put(`/students/${id}`, data);
  return response.data;
};

export const deleteStudentApi = async (id) => {
  const response = await api.delete(`/students/${id}`);
  return response.data;
};

export const bulkImportStudentsApi = async (students) => {
  const response = await api.post("/students/bulk-import", { students });
  return response.data;
};

// ─── Academic API: Subjects ───────────────────────────────────────────────────
export const fetchSubjectsApi = async (params = {}) => {
  const response = await api.get("/academic/subjects", { params });
  return response.data;
};

export const createSubjectApi = async (data) => {
  const response = await api.post("/academic/subjects", data);
  return response.data;
};

export const updateSubjectApi = async (id, data) => {
  const response = await api.put(`/academic/subjects/${id}`, data);
  return response.data;
};

export const deleteSubjectApi = async (id) => {
  const response = await api.delete(`/academic/subjects/${id}`);
  return response.data;
};

// ─── Academic API: Marks ──────────────────────────────────────────────────────
export const fetchMyMarksApi = async () => {
  const response = await api.get("/academic/marks/me");
  return response.data;
};

export const fetchStudentMarksApi = async (studentId) => {
  const response = await api.get(`/academic/marks/student/${studentId}`);
  return response.data;
};

export const createMarksApi = async (data) => {
  const response = await api.post("/academic/marks", data);
  return response.data;
};

export const updateMarksApi = async (id, data) => {
  const response = await api.put(`/academic/marks/${id}`, data);
  return response.data;
};

export const deleteMarksApi = async (id) => {
  const response = await api.delete(`/academic/marks/${id}`);
  return response.data;
};

// ─── Academic API: Attendance ─────────────────────────────────────────────────
export const fetchDailyAttendanceApi = async ({ classStandard, section, date }) => {
  const params = new URLSearchParams();
  if (classStandard) params.append("classStandard", classStandard);
  if (section) params.append("section", section);
  if (date) params.append("date", date);
  const response = await api.get(`/academic/attendance/daily?${params.toString()}`);
  return response.data;
};

export const fetchMonthlyAttendanceApi = async ({ classStandard, section, month, studentId }) => {
  const params = new URLSearchParams();
  if (classStandard) params.append("classStandard", classStandard);
  if (section) params.append("section", section);
  if (month) params.append("month", month);
  if (studentId) params.append("studentId", studentId);
  const response = await api.get(`/academic/attendance/monthly?${params.toString()}`);
  return response.data;
};

export const fetchMyAttendanceApi = async () => {
  const response = await api.get("/academic/attendance/me");
  return response.data;
};

export const fetchStudentAttendanceApi = async (studentId) => {
  const response = await api.get(`/academic/attendance/student/${studentId}`);
  return response.data;
};

export const markAttendanceApi = async (data) => {
  const response = await api.post("/academic/attendance", data);
  return response.data;
};

export const bulkMarkAttendanceApi = async (data) => {
  // Support either raw records array or full payload with classStandard, section, date, records
  const payload = Array.isArray(data) ? { records: data } : data;
  const response = await api.post("/academic/attendance/bulk", payload);
  return response.data;
};

export const deleteAttendanceApi = async (id) => {
  const response = await api.delete(`/academic/attendance/${id}`);
  return response.data;
};

export default api;
