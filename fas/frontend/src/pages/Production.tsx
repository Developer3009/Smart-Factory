import { useEffect, useState } from 'react';
import { getOEE, getDowntime } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Production() {
  const [oee, setOee] = useState<any>(null);
  const [downtime, setDowntime] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setOee(await getOEE());
      setDowntime(await getDowntime());
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compute downtime pareto
  const reasonCounts = downtime.reduce((acc: any, curr: any) => {
    acc[curr.reason] = (acc[curr.reason] || 0) + 1;
    return acc;
  }, {});

  const paretoData = Object.keys(reasonCounts).map(reason => ({
    reason,
    count: reasonCounts[reason]
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Production</h1>
      
      <div className="bg-surface rounded-xl border border-slate-700 p-6">
        <h2 className="text-xl font-bold mb-4">Overall Equipment Effectiveness (OEE)</h2>
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-400">OEE</div>
            <div className="text-2xl font-bold text-primary">{oee?.overall ?? '--'}%</div>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-400">Availability</div>
            <div className="text-2xl font-bold">{oee?.availability ?? '--'}%</div>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-400">Performance</div>
            <div className="text-2xl font-bold">{oee?.performance ?? '--'}%</div>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-400">Quality</div>
            <div className="text-2xl font-bold">{oee?.quality ?? '--'}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold mb-4">Downtime Reasons (Pareto)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paretoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="reason" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                <Bar dataKey="count" fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold mb-4">Recent Downtime Events</h2>
          <div className="space-y-2 max-h-64 overflow-auto pr-2">
            {downtime.length === 0 && <div className="text-slate-400">No recent downtime events.</div>}
            {downtime.map((d: any) => (
              <div key={d.event_id} className="p-3 bg-slate-800 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-bold">{d.machine_name}</div>
                  <div className="text-sm text-slate-400">{d.reason}</div>
                </div>
                <div className="text-sm text-slate-400">
                  {new Date(d.start_time).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
