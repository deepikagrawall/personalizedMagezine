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
  const [activeTab, setActiveTab] = useState<any>('products');
  
  // Media Upload States
  const [uploadingHowItWorks, setUploadingHowItWorks] = useState(false);
  const [uploadingCurated, setUploadingCurated] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [heroForm, setHeroForm] = useState<any>({
    siteName: 'ARTIFACT',
    accentColor: '#FF3B3B',
    tagline: 'Premium Digital Artifacts',
    titlePart1: 'CRAFTING MOMENTS',
    titlePart2: 'INTO DIGITAL ART.',
    titlePart3: 'FOR US.',
    description: 'Transform your special memories into high-fidelity digital templates. Fully customizable, high-resolution, and delivered instantly.',
    primaryButtonText: 'Explore Artifacts',
    secondaryButtonText: 'View Samples',
    heroImages: [],
    netflixShowcase: {
      title: 'The Netflix Anniversary Experience',
      subtitle: 'The most immersive anniversary website template ever built. Profiles, banners, scroll rows — identical to Netflix.',
      price: 'FREE',
      originalPrice: '₹1,499',
      features: [
        { emoji: '🎬', title: 'Netflix Profile Screen', desc: "4 milestone profiles. Who's watching your love story?" },
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
      subtitle: 'Currently in Private Beta.',
      tier1Price: 'Free',
      tier1OriginalPrice: '₹499',
      tier2Price: 'Free',
      tier2OriginalPrice: '₹1499',
      tier3Price: 'Free',
      tier3OriginalPrice: '₹4999',
    },
    navbar: {
      logoText: 'ARTIFACT',
      logoTagline: 'FOR MOMENTS THAT MATTER',
      showLogoTagline: true,
      ctaEnabled: true,
      ctaText: 'Get Started',
      ctaLink: '#pricing',
      secondaryCtaEnabled: true,
      secondaryCtaText: 'Browse All',
      secondaryCtaLink: '#templates',
      links: [
        { id: 'templates', name: 'Templates', url: '#templates', show: true, parentId: '', target: '_self' },
        { id: 'netflix-sites', name: 'Netflix Sites', url: '#netflix-sites', show: true, parentId: '', target: '_self' },
        { id: 'pricing', name: 'Pricing', url: '#pricing', show: true, parentId: '', target: '_self' },
        { id: 'about', name: 'About', url: '#about', show: true, parentId: '', target: '_self' }
      ]
    },
    footer: {
      tagline: 'The world\'s premium marketplace for digital anniversary templates and cinematic story websites.',
      copyright: '© 2026 ARTIFACT. Made with ❤️ for moments that matter.',
      newsletterEnabled: true,
      newsletterHeading: 'Stay Updated',
      newsletterDescription: 'Get early access to private beta releases & exclusive templates.',
      newsletterPlaceholder: 'your@email.com',
      newsletterButtonText: '→',
      contactDetails: {
        email: 'hello@artifact.com',
        phone: '+91 99999 99999',
        address: 'Designed in India. Serving memory makers worldwide.',
        showContact: true
      },
      socialLinks: [
        { id: 'instagram', platform: 'Instagram', url: '#', show: true },
        { id: 'twitter', platform: 'Twitter', url: '#', show: true },
        { id: 'pinterest', platform: 'Pinterest', url: '#', show: true }
      ],
      columns: [
        {
          id: 'col1',
          title: 'Connect',
          links: [
            { label: 'Templates', url: '#templates' },
            { label: 'Netflix Sites', url: '#netflix-sites' },
            { label: 'How It Works', url: '#how-it-works' },
            { label: 'Pricing', url: '#pricing' }
          ]
        }
      ],
      legalLinks: [
        { label: 'Privacy', url: '#' },
        { label: 'Terms', url: '#' },
        { label: 'Refund Policy', url: '#' }
      ]
    }
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
        const dbData = docSnap.data();
        setHeroForm((prev: any) => ({
          ...prev,
          ...dbData,
          netflixShowcase: dbData.netflixShowcase ? { ...prev.netflixShowcase, ...dbData.netflixShowcase } : prev.netflixShowcase,
          paytmShowcase: dbData.paytmShowcase ? { ...prev.paytmShowcase, ...dbData.paytmShowcase } : prev.paytmShowcase,
          howItWorks: dbData.howItWorks ? { ...prev.howItWorks, ...dbData.howItWorks } : prev.howItWorks,
          curatedSelection: dbData.curatedSelection ? { ...prev.curatedSelection, ...dbData.curatedSelection } : prev.curatedSelection,
          pricing: dbData.pricing ? { ...prev.pricing, ...dbData.pricing } : prev.pricing,
          navbar: dbData.navbar ? { ...prev.navbar, ...dbData.navbar } : prev.navbar,
          footer: dbData.footer ? { ...prev.footer, ...dbData.footer } : prev.footer
        }));
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

  const handleSyncSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUploading(true);
    try {
      const cleanedPricing = { ...(heroForm.pricing || {}) };
      if (Array.isArray(cleanedPricing.tier1Features)) {
        cleanedPricing.tier1Features = cleanedPricing.tier1Features.map((f: string) => f.trim()).filter((f: string) => f !== '');
      }
      if (Array.isArray(cleanedPricing.tier2Features)) {
        cleanedPricing.tier2Features = cleanedPricing.tier2Features.map((f: string) => f.trim()).filter((f: string) => f !== '');
      }
      if (Array.isArray(cleanedPricing.tier3Features)) {
        cleanedPricing.tier3Features = cleanedPricing.tier3Features.map((f: string) => f.trim()).filter((f: string) => f !== '');
      }

      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'settings', 'hero'), {
         ...heroForm,
         pricing: cleanedPricing,
         updatedAt: serverTimestamp()
      });
      alert('Success! Site content synchronized across all user devices.');
    } catch (err: any) {
      console.error(err);
      alert('Sync Failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const uploadHowItWorksImage = async (file: File) => {
    setUploadingHowItWorks(true);
    try {
      const storageRef = ref(storage, `howitworks/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setHeroForm((prev: any) => ({
        ...prev,
        howItWorks: {
          ...prev.howItWorks,
          imageUrl: downloadURL
        }
      }));
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
      setHeroForm((prev: any) => ({
        ...prev,
        curatedSelection: {
          ...prev.curatedSelection,
          imageUrl: downloadURL
        }
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Try again.');
    } finally {
      setUploadingCurated(false);
    }
  };

  const handleImageUpload = async (file: File, index: number) => {
    setUploadingIdx(index);
    try {
      const storageRef = ref(storage, `showcase/netflix/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setHeroForm((prev: any) => {
        const newSS = [...prev.netflixShowcase.screenshots];
        newSS[index] = { ...newSS[index], url: downloadURL };
        return {
          ...prev,
          netflixShowcase: {
            ...prev.netflixShowcase,
            screenshots: newSS
          }
        };
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
    try {
      const storageRef = ref(storage, `showcase/paytm/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setHeroForm((prev: any) => {
        const newSS = [...prev.paytmShowcase.screenshots];
        newSS[index] = { ...newSS[index], url: downloadURL };
        return {
          ...prev,
          paytmShowcase: {
            ...prev.paytmShowcase,
            screenshots: newSS
          }
        };
      });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Try again.');
    } finally {
      setUploadingIdx(null);
    }
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
      imageUrl: '',
      whatsInside: ''
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
      imageUrl: p.imageUrl || '',
      whatsInside: Array.isArray(p.whatsInside) ? p.whatsInside.join(', ') : (p.whatsInside || '')
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

  // NAVBAR state modifiers
  const addNavbarLink = () => {
    const currentNav = heroForm.navbar || { links: [] };
    const currentLinks = currentNav.links || [];
    const newLink = {
      id: `link-${Date.now()}`,
      name: 'New Link',
      url: '#',
      show: true,
      parentId: '',
      target: '_self'
    };
    setHeroForm({
      ...heroForm,
      navbar: {
        ...currentNav,
        links: [...currentLinks, newLink]
      }
    });
  };

  const deleteNavbarLink = (id: string) => {
    const currentNav = heroForm.navbar || { links: [] };
    const currentLinks = currentNav.links || [];
    setHeroForm({
      ...heroForm,
      navbar: {
        ...currentNav,
        links: currentLinks.filter((l: any) => l.id !== id)
      }
    });
  };

  const updateNavbarLink = (id: string, field: string, value: any) => {
    const currentNav = heroForm.navbar || { links: [] };
    const currentLinks = currentNav.links || [];
    setHeroForm({
      ...heroForm,
      navbar: {
        ...currentNav,
        links: currentLinks.map((l: any) => l.id === id ? { ...l, [field]: value } : l)
      }
    });
  };

  const moveNavbarLink = (index: number, direction: 'up' | 'down') => {
    const currentNav = heroForm.navbar || { links: [] };
    const links = [...(currentNav.links || [])];
    if (direction === 'up' && index > 0) {
      const temp = links[index];
      links[index] = links[index - 1];
      links[index - 1] = temp;
    } else if (direction === 'down' && index < links.length - 1) {
      const temp = links[index];
      links[index] = links[index + 1];
      links[index + 1] = temp;
    }
    setHeroForm({
      ...heroForm,
      navbar: {
        ...currentNav,
        links
      }
    });
  };

  // FOOTER state modifiers
  const addFooterColumn = () => {
    const currFooter = heroForm.footer || { columns: [] };
    const cols = currFooter.columns || [];
    const newCol = {
      id: `col-${Date.now()}`,
      title: 'New Column',
      links: [{ label: 'Link 1', url: '#' }]
    };
    setHeroForm({
      ...heroForm,
      footer: {
        ...currFooter,
        columns: [...cols, newCol]
      }
    });
  };

  const deleteFooterColumn = (id: string) => {
    const currFooter = heroForm.footer || { columns: [] };
    const cols = currFooter.columns || [];
    setHeroForm({
      ...heroForm,
      footer: {
        ...currFooter,
        columns: cols.filter((c: any) => c.id !== id)
      }
    });
  };

  const updateFooterColumnTitle = (id: string, title: string) => {
    const currFooter = heroForm.footer || { columns: [] };
    const cols = currFooter.columns || [];
    setHeroForm({
      ...heroForm,
      footer: {
        ...currFooter,
        columns: cols.map((c: any) => c.id === id ? { ...c, title } : c)
      }
    });
  };

  const addFooterColumnLink = (colId: string) => {
    const currFooter = heroForm.footer || { columns: [] };
    const cols = currFooter.columns || [];
    setHeroForm({
      ...heroForm,
      footer: {
        ...currFooter,
        columns: cols.map((c: any) => {
          if (c.id === colId) {
            return {
              ...c,
              links: [...(c.links || []), { label: 'New Link', url: '#' }]
            };
          }
          return c;
        })
      }
    });
  };

  const updateFooterColumnLink = (colId: string, linkIdx: number, field: string, value: string) => {
    const currFooter = heroForm.footer || { columns: [] };
    const cols = currFooter.columns || [];
    setHeroForm({
      ...heroForm,
      footer: {
        ...currFooter,
        columns: cols.map((c: any) => {
          if (c.id === colId) {
            const nextLinks = [...(c.links || [])];
            nextLinks[linkIdx] = { ...nextLinks[linkIdx], [field]: value };
            return { ...c, links: nextLinks };
          }
          return c;
        })
      }
    });
  };

  const deleteFooterColumnLink = (colId: string, linkIdx: number) => {
    const currFooter = heroForm.footer || { columns: [] };
    const cols = currFooter.columns || [];
    setHeroForm({
      ...heroForm,
      footer: {
        ...currFooter,
        columns: cols.map((c: any) => {
          if (c.id === colId) {
            return {
              ...c,
              links: (c.links || []).filter((_: any, idx: number) => idx !== linkIdx)
            };
          }
          return c;
        })
      }
    });
  };

  const updateSocialLink = (id: string, field: string, value: any) => {
    const currFooter = heroForm.footer || { socialLinks: [] };
    const socials = currFooter.socialLinks || [];
    setHeroForm({
      ...heroForm,
      footer: {
        ...currFooter,
        socialLinks: socials.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
      }
    });
  };

  const addSocialLink = () => {
    const currFooter = heroForm.footer || { socialLinks: [] };
    const socials = currFooter.socialLinks || [];
    const newSocial = {
      id: `soc-${Date.now()}`,
      platform: 'Instagram',
      url: '#',
      show: true
    };
    setHeroForm({
      ...heroForm,
      footer: {
        ...currFooter,
        socialLinks: [...socials, newSocial]
      }
    });
  };

  const deleteSocialLink = (id: string) => {
    const currFooter = heroForm.footer || { socialLinks: [] };
    const socials = currFooter.socialLinks || [];
    setHeroForm({
      ...heroForm,
      footer: {
        ...currFooter,
        socialLinks: socials.filter((s: any) => s.id !== id)
      }
    });
  };

  const updateLegalLink = (idx: number, field: string, value: string) => {
    const currFooter = heroForm.footer || { legalLinks: [] };
    const legals = [...(currFooter.legalLinks || [])];
    legals[idx] = { ...legals[idx], [field]: value };
    setHeroForm({
      ...heroForm,
      footer: {
        ...currFooter,
        legalLinks: legals
      }
    });
  };

  const addLegalLink = () => {
    const currFooter = heroForm.footer || { legalLinks: [] };
    const legals = currFooter.legalLinks || [];
    setHeroForm({
      ...heroForm,
      footer: {
        ...currFooter,
        legalLinks: [...legals, { label: 'New Policy', url: '#' }]
      }
    });
  };

  const deleteLegalLink = (idx: number) => {
    const currFooter = heroForm.footer || { legalLinks: [] };
    const legals = (currFooter.legalLinks || []).filter((_: any, i: number) => i !== idx);
    setHeroForm({
      ...heroForm,
      footer: {
        ...currFooter,
        legalLinks: legals
      }
    });
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-4xl font-display font-bold italic tracking-tighter">ARTIFACT CONTROL CENTER</h1>
            <p className="text-[10px] uppercase font-mono tracking-[0.25em] text-gray-500 mt-2">Unified Management Terminal</p>
          </div>
          
          {/* Stats Bar */}
          <div className="flex bg-[#111] border border-white/5 rounded-2xl p-4 gap-8 shrink-0">
             <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-mono">Artifacts</span>
                <span className="text-xl font-bold font-mono text-white">{products.length}</span>
             </div>
             <div className="flex flex-col border-l border-white/5 pl-8">
                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-mono">Total Leads</span>
                <span className="text-xl font-bold font-mono text-[#FF3B3B]">{requests.length}</span>
             </div>
             <div className="flex flex-col border-l border-white/5 pl-8">
                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-mono">Categories</span>
                <span className="text-xl font-bold font-mono text-white">{categories.length}</span>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 font-mono bg-white/5 px-3 py-1.5 rounded">{user.email}</span>
            <button onClick={() => signOut(auth)} className="text-xs uppercase tracking-widest text-[#FF3B3B] font-bold hover:underline">Sign Out</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Side Tabs Navigation */}
          <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 border-b lg:border-b-0 lg:border-r border-white/5 pr-0 lg:pr-6 scrollbar-none sticky top-24">
            {[
              { id: 'products', name: 'Artifacts' },
              { id: 'requests', name: `Leads (${requests.length})` },
              { id: 'settings', name: 'Identity & Hero' },
              { id: 'pricing', name: 'Pricing Tiers' },
              { id: 'netflix', name: 'Netflix Showcase' },
              { id: 'paytm', name: 'Paytm Showcase' },
              { id: 'howItWorks', name: 'How It Works' },
              { id: 'curatedSelection', name: 'Curated' },
              { id: 'navbar', name: 'Navbar Editor ✦' },
              { id: 'footer', name: 'Footer Editor ✦' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-[10px] font-mono uppercase tracking-[0.2em] py-3.5 px-5 rounded-xl transition-all font-bold text-left shrink-0 border lg:border-0 ${
                  activeTab === tab.id 
                    ? 'bg-[#FF3B3B] border-[#FF3B3B] text-white shadow-lg shadow-[#FF3B3B]/10 lg:translate-x-1' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-white/10 bg-[#111] lg:bg-transparent'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Main Workspace Frame */}
          <div className="lg:col-span-9 space-y-8 min-w-0">
            {activeTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-[fadeIn_0.3s_ease-out]">
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
                      className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B] text-sm text-white"
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                      required
                    />
                    <textarea 
                      placeholder="Description" 
                      className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B] h-24 text-sm text-white"
                      value={form.desc}
                      onChange={e => setForm({...form, desc: e.target.value})}
                      required
                    />
                    <textarea 
                      placeholder="What's Inside (comma separated items)" 
                      className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B] h-20 text-sm text-white"
                      value={form.whatsInside}
                      onChange={e => setForm({...form, whatsInside: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        placeholder="Price" 
                        className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B] text-sm text-white font-mono"
                        value={form.price}
                        onChange={e => setForm({...form, price: e.target.value})}
                        required
                      />
                      <input 
                        placeholder="Original" 
                        className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B] text-sm text-white font-mono"
                        value={form.original}
                        onChange={e => setForm({...form, original: e.target.value})}
                      />
                    </div>
                    <select 
                      className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B] text-sm text-white"
                      value={form.type}
                      onChange={e => setForm({...form, type: e.target.value})}
                    >
                      <option value="pdf">PDF Template</option>
                      <option value="site">Website Template</option>
                    </select>
                    <select 
                      className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B] text-sm text-white"
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
                              className="flex-1 bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-[#FF3B3B] text-sm"
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
                            <p className="text-xs text-gray-500">{p.category} • {p.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-white font-bold text-sm font-mono">{p.price}</span>
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
            )}

            {activeTab === 'requests' && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
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
                                              className="bg-black border border-white/10 rounded text-[10px] uppercase font-mono p-1 outline-none text-white"
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
            )}

            {activeTab === 'settings' && (
              <div className="animate-[fadeIn_0.3s_ease-out] space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                      <span className="text-[#FF3B3B]">✦</span> Identity & Hero Banner Settings
                  </h2>
                  <button onClick={() => handleSyncSettings()} disabled={uploading} className="bg-[#FF3B3B] text-white px-6 py-2 rounded-lg text-xs font-mono uppercase tracking-widest font-bold disabled:opacity-55 hover:bg-red-600 transition-colors">
                    {uploading ? 'Processing...' : 'Sync Identity'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6 bg-[#111] p-8 rounded-2xl border border-white/5">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF3B3B] font-mono mb-4">Brand Identity</h3>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Site Name</label>
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B] font-bold"
                            value={heroForm.siteName}
                            onChange={e => setHeroForm({...heroForm, siteName: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Site Tagline</label>
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                            value={heroForm.tagline}
                            onChange={e => setHeroForm({...heroForm, tagline: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Footer Tagline</label>
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                            value={heroForm.footerTagline || ''}
                            onChange={e => setHeroForm({...heroForm, footerTagline: e.target.value})}
                        />
                    </div>
                  </div>

                  <div className="space-y-6 bg-[#111] p-8 rounded-2xl border border-white/5">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF3B3B] font-mono mb-4">Platform Stats / Counters</h3>
                    <div className="space-y-3">
                       {heroForm.stats && heroForm.stats.map((stat: any, i: number) => (
                           <div key={i} className="flex gap-2">
                               <input 
                                   className="w-1/3 bg-black border border-white/10 rounded px-3 py-2 text-white text-xs font-mono font-bold outline-none focus:border-[#FF3B3B]"
                                   value={stat.number}
                                   onChange={e => {
                                       const newS = [...heroForm.stats];
                                       newS[i].number = e.target.value;
                                       setHeroForm({...heroForm, stats: newS});
                                   }}
                               />
                               <input 
                                   className="w-2/3 bg-black border border-white/10 rounded px-3 py-2 text-white text-xs outline-none focus:border-[#FF3B3B]"
                                   value={stat.label}
                                   onChange={e => {
                                       const newS = [...heroForm.stats];
                                       newS[i].label = e.target.value;
                                       setHeroForm({...heroForm, stats: newS});
                                   }}
                               />
                           </div>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF3B3B] font-mono">Hero Banner Display & Copy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Accent Color</label>
                          <input 
                              type="color"
                              className="w-full bg-black border border-white/10 rounded-lg p-1 h-10"
                              value={heroForm.accentColor || '#FF3B3B'}
                              onChange={e => setHeroForm({...heroForm, accentColor: e.target.value})}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Heading Part 1</label>
                          <input 
                              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                              value={heroForm.titlePart1}
                              onChange={e => setHeroForm({...heroForm, titlePart1: e.target.value})}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Heading Part 2</label>
                          <input 
                              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                              value={heroForm.titlePart2}
                              onChange={e => setHeroForm({...heroForm, titlePart2: e.target.value})}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Heading Part 3</label>
                          <input 
                              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                              value={heroForm.titlePart3}
                              onChange={e => setHeroForm({...heroForm, titlePart3: e.target.value})}
                          />
                      </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Hero Sub-description</label>
                      <textarea 
                          className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B] h-24"
                          value={heroForm.description}
                          onChange={e => setHeroForm({...heroForm, description: e.target.value})}
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Primary CTA Button</label>
                          <input 
                              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                              value={heroForm.primaryButtonText}
                              onChange={e => setHeroForm({...heroForm, primaryButtonText: e.target.value})}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Secondary CTA Button</label>
                          <input 
                              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                              value={heroForm.secondaryButtonText}
                              onChange={e => setHeroForm({...heroForm, secondaryButtonText: e.target.value})}
                          />
                      </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono block">Hero Slideshow Assets ({heroForm.heroImages.length}/5)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                          {heroForm.heroImages.map((url: string, i: number) => (
                              <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 group bg-black">
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
                          {heroFiles.map((file, i) => (
                              <div key={`pending-${i}`} className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-dashed border-[#FF3B3B]/50 group bg-black">
                                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-40" alt="" />
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
                                      <div className="text-2xl text-gray-500">+</div>
                                      <div className="text-[8px] uppercase tracking-widest text-gray-600 font-mono">Queue File</div>
                                  </div>
                              </label>
                          )}
                      </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button onClick={handleSaveHeroSettings} disabled={uploading} className="bg-white text-black font-semibold text-xs font-mono uppercase tracking-[0.1em] px-10 py-4 rounded-xl hover:bg-[#FF3B3B] hover:text-white transition-all transform hover:scale-[1.02]">
                    {uploading ? 'Processing Image Uploads...' : 'Synchronize Identity & Images'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="animate-[fadeIn_0.3s_ease-out] space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                      <span className="text-[#FF3B3B]">✦</span> Pricing Tiers & Packages
                  </h2>
                  <button onClick={() => handleSyncSettings()} disabled={uploading} className="bg-[#FF3B3B] text-white px-6 py-2 rounded-lg text-xs font-mono uppercase tracking-widest font-bold disabled:opacity-55 hover:bg-red-600 transition-colors">
                    {uploading ? 'Processing...' : 'Sync Tiers'}
                  </button>
                </div>

                <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF3B3B] font-mono border-b border-white/5 pb-2">Pricing Section Copy</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Section Overline (Floating Tagline)</label>
                      <input 
                        className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                        value={heroForm.pricing?.tagline || ''}
                        onChange={e => setHeroForm({
                          ...heroForm, 
                          pricing: { ...(heroForm.pricing || {}), tagline: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Section Main Title (use \n for linebreak)</label>
                      <input 
                        className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                        value={heroForm.pricing?.title || ''}
                        onChange={e => setHeroForm({
                          ...heroForm, 
                          pricing: { ...(heroForm.pricing || {}), title: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Section Subtitle</label>
                      <textarea 
                        className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B] h-20"
                        value={heroForm.pricing?.subtitle || ''}
                        onChange={e => setHeroForm({
                          ...heroForm, 
                          pricing: { ...(heroForm.pricing || {}), subtitle: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Tier 1 */}
                  <div className="bg-[#111] p-6 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-xs uppercase tracking-[0.1em] font-bold text-[#FF3B3B] font-mono">Tier 1: Artifact Package</h3>
                    <p className="text-[10px] text-gray-500 font-mono leading-relaxed">Unique pricing for local digital artifacts package.</p>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Card Title</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.pricing?.tier1Title || ''}
                          placeholder="Artifact"
                          onChange={e => setHeroForm({
                            ...heroForm,
                            pricing: { ...(heroForm.pricing || {}), tier1Title: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Badge Text</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.pricing?.tier1Badge || ''}
                          placeholder="Public Beta"
                          onChange={e => setHeroForm({
                            ...heroForm,
                            pricing: { ...(heroForm.pricing || {}), tier1Badge: e.target.value }
                          })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Promo Price</label>
                          <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B] font-mono font-bold"
                            value={heroForm.pricing?.tier1Price || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              pricing: { ...(heroForm.pricing || {}), tier1Price: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Strike Price</label>
                          <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B] font-mono"
                            value={heroForm.pricing?.tier1OriginalPrice || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              pricing: { ...(heroForm.pricing || {}), tier1OriginalPrice: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Button Text</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.pricing?.tier1Button || ''}
                          placeholder="Claim PDF"
                          onChange={e => setHeroForm({
                            ...heroForm,
                            pricing: { ...(heroForm.pricing || {}), tier1Button: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Features List (one per line)</label>
                        <textarea 
                          className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-xs outline-none focus:border-[#FF3B3B] h-28 font-mono leading-normal"
                          value={Array.isArray(heroForm.pricing?.tier1Features) ? heroForm.pricing.tier1Features.join('\n') : (heroForm.pricing?.tier1Features || '')}
                          placeholder="Signature PDF Layout&#10;Instant Source Access&#10;Print-ready Assets&#10;Basic Customization"
                          onChange={e => setHeroForm({
                            ...heroForm,
                            pricing: { ...(heroForm.pricing || {}), tier1Features: e.target.value.split('\n') }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tier 2 */}
                  <div className="bg-[#111] p-6 rounded-2xl border border-[#FF3B3B]/20 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#FF3B3B] text-white text-[8px] font-bold px-3 py-1 uppercase tracking-widest font-mono">POPULAR</div>
                    <h3 className="text-xs uppercase tracking-[0.1em] font-bold text-[#FF3B3B] font-mono">Tier 2: Experience Package</h3>
                    <p className="text-[10px] text-gray-500 font-mono leading-relaxed">Unique pricing for immersive showcase apps (Netflix, Paytm).</p>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Card Title</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.pricing?.tier2Title || ''}
                          placeholder="Experience"
                          onChange={e => setHeroForm({
                            ...heroForm,
                            pricing: { ...(heroForm.pricing || {}), tier2Title: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Badge Text</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.pricing?.tier2Badge || ''}
                          placeholder="Premium"
                          onChange={e => setHeroForm({
                            ...heroForm,
                            pricing: { ...(heroForm.pricing || {}), tier2Badge: e.target.value }
                          })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Promo Price</label>
                          <input 
                            className="w-full bg-black border border-[#FF3B3B]/30 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B] font-mono font-bold"
                            value={heroForm.pricing?.tier2Price || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              pricing: { ...(heroForm.pricing || {}), tier2Price: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Strike Price</label>
                          <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B] font-mono"
                            value={heroForm.pricing?.tier2OriginalPrice || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              pricing: { ...(heroForm.pricing || {}), tier2OriginalPrice: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Button Text</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.pricing?.tier2Button || ''}
                          placeholder="Get Netflix Site"
                          onChange={e => setHeroForm({
                            ...heroForm,
                            pricing: { ...(heroForm.pricing || {}), tier2Button: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Features List (one per line)</label>
                        <textarea 
                          className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-xs outline-none focus:border-[#FF3B3B] h-28 font-mono leading-normal"
                          value={Array.isArray(heroForm.pricing?.tier2Features) ? heroForm.pricing.tier2Features.join('\n') : (heroForm.pricing?.tier2Features || '')}
                          placeholder="Netflix Site Bundle&#10;Full JSX Components&#10;Interactive Profiles&#10;Live Preview Hosting&#10;Priority Support"
                          onChange={e => setHeroForm({
                            ...heroForm,
                            pricing: { ...(heroForm.pricing || {}), tier2Features: e.target.value.split('\n') }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tier 3 */}
                  <div className="bg-[#111] p-6 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-xs uppercase tracking-[0.1em] font-bold text-[#FF3B3B] font-mono">Tier 3: The Private Vault</h3>
                    <p className="text-[10px] text-gray-500 font-mono leading-relaxed">Unique pricing for standard ultimate custom requests tier.</p>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Card Title</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.pricing?.tier3Title || ''}
                          placeholder="The Vault"
                          onChange={e => setHeroForm({
                            ...heroForm,
                            pricing: { ...(heroForm.pricing || {}), tier3Title: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Badge Text</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.pricing?.tier3Badge || ''}
                          placeholder="Public Beta"
                          onChange={e => setHeroForm({
                            ...heroForm,
                            pricing: { ...(heroForm.pricing || {}), tier3Badge: e.target.value }
                          })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Promo Price</label>
                          <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B] font-mono font-bold"
                            value={heroForm.pricing?.tier3Price || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              pricing: { ...(heroForm.pricing || {}), tier3Price: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Strike Price</label>
                          <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B] font-mono"
                            value={heroForm.pricing?.tier3OriginalPrice || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              pricing: { ...(heroForm.pricing || {}), tier3OriginalPrice: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Button Text</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.pricing?.tier3Button || ''}
                          placeholder="Enter The Vault"
                          onChange={e => setHeroForm({
                            ...heroForm,
                            pricing: { ...(heroForm.pricing || {}), tier3Button: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Features List (one per line)</label>
                        <textarea 
                          className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-xs outline-none focus:border-[#FF3B3B] h-28 font-mono leading-normal"
                          value={Array.isArray(heroForm.pricing?.tier3Features) ? heroForm.pricing.tier3Features.join('\n') : (heroForm.pricing?.tier3Features || '')}
                          placeholder="Complete Collection Access&#10;Exclusive Beta Templates&#10;Private Community&#10;Early Access to Updates"
                          onChange={e => setHeroForm({
                            ...heroForm,
                            pricing: { ...(heroForm.pricing || {}), tier3Features: e.target.value.split('\n') }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button onClick={() => handleSyncSettings()} disabled={uploading} className="bg-white text-black font-semibold text-xs font-mono uppercase tracking-[0.1em] px-10 py-4 rounded-xl hover:bg-[#FF3B3B] hover:text-white transition-all transform hover:scale-[1.02]">
                    Sync All Prices
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'netflix' && (
              <div className="animate-[fadeIn_0.3s_ease-out] space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                      <span className="text-[#FF3B3B]">✦</span> Netflix Anniversary Showcase Settings
                  </h2>
                  <button onClick={() => handleSyncSettings()} disabled={uploading} className="bg-[#FF3B3B] text-white px-6 py-2 rounded-lg text-xs font-mono uppercase tracking-widest font-bold disabled:opacity-55 hover:bg-red-600 transition-colors">
                    {uploading ? 'Processing...' : 'Sync Netflix Block'}
                  </button>
                </div>

                <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF3B3B] font-mono pb-2 border-b border-white/5">Showcase Heading & Pricing</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Main Section Title</label>
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                            value={heroForm.netflixShowcase?.title || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              netflixShowcase: { ...(heroForm.netflixShowcase || {}), title: e.target.value }
                            })}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Promo Code / Price</label>
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B] font-mono font-bold"
                            value={heroForm.netflixShowcase?.price || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              netflixShowcase: { ...(heroForm.netflixShowcase || {}), price: e.target.value }
                            })}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Sub-description Copy</label>
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                            value={heroForm.netflixShowcase?.subtitle || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              netflixShowcase: { ...(heroForm.netflixShowcase || {}), subtitle: e.target.value }
                            })}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Original (Strike) Price</label>
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B] font-mono"
                            value={heroForm.netflixShowcase?.originalPrice || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              netflixShowcase: { ...(heroForm.netflixShowcase || {}), originalPrice: e.target.value }
                            })}
                        />
                     </div>
                  </div>
                </div>

                <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF3B3B] font-mono">Showcase Slideshow Screenshots</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {heroForm.netflixShowcase?.screenshots && heroForm.netflixShowcase.screenshots.map((ss: any, idx: number) => (
                      <div key={ss.id} className="relative aspect-video rounded-xl bg-black overflow-hidden border border-white/5 group shadow-inner">
                          <img src={ss.url} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" alt="" />
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
                              <label className="text-[10px] uppercase tracking-wider text-white font-mono font-semibold mb-2">{ss.label} ({ss.size})</label>
                              <div className="flex gap-2">
                                <label className="flex-1 bg-white text-black text-center py-2 rounded text-[10px] font-mono uppercase font-bold cursor-pointer hover:bg-red-500 hover:text-white transition-all">
                                  Choose File
                                  <input 
                                     type="file" 
                                     accept="image/*" 
                                     className="hidden"
                                     onChange={e => e.target.files && handleImageUpload(e.target.files[0], idx)} 
                                  />
                                </label>
                              </div>
                          </div>
                          {uploadingIdx === idx && (
                             <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center gap-2">
                                <span className="animate-pulse text-xs tracking-[0.2em] font-mono uppercase text-[#FF3B3B]">Uploading Asset...</span>
                             </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF3B3B] font-mono">Feature Anchors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {heroForm.netflixShowcase?.features && heroForm.netflixShowcase.features.map((feature: any, idx: number) => (
                        <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-xl flex gap-3 items-start">
                           <span className="text-lg bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">{feature.emoji}</span>
                           <div className="flex-1 space-y-1">
                              <input 
                                className="w-full bg-transparent border-b border-transparent hover:border-white/15 focus:border-[#FF3B3B] outline-none text-xs font-bold text-white uppercase tracking-wider pb-1"
                                value={feature.title}
                                onChange={e => {
                                  const newFeatures = [...heroForm.netflixShowcase.features];
                                  newFeatures[idx].title = e.target.value;
                                  setHeroForm({
                                    ...heroForm,
                                    netflixShowcase: { ...heroForm.netflixShowcase, features: newFeatures }
                                  });
                                }}
                              />
                              <textarea 
                                className="w-full bg-transparent border-b border-transparent hover:border-white/10 focus:border-[#FF3B3B] outline-none text-[11px] text-gray-400 leading-normal resize-none h-12"
                                value={feature.desc}
                                onChange={e => {
                                  const newFeatures = [...heroForm.netflixShowcase.features];
                                  newFeatures[idx].desc = e.target.value;
                                  setHeroForm({
                                    ...heroForm,
                                    netflixShowcase: { ...heroForm.netflixShowcase, features: newFeatures }
                                  });
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
              <div className="animate-[fadeIn_0.3s_ease-out] space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                      <span className="text-[#FF3B3B]">✦</span> Paytm Secured Birthday Showcase Settings
                  </h2>
                  <button onClick={() => handleSyncSettings()} disabled={uploading} className="bg-[#FF3B3B] text-white px-6 py-2 rounded-lg text-xs font-mono uppercase tracking-widest font-bold disabled:opacity-55 hover:bg-red-600 transition-colors">
                    {uploading ? 'Processing...' : 'Sync Paytm Block'}
                  </button>
                </div>

                <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF3B3B] font-mono pb-2 border-b border-white/5">Showcase Heading & Pricing</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Main Section Title</label>
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                            value={heroForm.paytmShowcase?.title || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              paytmShowcase: { ...(heroForm.paytmShowcase || {}), title: e.target.value }
                            })}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Promo Code / Price</label>
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B] font-mono font-bold"
                            value={heroForm.paytmShowcase?.price || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              paytmShowcase: { ...(heroForm.paytmShowcase || {}), price: e.target.value }
                            })}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Sub-description Copy</label>
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                            value={heroForm.paytmShowcase?.subtitle || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              paytmShowcase: { ...(heroForm.paytmShowcase || {}), subtitle: e.target.value }
                            })}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Original (Strike) Price</label>
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B] font-mono"
                            value={heroForm.paytmShowcase?.originalPrice || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              paytmShowcase: { ...(heroForm.paytmShowcase || {}), originalPrice: e.target.value }
                            })}
                        />
                     </div>
                  </div>
                </div>

                <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF3B3B] font-mono">Showcase Screenshots</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {heroForm.paytmShowcase?.screenshots && heroForm.paytmShowcase.screenshots.map((ss: any, idx: number) => (
                      <div key={ss.id} className="relative aspect-video rounded-xl bg-black overflow-hidden border border-white/5 group shadow-inner">
                          <img src={ss.url} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" alt="" />
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
                              <label className="text-[10px] uppercase tracking-wider text-white font-mono font-semibold mb-2">{ss.label} ({ss.size})</label>
                              <div className="flex gap-2">
                                <label className="flex-1 bg-white text-black text-center py-2 rounded text-[10px] font-mono uppercase font-bold cursor-pointer hover:bg-red-500 hover:text-white transition-all">
                                  Choose File
                                  <input 
                                     type="file" 
                                     accept="image/*" 
                                     className="hidden"
                                     onChange={e => e.target.files && handlePaytmImageUpload(e.target.files[0], idx)} 
                                  />
                                </label>
                              </div>
                          </div>
                          {uploadingIdx === idx && (
                             <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center gap-2">
                                <span className="animate-pulse text-xs tracking-[0.2em] font-mono uppercase text-[#FF3B3B]">Uploading Asset...</span>
                             </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF3B3B] font-mono">Feature Anchors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {heroForm.paytmShowcase?.features && heroForm.paytmShowcase.features.map((feature: any, idx: number) => (
                        <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-xl flex gap-3 items-start">
                           <span className="text-lg bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">{feature.emoji}</span>
                           <div className="flex-1 space-y-1">
                              <input 
                                className="w-full bg-transparent border-b border-transparent hover:border-white/15 focus:border-[#FF3B3B] outline-none text-xs font-bold text-white uppercase tracking-wider pb-1"
                                value={feature.title}
                                onChange={e => {
                                  const newFeatures = [...heroForm.paytmShowcase.features];
                                  newFeatures[idx].title = e.target.value;
                                  setHeroForm({
                                    ...heroForm,
                                    paytmShowcase: { ...heroForm.paytmShowcase, features: newFeatures }
                                  });
                                }}
                              />
                              <textarea 
                                className="w-full bg-transparent border-b border-transparent hover:border-white/10 focus:border-[#FF3B3B] outline-none text-[11px] text-gray-400 leading-normal resize-none h-12"
                                value={feature.desc}
                                onChange={e => {
                                  const newFeatures = [...heroForm.paytmShowcase.features];
                                  newFeatures[idx].desc = e.target.value;
                                  setHeroForm({
                                    ...heroForm,
                                    paytmShowcase: { ...heroForm.paytmShowcase, features: newFeatures }
                                  });
                                }}
                              />
                           </div>
                        </div>
                     ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'howItWorks' && (
              <div className="animate-[fadeIn_0.3s_ease-out] space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                      <span className="text-[#FF3B3B]">✦</span> How It Works Settings
                  </h2>
                  <button onClick={() => handleSyncSettings()} disabled={uploading} className="bg-[#FF3B3B] text-white px-6 py-2 rounded-lg text-xs font-mono uppercase tracking-widest font-bold disabled:opacity-55 hover:bg-red-600 transition-colors">
                    {uploading ? 'Processing...' : 'Sync Showcase'}
                  </button>
                </div>

                <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF3B3B] font-mono pb-2 border-b border-white/5">General Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Main Heading</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.howItWorks?.title || ''}
                          onChange={e => setHeroForm({
                            ...heroForm,
                            howItWorks: { ...(heroForm.howItWorks || {}), title: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Sub-description</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.howItWorks?.subtitle || ''}
                          onChange={e => setHeroForm({
                            ...heroForm,
                            howItWorks: { ...(heroForm.howItWorks || {}), subtitle: e.target.value }
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono block">Section Showcase Image</label>
                      <div className="flex gap-4 items-center">
                        <div className="w-16 h-20 rounded overflow-hidden bg-black border border-white/10 shrink-0">
                          <img src={heroForm.howItWorks?.imageUrl} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1">
                          <label className="bg-white text-black font-semibold text-xs font-mono uppercase tracking-widest px-4 py-2.5 rounded hover:bg-[#FF3B3B] hover:text-white transition-all cursor-pointer inline-block">
                            {uploadingHowItWorks ? 'Uploading...' : 'Upload Image'}
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={e => e.target.files && uploadHowItWorksImage(e.target.files[0])}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF3B3B] font-mono">Timeline Steps</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {heroForm.howItWorks?.steps && heroForm.howItWorks.steps.map((step: any, idx: number) => (
                      <div key={idx} className="bg-black/50 border border-white/5 p-6 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                           <span className="text-xl font-mono text-[#FF3B3B] font-bold">{step.num}</span>
                           <span className="text-[9px] uppercase tracking-widest text-gray-600 font-mono">Step #{idx+1}</span>
                        </div>
                        <div className="space-y-2">
                          <input 
                            className="w-full bg-transparent border-b border-transparent hover:border-white/10 focus:border-[#FF3B3B] outline-none text-xs font-bold text-white uppercase tracking-wider pb-1"
                            value={step.title}
                            onChange={e => {
                              const newSteps = [...heroForm.howItWorks.steps];
                              newSteps[idx].title = e.target.value;
                              setHeroForm({
                                ...heroForm,
                                howItWorks: { ...heroForm.howItWorks, steps: newSteps }
                              });
                            }}
                          />
                          <textarea 
                            className="w-full bg-transparent border-b border-transparent hover:border-white/5 focus:border-[#FF3B3B] outline-none text-xs text-gray-400 leading-normal resize-none h-16"
                            value={step.desc}
                            onChange={e => {
                              const newSteps = [...heroForm.howItWorks.steps];
                              newSteps[idx].desc = e.target.value;
                              setHeroForm({
                                ...heroForm,
                                howItWorks: { ...heroForm.howItWorks, steps: newSteps }
                              });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'curatedSelection' && (
              <div className="animate-[fadeIn_0.3s_ease-out] space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                      <span className="text-[#FF3B3B]">✦</span> Curated Selection Customizer
                  </h2>
                  <button onClick={() => handleSyncSettings()} disabled={uploading} className="bg-[#FF3B3B] text-white px-6 py-2 rounded-lg text-xs font-mono uppercase tracking-widest font-bold disabled:opacity-55 hover:bg-red-600 transition-colors">
                    {uploading ? 'Processing...' : 'Sync Settings'}
                  </button>
                </div>

                <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF3B3B] font-mono border-b border-white/5 pb-2">Editorial Blocks</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Tagline (Overline)</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.curatedSelection?.subtitle || ''}
                          onChange={e => setHeroForm({
                            ...heroForm,
                            curatedSelection: { ...(heroForm.curatedSelection || {}), subtitle: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Main Title (use \n for linebreaks)</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.curatedSelection?.title || ''}
                          onChange={e => setHeroForm({
                            ...heroForm,
                            curatedSelection: { ...(heroForm.curatedSelection || {}), title: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Description block</label>
                        <textarea 
                          className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B] h-28"
                          value={heroForm.curatedSelection?.description || ''}
                          onChange={e => setHeroForm({
                            ...heroForm,
                            curatedSelection: { ...(heroForm.curatedSelection || {}), description: e.target.value }
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono block">Curated Section Image Cover</label>
                      <div className="aspect-[4/3] rounded-2xl bg-black border border-white/10 overflow-hidden relative group">
                        <img src={heroForm.curatedSelection?.imageUrl} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                           <label className="bg-white text-black font-semibold text-xs font-mono uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-[#FF3B3B] hover:text-white transition-all cursor-pointer inline-block text-center mb-2">
                             {uploadingCurated ? 'Uploading Asset...' : 'Upload Image cover'}
                             <input 
                               type="file" 
                               accept="image/*" 
                               className="hidden" 
                               onChange={e => e.target.files && uploadCuratedImage(e.target.files[0])}
                             />
                           </label>
                           <p className="text-[9px] text-gray-500 font-mono uppercase text-center">Recommended aspect: 4:3, high contrast dark theme style</p>
                        </div>
                        {uploadingCurated && (
                          <div className="absolute inset-0 bg-black/90 flex items-center justify-center font-mono text-xs uppercase tracking-[0.25em] text-[#FF3B3B]">
                             UPLOADING COVER...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'navbar' && (
              <div className="animate-[fadeIn_0.3s_ease-out] space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-[#FF3B3B]">✦</span> Dynamic Header Configuration
                  </h2>
                  <button onClick={() => handleSyncSettings()} disabled={uploading} className="bg-[#FF3B3B] text-white px-6 py-2.5 rounded-xl text-xs font-mono uppercase tracking-widest font-bold disabled:opacity-55 hover:bg-red-600 transition-all shadow-[0_4px_20px_rgba(255,59,59,0.2)]">
                    {uploading ? 'Synchronizing...' : 'Sync Header Terminals'}
                  </button>
                </div>

                {/* Live Preview Display Card */}
                <div className="bg-[#111] p-6 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[9px] font-mono tracking-widest text-[#FF3B3B] uppercase font-bold">Terminal Live Preview</span>
                    <span className="text-[9px] font-mono text-gray-600 uppercase">Synchronized with edit state</span>
                  </div>
                  
                  <div className="border border-white/10 rounded-xl bg-[#030303] p-4 flex items-center justify-between text-white relative min-h-16 overflow-visible">
                    {/* Mock logo */}
                    <div className="flex flex-col">
                      <span className="font-display text-base italic font-black text-white leading-none">
                        {heroForm.navbar?.logoText || heroForm.siteName || 'ARTIFACT'}<span className="text-[var(--accent)]">.</span>
                      </span>
                      {heroForm.navbar?.showLogoTagline !== false && (
                        <span className="text-[6px] font-mono tracking-[0.2em] text-gray-500 mt-1 uppercase">
                          {heroForm.navbar?.logoTagline || 'FOR MOMENTS THAT MATTER'}
                        </span>
                      )}
                    </div>

                    {/* Mock center links */}
                    <div className="hidden md:flex items-center gap-4 text-xs">
                      {(heroForm.navbar?.links || [])
                        .filter((l: any) => l.show !== false && !l.parentId)
                        .map((link: any) => {
                          const subs = (heroForm.navbar?.links || []).filter((item: any) => item.parentId === link.id && item.show !== false);
                          return (
                            <div key={link.id} className="relative group/mock">
                              <span className="text-gray-400 hover:text-white cursor-pointer py-1 font-semibold flex items-center gap-1">
                                {link.name}
                                {subs.length > 0 && <span className="text-[8px] opacity-70">▼</span>}
                              </span>
                              {subs.length > 0 && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 bg-[#0C0C0C]/95 border border-white/10 rounded-lg p-2 min-w-[120px] shadow-2xl space-y-1 blur-none">
                                  {subs.map((s: any) => (
                                    <span key={s.id} className="block text-[10px] text-left px-2 py-1 text-gray-400 font-semibold">{s.name}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    {/* Mock Action CTAs */}
                    <div className="flex items-center gap-3">
                      {heroForm.navbar?.secondaryCtaEnabled !== false && (
                        <span className="hidden md:inline-block text-[10px] px-3 py-1.5 border border-white/10 rounded text-gray-400">{heroForm.navbar?.secondaryCtaText || 'Browse All'}</span>
                      )}
                      {heroForm.navbar?.ctaEnabled !== false && (
                        <span className="text-[10px] px-3 py-1.5 rounded text-white bg-[var(--accent)] font-semibold">{heroForm.navbar?.ctaText || 'Get Started'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Brand and Actions */}
                  <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                    <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-[#FF3B3B] border-b border-white/5 pb-2">Brand Identity & Action Buttons</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Logo Text</label>
                          <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                            value={heroForm.navbar?.logoText || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              navbar: { ...(heroForm.navbar || {}), logoText: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Logo Tagline</label>
                          <input 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                            value={heroForm.navbar?.logoTagline || ''}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              navbar: { ...(heroForm.navbar || {}), logoTagline: e.target.value }
                            })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="showLogoTagline"
                          checked={heroForm.navbar?.showLogoTagline !== false}
                          onChange={e => setHeroForm({
                            ...heroForm,
                            navbar: { ...(heroForm.navbar || {}), showLogoTagline: e.target.checked }
                          })}
                          className="w-4 h-4 accent-[#FF3B3B]"
                        />
                        <label htmlFor="showLogoTagline" className="text-xs text-gray-400 font-mono">Show/Render customizable tagline on Navbar</label>
                      </div>

                      {/* Primary CTA button config */}
                      <div className="border-t border-white/5 pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">Primary Action Button (CTA)</span>
                          <input 
                            type="checkbox"
                            checked={heroForm.navbar?.ctaEnabled !== false}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              navbar: { ...(heroForm.navbar || {}), ctaEnabled: e.target.checked }
                            })}
                            className="accent-[#FF3B3B]"
                          />
                        </div>
                        {heroForm.navbar?.ctaEnabled !== false && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Label Text</label>
                              <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-xs outline-none focus:border-[#FF3B3B]"
                                value={heroForm.navbar?.ctaText || ''}
                                onChange={e => setHeroForm({
                                  ...heroForm,
                                  navbar: { ...(heroForm.navbar || {}), ctaText: e.target.value }
                                })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Redirect URL / Anchor</label>
                              <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-xs outline-none focus:border-[#FF3B3B]"
                                value={heroForm.navbar?.ctaLink || ''}
                                onChange={e => setHeroForm({
                                  ...heroForm,
                                  navbar: { ...(heroForm.navbar || {}), ctaLink: e.target.value }
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Secondary CTA button config */}
                      <div className="border-t border-white/5 pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">Secondary Action Button</span>
                          <input 
                            type="checkbox"
                            checked={heroForm.navbar?.secondaryCtaEnabled !== false}
                            onChange={e => setHeroForm({
                              ...heroForm,
                              navbar: { ...(heroForm.navbar || {}), secondaryCtaEnabled: e.target.checked }
                            })}
                            className="accent-[#FF3B3B]"
                          />
                        </div>
                        {heroForm.navbar?.secondaryCtaEnabled !== false && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Label Text</label>
                              <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-xs outline-none focus:border-[#FF3B3B]"
                                value={heroForm.navbar?.secondaryCtaText || ''}
                                onChange={e => setHeroForm({
                                  ...heroForm,
                                  navbar: { ...(heroForm.navbar || {}), secondaryCtaText: e.target.value }
                                })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Redirect URL</label>
                              <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white text-xs outline-none focus:border-[#FF3B3B]"
                                value={heroForm.navbar?.secondaryCtaLink || ''}
                                onChange={e => setHeroForm({
                                  ...heroForm,
                                  navbar: { ...(heroForm.navbar || {}), secondaryCtaLink: e.target.value }
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic links collection */}
                  <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-[#FF3B3B]">Navigation Directory Links</h3>
                      <button 
                        onClick={addNavbarLink}
                        className="text-[10px] font-mono uppercase font-bold text-[#FF3B3B] border border-[#FF3B3B]/20 bg-[#FF3B3B]/5 px-3 py-1 rounded-lg hover:bg-[#FF3B3B] hover:text-white transition-colors"
                      >
                        + Add link
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                      {(heroForm.navbar?.links || []).map((link: any, idx: number) => {
                        const otherLinks = (heroForm.navbar?.links || []).filter((l: any) => l.id !== link.id && !l.parentId);
                        return (
                          <div key={link.id} className="bg-black/50 border border-white/5 p-4 rounded-xl space-y-3 relative group">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono text-gray-400 font-bold">Menu item #{idx + 1}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => moveNavbarLink(idx, 'up')}
                                  disabled={idx === 0}
                                  className="text-[10px] text-gray-500 hover:text-white disabled:opacity-30"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveNavbarLink(idx, 'down')}
                                  disabled={idx === (heroForm.navbar?.links || []).length - 1}
                                  className="text-[10px] text-gray-500 hover:text-white disabled:opacity-30"
                                >
                                  ▼
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => deleteNavbarLink(link.id)}
                                  className="text-[10px] text-gray-500 hover:text-[#FF3B3B] font-mono shrink-0 ml-1 font-bold"
                                >
                                  ✕ Remove
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-widest text-[#555] font-mono">Display Name</label>
                                <input 
                                  className="w-full bg-black/60 border border-white/5 rounded p-2 text-white text-xs outline-none focus:border-[#FF3B3B]"
                                  value={link.name}
                                  onChange={e => updateNavbarLink(link.id, 'name', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-widest text-[#555] font-mono">Redirect URL</label>
                                <input 
                                  className="w-full bg-black/60 border border-white/5 rounded p-2 text-white text-xs outline-none focus:border-[#FF3B3B]"
                                  value={link.url}
                                  onChange={e => updateNavbarLink(link.id, 'url', e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-[#444] font-mono block mb-1">Visibility</label>
                                <select 
                                  className="w-full bg-black border border-white/10 rounded p-1.5 text-[10px] outline-none"
                                  value={link.show !== false ? 'true' : 'false'}
                                  onChange={e => updateNavbarLink(link.id, 'show', e.target.value === 'true')}
                                >
                                  <option value="true">Show Active</option>
                                  <option value="false">Hidden</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-[#444] font-mono block mb-1">Target Window</label>
                                <select 
                                  className="w-full bg-black border border-white/10 rounded p-1.5 text-[10px] outline-none"
                                  value={link.target || '_self'}
                                  onChange={e => updateNavbarLink(link.id, 'target', e.target.value)}
                                >
                                  <option value="_self">Current Tab</option>
                                  <option value="_blank">New Tab</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-widest text-[#444] font-mono block mb-1">Parent Category Menu</label>
                                <select
                                  className="w-full bg-black border border-white/10 rounded p-1.5 text-[10px] outline-none text-gray-300"
                                  value={link.parentId || ''}
                                  onChange={e => updateNavbarLink(link.id, 'parentId', e.target.value)}
                                >
                                  <option value="">Main (No Parent)</option>
                                  {otherLinks.map((ol: any) => (
                                    <option key={ol.id} value={ol.id}>{ol.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'footer' && (
              <div className="animate-[fadeIn_0.3s_ease-out] space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-[#FF3B3B]">✦</span> Dynamic Footer Configuration
                  </h2>
                  <button onClick={() => handleSyncSettings()} disabled={uploading} className="bg-[#FF3B3B] text-white px-6 py-2.5 rounded-xl text-xs font-mono uppercase tracking-widest font-bold disabled:opacity-55 hover:bg-red-600 transition-all shadow-[0_4px_20px_rgba(255,59,59,0.2)]">
                    {uploading ? 'Synchronizing...' : 'Sync Footer Terminals'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: General Branding & Newsletter */}
                  <div className="space-y-8">
                    {/* Foot Branding panel */}
                    <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-5">
                      <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-[#FF3B3B] border-b border-white/5 pb-1">Footer Branding & Copyright</h3>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Footer Logo Text (Overriding text header)</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.footer?.logoText || ''}
                          placeholder={heroForm.navbar?.logoText || heroForm.siteName}
                          onChange={e => setHeroForm({
                            ...heroForm,
                            footer: { ...(heroForm.footer || {}), logoText: e.target.value }
                          })}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Company tagline (Supports rich texts splitting paragraphs on line break)</label>
                        <textarea 
                          className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B] h-28"
                          value={heroForm.footer?.tagline || ''}
                          onChange={e => setHeroForm({
                            ...heroForm,
                            footer: { ...(heroForm.footer || {}), tagline: e.target.value }
                          })}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Copyright Label Notice</label>
                        <input 
                          className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#FF3B3B]"
                          value={heroForm.footer?.copyright || ''}
                          onChange={e => setHeroForm({
                            ...heroForm,
                            footer: { ...(heroForm.footer || {}), copyright: e.target.value }
                          })}
                        />
                      </div>
                    </div>

                    {/* Newsletter section panel */}
                    <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-[#FF3B3B]">Newsletter Module</h3>
                        <input
                          type="checkbox"
                          checked={heroForm.footer?.newsletterEnabled !== false}
                          onChange={e => setHeroForm({
                            ...heroForm,
                            footer: { ...(heroForm.footer || {}), newsletterEnabled: e.target.checked }
                          })}
                          className="accent-[#FF3B3B] w-4 h-4"
                        />
                      </div>

                      {heroForm.footer?.newsletterEnabled !== false && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Module Heading</label>
                              <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-xs outline-none focus:border-[#FF3B3B]"
                                value={heroForm.footer?.newsletterHeading || ''}
                                onChange={e => setHeroForm({
                                  ...heroForm,
                                  footer: { ...(heroForm.footer || {}), newsletterHeading: e.target.value }
                                })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Placeholder Text</label>
                              <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-xs outline-none focus:border-[#FF3B3B]"
                                value={heroForm.footer?.newsletterPlaceholder || ''}
                                onChange={e => setHeroForm({
                                  ...heroForm,
                                  footer: { ...(heroForm.footer || {}), newsletterPlaceholder: e.target.value }
                                })}
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Description text</label>
                            <input 
                              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-xs outline-none"
                              value={heroForm.footer?.newsletterDescription || ''}
                              onChange={e => setHeroForm({
                                ...heroForm,
                                footer: { ...(heroForm.footer || {}), newsletterDescription: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contact term section */}
                    <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-[#FF3B3B]">Contact Terminal Info</h3>
                        <input
                          type="checkbox"
                          checked={heroForm.footer?.contactDetails?.showContact !== false}
                          onChange={e => setHeroForm({
                            ...heroForm,
                            footer: { 
                              ...(heroForm.footer || {}), 
                              contactDetails: { ...(heroForm.footer?.contactDetails || {}), showContact: e.target.checked }
                            }
                          })}
                          className="accent-[#FF3B3B] w-4 h-4"
                        />
                      </div>

                      {heroForm.footer?.contactDetails?.showContact !== false && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Email terminal address</label>
                              <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-xs outline-none focus:border-[#FF3B3B]"
                                value={heroForm.footer?.contactDetails?.email || ''}
                                onChange={e => setHeroForm({
                                  ...heroForm,
                                  footer: { 
                                    ...(heroForm.footer || {}), 
                                    contactDetails: { ...(heroForm.footer?.contactDetails || {}), email: e.target.value }
                                  }
                                })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Hotline phone</label>
                              <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-xs outline-none focus:border-[#FF3B3B]"
                                value={heroForm.footer?.contactDetails?.phone || ''}
                                onChange={e => setHeroForm({
                                  ...heroForm,
                                  footer: { 
                                    ...(heroForm.footer || {}), 
                                    contactDetails: { ...(heroForm.footer?.contactDetails || {}), phone: e.target.value }
                                  }
                                })}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Office Address description</label>
                            <textarea 
                              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-xs outline-none h-16"
                              value={heroForm.footer?.contactDetails?.address || ''}
                              onChange={e => setHeroForm({
                                ...heroForm,
                                  footer: { 
                                    ...(heroForm.footer || {}), 
                                    contactDetails: { ...(heroForm.footer?.contactDetails || {}), address: e.target.value }
                                  }
                              })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Columns, Social Links & Policies */}
                  <div className="space-y-8">
                    {/* Columns manager */}
                    <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-[#FF3B3B]">Directory Map Columns</h3>
                        <button 
                          onClick={addFooterColumn}
                          className="text-[9px] uppercase tracking-[0.2em] font-mono font-bold text-[#FF3B3B]"
                        >
                          + Add column
                        </button>
                      </div>

                      <div className="space-y-6 max-h-[460px] overflow-y-auto pr-2 no-scrollbar">
                        {(heroForm.footer?.columns || []).map((col: any) => (
                          <div key={col.id} className="bg-black border border-white/5 p-4 rounded-xl space-y-4">
                            <div className="flex justify-between items-center">
                              <input 
                                className="bg-transparent text-xs font-mono font-bold uppercase tracking-wider text-[#FF3B3B] border-b border-transparent focus:border-[#FF3B3B]/40 outline-none pb-0.5"
                                value={col.title}
                                onChange={e => updateFooterColumnTitle(col.id, e.target.value)}
                              />
                              <button 
                                onClick={() => deleteFooterColumn(col.id)}
                                className="text-[10px] text-gray-500 hover:text-red-500 font-mono"
                              >
                                ✕ Delete Column
                              </button>
                            </div>

                            {/* Links checklist inside column */}
                            <div className="space-y-2">
                              {(col.links || []).map((link: any, lIdx: number) => (
                                <div key={lIdx} className="flex gap-2 items-center">
                                  <input 
                                    className="bg-black text-[11px] px-2 py-1 rounded w-1/2 border border-white/5 outline-none "
                                    value={link.label}
                                    onChange={e => updateFooterColumnLink(col.id, lIdx, 'label', e.target.value)}
                                    placeholder="Label"
                                  />
                                  <input 
                                    className="bg-black text-[11px] px-2 py-1 rounded w-1/2 border border-white/5 outline-none"
                                    value={link.url}
                                    onChange={e => updateFooterColumnLink(col.id, lIdx, 'url', e.target.value)}
                                    placeholder="URL"
                                  />
                                  <button 
                                    onClick={() => deleteFooterColumnLink(col.id, lIdx)}
                                    className="text-gray-500 hover:text-red-500 text-xs px-1"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={() => addFooterColumnLink(col.id)}
                                className="text-[9px] font-mono text-[#444] hover:text-white pt-1 block"
                              >
                                + Add child link
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Social networks manager */}
                    <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-[#FF3B3B]">Social Channels</h3>
                        <button 
                          onClick={addSocialLink}
                          className="text-[9px] font-mono text-gray-500 hover:text-[#FF3B3B] uppercase"
                        >
                          + Add connection
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 no-scrollbar">
                        {(heroForm.footer?.socialLinks || []).map((social: any) => (
                          <div key={social.id} className="flex items-center gap-3 bg-black/60 p-2.5 rounded-lg border border-white/5">
                            <select 
                              className="bg-black text-[11px] border border-white/10 rounded p-1 outline-none text-red-500 font-bold"
                              value={social.platform}
                              onChange={e => updateSocialLink(social.id, 'platform', e.target.value)}
                            >
                              <option value="Instagram">Instagram</option>
                              <option value="Twitter">Twitter / X</option>
                              <option value="Pinterest">Pinterest</option>
                              <option value="YouTube">YouTube</option>
                              <option value="Facebook">Facebook</option>
                              <option value="WhatsApp">WhatsApp</option>
                            </select>
                            
                            <input 
                              className="flex-1 bg-black text-[11px] border border-white/10 rounded p-1 outline-none text-xs"
                              value={social.url}
                              onChange={e => updateSocialLink(social.id, 'url', e.target.value)}
                              placeholder="URL Address"
                            />

                            <input 
                              type="checkbox"
                              checked={social.show !== false}
                              title="Show platform"
                              onChange={e => updateSocialLink(social.id, 'show', e.target.checked)}
                              className="accent-[#FF3B3B]"
                            />

                            <button 
                              onClick={() => deleteSocialLink(social.id)}
                              className="text-red-500/60 hover:text-red-500 text-xs px-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Legal Policies links */}
                    <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-[#FF3B3B]">Legal & Privacy policies</h3>
                        <button 
                          onClick={addLegalLink}
                          className="text-[9px] font-mono text-gray-500 hover:text-[#FF3B3B] uppercase"
                        >
                          + Add policy
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(heroForm.footer?.legalLinks || []).map((legal: any, idx: number) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input 
                              className="bg-black text-[11px] px-2 py-1.5 rounded w-1/3 border border-white/5 outline-none font-bold"
                              value={legal.label}
                              onChange={e => updateLegalLink(idx, 'label', e.target.value)}
                            />
                            <input 
                              className="bg-black text-[11px] px-2 py-1.5 rounded w-2/3 border border-white/5 outline-none"
                              value={legal.url}
                              onChange={e => updateLegalLink(idx, 'url', e.target.value)}
                            />
                            <button 
                              onClick={() => deleteLegalLink(idx)}
                              className="text-gray-500 hover:text-red-500 text-xs px-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
