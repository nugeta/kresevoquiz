import React from 'react';
import { useLocation } from 'react-router-dom';
import Iridescence from './Iridescence';

const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export default function GlobalBackground() {
  const location = useLocation();
  const mobile = isMobile();

  // On mobile (performance/battery) or on /auth (where 3D Ballpit is used), don't render Iridescence
  if (mobile || location.pathname === '/auth') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
      aria-hidden="true"
    >
      <Iridescence speed={0.8} amplitude={0.1} mouseReact={true} />
    </div>
  );
}
