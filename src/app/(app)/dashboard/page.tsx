"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockEvents, mockForumTopics } from "@/lib/mock-data";
import { Activity, ArrowUpRight, CalendarPlus, PlusCircle, Users, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("Randonneur");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserProfile() {
      try {
        // 1. Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // 2. Récupérer son pseudo dans la table 'profiles'
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('identite')
            .eq('id', user.id)
            .single();

          if (profile && !error) {
            setUserName(profile.identite);
          }
        }
      } catch (error) {
        console.error("Erreur profil:", error);
      } finally {
        setLoading(false);
      }
    }

    getUserProfile();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Tableau de bord</h1>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <p className="text-muted-foreground">Bienvenue sur Toulouse rando, {userName} !</p>
        )}
      </div>

      {/* ... Le reste de ton code (Cards, etc.) reste identique ... */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card Mes Événements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes Événements à Venir</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">+2 depuis la semaine dernière</p>
            </CardContent>
          </Card>
          {/* ... etc ... */}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mes prochaines randonnées</CardTitle>
            <CardDescription>Les sorties auxquelles vous êtes inscrit(e).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockEvents.slice(0, 3).map(event => (
              <div key={event.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="bg-muted p-2 rounded-md flex flex-col items-center justify-center text-sm">
                    <span>{new Date(event.date).toLocaleString('fr-FR', { month: 'short' }).toUpperCase()}</span>
                    <span className="font-bold text-lg">{new Date(event.date).getDate()}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-muted-foreground">Organisé par {event.organizer.identite}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/events/${event.id}`}>
                    Voir
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité du forum</CardTitle>
            <CardDescription>Dernières discussions de la communauté.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockForumTopics.map(topic => (
              <div key={topic.id} className="flex flex-col gap-1">
                  <Link href={`/forum/${topic.id}`} className="font-semibold hover:underline">{topic.title}</Link>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>par {topic.author.identite}</span>
                    <Badge variant="outline">{topic.replies} réponses</Badge>
                  </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}