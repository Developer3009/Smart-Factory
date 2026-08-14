import { useEffect, useRef, useState } from 'react';
import { createUser, deleteUser, getUsers } from '../api';

export default function Employees() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('operator');
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  const fetchEmployees = async () => {
    try {
      const data = await getUsers();
      setEmployees(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraOn(true);
      }
    } catch (e) {
      alert('Unable to access camera: ' + e);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const width = videoRef.current.videoWidth || 640;
    const height = videoRef.current.videoHeight || 480;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, width, height);
    setCaptured(canvasRef.current.toDataURL('image/jpeg', 0.9));
    stopCamera();
  };

  useEffect(() => { fetchEmployees(); }, []);

  const onAdd = async () => {
    if (!name.trim()) return alert('Employee name required');
    if (!employeeId.trim()) return alert('Employee ID required');
    if (!captured) return alert('Take a face photo before creating the employee');

    const blob = await fetch(captured).then(r => r.blob());
    const form = new FormData();
    form.append('name', name.trim());
    form.append('role', role);
    form.append('employee_id', employeeId.trim());
    form.append('status', 'active');
    form.append('file', new File([blob], `${employeeId.trim()}-face.jpg`, { type: 'image/jpeg' }));

    setLoading(true);
    try {
      await createUser(form);
      setName(''); setRole('operator'); setEmployeeId(''); setCaptured(null);
      await fetchEmployees();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Unable to create employee');
    } finally { setLoading(false); }
  };

  const onDelete = async (userId: number) => {
    try {
      await deleteUser(userId);
      await fetchEmployees();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Unable to delete employee');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Employee Directory</h1>
      <div className="bg-surface rounded-xl border border-slate-700 p-6 space-y-4 max-w-2xl">
        <h2 className="text-xl font-semibold">Add Employee</h2>
        <div className="grid grid-cols-2 gap-4">
          <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded bg-slate-900 border border-slate-600 px-3 py-2" placeholder="Full name" />
          <input value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="rounded bg-slate-900 border border-slate-600 px-3 py-2" placeholder="Employee ID" />
        </div>
        <select value={role} onChange={e => setRole(e.target.value)} className="w-full rounded bg-slate-900 border border-slate-600 px-3 py-2">
          <option value="operator">operator</option>
          <option value="manager">manager</option>
          <option value="admin">admin</option>
        </select>

        <div className="flex items-center gap-3">
          {!cameraOn && <button onClick={startCamera} className="px-4 py-2 rounded bg-primary text-slate-950 font-semibold">Start Camera</button>}
          {cameraOn && <button onClick={capturePhoto} className="px-4 py-2 rounded bg-primary text-slate-950 font-semibold">Capture Face</button>}
          {cameraOn && <button onClick={stopCamera} className="px-4 py-2 rounded border border-slate-600 text-slate-200">Stop</button>}
        </div>

        <div className="flex gap-4 items-center">
          <video ref={videoRef} style={{ width: 260, height: 200, background: '#000', borderRadius: 8 }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {captured && <img src={captured} alt="face preview" style={{ width: 260, height: 200, objectFit: 'cover', borderRadius: 8 }} />}
        </div>

        <button onClick={onAdd} disabled={loading} className="px-4 py-2 rounded bg-primary text-slate-950 font-semibold disabled:opacity-50">{loading ? 'Saving...' : 'Add Employee'}</button>
      </div>

      <div className="bg-surface rounded-xl border border-slate-700 p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700"><th className="py-2">Name</th><th>Role</th><th>Employee ID</th><th>Face</th><th>Status</th><th>Last seen</th><th></th></tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.user_id} className="border-b border-slate-800">
                <td className="py-3">{emp.name}</td>
                <td>{emp.role}</td>
                <td>{emp.employee_id || '-'}</td>
                <td>{emp.face_hash || emp.face_registered_at ? 'Registered' : 'Missing'}</td>
                <td>{emp.status || 'active'}</td>
                <td>{emp.last_seen ? new Date(emp.last_seen).toLocaleString() : 'Never'}</td>
                <td><button onClick={() => onDelete(emp.user_id)} className="text-danger">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
