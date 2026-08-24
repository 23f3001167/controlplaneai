import React, { useState, useEffect } from 'react';
import { getAISystems, evaluateResponse, generateSystemResponse } from '../services/api';
import RiskBadge from '../components/ui/RiskBadge';
import DecisionBadge from '../components/ui/DecisionBadge';
import LoadingState from '../components/ui/LoadingState';
import { 
  Play, 
  Shield, 
  UserX, 
  AlertOctagon, 
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function Evaluation() {
  const [systems, setSystems] = useState([]);
  const [loadingSystems, setLoadingSystems] = useState(true);

  // Form input
  const [selectedSystem, setSelectedSystem] = useState('');
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [context, setContext] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Results
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const data = await getAISystems();
        const active = data.filter(s => s.is_active);
        setSystems(active);
        if (active.length > 0) {
          setSelectedSystem(active[0].id);
        }
      } catch (err) {
        console.error('Failed to load systems:', err);
      } finally {
        setLoadingSystems(false);
      }
    };
    fetchSystems();
  }, []);

  const handleSimulateGeneration = async () => {
    if (!selectedSystem) {
      setError('Please select an AI System first.');
      return;
    }
    if (!userInput.trim()) {
      setError('Please enter a User Input / Prompt first so the simulated model knows what topic to generate.');
      return;
    }

    try {
      setGenerating(true);
      setError('');
      const data = await generateSystemResponse(selectedSystem, userInput);
      setAiResponse(data.generated_response);
      setContext(data.context || '');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to simulate response generation.');
    } finally {
      setGenerating(false);
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!selectedSystem) {
      setError('Please select a registered AI System.');
      return;
    }
    if (!userInput.trim()) {
      setError('User input prompt is required.');
      return;
    }
    if (!aiResponse.trim()) {
      setError('AI generated response is required.');
      return;
    }

    try {
      setEvaluating(true);
      const data = await evaluateResponse({
        ai_system: selectedSystem,
        user_input: userInput,
        response: aiResponse,
        context: context.trim() || null
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Evaluation failed. Make sure the backend is active.');
    } finally {
      setEvaluating(false);
    }
  };

  const getConfidenceColor = (lvl) => {
    if (lvl === 'HIGH') return 'text-emerald-400';
    if (lvl === 'MEDIUM') return 'text-amber-400';
    return 'text-rose-400';
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-100">AI Evaluation Sandbox</h2>
        <p className="text-xs text-gray-400 mt-1">Interactively submit prompts and responses to trigger governance policies and verify compliance outcomes.</p>
      </div>

      {loadingSystems ? (
        <LoadingState message="Connecting to system registry..." />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Input Panel */}
          <div className="xl:col-span-2 bg-darkCard border border-darkBorder rounded-xl p-5 shadow-xl">
            <h3 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-4 flex items-center gap-1.5">
              <Play size={14} className="text-blue-500" /> Evaluation Simulator
            </h3>
            
            <form onSubmit={handleEvaluate} className="space-y-4">
              {error && <div className="p-3 bg-rose-950/30 border border-rose-800/40 text-rose-400 text-xs rounded-lg">{error}</div>}

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium block">Select AI System *</label>
                <select
                  value={selectedSystem}
                  onChange={(e) => setSelectedSystem(e.target.value)}
                  className="w-full bg-darkBg text-xs text-gray-200 border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                >
                  {systems.length === 0 ? (
                    <option value="">No active systems available</option>
                  ) : (
                    systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium block">User Input / Prompt *</label>
                <textarea
                  required
                  rows="3"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Enter the prompt submitted by the user..."
                  className="w-full bg-darkBg text-xs text-gray-200 border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400 font-medium block">AI Generated Response *</label>
                  <button
                    type="button"
                    onClick={handleSimulateGeneration}
                    disabled={generating}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : '✨ Generate Response (Simulated AI)'}
                  </button>
                </div>
                <textarea
                  required
                  rows="5"
                  value={aiResponse}
                  onChange={(e) => setAiResponse(e.target.value)}
                  placeholder="Enter response or click Generate above to simulate AI agent response..."
                  className="w-full bg-darkBg text-xs text-gray-200 border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>


              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400 font-medium block">Trusted Context (Optional)</label>
                  <span className="text-[10px] text-gray-500">Required for Hallucination verification</span>
                </div>
                <textarea
                  rows="3"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Enter reference ground-truth document details here..."
                  className="w-full bg-darkBg text-xs text-gray-200 border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={evaluating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition mt-2"
              >
                {evaluating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Evaluating Output...
                  </>
                ) : (
                  <>
                    <Play size={14} /> Run Governance Evaluation
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Panel */}
          <div className="xl:col-span-3 space-y-6">
            {!result && !evaluating && (
              <div className="h-full bg-darkCard/25 border border-dashed border-darkBorder rounded-xl flex flex-col items-center justify-center p-12 text-center">
                <Shield size={36} className="text-gray-600 mb-3" />
                <h4 className="text-gray-300 font-semibold text-sm">Sandbox Awaiting Inputs</h4>
                <p className="text-gray-500 text-xs mt-1 max-w-sm">Fill out the prompt details on the left, then click run to trace risk levels and compliance decisions.</p>
              </div>
            )}

            {evaluating && (
              <div className="h-full bg-darkCard/20 border border-darkBorder rounded-xl flex items-center justify-center p-12">
                <LoadingState message="Processing detectors... Scanning for PII, threats, bias, and context alignment." />
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Decision Block Overview */}
                <div className="bg-darkCard border border-darkBorder rounded-xl p-5 shadow-xl space-y-4">
                  <h3 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Evaluation Verdict</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-darkBg/60 border border-darkBorder/40 rounded-xl p-3.5">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Decision Action</span>
                      <DecisionBadge action={result.evaluation.decision.action} />
                    </div>

                    <div className="bg-darkBg/60 border border-darkBorder/40 rounded-xl p-3.5">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Overall Risk Score</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-100">{result.evaluation.risk.overall}</span>
                        <RiskBadge level={result.evaluation.risk.level} />
                      </div>
                    </div>

                    <div className="bg-darkBg/60 border border-darkBorder/40 rounded-xl p-3.5">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Confidence Score</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-100">{result.evaluation.confidence.confidence}</span>
                        <span className={`text-xs font-bold ${getConfidenceColor(result.evaluation.confidence.level)}`}>
                          {result.evaluation.confidence.level}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-darkBg/30 border border-darkBorder rounded-lg text-xs text-gray-300 leading-relaxed">
                    <span className="font-semibold text-gray-400 block mb-0.5">Decision Justification:</span>
                    {result.evaluation.decision.reason}
                  </div>
                </div>

                {/* Detector Breakdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Privacy Detector */}
                  <div className="bg-darkCard border border-darkBorder rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1.5">
                          <Lock size={13} className="text-blue-400" /> Privacy Scan
                        </h4>
                        <span className={`text-sm font-bold ${result.evaluation.detectors.privacy.score >= 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {result.evaluation.detectors.privacy.score} / 100
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">{result.evaluation.detectors.privacy.explanation}</p>
                      
                      {result.evaluation.detectors.privacy.findings?.response_findings?.count > 0 ? (
                        <div className="mt-3 space-y-1.5">
                          <div className="text-[10px] text-rose-400 font-semibold uppercase">Violations Found:</div>
                          {result.evaluation.detectors.privacy.findings.response_findings.detected.map((find, idx) => (
                            <span key={idx} className="inline-block bg-rose-950/20 text-rose-400 border border-rose-900/30 text-[10px] px-2 py-0.5 rounded font-mono mr-1.5">
                              {find.type}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle size={10} /> No PII detected.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Safety Detector */}
                  <div className="bg-darkCard border border-darkBorder rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1.5">
                          <AlertOctagon size={13} className="text-red-400" /> Safety Screen
                        </h4>
                        <span className={`text-sm font-bold ${result.evaluation.detectors.safety.score >= 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {result.evaluation.detectors.safety.score} / 100
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">{result.evaluation.detectors.safety.explanation}</p>

                      {result.evaluation.detectors.safety.findings?.response_findings?.detected ? (
                        <div className="mt-3 space-y-1">
                          <div className="text-[10px] text-rose-400 font-semibold uppercase">Safety Flags:</div>
                          {result.evaluation.detectors.safety.findings.response_findings.findings.map((f, idx) => (
                            <div key={idx} className="text-[10px] text-gray-300 leading-snug">
                              • <span className="font-semibold text-rose-400 font-mono">{f.category}</span>: matches {f.matches.join(', ')}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle size={10} /> Safe response.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bias Detector */}
                  <div className="bg-darkCard border border-darkBorder rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1.5">
                          <UserX size={13} className="text-amber-400" /> Bias Screen
                        </h4>
                        <span className={`text-sm font-bold ${result.evaluation.detectors.bias.score >= 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {result.evaluation.detectors.bias.score} / 100
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">{result.evaluation.detectors.bias.explanation}</p>

                      {result.evaluation.detectors.bias.findings?.detected ? (
                        <div className="mt-3 text-[10px] text-rose-400 font-semibold leading-relaxed">
                          Stereotype generalization detected: 
                          <span className="text-gray-300 ml-1 block mt-0.5">• Category: {result.evaluation.detectors.bias.findings.category}</span>
                        </div>
                      ) : (
                        <div className="mt-3 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle size={10} /> No stereotypical language flagged.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hallucination Detector */}
                  <div className="bg-darkCard border border-darkBorder rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1.5">
                          <FileCheck size={13} className="text-emerald-400" /> Fact Verifier
                        </h4>
                        <span className={`text-sm font-bold ${result.evaluation.detectors.hallucination.score >= 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {result.evaluation.detectors.hallucination.score} / 100
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">{result.evaluation.detectors.hallucination.explanation}</p>

                      {result.evaluation.detectors.hallucination.findings?.status ? (
                        <div className="mt-3 text-[10px]">
                          Claim Verification Status: 
                          <span className={`ml-1.5 font-bold ${
                            result.evaluation.detectors.hallucination.findings.status === 'SUPPORTED' ? 'text-emerald-400' :
                            result.evaluation.detectors.hallucination.findings.status === 'PARTIALLY_SUPPORTED' ? 'text-amber-400' :
                            'text-rose-400'
                          }`}>{result.evaluation.detectors.hallucination.findings.status}</span>
                        </div>
                      ) : (
                        <div className="mt-3 text-[10px] text-gray-500">Unverifiable: No reference context supplied.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sanitized / Masked output view (Only when decision is MODIFY or ALLOW) */}
                <div className="bg-darkCard border border-darkBorder rounded-xl p-4 shadow-xl">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sanitized Payload Output</h4>
                  <div className="bg-darkBg text-xs text-gray-300 font-mono p-3 rounded-lg border border-darkBorder break-all">
                    {result.interaction.response}
                  </div>
                </div>

                {/* Metadata identifiers */}
                <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] text-gray-500 bg-darkCard/30 border border-darkBorder rounded-xl p-3.5">
                  <div>
                    <span className="font-semibold uppercase">Interaction ID:</span> <span className="font-mono text-gray-400">{result.interaction.id}</span>
                  </div>
                  <div>
                    <span className="font-semibold uppercase">Incident Logged:</span>{' '}
                    <span className={`font-bold ${result.incident ? 'text-rose-400' : 'text-gray-400'}`}>
                      {result.incident ? `YES (${result.incident.id})` : 'NO'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold uppercase">Policy:</span> <span className="text-gray-400">{result.evaluation.policy?.name || 'Default'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
