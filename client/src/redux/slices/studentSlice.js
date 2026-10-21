import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchStudentsApi,
  createStudentApi,
  updateStudentApi,
  deleteStudentApi,
  bulkImportStudentsApi,
} from "../../services/api";

export const getStudentsThunk = createAsyncThunk(
  "students/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchStudentsApi();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createStudentThunk = createAsyncThunk(
  "students/create",
  async (studentData, { rejectWithValue }) => {
    try {
      const data = await createStudentApi(studentData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateStudentThunk = createAsyncThunk(
  "students/update",
  async ({ id, studentData }, { rejectWithValue }) => {
    try {
      const data = await updateStudentApi(id, studentData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteStudentThunk = createAsyncThunk(
  "students/delete",
  async (id, { rejectWithValue }) => {
    try {
      const data = await deleteStudentApi(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const bulkImportStudentsThunk = createAsyncThunk(
  "students/bulkImport",
  async (students, { rejectWithValue }) => {
    try {
      const data = await bulkImportStudentsApi(students);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  students: [],
  loading: false,
  error: null,
};

const studentSlice = createSlice({
  name: "students",
  initialState,
  reducers: {
    addLocalStudents: (state, action) => {
      state.students = [...state.students, ...action.payload];
    },
    addSingleLocalStudent: (state, action) => {
      state.students.push(action.payload);
    },
    updateLocalStudent: (state, action) => {
      const index = state.students.findIndex(
        (s) => s._id === action.payload.id || s.studentId === action.payload.id
      );
      if (index !== -1) {
        state.students[index] = { ...state.students[index], ...action.payload.data };
      }
    },
    deleteLocalStudent: (state, action) => {
      state.students = state.students.filter(
        (s) => s._id !== action.payload && s.studentId !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStudentsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(getStudentsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.students || [];
      })
      .addCase(getStudentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(bulkImportStudentsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkImportStudentsThunk.fulfilled, (state, action) => {
        state.loading = false;
        // Replace state with fresh list from backend (returned students after import)
        if (action.payload?.students) {
          // Merge: keep existing records not in import, then add/update imported ones
          const importedById = {};
          action.payload.students.forEach((s) => {
            importedById[s.studentId] = s;
          });
          // Remove old versions of imported students, then add updated ones
          const kept = state.students.filter((s) => !importedById[s.studentId]);
          state.students = [...kept, ...action.payload.students];
        }
      })
      .addCase(bulkImportStudentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addLocalStudents,
  addSingleLocalStudent,
  updateLocalStudent,
  deleteLocalStudent,
} = studentSlice.actions;

export default studentSlice.reducer;
