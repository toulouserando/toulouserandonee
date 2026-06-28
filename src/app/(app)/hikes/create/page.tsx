"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, MousePointer2, Trash2, Check, Users, Route, 
  Image as ImageIcon, Send, Loader2, MapPin, Timer, Mountain, ClipboardList 
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import { supabase } from "@/lib/supabase";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

// --- DYNAMIC LEAFLET ---
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

// --- HELPERS ---
const useMapInstance = () => {
  const { useMap } = require('react-leaflet');
  try { return useMap(); } catch (e) { return null; }
};

function RoutingControl({ points, setPoints, active }: { points: any[], setPoints: any, active: boolean }) {
  const map = useMapInstance();
  const routingRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !active || !map.getPanes()) {
      if (routingRef.current && map) {
        try { map.removeControl(routingRef.current); } catch (e) {}
        routingRef.current = null;
      }
      return;
    }

    let control: any;
    import('leaflet-routing-machine').then(() => {
      const L = (window as any).L;
      if (!routingRef.current && map) {
        control = L.Routing.control({
          waypoints: points.map(p => L.latLng(p[0], p[1])),
          lineOptions: { styles: [{ color: '#16a34a', weight: 5 }] },
          addWaypoints: true,
          routeWhileDragging: true,
          show: false,
          createMarker: () => null
        });
        routingRef.current = control.addTo(map);
        
        routingRef.current.on('routesfound', (e: any) => {
          const coords = e.routes[0].coordinates.map((c: any) => [c.lat, c.lng]);
          setPoints(coords);
        });
      }
    });

    return () => {
      if (routingRef.current && map) {
        try { map.removeControl(routingRef.current); } catch (e) {}
        routingRef.current = null;
      }
    };
  }, [active, map]);
  return null;
}

function TransportPolyline({ points, setPoints }: { points: [number, number][], setPoints: any }) {
  const map = useMapInstance();
  
  useEffect(() => {
    if (!map || !map.getPanes) return;

    const onClick = (e: any) => {
      const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPoints((prev: any) => [...prev, newPoint]);
    };

    map.on('click', onClick);
    return () => { 
      if (map) map.off('click', onClick); 
    };
  }, [map, setPoints]);

  return null;
}

function ChangeView({ data }: { data: any }) {
  const map = useMapInstance();
  useEffect(() => {
    if (map && data) {
      const timer = setTimeout(async () => {
        const L = await import('leaflet');
        try {
          const layer = L.geoJSON(data);
          const bounds = layer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], animate: true });
          }
        } catch (e) { 
          console.error("Erreur bounds:", e); 
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [data, map]);
  return null;
}

export default function CreateHikePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hikeId = searchParams.get("hikeId");

  // --- ÉTATS DU FORMULAIRE ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [arrivalPoint, setArrivalPoint] = useState("");
  const [startTime, setStartTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [vehicleCount, setVehicleCount] = useState("0");
  const [totalSeats, setTotalSeats] = useState("0");
  const [transportNotes, setTransportNotes] = useState("");
  const [difficulty, setDifficulty] = useState("moyen");
  const [elevation, setElevation] = useState("");
  const [distance, setDistance] = useState("");
  const [hikeType, setHikeType] = useState("boucle");
  const [location, setLocation] = useState("");

  // --- ÉTATS SYSTÈME & CARTES ---
  const [loading, setLoading] = useState(false);
  const [loadingHike, setLoadingHike] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [selectedHikeRoute, setSelectedHikeRoute] = useState<any>(null);
  const [customPoints, setCustomPoints] = useState<[number, number][]>([]);
  const [transportPoints, setTransportPoints] = useState<[number, number][]>([]);
  const [mounted, setMounted] = useState(false);
  const [map1Ready, setMap1Ready] = useState(false);
  const [geoColumnName, setGeoColumnName] = useState("geometry");

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🎯 CHARGEMENT ET PRÉ-REMPLISSAGE DE LA HIKES MODÈLE
  useEffect(() => {
    if (!hikeId) return;

    async function loadSelectedHike() {
      setLoadingHike(true);
      try {
        const { data, error } = await supabase
          .from("hikes")
          .select("*")
          .eq("id", hikeId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Pré-remplissage des états texte
          setTitle(data.title || "");
          setDescription(data.description || "");
          setDistance(data.distance ? String(data.distance).replace(/[^\d.]/g, '') : "");
          setElevation(data.elevation ? String(data.elevation) : "");
          setLocation(data.location || "");
          if (data.difficulty) setDifficulty(data.difficulty.toLowerCase());
          if (data.hike_type) setHikeType(data.hike_type.toLowerCase());
          
          // Détection dynamique de la colonne géographique
          const geoKey = Object.keys(data).find(
            key => key.toLowerCase().includes("geo") || 
                   key.toLowerCase().includes("geom") || 
                   (data[key] && typeof data[key] === "object" && "type" in data[key])
          );

          if (geoKey) {
            setGeoColumnName(geoKey);
            setSelectedHikeRoute(data[geoKey]);
          }
        }
      } catch (err: any) {
        console.error("Erreur récupération circuit modèle:", err.message);
      } finally {
        setLoadingHike(false);
      }
    }

    loadSelectedHike();
  }, [hikeId]);

  const handleCreateHike = async (isPublished = true) => {
    setLoading(true);
    try {
      let imageUrl = null;
      if (image) {
        const fileName = `${Date.now()}-${image.name}`;
        const { data: imgData, error: imgErr } = await supabase.storage
          .from('hike-images')
          .upload(fileName, image);
        if (imgErr) throw imgErr;
        imageUrl = supabase.storage.from('hike-images').getPublicUrl(fileName).data.publicUrl;
      }

      // Payload à insérer
      const hikeData = {
        title,
        description,
        location,
        recommendations,
        meeting_point: meetingPoint,
        arrival_point: arrivalPoint,
        start_time: startTime,
        return_time: returnTime,
        vehicle_count: parseInt(vehicleCount) || 0,
        total_seats: parseInt(totalSeats) || 0,
        transport_notes: transportNotes,
        difficulty,
        elevation: parseInt(elevation) || 0,
        distance: parseFloat(distance) || 0,
        hike_type: hikeType,
        image_url: imageUrl,
        status: isPublished ? 'Publié' : 'Brouillon',
        transport_steps: transportPoints,
        // Sauvegarde de la géométrie trouvée ou des points tracés manuellement
        [geoColumnName]: selectedHikeRoute ? selectedHikeRoute : (customPoints.length > 0 ? { type: "LineString", coordinates: customPoints.map(p => [p[1], p[0]]) } : null)
      };

      const { error } = await supabase.from("hikes").insert([hikeData]);
      if (error) throw error;

      router.push("/events");
      router.refresh();
    } catch (error: any) {
      alert("Erreur lors du traitement du circuit : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">
          {hikeId ? "Dupliquer / Organiser le Circuit" : "Proposer une nouvelle Randonnée"}
        </h1>
      </div>

      <header className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="text-green-700 font-bold p-2 hover:bg-green-50 rounded-lg flex items-center gap-2">
          <ArrowLeft size={16} /> Vol back
        </Button>
      </header>

      {/* --- PHOTO COUVERTURE --- */}
      <Card className="relative overflow-hidden border-dashed border-2 flex flex-col items-center justify-center p-0 min-h-[200px] bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
        <input type="file" id="photo-upload" hidden onChange={(e) => setImage(e.target.files?.[0] || null)} accept="image/*" />
        <label htmlFor="photo-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full p-8">
          {image ? (
            <div className="text-center w-full">
              <p className="text-sm font-bold text-green-600 mb-2">✅ Image sélectionnée :</p>
              <div className="relative inline-block">
                <img src={URL.createObjectURL(image)} alt="Preview" className="max-h-48 rounded-lg shadow-md mx-auto object-cover" />
                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={(e) => { e.preventDefault(); setImage(null); }}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-slate-400 mb-2" />
              <span className="text-sm font-medium text-slate-500">Ajouter une photo de couverture</span>
              <p className="text-xs text-slate-400 mt-1">Format JPG, PNG ou WebP</p>
            </>
          )}
        </label>
      </Card>

      {/* --- DÉTAILS TEXTE --- */}
      <Card>
        <CardHeader className="border-b bg-slate-50/30">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <ClipboardList className="text-primary w-5 h-5"/> Détails de la rando
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="event-title">Nom de la randonnée</Label>
              <Input id="event-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Boucle des Trois Sommets" className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-location">Lieu général / Région</Label>
              <Input id="event-location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Ax-les-Thermes, Ariège" className="h-11" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="event-desc">Description de l'itinéraire</Label>
              <Textarea id="event-desc" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Parlez-nous du sentier, des points de vue..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-reco" className="text-slate-500">Recommandations</Label>
              <Textarea id="event-reco" value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={4} placeholder="Équipement obligatoire (Crampons, bâtons, eau...)" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- BLOC CARTE 1 : GÉOMÉTRIE --- */}
      <Card className="overflow-hidden border-green-100 shadow-xl">
        <CardHeader className="bg-green-700 text-white flex flex-row items-center justify-between py-4 px-6">
          <CardTitle className="flex items-center gap-2 text-md font-bold">
            <Route size={20}/> 1. Tracé du Parcours ({selectedHikeRoute ? "Modèle Importé" : "Personnalisé"})
          </CardTitle>
          {!selectedHikeRoute && (
            <Button variant="outline" size="sm" onClick={() => setCustomPoints([])} className="bg-white/10 border-white/20 text-white">
              <Trash2 size={14} className="mr-2"/> Effacer
            </Button>
          )}
        </CardHeader>

        <div className="h-[500px] w-full relative z-0">
          {loadingHike && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
              <Loader2 className="animate-spin text-green-700 h-10 w-10" />
            </div>
          )}
          <MapContainer center={[43.60, 1.44]} zoom={12} className="h-full w-full" whenReady={() => setMap1Ready(true)}>
            <TileLayer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" attribution='&copy; OSM' />
            
            {map1Ready && (
              <>
                {selectedHikeRoute && <ChangeView data={selectedHikeRoute} />}
                
                <RoutingControl active={!selectedHikeRoute} points={customPoints} setPoints={setCustomPoints} />

                {selectedHikeRoute && (
                  <GeoJSON 
                    key={`hike-route-${hikeId}`} 
                    data={selectedHikeRoute} 
                    style={{ color: '#2563eb', weight: 5, opacity: 0.8 }} 
                  />
                )}
              </>
            )}
          </MapContainer>

          {!selectedHikeRoute && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 shadow-2xl border border-green-200 px-6 py-2 rounded-full flex items-center gap-3 animate-bounce">
              <MousePointer2 className="text-green-600" size={18} />
              <span className="text-sm font-bold text-green-800 uppercase tracking-tight">Tracez votre chemin</span>
            </div>
          )}
        </div>
      </Card>

      {/* --- METRIQUES COMPOSANT --- */}
      <Card className="mt-6">
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Dénivelé positif (m)</Label>
            <div className="relative">
              <Mountain className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="number" value={elevation} onChange={e => setElevation(e.target.value)} className="pl-10 h-10" placeholder="Ex: 650" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Distance (km)</Label>
            <div className="relative">
              <Route className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="number" step="0.1" value={distance} onChange={e => setDistance(e.target.value)} className="pl-10 h-10" placeholder="Ex: 14.5" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Difficulté</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facile">Facile</SelectItem>
                <SelectItem value="moyen">Moyen</SelectItem>
                <SelectItem value="difficile">Difficile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Type de parcours</Label>
            <Select value={hikeType} onValueChange={setHikeType}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boucle">Boucle</SelectItem>
                <SelectItem value="aller-retour">Aller-Retour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* --- CARTE 2 : LOGISTIQUE ACCÈS --- */}
      <Card className="overflow-hidden border-blue-100 shadow-xl mt-6">
        <CardHeader className="bg-blue-700 text-white flex flex-row items-center justify-between py-4 px-6">
          <CardTitle className="text-md flex items-center gap-2">
            <Route size={20}/> 2. Itinéraire Routier et Accès (Logistique)
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setTransportPoints([])} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Trash2 size={14} className="mr-2"/> Effacer la route
          </Button>
        </CardHeader>

        <div className="h-[400px] w-full relative z-0">
          <MapContainer center={[43.60, 1.44]} zoom={11} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" />
            <TransportPolyline points={transportPoints} setPoints={setTransportPoints} />
            {transportPoints.length > 1 && (
              <Polyline positions={transportPoints} pathOptions={{ color: "#2563eb", weight: 4, dashArray: "5, 10" }} />
            )}
          </MapContainer>
          <div className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded shadow text-xs font-bold text-blue-700 border border-blue-100">
            Points d'accès : {transportPoints.length}
          </div>
        </div>

        <CardContent className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2 text-blue-800">
                <MapPin size={16}/> Point de rendez-vous conseillé
              </Label>
              <Input value={meetingPoint} onChange={e => setMeetingPoint(e.target.value)} placeholder="Ex: Parking de la gare ou aire de covoiturage" className="h-11 border-blue-200" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2 text-blue-800">
                <MapPin size={16}/> Lieu d'arrivée routier
              </Label>
              <Input value={arrivalPoint} onChange={e => setArrivalPoint(e.target.value)} placeholder="Ex: Pied des pistes, départ du sentier" className="h-11 border-blue-200" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2"><Timer size={16}/> Heure de départ suggérée</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-11 border-blue-100" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2 text-slate-400"><Timer size={16}/> Durée de route estimée</Label>
              <Input type="time" value={returnTime} onChange={e => setReturnTime(e.target.value)} className="h-11 border-blue-100" />
            </div>
            <div className="hidden md:flex items-end pb-3">
              <p className="text-[11px] text-slate-400 italic">Renseignez ces horaires pour donner un ordre de grandeur de trajet aux futurs marcheurs.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h4 className="text-sm font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
              <Users size={16}/> Capacité conseillée (Covoiturage)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="space-y-1 flex-1">
                  <Label className="font-bold text-blue-900">Véhicules nécessaires estimé</Label>
                  <p className="text-[11px] text-blue-600">Pour un groupe standard</p>
                </div>
                <Input type="number" min="0" value={vehicleCount} onChange={e => setVehicleCount(e.target.value)} className="w-20 h-12 text-center font-bold text-lg border-blue-200 bg-white" />
              </div>
              <div className="flex items-center gap-6 bg-green-50/50 p-4 rounded-xl border border-green-100">
                <div className="space-y-1 flex-1">
                  <Label className="font-bold text-green-900">Nombre de passagers max conseillé</Label>
                  <p className="text-[11px] text-green-600">Limite écologique pour le sentier</p>
                </div>
                <Input type="number" min="0" value={totalSeats} onChange={e => setTotalSeats(e.target.value)} className="w-20 h-12 text-center font-bold text-lg border-green-200 bg-white" />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Label className="font-bold text-slate-600">Précisions d'accès ou difficultés routières</Label>
              <Textarea value={transportNotes} onChange={e => setTransportNotes(e.target.value)} placeholder="Ex: Piste forestière terminale un peu chaotique, véhicule bas s'abstenir..." rows={3} className="border-blue-100 focus-visible:ring-blue-500 bg-slate-50/30" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- FOOTER BANNER ACTIONS --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-2xl shadow-2xl mt-10">
        <div className="space-y-1">
          <h4 className="text-xl font-black uppercase text-green-400">Prêt à cataloguer ?</h4>
          <p className="text-slate-300 text-sm font-medium">Ajoute la randonnée de façon définitive dans la base.</p>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center">
          <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={() => router.back()}>
            Abandonner
          </Button>
          
          <Button variant="outline" className="border-slate-500 text-slate-400 hover:bg-slate-800 hover:text-white bg-transparent" onClick={() => handleCreateHike(false)} disabled={loading || loadingHike}>
            Enregistrer Brouillon
          </Button>

          <Button className="bg-green-500 hover:bg-green-400 text-white px-10 font-extrabold h-12 shadow-lg shadow-green-500/20" onClick={() => handleCreateHike(true)} disabled={loading || loadingHike}>
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <div className="flex items-center">
                <Send className="mr-2 h-5 w-5" /> 
                Publier le circuit
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}