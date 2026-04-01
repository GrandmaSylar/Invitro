import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { Card, CardContent } from '../../app/components/ui/card';
import { Separator } from '../../app/components/ui/separator';
import { SettingsPlaceholder } from '../../app/components/placeholders';
import { Settings, Bell, Shield, Users, Mail, Key, Database, FileText, Activity, Server } from 'lucide-react';
import { cn } from '../../app/components/ui/utils';
import { useAuthStore } from '../../stores/useAuthStore';

const GeneralSection = React.lazy(() => import('./GeneralSection'));
const NotificationsSection = React.lazy(() => import('./NotificationsSection'));
const SecuritySection = React.lazy(() => import('./SecuritySection'));
const UsersRolesSection = React.lazy(() => import('./UsersRolesSection'));
const SmtpSection = React.lazy(() => import('./SmtpSection'));
const ApiKeysSection = React.lazy(() => import('./ApiKeysSection'));
const BackupSection = React.lazy(() => import('./BackupSection'));
const AuditLogSection = React.lazy(() => import('./AuditLogSection'));
const SystemHealthSection = React.lazy(() => import('./SystemHealthSection'));
const DatabaseSection = React.lazy(() => import('./DatabaseSection'));

const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General', icon: Settings, permissionKey: 'settings.general', group: 'General' },
  { id: 'notifications', label: 'Notifications', icon: Bell, permissionKey: 'settings.notifications', group: 'General' },
  { id: 'security', label: 'Security', icon: Shield, permissionKey: 'settings.security', group: 'General' },
  { id: 'users', label: 'Users & Roles', icon: Users, permissionKey: 'settings.users', group: 'Administration' },
  { id: 'smtp', label: 'Email / SMTP', icon: Mail, permissionKey: 'settings.smtp', group: 'Administration' },
  { id: 'api_keys', label: 'API Keys', icon: Key, permissionKey: 'settings.api_keys', group: 'Administration' },
  { id: 'backup', label: 'Backup & Restore', icon: Database, permissionKey: 'settings.backup', group: 'System' },
  { id: 'audit_log', label: 'Audit Log', icon: FileText, permissionKey: 'settings.audit_log', group: 'System' },
  { id: 'health', label: 'System Health', icon: Activity, permissionKey: 'settings.health', group: 'System' },
  { id: 'database', label: 'Database', icon: Server, permissionKey: 'settings.database', group: 'System' },
];

export function SettingsPage() {
  const { user, resolvedPermissions } = useAuthStore();
  
  const accessibleSections = useMemo(() => {
    return SETTINGS_SECTIONS.filter(section => {
      if (user?.roleId === 'developer') return true;
      return !!resolvedPermissions[section.permissionKey];
    });
  }, [user, resolvedPermissions]);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSectionId && accessibleSections.length > 0) {
      setActiveSectionId(accessibleSections[0].id);
    }
  }, [accessibleSections, activeSectionId]);

  if (accessibleSections.length === 0) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Settings className="h-12 w-12 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">No accessible sections</h2>
        <p className="text-muted-foreground">You don't have permission to access any settings sections.</p>
      </div>
    );
  }

  const groupedSections = accessibleSections.reduce((acc, section) => {
    if (!acc[section.group]) acc[section.group] = [];
    acc[section.group].push(section);
    return acc;
  }, {} as Record<string, typeof SETTINGS_SECTIONS>);

  const activeSection = accessibleSections.find(s => s.id === activeSectionId) || accessibleSections[0];

  const renderActiveSection = () => {
    switch (activeSection.id) {
      case 'general':
        return <GeneralSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'security':
        return <SecuritySection />;
      case 'users':
        return <UsersRolesSection />;
      case 'smtp':
        return <SmtpSection />;
      case 'api_keys':
        return <ApiKeysSection />;
      case 'backup':
        return <BackupSection />;
      case 'audit_log':
        return <AuditLogSection />;
      case 'health':
        return <SystemHealthSection />;
      case 'database':
        return <DatabaseSection />;
      default:
        // Render placeholder for sections built yet
        return <SettingsPlaceholder />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      
      {/* Left Sidebar */}
      <div className="w-[200px] flex-shrink-0 flex flex-col gap-6 overflow-y-auto pr-4 pb-4">
        {Object.entries(groupedSections).map(([groupName, sections], index) => (
          <div key={groupName} className="space-y-2">
            {index > 0 && <Separator className="mb-4" />}
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {groupName}
            </h3>
            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSectionId === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSectionId(section.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground border-l-2 border-primary rounded-l-none pl-[10px]"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="max-w-4xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">{activeSection.label}</h2>
            <p className="text-muted-foreground">Manage {activeSection.label.toLowerCase()} preferences.</p>
          </div>
          
          <Suspense fallback={
            <div className="space-y-4">
              <div className="h-[200px] w-full animate-pulse rounded-lg bg-muted" />
              <div className="h-[200px] w-full animate-pulse rounded-lg bg-muted" />
            </div>
          }>
            {renderActiveSection()}
          </Suspense>
        </div>
      </div>
      
    </div>
  );
}
