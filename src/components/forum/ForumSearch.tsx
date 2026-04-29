"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ForumSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // On encode la requête pour gérer les espaces et caractères spéciaux
      router.push(`/forum?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/forum");
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Button type="submit" size="sm" className="px-3">
        <Search className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Rechercher</span>
      </Button>
    </form>
  );
}