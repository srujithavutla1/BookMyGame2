// app/profile/page.tsx
"use client";
import LogoutButton from '@/app/components/LogoutButton';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

function Profile() {
  const { user, isLoading } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      // Here you would typically call an API to change the password
      // For example:
      // await changePassword(user.email, oldPassword, newPassword);
      // For now, we'll just simulate a success
      setSuccess("Password changed successfully!");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError("Failed to change password. Please check your old password.");
    }
  };

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
        <div className="flex gap-3">
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Change Password
          </button>
          <LogoutButton />
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Change Password</h2>
            
            {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
            {success && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{success}</div>}
            
            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="oldPassword">
                  Old Password
                </label>
                <input
                  type="password"
                  id="oldPassword"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;