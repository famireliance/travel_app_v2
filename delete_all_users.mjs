import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = fs.readFileSync('.env.local', 'utf8')
const getEnv = (key) => env.split('\n').find(line => line.startsWith(key))?.split('=')[1]?.trim()
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  if (error) { console.error("Error listing:", error); return; }
  
  console.log(`Found ${users.length} users. Deleting...`)
  for (const user of users) {
    await supabase.auth.admin.deleteUser(user.id)
    console.log(`Deleted ${user.email}`)
  }
}
run()
