import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { Search, Plus, Upload, Trash2, Edit2, X, Image as ImageIcon, Save, Loader2 } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

export interface InventoryProps {
  products: Product[];
  onAddProduct: (product: Product) => void | Promise<void>;
  onUpdateProduct: (product: Product) => void | Promise<void>;
  onDeleteProduct: (id: string) => void | Promise<void>;
}

export const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!productForm.name || !productForm.price) return;
    if (editingId) {
      await onUpdateProduct({ ...productForm, id: editingId } as Product);
    } else {
      await onAddProduct({
        id: uuidv4(),
        name: productForm.name,
        category: productForm.category || 'General',
        price: Number(productForm.price),
        stock: Number(productForm.stock) || 0,
        image: productForm.image
      } as Product);
    }
    setShowModal(false);
    setProductForm({});
    setEditingId(null);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    try {
      const raw = await GeminiService.parseInventoryFromText(importText);
      setPreviewProducts(raw.map(p => ({ ...p, id: uuidv4() } as Product)));
    } catch (e: any) { alert(e.message); }
    setIsProcessing(false);
  };

  const confirmImport = async () => {
    await Promise.all(previewProducts.map(p => onAddProduct(p)));
    setPreviewProducts([]);
    setShowImportModal(false);
    alert('Importación completada.');
  };

  const compressImage = (base64: string) => {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = 300 / img.width;
        canvas.width = 300;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setProductForm({ ...productForm, image: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg flex gap-2 items-center"><Upload size={18}/> Importar</button>
          <button onClick={() => { setEditingId(null); setProductForm({}); setShowModal(true); }} className="px-4 py-2 bg-brand-600 text-white rounded-lg flex gap-2 items-center"><Plus size={18}/> Nuevo</button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input className="w-full pl-10 p-2 border rounded-lg" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Img</th>
              <th className="p-4">Nombre</th>
              <th className="p-4">Cat</th>
              <th className="p-4">Precio</th>
              <th className="p-4">Stock</th>
              <th className="p-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-4">
                  {p.image ? <img src={p.image} className="w-10 h-10 rounded object-cover"/> : <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center"><ImageIcon size={16} className="text-gray-400"/></div>}
                </td>
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4 text-sm text-gray-500">{p.category}</td>
                <td className="p-4">${p.price}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${p.stock < 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{p.stock}</span></td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => { setEditingId(p.id); setProductForm(p); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                  <button onClick={() => { if(confirm('Eliminar?')) onDeleteProduct(p.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-lg">{editingId ? 'Editar' : 'Nuevo'} Producto</h3>
              <button onClick={() => setShowModal(false)}><X/></button>
            </div>
            <div className="space-y-3">
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50" onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} accept="image/*"/>
                {productForm.image ? <img src={productForm.image} className="h-20 mx-auto rounded"/> : <div className="text-gray-400"><ImageIcon className="mx-auto"/> <span className="text-xs">Subir foto</span></div>}
              </div>
              <input className="w-full p-2 border rounded" placeholder="Nombre" value={productForm.name || ''} onChange={e => setProductForm({...productForm, name: e.target.value})}/>
              <input className="w-full p-2 border rounded" placeholder="Categoría" value={productForm.category || ''} onChange={e => setProductForm({...productForm, category: e.target.value})}/>
              <div className="flex gap-2">
                <input type="number" className="w-1/2 p-2 border rounded" placeholder="Precio" value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})}/>
                <input type="number" className="w-1/2 p-2 border rounded" placeholder="Stock" value={productForm.stock || ''} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})}/>
              </div>
              <button onClick={handleSave} className="w-full py-2 bg-brand-600 text-white rounded font-bold mt-2">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="font-bold text-lg mb-4">Importar con IA</h3>
            {!previewProducts.length ? (
              <>
                <textarea className="w-full border rounded p-2 h-32 text-sm" placeholder="Pega datos de Excel..." value={importText} onChange={e => setImportText(e.target.value)}/>
                <button onClick={handleImport} disabled={isProcessing} className="w-full py-2 bg-brand-600 text-white rounded mt-2 font-bold flex justify-center items-center gap-2">
                  {isProcessing ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Procesar
                </button>
              </>
            ) : (
              <>
                <div className="bg-green-100 p-2 rounded text-green-800 text-center mb-4">{previewProducts.length} productos detectados.</div>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewProducts([])} className="flex-1 border py-2 rounded">Cancelar</button>
                  <button onClick={confirmImport} className="flex-1 bg-green-600 text-white py-2 rounded">Importar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};