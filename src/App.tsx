import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "@/contexts/StoreContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import OrderTracking from "./pages/OrderTracking";
import Entrega from "./pages/Entrega";
import Profile from "./pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <StoreProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/pedido" element={<OrderTracking />} />
                <Route path="/entrega" element={<Entrega />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </StoreProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);
export default App;
