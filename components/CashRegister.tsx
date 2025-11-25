import React, { useMemo, useState, useEffect } from 'react';
import { Sale, CashClosure, PaymentMethod, Expense, CompanySettings, CashOpening } from '../types';
import { Wallet, Calendar, ChevronDown, ChevronUp, Printer, Trash2, ArrowRightCircle, Lock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CashRegisterProps {
  sales: Sale[];
  expenses: Expense[];
  closures: CashClosure[];
  openings: CashOpening[];
  settings: CompanySettings;
  isAdmin: boolean;
  onOpenRegister: (opening: CashOpening) => void;
  onCloseRegister: (closure: CashClosure) => void;
  onDeleteClosure: (id: string) => void;
}

export const CashRegister: React.FC<CashRegisterProps> = ({ 
  sales, expenses, closures, openings, settings, isAdmin, 
  onOpenRegister, onCloseRegister, onDeleteClosure 
}) => {
  const [notes, setNotes] = useState('');
  const [openingAmount, setOpeningAmount] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);

  const lastClosure = useMemo(() => {
    if (!closures.length) return null;
    return [...closures].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [closures]);

  const lastOpening = useMemo(() => {
    if (!openings.length) return null;
    return [...openings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [openings]);

  const isRegisterOpen = useMemo(() => {
    if (!lastOpening) return false;
    if (!lastClosure) return true;
    return new Date(lastOpening.date) > new Date(lastClosure.date);
  }, [lastOpening, lastClosure]);

  useEffect(() => {
    if (!isRegisterOpen && lastClosure) {
      setOpeningAmount(lastClosure.totalCash.toString());
    } else if (!isRegisterOpen && !lastClosure) {
        setOpeningAmount('0');
    }
  }, [isRegisterOpen, lastClosure]);

  const currentSales = useMemo(() => {
    const cutOffDate = lastClosure ? new Date(lastClosure.date) : new Date(0);
    return sales.filter(s => new Date(s.date) > cutOffDate);
  }, [sales, lastClosure]);

  const currentExpenses = useMemo(() => {
    const cutOffDate = lastClosure ? new Date(lastClosure.date) : new Date(0);
    return expenses.filter(e => new Date(e.date) > cutOffDate);
  }, [expenses, lastClosure]);

  const stats = useMemo(() => {
    const initial = isRegisterOpen && lastOpening ? lastOpening.amount : 0;
    const salesCash = currentSales.filter(s => s.paymentMethod === PaymentMethod.CASH).reduce((a, s) => a + s.total, 0);
    const salesDigital = currentSales.filter(s => s.paymentMethod !== PaymentMethod.CASH).reduce((a, s) => a + s.total, 0);
    const totalExpenses = currentExpenses.reduce((a, e) => a + e.amount, 0);
    const expensesCash = currentExpenses.filter(e => e.paymentMethod === PaymentMethod.CASH).reduce((a, e) => a + e.amount, 0);
    const netCash = initial + salesCash - expensesCash;

    return {
      initial,
      totalSales: salesCash + salesDigital,
      salesCash,
      salesDigital,
      totalExpenses,
      netCash,
      count: currentSales.length
    };
  }, [currentSales, currentExpenses, isRegisterOpen, lastOpening]);

  const handleOpen = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(openingAmount);
    if (isNaN(amount)) return alert('Ingrese un monto válido');

    if (lastClosure && amount !== lastClosure.totalCash && !notes.trim()) {
      if(!confirm('El monto inicial es diferente al último cierre. ¿Desea continuar sin justificar en las notas?')) return;
    }

    const newOpening: CashOpening = {
      id: uuidv4(),
      date: new Date().toISOString(),
      amount: amount,
      notes: notes
    };
    onOpenRegister(newOpening);
    setNotes('');
    alert('Caja Abierta Exitosamente');
  };

  const handleClose = () => {
    if (!confirm(`¿Confirmar cierre de caja?\n\nDebería haber: $${stats.netCash.toLocaleString()} en efectivo.`)) return;
    const closure: CashClosure = {
      id: uuidv4(),
      date: new Date().toISOString(),
      initialAmount: stats.initial,
      totalSales: stats.totalSales,
      totalExpenses: stats.totalExpenses,
      totalCash: stats.netCash,
      totalDigital: stats.salesDigital,
      transactionCount: stats.count,
      notes
    };
    onCloseRegister(closure);
    printClosure({...closure, salesCash: stats.salesCash});
    setNotes('');
  };

  const printClosure = (closureData: any, isPreview = false) => {
    const win = window.open('', 'PRINT', 'height=600,width=400');
    if (!win) return;
    win.document.write(`
      <html><head><style>
        body{font-family:monospace;padding:20px}.header{text-align:center;margin-bottom:20px}.row{display:flex;justify-content:space-between;margin-bottom:5px}hr{border-top:1px dashed black}h2{text-align:center;margin-top:10px}
      </style></head><body>
        <div class="header"><h3>${settings?.name||'TecnoStore'}</h3><p>REPORTE DE CIERRE ${isPreview?'(PARCIAL)':''}</p><p>${new Date().toLocaleString()}</p></div><hr/>
        <div class="row"><span>Saldo Inicial:</span><span>$${closureData.initialAmount||stats.initial||0}</span></div><hr/>
        <div class="row"><span>(+) Ventas Efec:</span><span>$${closureData.salesCash||0}</span></div>
        <div class="row"><span>(+) Ventas Dig:</span><span>$${closureData.totalDigital||0}</span></div>
        <div class="row" style="margin-bottom:10px"><span>(=) Ingresos:</span><span>$${(closureData.salesCash||0)+(closureData.totalDigital||0)}</span></div>
        <div class="row"><span>(-) Gastos:</span><span>-$${closureData.totalExpenses}</span></div><hr/>
        <h2>EFECTIVO CAJA: $${closureData.totalCash||closureData.netCash}</h2>
        <p>Notas: ${closureData.notes||'-'}</p>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          {isRegisterOpen ? <span className="text-green-600">● Caja Abierta</span> : <span className="text-red-500">● Caja Cerrada</span>}
        </h1>
        {isRegisterOpen && <button onClick={() => printClosure(stats, true)} className="flex items-center gap-2 text-brand-600 bg-brand-50 px-3 py-2 rounded-lg font-medium"><Printer size={18}/> Previsualizar</button>}
      </div>

      {!isRegisterOpen ? (
        <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-brand-500 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ArrowRightCircle/> Iniciar Jornada</h2>
          <form onSubmit={handleOpen} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Efectivo Inicial ($)</label>
              <input type="number" className="w-full p-4 text-2xl font-bold border rounded-xl text-brand-700 bg-brand-50 outline-none" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} required />
              {lastClosure && Number(openingAmount) !== lastClosure.totalCash && <p className="text-xs text-orange-600 mt-1 font-bold">⚠️ Difiere del último cierre (${lastClosure.totalCash}).</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <input className="w-full p-3 border rounded-xl" placeholder="Ej: Cambio..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <button type="submit" className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 shadow-lg">ABRIR CAJA</button>
          </form>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-gray-500 text-xs font-bold uppercase">Saldo Inicial</div>
              <div className="text-2xl font-bold text-gray-700">${stats.initial.toLocaleString()}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
              <div className="text-gray-500 text-xs font-bold uppercase">Efectivo Neto</div>
              <div className="text-3xl font-bold text-green-600">${stats.netCash.toLocaleString()}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
              <div className="text-gray-500 text-xs font-bold uppercase">Digital</div>
              <div className="text-3xl font-bold text-blue-600">${stats.salesDigital.toLocaleString()}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
              <div className="text-gray-500 text-xs font-bold uppercase">Gastos</div>
              <div className="text-3xl font-bold text-red-600">${stats.totalExpenses.toLocaleString()}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold mb-4 text-gray-800 flex items-center gap-2"><Lock size={18}/> Finalizar Jornada</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">Notas</label><input className="w-full p-3 border rounded-lg bg-gray-50" value={notes} onChange={e => setNotes(e.target.value)} /></div>
              <button onClick={handleClose} className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 flex items-center gap-2 shadow-lg"><Wallet size={20}/> CERRAR CAJA</button>
            </div>
          </div>
        </>
      )}

      <div className="pt-8 border-t">
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 transition font-medium">{showHistory ? <ChevronUp/> : <ChevronDown/>} Historial ({closures.length})</button>
        {showHistory && (
          <div className="bg-white mt-4 rounded-xl shadow overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm"><tr><th className="p-4">Fecha</th><th className="p-4">Inicial</th><th className="p-4">Efec. Final</th><th className="p-4">Dig.</th><th className="p-4">Gastos</th><th className="p-4"></th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {[...closures].reverse().map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-sm flex items-center gap-2"><Calendar size={14}/> {new Date(c.date).toLocaleString()}</td>
                    <td className="p-4">${c.initialAmount||0}</td>
                    <td className="p-4 text-green-600 font-bold">${c.totalCash}</td>
                    <td className="p-4 text-blue-600">${c.totalDigital}</td>
                    <td className="p-4 text-red-500">${c.totalExpenses}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                       <button onClick={() => printClosure(c)} className="text-gray-400 hover:text-gray-800 p-2"><Printer size={16}/></button>
                       {isAdmin && <button onClick={() => {if(confirm('¿Eliminar?')) onDeleteClosure(c.id)}} className="text-red-300 hover:text-red-600 p-2"><Trash2 size={16}/></button>}
                    </td>
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