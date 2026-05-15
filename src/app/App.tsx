import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { ThemeProvider } from "next-themes";
import { router } from "./routes";
import { useSettingsStore } from "../stores/useSettingsStore";

// INVITRO AIDMED DIAGNOSTICS - Laboratory Inventory Management System
export default function App() {
  const initializeSettings = useSettingsStore(state => state.initialize);

  useEffect(() => {
    initializeSettings();
  }, [initializeSettings]);

  return (
    <ThemeProvider attribute="class" storageKey="lims-theme" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
