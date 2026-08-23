const fs = require('fs');
const file = 'src/app/kira-system-panel-9f2/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add the button to the sidebar
content = content.replace(
  /<button \n *onClick=\{\(\) => setActiveTab\('coupons'\)\}/,
  `<button 
            onClick={() => setActiveTab('newsletter')}
            className={\`w-full text-left px-4 py-2 rounded transition-colors \${activeTab === 'newsletter' ? 'bg-amber-600 text-white' : 'hover:bg-gray-700'}\`}
          >
            📧 メルマガ配信
          </button>
          <button 
            onClick={() => setActiveTab('coupons')}`
);

// Render the component
content = content.replace(
  /\{activeTab === 'coupons' && \([\s\S]*?\)\}/,
  `{activeTab === 'coupons' && (
            <div className="space-y-6">
              <AdminPromoCodes />
              <AdminCoupons />
            </div>
          )}
          {activeTab === 'newsletter' && (
            <AdminNewsletter adminPassword={password} />
          )}`
);

fs.writeFileSync(file, content);
