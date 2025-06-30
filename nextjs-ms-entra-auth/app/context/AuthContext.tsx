// context/AuthContext.tsx
"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  userId: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  checkAuth: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/auth/profile', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        console.log(userData);
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


// // context/AuthContext.tsx
// "use client";
// import { createContext, useContext, useEffect, useState, useCallback } from 'react';
// import { useRouter } from 'next/navigation';

// interface User {
//   userId: string;
//   name: string;
//   email: string;
// }

// interface AuthContextType {
//   user: User | null;
//   isLoading: boolean;
//   isAuthenticated: boolean;
//   checkAuth: () => Promise<boolean>;
// }

// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   isLoading: true,
//   isAuthenticated: false,
//   checkAuth: async () => false,
// });

// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const router = useRouter();

//   const checkAuth = useCallback(async (): Promise<boolean> => {
//     setIsLoading(true);
//     try {
//       const response = await fetch('http://localhost:3001/auth/profile', {
//         credentials: 'include',
//       });

//       if (response.ok) {
//         const userData = await response.json();
//         setUser(userData);
//         setIsAuthenticated(true);
//         return true;
//       } else {
//         setUser(null);
//         setIsAuthenticated(false);
//         return false;
//       }
//     } catch (error) {
//       console.error('Auth check failed:', error);
//       setUser(null);
//       setIsAuthenticated(false);
//       return false;
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     // Initial auth check when component mounts
//     checkAuth();
//   }, [checkAuth]);

//   return (
//     <AuthContext.Provider value={{ user, isLoading, isAuthenticated, checkAuth }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);