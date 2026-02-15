"use client"; // Optionnel ici, mais recommandé si tu as des composants interactifs
import dynamic from "next/dynamic";
import AppSidebar from "@/components/app/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Footer from "@/components/app/Footer";

// On remplace l'import statique par un import dynamique sans SSR
// Cela évite les erreurs d'ID (radix-...) sur TOUTES les pages
const AppHeader = dynamic(() => import("@/components/app/AppHeader"), { 
  ssr: false 
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          {/* Le Header est maintenant "Safe" pour toutes les pages */}
          <AppHeader />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </main>
          
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}