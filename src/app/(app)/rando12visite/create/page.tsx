"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { Loader2, ClipboardList, Mountain, Route, Car, Send, ImageIcon, Map } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateEventPageRando12() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const id = searchParams.get('id'); // Nom de la ville (ex: Lavaur)
  const sourceParam = searchParams.get('source') || 'rando12visite'; 
  
  const [selectedVille, setSelectedVille] = useState<any>(null);
  const [currentFiltre, setCurrentFiltre] = useState<string>("Visite Culturelle");
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

  // RÉCUPÉRATION DU GUIDE DE VISITE DEPUIS L'API RANDO12VISITE
  useEffect(() => {
    if (!id) return;
    
    fetch('/api/rando12visite')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const found = data.find((item: any) => String(item.ville).toLowerCase() === String(id).toLowerCase());
          if (found) {
            setSelectedVille(found);
            setCurrentFiltre(found.ville);
            setTitle(`Visite guidée : ${found.ville}`);
            setMeetingPoint(found.ville);
            
            if (found.points && found.points.length > 0) {
              setDistance((found.points.length * 0.5).toFixed(1)); 
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur lors du chargement de la visite rando12:", err);
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

  // Construction de l'URL du plan JPEG (on prend le premier plan disponible par défaut)
  const imageUrl = selectedVille && selectedVille.cartes && selectedVille.cartes.length > 0
    ? `/api/visites/image?ville=${encodeURIComponent(selectedVille.ville)}&file=${encodeURIComponent(selectedVille.cartes[0])}`
    : null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-slate-50/40 min-h-screen">
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
        Organiser une Visite : <span className="text-amber-600">{currentFiltre}</span>
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
              <span className="text-slate-600 font-medium mt-2">Ajouter un visuel ou une illustration de la ville</span>
            </>
          )}
        </label>
      </Card>

      {/* 📝 FORMULAIRE TEXTE */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-100/50">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <ClipboardList className="w-5 h-5 text-amber-500"/> Description & Parcours Historique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="event-title">Titre de la sortie culturelle</Label>
            <Input id="event-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Découverte des monuments secrets" className="h-11 border-slate-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="event-desc">Programme des visites</Label>
              <Textarea id="event-desc" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Ordre des monuments, anecdotes, pauses café..." className="border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-reco" className="text-slate-500">Règles & Infos pratiques</Label>
              <Textarea id="event-reco" value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={4} placeholder="Appareil photo recommandé, billets éventuels, chaussures confortables..." className="border-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🖼️ ZONE REMPLACÉE : APERÇU DU PLAN HISTORIQUE AU LIEU DE LEAFLET */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-900 text-slate-50">
          <CardTitle className="flex items-center gap-2 text-md">
            <Map size={18} className="text-amber-400"/> Plan historique de la ville sélectionnée
          </CardTitle>
        </CardHeader>
        <div className="min-h-[350px] relative w-full overflow-hidden bg-slate-100 flex items-center justify-center p-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-amber-500 h-8 w-8" />
            </div>
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Plan de la ville" 
              className="max-h-[380px] w-auto object-contain rounded-lg border border-slate-200 shadow-sm bg-white"
            />
          ) : (
            <div className="text-slate-400 italic text-sm">Aucun plan trouvé pour cette ville.</div>
          )}
        </div>
      </Card>

      {/* 📊 OPTIONS TECHNIQUES */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Dénivelé urbain (m)</Label>
            <div className="relative">
              <Mountain className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="number" value={elevation} onChange={e => setElevation(e.target.value)} className="pl-10 h-10 border-slate-200" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Distance pédestre (km)</Label>
            <div className="relative">
              <Route className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="number" step="0.1" value={distance} onChange={e => setDistance(e.target.value)} className="pl-10 h-10 border-slate-200" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Rythme de marche</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="facile">Flânerie (Tranquille)</SelectItem>
                <SelectItem value="moyen">Soutenu (Habituel)</SelectItem>
                <SelectItem value="difficile">Marathon culturel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Type de tracé</Label>
            <Select value={hikeType} onValueChange={setHikeType}>
              <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="boucle">Boucle urbaine</SelectItem>
                <SelectItem value="aller-retour">Aller-Retour</SelectItem>
                <SelectItem value="traversee">Traversée de quartier</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 🚗 COVOITURAGE & RENDEZ-VOUS */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-800 text-slate-50">
          <CardTitle className="text-md">Organisation & Logistique de rassemblement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Point de RDV Initial</Label><Input value={meetingPoint} onChange={e => setMeetingPoint(e.target.value)} placeholder="Gare, Place centrale, Statue..." className="border-slate-200" /></div>
            <div className="space-y-1"><Label>Point de dispersion</Label><Input value={arrivalPoint} onChange={e => setArrivalPoint(e.target.value)} placeholder="Identique au départ..." className="border-slate-200" /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Heure de début</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="border-slate-200" /></div>
            <div className="space-y-1"><Label>Heure de fin estimée</Label><Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="border-slate-200" /></div>
          </div>

          <div className="bg-slate-100/60 p-4 rounded-lg border border-slate-200 space-y-4">
            <Label className="font-bold flex items-center gap-2 text-slate-800"><Car size={16}/> LOGISTIQUE DE TRANSPORT</Label>
            <div className="grid md:grid-cols-2 gap-6">
              <Input type="number" placeholder="Nombre de véhicules / convois requis" value={vehicles || ""} onChange={e => setVehicles(parseInt(e.target.value) || 0)} className="bg-white border-slate-200" />
              <Input type="number" placeholder="Capacité totale en passagers" value={passengers || ""} onChange={e => setPassengers(parseInt(e.target.value) || 0)} className="bg-white border-slate-200" />
            </div>
            <div className="space-y-1">
              <Label>Précisions (Transports en commun, parkings payants...)</Label>
              <Textarea placeholder="Indiquez ici si le point de rendez-vous est accessible en métro/bus ou les zones de stationnement gratuites..." value={transportNotes} onChange={e => setTransportNotes(e.target.value)} className="bg-white border-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 🚀 BANDEAU D'ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-2xl shadow-xl mt-10">
        <div className="space-y-1">
          <h4 className="text-xl font-bold text-amber-500">Ouvrir les inscriptions ?</h4>
          <p className="text-slate-300 text-sm">Le guide de visite sera épinglé à l'événement pour tous les participants.</p>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center">
          <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => router.back()}>
            Annuler
          </Button>
          
          <Button variant="outline" className="border-slate-700 text-slate-100 bg-transparent hover:bg-slate-800" onClick={() => handleCreateEvent(false)} disabled={saving}>
            Brouillon
          </Button>

          <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-10 font-bold h-12 shadow-lg border-0" onClick={() => handleCreateEvent(true)} disabled={saving}>
            {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <div className="flex items-center"><Send className="mr-2 h-5 w-5" /> Publier la visite</div>}
          </Button>
        </div>
      </div>
    </div>
  );
}