"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Import du bouton
import Link from "next/link"; // Import pour la navigation
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
        <ShieldCheck className="h-10 w-10 text-accent"/>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Politique de Confidentialité</h1>
          <p className="text-muted-foreground">Informations sur la collecte et l'utilisation de vos données.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Introduction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Fais ta sortie à Toulouse (ci-après « l'Application » ou « Nous ») s'engage à protéger la confidentialité des utilisateurs. Cette politique de confidentialité détaille les types d'informations que nous collectons via l'Application, la manière dont nous les utilisons et les droits des utilisateurs concernant ces informations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Données Collectées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <h3 className="font-semibold text-foreground">2.1. Informations Fournies par l'Utilisateur</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Données d'identité et de contact (si un compte est créé) :</strong> Nom d'utilisateur, adresse e-mail, mot de passe chiffré.</li>
            <li><strong>Contenu Utilisateur (si applicable) :</strong> Textes, photos, ou autres contenus que vous téléchargez ou créez dans l'Application.</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-4">2.2. Informations Collectées Automatiquement</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Données d'utilisation :</strong> Informations sur la manière dont vous interagissez avec l'Application (pages vues, fonctionnalités utilisées, fréquence d'accès, etc.).</li>
            <li><strong>Données techniques :</strong> Adresse IP, type d'appareil mobile, système d'exploitation, identifiants uniques de l'appareil (par exemple, IDFA, Android ID).</li>
            <li><strong>Données de localisation (si l'utilisateur y a consenti) :</strong> Localisation géographique précise via GPS ou moins précise via l'adresse IP.</li>
            <li><strong>Cookies et technologies similaires :</strong> Utilisés pour améliorer l'expérience utilisateur et analyser l'utilisation de l'Application.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Utilisation des Données</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>Nous utilisons les données collectées pour les finalités suivantes :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Fourniture de Services :</strong> Pour exploiter, maintenir, fournir et améliorer les fonctionnalités de l'Application.</li>
            <li><strong>Communication :</strong> Pour répondre à vos demandes de support, vous envoyer des notifications liées au service, ou des communications marketing (avec votre consentement).</li>
            <li><strong>Analyse et Amélioration :</strong> Pour surveiller les métriques d'utilisation, diagnostiquer les problèmes techniques et améliorer l'expérience utilisateur.</li>
            <li><strong>Sécurité et Conformité Légale :</strong> Pour prévenir la fraude, protéger la sécurité de l'Application et se conformer aux obligations légales.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Partage des Données</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>Nous ne vendons ni ne louons vos données personnelles à des tiers. Nous pouvons partager vos informations avec :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Prestataires de Services Tiers :</strong> Entreprises externes qui nous aident à exploiter l'Application (hébergement de données, services d'analyse, marketing). Ces tiers sont contractuellement obligés de protéger vos données.</li>
            <li><strong>Obligations Légales :</strong> Si nous y sommes contraints par la loi ou par une procédure judiciaire valide (par exemple, un mandat de perquisition ou une ordonnance d'un tribunal).</li>
            <li><strong>Transferts d'Entreprise :</strong> Dans le cadre d'une fusion, acquisition, ou vente d'actifs, vos données pourraient être transférées à l'entité acquéreuse.</li>
          </ul>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>5. Durée de Conservation des Données</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Nous conservons vos informations personnelles aussi longtemps que nécessaire pour vous fournir le service, et pour nous conformer à nos obligations légales, résoudre les litiges et appliquer nos politiques.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Vos Droits d'Utilisateur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
            <p>Conformément à la réglementation applicable (comme le RGPD), vous disposez des droits suivants :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Droit d'accès :</strong> Obtenir la confirmation que vos données sont traitées et, le cas échéant, y accéder.</li>
            <li><strong>Droit de rectification :</strong> Demander la correction de données inexactes.</li>
            <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données personnelles (sous certaines conditions).</li>
            <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données pour certaines finalités, comme le marketing direct.</li>
          </ul>
          <p>Pour exercer ces droits, veuillez nous contacter à l'adresse fournie dans la section 7.</p>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>7. Nous Contacter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Si vous avez des questions concernant cette politique de confidentialité, vous pouvez nous contacter à : <a href="mailto:tolosa31@free.fr" className="text-primary hover:underline">tolosa31@free.fr</a>.
          </p>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>8. Modifications de la Politique de Confidentialité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
           <p>Nous pourrons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de toute modification en publiant la nouvelle politique sur cette page et en changeant la date d'entrée en vigueur ci-dessous.</p>
           <p className="font-semibold">Date d'entrée en vigueur : 13 octobre 2025</p>
        </CardContent>
      </Card>

    </div>
  );
}