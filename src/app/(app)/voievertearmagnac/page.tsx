'use client';

import { useEffect, useRef, useState } from "react";
import { Loader2, Bike, Plus } from "lucide-react"; // Ajout de Plus
import { Button } from "@/components/ui/button"; // Import du bouton Shadcn
import Link from "next/link"; // Import pour la navigation
import "leaflet/dist/leaflet.css";

export default function VoieVertePage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const [data, setData] = useState<any[] | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Identifiant unique pour cette rando (doit correspondre à ton mock-data ou ta DB)
  const HIKE_ID = "voie-verte-armagnac"; 
  const HIKE_TITLE = "Voie Verte de l'Armagnac";

  useEffect(() => {
    fetch("/api/voievertearmagnac")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || !data) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      if (mapInstance.current) return;

      const map = L.map(mapRef.current, {
        center: [43.90, 0.20],
        zoom: 11,
      });
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap France'
      }).addTo(map);

      data.forEach((item: any) => {
        if (item.geo_shape && item.geo_shape.geometry) {
          const geojsonFeature: any = {
            type: "Feature",
            geometry: item.geo_shape.geometry,
            properties: {
              name: item.min_autre,
              length: (item.shape_leng / 1000).toFixed(2)
            }
          };

          L.geoJSON(geojsonFeature, {
            style: {
              color: "#16a34a",
              weight: 5,
              opacity: 0.8,
              dashArray: item.min_autre.includes("provisoire") ? "10, 10" : ""
            }
          }).addTo(map);
        }
      });

      setTimeout(() => {
        map.invalidateSize();
        setIsReady(true);
      }, 300);
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [data]);

  if (!data) return (
    <div className="h-screen flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-green-600 mb-4" size={40} />
      <p className="text-slate-600">Chargement de l'itinéraire Armagnac...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-green-600 p-3 rounded-2xl text-white shadow-lg">
            <Bike size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{HIKE_TITLE}</h1>
            <p className="text-slate-500 font-medium italic">Ancienne voie ferrée Condom - Eauze</p>
          </div>
        </div>

        {/* --- BOUTON DE CRÉATION DE SORTIE --- */}
        <Button asChild className="bg-green-600 hover:bg-green-700 shadow-lg rounded-xl h-12 px-6">
          <Link href={`/events/create?hikeId=${HIKE_ID}`}>
            <Plus className="mr-2 h-5 w-5" />
            Créer une sortie à partir de ce circuit
          </Link>
        </Button>
      </header>

      <div className="relative w-full mb-8 border-4 border-white shadow-2xl rounded-[2.5rem] bg-slate-200 overflow-hidden" style={{ height: "60vh" }}>
        <div ref={mapRef} className="h-full w-full" />
        {!isReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 z-10">
            <Loader2 className="animate-spin h-8 w-8 text-green-600 mb-2" />
            <p className="text-slate-500 text-sm">Tracé des voies en cours…</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-lg mb-2">{item.min_autre}</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Distance</span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                {(item.shape_leng / 1000).toFixed(1)} km
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}