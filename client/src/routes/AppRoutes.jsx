import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/useAppDispatch";
import { ROLES, hasRole } from "../utils/permissions";
import Login from "../pages/auth/Login";
import PrincipalLayout from "../components/principal/PrincipalLayout";
import ClassesPage from "../pages/principal/ClassesPage";
import ClassInchargesPage from "../pages/principal/ClassInchargesPage";
import ProfilePage from "../pages/principal/ProfilePage";
import SettingsPage from "../pages/principal/SettingsPage";
import TeachersPage from "../pages/principal/TeachersPage";
import ClassInchargeLayout from "../components/classIncharge/ClassInchargeLayout";
import ClassInchargeDashboard from "../pages/classIncharge/Dashboard";
import StudentsPage from "../pages/classIncharge/Students";
import MyClass from "../pages/classIncharge/MyClass";
import SubjectDetail from "../pages/classIncharge/SubjectDetail";
import StudentDetail from "../pages/classIncharge/StudentDetail";
import StudentLayout from "../components/student/StudentLayout";
import StudentDashboard from "../pages/student/Dashboard";
import StudentSubjects from "../pages/student/Subjects";
import TeacherLayout from "../components/teacher/TeacherLayout";
import TeacherDashboard from "../pages/teacher/Dashboard";

import ComplaintsPage from "../pages/common/ComplaintsPage";
import TeacherNotificationsPage from "../pages/common/TeacherNotificationsPage";
import SystemFlowPage from "../pages/common/SystemFlowPage";

// Protected Route Component for Authorized Roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isInitializing } = useAppSelector(
    (state) => state.auth
  );

  if (isInitializing) {
    return (
      <div className="fullscreen-loader">
        <div className="loader-spinner"></div>
        <p>Loading authentication state...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(user, allowedRoles)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, role } = useAppSelector((state) => state.auth);

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Principal Routes (nested under sidebar layout) */}
      <Route
        path="/principal"
        element={
          <ProtectedRoute allowedRoles={[ROLES.PRINCIPAL]}>
            <PrincipalLayout />
          </ProtectedRoute>
        }
      >
        {/* Default redirect: /principal → /principal/classes */}
        <Route index element={<Navigate to="classes" replace />} />
        <Route path="dashboard" element={<Navigate to="/principal/classes" replace />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="class-incharges" element={<ClassInchargesPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="notifications" element={<TeacherNotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="system-flow" element={<SystemFlowPage />} />
      </Route>

      {/* Protected Class Incharge Routes (nested under ClassInchargeLayout) */}
      <Route
        path="/class-incharge"
        element={
          <ProtectedRoute allowedRoles={[ROLES.CLASS_INCHARGE]}>
            <ClassInchargeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ClassInchargeDashboard />} />
        <Route path="my-class" element={<MyClass />} />
        <Route path="my-class/subject/:subjectId" element={<SubjectDetail />} />
        <Route path="my-class/subject/:subjectId/student/:studentId" element={<StudentDetail />} />
        <Route path="subject-teachers" element={<ClassInchargeDashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="notifications" element={<TeacherNotificationsPage />} />
        <Route path="system-flow" element={<SystemFlowPage />} />
      </Route>

      {/* Protected Teacher Routes (nested under TeacherLayout) */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUBJECT_TEACHER]}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="notifications" element={<TeacherNotificationsPage />} />
        <Route path="system-flow" element={<SystemFlowPage />} />
      </Route>

      {/* Protected Student Routes (nested under StudentLayout) */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="subjects" element={<StudentSubjects />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="system-flow" element={<SystemFlowPage />} />
      </Route>

      {/* Default Route Navigation */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            role === ROLES.PRINCIPAL ? (
              <Navigate to="/principal/classes" replace />
            ) : role === ROLES.CLASS_INCHARGE ? (
              <Navigate to="/class-incharge/dashboard" replace />
            ) : role === ROLES.SUBJECT_TEACHER ? (
              <Navigate to="/teacher/dashboard" replace />
            ) : role === ROLES.STUDENT ? (
              <Navigate to="/student/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
