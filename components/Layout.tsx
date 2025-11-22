
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Package, History, Menu, X, Zap, Wallet, TrendingDown, Download } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("Instrucciones:\n1. Si estás en PC: Busca el icono (+) en la barra de direcciones del navegador.\n2. Si estás en Móvil: Toca menú (3 puntos) -> 'Agregar a pantalla principal'.\n3. Si no ves opciones: Abre esta web en una Pestaña Nueva (fuera de la vista previa).");
    }
  };

  const navItems = [
    { id: 'pos', label: 'Vender (Caja)', icon: ShoppingCart },
    { id: 'dashboard', label: 'Panel General', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'expenses', label: 'Gastos / Sueldos', icon: TrendingDown },
    { id: 'history', label: 'Historial Ventas', icon: History },
    { id: 'cashier', label: 'Cierre de Caja', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col md:flex-row font-sans text-gray-800">
      {/* Mobile Header */}
      <div className="md:hidden bg-brand-600 text-white p-4 flex justify-between items-center shadow-md z-20 sticky top-0">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Zap className="w-6 h-6 text-yellow-300" />
          <span>TecnoStore</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-10 inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 flex flex-col
      `}>
        <div className="p-6 border-b border-gray-100 hidden md:flex items-center gap-2 font-bold text-2xl text-brand-700">
          <Zap className="w-8 h-8 text-brand-500 fill-current" />
          <span>TecnoStore</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${activeTab === item.id 
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' 
                  : 'text-gray-600 hover:bg-brand-50 hover:text-brand-600'}
              `}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'animate-pulse' : ''}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-4 border-t bg-gray-50">
           {!isInstalled && (
             <button 
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition"
            >
              <Download className="w-4 h-4" />
              Instalar App
            </button>
           )}
          <div className="text-xs text-center text-gray-400">
            <p>© 2025 TecnoStore v1.4</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-0 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
