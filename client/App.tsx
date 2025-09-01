import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Conversation from "./pages/Conversation";
import Wallet from "./pages/Wallet";
import BuyNumbers from "./pages/BuyNumbers";
import SubAccounts from "./pages/SubAccounts";
import Pricing from "./pages/Pricing";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          <Route path="/" element={<AppShell />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="conversation" element={<Conversation />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="buy-numbers" element={<BuyNumbers />} />
            <Route path="sub-accounts" element={<SubAccounts />} />
            <Route path="pricing" element={<Pricing />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
