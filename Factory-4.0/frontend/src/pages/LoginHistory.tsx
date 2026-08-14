import { useEffect, useState } from 'react';
import { getLoginHistory } from '../api';

export default function LoginHistory() {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getLoginHistory();
        setEntries(data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Login History</h1>
      <div className="bg-surface rounded-xl border border-slate-700 p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700"><th className="py-2">User</th><th>Role</th><th>Last login</th></tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.user_id} className="border-b border-slate-800">
                <td className="py-3">{entry.name}</td>
                <td>{entry.role}</td>
                <td>{entry.last_seen ? new Date(entry.last_seen).toLocaleString() : 'Unknown'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
