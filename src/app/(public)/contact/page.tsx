"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"success" | "error" | "idle">("idle");
  const [error, setError] = useState("");
  
  // Solution pour l'erreur d'hydratation
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !subject || !message) {
      setError("Veuillez remplir tous les champs.");
      setStatus("error");
      return;
    }
    
    console.log({
      to: "tolosa@free.fr",
      from: email,
      name,
      subject,
      message
    });
    
    setStatus("success");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  // On ne rend rien ou un loader tant que le client n'a pas pris le relais
  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Mail className="h-10 w-10 text-accent"/>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Nous contacter</h1>
          <p className="text-muted-foreground">Une question, une suggestion ? Remplissez le formulaire ci-dessous.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Formulaire de contact</CardTitle>
          <CardDescription>
            Votre message sera envoyé à l'adresse <a href="mailto:tolosa@free.fr" className="text-primary underline">tolosa@free.fr</a>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {status === 'error' && error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {status === 'success' && (
              <Alert variant="default" className="border-green-500 text-green-700 dark:border-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-600" />
                <AlertTitle>Message envoyé !</AlertTitle>
                <AlertDescription>Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.</AlertDescription>
              </Alert>
            )}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Votre nom</Label>
                <Input id="name" placeholder="Jean Dupont" value={name} onChange={(e) => setName(e.target.value)} disabled={status === 'success'} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Votre email</Label>
                <Input id="email" type="email" placeholder="jean.dupont@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={status === 'success'} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet</Label>
              <Input id="subject" placeholder="Sujet de votre message" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={status === 'success'} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Votre message</Label>
              <Textarea id="message" placeholder="Écrivez votre message ici..." rows={6} value={message} onChange={(e) => setMessage(e.target.value)} disabled={status === 'success'} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={status === 'success'}>
                <Send className="mr-2 h-4 w-4" />
                Envoyer le message
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}