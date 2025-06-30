// utils/auth.ts
export async function verifyToken(token: string) {
  try {
    const response = await fetch('http://localhost:3001/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error('Token verification failed');
    return await response.json();
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}