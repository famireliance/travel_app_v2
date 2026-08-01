const fs = require('fs');
const filePath = 'src/context/TravelContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the updateTravelerName function
const target = `      const currentUser = session?.user || null;
      setUser(currentUser);
      loadLocalData(currentUser?.id, isMounted);
    });

    return () => {`;

const replacement = `      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser && _event === 'SIGNED_IN') {
        try {
          supabase.from('user_profiles').select('nickname').eq('id', currentUser.id).single().then(({data}) => {
             if (data && data.nickname && isMounted) {
               setTravelerName(data.nickname);
               localStorage.setItem('kiratabi_traveler_name', data.nickname);
             }
          });
        } catch(e) {}
      }

      loadLocalData(currentUser?.id, isMounted);
    });

    return () => {`;

if(content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content);
  console.log("Updated traveler name logic on state change");
} else {
  console.log("Could not find the target string.");
}
