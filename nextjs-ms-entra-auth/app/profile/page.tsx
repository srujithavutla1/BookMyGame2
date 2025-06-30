// app/profile/page.tsx
"use client";
import LogoutButton from '@/app/components/LogoutButton';
import { useAuth } from '../context/AuthContext';

function Profile() {

  const { user, isLoading } = useAuth();
  //console.log(user);
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Not logged in</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-[90vh]">
      <div className="p-5 shadow-2xl rounded-md min-w-[30%] max-w-[50%] flex gap-5 flex-col items-center">
        <div className="w-20 h-20 rounded-full border border-yellow-500 shadow-md bg-green-600 flex items-center justify-center">
          {user?.email?.charAt(0).toUpperCase()}
          {user?.email?.split('.')[1]?.charAt(0).toUpperCase()}
        </div>
        <div className="text-center text-sm">
         <p>{user.email.split('@')[0].split('.')[0]} {user.email.split('@')[0].split('.')[1]}</p>
          <p>{user?.email}</p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}

export default Profile;