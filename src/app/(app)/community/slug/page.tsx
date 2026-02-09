export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeartHandshake, Link2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const meetupGroups = [
  {
    name: "Expats in Toulouse",
    description: "Pour les expatriés et les locaux qui veulent se rencontrer.",
    url: "https://www.meetup.com/expats-in-toulouse/",
  },
  {
    name: "Toulouse sorties évènements soirées balades visites randos",
    description: "Un grand groupe pour toutes sortes de sorties à Toulouse.",
    url: "https://www.meetup.com/toulouse-sorties-evenements-soirees-balades-visites-randos/",
  }
];

const facebookGroups = [
  { name: "Happy People Toulouse", url: "https://www.facebook.com/groups/996796667051330/" },
  { name: "Toulouse Le Bon Plan", url: "https://www.facebook.com/groups/550741995050817/" },
  { name: "Toulouse libre ou gratuit (proposer des sorties gratuit ou à prix libre)", url: "https://www.facebook.com/groups/651831044888765/" },
  { name: "Sorties Soirées Toulouse", url: "https://www.facebook.com/groups/596757027131271/" },
  { name: "La Carte des Colocs Toulouse", url: "https://www.facebook.com/groups/1272971156117937/" },
  { name: "Les Concerts Gratuits de Toulouse", url: "https://www.facebook.com/groups/221534187648/" },
  { name: "sorties culturelles à Toulouse", url: "https://www.facebook.com/groups/513531158446053/" },
  { name: "Sorties Visite Toulouse, Occitanie et Région Toulousaine", url: "https://www.facebook.com/groups/546506525504472/" },
  { name: "Soirées sorties entre filles Toulouse et Occitanie", url: "https://www.facebook.com/groups/1397077878141492/" },
  { name: "aller au théâtre, impro, stand up, spectacles, comédie à Toulouse", url: "https://www.facebook.com/groups/1396560737927890/" },
]

const partners = [
  {
    name: "Happy People 31",
    description: "Communauté d'échange et de sorties conviviales.",
    url: "http://www.happypeople.fr.nf/",
  },
  {
    name: "Bilingue 31",
    description: "Événements d'échange linguistique et culturel.",
    url: "http://www.bilingue.fr.nf/",
  }
];


export default function CommunityPage({ params }: { params: { slug: string[] } }) {
  const activeTab = params.slug?.[0] || 'meetup';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <HeartHandshake className="h-10 w-10 text-accent"/>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Communauté Toulouse rando</h1>
          <p className="text-muted-foreground">Connectez-vous avec d'autres randonneurs et découvrez nos partenaires.</p>
        </div>
      </div>
      <Tabs defaultValue={activeTab}>
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="meetup" asChild><Link href="/community/meetup">Événements Meetup</Link></TabsTrigger>
          <TabsTrigger value="facebook" asChild><Link href="/community/facebook">Groupes Facebook</Link></TabsTrigger>
          <TabsTrigger value="partners" asChild><Link href="/community/partners">Partenaires</Link></TabsTrigger>
        </TabsList>
        <TabsContent value="meetup">
          <Card>
            <CardHeader>
              <CardTitle>Événements Meetup</CardTitle>
              <CardDescription>
                Découvrez les prochains meetups de randonnée dans la région toulousaine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {meetupGroups.map((group) => (
                <Card key={group.name} className="bg-secondary/30">
                  <CardHeader>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild>
                      <a href={group.url} target="_blank" rel="noopener noreferrer">
                        Ouvrir sur Meetup.com <Link2 className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="facebook">
          <Card>
            <CardHeader>
              <CardTitle>Groupes Facebook</CardTitle>
              <CardDescription>
                Rejoignez les groupes de discussion sur Facebook pour ne rien manquer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {facebookGroups.map((group) => (
                <Card key={group.name} className="bg-secondary/30">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <p className="font-semibold text-lg flex-1">{group.name}</p>
                        <Button asChild className="w-full sm:w-auto">
                        <a href={group.url} target="_blank" rel="noopener noreferrer">
                            Voir le groupe <Link2 className="ml-2 h-4 w-4" />
                        </a>
                        </Button>
                    </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="partners">
          <Card>
            <CardHeader>
              <CardTitle>Nos Partenaires</CardTitle>
              <CardDescription>
                Ils soutiennent la communauté Toulouse rando.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {partners.map((partner) => (
                <Card key={partner.name} className="bg-secondary/30">
                  <CardHeader>
                    <CardTitle className="text-lg">{partner.name}</CardTitle>
                    <CardDescription>{partner.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild>
                      <a href={partner.url} target="_blank" rel="noopener noreferrer">
                        Visiter le site <Link2 className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
