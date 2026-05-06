import { useEffect } from 'react';

/**
 * Attaches an IntersectionObserver to all elements with .reveal, .reveal-left, .reveal-scale
 * and adds the .visible class when they enter the viewport.
 */
export default function useScrollReveal(deps = []) {
  useEffect(() => {
    const selectors = '.reveal, .reveal-left, .reveal-scale';
    const elements = document.querySelectorAll(selectors);

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // fire once
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
