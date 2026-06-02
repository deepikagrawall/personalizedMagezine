import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, onSnapshot, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Calendar, Clock, ArrowRight, Sparkles, SlidersHorizontal, BookOpen, Layers, User, Eye, MessageSquare } from 'lucide-react';
import { BlogNavbar } from './BlogNavbar';
import { BlogFooter } from './BlogFooter';
import { formatCount } from '../../utils';

// Sample Authors
const AUTHORS = [
  { name: 'Kabir Agrawal', role: 'Relationship Architect', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
  { name: 'Mira Sharma', role: 'Chief Curator', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
  { name: 'Rohan Deshmukh', role: 'Editor in Chief', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' }
];

export const BlogList = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    // 1. Sync Site Settings Accent Color
    const unsubSettings = onSnapshot(doc(db, 'settings', 'hero'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(data);
        if (data.accentColor) {
          document.documentElement.style.setProperty('--accent', data.accentColor);
        }
      }
    });

    // 2. Sync Blogs collection in real-time
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsubBlogs = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(docSnapshot => {
        const raw = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...raw,
          views: raw.views || 0,
          likes: raw.likes || 0,
          commentCount: raw.commentCount || 0,
          category: raw.category || 'Uncategorized',
          tags: raw.tags || [],
          author: raw.author || AUTHORS[Math.floor(Math.random() * AUTHORS.length)]
        };
      });
      setBlogs(data);
      setLoading(false);
    }, (err) => {
      console.error('Error listening to blogs: ', err);
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubBlogs();
    };
  }, []);

  // Calculate reading time helper
  const getReadingTime = (content: string) => {
    if (!content) return '2 min read';
    const cleanContent = content.replace(/<\/?[^>]+(>|$)/g, '');
    const words = cleanContent.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 225));
    return `${minutes} min read`;
  };

  // Extract all categories
  const categories = useMemo(() => {
    const cats = blogs.map(b => b.category);
    return ['All', ...Array.from(new Set(cats))];
  }, [blogs]);

  // Extract all tags
  const tags = useMemo(() => {
    const allTags: string[] = [];
    blogs.forEach(b => {
      if (Array.isArray(b.tags)) {
        b.tags.forEach(tag => allTags.push(tag));
      }
    });
    return ['All', ...Array.from(new Set(allTags))];
  }, [blogs]);

  // Filter & Search logic
  const filteredBlogs = useMemo(() => {
    return blogs.filter(b => {
      // Must be published to show publicly
      if (b.published !== true) return false;

      const matchesSearch = 
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.category && b.category.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
      const matchesTag = selectedTag === 'All' || (Array.isArray(b.tags) && b.tags.includes(selectedTag));

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [blogs, searchTerm, selectedCategory, selectedTag]);

  // Featured Blog - Most recent blog inside results
  const featuredBlog = useMemo(() => {
    return filteredBlogs[0] || null;
  }, [filteredBlogs]);

  // Rest of the blogs (excluding featured in grid rendering)
  const gridBlogs = useMemo(() => {
    if (!featuredBlog) return [];
    return filteredBlogs.slice(1);
  }, [filteredBlogs, featuredBlog]);

  // Trending Blogs (Most read: sorted by views descending)
  const trendingBlogs = useMemo(() => {
    return [...blogs]
      .filter(b => b.published)
      .sort((a,b) => (b.views || 0) - (a.views || 0))
      .slice(0, 3);
  }, [blogs]);

  // Side bar Popular Blogs (ordered by likes)
  const popularBlogs = useMemo(() => {
    return [...blogs]
      .filter(b => b.published)
      .sort((a,b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 4);
  }, [blogs]);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden pt-24 pb-20 selection:bg-[var(--accent)] selection:text-white grain grid-pattern">
      <Helmet>
        <title>Moments & Us | Digital Love Story & Gifting Blog</title>
        <meta name="description" content="Explore master guides on designing premium Netflix-anniversary themes, customized gift scanners, beautiful digital scrapbooks, and love story portfolios." />
        <meta name="keywords" content="Netflix birthday, couples templates, customized anniversary scan, husband digital gift" />
        <link rel="canonical" href="https://momentsandus.vercel.app/blog" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Moments & Us | Premium Gifting & Love Story Blog" />
        <meta property="og:description" content="The ultimate space discussing Swiss-designed cards, Netflix anniversary setups, and digital portfolios for relationships." />
        <meta property="og:image" content="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200" />
        <meta property="og:url" content="https://momentsandus.vercel.app/blog" />
        <meta property="og:type" content="website" />
      </Helmet>

      <BlogNavbar />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Blog Hero Section */}
        <div className="text-center md:text-left mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <Sparkles className="w-3 h-3 text-[var(--accent)] animate-pulse" />
            <span className="text-[9px] font-mono font-extrabold tracking-widest text-[#999] uppercase">
              The {settings.navbar?.logoText || settings.siteName || 'Moments & Us'} Editorial Desk
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black italic text-white tracking-tight leading-tight">
            Crafting Journals <span className="text-[var(--accent)]">For Memory Makers.</span>
          </h1>
          <p className="text-gray-400 font-light text-sm md:text-base max-w-2xl leading-relaxed">
            Beautifully designed articles covering technological custom templates, Paytm soundbox birthday hacks, and luxury design parameters reserved for true romantic curators.
          </p>
        </div>

        {/* Filters and Search Panel (Notion style glass box) */}
        <div className="bg-[#0E0E0E] border border-white/5 p-6 rounded-2xl mb-12 flex flex-col xl:flex-row items-center gap-6 shadow-2xl relative z-40 backdrop-blur-md">
          {/* Search box */}
          <div className="relative w-full xl:w-1/3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search guides, templates, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161616] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm font-light text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Categories Horizontal */}
          <div className="flex items-center gap-2.5 overflow-x-auto w-full no-scrollbar select-none py-1 border-t xl:border-t-0 border-white/5 pt-4 xl:pt-0">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-2">
              <Layers className="w-3.5 h-3.5 text-red-500" /> Categories:
            </span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setSelectedTag('All'); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-[var(--accent)] text-white shadow-lg' 
                    : 'bg-[#161616] text-gray-400 border border-white/5 hover:text-white hover:bg-[#202020]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tag selector */}
          <div className="flex items-center gap-2.5 overflow-x-auto w-full no-scrollbar select-none py-1 scroll-smooth">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" /> Tags:
            </span>
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded text-[11px] font-mono tracking-wide whitespace-nowrap transition-all ${
                  selectedTag === tag 
                    ? 'text-white bg-amber-500 font-bold' 
                    : 'bg-white/5 text-gray-400 border border-white/5 hover:text-white hover:bg-white/10'
                }`}
              >
                #{tag.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="space-y-12">
            {/* Featured skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden animate-pulse">
              <div className="lg:col-span-7 bg-[#161616] aspect-[16/10]" />
              <div className="lg:col-span-5 p-8 space-y-4 flex flex-col justify-center">
                <div className="h-6 w-32 bg-[#161616] rounded" />
                <div className="h-10 w-full bg-[#161616] rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-[#161616] rounded" />
                <div className="h-4 w-1/2 bg-[#161616] rounded" />
              </div>
            </div>
            {/* Grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(item => (
                <div key={item} className="bg-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden space-y-4 animate-pulse">
                  <div className="bg-[#161616] aspect-[16/10] w-full" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 w-24 bg-[#161616] rounded" />
                    <div className="h-6 w-full bg-[#161616] rounded" />
                    <div className="h-3 w-3/4 bg-[#161616] rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : blogs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 border border-dashed border-white/10 rounded-3xl text-center flex flex-col items-center justify-center p-8 bg-[#0E0E0E]"
          >
            <BookOpen className="w-12 h-12 text-gray-600 mb-4 animate-pulse" />
            <h3 className="text-lg font-bold text-white mb-1">No articles published yet</h3>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              Our editorial contributors haven't published any masterclasses or insights in this directory yet. Please stay tuned or check back later!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-16">
              
              {/* Featured post (if any results returned) */}
              {featuredBlog && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative bg-[#090909] border border-white/5 rounded-3xl overflow-hidden shadow-2xl hover:border-white/10 transition-all duration-500"
                >
                  <Link to={`/blog/${featuredBlog.slug}`} className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6">
                    <div className="lg:col-span-7 overflow-hidden relative aspect-[16/10]">
                      {/* Interactive overlay icon */}
                      <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full text-[9px] font-mono text-red-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[var(--accent)]" /> FEATURED ARTICLE
                      </div>
                      
                      <img
                        src={featuredBlog.featuredImage || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800'}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 filter grayscale-[0.1] group-hover:grayscale-0"
                        alt={featuredBlog.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                    </div>
                    
                    <div className="lg:col-span-5 p-8 flex flex-col justify-between">
                      <div className="space-y-4">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] font-bold block">
                          {featuredBlog.category}
                        </span>
                        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white group-hover:text-red-400 transition-colors leading-tight">
                          {featuredBlog.title}
                        </h2>
                        <p className="text-gray-400 font-light text-sm line-clamp-3 leading-relaxed">
                          {featuredBlog.shortDescription}
                        </p>
                      </div>

                      {/* Author Card details */}
                      <div className="border-t border-white/5 pt-6 mt-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={featuredBlog.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                            className="w-8 h-8 rounded-full border border-white/10" 
                            alt={featuredBlog.author?.name} 
                          />
                          <div>
                            <span className="text-xs font-semibold text-white block">{featuredBlog.author?.name || 'Moments Creator'}</span>
                            <span className="text-[9px] font-mono text-gray-500 block">{featuredBlog.author?.role || 'Staff writer'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
                          <span className="flex items-center gap-1" title="Precise views count">
                            <Eye className="w-3.5 h-3.5 text-gray-600" /> {featuredBlog.views || 0}
                          </span>
                          <span className="flex items-center gap-1" title="Comment count">
                            <MessageSquare className="w-3.5 h-3.5 text-red-500" /> {featuredBlog.commentCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-600" /> {getReadingTime(featuredBlog.content)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Grid of regular posts */}
              {gridBlogs.length > 0 && (
                <div className="space-y-8">
                  <h3 className="text-xs font-mono tracking-[0.25em] font-extrabold text-gray-500 uppercase border-b border-white/5 pb-4">
                    RECENT DISPATCHES ({gridBlogs.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {gridBlogs.map((blog, idx) => (
                      <motion.article 
                        key={blog.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: (idx % 2) * 0.1 }}
                        className="group bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg hover:border-white/10 transition-all duration-300"
                      >
                        <Link to={`/blog/${blog.slug}`} className="block">
                          <div className="overflow-hidden aspect-[16/10] relative decoration-transparent">
                            <img
                              src={blog.featuredImage || 'https://picsum.photos/800/500?random=' + idx}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale-[0.2]"
                              alt={blog.title}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <span className="absolute bottom-3 left-4 bg-black/80 text-[10px] font-mono px-2.5 py-1 rounded text-white border border-white/5 uppercase">
                              {blog.category}
                            </span>
                          </div>

                          <div className="p-6 space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {blog.createdAt?.seconds ? new Date(blog.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'June 1, 2026'}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1" title="Views">
                                  <Eye className="w-3.5 h-3.5 text-gray-600" /> {formatCount(blog.views)}
                                </span>
                                <span className="flex items-center gap-1" title="Comments">
                                  <MessageSquare className="w-3.5 h-3.5 text-red-500" /> {formatCount(blog.commentCount)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {getReadingTime(blog.content)}
                                </span>
                              </div>
                            </div>
                            
                            <h2 className="font-display text-lg font-bold tracking-tight text-white group-hover:text-red-400 transition-colors leading-snug line-clamp-2">
                              {blog.title}
                            </h2>
                            <p className="text-gray-400 font-light text-xs line-clamp-3 leading-relaxed">
                              {blog.shortDescription}
                            </p>
                          </div>
                        </Link>

                        <div className="p-6 pt-0 border-t border-white/5 mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img 
                              src={blog.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} 
                              className="w-6 h-6 rounded-full" 
                              alt="author" 
                            />
                            <span className="text-[11px] font-medium text-gray-300">{blog.author?.name || 'Creative'}</span>
                          </div>
                          
                          <Link to={`/blog/${blog.slug}`} className="text-xs text-[var(--accent)] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Read Now <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Sidebar Columns (Linear / Medium Style) */}
            <div className="lg:col-span-4 space-y-12">
              
              {/* Trending section */}
              {trendingBlogs.length > 0 && (
                <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-2xl shadow-xl">
                  <h3 className="text-xs font-mono tracking-[0.2em] font-extrabold text-[#999] uppercase mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> TRENDING ARTICLES
                  </h3>
                  
                  <div className="space-y-6">
                    {trendingBlogs.map((post, idx) => (
                      <Link 
                        to={`/blog/${post.slug}`} 
                        key={post.id} 
                        className="group flex gap-4 items-start border-b border-white/5 pb-4 last:border-b-0 last:pb-0"
                      >
                        <span className="font-display text-4xl font-extrabold text-[#222] group-hover:text-[var(--accent)] transition-colors leading-none pr-1">
                          0{idx + 1}
                        </span>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500 block">
                            {post.category}
                          </span>
                          <h4 className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors leading-snug line-clamp-2">
                            {post.title}
                          </h4>
                          <span className="text-[9 px] font-mono text-[#777] block pt-0.5">
                            {formatCount(post.views)} unique readers
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular articles sidebar with small previews */}
              {popularBlogs.length > 0 && (
                <div className="bg-[#090909] border border-white/5 p-6 rounded-2xl shadow-xl">
                  <h3 className="text-xs font-mono tracking-[0.2em] font-extrabold text-[#999] uppercase mb-6">
                    POPULAR STORIES
                  </h3>

                  <div className="space-y-6">
                    {popularBlogs.map(post => (
                      <Link key={post.id} to={`/blog/${post.slug}`} className="group flex items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <h4 className="text-xs font-bold text-gray-300 group-hover:text-white leading-normal line-clamp-2">
                            {post.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                            <span>{getReadingTime(post.content)}</span>
                            <span>•</span>
                            <span className="text-red-400">❤️ {formatCount(post.likes)}</span>
                            <span>•</span>
                            <span className="text-amber-400">💬 {formatCount(post.commentCount)}</span>
                          </div>
                        </div>
                        <div className="w-16 h-12 rounded-lg bg-[#222] overflow-hidden shrink-0">
                          <img 
                            src={post.featuredImage || 'https://picsum.photos/200/150'} 
                            className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" 
                            alt="" 
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Creators Team profile display */}
              <div className="bg-[#0E0E0E] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4">
                <h3 className="text-xs font-mono tracking-[0.2em] font-extrabold text-[#999] uppercase">
                  MEET THE WRITERS
                </h3>
                <p className="text-xs font-light text-gray-500 leading-relaxed">
                  Our professional designers and scriptwriters craft bespoke stories, relationship scrapbooks, and luxury UX layouts.
                </p>
                <div className="space-y-3 pt-2">
                  {AUTHORS.map((author, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <img src={author.avatar} className="w-8 h-8 rounded-full object-cover border border-white/10" alt={author.name} />
                      <div>
                        <h4 className="text-xs font-bold text-white font-sans">{author.name}</h4>
                        <p className="text-[10px] font-mono text-gray-500">{author.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
      <BlogFooter />
    </div>
  );
};
