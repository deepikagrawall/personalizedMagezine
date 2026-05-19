import React, { useState, useEffect } from 'react';
import { db, auth, signInWithGoogle, storage } from '../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'requests' | 'settings'>('products');
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [heroForm, setHeroForm] = useState<{
    siteName: string;
    tagline: string;
    titlePart1: string;
    titlePart2: string;
    titlePart3: string;
    description: string;
    primaryButtonText: string;
    secondaryButtonText: string;
    heroImages: string[];
  }>({
    siteName: 'ARTIFACT',
    tagline: 'Premium Digital Artifacts',
    titlePart1: 'CRAFTING MOMENTS',
    titlePart2: 'INTO DIGITAL ART.',
    titlePart3: 'FOR US.',
    description: 'Transform your special memories into high-fidelity digital templates. Fully customizable, high-resolution, and delivered instantly.',
    primaryButtonText: 'Explore Artifacts',
    secondaryButtonText: 'View Samples',
    heroImages: []
  });
  const [heroFiles, setHeroFiles] = useState<File[]>([]);
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
    imageUrl: '',
    whatsInside: '' // Comma separated for input
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
    const isAdmin = user && user.email?.toLowerCase() === 'deeagrawal078@gmail.com';
    if (!isAdmin) return;

    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRequests = onSnapshot(query(collection(db, 'requests'), orderBy('createdAt', 'desc')), (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'hero'), (docSnap) => {
      if (docSnap.exists()) {
        setHeroForm(docSnap.data() as any);
      }
    });

    return () => {
      unsubProducts();
      unsubCats();
      unsubRequests();
      unsubSettings();
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
        whatsInside: form.whatsInside.split(',').map(s => s.trim()).filter(s => s !== ''),
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

  const handleSaveHeroSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const { setDoc } = await import('firebase/firestore');
      
      let newImageUrls = [...heroForm.heroImages];

      // Upload new files
      if (heroFiles.length > 0) {
        for (const file of heroFiles) {
          const imgRef = ref(storage, `hero/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(imgRef, file);
          const url = await getDownloadURL(snapshot.ref);
          newImageUrls.push(url);
        }
      }

      const finalSettings = {
        ...heroForm,
        heroImages: newImageUrls
      };

      await setDoc(doc(db, 'settings', 'hero'), finalSettings);
      setHeroFiles([]);
      alert('Hero settings synchronized!');
    } catch (err: any) {
      console.error(err);
      alert('Error saving settings: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeHeroImage = (index: number) => {
    const nextImages = [...heroForm.heroImages];
    nextImages.splice(index, 1);
    setHeroForm({ ...heroForm, heroImages: nextImages });
  };

  const updateRequestStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'requests', id), { status });
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-500 bg-green-500/10';
      case 'contacted': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-orange-500 bg-orange-500/10';
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

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed. Please ensure popups are allowed for this site.');
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono uppercase tracking-widest">Initialising Control Center...</div>;

  const isAdmin = user && user.email?.toLowerCase() === 'deeagrawal078@gmail.com';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-white text-5xl md:text-7xl font-display font-bold mb-4 italic leading-none">
            <span className="block">ACCESS</span>
            <span className="block text-[#FF3B3B]">DENIED</span>
        </h1>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em] mb-12">Protected Artifact Management System</p>
        
        <div className="space-y-4">
            {!user ? (
                <button 
                    onClick={handleLogin}
                    className="bg-white text-black px-10 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-[#FF3B3B] hover:text-white transition-all transform hover:scale-105"
                >
                    Authenticate with Google
                </button>
            ) : (
                <div className="flex flex-col items-center gap-6">
                    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-sm">
                        <p className="text-red-500 text-sm font-bold mb-2">Unauthorized Identity</p>
                        <p className="text-gray-500 text-xs leading-relaxed">Account <span className="text-white">{user.email}</span> does not have Administrative clearance for this terminal.</p>
                    </div>
                    <button 
                        onClick={() => signOut(auth)}
                        className="text-xs uppercase tracking-widest text-gray-500 hover:text-white underline underline-offset-8"
                    >
                        Sign out and try another account
                    </button>
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold italic tracking-tighter">ARTIFACT CONTROL CENTER</h1>
            <div className="flex gap-6 mt-4">
                <button 
                    onClick={() => setActiveTab('products')}
                    className={`text-[10px] uppercase tracking-[0.2em] font-mono transition-all ${activeTab === 'products' ? 'text-[#FF3B3B] border-b border-[#FF3B3B] pb-1' : 'text-gray-500 hover:text-white'}`}
                >
                    Management
                </button>
                <button 
                    onClick={() => setActiveTab('requests')}
                    className={`text-[10px] uppercase tracking-[0.2em] font-mono transition-all ${activeTab === 'requests' ? 'text-[#FF3B3B] border-b border-[#FF3B3B] pb-1' : 'text-gray-500 hover:text-white'}`}
                >
                    Lead Tracker ({requests.length})
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`text-[10px] uppercase tracking-[0.2em] font-mono transition-all ${activeTab === 'settings' ? 'text-[#FF3B3B] border-b border-[#FF3B3B] pb-1' : 'text-gray-500 hover:text-white'}`}
                >
                    Site Configuration
                </button>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex bg-[#111] border border-white/5 rounded-2xl p-4 gap-8">
             <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-mono">Artifacts</span>
                <span className="text-xl font-bold font-mono">{products.length}</span>
             </div>
             <div className="flex flex-col border-l border-white/5 pl-8">
                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-mono">Total Leads</span>
                <span className="text-xl font-bold font-mono">{requests.length}</span>
             </div>
             <div className="flex flex-col border-l border-white/5 pl-8">
                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-mono">Categories</span>
                <span className="text-xl font-bold font-mono">{categories.length}</span>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <button onClick={() => signOut(auth)} className="text-xs uppercase tracking-widest text-[#FF3B3B] hover:underline">Sign Out</button>
          </div>
        </div>

        {activeTab === 'products' ? (
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
                  className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B] h-24"
                  value={form.desc}
                  onChange={e => setForm({...form, desc: e.target.value})}
                  required
                />
                <textarea 
                  placeholder="What's Inside (comma separated items)" 
                  className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B] h-20"
                  value={form.whatsInside}
                  onChange={e => setForm({...form, whatsInside: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    placeholder="Price" 
                    className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B]"
                    value={form.price}
                    onChange={e => setForm({...form, price: e.target.value})}
                    required
                  />
                  <input 
                    placeholder="Original" 
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
        ) : activeTab === 'requests' ? (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">User Lead Requests ({requests.length})</h2>
                <div className="grid grid-cols-1 gap-4">
                    {requests.length === 0 ? (
                        <div className="bg-[#111] p-12 rounded-2xl text-center border border-dashed border-white/10 text-gray-500">
                            No requests yet.
                        </div>
                    ) : (
                        requests.map(r => (
                            <div key={r.id} className="bg-[#111] border border-white/5 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                                <div>
                                    <h4 className="font-bold text-white mb-1">{r.name}</h4>
                                    <p className="text-xs text-gray-500 font-mono">{r.email}</p>
                                    <p className="text-xs text-gray-500 font-mono">{r.phone}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs uppercase tracking-widest text-gray-600 mb-1">Occasion</h4>
                                    <p className="text-sm">{r.occasion}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs uppercase tracking-widest text-gray-600 mb-1">Artifact</h4>
                                    <p className="text-sm font-bold text-[#FF3B3B]">{r.productTitle}</p>
                                    <p className="text-[10px] text-gray-700 font-mono">ID: {r.productId}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-end gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest ${getStatusColor(r.status)}`}>
                                            {r.status || 'pending'}
                                        </span>
                                    </div>
                                    <div className="flex justify-end gap-3 items-center">
                                        <select 
                                            className="bg-black border border-white/10 rounded text-[10px] uppercase font-mono p-1 outline-none"
                                            value={r.status || 'pending'}
                                            onChange={(e) => updateRequestStatus(r.id, e.target.value)}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="delivered">Delivered</option>
                                        </select>
                                        <button 
                                            onClick={() => handleDelete('requests', r.id)}
                                            className="text-white bg-white/5 p-2 rounded hover:bg-red-500/20 transition-colors"
                                        >
                                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        ) : (
            <div className="max-w-2xl">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <span className="text-[#FF3B3B]">✦</span> Hero Banner Configuration
                </h2>
                <form onSubmit={handleSaveHeroSettings} className="space-y-6 bg-[#111] p-8 rounded-2xl border border-white/5">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Site Name</label>
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-4 outline-none focus:border-[#FF3B3B] font-bold"
                            value={heroForm.siteName}
                            onChange={e => setHeroForm({...heroForm, siteName: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Tagline</label>
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-4 outline-none focus:border-[#FF3B3B]"
                            value={heroForm.tagline}
                            onChange={e => setHeroForm({...heroForm, tagline: e.target.value})}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Title Part 1</label>
                            <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-4 outline-none focus:border-[#FF3B3B]"
                                value={heroForm.titlePart1}
                                onChange={e => setHeroForm({...heroForm, titlePart1: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Title Part 2</label>
                            <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-4 outline-none focus:border-[#FF3B3B]"
                                value={heroForm.titlePart2}
                                onChange={e => setHeroForm({...heroForm, titlePart2: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Title Part 3</label>
                            <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-4 outline-none focus:border-[#FF3B3B]"
                                value={heroForm.titlePart3}
                                onChange={e => setHeroForm({...heroForm, titlePart3: e.target.value})}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Description</label>
                        <textarea 
                            className="w-full bg-black border border-white/10 rounded-lg p-4 outline-none focus:border-[#FF3B3B] h-32"
                            value={heroForm.description}
                            onChange={e => setHeroForm({...heroForm, description: e.target.value})}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Primary Button</label>
                            <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-4 outline-none focus:border-[#FF3B3B]"
                                value={heroForm.primaryButtonText}
                                onChange={e => setHeroForm({...heroForm, primaryButtonText: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Secondary Button</label>
                            <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-4 outline-none focus:border-[#FF3B3B]"
                                value={heroForm.secondaryButtonText}
                                onChange={e => setHeroForm({...heroForm, secondaryButtonText: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2 block">Hero Banner Images (Sync at Home)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {/* Existing Images */}
                            {heroForm.heroImages.map((url, i) => (
                                <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 group">
                                    <img src={url} className="w-full h-full object-cover" alt="" />
                                    <button 
                                        type="button"
                                        onClick={() => removeHeroImage(i)}
                                        className="absolute top-2 right-2 bg-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                            {/* Pending Previews */}
                            {heroFiles.map((file, i) => (
                                <div key={`pending-${i}`} className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-dashed border-[#FF3B3B]/50 group">
                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-50" alt="" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                       <span className="text-[9px] font-mono text-white bg-black/80 px-2 py-1 rounded">PENDING</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setHeroFiles(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute top-2 right-2 bg-gray-600 p-1.5 rounded-full"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                            {/* Upload Trigger */}
                            {heroForm.heroImages.length + heroFiles.length < 5 && (
                                <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-[#FF3B3B] transition-colors bg-black/20">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        multiple 
                                        onChange={e => e.target.files && setHeroFiles(prev => [...prev, ...Array.from(e.target.files!)])}
                                    />
                                    <div className="text-center">
                                        <div className="text-3xl mb-1 text-gray-700">+</div>
                                        <div className="text-[8px] uppercase tracking-widest text-gray-600 font-mono">Queue Files</div>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>

                    <button 
                        disabled={uploading}
                        className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-[#FF3B3B] hover:text-white transition-all disabled:opacity-50"
                    >
                        {uploading ? 'Applying Changes...' : 'Synchronize Banner'}
                    </button>
                    <p className="text-center text-[10px] text-gray-600 font-mono uppercase tracking-widest">Changes will reflect instantly across all client terminals.</p>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};
