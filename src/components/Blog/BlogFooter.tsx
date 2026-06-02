import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, onSnapshot, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Instagram, Twitter, Facebook, Youtube, Github, Mail, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const BlogFooter = () => {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    footer: {
      tagline: 'Premium digital templates and cinematic story websites.',
      copyright: '© 2026 ARTIFACT. Made with ❤️ for moments that matter.',
      newsletterHeading: 'Stay Updated',
      newsletterDescription: 'Get exclusive design releases, insights, and relationship template tips.',
      newsletterPlaceholder: 'Enter your email',
    }
  });

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'hero'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => {
      unsub();
      unsubAuth();
    };
  }, []);

  const isAdmin = user && user.email?.toLowerCase() === 'deeagrawal078@gmail.com';

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // basic verification
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      await addDoc(collection(db, 'newsletter'), {
        email,
        subscribedAt: serverTimestamp(),
        source: 'blog'
      });

      setSubscribed(true);
      setEmail('');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = settings.footer || {};
  const logoText = settings.navbar?.logoText || settings.siteName || 'ARTIFACT';

  return (
    <footer className="bg-[#050505] border-t border-white/5 py-16 px-6 md:px-12 relative overflow-hidden text-gray-400">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* Logo and Tagline Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex flex-col">
            <span className="font-display text-2xl italic font-black text-white leading-none">
              {logoText}<span className="text-[var(--accent)]">.</span>
            </span>
            <span className="text-[8px] font-mono tracking-[0.25em] text-gray-500 mt-1 uppercase">
              {settings.navbar?.logoTagline || 'FOR MOMENTS THAT MATTER'}
            </span>
          </div>
          <p className="text-sm font-light leading-relaxed max-w-sm text-gray-500">
            {footer.tagline || 'The world\'s premium marketplace for digital anniversary templates and cinematic story websites.'}
          </p>
          <div className="flex gap-4 pt-2">
            <a href="#" className="hover:text-white transition-colors text-gray-600"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="hover:text-white transition-colors text-gray-600"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="hover:text-white transition-colors text-gray-600"><Facebook className="w-5 h-5" /></a>
            <a href="#" className="hover:text-white transition-colors text-gray-600"><Youtube className="w-5 h-5" /></a>
          </div>
        </div>

        {/* Links Columns */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-[10px] tracking-[0.25em] font-mono font-bold text-white uppercase mb-4">Navigations</h4>
            <ul className="space-y-2 text-sm font-light">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/#templates" className="hover:text-white transition-colors">Templates</a></li>
              <li><a href="/#netflix-sites" className="hover:text-white transition-colors">Netflix Sites</a></li>
              <li><a href="/#pricing" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] tracking-[0.25em] font-mono font-bold text-white uppercase mb-4">Writers</h4>
            <ul className="space-y-2 text-sm font-light">
              <li><a href="/blog" className="hover:text-white transition-colors">Our Blog</a></li>
              {isAdmin && (
                <li><a href="/admin/blogs" className="hover:text-white transition-colors">Creator Room</a></li>
              )}
              <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Column */}
        <div className="lg:col-span-4 space-y-4">
          <h4 className="text-[10px] tracking-[0.25em] font-mono font-bold text-white uppercase">
            {footer.newsletterHeading || 'Stay Connected'}
          </h4>
          <p className="text-xs font-light leading-relaxed text-gray-500">
            {footer.newsletterDescription || 'Join our elite newsletter list to get early notification on new design releases.'}
          </p>

          <AnimatePresence mode="wait">
            {subscribed ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[rgba(255,59,59,0.05)] border border-[var(--accent)]/30 rounded px-4 py-3 text-white flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-medium">You have been subscribed! Thank you.</span>
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubscribe} 
                className="relative"
              >
                <div className="flex h-11 items-center bg-black border border-white/10 focus-within:border-white/30 rounded transition-all">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={footer.newsletterPlaceholder || 'Enter your email'}
                    className="flex-1 bg-transparent px-4 font-light text-sm outline-none text-white placeholder-gray-600 focus:outline-none"
                    disabled={submitting}
                    required
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-full px-4 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50 text-[var(--accent)] border-l border-white/10"
                    title="Subscribe"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
              </motion.form>
            )}
          </AnimatePresence>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-light text-gray-600">
        <div>{footer.copyright || '© 2026 ARTIFACT. Made with ❤️ for moments that matter.'}</div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <span>·</span>
          <a href="#" className="hover:text-white transition-colors">Refunds</a>
        </div>
      </div>

      {/* Grid Pattern and Ambient Light Background for Premium Look */}
      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(255,59,59,0.06),transparent)] pointer-events-none -z-10" />
    </footer>
  );
};
