"use client";

import { useEffect, useMemo, useState } from "react";

export type HeroVideo = {
  key: string;
  url: string;
  name: string;
  size: number;
  lastModified: string;
};

export default function HeroVideoCarousel({ videos }: { videos: HeroVideo[] }) {
  const activeVideos = useMemo(() => videos.filter((video) => Boolean(video.url)), [videos]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [activeVideos.length]);

  if (activeVideos.length === 0) return null;

  const activeVideo = activeVideos[activeIndex]!;
  const goNext = () => {
    setActiveIndex((current) => (current + 1) % activeVideos.length);
  };

  return (
    <div className="absolute inset-0">
      <video
        key={activeVideo.key}
        autoPlay
        muted
        playsInline
        preload="metadata"
        loop={activeVideos.length === 1}
        onEnded={goNext}
        className="absolute inset-0 h-full w-full object-cover"
        src={activeVideo.url}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1c1210]/70 via-[#1c1210]/55 to-[#1c1210]/80" />
      {activeVideos.length > 1 && (
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          {activeVideos.map((video, index) => (
            <button
              key={video.key}
              type="button"
              aria-label={`Show hero video ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition ${
                index === activeIndex ? "w-8 bg-[#FFF8E8]" : "w-2.5 bg-[#FFF8E8]/45 hover:bg-[#FFF8E8]/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
