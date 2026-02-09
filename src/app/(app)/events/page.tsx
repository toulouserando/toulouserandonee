"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, PlusCircle, ArrowUpRight, Loader2 } from "lucide-react";
import Link from "next/link";

// Typage pour TypeScript basé sur la structure de ta DB
interface EventWithDetails {
  id: string;
  title: string;
  date: string;
  status: string;
  meeting_point: string;
  max_participants: number;
  profiles: {
    identite: string;
    avatar_url: string | null;
  };
  event_participants: { count: number }[];
}

function EventCard({ event }: { event: any }) {
  // On calcule le nombre de participants à partir de la jointure
  const participantsCount = event.event_participants?.[0]?.count || 0;
  const organizer = event.profiles;

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
            {new Date(event.date).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} à {new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>RDV : {event.meeting_point}</span>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          {organizer?.avatar_url ? (
            <Image src={organizer.avatar_url} alt={organizer.identite} width={24} height={24} className="rounded-full" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px]">
              {organizer?.identite?.charAt(0)}
            </div>
          )}
          <span>Organisé par <span className="font-semibold text-foreground">{organizer?.identite || 'Anonyme'}</span></span>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {participantsCount} / {event.max_participants}
          </span>
          <span className="text-xs text-muted-foreground text-nowrap">participants</span>
        </div>
        <Button asChild size="sm">
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

  useEffect(() => {
    async function fetchEvents() {
      try {
        // Requête Supabase : on récupère l'event + le profil de l'organisateur + le compte des participants
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            profiles:organizer_id (identite, avatar_url),
            event_participants(count)
          `)
          .order('date', { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error("Erreur lors du chargement des événements:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Inscris-toi à une randonnée</h1>
          <p className="text-muted-foreground">Trouve ta prochaine sortie et rejoins d'autres passionnés.</p>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link href="/events/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Créer une sortie
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des randonnées...</p>
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border rounded-lg bg-muted/10">
          <p className="text-muted-foreground">Aucune randonnée prévue pour le moment.</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/events/create">Soyez le premier à en créer une !</Link>
          </Button>
        </div>
      )}
    </div>
  );
}