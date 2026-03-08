import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import ChatPage from "./pages/ChatPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminIngestPage from "./pages/AdminIngestPage";
import AdminArticlesPage from "./pages/AdminArticlesPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminEvalPage from "./pages/AdminEvalPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/ingest" element={<AdminIngestPage />} />
            <Route path="/admin/articles" element={<AdminArticlesPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/eval" element={<AdminEvalPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
