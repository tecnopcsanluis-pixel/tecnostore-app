import React, { useState, useEffect } from 'react';
import { CompanySettings } from '../types';
import { Save, Store } from 'lucide-react';

interface SettingsProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [form, setForm] = useState<CompanySettings>(settings);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Store className="text-brand-500" /> Configuración del Negocio
      </h1>
      <p className="text-gray-500">Datos para tickets e impresiones.</p>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm space-y-4 border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Negocio</label>
          <input className="w-full p-3 border rounded-lg" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: TecnoStore" required />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input className="w-full p-3 border rounded-lg" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Ej: Av. Principal 123" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp</label>
          <input className="w-full p-3 border rounded-lg" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Ej: +54 9 11 1234-5678" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje al Pie del Ticket</label>
          <input className="w-full p-3 border rounded-lg" value={form.footerMessage} onChange={e => setForm({...form, footerMessage: e.target.value})} placeholder="Ej: ¡Gracias por su compra!" />
        </div>

        <button type="submit" className="w-full py-3 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30">
          <Save size={20} /> Guardar Configuración
        </button>
      </form>
    </div>
  );
};