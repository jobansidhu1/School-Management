import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchMyMarksApi,
  fetchStudentMarksApi,
  createMarksApi,
  updateMarksApi,
  deleteMarksApi,
  fetchMyAttendanceApi,
  fetchStudentAttendanceApi,
  fetchDailyAttendanceApi,
  fetchMonthlyAttendanceApi,
  markAttendanceApi,
  bulkMarkAttendanceApi,
  deleteAttendanceApi,
  fetchSubjectsApi,
  createSubjectApi,
  updateSubjectApi,
  deleteSubjectApi,
} from "../../services/api";

// ─── MARKS THUNKS ─────────────────────────────────────────────────────────────
export const fetchMyMarksThunk = createAsyncThunk(
  "academic/fetchMyMarks",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchMyMarksApi();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchStudentMarksThunk = createAsyncThunk(
  "academic/fetchStudentMarks",
  async (studentId, { rejectWithValue }) => {
    try {
      const data = await fetchStudentMarksApi(studentId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createMarksThunk = createAsyncThunk(
  "academic/createMarks",
  async (marksData, { rejectWithValue }) => {
    try {
      const data = await createMarksApi(marksData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateMarksThunk = createAsyncThunk(
  "academic/updateMarks",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const result = await updateMarksApi(id, data);
      return result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteMarksThunk = createAsyncThunk(
  "academic/deleteMarks",
  async (id, { rejectWithValue }) => {
    try {
      await deleteMarksApi(id);
      return { id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ─── ATTENDANCE THUNKS ────────────────────────────────────────────────────────
export const fetchMyAttendanceThunk = createAsyncThunk(
  "academic/fetchMyAttendance",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchMyAttendanceApi();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchStudentAttendanceThunk = createAsyncThunk(
  "academic/fetchStudentAttendance",
  async (studentId, { rejectWithValue }) => {
    try {
      const data = await fetchStudentAttendanceApi(studentId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markAttendanceThunk = createAsyncThunk(
  "academic/markAttendance",
  async (attendanceData, { rejectWithValue }) => {
    try {
      const data = await markAttendanceApi(attendanceData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const bulkMarkAttendanceThunk = createAsyncThunk(
  "academic/bulkMarkAttendance",
  async (records, { rejectWithValue }) => {
    try {
      const data = await bulkMarkAttendanceApi(records);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchDailyAttendanceThunk = createAsyncThunk(
  "academic/fetchDailyAttendance",
  async (params, { rejectWithValue }) => {
    try {
      const data = await fetchDailyAttendanceApi(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchMonthlyAttendanceThunk = createAsyncThunk(
  "academic/fetchMonthlyAttendance",
  async (params, { rejectWithValue }) => {
    try {
      const data = await fetchMonthlyAttendanceApi(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ─── SUBJECTS THUNKS ──────────────────────────────────────────────────────────
export const fetchSubjectsThunk = createAsyncThunk(
  "academic/fetchSubjects",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await fetchSubjectsApi(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createSubjectThunk = createAsyncThunk(
  "academic/createSubject",
  async (subjectData, { rejectWithValue }) => {
    try {
      const data = await createSubjectApi(subjectData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateSubjectThunk = createAsyncThunk(
  "academic/updateSubject",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const result = await updateSubjectApi(id, data);
      return result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteSubjectThunk = createAsyncThunk(
  "academic/deleteSubject",
  async (id, { rejectWithValue }) => {
    try {
      await deleteSubjectApi(id);
      return { id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ─── SLICE ────────────────────────────────────────────────────────────────────
const academicSlice = createSlice({
  name: "academic",
  initialState: {
    marks: [],
    attendance: [],
    dailyAttendance: null,
    monthlyAttendance: null,
    subjects: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAcademicError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ─ Marks
    builder
      .addCase(fetchMyMarksThunk.pending, (state) => { state.loading = true; })
      .addCase(fetchMyMarksThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.marks = action.payload.marks || [];
      })
      .addCase(fetchMyMarksThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchStudentMarksThunk.pending, (state) => { state.loading = true; })
      .addCase(fetchStudentMarksThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.marks = action.payload.marks || [];
      })
      .addCase(fetchStudentMarksThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createMarksThunk.fulfilled, (state, action) => {
        if (action.payload.marks) state.marks.unshift(action.payload.marks);
      })
      .addCase(updateMarksThunk.fulfilled, (state, action) => {
        if (action.payload.marks) {
          const idx = state.marks.findIndex((m) => m._id === action.payload.marks._id);
          if (idx !== -1) state.marks[idx] = action.payload.marks;
        }
      })
      .addCase(deleteMarksThunk.fulfilled, (state, action) => {
        state.marks = state.marks.filter((m) => m._id !== action.payload.id);
      });

    // ─ Attendance
    builder
      .addCase(fetchMyAttendanceThunk.pending, (state) => { state.loading = true; })
      .addCase(fetchMyAttendanceThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.attendance = action.payload.attendance || [];
      })
      .addCase(fetchMyAttendanceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchStudentAttendanceThunk.fulfilled, (state, action) => {
        state.attendance = action.payload.attendance || [];
      })
      .addCase(fetchDailyAttendanceThunk.pending, (state) => { state.loading = true; })
      .addCase(fetchDailyAttendanceThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyAttendance = action.payload;
      })
      .addCase(fetchDailyAttendanceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMonthlyAttendanceThunk.pending, (state) => { state.loading = true; })
      .addCase(fetchMonthlyAttendanceThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.monthlyAttendance = action.payload;
      })
      .addCase(fetchMonthlyAttendanceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markAttendanceThunk.fulfilled, (state, action) => {
        if (action.payload.attendance) {
          const idx = state.attendance.findIndex((a) => a._id === action.payload.attendance._id);
          if (idx !== -1) state.attendance[idx] = action.payload.attendance;
          else state.attendance.unshift(action.payload.attendance);
        }
      })
      .addCase(bulkMarkAttendanceThunk.fulfilled, (state, action) => {
        if (action.payload.attendance) {
          // Merge/replace
          const newMap = {};
          action.payload.attendance.forEach((a) => { newMap[a._id] = a; });
          state.attendance = state.attendance
            .map((a) => newMap[a._id] || a)
            .concat(action.payload.attendance.filter((a) => !state.attendance.find((x) => x._id === a._id)));
        }
      });

    // ─ Subjects
    builder
      .addCase(fetchSubjectsThunk.pending, (state) => { state.loading = true; })
      .addCase(fetchSubjectsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.subjects = action.payload.subjects || [];
      })
      .addCase(fetchSubjectsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSubjectThunk.fulfilled, (state, action) => {
        if (action.payload.subject) state.subjects.push(action.payload.subject);
      })
      .addCase(updateSubjectThunk.fulfilled, (state, action) => {
        if (action.payload.subject) {
          const idx = state.subjects.findIndex((s) => s._id === action.payload.subject._id);
          if (idx !== -1) state.subjects[idx] = action.payload.subject;
        }
      })
      .addCase(deleteSubjectThunk.fulfilled, (state, action) => {
        state.subjects = state.subjects.filter((s) => s._id !== action.payload.id);
      });
  },
});

export const { clearAcademicError } = academicSlice.actions;
export default academicSlice.reducer;
