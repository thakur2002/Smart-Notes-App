import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
       {/* <Route path="/" element={<Dashboard />}/> */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;