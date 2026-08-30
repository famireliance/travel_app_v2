import React from 'react';
import { ShieldCheck, MapPin, Award, Star, Ship } from 'lucide-react';
import { motion } from 'framer-motion';

interface AgentPassProps {
  userName: string;
  joinDate?: string;
  isOfficial?: boolean;
}

export default function AgentPass({ userName, joinDate = '2023.04.01', isOfficial = false }: AgentPassProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl"
    >
      <div className="text-center mb-8">
        <h3 className="font-serif text-2xl font-black text-slate-800 mb-2">
          {isOfficial ? '公式エージェント・パス' : '島プロフェッショナル認定証'}
        </h3>
        <p className="text-xs text-slate-500">
          このパスは、あなたがKIRATABIの厳しい基準をクリアした「島のプロ」であることを証明します。
          <br/>現地での提示により、提携施設での優待やスムーズな視察が可能になります。
        </p>
      </div>

      {/* The Pass Card (Apple Wallet Style) */}
      <div className="w-full max-w-sm aspect-[5/8] rounded-[2.5rem] p-1 bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 shadow-2xl relative overflow-hidden group hover:shadow-amber-500/20 transition-all duration-500">
        
        {/* Holographic overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -translate-x-full group-hover:translate-x-full ease-in-out" />
        
        <div className="w-full h-full bg-slate-950 rounded-[2.3rem] flex flex-col relative overflow-hidden">
          
          {/* Card Header */}
          <div className="px-6 pt-8 pb-4 flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span className="text-amber-500 text-[0.6rem] font-bold tracking-widest uppercase">KIRATABI CERTIFIED</span>
              </div>
              <h4 className="text-white font-serif text-xl font-bold tracking-widest">
                ISLAND PRO
              </h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border-2 border-slate-900">
              <Award className="w-5 h-5 text-slate-900" />
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 flex-1 relative z-10 border-t border-slate-800/50 mt-2 bg-gradient-to-b from-transparent to-slate-900/80">
            <p className="text-[0.65rem] text-slate-400 uppercase tracking-widest mb-1">Agent Name</p>
            <p className="text-2xl text-white font-serif font-bold mb-6">{userName || 'GUEST'}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[0.6rem] text-slate-400 uppercase tracking-widest mb-1">Class</p>
                <p className="text-sm text-amber-500 font-bold">{isOfficial ? 'OFFICIAL AGENT' : 'USER AGENT'}</p>
              </div>
              <div>
                <p className="text-[0.6rem] text-slate-400 uppercase tracking-widest mb-1">Certified Since</p>
                <p className="text-sm text-white font-mono">{joinDate}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"><MapPin className="w-4 h-4 text-slate-400" /></div>
                <div>
                  <p className="text-[0.6rem] text-slate-400 uppercase tracking-widest">Clearance</p>
                  <p className="text-xs text-white font-bold">ALL ISLANDS</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"><Ship className="w-4 h-4 text-slate-400" /></div>
                <div>
                  <p className="text-[0.6rem] text-slate-400 uppercase tracking-widest">Perks</p>
                  <p className="text-xs text-white font-bold">VIP BOARDING</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Area */}
          <div className="mt-auto bg-white p-6 relative z-10 flex flex-col items-center justify-center">
            {/* Fake Barcode/QR */}
            <div className="w-full h-16 flex items-center justify-between gap-1 opacity-80">
               {Array.from({ length: 40 }).map((_, i) => (
                 <div key={i} className="bg-slate-900 h-full" style={{ width: `${Math.random() * 4 + 1}px` }} />
               ))}
            </div>
            <p className="text-[0.6rem] text-slate-500 font-mono mt-3 tracking-[0.3em]">ID: 8942-XXXX-XXXX</p>
          </div>

          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        </div>
      </div>
    </motion.div>
  );
}
