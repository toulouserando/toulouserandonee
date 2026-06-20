"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, TrendingUp, Plus, Loader2 } from "lucide-react";
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
          <Card key={hike.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{hike.title}</CardTitle>
                <Badge variant="outline">{hike.difficulty}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {hike.location}
              </div>
              <div className="flex justify-between border-t pt-4">
                <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {hike.duration}</div>
                <div className="flex items-center gap-1"><TrendingUp className="h-4 w-4" /> {hike.distance}</div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 gap-2">
              <Button asChild className="w-full" variant="default">
                <Link href={`/events/create?hikeId=${hike.id}`}>
                  <Plus className="mr-2 h-4 w-4" /> Organiser une sortie
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}