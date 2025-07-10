// app/login/success/page.tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function LoginSuccess() {
  const router = useRouter();

  useEffect(() => {
      router.push('/BookMyGame');
  
   }, [router]);

  return <div>Login successful, redirecting...</div>;
}

