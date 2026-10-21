import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import teacherReducer from "./slices/teacherSlice";
import studentReducer from "./slices/studentSlice";
import academicReducer from "./slices/marksSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    teachers: teacherReducer,
    students: studentReducer,
    academic: academicReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
