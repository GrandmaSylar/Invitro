import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { cn } from '../../app/components/ui/utils';
import { Check, ArrowLeft, ArrowRight, Database } from 'lucide-react';
import { useRbacStore } from '../../stores/useRbacStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { StepDbType } from './steps/StepDbType';
import { StepCredentials } from './steps/StepCredentials';
import { StepTestConnection } from './steps/StepTestConnection';
import { StepSchema } from './steps/StepSchema';
import { StepAdminAccount } from './steps/StepAdminAccount';
import { StepDone } from './steps/StepDone';
import type { User } from '../../lib/types';

interface WizardState {
  currentStep: number;
  dbType: string;
  host: string;
  port: number;
  dbName: string;
  username: string;
  password: string;
  ssl: boolean;
  sslCertificate: string;
  connectionString: string;
  manualConnectionString: boolean;
  testStatus: 'idle' | 'loading' | 'success' | 'error';
  testMessage: string;
  schemaStatus: 'idle' | 'loading' | 'done';
  adminFullName: string;
  adminEmail: string;
  adminUsername: string;
  adminPassword: string;
  adminConfirmPassword: string;
}

const INITIAL_STATE: WizardState = {
  currentStep: 1,
  dbType: '',
  host: '',
  port: 0,
  dbName: '',
  username: '',
  password: '',
  ssl: false,
  sslCertificate: '',
  connectionString: '',
  manualConnectionString: false,
  testStatus: 'idle',
  testMessage: '',
  schemaStatus: 'idle',
  adminFullName: '',
  adminEmail: '',
  adminUsername: '',
  adminPassword: '',
  adminConfirmPassword: '',
};

const STEP_LABELS = ['DB Type', 'Credentials', 'Test', 'Schema', 'Admin', 'Done'];

const SIMPLE_DB_TYPES = ['sqlite', 'firebase'];

export function SetupWizard() {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fields whose change should invalidate a previous connection test
  const CONNECTION_FIELDS: (keyof WizardState)[] = [
    'dbType', 'host', 'port', 'dbName', 'username', 'password',
    'ssl', 'sslCertificate', 'connectionString', 'manualConnectionString',
  ];

  const update = useCallback(
    (partial: Partial<WizardState>) => setState((prev) => {
      // If any connection-relevant field actually changed, reset the test status
      const connectionFieldChanged = CONNECTION_FIELDS.some(
        (key) => key in partial && partial[key] !== prev[key],
      );

      const resetTest =
        connectionFieldChanged && prev.testStatus !== 'idle'
          ? { testStatus: 'idle' as const, testMessage: '' }
          : {};

      return { ...prev, ...partial, ...resetTest };
    }),
    [],
  );

  // ── Validation ──────────────────────────────────────────────
  const validateStep = useCallback((): boolean => {
    const errs: Record<string, string> = {};

    switch (state.currentStep) {
      case 1:
        if (!state.dbType) errs.dbType = 'Please select a database type';
        break;
      case 2: {
        const isSimple = SIMPLE_DB_TYPES.includes(state.dbType);
        if (isSimple || state.manualConnectionString) {
          if (!state.connectionString.trim()) errs.connectionString = 'Connection string is required';
        } else {
          if (!state.host.trim()) errs.host = 'Host is required';
          if (!state.port) errs.port = 'Port is required';
          if (!state.dbName.trim()) errs.dbName = 'Database name is required';
          if (!state.username.trim()) errs.username = 'Username is required';
        }
        break;
      }
      case 3:
        // Handled by disabling Next when testStatus !== 'success'
        break;
      case 4:
        // Handled by disabling Next when schemaStatus !== 'done'
        break;
      case 5:
        if (!state.adminFullName.trim()) errs.adminFullName = 'Full name is required';
        if (!state.adminEmail.trim()) errs.adminEmail = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.adminEmail))
          errs.adminEmail = 'Invalid email format';
        if (!state.adminUsername.trim()) errs.adminUsername = 'Username is required';
        if (!state.adminPassword) errs.adminPassword = 'Password is required';
        else if (state.adminPassword.length < 6)
          errs.adminPassword = 'Password must be at least 6 characters';
        if (!state.adminConfirmPassword) errs.adminConfirmPassword = 'Please confirm your password';
        else if (state.adminPassword !== state.adminConfirmPassword)
          errs.adminConfirmPassword = 'Passwords do not match';
        break;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [state]);

  // ── Admin account write (step 5 → 6 transition) ────────────
  const commitAdminAccount = useCallback(() => {
    const roles = useRbacStore.getState().roles;
    const developerRole = roles.find((r) => r.id === 'developer');
    if (!developerRole) return;

    const newUser: User = {
      id: 'usr_setup_admin',
      fullName: state.adminFullName,
      email: state.adminEmail,
      username: state.adminUsername,
      phone: undefined,
      roleId: 'developer',
      permissionOverrides: {},
      twoFactorEnabled: false,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Upsert user in RBAC store (avoids duplicates on re-run)
    useRbacStore.getState().upsertUser(newUser);

    // Log in with developer permissions
    useAuthStore.getState().login(newUser, developerRole.permissions, 'setup');
  }, [state.adminFullName, state.adminEmail, state.adminUsername]);

  // ── Navigation ──────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!validateStep()) return;

    if (state.currentStep === 5) {
      commitAdminAccount();
    }

    update({ currentStep: Math.min(state.currentStep + 1, 6) });
  }, [validateStep, state.currentStep, update, commitAdminAccount]);

  const handleBack = useCallback(() => {
    setErrors({});
    update({ currentStep: Math.max(state.currentStep - 1, 1) });
  }, [state.currentStep, update]);

  // ── Step disabled checks ────────────────────────────────────
  const isNextDisabled =
    (state.currentStep === 3 && state.testStatus !== 'success') ||
    (state.currentStep === 4 && state.schemaStatus !== 'done');

  // ── Render step body ────────────────────────────────────────
  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <StepDbType
            dbType={state.dbType}
            onSelect={(key, defaultPort) => update({ dbType: key, port: defaultPort })}
          />
        );
      case 2:
        return (
          <StepCredentials
            fields={{
              host: state.host,
              port: state.port,
              dbName: state.dbName,
              username: state.username,
              password: state.password,
              ssl: state.ssl,
              sslCertificate: state.sslCertificate,
              connectionString: state.connectionString,
              manualConnectionString: state.manualConnectionString,
              dbType: state.dbType,
            }}
            errors={errors}
            onChange={(updates) => update(updates as Partial<WizardState>)}
          />
        );
      case 3:
        return (
          <StepTestConnection
            testStatus={state.testStatus}
            testMessage={state.testMessage}
            connectionData={{
              dbType: state.dbType,
              host: state.host,
              port: state.port,
              dbName: state.dbName,
              username: state.username,
              password: state.password,
              ssl: state.ssl,
              connectionString: state.connectionString,
            }}
            onStatusChange={(testStatus, testMessage) => update({ testStatus, testMessage })}
          />
        );
      case 4:
        return (
          <StepSchema
            schemaStatus={state.schemaStatus}
            onStatusChange={(schemaStatus) => update({ schemaStatus })}
          />
        );
      case 5:
        return (
          <StepAdminAccount
            fields={{
              adminFullName: state.adminFullName,
              adminEmail: state.adminEmail,
              adminUsername: state.adminUsername,
              adminPassword: state.adminPassword,
              adminConfirmPassword: state.adminConfirmPassword,
            }}
            errors={errors}
            onChange={(updates) => update(updates as Partial<WizardState>)}
          />
        );
      case 6:
        return (
          <StepDone
            dbType={state.dbType}
            host={state.host}
            dbName={state.dbName}
            adminEmail={state.adminEmail}
            connectionString={state.connectionString}
            port={state.port}
            username={state.username}
            password={state.password}
            ssl={state.ssl}
            sslCertificate={state.sslCertificate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
              <Database className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Database Setup</h1>
              <p className="text-xs text-muted-foreground">
                Configure your application in a few steps
              </p>
            </div>
          </div>
        </div>

        {/* ── Stepper ────────────────────────────────────────── */}
        <div className="px-6 py-4">
          <div className="flex items-center">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1;
              const isDone = state.currentStep > stepNum;
              const isActive = state.currentStep === stepNum;

              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  {/* Circle */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        'flex items-center justify-center size-8 rounded-full text-xs font-bold transition-all duration-300',
                        isDone && 'bg-green-500 text-white',
                        isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                        !isDone && !isActive && 'bg-muted text-muted-foreground',
                      )}
                    >
                      {isDone ? <Check className="size-4" /> : stepNum}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-medium whitespace-nowrap',
                        isActive ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {i < STEP_LABELS.length - 1 && (
                    <div className="flex-1 mx-2 h-0.5 rounded-full bg-muted relative overflow-hidden self-start mt-4">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-green-500 rounded-full"
                        initial={false}
                        animate={{ width: isDone ? '100%' : '0%' }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step Body ──────────────────────────────────────── */}
        <CardContent className="px-6 pb-2 min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </CardContent>

        {/* ── Footer ─────────────────────────────────────────── */}
        {state.currentStep < 6 && (
          <div className="flex items-center justify-between px-6 pb-6 pt-2">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={state.currentStep === 1}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            <span className="text-xs text-muted-foreground">
              Step {state.currentStep} of 6
            </span>

            <Button onClick={handleNext} disabled={isNextDisabled}>
              Next
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
