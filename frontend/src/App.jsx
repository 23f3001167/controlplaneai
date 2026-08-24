import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Overview from './pages/Overview';
import AISystems from './pages/AISystems';
import Policies from './pages/Policies';
import Evaluation from './pages/Evaluation';
import Incidents from './pages/Incidents';
import Interactions from './pages/Interactions';
import AuditLogs from './pages/AuditLogs';

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-darkBg text-gray-200 overflow-hidden font-sans">
        {/* Left Side Navigation bar */}
        <Sidebar />

        {/* Right Side Body content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Action control bar */}
          <Topbar />

          {/* Main scrollable body views */}
          <main className="flex-1 overflow-y-auto p-8 bg-[#0b0f19]">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/ai-systems" element={<AISystems />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/evaluation" element={<Evaluation />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/interactions" element={<Interactions />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
