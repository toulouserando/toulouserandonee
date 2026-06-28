'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from "@/lib/supabase";
import { Loader2, ClipboardList, Mountain, Route, Car, Send, ImageIcon, Map, ArrowLeft, Timer, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import 'leaflet/dist/leaflet.css';

// --- CONFIGURATION DU MARQUEUR ---
const L = typeof window !== 'undefined' ? require('leaflet') : null;
const customIcon = L ? new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
}) : null;

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

const MapController = ({ coords }: { coords: [number, number] }) => {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  useEffect(() => {
    if (coords && map) map.setView(coords, 13, { animate: true });
  }, [coords, map]);
  return null;
};

export default function CreateSortieCantonPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [selectedRando, setSelectedRando] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<File | null>(null);

  // États du formulaire logistique
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

  // Chargement de l'arbre des randonnées
  useEffect(() => {
    fetch('/api/point_rando_canton') 
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Erreur chargement data:", err));
  }, []);

  // Dès qu'une rando est sélectionnée, on pré-remplit les métriques connues
  useEffect(() => {
    if (selectedRando) {
      setTitle(`Sortie : ${selectedRando["Nom Rando"]}`);
      setMeetingPoint(selectedRando.commune || "");
      if (selectedRando.Distance) {
        // Nettoyage de la chaîne distance si nécessaire (ex: "12 km" -> "12")
        setDistance(String(selectedRando.Distance).replace(/[^\d.]/g, ''));
      }
    }
  }, [selectedRando]);

  const handleSave = async (isPublished: boolean) => {
    if (!selectedRando) {
      alert("Veuillez d'abord sélectionner un tracé de randonnée dans la liste.");
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("Vous devez être connecté pour publier un événement.");
      setSaving(false);
      return;
    }

    const hikeData = {
      title,
      description,
      recommendations, 
      location: meetingPoint,
      arrival_point: arrivalPoint, 
      distance: parseFloat(distance) || 0,
      duration: `${startTime} à ${endTime}`,
      difficulty,
      type: hikeType,
      elevation: parseInt(elevation) || 0,
      vehicles, 
      passengers, 
      transport_notes: transportNotes, 
      organizer_id: user.id,
      is_published: isPublished,
      // On conserve les métadonnées de la rando d'origine du canton
      rando_canton_id: selectedRando.id || null,
      latitude: selectedRando.LAT_DEPART,
      longitude: selectedRando.LON_DEPART,
      source: 'point_rando_canton'
    };

    const { error } = await supabase.from('Hikes').insert([hikeData]);

    if (error) {
      console.error("Erreur Supabase:", error);
      alert("Erreur lors de la création de la sortie.");
    } else {
      alert(isPublished ? "Sortie rando créée et publiée !" : "Brouillon enregistré !");
      router.push('/events'); 
    }
    setSaving(false);
  };

  if (!data) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-4xl text-blue-600 mb-4 mx-auto" />
        <p className="font-bold text-slate-600">Chargement du catalogue des cantons...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8 bg-slate-50/40 min-h-screen pb-24">
      
      {/* RETOUR & TITRE */}
      <div className="space-y-2">
        <Button variant="ghost" onClick={() => router.back()} className="text-slate-600 font-semibold p-0 hover:bg-transparent flex items-center gap-2">
          <ArrowLeft size={16} /> Retour au catalogue
        </Button>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Organiser une sortie à partir d'un <span className="text-blue-600">Point Canton</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLONNE GAUCHE : ARBORESCENCE DE SÉLECTION */}
        <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 max-h-[750px] overflow-y-auto">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
            <span>🎯</span> 1. Choisir le Sentier
          </h2>

          <div className="space-y-1.5">
            {Object.entries(data).map(([dept, cantons]: any) => (
              <details key={dept} className="group border border-slate-100 rounded-md">
                <summary className="list-none cursor-pointer p-2 text-xs font-bold bg-slate-50 flex justify-between items-center hover:bg-slate-100">
                  <span>📂 {dept}</span>
                  <span className="text-[9px] group-open:rotate-180">▼</span>
                </summary>
                
                <div className="p-1 space-y-1 ml-2 border-l border-slate-200">
                  {Object.entries(cantons).map(([canton, epcis]: any) => (
                    <details key={canton} className="group/canton">
                      <summary className="list-none cursor-pointer py-1 px-2 text-[11px] font-semibold text-slate-700 flex justify-between items-center hover:text-blue-600">
                        <span>🧩 Canton : {canton}</span>
                        <span className="text-[8px] group-open/canton:rotate-180">▼</span>
                      </summary>

                      <div className="ml-2 space-y-0.5">
                        {Object.entries(epcis).map(([epci, communes]: any) => (
                          <details key={epci} className="group/epci">
                            <summary className="list-none cursor-pointer py-1 px-2 text-[11px] text-slate-500 font-medium flex justify-between items-center hover:text-blue-500">
                              <span>🏛️ {epci}</span>
                              <span className="text-[8px] group-open/epci:rotate-180">▼</span>
                            </summary>

                            <div className="ml-2 space-y-0.5 pb-1">
                              {Object.entries(communes).map(([commune, randos]: any) => (
                                <details key={commune} className="group/commune">
                                  <summary className="list-none cursor-pointer py-0.5 px-2 text-[10px] font-bold text-blue-700 uppercase flex justify-between items-center bg-blue-50/20 rounded">
                                    <span>Town: {commune}</span>
                                    <span className="text-[7px] group-open/commune:rotate-180">▼</span>
                                  </summary>

                                  <div className="grid grid-cols-1 gap-0.5 pt-1 pl-1">
                                    {Array.isArray(randos) && randos.map((r: any, i: number) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSelectedRando(r)}
                                        className={`text-left text-[11px] p-1.5 rounded transition-all flex flex-col ${
                                          selectedRando === r 
                                          ? 'bg-blue-600 text-white font-semibold' 
                                          : 'bg-white border border-slate-100 hover:bg-slate-50 text-slate-700'
                                        }`}
                                      >
                                        <span>🥾 {r["Nom Rando"]}</span>
                                        <span className={`text-[9px] mt-0.5 ${selectedRando === r ? 'text-blue-100' : 'text-slate-400'}`}>
                                          Dureé: {r.Durée || 'N/C'}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </details>
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* COLONNE DROITE : FORMULAIRE ET APERÇU CARTE */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* APERÇU GÉOGRAPHIQUE */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="h-[250px] w-full relative z-0">
              <MapContainer center={[43.9, 2.4]} zoom={7} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {selectedRando && (
                  <>
                    <MapController coords={[selectedRando.LAT_DEPART, selectedRando.LON_DEPART]} />
                    <Marker position={[selectedRando.LAT_DEPART, selectedRando.LON_DEPART]} icon={customIcon}>
                      <Popup>
                        <div className="text-xs font-bold">{selectedRando["Nom Rando"]}</div>
                      </Popup>
                    </Marker>
                  </>
                )}
              </MapContainer>
              {!selectedRando && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] z-[1000] flex items-center justify-center text-center p-4">
                  <span className="bg-white text-slate-800 text-xs font-bold px-4 py-2 rounded-full shadow">
                    ← Sélectionnez une randonnée pour situer le départ
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* FORMULAIRE LOGISTIQUE LOGIQUE */}
          <div className={`space-y-6 transition-opacity ${!selectedRando ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            
            {/* TEXTES ET VISUELS */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b bg-slate-50 py-3">
                <CardTitle className="flex items-center gap-2 text-md text-slate-800 font-bold">
                  <ClipboardList className="w-4 h-4 text-blue-600"/> 2. Présentation du Rassemblement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="title">Nom de la sortie collective</Label>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre de l'événement communautaire" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="desc">Consignes de route & Programme</Label>
                    <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Rythme de marche, pause déjeuner..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reco">Équipements requis</Label>
                    <Textarea id="reco" value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={3} placeholder="Pique-nique, eau en quantité, veste imperméable..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PARAMÈTRES TECHNIQUES */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500">Dénivelé + (m)</Label>
                  <div className="relative">
                    <Mountain className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input type="number" value={elevation} onChange={e => setElevation(e.target.value)} className="pl-9 h-9" placeholder="Ex: 450" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500">Distance (km)</Label>
                  <div className="relative">
                    <Route className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input type="number" step="0.1" value={distance} onChange={e => setDistance(e.target.value)} className="pl-9 h-9" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500">Niveau requis</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facile">Facile</SelectItem>
                      <SelectItem value="moyen">Moyen</SelectItem>
                      <SelectItem value="difficile">Difficile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500">Tracé</Label>
                  <Select value={hikeType} onValueChange={setHikeType}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boucle">Boucle</SelectItem>
                      <SelectItem value="aller-retour">Aller-Retour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* LOGISTIQUE LOGISTIQUE / TRANSPORTS */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-800 text-white py-2 px-4 rounded-t-xl">
                <CardTitle className="text-xs font-bold uppercase tracking-wider">3. Logistique & Covoiturage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-xs font-semibold flex items-center gap-1"><MapPin size={12}/> Lieu de RDV initial</Label><Input value={meetingPoint} onChange={e => setMeetingPoint(e.target.value)} className="h-9" /></div>
                  <div className="space-y-1"><Label className="text-xs font-semibold flex items-center gap-1"><MapPin size={12}/> Fin de parcours</Label><Input value={arrivalPoint} onChange={e => setArrivalPoint(e.target.value)} placeholder="Laisser vide si identique" className="h-9" /></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-xs font-semibold flex items-center gap-1"><Timer size={12}/> Départ rando</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-9" /></div>
                  <div className="space-y-1"><Label className="text-xs font-semibold flex items-center gap-1"><Timer size={12}/> Retour estimé</Label><Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9" /></div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border space-y-3">
                  <Label className="text-xs font-bold flex items-center gap-1.5 text-slate-700"><Car size={14}/> COVOITURAGE COMMUNAUTAIRE</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input type="number" placeholder="Voitures" value={vehicles || ""} onChange={e => setVehicles(parseInt(e.target.value) || 0)} className="h-9 bg-white" />
                    <Input type="number" placeholder="Places max" value={passengers || ""} onChange={e => setPassengers(parseInt(e.target.value) || 0)} className="h-9 bg-white" />
                  </div>
                  <Textarea placeholder="Précisions d'accès (état des pistes forestières, tarifs de stationnement éventuels...)" value={transportNotes} onChange={e => setTransportNotes(e.target.value)} className="text-xs bg-white" rows={2} />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS FIXE */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 p-6 rounded-xl shadow-lg text-white">
        <div>
          <h4 className="text-base font-bold text-blue-400">Prêt à valider l'itinéraire ?</h4>
          <p className="text-xs text-slate-300">Votre événement sera rattaché aux coordonnées géographiques du canton sélectionné.</p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto justify-end">
          <Button variant="outline" className="border-slate-700 text-slate-300 bg-transparent hover:bg-slate-800 text-xs h-10" onClick={() => handleSave(false)} disabled={saving || !selectedRando}>
            Brouillon
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 h-10" onClick={() => handleSave(true)} disabled={saving || !selectedRando}>
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <div className="flex items-center"><Send className="mr-1.5 h-4 w-4" /> Publier la sortie</div>}
          </Button>
        </div>
      </div>

    </div>
  );
}