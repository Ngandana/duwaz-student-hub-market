import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideData {
  image: string;
  title: string;
  description: string;
  linkTo?: string; // optional — clicking the slide navigates here
}

interface SlideshowProps {
  slides: SlideData[];
  autoplay?: boolean;
  interval?: number;
  className?: string;
}

const Slideshow: React.FC<SlideshowProps> = ({
  slides,
  autoplay = true,
  interval = 4000,
  className,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToNext = () => {
    if (isTransitioning || slides.length < 2) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToPrevious = () => {
    if (isTransitioning || slides.length < 2) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Reset to first slide if slides change (e.g. data loads)
  useEffect(() => {
    setCurrentSlide(0);
  }, [slides.length]);

  useEffect(() => {
    if (!autoplay || slides.length < 2) return;
    const timer = setInterval(goToNext, interval);
    return () => clearInterval(timer);
  }, [autoplay, interval, currentSlide, isTransitioning, slides.length]);

  if (slides.length === 0) {
    return <div className={cn('relative w-full overflow-hidden rounded-lg bg-gray-200 animate-pulse', className)} />;
  }

  return (
    <div className={cn('relative w-full overflow-hidden rounded-lg', className)}>
      {/* Slides */}
      <div className="relative h-full">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          const content = (
            <div
              className={cn(
                'absolute top-0 left-0 w-full h-full transition-opacity duration-500',
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              )}
            >
              {/* Background image */}
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
              />
              {/* Overlay text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end text-white p-6 pb-12">
                <h2 className="text-2xl md:text-4xl font-bold mb-1 text-center drop-shadow-md line-clamp-2">
                  {slide.title}
                </h2>
                <p className="text-sm md:text-lg max-w-lg text-center text-white/90 drop-shadow">
                  {slide.description}
                </p>
                {slide.linkTo && (
                  <span className="mt-3 text-xs md:text-sm bg-white/20 backdrop-blur-sm border border-white/40 text-white px-4 py-1.5 rounded-full hover:bg-white/30 transition-colors">
                    View Product →
                  </span>
                )}
              </div>
            </div>
          );

          return slide.linkTo ? (
            <Link key={index} to={slide.linkTo} className="block absolute inset-0 z-10 cursor-pointer">
              {content}
            </Link>
          ) : (
            <div key={index}>{content}</div>
          );
        })}
      </div>

      {/* Navigation arrows — only show when multiple slides */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/40 p-2 rounded-full transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/40 p-2 rounded-full transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          {/* Indicator dots */}
          <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all',
                  index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Slideshow;
