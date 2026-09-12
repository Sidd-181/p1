import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./components/auth/AuthPage.jsx";
import { GuestRoute, ProtectedRoute } from "./components/auth/ProtectedRoute.jsx";
import DashboardPage from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <AuthPage mode="login" />
          </GuestRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <AuthPage mode="signup" />
          </GuestRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
