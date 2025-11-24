import React from 'react';
import { Sale } from '../types';
import { Clock, CreditCard } from 'lucide-react';

export const SalesHistory: React.FC<{ sales: Sale[] }> = ({ sales }) => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">Historial</h1>
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50"><tr><th className="p-4">Fecha</th><th className="p-4">Detalle</th><th className="p-4">Pago</th><th className="p-4 text-right">Total</th></tr></thead>
        <tbody>
          {[...sales].reverse().map(s => (
            <tr key={s.id} className="border-t hover:bg-gray-50">
              <td className="p-4 text-sm flex items-center gap-2"><Clock size={14}/> {new Date(s.date).toLocaleString()}</td>
              <td className="p-4 text-sm">{s.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
              <td className="p-4"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">{s.paymentMethod}</span></td>
              <td className="p-4 text-right font-bold">${s.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);