import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { ThemeProvider } from "./components/theme/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();

/* ---------------------------
   Theme-aware Loader
---------------------------- */
function FullscreenLoader() {
  return (
    <div className="loader">
      <div className="dots">
        <span />
        <span />
        <span />
      </div>

      <style>{`
        .loader {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-family: sans-serif;

          /* LIGHT MODE DEFAULT */
          background: white;
          color: #111;
        }

        /* DARK MODE SUPPORT (works with Tailwind "dark" class) */
        .dark .loader {
          background: #0b0b0f;
          color: #eee;
        }

        .dots {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;

          background: currentColor;
          animation: bounce 1.2s infinite ease-in-out;
        }

        .dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.3;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------------------
   Router
---------------------------- */
const router = createRouter({
  routeTree,
  basepath: '/',
  context: { queryClient },

  defaultPendingComponent: FullscreenLoader,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/* ---------------------------
   App
---------------------------- */
function App() {
  return <RouterProvider router={router} />;
}

/* ---------------------------
   Root
---------------------------- */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);