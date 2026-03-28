import { RouterProvider } from "react-router";
import { ThemeProvider } from "next-themes";
import { router } from "./routes";

// INVITRO AIDMED DIAGNOSTICS - Laboratory Inventory Management System
export default function App() {
  return (
    <ThemeProvider attribute="class" storageKey="lims-theme" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
