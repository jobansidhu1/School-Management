import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppDispatch";
import { loginUser, clearError } from "../../redux/slices/authSlice";
import { validateLoginForm } from "../../utils/validation";
import { ROLES } from "../../utils/permissions";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  GraduationCap,
  Sparkles,
} from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, role, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  // Auto redirect if logged in
  useEffect(() => {
    if (isAuthenticated) {
      if (role === ROLES.PRINCIPAL) {
        navigate("/principal/classes", { replace: true });
      } else if (role === ROLES.CLASS_INCHARGE) {
        navigate("/class-incharge/dashboard", { replace: true });
      } else if (role === ROLES.STUDENT) {
        navigate("/student/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateLoginForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    const resultAction = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(resultAction)) {
      const userRole = resultAction.payload?.user?.role;
      if (userRole === ROLES.PRINCIPAL) {
        navigate("/principal/classes");
      } else if (userRole === ROLES.CLASS_INCHARGE) {
        navigate("/class-incharge/dashboard");
      } else if (userRole === ROLES.STUDENT) {
        navigate("/student/dashboard");
      }
    }
  };

  return (
    <div className="login-container">
      {/* Soft ambient orbs */}
      <div className="login-backdrop">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
      </div>

      <div className="login-card-wrapper">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="badge-principal">
              <ShieldCheck className="icon-shield" />
              <span>School Staff Portal</span>
            </div>
            <div className="brand-logo">
              <div className="logo-icon-bg">
                <GraduationCap className="logo-icon" />
              </div>
              <h1 className="brand-title">School Test Management</h1>
            </div>
            <p className="login-subtitle">
              Sign in with your Principal or Class Incharge credentials to
              access your dashboard
            </p>
          </div>

          {/* Alert Message for API errors */}
          {error && (
            <div className="alert-banner alert-error" role="alert">
              <AlertCircle className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Email / Username / Student ID Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Student ID / Username / Email
              </label>
              <div
                className={`input-wrapper ${formErrors.email ? "has-error" : ""}`}
              >
                <Mail className="input-icon" />
                <input
                  id="email"
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. 12job13 or STU001 or email"
                  disabled={isLoading}
                  autoComplete="username"
                  required
                />
              </div>
              {formErrors.email && (
                <span className="field-error">{formErrors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
              </div>
              <div
                className={`input-wrapper ${
                  formErrors.password ? "has-error" : ""
                }`}
              >
                <Lock className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="icon-eye" />
                  ) : (
                    <Eye className="icon-eye" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <span className="field-error">{formErrors.password}</span>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="spinner" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <Sparkles className="btn-sparkle" />
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="login-footer">
            <p className="security-notice">
              🔒 Secure SSL Encrypted Role-Based Authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
