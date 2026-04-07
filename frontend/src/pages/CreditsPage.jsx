import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Heart, Code, Lightbulb, School } from 'lucide-react';

const credits = [
  {
    category: 'Inspiracija i ideja',
    icon: School,
    color: '#FDCB6E',
    items: [
      { name: 'Srednja Škola Kreševo', description: 'Ideja i motivacija za projekt', url: null },
      { name: 'Učenici i profesori', description: 'Za podršku i povratne informacije', url: null },
    ]
  },
  {
    category: 'Vizualni efekti',
    icon: Code,
    color: '#8AB4F8',
    items: [
      { name: 'ReactBits.dev', description: 'Iridescence i Ballpit animacije', url: 'https://reactbits.dev' },
      { name: 'Kevin Levron (@soju22)', description: 'Originalni Ballpit koncept', url: 'https://x.com/soju22' },
      { name: 'OGL', description: 'WebGL renderer za Iridescence', url: 'https://github.com/oframe/ogl' },
      { name: 'Three.js', description: '3D grafika za Ballpit', url: 'https://threejs.org' },
    ]
  },
  {
    category: 'Tehnologije',
    icon: Code,
    color: '#55EFC4',
    items: [
      { name: 'React 19', description: 'Frontend framework', url: 'https://react.dev' },
      { name: 'Vite', description: 'Build alat', url: 'https://vitejs.dev' },
      { name: 'Tailwind CSS', description: 'CSS framework', url: 'https://tailwindcss.com' },
      { name: 'FastAPI', description: 'Python backend framework', url: 'https://fastapi.tiangolo.com' },
      { name: 'MongoDB', description: 'Baza podataka', url: 'https://mongodb.com' },
      { name: 'GSAP', description: 'Animacije navigacije', url: 'https://gsap.com' },
      { name: 'Lucide React', description: 'Ikone', url: 'https://lucide.dev' },
      { name: 'Radix UI', description: 'UI komponente', url: 'https://radix-ui.com' },
    ]
  },
  {
    category: 'Hosting',
    icon: Lightbulb,
    color: '#FF9FF3',
    items: [
      { name: 'Vercel', description: 'Frontend hosting', url: 'https://vercel.com' },
      { name: 'Oracle Cloud', description: 'Backend i baza podataka', url: 'https://oracle.com/cloud' },
    ]
  },
];

const CreditsPage = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Heart className="w-4 h-4" style={{ color: '#FF9FF3' }} />
            <span className="text-sm font-medium">Napravljeno s ljubavlju</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">Zahvale</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Kreševo Kviz ne bi bio moguć bez ovih sjajnih projekata i ljudi.
          </p>
        </div>

        <div className="space-y-8">
          {credits.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.category} className="glass-card rounded-3xl p-6 animate-fade-in-up">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${section.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: section.color }} />
                  </div>
                  <h2 className="text-lg font-bold">{section.category}</h2>
                </div>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                      </div>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-2 rounded-lg hover:opacity-70 transition-opacity"
                          style={{ color: section.color }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p>© 2026 Ghost Productions · <Link to="/" className="hover:opacity-70 transition-opacity">Natrag na početnu</Link></p>
        </div>
      </div>
    </div>
  );
};

export default CreditsPage;
