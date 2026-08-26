import React, { useState, useEffect } from 'react';
import { getInteractions, getInteractionDetails } from '../services/api';
import Modal from '../components/ui/Modal';
import RiskBadge from '../components/ui/RiskBadge';
import DecisionBadge from '../components/ui/DecisionBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { 
  History, 
  Search, 
  Cpu, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  AlertOctagon, 
  UserX, 
  FileCheck,
  CheckCircle,
  FileCode,
  Terminal
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Interactions() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id');

  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Details
  const [selectedInter, setSelectedInter] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [expandedTraceStep, setExpandedTraceStep] = useState(null);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      const data = await getInteractions();
      setInteractions(data);

      if (initialId) {
        handleViewDetails(initialId);
      }
    } catch (err) {
      console.error('Failed to load interactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, [initialId]);

  const handleViewDetails = async (id) => {
    try {
      setLoadingDetails(true);
      setIsDetailOpen(true);
      setExpandedTraceStep(null);
      const data = await getInteractionDetails(id);
      setSelectedInter(data);
    } catch (err) {
      console.error('Failed to load interaction details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filtered = interactions.filter(i => {
    return i.ai_system.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.user_input.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-100">Interaction Histories</h2>
        <p className="text-xs text-gray-400 mt-1">Audit historic prompts, response payloads, decision reasoning, and agent execution traces.</p>
      </div>

      {/* Search panel */}
      <div className="bg-darkCard border border-darkBorder rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search histories by ID, system, or prompt content..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-darkBg text-xs text-gray-200 pl-10 pr-4 py-2 border border-darkBorder rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <LoadingState message="Fetching historic interaction logs..." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No Interactions Recorded" description="Perform an evaluation in the sandbox to generate your first audit record." />
      ) : (
        <div className="bg-darkCard border border-darkBorder rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-gray-400 bg-darkBg/20">
                <th className="p-4 font-semibold">Interaction ID</th>
                <th className="p-4 font-semibold">AI System</th>
                <th className="p-4 font-semibold">Snippet (Prompt)</th>
                <th className="p-4 font-semibold text-center">Risk Score</th>
                <th className="p-4 font-semibold text-center">Decision</th>
                <th className="p-4 font-semibold text-center">Confidence</th>
                <th className="p-4 font-semibold text-center">Timestamp</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder/40">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-800/10 transition">
                  <td className="p-4 font-mono font-bold text-gray-400 select-all">{item.id.substring(0, 8)}...</td>
                  <td className="p-4 font-semibold text-gray-200">
                    <div className="flex items-center gap-1.5">
                      <Cpu size={12} className="text-blue-500" />
                      {item.ai_system}
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 max-w-xs truncate italic">"{item.user_input}"</td>
                  <td className="p-4 text-center font-bold text-gray-100">{item.risk}</td>
                  <td className="p-4 text-center">
                    <DecisionBadge action={item.decision} />
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-gray-300 font-mono font-bold">{Math.round(item.confidence * 100)}%</span>
                  </td>
                  <td className="p-4 text-center text-gray-500 font-mono">
                    {new Date(item.created_at.endsWith('Z') ? item.created_at : item.created_at + 'Z').toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>

                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleViewDetails(item.id)}
                      className="bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 ml-auto transition"
                    >
                      <Eye size={12} /> Explain
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Interaction Explainability Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Governance Explainability Report: Interaction #${selectedInter?.id.substring(0, 8)}`}>
        {loadingDetails ? (
          <LoadingState message="Compiling explainability metrics and agent trace timeline..." />
        ) : selectedInter ? (
          <div className="space-y-6">
            
            {/* KPI top row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-darkBg/60 border border-darkBorder rounded-xl">
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">System</span>
                <span className="text-xs font-bold text-gray-200 mt-0.5 block">{selectedInter.ai_system}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">Decision Action</span>
                <span className="mt-0.5 block">
                  <DecisionBadge action={selectedInter.risk_assessment.decision_action} />
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">Overall Risk</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-bold text-gray-200">{selectedInter.risk_assessment.overall_risk_score}</span>
                  <RiskBadge level={selectedInter.risk_assessment.overall_risk_level} />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">Trace Verification</span>
                <span className="text-xs font-bold text-emerald-400 mt-0.5 block">9 / 9 Steps Logged</span>
              </div>
            </div>

            {/* Prompt & Context & Response */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">User Prompt</span>
                  <div className="p-3 bg-darkBg border border-darkBorder rounded-lg font-mono text-[11px] text-gray-300 break-all max-h-32 overflow-y-auto">
                    {selectedInter.user_input}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Reference Context</span>
                  <div className="p-3 bg-darkBg border border-darkBorder rounded-lg font-mono text-[11px] text-gray-300 break-all max-h-32 overflow-y-auto">
                    {selectedInter.context || <span className="text-gray-500 italic">No trusted context supplied.</span>}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">AI Model Output (Masked)</span>
                <div className="p-3 bg-darkBg border border-darkBorder rounded-lg font-mono text-[11px] text-gray-300 break-all max-h-32 overflow-y-auto">
                  {selectedInter.response}
                </div>
              </div>
            </div>

            {/* Decision justification */}
            <div className="p-3.5 bg-blue-950/15 border border-blue-900/40 rounded-xl space-y-1">
              <span className="text-[10px] text-blue-400 font-bold uppercase block">Decision Justification</span>
              <p className="text-xs text-gray-300 leading-relaxed">
                {selectedInter.risk_assessment.decision_reason}
              </p>
            </div>

            {/* Detailed Detector Breakdown */}
            <div className="space-y-3">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Detector Scoring breakdown</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Privacy */}
                <div className="p-3 bg-darkBg/60 border border-darkBorder rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-blue-400" />
                    <div>
                      <span className="text-xs text-gray-300 font-semibold block">Privacy Risk</span>
                      <span className="text-[10px] text-gray-500">PII Leaks</span>
                    </div>
                  </div>
                  <span className={`text-sm font-mono font-bold ${selectedInter.risk_assessment.detectors.privacy.score >= 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedInter.risk_assessment.detectors.privacy.score}
                  </span>
                </div>

                {/* Safety */}
                <div className="p-3 bg-darkBg/60 border border-darkBorder rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertOctagon size={14} className="text-red-400" />
                    <div>
                      <span className="text-xs text-gray-300 font-semibold block">Safety Threat</span>
                      <span className="text-[10px] text-gray-500">Malware / Abuse</span>
                    </div>
                  </div>
                  <span className={`text-sm font-mono font-bold ${selectedInter.risk_assessment.detectors.safety.score >= 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedInter.risk_assessment.detectors.safety.score}
                  </span>
                </div>

                {/* Bias */}
                <div className="p-3 bg-darkBg/60 border border-darkBorder rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserX size={14} className="text-amber-400" />
                    <div>
                      <span className="text-xs text-gray-300 font-semibold block">Output Bias</span>
                      <span className="text-[10px] text-gray-500">Stereotyping</span>
                    </div>
                  </div>
                  <span className={`text-sm font-mono font-bold ${selectedInter.risk_assessment.detectors.bias.score >= 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedInter.risk_assessment.detectors.bias.score}
                  </span>
                </div>

                {/* Hallucination */}
                <div className="p-3 bg-darkBg/60 border border-darkBorder rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck size={14} className="text-emerald-400" />
                    <div>
                      <span className="text-xs text-gray-300 font-semibold block">Hallucination</span>
                      <span className="text-[10px] text-gray-500">Context overlap</span>
                    </div>
                  </div>
                  <span className={`text-sm font-mono font-bold ${selectedInter.risk_assessment.detectors.hallucination.score >= 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedInter.risk_assessment.detectors.hallucination.score}
                  </span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Agent Trace Timeline */}
            <div className="space-y-3">
              <span className="text-[10px] text-gray-400 font-bold uppercase block flex items-center gap-1">
                <Terminal size={12} /> Execution Agent Trace Timeline
              </span>
              <div className="relative border-l border-darkBorder pl-4 ml-2.5 space-y-4">
                {selectedInter.agent_traces.map((trace) => {
                  const isExpanded = expandedTraceStep === trace.step_number;
                  return (
                    <div key={trace.step_number} className="relative group">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 group-hover:scale-125 border border-darkBg transition-all" />
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold text-gray-200">
                            {trace.step_number}. {trace.component}
                          </h5>
                          <button
                            onClick={() => setExpandedTraceStep(isExpanded ? null : trace.step_number)}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5"
                          >
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Inspect
                          </button>
                        </div>
                        <p className="text-[10.5px] text-gray-400">{trace.action}</p>

                        {/* JSON Data toggle section */}
                        {isExpanded && (
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-darkBg border border-darkBorder rounded-lg text-[10px] font-mono leading-relaxed text-gray-400 animate-in slide-in-from-top-1 duration-150">
                            <div>
                              <span className="text-gray-500 block mb-1 font-semibold uppercase">Step Inputs</span>
                              <pre className="overflow-x-auto max-h-24 whitespace-pre-wrap">{JSON.stringify(trace.input_data, null, 2)}</pre>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-1 font-semibold uppercase">Step Outputs</span>
                              <pre className="overflow-x-auto max-h-24 whitespace-pre-wrap">{JSON.stringify(trace.output_data, null, 2)}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
