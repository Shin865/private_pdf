import { Link } from 'react-router-dom';
import type { ToolInfo } from '../types';

const tools: ToolInfo[] = [
  {
    id: 'merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one document',
    icon: '📄',
    path: '/merge',
    color: 'var(--color-accent-cyan)',
    gradient: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    id: 'split',
    name: 'Split PDF',
    description: 'Separate PDF into multiple files by page ranges',
    icon: '✂️',
    path: '/split',
    color: 'var(--color-accent-violet)',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
  {
    id: 'compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality',
    icon: '🗜️',
    path: '/compress',
    color: 'var(--color-accent-emerald)',
    gradient: 'from-emerald-500/20 to-green-500/20',
  },
  {
    id: 'rotate',
    name: 'Rotate PDF',
    description: 'Rotate PDF pages by 90°, 180°, or 270°',
    icon: '🔄',
    path: '/rotate',
    color: 'var(--color-accent-amber)',
    gradient: 'from-amber-500/20 to-yellow-500/20',
  },
  {
    id: 'pages',
    name: 'Page Editor',
    description: 'Delete, extract, and reorder pages',
    icon: '📑',
    path: '/pages',
    color: 'var(--color-accent-pink)',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    id: 'pdf-to-image',
    name: 'PDF → Image',
    description: 'Convert PDF pages to JPG or PNG images',
    icon: '🖼️',
    path: '/convert',
    color: 'var(--color-accent-cyan)',
    gradient: 'from-cyan-500/20 to-teal-500/20',
  },
  {
    id: 'image-to-pdf',
    name: 'Image → PDF',
    description: 'Create PDF from JPG, PNG, or other images',
    icon: '📷',
    path: '/convert',
    color: 'var(--color-accent-violet)',
    gradient: 'from-violet-500/20 to-indigo-500/20',
  },
  {
    id: 'watermark',
    name: 'Watermark',
    description: 'Add text watermark to PDF pages',
    icon: '💧',
    path: '/watermark',
    color: 'var(--color-accent-rose)',
    gradient: 'from-rose-500/20 to-red-500/20',
  },
];

export default function Home() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="text-center mb-12 pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-accent-violet)]/10 border border-[var(--color-accent-violet)]/20 mb-6">
          <div className="w-2 h-2 rounded-full bg-[var(--color-accent-emerald)] animate-pulse" />
          <span className="text-xs font-medium text-[var(--color-accent-violet)]">Running Locally • 100% Private</span>
        </div>

        <h1 className="text-5xl font-extrabold mb-4 leading-tight">
          <span className="gradient-text">PDF Toolbox</span>
        </h1>
        <p className="text-lg text-[var(--color-dark-200)] max-w-2xl mx-auto leading-relaxed">
          All your PDF needs in one place. Process files locally —
          <span className="text-[var(--color-accent-cyan)]"> no uploads to cloud</span>,
          no data leaves your computer.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {tools.map((tool, i) => (
          <Link
            key={tool.id}
            to={tool.path}
            className="tool-card glass glass-hover rounded-2xl p-6 no-underline group"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {/* Icon */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform duration-300 group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${tool.color}15, ${tool.color}30)`,
                border: `1px solid ${tool.color}20`,
              }}
            >
              {tool.icon}
            </div>

            {/* Content */}
            <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-[var(--color-accent-cyan)] transition-colors">
              {tool.name}
            </h3>
            <p className="text-xs text-[var(--color-dark-300)] leading-relaxed m-0">
              {tool.description}
            </p>

            {/* Arrow */}
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--color-dark-400)] group-hover:text-[var(--color-accent-cyan)] transition-all">
              <span>Use tool</span>
              <svg
                className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: '🔒', title: '100% Private', desc: 'Files never leave your computer. All processing happens locally.' },
          { icon: '⚡', title: 'Lightning Fast', desc: 'No network delays. Direct processing on your machine.' },
          { icon: '🌐', title: 'No Internet Required', desc: 'Works completely offline after installation.' },
        ].map((feature, i) => (
          <div key={i} className="text-center p-6">
            <div className="text-3xl mb-3">{feature.icon}</div>
            <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
            <p className="text-xs text-[var(--color-dark-300)] m-0">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
