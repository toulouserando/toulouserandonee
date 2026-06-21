import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic"; // Évite la mise en cache sauvage de Next.js

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), "data", "randos", "Gers_Haute_Garonne");
    const tousLesCircuits: any[] = [];

    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);

      files.forEach((file) => {
        if (file.endsWith(".json")) {
          const filePath = path.join(dirPath, file);
          const fileContent = fs.readFileSync(filePath, "utf-8");
          
          try {
            let rawJson = JSON.parse(fileContent);

            // 🔥 CORRECTIF : Si le JSON est enveloppé dans un tableau [ {...} ], on extrait le premier élément
            if (Array.isArray(rawJson)) {
              rawJson = rawJson[0];
            }

            // Extraction de la géométrie (gère geo_shape ou geometry)
            const geometry = rawJson?.geo_shape?.geometry || rawJson?.geometry || null;

            if (geometry && geometry.coordinates) {
              // 1. Identification intelligente du département
              const commenceParChiffre = /^\d+/.test(file);
              const departementName = commenceParChiffre ? "Gers" : "Haute-Garonne";

              // 2. Identification du meilleur titre possible
              // On cherche d'abord "nom_itineraire", sinon on nettoie le nom de fichier
              const titreBrut = rawJson?.nom_itineraire || file.replace(".json", "").replace(/_/g, " ");
              
              // Petit nettoyage cosmétique au cas où
              const finalTitle = titreBrut.charAt(0).toUpperCase() + titreBrut.slice(1);

              tousLesCircuits.push({
                id: file.replace(".json", ""),
                title: finalTitle,
                departement: departementName,
                geometry: geometry,
                properties: rawJson?.properties || rawJson || {}
              });
            }
          } catch (jsonErr) {
            console.error(`Erreur de parsing sur le fichier ${file}:`, jsonErr);
          }
        }
      });
    } else {
      console.error(`Dossier introuvable au chemin : ${dirPath}`);
    }

    return NextResponse.json(tousLesCircuits);
  } catch (error: any) {
    console.error("Erreur API rando4GersHG31:", error);
    return NextResponse.json({ error: "Impossible de lire les tracés" }, { status: 500 });
  }
}