import React from 'react';

interface VideoPlayerProps {
  url: string;
}

export const VideoPlayer = ({ url }: VideoPlayerProps) => {
  if (!url) return null;
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  if (isYouTube) {
    let embedUrl = url;
    if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`;
    } else if (url.includes('v=')) {
        const id = url.split('v=')[1]?.split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`;
    } else if (url.includes('embed/')) {
        embedUrl = url;
    }
    return (
      <div className="w-full h-[320px] md:h-[480px] bg-black rounded-lg overflow-hidden shadow-2xl relative">
        <iframe 
          src={embedUrl}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video Walkthrough"
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden shadow-2xl relative">
      <video 
        src={url}
        controls
        autoPlay
        playsInline
        className="w-full h-full max-h-[600px] object-contain"
      />
    </div>
  );
};
