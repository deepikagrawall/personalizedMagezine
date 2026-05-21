import React from 'react';
import { Film, Zap, Play, Layout, Package, Layers } from 'lucide-react';

export const FeatureIcon = ({emoji, className}: {emoji: string, className?: string}) => {
    switch(emoji) {
        case '🎥': return <Film className={`text-[var(--accent)] ${className}`} size={24} />;
        case '🎬': return <Film className={`text-[var(--accent)] ${className}`} size={24} />;
        case '🚀': return <Zap className={`text-[var(--accent)] ${className}`} size={24} />;
        case '🎨': return <Layout className={`text-[var(--accent)] ${className}`} size={24} />;
        case '⚡': return <Play className={`text-[var(--accent)] ${className}`} size={24} />;
        case '🎞️': return <Film className={`text-[var(--accent)] ${className}`} size={24} />;
        case '📼': return <Package className={`text-[var(--accent)] ${className}`} size={24} />;
        case '🔍': return <Layers className={`text-[var(--accent)] ${className}`} size={24} />;
        case '📱': return <Layout className={`text-[var(--accent)] ${className}`} size={24} />;
        default: return <span className="text-2xl">{emoji}</span>;
    }
};

export const PaytmFeatureIcon = ({emoji, className}: {emoji: string, className?: string}) => {
    switch(emoji) {
        case '🎥': return <Film className={`text-[#00b9f5] ${className}`} size={24} />;
        case '🎬': return <Film className={`text-[#00b9f5] ${className}`} size={24} />;
        case '🚀': return <Zap className={`text-[#00b9f5] ${className}`} size={24} />;
        case '🎨': return <Layout className={`text-[#00b9f5] ${className}`} size={24} />;
        case '⚡': return <Play className={`text-[#00b9f5] ${className}`} size={24} />;
        case '🎞️': return <Film className={`text-[#00b9f5] ${className}`} size={24} />;
        case '📼': return <Package className={`text-[#00b9f5] ${className}`} size={24} />;
        case '🔍': return <Layers className={`text-[#00b9f5] ${className}`} size={24} />;
        case '📱': return <Layout className={`text-[#00b9f5] ${className}`} size={24} />;
        default: return <span className="text-2xl">{emoji}</span>;
    }
};
