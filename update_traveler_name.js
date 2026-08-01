const fs = require('fs');
const filePath = 'src/context/TravelContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the updateTravelerName function
const target = `  const updateTravelerName = (name: string) => {
    setTravelerName(name);
    localStorage.setItem('kiratabi_traveler_name', name);
  };`;

const replacement = `  const updateTravelerName = async (name: string) => {
    setTravelerName(name);
    localStorage.setItem('kiratabi_traveler_name', name);
    if (user) {
      try {
        await supabase.from('user_profiles').upsert({ id: user.id, nickname: name, email: user.email });
      } catch(e) { console.error('Failed to update nickname in DB', e); }
    }
  };`;

if(content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content);
  console.log("Updated traveler name logic");
} else {
  console.log("Could not find the target string.");
}
