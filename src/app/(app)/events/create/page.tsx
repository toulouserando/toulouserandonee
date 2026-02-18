"use client"

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Route, Car, Loader2, CalendarIcon, 
  RefreshCcw, Mountain, Timer, MapPin,
  Users, Image as ImageIcon, Send, ClipboardList, Search
} from "lucide-react";
import { format, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { mockHikes } from "@/lib/mock-data"; 
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import "leaflet/dist/leaflet.css";

const MAP_LAYERS = "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png";

function CreateEventForm() {
  const router = useRouter();
  const mapCircuitRef = useRef<HTMLDivElement>(null);
  const mapTransportRef = useRef<HTMLDivElement>(null);
  const mapCircuitInstance = useRef<any>(null);
  const mapTransportInstance = useRef<any>(null);

  // ÉTATS
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
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
  const [circuitPoints, setCircuitPoints] = useState<[number, number][]>([]);
  const [transportPoints, setTransportPoints] = useState<[number, number][]>([]);

  const handleHikeSelect = (hikeId: string) => {
    setSelectedHikeId(hikeId);
    if (hikeId === "none") {
      setCircuitPoints([]);
      return;
    }
    const hike = mockHikes.find(h => h.id === hikeId);
    if (hike) {
      setTitle(hike.title);
      setDistance(hike.distance.toString());
      setElevation(hike.elevation.toString());
      setDifficulty(hike.difficulty.toLowerCase());
      if (hike.path) setCircuitPoints(hike.path); 
    }
  };

  useEffect(() => {
    const initMaps = async () => {
      const L = (await import('leaflet')).default;
      
      // Correction icônes
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      if (!mapCircuitInstance.current && mapCircuitRef.current) {
        mapCircuitInstance.current = L.map(mapCircuitRef.current).setView([43.60, 1.44], 10);
        L.tileLayer(MAP_LAYERS).addTo(mapCircuitInstance.current);
        mapCircuitInstance.current.on('click', (e: any) => {
            if (selectedHikeId === 'none') setCircuitPoints(pts => [...pts, [e.latlng.lat, e.latlng.lng]]);
        });
      }

      if (!mapTransportInstance.current && mapTransportRef.current) {
        mapTransportInstance.current = L.map(mapTransportRef.current).setView([43.60, 1.44], 11);
        L.tileLayer(MAP_LAYERS).addTo(mapTransportInstance.current);
        mapTransportInstance.current.on('click', (e: any) => setTransportPoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]));
      }
    };
    initMaps();

    return () => {
        if (mapCircuitInstance.current) mapCircuitInstance.current.remove();
        if (mapTransportInstance.current) mapTransportInstance.current.remove();
        mapCircuitInstance.current = null;
        mapTransportInstance.current = null;
    };
  }, [selectedHikeId]);

  const handleSubmit = async (isPublished: boolean) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Veuillez vous connecter.");
      
// Trouve cette partie dans ton handleSubmit
const { error } = await supabase.from('events').insert({
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
  elevation: parseInt(elevation), 
  distance: parseFloat(distance),
  hike_type: hikeType, 
  organizer_id: user.id,
  co_organizer_id: coOrganizerId === "none" ? null : coOrganizerId,
  hike_id: selectedHikeId === 'none' ? null : selectedHikeId,
  custom_circuit: selectedHikeId === 'none' ? circuitPoints : null,
  transport_steps: transportPoints,
  // SUPPRIME CETTE LIGNE : is_published: isPublished, 
  status: isPublished ? 'À venir' : 'Brouillon' // On utilise status à la place
});
      if (error) throw error;
      router.push('/events');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 w-full pb-20">
      
      {/* PHOTO */}
      <Card className="border-dashed border-2 flex flex-col items-center justify-center p-8 bg-slate-50/50 cursor-pointer">
          <input type="file" id="photo-upload" hidden onChange={(e) => setImage(e.target.files?.[0] || null)} accept="image/*" />
          <label htmlFor="photo-upload" className="flex flex-col items-center cursor-pointer w-full">
            <ImageIcon className="h-8 w-8 text-slate-400 mb-2" />
            <span className="text-sm font-medium text-slate-500">{image ? image.name : "Cliquez pour ajouter une photo de couverture"}</span>
          </label>
      </Card>

      {/* DÉTAILS */}
      <Card>
        <CardHeader className="border-b bg-slate-50/30">
          <CardTitle className="flex items-center gap-2 text-lg font-bold"><ClipboardList className="text-primary w-5 h-5"/> Détails de la rando</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="event-title">Titre de l'évènement</Label>
            <Input id="event-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Sortie conviviale au Pic du Midi" className="h-11" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea id="event-desc" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Parlez-nous de la sortie..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-reco" className="text-slate-500">Recommandations</Label>
              <Textarea id="event-reco" value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={4} placeholder="Crampons, pique-nique..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PARCOURS */}
      <Card className="overflow-hidden border-green-100">
        <CardHeader className="bg-green-700 text-white flex flex-row items-center justify-between py-4 px-6">
          <CardTitle className="flex items-center gap-2 text-md font-bold"><Route size={20}/> 1. Parcours et Tracé</CardTitle>
          {selectedHikeId === 'none' && (
            <Button variant="outline" size="sm" onClick={() => setCircuitPoints([])} className="bg-white/10 text-white hover:bg-white/20">
              <RefreshCcw size={14} className="mr-2"/> Effacer
            </Button>
          )}
        </CardHeader>

        <div className="bg-green-50 p-4 border-b border-green-100 flex flex-col md:flex-row items-center gap-4">
          <Label className="text-green-800 font-semibold min-w-[150px] flex items-center gap-2">
            <Search size={18}/> Partir d'un circuit :
          </Label>
          <Select value={selectedHikeId} onValueChange={handleHikeSelect}>
            <SelectTrigger className="bg-white border-green-200 flex-1">
              <SelectValue placeholder="Choisir un circuit existant..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="font-bold text-green-700">✍️ Nouveau tracé personnalisé</SelectItem>
              {mockHikes.map(h => (
                <SelectItem key={h.id} value={h.id}>🥾 {h.title} ({h.distance}km)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div ref={mapCircuitRef} className="h-[400px] w-full bg-slate-100 relative z-10" />
        
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase text-slate-500">Dénivelé (m)</Label>
              <div className="relative"><Mountain className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input type="number" value={elevation} onChange={e => setElevation(e.target.value)} className="pl-10 h-10" /></div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase text-slate-500">Distance (km)</Label>
              <div className="relative"><Route className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input type="number" value={distance} onChange={e => setDistance(e.target.value)} className="pl-10 h-10" /></div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase text-slate-500">Difficulté</Label>
              <Select value={difficulty} onValueChange={setDifficulty}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="facile">Facile</SelectItem><SelectItem value="moyen">Moyen</SelectItem><SelectItem value="difficile">Difficile</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase text-slate-500">Type</Label>
              <Select value={hikeType} onValueChange={setHikeType}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="boucle">Boucle</SelectItem><SelectItem value="aller-retour">Aller-Retour</SelectItem></SelectContent>
              </Select>
            </div>
        </CardContent>
      </Card>

      {/* LOGISTIQUE */}
      <Card className="overflow-hidden border-blue-100">
        <CardHeader className="bg-blue-700 text-white py-4 px-6">
          <CardTitle className="flex items-center gap-2 text-md font-bold"><Car size={20}/> 2. Logistique et Rdv</CardTitle>
        </CardHeader>
        <div ref={mapTransportRef} className="h-[300px] w-full bg-slate-100 relative z-10" />
        <CardContent className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2"><Label className="font-bold flex items-center gap-2"><MapPin size={16} className="text-blue-600"/> Lieu de rendez-vous</Label>
                <Input value={meetingPoint} onChange={e => setMeetingPoint(e.target.value)} placeholder="Parking ou adresse..." className="h-11 border-blue-200" />
              </div>
              <div className="space-y-2"><Label className="font-bold">Départ</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-11 border-blue-200" /></div>
              <div className="space-y-2"><Label className="font-bold text-slate-400">Fin estimée</Label><Input type="time" value={returnTime} onChange={e => setReturnTime(e.target.value)} className="h-11 border-blue-200" /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
              <div className="space-y-2"><Label className="font-semibold text-sm">Date</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start h-11"><CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "P", {locale: fr}) : "Choisir"}</Button></PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} locale={fr} /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2"><Label className="font-semibold text-sm text-red-600">Clôture</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start h-11"><Timer className="mr-2 h-4 w-4 text-red-500" />{registrationDeadline ? format(registrationDeadline, "P", {locale: fr}) : "Date limite"}</Button></PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={registrationDeadline} onSelect={setRegistrationDeadline} locale={fr} /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2"><Label className="font-semibold text-sm">Max participants</Label><Input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} className="h-11" /></div>
              <div className="space-y-2"><Label className="font-semibold text-sm">Inscription</Label>
                <Select value={enrollmentType} onValueChange={setEnrollmentType}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="auto">Automatique</SelectItem><SelectItem value="manual">Sur validation</SelectItem></SelectContent>
                </Select>
              </div>
          </div>
        </CardContent>
      </Card>

      {/* SOCIAL */}
      <Card className="bg-slate-50 border-none">
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            <div className="space-y-2">
                <Label className="flex items-center gap-2"><Users size={18}/> Co-organisateur (optionnel)</Label>
                <Select value={coOrganizerId} onValueChange={setCoOrganizerId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Chercher un membre..." /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Aucun</SelectItem><SelectItem value="u1">Thomas Durand</SelectItem><SelectItem value="u2">Julie Lefebvre</SelectItem></SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Envoyer une invitation directe</Label>
                <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input placeholder="Pseudo..." className="bg-white pl-10 h-11" /></div>
            </div>
        </CardContent>
      </Card>

{/* FOOTER */}
<div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-2xl shadow-2xl mt-10">
  <div className="space-y-1">
    <h4 className="text-xl font-black uppercase text-green-400">Prêt à publier ?</h4>
    <p className="text-slate-300 text-sm font-medium">Visible instantanément sur la carte des départs.</p>
  </div>

  <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center">
    <Button 
      variant="ghost" 
      className="text-slate-300 hover:text-white hover:bg-slate-800" 
      onClick={() => router.back()}
    >
      Abandonner
    </Button>

    <Button 
      variant="outline" 
      className="border-slate-500 bg-transparent text-white hover:bg-white hover:text-slate-900 transition-colors" 
      onClick={() => handleSubmit(false)}
    >
      Brouillon
    </Button>

    <Button 
      className="bg-green-500 hover:bg-green-400 text-white px-10 font-extrabold h-12 shadow-lg" 
      onClick={() => handleSubmit(true)} 
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <div className="flex items-center">
          <Send className="mr-2 h-5 w-5" /> 
          Publier
        </div>
      )}
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
        <p className="text-slate-500 mt-2">Partagez votre passion avec la communauté.</p>
      </div>
      <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-green-600" /></div>}>
        <CreateEventForm />
      </Suspense>
    </div>
  );
}