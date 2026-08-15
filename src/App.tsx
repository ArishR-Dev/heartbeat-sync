import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoomProvider } from "@/contexts/RoomContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RoomPage from "./pages/RoomPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// App root with provider hierarchy
const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <RoomProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/room" element={<RoomPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RoomProvider>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
