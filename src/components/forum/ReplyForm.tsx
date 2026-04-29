"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase"; // On utilise le client standard ici
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

export function ReplyForm({ topicId }: { topicId: string }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("forum_posts")
      .insert([{ topic_id: topicId, content }]);

    if (!error) {
      setContent("");
      router.refresh(); // Rafraîchit la page pour voir la réponse
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-8">
      <Textarea
        placeholder="Écrivez votre réponse ici..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        className="min-h-[100px]"
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Envoi..." : "Répondre"}
      </Button>
    </form>
  );
}