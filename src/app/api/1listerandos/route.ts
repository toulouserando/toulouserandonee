import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js'; // Utilisation du client standard

// Initialisation de Supabase avec tes variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  const dataPath = path.join(process.cwd(), 'data', 'rando');

  try {
    // --- 1. LISTER LES FICHIERS LOCAUX (Par départements) ---
    let localFilesByDept: Record<string, any[]> = {};
    
    if (existsSync(dataPath)) {
      const folders = await fs.readdir(dataPath, { withFileTypes: true });
      
      for (const folder of folders) {
        if (folder.isDirectory()) {
          const folderPath = path.join(dataPath, folder.name);
          const files = await fs.readdir(folderPath);
          
          const items = files
            .filter(f => {
                const lower = f.toLowerCase();
                return lower.endsWith('.json') || lower.endsWith('.geojson');
            })
            .map(file => ({
              id: `${folder.name}/${file}`, // Important pour l'accès futur au fichier
              title: file.replace(/\.(json|geojson)$/i, '').replace(/[-_]/g, ' '),
              type: 'local'
            }));
          
          if (items.length > 0) {
            localFilesByDept[folder.name.toUpperCase()] = items;
          }
        }
      }
    }

    // --- 2. RÉCUPÉRER LES RANDONNÉES SUPABASE (Table hikes) ---
    const { data: hikes, error } = await supabase
      .from('hikes')
      .select('id, title, location, distance')
      .order('title', { ascending: true });

    if (error) {
      console.error("Erreur de récupération Supabase:", error.message);
    }

    // On s'assure que c'est un tableau
    const supabaseHikes = (hikes || []).map(h => ({
      id: h.id, 
      title: h.title || 'Sans titre',
      location: h.location || 'Lieu inconnu',
      distance: h.distance,
      type: 'supabase'
    }));

    // --- 3. RÉPONSE FUSIONNÉE ---
    return NextResponse.json({
      locaux: localFilesByDept,
      supabase: supabaseHikes 
    });

  } catch (error: any) {
    console.error("Erreur générale API testrandos:", error.message);
    return NextResponse.json(
      { locaux: {}, supabase: [], error: "Erreur serveur" }, 
      { status: 500 }
    );
  }
}