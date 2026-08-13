import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

export const getMachines = () => api.get('/machines').then(res => res.data);
export const getMachineReadings = (id: number) => api.get(`/machines/${id}/readings`).then(res => res.data);
export const getOEE = () => api.get('/production/oee').then(res => res.data);
export const getDowntime = () => api.get('/downtime').then(res => res.data);
export const getAlerts = () => api.get('/alerts').then(res => res.data);
export const getInventory = () => api.get('/inventory').then(res => res.data);
export const getSimulatorStatus = () => api.get('/simulator/status').then(res => res.data);
export const getDefectsSummary = () => api.get('/defects/summary').then(res => res.data);

export const toggleSimulator = (start: boolean) => api.post(`/simulator/${start ? 'start' : 'stop'}`).then(res => res.data);
export const injectFailure = (machineId: number) => api.post('/simulator/inject-failure', { machine_id: machineId }).then(res => res.data);
export const chatAgent = (question: string) => api.post('/agent/chat', { question }).then(res => res.data);

export default api;
