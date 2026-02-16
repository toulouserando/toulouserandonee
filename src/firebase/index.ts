'use client';

import { firebaseConfig } from '@/firebase/config';

// On neutralise les fonctions pour éviter l'initialisation de Firebase
// mais on garde les signatures pour ne pas casser les imports ailleurs.

export function initializeFirebase() {
  // On retourne simplement un objet de SDK vides (null)
  return getSdks();
}

export function getSdks(firebaseApp: any = null) {
  return {
    firebaseApp: null,
    auth: null,
    firestore: null
  };
}

// On garde les exports pour éviter les erreurs "Module not found" 
// dans les composants qui utilisent ces fichiers.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';