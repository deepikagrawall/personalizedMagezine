/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { db, auth } from './lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Modular component imports
import { FeatureIcon, PaytmFeatureIcon } from './components/FeatureIcons';
import { PurchaseModal } from './components/PurchaseModal';
import { AdminSidePanel } from './components/AdminSidePanel';
import { PreviewModal } from './components/PreviewModal';
import { ProductCard } from './components/ProductCard';

// --- DATA ---


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

// --- MODULAR HELPERS IMPORTED ---

export default function App() {
  const { scrollYProgress } = useScroll();
  const heroParallax = useTransform(scrollYProgress, [0, 0.5], [0, 200]);
  const [products, setProducts] = useState<any[]>([]);
  const [categoriesFromDB, setCategoriesFromDB] = useState<any[]>([]);
  const [activeType, setActiveType] = useState('all');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentArtifactIdx, setCurrentArtifactIdx] = useState(0);

  const bestArtifacts = useMemo(() => products.filter(p => p.isBest).slice(0, 5), [products]);

  useEffect(() => {
    if (bestArtifacts.length > 1) {
      const interval = setInterval(() => {
        setCurrentArtifactIdx(prev => (prev + 1) % bestArtifacts.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [bestArtifacts]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

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

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxSection, setLightboxSection] = useState<'netflix' | 'paytm' | null>(null);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), 3000);
    return () => clearTimeout(timer);
  }, []);

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
    paytmShowcase: {
      title: string;
      subtitle: string;
      price: string;
      originalPrice: string;
      features: { emoji: string; title: string; desc: string }[];
      screenshots: { id: number; url: string; label: string; size: 'hero' | 'portrait' | 'square' | 'wide' }[];
    };
    stats: { number: string; label: string }[];
    footerTagline: string;
    howItWorks: { title: string; subtitle: string; imageUrl: string; steps: { num: string; title: string; desc: string }[] };
    curatedSelection: { subtitle: string; title: string; description: string; imageUrl: string };
  }>({
    siteName: 'ARTIFACT',
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
    paytmShowcase: {
      title: 'The Paytm Secured Birthday Scan',
      subtitle: 'Surprise them with a fully responsive Paytm-themed scan & gift experience. Scan a QR to reveal beautiful childhood memories, custom soundbox audio alerts, and a personalized secret UPI voucher!',
      price: 'FREE',
      originalPrice: '₹999',
      features: [
        { emoji: '📲', title: 'Personalized QR Codes', desc: 'Scan code to launch a beautiful milestone interactive timeline.' },
        { emoji: '🔊', title: 'Interactive Soundbox', desc: 'Plays customized background quotes and sound alerts reflecting Paytm Soundbox.' },
        { emoji: '💳', title: 'Mock Payment Screen', desc: 'A gorgeous transfer UI loaded with relationship statistics or special dates.' },
        { emoji: '🔐', title: 'Secure Gifting Badges', desc: 'Secure connection banner and standard secure digital details.' },
        { emoji: '💸', title: 'Voucher Code Reveal', desc: 'Beautiful custom gift cards, coupon rewards, or digital scratch cards.' },
        { emoji: '⚡', title: 'Speedy No-Code setup', desc: 'HTML/React package ready to launch instantly, share on mobile on a tap.' },
      ],
      screenshots: [
        { id: 1, url: 'https://picsum.photos/800/450?random=401', label: 'Interactive Soundbox Feed', size: 'hero' },
        { id: 2, url: 'https://picsum.photos/400/711?random=402', label: 'Payment Scan QR Code', size: 'portrait' },
        { id: 3, url: 'https://picsum.photos/400/711?random=403', label: 'Payment Processing Alert', size: 'portrait' },
        { id: 4, url: 'https://picsum.photos/400/400?random=404', label: 'Scratch & Win Gift', size: 'square' },
        { id: 5, url: 'https://picsum.photos/800/450?random=405', label: 'Transaction Summary Receipt', size: 'wide' },
      ]
    },
    stats: [
      { number: '2,400+', label: 'Templates' },
      { number: '180+', label: 'Websites Built' },
      { number: '4.9★', label: 'Rating' }
    ],
    footerTagline: 'Templates for moments that matter.',
    howItWorks: {
      title: 'Crafting Memories Made Easy.',
      subtitle: 'A few simple steps to your cinematic website.',
      imageUrl: 'https://picsum.photos/800/1000?random=88',
      steps: [
        { num: '01', title: 'Browse & Choose', desc: 'Select from our signature Netflix experiences or elegant PDF layouts.' },
        { num: '02', title: 'Personalize Effortlessly', desc: 'Add your names, dates, and the photos that defined your year.' },
        { num: '03', title: 'Instant Delivery', desc: 'Download the source or site package immediately. Ready to share.' }
      ]
    },
    curatedSelection: {
      subtitle: '✦ The Library',
      title: 'Curated \n Selection.',
      description: 'Every design is an original piece, crafted with premium typography and editorial layouts.',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/friendly-vigil-491809-m0.firebasestorage.app/o/howItWorks%2F1778235786466_Screenshot%202026-05-08%20154743.png?alt=media&token=477843e5-5ecc-4cbb-a9d9-0ba24e660bdb'
    },
    pricing: {
      tagline: '✦ Beta Access',
      title: 'Built for \nLovers, by Lovers.',
      subtitle: 'Currently in Private Beta. All artifacts are available for free.',
      tier1Price: 'Free',
      tier1OriginalPrice: '₹499',
      tier2Price: 'Free',
      tier2OriginalPrice: '₹1499',
      tier3Price: 'Free',
      tier3OriginalPrice: '₹4999',
      tier1Features: [
        'Signature PDF Layout',
        'Instant Source Access',
        'Print-ready Assets',
        'Basic Customization'
      ],
      tier2Features: [
        'Netflix Site Bundle',
        'Full JSX Components',
        'Interactive Profiles',
        'Live Preview Hosting',
        'Priority Support'
      ],
      tier3Features: [
        'Complete Collection Access',
        'Exclusive Beta Templates',
        'Private Community',
        'Early Access to Updates'
      ]
    }
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
          paytmShowcase: data.paytmShowcase ? {
            ...prev.paytmShowcase,
            ...data.paytmShowcase
          } : prev.paytmShowcase,
          stats: data.stats || prev.stats,
          footerTagline: data.footerTagline || prev.footerTagline,
          howItWorks: data.howItWorks || prev.howItWorks,
          curatedSelection: data.curatedSelection ? {
            ...prev.curatedSelection,
            ...data.curatedSelection
          } : prev.curatedSelection,
          pricing: data.pricing ? {
            ...prev.pricing,
            ...data.pricing
          } : prev.pricing
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
    }).map(p => {
      if (p.type === 'pdf') {
        return {
          ...p,
          price: adminData.pricing?.tier1Price || p.price,
          original: adminData.pricing?.tier1OriginalPrice || p.original
        };
      }
      return p;
    });
  }, [products, activeType, activeCategory, adminData.pricing]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden selection:bg-[var(--accent)] selection:text-white">
      <AnimatePresence>
        {(loading || !minTimePassed) && (
          <motion.div 
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="fixed inset-0 z-[1000] bg-[#0a0a0a] flex items-center justify-center overflow-hidden"
          >
            {/* Step 1: Thin horizontal line */}
            <motion.div 
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute h-[1px] w-full bg-white top-1/2 left-0 -translate-y-1/2 origin-center"
            />

            <div className="relative flex flex-col items-center">
              {/* Step 2: Morphing Geometric Shapes */}
              <div className="relative w-32 h-32 md:w-48 md:h-48 mb-16 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    rotate: [0, 90, 180, 270, 360],
                    borderRadius: ["50%", "0%", "50%"],
                  }}
                  transition={{ 
                    opacity: { duration: 1, delay: 0.5 },
                    scale: { duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] },
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                    borderRadius: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="w-20 h-20 md:w-28 md:h-28 border border-white/40 relative"
                >
                   {/* Inner accent shape */}
                   <motion.div
                    animate={{ 
                      scale: [1, 0.6, 1],
                      opacity: [0.2, 0.8, 0.2],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-2 border border-[var(--accent)]"
                   />
                </motion.div>
                
                {/* Secondary floating elements */}
                <motion.div
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="absolute w-full h-full border border-white/5 rounded-full scale-125"
                />
              </div>

              {/* Step 3: Progress bar Underneath */}
              <div className="w-48 md:w-64 h-[1px] bg-white/10 relative overflow-hidden mb-6">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 2, delay: 0.8, ease: "easeInOut" }}
                  className="absolute inset-0 bg-white/60"
                />
              </div>

              {/* Step 4: Tagline */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 2 }}
              >
                <p className="text-white/30 font-mono text-[10px] uppercase tracking-[0.5em] font-medium">
                  Customized Digital Moments
                </p>
              </motion.div>
            </div>

            {/* Subtle Grain Effect for Cinematic Feel */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Navbar */}
      <nav className={`fixed top-0 w-full h-16 flex items-center justify-between px-6 md:px-12 z-[100] transition-all duration-300 ${
        scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <span className="font-display text-2xl italic font-black text-white">{adminData.siteName}<span className="text-[var(--accent)]">.</span></span>
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

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 bg-green-500 text-white p-4 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
      >
        <MessageCircle size={24} />
      </a>

      {/* Hero */}
      <section ref={observe} className="min-h-[85vh] md:min-h-[90vh] flex flex-col items-center justify-center pt-20 px-6 md:px-12 pb-8 relative overflow-hidden grain section-dark grid-pattern">
        {/* Animated Background Elements - Refined */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[var(--accent)]/5 blur-[200px] rounded-full pointer-events-none -z-10 animate-[pulse_15s_infinite_ease-in-out]"></div>
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-500/5 blur-[200px] rounded-full pointer-events-none -z-10 animate-[pulse_20s_infinite_ease-in-out]"></div>
        
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-12 relative z-20">
          <div className="w-full md:w-1/2 flex flex-col items-start text-balance">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-3 animate-[fadeIn_0.8s_ease-out]">
              <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-ping"></span>
              <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-[#888] uppercase">{adminData.heroTagline}</span>
            </div>
            
            <h1 className="flex flex-col text-white mb-3 tracking-tighter">
              <div className="overflow-hidden">
                <motion.span 
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="block font-display text-5xl sm:text-8xl md:text-[94px] font-black leading-[0.78]"
                >
                  {adminData.heroTitlePart1}
                </motion.span>
              </div>
              <div className="overflow-hidden mt-[1px]">
                <motion.span 
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="block font-display text-4xl sm:text-7xl md:text-[84px] font-black leading-[0.78]"
                >
                  {adminData.heroTitlePart2}
                </motion.span>
              </div>
              <div className="overflow-hidden mt-[1px]">
                <motion.span 
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                  className="block font-display text-4xl sm:text-7xl md:text-[84px] italic text-[var(--accent)] leading-[0.78]"
                >
                  {adminData.heroTitlePart3}
                </motion.span>
              </div>
            </h1>

            <p className="text-[#888] text-sm sm:text-base md:text-[17px] max-w-xl mb-6 font-light leading-relaxed animate-[fadeIn_1.5s_ease-out_0.6s_forwards] opacity-0">
              {adminData.heroDescription}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-[fadeIn_1.5s_ease-out_0.8s_forwards] opacity-0">
              <a href="#templates" className="bg-white text-black px-8 py-3.5 rounded-full text-base font-bold hover:bg-[var(--accent)] hover:text-white transition-all text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95">
                {adminData.heroPrimaryButtonText}
              </a>
              <a href="#netflix-sites" className="border border-white/20 hover:border-white px-8 py-3.5 rounded-full text-base font-bold transition-all text-center backdrop-blur-sm hover:bg-white/5 active:scale-95">
                {adminData.heroSecondaryButtonText}
              </a>
            </div>
          </div>

          <motion.div style={{ y: heroParallax }} className="w-full md:w-1/2 relative h-[320px] sm:h-[400px] md:h-[500px] perspective-[2000px] animate-[fadeIn_2s_ease-out_0.5s_forwards] opacity-0">
            <div className="absolute inset-0 flex items-center justify-center">
              {(adminData.heroImages.length > 0 ? adminData.heroImages : [null, null, null]).slice(0, 5).map((url, i, arr) => {
                const total = arr.length;
                const offset = total > 1 ? (i - (total-1)/2) : 0;
                const featured = products.filter(p => p.isBest || p.isNew)[i] || products[i];
                return (
                  <div 
                    key={i}
                    className="absolute w-[180px] h-[252px] md:w-[280px] md:h-[392px] rounded-2xl overflow-hidden border border-white/10 bg-[#111] shadow-[0_45px_90px_rgba(0,0,0,0.9)] shrink-0 transition-transform cursor-pointer hover:scale-[1.03]"
                    style={{ 
                      '--rot': `${-12 + (i * 8)}deg`,
                      zIndex: i,
                      transform: `translateX(${offset * (total > 3 ? (window.innerWidth < 768 ? 30 : 50) : (window.innerWidth < 768 ? 45 : 80))}px) rotateY(${-20 + (i * 10)}deg) translateY(${Math.abs(offset) * 12}px) rotateZ(${offset * 4}deg)`,
                    }}
                    onClick={() => featured && setSelectedProduct(featured)}
                  >
                    <motion.div
                        className="w-full h-full"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: i === Math.floor(total/2) ? 1 : 0.6 }}
                        viewport={{ once: true, amount: 0.2 }}
                        animate={{
                            y: [0, -20, 0],
                            rotate: [-2, 2, -2],
                        }}
                        transition={{
                            opacity: { duration: 1 },
                            y: { repeat: Infinity, duration: 4 + (i % 2), ease: "easeInOut", delay: i * 0.2 },
                            rotate: { repeat: Infinity, duration: 8 + (i % 2), ease: "easeInOut", delay: i * 0.2 },
                        }}
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
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30 hover:opacity-100 transition-opacity cursor-pointer animate-bounce">
           <a href="#templates" className="flex flex-col items-center gap-4">
              <div className="w-px h-16 bg-gradient-to-b from-white to-transparent"></div>
              <span className="font-mono text-[9px] uppercase tracking-[0.4em]">Scroll Down</span>
           </a>
        </div>
      </section>

      {/* Grid Section - Light */}
      <section id="templates" ref={observe} className="py-12 md:py-16 px-6 md:px-12 section-light">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="font-mono text-[11px] font-bold text-[#FF3B3B] tracking-[0.2em] mb-4 inline-block uppercase">
              {adminData.curatedSelection?.subtitle || "✦ The Library"}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight" dangerouslySetInnerHTML={{ __html: (adminData.curatedSelection?.title || "Curated Selection").replace(/\n|\\n|<br\s*\/?>/gi, ' ') }}></h2>
            <p className="text-gray-500 text-lg max-w-xl">
              {adminData.curatedSelection?.description || "Every design is an original piece, crafted with premium typography and editorial layouts."}
            </p>
          </div>
          <div className="relative flex items-center justify-center h-[320px] sm:h-[380px] md:h-[420px]">
             {/* Artifact Carousel Intro */}
             <div className="relative w-full h-full flex items-center justify-center">
                {bestArtifacts.length > 0 ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Stacked Cards Layout */}
                    {bestArtifacts.map((art, idx) => (
                      <motion.div
                        key={art.id}
                        initial={false}
                        animate={{ 
                          opacity: currentArtifactIdx === idx ? 1 : idx === (currentArtifactIdx + 1) % bestArtifacts.length ? 0.4 : 0,
                          scale: currentArtifactIdx === idx ? 1 : idx === (currentArtifactIdx + 1) % bestArtifacts.length ? 0.9 : 0.8,
                          rotate: currentArtifactIdx === idx ? 0 : idx === (currentArtifactIdx + 1) % bestArtifacts.length ? 5 : -5,
                          x: currentArtifactIdx === idx ? 0 : idx === (currentArtifactIdx + 1) % bestArtifacts.length ? 30 : -30,
                          zIndex: currentArtifactIdx === idx ? 20 : 10,
                          filter: currentArtifactIdx === idx ? 'blur(0px)' : 'blur(2px)'
                         }}
                        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                        className="absolute w-[160px] sm:w-[180px] md:w-[220px] aspect-[3/4] rounded-2xl overflow-hidden border-4 border-white shadow-[0_40px_100px_rgba(0,0,0,0.6)] cursor-pointer group/art"
                        onClick={() => setSelectedProduct(art)}
                      >
                         <img src={art.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover/art:scale-110" alt={art.title} />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-6">
                            <span className="text-[9px] font-mono text-[var(--accent)] uppercase tracking-[0.3em] font-bold mb-1">Featured Artifact</span>
                            <h4 className="text-white font-display text-sm md:text-base font-bold leading-tight line-clamp-2">{art.title}</h4>
                            <div className="h-0 group-hover/art:h-6 transition-all duration-300 opacity-0 group-hover/art:opacity-100 flex items-center mt-2">
                               <span className="text-white text-[10px] font-mono uppercase tracking-widest">Get Access →</span>
                            </div>
                         </div>
                      </motion.div>
                    ))}
                    
                    {/* Visual Pulse / Ripple */}
                    <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
                       <div className="w-[220px] h-[220px] md:w-[320px] md:h-[320px] rounded-full border border-[var(--accent)]/30 animate-ripple"></div>
                       <div className="absolute w-[220px] h-[220px] md:w-[320px] md:h-[320px] rounded-full border border-[var(--accent)]/10 animate-ripple" style={{ animationDelay: '1.5s' }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)]/20 animate-ripple"></div>
                    <div className="relative z-10 w-full h-full overflow-hidden border-4 border-white p-1 bg-black shadow-2xl rounded-2xl">
                      <img 
                          src={adminData.curatedSelection?.imageUrl || adminData.howItWorks.imageUrl} 
                          className="w-full h-full object-cover rounded-xl" 
                          alt="Curated Selection" 
                      />
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="max-w-7xl mx-auto mt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
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

          {filteredProducts.length > 0 ? (
            <div className="relative group/carousel px-4">
              {/* Left Navigation Arrow */}
              {filteredProducts.length > 4 && (
                <button 
                  onClick={() => {
                    if (carouselRef.current) {
                      carouselRef.current.scrollBy({ left: -carouselRef.current.offsetWidth, behavior: 'smooth' });
                    }
                  }}
                  className="absolute -left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white text-black hover:bg-gray-100 hover:scale-110 font-bold shadow-2xl border border-gray-200 flex items-center justify-center transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 cursor-pointer hidden md:flex"
                  title="Previous"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Right Navigation Arrow */}
              {filteredProducts.length > 4 && (
                <button 
                  onClick={() => {
                    if (carouselRef.current) {
                      carouselRef.current.scrollBy({ left: carouselRef.current.offsetWidth, behavior: 'smooth' });
                    }
                  }}
                  className="absolute -right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white text-black hover:bg-gray-100 hover:scale-110 font-bold shadow-2xl border border-gray-200 flex items-center justify-center transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 cursor-pointer hidden md:flex"
                  title="Next"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* Carousel Container */}
              <div 
                ref={carouselRef}
                className={`flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-4 -my-4 ${filteredProducts.length <= 4 ? 'md:justify-center' : ''}`}
              >
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="w-[210px] sm:w-[220px] md:w-[230px] lg:w-[240px] shrink-0 snap-start"
                  >
                    <ProductCard product={product} observe={observe} onPreview={setSelectedProduct} onSave={setPurchaseModalProduct} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-40 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center col-span-full">
              <span className="text-4xl mb-4">🔮</span>
              <p className="text-gray-400 font-bold italic">Artifacts in development. Coming soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* Netflix Experience Showcase */}
      <section id="netflix-sites" ref={observe} className="py-16 md:py-20 pb-12 px-6 md:px-12 section-dark grain relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_0%,rgba(var(--accent-rgb),0.1),transparent)] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-center mb-16">
            <div className="w-full lg:w-5/12">
            <div className="inline-block px-3 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full mb-6">
              <span className="text-[var(--accent)] text-[10px] font-mono font-bold tracking-widest uppercase">✦ Featured Artifact</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
              {adminData.netflixShowcase.title}
            </h2>
            <p className="text-gray-400 text-base sm:text-lg mb-8 font-light leading-relaxed">
              {adminData.netflixShowcase.subtitle}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-12 mb-16">
              {adminData.netflixShowcase.features.map((feature, i) => (
                  <div key={i} className="space-y-3 group/feat">
                  <div className="flex items-center gap-3">
                    <FeatureIcon emoji={feature.emoji} />
                    <h4 className="text-white font-bold text-sm uppercase tracking-widest">{feature.title}</h4>
                  </div>
                  <p className="text-[#555] text-xs leading-relaxed pl-9">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-7/12">
             <div className="w-full grid grid-cols-2 md:grid-cols-6 grid-rows-none md:grid-rows-6 gap-4 h-auto md:h-[800px]">
                {/* Hero Slot */}
                <div 
                    className="col-span-2 md:col-span-4 md:row-span-4 aspect-video md:aspect-auto group relative rounded-3xl overflow-hidden border border-[#E50914]/10 hover:border-[#E50914]/30 hover:shadow-[0_0_25px_rgba(229,9,20,0.15)] cursor-pointer shadow-2xl transition-all duration-500 bg-black/40"
                    onClick={() => {
                        setLightboxSection('netflix');
                        setLightboxIndex(0);
                    }}
                >
                    <img src={adminData.netflixShowcase.screenshots[0].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Bento grid artifact" />
                    <div className="absolute inset-x-0 h-[2px] bg-[#E50914] shadow-[0_0_12px_#E50914] top-0 animate-[netflix-laser_5s_infinite_ease-in-out] pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-[#E50914]/5 opacity-30 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 md:p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold">{adminData.netflixShowcase.screenshots[0].label}</span>
                    </div>
                </div>
                
                {/* Portrait Slot 1 */}
                <div 
                    className="col-span-1 md:col-span-2 md:row-span-3 aspect-[3/4] md:aspect-auto group relative rounded-3xl overflow-hidden border border-[#E50914]/10 hover:border-[#E50914]/30 hover:shadow-[0_0_25px_rgba(229,9,20,0.15)] cursor-pointer shadow-2xl transition-all duration-500 bg-black/40"
                    onClick={() => {
                        setLightboxSection('netflix');
                        setLightboxIndex(1);
                    }}
                >
                    <img src={adminData.netflixShowcase.screenshots[1].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Bento grid artifact" />
                    <div className="absolute inset-x-0 h-[2px] bg-[#E50914] shadow-[0_0_12px_#E50914] top-0 animate-[netflix-laser_4s_infinite_ease-in-out_1s] pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-[#E50914]/5 opacity-30 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
                   <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[9px] uppercase tracking-[0.3em] font-bold">{adminData.netflixShowcase.screenshots[1].label}</span>
                    </div>
                </div>

                {/* Portrait Slot 2 */}
                <div 
                    className="col-span-1 md:col-span-2 md:row-span-3 aspect-[3/4] md:aspect-auto group relative rounded-3xl overflow-hidden border border-[#E50914]/10 hover:border-[#E50914]/30 hover:shadow-[0_0_25px_rgba(229,9,20,0.15)] cursor-pointer shadow-2xl transition-all duration-500 bg-black/40"
                    onClick={() => {
                        setLightboxSection('netflix');
                        setLightboxIndex(2);
                    }}
                >
                    <img src={adminData.netflixShowcase.screenshots[2].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Bento grid artifact" />
                    <div className="absolute inset-x-0 h-[2px] bg-[#E50914] shadow-[0_0_12px_#E50914] top-0 animate-[netflix-laser_6s_infinite_ease-in-out] pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-[#E50914]/5 opacity-30 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
                   <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[9px] uppercase tracking-[0.3em] font-bold">{adminData.netflixShowcase.screenshots[2].label}</span>
                    </div>
                </div>

                {/* Square Slot */}
                <div 
                    className="col-span-1 md:col-span-2 md:row-span-2 aspect-square md:aspect-auto group relative rounded-3xl overflow-hidden border border-[#E50914]/10 hover:border-[#E50914]/30 hover:shadow-[0_0_25px_rgba(229,9,20,0.15)] cursor-pointer shadow-2xl transition-all duration-500 bg-black/40"
                    onClick={() => {
                        setLightboxSection('netflix');
                        setLightboxIndex(3);
                    }}
                >
                    <img src={adminData.netflixShowcase.screenshots[3].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Bento grid artifact" />
                    <div className="absolute inset-x-0 h-[2px] bg-[#E50914] shadow-[0_0_12px_#E50914] top-0 animate-[netflix-laser_4.5s_infinite_ease-in-out_2s] pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-[#E50914]/5 opacity-30 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
                   <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[9px] uppercase tracking-[0.3em] font-bold">{adminData.netflixShowcase.screenshots[3].label}</span>
                    </div>
                </div>

                {/* Wide Slot */}
                <div 
                    className="col-span-1 md:col-span-2 md:row-span-2 aspect-video md:aspect-auto group relative rounded-3xl overflow-hidden border border-[#E50914]/10 hover:border-[#E50914]/30 hover:shadow-[0_0_25px_rgba(229,9,20,0.15)] cursor-pointer shadow-2xl transition-all duration-500 bg-black/40"
                    onClick={() => {
                        setLightboxSection('netflix');
                        setLightboxIndex(4);
                    }}
                >
                    <img src={adminData.netflixShowcase.screenshots[4].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Bento grid artifact" />
                    <div className="absolute inset-x-0 h-[2px] bg-[#E50914] shadow-[0_0_12px_#E50914] top-0 animate-[netflix-laser_5.5s_infinite_ease-in-out_1.5s] pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-[#E50914]/5 opacity-30 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
                   <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[9px] uppercase tracking-[0.3em] font-bold">{adminData.netflixShowcase.screenshots[4].label}</span>
                    </div>
                </div>
             </div>
          </div>
        </div>

        <div className="text-center flex flex-col items-center justify-center mt-4">
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
                 className="bg-[var(--accent)] text-white px-12 py-5 rounded-lg text-xl font-bold hover:opacity-90 transition-all shadow-[0_20px_40px_rgba(var(--accent-rgb),0.4)] active:scale-[0.98] cursor-pointer"
             >
                 Get the Netflix Template →
             </button>
        </div>
      </div>
    </section>

      {/* Paytm Secured Birthday Scan Showcase */}
      <section id="paytm-sites" ref={observe} className="py-16 md:py-20 pb-12 px-6 md:px-12 bg-[#010915] text-white grain relative border-t border-b border-white/5 overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-[radial-gradient(circle_at_0%_0%,rgba(0,185,245,0.07),transparent)] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_100%,rgba(0,41,112,0.1),transparent)] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row-reverse gap-20 items-center mb-16">
            {/* Column 1: Info (now on the right visually due to flex-row-reverse) */}
            <div className="w-full lg:w-5/12">
              <div className="inline-block px-3 py-1 bg-[#00b9f5]/10 border border-[#00b9f5]/20 rounded-full mb-6">
                <span className="text-[#00b9f5] text-[10px] font-mono font-bold tracking-widest uppercase">✦ Secure Gifting Standard</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight text-white">
                {adminData.paytmShowcase?.title || 'The Paytm Secured Birthday Scan'}
              </h2>
              <p className="text-gray-400 text-base md:text-lg mb-8 leading-relaxed font-medium">
                {adminData.paytmShowcase?.subtitle || 'Surprise them with a fully responsive Paytm-themed scan & gift experience. Scan a QR to reveal beautiful childhood memories, custom soundbox audio alerts, and a personalized secret UPI voucher!'}
              </p>
              
              <div className="flex items-center gap-6 mb-8 bg-[#002970]/30 border border-[#00b9f5]/10 rounded-2xl p-6">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-mono text-[#00b9f5] uppercase tracking-widest">PROMOTIONAL OFFER</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-[#00b9f5] text-3xl font-mono font-black">{adminData.paytmShowcase?.price || 'FREE'}</span>
                    <span className="text-gray-500 text-sm line-through font-mono">{adminData.paytmShowcase?.originalPrice || '₹999'}</span>
                  </div>
                </div>
                <div className="h-10 w-[1px] bg-white/10" />
                <div className="text-left">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">DEPLOYMENT STATUS</span>
                  <p className="text-white text-xs font-bold leading-none mt-1.5 flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" /> SECURE CONNECTED
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {(adminData.paytmShowcase?.features || []).map((feature, index) => (
                  <div key={index} className="flex flex-col gap-1 text-left">
                    <div className="flex items-center gap-3">
                      <PaytmFeatureIcon emoji={feature.emoji} />
                      <h4 className="text-white font-bold text-sm uppercase tracking-widest">{feature.title}</h4>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed pl-9">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Bento Grid Visuals (now on the left visually) */}
            <div className="w-full lg:w-7/12">
              <div className="w-full grid grid-cols-2 md:grid-cols-6 grid-rows-none md:grid-rows-6 gap-4 h-auto md:h-[800px]">
                {/* Hero Slot */}
                <div 
                    className="col-span-2 md:col-span-4 md:row-span-4 aspect-video md:aspect-auto group relative rounded-3xl overflow-hidden border border-[#00b9f5]/10 cursor-pointer shadow-2xl bg-black/40 hover:border-[#00b9f5]/30 transition-all duration-500"
                    onClick={() => {
                        setLightboxSection('paytm');
                        setLightboxIndex(0);
                    }}
                >
                    <img src={adminData.paytmShowcase?.screenshots?.[0]?.url || 'https://picsum.photos/800/450?random=401'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Bento grid Paytm showcase" />
                    <div className="absolute inset-x-0 h-[2px] bg-[#00b9f5] shadow-[0_0_12px_#00b9f5] top-0 animate-[paytm-laser_5s_infinite_ease-in-out] pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-[#002970]/10 opacity-40 group-hover:opacity-0 transition-opacity duration-500" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 md:p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold">{adminData.paytmShowcase?.screenshots?.[0]?.label || 'Interactive Soundbox Feed'}</span>
                    </div>
                </div>
                
                {/* Portrait Slot 1 */}
                <div 
                    className="col-span-1 md:col-span-2 md:row-span-3 aspect-[3/4] md:aspect-auto group relative rounded-3xl overflow-hidden border border-[#00b9f5]/10 cursor-pointer shadow-2xl bg-black/40 hover:border-[#00b9f5]/30 transition-all duration-500"
                    onClick={() => {
                        setLightboxSection('paytm');
                        setLightboxIndex(1);
                    }}
                >
                    <img src={adminData.paytmShowcase?.screenshots?.[1]?.url || 'https://picsum.photos/400/711?random=402'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Bento grid Paytm showcase" />
                    <div className="absolute inset-x-0 h-[2px] bg-[#00b9f5] shadow-[0_0_12px_#00b9f5] top-0 animate-[paytm-laser_4s_infinite_ease-in-out_1s] pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-[#002970]/10 opacity-40 group-hover:opacity-0 transition-opacity duration-500" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[9px] uppercase tracking-[0.3em] font-bold">{adminData.paytmShowcase?.screenshots?.[1]?.label || 'Payment Scan QR Code'}</span>
                    </div>
                </div>

                {/* Portrait Slot 2 */}
                <div 
                    className="col-span-1 md:col-span-2 md:row-span-3 aspect-[3/4] md:aspect-auto group relative rounded-3xl overflow-hidden border border-[#00b9f5]/10 cursor-pointer shadow-2xl bg-black/40 hover:border-[#00b9f5]/30 transition-all duration-500"
                    onClick={() => {
                        setLightboxSection('paytm');
                        setLightboxIndex(2);
                    }}
                >
                    <img src={adminData.paytmShowcase?.screenshots?.[2]?.url || 'https://picsum.photos/400/711?random=403'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Bento grid Paytm showcase" />
                    <div className="absolute inset-x-0 h-[2px] bg-[#00b9f5] shadow-[0_0_12px_#00b9f5] top-0 animate-[paytm-laser_6s_infinite_ease-in-out] pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-[#002970]/10 opacity-40 group-hover:opacity-0 transition-opacity duration-500" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[9px] uppercase tracking-[0.3em] font-bold">{adminData.paytmShowcase?.screenshots?.[2]?.label || 'Payment Processing Alert'}</span>
                    </div>
                </div>

                {/* Square Slot */}
                <div 
                    className="col-span-1 md:col-span-2 md:row-span-2 aspect-square md:aspect-auto group relative rounded-3xl overflow-hidden border border-[#00b9f5]/10 cursor-pointer shadow-2xl bg-black/40 hover:border-[#00b9f5]/30 transition-all duration-500"
                    onClick={() => {
                        setLightboxSection('paytm');
                        setLightboxIndex(3);
                    }}
                >
                    <img src={adminData.paytmShowcase?.screenshots?.[3]?.url || 'https://picsum.photos/400/400?random=404'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Bento grid Paytm showcase" />
                    <div className="absolute inset-x-0 h-[2px] bg-[#00b9f5] shadow-[0_0_12px_#00b9f5] top-0 animate-[paytm-laser_4.5s_infinite_ease-in-out_2s] pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-[#002970]/10 opacity-40 group-hover:opacity-0 transition-opacity duration-500" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[9px] uppercase tracking-[0.3em] font-bold">{adminData.paytmShowcase?.screenshots?.[3]?.label || 'Scratch & Win Gift'}</span>
                    </div>
                </div>

                {/* Wide Slot */}
                <div 
                    className="col-span-1 md:col-span-2 md:row-span-2 aspect-video md:aspect-auto group relative rounded-3xl overflow-hidden border border-[#00b9f5]/10 cursor-pointer shadow-2xl bg-black/40 hover:border-[#00b9f5]/30 transition-all duration-500"
                    onClick={() => {
                        setLightboxSection('paytm');
                        setLightboxIndex(4);
                    }}
                >
                    <img src={adminData.paytmShowcase?.screenshots?.[4]?.url || 'https://picsum.photos/800/450?random=405'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Bento grid Paytm showcase" />
                    <div className="absolute inset-x-0 h-[2px] bg-[#00b9f5] shadow-[0_0_12px_#00b9f5] top-0 animate-[paytm-laser_5.5s_infinite_ease-in-out_1.5s] pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-[#002970]/10 opacity-40 group-hover:opacity-0 transition-opacity duration-500" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-mono text-[9px] uppercase tracking-[0.3em] font-bold">{adminData.paytmShowcase?.screenshots?.[4]?.label || 'Transaction Summary Receipt'}</span>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center flex flex-col items-center justify-center mt-4">
             <button 
                 onClick={() => {
                     const paytm = products.find(p => p.title.toLowerCase().includes('paytm'));
                     if (paytm) {
                         setPurchaseModalProduct({
                             id: paytm.id,
                             title: paytm.title,
                             price: paytm.price,
                             original: paytm.original,
                             category: paytm.category
                         });
                     } else {
                         setPurchaseModalProduct({
                             id: 'paytm-showcase',
                             title: adminData.paytmShowcase?.title || 'Paytm Birthday Scan',
                             price: adminData.paytmShowcase?.price || 'FREE',
                             original: adminData.paytmShowcase?.originalPrice || '₹999',
                             category: 'Anniversary Sites'
                         });
                     }
                 }}
                 className="bg-[#002970] text-white border border-[#00b9f5]/30 px-12 py-5 rounded-lg text-xl font-bold hover:bg-[#001f57] hover:border-[#00b9f5]/60 transition-all shadow-[0_20px_40px_rgba(0,185,245,0.15)] active:scale-[0.98] cursor-pointer"
             >
                 Get the Paytm Template →
             </button>
        </div>
      </section>

      {/* How It Works - Light alternate */}
      <section id="about" ref={observe} className="py-16 md:py-24 section-light border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                <div>
                     <span className="font-mono text-[11px] font-bold text-[#FF3B3B] tracking-[0.2em] mb-4 inline-block uppercase">✦ How it Works</span>
                     <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight" dangerouslySetInnerHTML={{ __html: adminData.howItWorks.title.replace('\n', '<br/>') }}></h2>
                     <div className="space-y-12">
                         {adminData.howItWorks.steps.map(step => (
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
                    <img src={adminData.howItWorks.imageUrl} className="w-full aspect-[4/5] object-cover rounded-3xl relative z-10 shadow-2xl" alt="About" />
                </div>
            </div>
        </div>
      </section>



      {/* Pricing - Light */}
      <section id="pricing" ref={observe} className="py-20 md:py-24 section-light relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center mb-12">
            <span className="font-mono text-[11px] font-bold text-[#FF3B3B] tracking-[0.2em] mb-4 inline-block uppercase">{adminData.pricing?.tagline || '✦ Beta Access'}</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight" dangerouslySetInnerHTML={{ __html: (adminData.pricing?.title || 'Built for <br/>Lovers, by Lovers.').replace(/\n/g, '<br/>') }}></h2>
            <p className="text-gray-500 text-xl font-medium">{adminData.pricing?.subtitle || 'Currently in Private Beta. All artifacts are available for free.'}</p>
        </div>

        <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-20">
          <div className="bg-white border border-gray-100 p-12 rounded-3xl hover:shadow-2xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-[#FFD60A] text-black text-[8px] font-bold px-4 py-1.5 uppercase tracking-widest -rotate-45 translate-x-4 translate-y-2">Public Beta</div>
            <h3 className="text-gray-400 font-mono text-xs tracking-widest mb-6 uppercase italic">Artifact</h3>
            <div className="flex items-baseline gap-1 mb-8 flex-wrap">
              <span className="text-dark text-5xl font-mono font-bold">{adminData.pricing?.tier1Price || 'Free'}</span>
              {adminData.pricing?.tier1OriginalPrice && (
                <span className="text-gray-400 line-through text-sm font-mono ml-2">{adminData.pricing.tier1OriginalPrice}</span>
              )}
            </div>
            <ul className="space-y-4 mb-12">
              {(adminData.pricing?.tier1Features || [
                'Signature PDF Layout',
                'Instant Source Access',
                'Print-ready Assets',
                'Basic Customization'
              ]).map(f => (
                <li key={f} className="flex gap-3 text-sm text-gray-500 font-bold">
                  <span className="text-[#FF3B3B]">✦</span> {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => {
                const pdf = products.find(p => p.type === 'pdf');
                if (pdf) setPurchaseModalProduct({ ...pdf, price: adminData.pricing?.tier1Price || pdf.price, original: adminData.pricing?.tier1OriginalPrice || pdf.original });
                else setPurchaseModalProduct({
                  id: 'pdf-fallback',
                  title: 'Signature PDF Layout',
                  price: adminData.pricing?.tier1Price || 'Free',
                  original: adminData.pricing?.tier1OriginalPrice || '₹499',
                  category: 'PDF templates'
                });
              }}
              className="w-full border-2 border-dark text-dark py-5 rounded-2xl font-bold hover:bg-dark hover:text-white transition-all"
            >
              Claim PDF
            </button>
          </div>

          <div className="bg-dark text-white p-12 rounded-3xl relative shadow-[0_40px_100px_rgba(0,0,0,0.2)] md:scale-[1.05] z-10 overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
                <span className="bg-[#FF3B3B] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Premium</span>
            </div>
            <h3 className="text-[#FF3B3B] font-mono text-xs tracking-widest mb-6 uppercase italic">Experience</h3>
            <div className="flex items-baseline gap-1 mb-8 flex-wrap">
              <span className="text-white text-5xl font-mono font-bold">{adminData.pricing?.tier2Price || 'Free'}</span>
              {adminData.pricing?.tier2OriginalPrice && (
                <span className="text-gray-500 line-through text-sm font-mono ml-2">{adminData.pricing.tier2OriginalPrice}</span>
              )}
            </div>
            <ul className="space-y-4 mb-12">
              {(adminData.pricing?.tier2Features || [
                'Netflix Site Bundle',
                'Full JSX Components',
                'Interactive Profiles',
                'Live Preview Hosting',
                'Priority Support'
              ]).map(f => (
                <li key={f} className="flex gap-3 text-sm text-gray-400 font-bold">
                  <span className="text-[#FF3B3B]">✦</span> {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => {
                const netflix = products.find(p => p.title.toLowerCase().includes('netflix'));
                if (netflix) setPurchaseModalProduct({ ...netflix, price: adminData.pricing?.tier2Price || netflix.price, original: adminData.pricing?.tier2OriginalPrice || netflix.original });
                else setPurchaseModalProduct({
                  id: 'netflix-showcase',
                  title: adminData.netflixShowcase.title,
                  price: adminData.pricing?.tier2Price || adminData.netflixShowcase.price || 'Free',
                  original: adminData.pricing?.tier2OriginalPrice || adminData.netflixShowcase.originalPrice || '₹1,499',
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
            <div className="flex items-baseline gap-1 mb-8 flex-wrap">
              <span className="text-dark text-5xl font-mono font-bold">{adminData.pricing?.tier3Price || 'Free'}</span>
              {adminData.pricing?.tier3OriginalPrice && (
                <span className="text-gray-400 line-through text-sm font-mono ml-2">{adminData.pricing.tier3OriginalPrice}</span>
              )}
            </div>
            <ul className="space-y-4 mb-12">
              {(adminData.pricing?.tier3Features || [
                'Complete Collection Access',
                'Exclusive Beta Templates',
                'Private Community',
                'Early Access to Updates'
              ]).map(f => (
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
      {user?.email === 'deeagrawal078@gmail.com' && (
        <div className="fixed bottom-6 right-6 z-[400] opacity-40 hover:opacity-100 transition-all duration-300">
          <button 
            onClick={() => setAdminPanelOpen(true)}
            className="w-12 h-12 bg-[#111] backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:scale-110 active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all"
            title="Admin Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="pt-32 pb-12 px-6 md:px-12 bg-[#0A0A0A] border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="md:col-span-2">
            <span className="font-display text-3xl italic font-black text-white mb-6 block">{adminData.siteName}<span className="text-[var(--accent)]">.</span></span>
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
          <p className="text-[#444] text-[10px] uppercase font-mono tracking-widest">© 2025 {adminData.siteName}. Made with ❤️ for moments that matter.</p>
          <div className="flex items-center gap-8">
            {!user ? (
              <button 
                onClick={handleLogin}
                className="text-[#444] hover:text-white text-[10px] uppercase font-mono tracking-widest transition-colors cursor-pointer"
              >
                Admin Login
              </button>
            ) : (
              <button 
                onClick={handleLogout}
                className="text-[#444] hover:text-white text-[10px] uppercase font-mono tracking-widest transition-colors cursor-pointer"
              >
                Logout ({user.email})
              </button>
            )}
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
            <span className="font-display text-2xl italic font-black text-white">{adminData.siteName}<span className="text-[var(--accent)]">.</span></span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-white"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <div className="flex flex-col gap-4">
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
                className="text-lg md:text-3xl font-display font-bold text-white hover:text-[var(--accent)] transition-colors active:scale-95 transition-transform origin-left"
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
        products={products}
        categoriesFromDB={categoriesFromDB}
      />

      {/* Purchase Modal */}
      {purchaseModalProduct && (
        <PurchaseModal 
          product={purchaseModalProduct} 
          isOpen={!!purchaseModalProduct} 
          onClose={() => setPurchaseModalProduct(null)} 
        />
      )}

      {/* Dynamic Bento Lightbox Modal */}
      {lightboxIndex !== null && lightboxSection !== null && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-6 md:p-12 animate-[fadeIn_0.4s_ease-out]">
          {/* Top Info Bar */}
          <div className="flex justify-between items-center w-full relative z-30">
            <div className="text-left">
              <span className="font-mono text-[#00b9f5] text-[10px] uppercase tracking-widest block mb-1">
                {lightboxSection === 'netflix' ? 'NETFLIX ANNIVERSARY SITE' : 'PAYTM BIRTHDAY SCAN'}
              </span>
              <h3 className="text-white text-sm font-bold uppercase tracking-wider">
                {lightboxSection === 'netflix' 
                  ? adminData.netflixShowcase.screenshots[lightboxIndex]?.label 
                  : adminData.paytmShowcase?.screenshots?.[lightboxIndex]?.label || 'Secured Interactive Preview'
                }
              </h3>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-white/40 font-mono text-xs">
                {String(lightboxIndex + 1).padStart(2, '0')} / 05
              </span>
              <button 
                onClick={() => {
                  setLightboxIndex(null);
                  setLightboxSection(null);
                }}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Main Display Image */}
          <div className="flex-1 flex items-center justify-center py-8 relative">
            {/* Left Prev Arrow */}
            <button 
              onClick={() => {
                setLightboxIndex(prev => (prev !== null ? (prev - 1 + 5) % 5 : 0));
              }}
              className="absolute left-0 md:left-6 w-12 h-12 rounded-full border border-white/10 bg-black/40 hover:bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all z-30 cursor-pointer"
            >
              ←
            </button>

            <img 
              src={lightboxSection === 'netflix' 
                ? adminData.netflixShowcase.screenshots[lightboxIndex]?.url 
                : adminData.paytmShowcase?.screenshots?.[lightboxIndex]?.url || 'https://picsum.photos/800/450'
              } 
              className="max-h-[70vh] max-w-full md:max-w-4xl object-contain rounded-2xl border border-white/10 shadow-3xl animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]" 
              alt="Bento Grid Detail" 
            />

            {/* Right Next Arrow */}
            <button 
              onClick={() => {
                setLightboxIndex(prev => (prev !== null ? (prev + 1) % 5 : 0));
              }}
              className="absolute right-0 md:right-6 w-12 h-12 rounded-full border border-white/10 bg-black/40 hover:bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all z-30 cursor-pointer"
            >
              →
            </button>
          </div>

          {/* Bottom Controls Indicator */}
          <div className="flex justify-center gap-2 items-center w-full z-30">
            {[0, 1, 2, 3, 4].map((idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${lightboxIndex === idx ? (lightboxSection === 'netflix' ? 'bg-[#E50914] w-6' : 'bg-[#00b9f5] w-6') : 'bg-white/25'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes netflix-laser {
          0%, 100% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 0.95; }
        }
        @keyframes paytm-laser {
          0%, 100% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 0.9; }
        }
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
