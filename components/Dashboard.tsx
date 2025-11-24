import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sale, Product } from '../types';
import { DollarSign, ShoppingBag, TrendingUp, Star } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface DashboardProps { sales: Sale[]; products: Product[]; }

export const Dashboard: React.FC<DashboardProps> = ({ sales, products }) => {
  const [insight, setInsight] = useState("");

  const stats = useMemo(() => {
    const total = sales.reduce((a, s) => a + s.total, 0);
    const low = products.filter(p => p.stock < 5).length;
    return { total, low, count: sales.length };
  }, [sales, products]);

  const payData = useMemo(() => {
    const d: Record<string, number> = {};
    sales.forEach(s => d[s.paymentMethod] = (d[s.paymentMethod] || 0) + s.total);
    return Object.entries(d).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  useEffect(() => {
    if (sales.length && !insight) {
      GeminiService.generateSalesInsight(`Total: ${stats.total}. Transacciones: ${stats.count}`).then(setInsight);
    }
  }, [stats]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reportes</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500">Ingresos</div>
          <div className="text-3xl font-bold">${stats.total.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-brand-500">
          <div className="text-gray-500">Ventas</div>
          <div className="text-3xl font-bold">{stats.count}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
          <div className="text-gray-500">Stock Bajo</div>
          <div className="text-3xl font-bold">{stats.low}</div>
        </div>
      </div>
      {insight && <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-xl text-white shadow flex gap-3"><Star/><p>{insight}</p></div>}
      <div className="grid md:grid-cols-2 gap-6 h-64">
        <div className="bg-white p-4 rounded-xl shadow border"><ResponsiveContainer><BarChart data={payData}><XAxis dataKey="name"/><Tooltip/><Bar dataKey="value" fill="#3b82f6"/></BarChart></ResponsiveContainer></div>
        <div className="bg-white p-4 rounded-xl shadow border"><ResponsiveContainer><PieChart><Pie data={payData} dataKey="value" outerRadius={80}>{payData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
      </div>
    </div>
  );
};