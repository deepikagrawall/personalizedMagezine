/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db, storage } from './lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- DATA ---

// --- PURCHASE MODAL ---
const PurchaseModal = ({ product, isOpen, onClose }: { product: any, isOpen: boolean, onClose: () => void }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    occasion: 'Anniversary',
    coupleNames: '',
    message: '',
    referral: 'Google',
    format: 'PDF'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStep('form');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'requests'), {
        ...formData,
        productId: product.id,
        productTitle: product.title,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      console.log('Purchase Submitted:', { ...formData, productTitle: product.title });
      setTimeout(() => {
        setLoading(false);
        setStep('success');
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Error submitting request');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/92 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]">
      <div className="relative bg-[#111] border border-[#2A2A2A] rounded-2xl w-full max-w-[560px] p-8 md:p-12 overflow-y-auto max-h-[95vh] no-scrollbar">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {step === 'form' ? (
          <div>
            <span className="font-mono text-[11px] text-[var(--accent)] tracking-widest font-bold mb-3 block uppercase">✦ ONE-TIME PURCHASE</span>
            <h2 className="font-display text-3xl text-white font-bold mb-2">Get {product.title}</h2>
            <p className="text-gray-500 text-sm mb-8">Fill in your details and we'll deliver your template instantly.</p>
            
            <div className="flex items-center gap-4 mb-4">
               <span className="text-3xl font-bold text-white">{product.price}</span>
               {product.original && <span className="text-gray-600 line-through text-sm">{product.original}</span>}
            </div>
            <div className="space-y-2 mb-8">
               <p className="text-[11px] text-gray-600 flex items-center gap-2">✓ Instant delivery</p>
               <p className="text-[11px] text-gray-600 flex items-center gap-2">✓ Full source code</p>
               <p className="text-[11px] text-gray-600 flex items-center gap-2">✓ Setup guide included</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] text-gray-400">Full Name *</label>
                  <input 
                    className={`w-full bg-[#0A0A0A] border ${errors.name ? 'border-[var(--accent)]' : 'border-[#2A2A2A]'} rounded-lg px-4 py-3.5 text-white outline-none focus:border-[var(--accent)] transition-all`}
                    placeholder="Your name"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  {errors.name && <p className="text-[var(--accent)] text-[10px] uppercase font-bold">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] text-gray-400">Email Address *</label>
                  <input 
                    className={`w-full bg-[#0A0A0A] border ${errors.email ? 'border-[var(--accent)]' : 'border-[#2A2A2A]'} rounded-lg px-4 py-3.5 text-white outline-none focus:border-[var(--accent)] transition-all`}
                    placeholder="your@email.com"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                  {errors.email && <p className="text-[var(--accent)] text-[10px] uppercase font-bold">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] text-gray-400">Phone Number</label>
                  <input 
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3.5 text-white outline-none focus:border-[var(--accent)] transition-all"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] text-gray-400">Occasion Type</label>
                  <select 
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3.5 text-white outline-none focus:border-[var(--accent)] transition-all appearance-none"
                    value={formData.occasion}
                    onChange={e => setFormData({...formData, occasion: e.target.value})}
                  >
                    {['Anniversary', 'Birthday', 'Proposal', 'Couple', 'Memorial', 'Friendship', 'Other'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {product.title.toLowerCase().includes('netflix') || product.category.toLowerCase().includes('anniversary') ? (
                <div className="space-y-1.5">
                  <label className="text-[13px] text-gray-400">Couple Names (Optional)</label>
                  <input 
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3.5 text-white outline-none focus:border-[var(--accent)] transition-all"
                    placeholder="e.g. Priya & Karan"
                    value={formData.coupleNames}
                    onChange={e => setFormData({...formData, coupleNames: e.target.value})}
                  />
                </div>
              ) : (
                 <div className="space-y-1.5">
                    <label className="text-[13px] text-gray-400">Preferred File Format</label>
                    <select 
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3.5 text-white outline-none focus:border-[var(--accent)] transition-all appearance-none"
                        value={formData.format}
                        onChange={e => setFormData({...formData, format: e.target.value})}
                    >
                        <option value="PDF">PDF</option>
                        <option value="PNG">PNG</option>
                        <option value="Both">Both</option>
                    </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[13px] text-gray-400">Special Message (Optional)</label>
                <textarea 
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3.5 text-white outline-none focus:border-[var(--accent)] transition-all h-24 resize-none"
                  placeholder="Any customization notes or special requests..."
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] text-gray-400">How did you hear about us?</label>
                <select 
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3.5 text-white outline-none focus:border-[var(--accent)] transition-all appearance-none"
                    value={formData.referral}
                    onChange={e => setFormData({...formData, referral: e.target.value})}
                >
                    {['Instagram', "Friend's Recommendation", 'Google', 'Other'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--accent)] text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Complete Purchase →"}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[var(--accent)] rounded-full flex items-center justify-center mx-auto mb-8 animate-[scaleIn_0.5s_ease-out]">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="font-display text-3xl text-white font-bold mb-4">Order Received!</h2>
            <p className="text-gray-400 mb-2">Check your email at <span className="text-white font-bold">{formData.email}</span> for download link and setup guide.</p>
            <p className="text-gray-600 text-xs mb-10">We typically respond within 2 hours.</p>
            <button onClick={onClose} className="text-gray-400 hover:text-white font-bold">← Browse More Templates</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- HOOKS ---

function useIntersectionObserver() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observe = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.15 });
    }
    observerRef.current.observe(el);
  }, []);

  return observe;
}

// --- COMPONENTS ---

// --- ADMIN SIDE PANEL ---
const AdminSidePanel = ({ isOpen, onClose, data, onUpdate }: { isOpen: boolean, onClose: () => void, data: any, onUpdate: (newData: any) => void }) => {
  const [activeTab, setActiveTab] = useState<'netflix' | 'products' | 'settings' | 'leads'>('netflix');
  const [localData, setLocalData] = useState(data);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [leads, setLeads] = useState<any[]>([]);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'hero'), { ...localData, updatedAt: serverTimestamp() });
      alert('Success! Site content synchronized across all users.');
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
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
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
            { id: 'settings', label: 'Hero & Identity' },
            { id: 'products', label: 'Artifacts' },
            { id: 'leads', label: 'User Leads' }
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
                                            className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-500 hover:text-white"
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
                                    <span className="text-[9px] text-gray-600 font-mono uppercase">{new Date(lead.createdAt?.toDate()).toLocaleDateString()}</span>
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

        <div className="p-6 border-t border-white/10 bg-[#0A0A0A] flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
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

const PreviewModal: React.FC<{ product: any, onClose: () => void, onSave: () => void }> = ({ product, onClose, onSave }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const isNetflix = product.type === 'site' && product.title.toLowerCase().includes('netflix');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (isPreviewMode && product.type === 'site') {
    return (
      <div className="fixed inset-0 z-[350] bg-black flex flex-col animate-[modalEnter_0.4s_ease-out]">
        <div className="h-14 bg-[#111] border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <span className="text-white font-semibold">{product.title}</span>
            <div className="bg-[#FF3B3B] text-white text-[10px] font-mono px-2 py-0.5 rounded uppercase">Live Preview</div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white" onClick={() => setIsPreviewMode(false)}>Exit Preview</button>
            <button onClick={onClose} className="bg-[#FF3B3B] text-white px-4 py-1.5 rounded text-sm font-bold">Close Artifact</button>
          </div>
        </div>
        <div className="flex-1 bg-black relative">
           {isNetflix && <div className="absolute top-8 left-8 z-10 font-black text-[#E50914] text-3xl tracking-tighter italic">NETFLIX</div>}
           <div className="flex flex-col items-center justify-center h-full">
              {isNetflix ? (
                <>
                  <h3 className="text-white font-light text-5xl mb-12">Who's watching?</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {["1 Month", "2 Months", "3 Months", "5 Months"].map((l: string, i: number) => (
                      <div key={i} className="flex flex-col items-center gap-4">
                        <div className="w-32 h-32 md:w-44 md:h-44 rounded bg-blue-600 hover:ring-4 ring-white transition-all cursor-pointer"></div>
                        <span className="text-gray-400 text-lg uppercase tracking-widest">{l}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center">
                    <p className="text-white text-2xl font-display italic">Live Preview Active</p>
                    <p className="text-gray-500 mt-4 max-w-sm mx-auto">This is a dynamic placeholder for your custom website template.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#111] border border-[#2A2A2A] rounded-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col md:flex-row animate-[modalEnter_0.4s_ease-out]"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-[10] p-2 rounded-full bg-black/50 text-white hover:bg-white/10 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#0A0A0A] p-4 md:p-12">
          <div className="max-w-3xl mx-auto space-y-12">
            {product.type === 'pdf' && product.pdfUrl ? (
              <div className="w-full min-h-[500px] md:min-h-[800px] bg-white rounded-lg overflow-hidden shadow-2xl relative">
                {/* Fallback for mobile since standard iFrame PDF view often fails */}
                <iframe 
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(product.pdfUrl)}&embedded=true`}
                  className="w-full h-[500px] md:h-[800px]"
                  title="PDF Preview"
                />
                <div className="md:hidden p-4 bg-black/5 flex justify-center">
                    <a 
                        href={product.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-mono uppercase tracking-widest text-[#FF3B3B] font-bold underline"
                    >
                        Open Full PDF In New Tab
                    </a>
                </div>
              </div>
            ) : product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                className="w-full rounded-lg shadow-[0_40px_80px_rgba(0,0,0,0.8)]"
                alt={product.title}
              />
            ) : (
                <div className="w-full aspect-[3/4] bg-[#111] rounded-lg animate-pulse flex items-center justify-center text-gray-700 font-mono text-xs uppercase">No Image Artifact</div>
            )}

            {product.type === 'site' && (
                <div className="bg-[#161616] h-[400px] rounded-lg border border-white/5 flex flex-col items-center justify-center text-center p-8">
                    <span className="text-4xl mb-4">🖥️</span>
                    <h3 className="text-white text-xl font-bold mb-4">Experience the Full Site</h3>
                    <p className="text-gray-500 mb-8 max-w-md">Try the interactive anniversary experience with full scroll animations, profile picks, and dynamic story moments.</p>
                    <button 
                        onClick={() => setIsPreviewMode(true)}
                        className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-[#FF3B3B] hover:text-white transition-all"
                    >
                        Launch Live Preview
                    </button>
                </div>
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="w-full md:w-[400px] bg-[#161616] border-l border-[#2A2A2A] p-10 flex flex-col overflow-y-auto">
          <div className="mb-10">
            <span className="font-mono text-[10px] text-[#FF3B3B] tracking-[0.3em] uppercase mb-3 block font-bold">{product.category}</span>
            <h2 className="font-display text-4xl font-bold text-white mb-6 leading-tight">{product.title}</h2>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-[10px] font-mono font-medium rounded-full ${
                product.type === 'pdf' ? 'bg-[#FFD60A] text-black' : 'bg-[#FF3B3B] text-white'
              }`}>
                {product.type.toUpperCase()}
              </span>
              <span className="text-green-500 text-xs font-bold uppercase tracking-widest">Available Now</span>
            </div>
          </div>

          <div className="space-y-8 mb-12">
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4 opacity-50">About this Template</h4>
              <p className="text-[#888] text-sm leading-relaxed whitespace-pre-wrap">{product.desc}</p>
            </div>

            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4 opacity-50">What's Inside</h4>
              <ul className="text-[#888] text-sm space-y-3">
                {(product.whatsInside && product.whatsInside.length > 0 ? product.whatsInside : ['High-fidelity resolution', 'Fully editable source files', 'Documentation included']).map((item: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-[#FF3B3B]">✦</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
            {!isNetflix && (
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                       <span className="text-white font-mono font-bold text-4xl">{product.price}</span>
                       <div className="bg-white/5 px-2 py-1 rounded text-[10px] text-gray-500 uppercase tracking-widest">PRO Artifact</div>
                   </div>
                </div>
            )}
            
            <button 
                onClick={onSave}
                className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-[#FF3B3B] hover:text-white transition-all flex items-center justify-center gap-2"
            >
              {isNetflix ? 'Get Access' : 'Save to Library'} <span>+</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ product: any, observe: any, onPreview: (p: any) => void }> = ({ product, observe, onPreview }) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div 
      ref={observe}
      className="group bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden transition-all duration-300 hover:border-[#2A2A2A] hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] transform hover:-translate-y-1"
    >
      <div className={`relative overflow-hidden cursor-pointer ${product.type === 'pdf' ? 'aspect-[3/4]' : 'aspect-video'}`} onClick={() => onPreview(product)}>
        <img 
          src={product.imageUrl || `https://picsum.photos/${product.type === 'pdf' ? '600/800' : '800/450'}?random=${product.seed}`} 
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
            product.type === 'pdf' ? 'bg-[#FFD60A] text-black shadow-lg' : 'bg-[#FF3B3B] text-white shadow-lg'
          }`}>
            {product.type.toUpperCase()}
          </span>
          {product.isNew && (
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white text-black rounded-full shadow-lg">NEW</span>
          )}
        </div>

        {product.isBest && (
          <div className="absolute top-4 right-4 text-[#FFD60A] drop-shadow-lg">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white text-black px-6 py-3 text-xs font-bold rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-2xl flex items-center gap-2">
            View Details <span className="text-[#FF3B3B]">→</span>
          </div>
        </div>

        <button 
            onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
            className={`absolute bottom-4 right-4 z-20 transition-all transform hover:scale-125 ${isLiked ? 'text-[#FF3B3B]' : 'text-white/70 hover:text-white'}`}
        >
            <svg className="w-6 h-6 fill-current drop-shadow-lg" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
        </button>
      </div>

      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-[#FF3B3B] tracking-[0.2em] font-bold uppercase">{product.category}</span>
          <span className="text-[10px] font-mono text-[#666] uppercase">{product.type === 'pdf' ? 'Printable' : 'Interactive'}</span>
        </div>
        <h3 className="text-white font-bold text-xl leading-tight mb-3 group-hover:text-[#FF3B3B] transition-colors cursor-pointer" onClick={() => onPreview(product)}>{product.title}</h3>
        <p className="text-[#666] text-sm mb-6 line-clamp-2 leading-relaxed">{product.desc}</p>
        
        <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex flex-col">
            {!(product.type === 'site' && product.title.toLowerCase().includes('netflix')) ? (
                <>
                    <span className="text-[#444] text-[10px] font-mono uppercase tracking-widest line-through mb-1">{product.original || '₹999'}</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-white font-mono font-black text-2xl tracking-tighter">FREE</span>
                        <span className="text-[var(--accent)] text-[8px] font-bold uppercase tracking-widest">BETA</span>
                    </div>
                </>
            ) : (
                <span className="text-[var(--accent)] text-[10px] font-mono uppercase tracking-[0.2em] font-bold">Limited Beta Access</span>
            )}
          </div>
          <button 
            onClick={() => onPreview(product)}
            className="bg-transparent border border-white/10 text-white hover:bg-white hover:text-black px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 group/btn"
          >
            Preview <span className="transform group-hover/btn:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [products, setProducts] = useState<any[]>([]);
  const [categoriesFromDB, setCategoriesFromDB] = useState<any[]>([]);
  const [activeType, setActiveType] = useState('all');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [purchaseModalProduct, setPurchaseModalProduct] = useState<any>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const testimonials = [
    { text: "recreated everything. even the trailers. worth every penny.", author: "Aryan Sharma", location: "Bangalore" },
    { text: "the pdf layouts are gorgeous. printing it for our desk.", author: "Simron Das", location: "Mumbai" },
    { text: "best thing i found for our anniversary. she was in tears.", author: "Kabir Mehta", location: "Delhi" },
    { text: "High quality artifacts. very premium feel.", author: "Rahul V.", location: "Pune" }
  ];

  const [adminData, setAdminData] = useState<{
    siteName: string;
    accentColor: string;
    heroTagline: string;
    heroTitlePart1: string;
    heroTitlePart2: string;
    heroTitlePart3: string;
    heroDescription: string;
    heroPrimaryButtonText: string;
    heroSecondaryButtonText: string;
    heroImages: string[];
    netflixShowcase: {
      title: string;
      subtitle: string;
      price: string;
      originalPrice: string;
      features: { emoji: string; title: string; desc: string }[];
      screenshots: { id: number; url: string; label: string; size: 'hero' | 'portrait' | 'square' | 'wide' }[];
    };
    stats: { number: string; label: string }[];
    footerTagline: string;
  }>({
    siteName: 'FRAMD',
    accentColor: '#FF3B3B',
    heroTagline: 'Now in Beta: Access Everything for Free',
    heroTitlePart1: 'Digital',
    heroTitlePart2: 'Artifacts',
    heroTitlePart3: 'For Us.',
    heroDescription: 'Curated PDF templates and cinematic anniversary websites. Made for moments that refuse to be forgotten.',
    heroPrimaryButtonText: 'Explore The Collection',
    heroSecondaryButtonText: 'Netflix Sites',
    heroImages: [],
    netflixShowcase: {
      title: 'The Netflix Anniversary Experience',
      subtitle: 'The most immersive anniversary website template ever built. Profiles, banners, scroll rows — identical to Netflix.',
      price: 'FREE',
      originalPrice: '₹1,499',
      features: [
        { emoji: '🎬', title: 'Netflix Profile Screen', desc: '4 milestone profiles. Who\'s watching your love story?' },
        { emoji: '🎞️', title: 'Cinematic Hero Banner', desc: 'Full-screen video play, Ken Burns animation, dual gradients' },
        { emoji: '📼', title: 'Scroll Rows', desc: 'Horizontal scroll cards with hover popups, exactly like Netflix' },
        { emoji: '🔍', title: 'Working Search', desc: 'Live search across all your memories and moments' },
        { emoji: '📱', title: '5 Full Pages', desc: 'Home, Our Story, Moments, Gallery, More Info — all working' },
        { emoji: '⚡', title: 'One File', desc: 'Single HTML/JSX file. Deploy anywhere in minutes.' },
      ],
      screenshots: [
        { id: 1, url: 'https://picsum.photos/800/450?random=301', label: 'Browse Page', size: 'hero' },
        { id: 2, url: 'https://picsum.photos/400/711?random=302', label: 'Profile Screen', size: 'portrait' },
        { id: 3, url: 'https://picsum.photos/400/711?random=303', label: 'Content Rows', size: 'portrait' },
        { id: 4, url: 'https://picsum.photos/400/400?random=304', label: 'Card Hover', size: 'square' },
        { id: 5, url: 'https://picsum.photos/800/450?random=305', label: 'Our Story Page', size: 'wide' },
      ]
    },
    stats: [
      { number: '2,400+', label: 'Templates' },
      { number: '180+', label: 'Websites Built' },
      { number: '4.9★', label: 'Rating' }
    ],
    footerTagline: 'Templates for moments that matter.'
  });

  const observe = useIntersectionObserver();

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategoriesFromDB(snapshot.docs.map(doc => doc.data().name));
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'hero'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAdminData(prev => ({
          ...prev,
          siteName: data.siteName || prev.siteName,
          accentColor: data.accentColor || prev.accentColor,
          heroTagline: data.heroTagline || data.tagline || prev.heroTagline,
          heroTitlePart1: data.heroTitlePart1 || data.titlePart1 || prev.heroTitlePart1,
          heroTitlePart2: data.heroTitlePart2 || data.titlePart2 || prev.heroTitlePart2,
          heroTitlePart3: data.heroTitlePart3 || data.titlePart3 || prev.heroTitlePart3,
          heroDescription: data.heroDescription || data.description || prev.heroDescription,
          heroPrimaryButtonText: data.heroPrimaryButtonText || data.primaryButtonText || prev.heroPrimaryButtonText,
          heroSecondaryButtonText: data.heroSecondaryButtonText || data.secondaryButtonText || prev.heroSecondaryButtonText,
          heroImages: data.heroImages || prev.heroImages,
          netflixShowcase: data.netflixShowcase ? {
            ...prev.netflixShowcase,
            ...data.netflixShowcase
          } : prev.netflixShowcase,
          stats: data.stats || prev.stats,
          footerTagline: data.footerTagline || prev.footerTagline
        }));

        if (data.accentColor) {
           document.documentElement.style.setProperty('--accent', data.accentColor);
        }
      }
    });

    return () => {
      unsubProducts();
      unsubCats();
      unsubSettings();
    };
  }, []);

  const categories = useMemo(() => {
    return ['All', ...categoriesFromDB];
  }, [categoriesFromDB]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const typeMatch = activeType === 'all' || p.type === activeType;
      const catMatch = activeCategory === 'All' || p.category === activeCategory;
      return typeMatch && catMatch;
    });
  }, [products, activeType, activeCategory]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-mono text-xs tracking-widest uppercase">Loading Artifacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-x-hidden selection:bg-[var(--accent)] selection:text-white">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full h-16 flex items-center justify-between px-6 md:px-12 z-[100] transition-all duration-300 ${
        scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <span className="font-display text-2xl italic font-black text-white">FRAMD<span className="text-[#FF3B3B]">.</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Templates', 'Netflix Sites', 'Pricing', 'About'].map(link => (
            <a 
              key={link} 
              href={`#${link.toLowerCase().replace(' ', '-')}`}
              className="text-sm font-medium text-[#888] hover:text-white transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <a href="#templates" className="hidden md:block text-sm font-medium px-5 py-2 border border-[#333] hover:border-white rounded-md transition-colors text-white">
            Browse All
          </a>
          <a href="#pricing" className="bg-[#FF3B3B] text-white text-sm font-medium px-6 py-2 rounded-md transition-transform active:scale-95 shadow-[0_4px_20px_rgba(255,59,59,0.3)]">
            Get Started
          </a>
          
          <button 
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section ref={observe} className="min-h-screen flex flex-col items-center justify-center pt-24 px-6 md:px-12 pb-16 relative overflow-hidden grain section-dark">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-[var(--accent)]/10 blur-[180px] rounded-full pointer-events-none -z-10 animate-[pulse_10s_infinite_alternate]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#FFD60A]/5 blur-[150px] rounded-full pointer-events-none -z-10 animate-[pulse_8s_infinite_alternate-reverse]"></div>
        
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-24 relative z-20">
          <div className="w-full md:w-1/2 flex flex-col items-start text-balance">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-8 animate-[fadeIn_0.8s_ease-out]">
              <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-ping"></span>
              <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-[#888] uppercase">{adminData.heroTagline}</span>
            </div>
            
            <h1 className="flex flex-col text-white mb-8 overflow-hidden">
              <span className="font-display text-7xl md:text-[110px] italic leading-[0.85] animate-[slideUp_1s_ease-out_forwards]">{adminData.heroTitlePart1}</span>
              <span className="font-display text-7xl md:text-[110px] font-black leading-[0.85] animate-[slideUp_1s_ease-out_0.2s_forwards] translate-y-full opacity-0">{adminData.heroTitlePart2}</span>
              <span className="font-display text-7xl md:text-[110px] italic text-[var(--accent)] leading-[0.85] animate-[slideUp_1s_ease-out_0.4s_forwards] translate-y-full opacity-0">{adminData.heroTitlePart3}</span>
            </h1>

            <p className="text-[#888] text-xl md:text-2xl max-w-xl mb-12 font-light leading-relaxed animate-[fadeIn_1.5s_ease-out_0.6s_forwards] opacity-0">
              {adminData.heroDescription}
            </p>

            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto animate-[fadeIn_1.5s_ease-out_0.8s_forwards] opacity-0">
              <a href="#templates" className="bg-white text-black px-12 py-5 rounded-full text-lg font-bold hover:bg-[var(--accent)] hover:text-white transition-all text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95">
                {adminData.heroPrimaryButtonText}
              </a>
              <a href="#netflix-sites" className="border border-white/20 hover:border-white px-12 py-5 rounded-full text-lg font-bold transition-all text-center backdrop-blur-sm hover:bg-white/5 active:scale-95">
                {adminData.heroSecondaryButtonText}
              </a>
            </div>
          </div>

          <div className="w-full md:w-1/2 relative h-[500px] md:h-[650px] perspective-[2000px] animate-[fadeIn_2s_ease-out_0.5s_forwards] opacity-0">
            <div className="absolute inset-0 flex items-center justify-center">
              {(adminData.heroImages.length > 0 ? adminData.heroImages : [null, null, null]).slice(0, 5).map((url, i, arr) => {
                const total = arr.length;
                const offset = total > 1 ? (i - (total-1)/2) : 0;
                const featured = products.filter(p => p.isBest || p.isNew)[i] || products[i];
                return (
                  <div 
                    key={i}
                    className="absolute w-[280px] h-[400px] md:w-[320px] md:h-[450px] rounded-3xl overflow-hidden border border-white/10 bg-[#111] shadow-[0_60px_120px_rgba(0,0,0,0.9)] animate-float"
                    style={{ 
                      '--rot': `${-12 + (i * 8)}deg`,
                      animationDelay: `${i * 1.5}s`,
                      zIndex: i,
                      transform: `translateX(${offset * (total > 3 ? 60 : 100)}px) rotateY(${-20 + (i * 10)}deg) translateY(${Math.abs(offset) * 20}px) rotateZ(${offset * 5}deg)`,
                      opacity: i === Math.floor(total/2) ? 1 : 0.6
                    }}
                    onClick={() => featured && setSelectedProduct(featured)}
                  >
                    <img 
                        src={url || featured?.imageUrl || `https://picsum.photos/800/1100?random=${50+i}`} 
                        className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700 cursor-pointer" 
                        alt="Artifact" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-6 left-6">
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1 block">{featured?.category || `Series 0${i+1}`}</span>
                      <span className="text-white font-display text-xl">{featured?.title || `Artifact_0${i+1}`}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30 hover:opacity-100 transition-opacity cursor-pointer animate-bounce">
           <a href="#templates" className="flex flex-col items-center gap-4">
              <div className="w-px h-16 bg-gradient-to-b from-white to-transparent"></div>
              <span className="font-mono text-[9px] uppercase tracking-[0.4em]">Scroll Down</span>
           </a>
        </div>
      </section>

      {/* Grid Section - Light */}
      <section id="templates" ref={observe} className="py-40 px-6 md:px-12 section-light">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24">
            <span className="font-mono text-[11px] font-bold text-[#FF3B3B] tracking-[0.2em] mb-4 inline-block uppercase">✦ The Library</span>
            <h2 className="font-display text-6xl md:text-8xl font-black mb-8 leading-none">Curated <br/>Selection.</h2>
            <p className="text-gray-500 text-xl max-w-xl">Every design is an original piece, crafted with premium typography and editorial layouts.</p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20">
            <div className="flex flex-wrap gap-2">
              {['all', 'pdf', 'site'].map(type => (
                <button 
                  key={type}
                  onClick={() => { setActiveType(type); setActiveCategory('All'); }}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all border ${
                    activeType === type 
                    ? 'bg-dark text-white border-dark' 
                    : 'bg-transparent text-gray-400 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {type === 'all' ? 'Everything' : type === 'pdf' ? 'Printable Collections' : 'Digital Experiences'}
                </button>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                    activeCategory === cat 
                    ? 'bg-[#FF3B3B] text-white' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} observe={observe} onPreview={setSelectedProduct} />
              ))
            ) : (
                <div className="col-span-full py-40 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center">
                    <span className="text-4xl mb-4">🔮</span>
                    <p className="text-gray-400 font-bold italic">Artifacts in development. Coming soon.</p>
                </div>
            )}
          </div>
        </div>
      </section>

      {/* Netflix Experience Showcase */}
      <section id="netflix-sites" ref={observe} className="py-40 px-6 md:px-12 section-dark grain relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_0%,rgba(var(--accent-rgb),0.1),transparent)] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
          <div className="w-full lg:w-5/12">
            <div className="inline-block px-3 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full mb-6">
              <span className="text-[var(--accent)] text-[10px] font-mono font-bold tracking-widest uppercase">✦ Featured Artifact</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl text-white font-bold mb-8 leading-tight">
              {adminData.netflixShowcase.title}
            </h2>
            <p className="text-gray-400 text-xl mb-12 font-light leading-relaxed">
              {adminData.netflixShowcase.subtitle}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-12 mb-16">
              {adminData.netflixShowcase.features.map((feature, i) => (
                <div key={i} className="space-y-3 group/feat">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl group-hover/feat:scale-125 transition-transform duration-300">{feature.emoji}</span>
                    <h4 className="text-white font-bold text-sm uppercase tracking-widest">{feature.title}</h4>
                  </div>
                  <p className="text-[#555] text-xs leading-relaxed pl-9">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 p-10 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl relative group">
                <div className="absolute inset-0 bg-[var(--accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl -z-10"></div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs line-through mb-1 uppercase tracking-widest">{adminData.netflixShowcase.originalPrice}</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-white text-5xl font-black font-mono tracking-tighter">{adminData.netflixShowcase.price}</span>
                        <span className="text-[var(--accent)] font-bold text-xs">ONLY</span>
                    </div>
                </div>
                <button 
                  onClick={() => setPurchaseModalProduct({ 
                    id: 'netflix-showcase', 
                    title: adminData.netflixShowcase.title, 
                    price: adminData.netflixShowcase.price,
                    original: adminData.netflixShowcase.originalPrice,
                    category: 'Anniversary Sites'
                  })}
                  className="flex-1 w-full bg-[var(--accent)] text-white py-5 px-8 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-[0_20px_50px_rgba(var(--accent-rgb),0.3)]"
                >
                    Get Access →
                </button>
            </div>
          </div>

          <div className="w-full lg:w-7/12">
             <div className="grid grid-cols-6 grid-rows-6 gap-4 h-[600px] md:h-[800px]">
                {/* Hero Slot */}
                <div 
                    className="col-span-4 row-span-4 group relative rounded-3xl overflow-hidden border border-white/10 cursor-pointer shadow-2xl"
                    onClick={() => setLightboxIndex(0)}
                >
                    <img src={adminData.netflixShowcase.screenshots[0].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Bento grid artifact" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-xs uppercase tracking-[0.3em] font-bold">{adminData.netflixShowcase.screenshots[0].label}</span>
                    </div>
                </div>
                
                {/* Portrait Slot 1 */}
                <div 
                    className="col-span-2 row-span-3 group relative rounded-3xl overflow-hidden border border-white/10 cursor-pointer shadow-2xl"
                    onClick={() => setLightboxIndex(1)}
                >
                    <img src={adminData.netflixShowcase.screenshots[1].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Bento grid artifact" />
                   <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[9px] uppercase tracking-[0.3em] font-bold">{adminData.netflixShowcase.screenshots[1].label}</span>
                    </div>
                </div>

                {/* Portrait Slot 2 */}
                <div 
                    className="col-span-2 row-span-3 group relative rounded-3xl overflow-hidden border border-white/10 cursor-pointer shadow-2xl"
                    onClick={() => setLightboxIndex(2)}
                >
                    <img src={adminData.netflixShowcase.screenshots[2].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Bento grid artifact" />
                   <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[9px] uppercase tracking-[0.3em] font-bold">{adminData.netflixShowcase.screenshots[2].label}</span>
                    </div>
                </div>

                {/* Square Slot */}
                <div 
                    className="col-span-2 row-span-2 group relative rounded-3xl overflow-hidden border border-white/10 cursor-pointer shadow-2xl"
                    onClick={() => setLightboxIndex(3)}
                >
                    <img src={adminData.netflixShowcase.screenshots[3].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Bento grid artifact" />
                   <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[9px] uppercase tracking-[0.3em] font-bold">{adminData.netflixShowcase.screenshots[3].label}</span>
                    </div>
                </div>

                {/* Wide Slot */}
                <div 
                    className="col-span-2 row-span-2 group relative rounded-3xl overflow-hidden border border-white/10 cursor-pointer shadow-2xl"
                    onClick={() => setLightboxIndex(4)}
                >
                    <img src={adminData.netflixShowcase.screenshots[4].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Bento grid artifact" />
                   <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[9px] uppercase tracking-[0.3em] font-bold">{adminData.netflixShowcase.screenshots[4].label}</span>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </section>

        <div className="mt-32 text-center">
          <button 
            onClick={() => {
                const netflix = products.find(p => p.title.toLowerCase().includes('netflix'));
                if (netflix) {
                  setPurchaseModalProduct({
                    id: netflix.id,
                    title: netflix.title,
                    price: netflix.price,
                    original: netflix.original,
                    category: netflix.category
                  });
                } else {
                  setPurchaseModalProduct({
                    id: 'netflix-showcase',
                    title: adminData.netflixShowcase.title,
                    price: adminData.netflixShowcase.price,
                    original: adminData.netflixShowcase.originalPrice,
                    category: 'Anniversary Sites'
                  });
                }
            }}
            className="bg-[var(--accent)] text-white px-12 py-5 rounded-lg text-xl font-bold hover:opacity-90 transition-all shadow-[0_20px_40px_rgba(var(--accent-rgb),0.4)] mb-6"
          >
            Get the Netflix Template →
          </button>
          <p className="text-[#555] text-sm font-medium">Instant access · Fully customizable · Limited period free</p>
        </div>

      {/* How It Works - Light alternate */}
      <section id="about" ref={observe} className="py-24 md:py-40 section-light border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                <div>
                     <span className="font-mono text-[11px] font-bold text-[#FF3B3B] tracking-[0.2em] mb-4 inline-block uppercase">✦ How it Works</span>
                     <h2 className="font-display text-5xl md:text-7xl font-black mb-12 leading-tight">Crafting Memories <br/>Made Easy.</h2>
                     <div className="space-y-12">
                         {[
                            { num: "01", title: "Browse & Choose", desc: "Select from our signature Netflix experiences or elegant PDF layouts." },
                            { num: "02", title: "Personalize Effortlessly", desc: "Add your names, dates, and the photos that defined your year." },
                            { num: "03", title: "Instant Delivery", desc: "Download the source or site package immediately. Ready to share." }
                         ].map(step => (
                             <div key={step.num} className="flex gap-8 group">
                                 <span className="font-display text-5xl text-gray-200 group-hover:text-[#FF3B3B] transition-colors">{step.num}</span>
                                 <div>
                                     <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                     <p className="text-gray-500 leading-relaxed font-medium">{step.desc}</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 bg-gray-200 rounded-3xl transform rotate-3 scale-95 opacity-50"></div>
                    <img src="https://picsum.photos/800/1000?random=88" className="w-full aspect-[4/5] object-cover rounded-3xl relative z-10 shadow-2xl" alt="About" />
                </div>
            </div>
        </div>
      </section>

      {/* Testimonials - Dark */}
      <section ref={observe} className="py-40 bg-dark text-white grain">
        <div className="px-6 md:px-12 mb-20 max-w-7xl mx-auto flex items-end justify-between overflow-visible">
          <div>
            <span className="font-mono text-[10px] text-[#FF3B3B] tracking-[0.3em] font-bold uppercase mb-4 block">✦ Community</span>
            <h2 className="font-display text-5xl md:text-7xl font-bold">Raved About.</h2>
          </div>
          <div className="hidden md:flex gap-4">
             <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                 <p className="text-3xl font-bold text-[#FF3B3B]">2.4k+</p>
                 <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-2">Satisfied Souls</p>
             </div>
          </div>
        </div>

        <div className="flex gap-8 overflow-x-auto no-scrollbar px-6 md:px-12 py-12 max-w-7xl mx-auto">
          {testimonials.map((t, idx) => (
            <div key={idx} className="w-[350px] shrink-0 bg-[#0D0D0D] border border-white/5 rounded-2xl p-10 transition-all hover:border-white/10 hover:-translate-y-2 group">
              <div className="text-[#FFD60A] text-2xl mb-8 opacity-50 group-hover:opacity-100 italic">"</div>
              <p className="text-white italic text-lg leading-relaxed mb-12 min-h-[140px] font-medium opacity-80 group-hover:opacity-100 transition-opacity">"{t.text}"</p>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-white/10"></div>
                 <div>
                    <p className="text-white font-bold">{t.author}</p>
                    <p className="text-[#555] text-xs uppercase tracking-widest font-bold">{t.location}</p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing - Light */}
      <section id="pricing" ref={observe} className="py-40 section-light relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center mb-24">
            <span className="font-mono text-[11px] font-bold text-[#FF3B3B] tracking-[0.2em] mb-4 inline-block uppercase">✦ Beta Access</span>
            <h2 className="font-display text-6xl md:text-8xl font-black mb-6">Built for <br/>Lovers, by Lovers.</h2>
            <p className="text-gray-500 text-xl font-medium">Currently in Private Beta. All artifacts are available for free.</p>
        </div>

        <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-20">
          <div className="bg-white border border-gray-100 p-12 rounded-3xl hover:shadow-2xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-[#FFD60A] text-black text-[8px] font-bold px-4 py-1.5 uppercase tracking-widest -rotate-45 translate-x-4 translate-y-2">Public Beta</div>
            <h3 className="text-gray-400 font-mono text-xs tracking-widest mb-6 uppercase italic">Artifact</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-dark text-5xl font-mono font-bold">Free</span>
            </div>
            <ul className="space-y-4 mb-12">
              {['Signature PDF Layout', 'Instant Source Access', 'Print-ready Assets', 'Basic Customization'].map(f => (
                <li key={f} className="flex gap-3 text-sm text-gray-500 font-bold">
                  <span className="text-[#FF3B3B]">✦</span> {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => {
                const pdf = products.find(p => p.type === 'pdf');
                if (pdf) setPurchaseModalProduct(pdf);
                else alert('Artifact collection loading...');
              }}
              className="w-full border-2 border-dark text-dark py-5 rounded-2xl font-bold hover:bg-dark hover:text-white transition-all"
            >
              Claim PDF
            </button>
          </div>

          <div className="bg-dark text-white p-12 rounded-3xl relative shadow-[0_40px_100px_rgba(0,0,0,0.2)] scale-[1.05] z-10 overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
                <span className="bg-[#FF3B3B] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Premium</span>
            </div>
            <h3 className="text-[#FF3B3B] font-mono text-xs tracking-widest mb-6 uppercase italic">Experience</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-white text-5xl font-mono font-bold">Free</span>
            </div>
            <ul className="space-y-4 mb-12">
              {['Netflix Site Bundle', 'Full JSX Components', 'Interactive Profiles', 'Live Preview Hosting', 'Priority Support'].map(f => (
                <li key={f} className="flex gap-3 text-sm text-gray-400 font-bold">
                  <span className="text-[#FF3B3B]">✦</span> {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => {
                const netflix = products.find(p => p.title.toLowerCase().includes('netflix'));
                if (netflix) setPurchaseModalProduct(netflix);
                else setPurchaseModalProduct({
                  id: 'netflix-showcase',
                  title: adminData.netflixShowcase.title,
                  price: adminData.netflixShowcase.price,
                  original: adminData.netflixShowcase.originalPrice,
                  category: 'Anniversary Sites'
                });
              }}
              className="w-full bg-[#FF3B3B] text-white py-5 rounded-2xl font-bold hover:scale-[0.98] transition-all shadow-xl"
            >
              Get Netflix Site
            </button>
          </div>

          <div className="bg-white border border-gray-100 p-12 rounded-3xl hover:shadow-2xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-[#FFD60A] text-black text-[8px] font-bold px-4 py-1.5 uppercase tracking-widest -rotate-45 translate-x-4 translate-y-2">Public Beta</div>
            <h3 className="text-gray-400 font-mono text-xs tracking-widest mb-6 uppercase italic">The Vault</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-dark text-5xl font-mono font-bold">Free</span>
            </div>
            <ul className="space-y-4 mb-12">
              {['Complete Collection Access', 'Exclusive Beta Templates', 'Private Community', 'Early Access to Updates'].map(f => (
                <li key={f} className="flex gap-3 text-sm text-gray-500 font-bold">
                  <span className="text-[#FF3B3B]">✦</span> {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full border-2 border-dark text-dark py-5 rounded-2xl font-bold hover:bg-dark hover:text-white transition-all"
            >
              Enter The Vault
            </button>
          </div>
        </div>
      </section>

      {/* Admin Toggle - Subtle */}
      <div className="fixed bottom-6 right-6 z-[400] opacity-40 hover:opacity-100 transition-all duration-300">
        <button 
          onClick={() => setAdminPanelOpen(true)}
          className="w-12 h-12 bg-[#111] backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:scale-110 active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all"
          title="Admin Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>

      {/* Footer */}
      <footer className="pt-32 pb-12 px-6 md:px-12 bg-[#0A0A0A] border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="md:col-span-2">
            <span className="font-display text-3xl italic font-black text-white mb-6 block">FRAMD<span className="text-[#FF3B3B]">.</span></span>
            <p className="text-[#666] max-w-[300px] leading-relaxed mb-8">
              The world's premium marketplace for digital anniversary templates and cinematic story websites.
            </p>
            <div className="flex gap-6">
              {['Instagram', 'Twitter', 'Pinterest'].map(s => (
                <a key={s} href="#" className="text-xs font-mono uppercase tracking-[0.2em] text-[#444] hover:text-[#FF3B3B] transition-colors">{s}</a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-8 uppercase text-xs tracking-widest">Connect</h4>
            <ul className="space-y-4">
              {['Templates', 'Netflix Sites', 'How It Works', 'Pricing', 'About'].map(l => (
                <li key={l}><a href={`#${l.toLowerCase().replace(' ', '-')}`} className="text-[#666] hover:text-white transition-colors text-sm">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-8 uppercase text-xs tracking-widest">Stay Updated</h4>
            <div className="relative mb-6">
              <input 
                type="email" 
                placeholder="your@email.com" 
                className="w-full bg-transparent border-b border-[#2A2A2A] py-3 text-white text-sm focus:border-[#FF3B3B] outline-none transition-all placeholder:text-[#444]"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-[#FF3B3B] p-2 hover:scale-125 transition-transform">→</button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[#444] text-[10px] uppercase font-mono tracking-widest">© 2025 FRAMD. Made with ❤️ for moments that matter.</p>
          <div className="flex gap-8">
            <Link to="/admin" className="text-[#444] hover:text-white text-[10px] uppercase font-mono tracking-widest transition-colors">Admin</Link>
            {['Privacy', 'Terms', 'Refund Policy'].map(l => (
              <a key={l} href="#" className="text-[#444] hover:text-white text-[10px] uppercase font-mono tracking-widest transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#0A0A0A] z-[500] flex flex-col p-8 md:hidden text-white">
          <div className="flex justify-between items-center mb-16">
            <span className="font-display text-2xl italic font-black text-white">FRAMD<span className="text-[var(--accent)]">.</span></span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-white"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <div className="flex flex-col gap-8">
            {[
              { name: 'Templates', target: '#templates' },
              { name: 'Netflix Sites', target: '#netflix-sites' },
              { name: 'Pricing', target: '#pricing' },
              { name: 'About', target: '#about' }
            ].map(link => (
              <a 
                key={link.name} 
                href={link.target}
                onClick={() => setMobileMenuOpen(false)}
                className="text-4xl font-display font-bold text-white hover:text-[var(--accent)] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="mt-auto bg-[var(--accent)] text-center text-white py-5 rounded-lg text-xl font-bold">Get Started</a>
        </div>
      )}

      {selectedProduct && (
        <PreviewModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            onSave={() => {
                setPurchaseModalProduct(selectedProduct);
                setSelectedProduct(null);
            }}
        />
      )}

      {/* Admin Side Panel */}
      <AdminSidePanel 
        isOpen={adminPanelOpen} 
        onClose={() => setAdminPanelOpen(false)} 
        data={adminData} 
        onUpdate={setAdminData} 
      />

      {/* Purchase Modal */}
      {purchaseModalProduct && (
        <PurchaseModal 
          product={purchaseModalProduct} 
          isOpen={!!purchaseModalProduct} 
          onClose={() => setPurchaseModalProduct(null)} 
        />
      )}

      {/* Styles */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes modalEnter {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
