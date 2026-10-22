"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CategoryCircle,
  CategoryCircleItem,
} from "@/components/modules/Category/CategoryCircleRow";
import { cn } from "@/lib/utils";

const SLIDE_EVERY_MS = 3000;
const SWIPE_PX = 40;

// Room one category needs: circle width + gap, matching CategoryCircle's
// w-20 / sm:w-24 / lg:w-28 and the row's gap-4 / md:gap-6 / lg:gap-8
const slotWidth = (screen: number) =>
  screen >= 1024 ? 112 + 32 : screen >= 768 ? 96 + 24 : screen >= 640 ? 96 + 16 : 80 + 16;

// Homepage categories: a centred row when they all fit, otherwise an
// endless auto-slider showing as many as the screen holds
export default function CategorySlider({
  categories,
}: {
  categories: CategoryCircleItem[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [perView, setPerView] = useState(0);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () =>
      setPerView(Math.max(1, Math.floor(el.clientWidth / slotWidth(window.innerWidth))));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const canSlide = perView > 0 && categories.length > perView;
  const count = categories.length;

  // The first `perView` items are repeated after the last one; reaching the
  // copy snaps back to the start with the transition off, so it never rewinds
  const slides = canSlide ? [...categories, ...categories.slice(0, perView)] : categories;
  const position = canSlide ? Math.min(index, count) : 0;

  useEffect(() => {
    if (!canSlide || paused) return;
    const timer = setInterval(() => {
      setAnimate(true);
      setIndex((i) => (i >= count ? 1 : i + 1));
    }, SLIDE_EVERY_MS);
    return () => clearInterval(timer);
  }, [canSlide, paused, count]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (index >= count) {
      setAnimate(false);
      setIndex(0);
    }
  };

  const goNext = () => {
    setAnimate(true);
    setIndex((i) => (i >= count ? 1 : i + 1));
  };

  const goPrev = () => {
    if (position === 0) {
      // Jump to the copy at the end, then slide back one
      setAnimate(false);
      setIndex(count);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setAnimate(true);
          setIndex(count - 1);
        }),
      );
    } else {
      setAnimate(true);
      setIndex((i) => i - 1);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {!canSlide ? (
        // Everything fits: centred, like before
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8">
          {categories.map((category) => (
            <CategoryCircle key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <>
          <div
            className="overflow-hidden"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
              setPaused(true);
            }}
            onTouchEnd={(e) => {
              const start = touchStartX.current;
              touchStartX.current = null;
              setPaused(false);
              if (start === null) return;
              const delta = e.changedTouches[0].clientX - start;
              if (delta <= -SWIPE_PX) goNext();
              else if (delta >= SWIPE_PX) goPrev();
            }}
          >
            <div
              className={cn("flex", animate && "transition-transform duration-500 ease-out")}
              style={{ transform: `translateX(-${(position * 100) / perView}%)` }}
              onTransitionEnd={handleTransitionEnd}
            >
              {slides.map((category, i) => (
                <div
                  key={`${category.id}-${i}`}
                  className="flex shrink-0 justify-center"
                  style={{ flexBasis: `${100 / perView}%` }}
                  aria-hidden={i >= count}
                  // Copies at the end aren't reachable by keyboard
                  inert={i >= count}
                >
                  <CategoryCircle category={category} />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous categories"
            className="absolute -left-2 top-[38%] -translate-y-1/2 rounded-full bg-background/90 p-1.5 shadow-md ring-1 ring-black/5 transition hover:scale-105 md:-left-3"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next categories"
            className="absolute -right-2 top-[38%] -translate-y-1/2 rounded-full bg-background/90 p-1.5 shadow-md ring-1 ring-black/5 transition hover:scale-105 md:-right-3"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
