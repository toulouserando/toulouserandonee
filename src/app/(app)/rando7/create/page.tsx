"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from "@/lib/supabase";
import { Loader2, ClipboardList, Mountain, Route, Car, Send, ImageIcon, Landmark } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import 'leaflet/dist/leaflet.css';

// Chargement dynamique du MapComponent de Rando7 (Patrimoine) sans SSR
const MapComponent = dynamic(() => import('../MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-stone-100 font-serif italic text-stone-500">Chargement de la carte patrimoine...</div>
});

// 📦 Composant interne contenant la logique du formulaire
function CreateEventFormRando7() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Récupération des paramètres de l'URL (?source=rando7&id=id_du_monument)
  const id = searchParams.get('id');
  const sourceParam = searchParams.get('source') || 'rando7'; 
  
  // États synchronisés avec la structure de rando7
  const [filteredSites, setFilteredSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // États des champs du formulaire
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [elevation, setElevation] = useState("");
  const [distance, setDistance] = useState("");
  const [difficulty, setDifficulty] = useState("facile");
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

  // CHARGEMENT ET FILTRAGE DE L'ÉDIFICE UNIQUE DEPUIS LE FILE GEOJSON DE RANDO7
  useEffect(() => {
    if (!id) { 
      setLoading(false); 
      return; 
    }
    
    fetch('/rando/poi_occitanie_clean.json.geojson')
      .then(res => res.json())
      .then(data => {
        if (data && data.features) {
          const formatted = data.features.map((f: any) => ({
            id: f.properties.id,
            nom: f.properties.local_name,
            ville: f.properties.city,
            adresse: f.properties.address || "Adresse non spécifiée",
            cp: f.properties.zipcode || "",
            type: f.properties.category || "Monument",
            coords: {
              lat: f.properties.latitude,
              lon: f.properties.longitude
            }
          }));

          const found = formatted.find((s: any) => String(s.id) === String(id));
          if (found) {
            setFilteredSites([found]); // MapComponent attend un tableau filtré
            setTitle(`Visite culturelle : ${found.nom}`);
            setMeetingPoint(found.adresse !== "Adresse non spécifiée" ? `${found.adresse}, ${found.ville}` : found.ville);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur lors du chargement des informations du monument rando7:", err);
        setLoading(false);
      });
  }, [id]);

  // ENREGISTREMENT SUR SUPABASE
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
      route_id: id,
      source: sourceParam 
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
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-stone-50/40 min-h-screen">
      <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Proposer une Sortie Culturelle</h1>

      {/* 📷 ZONE PHOTO DE COUVERTURE */}
      <Card className="border-dashed border-2 border-stone-300 p-0 min-h-[200px] bg-white">
        <input type="file" id="photo-upload" hidden onChange={(e) => setImage(e.target.files?.[0] || null)} />
        <label htmlFor="photo-upload" className="flex flex-col items-center justify-center cursor-pointer p-8">
          {image ? <img src={URL.createObjectURL(image)} className="max-h-48 rounded-lg" alt="Preview" /> : <><ImageIcon className="h-10 w-10 text-stone-400" /><span className="text-stone-600 font-medium mt-2">Ajouter un visuel du monument</span></>}
        </label>
      </Card>

      {/* 📝 FORMULAIRE TEXTE */}
      <Card className="border-stone-200 shadow-sm">
        <CardHeader className="border-b bg-stone-100/50">
          <CardTitle className="flex items-center gap-2 text-lg font-serif text-stone-900">
            <ClipboardList className="w-5 h-5 text-amber-700"/> Description de la sortie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="event-title">Titre de l'évènement</Label>
            <Input id="event-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Découverte historique guidée" className="h-11 border-stone-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="event-desc">Programme de la visite</Label>
              <Textarea id="event-desc" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Détails de la journée, horaires des visites intérieures..." className="border-stone-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-reco" className="text-stone-500">Consignes particulières</Label>
              <Textarea id="event-reco" value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={4} placeholder="Règles du site, tarifs d'entrée éventuels..." className="border-stone-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🗺️ VISUALISATION SUR LA CARTE DU PATRIMOINE (RANDO7) */}
      <Card className="border-stone-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-amber-800 text-stone-50">
          <CardTitle className="flex items-center gap-2 text-md font-serif">
            <Landmark size={18}/> 1. Localisation de l'édifice sélectionné
          </CardTitle>
        </CardHeader>
        <div className="h-[400px] relative w-full overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-stone-50">
              <Loader2 className="animate-spin text-amber-800 h-8 w-8" />
            </div>
          ) : (
            <MapComponent 
              selectedSiteId={id || 'all'} 
              sites={filteredSites} 
            />
          )}
        </div>
      </Card>

      {/* 📊 OPTIONS ET DIFFICULTÉ */}
      <Card className="border-stone-200 shadow-sm">
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-stone-500">Dénivelé pédestre (m)</Label>
            <div className="relative">
              <Mountain className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <Input type="number" value={elevation} onChange={e => setElevation(e.target.value)} className="pl-10 h-10 border-stone-200" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-stone-500">Marche d'approche (km)</Label>
            <div className="relative">
              <Route className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <Input type="number" value={distance} onChange={e => setDistance(e.target.value)} className="pl-10 h-10 border-stone-200" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-stone-500">Allure / Accessibilité</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-10 border-stone-200"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="facile">Facile (Tout public)</SelectItem>
                <SelectItem value="moyen">Moyen (Marcheurs réguliers)</SelectItem>
                <SelectItem value="difficile">Difficile (Escaliers / Pente raide)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-stone-500">Format d'accès</Label>
            <Select value={hikeType} onValueChange={setHikeType}>
              <SelectTrigger className="h-10 border-stone-200"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="boucle">Boucle (Circuit)</SelectItem>
                <SelectItem value="aller-retour">Aller-Retour</SelectItem>
                <SelectItem value="sur-place">Sur Place (Statique)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 🚗 LOGISTIQUE ET TRIPS */}
      <Card className="border-stone-200 shadow-sm">
        <CardHeader className="bg-stone-800 text-stone-50">
          <CardTitle className="text-md font-serif">2. Organisation & Rendez-vous</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Point de Rendez-vous</Label><Input value={meetingPoint} onChange={e => setMeetingPoint(e.target.value)} placeholder="Adresse ou lieu précis" className="border-stone-200" /></div>
            <div className="space-y-1"><Label>Point de Dispersion</Label><Input value={arrivalPoint} onChange={e => setArrivalPoint(e.target.value)} placeholder="Ex: Identique au départ" className="border-stone-200" /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Heure de Début</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="border-stone-200" /></div>
            <div className="space-y-1"><Label>Fin Estimée</Label><Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="border-stone-200" /></div>
          </div>

          <div className="bg-stone-100/60 p-4 rounded-lg border border-stone-200 space-y-4">
            <Label className="font-bold font-serif flex items-center gap-2 text-stone-800"><Car size={16}/> COVOITURAGE & LOGISTIQUE</Label>
            <div className="grid md:grid-cols-2 gap-6">
              <Input type="number" placeholder="Nombre de véhicules requis" value={vehicles || ""} onChange={e => setVehicles(parseInt(e.target.value) || 0)} className="bg-white border-stone-200" />
              <Input type="number" placeholder="Nombre de places de passagers disponibles" value={passengers || ""} onChange={e => setPassengers(parseInt(e.target.value) || 0)} className="bg-white border-stone-200" />
            </div>
            <div className="space-y-1">
              <Label>Précisions sur l'itinéraire routier</Label>
              <Textarea placeholder="Points de regroupement autoroutiers, frais de péage partagés..." value={transportNotes} onChange={e => setTransportNotes(e.target.value)} className="bg-white border-stone-200" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 🚀 BANDEAU D'ACTIONS COMPLÈTES */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-stone-900 p-8 rounded-2xl shadow-xl mt-10">
        <div className="space-y-1">
          <h4 className="text-xl font-serif text-amber-400">Publier l'exploration ?</h4>
          <p className="text-stone-300 text-sm">Elle figurera immédiatement au calendrier des sorties partagées.</p>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center">
          <Button variant="ghost" className="text-stone-300 hover:text-white hover:bg-stone-800" onClick={() => router.back()}>
            Abandonner
          </Button>
          
          <Button variant="outline" className="border-stone-600 text-stone-100 bg-transparent hover:bg-stone-800" onClick={() => handleSave(false)} disabled={saving}>
            Brouillon
          </Button>

          <Button className="bg-amber-700 hover:bg-amber-600 text-stone-50 px-10 font-bold h-12 shadow-lg" onClick={() => handleSave(true)} disabled={saving}>
            {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <div className="flex items-center"><Send className="mr-2 h-5 w-5" /> Mettre en ligne</div>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// 👑 Export racine principal enveloppé du composant Suspense requis pour le build NextJS CSR-Bailout
export default function CreateEventPageRando7() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-amber-700" />
        <p className="text-sm font-medium font-serif text-stone-600">Chargement de la carte et des données patrimoine Occitanie...</p>
      </div>
    }>
      <CreateEventFormRando7 />
    </Suspense>
  );
}