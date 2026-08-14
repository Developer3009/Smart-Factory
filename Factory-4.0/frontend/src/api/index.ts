import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Authorization helper
export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export const registerFace = (formData: FormData) => api.post('/auth/register-face', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data);
export const loginFace = (formData: FormData) => api.post('/auth/login-face', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data);

export const getMachines = () => api.get('/machines').then(res => res.data);
export const getMachineReadings = (id: number) => api.get(`/machines/${id}/readings`).then(res => res.data);
export const getOEE = () => api.get('/production/oee').then(res => res.data);
export const getDowntime = () => api.get('/downtime').then(res => res.data);
export const getAlerts = () => api.get('/alerts').then(res => res.data);
export const getInventory = () => api.get('/inventory').then(res => res.data);
export const getMaintenance = () => api.get('/maintenance').then(res => res.data);
export const reorderInventory = (itemId: number) => api.post(`/inventory/${itemId}/reorder`).then(res => res.data);
export const refillInventory = (itemId: number, quantity = 0) => api.post(`/inventory/${itemId}/refill`, { quantity }).then(res => res.data);
export const getSimulatorStatus = () => api.get('/simulator/status').then(res => res.data);
export const getDefectsSummary = () => api.get('/defects/summary').then(res => res.data);

export const toggleSimulator = (start: boolean) => api.post(`/simulator/${start ? 'start' : 'stop'}`).then(res => res.data);
export const injectFailure = (machineId: number) => api.post('/simulator/inject-failure', { machine_id: machineId }).then(res => res.data);
export const chatAgent = (question: string) => api.post('/agent/chat', { question }).then(res => res.data);
export const operateAgent = (question: string) => api.post('/agent/operate', { question }).then(res => res.data);

export default api;
