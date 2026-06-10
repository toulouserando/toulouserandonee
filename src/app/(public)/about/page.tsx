"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link"; // Import pour la navigation
import { Button } from "@/components/ui/button"; // Import manquant ajouté ici
import { Info, ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Bouton Retour vers l'Accueil */}
      <div className="flex justify-start">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Info className="h-10 w-10 text-accent"/>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">À Propos</h1>
          <p className="text-muted-foreground">Bienvenue sur votre application Toulouse Randonnées.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notre Objectif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>Trouve sur les cartes de randonnée ton circuit.</p>
          <p>Propose le aux autres membres et créée ta sortie.</p>
          <p>Et si une sortie t'intéresse, inscris toi !</p>
        </CardContent>
      </Card>
    </div>
  );
}
