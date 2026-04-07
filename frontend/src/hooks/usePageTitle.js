import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    const full = title ? `${title} · Kreševo Kviz` : 'Kreševo Kviz';
    document.title = full;
    return () => { document.title = 'Kreševo Kviz'; };
  }, [title]);
}
