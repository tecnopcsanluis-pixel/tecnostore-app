import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { SalesHistory } from './components/SalesHistory';
import { CashRegister } from './components/CashRegister';
import { Expenses } from './components/Expenses';
import { Settings } from './components/Settings';
import { Product, Sale, CashClosure, Expense, CompanySettings, CashOpening } from './types';
import { StorageService } from './services/storageService';

const DEFAULT_SETTINGS: CompanySettings = {
  name: 'TecnoStore',
  address: 'Dirección del Local',
  phone: 'Teléfono',
  footerMessage: '¡Gracias por su compra!',
  adminPin: '1234'
};

function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [openings, setOpenings] = useState<CashOpening[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubSettings = StorageService.subscribeToSettings((data) => { if (data) setSettings(data); });
    const unsubProducts = StorageService.subscribeToProducts((data) => { setProducts(data); setIsLoading(false); });
    const unsubSales = StorageService.subscribeToSales((data) => setSales(data));
    const unsubExpenses = StorageService.subscribeToExpenses((data) => setExpenses(data));
    const unsubClosures = StorageService.subscribeToClosures((data) => setClosures(data));
    const unsubOpenings = StorageService.subscribeToOpenings((data) => setOpenings(data));

    return () => {
      unsubSettings(); unsubProducts(); unsubSales(); unsubExpenses(); unsubClosures(); unsubOpenings();
    };
  }, []);

  // --- LÓGICA DE ESTADO DE CAJA (Calculada aquí para proteger el POS) ---
  const lastClosure = useMemo(() => {
    if (!closures.length) return null;
    return [...closures].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [closures]);

  const lastOpening = useMemo(() => {
    if (!openings.length) return null;
    return [...openings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [openings]);

  const isRegisterOpen = useMemo(() => {
    if (!lastOpening) return false; // Nunca se abrió
    if (!lastClosure) return true; // Se abrió y nunca se cerró (o el cierre es mas viejo)
    // Si la última apertura es mas reciente que el último cierre -> ABIERTO
    return new Date(lastOpening.date) > new Date(lastClosure.date);
  }, [lastOpening, lastClosure]);


  const handleToggleAdmin = () => {
    if (isAdmin) { setIsAdmin(false); } 
    else {
      const pin = prompt('Ingrese PIN de Administrador:');
      if (pin === (settings.adminPin || '1234')) { setIsAdmin(true); } else { alert('PIN Incorrecto'); }
    }
  };

  const handleAddProduct = async (product: Product) => await StorageService.addProduct(product);
  const handleUpdateProduct = async (product: Product) => await StorageService.updateProduct(product);
  const handleDeleteProduct = async (id: string) => await StorageService.deleteProduct(id);

  const handleCheckout = async (newSale: Sale) => {
    await StorageService.addSale(newSale);
    const updates = newSale.items.map(async (item) => {
      const original = products.find(p => p.id === item.id);
      if (original) {
        await StorageService.updateProduct({ ...original, stock: Math.max(0, original.stock - item.quantity) });
      }
    });
    await Promise.all(updates);
  };
  
  const handleDeleteSale = async (id: string) => await StorageService.deleteSale(id);
  const handleAddExpense = async (newExpense: Expense) => await StorageService.addExpense(newExpense);
  const handleDeleteExpense = async (id: string) => await StorageService.deleteExpense(id);
  
  const handleOpenRegister = async (opening: CashOpening) => await StorageService.addOpening(opening);
  const handleCloseRegister = async (closure: CashClosure) => await StorageService.addClosure(closure);
  const handleDeleteClosure = async (id: string) => await StorageService.deleteClosure(id);

  const handleSaveSettings = async (newSettings: CompanySettings) => {
    await StorageService.saveSettings(newSettings);
    alert('Configuración guardada.');
  };

  const renderContent = () => {
    if (isLoading) return <div className="flex items-center justify-center h-full text-brand-500 animate-pulse font-bold text-xl">Conectando con TecnoStore Cloud...</div>;

    switch (activeTab) {
      case 'dashboard': return <Dashboard sales={sales} products={products} />;
      case 'pos': return <POS products={products} settings={settings} onCheckout={handleCheckout} isRegisterOpen={isRegisterOpen} />;
      case 'inventory': return <Inventory products={products} sales={sales} isAdmin={isAdmin} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />;
      case 'expenses': return <Expenses expenses={expenses} isAdmin={isAdmin} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />;
      case 'history': return <SalesHistory sales={sales} isAdmin={isAdmin} settings={settings} onDeleteSale={handleDeleteSale} />;
      case 'cashier': return <CashRegister sales={sales} expenses={expenses} closures={closures} openings={openings} settings={settings} isAdmin={isAdmin} onOpenRegister={handleOpenRegister} onCloseRegister={handleCloseRegister} onDeleteClosure={handleDeleteClosure} />;
      case 'settings': return <Settings settings={settings} isAdmin={isAdmin} onSave={handleSaveSettings} />;
      default: return <POS products={products} settings={settings} onCheckout={handleCheckout} isRegisterOpen={isRegisterOpen} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} onToggleAdmin={handleToggleAdmin}>
      {renderContent()}
    </Layout>
  );
}

export default App;