"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  aspectRatio?: '1:1' | '4:3' | '16:9' | '21:9' | 'auto';
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function ResponsiveImage({
  src,
  alt,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  className,
  aspectRatio = 'auto',
  fallbackSrc = '/images/placeholder.jpg',
  loading = 'lazy',
  quality = 75,
  onLoad,
  onError,
}: ResponsiveImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  const aspectRatioClasses = {
    '1:1': 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
    '21:9': 'aspect-[21/9]',
    'auto': '',
  };

  const handleError = () => {
    setImageSrc(fallbackSrc);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  return (
    <div className={cn(
      'relative overflow-hidden bg-muted',
      aspectRatioClasses[aspectRatio],
      className
    )}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted to-muted-foreground/10" />
      )}

      {aspectRatio === 'auto' ? (
        <Image
          src={imageSrc}
          alt={alt}
          width={0}
          height={0}
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : loading}
          quality={quality}
          onError={handleError}
          onLoad={handleLoad}
          className={cn(
            'w-full h-auto',
            isLoading && 'opacity-0'
          )}
          style={{ width: '100%', height: 'auto' }}
        />
      ) : (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : loading}
          quality={quality}
          onError={handleError}
          onLoad={handleLoad}
          className={cn(
            'object-cover',
            isLoading && 'opacity-0'
          )}
        />
      )}
    </div>
  );
}

// Responsive picture component with art direction
interface ResponsivePictureProps {
  sources: {
    media: string;
    srcSet: string;
    type?: string;
  }[];
  fallback: {
    src: string;
    alt: string;
  };
  className?: string;
}

export function ResponsivePicture({
  sources,
  fallback,
  className,
}: ResponsivePictureProps) {
  return (
    <picture className={className}>
      {sources.map((source, index) => (
        <source
          key={index}
          media={source.media}
          srcSet={source.srcSet}
          type={source.type}
        />
      ))}
      <img
        src={fallback.src}
        alt={fallback.alt}
        className="w-full h-auto"
        loading="lazy"
      />
    </picture>
  );
}

// Avatar component with responsive sizes
interface ResponsiveAvatarProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ResponsiveAvatar({
  src,
  alt,
  size = 'md',
  className,
}: ResponsiveAvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 sm:w-8 sm:h-8',
    sm: 'w-8 h-8 sm:w-10 sm:h-10',
    md: 'w-10 h-10 sm:w-12 sm:h-12',
    lg: 'w-12 h-12 sm:w-16 sm:h-16',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
  };

  return (
    <div className={cn(
      'relative rounded-full overflow-hidden bg-muted',
      sizeClasses[size],
      className
    )}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 64px, 80px"
        className="object-cover"
      />
    </div>
  );
}