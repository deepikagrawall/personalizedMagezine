import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowLeft, ArrowUpRight } from 'lucide-react';

export const BlogNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    siteName: 'ARTIFACT',
    navbar: {
      logoText: 'ARTIFACT',
      logoTagline: 'FOR MOMENTS THAT MATTER',
      ctaText: 'Get Started',
      ctaLink: '/#pricing',
    }
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const unsub = onSnapshot(doc(db, 'settings', 'hero'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsub();
      unsubAuth();
    };
  }, []);

  const isAdmin = user && user.email?.toLowerCase() === 'deeagrawal078@gmail.com';

  const logoText = settings.navbar?.logoText || settings.siteName || 'ARTIFACT';
  const logoTagline = settings.navbar?.logoTagline || 'FOR MOMENTS THAT MATTER';
  const ctaText = settings.navbar?.ctaText || 'Get Started';
  const ctaLink = settings.navbar?.ctaLink || '/#pricing';

  return (
    <nav className={`fixed top-0 left-0 w-full h-16 flex items-center justify-between px-6 md:px-12 z-[100] transition-all duration-300 ${
      scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent border-b border-transparent'
    }`}>
      {/* Brand logo */}
      <Link to="/" className="flex flex-col group">
        <span className="font-display text-2xl italic font-black text-white leading-none">
          {logoText}<span className="text-[var(--accent)] group-hover:text-red-400 transition-colors">.</span>
        </span>
        {settings.navbar?.showLogoTagline !== false && (
          <span className="text-[8px] font-mono tracking-[0.25em] text-gray-500 mt-1 uppercase">
            {logoTagline}
          </span>
        )}
      </Link>

      {/* Navigation links & CTA */}
      <div className="hidden md:flex items-center gap-8">
        <Link to="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <Link to="/blog" className="text-sm font-semibold text-white border-b border-[var(--accent)] pb-0.5">
          Blog
        </Link>
        {isAdmin && (
          <a 
            href="/admin/blogs" 
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Publisher Panel
          </a>
        )}
      </div>

      <div className="flex items-center gap-4">
        <a 
          href={ctaLink} 
          className="bg-[var(--accent)] hover:bg-[#ff4d4d] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded transition-transform active:scale-95 shadow-[0_4px_20px_rgba(255,59,59,0.3)] flex items-center gap-1.5"
        >
          {ctaText} <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
        
        <button 
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 w-full bg-[#0E0E0E] border-b border-white/10 p-6 flex flex-col gap-4 z-[99]"
          >
            <Link 
              to="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm py-2 border-b border-white/5 text-gray-300"
            >
              Back to Home
            </Link>
            <Link 
              to="/blog" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm py-2 border-b border-white/5 text-white font-bold"
            >
              Blog Home
            </Link>
            {isAdmin && (
              <Link 
                to="/admin/blogs" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm py-2 border-b border-white/5 text-gray-300"
              >
                Publisher Dashboard
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
