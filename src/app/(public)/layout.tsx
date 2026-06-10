'use client';
import Footer from "@/components/app/Footer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Languages, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react";

// --- Composants internes inchangés mais appelés conditionnellement ---

function LanguageSelectorMobile() {
    const [language, setLanguage] = useState("fr");
    const languages = [
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Allemand' },
        { code: 'en', name: 'Anglais' },
        { code: 'ar', name: 'Arabe' },
        { code: 'zh-CN', name: 'Chinois' },
        { code: 'hi', name: 'Hindi' },
        { code: 'it', name: 'Italien' },
        { code: 'ja', name: 'Japonais' },
        { code: 'pt', name: 'Portugais' },
        { code: 'ru', name: 'Russe' },
        { code: 'tr', name: 'Turc' },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                    <Languages className="h-5 w-5 mr-2" />
                    <span>Choisis ta langue :</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={language} onValueChange={setLanguage}>
                    {languages.map(lang => (
                        <DropdownMenuRadioItem key={lang.code} value={lang.code}>{lang.name}</DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function LanguageSelectorDesktop() {
    const [language, setLanguage] = useState("fr");
    const languages = [
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Allemand' },
        { code: 'en', name: 'Anglais' },
        { code: 'ar', name: 'Arabe' },
        { code: 'zh-CN', name: 'Chinois' },
        { code: 'hi', name: 'Hindi' },
        { code: 'it', name: 'Italien' },
        { code: 'ja', name: 'Japonais' },
        { code: 'pt', name: 'Portugais' },
        { code: 'ru', name: 'Russe' },
        { code: 'tr', name: 'Turc' },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                    <Languages className="h-5 w-5 mr-2" />
                    <span>Choisis ta langue :</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={language} onValueChange={setLanguage}>
                    {languages.map(lang => (
                        <DropdownMenuRadioItem key={lang.code} value={lang.code}>{lang.name}</DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const logoUrl = "/icons/logo_Toulouse_Rando512.jpg";
  
  // Correction pour l'hydratation
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <nav className="flex items-center justify-between p-4 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-3">
              <Image src={logoUrl} alt="Toulouse rando Logo" width={40} height={40} className="rounded-md" />
              <span className="text-lg font-bold text-foreground">Toulouse rando</span>
            </Link>
          </div>
          
          <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-x-4">
            {/* On ne rend le sélecteur que si on est sur le client */}
            {mounted && <LanguageSelectorDesktop />}
            <Button asChild variant="ghost">
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">S'inscrire</Link>
            </Button>
          </div>

          <div className="lg:hidden">
            {/* La Sheet de Radix UI est très sensible à l'hydratation */}
            {mounted && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Ouvrir le menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col h-full">
                    <div className="py-6">
                      <LanguageSelectorMobile />
                    </div>
                    <div className="flex-1 py-6">
                      <Link href="/login" className="block py-2 text-lg">Se connecter</Link>
                      <Link href="/signup" className="block py-2 text-lg">S'inscrire</Link>
                    </div>
                    <div className="mt-auto">
                      <Button asChild className="w-full">
                          <Link href="/signup">Rejoignez l'aventure</Link>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </nav>
      </header>
      
      <main className="flex-1 py-12 md:py-16">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
              {children}
          </div>
      </main>
      <Footer />
    </div>
  );
}