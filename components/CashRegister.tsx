
import React, { useMemo, useState } from 'react';
import { Sale, CashClosure, PaymentMethod, Expense } from '../types';
import { Calculator, DollarSign, CreditCard, Wallet, ChevronDown, ChevronUp, Calendar, TrendingDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CashRegisterProps {
  sales: Sale[];
  expenses: Expense[]; // Added expenses prop
  closures: CashClosure[];
  onCloseRegister: (closure: CashClosure) => void;
  lastClosureDate: Date | null;
}

export const CashRegister: React.FC<CashRegisterProps> = ({ sales, expenses, closures, onCloseRegister, lastClosureDate }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [notes, setNotes] = useState('');

  // Filter sales that happened AFTER the last closure
  const currentSessionSales = useMemo(() => {
    if (!lastClosureDate) return sales;
    return sales.filter(sale => new Date(sale.date).getTime() > lastClosureDate.getTime());
  }, [sales, lastClosureDate]);

  // Filter expenses that happened AFTER the last closure
  const currentSessionExpenses = useMemo(() => {
    if (!lastClosureDate) return expenses;
    return expenses.filter(exp => new Date(exp.date).getTime() > lastClosureDate.getTime());
  }, [expenses, lastClosureDate]);

  // Calculate totals for current session
  const sessionStats = useMemo(() => {
    let totalSales = 0;
    let salesCash = 0;
    let salesDigital = 0;

    currentSessionSales.forEach(sale => {
      totalSales += sale.total;
      if (sale.paymentMethod === PaymentMethod.CASH) {
        salesCash += sale.total;
      } else {
        salesDigital += sale.total;
      }
    });

    let totalExpenses = 0;
    let expensesCash = 0;
    
    currentSessionExpenses.forEach(exp => {
        totalExpenses += exp.amount;
        if (exp.paymentMethod === PaymentMethod.CASH) {
            expensesCash += exp.amount;
        }
        // We don't subtract digital expenses from "Cash in Drawer", but we track total expenses
    });

    // Net Cash in Drawer = Cash Sales - Cash Expenses
    const netCashInDrawer = salesCash - expensesCash;

    return { 
        totalSales, 
        salesCash, 
        salesDigital, 
        transactionCount: currentSessionSales.length,
        totalExpenses,
        expensesCash,
        netCashInDrawer
    };
  }, [currentSessionSales, currentSessionExpenses]);

  const handleCloseRegister = () => {
    if (sessionStats.transactionCount === 0 && sessionStats.totalExpenses === 0) {
      if (!window.confirm("No hay movimientos en esta sesión. ¿Desea cerrar caja en $0?")) return;
    } else {
        if (!window.confirm(`¿Confirmar cierre?\nTotal Caja (Efectivo): $${sessionStats.netCashInDrawer.toLocaleString()}`)) return;
    }

    const closure: CashClosure = {
      id: uuidv4(),
      date: new Date().toISOString(),
      totalSales: sessionStats.totalSales,
      totalExpenses: sessionStats.totalExpenses,
      totalCash: sessionStats.netCashInDrawer, // What is physically in the box
      totalDigital: sessionStats.salesDigital,
      transactionCount: sessionStats.transactionCount,
      notes: notes
    };

    onCloseRegister(closure);
    setNotes('');
  };

  // Format Date Helper
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('es-AR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Caja y Cierre</h1>
        <p className="text-gray-500">
            {lastClosureDate 
                ? `Sesión actual iniciada el ${formatDate(lastClosureDate.toISOString())}` 
                : 'Primera sesión del sistema'}
        </p>
      </div>

      {/* Current Session Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Cash in Drawer */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10">
                <DollarSign className="w-24 h-24 text-green-500" />
            </div>
            <div>
                <p className="text-gray-500 font-medium">Efectivo en Caja</p>
                <h3 className={`text-3xl font-bold mt-2 ${sessionStats.netCashInDrawer < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    ${sessionStats.netCashInDrawer.toLocaleString()}
                </h3>
            </div>
            <div className="mt-4 text-xs text-gray-500">
                Ventas Efec. (${sessionStats.salesCash.toLocaleString()}) - Gastos Efec. (${sessionStats.expensesCash.toLocaleString()})
            </div>
        </div>

        {/* Digital Sales */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute right-0 top-0 p-4 opacity-10">
                <CreditCard className="w-24 h-24 text-brand-500" />
            </div>
             <div>
                <p className="text-gray-500 font-medium">Ventas Digitales</p>
                <h3 className="text-3xl font-bold text-brand-600 mt-2">${sessionStats.salesDigital.toLocaleString()}</h3>
            </div>
             <div className="mt-4 text-xs text-brand-700 bg-brand-50 p-1 rounded w-fit">
                Bancos / Billeteras
            </div>
        </div>

        {/* Expenses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute right-0 top-0 p-4 opacity-10">
                <TrendingDown className="w-24 h-24 text-red-500" />
            </div>
             <div>
                <p className="text-gray-500 font-medium">Total Gastos / Salidas</p>
                <h3 className="text-3xl font-bold text-red-600 mt-2">${sessionStats.totalExpenses.toLocaleString()}</h3>
            </div>
             <div className="mt-4 text-xs text-red-700 bg-red-50 p-1 rounded w-fit">
                Sueldos, Mercadería, etc.
            </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white">
            <div className="absolute right-0 top-0 p-4 opacity-10">
                <Calculator className="w-24 h-24 text-white" />
            </div>
             <div>
                <p className="text-gray-300 font-medium">Ventas Brutas</p>
                <h3 className="text-3xl font-bold text-white mt-2">${sessionStats.totalSales.toLocaleString()}</h3>
            </div>
             <div className="mt-4 text-xs text-gray-400">
                {sessionStats.transactionCount} ventas registradas
            </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg mb-4 text-gray-800">Realizar Cierre de Caja</h3>
        <div className="flex flex-col md:flex-row gap-4 items-start">
            <textarea 
                className="flex-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none resize-none h-24"
                placeholder="Notas del cierre (diferencias, observaciones...)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
            ></textarea>
            <button 
                onClick={handleCloseRegister}
                className="px-8 py-4 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition flex items-center gap-2 h-24 justify-center w-full md:w-auto"
            >
                <Wallet className="w-6 h-6" />
                <span>Cerrar Caja<br/><span className="text-xs font-normal opacity-80">Generar reporte</span></span>
            </button>
        </div>
      </div>

      {/* History Toggle */}
      <div className="pt-4">
        <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-gray-500 hover:text-brand-600 font-medium transition"
        >
            {showHistory ? <ChevronUp /> : <ChevronDown />}
            Historial de Cierres ({closures.length})
        </button>

        {showHistory && (
            <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Fecha Cierre</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Efectivo (Neto)</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Ventas Dig.</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-red-600">Gastos</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Total Ventas</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Notas</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {[...closures].reverse().map((closure) => (
                            <tr key={closure.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-800">{formatDate(closure.date)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-green-600 font-medium">${closure.totalCash.toLocaleString()}</td>
                                <td className="px-6 py-4 text-brand-600 font-medium">${closure.totalDigital.toLocaleString()}</td>
                                <td className="px-6 py-4 text-red-500 font-medium">
                                  {closure.totalExpenses ? `-$${closure.totalExpenses.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-800">${closure.totalSales.toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 italic truncate max-w-xs">{closure.notes || '-'}</td>
                            </tr>
                        ))}
                        {closures.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay cierres previos</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
