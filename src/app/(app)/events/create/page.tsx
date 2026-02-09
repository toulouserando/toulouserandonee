"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useEffect, useState, Suspense } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale"; // Pour le calendrier en français
import { mockHikes } from "@/lib/mock-data";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CreateEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States du formulaire
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [title, setTitle] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("10");
  const [enrollmentType, setEnrollmentType] = useState("auto");
  const [selectedHikeId, setSelectedHikeId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const hikeId = searchParams.get('hikeId');
    if (hikeId) {
      setSelectedHikeId(hikeId);
      const hike = mockHikes.find(h => h.id === hikeId);
      if (hike) setTitle(`Sortie sur le circuit "${hike.title}"`);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Vous devez être connecté pour créer un événement.");

      if (!date || !startTime) throw new Error("La date et l'heure sont obligatoires.");

      // Fusion date et heure pour le format ISO
      const eventDateTime = new Date(date);
      const [hours, minutes] = startTime.split(':');
      eventDateTime.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await supabase.from('events').insert({
        title,
        date: eventDateTime.toISOString(),
        meeting_point: meetingPoint,
        description,
        max_participants: parseInt(maxParticipants),
        enrollment_type: enrollmentType,
        organizer_id: user.id,
        hike_id: selectedHikeId === 'none' ? null : selectedHikeId,
        status: 'À venir'
      });

      if (error) throw error;

      router.push('/events');
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Informations principales</CardTitle>
          <CardDescription>Donnez les détails essentiels de votre randonnée.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="title">Titre de l'événement</Label>
            <Input 
              id="title" 
              placeholder="Ex: Randonnée au lever du soleil" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Circuit de randonnée (facultatif)</Label>
            <Select value={selectedHikeId} onValueChange={setSelectedHikeId}>
              <SelectTrigger>
                <SelectValue placeholder="Partir d'un circuit existant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Créer manuellement</SelectItem>
                {mockHikes.map(hike => (
                  <SelectItem key={hike.id} value={hike.id}>{hike.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
             <Label>Carte de base</Label>
            <Select defaultValue="topo">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="topo">Open Topo Maps</SelectItem>
                <SelectItem value="street">Open Data Street</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date et lieu</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Date de la sortie</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: fr }) : <span>Choisissez une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Heure de départ</Label>
              <Input 
                id="startTime" 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="endTime">Retour (facultatif)</Label>
              <Input id="endTime" type="time" />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="meetingPoint">Lieu de rendez-vous</Label>
            <Input 
              id="meetingPoint" 
              placeholder="Ex: Parking du supermarché..." 
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Détails supplémentaires</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Décrivez votre sortie..." 
              rows={5} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Nombre max. de participants</Label>
            <Input 
              id="maxParticipants" 
              type="number" 
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="enrollmentType">Mode d'inscription</Label>
            <Select value={enrollmentType} onValueChange={setEnrollmentType}>
              <SelectTrigger id="enrollmentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatique</SelectItem>
                <SelectItem value="manual">Manuelle</SelectItem>
                <SelectItem value="waitlist">Liste d'attente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer l'événement
        </Button>
      </div>
    </form>
  );
}

export default function CreateEventPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Créer une nouvelle sortie</h1>
        <p className="text-muted-foreground">Planifiez votre prochaine aventure.</p>
      </div>
      
      <Suspense fallback={<div className="text-center py-10 text-muted-foreground">Chargement du formulaire...</div>}>
        <CreateEventForm />
      </Suspense>
    </div>
  );
}