// 1. On garde l'export de la config mais on la laisse vide
// Cela évite que les fichiers qui l'importent ne plantent.
export const firebaseConfig = {};

/**
 * 2. Neutralisation de l'initialisation.
 * Puisque tu migres vers Supabase et Cloudinary, on exporte 'app' 
 * comme nul pour empêcher toute tentative de connexion à Firebase.
 */
export const app = null;

/**
 * Note : Si tu as besoin de supprimer l'erreur console immédiatement, 
 * assure-toi qu'aucun autre fichier n'appelle initializeApp() 
 * avec des variables d'environnement vides.
 */