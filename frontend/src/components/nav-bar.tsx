'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

const NAV_SECTIONS = [
  {
    heading: null,
    items: [{ href: '/', label: 'Dashboard', icon: <HomeIcon /> }],
  },
  {
    heading: 'Pages',
    items: [
      { href: '/onboarding', label: 'Volunteer Portal', icon: <UserIcon /> },
      { href: '/simulator', label: 'Simulator', icon: <MessageIcon /> },
    ],
  },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 shrink-0 sticky top-0 h-screen flex flex-col overflow-y-auto"
      style={{ backgroundColor: '#0D2137' }}
    >
      {/* Brand */}
      <div className="px-6 py-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-2xl" style={{ fontFamily: 'var(--font-dm-sans)', letterSpacing: '-1px' }}>
            Control Tower
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: '#5B7A95' }}>United Hunger</p>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-4 pb-6 flex flex-col gap-1">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-4' : ''}>
            {section.heading && (
              <p
                className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-widest"
                style={{ color: '#5B7A95' }}
              >
                {section.heading}
              </p>
            )}
            {section.items.map(({ href, label, icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: isActive ? '#1B4B8A' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#7FA3C0',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(107,159,209,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <span className="flex items-center gap-2">
                    {icon}
                    {label}
                  </span>
                  <ChevronDown />
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
