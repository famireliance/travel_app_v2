const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

async function renderCertificate(orientation, outputPath) {
  const isVert = orientation === 'vertical';
  const width = isVert ? 1080 : 1414;
  const height = isVert ? 1920 : 1000;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const travelerName = '山田 太郎';
  const islandName = '石垣島';
  const regionId = '八重山諸島';
  const visitDate = '2026.08.28';
  const difficultyStars = '⛵ 風そよぐ沿岸島 (★2)';
  const displaySerial = 'KT-2026-ISHI-No.0042';

  // 1. Rich Dark Radial Gradient Background
  const grad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, Math.max(width, height));
  grad.addColorStop(0, '#1E293B');
  grad.addColorStop(0.65, '#0F172A');
  grad.addColorStop(1, '#080C14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Nautical Compass Rose Watermark
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.04)';
  ctx.lineWidth = 2.5;
  const r = Math.min(width, height) * 0.35;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const len = i % 2 === 0 ? r * 1.14 : r * 0.82;
    const hw = i % 2 === 0 ? 16 : 8;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.lineTo(hw, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // 3. Glowing Gold Stardust Dust Particles
  ctx.fillStyle = 'rgba(243, 229, 171, 0.16)';
  for (let i = 0; i < 85; i++) {
    const px = Math.sin(i * 19) * width * 0.46 + width / 2;
    const py = Math.cos(i * 29) * height * 0.46 + height / 2;
    const psize = (i % 3) + 1.5;
    ctx.beginPath();
    ctx.arc(px, py, psize, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Multi-Layered Gold Metallic Outer Frames
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 14;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  ctx.strokeStyle = '#F3E5AB';
  ctx.lineWidth = 3;
  ctx.strokeRect(44, 44, width - 88, height - 88);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(52, 52, width - 104, height - 104);

  // 5. Baroque Gold Corner Filigree Ornaments (四隅のアラベスク彫刻)
  const cornerFiligree = (cxAngle, cyAngle, rot) => {
    ctx.save();
    ctx.translate(cxAngle, cyAngle);
    ctx.rotate(rot);
    ctx.strokeStyle = '#D4AF37';
    ctx.fillStyle = '#F3E5AB';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(0, 0, 55, 0, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 64, 0, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(36, 36, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(20, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 20, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  cornerFiligree(52, 52, 0);
  cornerFiligree(width - 52, 52, Math.PI / 2);
  cornerFiligree(width - 52, height - 52, Math.PI);
  cornerFiligree(52, height - 52, (Math.PI * 3) / 2);

  const primaryColor = '#F3E5AB';
  const secondaryColor = '#94A3B8';
  const accentColor = '#D4AF37';
  const cx = width / 2;

  if (isVert) {
    // 📱 【縦型 9:16 (1080 x 1920 px) 縦写真に完全同調する大きな縦型フォトフレーム】
    ctx.textAlign = 'center';

    ctx.fillStyle = secondaryColor;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('VERIFIED RECORD OF ARRIVAL', cx, 160);

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 64px serif';
    ctx.fillText('島 旅 到 達 公 認 証', cx, 240);

    const nameY = 390;
    ctx.fillStyle = 'rgba(128, 128, 128, 0.14)';
    ctx.fillRect(cx - 360, nameY - 45, 720, 80);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 360, nameY - 45, 720, 80);
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 52px serif';
    ctx.fillText(travelerName + ' 殿', cx, nameY + 12);

    const infoY = 540;
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`【 到達島 】 ${islandName} (${regionId})`, cx, infoY);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`【 冒険難易度 】 ${difficultyStars}`, cx, infoY + 55);

    ctx.fillStyle = secondaryColor;
    ctx.font = '26px monospace';
    ctx.fillText(`DATE OF ARRIVAL: ${visitDate}`, cx, infoY + 110);

    // 縦写真と同サイズ（760 x 1020 px）のダイナミック縦長額縁
    const heroW = 760;
    const heroH = 1020;
    const heroX = cx - heroW / 2;
    const heroY = 710;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(heroX, heroY, heroW, heroH);

    // Ornate Double Gold Photo Frame
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(heroX, heroY, heroW, heroH);

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(heroX - 8, heroY - 8, heroW + 16, heroH + 16);

    ctx.fillStyle = '#F3E5AB';
    ctx.font = 'bold 34px serif';
    ctx.fillText('［ 縦写真と完全に同サイズの縦長フォトフレーム ］', cx, heroY + heroH / 2);

    // Seal Stamp
    const sealX = width - 180;
    const sealY = height - 170;
    const sealRadius = 75;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#E11D48';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#E11D48';
    ctx.font = 'bold 24px serif';
    ctx.fillText('KIRATABI', sealX, sealY - 14);
    ctx.font = 'bold 28px serif';
    ctx.fillText('公認証明', sealX, sealY + 20);

    // Serial
    ctx.textAlign = 'left';
    ctx.fillStyle = secondaryColor;
    ctx.font = '24px monospace';
    ctx.fillText(`SERIAL: ${displaySerial}`, 90, height - 70);

  } else {
    // 📄 【横型 A4 1.414:1 (1414 x 1000 px) 豪華バロックデザイン】
    ctx.textAlign = 'center';

    ctx.fillStyle = secondaryColor;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('VERIFIED RECORD OF ARRIVAL', cx, 110);

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 52px serif';
    ctx.fillText('島 旅 到 達 公 認 証', cx, 180);

    const nameY = 300;
    ctx.fillStyle = 'rgba(128, 128, 128, 0.14)';
    ctx.fillRect(cx - 300, nameY - 38, 600, 68);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 300, nameY - 38, 600, 68);
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 44px serif';
    ctx.fillText(travelerName + ' 殿', cx, nameY + 10);

    const infoY = 410;
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`【 到達島 】 ${islandName} (${regionId})`, cx, infoY);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`【 冒険難易度 】 ${difficultyStars}`, cx, infoY + 45);

    ctx.fillStyle = secondaryColor;
    ctx.font = '20px monospace';
    ctx.fillText(`DATE OF ARRIVAL: ${visitDate}`, cx, infoY + 88);

    // Photo Frame
    const heroW = 640;
    const heroH = 330;
    const heroX = cx - heroW / 2;
    const heroY = 560;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(heroX, heroY, heroW, heroH);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(heroX, heroY, heroW, heroH);

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.strokeRect(heroX - 6, heroY - 6, heroW + 12, heroH + 12);

    ctx.fillStyle = '#F3E5AB';
    ctx.font = 'bold 24px serif';
    ctx.fillText('［ 旅人が撮影した現地写真 ］', cx, heroY + heroH / 2);

    // Seal Stamp
    const sealX = width - 180;
    const sealY = height - 160;
    const sealRadius = 65;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#E11D48';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#E11D48';
    ctx.font = 'bold 18px serif';
    ctx.fillText('KIRATABI', sealX, sealY - 12);
    ctx.font = 'bold 22px serif';
    ctx.fillText('公認証明', sealX, sealY + 14);

    // Serial
    ctx.textAlign = 'left';
    ctx.fillStyle = secondaryColor;
    ctx.font = '18px monospace';
    ctx.fillText(`SERIAL: ${displaySerial}`, 80, height - 60);
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Saved tall vertical frame certificate to ${outputPath} (${width}x${height})`);
}

async function main() {
  const artifactsDir = '/Users/masahito/.gemini/antigravity/brain/a7d0792b-4fa3-46d4-ae26-b7b7d3e287b4';
  await renderCertificate('vertical', path.join(artifactsDir, 'tall_vertical_smartphone_9_16.png'));
}

main().catch(console.error);
