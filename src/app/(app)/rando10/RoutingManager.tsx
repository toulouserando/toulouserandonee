"use client";
import { useEffect } from 'react';
import L from 'leaflet';

export default function RoutingManager({ map }: { map: L.Map | null }) {
  useEffect(() => {
    if (!map) return;

    // Chargement dynamique du plugin uniquement quand nécessaire
    import('leaflet-routing-machine').then(() => {
      const control = L.Routing.control({
        waypoints: [L.latLng(43.60, 1.44), L.latLng(43.61, 1.45)],
        // Ajout du serviceUrl pour arrêter de polluer la console avec l'avertissement OSRM
        router: (L.Routing as any).osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        })
      }).addTo(map);

      // On stocke le control pour le supprimer lors du démontage
      (map as any)._routingControl = control;
    });

    return () => {
      if ((map as any)._routingControl) {
        map.removeControl((map as any)._routingControl);
      }
    };
  }, [map]);

  return null;
}