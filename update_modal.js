const fs = require('fs');
const file = 'src/components/CertificateModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add digitalType to state
content = content.replace(
  "const [hasIssuedToday, setHasIssuedToday] = useState(false);",
  "const [hasIssuedToday, setHasIssuedToday] = useState(false);\n  const [digitalType, setDigitalType] = useState<'card' | 'high_quality'>('card');\n  const [limitReachedError, setLimitReachedError] = useState(false);\n  const [limitErrorMessage, setLimitErrorMessage] = useState('');"
);

// 2. Change issueDigital to send digitalType
content = content.replace(
  "body: JSON.stringify({ islandId: island.id, userId: user.id })",
  "body: JSON.stringify({ islandId: island.id, userId: user.id, type: digitalType })"
);

content = content.replace(
  "const handleDigitalIssueClick = () => {",
  "const handleDigitalIssueClick = (type: 'card' | 'high_quality') => {\n    setDigitalType(type);\n    setIsPlayingAd(true);\n    setAdTimeLeft(2);\n  };\n\n  const unusedOldHandle = () => {"
);

content = content.replace(
  "if (data.error === 'FREE_LIMIT_REACHED') {",
  "if (data.error === 'FREE_LIMIT_REACHED' || data.error === 'PREMIUM_LIMIT_REACHED') {\n            setLimitReachedError(true);\n            setLimitErrorMessage(data.message);\n            return;\n          }\n          if (data.error === 'FREE_LIMIT_REACHED') {"
);

// 3. Change handleDownload to scale differently based on type
content = content.replace(
  "const handleDownload = async () => {\n    const canvas = canvasRef.current;\n    if (!canvas) return;\n    try {\n      canvas.toBlob((blob) => {",
  "const handleDownload = async () => {\n    const canvas = canvasRef.current;\n    if (!canvas) return;\n    try {\n      const scale = digitalType === 'high_quality' ? 4 : 1.5;\n      const tmpCanvas = document.createElement('canvas');\n      tmpCanvas.width = canvas.width * scale;\n      tmpCanvas.height = canvas.height * scale;\n      const tmpCtx = tmpCanvas.getContext('2d');\n      if(tmpCtx) {\n        tmpCtx.scale(scale, scale);\n        tmpCtx.drawImage(canvas, 0, 0);\n        tmpCanvas.toBlob((blob) => {"
);

// 4. Close the tmpCtx bracket if needed. Let's just use regex replace.
