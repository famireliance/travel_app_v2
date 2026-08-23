export const dynamic = 'force-dynamic';
import fs from 'fs';
import path from 'path';
import FairyGalleryClient from './components/FairyGalleryClient';

export default function FairyGallery() {
  const fairiesDir = path.join(process.cwd(), 'public', 'fairies');
  let files: string[] = [];
  
  try {
    if (fs.existsSync(fairiesDir)) {
      files = fs.readdirSync(fairiesDir);
    }
  } catch (err) {
    console.error('Error reading fairies directory:', err);
  }

  // Filter only images
  const discoveredImages = files.filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <FairyGalleryClient discoveredImages={discoveredImages} />
    </div>
  );
}
