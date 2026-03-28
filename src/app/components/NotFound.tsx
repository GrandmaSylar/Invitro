import { Link } from "react-router";

export function NotFound() {
  return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">404 - Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        <Link 
          to="/" 
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-shadow"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
