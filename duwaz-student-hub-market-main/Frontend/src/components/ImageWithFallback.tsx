import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  fallback?: string;
  className?: string;
}

/**
 * Renders an image with a graceful fallback if the src is missing or fails to load.
 * Handles base64 data URLs, remote URLs, and missing/null values.
 */
const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallback = '/placeholder.svg',
  className,
}) => {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const resolved = (!src || errored) ? fallback : src;
  const isFallback = resolved === fallback;

  return (
    <div className={cn('relative overflow-hidden bg-gray-100', className)}>
      {/* Loading shimmer — shown until image loads */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={resolved}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setErrored(true);
          setLoaded(true); // stop shimmer even on error
        }}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          isFallback && 'object-contain p-4 opacity-50'
        )}
      />
    </div>
  );
};

export default ImageWithFallback;
