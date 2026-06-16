import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { ThemeProvider } from "next-themes";
import { router } from "./routes";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useAuthStore } from "../stores/useAuthStore";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

// INVITRO AIDMED DIAGNOSTICS - Laboratory Inventory Management System
export default function App() {
  const initializeSettings = useSettingsStore(state => state.initialize);
  const themePreset = useAuthStore(state => state.user?.themePreset);

  // Synchronize user theme preset with DOM attribute
  useEffect(() => {
    if (themePreset) {
      document.documentElement.setAttribute('data-preset', themePreset);
    } else {
      document.documentElement.setAttribute('data-preset', 'default');
    }
  }, [themePreset]);

  // Listen to Supabase auth state changes and sync sessions with Electron main process
  useEffect(() => {
    // Explicit session check on startup to sync session with main process
    const syncSession = async () => {
      if (window.electronAPI?.updateSupabaseSession) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await window.electronAPI.updateSupabaseSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            });
          }
        } catch (err) {
          console.error('Failed to sync initial session with Main process:', err);
        }
      }
    };
    syncSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (window.electronAPI?.updateSupabaseSession) {
        if (session) {
          try {
            await window.electronAPI.updateSupabaseSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            });
          } catch (err) {
            console.error('Failed to sync session with Main process:', err);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
        // Fetch the user's latest overrides from Supabase
        const { data: userRow, error } = await supabase
          .from('users')
          .select('permission_overrides')
          .eq('id', state.user.id)
          .single();

        if (error || !userRow) {
          return;
        }

        const overrides = userRow.permission_overrides as any;
        const activeDeviceId = overrides?._active_device_id;

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

  return (
    <ThemeProvider attribute="class" storageKey="lims-theme" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
