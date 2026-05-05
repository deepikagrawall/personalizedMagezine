/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// --- DATA ---

const testimonials = [
  { text: "We used the Netflix anniversary site and our friends literally thought it was real Netflix. Best ₹1,499 ever spent.", author: "Priya & Karan", location: "Mumbai" },
  { text: "The PDF anniversary card made my girlfriend cry. In a good way. Very good way.", author: "Arjun S.", location: "Delhi" },
  { text: "Ordered the proposal kit at 2am, had it ready by morning. She said yes.", author: "Rahul M.", location: "Bangalore" },
  { text: "The attention to detail is insane. Every hover, every animation. Worth every rupee.", author: "Sneha T.", location: "Pune" },
  { text: "Bought 3 different templates. Each one looked more premium than the last.", author: "Dev & Ananya", location: "Hyderabad" },
];

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

const PreviewModal = ({ product, onClose }: { product: any, onClose: () => void }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  if (isPreviewMode && product.type === 'site') {
    return (
      <div className="fixed inset-0 z-[300] bg-black flex flex-col animate-[modalEnter_0.4s_ease-out]">
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
           <div className="absolute top-8 left-8 z-10 font-black text-[#E50914] text-3xl tracking-tighter italic">NETFLIX</div>
           <div className="flex flex-col items-center justify-center h-full">
              <h3 className="text-white font-light text-5xl mb-12">Who's watching?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {["1 Month", "2 Months", "3 Months", "5 Months"].map((l: string, i: number) => (
                  <div key={i} className="flex flex-col items-center gap-4">
                     <div className="w-32 h-32 md:w-44 md:h-44 rounded bg-blue-600 hover:ring-4 ring-white transition-all cursor-pointer"></div>
                     <span className="text-gray-400 text-lg uppercase tracking-widest">{l}</span>
                  </div>
                ))}
              </div>
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
              <div className="w-full min-h-[600px] bg-white rounded-lg overflow-hidden shadow-2xl">
                <iframe 
                  src={`${product.pdfUrl}#toolbar=0`} 
                  className="w-full h-[600px] md:h-[800px]"
                  title="PDF Preview"
                />
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
                <li className="flex items-center gap-2"><span className="text-[#FF3B3B]">✦</span> High-fidelity resolution</li>
                <li className="flex items-center gap-2"><span className="text-[#FF3B3B]">✦</span> Fully editable source files</li>
                <li className="flex items-center gap-2"><span className="text-[#FF3B3B]">✦</span> Documentation included</li>
              </ul>
            </div>
          </div>

          <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                   <span className="text-white font-mono font-bold text-4xl">{product.price}</span>
                   <div className="bg-white/5 px-2 py-1 rounded text-[10px] text-gray-500 uppercase tracking-widest">PRO Artifact</div>
               </div>
            </div>
            
            <button className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-[#FF3B3B] hover:text-white transition-all flex items-center justify-center gap-2">
              Save to Library <span>+</span>
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
            <span className="text-[#444] text-[10px] font-mono uppercase tracking-widest line-through mb-1">{product.original}</span>
            <span className="text-white font-mono font-bold text-2xl">{product.price}</span>
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
  const [loading, setLoading] = useState(true);
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

    return () => {
      unsubProducts();
      unsubCats();
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
          <div className="w-16 h-16 border-4 border-[#FF3B3B] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-mono text-xs tracking-widest uppercase">Loading Artifacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-[#FF3B3B]/10 blur-[180px] rounded-full pointer-events-none -z-10 animate-[pulse_10s_infinite_alternate]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#FFD60A]/5 blur-[150px] rounded-full pointer-events-none -z-10 animate-[pulse_8s_infinite_alternate-reverse]"></div>
        
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-24 relative z-20">
          <div className="w-full md:w-1/2 flex flex-col items-start text-balance">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-8 animate-[fadeIn_0.8s_ease-out]">
              <span className="w-2 h-2 bg-[#FF3B3B] rounded-full animate-ping"></span>
              <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-[#888] uppercase">Now in Beta: Access Everything for Free</span>
            </div>
            
            <h1 className="flex flex-col text-white mb-8 overflow-hidden">
              <span className="font-display text-7xl md:text-[110px] italic leading-[0.85] animate-[slideUp_1s_ease-out_forwards]">Digital</span>
              <span className="font-display text-7xl md:text-[110px] font-black leading-[0.85] animate-[slideUp_1s_ease-out_0.2s_forwards] translate-y-full opacity-0">Artifacts</span>
              <span className="font-display text-7xl md:text-[110px] italic text-[#FF3B3B] leading-[0.85] animate-[slideUp_1s_ease-out_0.4s_forwards] translate-y-full opacity-0">For Us.</span>
            </h1>

            <p className="text-[#888] text-xl md:text-2xl max-w-md mb-12 font-light leading-relaxed animate-[fadeIn_1.5s_ease-out_0.6s_forwards] opacity-0">
              Curated PDF templates and cinematic anniversary websites. Made for moments that refuse to be forgotten.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto animate-[fadeIn_1.5s_ease-out_0.8s_forwards] opacity-0">
              <a href="#templates" className="bg-white text-black px-12 py-5 rounded-full text-lg font-bold hover:bg-[#FF3B3B] hover:text-white transition-all text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95">
                Explore The Collection
              </a>
              <a href="#netflix-sites" className="border border-white/20 hover:border-white px-12 py-5 rounded-full text-lg font-bold transition-all text-center backdrop-blur-sm hover:bg-white/5 active:scale-95">
                Netflix Sites
              </a>
            </div>
          </div>

          <div className="w-full md:w-1/2 relative h-[500px] md:h-[600px] perspective-[2000px] animate-[fadeIn_2s_ease-out_0.5s_forwards] opacity-0">
            <div className="absolute inset-0 flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i}
                  className="absolute w-[320px] h-[450px] rounded-3xl overflow-hidden border border-white/10 bg-[#111] shadow-[0_60px_120px_rgba(0,0,0,0.9)] animate-float"
                  style={{ 
                    '--rot': `${-12 + (i * 12)}deg`,
                    animationDelay: `${i * 1.2}s`,
                    zIndex: i,
                    transform: `translateX(${(i - 1) * 80}px) rotateY(${-20 + (i * 20)}deg) translateY(${(i - 1) * 30}px) rotateZ(${-5 + (i * 5)}deg)`,
                    opacity: i === 1 ? 1 : 0.4
                  }}
                >
                  <img src={`https://picsum.photos/800/1100?random=${50+i}`} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" alt="Artifact" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-6 left-6">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1 block">Series 0{i + 1}</span>
                    <span className="text-white font-display text-xl">Artifact_{i + 10}</span>
                  </div>
                </div>
              ))}
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

      {/* Showcase - Dark */}
      <section id="netflix-sites" ref={observe} className="py-40 px-6 md:px-12 section-dark grain relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,59,59,0.1),transparent)] pointer-events-none"></div>
        <div className="text-center mb-24 max-w-4xl mx-auto">
          <span className="font-mono text-[11px] font-medium text-[#FF3B3B] tracking-[0.15em] mb-4 inline-block">✦ FEATURED TEMPLATE</span>
          <h2 className="font-display text-5xl md:text-7xl font-bold mb-6">The Netflix Anniversary Experience</h2>
          <p className="text-[#888] text-lg leading-relaxed">
            The most immersive anniversary website template ever built. Profiles, banners, scroll rows — identical to Netflix.
          </p>
        </div>

        {/* Browser Mockup */}
        <div className="relative max-w-[900px] mx-auto mb-32 z-10 group">
          <div className="absolute inset-0 bg-[#FF3B3B]/10 blur-[120px] rounded-full pointer-events-none -z-10 group-hover:bg-[#FF3B3B]/20 transition-all duration-700"></div>
          
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
            {/* Browser Header */}
            <div className="h-10 bg-[#111] flex items-center px-4 gap-2 border-b border-[#2A2A2A]">
              <div className="flex gap-1.5 leading-none">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B3B]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 mx-8 bg-[#0A0A0A] h-6 rounded flex items-center px-3">
                <span className="text-[10px] text-gray-600 font-mono">framd.in/anniversary-preview</span>
              </div>
            </div>

            {/* Inner Content - Live Mini Netflix Replica */}
            <div className="bg-black aspect-video flex flex-col items-center justify-center p-6 relative">
              <span className="absolute top-6 left-6 font-black text-[#E50914] text-xl tracking-tighter italic">NETFLIX</span>
              
              <h3 className="text-white font-light text-2xl md:text-4xl mb-12">Who's watching?</h3>
              
              <div className="grid grid-cols-4 gap-4 md:gap-8 max-w-[600px]">
                {[ 
                  { l: "1 Month", c: "#2563EB", i: "🌸" },
                  { l: "2 Months", c: "#7C3AED", i: "🌙" },
                  { l: "3 Months", c: "#059669", i: "💫" },
                  { l: "5 Months", c: "#DC2626", i: "🔥" }
                ].map((p, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-3 group/profile">
                    <div 
                      className="w-12 h-12 md:w-24 md:h-24 rounded border-2 border-transparent group-hover/profile:border-white transition-all overflow-hidden flex items-center justify-center text-2xl md:text-4xl"
                      style={{ backgroundColor: p.c }}
                    >
                      {p.i}
                    </div>
                    <span className="text-[10px] md:text-xs text-gray-500 group-hover:text-white">{p.l}</span>
                  </div>
                ))}
              </div>

              <button className="mt-16 border border-gray-600 text-gray-500 px-6 md:px-8 py-2 text-[10px] md:text-xs uppercase tracking-widest hover:border-white hover:text-white transition-all">
                Manage Profiles
              </button>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto px-6">
          {[
            { tag: "🎬", title: "Netflix Profile Screen", desc: "4 milestone profiles. Who's watching your love story?" },
            { tag: "🎞️", title: "Cinematic Hero Banner", desc: "Full-screen video play, Ken Burns animation, dual gradients" },
            { tag: "📼", title: "Scroll Rows", desc: "Horizontal scroll cards with hover popups, exactly like Netflix" },
            { tag: "🔍", title: "Working Search", desc: "Live search across all your memories and moments" },
            { tag: "📱", title: "5 Full Pages", desc: "Home, Our Story, Moments, Gallery, More Info — all working" },
            { tag: "⚡", title: "One File", desc: "Single HTML/JSX file. Deploy anywhere in minutes." }
          ].map((feat, i) => (
            <div key={i} className="border-t border-[#1E1E1E] pt-8 group">
              <span className="text-3xl mb-4 block group-hover:scale-110 transition-transform origin-left duration-300">{feat.tag}</span>
              <h4 className="text-white font-semibold text-lg mb-2">{feat.title}</h4>
              <p className="text-[#666] text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-32 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="text-white font-mono font-bold text-5xl">₹1,499</span>
            <span className="text-[#444] font-mono text-2xl line-through">₹2,999</span>
          </div>
          <button className="bg-[#FF3B3B] text-white px-12 py-5 rounded-lg text-xl font-bold hover:bg-[#FF3B3B]/90 transition-all shadow-[0_20px_40px_rgba(255,59,59,0.4)] mb-6">
            Get the Netflix Template →
          </button>
          <p className="text-[#555] text-sm font-medium">Instant download · Fully customizable · One-time payment</p>
        </div>
      </section>

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
            <button className="w-full border-2 border-dark text-dark py-5 rounded-2xl font-bold hover:bg-dark hover:text-white transition-all">
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
            <button className="w-full bg-[#FF3B3B] text-white py-5 rounded-2xl font-bold hover:scale-[0.98] transition-all shadow-xl">
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
            <button className="w-full border-2 border-dark text-dark py-5 rounded-2xl font-bold hover:bg-dark hover:text-white transition-all">
              Enter The Vault
            </button>
          </div>
        </div>
      </section>

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
            <a href="/admin" className="text-[#444] hover:text-white text-[10px] uppercase font-mono tracking-widest transition-colors">Admin</a>
            {['Privacy', 'Terms', 'Refund Policy'].map(l => (
              <a key={l} href="#" className="text-[#444] hover:text-white text-[10px] uppercase font-mono tracking-widest transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#0A0A0A] z-[200] flex flex-col p-8 md:hidden">
          <div className="flex justify-between items-center mb-16">
            <span className="font-display text-2xl italic font-black text-white">FRAMD<span className="text-[#FF3B3B]">.</span></span>
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
                className="text-4xl font-display font-bold text-white hover:text-[#FF3B3B] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="mt-auto bg-[#FF3B3B] text-center text-white py-5 rounded-lg text-xl font-bold">Get Started</a>
        </div>
      )}

      {selectedProduct && <PreviewModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}

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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
