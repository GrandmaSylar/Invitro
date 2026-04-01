import { useMemo, useCallback, useRef } from 'react';
import { Input } from '../../../app/components/ui/input';
import { Label } from '../../../app/components/ui/label';
import { Textarea } from '../../../app/components/ui/textarea';
import { Switch } from '../../../app/components/ui/switch';
import { Upload, Check } from 'lucide-react';

interface CredentialFields {
  host: string;
  port: number;
  dbName: string;
  username: string;
  password: string;
  ssl: boolean;
  sslCertificate: string;
  connectionString: string;
  manualConnectionString: boolean;
  dbType: string;
}

interface StepCredentialsProps {
  fields: CredentialFields;
  errors: Record<string, string>;
  onChange: (updates: Partial<CredentialFields>) => void;
}

const SIMPLE_DB_TYPES = ['sqlite', 'firebase'];

function buildConnectionString(fields: CredentialFields): string {
  const { dbType, host, port, dbName, username, password } = fields;
  const userPart = username ? (password ? `${username}:${password}` : username) : '';
  const authPart = userPart ? `${userPart}@` : '';
  const portPart = port ? `:${port}` : '';

  switch (dbType) {
    case 'postgresql':
    case 'supabase':
    case 'neon':
    case 'cockroachdb':
      return `postgresql://${authPart}${host}${portPart}/${dbName}${fields.ssl ? '?sslmode=require' : ''}`;
    case 'mysql':
    case 'mariadb':
    case 'planetscale':
      return `mysql://${authPart}${host}${portPart}/${dbName}`;
    case 'mongodb':
      return `mongodb://${authPart}${host}${portPart}/${dbName}`;
    case 'sqlserver':
      return `mssql://${authPart}${host}${portPart}/${dbName}`;
    case 'oracle':
      return `oracle://${authPart}${host}${portPart}/${dbName}`;
    default:
      return `${dbType}://${authPart}${host}${portPart}/${dbName}`;
  }
}

export function StepCredentials({ fields, errors, onChange }: StepCredentialsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSimple = SIMPLE_DB_TYPES.includes(fields.dbType);

  const computedConnectionString = useMemo(() => {
    if (isSimple || fields.manualConnectionString) return fields.connectionString;
    return buildConnectionString(fields);
  }, [fields.host, fields.port, fields.dbName, fields.username, fields.password, fields.ssl, fields.dbType, fields.manualConnectionString, isSimple, fields.connectionString]);

  const handleFieldChange = useCallback(
    (updates: Partial<CredentialFields>) => {
      const merged = { ...fields, ...updates };
      if (!merged.manualConnectionString && !isSimple) {
        merged.connectionString = buildConnectionString(merged);
      }
      onChange(merged);
    },
    [fields, onChange, isSimple],
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        onChange({ sslCertificate: reader.result as string });
      };
      reader.readAsText(file);
    },
    [onChange],
  );

  if (isSimple) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Connection Details</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the connection string for your {fields.dbType === 'sqlite' ? 'SQLite' : 'Firebase'} database.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="connectionString">Connection String</Label>
          <Textarea
            id="connectionString"
            placeholder={fields.dbType === 'sqlite' ? 'file:./my-database.db' : 'https://your-project.firebaseio.com'}
            value={fields.connectionString}
            onChange={(e) => onChange({ connectionString: e.target.value })}
          />
          {errors.connectionString && (
            <p className="text-destructive text-xs">{errors.connectionString}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Connection Credentials</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Provide the details to connect to your database.
        </p>
      </div>

      {/* Manual connection string toggle */}
      <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
        <Label htmlFor="manual-toggle" className="cursor-pointer">
          Enter connection string manually
        </Label>
        <Switch
          id="manual-toggle"
          checked={fields.manualConnectionString}
          onCheckedChange={(checked: boolean) =>
            handleFieldChange({ manualConnectionString: checked })
          }
        />
      </div>

      {fields.manualConnectionString ? (
        <div className="space-y-2">
          <Label htmlFor="connectionString">Connection String</Label>
          <Textarea
            id="connectionString"
            placeholder={`${fields.dbType}://user:password@host:port/database`}
            value={fields.connectionString}
            onChange={(e) => onChange({ connectionString: e.target.value })}
          />
          {errors.connectionString && (
            <p className="text-destructive text-xs">{errors.connectionString}</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                placeholder="localhost"
                value={fields.host}
                onChange={(e) => handleFieldChange({ host: e.target.value })}
              />
              {errors.host && <p className="text-destructive text-xs">{errors.host}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder="5432"
                value={fields.port || ''}
                onChange={(e) => handleFieldChange({ port: parseInt(e.target.value) || 0 })}
              />
              {errors.port && <p className="text-destructive text-xs">{errors.port}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dbName">Database Name</Label>
            <Input
              id="dbName"
              placeholder="my_database"
              value={fields.dbName}
              onChange={(e) => handleFieldChange({ dbName: e.target.value })}
            />
            {errors.dbName && <p className="text-destructive text-xs">{errors.dbName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="db_user"
                value={fields.username}
                onChange={(e) => handleFieldChange({ username: e.target.value })}
              />
              {errors.username && <p className="text-destructive text-xs">{errors.username}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={fields.password}
                onChange={(e) => handleFieldChange({ password: e.target.value })}
              />
              {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
            </div>
          </div>

          {/* Generated connection string preview */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Generated Connection String</Label>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-mono text-muted-foreground break-all select-all">
              {computedConnectionString || '—'}
            </div>
          </div>
        </>
      )}

      {/* SSL Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
          <Label htmlFor="ssl-toggle" className="cursor-pointer">
            Use SSL / TLS
          </Label>
          <Switch
            id="ssl-toggle"
            checked={fields.ssl}
            onCheckedChange={(checked: boolean) => handleFieldChange({ ssl: checked })}
          />
        </div>

        {fields.ssl && (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {fields.sslCertificate
                ? <span className="inline-flex items-center gap-1">Certificate loaded <Check className="h-3.5 w-3.5 text-green-600" /> — Click to replace</span>
                : 'Click to upload SSL certificate (.pem, .crt, .cer)'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pem,.crt,.cer"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}
      </div>
    </div>
  );
}
