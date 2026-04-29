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
          
{/* Dans ton AppLayout, modifie cette ligne : */}
<main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
  {/* On enlève max-w-7xl ou on utilise max-w-full pour les pages avec cartes */}
  <div className="mx-auto w-full"> 
    {children}
  </div>
</main>
          
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}