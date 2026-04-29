import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } // Version Next.js 15+
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Récupération de la ligne complète dans la table 'hikes'
    const { data, error } = await supabase
      .from('hikes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Randonnée introuvable" }, { status: 404 });
    }

    // --- SÉCURISATION DU FORMAT GÉOMÉTRIQUE ---
    // Parfois Supabase renvoie le JSONB comme un string, on le "parse" si besoin
    let geometry = data.route_geometry;
    if (typeof geometry === 'string') {
      try {
        geometry = JSON.parse(geometry);
      } catch (e) {
        console.error("Erreur de parsing JSON sur route_geometry");
      }
    }

    // On renvoie un objet propre au frontend
return NextResponse.json({
      ...data,
      // ON RECOPIE route_geometry DANS UN CHAMP geometry POUR LE FRONTEND
      geometry: geometry, 
      route_geometry: geometry, // On le garde aussi au cas où
      is_community: true 
    });

  } catch (err: any) {
    console.error("Erreur API ID:", err.message);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}