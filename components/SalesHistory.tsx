import React from 'react';
import { Sale } from '../types';
import { Clock, CreditCard, Search } from 'lucide-react';

interface SalesHistoryProps {
  sales: Sale[];
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ sales }) => {
  // Reverse sales to show newest first
  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Historial de Ventas</h1>
        <p className="text-gray-500">Registro completo de caja</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Fecha / Hora</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Productos</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Método de Pago</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedSales.length === 0 ? (
                 <tr><td colSpan={4} className="text-center py-8 text-gray-400">No hay ventas registradas aún</td></tr>
              ) : (
                sortedSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-800">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-600">
                            <span className="font-bold">{item.quantity}x</span> {item.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                        <CreditCard className="w-3 h-3" />
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-gray-800">${sale.total.toLocaleString()}</span>
                      {sale.discount > 0 && (
                        <div className="text-xs text-green-600">Desc: -${sale.discount.toLocaleString()}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};