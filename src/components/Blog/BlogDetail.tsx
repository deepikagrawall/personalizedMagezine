import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, onSnapshot, serverTimestamp, getDoc, limit, orderBy, increment } from 'firebase/firestore';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Clock, Calendar, Share2, Heart, MessageSquare, Send, Check, Copy, Flame, ThumbsUp, AlertCircle, ChevronLeft, ChevronRight, Bookmark, Sparkles, Eye } from 'lucide-react';
import { BlogNavbar } from './BlogNavbar';
import { BlogFooter } from './BlogFooter';

export const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<any>(null);
  const [blogId, setBlogId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Navigation states
  const [prevPost, setPrevPost] = useState<any>(null);
  const [nextPost, setNextPost] = useState<any>(null);

  // Reaction States
  const [likes, setLikes] = useState(0);
  const [fires, setFires] = useState(0);
  const [claps, setClaps] = useState(0);
  const [userReactions, setUserReactions] = useState<{ liked: boolean; fired: boolean; clapped: boolean }>({
    liked: false,
    fired: false,
    clapped: false
  });

  // Scroll Progress
  const [scrollProgress, setScrollProgress] = useState(0);

  // Table of Contents scanning State
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);

  // Comments collection states
  const [comments, setComments] = useState<any[]>([]);
  const [commentForm, setCommentForm] = useState({ name: '', text: '' });
  const [addingComment, setAddingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Scroll tracking to feed reading progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setScrollProgress((window.scrollY / scrollHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync / fetch the blog data
  useEffect(() => {
    if (!slug) return;
    
    let unsubComments: (() => void) | null = null;
    let unsubBlogDoc: (() => void) | null = null;
    let unsubSettings: (() => void) | null = null;
    
    // Sync Settings & Accent variable
    unsubSettings = onSnapshot(doc(db, 'settings', 'hero'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.accentColor) {
          document.documentElement.style.setProperty('--accent', data.accentColor);
        }
      }
    });

    const fetchBlogData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'blogs'), where('slug', '==', slug));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const initialData = docSnap.data();
          const docId = docSnap.id;
          
          setBlogId(docId);

          // Retrieve user reactions state from localStorage
          const localReact = localStorage.getItem(`react_state_${docId}`);
          if (localReact) {
            try {
              setUserReactions(JSON.parse(localReact));
            } catch (e) {
              console.error(e);
            }
          }

          // 1. Trigger dynamic View calculation increments securely in Firebase
          await updateDoc(doc(db, 'blogs', docId), {
            views: increment(1)
          });

          // 2. Set up real-time listener for the blog document to catch live changes
          unsubBlogDoc = onSnapshot(doc(db, 'blogs', docId), (currentDocSnap) => {
            if (currentDocSnap.exists()) {
              const data = currentDocSnap.data();
              setLikes(data.likes || 0);
              setFires(data.fires || 0);
              setClaps(data.claps || 0);

              // Extract Headings dynamically for ToC from HTML copy
              if (data.content) {
                const parser = new DOMParser();
                const docHtml = parser.parseFromString(data.content, 'text/html');
                const hElements = docHtml.querySelectorAll('h2, h3');
                const parsedHeadings: any[] = [];
                
                hElements.forEach((h, index) => {
                  const text = h.textContent || '';
                  const id = `heading-${index}`;
                  h.id = id;
                  parsedHeadings.push({
                    id,
                    text,
                    level: parseInt(h.tagName.substring(1), 10)
                  });
                });
                setHeadings(parsedHeadings);
                
                // Re-apply headings IDs into custom HTML copy string
                let customContent = data.content;
                hElements.forEach((h, idx) => {
                  const regex = new RegExp(`(<h[23][^>]*>)${h.textContent}(<\/h[23]>)`, 'i');
                  customContent = customContent.replace(regex, `$1<span id="heading-${idx}">${h.textContent}</span>$2`);
                });
                setBlog({ ...data, content: customContent });
              } else {
                setBlog(data);
              }
            }
          });

          // 3. Fetch comments list dynamically and in real-time
          const commentQuery = query(collection(db, `blogs/${docId}/comments`), orderBy('createdAt', 'desc'));
          unsubComments = onSnapshot(commentQuery, (cmtSnapshot) => {
            setComments(cmtSnapshot.docs.map(c => ({ id: c.id, ...c.data() })));
          }, (err) => {
            console.error("Firestore Error reading comments: ", err);
          });

          // 4. Fetch adjacent navigation templates
          const allDocsQuery = query(collection(db, 'blogs'), where('published', '==', true), orderBy('createdAt', 'desc'));
          const allSnapshot = await getDocs(allDocsQuery);
          const allBlogs = allSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          const currentIndex = allBlogs.findIndex((b: any) => b.slug === slug);
          
          if (currentIndex !== -1) {
            setPrevPost(currentIndex > 0 ? allBlogs[currentIndex - 1] : null);
            setNextPost(currentIndex < allBlogs.length - 1 ? allBlogs[currentIndex + 1] : null);
          }
        } else {
          setBlog(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogData();

    return () => {
      if (unsubComments) unsubComments();
      if (unsubBlogDoc) unsubBlogDoc();
      if (unsubSettings) unsubSettings();
    };
  }, [slug]);

  // Handle reactions dynamically
  const handleReaction = async (type: 'liked' | 'fired' | 'clapped') => {
    if (!blogId) return;

    const key = `react_state_${blogId}`;
    const newReactions = { ...userReactions, [type]: !userReactions[type] };
    setUserReactions(newReactions);
    localStorage.setItem(key, JSON.stringify(newReactions));

    // Calculate dynamic changes
    const increment = newReactions[type] ? 1 : -1;
    let field = '';
    
    if (type === 'liked') {
      setLikes(prev => prev + increment);
      field = 'likes';
    } else if (type === 'fired') {
      setFires(prev => prev + increment);
      field = 'fires';
    } else if (type === 'clapped') {
      setClaps(prev => prev + increment);
      field = 'claps';
    }

    try {
      const blogRef = doc(db, 'blogs', blogId);
      const blogSnapshot = await getDoc(blogRef);
      if (blogSnapshot.exists()) {
        const currentCount = blogSnapshot.data()[field] || 0;
        await updateDoc(blogRef, {
          [field]: Math.max(0, currentCount + increment)
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Comments
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentForm.name.trim() || !commentForm.text.trim() || !blogId) return;

    try {
      setAddingComment(true);
      await addDoc(collection(db, `blogs/${blogId}/comments`), {
        name: commentForm.name.trim(),
        text: commentForm.text.trim(),
        createdAt: serverTimestamp()
      });

      // Atomically increment parent blog's commentCount in Firestore
      await updateDoc(doc(db, 'blogs', blogId), {
        commentCount: increment(1)
      });

      setCommentForm({ name: '', text: '' });
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingComment(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getReadingTime = (content: string) => {
    if (!content) return '2 min read';
    const cleanContent = content.replace(/<\/?[^>]+(>|$)/g, '');
    const words = cleanContent.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 225));
    return `${minutes} min read`;
  };

  // JSON-LD SEO Generation Schema
  const schemaMarkup = useMemo(() => {
    if (!blog) return null;
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": blog.seoTitle || blog.title,
      "description": blog.shortDescription || blog.seoDescription,
      "image": blog.featuredImage || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800',
      "author": {
        "@type": "Person",
        "name": blog.author?.name || "Moments Expert"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Moments & Us",
        "logo": {
          "@type": "ImageObject",
          "url": "https://momentsandus.vercel.app/logo.png"
        }
      },
      "datePublished": blog.createdAt?.seconds ? new Date(blog.createdAt.seconds * 1000).toISOString() : "2026-06-01T12:00:00Z"
    };
  }, [blog]);

  const breadcrumbSchema = useMemo(() => {
    if (!blog) return null;
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://momentsandus.vercel.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://momentsandus.vercel.app/blog"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": blog.title,
          "item": `https://momentsandus.vercel.app/blog/${blog.slug}`
        }
      ]
    };
  }, [blog]);

  const parsedDate = useMemo(() => {
    if (!blog?.createdAt) return 'June 1, 2026';
    const dateObj = blog.createdAt.seconds ? new Date(blog.createdAt.seconds * 1000) : new Date();
    return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [blog]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-full border-t-2 border-[var(--accent)] animate-spin" />
        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Opening editorial archives...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold font-display">Article Archives Depleted</h2>
        <p className="text-gray-400 mt-2 max-w-sm">This blog post has not been published of contains stale slugs.</p>
        <Link to="/blog" className="mt-8 bg-white text-black py-2.5 px-6 rounded-lg font-bold hover:bg-[var(--accent)] hover:text-white transition-all">
          Back to Blog List
        </Link>
      </div>
    );
  }

  const readingTime = getReadingTime(blog.content);

  return (
    <div className="min-h-screen bg-[#070707] text-white pt-16 pb-20 overflow-x-hidden grain selection:bg-[var(--accent)] selection:text-white">
      {/* Dynamic SEO helmet integration */}
      <Helmet>
        <title>{blog.seoTitle || blog.title} | Moments & Us</title>
        <meta name="description" content={blog.seoDescription || blog.shortDescription} />
        <link rel="canonical" href={`https://momentsandus.vercel.app/blog/${blog.slug}`} />

        {/* JSON-LD Schemas */}
        {schemaMarkup && <script type="application/ld+json">{JSON.stringify(schemaMarkup)}</script>}
        {breadcrumbSchema && <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>}

        {/* Open Graph / FB */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${blog.seoTitle || blog.title} | Moments & Us`} />
        <meta property="og:description" content={blog.seoDescription || blog.shortDescription} />
        <meta property="og:image" content={blog.featuredImage || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200"} />
        <meta property="og:url" content={`https://momentsandus.vercel.app/blog/${blog.slug}`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.seoTitle || blog.title} />
        <meta name="twitter:description" content={blog.seoDescription || blog.shortDescription} />
        <meta name="twitter:image" content={blog.featuredImage} />
      </Helmet>

      {/* Progress Scroll Indicator */}
      <div 
        className="fixed top-16 left-0 h-1 bg-[var(--accent)] z-[101] transition-all" 
        style={{ width: `${scrollProgress}%` }}
      />

      <BlogNavbar />

      {/* Hero Banner Area */}
      <header className="relative w-full aspect-[21/10] max-h-[500px] border-b border-white/5 bg-black overflow-hidden mb-12">
        <img 
          src={blog.featuredImage || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200'} 
          className="w-full h-full object-cover filter grayscale-[0.25] brightness-75 scale-105"
          alt={blog.title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-black/40 to-transparent" />
        <div className="absolute bottom-8 left-0 w-full px-6 md:px-12">
          <div className="max-w-4xl mx-auto space-y-3">
            <span className="inline-block px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-mono rounded border border-[var(--accent)]/25 uppercase">
              {blog.category}
            </span>
            <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
              {blog.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Column Grid */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* LEFT COLUMN: Authors detail & reactions floating */}
        <div className="lg:col-span-3 lg:sticky lg:top-24 h-fit space-y-8 order-2 lg:order-1">
          {/* Author info card */}
          <div className="bg-[#0b0b0b] border border-white/5 p-5 rounded-2xl">
            <div className="flex items-center gap-3.5 mb-4">
              <img 
                src={blog.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} 
                className="w-11 h-11 rounded-full border border-white/10" 
                alt={blog.author?.name} 
              />
              <div>
                <span className="text-xs text-gray-500 block font-mono">WRITTEN BY</span>
                <span className="text-sm font-bold text-white block">{blog.author?.name || 'Staff writer'}</span>
              </div>
            </div>
            <p className="text-xs font-light text-gray-400 leading-relaxed">
              {blog.author?.role || 'Senior relationship designer and custom web portfolio strategist.'}
            </p>
          </div>

          {/* Social and reactions panel */}
          <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-2xl space-y-6">
            <h4 className="text-[10px] font-mono tracking-widest text-[#777] uppercase">ARTICLE ACTIONS</h4>
            
            {/* Real Reacting Nodes */}
            <div className="grid grid-cols-3 gap-2 text-center select-none">
              <button 
                onClick={() => handleReaction('liked')}
                className={`py-2 px-1 hover:bg-white/5 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                  userReactions.liked 
                    ? 'border-red-500/30 bg-red-500/5 text-red-500' 
                    : 'border-white/5 text-gray-400'
                }`}
              >
                <Heart className="w-5 h-5" />
                <span className="text-xs font-mono">{likes}</span>
              </button>

              <button 
                onClick={() => handleReaction('fired')}
                className={`py-2 px-1 hover:bg-white/5 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                  userReactions.fired 
                    ? 'border-amber-500/30 bg-amber-500/5 text-amber-500' 
                    : 'border-white/5 text-gray-400'
                }`}
              >
                <Flame className="w-5 h-5" />
                <span className="text-xs font-mono">{fires}</span>
              </button>

              <button 
                onClick={() => handleReaction('clapped')}
                className={`py-2 px-1 hover:bg-white/5 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                  userReactions.clapped 
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' 
                    : 'border-white/5 text-gray-400'
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
                <span className="text-xs font-mono">{claps}</span>
              </button>
            </div>

            {/* Social Share Trigger */}
            <div className="pt-2">
              <button 
                onClick={copyToClipboard}
                className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-white/5 rounded-xl py-3 text-xs font-semibold text-gray-300 flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> URL Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-500" /> Copy Share Url
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Reading Body / content */}
        <div className="lg:col-span-6 space-y-12 order-1 lg:order-2">
          
          {/* Metadata banner */}
          <div className="flex flex-wrap items-center gap-6 text-[11px] font-mono text-gray-500 border-b border-white/5 pb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4.5 h-4.5" /> Published on {parsedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5" /> {readingTime}
            </span>
            <span className="text-gray-700">|</span>
            <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {blog.views || 0} Reader views
            </span>
            <span className="text-red-400 font-bold uppercase flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> {blog.commentCount || 0} Thoughts
            </span>
          </div>

          {/* Premium Rich Text Display Container */}
          <article className="prose prose-invert max-w-none leading-relaxed text-gray-300 space-y-4">
            {/* This renders Tiptap content cleanly */}
            <div 
              className="blog-body-text text-sm sm:text-base selection:bg-[var(--accent)] selection:text-white"
              dangerouslySetInnerHTML={{ __html: blog.content }} 
            />
          </article>

          {/* Inline Tags display */}
          {Array.isArray(blog.tags) && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-8 border-t border-white/5">
              {blog.tags.map((tag: string) => (
                <span key={tag} className="text-xs font-mono tracking-wider text-gray-500 bg-white/5 border border-white/5 px-2.5 py-1 rounded">
                  #{tag.toUpperCase()}
                </span>
              ))}
            </div>
          )}

          {/* Next/Prev Navigation */}
          <div className="border-t border-b border-white/5 py-8 grid grid-cols-2 gap-4">
            {prevPost ? (
              <Link to={`/blog/${prevPost.slug}`} className="group flex flex-col items-start text-left">
                <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1 uppercase">
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous Post
                </span>
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition-colors leading-tight line-clamp-2 mt-1">
                  {prevPost.title}
                </span>
              </Link>
            ) : (
              <div className="text-gray-700 text-xs font-mono">End of archives</div>
            )}

            {nextPost ? (
              <Link to={`/blog/${nextPost.slug}`} className="group flex flex-col items-end text-right">
                <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1 uppercase">
                  Next Post <ChevronRight className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition-colors leading-tight line-clamp-2 mt-1">
                  {nextPost.title}
                </span>
              </Link>
            ) : (
              <div className="text-gray-700 text-xs font-mono text-right">New dispatches in review</div>
            )}
          </div>

          {/* Real Guestbook / Comments Container */}
          <div className="space-y-8 pt-6">
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-red-500" /> Readers Guestbook ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="bg-[#0b0b0b] border border-white/5 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-mono text-gray-500 uppercase">LEAVE A THOUGHT</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  type="text"
                  placeholder="Your Name (e.g. Priyesh)"
                  value={commentForm.name}
                  onChange={e => setCommentForm({ ...commentForm, name: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-xl py-2.5 px-4 text-xs font-light text-white focus:outline-none focus:border-red-500 transition-all"
                  required
                />
              </div>

              <textarea 
                rows={3}
                placeholder="What did you think of these digital anniversary gift ideas?"
                value={commentForm.text}
                onChange={e => setCommentForm({ ...commentForm, text: e.target.value })}
                className="w-full bg-[#121212] border border-white/5 rounded-xl py-2.5 px-4 text-xs font-light text-white focus:outline-none focus:border-red-500 transition-all resize-none"
                required
              />

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={addingComment}
                  className="bg-white text-black py-2.5 px-5 rounded-lg text-xs font-extrabold uppercase tracking-wider hover:bg-[var(--accent)] hover:text-white flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  Post Thought <Send className="w-3.5 h-3.5" />
                </button>

                <AnimatePresence>
                  {commentSuccess && (
                    <motion.span 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-emerald-400 font-mono flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Posted securely!
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs font-mono text-gray-600 block text-center py-6">Be the first to share your thoughts!</p>
              ) : (
                comments.map((cmt, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={cmt.id} 
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3.5 items-start"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {cmt.name ? cmt.name.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase">{cmt.name}</span>
                        <span className="text-[9px] font-mono text-gray-600">
                          {cmt.createdAt?.seconds ? new Date(cmt.createdAt.seconds * 1000).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : 'Just now'}
                        </span>
                      </div>
                      <p className="text-xs font-light text-gray-300 leading-relaxed">
                        {cmt.text}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sticky Table of Contents & Related articles */}
        <div className="lg:col-span-3 lg:sticky lg:top-24 h-fit space-y-8 order-3">
          
          {/* Table of Contents sidebar */}
          {headings.length > 0 && (
            <div className="bg-[#0b0b0b] border border-white/5 p-6 rounded-2xl">
              <h4 className="text-[10px] font-mono tracking-widest text-[#777] uppercase mb-4">IN THIS MASTERCLASS</h4>
              <nav className="space-y-3">
                {headings.map(h => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`block leading-snug transition-colors text-xs text-gray-400 hover:text-white ${
                      h.level === 3 ? 'pl-3 text-[11px] text-gray-500 border-l border-white/5 hover:border-red-500' : 'font-semibold'
                    }`}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Quick tips card */}
          <div className="bg-gradient-to-br from-[#120808] to-black border border-red-500/10 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display italic">
              <Sparkles className="w-4 h-4 text-amber-400" /> Premium Templates
            </h4>
            <p className="text-xs font-light text-gray-400 leading-relaxed">
              Love these ideas? Grab our signature fully-coded responsive Netflix & Paytm interactive anniversary layouts ready to deliver on standard servers.
            </p>
            <a 
              href="/"
              className="bg-[var(--accent)] hover:bg-[#ff4d4d] text-white my-2 rounded py-2 px-4 justify-center text-center text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              Browse Live Demos <Clock className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>

      <BlogFooter />
    </div>
  );
};
