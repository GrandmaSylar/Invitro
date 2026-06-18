import { createHashRouter, redirect, useLoaderData } from "react-router";
import { Layout } from "./components/Layout";
import { MainDashboard } from "./components/MainDashboard";
import { DashboardAlpha } from "./components/DashboardAlpha";
import { TestRegister } from "./components/TestRegister";
import { HospitalRecords } from "./components/HospitalRecords";
import { NotFound } from "./components/NotFound";
import { ResultsEntry } from "./components/ResultsEntry";
import { Profile } from "./components/Profile";
import { useAuthStore } from "../stores/useAuthStore";
import { PERMISSIONS } from "../lib/permissions";
import { SettingsPage } from "../features/settings/SettingsPage";
import { HelpPage } from "../features/help/HelpPage";
import { NotificationsPage } from "../features/notifications/NotificationsPage";
import { DashboardDrilldown } from "../features/dashboard/DashboardDrilldown";

import { LoginPage } from "../features/auth/LoginPage";
import { ResetPasswordPage } from "../features/auth/ResetPasswordPage";
import { ForgotPasswordPage } from "../features/auth/ForgotPasswordPage";
import { AccessDenied } from "./components/AccessDenied";
import { PermissionMatrix } from "../features/rbac/PermissionMatrix";
import { UserTable } from "../features/rbac/UserTable";
import { RbacHelpPage } from "../features/rbac/RbacHelpPage";
import { useRbacStore } from "../stores/useRbacStore";

const requireAuth = (request: Request) => {
  const { isAuthenticated } = useAuthStore.getState();
  const url = new URL(request.url);

  if (!isAuthenticated) {
    throw redirect('/login?redirect=' + encodeURIComponent(url.pathname + url.search));
  }
  
  if (isAuthenticated && useAuthStore.getState().user) {
    const rbacUsers = useRbacStore.getState().users;
    const currentRbacUser = rbacUsers.find(u => u.id === useAuthStore.getState().user?.id);
    if (currentRbacUser && currentRbacUser.status !== 'active') {
      useAuthStore.getState().logout();
      throw redirect('/login');
    }
  }

  return null;
};

const requirePermission = (permissionKey: string) => {
  return () => {
    const state = useAuthStore.getState();
    const { user, resolvedPermissions } = state;
    
    if (user?.roleId === 'developer') {
      return null;
    }
    
    if (!resolvedPermissions[permissionKey]) {
      return { denied: true, permissionKey };
    }
    
    return null;
  };
};

function PermissionRoute({ children }: { children: React.ReactNode }) {
  const data = useLoaderData() as any;
  if (data?.denied) {
    return <AccessDenied permissionKey={data.permissionKey} />;
  }
  return <>{children}</>;
}

const withPermission = (WrappedComponent: React.ComponentType) => {
  return function PermissionGuard() {
    return (
      <PermissionRoute>
        <WrappedComponent />
      </PermissionRoute>
    );
  };
};

export const router = createHashRouter([
  {
    path: "/",
    children: [
      { path: "login", Component: LoginPage },
      { path: "reset-password", Component: ResetPasswordPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      {
        path: "/",
        Component: Layout,
        loader: ({ request }) => requireAuth(request),
        children: [
          { index: true, Component: withPermission(MainDashboard), loader: requirePermission(PERMISSIONS['dashboard.view']) },
          { path: "dashboard/drilldown", Component: withPermission(DashboardDrilldown), loader: requirePermission(PERMISSIONS['dashboard.view']) },
          { path: "patients", Component: withPermission(DashboardAlpha), loader: requirePermission(PERMISSIONS['patients.view']) },
          { path: "test-register", Component: withPermission(TestRegister), loader: requirePermission(PERMISSIONS['test_register.view']) },
          { path: "hospital-records", Component: withPermission(HospitalRecords), loader: requirePermission(PERMISSIONS['hospital_records.view']) },
          { path: "results-entry", Component: withPermission(ResultsEntry), loader: requirePermission(PERMISSIONS['results_entry.view']) },
          { path: "profile", Component: withPermission(Profile), loader: requirePermission(PERMISSIONS['profile.view']) },
           { path: "settings", Component: withPermission(SettingsPage), loader: requirePermission(PERMISSIONS['settings.view']) },
          { path: "help", Component: HelpPage },
          { path: "rbac/help", Component: RbacHelpPage },
          { path: "notifications", Component: withPermission(NotificationsPage), loader: requirePermission(PERMISSIONS['notifications.view']) },
          { path: "rbac/users", loader: () => redirect("/settings?tab=users") },
          { path: "rbac/permissions", loader: () => redirect("/settings?tab=users") },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
]);