import React, { useState, useRef, useMemo } from 'react';
import { Product } from '../types';
import { Search, Plus, Upload, Trash2, Edit2, X, Image as ImageIcon, Save, Loader2, ArrowUpDown, CheckSquare, Square } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

export interface InventoryProps {
  products: Product[];
  isAdmin: boolean;
  onAddProduct: (product: Product) => void | Promise<void>;
  onUpdateProduct: (product: Product) => void | Promise<void>;
  onDeleteProduct: (id: string) => void | Promise<void>;
}

type SortField = 'name' | 'category' | 'price' | 'stock';
type SortDirection = 'asc' | 'desc';

export const Inventory: React.FC<InventoryProps> = ({ products, isAdmin, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sorting & Selection States
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter & Sort Logic
  const processedProducts = useMemo(() => {
    let result = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' 
          ? (Number(aValue) - Number(bValue)) 
          : (Number(bValue) - Number(aValue));
      }
    });

    return result;
  }, [products, searchTerm, sortField, sortDirection]);

  // Handlers for Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handlers for Selection
  const toggleSelectAll = () => {
    if (selectedIds.size === processedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedProducts.map(p => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`¿Estás seguro de ELIMINAR ${selectedIds.size} productos seleccionados? Esta acción no se puede deshacer.`)) return;
    setIsSaving(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      // Execute sequentially or in parallel depending on backend limits. Here parallel is fine for small batches.
      await Promise.all(idsToDelete.map(id => onDeleteProduct(id)));
      setSelectedIds(new Set());
      alert('Productos eliminados.');
    } catch (error) {
      alert('Error al eliminar algunos productos.');
    } finally {
      setIsSaving(false);
    }
  };

  // Previous Handlers
  const handleSave = async () => {
    if (!productForm.name || !productForm.price) return;
    setIsSaving(true);
    try {
      if (editingId) {
        await onUpdateProduct({ ...productForm, image: productForm.image || '', id: editingId } as Product);
      } else {
        await onAddProduct({
          id: uuidv4(),
          name: productForm.name,
          category: productForm.category || 'General',
          price: Number(productForm.price),
          stock: Number(productForm.stock) || 0,
          image: productForm.image || ''
        } as Product);
      }
      setShowModal(false);
      setProductForm({});
      setEditingId(null);
    } catch (e: any) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = async () => {
    setIsProcessing(true);
    try {
      const raw = await GeminiService.parseInventoryFromText(importText);
      setPreviewProducts(raw.map(p => ({ ...p, id: uuidv4(), image: '' } as Product)));
    } catch (e: any) { alert(e.message); }
    setIsProcessing(false);
  };

  const confirmImport = async () => {
    setIsSaving(true);
    try {
      await Promise.all(previewProducts.map(p => onAddProduct(p)));
      setPreviewProducts([]);
      setImportText('');
      setShowImportModal(false);
      alert('Importación completada con éxito.');
    } catch (e: any) {
      alert('Error al importar algunos productos: ' + e.message);
    } finally {
      setIsSaving(false);
    }
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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
          {selectedIds.size > 0 && isAdmin && (
            <button 
              onClick={handleBulkDelete} 
              className="mt-2 text-sm bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold flex items-center gap-2 hover:bg-red-200"
            >
              <Trash2 size={16}/> Borrar {selectedIds.size} seleccionados
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {isAdmin && <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg flex gap-2 items-center hover:bg-emerald-200 transition"><Upload size={18}/> Importar</button>}
          <button onClick={() => { setEditingId(null); setProductForm({}); setShowModal(true); }} className="px-4 py-2 bg-brand-600 text-white rounded-lg flex gap-2 items-center hover:bg-brand-700 transition"><Plus size={18}/> Nuevo</button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Buscar por nombre o categoría..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-4 w-10">
                {isAdmin && (
                  <button onClick={toggleSelectAll} className="text-gray-500 hover:text-brand-600">
                    {selectedIds.size > 0 && selectedIds.size === processedProducts.length ? <CheckSquare size={20}/> : <Square size={20}/>}
                  </button>
                )}
              </th>
              <th className="p-4">Img</th>
              <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">Nombre <ArrowUpDown size={14} className="text-gray-400"/></div>
              </th>
              <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                <div className="flex items-center gap-1">Categoría <ArrowUpDown size={14} className="text-gray-400"/></div>
              </th>
              <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('price')}>
                 <div className="flex items-center gap-1">Precio <ArrowUpDown size={14} className="text-gray-400"/></div>
              </th>
              <th className="p-4">Stock</th>
              <th className="p-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {processedProducts.length === 0 ? (
               <tr><td colSpan={7} className="text-center py-8 text-gray-400">No hay productos.</td></tr>
            ) : (
              processedProducts.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 ${selectedIds.has(p.id) ? 'bg-blue-50' : ''}`}>
                  <td className="p-4">
                    {isAdmin && (
                      <button onClick={() => toggleSelectOne(p.id)} className={`text-gray-400 ${selectedIds.has(p.id) ? 'text-brand-600' : ''}`}>
                         {selectedIds.has(p.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
                      </button>
                    )}
                  </td>
                  <td className="p-4">
                    {p.image ? <img src={p.image} className="w-10 h-10 rounded object-cover shadow-sm"/> : <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center"><ImageIcon size={16} className="text-gray-400"/></div>}
                  </td>
                  <td className="p-4 font-medium text-gray-800">{p.name}</td>
                  <td className="p-4 text-sm text-gray-600">{p.category}</td>
                  <td className="p-4 font-bold text-brand-600">${p.price}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${p.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.stock}</span></td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => { setEditingId(p.id); setProductForm(p); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                    {isAdmin && (
                      <button onClick={() => { if(confirm('Eliminar?')) onDeleteProduct(p.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
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
              <button onClick={handleSave} disabled={isSaving} className="w-full py-2 bg-brand-600 text-white rounded font-bold mt-2 flex justify-center items-center gap-2">
                 {isSaving ? <Loader2 className="animate-spin"/> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Importar con IA</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
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
                  <button onClick={() => setPreviewProducts([])} className="flex-1 border py-2 rounded">Volver</button>
                  <button onClick={confirmImport} disabled={isSaving} className="flex-1 bg-green-600 text-white py-2 rounded flex justify-center items-center gap-2">
                    {isSaving ? <Loader2 className="animate-spin"/> : 'Confirmar Importación'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};