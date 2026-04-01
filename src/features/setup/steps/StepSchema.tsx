import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../app/components/ui/button';
import { Progress } from '../../../app/components/ui/progress';
import { CheckCircle2, Database, Loader2, TableProperties, Shield, Settings } from 'lucide-react';
import { cn } from '../../../app/components/ui/utils';

type SchemaStatus = 'idle' | 'loading' | 'done';

interface StepSchemaProps {
  schemaStatus: SchemaStatus;
  onStatusChange: (status: SchemaStatus) => void;
}

export function StepSchema({ schemaStatus, onStatusChange }: StepSchemaProps) {
  const [progress, setProgress] = useState(0);

  const handleInitialize = useCallback(() => {
    onStatusChange('loading');
    setProgress(0);
  }, [onStatusChange]);

  useEffect(() => {
    if (schemaStatus !== 'loading') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 100 / 30; // 30 ticks over ~1.5s (50ms each)
        if (next >= 100) {
          clearInterval(interval);
          onStatusChange('done');
          return 100;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [schemaStatus, onStatusChange]);

  const summaryItems = [
    { icon: TableProperties, label: 'Tables to create', value: '12' },
    { icon: Shield, label: 'Seed data', value: 'Roles, default permissions' },
    { icon: Settings, label: 'System settings', value: 'App defaults, SMTP config' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Initialize Schema</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create the required database tables and seed initial data.
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border bg-muted/20 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          What will be created
        </h3>
        <div className="space-y-3">
          {summaryItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="flex items-center justify-center size-8 rounded-md bg-primary/10">
                <item.icon className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action area */}
      <div
        className={cn(
          'flex flex-col items-center gap-4 rounded-xl border-2 p-6 transition-colors duration-300',
          schemaStatus === 'done' && 'border-green-500/30 bg-green-500/5',
          schemaStatus === 'idle' && 'border-border bg-card',
          schemaStatus === 'loading' && 'border-primary/30 bg-primary/5',
        )}
      >
        {schemaStatus === 'idle' && (
          <Button onClick={handleInitialize} size="lg">
            <Database className="size-4" />
            Initialize Database
          </Button>
        )}

        {schemaStatus === 'loading' && (
          <>
            <Loader2 className="size-8 text-primary animate-spin" />
            <div className="w-full max-w-xs space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-center text-muted-foreground">
                Creating tables and seeding data…
              </p>
            </div>
          </>
        )}

        {schemaStatus === 'done' && (
          <>
            <CheckCircle2 className="size-8 text-green-500" />
            <p className="text-sm font-medium text-green-600">
              Schema initialized successfully!
            </p>
            <p className="text-xs text-muted-foreground">
              12 tables created, seed data inserted.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
