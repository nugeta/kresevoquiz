import React from 'react';
import usePageTitle from '../hooks/usePageTitle';

const BannedPage = () => {
  usePageTitle('Zabranjen pristup');

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="text-center max-w-md animate-fade-in-up">
        <div className="text-8xl mb-6">🔨</div>
        <h1 className="font-['Nunito'] text-4xl font-black mb-3" style={{ color: 'var(--error)' }}>
          Baniran/a si!
        </h1>
        <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
          Tvoj račun je suspendiran od strane administratora.
        </p>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          Ako misliš da je ovo greška, kontaktiraj nas putem chata.
        </p>
        <div className="glass-card rounded-3xl p-6 text-left space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p>🚫 Pristup kvizovima: <span style={{ color: 'var(--error)' }}>Onemogućen</span></p>
          <p>🚫 Multiplayer: <span style={{ color: 'var(--error)' }}>Onemogućen</span></p>
          <p>🚫 Rang lista: <span style={{ color: 'var(--error)' }}>Onemogućen</span></p>
        </div>
        <p className="text-xs mt-6" style={{ color: 'var(--text-secondary)' }}>
          Kreševo Kviz · Ghost Productions
        </p>
      </div>
    </div>
  );
};

export default BannedPage;
