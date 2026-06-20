"use client";
import { useEffect } from 'react';
import L from 'leaflet';

export default function RoutingManager({ map }: { map: L.Map | null }) {
  useEffect(() => {
    if (!map) return;

    // Chargement du plugin et exécution sécurisée
    import('leaflet-routing-machine').then(() => {
      // TypeScript ne connaît pas l'extension sur l'objet global L, on passe par un cast (L as any)
      const leafletAny = L as any;
      
      if (!leafletAny.Routing || !leafletAny.Routing.control) return;

      const control = leafletAny.Routing.control({
        waypoints: [L.latLng(43.60, 1.44), L.latLng(43.61, 1.45)],
        router: leafletAny.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        // Optionnel : Désactiver l'itinéraire textuel si tu veux juste la ligne sur la carte
        show: false 
      }).addTo(map);

      (map as any)._routingControl = control;
    }).catch(err => console.error("Erreur chargement routing machine:", err));

    return () => {
      if (map && (map as any)._routingControl) {
        try {
          map.removeControl((map as any)._routingControl);
        } catch (e) {
          console.warn("Le composant de routing a déjà été retiré", e);
        }
      }
    };
  }, [map]);

  return null;
}