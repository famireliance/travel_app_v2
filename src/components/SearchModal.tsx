import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/islands?name=ilike.*${query}*&limit=10`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      })
      .then(res => res.json())
      .then(data => {
        setResults(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-[#F8FAFC]/95 backdrop-blur-xl flex flex-col pt-24 px-6 font-sans"
        >
          <button 
            onClick={onClose}
            className="absolute top-8 right-6 lg:right-12 p-2 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X size={32} strokeWidth={1} />
          </button>

          <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-slate-400 mb-8">Search Islands</h2>
            
            <div className="relative w-full mb-12">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300" strokeWidth={1} />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="島名で探す..." 
                className="w-full bg-transparent border-b-2 border-slate-200 text-3xl lg:text-5xl font-serif text-slate-800 placeholder-slate-300 py-4 pl-12 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="w-full max-h-[50vh] overflow-y-auto pr-4">
              {loading && <div className="text-center text-slate-400 tracking-widest text-sm">検索中...</div>}
              
              {!loading && results.length > 0 && (
                <div className="flex flex-col gap-2">
                  {results.map(island => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={island.id}
                      onClick={() => {
                        onClose();
                        router.push(`/island/${island.id}`);
                      }}
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div>
                        <h3 className="font-serif font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{island.name}</h3>
                        <p className="text-xs text-slate-400 tracking-widest mt-1 flex items-center gap-1">
                          <MapPin size={12} /> {island.region_id} region
                        </p>
                      </div>
                      <div className="text-xs font-bold tracking-widest text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        詳細を見る &rarr;
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {!loading && query.length > 0 && results.length === 0 && (
                <div className="text-center text-slate-400 font-serif">
                  「{query}」に一致する島は見つかりませんでした。
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
