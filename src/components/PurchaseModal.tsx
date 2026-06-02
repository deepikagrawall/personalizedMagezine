import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

interface PurchaseModalProps {
  product: {
    id: string;
    title: string;
    price: string;
    original?: string;
    category: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const PurchaseModal = ({ product, isOpen, onClose }: PurchaseModalProps) => {
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
    
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) newErrors.phone = 'Invalid phone format';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    
    try {
      // Check if request already exists
      const q = query(
        collection(db, 'requests'),
        where('productId', '==', product.id),
        where('phone', '==', formData.phone),
        where('email', '==', formData.email)
      );
      const querySnapshot = await getDocs(q);
      
      const isDuplicate = querySnapshot.docs.some(doc => {
        const data = doc.data();
        return ['pending', 'contacted'].includes(data.status);
      });

      if (isDuplicate) {
        setErrors({ ...errors, submit: 'A request with this phone number and email has already been received for this product and is pending or contacted.' });
        setLoading(false);
        return;
      }

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
      setErrors({ ...errors, submit: 'Error submitting request. Please try again.' });
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]">
      <div className="relative bg-[#111] border border-[#2A2A2A] rounded-2xl w-full md:w-[60vw] max-w-4xl p-5 sm:p-6 md:p-8 overflow-y-auto max-h-[85vh] no-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {step === 'form' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start w-full">
            {/* Left Column: Product Details */}
            <div className="md:col-span-5 space-y-4 md:border-r md:border-[#222] md:pr-6 md:mr-2">
              <div>
                <span className="font-mono text-[10px] text-[var(--accent)] tracking-widest font-bold mb-1.5 block uppercase">✦ ONE-TIME ACCESS</span>
                <h2 className="font-display text-xl md:text-2xl text-white font-bold leading-tight">Get {product.title}</h2>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">Fill in your details, and we will personalize your digital package immediately.</p>
              </div>

              <div className="flex items-baseline gap-2 py-2 border-y border-[#202020]">
                <span className="text-3xl font-black font-mono text-white">{product.price}</span>
                {product.original && <span className="text-gray-600 line-through text-xs font-mono">{product.original}</span>}
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Included Core Features:</span>
                <div className="space-y-1">
                  <p className="text-gray-400 text-[11px] flex items-center gap-2">
                    <span className="text-[var(--accent)] font-bold">✓</span> Personalized Content Update
                  </p>
                  <p className="text-gray-400 text-[11px] flex items-center gap-2">
                    <span className="text-[var(--accent)] font-bold">✓</span> Optimized Deliverables
                  </p>
                  <p className="text-gray-400 text-[11px] flex items-center gap-2">
                    <span className="text-[var(--accent)] font-bold">✓</span> Setup Guide & Live Assistance
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Compact Form */}
            <div className="md:col-span-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Full Name *</label>
                    <input 
                      className={`w-full bg-[#0A0A0A] border ${errors.name ? 'border-[var(--accent)]' : 'border-[#222]'} rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--accent)] transition-all`}
                      placeholder="Your name"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                    {errors.name && <p className="text-[var(--accent)] text-[9px] uppercase font-bold">{errors.name}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Email Address *</label>
                    <input 
                      className={`w-full bg-[#0A0A0A] border ${errors.email ? 'border-[var(--accent)]' : 'border-[#222]'} rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--accent)] transition-all`}
                      placeholder="your@email.com"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                    {errors.email && <p className="text-[var(--accent)] text-[9px] uppercase font-bold">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Phone Number *</label>
                    <input 
                      className={`w-full bg-[#0A0A0A] border ${errors.phone ? 'border-[var(--accent)]' : 'border-[#222]'} rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--accent)] transition-all`}
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                    {errors.phone && <p className="text-[var(--accent)] text-[9px] uppercase font-bold">{errors.phone}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Occasion Type</label>
                    <select 
                      className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--accent)] transition-all appearance-none"
                      value={formData.occasion}
                      onChange={e => setFormData({...formData, occasion: e.target.value})}
                    >
                      {['Anniversary', 'Birthday', 'Proposal', 'Couple', 'Memorial', 'Friendship', 'Other'].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.title.toLowerCase().includes('netflix') || product.category.toLowerCase().includes('anniversary') ? (
                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Couple Names (Optional)</label>
                      <input 
                        className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--accent)] transition-all"
                        placeholder="e.g. Priya & Karan"
                        value={formData.coupleNames}
                        onChange={e => setFormData({...formData, coupleNames: e.target.value})}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Preferred File Format</label>
                      <select 
                        className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--accent)] transition-all appearance-none"
                        value={formData.format}
                        onChange={e => setFormData({...formData, format: e.target.value})}
                      >
                        <option value="PDF">PDF</option>
                        <option value="PNG">PNG</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">How did you hear?</label>
                    <select 
                      className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--accent)] transition-all appearance-none"
                      value={formData.referral}
                      onChange={e => setFormData({...formData, referral: e.target.value})}
                    >
                      {['Instagram', "Friend's Recommendation", 'Google', 'Other'].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Special Message (Optional)</label>
                  <textarea 
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--accent)] transition-all h-20 resize-none"
                    placeholder="Any customization notes or special requests..."
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                  />
                </div>

                {errors.submit && <p className="text-[var(--accent)] text-[11px] font-bold text-center bg-[#1a0f0f] p-2 rounded">{errors.submit}</p>}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--accent)] text-white py-3 rounded-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center text-sm tracking-wide mt-2 shadow-lg"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Complete Purchase →"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 w-full max-w-md mx-auto">
            <div className="w-16 h-16 bg-[var(--accent)] rounded-full flex items-center justify-center mx-auto mb-6 animate-[scaleIn_0.5s_ease-out]">
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="font-display text-2xl text-white font-bold mb-3 font-semibold">Order Received!</h2>
            <p className="text-gray-400 text-sm mb-1">Check your email at <span className="text-white font-bold">{formData.email}</span></p>
            <p className="text-gray-500 text-xs mb-8 leading-relaxed">We will deliver your download package & setup guide within 2 hours.</p>
            <button onClick={onClose} className="text-gray-400 hover:text-white font-bold text-sm transition-colors border-b border-gray-600 hover:border-white pb-0.5">← Browse More Templates</button>
          </div>
        )}
      </div>
    </div>
  );
};
