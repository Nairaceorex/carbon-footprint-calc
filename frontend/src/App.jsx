import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-green-600 text-white p-4">
        <div className="container mx-auto flex justify-between">
          <div className="space-x-4">
            
            {!token ? (
              <>
                <NavLink to="/register" className={({ isActive }) => isActive ? 'font-bold' : ''}>
                  Register
                </NavLink>
                <NavLink to="/login" className={({ isActive }) => isActive ? 'font-bold' : ''}>
                  Login
                </NavLink>
              </>
            ) : (
                <>
                    <NavLink to="/calculator" className={({ isActive }) => isActive ? 'font-bold' : ''}>
              Calculator
            </NavLink>
                <button onClick={handleLogout} className="hover:underline">
                Logout
              </button>
                </>
              
            )}
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}

export default App;