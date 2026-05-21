import React, { useState } from 'react';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    desc: string;
    price: string;
    original?: string;
    type: string;
    category: string;
    imageUrl?: string;
    seed?: number;
    isNew?: boolean;
    isBest?: boolean;
  };
  observe: (el: HTMLElement | null) => void;
  onPreview: (product: any) => void;
  onSave: (product: any) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, observe, onPreview, onSave }) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div 
      ref={observe}
      className="group bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden transition-all duration-300 hover:border-[#2A2A2A] hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] transform hover:-translate-y-1 flex flex-col h-full"
    >
      <div className="relative overflow-hidden cursor-pointer aspect-[3/4]" onClick={() => onPreview(product)}>
        <img 
          src={product.imageUrl || `https://picsum.photos/600/800?random=${product.seed}`} 
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

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-[#FF3B3B] tracking-[0.2em] font-bold uppercase">{product.category}</span>
          <span className="text-[10px] font-mono text-[#666] uppercase">{product.type === 'pdf' ? 'Printable' : 'Interactive'}</span>
        </div>
        <h3 className="text-white font-bold text-xl leading-tight mb-3 group-hover:text-[#FF3B3B] transition-colors cursor-pointer" onClick={() => onPreview(product)}>{product.title}</h3>
        <p className="text-[#666] text-sm mb-4 line-clamp-2 leading-relaxed">{product.desc}</p>
        
        {/* Save to Library / Get Access Action Button */}
        <button 
            onClick={(e) => { e.stopPropagation(); onSave(product); }}
            className="w-full bg-[#181818] border border-white/5 hover:border-[#FF3B3B] text-white hover:bg-[#FF3B3B] py-3.5 rounded-xl text-xs font-mono font-bold tracking-wider active:scale-[0.98] transition-all duration-200 mb-4 flex items-center justify-center gap-2 cursor-pointer"
        >
            SAVE TO LIBRARY +
        </button>
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex flex-col">
            {product.original && (
              <span className="text-[#444] text-[10px] font-mono uppercase tracking-widest line-through mb-1">{product.original}</span>
            )}
            <div className="flex items-baseline gap-1">
                <span className="text-white font-mono font-black text-2xl tracking-tighter">{product.price || 'FREE'}</span>
                <span className="text-[var(--accent)] text-[8px] font-bold uppercase tracking-widest">BETA</span>
            </div>
          </div>
          <button 
            onClick={() => onPreview(product)}
            className="bg-transparent border border-white/10 text-white hover:bg-white hover:text-black px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 group/btn cursor-pointer"
          >
            {product.type === 'site' ? 'Watch Video 🎥' : 'Preview →'}
          </button>
        </div>
      </div>
    </div>
  );
};
