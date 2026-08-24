import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import StatCard from '../components/ui/StatCard';
import RiskBadge from '../components/ui/RiskBadge';
import DecisionBadge from '../components/ui/DecisionBadge';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import RiskChart from '../components/charts/RiskChart';
import DecisionChart from '../components/charts/DecisionChart';
import IncidentChart from '../components/charts/IncidentChart';
import { Link } from 'react-router-dom';
import { 
  Cpu, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  FileWarning, 
  Clock, 
  FolderLock, 
  Maximize2 
} from 'lucide-react';

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the ControlPlane API engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!stats) return <ErrorState message="No dashboard analytics returned." onRetry={fetchStats} />;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-100">Governance Control Room</h2>
          <p className="text-xs text-gray-400 mt-1">Real-time status monitor of registered AI systems and policies.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard 
          title="Total AI Systems" 
          value={`${stats.active_systems} / ${stats.total_systems} Active`}
          icon={Cpu} 
          color="blue"
        />
        <StatCard 
          title="Total Evaluations" 
          value={stats.total_evaluations} 
          icon={Activity} 
          color="indigo"
        />
        <StatCard 
          title="Average Risk Score" 
          value={`${stats.average_risk} / 100`} 
          icon={FileWarning} 
          color="amber"
        />
        <StatCard 
          title="Open Incidents" 
          value={stats.open_incidents} 
          icon={ShieldAlert} 
          color="rose"
        />
      </div>

      {/* Secondary Metrics Mini Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-darkCard/50 border border-darkBorder rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-semibold">Blocked Responses</span>
          <span className="text-lg font-bold text-rose-400 bg-rose-950/20 border border-rose-900/30 px-2.5 py-0.5 rounded-lg">
            {stats.blocked_count}
          </span>
        </div>
        <div className="bg-darkCard/50 border border-darkBorder rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-semibold">Human Reviews Pending</span>
          <span className="text-lg font-bold text-blue-400 bg-blue-950/20 border border-blue-900/30 px-2.5 py-0.5 rounded-lg">
            {stats.pending_reviews}
          </span>
        </div>
        <div className="bg-darkCard/50 border border-darkBorder rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-semibold">High / Critical Detections</span>
          <span className="text-lg font-bold text-orange-400 bg-orange-950/20 border border-orange-900/30 px-2.5 py-0.5 rounded-lg">
            {stats.high_critical_count}
          </span>
        </div>
      </div>

      {/* Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RiskChart data={stats.risk_trend} />
        </div>
        <div>
          <DecisionChart data={stats.decision_distribution} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <IncidentChart data={stats.incidents_by_severity} />
        </div>
        <div className="lg:col-span-2 bg-darkCard border border-darkBorder rounded-xl p-5 flex flex-col h-80">
          <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-4">Risk Category Average Scores</h4>
          <div className="flex-grow flex items-center justify-around">
            {stats.risk_category_distribution.map((cat) => (
              <div key={cat.name} className="text-center bg-darkBg border border-darkBorder/40 rounded-xl p-4 w-28 shadow-sm">
                <span className="text-xs text-gray-400 font-medium block mb-2">{cat.name}</span>
                <span className={`text-xl font-bold ${
                  cat.value >= 70 ? 'text-rose-400' : cat.value >= 40 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {cat.value}
                </span>
                <div className="w-full bg-gray-800 rounded-full h-1 mt-3">
                  <div 
                    className={`h-1 rounded-full ${
                      cat.value >= 70 ? 'bg-rose-500' : cat.value >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} 
                    style={{ width: `${Math.min(100, cat.value)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Evaluations */}
        <div className="bg-darkCard border border-darkBorder rounded-xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Recent Evaluations</h3>
            <Link to="/interactions" className="text-xs text-blue-500 hover:text-blue-400 font-semibold flex items-center gap-1">
              View History <Maximize2 size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-darkBorder/60 text-gray-400">
                  <th className="pb-3 font-semibold">AI System</th>
                  <th className="pb-3 font-semibold text-center">Risk Score</th>
                  <th className="pb-3 font-semibold text-center">Risk Level</th>
                  <th className="pb-3 font-semibold text-center">Decision</th>
                  <th className="pb-3 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-darkBorder/40">
                {stats.recent_evaluations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500">No evaluations logged yet.</td>
                  </tr>
                ) : (
                  stats.recent_evaluations.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-800/20">
                      <td className="py-3 font-semibold text-gray-300">
                        <Link to={`/interactions?id=${item.id}`} className="hover:text-blue-400 transition">
                          {item.ai_system}
                        </Link>
                      </td>
                      <td className="py-3 text-center font-bold text-gray-100">{item.risk}</td>
                      <td className="py-3 text-center">
                        <RiskBadge level={item.level} />
                      </td>
                      <td className="py-3 text-center">
                        <DecisionBadge action={item.decision} />
                      </td>
                      <td className="py-3 text-right text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-darkCard border border-darkBorder rounded-xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Recent Incidents</h3>
            <Link to="/incidents" className="text-xs text-blue-500 hover:text-blue-400 font-semibold flex items-center gap-1">
              Manage Tickets <Maximize2 size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-darkBorder/60 text-gray-400">
                  <th className="pb-3 font-semibold">Incident Details</th>
                  <th className="pb-3 font-semibold">AI System</th>
                  <th className="pb-3 font-semibold text-center">Severity</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-darkBorder/40">
                {stats.recent_incidents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500">No open incidents recorded.</td>
                  </tr>
                ) : (
                  stats.recent_incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-gray-800/20">
                      <td className="py-3 font-semibold text-gray-300 max-w-[180px] truncate">
                        <Link to={`/incidents?id=${inc.id}`} className="hover:text-blue-400 transition block">
                          {inc.title}
                        </Link>
                      </td>
                      <td className="py-3 text-gray-400">{inc.ai_system}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          inc.severity === 'CRITICAL' ? 'bg-rose-950/40 text-rose-400 border-rose-800/40' :
                          inc.severity === 'HIGH' ? 'bg-orange-950/40 text-orange-400 border-orange-800/40' :
                          'bg-amber-950/40 text-amber-400 border-amber-800/40'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          inc.status === 'OPEN' ? 'bg-rose-950/20 text-rose-400 border-rose-900/30' :
                          inc.status === 'IN_REVIEW' ? 'bg-blue-950/20 text-blue-400 border-blue-900/30' :
                          'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'
                        }`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-gray-500">
                        {new Date(inc.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
