import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchTeachers,
  createTeacherApi,
  updateTeacherApi,
  deleteTeacherApi,
  bulkImportTeachersApi,
} from "../../services/api";

const DEMO_TEACHERS = [
  {
    _id: "demo-tch-1",
    teacherId: "TCH001",
    fullName: "Aman Singh",
    email: "aman.singh1@example.com",
    contactNumber: "9810000000",
    qualification: "B.Ed",
    gender: "Male",
    role: "SUBJECT_TEACHER",
    accountStatus: "Active",
  },
  {
    _id: "demo-tch-2",
    teacherId: "TCH002",
    fullName: "Simran Kaur",
    email: "simran.kaur2@example.com",
    contactNumber: "9810137641",
    qualification: "M.Ed",
    gender: "Female",
    role: "CLASS_INCHARGE",
    accountStatus: "Active",
  },
  {
    _id: "demo-tch-3",
    teacherId: "TCH003",
    fullName: "Harpreet Sharma",
    email: "harpreet.sharma3@example.com",
    contactNumber: "9810275282",
    qualification: "M.A. English",
    gender: "Female",
    role: "SUBJECT_TEACHER",
    accountStatus: "Active",
  },
  {
    _id: "demo-tch-4",
    teacherId: "TCH004",
    fullName: "Navjot Kumar",
    email: "navjot.kumar4@example.com",
    contactNumber: "9810412923",
    qualification: "M.Sc. Mathematics",
    gender: "Male",
    role: "SUBJECT_TEACHER",
    accountStatus: "Active",
  },
];

export const getTeachersThunk = createAsyncThunk(
  "teachers/getTeachers",
  async (params, { rejectWithValue }) => {
    try {
      const data = await fetchTeachers(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch teachers.");
    }
  }
);

export const createTeacherThunk = createAsyncThunk(
  "teachers/createTeacher",
  async (teacherData, { rejectWithValue }) => {
    try {
      const data = await createTeacherApi(teacherData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create teacher.");
    }
  }
);

export const updateTeacherThunk = createAsyncThunk(
  "teachers/updateTeacher",
  async ({ id, teacherData }, { rejectWithValue }) => {
    try {
      const data = await updateTeacherApi(id, teacherData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update teacher.");
    }
  }
);

export const deleteTeacherThunk = createAsyncThunk(
  "teachers/deleteTeacher",
  async (id, { rejectWithValue }) => {
    try {
      const data = await deleteTeacherApi(id);
      return { id, ...data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete teacher.");
    }
  }
);

export const bulkImportTeachersThunk = createAsyncThunk(
  "teachers/bulkImport",
  async (teachersArray, { rejectWithValue }) => {
    try {
      const data = await bulkImportTeachersApi(teachersArray);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to bulk import teachers.");
    }
  }
);

const teacherSlice = createSlice({
  name: "teachers",
  initialState: {
    teachers: DEMO_TEACHERS,
    total: DEMO_TEACHERS.length,
    loading: false,
    error: null,
    importSuccessMsg: null,
  },
  reducers: {
    clearTeacherError: (state) => {
      state.error = null;
    },
    clearImportSuccessMsg: (state) => {
      state.importSuccessMsg = null;
    },
    // Direct local state update fallback for instant response / client-side import
    addLocalTeachers: (state, action) => {
      const newTeachers = action.payload;
      const existingIds = new Set(state.teachers.map((t) => t.teacherId?.toUpperCase()));
      const filteredNew = newTeachers.filter(
        (t) => !existingIds.has(t.teacherId?.toUpperCase())
      );
      state.teachers = [...filteredNew, ...state.teachers];
      state.total = state.teachers.length;
      state.importSuccessMsg = `Successfully imported ${filteredNew.length} teacher record(s).`;
    },
    updateLocalTeacherRole: (state, action) => {
      const { id, role } = action.payload;
      const index = state.teachers.findIndex((t) => t._id === id || t.teacherId === id);
      if (index !== -1) {
        state.teachers[index].role = role;
      }
    },
    addSingleLocalTeacher: (state, action) => {
      state.teachers = [action.payload, ...state.teachers];
      state.total = state.teachers.length;
    },
    deleteLocalTeacher: (state, action) => {
      state.teachers = state.teachers.filter((t) => t._id !== action.payload && t.teacherId !== action.payload);
      state.total = state.teachers.length;
    },
  },
  extraReducers: (builder) => {
    // Get teachers
    builder.addCase(getTeachersThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getTeachersThunk.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload?.teachers && action.payload.teachers.length > 0) {
        state.teachers = action.payload.teachers;
        state.total = action.payload.total || action.payload.teachers.length;
      }
    });
    builder.addCase(getTeachersThunk.rejected, (state, action) => {
      state.loading = false;
      // Keep existing teachers on error
    });

    // Create teacher
    builder.addCase(createTeacherThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createTeacherThunk.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload?.teacher) {
        state.teachers.unshift(action.payload.teacher);
        state.total += 1;
      }
    });
    builder.addCase(createTeacherThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Update teacher
    builder.addCase(updateTeacherThunk.pending, (state) => {
      state.error = null;
    });
    builder.addCase(updateTeacherThunk.fulfilled, (state, action) => {
      if (action.payload?.teacher) {
        const updated = action.payload.teacher;
        const index = state.teachers.findIndex((t) => t._id === updated._id);
        if (index !== -1) {
          state.teachers[index] = updated;
        }
      }
    });
    builder.addCase(updateTeacherThunk.rejected, (state, action) => {
      state.error = action.payload;
    });

    // Delete teacher
    builder.addCase(deleteTeacherThunk.fulfilled, (state, action) => {
      const id = action.payload.id;
      state.teachers = state.teachers.filter((t) => t._id !== id);
      state.total = state.teachers.length;
    });

    // Bulk Import
    builder.addCase(bulkImportTeachersThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.importSuccessMsg = null;
    });
    builder.addCase(bulkImportTeachersThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.importSuccessMsg = action.payload.message || "Bulk import successful!";
    });
    builder.addCase(bulkImportTeachersThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const {
  clearTeacherError,
  clearImportSuccessMsg,
  addLocalTeachers,
  updateLocalTeacherRole,
  addSingleLocalTeacher,
  deleteLocalTeacher,
} = teacherSlice.actions;

export default teacherSlice.reducer;
