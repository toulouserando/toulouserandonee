"use client"

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, UserPlus, Check, Loader2, Mountain, Route } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

useEffect(() => {
    async function loadData() {
      if (!eventId) return;
      
      try {
        setLoading(true);
        setErrorMsg(null);
        
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // On utilise !user_id pour dire à Supabase quelle colonne utiliser pour la jointure
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            organizer:profiles!organizer_id (id, identite, avatar_url, role),
            hike:hikes (id, title, location, distance, duration, difficulty),
            participants:event_participants (
              user:profiles!user_id (id, identite, avatar_url)
            )
          `)
          .eq('id', eventId)
          .maybeSingle();

        if (error) throw error;
        setEvent(data);

      } catch (err: any) {
        console.error("Erreur complète:", err);
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [eventId]);

  const handleJoin = async () => {
    if (!currentUser) return alert("Connectez-vous pour participer !");
    setIsJoining(true);

    try {
      const { error } = await supabase
        .from('event_participants')
        .insert({ event_id: event.id, user_id: currentUser.id });

      if (error) throw error;
      
      // On rafraîchit la page pour voir le nouveau participant
      window.location.reload();
    } catch (err) {
      alert("Erreur lors de l'inscription ou vous êtes déjà inscrit.");
    } finally {
      setIsJoining(false);
    }
  };

  // 1. Affichage pendant le chargement
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        <p className="text-slate-500 font-medium">Chargement de votre aventure...</p>
      </div>
    );
  }

  // 2. Si l'événement n'existe pas après le chargement
  if (!event) return notFound();

  const eventDate = new Date(event.date);
  const isParticipant = event.participants?.some((p: any) => p.user.id === currentUser?.id);
  const isFull = (event.participants?.length || 0) >= (event.max_participants || 10);
  const isPast = eventDate < new Date();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* COLONNE GAUCHE : INFOS PRINCIPALES */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex gap-2 mb-4">
              <Badge className={isPast ? "bg-slate-500" : "bg-green-500"}>
                {isPast ? "Terminé" : event.status}
              </Badge>
              {event.hike?.difficulty && (
                <Badge variant="outline" className="border-slate-300 capitalize">
                  {event.hike.difficulty}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-6">
              {event.title}
            </h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-slate-700">
                  {eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-slate-700">
                  {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-red-500" />
                <span className="font-semibold text-slate-700 truncate">{event.meeting_point}</span>
              </div>
            </div>
          </div>

          {/* IMAGE & DESCRIPTION */}
          <Card className="overflow-hidden border-none rounded-[2rem] shadow-lg">
            <div className="relative h-64 md:h-96 w-full">
              <Image 
                src={event.image_url || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200"} 
                alt={event.title} 
                fill 
                className="object-cover"
              />
            </div>
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4">À propos de cette sortie</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {event.description || "L'organisateur n'a pas encore ajouté de description détaillée."}
              </p>
            </CardContent>
          </Card>

          {/* INFOS RANDO (SI LIÉE) */}
          {event.hike && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 text-white p-6 rounded-3xl">
                <Route className="mb-2 h-6 w-6 text-blue-400" />
                <p className="text-xs uppercase font-bold text-slate-400 text-center">Distance</p>
                <p className="text-xl font-black text-center">{event.hike.distance} km</p>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-3xl">
                <Mountain className="mb-2 h-6 w-6 text-green-400" />
                <p className="text-xs uppercase font-bold text-slate-400 text-center">Dénivelé</p>
                <p className="text-xl font-black text-center">{event.hike.elevation || 0} m</p>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-3xl">
                <Clock className="mb-2 h-6 w-6 text-orange-400" />
                <p className="text-xs uppercase font-bold text-slate-400 text-center">Durée</p>
                <p className="text-xl font-black text-center">{event.hike.duration || 'N/A'}</p>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-3xl">
                <MapPin className="mb-2 h-6 w-6 text-red-400" />
                <p className="text-xs uppercase font-bold text-slate-400 text-center">Lieu</p>
                <p className="text-xl font-black text-center truncate">{event.hike.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* COLONNE DROITE : SIDEBAR INSCRIPTION */}
        <div className="space-y-6">
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden sticky top-8">
            <div className="bg-blue-600 p-8 text-white text-center">
              <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Places disponibles</p>
              <h2 className="text-5xl font-black">
                {event.participants?.length || 0} / {event.max_participants || 10}
              </h2>
            </div>
            <CardContent className="p-8 space-y-6">
              {isParticipant ? (
                <Button className="w-full h-16 rounded-2xl bg-slate-100 text-slate-500 font-bold text-lg" disabled>
                  <Check className="mr-2" /> Déjà inscrit !
                </Button>
              ) : isPast ? (
                <Button className="w-full h-16 rounded-2xl bg-slate-200 text-slate-400 font-bold text-lg" disabled>
                  Sortie terminée
                </Button>
              ) : isFull ? (
                <Button className="w-full h-16 rounded-2xl bg-orange-100 text-orange-600 font-bold text-lg" disabled>
                  Événement complet
                </Button>
              ) : (
                <Button 
                  onClick={handleJoin} 
                  disabled={isJoining}
                  className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg hover:scale-[1.02] transition-all"
                >
                  {isJoining ? <Loader2 className="animate-spin" /> : <><UserPlus className="mr-2" /> Rejoindre la rando</>}
                </Button>
              )}
              
              <Separator />

              {/* ORGANISATEUR */}
              <div className="flex items-center gap-4 py-2">
                <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xl">
                  {event.organizer?.identite?.charAt(0).toUpperCase() || "O"}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Organisateur</p>
                  <p className="font-bold text-slate-900">{event.organizer?.identite || "Membre"}</p>
                </div>
              </div>

              {/* LISTE PARTICIPANTS MINI */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Aventuriers inscrits</p>
                <div className="flex flex-wrap gap-2">
                  {event.participants?.map((p: any) => (
                    <div key={p.user.id} className="group relative">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm overflow-hidden">
                        {p.user.avatar_url ? (
                          <Image src={p.user.avatar_url} alt="avatar" fill className="object-cover" />
                        ) : (
                          p.user.identite?.charAt(0)
                        )}
                      </div>
                    </div>
                  ))}
                  {(!event.participants || event.participants.length === 0) && (
                    <p className="text-sm text-slate-400 italic">Soyez le premier à vous inscrire !</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}