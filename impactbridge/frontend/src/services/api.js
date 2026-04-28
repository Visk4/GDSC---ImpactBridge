import axios from 'axios';

// In production, VITE_BACKEND_URL should be the deployed backend URL
// In dev, the Vite proxy handles /api → localhost:8080
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const backend = axios.create({
  baseURL: BACKEND_URL + '/api',
  timeout: 60000, // 60s — proposal generation can take time
  headers: { 'Content-Type': 'application/json' },
});

// ─── NGO APIs ────────────────────────────────────────────────
export const submitNgo = (data) => backend.post('/ngos', data);
export const getAllNgos = () => backend.get('/ngos');
export const getNgoById = (id) => backend.get(`/ngos/${id}`);
export const publishNgo = (id) => backend.put(`/ngos/${id}/publish`);

// ─── Corporate APIs ──────────────────────────────────────────
export const submitCorporate = (data) => backend.post('/corporates', data);
export const getAllCorporates = () => backend.get('/corporates');

// ─── Match APIs ──────────────────────────────────────────────
export const getMatches = (corporateId) => backend.get(`/matches/${corporateId}`);
export const generateMatches = (corporateId) => backend.post(`/matches/generate/${corporateId}`);
export const expressInterest = (data) => backend.post('/matches/express-interest', data);
export const markAsFunded = (matchId, data) => backend.post(`/matches/${matchId}/fund`, data);
export const downloadReport = (corporateId) => backend.get(`/reports/corporate/${corporateId}/pdf`, { responseType: 'blob' });

// ─── Heatmap APIs ────────────────────────────────────────────
export const getHeatmapData = () => backend.get('/heatmap');

// ─── Stats API ───────────────────────────────────────────────
export const getStats = () => backend.get('/stats');

const AI_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3001';
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// AI Service APIs
export const parseCSRPolicy = (text) =>
  axios.post(`${AI_URL}/api/ai/parse-policy`, { policyText: text });

export const parseDocumentVision = (base64Image) =>
  axios.post(`${AI_URL}/api/ai/vision-ocr`, { image: base64Image });

export const translateToEnglish = (text) =>
  axios.post(`${AI_URL}/api/ai/translate`, { text });

export const generateProposal = (ngoData) =>
  axios.post(`${AI_URL}/api/ai/generate-proposal`, ngoData);

// Verification APIs
export const verifyNgo = (ngoId, data) =>
  axios.post(`${BASE_URL}/api/verify/ngo/${ngoId}`, data);

export const verifyCorporate = (corporateId, data) =>
  axios.post(`${BASE_URL}/api/verify/corporate/${corporateId}`, data);

export const quickCheckCIN = (cin) =>
  axios.get(`${BASE_URL}/api/verify/cin-check`, { params: { cin } });

export const quickCheckDarpan = (darpanId) =>
  axios.get(`${BASE_URL}/api/verify/darpan-check`, { params: { darpanId } });

export default backend;
