import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Box } from '@radix-ui/themes';
import Login from './pages/Login';
import AdminLogin from './pages/admin/Login';
import Register from './pages/Register';
import Inicio from './pages/Inicio';
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
  const { session, isAdmin, loading } = useAuth();

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to={requireAdmin ? "/admin/login" : "/login"} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/inicio" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { session, isAdmin, loading } = useAuth();

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

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
                  <Navigate to={isAdmin ? "/admin" : "/inicio"} replace />
                )
              }
            />
            <Route
              path="/login"
              element={
                session ? (
                  <Navigate to={isAdmin ? "/admin" : "/inicio"} replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/admin/login"
              element={
                session ? (
                  <Navigate to={isAdmin ? "/admin" : "/inicio"} replace />
                ) : (
                  <AdminLogin />
                )
              }
            />
            <Route
              path="/register"
              element={
                session ? (
                  <Navigate to={isAdmin ? "/admin" : "/inicio"} replace />
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
              path="/inicio"
              element={
                <PrivateRoute>
                  <Inicio />
                </PrivateRoute>
              }
            />
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
                <Navigate to={session ? (isAdmin ? "/admin" : "/inicio") : "/"} replace />
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