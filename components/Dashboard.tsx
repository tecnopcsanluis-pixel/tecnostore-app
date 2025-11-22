import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sale, Product } from '../types';
import { DollarSign, ShoppingBag, TrendingUp, Star } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
}

export const Dashboard: React.FC<DashboardProps> = ({ sales, products }) => {
  const [aiInsight, setAiInsight] = useState<string>("");

  // Calculate Stats
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
    const totalTransactions = sales.length;
    
    // Products low on stock
    const lowStockCount = products.filter(p => p.stock < 5).length;
    
    // Top Selling Category
    const categoryCount: Record<string, number> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + item.quantity;
      });
    });
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { totalRevenue, totalTransactions, lowStockCount, topCategory };
  }, [sales, products]);

  // Data for Charts
  const paymentData = useMemo(() => {
    const data: Record<string, number> = {};
    sales.forEach(sale => {
      data[sale.paymentMethod] = (data[sale.paymentMethod] || 0) + sale.total;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  useEffect(() => {
    const fetchInsight = async () => {
      if (sales.length > 0 && !aiInsight) {
        const summary = `Total revenue: ${stats.totalRevenue}. Total sales: ${stats.totalTransactions}. Top Category: ${stats.topCategory}.`;
        const insight = await GeminiService.generateSalesInsight(summary);
        setAiInsight(insight);
      }
    };
    fetchInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales.length]); // Only run when sales count changes

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Panel General</h1>
        <p className="text-gray-500">Resumen de actividad de TecnoStore</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ingresos Totales" 
          value={`$${stats.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Ventas Realizadas" 
          value={stats.totalTransactions} 
          icon={ShoppingBag} 
          color="bg-brand-500" 
        />
        <StatCard 
          title="Categoría Top" 
          value={stats.topCategory} 
          icon={TrendingUp} 
          color="bg-accent-500" 
        />
        <StatCard 
          title="Stock Bajo" 
          value={stats.lowStockCount} 
          icon={Star} 
          color="bg-yellow-500" 
        />
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Star className="w-5 h-5 text-yellow-300 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Consejo IA de Negocio</h3>
              <p className="text-indigo-50 text-sm md:text-base leading-relaxed">
                {aiInsight}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6">Ventas por Medio de Pago</h3>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6">Ingresos (Vista Simple)</h3>
           <div className="h-64 w-full flex items-center justify-center text-gray-400">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={paymentData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                 <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                 <YAxis fontSize={12} />
                 <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Monto']} />
                 <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};