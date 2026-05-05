import React, { useState, useEffect } from 'react';
import { db, auth, signInWithGoogle, storage } from '../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    desc: '',
    price: 'Free',
    original: '',
    type: 'pdf',
    category: '',
    seed: Math.floor(Math.random() * 10000),
    isNew: true,
    isBest: false,
    pdfUrl: '',
    imageUrl: ''
  });

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user || user.email !== 'deeagrawal078@gmail.com') return;

    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubProducts();
      unsubCats();
    };
  }, [user]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let pdfUrl = form.pdfUrl || '';
      let imageUrl = form.imageUrl || '';

      if (pdfFile) {
        const pdfRef = ref(storage, `artifacts/${Date.now()}_${pdfFile.name}`);
        const snapshot = await uploadBytes(pdfRef, pdfFile);
        pdfUrl = await getDownloadURL(snapshot.ref);
      }

      if (imageFile) {
        const imgRef = ref(storage, `images/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imgRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const productData = {
        ...form,
        pdfUrl,
        imageUrl,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        const { id, ...dataToUpdate } = productData as any;
        await updateDoc(doc(db, 'products', editingId), dataToUpdate);
        alert('Product updated!');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp()
        });
        alert('Product added!');
      }

      resetForm();
    } catch (err) {
      console.error(err);
      alert('Error saving product');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: '',
      desc: '',
      price: 'Free',
      original: '',
      type: 'pdf',
      category: '',
      seed: Math.floor(Math.random() * 10000),
      isNew: true,
      isBest: false,
      pdfUrl: '',
      imageUrl: ''
    });
    setPdfFile(null);
    setImageFile(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory) return;
    try {
      if (editingCategoryId) {
        await updateDoc(doc(db, 'categories', editingCategoryId), { name: newCategory });
        setEditingCategoryId(null);
      } else {
        await addDoc(collection(db, 'categories'), { name: newCategory });
      }
      setNewCategory('');
    } catch (err) {
      console.error(err);
    }
  };

  const startEditProduct = (p: any) => {
    setEditingId(p.id);
    setForm({
      title: p.title || '',
      desc: p.desc || '',
      price: p.price || 'Free',
      original: p.original || '',
      type: p.type || 'pdf',
      category: p.category || '',
      seed: p.seed || Math.floor(Math.random() * 10000),
      isNew: p.isNew ?? true,
      isBest: p.isBest ?? false,
      pdfUrl: p.pdfUrl || '',
      imageUrl: p.imageUrl || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditCategory = (c: any) => {
    setEditingCategoryId(c.id);
    setNewCategory(c.name);
  };

  const handleDelete = async (coll: string, id: string) => {
    if (window.confirm('Are you sure? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, coll, id));
        alert('Deleted successfully!');
      } catch (err) {
        console.error('Delete error:', err);
        alert('Error deleting. Check console for details.');
      }
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  if (!user || user.email !== 'deeagrawal078@gmail.com') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <h1 className="text-white text-4xl font-display font-bold mb-8 italic">Admin Login</h1>
        <button 
          onClick={signInWithGoogle}
          className="bg-[#FF3B3B] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:scale-105 transition-transform"
        >
          Sign in with Google
        </button>
        {user && user.email !== 'deeagrawal078@gmail.com' && (
          <p className="text-red-500 mt-4 text-sm font-mono">Unauthorized. You are not an admin.</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-display font-bold">Artifact Control Center</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <button onClick={() => signOut(auth)} className="text-xs uppercase tracking-widest text-[#FF3B3B] hover:underline">Sign Out</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Add/Edit Product Form */}
          <div className="lg:col-span-1 bg-[#111] p-8 rounded-2xl border border-white/5 h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="text-[#FF3B3B]">✦</span> {editingId ? 'Edit Artifact' : 'New Artifact'}
              </span>
              {editingId && (
                <button onClick={resetForm} className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white">Cancel</button>
              )}
            </h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <input 
                placeholder="Title" 
                className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B]"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                required
              />
              <textarea 
                placeholder="Description" 
                className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B] h-32"
                value={form.desc}
                onChange={e => setForm({...form, desc: e.target.value})}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  placeholder="Price (e.g. Free or ₹499)" 
                  className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B]"
                  value={form.price}
                  onChange={e => setForm({...form, price: e.target.value})}
                  required
                />
                <input 
                  placeholder="Original Price" 
                  className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B]"
                  value={form.original}
                  onChange={e => setForm({...form, original: e.target.value})}
                />
              </div>
              <select 
                className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B]"
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
              >
                <option value="pdf">PDF Template</option>
                <option value="site">Website Template</option>
              </select>
              <select 
                className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B]"
                value={form.category}
                disabled={categories.length === 0}
                onChange={e => setForm({...form, category: e.target.value})}
                required
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isNew} onChange={e => setForm({...form, isNew: e.target.checked})} />
                  <span className="text-sm">New</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isBest} onChange={e => setForm({...form, isBest: e.target.checked})} />
                  <span className="text-sm">Best Seller</span>
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Template File (PDF/Site Zip)</label>
                <input 
                  type="file"
                  className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B] text-xs"
                  onChange={e => setPdfFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Display Image</label>
                <input 
                  type="file"
                  accept="image/*"
                  className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B] text-xs"
                  onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              <button 
                disabled={uploading}
                className="w-full bg-[#FF3B3B] text-white py-4 rounded-xl font-bold hover:bg-[#FF3B3B]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Processing...' : editingId ? 'Update Artifact' : 'Publish Artifact'}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-white/5">
                <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
                    <span>{editingCategoryId ? 'Edit Category' : 'Create Category'}</span>
                    {editingCategoryId && (
                        <button onClick={() => { setEditingCategoryId(null); setNewCategory(''); }} className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white">Cancel</button>
                    )}
                </h2>
                <form onSubmit={handleSaveCategory} className="flex gap-2">
                    <input 
                        placeholder="e.g. Anniversary" 
                        className="flex-1 bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B]"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                    />
                    <button className="bg-white text-black px-4 rounded-lg font-bold hover:bg-[#FF3B3B] hover:text-white transition-colors">
                        {editingCategoryId ? '✓' : '+'}
                    </button>
                </form>
                <div className="mt-4 flex flex-wrap gap-2">
                    {categories.map(c => (
                        <span key={c.id} className="bg-white/5 pl-3 pr-1 py-1 rounded-full text-xs flex items-center gap-2 group/cat">
                            {c.name}
                            <div className="flex items-center gap-1">
                                <button onClick={() => startEditCategory(c)} className="text-blue-500 opacity-0 group-hover/cat:opacity-100 transition-opacity">✎</button>
                                <button onClick={() => handleDelete('categories', c.id)} className="text-[#FF3B3B]">×</button>
                            </div>
                        </span>
                    ))}
                </div>
            </div>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold">Manage Existing ({products.length})</h2>
            <div className="grid grid-cols-1 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-[#111] border border-white/5 p-6 rounded-2xl flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded bg-[#222] overflow-hidden">
                      <img src={p.imageUrl || `https://picsum.photos/200?random=${p.seed}`} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{p.title}</h4>
                      <p className="text-sm text-gray-500">{p.category} • {p.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-bold">{p.price}</span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => startEditProduct(p)}
                            className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-gray-400 hover:text-white transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button 
                            onClick={() => handleDelete('products', p.id)}
                            className="bg-[#FF3B3B]/10 hover:bg-[#FF3B3B]/20 p-2 rounded-lg text-[#FF3B3B] transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
