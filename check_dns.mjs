import dns from 'dns/promises';

async function check() {
  try {
    const res = await dns.lookup('lpuxsjpdenrwzyxfnggo.supabase.co');
    console.log('DNS lookup success:', res);
  } catch (err) {
    console.error('DNS lookup error:', err.message);
  }
}

check();
