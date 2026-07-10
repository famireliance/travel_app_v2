const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const projectRoot = '/Users/moritamasashi/Desktop/travel_app_v2';
const rawDir = path.join(projectRoot, 'public/raw_media');
const outDir = path.join(projectRoot, 'public/hero');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Media list (derived from EXIF research)
const mediaList = [
  { file: '3118204C279964CA590ED81A67A3C906.JPG', loc: '小笠原諸島 (東京都)', title: ['ボニンブルーの海に、', '心を預けて。'] },
  { file: '432C7D0934DF14B881626B1F228720B8.JPG', loc: '竹富島 (沖縄県)', title: ['太古の森と、', '深く呼吸する。'] },
  { file: 'IMG_0458.JPG', loc: '小笠原諸島 (東京都)', title: ['南国の風が、', '木々を揺らす。'] },
  { file: 'IMG_0501.JPG', loc: '小笠原諸島 (東京都)', title: ['どこまでも続く、', 'エメラルドの輝き。'] },
  { file: 'IMG_0552.JPG', loc: '小笠原諸島 (東京都)', title: ['白い砂浜に、', '足跡を刻む。'] },
  { file: 'IMG_0860.HEIC', loc: '与那国島 (沖縄県)', title: ['最西端の海風を、', '全身で感じる。'] },
  { file: 'IMG_1105.HEIC', loc: '与那国島 (沖縄県)', title: ['荒々しい断崖が、', '力強さを語る。'] },
  { file: 'IMG_1324.jpg', loc: '与那国島 (沖縄県)', title: ['満天の星と、', '静寂に包まれて。'] },
  { file: 'IMG_1596.JPG', loc: '宮古島 (沖縄県)', title: ['茜色に染まる、', '奇跡の瞬間。'] },
  { file: 'IMG_1890.JPG', loc: '粟国島 (沖縄県)', title: ['島時間が紡ぐ、', '懐かしい記憶。'] },
  { file: 'IMG_2852.JPG', loc: '小笠原諸島 (東京都)', title: ['透明な海中を、', '自由に泳ぐ。'] },
  { file: 'IMG_3067.jpg', loc: '宮古島 (沖縄県)', title: ['青のグラデーションに、', 'ただ見惚れる。'] },
  { file: 'IMG_3461.DNG', loc: '小笠原諸島 (東京都)', title: ['夕闇が包む、', '静寂の海辺。'] },
  { file: 'IMG_3639.jpeg', loc: '宮古島 (沖縄県)', title: ['白い砂と青い海、', '完璧なコントラスト。'] },
  { file: 'IMG_7293.jpeg', loc: '宮古島 (沖縄県)', title: ['宮古ブルーに、', 'すべてを忘れて。'] },
  { file: 'IMG_7353.jpeg', loc: '宮古島 (沖縄県)', title: ['橋が繋ぐ、', 'もうひとつの楽園。'] },
  { file: 'dji_fly_20260420_154632_0961_1776684656864_photo.JPG', loc: '小笠原諸島 (東京都)', title: ['鳥の目線で、', '絶景を見下ろす。'] },
  { file: 'dji_fly_20260507_113312_0813_1778156375359_photo.jpg', loc: '宮古島 (沖縄県)', title: ['まだ見ぬ青を、', '探す旅へ。'] },
  { file: 'dji_fly_20260507_113806_0818_1778155991417_photo.jpg', loc: '宮古島 (沖縄県)', title: ['サンゴ礁の海に、', '息を呑む。'] },
  { file: 'IMG_3531.mov', loc: '宮古島 (沖縄県)', title: ['揺れる波音が、', '心を癒やす。'] },
  { file: 'dji_fly_20260508_112516_0256_1778249616873_video 2.mp4', loc: '宮古島 (沖縄県)', title: ['海の上を飛ぶ、', '圧倒的な解放感。'] }
];

async function processAll() {
  const slidesConfig = [];
  
  for (let i = 0; i < mediaList.length; i++) {
    const item = mediaList[i];
    const inPath = path.join(rawDir, item.file);
    const ext = path.extname(item.file).toLowerCase();
    
    if (!fs.existsSync(inPath)) {
      console.log(`Skipping ${item.file}, not found`);
      continue;
    }

    // Video processing
    if (ext === '.mov' || ext === '.mp4') {
      const outName = `slide${i + 1}.mp4`;
      const outPath = path.join(outDir, outName);
      console.log(`Converting video ${item.file}...`);
      try {
        // compress, resize to 1080p, remove audio
        execSync(`"${ffmpeg}" -y -i "${inPath}" -vf "scale=-2:1080" -vcodec libx264 -preset veryfast -crf 28 -an "${outPath}"`);
        slidesConfig.push({
          type: 'video',
          src: `/hero/${outName}`,
          title: item.title,
          location: item.loc
        });
      } catch (err) {
        console.error(`Error converting video ${item.file}:`, err.message);
      }
    } 
    // Image processing
    else {
      let processPath = inPath;
      const outName = `slide${i + 1}.webp`;
      const outPath = path.join(outDir, outName);
      
      // Convert HEIC or DNG to temporary JPG using macOS sips
      if (ext === '.heic' || ext === '.dng') {
        processPath = path.join(rawDir, `temp_${i}.jpg`);
        console.log(`Converting ${item.file} to temporary JPG...`);
        execSync(`sips -s format jpeg "${inPath}" --out "${processPath}"`);
      }

      console.log(`Processing image ${item.file}...`);
      try {
        await sharp(processPath)
          .rotate() // auto-orient based on EXIF
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outPath);
          
        slidesConfig.push({
          type: 'image',
          src: `/hero/${outName}`,
          title: item.title,
          location: item.loc
        });
      } catch (err) {
        console.error(`Error processing image ${item.file}:`, err.message);
      }
      
      // cleanup temp
      if (processPath !== inPath && fs.existsSync(processPath)) {
        fs.unlinkSync(processPath);
      }
    }
  }

  // Write JSON
  const jsonPath = path.join(projectRoot, 'src/data/hero_slides.json');
  fs.writeFileSync(jsonPath, JSON.stringify(slidesConfig, null, 2));
  console.log(`Generated ${jsonPath}`);
}

processAll().catch(console.error);
