import React, { useMemo, useState } from 'react';
import { Sale, CashClosure, PaymentMethod, Expense } from '../types';
import { Wallet, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CashRegisterProps {
  sales: Sale[];
  expenses: Expense[];
  closures: CashClosure[];
  onCloseRegister: (closure: CashClosure) => void;
  lastClosureDate: Date | null;
}

export const CashRegister: React.FC<CashRegisterProps> = ({ sales, expenses, closures, onCloseRegister, lastClosureDate }) => {
  const [notes, setNotes] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const currentSales = useMemo(() => lastClosureDate ? sales.filter(s => new Date(s.date) > lastClosureDate) : sales, [sales, lastClosureDate]);
  const currentExpenses = useMemo(() => lastClosureDate ? expenses.filter(e => new Date(e.date) > lastClosureDate) : expenses, [expenses, lastClosureDate]);

  const stats = useMemo(() => {
    const salesCash = currentSales.filter(s => s.paymentMethod === PaymentMethod.CASH).reduce((a, s) => a + s.total, 0);
    const salesDigital = currentSales.filter(s => s.paymentMethod !== PaymentMethod.CASH).reduce((a, s) => a + s.total, 0);
    const expensesCash = currentExpenses.filter(e => e.paymentMethod === PaymentMethod.CASH).reduce((a, e) => a + e.amount, 0);
    const totalExpenses = currentExpenses.reduce((a, e) => a + e.amount, 0);
    
    return {
      totalSales: salesCash + salesDigital,
      salesCash,
      salesDigital,
      totalExpenses,
      netCash: salesCash - expensesCash,
      count: currentSales.length
    };
  }, [currentSales, currentExpenses]);

  const handleClose = () => {
    if (!confirm(`Cerrar caja con $${stats.netCash.toLocaleString()} en efectivo?`)) return;
    onCloseRegister({
      id: uuidv4(),
      date: new Date().toISOString(),
      totalSales: stats.totalSales,
      totalExpenses: stats.totalExpenses,
      totalCash: stats.netCash,
      totalDigital: stats.salesDigital,
      transactionCount: stats.count,
      notes
    });
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Cierre de Caja</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500 text-sm">Efectivo en Caja (Neto)</div>
          <div className="text-3xl font-bold text-green-600">${stats.netCash.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm">Digital / Bancos</div>
          <div className="text-3xl font-bold text-blue-600">${stats.salesDigital.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
          <div className="text-gray-500 text-sm">Gastos / Salidas</div>
          <div className="text-3xl font-bold text-red-600">${stats.totalExpenses.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="font-bold mb-2">Realizar Cierre</h3>
        <div className="flex gap-4">
          <input className="flex-1 p-3 border rounded-lg" placeholder="Notas del cierre..." value={notes} onChange={e => setNotes(e.target.value)} />
          <button onClick={handleClose} className="bg-brand-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-700 flex items-center gap-2">
            <Wallet size={20}/> Cerrar Caja
          </button>
        </div>
      </div>

      <div className="pt-4">
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-gray-500">{showHistory ? <ChevronUp/> : <ChevronDown/>} Historial ({closures.length})</button>
        {showHistory && (
          <div className="bg-white mt-4 rounded-xl shadow overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50"><tr><th className="p-4">Fecha</th><th className="p-4">Efec.</th><th className="p-4">Dig.</th><th className="p-4">Gastos</th><th className="p-4">Notas</th></tr></thead>
              <tbody>
                {[...closures].reverse().map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="p-4 text-sm flex items-center gap-2"><Calendar size={14}/> {new Date(c.date).toLocaleString()}</td>
                    <td className="p-4 text-green-600 font-medium">${c.totalCash}</td>
                    <td className="p-4 text-blue-600">${c.totalDigital}</td>
                    <td className="p-4 text-red-500">${c.totalExpenses}</td>
                    <td className="p-4 text-gray-500 text-sm">{c.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};