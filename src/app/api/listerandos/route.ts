import { NextResponse } from 'next/server';
import fs from 'fs/promises'; // Passage en version asynchrone
import { existsSync } from 'fs'; 
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  const dataPath = path.join(process.cwd(), 'data', 'rando');

  try {
    // 1. Lister les fichiers locaux
    let localFiles = [];
    if (existsSync(dataPath)) {
      const files = await fs.readdir(dataPath); // Lecture asynchrone
      localFiles = files
        .filter(file => file.endsWith('.json') || file.endsWith('.geojson'))
        .map(file => {
          const cleanTitle = file
            .replace(/\.(json|geojson)$/, '')
            .replace(/[-_]/g, ' ')
            .trim();

          return {
            id: file, 
            title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
            type: 'local'
          };
        });
    }

    // 2. Récupérer les randonnées de Supabase
    const { data: hikes, error } = await supabase
      .from('hikes')
      .select('id, title')
      .order('title', { ascending: true });

    if (error) {
      console.error("Erreur de récupération Supabase:", error.message);
    }

    const supabaseHikes = (hikes || []).map(h => ({
      id: h.id, 
      title: h.title || 'Sans titre',
      type: 'supabase'
    }));

    // 3. Réponse
    return NextResponse.json({
      locaux: localFiles,
      supabase: supabaseHikes 
    });

  } catch (error: any) {
    console.error("Erreur générale API listerandos:", error.message);
    return NextResponse.json(
      { locaux: [], supabase: [], error: "Impossible de lister les randonnées" }, 
      { status: 500 }
    );
  }
}