
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { SalesHistory } from './components/SalesHistory';
import { CashRegister } from './components/CashRegister';
import { Expenses } from './components/Expenses'; // Import Expenses
import { Product, Sale, CashClosure, Expense } from './types';
import { StorageService } from './services/storageService';

function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]); // State for expenses
  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [lastClosureDate, setLastClosureDate] = useState<Date | null>(null);

  // Initialize data from storage
  useEffect(() => {
    setProducts(StorageService.getProducts());
    setSales(StorageService.getSales());
    setExpenses(StorageService.getExpenses()); // Load expenses
    setClosures(StorageService.getClosures());
    setLastClosureDate(StorageService.getLastClosureDate());
  }, []);

  const handleUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    StorageService.saveProducts(newProducts);
  };

  const handleCheckout = (newSale: Sale) => {
    // Update Sales
    const updatedSales = [...sales, newSale];
    setSales(updatedSales);
    StorageService.saveSale(newSale);

    // Update Stock
    const updatedProducts = products.map(p => {
      const soldItem = newSale.items.find(item => item.id === p.id);
      if (soldItem) {
        return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
      }
      return p;
    });
    handleUpdateProducts(updatedProducts);
  };

  const handleAddExpense = (newExpense: Expense) => {
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    StorageService.saveExpense(newExpense);
  };

  const handleDeleteExpense = (id: string) => {
    // We need to update StorageService to support delete or just overwrite full list
    // For now, we implement overwrite approach in App logic but storage service only has 'saveExpense' (append)
    // To make this work properly with delete, we should probably update storage service or just reload all.
    // Given the constraints, let's just filter state. To persist delete, we'd need a saveExpenses (all) method.
    // Let's assume we filter and user understands persistence limitations or I add a saveAllExpenses method.
    
    const updatedExpenses = expenses.filter(e => e.id !== id);
    setExpenses(updatedExpenses);
    // For simplicity in this iteration, re-saving all isn't in StorageService, so we'll just append updates
    // or just rely on session for deletes until reload. 
    // Ideally StorageService.saveExpenses(updatedExpenses).
    localStorage.setItem('tecnostore_expenses', JSON.stringify(updatedExpenses));
  };

  const handleCloseRegister = (closure: CashClosure) => {
    const updatedClosures = [...closures, closure];
    setClosures(updatedClosures);
    StorageService.saveClosure(closure);
    setLastClosureDate(new Date(closure.date));
    alert('¡Caja cerrada correctamente!');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard sales={sales} products={products} />;
      case 'pos':
        return <POS products={products} onCheckout={handleCheckout} />;
      case 'inventory':
        return <Inventory products={products} onUpdateProducts={handleUpdateProducts} />;
      case 'expenses': // New Route
        return <Expenses expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />;
      case 'history':
        return <SalesHistory sales={sales} />;
      case 'cashier':
        return <CashRegister 
          sales={sales} 
          expenses={expenses} // Pass expenses
          closures={closures} 
          onCloseRegister={handleCloseRegister} 
          lastClosureDate={lastClosureDate} 
        />;
      default:
        return <POS products={products} onCheckout={handleCheckout} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
