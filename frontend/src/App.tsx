import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Box } from '@radix-ui/themes';
import Login from './pages/Login';
import AdminLogin from './pages/admin/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubjectManager from './pages/SubjectManager';
import StudyConfig from './pages/StudyConfig';
import Performance from './pages/Performance';
import Landing from './pages/Landing';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminSubscriptions from './pages/admin/Subscriptions';
import AdminPerformance from './pages/admin/Performance';

const PrivateRoute = ({ children, requireAdmin = false }: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) => {
  const { session, isAdmin } = useAuth();

  if (!session) {
    return <Navigate to={requireAdmin ? "/admin/login" : "/login"} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

function App() {
  const { session, isAdmin } = useAuth();

  return (
    <ThemeProvider>
      <Router>
        <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-1)' }}>
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                !session ? (
                  <Landing />
                ) : (
                  <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
                )
              }
            />
            <Route
              path="/login"
              element={
                session ? (
                  <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/admin/login"
              element={
                session ? (
                  <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
                ) : (
                  <AdminLogin />
                )
              }
            />
            <Route
              path="/register"
              element={
                session ? (
                  <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
                ) : (
                  <Register />
                )
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <PrivateRoute requireAdmin={true}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <PrivateRoute requireAdmin={true}>
                  <AdminUsers />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/subscriptions"
              element={
                <PrivateRoute requireAdmin={true}>
                  <AdminSubscriptions />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/performance"
              element={
                <PrivateRoute requireAdmin={true}>
                  <AdminPerformance />
                </PrivateRoute>
              }
            />

            {/* User routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/subjects"
              element={
                <PrivateRoute>
                  <SubjectManager />
                </PrivateRoute>
              }
            />
            <Route
              path="/study-config"
              element={
                <PrivateRoute>
                  <StudyConfig />
                </PrivateRoute>
              }
            />
            <Route
              path="/performance"
              element={
                <PrivateRoute>
                  <Performance />
                </PrivateRoute>
              }
            />

            {/* Catch all route - redirect to appropriate dashboard */}
            <Route
              path="*"
              element={
                <Navigate to={session ? (isAdmin ? "/admin" : "/dashboard") : "/"} replace />
              }
            />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}