import React, { useState, useEffect } from 'react';
import { 
  getIncidents, 
  getIncidentDetails, 
  createIntervention, 
  updateIncident, 
  getAISystems 
} from '../services/api';
import Modal from '../components/ui/Modal';
import RiskBadge from '../components/ui/RiskBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Eye, 
  UserCheck, 
  MessageSquare,
  History
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Incidents() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id');

  const [incidents, setIncidents] = useState([]);
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterSystem, setFilterSystem] = useState('');

  // Modals / Details
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Intervention form states
  const [action, setAction] = useState('APPROVE');
  const [reason, setReason] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [submittingIntervention, setSubmittingIntervention] = useState(false);
  const [interventionError, setInterventionError] = useState('');

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const [incData, sysData] = await Promise.all([
        getIncidents(),
        getAISystems()
      ]);
      setIncidents(incData);
      setSystems(sysData);

      // If URL has direct id, open details
      if (initialId) {
        handleViewDetails(initialId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [initialId]);

  const handleViewDetails = async (id) => {
    try {
      setLoadingDetails(true);
      setIsDetailOpen(true);
      const data = await getIncidentDetails(id);
      setSelectedIncident(data);
      // Reset form
      setAction('APPROVE');
      setReason('');
      setReviewer('');
      setInterventionError('');
    } catch (err) {
      console.error('Failed to load incident details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleInterventionSubmit = async (e) => {
    e.preventDefault();
    if (!reviewer.trim()) {
      setInterventionError('Reviewer name/ID is required.');
      return;
    }
    if (!reason.trim()) {
      setInterventionError('Justification reason is required.');
      return;
    }

    try {
      setSubmittingIntervention(true);
      setInterventionError('');
      
      // Post intervention
      await createIntervention(selectedIncident.id, {
        action,
        reason,
        reviewer
      });

      // Reload detail and list
      const updatedDetails = await getIncidentDetails(selectedIncident.id);
      setSelectedIncident(updatedDetails);
      
      const updatedList = await getIncidents();
      setIncidents(updatedList);

      setReason('');
      setReviewer('');
    } catch (err) {
      setInterventionError(err.response?.data?.detail || 'Failed to submit human review.');
    } finally {
      setSubmittingIntervention(false);
    }
  };

  // Status transitions without full intervention if needed (e.g. In Review)
  const handleStartReview = async () => {
    try {
      await updateIncident(selectedIncident.id, { status: 'IN_REVIEW' });
      const updatedDetails = await getIncidentDetails(selectedIncident.id);
      setSelectedIncident(updatedDetails);
      const updatedList = await getIncidents();
      setIncidents(updatedList);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesStatus = filterStatus === '' || inc.status === filterStatus;
    const matchesSeverity = filterSeverity === '' || inc.severity === filterSeverity;
    const matchesSystem = filterSystem === '' || inc.ai_system_name === filterSystem;
    return matchesStatus && matchesSeverity && matchesSystem;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-100">Incident Response Desk</h2>
        <p className="text-xs text-gray-400 mt-1">Review flagged AI outputs, investigate assessment logs, and perform human-in-the-loop overrides.</p>
      </div>

      {/* Filter panel */}
      <div className="bg-darkCard border border-darkBorder rounded-xl p-4 flex flex-wrap items-center gap-3.5">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold mr-2">
          <Filter size={14} /> Filter Incidents:
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-darkBg text-xs text-gray-300 border border-darkBorder rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_REVIEW">IN REVIEW</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="DISMISSED">DISMISSED</option>
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-darkBg text-xs text-gray-300 border border-darkBorder rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Severities</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>

        <select
          value={filterSystem}
          onChange={(e) => setFilterSystem(e.target.value)}
          className="bg-darkBg text-xs text-gray-300 border border-darkBorder rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Systems</option>
          {systems.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      {/* Incidents Table */}
      {loading ? (
        <LoadingState message="Fetching active incidents..." />
      ) : filteredIncidents.length === 0 ? (
        <EmptyState title="No Incidents Logged" description="No serious governance violations have triggered ticket creation." />
      ) : (
        <div className="bg-darkCard border border-darkBorder rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-gray-400 bg-darkBg/20">
                <th className="p-4 font-semibold">Incident Details</th>
                <th className="p-4 font-semibold">AI System</th>
                <th className="p-4 font-semibold">Violation Type</th>
                <th className="p-4 font-semibold text-center">Severity</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-center">Registered</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder/40">
              {filteredIncidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-gray-800/10 transition">
                  <td className="p-4">
                    <div className="font-semibold text-gray-200 text-sm flex items-center gap-2">
                      <ShieldAlert size={14} className={
                        inc.status === 'RESOLVED' ? 'text-emerald-500' :
                        inc.severity === 'CRITICAL' ? 'text-rose-500 animate-pulse' : 'text-orange-500'
                      } />
                      {inc.title}
                    </div>
                    <div className="text-gray-400 mt-1 max-w-sm truncate">{inc.description}</div>
                  </td>
                  <td className="p-4 text-gray-300 font-semibold">{inc.ai_system_name || 'Unknown System'}</td>
                  <td className="p-4">
                    <span className="bg-darkBg border border-darkBorder/55 px-2 py-0.5 rounded text-[10px] text-gray-400 font-mono font-bold">
                      {inc.category}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      inc.severity === 'CRITICAL' ? 'bg-rose-950/40 text-rose-400 border-rose-800/40' :
                      inc.severity === 'HIGH' ? 'bg-orange-950/40 text-orange-400 border-orange-800/40' :
                      inc.severity === 'MEDIUM' ? 'bg-amber-950/40 text-amber-400 border-amber-800/40' :
                      'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                    }`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      inc.status === 'OPEN' ? 'bg-rose-950/20 text-rose-400 border-rose-900/30' :
                      inc.status === 'IN_REVIEW' ? 'bg-blue-950/20 text-blue-400 border-blue-900/30' :
                      inc.status === 'RESOLVED' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' :
                      'bg-gray-800 text-gray-400 border-gray-700'
                    }`}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="p-4 text-center text-gray-400 font-mono">
                    {new Date(inc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleViewDetails(inc.id)}
                      className="bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ml-auto transition"
                    >
                      <Eye size={12} /> Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Incident Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Investigate Incident Ticket: ${selectedIncident?.title || ''}`}>
        {loadingDetails ? (
          <LoadingState message="Resolving diagnostic assessment records..." />
        ) : selectedIncident ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-darkBg/60 border border-darkBorder rounded-xl">
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Risk Classification</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-bold text-gray-200">{selectedIncident.overall_risk_score ?? 'N/A'}</span>
                  {selectedIncident.overall_risk_score !== undefined && (
                    <RiskBadge level={selectedIncident.overall_risk_score >= 90 ? 'CRITICAL' : selectedIncident.overall_risk_score >= 70 ? 'HIGH' : selectedIncident.overall_risk_score >= 40 ? 'MEDIUM' : 'LOW'} />
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Target system</span>
                <span className="text-sm font-bold text-gray-200 mt-1 block">{selectedIncident.ai_system_name}</span>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Decision action</span>
                <span className="mt-1 block">
                  <span className="bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs px-2.5 py-1 rounded font-bold">
                    {selectedIncident.decision_action || 'BLOCKED / REVIEW'}
                  </span>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Ticket status</span>
                <span className="mt-1 block">
                  <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${
                    selectedIncident.status === 'OPEN' ? 'bg-rose-950/20 text-rose-400 border-rose-900/30' :
                    selectedIncident.status === 'IN_REVIEW' ? 'bg-blue-950/20 text-blue-400 border-blue-900/30' :
                    'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'
                  }`}>
                    {selectedIncident.status}
                  </span>
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Violation Description</span>
              <p className="p-3 bg-darkBg border border-darkBorder rounded-lg text-gray-300 leading-relaxed text-xs">
                {selectedIncident.description}
              </p>
            </div>

            {/* Prompt & Response */}
            {selectedIncident.interaction && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Prompt Received</span>
                  <div className="p-3 bg-darkBg border border-darkBorder rounded-lg font-mono text-[11px] text-gray-300 break-all h-28 overflow-y-auto">
                    {selectedIncident.interaction.user_input}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Model Response (Sanitized)</span>
                  <div className="p-3 bg-darkBg border border-darkBorder rounded-lg font-mono text-[11px] text-gray-300 break-all h-28 overflow-y-auto">
                    {selectedIncident.interaction.response}
                  </div>
                </div>
              </div>
            )}

            {/* Intervention Log History */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase block flex items-center gap-1">
                <History size={12} /> Human Review Audit Log
              </span>
              {selectedIncident.interventions.length === 0 ? (
                <div className="p-4 bg-darkBg/20 border border-darkBorder border-dashed rounded-lg text-center text-gray-500 text-xs">
                  No interventions recorded for this ticket yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedIncident.interventions.map((item) => (
                    <div key={item.id} className="p-3 bg-darkBg border border-darkBorder/40 rounded-lg flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 mt-0.5">
                        <UserCheck size={14} />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-200 text-xs">{item.reviewer}</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium">Outcome Action: <span className="text-emerald-400 font-bold">{item.action}</span></p>
                        <p className="text-[11px] text-gray-500 italic mt-1">"{item.reason}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action form */}
            {(selectedIncident.status === 'OPEN' || selectedIncident.status === 'IN_REVIEW') && (
              <form onSubmit={handleInterventionSubmit} className="p-5 border border-darkBorder bg-darkBg/30 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-darkBorder pb-2">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                    <UserCheck size={14} className="text-blue-500" /> Executive Compliance Action
                  </h4>
                  {selectedIncident.status === 'OPEN' && (
                    <button 
                      type="button" 
                      onClick={handleStartReview}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold border border-blue-900/40 rounded px-2 py-0.5 bg-blue-950/20"
                    >
                      Start Investigation (Mark IN REVIEW)
                    </button>
                  )}
                </div>

                {interventionError && <div className="p-3 bg-rose-950/30 border border-rose-800/40 text-rose-400 text-xs rounded-lg">{interventionError}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium block">Intervention Action *</label>
                    <select
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      className="w-full bg-darkBg text-xs text-gray-200 border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                    >
                      <option value="APPROVE">APPROVE (Close violation, confirm action)</option>
                      <option value="REJECT">REJECT (Dismiss violation incident ticket)</option>
                      <option value="OVERRIDE">OVERRIDE (Approve with modifications / exceptions)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium block">Reviewer Identity Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chief Compliance Officer"
                      value={reviewer}
                      onChange={(e) => setReviewer(e.target.value)}
                      className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-medium block">Justification Reason *</label>
                  <textarea
                    required
                    rows="2"
                    placeholder="Provide professional auditing justification for this override/decision..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="submit" 
                    disabled={submittingIntervention}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition ml-auto"
                  >
                    {submittingIntervention ? 'Submitting Verdict...' : 'Submit Compliance Audit Verdict'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
