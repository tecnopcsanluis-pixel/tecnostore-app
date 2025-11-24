import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { SalesHistory } from './components/SalesHistory';
import { CashRegister } from './components/CashRegister';
import { Expenses } from './components/Expenses';
import { Product, Sale, CashClosure, Expense } from './types';
import { StorageService } from './services/storageService';

function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubProducts = StorageService.subscribeToProducts((data) => {
      setProducts(data);
      setIsLoading(false);
    });
    const unsubSales = StorageService.subscribeToSales((data) => setSales(data));
    const unsubExpenses = StorageService.subscribeToExpenses((data) => setExpenses(data));
    const unsubClosures = StorageService.subscribeToClosures((data) => setClosures(data));

    return () => {
      unsubProducts();
      unsubSales();
      unsubExpenses();
      unsubClosures();
    };
  }, []);

  const handleAddProduct = async (product: Product) => await StorageService.addProduct(product);
  const handleUpdateProduct = async (product: Product) => await StorageService.updateProduct(product);
  const handleDeleteProduct = async (id: string) => await StorageService.deleteProduct(id);

  const handleCheckout = async (newSale: Sale) => {
    // 1. Guardar Venta
    await StorageService.addSale(newSale);
    
    // 2. Actualizar Stock (Corregido para esperar a que termine usando Promise.all)
    const updates = newSale.items.map(async (item) => {
      const original = products.find(p => p.id === item.id);
      if (original) {
        await StorageService.updateProduct({ 
          ...original, 
          stock: Math.max(0, original.stock - item.quantity) 
        });
      }
    });
    
    await Promise.all(updates);
  };

  const handleAddExpense = async (newExpense: Expense) => await StorageService.addExpense(newExpense);
  const handleDeleteExpense = async (id: string) => await StorageService.deleteExpense(id);
  
  const handleCloseRegister = async (closure: CashClosure) => {
    await StorageService.addClosure(closure);
    alert('¡Caja cerrada y guardada en la nube!');
  };

  const lastClosureDate = React.useMemo(() => {
    if (closures.length === 0) return null;
    const sorted = [...closures].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return new Date(sorted[0].date);
  }, [closures]);

  const renderContent = () => {
    if (isLoading) return <div className="flex items-center justify-center h-full text-brand-500 animate-pulse font-bold text-xl">Conectando con Firebase...</div>;

    switch (activeTab) {
      case 'dashboard': return <Dashboard sales={sales} products={products} />;
      case 'pos': return <POS products={products} onCheckout={handleCheckout} />;
      case 'inventory': return <Inventory products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />;
      case 'expenses': return <Expenses expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />;
      case 'history': return <SalesHistory sales={sales} />;
      case 'cashier': return <CashRegister sales={sales} expenses={expenses} closures={closures} onCloseRegister={handleCloseRegister} lastClosureDate={lastClosureDate} />;
      default: return <POS products={products} onCheckout={handleCheckout} />;
    }
  };

  return <Layout activeTab={activeTab} onTabChange={setActiveTab}>{renderContent()}</Layout>;
}

export default App;