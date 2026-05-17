import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { ThemeProvider } from "next-themes";
import { router } from "./routes";
import { useSettingsStore } from "../stores/useSettingsStore";
import { toast } from "sonner";

// INVITRO AIDMED DIAGNOSTICS - Laboratory Inventory Management System
export default function App() {
  const initializeSettings = useSettingsStore(state => state.initialize);

  useEffect(() => {
    initializeSettings();

    // Auto-update listener
    if (window.electronAPI) {
      const cleanupAvailable = window.electronAPI.onUpdateAvailable(() => {
        toast.info("Update Downloading", {
          description: "A new version of Invitro LIMS is being downloaded in the background."
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

  return (
    <ThemeProvider attribute="class" storageKey="lims-theme" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
