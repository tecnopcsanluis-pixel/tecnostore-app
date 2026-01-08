import React, { useMemo, useState, useEffect } from 'react';
import { Sale, CashClosure, PaymentMethod, Expense, CompanySettings, CashOpening, Product } from '../types';
import { Wallet, Calendar, ChevronDown, ChevronUp, Printer, Trash2, ArrowRightCircle, Lock, CreditCard, Banknote, QrCode, ArrowRightLeft, Send, Edit, Plus, Minus, X, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CashRegisterProps {
  sales: Sale[];
  expenses: Expense[];
  closures: CashClosure[];
  openings: CashOpening[];
  settings: CompanySettings;
  isAdmin: boolean;
  products?: Product[];
  onOpenRegister: (opening: CashOpening) => void;
  onCloseRegister: (closure: CashClosure) => void;
  onDeleteClosure: (id: string) => void;
  onDeleteSale?: (id: string) => void;
  onUpdateSale?: (sale: Sale) => void;
}

export const CashRegister: React.FC<CashRegisterProps> = ({ 
  sales, expenses, closures, openings, settings, isAdmin, products = [],
  onOpenRegister, onCloseRegister, onDeleteClosure, onDeleteSale, onUpdateSale
}) => {
  const [notes, setNotes] = useState('');
  const [openingAmount, setOpeningAmount] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  
  // Estado para la edición
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [productSearch, setProductSearch] = useState('');

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
    const salesDebit = currentSales.filter(s => s.paymentMethod === PaymentMethod.DEBIT).reduce((a, s) => a + s.total, 0);
    const salesCredit = currentSales.filter(s => s.paymentMethod === PaymentMethod.CREDIT).reduce((a, s) => a + s.total, 0);
    const salesTransfer = currentSales.filter(s => s.paymentMethod === PaymentMethod.TRANSFER).reduce((a, s) => a + s.total, 0);
    const salesQR = currentSales.filter(s => s.paymentMethod === PaymentMethod.QR).reduce((a, s) => a + s.total, 0);
    
    const salesDigitalTotal = salesDebit + salesCredit + salesTransfer + salesQR;
    
    const totalExpenses = currentExpenses.reduce((a, e) => a + e.amount, 0);
    const expensesCash = currentExpenses.filter(e => e.paymentMethod === PaymentMethod.CASH).reduce((a, e) => a + e.amount, 0);
    
    const netCash = initial + salesCash - expensesCash;

    return {
      initial,
      totalSales: salesCash + salesDigitalTotal,
      salesCash,
      salesDebit,
      salesCredit,
      salesTransfer,
      salesQR,
      salesDigitalTotal,
      totalExpenses,
      expensesCash,
      netCash,
      count: currentSales.length
    };
  }, [currentSales, currentExpenses, isRegisterOpen, lastOpening]);

  // --- Lógica del Editor ---

  const recalculateTotal = (sale: Sale): Sale => {
    const subtotal = sale.items.reduce((acc, item) => acc + ((item.appliedPrice || item.price) * item.quantity), 0);
    const total = subtotal - (sale.discount || 0) + (sale.surcharge || 0);
    return { ...sale, total };
  };

  const handleEditQuantity = (index: number, change: number) => {
    if (!editingSale) return;
    const newItems = [...editingSale.items];
    const item = newItems[index];
    
    const newQty = item.quantity + change;
    if (newQty > 0) {
      item.quantity = newQty;
      setEditingSale(recalculateTotal({ ...editingSale, items: newItems }));
    }
  };

  const handleRemoveItem = (index: number) => {
    if (!editingSale) return;
    const newItems = editingSale.items.filter((_, i) => i !== index);
    setEditingSale(recalculateTotal({ ...editingSale, items: newItems }));
  };

  const handleAddItem = (product: Product) => {
    if (!editingSale) return;
    const existingIndex = editingSale.items.findIndex(i => i.id === product.id);
    
    let newItems = [...editingSale.items];
    if (existingIndex >= 0) {
      newItems[existingIndex].quantity += 1;
    } else {
      newItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        // --- FIX APLICADO AQUÍ: Agregamos category y stock ---
        category: product.category,
        stock: product.stock
      });
    }
    setEditingSale(recalculateTotal({ ...editingSale, items: newItems }));
    setProductSearch('');
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  // --- Fin Lógica Editor ---

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

  const handleWhatsApp = (closureData: any) => {
    if (!settings.whatsappNumber) {
      alert('Configura el número de WhatsApp en "Configuración" primero.');
      return;
    }
    
    const text = `*REPORTE CIERRE DE CAJA*
*${settings.name}*
----------------------------------
Fecha: ${new Date().toLocaleString()}
----------------------------------

*SALDO INICIAL*
Efectivo al abrir: $${closureData.initialAmount || stats.initial}

----------------------------------
*VENTAS DEL DIA*
----------------------------------
Efectivo: $${closureData.salesCash || stats.salesCash}
Debito: $${stats.salesDebit}
Credito: $${stats.salesCredit}
Transferencia: $${stats.salesTransfer}
QR / Billetera: $${stats.salesQR}

*TOTAL VENTAS: $${closureData.totalSales || stats.totalSales}*

----------------------------------
*EGRESOS*
----------------------------------
Gastos en efectivo: $${closureData.totalExpenses || stats.totalExpenses}

----------------------------------
*RESUMEN FINAL*
----------------------------------
*EFECTIVO EN CAJA: $${closureData.totalCash || stats.netCash}*

${closureData.notes || notes ? `Observaciones: ${closureData.notes || notes}\n\n` : ''}----------------------------------
Generado por TecnoStore`;

    window.open(`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
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
      totalDigital: stats.salesDigitalTotal,
      transactionCount: stats.count,
      notes
    };
    onCloseRegister(closure);
    
    if(confirm('Caja Cerrada. ¿Enviar reporte por WhatsApp?')) {
      handleWhatsApp(closure);
    }
    
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
        <div class="row"><span>(+) Efectivo:</span><span>$${closureData.salesCash||stats.salesCash||0}</span></div>
        <div class="row"><span>(+) Digital Total:</span><span>$${closureData.totalDigital||stats.salesDigitalTotal||0}</span></div>
        <div class="row" style="margin-bottom:10px"><span>(=) Ingresos:</span><span>$${(closureData.salesCash||stats.salesCash||0)+(closureData.totalDigital||stats.salesDigitalTotal||0)}</span></div>
        <div class="row"><span>(-) Gastos:</span><span>-$${closureData.totalExpenses||stats.totalExpenses}</span></div><hr/>
        <h2>EFECTIVO CAJA: $${closureData.totalCash||closureData.netCash}</h2>
        <p>Notas: ${closureData.notes||notes||'-'}</p>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const printSaleTicket = (sale: Sale) => {
    const win = window.open('', 'PRINT', 'height=600,width=400');
    if (!win) return;
    
    win.document.write(`
      <html><head><style>
        body{font-family:monospace;padding:20px;text-align:center}.header{margin-bottom:20px}.item{display:flex;justify-content:space-between;margin-bottom:5px;font-size:12px}.total{font-weight:bold;font-size:16px;margin-top:10px;border-top:1px dashed black;padding-top:10px}.footer{margin-top:20px;font-size:10px}hr{border-top:1px dashed black}
      </style></head><body>
        <div class="header"><h3>${settings?.name||'TecnoStore'}</h3><p>${settings?.address||''}<br/>${settings?.phone||''}</p><p><strong>REIMPRESION</strong></p></div><hr/>
        <div style="text-align:left;font-size:12px;margin:10px 0;">Fecha: ${new Date(sale.date).toLocaleString()}<br/>Ticket: #${sale.id.slice(0, 8)}<br/>Pago: ${sale.paymentMethod}</div><hr/>
        <div class="items">${sale.items.map(i => `<div class="item"><span>${i.quantity} x ${i.name}</span><span>$${((i.appliedPrice || i.price) * i.quantity).toLocaleString()}</span></div>`).join('')}</div><hr/>
        ${sale.discount>0?`<div class="item"><span>Descuento</span><span>-$${sale.discount}</span></div>`:''}
        ${sale.surcharge>0?`<div class="item"><span>Recargo</span><span>+$${sale.surcharge}</span></div>`:''}
        <div class="total">TOTAL: $${sale.total.toLocaleString()}</div>
        <div class="footer"><p>${settings?.footerMessage||'Gracias'}</p></div>
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
        {isRegisterOpen && (
          <div className="flex gap-2">
             <button onClick={() => printClosure(stats, true)} className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-2 rounded-lg font-medium hover:bg-gray-200"><Printer size={18}/> Imprimir</button>
             <button onClick={() => handleWhatsApp({})} className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-2 rounded-lg font-medium hover:bg-green-200"><Send size={18}/> WhatsApp</button>
          </div>
        )}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="text-gray-500 text-xs font-bold uppercase flex items-center gap-1"><Wallet size={14}/> Inicial</div>
              <div className="text-xl font-bold text-gray-700">${stats.initial.toLocaleString()}</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
              <div className="text-gray-500 text-xs font-bold uppercase flex items-center gap-1"><Banknote size={14}/> Ventas Efec.</div>
              <div className="text-xl font-bold text-green-600">+${stats.salesCash.toLocaleString()}</div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500">
              <div className="text-gray-500 text-xs font-bold uppercase flex items-center gap-1"><ArrowRightLeft size={14}/> Gastos Efec.</div>
              <div className="text-xl font-bold text-red-600">-${stats.expensesCash.toLocaleString()}</div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-200 ring-1 ring-green-300">
              <div className="text-green-800 text-xs font-bold uppercase flex items-center gap-1">💵 EN CAJA (Teórico)</div>
              <div className="text-2xl font-bold text-green-700">${stats.netCash.toLocaleString()}</div>
            </div>
          </div>

          <h3 className="font-bold text-gray-600 text-sm uppercase tracking-wider mt-4">Medios Digitales</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
               <span className="text-xs text-blue-600 font-bold flex items-center gap-1"><CreditCard size={12}/> Débito</span>
               <span className="font-bold text-lg">${stats.salesDebit.toLocaleString()}</span>
             </div>
             <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
               <span className="text-xs text-blue-600 font-bold flex items-center gap-1"><CreditCard size={12}/> Crédito</span>
               <span className="font-bold text-lg">${stats.salesCredit.toLocaleString()}</span>
             </div>
             <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
               <span className="text-xs text-purple-600 font-bold flex items-center gap-1"><ArrowRightLeft size={12}/> Transf.</span>
               <span className="font-bold text-lg">${stats.salesTransfer.toLocaleString()}</span>
             </div>
             <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
               <span className="text-xs text-orange-600 font-bold flex items-center gap-1"><QrCode size={12}/> QR</span>
               <span className="font-bold text-lg">${stats.salesQR.toLocaleString()}</span>
             </div>
          </div>

          {/* VENTAS DEL DÍA ACTUAL */}
          {currentSales.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4 text-gray-800 flex items-center gap-2">
                <Calendar size={18}/> Ventas de Hoy ({currentSales.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[...currentSales].reverse().map(sale => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(sale.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {sale.paymentMethod}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ').substring(0, 50)}
                        {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ').length > 50 ? '...' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-gray-800">${sale.total.toLocaleString()}</span>
                      <button 
                        onClick={() => printSaleTicket(sale)} 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Reimprimir ticket"
                      >
                        <Printer size={16}/>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setEditingSale(JSON.parse(JSON.stringify(sale)))}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                          title="Editar venta"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {isAdmin && onDeleteSale && (
                        <button 
                          onClick={() => {
                            if(confirm('⚠️ ¿Eliminar esta venta?\n\nEsta acción NO devuelve el stock automáticamente.')) {
                              onDeleteSale(sale.id);
                            }
                          }} 
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar venta"
                        >
                          <Trash2 size={16}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-4">
            <h3 className="font-bold mb-4 text-gray-800 flex items-center gap-2"><Lock size={18}/> Finalizar Jornada</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">Notas del cierre</label><input className="w-full p-3 border rounded-lg bg-gray-50" value={notes} onChange={e => setNotes(e.target.value)} /></div>
              <button onClick={handleClose} className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 flex items-center gap-2 shadow-lg"><Wallet size={20}/> CERRAR CAJA</button>
            </div>
          </div>
        </>
      )}

      <div className="pt-8 border-t">
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 transition font-medium">{showHistory ? <ChevronUp/> : <ChevronDown/>} Historial de Cierres ({closures.length})</button>
        {showHistory && (
          <div className="bg-white mt-4 rounded-xl shadow overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm"><tr><th className="p-4">Fecha</th><th className="p-4">Inicial</th><th className="p-4">Efec. Final</th><th className="p-4">Dig. Total</th><th className="p-4">Gastos</th><th className="p-4"></th></tr></thead>
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

      {/* MODAL DE EDICIÓN AVANZADO */}
      {editingSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header Modal */}
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2"><Edit size={20}/> Editar Venta</h3>
              <button onClick={() => setEditingSale(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full"><X size={24}/></button>
            </div>

            {/* Body Modal */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs flex gap-2">
                <span>⚠️</span>
                <strong>IMPORTANTE:</strong> Al editar items, el stock NO se ajusta automáticamente. Si agregas o quitas productos, ajusta el inventario manualmente.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Fecha y Hora</label>
                  <input 
                    type="datetime-local" 
                    className="w-full border p-2 rounded-lg mt-1"
                    value={new Date(new Date(editingSale.date).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)}
                    onChange={(e) => setEditingSale({...editingSale, date: new Date(e.target.value).toISOString()})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Método de Pago</label>
                  <select
                    className="w-full border p-2 rounded-lg mt-1"
                    value={editingSale.paymentMethod}
                    onChange={e => setEditingSale({ ...editingSale, paymentMethod: e.target.value as PaymentMethod })}
                  >
                    {[PaymentMethod.CASH, PaymentMethod.DEBIT, PaymentMethod.CREDIT, PaymentMethod.TRANSFER, PaymentMethod.QR].map(pm => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista de Items */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Productos en la venta</label>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="p-3 text-left">Producto</th>
                        <th className="p-3 text-center">Cant.</th>
                        <th className="p-3 text-right">Precio</th>
                        <th className="p-3 text-right">Subtotal</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {editingSale.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3">{item.name}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleEditQuantity(idx, -1)} className="p-1 hover:bg-gray-100 rounded text-red-500"><Minus size={14}/></button>
                              <span className="font-bold w-6 text-center">{item.quantity}</span>
                              <button onClick={() => handleEditQuantity(idx, 1)} className="p-1 hover:bg-gray-100 rounded text-green-500"><Plus size={14}/></button>
                            </div>
                          </td>
                          <td className="p-3 text-right text-gray-500">${(item.appliedPrice || item.price).toLocaleString()}</td>
                          <td className="p-3 text-right font-bold">${((item.appliedPrice || item.price) * item.quantity).toLocaleString()}</td>
                          <td className="p-3 text-right">
                             <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Buscador para agregar productos */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Agregar Producto a la venta</label>
                <input 
                  placeholder="Buscar producto..." 
                  className="w-full p-2 border rounded-lg mb-2"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
                {productSearch && (
                  <div className="max-h-40 overflow-y-auto bg-white border rounded-lg shadow-sm">
                    {filteredProducts.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => handleAddItem(p)}
                        className="w-full text-left p-2 hover:bg-blue-50 text-sm flex justify-between border-b last:border-0"
                      >
                        <span>{p.name}</span>
                        <span className="font-bold text-blue-600">${p.price}</span>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && <div className="p-2 text-gray-400 text-sm text-center">No encontrado</div>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Descuento ($)</label>
                    <input 
                      type="number" 
                      className="w-full border p-2 rounded-lg mt-1"
                      value={editingSale.discount}
                      onChange={e => setEditingSale(recalculateTotal({...editingSale, discount: Number(e.target.value)}))}
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Recargo ($)</label>
                    <input 
                      type="number" 
                      className="w-full border p-2 rounded-lg mt-1"
                      value={editingSale.surcharge}
                      onChange={e => setEditingSale(recalculateTotal({...editingSale, surcharge: Number(e.target.value)}))}
                    />
                 </div>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="bg-gray-50 p-4 border-t flex justify-between items-center">
               <div className="text-right">
                 <div className="text-xs text-gray-500">TOTAL FINAL</div>
                 <div className="text-2xl font-bold text-brand-700">${editingSale.total.toLocaleString()}</div>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => setEditingSale(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Cancelar</button>
                 <button
                    className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 flex items-center gap-2 shadow-lg"
                    onClick={() => {
                      onUpdateSale?.(editingSale);
                      setEditingSale(null);
                    }}
                  >
                    <Save size={18}/> GUARDAR CAMBIOS
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
