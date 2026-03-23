"use client"

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Route, Car, Loader2, CalendarIcon, Check, ChevronsUpDown, 
  RefreshCcw, Mountain, Timer, MapPin, ChevronRight, Library, 
  Users, Image as ImageIcon, Send, ClipboardList, Search
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { mockHikes } from "@/lib/mock-data"; 
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

// --- IMPORTS LEAFLET CRITIQUES ---
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

const MAP_LAYERS = "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png";

function CreateEventForm() {
  const router = useRouter();
  const mapCircuitRef = useRef<HTMLDivElement>(null);
  const mapTransportRef = useRef<HTMLDivElement>(null);
  const mapCircuitInstance = useRef<any>(null);
  const mapTransportInstance = useRef<any>(null);
  const routingControlRef = useRef<any>(null); // Pour nettoyer le routing proprement

const [openMenu, setOpenMenu] = useState(false);
const [openMembers, setOpenMembers] = useState(false);
const [openOfficial, setOpenOfficial] = useState(false); // Officiel ouvert par défaut par ex.

const [isMounted, setIsMounted] = useState(false);

  // ÉTATS
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");

// Lieux pour la Carte 2 (Transport)
const [arrivalPoint, setArrivalPoint] = useState(""); 

// Lieux pour la Carte 1 (Parcours - Optionnel si c'est une boucle, mais utile pour le texte)
const [hikeStartLocation, setHikeStartLocation] = useState("");
const [hikeEndLocation, setHikeEndLocation] = useState("");

const [vehicleCount, setVehicleCount] = useState("0");
const [totalSeats, setTotalSeats] = useState("0");
const [transportNotes, setTransportNotes] = useState("");

  const [date, setDate] = useState<Date>();
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("10");
  const [enrollmentType, setEnrollmentType] = useState("auto");
  const [coOrganizerId, setCoOrganizerId] = useState<string>("none");
  const [image, setImage] = useState<File | null>(null);

  const [difficulty, setDifficulty] = useState("moyen");
  const [elevation, setElevation] = useState("");
  const [distance, setDistance] = useState("");
  const [hikeType, setHikeType] = useState("boucle");
  const [selectedHikeId, setSelectedHikeId] = useState<string>("none");
  const [availableHikes, setAvailableHikes] = useState<any[]>([]); // Pour stocker les vrais circuits de la DB
  const [circuitPoints, setCircuitPoints] = useState<[number, number][]>([]);
  const [transportPoints, setTransportPoints] = useState<[number, number][]>([]);

const handleHikeSelect = async (hikeId: string) => {
  setSelectedHikeId(hikeId);
  const L = (window as any).L;

  // --- 1. NETTOYAGE ---
  const clearMap = () => {
    if (mapCircuitInstance.current) {
      const map = mapCircuitInstance.current;
      if ((map as any).tempLayerGroup) {
        map.removeLayer((map as any).tempLayerGroup);
        (map as any).tempLayerGroup = null;
      }
      if ((map as any).tempPolyline) {
        map.removeLayer((map as any).tempPolyline);
        (map as any).tempPolyline = null;
      }
    }
    if (routingControlRef.current) routingControlRef.current.setWaypoints([]);
  };

  if (hikeId === "none") {
    setCircuitPoints([]);
    setTitle("");
    clearMap();
    return;
  }

  const hike = availableHikes.find((h) => h.id === hikeId);
  if (!hike) return;

  setTitle(hike.title);
  setDistance(hike.distance?.toString() || "");
  setElevation(hike.elevation?.toString() || "");

// --- 2. RÉCUPÉRATION ET MULTI-AFFICHAGE ---
if (hike.source === "official") {
  try {
    const res = await fetch(`/api/rando/${hike.fileName || hike.id}`);
    if (!res.ok) throw new Error("Fichier introuvable");
    const data = await res.json();

clearMap();

    if (mapCircuitInstance.current) {
      const map = mapCircuitInstance.current;
      const layerGroup = L.featureGroup().addTo(map);

      // --- CAS A : FORMAT GEOJSON CLASSIQUE ---
      if (data.features) {
        L.geoJSON(data, {
          style: { color: '#0047AB', weight: 4 },
          onEachFeature: (feature, layer) => {
            if (feature.properties?.nom) layer.bindPopup(feature.properties.nom);
          }
        }).addTo(layerGroup);
      } 
      // --- CAS B : FORMAT TABLEAU (Toulouse Métropole ou Points simples) ---
      else if (Array.isArray(data)) {
        data.forEach((item: any) => {
          // 1. Si l'item contient une géométrie GeoJSON (ex: balades Toulouse)
          if (item.geo_shape) {
            L.geoJSON(item.geo_shape, {
              style: { color: '#0047AB', weight: 4 },
              // Inversion cruciale : GeoJSON est [Lng, Lat], Leaflet veut [Lat, Lng]
              coordsToLatLng: (coords) => new L.LatLng(coords[1], coords[0])
            }).bindPopup(`<b>${item.nom || "Circuit"}</b>`).addTo(layerGroup);
          } 
          
          // 2. Si l'item a un point de départ spécifique (geo_point_2d)
          if (item.geo_point_2d) {
            const lat = Array.isArray(item.geo_point_2d) ? item.geo_point_2d[0] : item.geo_point_2d.lat;
            const lng = Array.isArray(item.geo_point_2d) ? item.geo_point_2d[1] : item.geo_point_2d.lon;
            L.marker([lat, lng]).bindPopup(`<b>Départ : ${item.nom}</b>`).addTo(layerGroup);
          }
          
          // 3. Cas par défaut : Coordonnées simples (lat/lng)
          else {
            const lat = item.lat || item.y || item.latitude;
            const lng = item.lng || item.x || item.longitude;
            if (lat && lng) {
              L.marker([lat, lng])
                .bindPopup(`<b>${item.nom || item.title || "Point de repère"}</b>`)
                .addTo(layerGroup);
            }
          }
        });
      }

      // Ajustement automatique de la vue pour centrer le tracé
      if (layerGroup.getLayers().length > 0) {
        map.fitBounds(layerGroup.getBounds(), { padding: [20, 20] });
      }

      (map as any).tempLayerGroup = layerGroup;
    

      setTimeout(() => {
        map.invalidateSize();
        if (layerGroup.getBounds().isValid()) {
          map.fitBounds(layerGroup.getBounds(), { padding: [40, 40] });
        }
      }, 100);
    }
  } catch (e) {
    console.error("Erreur chargement données:", e);
  }
} else {
    // Cas classique Supabase (un seul tracé)
    const coords = hike.route_geometry || [];
    if (coords.length > 0 && mapCircuitInstance.current) {
      clearMap();
      const poly = L.polyline(coords, { color: '#0047AB', weight: 5 }).addTo(mapCircuitInstance.current);
      (mapCircuitInstance.current as any).tempPolyline = poly;
      mapCircuitInstance.current.fitBounds(poly.getBounds());
    }
  }
};


// AJOUTE CE BLOC :
  useEffect(() => {
    setIsMounted(true);
  }, []);

// 1. CHARGEMENT UNIFIÉ DU CATALOGUE (SUPABASE + API LOCALE)
useEffect(() => {
  const loadCatalogues = async () => {
    try {
      // On lance les deux requêtes en parallèle pour plus de rapidité
      const [supabaseRes, localRes] = await Promise.all([
        supabase
          .from('hikes')
          .select('id, title, distance, elevation, difficulty, route_geometry')
          .order('title', { ascending: true }),
        fetch('/api/rando/list')
      ]);

      if (supabaseRes.error) throw supabaseRes.error;

      // Récupération des données locales (fichiers JSON/GeoJSON)
      let localHikes = [];
      if (localRes.ok) {
        localHikes = await localRes.json();
      }

      // Fusion avec marquage de la source pour le traitement futur
      const dbHikes = supabaseRes.data || [];

      // ON CRÉE LA VARIABLE ICI POUR POUVOIR L'AFFICHER
      const combined = [
        ...dbHikes.map(h => ({ ...h, source: 'community' })), 
        ...localHikes.map((h: any) => ({ ...h, source: 'official' }))
      ];

      // MAINTENANT ÇA FONCTIONNE
      console.log("Catalogue combiné (total) :", combined.length);
      console.log("Liste des randos chargées :", combined);
      
      setAvailableHikes([
        ...dbHikes.map(h => ({ ...h, source: 'community' })), // Randos Supabase
        ...localHikes.map((h: any) => ({ ...h, source: 'official' })) // Randos locales (GR, etc.)
      ]);

    } catch (err) {
      console.error("Erreur lors de l'unification du catalogue:", err);
    }
  };

  loadCatalogues();
}, []);

// 2. INITIALISATION DES CARTES (CIRCUIT & TRANSPORT)
useEffect(() => {
  const initMaps = async () => {
    // Import dynamique de Leaflet pour éviter les erreurs SSR
    const L = (await import('leaflet')).default;
    // @ts-ignore
    await import('leaflet-routing-machine');

    // Fix pour les icônes de marqueurs par défaut
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // --- CARTE 1 : CIRCUIT (Mode Routing) ---
    if (!mapCircuitInstance.current && mapCircuitRef.current) {
      const map = L.map(mapCircuitRef.current).setView([43.60, 1.44], 10);
      L.tileLayer(MAP_LAYERS).addTo(map);
      mapCircuitInstance.current = map;

      // Configuration du moteur de routing
      // @ts-ignore
      const rc = L.Routing.control({
        waypoints: [],
        routeWhileDragging: false,
        addWaypoints: true,
        show: false,
        lineOptions: { 
          styles: [{ color: '#16a34a', weight: 5, opacity: 0.8 }] 
        }
      }).addTo(map);

      routingControlRef.current = rc;

      // Interaction : Ajout de points si aucune rando catalogue n'est sélectionnée
      map.on('click', (e: any) => {
        if (selectedHikeId === 'none') {
          const currentWps = rc.getWaypoints()
            .filter((wp: any) => wp.latLng)
            .map((wp: any) => wp.latLng);
          rc.setWaypoints([...currentWps, e.latlng]);
        }
      });

      // Capture de l'itinéraire tracé
      rc.on('routesfound', (e: any) => {
        const fullPath = e.routes[0].coordinates.map((c: any) => [c.lat, c.lng]);
        setCircuitPoints(fullPath);
      });
    }

    // --- CARTE 2 : TRANSPORT (Ligne droite / Logistique) ---
    if (!mapTransportInstance.current && mapTransportRef.current) {
      const mapT = L.map(mapTransportRef.current).setView([43.60, 1.44], 11);
      L.tileLayer(MAP_LAYERS).addTo(mapT);
      mapTransportInstance.current = mapT;

      const poly = L.polyline([], { color: '#2563eb', weight: 4 }).addTo(mapT);

      mapT.on('click', (e: any) => {
        const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
        setTransportPoints(prev => {
          const updated = [...prev, newPoint];
          poly.setLatLngs(updated);
          return updated;
        });
      });
    }
  };

// Appeler la fonction d'initialisation
    initMaps();

    // NETTOYAGE (Cleanup) : On ne le met qu'UNE SEULE FOIS à la fin du useEffect
    return () => {
      if (routingControlRef.current) {
        try {
          routingControlRef.current.remove();
        } catch (e) {
          console.log("Routing déjà supprimé");
        }
      }
      if (mapCircuitInstance.current) {
        mapCircuitInstance.current.remove();
        mapCircuitInstance.current = null;
      }
      if (mapTransportInstance.current) {
        mapTransportInstance.current.remove();
        mapTransportInstance.current = null;
      }
    };
  }, [selectedHikeId]); // FIN UNIQUE DU USEEFFECT

const handleSubmit = async (isPublished: boolean) => {
  setLoading(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Veuillez vous connecter.");

    let finalHikeId = selectedHikeId === 'none' ? null : selectedHikeId;
    let imageUrl = null;

    // --- ÉTAPE 1 : CLOUDINARY (Déjà OK) ---
    if (image) { /* ... ton code existant ... */ }

    // --- ÉTAPE 2 : SI NOUVEAU TRACÉ -> CRÉER D'ABORD DANS 'HIKES' ---
    if (selectedHikeId === 'none' && circuitPoints.length > 0) {
      const { data: newHike, error: hikeError } = await supabase
        .from('hikes')
        .insert({
          title: title, // Le titre de la sortie devient le titre du topo
          description: description,
          distance: parseFloat(distance) || 0,
          elevation: parseInt(elevation) || 0,
          difficulty: difficulty,
          route_geometry: circuitPoints, // On sauve le tracé dans le catalogue !
          organizer_id: user.id, // Pour savoir qui a créé ce topo
          type: 'topo'
        })
        .select()
        .single();

      if (hikeError) throw new Error("Erreur lors de la création du topo : " + hikeError.message);
      finalHikeId = newHike.id; // On récupère l'ID du topo tout neuf
    }

    // --- ÉTAPE 3 : CRÉER L'ÉVÉNEMENT ---
    const { error: eventError } = await supabase.from('events').insert({
      title, 
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
      
      // LOGIQUE CLÉ :
      hike_id: finalHikeId, // On lie soit au catalogue existant, soit au nouveau topo créé au dessus
      custom_circuit: null, // On peut mettre NULL car le tracé est maintenant dans 'hikes'
      
      transport_steps: transportPoints,
      image_url: imageUrl,
      status: isPublished ? 'À venir' : 'Brouillon'
    });

    if (eventError) throw eventError;
    router.push('/events');
  } catch (err: any) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

if (!isMounted) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10 text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10 w-full pb-20">
      
      {/* PHOTO COUVERTURE */}
      <Card className="relative overflow-hidden border-dashed border-2 flex flex-col items-center justify-center p-0 min-h-[200px] bg-slate-50/50 cursor-pointer">
          <input type="file" id="photo-upload" hidden onChange={(e) => setImage(e.target.files?.[0] || null)} accept="image/*" />
          <label htmlFor="photo-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full p-8">
            {image ? (
              <div className="text-center">
                <p className="text-sm font-bold text-green-600 mb-2">✅ Image sélectionnée :</p>
                <img src={URL.createObjectURL(image)} alt="Preview" className="mt-4 max-h-32 rounded-lg shadow-sm mx-auto" />
              </div>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-500">Ajouter une photo de couverture</span>
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

{/* CARTE 1 : LE PARCOURS */}
<Card className="overflow-hidden border-green-100">
  <CardHeader className="bg-green-700 text-white flex flex-row items-center justify-between py-4 px-6">
    <CardTitle className="flex items-center gap-2 text-md font-bold">
      <Route size={20}/> 1. Parcours (Suivi des sentiers)
    </CardTitle>

    {selectedHikeId === 'none' && (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setCircuitPoints([]);
          if (routingControlRef.current) routingControlRef.current.setWaypoints([]);
        }}
        className="bg-white/10 text-white hover:bg-white/20"
      >
        <RefreshCcw size={14} className="mr-2"/> Effacer le tracé
      </Button>
    )}
  </CardHeader>


{/* SELECT CIRCUIT AVEC ACCORDÉONS */}
<div className="bg-green-50 p-4 border-b border-green-100 flex flex-col md:flex-row items-center gap-4">
  <Label className="text-green-800 font-semibold min-w-[150px] flex items-center gap-2">
    <Search size={18} /> Utiliser un circuit :
  </Label>

  <Popover open={openMenu} onOpenChange={setOpenMenu}>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        className="w-full justify-between bg-white border-green-200 h-11"
      >
        {selectedHikeId === "none" ? "✍️ Nouveau tracé personnalisé" : 
         availableHikes.find(h => h.id === selectedHikeId)?.title || "Sélectionner un itinéraire..."}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    
    <PopoverContent className="w-[450px] p-0 z-[1000]" align="start">
      <Command>
        <CommandInput placeholder="Rechercher un circuit (ex: D31, Bourian...)" />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>Aucun circuit trouvé.</CommandEmpty>
          
          {/* OPTION : NOUVEAU TRACÉ */}
          <CommandGroup>
            <CommandItem
              value="none"
              onSelect={() => {
                handleHikeSelect("none");
                setOpenMenu(false);
              }}
              className="font-bold text-orange-600 cursor-pointer"
            >
              <Check className={`mr-2 h-4 w-4 ${selectedHikeId === "none" ? "opacity-100" : "opacity-0"}`} />
              ✍️ Nouveau tracé personnalisé
            </CommandItem>
          </CommandGroup>

          {/* ACCORDÉON : TRACÉS MEMBRES */}
<CommandGroup>
  <Collapsible open={openMembers} onOpenChange={setOpenMembers}>
    
    <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border-t">
      <div className="flex items-center gap-2">
        <Users size={14} /> TRACÉS DE LA COMMUNAUTÉ
      </div>
      <ChevronRight className={`transition-transform duration-200 ${openMembers ? 'rotate-90' : ''}`} size={14} />
    </CollapsibleTrigger>

    <CollapsibleContent>
      {availableHikes
        .filter(h => h.source !== 'official')
        .map((hike) => (
          <CommandItem
            key={hike.id}
            value={hike.id} // ✅ IMPORTANT
            onSelect={() => {
              handleHikeSelect(hike.id);
              setOpenMenu(false);
            }}
            className="pl-8 cursor-pointer"
          >
            <Check className={`mr-2 h-4 w-4 ${selectedHikeId === hike.id ? "opacity-100" : "opacity-0"}`} />
            <div className="flex flex-col">
              <span className="font-medium">{hike.title}</span>
              {hike.distance && <span className="text-[10px] text-slate-400">{hike.distance}km</span>}
            </div>
          </CommandItem>
      ))}
    </CollapsibleContent>

  </Collapsible>
</CommandGroup>

          {/* ACCORDÉON : OFFICIELS (circuits recommandés) */}
<CommandGroup>
  <Collapsible open={openOfficial} onOpenChange={setOpenOfficial}>
    
    <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-xs font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-50 border-t">
      <div className="flex items-center gap-2">
        <Library size={14} /> CIRCUITS OFFICIELS & ZONES (GeoJSON)
      </div>
      <ChevronRight className={`transition-transform duration-200 ${openOfficial ? 'rotate-90' : ''}`} size={14} />
    </CollapsibleTrigger>

    <CollapsibleContent>
      {availableHikes
        .filter(h => h.source === 'official')
        .map((hike) => (
          <CommandItem
            key={hike.id}
            value={hike.id} // ✅ IMPORTANT
            onSelect={() => {
              handleHikeSelect(hike.id);
              setOpenMenu(false);
            }}
            className="pl-8 text-blue-900 cursor-pointer hover:bg-blue-50"
          >
            <Check className={`mr-2 h-4 w-4 ${selectedHikeId === hike.id ? "opacity-100" : "opacity-0"}`} />
            <div className="flex items-center gap-2">
              {hike.format === 'geojson' 
                ? <Route size={14} className="text-blue-500"/> 
                : <MapPin size={14} className="text-orange-500"/>}
              {hike.title}
            </div>
          </CommandItem>
      ))}
    </CollapsibleContent>

  </Collapsible>
</CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>


  {/* CARTE LEAFLET */}
  <div
    ref={mapCircuitRef}
    className="h-[350px] w-full bg-slate-100 relative z-10"
  />


  {/* INFOS RANDONNÉE */}
  <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">

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

    <div className="space-y-1">
      <Label className="text-xs font-bold text-slate-500">Difficulté</Label>

      <Select value={difficulty} onValueChange={setDifficulty}>
        <SelectTrigger className="h-10">
          <SelectValue />
        </SelectTrigger>

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
        <SelectTrigger className="h-10">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="boucle">Boucle</SelectItem>
          <SelectItem value="aller-retour">Aller-Retour</SelectItem>
        </SelectContent>
      </Select>

    </div>

  </CardContent>

</Card>

{/* CARTE 2 : LOGISTIQUE */}
<Card className="overflow-hidden border-blue-100">
  <CardHeader className="bg-blue-700 text-white py-4 px-6">
    <CardTitle className="flex items-center gap-2 text-md font-bold">
      <Car size={20}/> 2. Rendez-vous et Transport
    </CardTitle>
  </CardHeader>

  <div ref={mapTransportRef} className="h-[300px] w-full bg-slate-100 relative z-10" />

  <CardContent className="p-6 space-y-8">
    
    {/* 1. LES LIEUX (ALLER / RETOUR) */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="font-bold flex items-center gap-2 text-blue-800">
          <MapPin size={16} className="text-blue-500"/> Lieu de RDV (Aller)
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
          <MapPin size={16} className="text-blue-500"/> Lieu de Retour (Arrivée)
        </Label>
        <Input 
          value={arrivalPoint} 
          onChange={e => setArrivalPoint(e.target.value)} 
          placeholder="Ex: Idem départ ou lieu de dispersion..." 
          className="h-11 border-blue-200" 
        />
      </div>
    </div>

    {/* 2. LES HORAIRES */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
      <div className="space-y-2">
        <Label className="font-bold flex items-center gap-2">
          <Timer size={16} className="text-slate-400"/> Départ
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
        <p className="text-[11px] text-slate-400 italic leading-tight">
          Prévoyez d'arriver 10 min avant l'heure de départ pour le chargement.
        </p>
      </div>
    </div>

    {/* 3. LOGISTIQUE VÉHICULES ET PLACES */}
    <div className="pt-6 border-t border-slate-100">
      <h4 className="text-sm font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
        <Users size={16} /> Capacité de transport
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* FOOTER ACTION */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-2xl shadow-2xl mt-10">
        <div className="space-y-1">
          <h4 className="text-xl font-black uppercase text-green-400">Prêt à publier ?</h4>
          <p className="text-slate-300 text-sm font-medium">Visible instantanément par la communauté.</p>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center">
          <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={() => router.back()}>Abandonner</Button>
          <Button variant="outline" className="border-slate-500 text-slate-900" onClick={() => handleSubmit(false)}>Brouillon</Button>
          <Button className="bg-green-500 hover:bg-green-400 text-white px-10 font-extrabold h-12" onClick={() => handleSubmit(true)} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <div className="flex items-center"><Send className="mr-2 h-5 w-5" /> Publier</div>}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Proposer une nouvelle sortie</h1>
      </div>
      <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-green-600" /></div>}>
        <CreateEventForm />
      </Suspense>
    </div>
  );
}