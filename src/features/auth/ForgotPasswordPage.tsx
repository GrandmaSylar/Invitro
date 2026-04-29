import { Link } from 'react-router';
import { Card, CardContent } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { ArrowLeft, KeyRound } from 'lucide-react';

export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[420px] shadow-2xl">
        <CardContent className="p-8">
          {/* Icon */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10">
              <KeyRound className="size-6 text-primary" />
            </div>
            {/* Heading */}
            <div className="text-center">
              <h1 className="text-xl font-bold">Forgot your password?</h1>
              {/* Message */}
              <p className="text-sm text-muted-foreground mt-1">
                Contact your administrator to reset your password.
              </p>
            </div>
          </div>
          {/* Back to Login button */}
          <Button variant="outline" className="w-full" asChild>
            <Link to="/login">
              <ArrowLeft className="size-4" />
              Back to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
