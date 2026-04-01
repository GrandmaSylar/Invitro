import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../app/components/ui/table';
import { Badge } from '../../app/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../app/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../app/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../app/components/ui/alert-dialog';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../app/components/ui/collapsible';
import { Alert, AlertDescription } from '../../app/components/ui/alert';
import { toast } from 'sonner';
import { MoreVertical, Plus, Trash2, Edit2, Play, CheckCircle2, ChevronDown, ChevronRight, AlertCircle, X } from 'lucide-react';

import { useSettingsStore } from '../../stores/useSettingsStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAuditLog } from '../../hooks/useAuditLog';
import { dbConfigService } from '../../services/dbConfigService';
import { DatabaseConfig } from '../../lib/types';

import { StepDbType } from '../setup/steps/StepDbType';
import { StepCredentials } from '../setup/steps/StepCredentials';
import { PermissionGate } from '../rbac/PermissionGate';
import { useNavigate } from 'react-router';
import { cn } from '../../app/components/ui/utils';

type ConfigFormState = Omit<DatabaseConfig, 'id' | 'isActive' | 'lastTestedAt' | 'lastTestResult'> & {
  manualConnectionString: boolean;
};

const defaultFormState: ConfigFormState = {
  name: '',
  dbType: 'postgresql',
  host: '',
  port: 5432,
  dbName: '',
  username: '',
  password: '',
  ssl: false,
  sslCertificate: '',
  connectionString: '',
  manualConnectionString: false,
  poolSize: 5,
  timeoutMs: 5000,
  advancedOptions: {},
};

export default function DatabaseSection() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addEvent } = useAuditLog();
  const { dbConfigs } = useSettingsStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<DatabaseConfig | null>(null);
  
  const [confirmSetActive, setConfirmSetActive] = useState<DatabaseConfig | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DatabaseConfig | null>(null);
  const [confirmRerunSetup, setConfirmRerunSetup] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ConfigFormState>(defaultFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Helpers

  const resetForm = () => {
    setFormData(defaultFormState);
    setFormErrors({});
    setTestResult(null);
    setEditingConfig(null);
    setFormOpen(false);
  };

  const handleOpenAdd = () => {
    setFormData(defaultFormState);
    setEditingConfig(null);
    setFormErrors({});
    setTestResult(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (config: DatabaseConfig) => {
    setFormData({
      ...defaultFormState,
      ...config,
      manualConnectionString: !!config.connectionString && (!config.host || !config.port),
      advancedOptions: config.advancedOptions || {},
    });
    setEditingConfig(config);
    setFormErrors({});
    setTestResult(null);
    setFormOpen(true);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    // Minimal prep to match StepTestConnection expectations
    const testPayload = {
      ...formData,
    };
    
    try {
      const result = await dbConfigService.testConnection(testPayload);
      setTestResult(result);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error('Connection failed');
      }
    } catch (err) {
      setTestResult({ success: false, message: 'An unexpected error occurred during test' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // Validate
    if (!formData.name.trim()) {
      setFormErrors({ name: 'Configuration name is required' });
      return;
    }

    setSaving(true);
    
    const { manualConnectionString, ...configToSave } = formData;
    const finalConfig = {
      ...configToSave,
      ...(testResult !== null ? { lastTestedAt: testResult.success ? new Date().toISOString() : undefined } : {})
    };

    try {
      if (editingConfig) {
        await dbConfigService.updateConfig(editingConfig.id, finalConfig);
        addEvent({
          actorId: user?.id || 'system',
          actorName: user?.fullName || 'System',
          action: 'db_config.updated',
          targetType: 'db_config',
          targetId: editingConfig.id,
          targetName: formData.name,
          detail: 'Updated database configuration details',
        });
        toast.success('Configuration updated successfully');
      } else {
        // Mock save using dbConfigService which proxies to store
        await dbConfigService.saveConfig({ ...finalConfig, isActive: dbConfigs.length === 0 });
        addEvent({
          actorId: user?.id || 'system',
          actorName: user?.fullName || 'System',
          action: 'db_config.created',
          targetType: 'db_config',
          targetId: 'new', // The store will generate id
          targetName: formData.name,
          detail: 'Created new database configuration',
        });
        toast.success('Configuration added successfully');
      }
      resetForm();
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSetActive = async () => {
    if (!confirmSetActive) return;
    try {
      await dbConfigService.setActiveConfig(confirmSetActive.id);
      addEvent({
        actorId: user?.id || 'system',
        actorName: user?.fullName || 'System',
        action: 'db_config.set_active',
        targetType: 'db_config',
        targetId: confirmSetActive.id,
        targetName: confirmSetActive.name,
        detail: 'Set database configuration as active',
      });
      toast.success('Active configuration updated');
    } catch (err) {
      toast.error('Failed to update active configuration');
    } finally {
      setConfirmSetActive(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await dbConfigService.deleteConfig(confirmDelete.id);
      addEvent({
        actorId: user?.id || 'system',
        actorName: user?.fullName || 'System',
        action: 'db_config.deleted',
        targetType: 'db_config',
        targetId: confirmDelete.id,
        targetName: confirmDelete.name,
        detail: 'Deleted database configuration',
      });
      toast.success('Configuration deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete configuration');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleConfirmRerunSetup = () => {
    setConfirmRerunSetup(false);
    localStorage.removeItem('db_configured');
    navigate('/setup');
  };

  const handleAddAdvancedOption = () => {
    setFormData((prev) => ({
      ...prev,
      advancedOptions: { ...prev.advancedOptions, ['']: '' }
    }));
  };

  const updateAdvancedOptionKey = (oldKey: string, newKey: string, value: string) => {
    setFormData((prev) => {
      const newOptions = { ...prev.advancedOptions };
      delete newOptions[oldKey];
      newOptions[newKey] = value;
      return { ...prev, advancedOptions: newOptions };
    });
  };

  const updateAdvancedOptionValue = (key: string, newValue: string) => {
    setFormData((prev) => ({
      ...prev,
      advancedOptions: { ...prev.advancedOptions, [key]: newValue }
    }));
  };

  const removeAdvancedOption = (key: string) => {
    setFormData((prev) => {
      const newOptions = { ...prev.advancedOptions };
      delete newOptions[key];
      return { ...prev, advancedOptions: newOptions };
    });
  };

  return (
    <PermissionGate require="settings.database" fallback={<div className="p-4 text-destructive border rounded mt-4">Access Denied to Database Settings</div>}>
      <div className="space-y-6">
        
        {/* Main List Card */}
        {!formOpen && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Database Configurations</CardTitle>
                <CardContent className="px-0 py-2 text-sm text-muted-foreground p-0 m-0">
                  Manage connection configurations to your external data sources.
                </CardContent>
              </div>
              <Button onClick={handleOpenAdd} size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Configuration
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Config Name</TableHead>
                      <TableHead>DB Type</TableHead>
                      <TableHead>Host / String</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Tested</TableHead>
                      <TableHead className="w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbConfigs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No database configurations found. Add one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dbConfigs.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell className="font-medium">{config.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {config.dbType}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate" title={config.host || config.connectionString}>
                            {config.host || config.connectionString || '—'}
                          </TableCell>
                          <TableCell>
                            {config.isActive ? (
                              <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 hover:text-green-800 dark:text-green-400">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-muted-foreground">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {config.lastTestedAt ? new Date(config.lastTestedAt).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEdit(config)}>
                                  <Edit2 className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                {!config.isActive && (
                                  <DropdownMenuItem onClick={() => setConfirmSetActive(config)}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Set as Active
                                  </DropdownMenuItem>
                                )}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <DropdownMenuItem 
                                          className="text-destructive focus:text-destructive"
                                          disabled={config.isActive}
                                          onClick={(e) => {
                                            if (config.isActive) return e.preventDefault();
                                            setConfirmDelete(config);
                                          }}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                      </div>
                                    </TooltipTrigger>
                                    {config.isActive && (
                                      <TooltipContent>
                                        <p>Cannot delete the active configuration</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Form Panel */}
        {formOpen && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{editingConfig ? 'Edit Configuration' : 'Add Configuration'}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-8">

              <div className="space-y-4">
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="configName">Configuration Name <span className="text-destructive">*</span></Label>
                  <Input 
                    id="configName" 
                    placeholder="e.g. Production Database" 
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                  {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                </div>

                <div className="pt-4 border-t">
                  <StepDbType 
                    dbType={formData.dbType} 
                    onSelect={(key, p) => setFormData(prev => ({ ...prev, dbType: key, port: p || prev.port }))} 
                  />
                </div>

                <div className="pt-4 border-t">
                  <StepCredentials 
                    fields={{
                      host: formData.host || '',
                      port: formData.port || 0,
                      dbName: formData.dbName || '',
                      username: formData.username || '',
                      password: formData.password || '',
                      ssl: formData.ssl || false,
                      sslCertificate: formData.sslCertificate || '',
                      connectionString: formData.connectionString || '',
                      manualConnectionString: formData.manualConnectionString,
                      dbType: formData.dbType
                    }} 
                    errors={{}} 
                    onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))} 
                  />
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h3 className="text-lg font-semibold">Connection Options</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="poolSize">Connection Pool Size</Label>
                      <Input 
                        id="poolSize" 
                        type="number" 
                        value={formData.poolSize || 5} 
                        onChange={(e) => setFormData(prev => ({ ...prev, poolSize: parseInt(e.target.value) || 5 }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeoutMs">Timeout (ms)</Label>
                      <Input 
                        id="timeoutMs" 
                        type="number" 
                        value={formData.timeoutMs || 5000} 
                        onChange={(e) => setFormData(prev => ({ ...prev, timeoutMs: parseInt(e.target.value) || 5000 }))} 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Collapsible className="space-y-2">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="flex w-full justify-between items-center sm:w-auto">
                        <span className="font-semibold">Advanced Options</span>
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-3 p-1">
                      {Object.entries(formData.advancedOptions || {}).map(([key, val], idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input 
                            placeholder="Key" 
                            value={key} 
                            onChange={(e) => updateAdvancedOptionKey(key, e.target.value, val)} 
                            className="w-1/3" 
                          />
                          <Input 
                            placeholder="Value" 
                            value={val} 
                            onChange={(e) => updateAdvancedOptionValue(key, e.target.value)} 
                            className="flex-1" 
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeAdvancedOption(key)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="secondary" size="sm" onClick={handleAddAdvancedOption}>
                        <Plus className="h-4 w-4 mr-2" /> Add Option
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

              </div>

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"} className={testResult.success ? "bg-green-500/10 border-green-500/50" : ""}>
                  {testResult.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertDescription className={testResult.success ? "text-green-800 dark:text-green-400" : ""}>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={resetForm} disabled={saving || testing}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleTestConnection} disabled={testing || saving}>
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button onClick={handleSave} disabled={saving || testing}>
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>

            </CardContent>
          </Card>
        )}

        {/* Footer Link */}
        {!formOpen && (
          <div className="text-center mt-8">
            <button 
              className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              onClick={() => setConfirmRerunSetup(true)}
            >
              Need to reconfigure from scratch? Re-run the setup wizard
            </button>
          </div>
        )}

        {/* Dialogs */}
        <AlertDialog open={!!confirmSetActive} onOpenChange={(open) => !open && setConfirmSetActive(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Switch Active Database?</AlertDialogTitle>
              <AlertDialogDescription>
                Switch active database to <strong>{confirmSetActive?.name}</strong>? The application will use this connection going forward.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSetActive}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Configuration?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove <strong>{confirmDelete?.name}</strong>. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmRerunSetup} onOpenChange={setConfirmRerunSetup}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Re-run Setup Wizard?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear your current database configuration state and restart the setup wizard. Your saved configurations will remain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRerunSetup}>Restart Wizard</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </PermissionGate>
  );
}
