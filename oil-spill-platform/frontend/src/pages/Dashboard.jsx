import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VerificationChecklist from '../components/VerificationChecklist';
import api from '../api/client';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checklistData, setChecklistData] = useState({
    sar: 'confirmed',
    optical: 'confirmed',
    false_positive: 'confirmed',
    vessel: 'confirmed'
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleCheck = (id) => {
    setChecklistData(prev => ({
      ...prev,
      [id]: prev[id] === 'confirmed' ? 'pending' : 'confirmed'
    }));
  };

  if (!user) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛰️</span>
          <h1 className="text-white font-bold text-xl">Oil Spill Intelligence</h1>
          <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">v1.0</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {user.avatar_url && (
              <img 
                src={user.avatar_url} 
                alt={user.name} 
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-white text-sm">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map Area (placeholder) */}
        <div className="flex-1 bg-gray-900 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-gray-400 text-lg">Interactive Map Coming Soon</p>
              <p className="text-gray-500 text-sm">Mapbox GL JS Integration</p>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto">
          <VerificationChecklist data={checklistData} />
          
          <button
            onClick={() => {
              ['sar', 'optical', 'false_positive', 'vessel'].forEach(id => {
                toggleCheck(id);
              });
            }}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Simulate Detection
          </button>

          <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h4 className="text-gray-400 text-sm font-medium mb-2">📊 System Status</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">API Status</span>
                <span className="text-green-400">● Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Database</span>
                <span className="text-green-400">● Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Satellite</span>
                <span className="text-yellow-400">● Monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
