import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginApi, getMeApi } from "../../services/api";

const initialToken = localStorage.getItem("token") || null;

// Async Thunk for User Login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await loginApi(credentials);
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to log in. Please try again.";
      return rejectWithValue(message);
    }
  }
);

// Async Thunk for Fetching Currently Logged In User
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getMeApi();
      return data;
    } catch (error) {
      localStorage.removeItem("token");
      const message =
        error.response?.data?.message || error.message || "Session expired. Please log in again.";
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  user: null,
  token: initialToken,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      // Merge updated fields into the existing user object
      state.user = { ...state.user, ...action.payload };
      if (action.payload.role) {
        state.role = action.payload.role;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.user?.role || null;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // fetchCurrentUser
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitializing = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.role = action.payload.user?.role || null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitializing = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.role = null;
      });
  },
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
