'use client';

import { useEffect, useRef, useState } from 'react';

const MAP_LAYERS = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export default function BaladePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const [hikes, setHikes] = useState<any[]>([]);
  const [selectedHike, setSelectedHike] = useState<any>(null);

  useEffect(() => {
    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
      });

      leafletRef.current = L;

      if (!mapInstance.current && mapRef.current) {
        const map = L.map(mapRef.current).setView([43.60, 1.44], 10);
        L.tileLayer(MAP_LAYERS).addTo(map);
        mapInstance.current = map;
        layerGroupRef.current = L.featureGroup().addTo(map);
      }
    };

    initMap();

    fetch('/api/sorties')
      .then(res => res.json())
      .then(data => setHikes(data))
      .catch(console.error);
  }, []);

  const handleHikeClick = async (hike: any) => {
    if (selectedHike?.id === hike.id) return;
    try {
      const res = await fetch(`/api/sorties?id=${hike.id}`);
      const fullHike = await res.json();
      setSelectedHike(fullHike);
    } catch (err) {
      console.error(err);
    }
  };

  const getLatLon = (point: any) => {
    if (!point) return null;
    if (typeof point.lat === 'number' && typeof point.lon === 'number') return [point.lat, point.lon];
    if (Array.isArray(point) && point.length >= 2) {
      const [lon, lat] = point;
      return [lat, lon];
    }
    return null;
  };

  useEffect(() => {
    const L = leafletRef.current;
    if (!L || !mapInstance.current || !layerGroupRef.current || !selectedHike?.data) return;

    layerGroupRef.current.clearLayers();

    let data: any[] = selectedHike.data;

    // Aplatir les objets imbriqués si nécessaire
    if (!Array.isArray(data)) {
      const flattenObject = (obj: any): any[] => {
        if (obj == null) return [];
        if (Array.isArray(obj)) return obj;
        if (typeof obj !== 'object') return [obj];
        return Object.values(obj).flatMap(v => (Array.isArray(v) || (typeof v === 'object' && v !== null) ? flattenObject(v) : [v]));
      };
      data = flattenObject(data);
    }

    // Label standard pour rando, plages, lacs
    const getLabel = (item: any) => {
if (item.gso && item.gso.trim() !== "") return item.gso;
      const props = item.properties || {};
const candidates = [
    item.ngp,               // priorité
    item.nom_installation,  // fallback
    item.nom_equipement,    // fallback
   item.com_name_source,
   item.details,
   item.n0mdulac,
   item.name,
   item.nom_comm,
   item.nom_du_lieu,
   item.nom_lieu,
   item.nom_site,
   item.nom,
   item.sites,
   item.stations_t,
   props.designation,
   props.label_officiel,
   props.label,
   props.nature,
   props.nom_complet,
   props.nom_officiel,
   props.nom_p_eau,
   props.nom,
   props.nomsitenaturel,
   props.title,
   props.toponymie
];
      return candidates.find(v => typeof v === "string" && v.trim().length > 0) || "Lieu inconnu";
    };

    // Label spécifique pour patrimoine naturel
    const getLabelPatrimoine = (item: any) => {
      const props = item.properties || {};
      const candidates = [
        item.nomsitenaturel,
        item.sites,
        item.com_name_source,
        item.nom_comm,
        item.stations_t,
        item.details,
        item.name,
        item.nom,
        props.nom,
        props.label,
        props.title
      ];
      return candidates.find(v => typeof v === "string" && v.trim().length > 0) || "Lieu inconnu";
    };

    const myIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });

    const getPolygonCenter = (coords: any[]): [number, number] => {
      let lats: number[] = [];
      let lngs: number[] = [];

      const addCoords = (arr: any[]) => {
        if (!arr) return;
        if (typeof arr[0] === 'number') {
          lngs.push(arr[0]);
          lats.push(arr[1]);
        } else {
          arr.forEach(addCoords);
        }
      };
      addCoords(coords);

      const lat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const lng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

      return [lat, lng];
    };

    data.forEach((item: any) => {
      const title = getLabel(item);

      // Ancien format geo_point_2d
      if (item.geo_point_2d) {
        const coords = getLatLon(item.geo_point_2d);
        if (coords) {
          L.marker(coords, { icon: myIcon })
            .bindPopup(
              `<b>${title}</b>
               ${item.special ? `<br/>Spécialité: ${item.special}` : ''}
               ${item.stations_t ? `<br/>Station: ${item.stations_t}` : ''}
               ${item.frequ_2019 ? `<br/>Fréquentation 2019: ${item.frequ_2019}` : ''}`
            )
            .addTo(layerGroupRef.current);
        }
      }

      // Nouveau format lat/lng
      if (item.lat != null && item.lng != null) {
        L.marker([item.lat, item.lng], { icon: myIcon })
          .bindPopup(
            `<b>${title}</b>
             ${item.commune || item.com_name_source ? `<br/>Commune: ${item.commune || item.com_name_source}` : ''}
             ${item.total ? `<br/>Visiteurs: ${item.total?.toLocaleString()}` : ''}`
          )
          .addTo(layerGroupRef.current);
      }

      // --- Plages imbriquées ---
      if (item.plages && Array.isArray(item.plages) && item.lat != null && item.lng != null) {
        item.plages.forEach((plage: any) => {
          const plageName = plage.nom || "Plage inconnue";
          const plageDetails = plage.details ? `<br/>${plage.details}` : "";
          L.marker([item.lat, item.lng], { icon: myIcon })
            .bindPopup(`<b>${plageName}</b>${plageDetails}<br/><i>${item.ville}</i>`)
            .addTo(layerGroupRef.current);
        });
      }

      // --- Patrimoine naturel avec geopoint ---
      if (item.geopoint && item.geopoint.lat != null && item.geopoint.lon != null) {
        L.marker([item.geopoint.lat, item.geopoint.lon], { icon: myIcon })
          .bindPopup(
            `<b>${getLabelPatrimoine(item)}</b>
             ${item.types ? `<br/>Type: ${item.types}` : ''}
             ${item.descriptionlongue ? `<br/>${item.descriptionlongue}` : ''}`
          )
          .addTo(layerGroupRef.current);
      }

      // --- Parcs et plans d'eau GeoJSON ---
      if (item.type === 'FeatureCollection' || item.type === 'Feature') {
        const features = item.features || (item.type === 'Feature' ? [item] : []);
        features.forEach((f: any) => {
          const coords = f.geometry?.coordinates;
          if (!coords) return;
          const center = getPolygonCenter(coords);
          const popupLabel = f.properties?.nom || f.properties?.nom_p_eau || f.properties?.nature || "Lieu inconnu";

          L.marker(center, { icon: myIcon })
            .bindPopup(`<b>${popupLabel}</b>`)
            .addTo(layerGroupRef.current);
        });
      }
    });

    const bounds = layerGroupRef.current.getBounds();
    if (bounds.isValid()) mapInstance.current.fitBounds(bounds, { padding: [30, 30] });
  }, [selectedHike]);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full font-sans">
      <div className="w-80 bg-white shadow-xl overflow-y-auto border-r">
        <div className="p-4 border-b bg-white sticky top-0">
          <h1 className="text-xl font-black text-green-800">OCCITANIE</h1>
        </div>
<div className="p-2">
  {hikes.map(hike => (
    <button
      key={hike.id}
      onClick={() => handleHikeClick(hike)}
      className={`w-full text-left p-4 mb-2 rounded-xl border-2 transition ${
        selectedHike?.id === hike.id
          ? 'border-green-500 bg-green-50'
          : 'border-transparent bg-gray-50 hover:bg-gray-100'
      }`}
    >
      {/* 1. Titre principal (Nom affichage) */}
      <div className="font-bold text-gray-800 text-base leading-tight">
        {hike.name || "Sans titre"}
      </div>

      {/* 2. Description (au lieu du nom de fichier) */}
      {hike.description && (
        <div className="text-sm text-gray-500 mt-2 line-clamp-2 italic">
          {hike.description}
        </div>
      )}
    </button>
  ))}
</div>
      </div>
      <div ref={mapRef} className="flex-1 h-full" />
    </div>
  );
}