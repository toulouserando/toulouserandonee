import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MessageSquare, User, XCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/server";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ForumSearch } from "@/components/forum/ForumSearch";

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { q } = await searchParams;

  // Construction de la requête Supabase
  let query = supabase
    .from('forum_topics')
    .select(`
      id, 
      title, 
      replies_count, 
      last_activity,
      author:author_id (identite)
    `)
    .order('last_activity', { ascending: false });

  // Si une recherche est présente, on filtre sur le titre ou le contenu
  if (q) {
    query = query.ilike('title', `%${q}%`);
  }

  const { data: topics, error } = await query;

  if (error) {
    return <div className="p-6 text-destructive">Erreur : {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Forum de discussion</h1>
          <p className="text-muted-foreground">Échangez avec la communauté et partagez vos conseils.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <ForumSearch />
          <Button asChild>
            <Link href="/forum/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouveau sujet
            </Link>
          </Button>
        </div>
      </div>

      {/* Affichage de l'état de recherche */}
      {q && (
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
          <p className="text-sm">
            Résultats pour : <span className="font-bold">"{q}"</span> ({topics?.length || 0} sujets trouvés)
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/forum">
              <XCircle className="mr-2 h-4 w-4" /> Effacer
            </Link>
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Sujet</TableHead>
                <TableHead className="text-center">Réponses</TableHead>
                <TableHead className="hidden md:table-cell">Dernière activité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20 text-muted-foreground">
                    {q ? "Aucun sujet ne correspond à votre recherche." : "Aucun sujet pour le moment."}
                  </TableCell>
                </TableRow>
              ) : (
                topics?.map((topic: any) => (
                  <TableRow key={topic.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full">
                          <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <Link href={`/forum/${topic.id}`} className="font-semibold hover:underline">
                            {topic.title}
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{topic.author?.identite || "Utilisateur"}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{topic.replies_count}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(topic.last_activity), { addSuffix: true, locale: fr })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}