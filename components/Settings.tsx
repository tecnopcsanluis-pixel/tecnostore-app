import React, { useState, useEffect } from 'react';
import { CompanySettings } from '../types';
import { Save, Store, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface SettingsProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [form, setForm] = useState<CompanySettings>(settings);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const handleTestConnection = async () => {
    setTestStatus('loading');
    setErrorMsg('');
    try {
      await StorageService.testConnection();
      setTestStatus('success');
    } catch (e: any) {
      setTestStatus('error');
      setErrorMsg(e.message || 'Error desconocido');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Store className="text-brand-500" /> Configuración del Negocio
      </h1>
      <p className="text-gray-500">Datos para tickets e impresiones.</p>

      {/* TEST CONNECTION PANEL */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
          <Activity size={18}/> Estado de la Nube
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-700">Verifica si la App tiene permiso para guardar datos.</p>
          <button 
            onClick={handleTestConnection} 
            disabled={testStatus === 'loading'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {testStatus === 'loading' ? 'Probando...' : 'Probar Conexión'}
          </button>
        </div>
        {testStatus === 'success' && (
          <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-100 p-2 rounded text-sm font-bold">
            <CheckCircle size={16}/> Conexión Exitosa: La nube está guardando correctamente.
          </div>
        )}
        {testStatus === 'error' && (
          <div className="mt-3 text-red-700 bg-red-100 p-2 rounded text-sm">
            <div className="flex items-center gap-2 font-bold"><AlertCircle size={16}/> Error de Conexión</div>
            <p className="mt-1">{errorMsg}</p>
            {errorMsg.includes('permission-denied') && (
              <p className="mt-2 font-bold underline">¡FALTAN PERMISOS EN FIREBASE! Revisa las reglas en la consola.</p>
            )}
          </div>
        )}
      </div>

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
