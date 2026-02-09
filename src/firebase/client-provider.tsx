'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // VÉRIFICATION : Si on n'a pas de projectId, on ne tente même pas l'initialisation
    // On retourne des objets vides ou null pour ne pas faire planter le reste du code
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && typeof window !== 'undefined') {
      console.warn("Firebase: Project ID manquant. Initialisation ignorée pour le build.");
      return { firebaseApp: null, auth: null, firestore: null };
    }

    try {
      return initializeFirebase();
    } catch (error) {
      console.error("Erreur critique Firebase lors de l'initialisation:", error);
      return { firebaseApp: null, auth: null, firestore: null };
    }
  }, []);

  // Si on n'a pas de services (pendant le build Vercel), on affiche juste les enfants sans le Provider
  if (!firebaseServices.firebaseApp) {
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}