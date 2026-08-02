import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const getEnv = (key) => env.split('\n').find(line => line.startsWith(key))?.split('=')[1]?.trim()

const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))

async function check() {
  const { data: users, error } = await supabase.auth.admin.listUsers()
  if (error) console.error(error)
  else {
    const recent = users.users.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,3)
    console.log("Recent users:")
    recent.forEach(u => console.log(`- ${u.email} (Created: ${u.created_at}, Confirmed: ${u.email_confirmed_at})`))
  }
}
check()
