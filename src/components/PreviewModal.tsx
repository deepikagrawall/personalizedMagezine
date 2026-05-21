import React, { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';

interface PreviewModalProps {
  product: {
    id: string;
    title: string;
    desc: string;
    price: string;
    original?: string;
    type: string;
    category: string;
    pdfUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
    whatsInside?: string[];
  };
  onClose: () => void;
  onSave: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ product, onClose, onSave }) => {
  const isNetflix = product.type === 'site' && product.title.toLowerCase().includes('netflix');
  const [activeMediaTab, setActiveMediaTab] = useState<'preview' | 'video'>(
    product.type === 'pdf' && product.pdfUrl ? 'preview' : 'video'
  );

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

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#111] border border-[#2A2A2A] rounded-2xl w-full max-w-6xl h-auto max-h-[92vh] md:h-[90vh] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row animate-[modalEnter_0.4s_ease-out]"
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
        <div className="w-full md:flex-1 min-h-[300px] md:min-h-0 overflow-y-visible md:overflow-y-auto no-scrollbar bg-[#0A0A0A] p-4 md:p-12 order-1 md:order-1">
          <div className="max-w-3xl mx-auto space-y-8 md:space-y-12">
            {product.type === 'pdf' ? (
              <div className="space-y-6">
                {product.pdfUrl && product.videoUrl && (
                  <div className="flex justify-center border-b border-white/5 pb-4 gap-2">
                    <button 
                      onClick={() => setActiveMediaTab('preview')}
                      className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        activeMediaTab === 'preview' 
                          ? 'bg-white text-black font-black' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      📄 Interactive Document
                    </button>
                    <button 
                      onClick={() => setActiveMediaTab('video')}
                      className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        activeMediaTab === 'video' 
                          ? 'bg-white text-black font-black' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      🎥 Video Walkthrough Tour
                    </button>
                  </div>
                )}

                {activeMediaTab === 'preview' && product.pdfUrl ? (
                  <div className="flex flex-col gap-4">
                    <div 
                        className="w-full h-[500px] md:h-[800px] bg-white rounded-lg overflow-hidden shadow-2xl relative select-none"
                        onContextMenu={(e) => e.preventDefault()}
                    >
                      <iframe 
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(product.pdfUrl)}&embedded=true`}
                        className="w-full h-full border-0"
                        title="PDF Preview"
                      />
                      <div className="absolute bottom-2 left-2 text-[8px] text-gray-500 opacity-50 z-20 pointer-events-none">
                        Preview only. Unauthorized reproduction prohibited.
                      </div>
                    </div>
                  </div>
                ) : product.videoUrl ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                       <span className="text-[10px] font-mono text-[var(--accent)] uppercase tracking-widest font-black flex items-center gap-2">
                         🎥 Walkthrough Video Playback
                       </span>
                    </div>
                    <VideoPlayer url={product.videoUrl} />
                  </div>
                ) : (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        className="w-full rounded-lg shadow-[0_45px_90px_rgba(0,0,0,0.8)]"
                        alt={product.title}
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-[#111] rounded-lg animate-pulse flex items-center justify-center text-gray-700 font-mono text-xs uppercase">No Image Artifact</div>
                    )}
                    <div className="bg-[#161616] p-8 rounded-lg border border-white/5 flex flex-col items-center justify-center text-center">
                      <span className="text-4xl mb-4">🎥</span>
                      <h3 className="text-white text-lg font-bold mb-2">Video Walkthrough Coming Soon</h3>
                      <p className="text-gray-500 text-sm max-w-md">Our walkthrough showcase or demo walkthrough video for this website template is currently being curated. Enjoy the details!</p>
                    </div>
                  </div>
                )}
              </div>
            ) : product.type === 'site' ? (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                {product.videoUrl ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                       <span className="text-[10px] font-mono text-[var(--accent)] uppercase tracking-widest font-black flex items-center gap-2">
                         🎥 Walkthrough Video Playback
                       </span>
                    </div>
                    <VideoPlayer url={product.videoUrl} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        className="w-full rounded-lg shadow-[0_45px_90px_rgba(0,0,0,0.8)]"
                        alt={product.title}
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-[#111] rounded-lg animate-pulse flex items-center justify-center text-gray-700 font-mono text-xs uppercase">No Image Artifact</div>
                    )}
                    <div className="bg-[#161616] p-8 rounded-lg border border-white/5 flex flex-col items-center justify-center text-center">
                      <span className="text-4xl mb-4">🎥</span>
                      <h3 className="text-white text-lg font-bold mb-2">Video Walkthrough Coming Soon</h3>
                      <p className="text-gray-500 text-sm max-w-md">Our walkthrough showcase or demo walkthrough video for this website template is currently being curated. Enjoy the details!</p>
                    </div>
                  </div>
                )}
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
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="w-full md:w-[400px] bg-[#161616] border-l border-[#2A2A2A] p-4 md:p-10 flex flex-col shrink-0 order-2 md:overflow-y-auto">
          <div className="mb-6 md:mb-10">
            <span className="font-mono text-[9px] text-[#FF3B3B] tracking-[0.3em] uppercase mb-2 block font-bold">{product.category}</span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">{product.title}</h2>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 text-[9px] font-mono font-medium rounded-full ${
                product.type === 'pdf' ? 'bg-[#FFD60A] text-black' : 'bg-[#FF3B3B] text-white'
              }`}>
                {product.type.toUpperCase()}
              </span>
              <span className="text-green-500 text-[10px] font-bold uppercase tracking-widest">Available</span>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <h4 className="text-white text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">About this Template</h4>
              <p className="text-[#888] text-xs leading-relaxed whitespace-pre-wrap">{product.desc}</p>
            </div>

            <div>
              <h4 className="text-white text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">What's Inside</h4>
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
