import { Link } from "react-router";

export function NotFound() {
  return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="bg-card text-foreground rounded p-12 text-center max-w-md" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-2xl font-bold mb-4">404 - Page Not Found</h2>
        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
        <Link 
          to="/" 
          className="inline-block bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold px-6 py-3 rounded hover:shadow-lg hover:shadow-primary/10 transition-all duration-200"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
