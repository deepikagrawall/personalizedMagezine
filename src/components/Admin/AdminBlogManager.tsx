import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db, storage, auth, signInWithGoogle } from '../../lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, getDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import slugify from 'slugify';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Plus, Trash2, Edit3, Eye, Calendar, Sparkles, Check, Globe, Layers, AlertTriangle, 
  BarChart4, ArrowUpRight, TrendingUp, Heart, Send, CheckCircle, Search, ToggleLeft, ToggleRight, X, Image as ImageIcon, UploadCloud,
  MessageSquare
} from 'lucide-react';
import { BlogNavbar } from '../Blog/BlogNavbar';
import { BlogFooter } from '../Blog/BlogFooter';

// Pre-defined categories
const CATEGORIES_PRESETS = ['Netflix Experience', 'Gift Guide', 'Personalization', 'Unique Gift Ideas', 'Love Story', 'Aesthetics', 'Anniversary Hacks', 'General'];

// Sample Authors matching BlogList
const AUTHORS = [
  { name: 'Kabir Agrawal', role: 'Relationship Architect', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
  { name: 'Mira Sharma', role: 'Chief Curator', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
  { name: 'Rohan Deshmukh', role: 'Editor in Chief', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' }
];

export const AdminBlogManager = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'edit' | 'preview' | 'seo'>('edit');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection states for bulk actions
  const [selectedBlogIds, setSelectedBlogIds] = useState<string[]>([]);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    category: 'Netflix Experience',
    tags: '',
    featuredImage: '',
    seoTitle: '',
    seoDescription: '',
    published: false,
    scheduledDate: '',
    views: 0,
    likes: 0,
    fires: 0,
    claps: 0,
    commentCount: 0,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize modular Tiptap editor
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: '',
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const isAdmin = user && user.email?.toLowerCase() === 'deeagrawal078@gmail.com';

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed. Please ensure popups are allowed for this site.');
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    setFetchError(null);
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBlogs(data);
      setLoading(false);
      setFetchError(null);
    }, (err) => {
      console.error("Error listening to blogs in admin list:", err);
      setFetchError(err.message || String(err));
      setLoading(false);
    });

    return () => unsub();
  }, [isAdmin]);

  // Sync title with auto-slug trigger (only if user hasn't overridden manually yet)
  useEffect(() => {
    if (form.title && !form.slug && !editingId) {
      setForm(prev => ({
        ...prev,
        slug: slugify(form.title, { lower: true, strict: true })
      }));
    }
  }, [form.title]);

  // Read selected blog into form editor
  const handleEditInit = (blog: any) => {
    setEditingId(blog.id);
    setForm({
      title: blog.title || '',
      slug: blog.slug || '',
      shortDescription: blog.shortDescription || '',
      category: blog.category || 'Netflix Experience',
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
      featuredImage: blog.featuredImage || '',
      seoTitle: blog.seoTitle || '',
      seoDescription: blog.seoDescription || '',
      published: !!blog.published,
      scheduledDate: blog.scheduledDate || '',
      views: blog.views || 0,
      likes: blog.likes || 0,
      fires: blog.fires || 0,
      claps: blog.claps || 0,
      commentCount: blog.commentCount || 0,
    });
    
    if (editor) {
      editor.commands.setContent(blog.content || '');
    }
    
    // Smooth scroll up to form view
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Drag & drop or upload visual action helper
  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const imageRef = ref(storage, `blogs/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setForm(prev => ({ ...prev, featuredImage: downloadURL }));
    } catch (err) {
      console.error(err);
      alert('Could not complete image upload. Using fallback.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: '',
      slug: '',
      shortDescription: '',
      category: 'Netflix Experience',
      tags: '',
      featuredImage: '',
      seoTitle: '',
      seoDescription: '',
      published: false,
      scheduledDate: '',
      views: 0,
      likes: 0,
      fires: 0,
      claps: 0,
      commentCount: 0,
    });
    if (editor) {
      editor.commands.setContent('');
    }
  };

  // Seed default 5 premium samples if collection empty
  const handleSeedDefaultContent = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const blogsToSeed = [
        {
          title: 'Netflix Birthday Gift Ideas: How to Craft the Ultimate TV Experience',
          slug: 'netflix-birthday-template-gift-ideas',
          shortDescription: 'Surprise your partner with a cinematic love story identical to a customized Netflix feed. Explore templates, interactive profiles, and show countdown setups.',
          category: 'Netflix Experience',
          tags: ['Anniversary', 'Netflix', 'Birthdays', 'Love Story'],
          seoTitle: 'Make a Netflix Birthday Surprise Digital Love Story Video',
          seoDescription: 'Transform special moments into high-fidelity digital templates with our signature Netflix anniversary UI dashboard.',
          featuredImage: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=800',
          content: `
            <h2>The Art of Immersive Digital Anniversary Gifts</h2>
            <p>Imagine your partner opening a link on their birthday, only to find themselves on a website that looks exactly like Netflix. On screen, a sleek logo prompts: <strong>"Who is watching your love story today?"</strong>. They click their custom avatar, and a beautiful trailer begins playing in the background with elegant floating text templates.</p>
            <h3>Why Custom Netflix Mockups Make the Perfect Gift</h3>
            <p>Traditional gifts like greeting cards or smart watches are often forgotten within months. A fully interactive Netflix-themed digital love story, however, becomes an online scrapbook that lives forever.</p>
            <ul>
              <li><strong>Avatar selection:</strong> Create custom slots for her, him, family, or even pets.</li>
              <li><strong>Ken Burns banners:</strong> Dynamic background slides with romantic soundtrack layers.</li>
              <li><strong>Scrollable episode collections:</strong> Break your highlights down into distinct seasons (First Year, Adventure Years, Future Dreams).</li>
            </ul>
            <p>Our custom React + Firebase toolkit allows anyone to deploy these pages in less than five minutes. By integrating custom Firestore counters, couples can track how many times they have visited specific profiles.</p>
          `,
          views: 642,
          likes: 124,
          commentCount: 0,
          author: AUTHORS[0]
        },
        {
          title: 'Best Anniversary Gifts for Couples in 2026: The New Aesthetic Trend',
          slug: 'best-anniversary-gifts-for-couples',
          shortDescription: 'Discover why high-contrast digital artifacts and custom countdown pages are taking over traditional paper frames for modern memory keepers.',
          category: 'Gift Guide',
          tags: ['Couples', 'Trends', 'Interactive', 'Art'],
          seoTitle: 'Ultimate Anniversary Guide to Premium Digital Artifacts',
          seoDescription: 'Save your best moments inside our luxury bento grids. Learn about the aesthetic shifts in the digital gifting space.',
          featuredImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800',
          content: `
            <h2>Moving Beyond Frame Glass: The Age of Custom Artifacts</h2>
            <p>Historically, anniversary templates were delivered in physical photo books. While elegant, physical material is vulnerable to heat, decay, and is difficult to pass along in high-definition to global family members.</p>
            <h3>The Transition to Digital Portfolios</h3>
            <p>SaaS aesthetics have finally arrived in personal life-trackers. Using clean typography, Swiss grid layouts, and tiny vector details, creators can compile responsive digital portfolios displaying relationship data, soundbox audio triggers, and countdown structures.</p>
            <blockquote>"Love is best celebrated inside designs tailored with premium craftsmanship. Every margin, weight, and tracking element must feel expensive."</blockquote>
            <p>Explore our beautiful collections of interactive anniversary websites built with Vite, Tailwind CSS, and Firestore persistence, available now in our free open beta.</p>
          `,
          views: 941,
          likes: 231,
          commentCount: 0,
          author: AUTHORS[1]
        },
        {
          title: 'Deep Customization: Personalized Gifts for Husband that Reflect Real Journeys',
          slug: 'personalized-gifts-for-husband',
          shortDescription: 'Stop buying leather wallets. Give him an interactive digital timeline presenting his career highlights, road-trips, and special voice notes.',
          category: 'Personalization',
          tags: ['Husbands', 'Unique', 'Digital Slides', 'Audio Scraps'],
          seoTitle: 'Thoughtful Custom Digital Gifts for Him',
          seoDescription: 'A custom technical guide to building bespoke gift profiles containing childhood memories, voice memos, and secret coupons.',
          featuredImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=800',
          content: `
            <h2>Understanding the Gifting Gap for Men</h2>
            <p>Most gifts marketed toward husbands are highly repetitive—shaving sets, custom tumblers, or basic pocket tools. While highly functional, these products lack a narrative connection to your unique relationship journey.</p>
            <h3>Introducing Classy Retro Portals</h3>
            <p>Bespoke portals use vintage aesthetics combined with high fidelity sound boxes. You can build a customized dashboard featuring:</p>
            <ol>
              <li><strong>An interactive transaction summary:</strong> Similar to payment scans, but detailing hours spent laughing, shared trips, and mock point ratings.</li>
              <li><strong>Interactive sound nodes:</strong> Play voice notes, favorite travel recordings, or private love letters securely saved in cloud storage.</li>
            </ol>
            <p>These minimal, dark-themed retro designs look incredible on mobile devices and desktops alike.</p>
          `,
          views: 412,
          likes: 83,
          commentCount: 0,
          author: AUTHORS[2]
        },
        {
          title: 'Digital Gift Ideas India: The Rise of UPI Secured Experience Cards',
          slug: 'digital-gift-ideas-india',
          shortDescription: 'Transform boring money transfer into a fun scavenger hunt. Introducing customized Paytm and PhonePe templates that play retro sounds.',
          category: 'Unique Gift Ideas',
          tags: ['India', 'Paytm', 'Secured Scan', 'Voucher Reveal'],
          seoTitle: 'Paytm Theme Digital Gifts Secured Scan India',
          seoDescription: 'Bespoke payment-style birthday scans and interactive gift soundboxes that unleash secret vouchers.',
          featuredImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800',
          content: `
            <h2>Ditching the Envelope: The UPI Gifting Culture</h2>
            <p>In modern India, cash transfers have replaced physical envelopes. While highly practical, sending a WhatsApp screenshot of an online transaction lacks suspense and emotion. Enter Custom Secured Scan pages.</p>
            <h3>Secured Gifting Screens</h3>
            <p>By mimicking the iconic Blue & Light Blue Paytm design, these templates create suspense first. When the recipient scans your unique barcode, they hear the nostalgic soundbox alert followed by an engaging transaction log recording relationship metrics before highlighting a secure "Reveal Code" button.</p>
            <p>Underneath, they scratch the golden foil screen on their phone to uncover an active gift card or custom coupons with beautiful animations.</p>
          `,
          views: 1259,
          likes: 411,
          commentCount: 0,
          author: AUTHORS[0]
        },
        {
          title: 'Custom Love Story Websites: Why Every Relationship Deserves a Domain in 2026',
          slug: 'custom-love-story-websites',
          shortDescription: 'From responsive galleries to interactive RSVP boards for family. Review the steps necessary to turn your memories into standalone web portals.',
          category: 'Love Story',
          tags: ['Web Design', 'Domains', 'RSVP', 'Gallery'],
          seoTitle: 'Deploy Your Relationship Portfolio to Cloud Run',
          seoDescription: 'Step-by-step instructions on choosing a customized relationship template, mapping it with custom domain, and linking with Firestore comments.',
          featuredImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
          content: `
            <h2>A Webspace Built Exclusively For Your Memories</h2>
            <p>Your photo gallery is stored inside cloud platforms alongside receipt documents, work screenshots, and utility lists. It feels crowded. A specialized love story domain acts as a serene, isolated space devoted purely to your special bond.</p>
            <h3>What to Include Inside Your Story Site</h3>
            <p>Keep the template minimal. We recommend utilizing light background overlays coupled with high-contrast text. Provide interactive sliders, full-screen image lightboxes, and a direct 'Comment Guestbook' letting family members leave lovely greetings.</p>
            <p>Get started with our premium collection designs, mapping layout structures cleanly so they render seamlessly on every mobile display globally.</p>
          `,
          views: 890,
          likes: 290,
          commentCount: 0,
          author: AUTHORS[1]
        }
      ];

      for (const blog of blogsToSeed) {
        await addDoc(collection(db, 'blogs'), {
          ...blog,
          published: true,
          createdAt: serverTimestamp()
        });
      }
      alert('Seeded 5 signature articles successfully!');
    } catch (err: any) {
      console.error(err);
      setFetchError(err.message || String(err));
      alert('Failed to seed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dynamic average reading time
  const autoCalculateReadingTime = (htmlContent: string) => {
    if (!htmlContent) return '2 min';
    const textOnly = htmlContent.replace(/<\/?[^>]+(>|$)/g, '');
    const words = textOnly.trim().split(/\s+/).length;
    return `${Math.max(1, Math.ceil(words / 225))} min`;
  };

  // Save Blog
  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Title is required for any publication action.');
      return;
    }

    const htmlContent = editor?.getHTML() || '';
    const slugValue = form.slug.trim() || slugify(form.title, { lower: true, strict: true });
    
    // Check for duplicate slugs
    const isDuplicate = blogs.some(b => b.slug === slugValue && b.id !== editingId);
    if (isDuplicate) {
      alert('A blog with this SEO slug already exists! Please adjust SEO slug parameter.');
      return;
    }

    const blogData = {
      title: form.title.trim(),
      slug: slugValue,
      shortDescription: form.shortDescription.trim(),
      content: htmlContent,
      category: form.category,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      featuredImage: form.featuredImage.trim() || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800',
      seoTitle: form.seoTitle.trim() || form.title.trim(),
      seoDescription: form.seoDescription.trim() || form.shortDescription.trim(),
      published: form.published,
      scheduledDate: form.scheduledDate,
      views: Number(form.views) || 0,
      likes: Number(form.likes) || 0,
      fires: Number(form.fires) || 0,
      claps: Number(form.claps) || 0,
      commentCount: Number(form.commentCount) || 0,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        // Edit Blog existing
        await updateDoc(doc(db, 'blogs', editingId), blogData);
        alert('Blog updated successfully!');
      } else {
        // Create new Blog
        await addDoc(collection(db, 'blogs'), {
          ...blogData,
          createdAt: serverTimestamp()
        });
        alert('New blog created!');
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Firebase saved failure. Verify rules update.');
    }
  };

  // Delete Blog Post
  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm('Are you absolutely certain you want to purge this publication permanently?')) return;
    try {
      await deleteDoc(doc(db, 'blogs', id));
      alert('Blog deleted successfully');
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Publish Status
  const togglePublishStatus = async (blog: any) => {
    try {
      await updateDoc(doc(db, 'blogs', blog.id), {
        published: !blog.published
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk publish actions
  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedBlogIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`Bulk delete ${selectedBlogIds.length} articles?`)) return;

    try {
      for (const blogId of selectedBlogIds) {
        if (action === 'publish') {
          await updateDoc(doc(db, 'blogs', blogId), { published: true });
        } else if (action === 'unpublish') {
          await updateDoc(doc(db, 'blogs', blogId), { published: false });
        } else if (action === 'delete') {
          await deleteDoc(doc(db, 'blogs', blogId));
        }
      }
      setSelectedBlogIds([]);
      alert(`Bulk Action [${action}] Completed!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Select / deselect help
  const handleSelectToggle = (id: string) => {
    setSelectedBlogIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Analytics combined counts memoized
  const analytics = useMemo(() => {
    let viewsCount = 0;
    let reactionsCount = 0;
    let commentsCount = 0;
    let draftCount = 0;
    let publishedCount = 0;
    let scheduledCount = 0;

    blogs.forEach(b => {
      viewsCount += (b.views || 0);
      reactionsCount += ((b.likes || 0) + (b.fires || 0) + (b.claps || 0));
      commentsCount += (b.commentCount || 0);
      
      if (b.scheduledDate && new Date(b.scheduledDate) > new Date()) {
        scheduledCount++;
      } else if (b.published) {
        publishedCount++;
      } else {
        draftCount++;
      }
    });

    return {
      totalBlogs: blogs.length,
      viewsCount,
      reactionsCount,
      commentsCount,
      draftCount,
      publishedCount,
      scheduledCount
    };
  }, [blogs]);

  // Filter list with query selector
  const filteredBlogsList = useMemo(() => {
    return blogs.filter(b => 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [blogs, searchQuery]);

  // SEO Quality Score checker (basic index rules matching)
  const getSeoScoreObj = (postForm: typeof form, htmlContent: string) => {
    let score = 20; // base score for starting
    const tips: string[] = [];

    if (postForm.title.length > 25) { score += 15; } else { tips.push('Title is optimal when above 25 chars.'); }
    if (postForm.seoTitle.length > 30 && postForm.seoTitle.length < 65) { score += 15; } else { tips.push('Target SEO Title between 35-60 characters.'); }
    if (postForm.seoDescription.length > 60 && postForm.seoDescription.length < 160) { score += 15; } else { tips.push('SEO metadata description should be 70 to 155 characters.'); }
    if (postForm.featuredImage) { score += 15; } else { tips.push('Add an evocative landscape featured image.'); }
    if (htmlContent.split(/\s+/).length > 300) { score += 20; } else { tips.push('Produce longform text exceeding 300 words to score fully.'); }

    return {
      score,
      tips
    };
  };

  const seoFeedback = useMemo(() => {
    return getSeoScoreObj(form, editor?.getHTML() || '');
  }, [form, editor?.getHTML()]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono uppercase tracking-widest">
        Initialising Publisher Terminal...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-white text-5xl md:text-7xl font-display font-bold mb-4 italic leading-none">
            <span className="block">ACCESS</span>
            <span className="block text-[#FF3B3B]">DENIED</span>
        </h1>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em] mb-12">Protected Publisher Management System</p>
        
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
                        <p className="text-gray-500 text-xs leading-relaxed font-sans">Account <span className="text-white font-mono">{user.email}</span> does not have Administrative clearance for this terminal.</p>
                    </div>
                    <button 
                        onClick={() => signOut(auth)}
                        className="text-xs uppercase tracking-widest text-gray-500 hover:text-white underline underline-offset-8 font-mono"
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
    <div className="min-h-screen bg-black text-white pt-24 pb-20 overflow-x-hidden grain grid-pattern">
      <BlogNavbar />

      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">
        
        {/* Intro */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent)] font-bold uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Moments Editorial Team Panel
            </div>
            <h1 className="font-display text-4xl font-extrabold italic text-white tracking-tight">
              SaaS Blog <span className="text-[var(--accent)]">Publisher Engine.</span>
            </h1>
            <p className="text-gray-400 font-light text-xs sm:text-sm mt-1 max-w-xl">
              Construct high-performance blog posts mapped with SEO keywords, auto reading-time estimators, real comments, and responsive layouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { resetForm(); }}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-xs uppercase tracking-wider py-3 px-5 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Reset / Clear Form
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl font-mono text-xs text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold uppercase mb-1">Database Sync Error</p>
              <p className="opacity-80 font-sans">{fetchError}</p>
            </div>
          </div>
        )}

        {/* Analytics Boxes */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-[#0b0b0b] border border-white/5 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-gray-500 block uppercase">Catalog Count</span>
            <div className="flex items-center justify-between">
              <span className="text-xl md:text-2xl font-black text-white">{analytics.totalBlogs}</span>
              <FileText className="w-4.5 h-4.5 text-blue-500" />
            </div>
          </div>

          <div className="bg-[#0b0b0b] border border-white/5 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-gray-500 block uppercase">Total Page Views</span>
            <div className="flex items-center justify-between">
              <span className="text-xl md:text-2xl font-black text-white">{analytics.viewsCount}</span>
              <TrendingUp className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
            </div>
          </div>

          <div className="bg-[#0b0b0b] border border-white/5 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-gray-500 block uppercase">Hearts & Claps</span>
            <div className="flex items-center justify-between">
              <span className="text-xl md:text-2xl font-black text-white">{analytics.reactionsCount}</span>
              <Heart className="w-4.5 h-4.5 text-red-500" />
            </div>
          </div>

          <div className="bg-[#0b0b0b] border border-white/5 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-gray-500 block uppercase">Total Comments</span>
            <div className="flex items-center justify-between">
              <span className="text-xl md:text-2xl font-black text-white">{analytics.commentsCount}</span>
              <MessageSquare className="w-4.5 h-4.5 text-pink-500" />
            </div>
          </div>

          <div className="bg-[#0b0b0b] border border-white/5 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-gray-500 block uppercase">In Draft State</span>
            <div className="flex items-center justify-between">
              <span className="text-xl md:text-2xl font-black text-white">{analytics.draftCount}</span>
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
            </div>
          </div>

          <div className="bg-[#0b0b0b] border border-white/5 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-gray-500 block uppercase">Live Published</span>
            <div className="flex items-center justify-between">
              <span className="text-xl md:text-2xl font-black text-white">{analytics.publishedCount}</span>
              <CheckCircle className="w-4.5 h-4.5 text-teal-400" />
            </div>
          </div>
        </div>

        {/* Form area: side-by-side edit and live previews */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sticky-container">
          
          {/* Create & Edit Blog Box */}
          <div className="lg:col-span-8 bg-[#090909] border border-white/5 p-6 md:p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[var(--accent)]" /> 
                {editingId ? 'Edit Article Archive' : 'Draft New Masterclass'}
              </h3>

              {/* Form Navigation Headers Tabs */}
              <div className="flex bg-[#121212] rounded-lg p-0.5 text-xs font-mono">
                <button
                  onClick={() => setActiveFormTab('edit')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${activeFormTab === 'edit' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  Write Content
                </button>
                <button
                  onClick={() => setActiveFormTab('preview')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${activeFormTab === 'preview' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  Post Preview
                </button>
                <button
                  onClick={() => setActiveFormTab('seo')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${activeFormTab === 'seo' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  SEO & Google
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveBlog} className="space-y-6">
              
              <AnimatePresence mode="wait">
                {activeFormTab === 'edit' && (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-widest text-[#777] uppercase">ARTICLE TITLE</label>
                      <input 
                        type="text"
                        placeholder="e.g. Netflix Anniversary Experience Tutorial"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        className="w-full bg-[#121212] border border-white/5 rounded-xl py-3 px-4 font-sans text-sm focus:outline-none focus:border-red-500 transition-all text-white font-bold"
                        required
                      />
                    </div>

                    {/* Slug & Cover Image URL Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Slug */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono tracking-widest text-[#777] uppercase flex items-center justify-between">
                          <span>SEO URL SLUG</span>
                          <span className="text-[9px] text-[#444] lowercase">automatic mapping</span>
                        </label>
                        <input 
                          type="text"
                          placeholder="netflix-anniversary-experience-tutorial"
                          value={form.slug}
                          onChange={e => setForm({ ...form, slug: e.target.value })}
                          className="w-full bg-[#121212] border border-white/5 rounded-xl py-3 px-4 font-mono text-xs focus:outline-none focus:border-red-500 transition-all text-gray-400"
                        />
                      </div>

                      {/* Cover Image Raw Link */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono tracking-widest text-[#777] uppercase">COVER IMAGE URL / SOURCE</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="https://images.unsplash.com/..."
                            value={form.featuredImage}
                            onChange={e => setForm({ ...form, featuredImage: e.target.value })}
                            className="w-full bg-[#121212] border border-white/5 rounded-xl py-3 px-4 font-mono text-xs focus:outline-none focus:border-red-500 transition-all text-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="bg-[#1a1a1a] border border-white/5 hover:bg-white/5 text-gray-400 p-3 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50"
                            title="Upload local file"
                          >
                            {uploadingImage ? <BarChart4 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                          </button>
                          <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            onChange={handleFeaturedImageUpload} 
                            className="hidden" 
                          />
                        </div>
                      </div>

                    </div>

                    {/* Metadata Categorization Column */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Category */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono tracking-widest text-[#777] uppercase">CATEGORY</label>
                        <select
                          value={form.category}
                          onChange={e => setForm({ ...form, category: e.target.value })}
                          className="w-full bg-[#121212] border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-red-500 transition-all text-gray-400 text-xs font-bold uppercase tracking-wider"
                        >
                          {CATEGORIES_PRESETS.map(preset => (
                            <option key={preset} value={preset} className="bg-black text-white">{preset.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      {/* Tags */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono tracking-widest text-[#777] uppercase flex items-center justify-between">
                          <span>TAGS</span>
                          <span className="text-[9px] text-[#444]">comma separated</span>
                        </label>
                        <input 
                          type="text"
                          placeholder="Netflix, Anniversary, Birthdays, Gift Hacks"
                          value={form.tags}
                          onChange={e => setForm({ ...form, tags: e.target.value })}
                          className="w-full bg-[#121212] border border-white/5 rounded-xl py-3 px-4 font-mono text-xs focus:outline-none focus:border-red-500 transition-all text-gray-400"
                        />
                      </div>

                    </div>

                    {/* Short Description */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-widest text-[#777] uppercase">CARD DESCRIPTION</label>
                      <textarea 
                        rows={2}
                        placeholder="A concise description displayed inside the home listing boxes."
                        value={form.shortDescription}
                        onChange={e => setForm({ ...form, shortDescription: e.target.value })}
                        className="w-full bg-[#121212] border border-white/5 rounded-xl py-3 px-4 text-xs font-light tracking-wide focus:outline-none focus:border-red-500 transition-all text-white resize-none"
                      />
                    </div>

                    {/* Tiptap Editor Toolbars */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono tracking-widest text-[#777] uppercase block border-b border-white/5 pb-2">ARTICLE BODY (TIPTAP EXCLUSIVE EDITOR)</label>
                      <div className="flex flex-wrap items-center gap-1.5 bg-[#121212] border border-white/5 p-2 rounded-xl text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => editor?.chain().focus().toggleBold().run()}
                          className={`p-1.5 px-3 rounded ${editor?.isActive('bold') ? 'bg-red-500 text-white font-black' : 'text-gray-400 hover:text-white'}`}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => editor?.chain().focus().toggleItalic().run()}
                          className={`p-1.5 px-3 rounded ${editor?.isActive('italic') ? 'bg-red-500 text-white font-black italic' : 'text-gray-400 hover:text-white'}`}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                          className={`p-1.5 px-2.5 rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-red-500 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                          className={`p-1.5 px-2.5 rounded ${editor?.isActive('heading', { level: 3 }) ? 'bg-red-500 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
                        >
                          H3
                        </button>
                        <button
                          type="button"
                          onClick={() => editor?.chain().focus().toggleBulletList().run()}
                          className={`p-1.5 px-2 rounded ${editor?.isActive('bulletList') ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                          • List
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const url = window.prompt('Provide direct image hotlink URL:');
                            if (url && editor) {
                              editor.chain().focus().setImage({ src: url }).run();
                            }
                          }}
                          className="p-1 px-2 text-gray-400 hover:text-white bg-white/5 rounded flex items-center gap-1"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> Insert Image
                        </button>
                        <button
                          type="button"
                          onClick={() => editor?.commands.undo()}
                          className="p-1.5 rounded text-gray-500 hover:text-white ml-auto"
                        >
                          Undo
                        </button>
                        <button
                          type="button"
                          onClick={() => editor?.commands.redo()}
                          className="p-1.5 rounded text-gray-500 hover:text-white"
                        >
                          Redo
                        </button>
                      </div>

                      {/* Editor Box */}
                      <div className="border border-white/5 p-4 rounded-2xl bg-black min-h-[250px] text-white">
                        <EditorContent editor={editor} className="outline-none" />
                      </div>
                    </div>

                    {/* Publish/Draft Toggles and Date Scheduling box */}
                    <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      
                      {/* Active Toggle published draft field */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, published: !form.published })}
                          className="text-gray-400 focus:outline-none"
                        >
                          {form.published ? (
                            <ToggleRight className="w-12 h-8 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-12 h-8 text-gray-600" />
                          )}
                        </button>
                        <div>
                          <span className="text-xs font-bold text-white block">Published State</span>
                          <span className="text-[10px] font-mono text-gray-500">Draft blocks remain invisible publicly.</span>
                        </div>
                      </div>

                      {/* Future Publication Scheduling */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Scheduled Date (Optional)</span>
                          <input 
                            type="datetime-local"
                            value={form.scheduledDate}
                            onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                            className="bg-black/40 text-xs font-semibold px-2 py-1 rounded border border-white/10 mt-1 text-gray-400 outline-none" 
                          />
                        </div>
                      </div>

                    </div>

                    {/* Dynamic Interaction Override Counters */}
                    <div className="bg-[#121212]/50 p-6 rounded-2xl border border-white/5 space-y-4">
                      <div>
                        <span className="text-xs font-bold text-white block">Dynamic Metric Controllers</span>
                        <span className="text-[10px] font-mono text-gray-500">Override live readership views, heart likes, claps (clips), fires, or comments.</span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {/* Views */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono tracking-widest text-[#777] uppercase block">Views</label>
                          <input 
                            type="number"
                            min="0"
                            value={form.views}
                            onChange={e => setForm({ ...form, views: parseInt(e.target.value) || 0 })}
                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-[var(--accent)] outline-none"
                          />
                        </div>

                        {/* Likes / Hearts */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono tracking-widest text-[#777] uppercase block">Hearts ❤️</label>
                          <input 
                            type="number"
                            min="0"
                            value={form.likes}
                            onChange={e => setForm({ ...form, likes: parseInt(e.target.value) || 0 })}
                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-[var(--accent)] outline-none"
                          />
                        </div>

                        {/* Claps */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono tracking-widest text-[#777] uppercase block">Claps 👏</label>
                          <input 
                            type="number"
                            min="0"
                            value={form.claps}
                            onChange={e => setForm({ ...form, claps: parseInt(e.target.value) || 0 })}
                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-[var(--accent)] outline-none"
                          />
                        </div>

                        {/* Fires */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono tracking-widest text-[#777] uppercase block">Fires 🔥</label>
                          <input 
                            type="number"
                            min="0"
                            value={form.fires}
                            onChange={e => setForm({ ...form, fires: parseInt(e.target.value) || 0 })}
                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-[var(--accent)] outline-none"
                          />
                        </div>

                        {/* Comments Count */}
                        <div className="space-y-1.5 col-span-2 sm:col-span-1">
                          <label className="text-[9px] font-mono tracking-widest text-[#777] uppercase block">Comments 💬</label>
                          <input 
                            type="number"
                            min="0"
                            value={form.commentCount}
                            onChange={e => setForm({ ...form, commentCount: parseInt(e.target.value) || 0 })}
                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-[var(--accent)] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* Preview tab layout visualizer */}
                {activeFormTab === 'preview' && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="p-4 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs rounded-xl flex items-center gap-2">
                      <Globe className="w-4 h-4" /> 
                      Showing live render mockup mimicking moments listing card.
                    </div>

                    <div className="max-w-sm mx-auto bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                      <div className="aspect-[16/10] bg-black/40 overflow-hidden relative">
                        {form.featuredImage ? (
                          <img src={form.featuredImage} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700 bg-black/30"><ImageIcon className="w-10 h-10" /></div>
                        )}
                        <span className="absolute bottom-3 left-4 bg-black text-[9px] font-mono tracking-widest px-2.5 py-1 rounded text-white font-bold uppercase">
                          {form.category}
                        </span>
                      </div>
                      
                      <div className="p-6 space-y-3">
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                          <span>0 min read</span>
                          <span>❤️ 0 likes</span>
                        </div>
                        <h3 className="font-display text-base font-bold text-white line-clamp-2 leading-tight">
                          {form.title || 'Untitled Article Title Dummy'}
                        </h3>
                        <p className="text-gray-500 text-xs font-light line-clamp-3">
                          {form.shortDescription || 'Your short excerpt summary will populate here instantly as you fill the editor cards.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Advanced Search Engine Optimization Tab */}
                {activeFormTab === 'seo' && (
                  <motion.div
                    key="seo"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    
                    {/* Diagnostic Score Card */}
                    <div className="bg-[#121212] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-gray-500 block">SEO PERFORMANCE SCORE</span>
                        <span className="text-2xl font-black text-rose-500 italic mt-1">{seoFeedback.score}%</span>
                      </div>
                      <div className="w-1/2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${seoFeedback.score}%` }} />
                      </div>
                    </div>

                    {/* SEO Parameters Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">DOGMATIC Meta Title</label>
                        <input 
                          type="text"
                          placeholder="Moments & Us | Title of the Article"
                          value={form.seoTitle}
                          onChange={e => setForm({ ...form, seoTitle: e.target.value })}
                          className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 font-mono text-xs focus:outline-none focus:border-red-500 text-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">Canonical URL Slug Path</label>
                        <input 
                          type="text"
                          value={`https://momentsandus.vercel.app/blog/${form.slug}`}
                          disabled
                          className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 font-mono text-xs text-gray-600 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">SEO Meta Description Excerpt</label>
                      <textarea 
                        rows={2}
                        placeholder="A custom meta-tag description optimized for google rankings indexes search."
                        value={form.seoDescription}
                        onChange={e => setForm({ ...form, seoDescription: e.target.value })}
                        className="w-full bg-black border border-white/5 rounded-xl py-2.5 px-4 text-xs font-mono text-gray-400"
                      />
                    </div>

                    {/* Google SERP Simulator Mock Box */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono tracking-[0.2em] font-bold text-gray-500 uppercase block">Serp Results Mockup (Google index)</span>
                      <div className="bg-[#18181b] border border-white/5 p-4 rounded-xl space-y-1">
                        <div className="text-[10.5px] font-mono text-gray-500 truncate">https://momentsandus.vercel.app &gt; blog &gt; {form.slug || 'slug'}</div>
                        <h4 className="text-sm font-semibold text-blue-400 hover:underline leading-tight font-sans cursor-pointer">{form.seoTitle || form.title || 'Dummy SEO Meta Title Heading'}</h4>
                        <p className="text-xs text-gray-400 font-light leading-relaxed line-clamp-2">{form.seoDescription || form.shortDescription || 'Google auto generated snippet summary displaying from metadata parameter configurations.'}</p>
                      </div>
                    </div>

                    {/* Diagnostic suggestions pills */}
                    {seoFeedback.tips.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-mono text-[#777] uppercase block">RECOMMENDED FIXES</span>
                        <ul className="text-[11px] font-mono text-gray-500 space-y-1.5 list-disc pl-4">
                          {seoFeedback.tips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                        </ul>
                      </div>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form trigger submission */}
              <div className="border-t border-white/5 pt-6 flex items-center justify-between gap-4">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs font-mono font-bold text-gray-500 hover:text-white uppercase transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
                
                <button
                  type="submit"
                  className="bg-[var(--accent)] hover:bg-[#ff4d4d] text-white py-3 px-8 rounded-lg text-xs font-extrabold uppercase tracking-wide ml-auto flex items-center gap-2 shadow-[0_4px_20px_rgba(255,59,59,0.35)] cursor-pointer"
                >
                  {editingId ? 'Apply Update' : 'Publish Dispatches'} <Send className="w-3.5 h-3.5" />
                </button>
              </div>

            </form>
          </div>

          {/* Quick instructions and Category Manager sidebar */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Publisher instructions guideline */}
            <div className="bg-gradient-to-br from-[#120808] to-[#0A0A0A] p-6 rounded-3xl border border-red-500/10 space-y-4">
              <h4 className="text-xs font-bold text-white font-display italic flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Creator Guidelines 2026
              </h4>
              <p className="text-xs font-light text-gray-400 leading-relaxed">
                Aim for visual rhythm. Include clean bullet features when writing. Align post content tags carefully with template targets. Keep the tone warm, luxury-focused, and detailed.
              </p>
              <div className="text-[10px] font-mono text-gray-500 pt-2 border-t border-white/5 space-y-1.5">
                <div className="flex justify-between"><span>Max Cover Ratio</span> <span>16:9 Landscape</span></div>
                <div className="flex justify-between"><span>Slug Standard</span> <span>Strict lowercase text</span></div>
                <div className="flex justify-between"><span>Auto Calc Speed</span> <span>225 words / minute</span></div>
              </div>
            </div>

            {/* Category summary list widget */}
            <div className="bg-[#0b0b0b] border border-white/5 p-6 rounded-3xl space-y-4">
              <h4 className="text-[10px] font-mono tracking-widest text-[#777] uppercase flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" /> CATEGORIES PRESET INDEX
              </h4>
              <p className="text-xs font-light text-gray-500">
                To streamline navigation parameters for visitors, keep tags restricted to standard sets.
              </p>
              
              <div className="flex flex-wrap gap-1.5 pt-2">
                {CATEGORIES_PRESETS.map(preset => (
                  <span key={preset} className="bg-white/[0.03] border border-white/5 rounded text-[10px] font-mono text-gray-400 px-2 py-0.5">
                    {preset.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Blog Post Tables list */}
        <div className="bg-[#090909] border border-white/5 p-6 md:p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <h3 className="font-display text-lg font-bold">Archives Directory</h3>
              <p className="text-gray-500 text-xs">Manage updates, adjust states, or purge stale copy drafts.</p>
            </div>

            {/* Quick search filter table */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-3.5 h-3.5" />
              <input 
                type="text"
                placeholder="Filter table..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-white/5 rounded-xl py-2 px-9 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-red-500 text-gray-300" 
              />
            </div>
          </div>

          {/* Bulk Action Header bar under tables (revealed if select exists) */}
          {selectedBlogIds.length > 0 && (
            <div className="bg-[#111] p-3 rounded-xl flex items-center justify-between text-xs font-mono border-l-4 border-[var(--accent)]">
              <span>{selectedBlogIds.length} Article nodes selected for bulk operations</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkAction('publish')}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded text-[11px] font-bold"
                >
                  Bulk Publish
                </button>
                <button 
                  onClick={() => handleBulkAction('unpublish')}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-3 py-1.5 rounded text-[11px] font-bold"
                >
                  Bulk Unpublish
                </button>
                <button 
                  onClick={() => handleBulkAction('delete')}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
                </button>
              </div>
            </div>
          )}

          {/* Standard Responsive Tables */}
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 font-mono">
                  <th className="p-4 w-10">
                    <input 
                      type="checkbox" 
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedBlogIds(filteredBlogsList.map(b => b.id));
                        } else {
                          setSelectedBlogIds([]);
                        }
                      }}
                      checked={selectedBlogIds.length === filteredBlogsList.length && filteredBlogsList.length > 0}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="p-4">PUBLISHED TITLE</th>
                  <th className="p-4">CATEGORY</th>
                  <th className="p-4">DIAGNOSTIC STATUS</th>
                  <th className="p-4 text-center">VIEWS</th>
                  <th className="p-4 text-center">COMMENTS</th>
                  <th className="p-4 text-center">L/F/C</th>
                  <th className="p-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBlogsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-500 font-mono">
                      <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto py-4">
                        <BarChart4 className="w-8 h-8 text-gray-700 animate-pulse" />
                        <div>
                          <p className="text-white font-bold text-sm mb-1 font-sans">No blog posts found</p>
                          <p className="text-[11px] leading-relaxed font-sans text-gray-400">
                            The publisher engine has no publications listed. Write your first post using the editor form above, or restore the 5 premium sample templates instantly.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleSeedDefaultContent}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider py-2.5 px-5 rounded-lg active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                          Seed 5 Signature Articles
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBlogsList.map(blog => {
                    const isSelected = selectedBlogIds.includes(blog.id);
                    const isFutureScheduled = blog.scheduledDate && new Date(blog.scheduledDate) > new Date();

                    return (
                      <tr 
                        key={blog.id} 
                        className={`hover:bg-white/[0.01] transition-colors ${isSelected ? 'bg-white/[0.01]' : ''}`}
                      >
                        <td className="p-4">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectToggle(blog.id)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="p-4 max-w-xs md:max-w-md">
                          <div className="flex gap-3 items-center">
                            <div className="w-12 h-9 rounded bg-[#222] overflow-hidden shrink-0 border border-white/5">
                              <img src={blog.featuredImage} className="w-full h-full object-cover grayscale" alt="" />
                            </div>
                            <div className="truncate">
                              <span className="font-bold text-white block hover:text-[var(--accent)] transition-colors cursor-pointer truncate" onClick={() => handleEditInit(blog)}>
                                {blog.title}
                              </span>
                              <span className="text-[10px] font-mono text-gray-600 block pt-0.5 truncate">/blog/{blog.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded uppercase">
                            {blog.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex">
                            {isFutureScheduled ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase font-bold">
                                Scheduled
                              </span>
                            ) : blog.published ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase font-bold">
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded uppercase">
                                Draft
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-white">
                          {blog.views || 0}
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-white">
                          {blog.commentCount || 0}
                        </td>
                        <td className="p-4 text-center text-gray-400 font-mono">
                          {blog.likes || 0} / {blog.fires || 0} / {blog.claps || 0}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => togglePublishStatus(blog)}
                              className="text-gray-500 hover:text-white transition-colors"
                              title={blog.published ? "Toggle to Draft State" : "Toggle to Live State"}
                            >
                              {blog.published ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <Layers className="w-4 h-4 text-gray-600" />}
                            </button>
                            <button
                              onClick={() => handleEditInit(blog)}
                              className="text-gray-500 hover:text-white transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <Link
                              to={`/blog/${blog.slug}`}
                              className="text-gray-500 hover:text-white transition-colors"
                              title="View Live Link"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteBlog(blog.id)}
                              className="text-gray-500 hover:text-red-400 transition-colors"
                              title="Purge permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <BlogFooter />
    </div>
  );
};
