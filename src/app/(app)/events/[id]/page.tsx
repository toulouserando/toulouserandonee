"use client"

import { useEffect, useState, use } from "react"; // Ajout de use
import { supabase } from "@/lib/supabase";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, TrendingUp, UserPlus, Check, Star, CloudSun, Sun, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Typage des params pour Next.js 15
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  // --- Correction Next.js 15 ---
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  // -----------------------------

  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
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
          .eq('id', eventId) // Utilisation de eventId
          .single();

        if (error || !data) {
            setEvent(null);
        } else {
            setEvent(data);
        }
      } catch (err) {
        console.error(err);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }
    
    if (eventId) {
      loadData();
    }
  }, [eventId]); // On écoute eventId

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
      // Au lieu de reload(), on peut simplement mettre à jour l'état ou refresh
      window.location.reload(); 
    }
    setIsJoining(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-green-600" /></div>;
  if (!event) notFound();

  const eventDate = new Date(event.date);
  const isParticipant = event.participants?.some((p: any) => p.user.id === currentUser?.id);
  const isFull = (event.participants?.length || 0) >= event.max_participants;

  return (
    <div className="grid lg:grid-cols-3 gap-8 p-4 md:p-8">
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div>
          <Badge variant="secondary" className="mb-2 bg-green-100 text-green-700 hover:bg-green-100 border-none">
            {event.status}
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">{event.title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 text-slate-500 mt-4 font-medium">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span>{eventDate.toLocaleDateString('fr-FR', { dateStyle: 'full' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span>{eventDate.toLocaleTimeString('fr-FR', { timeStyle: 'short' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span>{event.meeting_point}</span>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <Card className="overflow-hidden border-slate-200 rounded-3xl shadow-sm">
          <CardHeader className="bg-slate-50/50">
            <CardTitle className="text-lg">Le circuit</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-video bg-slate-100 flex flex-col items-center justify-center border-t">
              <MapPin className="w-12 h-12 text-slate-300 mb-2" />
              <span className="text-slate-400 font-medium italic">Carte interactive bientôt disponible</span>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="border-slate-200 rounded-3xl shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg">Description de la sortie</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed">{event.description || "Aucune description fournie."}</p>
                <Separator className="my-6" />
                <div className="flex items-start gap-2 text-sm bg-blue-50 p-4 rounded-2xl text-blue-800">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Point de rendez-vous précis : <strong>{event.meeting_point}</strong></span>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Hike Details */}
        {event.hike && (
          <Card className="bg-green-600 text-white border-none rounded-3xl shadow-lg">
            <CardHeader><CardTitle className="text-white">Détails de l'itinéraire : {event.hike.title}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
              <div className="flex flex-col gap-1">
                  <span className="text-green-100 text-xs uppercase font-bold tracking-wider">Lieu</span>
                  <span className="font-bold">{event.hike.location}</span>
              </div>
              <div className="flex flex-col gap-1">
                  <span className="text-green-100 text-xs uppercase font-bold tracking-wider">Distance</span>
                  <span className="font-bold">{event.hike.distance}</span>
              </div>
              <div className="flex flex-col gap-1">
                  <span className="text-green-100 text-xs uppercase font-bold tracking-wider">Durée estimée</span>
                  <span className="font-bold">{event.hike.duration}</span>
              </div>
              <div className="flex flex-col gap-1">
                  <span className="text-green-100 text-xs uppercase font-bold tracking-wider">Difficulté</span>
                  <Badge className="bg-white text-green-700 hover:bg-white border-none font-bold w-fit">{event.hike.difficulty}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="border-2 border-green-600 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-green-600 text-white text-center pb-8">
            <CardTitle className="text-xl">Prêt pour l'aventure ?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 -mt-6 bg-white p-6 rounded-t-3xl">
            {isParticipant ? (
              <Button size="lg" variant="secondary" className="w-full bg-slate-100 text-slate-500 rounded-xl h-12" disabled>
                <Check className="mr-2 h-5 w-5" /> Vous êtes inscrit
              </Button>
            ) : isFull ? (
              <Button size="lg" variant="outline" className="w-full rounded-xl h-12 border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100">
                Complet (Liste d'attente)
              </Button>
            ) : (
              <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 shadow-lg transition-all" onClick={handleJoin} disabled={isJoining}>
                {isJoining ? <Loader2 className="animate-spin h-5 w-5" /> : <><UserPlus className="mr-2 h-5 w-5" /> Rejoindre la sortie</>}
              </Button>
            )}
            <p className="text-[10px] text-center text-slate-400">En vous inscrivant, vous acceptez de respecter la charte du randonneur.</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-sm uppercase tracking-widest text-slate-500">Organisé par</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-6">
            {event.organizer?.avatar_url ? (
              <Image src={event.organizer.avatar_url} alt="Avatar" width={56} height={56} className="rounded-2xl shadow-sm border-2 border-white" />
            ) : (
                <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center font-black text-xl">
                    {event.organizer?.identite?.charAt(0)}
                </div>
            )}
            <div>
              <p className="font-bold text-slate-900">{event.organizer?.identite}</p>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px] uppercase">{event.organizer?.role || "Membre"}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm uppercase tracking-widest text-slate-500">Participants</span>
              <Badge variant="outline" className="bg-white">
                {event.participants?.length || 0} / {event.max_participants}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
                {event.participants?.map((p: any) => (
                <div key={p.user.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                    {p.user.avatar_url ? (
                    <Image src={p.user.avatar_url} alt="Avatar" width={32} height={32} className="rounded-lg shadow-sm" />
                    ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        {p.user.identite?.charAt(0)}
                    </div>
                    )}
                    <span className="font-semibold text-sm text-slate-700">{p.user.identite}</span>
                </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}