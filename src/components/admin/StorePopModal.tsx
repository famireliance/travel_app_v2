'use client';

import React, { useRef } from 'react';
import { X, Printer, Download, Sparkles, Store, ShieldCheck, Award } from 'lucide-react';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

interface StorePopModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store: any;
}

const POP_ISLAND_ALIASES: Record<string, string> = {
  ishigaki: '392',
  ishigakijima: '392',
  miyako: '386',
  miyakojima: '386',
  hachijo: '56',
  hachijojima: '56',
  aogashima: '58',
  chichijima: '63',
  chichijimaogasawarashoto: '63',
  hahajima: '64',
  hahajimaogasawarashoto: '64',
  oshima: '49',
  izuoshima: '49',
  toshima: '50',
  nijima: '51',
  niijima: '51',
  shikine: '52',
  shikinejima: '52',
  kozushima: '53',
  miyake: '54',
  miyakejima: '54',
  mikura: '55',
  mikurajima: '55',
  amami: '352',
  amamioshima: '352',
  taketomi: '393',
  taketomijima: '393',
  kohama: '394',
  kohamajima: '394',
  iriomote: '396',
  iriomotejima: '396',
  hateruma: '400',
  haterumajima: '400',
  yonaguni: '401',
  yonagunijima: '401',
  kume: '380',
  kumejima: '380',
  yakushima: '340',
  tanegashima: '339',
  yoron: '359',
  yoronto: '359',
  tokunoshima: '357',
  shodoshima: '197',
  naoshima: '195',
  sado: '76',
  sadoto: '76',
  iki: '258',
  ikishima: '258',
  tsushima: '252',
  rebun: '1',
  rebunto: '1',
  rishiri: '2',
  rishirito: '2',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveIslandForPop(rawIslandId: string): any | null {
  const trimmed = String(rawIslandId || '').trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed) return null;

  if (ALL_ISLANDS_MASTER_DICTIONARY[trimmed]) {
    return ALL_ISLANDS_MASTER_DICTIONARY[trimmed];
  }
  const aliasId = POP_ISLAND_ALIASES[lower];
  if (aliasId && ALL_ISLANDS_MASTER_DICTIONARY[aliasId]) {
    return ALL_ISLANDS_MASTER_DICTIONARY[aliasId];
  }
  const exact = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
    (i: any) =>
      String(i.slug || '').toLowerCase() === lower ||
      String(i.name || '') === trimmed ||
      String(i.name || '').startsWith(`${trimmed}（`)
  );
  if (exact) return exact;

  if (lower.length >= 3) {
    return (
      Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
        (i: any) => String(i.slug || '').toLowerCase().startsWith(lower) || String(i.name || '').includes(trimmed)
      ) || null
    );
  }
  return null;
}

export default function StorePopModal({ isOpen, onClose, store }: StorePopModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !store) return null;

  const resolvedIsland = resolveIslandForPop(store.island_id);
  const islandInfo = resolvedIsland || { name: store.island_id, prefecture: '離島', slug: store.island_id };
  const islandName = islandInfo.name || store.island_id;
  const slugOrId = resolvedIsland?.slug || store.island_id;
  const storeUrl = `https://island.kira-tabi.com/island/${encodeURIComponent(slugOrId)}?ref_store=${encodeURIComponent(store.referral_code)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(storeUrl)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      {/* 印刷専用スタイル（A4縦・余白なし・背景印刷強制） */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-pop-sheet, #printable-pop-sheet * {
            visibility: visible !important;
          }
          #printable-pop-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header Controls (印刷時は非表示) */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm">店頭POPポスター印刷プレビュー（A4サイズ）</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition"
            >
              <Printer className="w-4 h-4" /> 印刷する / PDF保存
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* POP Sheet Preview */}
        <div className="p-6 bg-slate-800/50 overflow-y-auto flex items-center justify-center">
          <div
            id="printable-pop-sheet"
            ref={printAreaRef}
            className="w-[210mm] min-h-[297mm] bg-white text-slate-900 p-10 flex flex-col justify-between shadow-2xl relative border-4 border-slate-900 rounded-lg select-none"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Top Brand Header */}
            <div>
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-6">
                <div>
                  <p className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase">
                    Official Island Discovery & Certification Program
                  </p>
                  <h1 className="text-2xl font-black tracking-wider text-slate-950 flex items-center gap-2">
                    <span>輝旅 島専科</span>
                    <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded font-mono font-bold tracking-normal">
                      公式協力店
                    </span>
                  </h1>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-600 block">全国481島・有人離島完全網羅</span>
                  <span className="text-[10px] text-slate-400 font-mono">island.kira-tabi.com</span>
                </div>
              </div>

              {/* Main Catchphrase */}
              <div className="text-center my-4">
                <span className="inline-block bg-amber-500 text-slate-950 font-black text-sm px-4 py-1 rounded-full mb-3 shadow-sm tracking-wider">
                  ★ 旅の記念・公式到達認定 ★
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  「<span className="text-blue-600 underline decoration-amber-400 decoration-4 underline-offset-4">{islandName}</span>」へようこそ！<br />
                  あなたの到達を公式認定証に。
                </h2>
                <p className="text-xs text-slate-600 mt-2 font-medium">
                  スマートフォンで下記QRコードを読み取るだけで、本日の到達証明書（デジタル／木製額装版）を発行できます。
                </p>
              </div>

              {/* Huge QR Code Box */}
              <div className="my-6 p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-md mb-3">
                  <img
                    src={qrImageUrl}
                    alt="店頭専用QRコード"
                    className="w-56 h-56 object-contain"
                  />
                </div>
                <span className="text-xs font-extrabold text-slate-800 tracking-wider">
                  ▲ スマートフォンのカメラでスキャン ▲
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  （アプリインストール不要・ブラウザですぐ開きます）
                </p>
              </div>

              {/* Highlights 3 Points */}
              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <ShieldCheck className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <h4 className="text-xs font-bold text-blue-950">公認デジタル証明書</h4>
                  <p className="text-[10px] text-blue-700 mt-0.5">公印・認定番号入りの証明カードを獲得</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <Award className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <h4 className="text-xs font-bold text-amber-950">記念フレーム郵送</h4>
                  <p className="text-[10px] text-amber-700 mt-0.5">高級木製・アクリル額装版をご自宅へお届け</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <Sparkles className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <h4 className="text-xs font-bold text-emerald-950">限定特典コード</h4>
                  <p className="text-[10px] text-emerald-700 mt-0.5">当店コード適用でお得に発行可能</p>
                </div>
              </div>
            </div>

            {/* Bottom Store Footer */}
            <div className="border-t-2 border-slate-900 pt-4 mt-4 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">発行協力店舗 / 公式特約店</span>
                <p className="text-lg font-black text-slate-900">{store.shop_name}</p>
                <p className="text-[10px] text-slate-600">店頭限定紹介コード: <span className="font-mono font-bold text-slate-900">{store.referral_code}</span></p>
              </div>

              <div className="text-right">
                <div className="inline-block border border-slate-300 rounded px-2 py-1 bg-slate-100 text-[9px] font-bold text-slate-600">
                  企画・運営: 輝旅 島専科 事務局
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
