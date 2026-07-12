import React, { useState, useEffect } from 'react';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  fallbackSeed?: string;
  fill?: boolean;
}

export default function SafeImage({
  src,
  alt,
  width,
  height,
  className,
  style,
  fallbackSeed,
  fill
}: SafeImageProps) {
  const seed = fallbackSeed || 'default';
  const fallbackSrc = `https://picsum.photos/seed/${seed}/800/600`;
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  // Sync state if source changes dynamically
  useEffect(() => {
    setImgSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{
        objectFit: 'cover',
        width: fill ? '100%' : (width ? `${width}px` : '100%'),
        height: fill ? '100%' : (height ? `${height}px` : 'auto'),
        ...style
      }}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
}
