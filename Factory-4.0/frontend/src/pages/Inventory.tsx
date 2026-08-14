import { useEffect, useState } from 'react';
import { getInventory, reorderInventory, refillInventory } from '../api';
import { AlertTriangle, Package, RefreshCw, Truck } from 'lucide-react';

export default function Inventory() {
  const [inventory, setInventory] = useState<any[]>([]);

  const refreshInventory = async () => {
    const data = await getInventory();
    setInventory(data);
  };

  const handleReorder = async (itemId: number) => {
    await reorderInventory(itemId);
    await refreshInventory();
  };

  const handleRefill = async (itemId: number) => {
    await refillInventory(itemId);
    await refreshInventory();
  };

  useEffect(() => {
    refreshInventory();
    const interval = setInterval(refreshInventory, 5000);
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
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => {
              const critical = Number(item.quantity ?? 0) <= Number(item.reorder_level ?? 0) * 0.3;
              const refilledRecently = !!item.last_restocked_at;

              return (
                <tr key={item.item_id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="p-4 flex items-center gap-2">
                    <Package size={16} className="text-slate-400" />
                    {item.name}
                  </td>
                  <td className="p-4 text-slate-300">{item.supplier_name}</td>
                  <td className="p-4 font-mono">{item.quantity}</td>
                  <td className="p-4 font-mono text-slate-400">{item.reorder_level}</td>
                  <td className="p-4">
                    {critical ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-warning/20 text-warning text-xs font-bold">
                        <AlertTriangle size={14} /> 70% DEPLETED
                      </span>
                    ) : refilledRecently ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-success/20 text-success text-xs font-bold">
                        <Truck size={14} /> REFILLED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-success/20 text-success text-xs font-bold">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleReorder(item.item_id)}
                        className="inline-flex items-center gap-1 bg-warning/20 text-warning px-2 py-1 rounded-md text-xs font-medium hover:bg-warning/30"
                      >
                        <RefreshCw size={12} /> Reorder
                      </button>
                      <button
                        onClick={() => handleRefill(item.item_id)}
                        className="inline-flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded-md text-xs font-medium hover:bg-primary/30"
                      >
                        <Truck size={12} /> Refilled
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {inventory.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">No inventory items found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
