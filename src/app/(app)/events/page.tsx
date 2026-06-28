"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, PlusCircle, ArrowUpRight, Mountain, Route, History, Sparkles, Loader2, Compass, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';

function EventCard({ event }: { event: any }) {
  // Adaptation aux alias de la requête
  const participantsCount = event.event_participants?.[0]?.count ?? 0;
  const organizer = event.organizer; 
  const eventDate = new Date(event.date);
  const isValidDate = !isNaN(eventDate.getTime());
  const isPast = eventDate < new Date() || event.status === 'Terminé';

  return (
    <Card className={`flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md ${isPast ? 'opacity-85' : ''}`}>
      <div className="relative h-48 w-full bg-slate-200">
        <Image 
          src={event.image_url || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800"} 
          alt={event.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={isPast ? 'bg-slate-500' : 'bg-green-500 hover:bg-green-600'}>
            {isPast ? 'Terminé' : (event.status || 'À venir')}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="font-bold text-xl leading-tight truncate text-slate-900">
          {event.title}
        </CardTitle>
        <div className="text-sm text-slate-500 flex items-center gap-2 pt-1">
          <Calendar className={`h-4 w-4 ${isPast ? 'text-slate-400' : 'text-blue-500'}`} />
          <span className="capitalize font-medium">
            {isValidDate 
              ? eventDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
              : "Date non définie"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="flex items-center gap-4 text-sm text-slate-600 font-semibold">
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
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${isPast ? 'bg-slate-400' : 'bg-blue-600'} text-white`}>
            {organizer?.identite?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-slate-400 uppercase font-bold">
              Par {organizer?.identite || 'Anonyme'}
            </span>
            <span className="text-sm font-black text-slate-700">
              {participantsCount} / {event.max_participants || 10} places
            </span>
          </div>
        </div>
        
        <Button asChild size="sm" variant={isPast ? "outline" : "default"} className={isPast ? "" : "bg-slate-900 hover:bg-blue-600 text-white font-bold"}>
          <Link href={`/events/${event.id}`}>
            {isPast ? 'Souvenirs' : 'Voir'} <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function EventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
async function fetchEvents() {
  try {
    setLoading(true);
    setErrorMsg(null);
    const now = new Date();

    // Modification de la ligne event_participants
const { data: allEvents, error } = await supabase
  .from('events')
  .select(`
    *, 
    organizer:profiles!organizer_id (identite), 
    event_participants!event_participants_event_id_fkey (user_id)
  `)
  .order('date', { ascending: true });

    if (error) {
      // On log les détails séparément pour forcer l'affichage
      console.error("Code erreur:", error.code);
      console.error("Message erreur:", error.message);
      console.error("Détails erreur:", error.details);
      throw error;
    }

    if (allEvents) {
      // On transforme les données pour compter les participants localement
      const formattedEvents = allEvents.map(e => ({
        ...e,
        participant_count: e.event_participants?.length || 0
      }));

      const upcoming = formattedEvents.filter(e => {
        const eventDate = new Date(e.date);
        return e.status === 'À venir' || eventDate >= now;
      });

      const past = formattedEvents.filter(e => {
        const eventDate = new Date(e.date);
        return e.status === 'Terminé' || eventDate < now;
      }).reverse().slice(0, 6);

      setUpcomingEvents(upcoming);
      setPastEvents(past);
    }

  } catch (err: any) {
    console.error("Erreur complète capturée:", err);
    setErrorMsg("Erreur de liaison avec la base de données.");
  } finally {
    setLoading(false);
  }
}
    fetchEvents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-slate-900 italic">EXPLOREZ.</h1>
          <p className="text-xl text-slate-500 font-medium">Rejoignez une aventure ou créez la vôtre.</p>
        </div>
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-7 rounded-2xl shadow-xl hover:scale-105 transition-all cursor-pointer">
      <PlusCircle className="mr-2 h-6 w-6" /> Créer une sortie
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl">
    <DropdownMenuItem onClick={() => router.push('/events/create')} className="cursor-pointer py-2">
      <PlusCircle className="mr-2 h-4 w-4" /> Créer un circuit libre
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => router.push('/explorer')} className="cursor-pointer py-2">
      {/* Utilisation de Compass au lieu de Map pour éviter l'erreur TypeError */}
      <Compass className="mr-2 h-4 w-4" /> Proposer un circuit connu
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Section Futur */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <Sparkles className="text-blue-500 h-7 w-7" />
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Prochaines sorties</h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
             <div className="col-span-full py-20 flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <p className="text-slate-400 font-medium">Recherche des meilleurs sentiers...</p>
             </div>
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-semibold text-lg">Aucune rando prévue pour le moment.</p>
            <p className="text-slate-400 text-sm">Soyez le premier à proposer une aventure !</p>
          </div>
        )}
      </section>

      {/* Section Passé */}
      {pastEvents.length > 0 && !loading && (
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <History className="text-slate-400 h-7 w-7" />
            <h2 className="text-3xl font-black text-slate-600 tracking-tight">Ils l'ont fait</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pastEvents.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        </section>
      )}
    </div>
  );
}