"use client";

import React, { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <-- AJOUTEZ CETTE LIGNE
import { 
  ArrowLeft, MousePointer2, Trash2, ChevronsUpDown,
  Check, Users, Library, ChevronRight, Route, Image as ImageIcon,
  Send, Loader2, Car, MapPin, Timer, Mountain, ClipboardList, Search
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import { supabase } from "@/lib/supabase"; // Ou le chemin vers ton fichier de config supabase

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
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
    // CRITIQUE : On vérifie que la map ET le pane existent
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
  }, [active, map]); // On réduit les dépendances pour éviter les boucles de rendu
  return null;
}

function TransportPolyline({ points, setPoints }: { points: [number, number][], setPoints: any }) {
  const map = useMapInstance();
  
  useEffect(() => {
    // CRITIQUE : On vérifie non seulement la map, mais aussi si les "panes" existent
    // Si getPanes() n'existe pas, Leaflet ne peut pas faire de "appendChild"
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

// --- CHANGE VIEW : Adapté au format standardisé de l'API ---
function ChangeView({ data }: { data: any[] }) {
  const map = useMapInstance();
  useEffect(() => {
    if (map && data && data.length > 0) {
      const timer = setTimeout(async () => {
        const L = await import('leaflet');
        const bounds = L.latLngBounds([]);
        let hasValidPoints = false;

        data.forEach(item => {
          // Utilise le champ "geometry" standardisé par ton route.ts
          const geo = item.geometry;
          if (geo) {
            try {
              const layer = L.geoJSON(geo);
              const geoBounds = layer.getBounds();
              if (geoBounds.isValid()) {
                bounds.extend(geoBounds);
                hasValidPoints = true;
              }
            } catch (e) { console.error("Erreur bounds:", e); }
          }
        });

        if (hasValidPoints && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], animate: true });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [data, map]);
  return null;
}

export default function CarteRandoInteractive() {
// --- AJOUTEZ CET ÉTAT ICI ---

// --- 1. LES ÉTATS DU FORMULAIRE (À AJOUTER ICI) ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [arrivalPoint, setArrivalPoint] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [vehicleCount, setVehicleCount] = useState("0");
  const [totalSeats, setTotalSeats] = useState("0");
  const [transportNotes, setTransportNotes] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("10");
  const [enrollmentType, setEnrollmentType] = useState("Ouvert");
  const [difficulty, setDifficulty] = useState("Moyenne");
  const [elevation, setElevation] = useState("");
  const [distance, setDistance] = useState("");
  const [hikeType, setHikeType] = useState("Boucle");
  const [coOrganizerId, setCoOrganizerId] = useState("none");
  const [map1Ready, setMap1Ready] = useState(false);

// Et si tu utilises la ref pour la map transport :
const mapTransportRef = useRef(null);

// --- 2. TES ÉTATS DÉJÀ PRÉSENTS (NE PAS LES SUPPRIMER) ---
  const router = useRouter(); // Permet de rediriger l'utilisateur après la création
  const [loading, setLoading] = useState(false); // Gère l'état visuel du bouton (spinner)
  const [image, setImage] = useState<File | null>(null);
  const [sources, setSources] = useState<{ locaux: Record<string, any[]>, supabase: any[] }>({ 
    locaux: {}, 
    supabase: [] 
  });
  const [selectedSource, setSelectedSource] = useState('custom');
  const [data, setData] = useState<any[]>([]);
  const [customPoints, setCustomPoints] = useState<[number, number][]>([]);
  const [mounted, setMounted] = useState(false);

  const [openMenu, setOpenMenu] = useState(false);
  const [openSupabase, setOpenSupabase] = useState(false);
  const [openLocaux, setOpenLocaux] = useState(false);
  const [transportPoints, setTransportPoints] = useState<[number, number][]>([]);

  const currentTitle = useMemo(() => {
    if (selectedSource === 'custom') return "✍️ Nouveau tracé personnalisé";
    const foundSupa = (sources.supabase || []).find(s => String(s.id) === String(selectedSource));
    if (foundSupa) return foundSupa.title;
    for (const deptFiles of Object.values(sources.locaux || {})) {
      const found = deptFiles.find(f => f.id === selectedSource);
      if (found) return found.title;
    }
    return "Sélectionner un itinéraire...";
  }, [selectedSource, sources]);

  useEffect(() => {
    setMounted(true);
    fetch('/api/testrandos2')
      .then(res => res.json())
      .then(json => setSources({
        locaux: json.locaux || {},
        supabase: json.supabase || []
      }))
      .catch(err => console.error("Erreur listing:", err));
  }, []);

  useEffect(() => {
    setData([]); 
    if (!selectedSource || selectedSource === 'custom') return;

    let endpoint = "";
    if (selectedSource.includes('/') || selectedSource.includes('.')) {
      let format = "format-tableau";
      if (selectedSource.includes("adresses")) format = "format-points";
      else if (selectedSource.endsWith(".geojson")) format = "format-geojson";
      endpoint = `/api/testrandos2/${format}/${selectedSource}`;
    } else {
      endpoint = `/api/testrandos2/${selectedSource}`;
    }

fetch(endpoint)
    .then(res => res.json())
    .then(resData => {
      console.log("Source sélectionnée:", selectedSource);
      console.log("Données reçues de l'API:", resData); // <--- REGARDE ICI DANS F12
      const arrayData = Array.isArray(resData) ? resData : [resData];
      setData(arrayData);
    })
    .catch(err => console.error("Erreur Fetch:", err));
}, [selectedSource]);

const handleCreateEvent = async (isPublished = true) => {
  setLoading(true);
  try {
    // Vérification de l'utilisateur (à adapter selon ton auth)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Vous devez être connecté");

    // --- ÉTAPE 1 : Gérer l'image (si présente) ---
    let imageUrl = null;
    if (image) {
      const fileName = `${Date.now()}-${image.name}`;
      const { data: imgData, error: imgErr } = await supabase.storage
        .from('event-images')
        .upload(fileName, image);
      if (imgErr) throw imgErr;
      imageUrl = supabase.storage.from('event-images').getPublicUrl(fileName).data.publicUrl;
    }

    // --- ÉTAPE 2 : Déterminer le hike_id ---
    // Si c'est une rando existante, on prend selectedSource, sinon on crée un topo (optionnel)
    let finalHikeId = selectedSource !== 'custom' ? selectedSource : null;

    // --- ÉTAPE 3 : CRÉER L'ÉVÉNEMENT ---
    const { error: eventError } = await supabase.from('events').insert({
      title, // Assure-toi d'avoir un état [title, setTitle]
      description,
      recommendations,
      meeting_point: meetingPoint,
      date: date?.toISOString(), 
      registration_deadline: registrationDeadline?.toISOString(),
      start_time: startTime, 
      return_time: returnTime,
      max_participants: parseInt(maxParticipants), 
      enrollment_type: enrollmentType,
      difficulty, 
      elevation: parseInt(elevation) || 0, 
      distance: parseFloat(distance) || 0,
      hike_type: hikeType, 
      organizer_id: user.id,
      co_organizer_id: coOrganizerId === "none" ? null : coOrganizerId,
      
      hike_id: finalHikeId,
      // On stocke les points tracés à la main si c'est du custom
      custom_circuit: selectedSource === 'custom' ? customPoints : null,
      transport_steps: transportPoints,
      image_url: imageUrl,
      status: isPublished ? 'À venir' : 'Brouillon'
    });

    if (eventError) throw eventError;
    
    router.push('/events'); // Redirection après succès
  } catch (err: any) {
    console.error(err);
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

<div className="mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">
          Proposer une nouvelle sortie
        </h1>
      </div>

      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-green-700 font-bold p-2 hover:bg-green-50 rounded-lg">          
          <span></span>
        </Link>
      </header>

      {/* --- PHOTO COUVERTURE --- */}
      <Card className="relative overflow-hidden border-dashed border-2 flex flex-col items-center justify-center p-0 min-h-[200px] bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
          <input 
            type="file" 
            id="photo-upload" 
            hidden 
            onChange={(e) => setImage(e.target.files?.[0] || null)} 
            accept="image/*" 
          />
          <label htmlFor="photo-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full p-8">
            {image ? (
              <div className="text-center w-full">
                <p className="text-sm font-bold text-green-600 mb-2">✅ Image sélectionnée :</p>
                <div className="relative inline-block">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt="Preview" 
                    className="max-h-48 rounded-lg shadow-md mx-auto object-cover" 
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={(e) => { e.preventDefault(); setImage(null); }}
                  >
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

      <Card className="overflow-hidden border-green-100 shadow-xl">
        <CardHeader className="bg-green-700 text-white flex flex-row items-center justify-between py-4 px-6">
    <CardTitle className="flex items-center gap-2 text-md font-bold">
      <Route size={20}/> 1. Parcours (Suivi des sentiers)
    </CardTitle>
          {selectedSource === 'custom' && (
            <Button variant="outline" size="sm" onClick={() => setCustomPoints([])} className="bg-white/10 border-white/20 text-white">
              <Trash2 size={14} className="mr-2"/> Effacer
            </Button>
          )}
        </CardHeader>

    <div className="bg-green-50 p-4 border-b border-green-100 flex flex-col md:flex-row items-center gap-4">
      <Label className="text-green-800 font-semibold min-w-[150px] flex items-center gap-2">
        <Search size={18} /> Utiliser un circuit :
      </Label>

          <Popover open={openMenu} onOpenChange={setOpenMenu}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-white border-green-200 h-11 text-sm">
                <span className="truncate">{currentTitle}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[450px] p-0 z-[1100]" align="start">
              <Command>
                <CommandInput placeholder="Rechercher une trace..." />
                <CommandList className="max-h-[400px]">
                  <CommandEmpty>Aucun résultat.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={() => { setSelectedSource("custom"); setOpenMenu(false); }} className="text-orange-600 font-bold py-3">
                      <Check className={`mr-2 h-4 w-4 ${selectedSource === "custom" ? "opacity-100" : "opacity-0"}`} />
                      ✍️ Nouveau tracé personnalisé
                    </CommandItem>
                  </CommandGroup>

                  <CommandGroup>
                    <Collapsible open={openLocaux} onOpenChange={setOpenLocaux}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-xs font-bold text-blue-600 bg-blue-50/50 border-t uppercase">
                        <div className="flex items-center gap-2"><Library size={14} /> Fichiers Officiels</div>
                        <ChevronRight className={`transition-transform ${openLocaux ? 'rotate-90' : ''}`} size={14} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {Object.entries(sources.locaux).map(([dept, files]) => (
                          <div key={dept} className="mt-1">
                            <div className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase">{dept}</div>
                            {files.map((f) => (
                              <CommandItem key={f.id} onSelect={() => { setSelectedSource(f.id); setOpenMenu(false); }} className="pl-6">
                                <Check className={`mr-2 h-3 w-3 ${selectedSource === f.id ? "opacity-100" : "opacity-0"}`} />
                                <span className="truncate">{f.title}</span>
                              </CommandItem>
                            ))}
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </CommandGroup>

                  <CommandGroup>
                    <Collapsible open={openSupabase} onOpenChange={setOpenSupabase}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-xs font-bold text-slate-500 bg-slate-50 border-t uppercase">
                        <div className="flex items-center gap-2"><Users size={14} /> Tracés Communauté</div>
                        <ChevronRight className={`transition-transform ${openSupabase ? 'rotate-90' : ''}`} size={14} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {sources.supabase?.length > 0 ? (
                          sources.supabase.map((s) => (
                            <CommandItem key={s.id} onSelect={() => { setSelectedSource(s.id); setOpenMenu(false); }} className="pl-6">
                              <Check className={`mr-2 h-4 w-4 ${selectedSource === s.id ? "opacity-100" : "opacity-0"}`} />
                              <div className="flex flex-col">
                                <span className="font-medium">{s.title}</span>
                                <span className="text-[10px] text-slate-400">{s.location} • {s.distance}</span>
                              </div>
                            </CommandItem>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400">Aucun tracé communautaire</div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

<div className="h-[500px] w-full relative z-0">
  {mounted && (
    <MapContainer 
      center={[43.60, 1.44]} 
      zoom={12} 
      className="h-full w-full"
      // CRITIQUE : On attend que la map soit prête avant d'autoriser les enfants
      whenReady={() => {
        console.log("Map 1 is ready");
        setMap1Ready(true);
      }}
    >
      <TileLayer 
        url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" 
        attribution='&copy; OSM' 
      />
      
      {/* On enveloppe TOUT ce qui dépend de Leaflet dans map1Ready.
         Si map1Ready est faux, TileLayer et les autres ne seront pas rendus,
         évitant ainsi l'erreur appendChild.
      */}
      {map1Ready && (
        <>
          <ChangeView data={data} />
          <RoutingControl 
            active={selectedSource === 'custom'} 
            points={customPoints} 
            setPoints={setCustomPoints} 
          />

          {selectedSource !== 'custom' && data && data.length > 0 && data.map((item, idx) => {
            const geo = item.geometry || item.route_geometry; 
            if (!item || !geo) return null;
            const isPoint = geo.type === "Point";

            return (
              <React.Fragment key={`layer-${selectedSource}-${idx}`}>
                <GeoJSON 
                  key={`geojson-${selectedSource}-${idx}-${data.length}`}
                  data={geo} 
                  pointToLayer={() => (null as any)} 
                  style={{ 
                    color: String(selectedSource).toLowerCase().includes('gers') ? '#e11d48' : '#2563eb', 
                    weight: 5, 
                    opacity: 0.8 
                  }} 
                />

                {isPoint && item.center && (
                  <CircleMarker 
                    center={item.center} 
                    radius={6} 
                    pathOptions={{ 
                      fillColor: '#16a34a', 
                      color: '#ffffff',     
                      weight: 2, 
                      fillOpacity: 1 
                    }}
                  >
                    <Popup>
                      <div className="font-bold text-green-800">{item.title}</div>
                      {item.properties?.adresse && (
                        <p className="text-xs text-slate-600">{item.properties.adresse}</p>
                      )}
                    </Popup>
                  </CircleMarker>
                )}
              </React.Fragment>
            );
          })}
        </>
      )}
    </MapContainer>
  )}

  {selectedSource === 'custom' && (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 shadow-2xl border border-green-200 px-6 py-2 rounded-full flex items-center gap-3 animate-bounce">
      <MousePointer2 className="text-green-600" size={18} />
      <span className="text-sm font-bold text-green-800 uppercase tracking-tight">Tracez votre chemin</span>
    </div>
  )}
</div>
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

{/* --- INSERER ICI LA CARTE 2 : TRANSPORT / LOGISTIQUE --- */}
{/* --- CARTE : TRANSPORT / LOGISTIQUE (VERSION UNIQUE ET COMPLÈTE) --- */}
<Card className="overflow-hidden border-blue-100 shadow-xl mt-6">
  <CardHeader className="bg-blue-700 text-white flex flex-row items-center justify-between py-4 px-6">
    <CardTitle className="text-md flex items-center gap-2">
      <Route size={20}/> 2. Itinéraire et Transport (Logistique)
    </CardTitle>
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTransportPoints([])}
      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
    >
      <Trash2 size={14} className="mr-2"/> Effacer la route
    </Button>
  </CardHeader>

  {/* LA CARTE */}
  <div className="h-[400px] w-full relative z-0">
    {mounted && (
      <MapContainer center={[43.60, 1.44]} zoom={11} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" />

        <TransportPolyline
          points={transportPoints}
          setPoints={setTransportPoints}
        />

        {transportPoints.length > 1 && (
          <Polyline
            positions={transportPoints}
            pathOptions={{ color: "#2563eb", weight: 4, dashArray: "5, 10" }}
          />
        )}
      </MapContainer>
    )}

    <div className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded shadow text-xs font-bold text-blue-700 border border-blue-100">
      Points tracés : {transportPoints.length}
    </div>
  </div>

  {/* FORMULAIRE */}
  <CardContent className="p-6 space-y-8">
    
    {/* LIEUX */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="font-bold flex items-center gap-2 text-blue-800">
          <MapPin size={16}/> Lieu de RDV (Aller)
        </Label>
        <Input
          value={meetingPoint}
          onChange={e => setMeetingPoint(e.target.value)}
          placeholder="Ex: Parking métro Ramonville..."
          className="h-11 border-blue-200"
        />
      </div>

      <div className="space-y-2">
        <Label className="font-bold flex items-center gap-2 text-blue-800">
          <MapPin size={16}/> Lieu de Retour (Arrivée)
        </Label>
        <Input
          value={arrivalPoint}
          onChange={e => setArrivalPoint(e.target.value)}
          placeholder="Ex: Idem départ ou lieu de dispersion..."
          className="h-11 border-blue-200"
        />
      </div>
    </div>

    {/* HORAIRES */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
      <div className="space-y-2">
        <Label className="font-bold flex items-center gap-2">
          <Timer size={16}/> Départ
        </Label>
        <Input
          type="time"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          className="h-11 border-blue-100"
        />
      </div>

      <div className="space-y-2">
        <Label className="font-bold flex items-center gap-2 text-slate-400">
          <Timer size={16}/> Fin estimée
        </Label>
        <Input
          type="time"
          value={returnTime}
          onChange={e => setReturnTime(e.target.value)}
          className="h-11 border-blue-100"
        />
      </div>

      <div className="hidden md:flex items-end pb-3">
        <p className="text-[11px] text-slate-400 italic">
          Prévoyez d'arriver 10 min avant l'heure de départ pour le chargement.
        </p>
      </div>
    </div>

    {/* CAPACITÉ */}
    <div className="pt-6 border-t border-slate-100">
      <h4 className="text-sm font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
        <Users size={16}/> Capacité de transport
      </h4>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* BLOC VÉHICULES (BLEU) */}
  <div className="flex items-center gap-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
    <div className="space-y-1 flex-1">
      <Label className="font-bold text-blue-900">Véhicules prévus</Label>
      <p className="text-[11px] text-blue-600">Nombre de voitures déjà disponibles</p>
    </div>
    <Input 
      type="number" 
      min="0"
      value={vehicleCount} 
      onChange={e => setVehicleCount(e.target.value)}
      className="w-20 h-12 text-center font-bold text-lg border-blue-200 bg-white" 
    />
  </div>

  {/* BLOC PLACES (VERT) */}
  <div className="flex items-center gap-6 bg-green-50/50 p-4 rounded-xl border border-green-100">
    <div className="space-y-1 flex-1">
      <Label className="font-bold text-green-900">Places passagers</Label>
      <p className="text-[11px] text-green-600">Total de places pour les sans-voiture</p>
    </div>
    <Input 
      type="number" 
      min="0"
      value={totalSeats} 
      onChange={e => setTotalSeats(e.target.value)}
      className="w-20 h-12 text-center font-bold text-lg border-green-200 bg-white" 
    />
  </div>
</div>

      {/* NOTES COMPLÉMENTAIRES */}
      <div className="mt-6 space-y-2">
        <Label className="font-bold text-slate-600">Précisions sur le transport (optionnel)</Label>
        <Textarea 
          value={transportNotes}
          onChange={e => setTransportNotes(e.target.value)}
          placeholder="Ex: Participation essence 5€, portage de bagages possible..." 
          rows={3}
          className="border-blue-100 focus-visible:ring-blue-500 bg-slate-50/30"
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