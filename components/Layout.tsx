import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Package, History, Menu, X, Zap, Wallet, TrendingDown, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const nav = [
    { id: 'pos', label: 'Vender', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'cashier', label: 'Caja', icon: Wallet },
    { id: 'expenses', label: 'Gastos', icon: TrendingDown },
    { id: 'dashboard', label: 'Reportes', icon: LayoutDashboard },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row text-gray-800 font-sans">
      <div className="md:hidden bg-brand-600 text-white p-4 flex justify-between items-center sticky top-0 z-20 shadow">
        <div className="font-bold text-lg flex gap-2 items-center"><Zap className="text-yellow-300"/> TecnoStore</div>
        <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X/> : <Menu/>}</button>
      </div>

      <aside className={`fixed md:relative z-10 inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
        <div className="p-6 border-b hidden md:flex items-center gap-2 font-bold text-2xl text-brand-700">
          <Zap className="text-brand-500"/> TecnoStore
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(item => (
            <button key={item.id} onClick={() => { onTabChange(item.id); setIsOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === item.id ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}>
              <item.icon size={20}/> <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
      
      {isOpen && <div className="fixed inset-0 bg-black/50 z-0 md:hidden" onClick={() => setIsOpen(false)}/>}
    </div>
  );
};