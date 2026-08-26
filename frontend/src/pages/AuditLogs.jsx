import React, { useState, useEffect } from 'react';
import { getAuditLogs, resetDatabase } from '../services/api';

import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { 
  ClipboardList, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  User, 
  FileJson,
  Filter
} from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterEventType, setFilterEventType] = useState('');
  const [searchResource, setSearchResource] = useState('');
  const [expandedLog, setExpandedLog] = useState(null);

  const eventTypes = [
    'AI_SYSTEM_CREATED',
    'AI_SYSTEM_UPDATED',
    'AI_SYSTEM_DELETED',
    'POLICY_CREATED',
    'POLICY_UPDATED',
    'POLICY_DELETED',
    'EVALUATION_COMPLETED',
    'INCIDENT_CREATED',
    'INCIDENT_UPDATED',
    'INCIDENT_DELETED',
    'HUMAN_REVIEW_COMPLETED'
  ];

  const handleResetDatabase = async () => {
    if (window.confirm("Warning: This will delete all database logs, AI systems, and policies. This cannot be undone.")) {
      const confirmInput = window.prompt("Type 'RESET' to confirm:");
      if (confirmInput === 'RESET') {
        try {
          setLoading(true);
          await resetDatabase();
          alert('Database reset completed successfully. Starting with a clean slate!');
          await fetchLogs();
        } catch (err) {
          alert('Failed to reset database: ' + (err.response?.data?.detail || err.message));
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const fetchLogs = async () => {

    try {
      setLoading(true);
      const params = {};
      if (filterEventType) params.event_type = filterEventType;
      if (searchResource.trim()) params.resource = searchResource.trim();
      const data = await getAuditLogs(params);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterEventType, searchResource]);

  const toggleExpand = (id) => {
    setExpandedLog(expandedLog === id ? null : id);
  };

  const getEventBadgeClass = (type) => {
    if (type.startsWith('AI_SYSTEM_')) return 'bg-blue-950/20 text-blue-400 border-blue-900/30';
    if (type.startsWith('POLICY_')) return 'bg-indigo-950/20 text-indigo-400 border-indigo-900/30';
    if (type.startsWith('INCIDENT_') || type.startsWith('HUMAN_')) return 'bg-rose-950/20 text-rose-400 border-rose-900/30';
    return 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-100">Immutable Audit Logs</h2>
          <p className="text-xs text-gray-400 mt-1">Immutable trace records documenting AI configurations, threshold alterations, and override histories.</p>
        </div>
        <button
          onClick={handleResetDatabase}
          className="bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0"
        >
          Reset Database
        </button>
      </div>


      {/* Filter panel */}
      <div className="bg-darkCard border border-darkBorder rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Target Resource UUID..." 
            value={searchResource}
            onChange={(e) => setSearchResource(e.target.value)}
            className="w-full bg-darkBg text-xs text-gray-200 pl-10 pr-4 py-2 border border-darkBorder rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Event Type Filter */}
        <div className="flex items-center gap-2.5">
          <Filter size={14} className="text-gray-400" />
          <select
            value={filterEventType}
            onChange={(e) => setFilterEventType(e.target.value)}
            className="bg-darkBg text-xs text-gray-300 border border-darkBorder rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Event Types</option>
            {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Log list */}
      {loading ? (
        <LoadingState message="Fetching system audit trail..." />
      ) : logs.length === 0 ? (
        <EmptyState title="No Audit Records" description="Try clearing your filters or check system connection." />
      ) : (
        <div className="bg-darkCard border border-darkBorder rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-gray-400 bg-darkBg/20">
                <th className="p-4 font-semibold">Event Type</th>
                <th className="p-4 font-semibold">Actor</th>
                <th className="p-4 font-semibold">Audited Action Summary</th>
                <th className="p-4 font-semibold">Resource Target ID</th>
                <th className="p-4 font-semibold text-center">Timestamp</th>
                <th className="p-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder/40">
              {logs.map((log) => {
                const isExpanded = expandedLog === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-gray-800/10 transition">
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getEventBadgeClass(log.event_type)}`}>
                          {log.event_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-gray-300 font-semibold">
                          <User size={12} className="text-gray-400" />
                          {log.actor}
                        </div>
                      </td>
                      <td className="p-4 text-gray-300 font-medium">{log.action}</td>
                      <td className="p-4 font-mono text-gray-500">{log.resource.substring(0, 18)}...</td>
                      <td className="p-4 text-center text-gray-400 font-mono">
                        {new Date(log.created_at.endsWith('Z') ? log.created_at : log.created_at + 'Z').toLocaleString()}
                      </td>

                      <td className="p-4 text-right">
                        <button 
                          onClick={() => toggleExpand(log.id)}
                          className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-0.5 ml-auto"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Context
                        </button>
                      </td>
                    </tr>

                    {/* Metadata JSON block when expanded */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="6" className="bg-darkBg/40 p-4 border-y border-darkBorder/60">
                          <div className="space-y-1">
                            <div className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1.5 mb-1">
                              <FileJson size={12} /> Audit Context Parameters (metadata)
                            </div>
                            <pre className="text-[10px] font-mono bg-darkBg border border-darkBorder p-3 rounded-lg text-gray-400 overflow-x-auto whitespace-pre">
                              {JSON.stringify(log.metadata || {}, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
