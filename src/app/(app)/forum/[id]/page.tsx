import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ReplyForm } from "@/components/forum/ReplyForm"; // Assure-toi de créer ce composant

export default async function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  
  // On attend les paramètres (Next.js 15+)
  const { id } = await params;

  // 1. Récupérer le sujet principal
  const { data: topic, error: topicError } = await supabase
    .from("forum_topics")
    .select(`
      *,
      author:author_id (identite)
    `)
    .eq("id", id)
    .single();

  if (topicError || !topic) {
    notFound();
  }

  // 2. Récupérer les réponses associées
  const { data: posts, error: postsError } = await supabase
    .from("forum_posts")
    .select(`
      *,
      author:author_id (identite)
    `)
    .eq("topic_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <Link 
        href="/forum" 
        className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour au forum
      </Link>

      {/* Message Principal */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="bg-primary/10 p-1 rounded-full">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium text-foreground">{topic.author?.identite}</span>
            <span>•</span>
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(topic.created_at), "PPP", { locale: fr })}</span>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
            {topic.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-lg leading-relaxed text-foreground/90">
            {topic.content}
          </p>
        </CardContent>
      </Card>

      {/* Section des Réponses */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 px-2">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-xl font-semibold">Réponses ({posts?.length || 0})</h3>
        </div>

        {posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="bg-muted/30 border-none shadow-none">
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{post.author?.identite}</span>
                    <span>•</span>
                    <span>{format(new Date(post.created_at), "p", { locale: fr })}</span>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
            <p className="text-muted-foreground">Pas encore de réponse. Soyez le premier !</p>
          </div>
        )}
      </div>

      {/* Formulaire pour répondre (doit être un Client Component) */}
      <div className="pt-6">
        <ReplyForm topicId={id} />
      </div>
    </div>
  );
}