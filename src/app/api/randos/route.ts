import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export async function GET() {
  // On pointe vers le dossier data/randos (vérifiez bien l'orthographe : rando ou randos)
  const dataPath = path.join(process.cwd(), 'data', 'randos');

  try {
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
              // On accepte json et geojson
              return lower.endsWith('.json') || lower.endsWith('.geojson');
            })
            .map(file => {
              // On nettoie le titre pour l'affichage (ex: Balades_en_velo -> Balades en velo)
              const cleanTitle = file
                .replace(/\.(json|geojson)$/i, '')
                .replace(/[-_]/g, ' ');

              return {
                id: `${folder.name}/${file}`, // Ex: "Gers/ma_rando.geojson"
                title: cleanTitle,
                type: 'local',
                extension: file.split('.').pop()?.toLowerCase()
              };
            });
          
          if (items.length > 0) {
            // On utilise le nom du dossier comme clé (ex: "LOT EN VELO")
            const deptLabel = folder.name.replace(/_/g, ' ').toUpperCase();
            localFilesByDept[deptLabel] = items;
          }
        }
      }
    }

    // Récupération Supabase (inchangée)
    const { data: hikes } = await supabase.from('hikes').select('id, title, location, distance');
    const supabaseHikes = (hikes || []).map(h => ({
      id: h.id, 
      title: h.title || 'Sans titre',
      type: 'supabase'
    }));

    return NextResponse.json({
      locaux: localFilesByDept,
      supabase: supabaseHikes 
    });

  } catch (error: any) {
    return NextResponse.json({ locaux: {}, supabase: [], error: error.message }, { status: 500 });
  }
}