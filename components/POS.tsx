import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, PaymentMethod, Sale } from '../types';
import { Search, ShoppingCart, Trash, Plus, Minus, CheckCircle, ShoppingBag, Smartphone, Headphones, Zap } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface POSProps {
  products: Product[];
  onCheckout: (sale: Sale) => void;
}

export const POS: React.FC<POSProps> = ({ products, onCheckout }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [discount, setDiscount] = useState(0);
  const [surcharge, setSurcharge] = useState(false);

  const filtered = products.filter(p => 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase())) && 
    (selectedCategory === 'Todas' || p.category === selectedCategory)
  );

  const categories = ['Todas', ...new Set(products.map(p => p.category))];

  const totals = useMemo(() => {
    const sub = cart.reduce((a, i) => a + (i.price * i.quantity), 0);
    const discAmt = sub * (discount / 100);
    const afterDisc = sub - discAmt;
    const surAmt = surcharge ? afterDisc * 0.1 : 0;
    return { sub, discAmt, surAmt, total: afterDisc + surAmt };
  }, [cart, discount, surcharge]);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const exist = prev.find(i => i.id === p.id);
      if (exist) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...p, quantity: 1 }];
    });
  };

  const handleCheckout = () => {
    if (!cart.length) return;
    onCheckout({
      id: uuidv4(),
      date: new Date().toISOString(),
      items: cart,
      subtotal: totals.sub,
      discount: totals.discAmt,
      surcharge: totals.surAmt,
      total: totals.total,
      paymentMethod
    });
    setCart([]);
    setDiscount(0);
    setSurcharge(false);
    setPaymentMethod(PaymentMethod.CASH);
    alert('Venta registrada!');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      <div className="flex-1 flex flex-col gap-4 h-full overflow-hidden">
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
            <input className="w-full pl-10 p-2 bg-gray-50 rounded-lg" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(c => (
              <button key={c} onClick={() => setSelectedCategory(c)} className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${selectedCategory === c ? 'bg-brand-600 text-white' : 'bg-gray-100'}`}>{c}</button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 content-start pr-2">
          {filtered.map(p => (
            <div key={p.id} onClick={() => p.stock > 0 && addToCart(p)} className={`bg-white p-3 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition border border-gray-100 ${p.stock === 0 ? 'opacity-50' : ''}`}>
              <div className="h-24 bg-gray-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                {p.image ? <img src={p.image} className="w-full h-full object-cover"/> : <ShoppingBag className="text-gray-300"/>}
              </div>
              <div className="font-medium text-sm line-clamp-2">{p.name}</div>
              <div className="text-brand-600 font-bold mt-1">${p.price}</div>
              <div className="text-xs text-gray-400">{p.stock}u</div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-96 bg-white rounded-xl shadow-xl flex flex-col border">
        <div className="p-4 border-b font-bold flex gap-2 items-center"><ShoppingCart className="text-brand-500"/> Carrito</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(i => (
            <div key={i.id} className="flex gap-3 items-center">
              <div className="font-bold w-6 text-center">{i.quantity}x</div>
              <div className="flex-1 text-sm">
                <div className="line-clamp-1">{i.name}</div>
                <div className="text-xs text-gray-500">${i.price}</div>
              </div>
              <div className="font-bold text-sm">${i.price * i.quantity}</div>
              <button onClick={() => setCart(c => c.filter(x => x.id !== i.id))} className="text-gray-400 hover:text-red-500"><Trash size={16}/></button>
            </div>
          ))}
          {!cart.length && <div className="text-center text-gray-400 mt-10">Carrito vacío</div>}
        </div>
        <div className="p-4 bg-gray-50 border-t space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Descuento %</span>
            <input type="number" className="w-16 p-1 border rounded text-right" value={discount} onChange={e => setDiscount(Number(e.target.value))}/>
          </div>
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setSurcharge(!surcharge)}>
            <span className="text-sm">Recargo 10%</span>
            <div className={`w-5 h-5 rounded border flex items-center justify-center ${surcharge ? 'bg-brand-500 border-brand-500' : 'bg-white'}`}>{surcharge && <CheckCircle size={12} className="text-white"/>}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(PaymentMethod).map(m => (
              <button key={m} onClick={() => setPaymentMethod(m)} className={`text-xs py-1 rounded border ${paymentMethod === m ? 'bg-brand-100 border-brand-500 text-brand-700' : 'bg-white'}`}>{m}</button>
            ))}
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between text-xl font-bold"><span>Total</span><span>${totals.total.toLocaleString()}</span></div>
          </div>
          <button onClick={handleCheckout} disabled={!cart.length} className="w-full py-3 bg-brand-600 text-white rounded-lg font-bold shadow hover:bg-brand-700 disabled:opacity-50">COBRAR</button>
        </div>
      </div>
    </div>
  );
};