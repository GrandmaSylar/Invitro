  import { createRoot } from "react-dom/client";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import App from "./app/App.tsx";
  import "./styles/index.css" with { type: "css" };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30, // 30 seconds — fast enough for a medical LIMS
        refetchOnWindowFocus: true,
      },
    },
  });

  createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );