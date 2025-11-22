
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
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [applySurcharge, setApplySurcharge] = useState(false);

  // Derived state
  const categories = useMemo(() => ['Todas', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Auto-toggle surcharge logic
  useEffect(() => {
    if (paymentMethod === PaymentMethod.CASH) {
      setApplySurcharge(false);
    } else {
      // Optional: Auto-enable surcharge for non-cash. 
      setApplySurcharge(true); 
    }
  }, [paymentMethod]);

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (discountPercent / 100);
    const totalAfterDiscount = subtotal - discountAmount;
    
    const surchargeAmount = applySurcharge ? totalAfterDiscount * 0.10 : 0;
    
    return {
      subtotal,
      discountAmount,
      surchargeAmount,
      total: totalAfterDiscount + surchargeAmount
    };
  }, [cart, discountPercent, applySurcharge]);

  // Handlers
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Prevent overselling
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        // Find original stock limit
        const originalProduct = products.find(p => p.id === id);
        if (newQty < 1) return item;
        if (originalProduct && newQty > originalProduct.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const sale: Sale = {
      id: uuidv4(),
      date: new Date().toISOString(),
      items: cart,
      subtotal: cartTotals.subtotal,
      discount: cartTotals.discountAmount,
      surcharge: cartTotals.surchargeAmount,
      total: cartTotals.total,
      paymentMethod,
    };

    onCheckout(sale);
    setCart([]);
    setDiscountPercent(0);
    setPaymentMethod(PaymentMethod.CASH);
    setApplySurcharge(false);
    alert('¡Venta registrada con éxito!');
  };

  // Helper to get icon based on category (simple heuristic)
  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('audio') || cat.includes('auricular')) return <Headphones className="w-12 h-12 text-brand-300" />;
    if (cat.includes('cargador') || cat.includes('cable')) return <Zap className="w-12 h-12 text-yellow-400" />;
    if (cat.includes('celular') || cat.includes('iphone') || cat.includes('samsung')) return <Smartphone className="w-12 h-12 text-gray-400" />;
    return <ShoppingBag className="w-12 h-12 text-brand-200" />;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      
      {/* Left Side: Product Grid */}
      <div className="flex-1 flex flex-col gap-4 h-full">
        {/* Header & Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Buscar producto..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-brand-500 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-brand-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto bg-white p-4 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
           {filteredProducts.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400">
               <ShoppingBag className="w-12 h-12 mb-2 opacity-20" />
               <p>No se encontraron productos</p>
             </div>
           ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => product.stock > 0 && addToCart(product)}
                  className={`
                    relative group bg-white border border-gray-100 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-brand-300 flex flex-col
                    ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="absolute top-2 right-2 z-10 bg-gray-100/90 backdrop-blur-sm text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full border border-gray-200">
                    {product.stock} u.
                  </div>
                  <div className="h-32 w-full bg-gray-50 flex items-center justify-center relative overflow-hidden">
                     {product.image ? (
                       <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                     ) : (
                       <div className="flex flex-col items-center justify-center gap-2 text-gray-300 w-full h-full bg-gray-50 group-hover:bg-brand-50 transition-colors">
                         {getCategoryIcon(product.category)}
                       </div>
                     )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-2 h-10 leading-tight">{product.name}</h3>
                    <p className="text-brand-600 font-bold mt-2">${product.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
           )}
        </div>
      </div>

      {/* Right Side: Cart */}
      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-xl flex flex-col h-[calc(100vh-100px)] lg:h-auto lg:sticky lg:top-4 border border-gray-200">
        <div className="p-5 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
          <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-brand-500" />
            Carrito de Compra
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm">El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                {item.image ? (
                   <img src={item.image} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                ) : (
                   <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                     <ShoppingBag className="w-5 h-5"/>
                   </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                  <p className="text-xs text-brand-600 font-bold">${(item.price * item.quantity).toLocaleString()}</p>
                </div>
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-md transition"><Minus className="w-3 h-3" /></button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-md transition"><Plus className="w-3 h-3" /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition"><Trash className="w-4 h-4" /></button>
              </div>
            ))
          )}
        </div>

        <div className="p-5 bg-gray-50 border-t border-gray-100 rounded-b-2xl space-y-4">
          {/* Discount */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Descuento (%)</span>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={discountPercent} 
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-16 text-right p-1 rounded border border-gray-300 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

           {/* Payment Methods - Selector */}
          <div className="grid grid-cols-2 gap-2">
            {Object.values(PaymentMethod).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`px-2 py-2 text-xs rounded-lg border transition-all ${
                  paymentMethod === method 
                    ? 'bg-brand-100 border-brand-500 text-brand-700 font-bold' 
                    : 'border-gray-200 text-gray-600 hover:bg-white'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
          
           {/* Surcharge Option */}
           <div className="flex items-center gap-2 cursor-pointer" onClick={() => setApplySurcharge(!applySurcharge)}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${applySurcharge ? 'bg-accent-500 border-accent-500' : 'border-gray-300 bg-white'}`}>
              {applySurcharge && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-gray-600 font-medium select-none">Aplicar Recargo (10%)</span>
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>${cartTotals.subtotal.toLocaleString()}</span>
            </div>
            
            {cartTotals.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento ({discountPercent}%)</span>
                <span>-${cartTotals.discountAmount.toLocaleString()}</span>
              </div>
            )}

            {cartTotals.surchargeAmount > 0 && (
              <div className="flex justify-between text-sm text-accent-600 font-medium">
                <span>Recargo Pago (10%)</span>
                <span>+${cartTotals.surchargeAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-2xl font-bold text-gray-800 pt-2">
              <span>Total</span>
              <span>${cartTotals.total.toLocaleString()}</span>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-500/30 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Confirmar Venta
          </button>
        </div>
      </div>
    </div>
  );
};
