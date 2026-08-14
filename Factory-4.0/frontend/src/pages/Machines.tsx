import { useEffect, useState } from 'react';
import { getMachines, getMachineReadings, injectFailure } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Machines() {
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [readings, setReadings] = useState<any[]>([]);

  useEffect(() => {
    getMachines().then((data) => {
      setMachines(data);
      if (!selectedMachine && data.length > 0) {
        setSelectedMachine(data[0]);
      }
    });
  }, [selectedMachine]);

  useEffect(() => {
    if (selectedMachine) {
      const fetchReadings = async () => {
        const data = await getMachineReadings(selectedMachine.machine_id);
        // Process data for recharts (group by timestamp)
        const processed = data.reduce((acc: any, curr: any) => {
          const time = new Date(curr.timestamp).toLocaleTimeString();
          if (!acc[time]) acc[time] = { time };
          acc[time][curr.sensor_type] = curr.value;
          return acc;
        }, {});
        setReadings(Object.values(processed));
      };
      fetchReadings();
      const interval = setInterval(fetchReadings, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedMachine]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Machines & Digital Twin</h1>
      <div className="grid grid-cols-3 gap-6">
        {/* Machine List */}
        <div className="bg-surface rounded-xl border border-slate-700 p-4 space-y-2">
          {machines.map(m => (
            <button
              key={m.machine_id}
              onClick={() => setSelectedMachine(m)}
              className={`w-full text-left p-4 rounded-lg transition-colors ${selectedMachine?.machine_id === m.machine_id ? 'bg-primary/20 border border-primary' : 'bg-slate-800/50 hover:bg-slate-700'}`}
            >
              <div className="font-bold">{m.name}</div>
              <div className="text-sm text-slate-400">Status: {m.status}</div>
            </button>
          ))}
        </div>

        {/* Detail View */}
        <div className="col-span-2 bg-surface rounded-xl border border-slate-700 p-6 flex flex-col">
          {selectedMachine ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedMachine.name}</h2>
                  <p className="text-slate-400">{selectedMachine.type} • {selectedMachine.location}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => injectFailure(selectedMachine.machine_id)}
                    className="bg-danger/20 text-danger px-4 py-2 rounded-lg text-sm font-medium hover:bg-danger/30 transition-colors"
                  >
                    Inject Failure (Drift)
                  </button>
                </div>
              </div>
              
              <div className="flex-1 min-h-[400px]">
                <h3 className="text-lg font-bold mb-4">Live Sensor Readings</h3>
                {readings.length > 0 && (
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {Object.keys(readings[readings.length - 1]).filter(k => k !== 'time').map(key => (
                      <div key={key} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <div className="text-sm text-slate-400 capitalize">{key}</div>
                        <div className="text-2xl font-bold text-primary">
                          {Number(readings[readings.length - 1][key]).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {readings.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={readings}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 12}} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                      <Legend />
                      <Line type="monotone" dataKey="temperature" stroke="#ef4444" dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="vibration" stroke="#38bdf8" dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="rpm" stroke="#10b981" dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="pressure" stroke="#f59e0b" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-400 flex items-center justify-center h-full">No sensor data available.</div>
                )}
              </div>
            </>
          ) : (
            <div className="text-slate-400 flex items-center justify-center h-full">Select a machine to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}
