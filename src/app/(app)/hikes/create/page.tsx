"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Map as MapIcon, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function CreateHikePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const hikeData = {
      title: formData.get("title"),
      location: formData.get("location"),
      distance: formData.get("distance"),
      duration: formData.get("duration"),
      difficulty: formData.get("difficulty"),
      elevation_gain: parseInt(formData.get("elevation_gain") as string) || 0,
      description: formData.get("description"),
      type: formData.get("type"),
    };

    try {
      const { error } = await supabase.from("hikes").insert([hikeData]);
      if (error) throw error;
      
      router.push("/hikes");
      router.refresh();
    } catch (error: any) {
      alert("Erreur lors de la création : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hikes"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">Ajouter un circuit</h1>
          <p className="text-muted-foreground">Référencez un nouveau parcours pour la communauté.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Détails du parcours</CardTitle>
            <CardDescription>Ces informations aideront les organisateurs à planifier leurs sorties.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="title">Nom du circuit</Label>
              <Input id="title" name="title" placeholder="Ex: Crêtes de Malamort" required />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Localisation / Massif</Label>
                <Input id="location" name="location" placeholder="Ex: Montagne Noire" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulté</Label>
                <Select name="difficulty" defaultValue="Modéré">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Facile">Facile</SelectItem>
                    <SelectItem value="Modéré">Modéré</SelectItem>
                    <SelectItem value="Difficile">Difficile</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="distance">Distance (km)</Label>
                <Input id="distance" name="distance" placeholder="Ex: 10 km" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Durée estimée</Label>
                <Input id="duration" name="duration" placeholder="Ex: 3h45" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="elevation_gain">Dénivelé positif (m)</Label>
                <Input id="elevation_gain" name="elevation_gain" type="number" placeholder="Ex: 600" required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description et itinéraire</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Détaillez le chemin, les points d'intérêt, les sources d'eau..." 
                rows={5} 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Fond de carte suggéré</Label>
              <Select name="type" defaultValue="topo">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="topo">IGN / Topographique</SelectItem>
                  <SelectItem value="street">OpenStreetMap / Urbain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href="/hikes">Annuler</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapIcon className="mr-2 h-4 w-4" />
            )}
            Enregistrer le circuit
          </Button>
        </div>
      </form>
    </div>
  );
}