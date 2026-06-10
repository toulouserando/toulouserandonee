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

// Chargement du composant de carte spécifique à RANDO6 sans SSR
const MapComponent = dynamic(() => import('../MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-slate-100">Chargement de la carte...</div>
});

export default function CreateEventPageRando6() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Récupération des paramètres de l'URL (?source=rando6&id=filename_du_circuit)
  const id = searchParams.get('id');
  const sourceParam = searchParams.get('source') || 'rando6'; 
  
  // États synchronisés avec les arguments requis par le MapComponent de Rando6
  const [mapData, setMapData] = useState<any[]>([]);
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

  // CHARGEMENT ET FILTRAGE DEPUIS L'API RANDO6
  useEffect(() => {
    if (!id) { 
      setLoading(false); 
      return; 
    }
    
    fetch('/api/rando6')
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json)) {
          // Recherche de la trace correspondant à l'ID ou filename reçu
          const found = json.find((s: any) => s.filename === id || s.id === id);
          if (found) {
            setMapData([found]); // Le MapComponent de rando6 attend un tableau d'objets circuits
            setTitle(`Sortie vélo : ${found.name || found.title || 'Circuit'}`);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur lors du chargement des informations rando6:", err);
        setLoading(false);
      });
  }, [id]);

  // FONCTION POUR ENREGISTRER SUR SUPABASE
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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-black uppercase text-slate-900 tracking-tight">Proposer une sortie Vélo (Lot)</h1>

      {/* 📷 ZONE PHOTO */}
      <Card className="border-dashed border-2 p-0 min-h-[200px] bg-slate-50/50">
        <input type="file" id="photo-upload" hidden onChange={(e) => setImage(e.target.files?.[0] || null)} />
        <label htmlFor="photo-upload" className="flex flex-col items-center justify-center cursor-pointer p-8">
          {image ? <img src={URL.createObjectURL(image)} className="max-h-48 rounded-lg" alt="Preview" /> : <><ImageIcon className="h-10 w-10 text-slate-400" /><span>Ajouter une photo de couverture</span></>}
        </label>
      </Card>

      {/* 📝 DÉTAILS TEXTE */}
      <Card>
        <CardHeader className="border-b bg-slate-50/30">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ClipboardList className="w-5 h-5"/> Détails techniques & Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="event-title">Titre de la sortie</Label>
            <Input id="event-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Randonnée cycliste Figeac-Cahors" className="h-11" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea id="event-desc" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Description du parcours, allure prévue..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-reco" className="text-slate-500">Équipements conseillés</Label>
              <Textarea id="event-reco" value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={4} placeholder="Casque obligatoire, kit anti-crevaison..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🗺️ CARD 1 : VISUALISATION DU PARCOURS VÉLO SÉLECTIONNÉ */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-900 text-white">
          <CardTitle>1. Tracé de l'itinéraire cyclable</CardTitle>
        </CardHeader>
        <div className="h-[400px] relative w-full overflow-hidden rounded-b-xl">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-slate-900 h-8 w-8" />
            </div>
          ) : (
            /* Passage des paramètres appropriés au MapComponent de Rando6 */
            <MapComponent 
              selectedSource={id || ''} 
              data={mapData} 
              customPoints={[]} 
              setCustomPoints={() => {}} 
            />
          )}
        </div>
      </Card>

      {/* 📊 CARD INFOS COMPLÉMENTAIRES */}
      <Card className="mt-6">
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Dénivelé cumulé (m)</Label>
            <div className="relative">
              <Mountain className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="number" value={elevation} onChange={e => setElevation(e.target.value)} className="pl-10 h-10" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Distance totale (km)</Label>
            <div className="relative">
              <Route className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input type="number" value={distance} onChange={e => setDistance(e.target.value)} className="pl-10 h-10" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Difficulté requise</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="facile">Facile (Cyclotourisme)</SelectItem>
                <SelectItem value="moyen">Moyen (Rythme régulier)</SelectItem>
                <SelectItem value="difficile">Difficile (Sportif)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500">Format</Label>
            <Select value={hikeType} onValueChange={setHikeType}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="boucle">Boucle</SelectItem>
                <SelectItem value="aller-retour">Aller-Retour</SelectItem>
                <SelectItem value="lineaire">Linéaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 🚗 CARD 2 : LOGISTIQUE ET COVOITURAGE */}
      <Card className="border-emerald-100">
        <CardHeader className="bg-emerald-800 text-white">
          <CardTitle>2. Logistique & Organisation du Transport</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Point de Rassemblement</Label><Input value={meetingPoint} onChange={e => setMeetingPoint(e.target.value)} placeholder="Ex: Gare de Cahors" /></div>
            <div className="space-y-1"><Label>Point d'Arrivée final</Label><Input value={arrivalPoint} onChange={e => setArrivalPoint(e.target.value)} placeholder="Ex: Même endroit" /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Heure de Départ</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></div>
            <div className="space-y-1"><Label>Fin estimée</Label><Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
            <Label className="font-bold flex items-center gap-2"><Car size={16}/> CAPACITÉ LOGISTIQUE (PORTE-VÉLOS / PLACES)</Label>
            <div className="grid md:grid-cols-2 gap-6">
              <Input type="number" placeholder="Nombre de voitures avec attelage" value={vehicles || ""} onChange={e => setVehicles(parseInt(e.target.value) || 0)} />
              <Input type="number" placeholder="Nombre total de places passagers" value={passengers || ""} onChange={e => setPassengers(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Informations complémentaires sur le transport</Label>
              <Textarea placeholder="Précisez si vous disposez d'une remorque à vélos..." value={transportNotes} onChange={e => setTransportNotes(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 🚀 PIED DE PAGE : ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-2xl shadow-2xl mt-10">
        <div className="space-y-1">
          <h4 className="text-xl font-black uppercase text-emerald-400">Prêt à lancer l'événement ?</h4>
          <p className="text-slate-300 text-sm font-medium">La sortie sera accessible immédiatement par le groupe.</p>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center">
          <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={() => router.back()}>
            Abandonner
          </Button>
          
          <Button variant="outline" className="border-slate-500 text-slate-100 bg-transparent hover:bg-slate-800" onClick={() => handleCreateEvent(false)} disabled={saving}>
            Brouillon
          </Button>

          <Button className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 font-extrabold h-12 shadow-lg shadow-emerald-500/20" onClick={() => handleCreateEvent(true)} disabled={saving}>
            {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <div className="flex items-center"><Send className="mr-2 h-5 w-5" /> Publier la sortie vélo</div>}
          </Button>
        </div>
      </div>
    </div>
  );
}