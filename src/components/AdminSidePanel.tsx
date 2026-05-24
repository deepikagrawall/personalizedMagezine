import React, { useState, useEffect } from 'react';
import { db, storage } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  updateDoc, 
  setDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AdminSidePanelProps {
  isOpen: boolean; 
  onClose: () => void; 
  data: any; 
  onUpdate: (newData: any) => void;
  products: any[];
  categoriesFromDB: string[];
}

export const AdminSidePanel = ({ 
  isOpen, 
  onClose, 
  data, 
  onUpdate, 
  products, 
  categoriesFromDB 
}: AdminSidePanelProps) => {
  const [activeTab, setActiveTab] = useState<'netflix' | 'paytm' | 'products' | 'settings' | 'leads' | 'howItWorks' | 'curatedSelection' | 'pricing'>('netflix');
  const [localData, setLocalData] = useState(data);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [uploadingHowItWorks, setUploadingHowItWorks] = useState(false);
  const [uploadingCurated, setUploadingCurated] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);

  // Product CRUD states
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [uploadingProductImg, setUploadingProductImg] = useState(false);
  const [uploadingProductPdf, setUploadingProductPdf] = useState(false);
  const [uploadingProductVideo, setUploadingProductVideo] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  useEffect(() => {
    if (activeTab === 'leads') {
        const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsub;
    }
  }, [activeTab]);

  const handleDeleteLead = async (id: string) => {
    if (window.confirm('Delete this request?')) {
        try {
            await deleteDoc(doc(db, 'requests', id));
        } catch (err) {
            console.error(err);
            alert('Delete failed');
        }
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: string) => {
    try {
        await updateDoc(doc(db, 'requests', id), { status });
    } catch (err) {
        console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this artifact?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      alert("Artifact deleted successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete product: " + err.message);
    }
  };

  const uploadHowItWorksImage = async (file: File) => {
    setUploadingHowItWorks(true);
    try {
      const storageRef = ref(storage, `howitworks/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setLocalData({
        ...localData,
        howItWorks: {
          ...localData.howItWorks,
          imageUrl: downloadURL
        }
      });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Try again.');
    } finally {
      setUploadingHowItWorks(false);
    }
  };

  const uploadCuratedImage = async (file: File) => {
    setUploadingCurated(true);
    try {
      const storageRef = ref(storage, `curated/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setLocalData({
        ...localData,
        curatedSelection: {
          ...(localData.curatedSelection || {
            subtitle: '✦ The Library',
            title: 'Curated \n Selection.',
            description: 'Every design is an original piece, crafted with premium typography and editorial layouts.'
          }),
          imageUrl: downloadURL
        }
      });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Try again.');
    } finally {
      setUploadingCurated(false);
    }
  };

  const handleImageUpload = async (file: File, index: number) => {
    setUploadingIdx(index);
    const screenshotId = localData.netflixShowcase.screenshots[index].id;
    console.log(`Uploading image for slot: ${screenshotId}`);
    
    try {
      const storageRef = ref(storage, `showcase/netflix/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const newSS = [...localData.netflixShowcase.screenshots];
      newSS[index] = { ...newSS[index], url: downloadURL };
      setLocalData({
        ...localData, 
        netflixShowcase: {
          ...localData.netflixShowcase, 
          screenshots: newSS
        }
      });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Try again.');
    } finally {
      setUploadingIdx(null);
    }
  };

  const handlePaytmImageUpload = async (file: File, index: number) => {
    setUploadingIdx(index);
    const screenshotId = localData.paytmShowcase.screenshots[index].id;
    console.log(`Uploading Paytm image for slot: ${screenshotId}`);
    
    try {
      const storageRef = ref(storage, `showcase/paytm/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const newSS = [...localData.paytmShowcase.screenshots];
      newSS[index] = { ...newSS[index], url: downloadURL };
      setLocalData({
        ...localData, 
        paytmShowcase: {
          ...localData.paytmShowcase, 
          screenshots: newSS
        }
      });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Try again.');
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'hero'), { ...localData, updatedAt: serverTimestamp() });
      alert('Success! Site content synchronized across all users.');
      onUpdate(localData);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Sync Failed. Check permissions or network.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-[480px] bg-[#0A0A0A] h-full border-l border-white/10 animate-[slideIn_0.3s_ease-out] flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between col-span-1 border-opacity-40">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Artifact Control</h2>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">Live CMS v1.4</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar bg-black/40">
          {[
            { id: 'netflix', label: 'Netflix Block' },
            { id: 'paytm', label: 'Paytm Block' },
            { id: 'settings', label: 'Hero & Identity' },
            { id: 'pricing', label: 'Pricing Tiers' },
            { id: 'howItWorks', label: 'How It Works' },
            { id: 'curatedSelection', label: 'Curated' },
            { id: 'products', label: 'Artifacts' },
            { id: 'leads', label: 'Leads' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 text-[10px] font-mono tracking-widest uppercase transition-all flex-shrink-0 border-b-2 ${
                activeTab === tab.id ? 'border-[var(--accent)] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-32">
          {activeTab === 'howItWorks' && (
            <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                <div className="space-y-4">
                     <h3 className="text-[11px] font-mono text-[var(--accent)] uppercase tracking-[0.2em] font-bold">How It Works Layout</h3>
                     <div className="space-y-2">
                          <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Section Title (use \n for newline)</label>
                          <textarea 
                              className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-sm outline-none h-20 resize-none"
                              value={localData.howItWorks.title}
                              onChange={e => setLocalData({...localData, howItWorks: { ...localData.howItWorks, title: e.target.value }})}
                          />
                     </div>
                     <div className="space-y-2">
                          <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Section Subtitle</label>
                          <input 
                              className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-sm outline-none"
                              value={localData.howItWorks.subtitle}
                              onChange={e => setLocalData({...localData, howItWorks: { ...localData.howItWorks, subtitle: e.target.value }})}
                          />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Section Image</label>
                        <div className="flex gap-4 items-center">
                            <div className="relative w-20 h-20 bg-black border border-white/10 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                               {localData.howItWorks.imageUrl ? (
                                   <img src={localData.howItWorks.imageUrl} alt="preview" className="w-full h-full object-cover"/>
                               ) : (
                                   <span className="text-[10px] text-gray-600 font-mono">No Image</span>
                               )}
                               {uploadingHowItWorks && (
                                   <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                       <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                   </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="relative">
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) uploadHowItWorksImage(file);
                                        }}
                                    />
                                    <button className="w-full bg-white/5 border border-white/10 text-white hover:border-[var(--accent)] rounded px-4 py-3 text-xs font-mono transition-colors text-center">
                                        {uploadingHowItWorks ? 'Uploading...' : 'Choose Image File'}
                                    </button>
                                </div>
                                <p className="text-[9px] text-gray-500 font-mono">Recommended aspect ratio: 4:5</p>
                            </div>
                        </div>
                     </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] font-bold border-b border-white/10 pb-2">Steps</h3>
                    {localData.howItWorks.steps.map((step: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/5 flex gap-4">
                            <span className="text-xl shrink-0 font-bold text-gray-400">{step.num}</span>
                            <div className="flex-1 space-y-2">
                                <input 
                                    className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white text-xs font-bold"
                                    value={step.title}
                                    placeholder="Step Title"
                                    onChange={e => {
                                        const newS = [...localData.howItWorks.steps];
                                        newS[idx].title = e.target.value;
                                        setLocalData({...localData, howItWorks: {...localData.howItWorks, steps: newS}});
                                    }}
                                />
                                <textarea 
                                    className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white text-[11px] opacity-60 h-16 resize-none"
                                    placeholder="Step Description"
                                    value={step.desc}
                                    onChange={e => {
                                        const newS = [...localData.howItWorks.steps];
                                        newS[idx].desc = e.target.value;
                                        setLocalData({...localData, howItWorks: {...localData.howItWorks, steps: newS}});
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'curatedSelection' && (
            <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                <div className="space-y-4">
                     <h3 className="text-[11px] font-mono text-[var(--accent)] uppercase tracking-[0.2em] font-bold">Curated Selection Layout</h3>
                     
                     <div className="space-y-2">
                          <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Section Overline</label>
                          <input 
                              className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-sm outline-none"
                              value={localData.curatedSelection?.subtitle || ''}
                              onChange={e => setLocalData({...localData, curatedSelection: {...(localData.curatedSelection || {}), subtitle: e.target.value}})}
                          />
                     </div>

                     <div className="space-y-2">
                          <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Section Title (use \n for newline)</label>
                          <textarea 
                              className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-sm outline-none h-20 resize-none"
                              value={localData.curatedSelection?.title || ''}
                              onChange={e => setLocalData({...localData, curatedSelection: {...(localData.curatedSelection || {}), title: e.target.value}})}
                          />
                     </div>

                     <div className="space-y-2">
                          <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Section Description</label>
                          <textarea 
                              className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-sm outline-none h-24 resize-none"
                              value={localData.curatedSelection?.description || ''}
                              onChange={e => setLocalData({...localData, curatedSelection: {...(localData.curatedSelection || {}), description: e.target.value}})}
                          />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Section Image</label>
                        <div className="flex gap-4 items-center">
                            <div className="relative w-20 h-20 bg-black border border-white/10 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                               {localData.curatedSelection?.imageUrl ? (
                                   <img src={localData.curatedSelection.imageUrl} alt="preview" className="w-full h-full object-cover"/>
                               ) : (
                                   <span className="text-[10px] text-gray-600 font-mono">No Image</span>
                               )}
                               {uploadingCurated && (
                                   <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                       <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                   </div>
                               )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="relative">
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) uploadCuratedImage(file);
                                        }}
                                    />
                                    <button className="w-full bg-white/5 border border-white/10 text-white hover:border-[var(--accent)] rounded px-4 py-3 text-xs font-mono transition-colors text-center">
                                        {uploadingCurated ? 'Uploading...' : 'Choose Image File'}
                                    </button>
                                </div>
                                <p className="text-[9px] text-gray-500 font-mono">Recommended aspect ratio: square/rect</p>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
          )}

          {activeTab === 'netflix' && (
            <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
              <div className="space-y-4">
                <h3 className="text-[11px] font-mono text-[var(--accent)] uppercase tracking-[0.2em] font-bold">Main Banner</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Main Heading</label>
                        <input 
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[var(--accent)] transition-all"
                            value={localData.netflixShowcase.title}
                            onChange={e => setLocalData({...localData, netflixShowcase: {...localData.netflixShowcase, title: e.target.value}})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Description Content</label>
                        <textarea 
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[var(--accent)] h-28 resize-none"
                            value={localData.netflixShowcase.subtitle}
                            onChange={e => setLocalData({...localData, netflixShowcase: {...localData.netflixShowcase, subtitle: e.target.value}})}
                        />
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Promo Price</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[var(--accent)]"
                      value={localData.netflixShowcase.price}
                      onChange={e => setLocalData({...localData, netflixShowcase: {...localData.netflixShowcase, price: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Strike Price</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[var(--accent)]"
                      value={localData.netflixShowcase.originalPrice}
                      onChange={e => setLocalData({...localData, netflixShowcase: {...localData.netflixShowcase, originalPrice: e.target.value}})}
                    />
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] font-bold border-b border-white/10 pb-2">Key Features</h3>
                  <div className="space-y-4">
                    {localData.netflixShowcase.features.map((feat: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/5 flex gap-4">
                            <input 
                                className="w-10 bg-black border border-white/10 rounded text-center text-xl shrink-0"
                                value={feat.emoji}
                                onChange={e => {
                                    const newF = [...localData.netflixShowcase.features];
                                    newF[idx].emoji = e.target.value;
                                    setLocalData({...localData, netflixShowcase: {...localData.netflixShowcase, features: newF}});
                                }}
                            />
                            <div className="flex-1 space-y-2">
                                <input 
                                    className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white text-xs font-bold"
                                    placeholder="Title"
                                    value={feat.title}
                                    onChange={e => {
                                        const newF = [...localData.netflixShowcase.features];
                                        newF[idx].title = e.target.value;
                                        setLocalData({...localData, netflixShowcase: {...localData.netflixShowcase, features: newF}});
                                    }}
                                />
                                <input 
                                    className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white text-[11px] opacity-60"
                                    placeholder="Description"
                                    value={feat.desc}
                                    onChange={e => {
                                        const newF = [...localData.netflixShowcase.features];
                                        newF[idx].desc = e.target.value;
                                        setLocalData({...localData, netflixShowcase: {...localData.netflixShowcase, features: newF}});
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                  </div>
              </div>
              
              <div className="space-y-4">
                  <h3 className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] font-bold border-b border-white/10 pb-2">Visual Gallery</h3>
                  <div className="grid grid-cols-1 gap-4">
                      {localData.netflixShowcase.screenshots.map((ss: any, idx: number) => (
                        <div key={ss.id} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3 group/ss">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-mono text-white/40 uppercase">Grid Slot: {ss.size}</span>
                              <div className="w-10 h-10 rounded-lg shrink-0 bg-cover bg-center border border-white/20 shadow-lg" style={{ backgroundImage: `url(${ss.url})` }} />
                           </div>
                           
                           <div className="space-y-2">
                                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-mono block">Image Artifact</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input 
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(file, idx);
                                            }}
                                        />
                                        <div className={`w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white text-[11px] flex items-center gap-2 transition-colors ${uploadingIdx === idx ? 'opacity-50' : 'hover:border-[var(--accent)]'}`}>
                                            {uploadingIdx === idx ? (
                                                <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shrink-0" />
                                            ) : (
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                            )}
                                            <span className="truncate">{uploadingIdx === idx ? 'Uploading Artifact...' : (ss.url ? 'Change Artifact' : 'Upload Artifact')}</span>
                                        </div>
                                    </div>
                                    {ss.url && (
                                        <button 
                                            onClick={() => window.open(ss.url, '_blank')}
                                            className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-500 hover:text-white cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                    )}
                                </div>
                           </div>

                           <div className="space-y-2">
                                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-mono block">Hover Caption</label>
                                <input 
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white text-[11px] outline-none focus:border-[var(--accent)] transition-all"
                                    value={ss.label}
                                    onChange={e => {
                                        const newSS = [...localData.netflixShowcase.screenshots];
                                        newSS[idx].label = e.target.value;
                                        setLocalData({...localData, netflixShowcase: {...localData.netflixShowcase, screenshots: newSS}});
                                    }}
                                />
                           </div>
                        </div>
                      ))}
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'paytm' && (
            <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
              <div className="space-y-4">
                <h3 className="text-[11px] font-mono text-[#00b9f5] uppercase tracking-[0.2em] font-bold">Paytm Banner</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Main Heading</label>
                        <input 
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#00b9f5] transition-all"
                            value={localData.paytmShowcase?.title || ''}
                            onChange={e => setLocalData({...localData, paytmShowcase: {...(localData.paytmShowcase || {}), title: e.target.value}})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Description Content</label>
                        <textarea 
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#00b9f5] h-28 resize-none"
                            value={localData.paytmShowcase?.subtitle || ''}
                            onChange={e => setLocalData({...localData, paytmShowcase: {...(localData.paytmShowcase || {}), subtitle: e.target.value}})}
                        />
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Promo Price</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#00b9f5]"
                      value={localData.paytmShowcase?.price || ''}
                      onChange={e => setLocalData({...localData, paytmShowcase: {...(localData.paytmShowcase || {}), price: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Strike Price</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#00b9f5]"
                      value={localData.paytmShowcase?.originalPrice || ''}
                      onChange={e => setLocalData({...localData, paytmShowcase: {...(localData.paytmShowcase || {}), originalPrice: e.target.value}})}
                    />
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] font-bold border-b border-white/10 pb-2">Key Features</h3>
                  <div className="space-y-4">
                    {(localData.paytmShowcase?.features || []).map((feat: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/5 flex gap-4">
                            <input 
                                className="w-10 bg-black border border-white/10 rounded text-center text-xl shrink-0"
                                value={feat.emoji}
                                onChange={e => {
                                    const newF = [...(localData.paytmShowcase?.features || [])];
                                    newF[idx].emoji = e.target.value;
                                    setLocalData({...localData, paytmShowcase: {...localData.paytmShowcase, features: newF}});
                                }}
                            />
                            <div className="flex-1 space-y-2">
                                <input 
                                    className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white text-xs font-bold"
                                    placeholder="Title"
                                    value={feat.title}
                                    onChange={e => {
                                        const newF = [...(localData.paytmShowcase?.features || [])];
                                        newF[idx].title = e.target.value;
                                        setLocalData({...localData, paytmShowcase: {...localData.paytmShowcase, features: newF}});
                                    }}
                                />
                                <input 
                                    className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-white text-[11px] opacity-60"
                                    placeholder="Description"
                                    value={feat.desc}
                                    onChange={e => {
                                        const newF = [...(localData.paytmShowcase?.features || [])];
                                        newF[idx].desc = e.target.value;
                                        setLocalData({...localData, paytmShowcase: {...localData.paytmShowcase, features: newF}});
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                  </div>
              </div>
              
              <div className="space-y-4">
                  <h3 className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] font-bold border-b border-white/10 pb-2">Visual Gallery</h3>
                  <div className="grid grid-cols-1 gap-4">
                      {(localData.paytmShowcase?.screenshots || []).map((ss: any, idx: number) => (
                        <div key={ss.id} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3 group/ss">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-mono text-white/40 uppercase">Grid Slot: {ss.size}</span>
                              <div className="w-10 h-10 rounded-lg shrink-0 bg-cover bg-center border border-white/20 shadow-lg" style={{ backgroundImage: `url(${ss.url})` }} />
                           </div>
                           
                           <div className="space-y-2">
                                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-mono block">Image Artifact</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input 
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) handlePaytmImageUpload(file, idx);
                                            }}
                                        />
                                        <div className={`w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white text-[11px] flex items-center gap-2 transition-colors ${uploadingIdx === idx ? 'opacity-50' : 'hover:border-[#00b9f5]'}`}>
                                            {uploadingIdx === idx ? (
                                                <div className="w-3 h-3 border-2 border-[#00b9f5] border-t-transparent rounded-full animate-spin shrink-0" />
                                            ) : (
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                            )}
                                            <span className="truncate">{uploadingIdx === idx ? 'Uploading Artifact...' : (ss.url ? 'Change Artifact' : 'Upload Artifact')}</span>
                                        </div>
                                    </div>
                                    {ss.url && (
                                        <button 
                                            onClick={() => window.open(ss.url, '_blank')}
                                            className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-500 hover:text-white cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                    )}
                                </div>
                           </div>

                           <div className="space-y-2">
                                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-mono block">Hover Caption</label>
                                <input 
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white text-[11px] outline-none focus:border-[#00b9f5] transition-all"
                                    value={ss.label}
                                    onChange={e => {
                                        const newSS = [...(localData.paytmShowcase?.screenshots || [])];
                                        newSS[idx].label = e.target.value;
                                        setLocalData({...localData, paytmShowcase: {...localData.paytmShowcase, screenshots: newSS}});
                                    }}
                                />
                           </div>
                        </div>
                      ))}
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                  <div className="space-y-4">
                     <h3 className="text-[11px] font-mono text-[var(--accent)] uppercase tracking-[0.2em] font-bold">Brand & Theme</h3>
                     <div className="space-y-4">
                         <div className="space-y-2">
                             <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Site Name</label>
                             <input 
                                 className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-sm outline-none"
                                 value={localData.siteName}
                                 onChange={e => setLocalData({...localData, siteName: e.target.value})}
                             />
                         </div>
                         <div className="space-y-2">
                             <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Interface Accent Color</label>
                             <div className="flex gap-3 items-center">
                                 <div className="w-12 h-12 rounded-lg border border-white/10 shrink-0" style={{ backgroundColor: localData.accentColor }} />
                                 <input 
                                     className="flex-1 bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-xs font-mono outline-none"
                                     value={localData.accentColor}
                                     onChange={e => setLocalData({...localData, accentColor: e.target.value.toUpperCase()})}
                                 />
                             </div>
                         </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] font-bold border-b border-white/10 pb-2">Hero Copy</h3>
                     <div className="space-y-4">
                         <div className="space-y-2">
                             <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Floating Tagline</label>
                             <input 
                                 className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white text-xs"
                                 value={localData.heroTagline}
                                 onChange={e => setLocalData({...localData, heroTagline: e.target.value})}
                             />
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                             {['Part 1', 'Part 2', 'Part 3'].map((p, i) => (
                                 <input 
                                     key={i}
                                     className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-[11px] outline-none"
                                     value={(localData as any)[`heroTitlePart${i+1}`]}
                                     onChange={e => setLocalData({...localData, [`heroTitlePart${i+1}`]: e.target.value})}
                                 />
                             ))}
                         </div>
                         <textarea 
                             className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-xs h-24 resize-none"
                             value={localData.heroDescription}
                             onChange={e => setLocalData({...localData, heroDescription: e.target.value})}
                         />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] font-bold border-b border-white/10 pb-2">Platform Metrics</h3>
                     <div className="space-y-3">
                         {localData.stats.map((stat: any, i: number) => (
                             <div key={i} className="flex gap-2">
                                 <input 
                                     className="w-1/3 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-[11px] font-bold"
                                     value={stat.number}
                                     onChange={e => {
                                         const newS = [...localData.stats];
                                         newS[i].number = e.target.value;
                                         setLocalData({...localData, stats: newS});
                                     }}
                                 />
                                 <input 
                                     className="w-2/3 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-[11px]"
                                     value={stat.label}
                                     onChange={e => {
                                         const newS = [...localData.stats];
                                         newS[i].label = e.target.value;
                                         setLocalData({...localData, stats: newS});
                                     }}
                                 />
                             </div>
                         ))}
                     </div>
                  </div>
              </div>
           )}

          {activeTab === 'pricing' && (
             <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                  <div className="space-y-4">
                     <h3 className="text-[11px] font-mono text-[var(--accent)] uppercase tracking-[0.2em] font-bold">Pricing Section Settings</h3>
                     <div className="space-y-4">
                         <div className="space-y-2">
                             <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Section Overline</label>
                             <input 
                                 className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-xs outline-none focus:border-[var(--accent)]"
                                 value={localData?.pricing?.tagline || ''}
                                 onChange={e => setLocalData({
                                   ...localData,
                                   pricing: { ...(localData?.pricing || {}), tagline: e.target.value }
                                 })}
                             />
                         </div>
                         <div className="space-y-2">
                             <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Section Title</label>
                             <input 
                                 className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-xs outline-none focus:border-[var(--accent)]"
                                 value={localData?.pricing?.title || ''}
                                 onChange={e => setLocalData({
                                   ...localData,
                                   pricing: { ...(localData?.pricing || {}), title: e.target.value }
                                 })}
                             />
                         </div>
                         <div className="space-y-2">
                             <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Section Subtitle</label>
                             <textarea 
                                 className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-xs h-20 outline-none resize-none focus:border-[var(--accent)]"
                                 value={localData?.pricing?.subtitle || ''}
                                 onChange={e => setLocalData({
                                   ...localData,
                                   pricing: { ...(localData?.pricing || {}), subtitle: e.target.value }
                                 })}
                             />
                         </div>
                     </div>
                  </div>

                  {/* Tier 1 */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                     <h3 className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] font-bold">Tier 1: Artifact (PDF)</h3>
                     <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                             <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Price Label</label>
                             <input 
                                 className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-xs outline-none focus:border-[var(--accent)]"
                                 value={localData?.pricing?.tier1Price || ''}
                                 onChange={e => setLocalData({
                                   ...localData,
                                   pricing: { ...(localData?.pricing || {}), tier1Price: e.target.value }
                                 })}
                             />
                         </div>
                         <div className="space-y-1">
                             <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Original Price</label>
                             <input 
                                 className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-[11px] outline-none focus:border-[var(--accent)]"
                                 value={localData?.pricing?.tier1OriginalPrice || ''}
                                 onChange={e => setLocalData({
                                   ...localData,
                                   pricing: { ...(localData?.pricing || {}), tier1OriginalPrice: e.target.value }
                                 })}
                             />
                         </div>
                     </div>

                     <div className="space-y-2">
                         <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Pricing Features</label>
                         <div className="space-y-2">
                             {(localData?.pricing?.tier1Features || [
                               'Signature PDF Layout',
                               'Instant Source Access',
                               'Print-ready Assets',
                               'Basic Customization'
                             ]).map((feat: string, idx: number) => (
                                 <div key={idx} className="flex gap-2">
                                     <input 
                                         className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-xs outline-none focus:border-[var(--accent)]"
                                         value={feat}
                                         onChange={e => {
                                             const newFeats = [...(localData?.pricing?.tier1Features || [
                                               'Signature PDF Layout',
                                               'Instant Source Access',
                                               'Print-ready Assets',
                                               'Basic Customization'
                                             ])];
                                             newFeats[idx] = e.target.value;
                                             setLocalData({
                                                 ...localData,
                                                 pricing: { ...(localData?.pricing || {}), tier1Features: newFeats }
                                             });
                                         }}
                                     />
                                     <button 
                                         type="button"
                                         onClick={() => {
                                             const newFeats = [...(localData?.pricing?.tier1Features || [
                                               'Signature PDF Layout',
                                               'Instant Source Access',
                                               'Print-ready Assets',
                                               'Basic Customization'
                                             ])];
                                             newFeats.splice(idx, 1);
                                             setLocalData({
                                                 ...localData,
                                                 pricing: { ...(localData?.pricing || {}), tier1Features: newFeats }
                                             });
                                         }}
                                         className="text-red-400 hover:text-red-500 text-xs px-2"
                                     >
                                         ✕
                                     </button>
                                 </div>
                             ))}
                             <button
                                 type="button"
                                 onClick={() => {
                                     const newFeats = [...(localData?.pricing?.tier1Features || [
                                       'Signature PDF Layout',
                                       'Instant Source Access',
                                       'Print-ready Assets',
                                       'Basic Customization'
                                     ]), ''];
                                     setLocalData({
                                         ...localData,
                                         pricing: { ...(localData?.pricing || {}), tier1Features: newFeats }
                                     });
                                 }}
                                 className="text-[10px] font-mono text-[var(--accent)] hover:underline block"
                             >
                                 + Add Feature
                             </button>
                         </div>
                     </div>
                  </div>

                  {/* Tier 2 */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                     <h3 className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] font-bold">Tier 2: Experiences (Site Bundle)</h3>
                     <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                             <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Price Label</label>
                             <input 
                                 className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-xs outline-none focus:border-[var(--accent)]"
                                 value={localData?.pricing?.tier2Price || ''}
                                 onChange={e => setLocalData({
                                   ...localData,
                                   pricing: { ...(localData?.pricing || {}), tier2Price: e.target.value }
                                 })}
                             />
                         </div>
                         <div className="space-y-1">
                             <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Original Price</label>
                             <input 
                                 className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-[11px] outline-none focus:border-[var(--accent)]"
                                 value={localData?.pricing?.tier2OriginalPrice || ''}
                                 onChange={e => setLocalData({
                                   ...localData,
                                   pricing: { ...(localData?.pricing || {}), tier2OriginalPrice: e.target.value }
                                 })}
                             />
                         </div>
                     </div>

                     <div className="space-y-2">
                         <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Pricing Features</label>
                         <div className="space-y-2">
                             {(localData?.pricing?.tier2Features || [
                               'Netflix Site Bundle',
                               'Full JSX Components',
                               'Interactive Profiles',
                               'Live Preview Hosting',
                               'Priority Support'
                             ]).map((feat: string, idx: number) => (
                                 <div key={idx} className="flex gap-2">
                                     <input 
                                         className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-xs outline-none focus:border-[var(--accent)]"
                                         value={feat}
                                         onChange={e => {
                                             const newFeats = [...(localData?.pricing?.tier2Features || [
                                               'Netflix Site Bundle',
                                               'Full JSX Components',
                                               'Interactive Profiles',
                                               'Live Preview Hosting',
                                               'Priority Support'
                                             ])];
                                             newFeats[idx] = e.target.value;
                                             setLocalData({
                                                 ...localData,
                                                 pricing: { ...(localData?.pricing || {}), tier2Features: newFeats }
                                             });
                                         }}
                                     />
                                     <button 
                                         type="button"
                                         onClick={() => {
                                             const newFeats = [...(localData?.pricing?.tier2Features || [
                                               'Netflix Site Bundle',
                                               'Full JSX Components',
                                               'Interactive Profiles',
                                               'Live Preview Hosting',
                                               'Priority Support'
                                             ])];
                                             newFeats.splice(idx, 1);
                                             setLocalData({
                                                 ...localData,
                                                 pricing: { ...(localData?.pricing || {}), tier2Features: newFeats }
                                             });
                                         }}
                                         className="text-red-400 hover:text-red-500 text-xs px-2"
                                     >
                                         ✕
                                     </button>
                                 </div>
                             ))}
                             <button
                                 type="button"
                                 onClick={() => {
                                     const newFeats = [...(localData?.pricing?.tier2Features || [
                                       'Netflix Site Bundle',
                                       'Full JSX Components',
                                       'Interactive Profiles',
                                       'Live Preview Hosting',
                                       'Priority Support'
                                     ]), ''];
                                     setLocalData({
                                         ...localData,
                                         pricing: { ...(localData?.pricing || {}), tier2Features: newFeats }
                                     });
                                 }}
                                 className="text-[10px] font-mono text-[var(--accent)] hover:underline block"
                             >
                                 + Add Feature
                             </button>
                         </div>
                     </div>
                  </div>

                  {/* Tier 3 */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                     <h3 className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] font-bold">Tier 3: The Vault</h3>
                     <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                             <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Price Label</label>
                             <input 
                                 className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-xs outline-none focus:border-[var(--accent)]"
                                 value={localData?.pricing?.tier3Price || ''}
                                 onChange={e => setLocalData({
                                   ...localData,
                                   pricing: { ...(localData?.pricing || {}), tier3Price: e.target.value }
                                 })}
                             />
                         </div>
                         <div className="space-y-1">
                             <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Original Price</label>
                             <input 
                                 className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-[11px] outline-none focus:border-[var(--accent)]"
                                 value={localData?.pricing?.tier3OriginalPrice || ''}
                                 onChange={e => setLocalData({
                                   ...localData,
                                   pricing: { ...(localData?.pricing || {}), tier3OriginalPrice: e.target.value }
                                 })}
                             />
                         </div>
                     </div>

                     <div className="space-y-2">
                         <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Pricing Features</label>
                         <div className="space-y-2">
                             {(localData?.pricing?.tier3Features || [
                               'Complete Collection Access',
                               'Exclusive Beta Templates',
                               'Private Community',
                               'Early Access to Updates'
                             ]).map((feat: string, idx: number) => (
                                 <div key={idx} className="flex gap-2">
                                     <input 
                                         className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-xs outline-none focus:border-[var(--accent)]"
                                         value={feat}
                                         onChange={e => {
                                             const newFeats = [...(localData?.pricing?.tier3Features || [
                                               'Complete Collection Access',
                                               'Exclusive Beta Templates',
                                               'Private Community',
                                               'Early Access to Updates'
                                             ])];
                                             newFeats[idx] = e.target.value;
                                             setLocalData({
                                                 ...localData,
                                                 pricing: { ...(localData?.pricing || {}), tier3Features: newFeats }
                                             });
                                         }}
                                     />
                                     <button 
                                         type="button"
                                         onClick={() => {
                                             const newFeats = [...(localData?.pricing?.tier3Features || [
                                               'Complete Collection Access',
                                               'Exclusive Beta Templates',
                                               'Private Community',
                                               'Early Access to Updates'
                                             ])];
                                             newFeats.splice(idx, 1);
                                             setLocalData({
                                                 ...localData,
                                                 pricing: { ...(localData?.pricing || {}), tier3Features: newFeats }
                                             });
                                         }}
                                         className="text-red-400 hover:text-red-500 text-xs px-2"
                                     >
                                         ✕
                                     </button>
                                 </div>
                             ))}
                             <button
                                 type="button"
                                 onClick={() => {
                                     const newFeats = [...(localData?.pricing?.tier3Features || [
                                       'Complete Collection Access',
                                       'Exclusive Beta Templates',
                                       'Private Community',
                                       'Early Access to Updates'
                                     ]), ''];
                                     setLocalData({
                                         ...localData,
                                         pricing: { ...(localData?.pricing || {}), tier3Features: newFeats }
                                     });
                                 }}
                                 className="text-[10px] font-mono text-[var(--accent)] hover:underline block"
                             >
                                 + Add Feature
                             </button>
                         </div>
                     </div>
                  </div>
             </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <h3 className="text-sm font-mono text-[var(--accent)] uppercase tracking-[0.2em] font-bold">
                        {editingProduct ? (editingProduct.id ? 'Edit Artifact' : 'New Artifact') : 'Manage Artifacts'}
                    </h3>
                    {!editingProduct ? (
                        <button 
                            onClick={() => setEditingProduct({
                                type: 'site',
                                category: categoriesFromDB[0] || 'Anniversary',
                                title: '',
                                desc: '',
                                price: 'FREE',
                                original: '₹999',
                                seed: Math.floor(Math.random() * 1000),
                                isNew: true,
                                isBest: false,
                                whatsInside: ['High-fidelity design font', 'Fully customizable structure', 'Interactive animations'],
                                imageUrl: '',
                                pdfUrl: '',
                                videoUrl: ''
                            })}
                            className="bg-white text-black px-4 py-2 rounded-xl text-xs font-mono tracking-widest uppercase font-bold hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
                        >
                            + Create New
                        </button>
                    ) : (
                        <button 
                            onClick={() => setEditingProduct(null)}
                            className="text-gray-400 hover:text-white text-xs font-mono tracking-widest uppercase cursor-pointer"
                        >
                            ← Back to List
                        </button>
                    )}
                </div>

                {editingProduct ? (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Type</label>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[var(--accent)]"
                                    value={editingProduct.type}
                                    onChange={e => setEditingProduct({...editingProduct, type: e.target.value})}
                                >
                                    <option value="site" className="bg-black text-white">Website (Interactive)</option>
                                    <option value="pdf" className="bg-black text-white">PDF (Printable)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Category</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[var(--accent)]"
                                    value={editingProduct.category}
                                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                                >
                                    {categoriesFromDB.map((cat: string) => (
                                        <option key={cat} value={cat} className="bg-black text-white">{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Title</label>
                            <input 
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[var(--accent)]"
                                value={editingProduct.title}
                                onChange={e => setEditingProduct({...editingProduct, title: e.target.value})}
                                placeholder="Netflix Inspired..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Description</label>
                            <textarea 
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[var(--accent)] h-24 resize-none"
                                value={editingProduct.desc}
                                onChange={e => setEditingProduct({...editingProduct, desc: e.target.value})}
                                placeholder="Describe the template..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Promo Price</label>
                                <input 
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[var(--accent)]"
                                    value={editingProduct.price}
                                    onChange={setEditingProduct ? e => setEditingProduct({...editingProduct, price: e.target.value}) : undefined}
                                    placeholder="FREE"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Strike Price</label>
                                <input 
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[var(--accent)]"
                                    value={editingProduct.original || ''}
                                    onChange={e => setEditingProduct({...editingProduct, original: e.target.value})}
                                    placeholder="₹999"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-1">
                                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Seed ID</label>
                                <input 
                                    type="number"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[var(--accent)]"
                                    value={editingProduct.seed}
                                    onChange={e => setEditingProduct({...editingProduct, seed: parseInt(e.target.value) || 0})}
                                />
                            </div>
                            <div className="space-y-2 col-span-1 flex flex-col justify-end pb-3">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-gray-400 uppercase">
                                    <input 
                                        type="checkbox" 
                                        className="accent-[var(--accent)]"
                                        checked={editingProduct.isNew}
                                        onChange={e => setEditingProduct({...editingProduct, isNew: e.target.checked})}
                                    />
                                    Is New
                                </label>
                            </div>
                            <div className="space-y-2 col-span-1 flex flex-col justify-end pb-3">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-gray-400 uppercase">
                                    <input 
                                        type="checkbox" 
                                        className="accent-[var(--accent)]"
                                        checked={editingProduct.isBest}
                                        onChange={e => setEditingProduct({...editingProduct, isBest: e.target.checked})}
                                    />
                                    Is Featured
                                </label>
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Cover Image</label>
                            <div className="flex gap-4 items-center">
                                <div className="relative w-16 h-20 bg-black border border-white/10 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    {editingProduct.imageUrl ? (
                                        <img src={editingProduct.imageUrl} alt="preview" className="w-full h-full object-cover"/>
                                    ) : (
                                        <span className="text-[9px] text-gray-600 font-mono text-center px-1">No Image</span>
                                    )}
                                    {uploadingProductImg && (
                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="relative">
                                        <input 
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setUploadingProductImg(true);
                                                    const storageRef = ref(storage, `products/images/${Date.now()}_${file.name}`);
                                                    uploadBytes(storageRef, file).then(snap => getDownloadURL(snap.ref)).then(url => {
                                                        setEditingProduct((prev: any) => ({ ...prev, imageUrl: url }));
                                                    }).catch(err => {
                                                        console.error(err);
                                                        alert("Image upload failed");
                                                    }).finally(() => {
                                                        setUploadingProductImg(false);
                                                    });
                                                }
                                            }}
                                        />
                                        <button className="w-full bg-white/5 border border-white/10 text-white hover:border-[var(--accent)] rounded px-4 py-2.5 text-xs font-mono transition-colors text-center cursor-pointer">
                                            {uploadingProductImg ? 'Uploading cover...' : 'Choose Cover Image'}
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-gray-500 font-mono mt-1">aspect ratio 3:4 (card style)</p>
                                </div>
                            </div>
                        </div>

                        {/* PDF (ONLY FOR PDF) */}
                        {editingProduct.type === 'pdf' && (
                            <div className="space-y-2 bg-[#161616]/40 p-4 rounded-xl border border-white/5">
                                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold text-[var(--accent)]">PDF Document</label>
                                <div className="space-y-3">
                                    <input 
                                        type="text"
                                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[var(--accent)]"
                                        placeholder="Paste manual Google Docs / PDF url..."
                                        value={editingProduct.pdfUrl || ''}
                                        onChange={e => setEditingProduct({...editingProduct, pdfUrl: e.target.value})}
                                    />
                                    <div className="relative">
                                        <input 
                                            type="file"
                                            accept="application/pdf"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setUploadingProductPdf(true);
                                                    const storageRef = ref(storage, `products/pdfs/${Date.now()}_${file.name}`);
                                                    uploadBytes(storageRef, file).then(snap => getDownloadURL(snap.ref)).then(url => {
                                                        setEditingProduct((prev: any) => ({ ...prev, pdfUrl: url }));
                                                    }).catch(err => {
                                                        console.error(err);
                                                        alert("PDF upload failed");
                                                    }).finally(() => {
                                                        setUploadingProductPdf(false);
                                                    });
                                                }
                                            }}
                                        />
                                        <button className="w-full bg-white/5 border border-white/10 text-white hover:border-[var(--accent)] rounded px-4 py-2.5 text-xs font-mono transition-all text-center flex items-center justify-center gap-2 cursor-pointer">
                                            {uploadingProductPdf ? (
                                                <div className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                '📤'
                                            )}
                                            {uploadingProductPdf ? 'Uploading PDF doc...' : 'Upload PDF Document'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Video (WALKTHROUGH TOUR FOR PRODUCT) */}
                        <div className="space-y-2 bg-[#161616]/40 p-4 rounded-xl border border-white/5">
                            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold text-[var(--accent)]">Walkthrough / Demo Video</label>
                            <div className="space-y-3">
                                <input 
                                    type="text"
                                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[var(--accent)]"
                                    placeholder="Paste YouTube or custom video URL..."
                                    value={editingProduct.videoUrl || ''}
                                    onChange={e => setEditingProduct({...editingProduct, videoUrl: e.target.value})}
                                />
                                <div className="relative">
                                    <input 
                                        type="file"
                                        accept="video/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setUploadingProductVideo(true);
                                                const storageRef = ref(storage, `products/videos/${Date.now()}_${file.name}`);
                                                uploadBytes(storageRef, file).then(snap => getDownloadURL(snap.ref)).then(url => {
                                                    setEditingProduct((prev: any) => ({ ...prev, videoUrl: url }));
                                                }).catch(err => {
                                                    console.error(err);
                                                    alert("Video upload failed");
                                                }).finally(() => {
                                                    setUploadingProductVideo(false);
                                                });
                                            }
                                        }}
                                    />
                                    <button className="w-full bg-white/5 border border-white/10 text-white hover:border-[var(--accent)] rounded px-4 py-2.5 text-xs font-mono transition-all text-center flex items-center justify-center gap-2 cursor-pointer">
                                        {uploadingProductVideo ? (
                                            <div className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            '🎥'
                                        )}
                                        {uploadingProductVideo ? 'Uploading video walkthrough...' : 'Upload Video Walkthrough'}
                                    </button>
                                </div>
                                {editingProduct.videoUrl && (
                                    <div className="mt-2 p-2 bg-black/40 border border-white/5 rounded text-[11px] text-gray-400 flex items-center justify-between">
                                        <span className="truncate flex-1 pr-4">{editingProduct.videoUrl}</span>
                                        <button 
                                            onClick={() => setEditingProduct({...editingProduct, videoUrl: ''})}
                                            className="text-red-500 hover:text-red-400 px-2 py-0.5 font-bold cursor-pointer"
                                        >
                                            Delete Video
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* What's Inside */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">What's Inside Features</label>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-xs outline-none focus:border-[var(--accent)]"
                                    placeholder="Add bullet point, e.g. Fully responsive code"
                                    id="new-bullet-input"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            const input = e.currentTarget;
                                            const newBullet = input.value.trim();
                                            if (newBullet && editingProduct.whatsInside) {
                                                setEditingProduct({
                                                    ...editingProduct,
                                                    whatsInside: [...editingProduct.whatsInside, newBullet]
                                                });
                                                input.value = '';
                                            }
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const input = document.getElementById('new-bullet-input') as HTMLInputElement;
                                        const newBullet = input?.value.trim();
                                        if (newBullet && editingProduct.whatsInside) {
                                            setEditingProduct({
                                                ...editingProduct,
                                                whatsInside: [...editingProduct.whatsInside, newBullet]
                                            });
                                            input.value = '';
                                        }
                                    }}
                                    className="bg-white/5 border border-white/10 hover:border-[var(--accent)] px-4 rounded-lg text-white font-mono text-xs font-bold cursor-pointer"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {editingProduct.whatsInside && editingProduct.whatsInside.map((item: string, idx: number) => (
                                    <div key={idx} className="bg-white/40 text-white text-[11px] px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                                        <span>{item}</span>
                                        <button 
                                            onClick={() => {
                                                const list = [...editingProduct.whatsInside];
                                                list.splice(idx, 1);
                                                setEditingProduct({...editingProduct, whatsInside: list});
                                            }}
                                            className="text-red-500 hover:text-red-400 font-bold"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Save Actions */}
                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <button 
                                onClick={() => setEditingProduct(null)}
                                className="flex-1 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white py-3 rounded-xl text-xs font-mono tracking-widest uppercase cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={async () => {
                                    if (!editingProduct.title || !editingProduct.desc) {
                                        alert("Title and Description are required");
                                        return;
                                    }
                                    setIsSavingProduct(true);
                                    try {
                                        const payload = {
                                            type: editingProduct.type,
                                            category: editingProduct.category,
                                            title: editingProduct.title,
                                            desc: editingProduct.desc,
                                            price: editingProduct.price || 'FREE',
                                            original: editingProduct.original || '₹999',
                                            seed: editingProduct.seed || Math.floor(Math.random() * 1000),
                                            isNew: !!editingProduct.isNew,
                                            isBest: !!editingProduct.isBest,
                                            imageUrl: editingProduct.imageUrl || '',
                                            whatsInside: editingProduct.whatsInside || [],
                                            updatedAt: serverTimestamp()
                                        } as any;

                                        payload.pdfUrl = editingProduct.pdfUrl || '';
                                        payload.videoUrl = editingProduct.videoUrl || '';

                                        if (editingProduct.id) {
                                            const prodRef = doc(db, 'products', editingProduct.id);
                                            await updateDoc(prodRef, payload);
                                            alert("Artifact updated successfully!");
                                        } else {
                                            payload.createdAt = serverTimestamp();
                                            await addDoc(collection(db, 'products'), payload);
                                            alert("New artifact created successfully!");
                                        }
                                        setEditingProduct(null);
                                    } catch (err: any) {
                                        console.error(err);
                                        alert("Failed to save product: " + err.message);
                                    } finally {
                                        setIsSavingProduct(false);
                                    }
                                }}
                                disabled={isSavingProduct || uploadingProductImg || uploadingProductPdf || uploadingProductVideo}
                                className="flex-1 bg-[var(--accent)] hover:brightness-110 text-white py-3 rounded-xl text-xs font-mono tracking-widest font-black uppercase flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSavingProduct ? (
                                    <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Save Artifact'
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* PRODUCTS LIST */
                    <div className="space-y-4">
                        {products && products.length === 0 ? (
                            <div className="p-12 text-center text-gray-600 text-xs font-mono uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">
                                No artifacts standardly loaded
                            </div>
                        ) : (
                            products && products.map((product: any) => (
                                <div key={product.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex gap-4 items-center group">
                                    <div className="w-12 h-16 rounded overflow-hidden shrink-0 border border-white/10 bg-black flex items-center justify-center relative">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] text-gray-700 font-mono">Cover</span>
                                        )}
                                        <div className={`absolute top-0.5 left-0.5 px-1 py-[1px] text-[7px] font-mono font-bold rounded ${
                                            product.type === 'pdf' ? 'bg-[#FFD60A] text-black' : 'bg-[#FF3B3B] text-white'
                                        }`}>
                                            {product.type.toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white text-xs font-bold truncate group-hover:text-[var(--accent)] transition-colors">{product.title}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] font-mono text-[#FF3B3B] uppercase">{product.category}</span>
                                            <span className="text-gray-600 text-[9px] font-mono">•</span>
                                            <span className="text-[9px] font-mono text-gray-500">{product.price} ({product.original || '₹999'})</span>
                                        </div>
                                        {product.type === 'site' && (
                                            <div className="text-[8px] font-mono text-gray-400 mt-1 truncate">
                                                {product.videoUrl ? `🎥 Walkthrough Video set` : `⚠️ No Walkthrough Video`}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button 
                                            onClick={() => setEditingProduct({ ...product })}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                                            title="Edit Artifact"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteProduct(product.id)}
                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all cursor-pointer"
                                            title="Delete Artifact"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <h3 className="text-[11px] font-mono text-[var(--accent)] uppercase tracking-[0.2em] font-bold">Incoming Requests</h3>
                <div className="space-y-4">
                    {leads.length === 0 ? (
                        <div className="p-12 text-center text-gray-600 text-xs font-mono uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">
                            Queue is empty
                        </div>
                    ) : (
                        leads.map(lead => (
                            <div key={lead.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-white font-bold text-sm">{lead.name}</h4>
                                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{lead.email}</p>
                                        <p className="text-[10px] text-gray-500 font-mono">{lead.phone}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteLead(lead.id)}
                                        className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/5">
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-gray-600 uppercase font-mono">Occasion</span>
                                        <p className="text-[11px] text-gray-300">{lead.occasion}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <span className="text-[9px] text-gray-600 uppercase font-mono">Artifact</span>
                                        <p className="text-[11px] text-[var(--accent)] font-bold">{lead.productTitle}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-gray-600 font-mono uppercase">{lead.createdAt?.toDate ? new Date(lead.createdAt.toDate()).toLocaleDateString() : 'Just now'}</span>
                                    <select 
                                        className="bg-black border border-white/10 rounded-lg text-[9px] uppercase font-mono px-2 py-1 outline-none text-gray-400 focus:text-white"
                                        value={lead.status || 'pending'}
                                        onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="delivered">Delivered</option>
                                    </select>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-[#0A0A0A] flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-opacity-40">
           <div className="flex flex-col">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Status</span>
              <span className="text-[9px] font-mono text-green-500 uppercase tracking-widest font-bold">Online & Validated</span>
           </div>
           <div className="flex gap-3">
              <button disabled={isSaving} onClick={onClose} className="px-6 py-2.5 text-xs font-mono tracking-widest uppercase text-gray-400 hover:text-white transition-colors">Abort</button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[var(--accent)] text-white px-8 py-3 rounded-xl text-xs font-mono tracking-[0.2em] uppercase font-black hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              >
                {isSaving ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Deploy Changes"}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
