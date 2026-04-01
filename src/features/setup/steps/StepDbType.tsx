import { cn } from '../../../app/components/ui/utils';
import { LucideIcon, Database, Cylinder, Leaf, Package, AppWindow, Circle, Shell, Zap, Sprout, Globe, Flame, Bug, Plus } from 'lucide-react';

const DB_OPTIONS: {
  key: string;
  label: string;
  icon: LucideIcon;
  defaultPort: number;
  group: 'on-premise' | 'cloud' | 'other';
}[] = [
  { key: 'postgresql', label: 'PostgreSQL', icon: Database, defaultPort: 5432, group: 'on-premise' },
  { key: 'mysql', label: 'MySQL', icon: Cylinder, defaultPort: 3306, group: 'on-premise' },
  { key: 'mongodb', label: 'MongoDB', icon: Leaf, defaultPort: 27017, group: 'on-premise' },
  { key: 'sqlite', label: 'SQLite', icon: Package, defaultPort: 0, group: 'on-premise' },
  { key: 'sqlserver', label: 'SQL Server', icon: AppWindow, defaultPort: 1433, group: 'on-premise' },
  { key: 'oracle', label: 'Oracle', icon: Circle, defaultPort: 1521, group: 'on-premise' },
  { key: 'mariadb', label: 'MariaDB', icon: Shell, defaultPort: 3306, group: 'on-premise' },
  { key: 'supabase', label: 'Supabase', icon: Zap, defaultPort: 5432, group: 'cloud' },
  { key: 'neon', label: 'Neon', icon: Sprout, defaultPort: 5432, group: 'cloud' },
  { key: 'planetscale', label: 'PlanetScale', icon: Globe, defaultPort: 3306, group: 'cloud' },
  { key: 'firebase', label: 'Firebase', icon: Flame, defaultPort: 0, group: 'cloud' },
  { key: 'cockroachdb', label: 'CockroachDB', icon: Bug, defaultPort: 26257, group: 'cloud' },
  { key: 'other', label: 'Other', icon: Plus, defaultPort: 0, group: 'other' },
];

interface StepDbTypeProps {
  dbType: string;
  onSelect: (key: string, defaultPort: number) => void;
}

export function StepDbType({ dbType, onSelect }: StepDbTypeProps) {
  const onPremise = DB_OPTIONS.filter((o) => o.group === 'on-premise');
  const cloud = DB_OPTIONS.filter((o) => o.group === 'cloud' || o.group === 'other');

  const renderGroup = (label: string, options: typeof DB_OPTIONS[number][]) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {options.map((opt) => {
          const isSelected = dbType === opt.key;
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSelect(opt.key, opt.defaultPort)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all duration-200 cursor-pointer',
                'hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                  : 'border-border bg-card hover:bg-accent/30',
              )}
            >
              <span className="inline-flex items-center justify-center">
                <Icon
                  className={cn(
                    'h-8 w-8',
                    isSelected ? 'text-primary' : 'text-muted-foreground',
                  )}
                  aria-label={opt.label}
                />
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-primary' : 'text-foreground',
                )}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Select Database Type</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the database engine your application will connect to.
        </p>
      </div>
      {renderGroup('On-Premise', onPremise)}
      {renderGroup('Cloud-Hosted', cloud)}
    </div>
  );
}
