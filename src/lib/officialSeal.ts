/**
 * KIRATABI SHIMASENKA 公式公印・海事公証紋章 描画エンジン
 * - drawOfficialSquareHanko: 伝統二重枠・縦組み3列12文字の本朱官印（「輝旅島専 / 公式到達 / 認定之印」）
 * - drawOfficialMedallionSeal: 40稜ギザ金縁・円弧刻印・八芒羅針盤入りの公式海事公証丸印
 */

export interface SquareHankoOptions {
  /** 背景が暗い場合に朱肉の発色を保つ薄い和紙下地を敷くか */
  onDarkBackground?: boolean;
  /** 傾き角度（ラジアン）。デフォルトは手押し感のある -0.032 rad (-1.8度) */
  rotationRad?: number;
}

/**
 * 伝統的な官印・御朱印様式の二重角枠・縦書き3列本朱公印を描画する
 * 印文（右から左へ縦組み）:
 *   右列: 輝 旅 島 専
 *   中列: 公 式 到 達
 *   左列: 認 定 之 印
 */
export function drawOfficialSquareHanko(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  options: SquareHankoOptions = {}
) {
  const { onDarkBackground = true, rotationRad = -0.032 } = options;
  const half = size / 2;
  const vermilion = '#D62828';
  const vermilionDeep = '#B91C1C';
  const vermilionBright = '#EF4444';

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotationRad);

  // 暗い背景上でも本朱色が沈まず鮮明に映えるよう、極薄の鳥の子和紙調スタンプ下地と微細なドロップシャドウを付与
  if (onDarkBackground) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.38)';
    ctx.shadowBlur = size * 0.08;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = size * 0.02;
    ctx.fillStyle = 'rgba(255, 250, 240, 0.94)';
    ctx.beginPath();
    ctx.roundRect(-half - size * 0.03, -half - size * 0.03, size * 1.06, size * 1.06, size * 0.05);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(255, 252, 245, 0.45)';
    ctx.beginPath();
    ctx.roundRect(-half, -half, size, size, size * 0.035);
    ctx.fill();
  }

  // 1. 外太枠（柘植・石印の面取り角丸）
  const outerStroke = Math.max(2.5, size * 0.052);
  ctx.strokeStyle = vermilion;
  ctx.lineWidth = outerStroke;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.roundRect(
    -half + outerStroke / 2,
    -half + outerStroke / 2,
    size - outerStroke,
    size - outerStroke,
    size * 0.035
  );
  ctx.stroke();

  // 2. 内細枠（二重印枠）
  const innerInset = size * 0.095;
  const innerSize = size - innerInset * 2;
  const innerStroke = Math.max(1.2, size * 0.018);
  ctx.strokeStyle = vermilionDeep;
  ctx.lineWidth = innerStroke;
  ctx.strokeRect(-half + innerInset, -half + innerInset, innerSize, innerSize);

  // 3. 縦二本の界線（3列分割）
  const colW = innerSize / 3;
  ctx.lineWidth = Math.max(1, size * 0.013);
  ctx.strokeStyle = 'rgba(185, 28, 28, 0.72)';
  for (let c = 1; c <= 2; c++) {
    const lx = -half + innerInset + colW * c;
    ctx.beginPath();
    ctx.moveTo(lx, -half + innerInset + size * 0.02);
    ctx.lineTo(lx, half - innerInset - size * 0.02);
    ctx.stroke();
  }

  // 4. 縦書き3列×4文字の印文（右列→中列→左列）
  // 右列: 輝旅島専 / 中列: 公式到達 / 左列: 認定之印
  const columns = [
    ['認', '定', '之', '印'], // 左列 (col index 0)
    ['公', '式', '到', '達'], // 中列 (col index 1)
    ['輝', '旅', '島', '専'], // 右列 (col index 2)
  ];

  const rowH = innerSize / 4;
  const fontSize = Math.round(size * 0.175);
  ctx.fillStyle = vermilionDeep;
  ctx.font = `900 ${fontSize}px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let colIdx = 0; colIdx < 3; colIdx++) {
    const colCenterX = -half + innerInset + colW * (colIdx + 0.5);
    const chars = columns[colIdx];
    for (let rowIdx = 0; rowIdx < 4; rowIdx++) {
      const rowCenterY = -half + innerInset + rowH * (rowIdx + 0.5) + size * 0.006;
      // 篆刻の太みと重厚感を出す二重描画
      ctx.fillStyle = vermilion;
      ctx.fillText(chars[rowIdx], colCenterX, rowCenterY);
      ctx.strokeStyle = vermilionDeep;
      ctx.lineWidth = Math.max(0.4, size * 0.006);
      ctx.strokeText(chars[rowIdx], colCenterX, rowCenterY);
    }
  }

  // 5. 朱肉の自然な押印かすれ粒子（決定論的シード配置で再描画時もブレない）
  const speckColor = onDarkBackground ? 'rgba(255, 250, 240, 0.28)' : 'rgba(252, 227, 182, 0.32)';
  ctx.fillStyle = speckColor;
  for (let i = 0; i < 26; i++) {
    const sx = Math.sin(i * 37.3) * (half * 0.88);
    const sy = Math.cos(i * 53.7) * (half * 0.88);
    const sr = ((i % 3) + 1) * (size * 0.006);
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 外枠の微細な朱光沢ハイライト
  ctx.strokeStyle = vermilionBright;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1;
  ctx.strokeRect(-half + innerInset - 1.5, -half + innerInset - 1.5, innerSize + 3, innerSize + 3);

  ctx.restore();
}

export interface MedallionSealOptions {
  /** 'gold' (金箔エンボス公証印) | 'crimson' (深紅×金縁メダリオン公証印) */
  variant?: 'gold' | 'crimson';
}

/**
 * 円弧に沿って1文字ずつ均等配置で文字列を描画するヘルパー
 */
function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  radius: number,
  startAngle: number,
  endAngle: number,
  isBottom: boolean
) {
  const chars = Array.from(text);
  if (chars.length === 0) return;
  const totalSpan = endAngle - startAngle;
  const step = chars.length > 1 ? totalSpan / (chars.length - 1) : 0;

  for (let i = 0; i < chars.length; i++) {
    const angle = startAngle + step * i;
    ctx.save();
    ctx.rotate(angle);
    if (isBottom) {
      ctx.translate(0, radius);
    } else {
      ctx.translate(0, -radius);
    }
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
  }
}

/**
 * 40稜ギザ菊花型エッジ・二重同心円・円弧刻印・八芒羅針盤を備えた公式海事公証丸印
 */
export function drawOfficialMedallionSeal(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  options: MedallionSealOptions = {}
) {
  const { variant = 'gold' } = options;

  ctx.save();
  ctx.translate(centerX, centerY);

  // 1. ドロップシャドウ
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, radius * 0.04, radius * 0.98, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();
  ctx.restore();

  // 2. 40稜ギザ菊花型公証エッジ（Serrated Notary Rosette）
  const teeth = 40;
  const outerR = radius;
  const innerToothR = radius * 0.93;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerToothR;
    const angle = (i * Math.PI) / teeth;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  const bodyGrad = ctx.createRadialGradient(
    -radius * 0.25,
    -radius * 0.25,
    radius * 0.1,
    0,
    0,
    radius
  );
  if (variant === 'crimson') {
    bodyGrad.addColorStop(0, '#DC2626');
    bodyGrad.addColorStop(0.55, '#991B1B');
    bodyGrad.addColorStop(1, '#650A0A');
  } else {
    bodyGrad.addColorStop(0, '#FEF3C7');
    bodyGrad.addColorStop(0.35, '#D4AF37');
    bodyGrad.addColorStop(0.78, '#9A6E12');
    bodyGrad.addColorStop(1, '#6B4808');
  }
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  ctx.strokeStyle = variant === 'crimson' ? '#F3E5AB' : '#FEF3C7';
  ctx.lineWidth = Math.max(1.2, radius * 0.025);
  ctx.stroke();

  // 3. 外周リング＆内周リング（円弧文字バンド）
  const ringOuterR = radius * 0.86;
  const ringInnerR = radius * 0.58;

  // バンド部分の濃紺/深紅コントラスト帯
  ctx.beginPath();
  ctx.arc(0, 0, ringOuterR, 0, Math.PI * 2);
  ctx.fillStyle = variant === 'crimson' ? '#7F1D1D' : '#162033';
  ctx.fill();

  ctx.strokeStyle = '#F3E5AB';
  ctx.lineWidth = Math.max(1.5, radius * 0.028);
  ctx.stroke();

  // 内円プレート
  const centerGrad = ctx.createRadialGradient(0, 0, radius * 0.05, 0, 0, ringInnerR);
  if (variant === 'crimson') {
    centerGrad.addColorStop(0, '#B91C1C');
    centerGrad.addColorStop(1, '#7F1D1D');
  } else {
    centerGrad.addColorStop(0, '#FDE68A');
    centerGrad.addColorStop(0.6, '#D4AF37');
    centerGrad.addColorStop(1, '#A17415');
  }
  ctx.beginPath();
  ctx.arc(0, 0, ringInnerR, 0, Math.PI * 2);
  ctx.fillStyle = centerGrad;
  ctx.fill();
  ctx.strokeStyle = '#FEF3C7';
  ctx.lineWidth = Math.max(1.2, radius * 0.024);
  ctx.stroke();

  // 4. 上下円弧刻印 (KIRATABI OFFICIAL / VERIFIED ARRIVAL — 左右の★と一切重ならない±72度アーク)
  const arcTextR = (ringOuterR + ringInnerR) / 2;
  ctx.fillStyle = '#F3E5AB';
  ctx.font = `bold ${Math.max(6, Math.round(radius * 0.112))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 上部アーク (-74 deg to +74 deg around 12 o'clock)
  drawArcText(ctx, 'KIRATABI OFFICIAL', arcTextR, -Math.PI * 0.41, Math.PI * 0.41, false);
  // 下部アーク (+70 deg to -70 deg around 6 o'clock, 左から右へ正立)
  drawArcText(ctx, 'VERIFIED ARRIVAL', arcTextR, Math.PI * 0.39, -Math.PI * 0.39, true);

  // 左右水平位置（9時・3時）の星飾り
  ctx.font = `bold ${Math.max(7, Math.round(radius * 0.13))}px serif`;
  ctx.fillText('★', -arcTextR, 0);
  ctx.fillText('★', arcTextR, 0);

  // 5. 中央の八芒羅針盤レリーフ
  ctx.save();
  const compR = ringInnerR * 0.82;
  ctx.strokeStyle = variant === 'crimson' ? 'rgba(254, 243, 199, 0.35)' : 'rgba(22, 32, 51, 0.25)';
  ctx.fillStyle = variant === 'crimson' ? 'rgba(254, 243, 199, 0.2)' : 'rgba(22, 32, 51, 0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 4);
    const len = i % 2 === 0 ? compR : compR * 0.68;
    const hw = i % 2 === 0 ? radius * 0.07 : radius * 0.04;
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

  // 6. 中央銘板テキスト（「公認之証」）
  const textDark = variant === 'crimson' ? '#FEF3C7' : '#1E293B';
  ctx.fillStyle = textDark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(7, Math.round(radius * 0.14))}px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif`;
  ctx.fillText('離島到達', 0, -radius * 0.15);
  ctx.font = `900 ${Math.max(10, Math.round(radius * 0.22))}px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif`;
  ctx.fillText('公認之証', 0, radius * 0.08);

  ctx.restore();
}
