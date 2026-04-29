import React from 'react';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Navbar Skeleton */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              {/* Logo Icon */}
              <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
              {/* Logo Text */}
              <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
            </div>
            
            {/* Desktop Nav Items */}
            <div className="hidden md:flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-9 w-24 bg-slate-200 rounded-full animate-pulse" />
              ))}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-24 pb-20">
        {/* Hero Section Skeleton */}
        <div className="relative pt-10 pb-16 text-center lg:pt-24 lg:pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
            {/* Badge */}
            <div className="h-8 w-64 bg-slate-200 rounded-full mb-8 animate-pulse" />
            
            {/* Title Line 1 */}
            <div className="h-12 md:h-20 w-3/4 bg-slate-200 rounded-lg mb-4 animate-pulse" />
            {/* Title Line 2 */}
            <div className="h-12 md:h-20 w-1/2 bg-slate-200 rounded-lg mb-8 animate-pulse" />
            
            {/* Description Lines */}
            <div className="h-4 w-full max-w-2xl bg-slate-200 rounded mb-3 animate-pulse" />
            <div className="h-4 w-5/6 max-w-2xl bg-slate-200 rounded mb-10 animate-pulse" />
            
            {/* Buttons */}
            <div className="flex justify-center gap-4">
              <div className="h-14 w-40 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-14 w-40 bg-slate-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Tools Grid Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 flex flex-col items-center">
            <div className="h-8 w-64 bg-slate-200 rounded mb-4 animate-pulse" />
            <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-8 border border-slate-100 h-80 relative overflow-hidden">
                {/* Icon Circle */}
                <div className="w-16 h-16 bg-slate-200 rounded-2xl mb-6 animate-pulse" />
                
                {/* Title */}
                <div className="h-8 w-48 bg-slate-200 rounded mb-3 animate-pulse" />
                
                {/* Description */}
                <div className="space-y-2 mb-8">
                  <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-4/6 bg-slate-200 rounded animate-pulse" />
                </div>
                
                {/* Link */}
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SkeletonLoader;
