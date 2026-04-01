import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../../app/components/ui/button';
import { dbConfigService } from '../../../services/dbConfigService';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { CheckCircle2, ArrowRight, Database, Globe, HardDrive, Mail } from 'lucide-react';

interface StepDoneProps {
  dbType: string;
  host: string;
  dbName: string;
  adminEmail: string;
  connectionString: string;
  port: number;
  username: string;
  password: string;
  ssl: boolean;
  sslCertificate: string;
}

export function StepDone({
  dbType,
  host,
  dbName,
  adminEmail,
  connectionString,
  port,
  username,
  password,
  ssl,
  sslCertificate,
}: StepDoneProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const summaryRows = [
    { icon: Database, label: 'Database Type', value: dbType },
    { icon: Globe, label: 'Host', value: host || 'N/A' },
    { icon: HardDrive, label: 'Database Name', value: dbName || 'N/A' },
    { icon: Mail, label: 'Admin Email', value: adminEmail },
  ];

  const handleEnter = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Save the DB config via service → persists to useSettingsStore
      await dbConfigService.saveConfig({
        name: `${dbType} Setup Config`,
        dbType,
        host: host || undefined,
        port: port || undefined,
        dbName: dbName || undefined,
        username: username || undefined,
        password: password || undefined,
        ssl,
        sslCertificate: sslCertificate || undefined,
        connectionString: connectionString || undefined,
        isActive: false,
        lastTestResult: 'success',
      });

      // 2. Mark db as configured in localStorage
      localStorage.setItem('db_configured', 'true');

      // 3. Set the new config as active (it's the last one added)
      const configs = useSettingsStore.getState().dbConfigs;
      const newConfig = configs[configs.length - 1];
      if (newConfig) {
        useSettingsStore.getState().setActiveDbConfig(newConfig.id);
      }

      // 4. Navigate to dashboard
      navigate('/');
    } catch {
      // If something goes wrong, allow retry
      setIsLoading(false);
    }
  }, [dbType, host, dbName, port, username, password, ssl, sslCertificate, connectionString, navigate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center justify-center size-16 rounded-full bg-green-500/10">
          <CheckCircle2 className="size-8 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold">Setup Complete!</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your database is configured and ready to use. Here's a summary of your setup.
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border bg-muted/20 p-5 space-y-3">
        {summaryRows.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-md bg-primary/10">
              <row.icon className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="text-sm font-medium truncate capitalize">{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Enter button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleEnter}
        disabled={isLoading}
      >
        {isLoading ? 'Saving…' : 'Enter Application'}
        {!isLoading && <ArrowRight className="size-4" />}
      </Button>
    </div>
  );
}
