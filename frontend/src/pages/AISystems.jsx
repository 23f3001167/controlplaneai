import React, { useState, useEffect } from 'react';
import { 
  getAISystems, 
  createAISystem, 
  updateAISystem, 
  deleteAISystem 
} from '../services/api';
import Modal from '../components/ui/Modal';
import RiskBadge from '../components/ui/RiskBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Power, 
  PowerOff,
  Cpu 
} from 'lucide-react';

export default function AISystems() {
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRisk, setFilterRisk] = useState('');

  // Modal forms
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentSystem, setCurrentSystem] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemType, setSystemType] = useState('LLM');
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [latencyBudget, setLatencyBudget] = useState(1000);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const systemTypes = ['AI_AGENT', 'LLM', 'CHATBOT', 'RECOMMENDER', 'CLASSIFIER', 'GENAI_APPLICATION', 'OTHER'];

  const fetchSystems = async () => {
    try {
      setLoading(true);
      const data = await getAISystems();
      setSystems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystems();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('System name is required.');
      return;
    }
    try {
      await createAISystem({
        name,
        description,
        system_type: systemType,
        risk_level: riskLevel,
        latency_budget_ms: Number(latencyBudget),
        is_active: isActive
      });
      setIsCreateOpen(false);
      resetForm();
      fetchSystems();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to register AI system.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('System name is required.');
      return;
    }
    try {
      await updateAISystem(currentSystem.id, {
        name,
        description,
        system_type: systemType,
        risk_level: riskLevel,
        latency_budget_ms: Number(latencyBudget),
        is_active: isActive
      });
      setIsEditOpen(false);
      resetForm();
      fetchSystems();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to update AI system.');
    }
  };

  const handleToggleActive = async (sys) => {
    try {
      await updateAISystem(sys.id, { is_active: !sys.is_active });
      fetchSystems();
    } catch (err) {
      console.error('Failed to toggle active status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this AI System? All associated interactions, policies, and incidents will be deleted.')) {
      return;
    }
    try {
      await deleteAISystem(id);
      fetchSystems();
    } catch (err) {
      console.error('Failed to delete system:', err);
    }
  };

  const openEdit = (sys) => {
    setCurrentSystem(sys);
    setName(sys.name);
    setDescription(sys.description || '');
    setSystemType(sys.system_type);
    setRiskLevel(sys.risk_level);
    setLatencyBudget(sys.latency_budget_ms);
    setIsActive(sys.is_active);
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setSystemType('LLM');
    setRiskLevel('LOW');
    setLatencyBudget(1000);
    setIsActive(true);
    setFormError('');
    setCurrentSystem(null);
  };

  // Filters
  const filtered = systems.filter(sys => {
    const matchesSearch = sys.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sys.description && sys.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === '' || sys.system_type === filterType;
    const matchesRisk = filterRisk === '' || sys.risk_level === filterRisk;
    return matchesSearch && matchesType && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-100">AI Inventory Management</h2>
          <p className="text-xs text-gray-400 mt-1">Register, configure, and monitor systems deployed across the enterprise.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition"
        >
          <Plus size={14} /> Register System
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-darkCard border border-darkBorder rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search systems by name or description..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-darkBg text-xs text-gray-200 pl-10 pr-4 py-2 border border-darkBorder rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-darkBg text-xs text-gray-300 border border-darkBorder rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Types</option>
            {systemTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-darkBg text-xs text-gray-300 border border-darkBorder rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Risk Levels</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Systems Grid/Table */}
      {loading ? (
        <LoadingState message="Fetching system catalog..." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No AI Systems Registered" description="Click 'Register System' to record your first deployed AI system." />
      ) : (
        <div className="bg-darkCard border border-darkBorder rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-gray-400 bg-darkBg/20">
                <th className="p-4 font-semibold">Name & Description</th>
                <th className="p-4 font-semibold">System Type</th>
                <th className="p-4 font-semibold text-center">Declared Risk</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-center">Latency Budget</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder/40">
              {filtered.map((sys) => (
                <tr key={sys.id} className="hover:bg-gray-800/10 transition">
                  <td className="p-4">
                    <div className="font-semibold text-gray-200 text-sm flex items-center gap-2">
                      <Cpu size={14} className="text-blue-500" />
                      {sys.name}
                    </div>
                    {sys.description && <div className="text-gray-400 mt-1 max-w-sm truncate">{sys.description}</div>}
                  </td>
                  <td className="p-4 font-mono text-gray-300">{sys.system_type}</td>
                  <td className="p-4 text-center">
                    <RiskBadge level={sys.risk_level} />
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                      sys.is_active 
                        ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' 
                        : 'bg-rose-950/20 text-rose-400 border-rose-900/30'
                    }`}>
                      {sys.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 text-center text-gray-300 font-mono">{sys.latency_budget_ms} ms</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleToggleActive(sys)}
                        title={sys.is_active ? 'Deactivate System' : 'Activate System'}
                        className={`p-1.5 rounded hover:bg-gray-800 transition ${
                          sys.is_active ? 'text-emerald-500' : 'text-gray-500'
                        }`}
                      >
                        {sys.is_active ? <Power size={14} /> : <PowerOff size={14} />}
                      </button>
                      <button 
                        onClick={() => openEdit(sys)}
                        title="Edit Configuration"
                        className="p-1.5 text-blue-400 hover:text-blue-300 rounded hover:bg-gray-800 transition"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(sys.id)}
                        title="Permanently Delete"
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

      {/* Creation Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Register New AI System">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="p-3 bg-rose-950/30 border border-rose-800/40 text-rose-400 text-xs rounded-lg">{formError}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">System Name *</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chatbot Model v2" 
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">System Type</label>
              <select 
                value={systemType} 
                onChange={(e) => setSystemType(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
              >
                {systemTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium block">Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide system overview, business owner and endpoints..." 
              rows="3"
              className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Risk Classification</label>
              <select 
                value={riskLevel} 
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Latency Budget (ms)</label>
              <input 
                type="number" 
                required 
                value={latencyBudget} 
                onChange={(e) => setLatencyBudget(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="active_check" 
              checked={isActive} 
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded bg-darkBg border-darkBorder text-blue-500 focus:ring-0 focus:ring-offset-0"
            />
            <label htmlFor="active_check" className="text-xs text-gray-400 select-none">Active for monitoring</label>
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
              Register System
            </button>
          </div>
        </form>
      </Modal>

      {/* Editing Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Configure AI System: ${currentSystem?.name}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-rose-950/30 border border-rose-800/40 text-rose-400 text-xs rounded-lg">{formError}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">System Name *</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">System Type</label>
              <select 
                value={systemType} 
                onChange={(e) => setSystemType(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
              >
                {systemTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium block">Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Risk Classification</label>
              <select 
                value={riskLevel} 
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium block">Latency Budget (ms)</label>
              <input 
                type="number" 
                required 
                value={latencyBudget} 
                onChange={(e) => setLatencyBudget(e.target.value)}
                className="w-full bg-darkBg text-xs border border-darkBorder rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-gray-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="edit_active_check" 
              checked={isActive} 
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded bg-darkBg border-darkBorder text-blue-500 focus:ring-0 focus:ring-offset-0"
            />
            <label htmlFor="edit_active_check" className="text-xs text-gray-400 select-none">Active for monitoring</label>
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
