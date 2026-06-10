"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { Loader2, ClipboardList, Mountain, Route, Car, Send, ImageIcon, Map } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Chargement dynamique obligatoire de Leaflet pour Next.js (SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(m => m.GeoJSON), { ssr: false });

function ChangeView({ center }: { center: [number, number] }) {
  const map = (window as any).L ? require('react-leaflet').useMap() : null;
  if (map && center) map.setView(center, 13);
  return null;
}

export default function CreateEventPageRandoGeojson() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // L'ID transmis dans l'URL correspond ici au "Nom Rando"
  const id = searchParams.get('id'); 
  const sourceParam = searchParams.get('source') || 'randogeojson'; 
  
  const [selectedRando, setSelectedRando] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // États des champs du formulaire
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [elevation, setElevation] = useState("0");
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // RÉCUPÉRATION ET APPLATISSEMENT DES DONNÉES DEPUIS L'API GEODATA
  useEffect(() => {
    if (!id) return;
    
    fetch('/api/randogeojson')
      .then(res => res.json())
      .then(data => {
        // L'API renvoie un arbre structuré (Dept -> Canton -> EPCI -> Commune -> Randos)
        // On l'aplatit pour chercher la randonnée correspondante au nom fourni
        let foundMatch: any = null;

        for (const dept in data) {
          for (const canton in data[dept]) {
            for (const epci in data[dept][canton]) {
              for (const commune in data[dept][canton][epci]) {
                const randos = data[dept][canton][epci][commune];
                if (Array.isArray(randos)) {
                  const match = randos.find((r: any) => String(r["Nom Rando"]).toLowerCase() === String(id).toLowerCase());
                  if (match) {
                    foundMatch = match;
                    break;
                  }
                }
              }
              if (foundMatch) break;
            }
            if (foundMatch) break;
          }
          if (foundMatch) break;
        }

        if (foundMatch) {
          setSelectedRando(foundMatch);
          setTitle(`Randonnée : ${foundMatch["Nom Rando"]}`);
          setMeetingPoint(foundMatch["commune"] || foundMatch["GPS_DEPART"] || "");
          setArrivalPoint(foundMatch["GPS_DESTINATION"] || "");
          
          // Extraction et nettoyage de la distance numérique (ex: "12.5 km" -> "12.5")
          if (foundMatch["Durée"]) {
            setDescription(`Durée estimée : ${foundMatch["Durée"]}.`);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur lors du chargement des coordonnées de la rando:", err);
        setLoading(false);
      });
  }, [id]);

  // Génération du tracé linéaire GeoJSON pour la carte Leaflet
  const geoJsonData = useMemo(() => {
    if (!selectedRando || !selectedRando.LAT_DEPART) return null;

    const points = [];
    if (!isNaN(selectedRando.LAT_DEPART)) points.push([selectedRando.LON_DEPART, selectedRando.LAT_DEPART]);
    if (!isNaN(selectedRando.LAT_PIVOT)) points.push([selectedRando.LON_PIVOT, selectedRando.LAT_PIVOT]);
    if (!isNaN(selectedRando.LAT_DEST)) points.push([selectedRando.LON_DEST, selectedRando.LAT_DEST]);

    if (points.length < 2) return null;

    return {
      type: "Feature",
      properties: { name: selectedRando["Nom Rando"] },
      geometry: {
        type: "LineString",
        coordinates: points
      }
    };
  }, [selectedRando]);

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

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-slate-50/40 min-h-screen">
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
        Organiser une Randonnée : <span className="text-blue-600">{selectedRando ? selectedRando["Nom Rando"] : "Chargement..."}</span>
      </h1>

      {/* 📷 COUVERTURE */}
      <Card className="border-dashed border-2 border-slate-300 p-0 min-h-[200px] bg-white">
        <input type="file" id="photo-upload" hidden onChange={(e) => setImage(e.target.files?.[0] || null)} />
        <label htmlFor="photo-upload" className="flex flex-col items-center justify-center cursor-pointer p-8 h-full w-full">
          {image ? (
            <img src={URL.createObjectURL(image)} className="max-h-48 rounded-lg object-cover" alt="Preview" />
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-slate-400" />
              <span className="text-slate-600 font-medium mt-2">Ajouter une photo de couverture pour la randonnée</span>
            </>
          )}
        </label>
      </Card>

      {/* 📝 FORMULAIRE TEXTE */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-100/50">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <ClipboardList className="w-5 h-5 text-blue-500"/> Fiche Descriptive & Itinéraire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="event-title">Nom de la sortie</Label>
            <Input id="event-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Boucle matinale autour des lacs" className="h-11 border-slate-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="event-desc">Description du parcours</Label>
              <Textarea id="event-desc" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Points de passage remarquables, pauses prévues, panoramas..." className="border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-reco" className="text-slate-500">Équipements & Conseils</Label>
              <Textarea id="event-reco" value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={4} placeholder="Chaussures de rando obligatoires, prévoir 1.5L d'eau, bâtons conseillés..." className="border-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🗺️ CARTE LEAFLET FIXÉE POUR LE PARCOURS GEOJSON */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-900 text-slate-50">
          <CardTitle className="flex items-center gap-2 text-md">
            <Map size={18} className="text-blue-400"/> Tracé cartographique généré
          </CardTitle>
        </CardHeader>
        <div className="h-[380px] w-full relative bg-slate-100 flex items-center justify-center">
          {loading ? (
            <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
          ) : selectedRando && !isNaN(selectedRando.LAT_DEPART) ? (
            <MapContainer center={[selectedRando.LAT_DEPART, selectedRando.LON_DEPART]} zoom={12} className="h-full w-full z-10">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              <ChangeView center={[selectedRando.LAT_DEPART, selectedRando.LON_DEPART]} />

              {geoJsonData && (
                <GeoJSON 
                  key={selectedRando["Nom Rando"]} 
                  data={geoJsonData as any} 
                  style={{ color: '#2563eb', weight: 5, opacity: 0.8 }} 
                />
              )}
            </MapContainer>
          ) : (
            <div className="text-slate-400 italic text-sm">Coordonnées GPS indisponibles pour ce tracé.</div>
          )}
        </div>
      </Card>

      {/* 📊 OPTIONS TECHNIQUES */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Dénivelé Positif (m)</Label>
            <div className="relative">
              <Mountain className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="number" value={elevation} onChange={e => setElevation(e.target.value)} className="pl-10 h-10 border-slate-200" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Distance Globale (km)</Label>
            <div className="relative">
              <Route className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="number" step="0.1" value={distance} onChange={e => setDistance(e.target.value)} className="pl-10 h-10 border-slate-200" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Difficulté requise</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="facile">Très Facile / Famille</SelectItem>
                <SelectItem value="moyen">Modéré / Régulier</SelectItem>
                <SelectItem value="difficile">Difficile / Sportif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Configuration</Label>
            <Select value={hikeType} onValueChange={setHikeType}>
              <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="boucle">Boucle complète</SelectItem>
                <SelectItem value="aller-retour">Aller-Retour simple</SelectItem>
                <SelectItem value="traversee">Ligne droite / Traversée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 🚗 LOGISTIQUE */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-800 text-slate-50">
          <CardTitle className="text-md">Rassemblement & Covoiturage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Lieu de départ / RDV</Label><Input value={meetingPoint} onChange={e => setMeetingPoint(e.target.value)} placeholder="Parking de départ, Église..." className="border-slate-200" /></div>
            <div className="space-y-1"><Label>Lieu d'arrivée</Label><Input value={arrivalPoint} onChange={e => setArrivalPoint(e.target.value)} placeholder="Identique au départ..." className="border-slate-200" /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Heure de départ</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="border-slate-200" /></div>
            <div className="space-y-1"><Label>Heure de retour estimée</Label><Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="border-slate-200" /></div>
          </div>

          <div className="bg-slate-100/60 p-4 rounded-lg border border-slate-200 space-y-4">
            <Label className="font-bold flex items-center gap-2 text-slate-800"><Car size={16}/> OPTIONS DE COVOITURAGE</Label>
            <div className="grid md:grid-cols-2 gap-6">
              <Input type="number" placeholder="Nombre de voitures disponibles" value={vehicles || ""} onChange={e => setVehicles(parseInt(e.target.value) || 0)} className="bg-white border-slate-200" />
              <Input type="number" placeholder="Nombre total de places offertes" value={passengers || ""} onChange={e => setPassengers(parseInt(e.target.value) || 0)} className="bg-white border-slate-200" />
            </div>
            <div className="space-y-1">
              <Label>Précisions logistiques</Label>
              <Textarea placeholder="Frais de péage partagés, point de rendez-vous intermédiaire pour le covoiturage..." value={transportNotes} onChange={e => setTransportNotes(e.target.value)} className="bg-white border-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 🚀 BANDEAU D'ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-2xl shadow-xl mt-10">
        <div className="space-y-1">
          <h4 className="text-xl font-bold text-blue-400">Publier et ouvrir la sortie ?</h4>
          <p className="text-slate-300 text-sm">Le tracé dynamique sera rattaché à l'événement de la communauté.</p>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center">
          <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => router.back()}>
            Annuler
          </Button>
          
          <Button variant="outline" className="border-slate-700 text-slate-100 bg-transparent hover:bg-slate-800" onClick={() => handleCreateEvent(false)} disabled={saving}>
            Brouillon
          </Button>

          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-10 font-bold h-12 shadow-lg border-0" onClick={() => handleCreateEvent(true)} disabled={saving}>
            {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <div className="flex items-center"><Send className="mr-2 h-5 w-5" /> Publier la randonnée</div>}
          </Button>
        </div>
      </div>
    </div>
  );
}