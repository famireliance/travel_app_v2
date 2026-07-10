const path = require('path');
const { execSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const rawDir = '/Users/moritamasashi/Desktop/travel_app_v2/public/raw_media';
const outDir = '/Users/moritamasashi/Desktop/travel_app_v2/public/hero';

const videos = [
  { inName: 'IMG_3531.mov', outName: 'slide20.mp4' },
  { inName: 'dji_fly_20260508_112516_0256_1778249616873_video 2.mp4', outName: 'slide21.mp4' }
];

console.log("Re-encoding videos for universal browser compatibility...");
for (const vid of videos) {
  const inPath = path.join(rawDir, vid.inName);
  const outPath = path.join(outDir, vid.outName);
  try {
    console.log(`Processing ${vid.inName}...`);
    // Added -pix_fmt yuv420p which is CRITICAL for web video compatibility (H264 on Safari/iOS)
    execSync(`"${ffmpeg}" -y -i "${inPath}" -vf "scale=-2:1080" -vcodec libx264 -pix_fmt yuv420p -preset veryfast -crf 28 -an "${outPath}"`);
    console.log(`Successfully encoded ${vid.outName}`);
  } catch (err) {
    console.error(`Failed to encode ${vid.inName}:`, err.message);
  }
}
console.log("Done!");
