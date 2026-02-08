"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useEffect, useState, Suspense } from "react"; // Ajout de Suspense
import { format } from "date-fns";
import { mockHikes } from "@/lib/mock-data";
import { useSearchParams } from "next/navigation";

// 1. On crée un composant interne pour le formulaire
function CreateEventForm() {
  const [date, setDate] = useState<Date>();
  const searchParams = useSearchParams();
  const [selectedHikeId, setSelectedHikeId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const hikeId = searchParams.get('hikeId');
    if (hikeId) {
      setSelectedHikeId(hikeId);
    }
  }, [searchParams]);

  const selectedHike = mockHikes.find(h => h.id === selectedHikeId);

  return (
    <form className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Informations principales</CardTitle>
          <CardDescription>Donnez les détails essentiels de votre randonnée.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="title">Titre de l'événement</Label>
            <Input id="title" placeholder="Ex: Randonnée au lever du soleil au Pic du Gar" defaultValue={selectedHike ? `Sortie sur le circuit "${selectedHike.title}"` : ""}/>
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
            <Select defaultValue={selectedHike ? (selectedHike.type === "Open Topo Maps" ? "topo" : "street") : "topo"}>
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
                  {date ? format(date, "PPP") : <span>Choisissez une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Heure de départ</Label>
              <Input id="startTime" type="time" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="endTime">Heure de retour (facultatif)</Label>
              <Input id="endTime" type="time" />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="meetingPoint">Lieu de rendez-vous</Label>
            <Input id="meetingPoint" placeholder="Ex: Parking du supermarché, devant l'entrée" />
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
            <Textarea id="description" placeholder="Décrivez votre sortie, le niveau attendu, l'ambiance, etc." rows={5} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Nombre max. de participants</Label>
            <Input id="maxParticipants" type="number" placeholder="10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="enrollmentType">Mode d'inscription</Label>
            <Select defaultValue="auto">
              <SelectTrigger id="enrollmentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatique</SelectItem>
                <SelectItem value="manual">Manuelle (vous validez chaque participant)</SelectItem>
                <SelectItem value="waitlist">Liste d'attente activée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Annuler</Button>
        <Button>Créer l'événement</Button>
      </div>
    </form>
  );
}

// 2. Le composant principal exporté enveloppe le tout dans Suspense
export default function CreateEventPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Créer une nouvelle sortie</h1>
        <p className="text-muted-foreground">Planifiez votre prochaine aventure et invitez la communauté.</p>
      </div>
      
      <Suspense fallback={<div className="text-center py-10">Chargement du formulaire...</div>}>
        <CreateEventForm />
      </Suspense>
    </div>
  );
}