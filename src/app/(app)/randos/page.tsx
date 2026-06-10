"use client";

import React, { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <-- AJOUTEZ CETTE LIGNE
import { 
  ArrowLeft, MousePointer2, Trash2, ChevronsUpDown, Compass,
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

// Cherchez le useMemo "currentTitle" vers la ligne 173
const currentTitle = useMemo(() => {
  if (selectedSource === 'custom') return "✍️ Nouveau tracé personnalisé";
  
  // Chercher dans Supabase
  const foundSupa = (sources.supabase || []).find(s => String(s.id) === String(selectedSource));
  if (foundSupa) return foundSupa.title;
  
  // Chercher dans les dossiers locaux
  for (const deptFiles of Object.values(sources.locaux)) {
    const found = deptFiles.find(f => f.id === selectedSource);
    if (found) return found.title;
  }
  return "Sélectionner un itinéraire...";
}, [selectedSource, sources]);

// Cherchez le useEffect vers la ligne 185
useEffect(() => {
  setMounted(true);
  fetch('/api/randos') // On appelle la bonne route
    .then(res => res.json())
    .then(json => {
      // Transformation du tableau [{category: "Gers", items: [...]}] en objet pour le menu
      const formattedLocaux: Record<string, any[]> = {};
      
      if (Array.isArray(json)) {
        json.forEach((catObj: any) => {
          formattedLocaux[catObj.category] = catObj.items.map((item: any) => ({
            id: item.fileName, // Identifiant unique
            title: item.name,
            cat: item.category,
            file: item.fileName
          }));
        });
      }

      setSources(prev => ({
        ...prev,
        locaux: formattedLocaux
      }));
    })
    .catch(err => console.error("Erreur listing dossiers:", err));
}, []);

// Cherchez le useEffect vers la ligne 198
useEffect(() => {
  setData([]); 
  if (!selectedSource || selectedSource === 'custom') return;

  // On cherche les infos de la rando dans notre état sources
  let randoInfo = null;
  for (const files of Object.values(sources.locaux)) {
    const found = files.find(f => f.id === selectedSource);
    if (found) { randoInfo = found; break; }
  }

  // Construction de l'URL pour l'API
  const endpoint = randoInfo 
    ? `/api/randos?cat=${encodeURIComponent(randoInfo.cat)}&file=${encodeURIComponent(randoInfo.file)}`
    : `/api/randos/${selectedSource}`; // Cas Supabase/ID simple

  fetch(endpoint)
    .then(res => res.json())
    .then(resData => {
      // LOGIQUE DE NETTOYAGE : Gère le format Toulouse (geo_shape)
      const geoData = resData.geo_shape ? resData.geo_shape : resData;
      
      // On emballe dans un format que votre composant Map comprend
      const formattedData = {
        geometry: geoData.type === "Feature" ? geoData.geometry : geoData,
        properties: resData.properties || {}
      };

      setData([formattedData]);
    })
    .catch(err => console.error("Erreur Fetch Tracé:", err));
}, [selectedSource, sources.locaux]);

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

      {/* --- SECTION TEXTE DE PRÉSENTATION --- */}
      <section className="space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
          <Compass size={14} /> Explorer le territoire
        </div>
        <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">
          Nos Randonnées <br/><span className="text-blue-600">Sélectionnées</span>
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-600 leading-relaxed">
          <p className="text-lg">
            Bienvenue dans notre catalogue d'itinéraires. Cette page regroupe l'ensemble des parcours 
            disponibles sur l'application, soigneusement documentés pour vous offrir la meilleure 
            expérience en plein air. Que vous cherchiez une promenade familiale ou un défi sportif, 
            explorez notre base de données interactive.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50">
              <Mountain className="text-blue-600 mb-2" size={24} />
              <h3 className="font-bold text-slate-900">Topos précis</h3>
              <p className="text-xs">Profils altimétriques et difficultés vérifiés.</p>
            </div>
            <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50">
              <Route className="text-blue-600 mb-2" size={24} />
              <h3 className="font-bold text-slate-900">Tracés GPX</h3>
              <p className="text-xs">Visualisation directe sur carte IGN/OSM.</p>
            </div>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden border-green-100 shadow-xl">
        <CardHeader className="bg-green-700 text-white flex flex-row items-center justify-between py-4 px-6">
    <CardTitle className="flex items-center gap-2 text-md font-bold">
      <Route size={20}/> Parcours (Suivi des sentiers)
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
      <span className="text-sm font-bold text-green-800 uppercase tracking-tight">Visualisez votre chemin</span>
    </div>
  )}
</div>
      </Card>




{/* --- FOOTER ACTION (DESIGN NOIR & ENVOI SUPABASE) --- */}

    </div> // Fin du formulaire
  );
}