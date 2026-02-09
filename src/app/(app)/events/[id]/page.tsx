"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, TrendingUp, UserPlus, Check, Star, CloudSun, Sun, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      // 1. Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 2. Récupérer l'événement avec les jointures
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!organizer_id (id, identite, avatar_url, role),
          hike:hikes (id, title, location, distance, duration, difficulty),
          participants:event_participants (
            user:profiles (id, identite, avatar_url)
          )
        `)
        .eq('id', params.id)
        .single();

      if (error || !data) return setEvent(null);
      setEvent(data);
      setLoading(false);
    }
    loadData();
  }, [params.id]);

  const handleJoin = async () => {
    if (!currentUser) return alert("Connectez-vous pour participer !");
    setIsJoining(true);

    const { error } = await supabase
      .from('event_participants')
      .insert({ event_id: event.id, user_id: currentUser.id });

    if (error) {
      alert("Erreur ou déjà inscrit !");
    } else {
      router.refresh();
      window.location.reload(); // Pour rafraîchir la liste simplement
    }
    setIsJoining(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
  if (!event) notFound();

  const eventDate = new Date(event.date);
  const isParticipant = event.participants.some((p: any) => p.user.id === currentUser?.id);
  const isFull = event.participants.length >= event.max_participants;

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div>
          <Badge variant="secondary" className="mb-2">{event.status}</Badge>
          <h1 className="text-3xl lg:text-4xl font-bold font-headline">{event.title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 text-muted-foreground mt-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{eventDate.toLocaleDateString('fr-FR', { dateStyle: 'full' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{eventDate.toLocaleTimeString('fr-FR', { timeStyle: 'short' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{event.meeting_point}</span>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <Card>
          <CardHeader><CardTitle>Le circuit</CardTitle></CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
              <MapPin className="w-12 h-12 text-muted-foreground opacity-20" />
              <span className="text-muted-foreground ml-2 italic">Carte interactive bientôt disponible</span>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader><CardTitle>Description de la sortie</CardTitle></CardHeader>
          <CardContent className="prose prose-sm max-w-none text-foreground dark:prose-invert">
            <p>{event.description || "Aucune description fournie."}</p>
            <Separator className="my-4" />
            <p className="text-sm">Rendez-vous à <strong>{event.meeting_point}</strong>.</p>
          </CardContent>
        </Card>

        {/* Hike Details */}
        {event.hike && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader><CardTitle>Circuit : {event.hike.title}</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm font-medium">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {event.hike.location}</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {event.hike.distance}</div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {event.hike.duration}</div>
              <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> <Badge variant="outline">{event.hike.difficulty}</Badge></div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="border-2 border-primary shadow-lg">
          <CardHeader><CardTitle>S'inscrire</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isParticipant ? (
              <Button size="lg" variant="secondary" className="w-full" disabled>
                <Check className="mr-2 h-4 w-4" /> Déjà inscrit
              </Button>
            ) : isFull ? (
              <Button size="lg" variant="outline" className="w-full">Liste d'attente</Button>
            ) : (
              <Button size="lg" className="w-full" onClick={handleJoin} disabled={isJoining}>
                {isJoining ? <Loader2 className="animate-spin h-4 w-4" /> : <><UserPlus className="mr-2 h-4 w-4" /> Participer</>}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Organisateur</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-4">
            {event.organizer?.avatar_url && (
              <Image src={event.organizer.avatar_url} alt="Avatar" width={48} height={48} className="rounded-full shadow-sm" />
            )}
            <div>
              <p className="font-semibold">{event.organizer?.identite}</p>
              <p className="text-sm text-muted-foreground">{event.organizer?.role || "Membre"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Participants</span>
              <span className="text-sm font-medium text-muted-foreground">
                {event.participants.length} / {event.max_participants}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {event.participants.map((p: any) => (
              <div key={p.user.id} className="flex items-center gap-3">
                {p.user.avatar_url ? (
                  <Image src={p.user.avatar_url} alt="Avatar" width={32} height={32} className="rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs">
                    {p.user.identite.charAt(0)}
                  </div>
                )}
                <span className="font-medium text-sm">{p.user.identite}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}