"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, PlusCircle, ArrowUpRight, Loader2, Mountain, Route } from "lucide-react";
import Link from "next/link";

function EventCard({ event }: { event: any }) {
  // Gestion sécurisée du compte des participants
  const participantsCount = event.event_participants?.[0]?.count ?? 0;
  const organizer = event.profiles;

  const eventDate = new Date(event.date);
  const isValidDate = !isNaN(eventDate.getTime());

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md">
      <div className="relative h-48 w-full bg-slate-200">
        <Image 
          src={event.image_url || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800"} 
          alt={event.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={event.status === 'À venir' ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-500'}>
            {event.status || 'Prévu'}
          </Badge>
          {event.difficulty && (
             <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-slate-900 border-none">
               {event.difficulty.toUpperCase()}
             </Badge>
          )}
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="font-bold text-xl leading-tight truncate">
          {event.title}
        </CardTitle>
        <div className="text-sm text-slate-500 flex items-center gap-2 pt-1">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span className="capitalize">
            {isValidDate 
              ? eventDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
              : "Date non définie"}
            {isValidDate && ` à ${eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <Route className="h-4 w-4 text-slate-400" />
            <span>{event.distance || 0} km</span>
          </div>
          <div className="flex items-center gap-1">
            <Mountain className="h-4 w-4 text-slate-400" />
            <span>{event.elevation || 0} m</span>
          </div>
        </div>

        <div className="text-sm text-slate-500 flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 text-red-400 shrink-0" />
          <span className="line-clamp-1">{event.meeting_point || "Lieu non précisé"}</span>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center bg-slate-50/50 border-t p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {organizer?.identite?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold leading-none">
              Par {organizer?.identite || 'Anonyme'}
            </span>
            <span className="text-sm font-black text-slate-700">
              {participantsCount} / {event.max_participants || 10} places
            </span>
          </div>
        </div>
        
        <Button asChild size="sm" className="bg-slate-900 hover:bg-blue-600 text-white rounded-lg transition-colors">
          <Link href={`/events/${event.id}`}>
            Voir <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        setErrorMsg(null);

        // REQUÊTE SÉCURISÉE AVEC JOINTURE FORCÉE
// Dans ton useEffect de fetchEvents
const { data, error } = await supabase
  .from('events')
  .select(`
    *,
    profiles!organizer_id (identite),
    event_participants(count)
  `)
  .eq('status', 'À venir') // On filtre sur le statut au lieu de is_published
  .order('date', { ascending: true });

        if (error) {
          console.error("Détail Erreur Supabase:", error.message, error.details);
          throw error;
        }

        setEvents(data || []);
      } catch (err: any) {
        setErrorMsg(err.message || "Erreur lors de la récupération des données.");
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 italic">EXPLOREZ.</h1>
          <p className="text-lg text-slate-500 font-medium">Les prochaines sorties rando à Toulouse et alentours.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-2xl shadow-xl hover:scale-105 transition-transform">
          <Link href="/events/create" className="text-lg font-bold">
            <PlusCircle className="mr-2 h-6 w-6" /> Créer une sortie
          </Link>
        </Button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          <p className="font-bold">Problème de connexion :</p>
          <p className="text-sm opacity-90">{errorMsg}</p>
          <p className="text-[10px] mt-2 italic">Astuce : Vérifiez que organizer_id est bien lié à la table profiles dans Supabase.</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 w-full bg-slate-100 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <h3 className="text-2xl font-bold text-slate-400">Aucun sentier à l'horizon...</h3>
          <p className="text-slate-400 mb-6">Soyez le premier à proposer une aventure !</p>
          <Button asChild variant="outline" className="rounded-full px-8">
            <Link href="/events/create">Lancer une rando</Link>
          </Button>
        </div>
      )}
    </div>
  );
}