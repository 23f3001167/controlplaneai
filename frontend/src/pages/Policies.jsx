import React, { useState, useEffect } from 'react';
import { 
  getPolicies, 
  createPolicy, 
  updatePolicy, 
  deletePolicy, 
  getAISystems 
} from '../services/api';
import Modal from '../components/ui/Modal';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  Sliders 
} from 'lucide-react';

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [aiSystemId, setAiSystemId] = useState('');
  const [riskThreshold, setRiskThreshold] = useState(40);
  const [humanReviewThreshold, setHumanReviewThreshold] = useState(70);
  const [blockThreshold, setBlockThreshold] = useState(90);
  const [privacyThreshold, setPrivacyThreshold] = useState(70);
  const [biasThreshold, setBiasThreshold] = useState(70);
  const [formError, setFormError] = useState('');

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [policiesData, systemsData] = await Promise.all([
        getPolicies(),
        getAISystems()
      ]);
      setPolicies(policiesData);
      setSystems(systemsData.filter(s => s.is_active));
      if (systemsData.length > 0) {
        setAiSystemId(systemsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load policies data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const validateThresholds = (risk, hr, block) => {
    const r = Number(risk);
    const h = Number(hr);
    const b = Number(block);

    if (r < 0 || r > 100 || h < 0 || h > 100 || b < 0 || b > 100) {
      return 'All thresholds must be between 0 and 100.';
    }
    if (!(r <= h && h <= b)) {
      return 'Threshold Inconsistency: Risk Threshold must be less than or equal to Human Review Threshold, which must be less than or equal to Block Threshold.';
    }
    return '';
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');

    const error = validateThresholds(riskThreshold, humanReviewThreshold, blockThreshold);
    if (error) {
      setFormError(error);
      return;
    }

    try {
      await createPolicy({
        ai_system_id: aiSystemId,
        name,
        risk_threshold: Number(riskThreshold),
        human_review_threshold: Number(humanReviewThreshold),
        block_threshold: Number(blockThreshold),
        privacy_threshold: Number(privacyThreshold),
        bias_threshold: Number(biasThreshold)
      });
      setIsCreateOpen(false);
      resetForm();
      fetchInitialData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create policy.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const error = validateThresholds(riskThreshold, humanReviewThreshold, blockThreshold);
    if (error) {
      setFormError(error);
      return;
    }

    try {
      await updatePolicy(currentPolicy.id, {
        name,
        risk_threshold: Number(riskThreshold),
        human_review_threshold: Number(humanReviewThreshold),
        block_threshold: Number(blockThreshold),
        privacy_threshold: Number(privacyThreshold),
        bias_threshold: Number(biasThreshold)
      });
      setIsEditOpen(false);
      resetForm();
      fetchInitialData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to update policy.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this Policy?')) {
      return;
    }
    try {
      await deletePolicy(id);
      fetchInitialData();
    } catch (err) {
      console.error('Failed to delete policy:', err);
    }
  };

  const openEdit = (pol) => {
    setCurrentPolicy(pol);
    setName(pol.name);
    setAiSystemId(pol.ai_system_id);
    setRiskThreshold(pol.risk_threshold);
    setHumanReviewThreshold(pol.human_review_threshold);
    setBlockThreshold(pol.block_threshold);
    setPrivacyThreshold(pol.privacy_threshold);
    setBiasThreshold(pol.bias_threshold);
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setName('');
    if (systems.length > 0) {
      setAiSystemId(systems[0].id);
    }
    setRiskThreshold(40);
    setHumanReviewThreshold(70);
    setBlockThreshold(90);
    setPrivacyThreshold(70);
    setBiasThreshold(70);
    setFormError('');
    setCurrentPolicy(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-100">Governance Policies</h2>
          <p className="text-xs text-gray-400 mt-1">Specify risk thresholds and action policies for registered AI systems.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition"
        >
          <Plus size={14} /> New Policy
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <LoadingState message="Fetching system policies..." />
      ) : policies.length === 0 ? (
        <EmptyState title="No Policies Created" description="Click 'New Policy' to establish guardrails for your AI platforms." />
      ) : (
        <div className="bg-darkCard border border-darkBorder rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-gray-400 bg-darkBg/20">
                <th className="p-4 font-semibold">Policy Name</th>
                <th className="p-4 font-semibold">AI System</th>
                <th className="p-4 font-semibold text-center">Risk Threshold (Modify)</th>
                <th className="p-4 font-semibold text-center">Human Review Threshold</th>
                <th className="p-4 font-semibold text-center">Block Threshold</th>
                <th className="p-4 font-semibold text-center">Privacy Threshold</th>
                <th className="p-4 font-semibold text-center">Bias Threshold</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder/40">
              {policies.map((pol) => (
                <tr key={pol.id} className="hover:bg-gray-800/10 transition">
                  <td className="p-4">
                    <div className="font-semibold text-gray-200 text-sm flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      {pol.name}
                    </div>
                  </td>
                  <td className="p-4 text-gray-300 font-semibold">{pol.ai_system_name || 'Unknown System'}</td>
                  <td className="p-4 text-center font-mono text-gray-100 font-bold">{pol.risk_threshold}%</td>
                  <td className="p-4 text-center font-mono text-blue-400 font-bold">{pol.human_review_threshold}%</td>
                  <td className="p-4 text-center font-mono text-rose-400 font-bold">{pol.block_threshold}%</td>
                  <td className="p-4 text-center font-mono text-gray-300">{pol.privacy_threshold}%</td>
                  <td className="p-4 text-center font-mono text-gray-300">{pol.bias_threshold}%</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEdit(pol)}
                        title="Edit Policy Rules"
                        className="p-1.5 text-blue-400 hover:text-blue-300 rounded hover:bg-gray-800 transition"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(pol.id)}
                        title="Delete Policy"
                        className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-gray-800 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Threshold Rules Warning Callout */}
      <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-4 flex gap-3.5">
        <Sliders className="text-blue-500 shrink-0" size={20} />
        <div className="space-y-1 text-xs">
          <h5 className="font-semibold text-blue-400 uppercase tracking-wide">Governance Threshold Hierarchy</h5>
          <p className="text-gray-400 leading-relaxed">
            The policy engine enforces a logical ranking. A policy must satisfy: 
            <code className="text-gray-300 font-mono mx-1.5 bg-darkBg px-1.5 py-0.5 rounded border border-darkBorder">
              risk_threshold &le; human_review_threshold &le; block_threshold
            </code>. 
            Risk scores that meet the modification threshold but fall short of review boundaries will undergo automated payload sanitisation.
          </p>
        </div>
      </div>

      {/* Creation Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Governance Policy">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="p-3 bg-rose-950/30 border border-rose-800/40 text-rose-400 text-xs rounded-lg">{formError}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Policy Name *</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Core Safeguards" 
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Target AI System *</label>
              <select 
                value={aiSystemId} 
                onChange={(e) => setAiSystemId(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
              >
                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Risk Threshold (Modify) *</label>
              <input 
                type="number" 
                required 
                min="0" 
                max="100" 
                value={riskThreshold} 
                onChange={(e) => setRiskThreshold(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Human Review Threshold *</label>
              <input 
                type="number" 
                required 
                min="0" 
                max="100" 
                value={humanReviewThreshold} 
                onChange={(e) => setHumanReviewThreshold(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Block Threshold *</label>
              <input 
                type="number" 
                required 
                min="0" 
                max="100" 
                value={blockThreshold} 
                onChange={(e) => setBlockThreshold(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Privacy Threshold *</label>
              <input 
                type="number" 
                required 
                min="0" 
                max="100" 
                value={privacyThreshold} 
                onChange={(e) => setPrivacyThreshold(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Bias Threshold *</label>
              <input 
                type="number" 
                required 
                min="0" 
                max="100" 
                value={biasThreshold} 
                onChange={(e) => setBiasThreshold(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-darkBorder">
            <button 
              type="button" 
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-darkBorder text-gray-400 hover:text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Create Policy
            </button>
          </div>
        </form>
      </Modal>

      {/* Editing Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Governance Policy: ${currentPolicy?.name}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-rose-950/30 border border-rose-800/40 text-rose-400 text-xs rounded-lg">{formError}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Policy Name *</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">AI System</label>
              <input 
                type="text" 
                disabled 
                value={currentPolicy?.ai_system_name || ''} 
                className="w-full bg-darkBg/60 text-xs border border-darkBorder rounded-lg p-2.5 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Risk Threshold (Modify) *</label>
              <input 
                type="number" 
                required 
                min="0" 
                max="100" 
                value={riskThreshold} 
                onChange={(e) => setRiskThreshold(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Human Review Threshold *</label>
              <input 
                type="number" 
                required 
                min="0" 
                max="100" 
                value={humanReviewThreshold} 
                onChange={(e) => setHumanReviewThreshold(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Block Threshold *</label>
              <input 
                type="number" 
                required 
                min="0" 
                max="100" 
                value={blockThreshold} 
                onChange={(e) => setBlockThreshold(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Privacy Threshold *</label>
              <input 
                type="number" 
                required 
                min="0" 
                max="100" 
                value={privacyThreshold} 
                onChange={(e) => setPrivacyThreshold(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Bias Threshold *</label>
              <input 
                type="number" 
                required 
                min="0" 
                max="100" 
                value={biasThreshold} 
                onChange={(e) => setBiasThreshold(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-darkBorder">
            <button 
              type="button" 
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-darkBorder text-gray-400 hover:text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
