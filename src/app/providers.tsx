"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth-provider";
export function Providers({ children }: { children: React.ReactNode }) { const [client] = useState(() => new QueryClient()); return <QueryClientProvider client={client}><AuthProvider>{children}</AuthProvider><Toaster position="top-right" richColors /></QueryClientProvider>; }
