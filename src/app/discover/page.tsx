import { Card, CardContent } from "@/components/ui/card";
import { mockHikes } from "@/lib/mock-data";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, MapPin, PlusCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/app/Footer";

function HikeCard({ hike }: { hike: typeof mockHikes[0] }) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <div className="relative">
                <Image
                    src={hike.imageUrl}
                    alt={hike.title}
                    width={600}
                    height={400}
                    className="w-full h-48 object-cover"
                    data-ai-hint={hike.imageHint}
                />
                <Badge variant={hike.type === "Open Topo Maps" ? "default" : "secondary"} className="absolute top-2 right-2">{hike.type}</Badge>
            </div>
            <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-bold font-headline mb-2">{hike.title}</h3>
                <div className="text-sm text-muted-foreground space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{hike.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{hike.distance} / {hike.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <Badge variant="outline">{hike.difficulty}</Badge>
                    </div>
                </div>
                <Button asChild className="w-full mt-4">
                    <Link href="/signup">
                        S'inscrire pour participer
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

export default function DiscoverPage() {
    const logoUrl = "/icons/logo_Toulouse_Rando.jpg";
    
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <nav className="flex items-center justify-between p-4 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-3">
              <Image src={logoUrl} alt="Toulouse rando Logo" width={40} height={40} className="rounded-md" />
              <span className="text-lg font-bold text-foreground">Toulouse rando</span>
            </Link>
          </div>
          <div className="flex lg:flex-1 lg:justify-end gap-x-4">
            <Button asChild variant="ghost">
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">S'inscrire</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1 py-12 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
                    Découvrez nos randonnées
                </h1>
                <p className="mt-4 text-lg leading-8 text-muted-foreground">
                    Parcourez les circuits et trouvez votre prochaine aventure.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mockHikes.map(hike => (
                    <HikeCard key={hike.id} hike={hike} />
                ))}
            </div>
             <div className="text-center mt-16">
                 <Button asChild size="lg">
                    <Link href="/signup">
                        Prêt(e) à nous rejoindre ? Créez un compte !
                    </Link>
                </Button>
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
