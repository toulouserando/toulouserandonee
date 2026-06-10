"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from "@/lib/supabase";
import { Loader2, ClipboardList, Mountain, Route, Car, Send, ImageIcon, Map } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import 'leaflet/dist/leaflet.css';

// Chargement du MapComponent local de rando10 sans SSR
const MapComponent = dynamic(() => import('../MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-slate-100 font-mono italic text-slate-400">Chargement de la carte...</div>
});

export default function CreateEventPageRando10() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const id = searchParams.get('id');
  const sourceParam = searchParams.get('source') || 'rando10'; 
  
  const [filteredCircuits, setFilteredCircuits] = useState<any[]>([]);
  const [currentFiltre, setCurrentFiltre] = useState<string>("Gers (32)");
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

  // RÉCUPÉRATION DE L'ITINÉRAIRE UNIQUE DEPUIS L'API RANDO10
  useEffect(() => {
    fetch('/api/rando10')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && id) {
          const found = data.find((item: any) => String(item.id) === String(id));
          if (found) {
            setFilteredCircuits([found]); 
            setCurrentFiltre(found.departement || "Gers (32)");
            setTitle(`Randonnée : ${found.nom}`);
            setMeetingPoint(found.commune || "");
            
            // Calcul ou pré-remplissage de la distance en km
            if (found.longueur) {
              const distanceKm = found.longueur >= 1000 
                ? (parseFloat(found.longueur) / 1000).toFixed(1)
                : (parseFloat(found.longueur) / 1000).toFixed(2);
              setDistance(distanceKm);
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur lors du chargement du circuit rando10:", err);
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
        Planifier une Sortie <span className="text-blue-600">{currentFiltre}</span>
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
              <span className="text-slate-600 font-medium mt-2">Ajouter un visuel ou une photo du circuit</span>
            </>
          )}
        </label>
      </Card>

      {/* 📝 FORMULAIRE TEXTE */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-100/50">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <ClipboardList className="w-5 h-5 text-blue-600"/> Description de la randonnée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="event-title">Titre de l'évènement</Label>
            <Input id="event-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Randonnée découverte sur les sentiers" className="h-11 border-slate-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="event-desc">Programme & Itinéraire</Label>
              <Textarea id="event-desc" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Détails du parcours, pauses prévues..." className="border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-reco" className="text-slate-500">Équipements & Consignes</Label>
              <Textarea id="event-reco" value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={4} placeholder="Chaussures de rando requises, pique-nique, eau..." className="border-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🗺️ VISUALISATION CARTE RANDO10 */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-900 text-slate-50">
          <CardTitle className="flex items-center gap-2 text-md">
            <Map size={18} className="text-blue-400"/> Localisation du sentier sélectionné
          </CardTitle>
        </CardHeader>
        <div className="h-[400px] relative w-full overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
            </div>
          ) : (
            <MapComponent 
              key={`${currentFiltre}-${id}`}
              filtre={currentFiltre} 
              circuits={filteredCircuits} 
            />
          )}
        </div>
      </Card>

      {/* 📊 OPTIONS TECHNIQUES */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Dénivelé positif (m)</Label>
            <div className="relative">
              <Mountain className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="number" value={elevation} onChange={e => setElevation(e.target.value)} className="pl-10 h-10 border-slate-200" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Distance totale (km)</Label>
            <div className="relative">
              <Route className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="number" step="0.1" value={distance} onChange={e => setDistance(e.target.value)} className="pl-10 h-10 border-slate-200" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Niveau requis</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="facile">Facile (Famille)</SelectItem>
                <SelectItem value="moyen">Moyen (Habitué)</SelectItem>
                <SelectItem value="difficile">Difficile (Sportif)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Type de tracé</Label>
            <Select value={hikeType} onValueChange={setHikeType}>
              <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="boucle">Boucle</SelectItem>
                <SelectItem value="aller-retour">Aller-Retour</SelectItem>
                <SelectItem value="traversee">Traversée A vers B</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 🚗 COVOITURAGE & RENDEZ-VOUS */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-800 text-slate-50">
          <CardTitle className="text-md">Organisation & Logistique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Lieu de Départ / RDV</Label><Input value={meetingPoint} onChange={e => setMeetingPoint(e.target.value)} placeholder="Parking, Église, Mairie..." className="border-slate-200" /></div>
            <div className="space-y-1"><Label>Lieu de Dispersion</Label><Input value={arrivalPoint} onChange={e => setArrivalPoint(e.target.value)} placeholder="Identique au départ..." className="border-slate-200" /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Heure de Départ</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="border-slate-200" /></div>
            <div className="space-y-1"><Label>Heure de Retour estimée</Label><Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="border-slate-200" /></div>
          </div>

          <div className="bg-slate-100/60 p-4 rounded-lg border border-slate-200 space-y-4">
            <Label className="font-bold flex items-center gap-2 text-slate-800"><Car size={16}/> OPTIONS COVOITURAGE</Label>
            <div className="grid md:grid-cols-2 gap-6">
              <Input type="number" placeholder="Nombre de voitures nécessaires" value={vehicles || ""} onChange={e => setVehicles(parseInt(e.target.value) || 0)} className="bg-white border-slate-200" />
              <Input type="number" placeholder="Places de passagers totales" value={passengers || ""} onChange={e => setPassengers(parseInt(e.target.value) || 0)} className="bg-white border-slate-200" />
            </div>
            <div className="space-y-1">
              <Label>Précisions routières</Label>
              <Textarea placeholder="Frais de partage à prévoir, lieu de rdv pour le covoiturage..." value={transportNotes} onChange={e => setTransportNotes(e.target.value)} className="bg-white border-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 🚀 BANDEAU D'ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-2xl shadow-xl mt-10">
        <div className="space-y-1">
          <h4 className="text-xl font-bold text-blue-400">Publier la sortie ?</h4>
          <p className="text-slate-300 text-sm">Elle rejoindra instantanément le calendrier commun de la communauté.</p>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center">
          <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => router.back()}>
            Annuler
          </Button>
          
          <Button variant="outline" className="border-slate-700 text-slate-100 bg-transparent hover:bg-slate-800" onClick={() => handleCreateEvent(false)} disabled={saving}>
            Brouillon
          </Button>

          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-10 font-bold h-12 shadow-lg" onClick={() => handleCreateEvent(true)} disabled={saving}>
            {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <div className="flex items-center"><Send className="mr-2 h-5 w-5" /> Mettre en ligne</div>}
          </Button>
        </div>
      </div>
    </div>
  );
}