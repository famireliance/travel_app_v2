'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoStayPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/islands');
  }, [router]);

  return null;
}
