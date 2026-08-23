const fs = require('fs');
const file = 'src/app/kira-system-panel-9f2/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import
content = content.replace(
  "import AdminCoupons from '@/components/admin/AdminCoupons';",
  "import AdminCoupons from '@/components/admin/AdminCoupons';\nimport AdminPromoCodes from '@/components/admin/AdminPromoCodes';"
);

// Render AdminPromoCodes inside the Coupons tab
content = content.replace(
  /<AdminCoupons \/>/g,
  "<div className=\"space-y-6\">\n              <AdminPromoCodes />\n              <AdminCoupons />\n            </div>"
);

fs.writeFileSync(file, content);
