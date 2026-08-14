import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerFace, loginFace, setAuthToken } from '../api/index';

export default function FaceAuth() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [role, setRole] = useState('operator');
  const navigate = useNavigate();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
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
    setStreaming(false);
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const w = videoRef.current.videoWidth || 640;
    const h = videoRef.current.videoHeight || 480;
    canvasRef.current.width = w;
    canvasRef.current.height = h;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, w, h);
    const data = canvasRef.current.toDataURL('image/jpeg', 0.9);
    setCaptured(data);
    stopCamera();
  };

  const blobFromDataURL = async (dataURL: string) => {
    const res = await fetch(dataURL);
    const blob = await res.blob();
    return blob;
  };

  const doRegister = async () => {
    if (!captured) { alert('Capture a photo first'); return; }
    const blob = await blobFromDataURL(captured);
    const form = new FormData();
    form.append('name', 'Web User');
    form.append('role', role);
    form.append('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
    try {
      const res = await registerFace(form);
      if (res && res.token) {
        setAuthToken(res.token);
        localStorage.setItem('jwt', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        alert('Registered and logged in: ' + res.user.name);
        navigate('/');
      } else {
        alert('Registered but no token returned: ' + JSON.stringify(res));
      }
    } catch (e) {
      alert('Register failed: ' + e);
    }
  };

  const doLogin = async () => {
    if (!captured) { alert('Capture a photo first'); return; }
    const blob = await blobFromDataURL(captured);
    const form = new FormData();
    form.append('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
    try {
      const res = await loginFace(form);
      if (res && res.token) {
        setAuthToken(res.token);
        localStorage.setItem('jwt', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        alert('Logged in: ' + res.user.name);
        navigate('/');
      } else if (res && res.error) {
        alert('Login error: ' + res.error);
      } else {
        alert('Unexpected login response: ' + JSON.stringify(res));
      }
    } catch (e) {
      alert('Login failed: ' + e);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">Face Login / Register</h2>
      <div className="mt-4">
        {!streaming && <button onClick={startCamera} className="btn">Start Camera</button>}
        {streaming && <button onClick={capture} className="btn ml-2">Capture</button>}
        {streaming && <button onClick={stopCamera} className="btn ml-2">Stop</button>}
      </div>
      <div className="mt-4 flex gap-4">
        <video ref={videoRef} style={{ width: 320, height: 240, background: '#000' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {captured && <img src={captured} alt="captured" style={{ width: 320, height: 240 }} />}
      </div>
      <div className="mt-4">
        <label className="mr-2">Role:</label>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="operator">operator</option>
          <option value="manager">manager</option>
          <option value="admin">admin</option>
        </select>
      </div>
      <div className="mt-4">
        <button onClick={doRegister} className="btn mr-2">Register Face (and auto-login)</button>
        <button onClick={doLogin} className="btn">Login with Face</button>
      </div>
    </div>
  );
}
