// App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuthStore } from './Store/auth.store.js';

import Navbar from './components/Navbar.jsx';
import Homepage from './pages/Homepage/Homepage.jsx';
import Signup from './pages/SIgnup/Signuppage.jsx';
import Login from './pages/Login/Loginpage.jsx';

import DashboardHome from './components/Dashboardhome.jsx';
import DashboardPage from './components/Dashboard.jsx';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore();
  console.log(user);
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <div className="min-h-screen">
      {/* <Navbar /> */}
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/verifyotp" element={<VerifyPhone />} /> */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
        </Route>
      </Routes>
      {/* <Toaster /> */}
    </div>
  );
}

export default App;
