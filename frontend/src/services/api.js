import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDashboardStats = async () => {
  const response = await apiClient.get('/dashboard/overview');
  return response.data;
};

export const getAISystems = async (params = {}) => {
  const response = await apiClient.get('/ai-systems', { params });
  return response.data;
};

export const createAISystem = async (data) => {
  const response = await apiClient.post('/ai-systems', data);
  return response.data;
};

export const updateAISystem = async (id, data) => {
  const response = await apiClient.put(`/ai-systems/${id}`, data);
  return response.data;
};

export const deleteAISystem = async (id) => {
  const response = await apiClient.delete(`/ai-systems/${id}`);
  return response.data;
};

export const getPolicies = async (params = {}) => {
  const response = await apiClient.get('/policies', { params });
  return response.data;
};

export const createPolicy = async (data) => {
  const response = await apiClient.post('/policies', data);
  return response.data;
};

export const updatePolicy = async (id, data) => {
  const response = await apiClient.put(`/policies/${id}`, data);
  return response.data;
};

export const deletePolicy = async (id) => {
  const response = await apiClient.delete(`/policies/${id}`);
  return response.data;
};

export const evaluateResponse = async (data) => {
  const response = await apiClient.post('/evaluate', data);
  return response.data;
};

export const getInteractions = async (params = {}) => {
  const response = await apiClient.get('/interactions', { params });
  return response.data;
};

export const getInteractionDetails = async (id) => {
  const response = await apiClient.get(`/interactions/${id}`);
  return response.data;
};

export const getIncidents = async (params = {}) => {
  const response = await apiClient.get('/incidents', { params });
  return response.data;
};

export const getIncidentDetails = async (id) => {
  const response = await apiClient.get(`/incidents/${id}`);
  return response.data;
};

export const updateIncident = async (id, data) => {
  const response = await apiClient.patch(`/incidents/${id}`, data);
  return response.data;
};

export const deleteIncident = async (id) => {
  const response = await apiClient.delete(`/incidents/${id}`);
  return response.data;
};

export const createIntervention = async (incidentId, data) => {
  // Accepted query params or body depending on API design.
  // In api/interventions.py we declared incident_id as query param.
  const response = await apiClient.post(`/interventions?incident_id=${incidentId}`, data);
  return response.data;
};

export const getAuditLogs = async (params = {}) => {
  const response = await apiClient.get('/audit-logs', { params });
  return response.data;
};

export const getAgentTrace = async (interactionId) => {
  const response = await apiClient.get(`/agent-traces/${interactionId}`);
  return response.data;
};

export const generateSystemResponse = async (systemId, prompt) => {
  const response = await apiClient.post(`/ai-systems/${systemId}/generate`, { prompt });
  return response.data;
};

export default {
  getDashboardStats,
  getAISystems,
  createAISystem,
  updateAISystem,
  deleteAISystem,
  getPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  evaluateResponse,
  getInteractions,
  getInteractionDetails,
  getIncidents,
  getIncidentDetails,
  updateIncident,
  deleteIncident,
  createIntervention,
  getAuditLogs,
  getAgentTrace,
  generateSystemResponse,
};

