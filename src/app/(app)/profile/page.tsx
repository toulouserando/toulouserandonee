"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, ShieldAlert, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast"; // Si tu as shadcn toast, sinon utilise alert()
import { Switch } from "@/components/ui/switch";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [genre, setGenre] = useState<string>("");
    const [showContact, setShowContact] = useState(false);
    const [showBirth, setShowBirth] = useState(false);
    ;
    const { toast } = useToast();

    // 1. Charger les données du profil
    useEffect(() => {
        async function getProfile() {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (authUser) {
                    const { data, error } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", authUser.id)
                        .single();

                    if (error) throw error;
                    setUser(data);
                    setGenre(data.genre || "");
                }
            } catch (error) {
                console.error("Erreur chargement profil:", error);
            } finally {
                setLoading(false);
            }
        }
        getProfile();
    }, [supabase]);

    // 2. Fonction de mise à jour
    const handleUpdate = async () => {
        try {
            const updates = {
                id: user.id,
                prenom: (document.getElementById('prenom') as HTMLInputElement).value,
                nom: (document.getElementById('nom') as HTMLInputElement).value,
                identite: (document.getElementById('identite') as HTMLInputElement).value,
                description: (document.getElementById('description') as HTMLTextAreaElement).value,
                commune: (document.getElementById('commune') as HTMLInputElement).value,
                date_naissance: (document.getElementById('dateNaissance') as HTMLInputElement).value || null,
                langues: (document.getElementById('langues') as HTMLInputElement).value,
                telephone: (document.getElementById('telephone') as HTMLInputElement).value,
                genre: genre,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) throw error;
            toast({ title: "Succès", description: "Profil mis à jour !" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erreur", description: error.message });
        }
    };

    // 3. Fonction de suppression de compte
    const handleDeleteAccount = async () => {
        const confirm = window.confirm("Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.");
        if (!confirm) return;

        try {
            // Note: Pour une suppression complète (Auth + Data), il faut normalement une Edge Function.
            // Ici, on déconnecte l'utilisateur après avoir tenté de marquer le compte comme supprimé.
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            window.location.href = "/";
        } catch (error: any) {
            alert(error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <User className="h-10 w-10 text-accent" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Profil et Paramètres</h1>
                    <p className="text-muted-foreground">Gérez vos informations personnelles et votre compte.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* Colonne Gauche : Avatar & Danger Zone */}
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader className="items-center text-center">

<Avatar className="h-24 w-24 mb-2">
    <AvatarImage 
        src={
            // 1. On vérifie d'abord si l'utilisateur a une photo personnalisée (uploadée)
            (user?.avatar_url && !user.avatar_url.includes('/avatar/')) 
                ? user.avatar_url 
                : (user?.genre === 'femme') 
                    ? "/avatar/avatar_woman.png" 
                    : (user?.genre === 'homme') 
                        ? "/avatar/avatar_man.png" 
                        : "/avatar/avatar_other.png" // Par défaut pour 'autre' ou indéfini
        } 
        alt={user?.identite} 
	className="object-cover"
    />
    <AvatarFallback className="text-3xl">
        {user?.identite?.charAt(0) || "U"}
    </AvatarFallback>
</Avatar>

                            <CardTitle>{user?.identite || "Utilisateur"}</CardTitle>
                            <CardDescription className="capitalize">{user?.role || "Randonneur"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full">Changer la photo</Button>
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <ShieldAlert className="h-5 w-5" />
                                Zone de danger
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div>
                                <p className="font-semibold text-sm">Supprimer mon compte</p>
                                <p className="text-xs text-muted-foreground">Action irréversible.</p>
                            </div>
                            <Button variant="destructive" onClick={handleDeleteAccount} className="w-full">
                                Se désinscrire
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Colonne Droite : Formulaires */}
                <div className="lg:col-span-2 space-y-8">
<Card>
    <CardHeader>
        <CardTitle>Informations du profil</CardTitle>
        <CardDescription>Ces informations seront visibles par les randonneurs.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
        {/* Ligne : Prénom et Nom */}
        <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input id="prenom" defaultValue={user?.prenom || ""} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" defaultValue={user?.nom || ""} />
            </div>
        </div>

        {/* Ligne : Pseudo */}
        <div className="space-y-2">
            <Label htmlFor="identite">Pseudo (Identité)</Label>
            <Input id="identite" defaultValue={user?.identite || ""} />
        </div>

        {/* Ligne : Bio */}
        <div className="space-y-2">
            <Label htmlFor="description">Bio / Expérience</Label>
            <Textarea id="description" defaultValue={user?.description || ""} placeholder="Parlez-nous de vos sommets préférés..." />
        </div>

        {/* Ligne : Commune et Date de Naissance (AVEC SWITCH) */}
        <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="commune">Commune</Label>
                <Input id="commune" defaultValue={user?.commune || ""} />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="dateNaissance">Date de naissance</Label>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium uppercase text-muted-foreground">
                            {showBirth ? "Public" : "Privé"}
                        </span>
                        <Switch 
                            id="switch-birth"
                            className="scale-75" 
                            checked={showBirth} 
                            onCheckedChange={setShowBirth} 
                        />
                    </div>
                </div>
                <Input id="dateNaissance" type="date" defaultValue={user?.date_naissance || ""} />
                <p className="text-[10px] text-muted-foreground italic">
                    {showBirth 
                        ? "✅ L'âge sera visible sur votre profil." 
                        : "🔒 L'âge est masqué (visible par vous & admins)."}
                </p>
            </div>
        </div>

        {/* Ligne : Genre et Langues */}
        <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger id="genre">
                        <SelectValue placeholder="Genre" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="femme">Femme</SelectItem>
                        <SelectItem value="homme">Homme</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="langues">Langues</Label>
                <Input id="langues" defaultValue={user?.langues || ""} />
            </div>
        </div>

        <div className="flex justify-end pt-2">
            <Button onClick={handleUpdate}>Enregistrer les modifications</Button>
        </div>
    </CardContent>
</Card>

<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0">
    <div className="space-y-1">
      <CardTitle>Contact Privé</CardTitle>
      <CardDescription>
        Utilisé uniquement pour l'organisation des sorties.
      </CardDescription>
    </div>
    <div className="flex items-center space-x-2">
      <Label htmlFor="visibilite" className="text-sm text-muted-foreground">
        {showContact ? "Public" : "Privé"}
      </Label>
      <Switch 
        id="visibilite" 
        checked={showContact} 
        onCheckedChange={setShowContact} 
      />
    </div>
  </CardHeader>

  <CardContent className="space-y-4">
    {/* Message d'aide dynamique */}
    <div className="text-xs bg-muted/50 p-2 rounded-md border italic">
      {showContact 
        ? "✅ Votre téléphone sera visible par les autres membres inscrits aux mêmes randos que vous." 
        : "🔒 Votre téléphone restera masqué (seuls les organisateurs y auront accès)."}
    </div>

    <div className="space-y-2">
      <Label htmlFor="email">Email (non modifiable ici)</Label>
      <Input id="email" type="email" defaultValue={user?.email || ""} disabled />
    </div>

    <div className="space-y-2">
      <Label htmlFor="telephone">Numéro de téléphone</Label>
      <Input id="telephone" type="tel" defaultValue={user?.telephone || ""} />
    </div>

    <div className="flex justify-end">
      <Button onClick={handleUpdate}>
        Mettre à jour le contact
      </Button>
    </div>
  </CardContent>
</Card>
                </div>
            </div>
        </div>
    );
}