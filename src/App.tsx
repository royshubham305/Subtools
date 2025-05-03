import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ImageIcon, FileText, FileEdit, ScrollText, FileType, Menu, Linkedin, Instagram } from 'lucide-react';
import ImageResizer from './components/ImageResizer';
import ImageCompressor from './components/ImageCompressor';
import PdfEditor from './components/PdfEditor';
import ResumeMaker from './components/ResumeMaker';
import WordEditor from './components/WordEditor';

function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <nav className="bg-white shadow-lg border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/" className="flex items-center space-x-3">
                  <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <FileEdit className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text">
                    SubTools
                  </span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                <Link
                  to="/resize"
                  className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  <span>Resize</span>
                </Link>
                <Link
                  to="/compress"
                  className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  <span>Compress</span>
                </Link>
                <Link
                  to="/pdf"
                  className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                >
                  <FileEdit className="w-5 h-5 mr-2" />
                  <span>PDF Editor</span>
                </Link>
                <Link
                  to="/word"
                  className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                >
                  <FileType className="w-5 h-5 mr-2" />
                  <span>Word Editor</span>
                </Link>
                <Link
                  to="/resume"
                  className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                >
                  <ScrollText className="w-5 h-5 mr-2" />
                  <span>Resume(Beta)</span>
                </Link>
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
                  <span>Resize</span>
                </Link>
                <Link
                  to="/compress"
                  className="flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  <span>Compress</span>
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
                  to="/word"
                  className="flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FileType className="w-5 h-5 mr-2" />
                  <span>Word Editor</span>
                </Link>
                <Link
                  to="/resume"
                  className="flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ScrollText className="w-5 h-5 mr-2" />
                  <span>Resume(Beta)</span>
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
            <Route path="/pdf" element={<PdfEditor />} />
            <Route path="/word" element={<WordEditor />} />
            <Route path="/resume" element={<ResumeMaker />} />
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
  const tools = [
    {
      title: 'Image Resizer',
      description: 'Crop and resize images with precision. Support for multiple aspect ratios and custom dimensions.',
      icon: ImageIcon,
      path: '/resize',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Image Compressor',
      description: 'Reduce image file size while maintaining quality. Perfect for web optimization.',
      icon: FileText,
      path: '/compress',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'PDF Editor',
      description: 'Edit, annotate, and modify PDF files directly in your browser.',
      icon: FileEdit,
      path: '/pdf',
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Word Editor',
      description: 'Create and edit Word documents with a rich text editor and professional formatting.',
      icon: FileType,
      path: '/word',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Resume (Beta)',
      description: 'Resume tool is in beta stage currently available for use on PC only.',
      icon: ScrollText,
      path: '/resume',
      color: 'from-yellow-500 to-yellow-600'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Sub Tools Suite
        </h1>
        <div className="flex justify-center items-center space-x-4 mb-4">
          <a
            href="https://www.linkedin.com/in/royshubham305"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Linkedin className="w-6 h-6" />
          </a>
          <a
            href="https://www.instagram.com/royshubham305"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-pink-600 transition-colors"
          >
            <Instagram className="w-6 h-6" />
          </a>
        </div>
        <p className="text-xl text-gray-600">
          Transform your documents and images with our powerful web-based tools.
          No installation required.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tools.map((tool) => (
          <Link
            key={tool.path}
            to={tool.path}
            className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="p-8">
              <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${tool.color} mb-6 text-white`}>
                <tool.icon className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {tool.title}
              </h2>
              <p className="text-gray-600">{tool.description}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Why Choose SubTools?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="p-6">
            <div className="text-blue-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Fast & Efficient</h3>
            <p className="text-gray-600">Process your files instantly with our optimized tools</p>
          </div>
          <div className="p-6">
            <div className="text-blue-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure</h3>
            <p className="text-gray-600">Your files never leave your browser</p>
          </div>
          <div className="p-6">
            <div className="text-blue-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Browser-Based</h3>
            <p className="text-gray-600">No downloads or installations needed</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;