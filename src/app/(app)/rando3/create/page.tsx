"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from "@/lib/supabase";
import { Loader2, ClipboardList, Mountain, Route, Car, Send, ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import 'leaflet/dist/leaflet.css';

// Chargement du composant de carte principal sans SSR
const MapComponent = dynamic(() => import('../MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-slate-100">Chargement de la carte...</div>
});

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Récupération des paramètres de l'URL (?source=rando3&id=...)
  const id = searchParams.get('id');
  const sourceParam = searchParams.get('source') || 'rando3'; 
  
  // Stockage du tracé spécifique pour rando3 (Objet unique attendu par son MapComponent)
  const [activeRouteData, setActiveRouteData] = useState<any | null>(null);
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

  // CHARGEMENT DYNAMIQUE DEPUIS L'API APPROPRIÉE
  useEffect(() => {
    if (!id) { 
      setLoading(false); 
      return; 
    }
    
    fetch(`/api/${sourceParam}`)
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json)) {
          const found = json.find((item: any) => String(item.id) === String(id) || String(item.originalId) === String(id));
          if (found) {
            setActiveRouteData(found);
            if (found.nom) setTitle(`Sortie : ${found.nom}`);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur lors du chargement du parcours:", err);
        setLoading(false);
      });
  }, [id, sourceParam]);

  // FONCTION POUR ENREGISTRER SUR SUPABASE
  const handleCreateEvent = async (isPublished: boolean) => {
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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-black uppercase text-indigo-950 tracking-tight">Proposer une sortie Cruetou</h1>

      {/* 📷 ZONE PHOTO */}
      <Card className="border-dashed border-2 p-0 min-h-[200px] bg-slate-50/50">
        <input type="file" id="photo-upload" hidden onChange={(e) => setImage(e.target.files?.[0] || null)} />
        <label htmlFor="photo-upload" className="flex flex-col items-center justify-center cursor-pointer p-8">
          {image ? <img src={URL.createObjectURL(image)} className="max-h-48 rounded-lg" alt="Preview" /> : <><ImageIcon className="h-10 w-10 text-slate-400" /><span>Ajouter une photo</span></>}
        </label>
      </Card>

      {/* 📝 DÉTAILS TEXTE */}
      <Card>
        <CardHeader className="border-b bg-slate-50/30">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-indigo-900">
            <ClipboardList className="w-5 h-5"/> Détails de la rando
          </CardTitle>
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

      {/* 🗺️ CARD 1 : VISUALISATION DU PARCOURS SÉLECTIONNÉ */}
      <Card className="border-indigo-100 shadow-sm">
        <CardHeader className="bg-indigo-900 text-white">
          <CardTitle>1. Parcours historique</CardTitle>
        </CardHeader>
        <div className="h-[400px] relative w-full overflow-hidden rounded-b-xl">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-indigo-900 h-8 w-8" />
            </div>
          ) : (
            /* CORRECTION ICI : Rando3 attend la prop activeRoute */
            <MapComponent activeRoute={activeRouteData} />
          )}
        </div>
      </Card>

      {/* 📊 CARD INFOS RANDONNÉE */}
      <Card className="mt-6">
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Dénivelé (m)</Label>
            <div className="relative">
              <Mountain className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="number" value={elevation} onChange={e => setElevation(e.target.value)} className="pl-10 h-10" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Distance (km)</Label>
            <div className="relative">
              <Route className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="number" value={distance} onChange={e => setDistance(e.target.value)} className="pl-10 h-10" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Difficulté</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="facile">Facile</SelectItem>
                <SelectItem value="moyen">Moyen</SelectItem>
                <SelectItem value="difficile">Difficile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Type</Label>
            <Select value={hikeType} onValueChange={setHikeType}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="boucle">Boucle</SelectItem>
                <SelectItem value="aller-retour">Aller-Retour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 🚗 CARD 2 : LOGISTIQUE ET TRANSPORT */}
      <Card className="border-blue-100">
        <CardHeader className="bg-blue-700 text-white">
          <CardTitle>2. Itinéraire et Transport</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="text-sm bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-800">
            💡 <strong>Astuce :</strong> Le tracé de votre circuit est visible dans la <strong>Section 1 (Parcours)</strong> ci-dessus.
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Lieu de RDV</Label><Input value={meetingPoint} onChange={e => setMeetingPoint(e.target.value)} placeholder="Ex: Pont Neuf" /></div>
            <div className="space-y-1"><Label>Lieu de Retour</Label><Input value={arrivalPoint} onChange={e => setArrivalPoint(e.target.value)} placeholder="Ex: Même endroit" /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Départ</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></div>
            <div className="space-y-1"><Label>Fin estimée</Label><Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
            <Label className="font-bold flex items-center gap-2"><Car size={16}/> CAPACITÉ TRANSPORT</Label>
            <div className="grid md:grid-cols-2 gap-6">
              <Input type="number" placeholder="Véhicules disponibles" value={vehicles || ""} onChange={e => setVehicles(parseInt(e.target.value) || 0)} />
              <Input type="number" placeholder="Places total passagers" value={passengers || ""} onChange={e => setPassengers(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Précisions sur le transport (optionnel)</Label>
              <Textarea placeholder="Ex: Sortie à pied dans Toulouse..." value={transportNotes} onChange={e => setTransportNotes(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 🚀 PIED DE PAGE : ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-2xl shadow-2xl mt-10">
        <div className="space-y-1">
          <h4 className="text-xl font-black uppercase text-green-400">Prêt à publier ?</h4>
          <p className="text-slate-300 text-sm font-medium">Visible instantanément par la communauté.</p>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center">
          <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={() => router.back()}>
            Abandonner
          </Button>
          
          <Button variant="outline" className="border-slate-500 text-slate-100 bg-transparent hover:bg-slate-800" onClick={() => handleCreateEvent(false)} disabled={saving}>
            Brouillon
          </Button>

          <Button className="bg-green-500 hover:bg-green-400 text-white px-10 font-extrabold h-12 shadow-lg shadow-green-500/20" onClick={() => handleCreateEvent(true)} disabled={saving}>
            {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <div className="flex items-center"><Send className="mr-2 h-5 w-5" /> Publier la sortie</div>}
          </Button>
        </div>
      </div>
    </div>
  );
}