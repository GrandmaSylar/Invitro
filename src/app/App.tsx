import { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { ThemeProvider } from "next-themes";
import { router } from "./routes";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useAuthStore } from "../stores/useAuthStore";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { WelcomeChangelogModal } from "./components/WelcomeChangelogModal";
import { DbWizard } from "./components/DbWizard";

import { ScribbleBackground } from "./components/ScribbleBackground";

// INVITRO AIDMED DIAGNOSTICS - Laboratory Inventory Management System
export default function App() {
  const [dbConfigured, setDbConfigured] = useState<boolean | null>(null);
  const initializeSettings = useSettingsStore(state => state.initialize);
  const themePreset = useAuthStore(state => state.user?.themePreset);

  // Check database configuration on desktop boot (fees_tracker architecture)
  useEffect(() => {
    if (window.electronAPI) {
      const checkConfig = async () => {
        try {
          const configured = await (window.electronAPI.checkDbConfig 
            ? window.electronAPI.checkDbConfig() 
            : window.electronAPI.invoke?.('db-check-config'));
          setDbConfigured(!!configured);
        } catch (err) {
          console.error('Failed to check db configuration:', err);
          setDbConfigured(true);
        }
      };
      checkConfig();
    } else {
      setDbConfigured(true);
    }
  }, []);

  // Synchronize user theme preset with DOM attribute
  useEffect(() => {
    if (themePreset) {
      document.documentElement.setAttribute('data-preset', themePreset);
    } else {
      document.documentElement.setAttribute('data-preset', 'default');
    }
  }, [themePreset]);



  useEffect(() => {
    initializeSettings();

    // Auto-update listener
    if (window.electronAPI) {
      const cleanupAvailable = window.electronAPI.onUpdateAvailable((info: any) => {
        toast.info("Update Available", {
          description: `Version v${info.version} is available. Go to Settings > About to download and install.`
        });
      });
      
      const cleanupDownloaded = window.electronAPI.onUpdateDownloaded(() => {
        toast("Update Ready to Install", {
          description: "A new version has been downloaded.",
          action: {
            label: "Restart & Update",
            onClick: () => window.electronAPI?.installUpdate()
          },
          duration: Infinity
        });
      });
      
      return () => {
        cleanupAvailable();
        cleanupDownloaded();
      };
    }
  }, [initializeSettings]);

  // Strict Single-Device Login session checking loop
  useEffect(() => {
    let intervalId: any;

    const checkActiveSession = async () => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated || !state.user) return;

      try {
        let activeDeviceId: string | undefined;

        if (window.electronAPI) {
          const user = await window.electronAPI.invoke('db:call', 'rbac', 'getUserById', state.user.id);
          activeDeviceId = user?.permissionOverrides?._active_device_id;
        } else {
          // Fetch the user's latest overrides from Supabase web
          const { data: userRow, error } = await supabase
            .from('users')
            .select('permission_overrides')
            .eq('id', state.user.id)
            .single();

          if (error || !userRow) {
            return;
          }
          const overrides = userRow.permission_overrides as any;
          activeDeviceId = overrides?._active_device_id;
        }

        if (activeDeviceId) {
          let localDeviceId = 'web-browser';
          if (window.electronAPI?.getDeviceId) {
            localDeviceId = await window.electronAPI.getDeviceId();
          } else {
            localDeviceId = localStorage.getItem('device_id') || 'web-browser';
          }

          if (activeDeviceId !== localDeviceId) {
            // Force logout
            toast.error("Session Expired", {
              description: "This account has been logged in on another device. You have been logged out.",
              duration: 8000
            });
            
            useAuthStore.getState().logout();
            await supabase.auth.signOut();
          }
        }
      } catch (err) {
        console.warn('Session check warning:', err);
      }
    };

    // Run check on mount and then every 15 seconds
    checkActiveSession();
    intervalId = setInterval(checkActiveSession, 15000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  if (dbConfigured === false) {
    return (
      <ThemeProvider attribute="class" storageKey="lims-theme" defaultTheme="system" enableSystem>
        <ScribbleBackground />
        <DbWizard onSuccess={() => setDbConfigured(true)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" storageKey="lims-theme" defaultTheme="system" enableSystem>
      <ScribbleBackground />
      <RouterProvider router={router} />
      <WelcomeChangelogModal />
    </ThemeProvider>
  );
}
