// app/components/dashboard/UserStatsSkeleton.tsx
export default function UserStatsSkeleton() {
  return (
    <div className="flex gap-4 mb-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow-sm w-full animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}