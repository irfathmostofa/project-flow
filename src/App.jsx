import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Profile from "./pages/Profile";
import Layout from "./components/layout/Layout";
import { ToastProvider } from "./context/ToastContext";
import ToastContainer from "./components/ui/Toast";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return !user ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <ToastContainer />
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Private Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <PrivateRoute>
                  <Layout>
                    <Projects />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/projects/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <ProjectDetail />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
