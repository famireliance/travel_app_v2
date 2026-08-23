const fs = require('fs');
const file = 'src/app/kira-system-panel-9f2/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import
content = content.replace(
  "import AdminPromoCodes from '@/components/admin/AdminPromoCodes';",
  "import AdminPromoCodes from '@/components/admin/AdminPromoCodes';\nimport AdminNewsletter from '@/components/admin/AdminNewsletter';"
);

// Add Tab State
content = content.replace(
  "const [activeTab, setActiveTab] = useState('islands');",
  "const [activeTab, setActiveTab] = useState('islands');" // just checking it exists, maybe it is 'islands' or something else.
);
// Let's actually check what the tabs are.
