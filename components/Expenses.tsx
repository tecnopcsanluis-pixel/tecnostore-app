
import React, { useState } from 'react';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';
import { TrendingDown, Plus, Trash2, Calendar, DollarSign } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [form, setForm] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    category: 'Local',
    paymentMethod: PaymentMethod.CASH
  });

  // Sort expenses (Newest first)
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;

    const newExpense: Expense = {
      id: uuidv4(),
      date: new Date().toISOString(),
      description: form.description,
      amount: Number(form.amount),
      category: form.category as ExpenseCategory,
      paymentMethod: form.paymentMethod as PaymentMethod
    };

    onAddExpense(newExpense);
    setForm({ description: '', amount: 0, category: 'Local', paymentMethod: PaymentMethod.CASH });
  };

  const categories: ExpenseCategory[] = ['Local', 'Sueldos', 'Mercadería', 'Servicios', 'Otros'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Gastos</h1>
        <p className="text-gray-500">Registra salidas de dinero, sueldos y pagos.</p>
      </div>

      {/* Add Expense Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand-500" />
          Nuevo Gasto / Retiro
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input 
              type="text" 
              required
              placeholder="Ej: Adelanto sueldo Juan, Pago Luz..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
            <input 
              type="number" 
              required
              min="0"
              placeholder="0.00"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              value={form.amount || ''}
              onChange={e => setForm({...form, amount: parseFloat(e.target.value)})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value as ExpenseCategory})}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medio de Pago</label>
            <select 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white"
              value={form.paymentMethod}
              onChange={e => setForm({...form, paymentMethod: e.target.value as PaymentMethod})}
            >
               {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="lg:col-span-5 flex justify-end mt-2">
            <button 
              type="submit" 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-red-500/30 transition flex items-center gap-2"
            >
              <TrendingDown className="w-5 h-5" />
              Registrar Egreso
            </button>
          </div>
        </form>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
           <h3 className="font-bold text-gray-700">Últimos Movimientos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Fecha</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Descripción</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Categoría</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Pago con</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Monto</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedExpenses.length === 0 ? (
                 <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay gastos registrados</td></tr>
              ) : (
                sortedExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-red-50/30 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{new Date(expense.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">{expense.description}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium 
                        ${expense.category === 'Sueldos' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}
                      `}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{expense.paymentMethod}</td>
                    <td className="px-6 py-4 text-right text-red-600 font-bold">
                      -${expense.amount.toLocaleString()}
                    </td>
                     <td className="px-6 py-4 text-right">
                       <button 
                          onClick={() => onDeleteExpense(expense.id)}
                          className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
                          title="Eliminar Registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
