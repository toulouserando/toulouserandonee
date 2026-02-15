"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, PlusCircle, ArrowUpRight, Loader2 } from "lucide-react";
import Link from "next/link";

function EventCard({ event }: { event: any }) {
  const participantsCount = event.event_participants?.[0]?.count || 0;
  const organizer = event.profiles;

  // Sécurité pour la date : si la date est invalide, on affiche "Date à venir"
  const eventDate = new Date(event.date);
  const isValidDate = !isNaN(eventDate.getTime());

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="font-headline text-lg mb-0">{event.title}</CardTitle>
          <Badge variant={event.status === 'À venir' ? 'secondary' : 'outline'}>
            {event.status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2 pt-2">
          <Calendar className="h-4 w-4" />
          <span>
            {isValidDate 
              ? `${eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
              : "Date non définie"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span className="truncate">RDV : {event.meeting_point}</span>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          {organizer?.avatar_url ? (
            <Image src={organizer.avatar_url} alt={organizer.identite} width={24} height={24} className="rounded-full object-cover h-6 w-6" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
              {organizer?.identite?.charAt(0) || '?'}
            </div>
          )}
          <span>Organisé par <span className="font-semibold text-foreground">{organizer?.identite || 'Anonyme'}</span></span>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center gap-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-blue-600">
            {participantsCount} / {event.max_participants}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Places</span>
        </div>
        <Button asChild size="sm" className="rounded-full">
          <Link href={`/events/${event.id}`}>
            Détails <ArrowUpRight className="ml-2 h-4 w-4" />
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

        // Requête Supabase
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            profiles:organizer_id (identite, avatar_url),
            event_participants(count)
          `)
          .order('date', { ascending: true });

        if (error) {
          // ICI on capture le vrai message pour le voir sur l'écran
          console.error("DEBUG SUPABASE:", error);
          setErrorMsg(error.message);
          return;
        }

        setEvents(data || []);
      } catch (err: any) {
        console.error("DEBUG CRASH:", err);
        setErrorMsg("Une erreur inattendue est survenue.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">RANDONNÉES</h1>
          <p className="text-slate-500 font-medium">Trouve ta prochaine sortie en Occitanie.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg">
          <Link href="/events/create">
            <PlusCircle className="mr-2 h-5 w-5" /> Créer une sortie
          </Link>
        </Button>
      </div>

      {/* Affichage de l'erreur si elle existe */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
          <p className="font-bold">Erreur de chargement :</p>
          <p className="text-sm">{errorMsg}</p>
          <p className="text-[10px] mt-2 italic text-red-400">Vérifiez les politiques RLS ou le nom de la colonne organizer_id.</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-400 font-medium animate-pulse">Recherche des sentiers...</p>
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : !errorMsg && (
        <div className="text-center py-20 border-2 border-dashed rounded-[2rem] bg-slate-50">
          <p className="text-slate-500 mb-4">Aucune randonnée prévue pour le moment.</p>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/events/create">Soyez le premier à en créer une !</Link>
          </Button>
        </div>
      )}
    </div>
  );
}