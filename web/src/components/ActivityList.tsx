'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import type { ActivityRecord } from '@/types/activity.types'; // Importer typen

export default function ActivityList() {
  // State for å holde listen med aktiviteter
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  // State for å vise lastestatus
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // State for å vise feilmeldinger
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // useEffect for å hente data når komponenten vises første gang
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      setActivities([]); // Nullstill listen mens vi laster

      if (!auth.currentUser) {
        // Skal i teorien ikke skje siden komponenten kun vises for innloggede,
        // men greit med en sjekk.
        setErrorMsg('Bruker ikke innlogget.');
        setIsLoading(false);
        return;
      }

      let token: string | null = null;
      try {
        token = await auth.currentUser.getIdToken(true);
      } catch (tokenError) {
        console.error("Error getting ID token:", tokenError);
        setErrorMsg('Kunne ikke hente autentiseringstoken.');
        setIsLoading(false);
        return;
      }

      if (!token) {
        setErrorMsg('Kunne ikke hente autentiseringstoken.');
        setIsLoading(false);
        return;
      }

      // --- Gjør API-kall ---
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          throw new Error("API URL is not defined.");
        }

        const response = await fetch(`${apiUrl}/api/activities`, { // GET er standard, trenger ikke spesifisere metode
          headers: {
            'Authorization': `Bearer ${token}`,
            // 'Content-Type' trengs ikke for GET
          },
        });

        const data = await response.json();

        if (response.ok) {
          // Antar backend returnerer en array med ActivityRecord
          setActivities(data as ActivityRecord[]);
        } else {
          console.error("Backend error:", data);
          setErrorMsg(data.message || `Feil fra server: ${response.status}`);
        }
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        setErrorMsg('Nettverksfeil eller feil ved henting av historikk.');
        // TODO (Forbedring): Bedre feilhåndtering
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities(); // Kall funksjonen for å hente data

    // Vi legger ikke inn noen dependencies her ([]) slik at effekten
    // kun kjører én gang når komponenten mounter.
    // TODO (Forbedring): Vurder å legge inn mekanisme for å laste på nytt (refresh)
  }, []); // Tom dependency array = kjører kun ved mount

  // --- Rendering ---

  if (isLoading) {
    return <p className="text-gray-500">Laster historikk...</p>;
  }

  if (errorMsg) {
    return <p className="text-red-600">Feil: {errorMsg}</p>;
  }

  if (activities.length === 0) {
    return <p className="text-gray-500">Ingen aktiviteter logget ennå.</p>;
  }

  // Viser listen hvis alt er OK og listen ikke er tom
  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id || Math.random()} className="p-3 border rounded bg-gray-50 text-sm text-gray-800">
          {/* Bruker activity.id som key hvis den finnes, ellers en random verdi (ikke ideelt for produksjon) */}
          <p><strong>Type:</strong> {activity.type}</p>
          <p><strong>Verdi:</strong> {activity.value} {activity.unit}</p>
          <p><strong>CO₂e:</strong> {activity.co2e?.toFixed(2)} kg</p>
          {activity.notes && <p><em>Notat:</em> {activity.notes}</p>}
          {/* <p>Tidspunkt: {JSON.stringify(activity.timestamp)}</p> Viser rå timestamp for nå */}
        </div>
      ))}
    </div>
  );
}