import React, { useState } from 'react';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';
import { Trash2, Plus, TrendingDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ExpensesProps {
  expenses: Expense[];
  isAdmin: boolean;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, isAdmin, onAddExpense, onDeleteExpense }) => {
  const [form, setForm] = useState<Partial<Expense>>({ category: 'Local', paymentMethod: PaymentMethod.CASH });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    onAddExpense({
      id: uuidv4(),
      date: new Date().toISOString(),
      description: form.description,
      amount: Number(form.amount),
      category: form.category as ExpenseCategory,
      paymentMethod: form.paymentMethod as PaymentMethod
    });
    setForm({ category: 'Local', paymentMethod: PaymentMethod.CASH, description: '', amount: 0 });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Gastos y Salidas</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500">Descripción</label>
          <input className="w-full p-2 border rounded" required value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} placeholder="Ej: Adelanto sueldo"/>
        </div>
        <div className="w-32">
          <label className="text-xs text-gray-500">Monto</label>
          <input type="number" className="w-full p-2 border rounded" required value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
        </div>
        <div className="w-40">
          <label className="text-xs text-gray-500">Categoría</label>
          <select className="w-full p-2 border rounded bg-white" value={form.category} onChange={e => setForm({...form, category: e.target.value as ExpenseCategory})}>
            {['Local','Sueldos','Mercadería','Servicios','Otros'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="w-40">
          <label className="text-xs text-gray-500">Medio</label>
          <select className="w-full p-2 border rounded bg-white" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value as PaymentMethod})}>
            {Object.values(PaymentMethod).map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600 flex gap-2"><TrendingDown size={20}/> Registrar</button>
      </form>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50"><tr><th className="p-4">Fecha</th><th className="p-4">Desc</th><th className="p-4">Cat</th><th className="p-4">Monto</th><th className="p-4"></th></tr></thead>
          <tbody>
            {[...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(e => (
              <tr key={e.id} className="border-t hover:bg-red-50">
                <td className="p-4 text-sm">{new Date(e.date).toLocaleDateString()}</td>
                <td className="p-4 font-medium">{e.description}</td>
                <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{e.category}</span></td>
                <td className="p-4 font-bold text-red-600">-${e.amount}</td>
                <td className="p-4 text-right">
                  {isAdmin && <button onClick={() => onDeleteExpense(e.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};