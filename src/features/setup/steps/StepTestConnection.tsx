import { useCallback } from 'react';
import { Button } from '../../../app/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Database } from 'lucide-react';
import { dbConfigService } from '../../../services/dbConfigService';
import { cn } from '../../../app/components/ui/utils';

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

interface StepTestConnectionProps {
  testStatus: TestStatus;
  testMessage: string;
  connectionData: {
    dbType: string;
    host: string;
    port: number;
    dbName: string;
    username: string;
    password: string;
    ssl: boolean;
    connectionString: string;
  };
  onStatusChange: (status: TestStatus, message: string) => void;
}

export function StepTestConnection({
  testStatus,
  testMessage,
  connectionData,
  onStatusChange,
}: StepTestConnectionProps) {
  const handleTest = useCallback(async () => {
    onStatusChange('loading', '');
    try {
      const result = await dbConfigService.testConnection(connectionData);
      if (result.success) {
        onStatusChange('success', result.message || 'Connection successful');
      } else {
        onStatusChange('error', 'Connection failed — check your credentials');
      }
    } catch {
      onStatusChange('error', 'Connection refused — check host and port');
    }
  }, [connectionData, onStatusChange]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Test Connection</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Verify that your database is reachable with the provided credentials.
        </p>
      </div>

      <div
        className={cn(
          'flex flex-col items-center justify-center gap-5 rounded-xl border-2 p-8 transition-colors duration-300',
          testStatus === 'success' && 'border-green-500/30 bg-green-500/5',
          testStatus === 'error' && 'border-red-500/30 bg-red-500/5',
          testStatus === 'idle' && 'border-border bg-card',
          testStatus === 'loading' && 'border-primary/30 bg-primary/5',
        )}
      >
        {/* Icon */}
        <div className="flex items-center justify-center size-16 rounded-full bg-muted/50">
          {testStatus === 'idle' && <Database className="size-8 text-muted-foreground" />}
          {testStatus === 'loading' && (
            <Loader2 className="size-8 text-primary animate-spin" />
          )}
          {testStatus === 'success' && (
            <CheckCircle2 className="size-8 text-green-500" />
          )}
          {testStatus === 'error' && <XCircle className="size-8 text-red-500" />}
        </div>

        {/* Message */}
        <div className="text-center space-y-1">
          {testStatus === 'idle' && (
            <p className="text-sm text-muted-foreground">
              Click the button below to test your database connection.
            </p>
          )}
          {testStatus === 'loading' && (
            <p className="text-sm text-muted-foreground">Testing connection…</p>
          )}
          {testStatus === 'success' && (
            <p className="text-sm font-medium text-green-600">{testMessage}</p>
          )}
          {testStatus === 'error' && (
            <p className="text-sm font-medium text-red-600">{testMessage}</p>
          )}
        </div>

        {/* Actions */}
        {testStatus === 'idle' && (
          <Button onClick={handleTest} size="lg">
            <Database className="size-4" />
            Test Connection
          </Button>
        )}
        {testStatus === 'loading' && (
          <Button disabled size="lg">
            <Loader2 className="size-4 animate-spin" />
            Testing…
          </Button>
        )}
        {testStatus === 'error' && (
          <Button
            variant="outline"
            onClick={() => onStatusChange('idle', '')}
            size="lg"
          >
            Try Again
          </Button>
        )}
        {testStatus === 'success' && (
          <p className="text-xs text-muted-foreground">
            You can proceed to the next step.
          </p>
        )}
      </div>
    </div>
  );
}
