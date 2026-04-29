import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ImageIcon, FileText, FileEdit, ScrollText, Menu, Linkedin, Instagram, ArrowRight, Zap, Shield, Globe, Wand2, ChevronDown } from 'lucide-react';
import ImageResizer from './components/ImageResizer';
import ImageCompressor from './components/ImageCompressor';
import PdfEditor from './components/PdfEditor';
import BackgroundRemover from './components/BackgroundRemover';
import ResumeMaker from './components/ResumeMaker';
import SkeletonLoader from './components/SkeletonLoader';

function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate a sleek loading sequence
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900 font-sans">
        {/* Decorative Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-200/20 blur-3xl animate-blob" />
          <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-200/20 blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-200/20 blur-3xl animate-blob animation-delay-4000" />
        </div>

        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/" className="flex items-center space-x-3 group">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                    <FileEdit className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                    SubTools
                  </span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-2">
                {[
                  { path: '/resize', icon: ImageIcon, label: 'Resize' },
                  { path: '/compress', icon: FileText, label: 'Compress' },
                  { path: '/resume', icon: ScrollText, label: 'Resume' },
                  { path: '/pdf', icon: FileEdit, label: 'PDF Editor' },
                  { path: '/remove-background', icon: Wand2, label: 'Bg Remover' },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-all duration-200"
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  to="/resize"
                  className="flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  <span>Image Resizer</span>
                </Link>
                <Link
                  to="/compress"
                  className="flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  <span>Image Compressor</span>
                </Link>
                <Link
                  to="/resume"
                  className="flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ScrollText className="w-5 h-5 mr-2" />
                  <span>Resume(Beta)</span>
                </Link>
                <Link
                  to="/pdf"
                  className="flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FileEdit className="w-5 h-5 mr-2" />
                  <span>PDF Editor</span>
                </Link>
                <Link
                  to="/remove-background"
                  className="flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  <span>Background Remover</span>
                </Link>
              </div>
            </div>
          )}
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/resize" element={<ImageResizer />} />
            <Route path="/compress" element={<ImageCompressor />} />
            <Route path="/resume" element={<ResumeMaker />} />
            <Route path="/pdf" element={<PdfEditor />} />
            <Route path="/remove-background" element={<BackgroundRemover />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-100 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-500">
              <p className="text-sm">
                SubTools Suite - Web-based Document Tools
              </p>
              <div className="flex justify-center items-center space-x-4 mt-2">
                <a
                  href="https://www.linkedin.com/in/royshubham305"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://www.instagram.com/royshubham305"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pink-600 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
              <p className="text-xs mt-2">
                © {new Date().getFullYear()} SubTools. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function Home() {
  const [openDetail, setOpenDetail] = React.useState<string | null>(null);

  const tools = [
    {
      title: 'Image Resizer',
      description: 'Crop and resize images with pixel-perfect precision. Support for multiple aspect ratios and custom dimensions.',
      icon: ImageIcon,
      path: '/resize',
      color: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-500/20'
    },
    {
      title: 'Image Compressor',
      description: 'Smart compression algorithms to reduce file size by up to 80% while maintaining visual quality.',
      icon: FileText,
      path: '/compress',
      color: 'from-violet-500 to-purple-500',
      shadow: 'shadow-purple-500/20'
    },
    {
      title: 'Resume Builder',
      description: 'Create professional, ATS-friendly resumes in minutes with our beta builder tool.',
      icon: ScrollText,
      path: '/resume',
      color: 'from-amber-400 to-orange-500',
      shadow: 'shadow-orange-500/20'
    },
    {
      title: 'PDF Editor',
      description: 'Comprehensive PDF tools to edit, annotate, and organize your documents directly in the browser.',
      icon: FileEdit,
      path: '/pdf',
      color: 'from-rose-500 to-red-500',
      shadow: 'shadow-red-500/20'
    },
    {
      title: 'Background Remover',
      description: 'Automatically remove image backgrounds with AI or use manual tools for precision editing.',
      icon: Wand2,
      path: '/remove-background',
      color: 'from-pink-500 to-rose-500',
      shadow: 'shadow-pink-500/20'
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      desc: "All processing happens locally in your browser for instant results."
    },
    {
      icon: Shield,
      title: "100% Secure",
      desc: "Your files never leave your device. Privacy by design."
    },
    {
      icon: Globe,
      title: "No Installation",
      desc: "Access powerful tools anywhere, anytime, without downloads."
    }
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <div className="relative pt-10 pb-16 text-center lg:pt-24 lg:pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8 border border-blue-100 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
            New: Resume Builder Beta is now live
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
            Every Tool You Need, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient">
              One Powerful Suite
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
            Transform, edit, and optimize your documents and images with our collection of professional-grade web tools. Free, fast, and secure.
          </p>
          <div className="flex justify-center gap-4">
            <a href="#tools" className="px-8 py-4 rounded-full bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-1 transition-all duration-300">
              Explore Tools
            </a>
            <a href="https://github.com/royshubham305" target="_blank" rel="noreferrer" className="px-8 py-4 rounded-full bg-white text-slate-700 font-bold text-lg shadow-lg hover:shadow-xl border border-slate-200 hover:border-slate-300 hover:-translate-y-1 transition-all duration-300">
              View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div id="tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Powerful Tools for Everyone</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Select a tool to get started. No account required.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group relative overflow-hidden bg-white rounded-3xl p-8 border border-slate-100 hover:border-blue-100 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2"
            >
              <div className={`absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-gradient-to-br ${tool.color} opacity-10 group-hover:scale-150 transition-transform duration-700`} />
              
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${tool.color} ${tool.shadow} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <tool.icon className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                {tool.title}
              </h3>
              
              <p className="text-slate-600 mb-8 leading-relaxed">
                {tool.description}
              </p>
              
              <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                Launch Tool <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">What Each Tool Does</h2>
          <p className="text-slate-600 max-w-3xl mx-auto">
            Quick descriptions of every tool inside SubTools so users know exactly what to use.
          </p>
        </div>

        {(
          [
            {
              key: 'pdf',
              title: 'PDF Editor',
              icon: FileEdit,
              description: 'Everything you need to edit and generate PDFs directly in the browser.',
              bullets: [
                'Images to PDF: convert photos into a single PDF.',
                'Merge PDFs: combine multiple PDFs and reorder before merge.',
                'Extract Images: pick pages and export images as JPG/PNG.',
                'Compress PDF: reduce PDF size with a quality slider/target.',
                'Unlock PDF: remove password protection (with password).',
                'Lock PDF: add a password to protect a PDF.',
                'Organize PDF: reorder, rotate, remove pages, export new PDF.',
                'Split PDF: split by ranges or every page (PDF/ZIP output).',
              ],
            },
            {
              key: 'resume',
              title: 'Resume Builder',
              icon: ScrollText,
              description: 'Step-by-step resume maker with multiple preview templates and PDF export.',
              bullets: [
                'Fill sections: Personal Info → Education → Experience → Projects → Skills → Certifications → Achievements.',
                'Preview templates: Classic, Modern, Minimal, Bold.',
                'Download your resume as a PDF from the Preview step.',
              ],
            },
            {
              key: 'bg',
              title: 'Background Remover',
              icon: Wand2,
              description: 'Remove image backgrounds quickly for product photos, profiles, and designs.',
              bullets: ['Automatic background removal.', 'Manual cleanup tools for better accuracy.'],
            },
            {
              key: 'resize',
              title: 'Image Resizer',
              icon: ImageIcon,
              description: 'Resize and crop images for social media, websites, and apps.',
              bullets: ['Resize by pixels and common aspect ratios.', 'Crop with preview before export.'],
            },
            {
              key: 'compress',
              title: 'Image Compressor',
              icon: FileText,
              description: 'Reduce image file size while keeping good visual quality.',
              bullets: ['Adjust compression level.', 'Download smaller images faster for the web.'],
            },
          ] as const
        ).map((item) => (
          <div key={item.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
            <button
              type="button"
              onClick={() => setOpenDetail((prev) => (prev === item.key ? null : item.key))}
              className="w-full px-6 py-5 flex items-center justify-between text-left"
              aria-expanded={openDetail === item.key}
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-100">
                  <item.icon className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-lg font-bold text-slate-900">{item.title}</div>
                  <div className="text-sm text-slate-600">{item.description}</div>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openDetail === item.key ? 'rotate-180' : ''}`} />
            </button>

            {openDetail === item.key && (
              <div className="px-6 pb-6">
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Features Section */}
      <div className="bg-white/50 backdrop-blur-sm border-y border-slate-200 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-900 mb-6">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
