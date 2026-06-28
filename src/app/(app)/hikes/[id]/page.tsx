"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, MapPin, Clock, TrendingUp, CalendarPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// 🎯 Importation dynamique de la carte Leaflet (sans SSR pour éviter les plantages Next.js)
const SingleHikeMap = dynamic(() => import("./SingleHikeMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-mono italic rounded-xl border">
      Chargement de la carte du circuit...
    </div>
  )
});

export default function HikeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [hike, setHike] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHike() {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("hikes")
        .select("*")
        .eq("id", id)
        .single(); // On ne récupère qu'une seule ligne

      if (!error && data) {
        setHike(data);
      } else {
        console.error("Erreur ou tracé introuvable :", error);
      }
      setLoading(false);
    }

    fetchHike();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <span className="text-sm font-mono text-muted-foreground">Chargement des données géographiques...</span>
      </div>
    );
  }

  if (!hike) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-amber-600 font-medium italic">Le circuit demandé est introuvable ou a été retiré.</p>
        <Button onClick={() => router.push("/hikes")} variant="outline">
          Retourner à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-2">
      {/* Bouton Retour */}
      <Button asChild variant="ghost" size="sm" className="hover:bg-slate-100">
        <Link href="/hikes" className="flex items-center gap-1 text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> Retour aux circuits
        </Link>
      </Button>

      {/* En-tête du circuit */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary">{hike.difficulty}</Badge>
            <span className="text-xs text-muted-foreground font-mono">ID: #{hike.id}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{hike.title}</h1>
          <p className="text-muted-foreground flex items-center gap-1 text-sm mt-1">
            <MapPin className="h-4 w-4 text-primary" /> {hike.location}
          </p>
        </div>

        <Button asChild variant="default" className="shadow-md">
          {/* 🎯 CORRECTION ICI : Redirection vers /hikes/create au lieu de /events/create */}
          <Link href={`/hikes/create?hikeId=${hike.id}`}>
            <CalendarPlus className="mr-2 h-4 w-4" /> Organiser cette sortie
          </Link>
        </Button>
      </div>

      {/* DISPOSITION : La carte Leaflet passe EN HAUT sur toute la largeur */}
      <div className="h-[450px] w-full rounded-2xl overflow-hidden border shadow-inner relative z-0">
        <SingleHikeMap hike={hike} />
      </div>

      {/* DISPOSITION : Le tableau récapitulatif passe EN DESSOUS */}
      <div className="w-full">
        <Card className="bg-slate-50/50 border-slate-200">
          <CardContent className="p-6 space-y-6">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Métriques du parcours</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                <span className="text-muted-foreground text-xs flex items-center gap-1 mb-1">
                  <Clock className="h-3.5 w-3.5 text-blue-500" /> Durée estimée
                </span>
                <span className="text-xl font-bold text-slate-800">{hike.duration}</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                <span className="text-muted-foreground text-xs flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Distance totale
                </span>
                <span className="text-xl font-bold text-slate-800">{hike.distance}</span>
              </div>
            </div>

            {hike.description && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-800 text-sm mb-2">Description de l'itinéraire :</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-sans">{hike.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}