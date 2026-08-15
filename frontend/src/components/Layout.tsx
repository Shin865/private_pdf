import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/merge', label: 'Merge', icon: '📄' },
  { path: '/split', label: 'Split', icon: '✂️' },
  { path: '/compress', label: 'Compress', icon: '🗜️' },
  { path: '/rotate', label: 'Rotate', icon: '🔄' },
  { path: '/pages', label: 'Pages', icon: '📑' },
  { path: '/convert', label: 'Convert', icon: '🖼️' },
  { path: '/watermark', label: 'Watermark', icon: '💧' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-dark-800)] border-r border-[var(--color-dark-600)] flex flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--color-dark-600)]">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-violet))' }}>
              📄
            </div>
            <div>
              <h1 className="text-base font-bold text-white m-0">PDF Tool</h1>
              <p className="text-[10px] text-[var(--color-dark-300)] m-0 tracking-wider uppercase">Local Toolbox</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 no-underline ${
                    isActive
                      ? 'bg-[var(--color-accent-violet)]/15 text-[var(--color-accent-cyan)] border border-[var(--color-accent-violet)]/20'
                      : 'text-[var(--color-dark-200)] hover:bg-[var(--color-dark-700)] hover:text-white border border-transparent'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-dark-600)]">
          <p className="text-[10px] text-[var(--color-dark-400)] text-center m-0">
            v0.1.0 • Localhost Only
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
