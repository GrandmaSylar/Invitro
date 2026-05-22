import { Link } from 'react-router';
import { Card, CardContent } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { ArrowLeft, KeyRound } from 'lucide-react';

export function ForgotPasswordPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden p-4">
      {/* Dynamic Glowing Mesh Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-[130px] dark:from-blue-500/10 dark:to-indigo-500/10 animate-[pulse_8s_infinite_ease-in-out]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-[130px] dark:from-purple-500/10 dark:to-pink-500/10 animate-[pulse_10s_infinite_ease-in-out_2s]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <Card className="border border-border/50 bg-card/75 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-8">
            {/* Icon */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 border border-primary/20 shadow-inner">
                <KeyRound className="size-5 text-primary" />
              </div>
              {/* Heading */}
              <div className="text-center">
                <h1 className="text-2xl font-black tracking-tight text-foreground">Forgot password?</h1>
                {/* Message */}
                <p className="text-sm text-muted-foreground mt-1.5">
                  Contact your administrator to reset your password.
                </p>
              </div>
            </div>
            {/* Back to Login button */}
            <Button variant="outline" className="w-full h-10 font-bold" asChild>
              <Link to="/login">
                <ArrowLeft className="size-4 mr-2" />
                Back to Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
