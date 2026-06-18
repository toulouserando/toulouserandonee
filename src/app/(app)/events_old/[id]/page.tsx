"use client"

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from 'next/dynamic'; // 🌟 Ajouté pour Leaflet SSR-safe
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, UserPlus, Check, Loader2, Mountain, Route } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// 🎨 Import des styles Leaflet nécessaires
import 'leaflet/dist/leaflet.css';

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

  // 🌍 Nouveaux états dédiés à la récupération dynamique du fichier local
  const [geoUnifiedData, setGeoUnifiedData] = useState<any>(null);
  const [loadingGeo, setLoadingGeo] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!eventId) return;
      
      try {
        setLoading(true);
        setErrorMsg(null);
        
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // 🔍 Modification ici : récupération des colonnes de ciblage de fichier
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            organizer:profiles!organizer_id (id, identite, avatar_url, role),
            hike:hikes (id, title, location, distance, duration, difficulty, elevation, route_id, source, file_folder, file_name),
            participants:event_participants (
              user:profiles!user_id (id, identite, avatar_url)
            )
          `)
          .eq('id', eventId)
          .maybeSingle();

        if (error) throw error;
        setEvent(data);

        // 📁 Le tour de passe-passe : Si Supabase nous indique à quel fichier on a affaire, 
        // on appelle notre API locale de conversion pour lire le disque dur sans rien stocker en BDD.
        if (data?.hike?.file_folder && data?.hike?.file_name) {
          setLoadingGeo(true);
          const paramsUrl = new URLSearchParams({
            folder: data.hike.file_folder,
            filename: data.hike.file_name,
          });
          if (data.hike.route_id) {
            paramsUrl.append('routeId', data.hike.route_id);
          }

          const res = await fetch(`/api/read-geo?${paramsUrl.toString()}`);
          if (res.ok) {
            const unified = await res.json();
            setGeoUnifiedData(unified);
          }
          setLoadingGeo(false);
        }

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
      window.location.reload();
    } catch (err) {
      alert("Erreur lors de l'inscription ou vous êtes déjà inscrit.");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        <p className="text-slate-500 font-medium">Chargement de votre aventure...</p>
      </div>
    );
  }

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
                <span className="font-semibold text-slate-700 truncate">{event.meeting_point || "Non défini"}</span>
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
                <Route className="mb-2 h-6 w-6 text-blue-400 mx-auto" />
                <p className="text-xs uppercase font-bold text-slate-400 text-center">Distance</p>
                <p className="text-xl font-black text-center">{event.hike.distance} km</p>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-3xl">
                <Mountain className="mb-2 h-6 w-6 text-green-400 mx-auto" />
                <p className="text-xs uppercase font-bold text-slate-400 text-center">Dénivelé</p>
                <p className="text-xl font-black text-center">{event.hike.elevation || 0} m</p>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-3xl">
                <Clock className="mb-2 h-6 w-6 text-orange-400 mx-auto" />
                <p className="text-xs uppercase font-bold text-slate-400 text-center">Durée</p>
                <p className="text-xl font-black text-center">{event.hike.duration || 'N/A'}</p>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-3xl">
                <MapPin className="mb-2 h-6 w-6 text-red-400 mx-auto" />
                <p className="text-xs uppercase font-bold text-slate-400 text-center">Lieu</p>
                <p className="text-xl font-black text-center truncate">{event.hike.location}</p>
              </div>
            </div>
          )}

          {/* 🗺️ INTEGRATION DU BLOC CARTE AVEC LES FICHIERS PARSÉS */}
          {event.hike && (
            <Card className="border-slate-100 overflow-hidden rounded-[2rem] shadow-sm">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg font-bold text-slate-800">Tracé cartographique de l'évènement</CardTitle>
              </CardHeader>
              <div className="h-[400px] w-full relative z-0 bg-slate-50 flex items-center justify-center">
                {loadingGeo ? (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="text-xs">Chargement dynamique du fichier géométrique...</span>
                  </div>
                ) : geoUnifiedData ? (
                  (() => {
                    // Imports dynamiques exécutés uniquement côté client pour contourner le plantage SSR de Leaflet
                    const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
                    const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
                    const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });
                    const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
                    const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

                    // Calcul auto du centrage : soit sur la première coordonnée d'une ligne, soit sur un marqueur
                    const mapCenter: [number, number] = geoUnifiedData.coordinates?.length > 0
                      ? geoUnifiedData.coordinates[0]
                      : geoUnifiedData.markers?.length > 0
                        ? [geoUnifiedData.markers[0].lat, geoUnifiedData.markers[0].lng]
                        : [43.60426, 1.44367]; // Centre Toulouse par défaut

                    return (
                      <MapContainer center={mapCenter} zoom={12} className="h-full w-full">
                        <TileLayer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" />
                        
                        {/* Affiche la ligne Bleue s'il y a des coordonnées continues (GeoJSON, Randos) */}
                        {geoUnifiedData.coordinates?.length > 0 && (
                          <Polyline positions={geoUnifiedData.coordinates} color="#2563eb" weight={5} />
                        )}

                        {/* Affiche des marqueurs s'il s'agit de POIs isolés (Beaucaire, Occitanie, etc.) */}
                        {geoUnifiedData.markers?.map((marker: any, index: number) => (
                          <Marker key={index} position={[marker.lat, marker.lng]}>
                            <Popup>
                              <div className="p-1">
                                <h4 className="font-bold text-slate-900">{marker.title}</h4>
                                {marker.desc && <p className="text-xs text-slate-600 mt-1">{marker.desc}</p>}
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    );
                  })()
                ) : (
                  <span className="text-sm italic text-slate-400">Aucune donnée géométrique associée au fichier référencé</span>
                )}
              </div>
            </Card>
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