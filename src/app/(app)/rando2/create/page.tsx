"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowLeft, ClipboardList, MapPin, Clock, Image as ImageIcon, Mountain, Route, Car, Send, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Ajoutez ces imports si vous ne les avez pas encore
// import { MapContainer, TileLayer, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
// Gardez l'import CSS, mais enrobez-le pour éviter qu'il plante en SSR
import 'leaflet/dist/leaflet.css';

function TransportPolyline({ points, setPoints }: { points: [number, number][], setPoints: any }) {
  // On utilise le hook dynamiquement importé
  useMapEvents({
    click(e) {
      setPoints((prev: [number, number][]) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    },
  });
  return null; // Le dessin est géré par le composant Polyline dans le MapContainer
}

// Remplacez les imports problématiques par ceci :
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });
const useMapEvents = dynamic(() => import('react-leaflet').then(m => m.useMapEvents), { ssr: false });

const MapComponent = dynamic(() => import('../MapComponent'), { ssr: false });

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [mapData, setMapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  
  // États des champs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [elevation, setElevation] = useState("");
  const [distance, setDistance] = useState("");
  const [difficulty, setDifficulty] = useState("moyen");
  const [hikeType, setHikeType] = useState("boucle");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [arrivalPoint, setArrivalPoint] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [vehicles, setVehicles] = useState(0);
  const [passengers, setPassengers] = useState(0);
  const [transportNotes, setTransportNotes] = useState("");

{/* Ajoutez cet état en haut de votre composant si ce n'est pas déjà fait */}
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetch('/api/rando2')
      .then(res => res.json())
      .then(json => {
        const found = json.find((item: any) => item.id === id);
        if (found) setMapData([found]);
        setLoading(false);
      });
  }, [id]);

const handleSave = async (isPublished: boolean) => {
  setSaving(true);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    alert("Vous devez être connecté pour publier.");
    setSaving(false);
    return;
  }

  const hikeData = {
    title,
    description,
    recommendations, 
    location: meetingPoint,
    arrival_point: arrivalPoint, 
    distance: distance,
    duration: `${startTime} à ${endTime}`,
    difficulty,
    type: hikeType,
    elevation: parseInt(elevation) || 0,
    vehicles, 
    passengers, 
    transport_notes: transportNotes, 
    organizer_id: user.id,
    is_published: isPublished,
    // À NE PAS OUBLIER : Lien avec le parcours
    route_id: id,
    // Assurez-vous que la variable 'sourceParam' existe bien dans votre code, 
    // sinon vous pouvez mettre 'source: "votre_valeur"' ou la retirer si elle n'est plus utile
    source: typeof sourceParam !== 'undefined' ? sourceParam : null 
  };

  const { error } = await supabase.from('Hikes').insert([hikeData]);

  if (error) {
    console.error("Erreur Supabase:", error);
    alert("Erreur lors de la publication.");
  } else {
    alert(isPublished ? "Sortie publiée avec succès !" : "Brouillon enregistré !");
    router.push('/events'); 
  }
  setSaving(false);
};

const [transportPoints, setTransportPoints] = useState<[number, number][]>([]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">

      <h1 className="text-4xl font-black uppercase text-slate-900">Proposer une nouvelle sortie</h1>

      <Card className="border-dashed border-2 p-0 min-h-[200px] bg-slate-50/50">
        <input type="file" id="photo-upload" hidden onChange={(e) => setImage(e.target.files?.[0] || null)} />
        <label htmlFor="photo-upload" className="flex flex-col items-center justify-center cursor-pointer p-8">
          {image ? <img src={URL.createObjectURL(image)} className="max-h-48 rounded-lg" /> : <><ImageIcon className="h-10 w-10 text-slate-400" /><span>Ajouter une photo</span></>}
        </label>
      </Card>

      {/* DÉTAILS TEXTE */}
      <Card>
        <CardHeader className="border-b bg-slate-50/30">
          <CardTitle className="flex items-center gap-2 text-lg font-bold"><ClipboardList className="text-primary w-5 h-5"/> Détails de la rando</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="event-title">Titre de l'évènement</Label>
            <Input id="event-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Sortie au Pic du Midi" className="h-11" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea id="event-desc" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Parlez-nous de la sortie..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-reco" className="text-slate-500">Recommandations</Label>
              <Textarea id="event-reco" value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={4} placeholder="Équipement requis..." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-100">
        <CardHeader className="bg-green-700 text-white"><CardTitle>1. Parcours</CardTitle></CardHeader>
        <div className="h-[300px]">{loading ? <Loader2 className="animate-spin" /> : <MapComponent data={mapData} />}</div>
      </Card>

{/* --- CARTE INFOS RANDONNÉE --- */}
<Card className="mt-6">
  <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">

    {/* Dénivelé */}
    <div className="space-y-1">
      <Label className="text-xs font-bold text-slate-500">Dénivelé (m)</Label>
      <div className="relative">
        <Mountain className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          type="number"
          value={elevation}
          onChange={e => setElevation(e.target.value)}
          className="pl-10 h-10"
        />
      </div>
    </div>

    {/* Distance */}
    <div className="space-y-1">
      <Label className="text-xs font-bold text-slate-500">Distance (km)</Label>
      <div className="relative">
        <Route className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          type="number"
          value={distance}
          onChange={e => setDistance(e.target.value)}
          className="pl-10 h-10"
        />
      </div>
    </div>

    {/* Difficulté */}
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

    {/* Type */}
    <div className="space-y-1">
      <Label className="text-xs font-bold text-slate-500">Type</Label>
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

{/* Mise à jour de la Card Itinéraire et Transport */}
      <Card className="border-blue-100">
        <CardHeader className="bg-blue-700 text-white"><CardTitle>2. Itinéraire et Transport</CardTitle></CardHeader>

        <CardContent className="space-y-6 pt-6">
{/* Carte interactive pour tracer */}
    <div className="h-[400px] w-full relative z-0 border rounded-lg overflow-hidden">
      <MapContainer center={[43.60, 1.44]} zoom={11} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" />
        <TransportPolyline points={transportPoints} setPoints={setTransportPoints} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[1000] bg-white p-2 rounded shadow text-xs">
        Cliquez sur la carte pour tracer le trajet. Points : {transportPoints.length}
      </div>
    </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Lieu de RDV</Label><Input value={meetingPoint} onChange={e => setMeetingPoint(e.target.value)} /></div>
            <div className="space-y-1"><Label>Lieu de Retour</Label><Input value={arrivalPoint} onChange={e => setArrivalPoint(e.target.value)} /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Départ</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></div>
            <div className="space-y-1"><Label>Fin estimée</Label><Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
            <Label className="font-bold flex items-center gap-2"><Car size={16}/> CAPACITÉ TRANSPORT</Label>
            <div className="grid md:grid-cols-2 gap-6">
                <Input type="number" placeholder="Véhicules" value={vehicles} onChange={e => setVehicles(parseInt(e.target.value))} />
                <Input type="number" placeholder="Places" value={passengers} onChange={e => setPassengers(parseInt(e.target.value))} />
            </div>
            {/* AJOUT DU CHAMP MANQUANT */}
            <div className="space-y-1">
              <Label>Précisions sur le transport (optionnel)</Label>
              <Textarea 
                placeholder="Ex: Participation essence 5€, portage de bagages possible..." 
                value={transportNotes} 
                onChange={e => setTransportNotes(e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
{/* --- FOOTER ACTION (DESIGN NOIR & ENVOI SUPABASE) --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-2xl shadow-2xl mt-10">
        <div className="space-y-1">
          <h4 className="text-xl font-black uppercase text-green-400">Prêt à publier ?</h4>
          <p className="text-slate-300 text-sm font-medium">Visible instantanément par la communauté.</p>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center">
          {/* Annule et revient en arrière */}
          <Button 
            variant="ghost" 
            className="text-slate-300 hover:text-white" 
            onClick={() => router.back()}
          >
            Abandonner
          </Button>
          
          {/* Envoie à Supabase avec isPublished = false */}
          <Button 
            variant="outline" 
            className="border-slate-500 text-slate-900 hover:bg-slate-800" 
            onClick={() => handleCreateEvent(false)}
            disabled={loading}
          >
            Brouillon
          </Button>

          {/* Envoie à Supabase avec isPublished = true */}
          <Button 
            className="bg-green-500 hover:bg-green-400 text-white px-10 font-extrabold h-12 shadow-lg shadow-green-500/20" 
            onClick={() => handleCreateEvent(true)} 
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <div className="flex items-center">
                <Send className="mr-2 h-5 w-5" /> 
                Publier la sortie
              </div>
            )}
          </Button>
        </div>
      </div>
    </div> // Fin du formulaire
  );
}