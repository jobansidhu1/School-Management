import React, { useEffect } from "react";
import { useAppDispatch } from "./hooks/useAppDispatch";
import { fetchCurrentUser } from "./redux/slices/authSlice";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  return <AppRoutes />;
}

export default App;
