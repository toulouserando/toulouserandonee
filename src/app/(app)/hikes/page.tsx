"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, TrendingUp, Plus, Loader2, Compass } from "lucide-react"; // 🎯 Ajout de Compass
import Link from "next/link";

export default function HikesListPage() {
  const [hikes, setHikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHikes() {
      const { data, error } = await supabase
        .from('hikes')
        .select('*')
        .order('title');
      
      if (!error) setHikes(data || []);
      setLoading(false);
    }
    fetchHikes();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline">Circuits de randonnée</h1>
          <p className="text-muted-foreground">Explorez les parcours vérifiés par la communauté.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hikes.map((hike) => (
          <Card key={hike.id} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  {/* 🎯 Rendre le titre cliquable pour aller voir la fiche */}
                  <Link href={`/hikes/${hike.id}`} className="hover:text-primary transition-colors">
                    <CardTitle className="text-xl line-clamp-2">{hike.title}</CardTitle>
                  </Link>
                  <Badge variant="outline" className="shrink-0">{hike.difficulty}</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" /> {hike.location}
                </div>
                <div className="flex justify-between border-t pt-4">
                  <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {hike.duration}</div>
                  <div className="flex items-center gap-1"><TrendingUp className="h-4 w-4" /> {hike.distance}</div>
                </div>
              </CardContent>
            </div>

            {/* 🎯 Actions modifiées : 2 boutons côte à côte */}
            <CardFooter className="bg-muted/50 gap-2 pt-4 grid grid-cols-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/hikes/${hike.id}`}>
                  <Compass className="mr-2 h-4 w-4" /> Voir le parcours
                </Link>
              </Button>

              <Button asChild variant="default" size="sm" className="w-full">
                <Link href={`/events/create?hikeId=${hike.id}`}>
                  <Plus className="mr-2 h-4 w-4" /> Organiser
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}