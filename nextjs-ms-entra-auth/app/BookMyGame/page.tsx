"use client"
import { Suspense, useEffect, useState } from 'react'
import Navbar from "../components/layout/Navbar";
import UserStats from "../components/dashboard/UserStats";
import GameCard from "../components/dashboard/GameCard";
import { isWithinAllowedHours } from "../utils/date";
import { getGames } from "../services/gameService";
import { getUserByEmail } from "../services/userService";
import GameCardSkeleton from './GameCardSkeleton';
import UserStatsSkeleton from './UserStatsSkeleton';
import { redirect } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  
  const isAllowedTime = isWithinAllowedHours();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {user?.email.split('@')[0].split('.')[0]} {user?.email.split('@')[0].split('.')[1]}
          </h1>
          <p className="text-gray-600">{user?.email}</p>
          
          <Suspense fallback={<UserStatsSkeleton />}>
            <UserStatsWrapper email={user?.email!} />
          </Suspense>

          {!isAllowedTime && (
            <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
              <p>Games can only be booked between 9 AM and 9 PM IST.</p>
            </div>
          )}
        </div>

        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <GameCardSkeleton key={i} />)}
          </div>
        }>
          <GamesList isAllowedTime={isAllowedTime} />
        </Suspense>
      </main>
    </div>
  );
}

function UserStatsWrapper({ email }: { email: string }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserByEmail(email);
        setCurrentUser(userData);
      } catch (err) {
        setError('Failed to load user data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [email]);

  if (loading) return <UserStatsSkeleton />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!currentUser) return <div>No user data available</div>;

  return <UserStats currentUser={currentUser} />;
}

function GamesList({ isAllowedTime }: { isAllowedTime: boolean }) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesData = await getGames();
        setGames(gamesData);
      } catch (err) {
        setError('Failed to load games');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => <GameCardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) return <div className="text-red-500">{error}</div>;
  if (!games.length) return <div>No games available</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game) => (
        <GameCard 
          key={game._id} 
          game={game}
          isDisabled={!isAllowedTime}
        />
      ))}
    </div>
  );
}