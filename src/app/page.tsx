
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Mountain, Users, Map, CalendarHeart, Share2, Download, Menu, Languages } from 'lucide-react';
import { ImageGallery } from '@/components/app/ImageGallery';
import { Badge } from '@/components/ui/badge';
import Footer from '@/components/app/Footer';
import GoogleIcon from '@/components/icons/GoogleIcon';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { useState } from 'react';


function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.39,14.73A5.43,5.43,0,0,1,16.5,13.3a5.53,5.53,0,0,1,2.53-4.43,4.91,4.91,0,0,0-4-2.74,5.43,5.43,0,0,0-5,3.31,5.65,5.65,0,0,0-3.32-.93,5,5,0,0,0-4.48,5.15c0,3.32,2.37,5,4.43,5a4.5,4.5,0,0,0,3.21-1.22,4.61,4.61,0,0,0,3.12,1.22,4.86,4.86,0,0,0,4.48-5.07ZM15.3,5.84A4.69,4.69,0,0,1,16.5,5.7a4.34,4.34,0,0,1-1.89,3.4A4.3,4.3,0,0,1,12.9,8,5.06,5.06,0,0,1,15.3,5.84Z" />
    </svg>
  );
}

function AndroidIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2z"/>
      <path d="M12 18v.01"/>
    </svg>
  );
}

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

export default function LandingPage() {
  const logoUrl = "/icons/logo_Toulouse_Rando300.jpg";
  const randonneeTypes = [
    "randonnée pédestre", "randonnée nordique", "randonnée aquatique", "randonnée équestre",
    "randonnée cycliste", "randonnée à raquettes", "randonnée urbaine", "randonnée de montagne",
    "randonnée de forêt", "randonnée de plaine", "randonnée côtière", "randonnée littorale",
    "randonnée patrimoniale", "randonnée historique", "randonnée Gourmande", "randonnée botanique",
    "randonnée à thème", "randonnée pèlerine", "randonnée nocturne", "randonnée itinérante",
    "Trekking", "visite de ville", "balade"
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-3">
              <Image src={logoUrl} alt="Toulouse rando Logo" width={50} height={50} className="rounded-md" />
              <span className="text-xl font-bold text-foreground">Toulouse rando</span>
            </Link>
          </div>
           <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-x-4">
            <LanguageSelectorDesktop />
            <Button asChild variant="ghost">
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">S'inscrire</Link>
            </Button>
          </div>
          <div className="lg:hidden">
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
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative isolate pt-14">
           <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-accent opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="py-24 sm:py-32 lg:pb-40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl font-headline">
                  Toulouse Rando, le rendez-vous des randonnées autour de Toulouse
                </h1>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                  Découvrez et partagez des circuits de randonnée uniques en ville, à la montagne ou à la campagne. Rejoignez une communauté de passionnés et créez vos propres aventures. C'est gratuit et sans limite !
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Button asChild size="lg">
                    <Link href="/signup">Commencer l'aventure</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/discover">Découvrir les randos</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <section className="py-24 sm:py-32 bg-secondary">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-accent">Nos Aventures</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
                Des balades, des randonnées, partout en Occitanie.
              </p>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                De la ville aux sommets, chaque sortie est une nouvelle histoire à raconter.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-5xl sm:mt-20 lg:mt-24">
                <ImageGallery />
            </div>
          </div>
        </section>

        {/* Rando Types Section */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline mb-8">
                    Pour tous les goûts et tous les niveaux
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                    {randonneeTypes.map((type) => (
                        <Badge key={type} variant="outline" className="text-sm capitalize py-1 px-3">
                            {type}
                        </Badge>
                    ))}
                </div>
            </div>
          </div>
        </section>

        {/* Share and Install Section */}
        <section className="py-24 sm:py-32 bg-muted/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
                Partagez et emportez l'aventure partout !
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Faites découvrir Toulouse Rando à vos amis et installez l'application sur votre téléphone pour un accès rapide.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="outline">
                  <Share2 className="mr-2" />
                  Partager le lien de l'application
                </Button>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Button size="lg" className="bg-black hover:bg-black/80 text-white">
                    <GoogleIcon className="mr-2 h-6 w-6" />
                    <div className="text-left">
                      <div className="text-xs">DISPONIBLE SUR</div>
                      <div className="text-lg font-semibold -mt-1">Google Play</div>
                    </div>
                  </Button>
                  <Button size="lg" className="bg-black hover:bg-black/80 text-white">
                    <AppleIcon className="mr-2 h-7 w-7" />
                    <div className="text-left">
                      <div className="text-xs">Installer sur</div>
                      <div className="text-lg font-semibold -mt-1">votre iPhone</div>
                    </div>
                  </Button>
                  <Button size="lg" className="bg-black hover:bg-black/80 text-white">
                    <AndroidIcon className="mr-2 h-7 w-7" />
                    <div className="text-left">
                      <div className="text-xs">Installer sur</div>
                      <div className="text-lg font-semibold -mt-1">Androïd</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
