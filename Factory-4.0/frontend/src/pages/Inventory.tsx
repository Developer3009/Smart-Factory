import { useEffect, useState } from 'react';
import { getInventory } from '../api';
import { AlertTriangle, Package } from 'lucide-react';

export default function Inventory() {
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setInventory(await getInventory());
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Inventory</h1>
      
      <div className="bg-surface rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              <th className="p-4 font-semibold">Item Name</th>
              <th className="p-4 font-semibold">Supplier</th>
              <th className="p-4 font-semibold">Quantity</th>
              <th className="p-4 font-semibold">Reorder Level</th>
              <th className="p-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.item_id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                <td className="p-4 flex items-center gap-2">
                  <Package size={16} className="text-slate-400" />
                  {item.name}
                </td>
                <td className="p-4 text-slate-300">{item.supplier_name}</td>
                <td className="p-4 font-mono">{item.quantity}</td>
                <td className="p-4 font-mono text-slate-400">{item.reorder_level}</td>
                <td className="p-4">
                  {item.reorder_flag ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-warning/20 text-warning text-xs font-bold">
                      <AlertTriangle size={14} /> REORDER
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-success/20 text-success text-xs font-bold">
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">No inventory items found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
