"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from "@/lib/supabase";
import { Loader2, Map as MapIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import 'leaflet/dist/leaflet.css';

const MapGeoComponent = dynamic(() => import('../MapGeoComponent'), { 
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-slate-100 italic text-slate-400">Chargement de la carte...</div>
});

function CreateEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 🎯 CORRECTION : On récupère 'location' car c'est ce que vous passez dans l'URL
  const locationParam = searchParams.get('location'); 
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [points, setPoints] = useState<any[]>([]);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");

  useEffect(() => {
    if (locationParam) {
      fetch('/api/visites')
        .then(res => res.json())
        .then(data => {
          // 🎯 CORRECTION : Recherche insensible à la casse pour plus de fiabilité
          const found = data.find((v: any) => 
            v.ville?.toLowerCase() === locationParam.toLowerCase()
          );
          
          if (found) {
            setTitle(`Visite découverte : ${found.ville}`);
            setMeetingPoint(found.ville);
            // Assurez-vous que points est bien un tableau
            setPoints(found.points || []);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Erreur chargement visite:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [locationParam]);

  const handleSave = async (isPublished: boolean) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Connectez-vous."); setSaving(false); return; }

    const { error } = await supabase.from('events').insert([{
      title, 
      description, 
      meeting_point: meetingPoint, 
      organizer_id: user.id, 
      status: isPublished ? 'À venir' : 'Brouillon', 
      type: 'Visite'
    }]);

    if (error) {
        console.error(error);
        alert("Erreur lors de la sauvegarde.");
    } else { 
        alert("Enregistré !"); 
        router.push('/events'); 
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-slate-50 min-h-screen">
      <h1 className="text-4xl font-extrabold text-slate-900">Planifier votre visite</h1>
      
      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-900 text-white">
          <CardTitle className="flex items-center gap-2"><MapIcon size={18}/> Parcours sélectionné</CardTitle>
        </CardHeader>
        <div className="h-[400px]">
           {/* 🎯 Les points sont transmis. Si le MapGeoComponent est bien corrigé, ils s'afficheront */}
           <MapGeoComponent 
             showPoints={false} 
             showRoutes={false} 
             visitePoints={points} 
           />
        </div>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Label>Titre</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} />
          <Label>Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} />
        </CardContent>
      </Card>

      <Button onClick={() => handleSave(true)} disabled={saving}>
        {saving ? <Loader2 className="animate-spin" /> : "Publier la sortie"}
      </Button>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <CreateEventForm />
    </Suspense>
  );
}