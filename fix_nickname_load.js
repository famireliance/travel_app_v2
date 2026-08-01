const fs = require('fs');
const filePath = 'src/context/TravelContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// target to replace
const target = `    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      const currentUser = session?.user || null;
      setUser(currentUser);
      loadLocalData(currentUser?.id, isMounted);
    });`;

const replacement = `    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      // ユーザーのニックネームをSupabaseから取得
      if (currentUser) {
        try {
          const { data, error } = await supabase.from('user_profiles').select('nickname').eq('id', currentUser.id).single();
          if (data && data.nickname && isMounted) {
            setTravelerName(data.nickname);
            localStorage.setItem('kiratabi_traveler_name', data.nickname);
          }
        } catch(e) {}
      }

      loadLocalData(currentUser?.id, isMounted);
    });`;

if(content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content);
  console.log("Updated traveler name load logic on auth");
} else {
  console.log("Could not find the target string.");
}
