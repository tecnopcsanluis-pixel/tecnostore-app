import React, { useState, useMemo } from 'react';
import { Sale, CompanySettings } from '../types';
import { Clock, Printer, Trash2, ArrowUpDown } from 'lucide-react';

interface HistoryProps {
  sales: Sale[];
  isAdmin: boolean;
  settings: CompanySettings;
  onDeleteSale: (id: string) => void;
}

export const SalesHistory: React.FC<HistoryProps> = ({ sales, isAdmin, settings, onDeleteSale }) => {
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'amount_desc'>('date_desc');

  const sortedSales = useMemo(() => {
    const list = [...sales];
    list.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (sortOrder === 'date_desc') return dateB - dateA;
      if (sortOrder === 'date_asc') return dateA - dateB;
      if (sortOrder === 'amount_desc') return b.total - a.total;
      return 0;
    });
    return list;
  }, [sales, sortOrder]);

  const printTicket = (sale: Sale) => {
    const win = window.open('', 'PRINT', 'height=600,width=400');
    if (!win) return;
    
    win.document.write(`
      <html><head><style>
        body{font-family:monospace;padding:20px;text-align:center}.header{margin-bottom:20px}.item{display:flex;justify-content:space-between;margin-bottom:5px;font-size:12px}.total{font-weight:bold;font-size:16px;margin-top:10px;border-top:1px dashed black;padding-top:10px}.footer{margin-top:20px;font-size:10px}hr{border-top:1px dashed black}
      </style></head><body>
        <div class="header"><h3>${settings?.name||'TecnoStore'}</h3><p>${settings?.address||''}<br/>${settings?.phone||''}</p><p><strong>REIMPRESIÓN</strong></p></div><hr/>
        <div style="text-align:left;font-size:12px;margin:10px 0;">Fecha: ${new Date(sale.date).toLocaleString()}<br/>Ticket: #${sale.id.slice(0, 8)}<br/>Pago: ${sale.paymentMethod}</div><hr/>
        <div class="items">${sale.items.map(i => `<div class="item"><span>${i.quantity} x ${i.name}</span><span>$${(i.price * i.quantity).toLocaleString()}</span></div>`).join('')}</div><hr/>
        <div class="total">TOTAL: $${sale.total.toLocaleString()}</div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handleDelete = (id: string) => {
    if (confirm('ATENCIÓN: ¿Borrar esta venta del historial? Esto no devuelve el stock automáticamente.')) {
      onDeleteSale(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Historial de Ventas</h1>
        <div className="flex gap-2">
          <button onClick={() => setSortOrder('date_desc')} className={`px-3 py-1 rounded text-xs font-bold ${sortOrder === 'date_desc' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>Más Recientes</button>
          <button onClick={() => setSortOrder('date_asc')} className={`px-3 py-1 rounded text-xs font-bold ${sortOrder === 'date_asc' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>Más Antiguas</button>
          <button onClick={() => setSortOrder('amount_desc')} className={`px-3 py-1 rounded text-xs font-bold ${sortOrder === 'amount_desc' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>Mayor Monto</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50"><tr><th className="p-4">Fecha</th><th className="p-4">Detalle</th><th className="p-4">Pago</th><th className="p-4">Total</th><th className="p-4"></th></tr></thead>
          <tbody>
            {sortedSales.map(s => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="p-4 text-sm flex items-center gap-2"><Clock size={14}/> {new Date(s.date).toLocaleString()}</td>
                <td className="p-4 text-sm">{s.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                <td className="p-4"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">{s.paymentMethod}</span></td>
                <td className="p-4 font-bold">${s.total}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => printTicket(s)} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg"><Printer size={16}/></button>
                  {isAdmin && <button onClick={() => handleDelete(s.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
