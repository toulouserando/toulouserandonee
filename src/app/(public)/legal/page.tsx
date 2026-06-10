"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LegalPage() {
  // Récupération de l'email depuis les variables d'environnement
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@toulouserando.fr";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Bouton Retour à l'Accueil */}
      <div className="flex justify-start">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <FileText className="h-10 w-10 text-accent"/>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Mentions Légales</h1>
          <p className="text-muted-foreground">Informations légales concernant l'application.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Éditeur du site</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-muted-foreground">
          <p className="font-semibold text-foreground">Association Happy People 31</p>
          <p>13, bd Lascrosses</p>
          <p>31000 Toulouse</p>
          <p>France</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Pour toute question, vous pouvez nous contacter via notre formulaire de contact ou à l'adresse email de l'association (disponible pour les membres inscrits).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hébergeur du site</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-muted-foreground">
          <p>Ce site est propulsé par <strong>Vercel</strong> et utilise <strong>Supabase</strong> pour la gestion des données.</p>
          <p className="mt-2 text-xs">Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Propriété intellectuelle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Données personnelles (RGPD)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Conformément au RGPD, les données collectées (via Supabase Auth) sont strictement limitées à la gestion de votre compte. Vous bénéficiez d'un droit d'accès, de rectification et de suppression de vos données directement depuis votre profil utilisateur.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsabilité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>Toulouse rando facilite la mise en relation pour des sorties de randonnée. L'association décline toute responsabilité en cas d'incident survenant lors des sorties organisées par les membres bénévoles.</p>
        </CardContent>
      </Card>
    </div>
  );
}