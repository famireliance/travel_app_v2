'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  isDark?: boolean;
}

export default function Breadcrumb({ items, className = '', isDark = false }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center flex-wrap gap-1.5 text-xs font-medium mb-6 ${className}`}>
      <div className={`flex items-center flex-wrap gap-1.5 px-3.5 py-2 rounded-xl border shadow-sm transition-all
        ${isDark 
          ? 'bg-slate-900/80 border-slate-700/60 text-slate-300 backdrop-blur-md' 
          : 'bg-white/90 border-slate-200/80 text-slate-500 backdrop-blur-md'}`}
      >
        <Link 
          href="/" 
          className={`flex items-center gap-1 transition-colors ${
            isDark ? 'hover:text-blue-400 text-slate-400' : 'hover:text-blue-600 text-slate-600'
          }`}
          title="ホームへ戻る"
        >
          <Home className="w-3.5 h-3.5" />
          <span>ホーム</span>
        </Link>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={`transition-colors truncate max-w-[160px] sm:max-w-xs ${
                    isDark ? 'hover:text-blue-400 text-slate-300' : 'hover:text-blue-600 text-slate-600'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <span 
                  className={`font-bold truncate max-w-[180px] sm:max-w-sm ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  {item.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
