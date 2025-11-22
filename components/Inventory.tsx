
import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { Search, Plus, Upload, Trash2, Save, Loader2, FileSpreadsheet, Edit2, X, Image as ImageIcon, Wand2 } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

interface InventoryProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, onUpdateProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // State for manual add/edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '', category: '', price: 0, stock: 0, image: ''
  });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // State for AI Import
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingId(null);
    setProductForm({ name: '', category: '', price: 0, stock: 0, image: '' });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setProductForm({ ...product });
    setShowModal(true);
  };

  const handleSaveProduct = () => {
    if (!productForm.name || !productForm.price) return;

    if (editingId) {
      // Update existing
      const updatedProducts = products.map(p => 
        p.id === editingId 
        ? { ...p, ...productForm } as Product 
        : p
      );
      onUpdateProducts(updatedProducts);
    } else {
      // Add new
      const product: Product = {
        id: uuidv4(),
        name: productForm.name,
        category: productForm.category || 'General',
        price: Number(productForm.price),
        stock: Number(productForm.stock) || 0,
        image: productForm.image
      };
      onUpdateProducts([...products, product]);
    }

    setShowModal(false);
    setProductForm({ name: '', category: '', price: 0, stock: 0, image: '' });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      onUpdateProducts(products.filter(p => p.id !== id));
    }
  };

  const handleAIImport = async () => {
    setIsProcessing(true);
    try {
      const rawData = await GeminiService.parseInventoryFromText(importText);
      const processed: Product[] = rawData.map(p => ({
        ...p,
        id: uuidv4()
      }));
      setPreviewProducts(processed);
    } catch (error) {
      alert('Error al importar: ' + error);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmImport = () => {
    onUpdateProducts([...products, ...previewProducts]);
    setPreviewProducts([]);
    setImportText('');
    setShowImportModal(false);
  };

  // Helper to resize image to save LocalStorage space
  const compressImage = (base64Str: string, maxWidth = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `data:image/png;base64,${base64Str}`;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleGenerateImage = async () => {
    if (!productForm.name) {
      alert("Ingresa un nombre para generar la imagen.");
      return;
    }
    setIsGeneratingImage(true);
    try {
      const base64Raw = await GeminiService.generateProductImage(productForm.name);
      if (base64Raw) {
        // Compress before saving to state to avoid LocalStorage quota exceeded
        const compressed = await compressImage(base64Raw);
        setProductForm({ ...productForm, image: compressed });
      } else {
        alert("No se pudo generar la imagen.");
      }
    } catch (e) {
      alert("Error generando imagen: " + e);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
          <p className="text-gray-500">Gestiona tus productos y stock</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 font-medium transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Importar Excel/Texto (IA)
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium shadow-lg shadow-brand-500/30 transition"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text"
          placeholder="Buscar por nombre o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Imagen</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Producto</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Categoría</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Precio</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Stock</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                 <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay productos encontrados</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition group">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">{product.name}</td>
                    <td className="px-6 py-4 text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium">{product.category}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-medium">${product.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {product.stock} u.
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="text-blue-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingId ? 'Editar Producto' : 'Agregar Producto'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              
              {/* Image Section */}
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 group hover:border-brand-300 transition relative">
                {productForm.image ? (
                  <div className="relative w-32 h-32">
                    <img src={productForm.image} alt="Preview" className="w-full h-full object-cover rounded-lg shadow-md" />
                    <button 
                      onClick={() => setProductForm({...productForm, image: ''})}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Sin imagen</p>
                  </div>
                )}
                
                <div className="mt-4 flex gap-2 w-full">
                  <button 
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !productForm.name}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-accent-100 text-accent-700 rounded-lg text-sm font-medium hover:bg-accent-200 transition disabled:opacity-50"
                  >
                    {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {isGeneratingImage ? 'Creando...' : 'Generar con IA'}
                  </button>
                </div>
                <input 
                  type="text"
                  className="mt-2 w-full text-xs p-2 border rounded bg-white text-gray-600"
                  placeholder="O pega una URL de imagen..."
                  value={productForm.image?.startsWith('data') ? '(Imagen Base64)' : productForm.image || ''}
                  onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" 
                  placeholder="Ej: Funda iPhone 14" 
                  value={productForm.name}
                  onChange={e => setProductForm({...productForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input 
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" 
                  placeholder="Ej: Fundas" 
                  value={productForm.category}
                  onChange={e => setProductForm({...productForm, category: e.target.value})}
                />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                  <input 
                    type="number"
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" 
                    placeholder="0.00" 
                    value={productForm.price || ''}
                    onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock (Unidades)</label>
                  <input 
                    type="number"
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" 
                    placeholder="0" 
                    value={productForm.stock}
                    onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-medium">Cancelar</button>
              <button onClick={handleSaveProduct} className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-bold shadow-lg shadow-brand-500/30">
                {editingId ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal with AI */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Upload className="w-5 h-5 text-accent-500" />
                  Importar Inventario con IA
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Copia y pega las filas de tu Excel aquí. La IA detectará automáticamente columnas como Precio, Nombre y Stock.
                </p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            
            {!previewProducts.length ? (
              <div className="space-y-4">
                <textarea 
                  className="w-full h-48 p-4 border border-gray-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder={`Ejemplo:
Funda Silicona Samsung S21   $2500   10u
Cargador iPhone Original     $15000  5u
...`}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                />
                <button 
                  onClick={handleAIImport} 
                  disabled={isProcessing || !importText}
                  className="w-full py-3 bg-accent-600 text-white rounded-xl font-bold hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4" />}
                  {isProcessing ? 'Procesando con Gemini...' : 'Analizar y Previsualizar'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-100 p-3 rounded-xl text-green-800 text-sm">
                  ¡Éxito! Se detectaron {previewProducts.length} productos. Revisa antes de confirmar.
                </div>
                <div className="max-h-60 overflow-y-auto border rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2">Nombre</th>
                        <th className="p-2">Cat.</th>
                        <th className="p-2">Precio</th>
                        <th className="p-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewProducts.map((p, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="p-2 truncate max-w-[150px]">{p.name}</td>
                          <td className="p-2">{p.category}</td>
                          <td className="p-2">${p.price}</td>
                          <td className="p-2">{p.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3">
                   <button 
                    onClick={() => setPreviewProducts([])}
                    className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
                  >
                    Volver
                  </button>
                  <button 
                    onClick={confirmImport}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                  >
                    Confirmar Importación
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
