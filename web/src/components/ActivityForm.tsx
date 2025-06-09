'use client';

import { useState, FormEvent } from 'react';
import { auth } from '@/lib/firebase/config';
import type { ActivityInput } from '@/types/activity.types';

const activityTypes = [
  { value: 'car_petrol_km', label: 'Bensinbil (km)' },
  { value: 'car_diesel_km', label: 'Dieselbil (km)' },
  { value: 'car_electric_km', label: 'Elbil (km)' },
  { value: 'bus_local_km', label: 'Lokal Buss (km)' },
  { value: 'train_national_km', label: 'Nasjonalt Tog (km)' },
  { value: 'flight_domestic_km', label: 'Innenlandsfly (km)' },
  { value: 'electricity_kwh', label: 'Strømforbruk (kWh)' },
  { value: 'district_heating_kwh', label: 'Fjernvarme (kWh)' },
  { value: 'food_beef_kg', label: 'Storfekjøtt (kg)' },
  { value: 'food_pork_kg', label: 'Svinekjøtt (kg)' },
  { value: 'food_poultry_kg', label: 'Kylling/Fjærkre (kg)' },
  { value: 'food_fish_kg', label: 'Fisk (kg)' },
  { value: 'food_dairy_kg', label: 'Meieriprodukter (kg)' },
];

export default function ActivityForm() {
  const [type, setType] = useState<string>(activityTypes[0].value);
  const [value, setValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultCo2e, setResultCo2e] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResultCo2e(null);
    setErrorMsg(null);

    if (!auth.currentUser) {
      setErrorMsg('Feil: Du må være logget inn.');
      setIsLoading(false);
      return;
    }
    let token: string | null = null;
    try {
      token = await auth.currentUser.getIdToken(true);
    } catch (tokenError) {
      console.error("Error getting ID token:", tokenError);
      setErrorMsg('Kunne ikke hente autentiseringstoken. Prøv å logge ut og inn igjen.');
      setIsLoading(false);
      return;
    }
    if (!token) {
       setErrorMsg('Kunne ikke hente autentiseringstoken. Prøv å logge ut og inn igjen.');
       setIsLoading(false);
       return;
    }

    let unitToSend: string = '';
    const numericValue = parseFloat(value);

    if (isNaN(numericValue) || numericValue <= 0) {
        setErrorMsg('Verdi må være et positivt tall.');
        setIsLoading(false);
        return;
    }

    if (type.endsWith('_km')) {
      unitToSend = 'km';
    } else if (type.endsWith('_kwh')) {
      unitToSend = 'kWh';
    } else if (type.endsWith('_kg')) {
      unitToSend = 'kg';
    } else {
      console.error("Kunne ikke bestemme enhet for type:", type);
      setErrorMsg(`Ukjent enhet for aktivitetstypen ${type}.`);
      setIsLoading(false);
      return;
    }

    const activityInput: ActivityInput = {
      type: type,
      value: numericValue,
      unit: unitToSend,
      notes: notes || undefined,
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL is not defined. Check NEXT_PUBLIC_API_URL environment variable.");
      }

      const response = await fetch(`${apiUrl}/api/activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityInput),
      });

      const data = await response.json();

      if (response.ok) {
        setResultCo2e(data.calculatedCo2e);
        setValue('');
        setNotes('');
      } else {
        console.error("Backend error:", data);
        setErrorMsg(data.message || `Feil fra server: ${response.status} ${response.statusText}`);
      }
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      setErrorMsg('Nettverksfeil eller feil ved kommunikasjon med server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="activityType" className="block text-sm font-medium text-gray-700">
          Aktivitetstype:
        </label>
        <select
          id="activityType"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setResultCo2e(null);
            setErrorMsg(null);
          }}
          required
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
        >
          {activityTypes.map((activity) => (
            <option key={activity.value} value={activity.value}>
              {activity.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="activityValue" className="block text-sm font-medium text-gray-700">
          Mengde / Verdi:
          <span className="text-xs text-gray-500 ml-1">
            ({type.endsWith('_km') ? 'km' : type.endsWith('_kwh') ? 'kWh' : type.endsWith('_kg') ? 'kg' : ''})
          </span>
        </label>
        <input
          type="number"
          id="activityValue"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          step="any"
          min="0.00001"
          placeholder="Skriv inn tall"
          className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="activityNotes" className="block text-sm font-medium text-gray-700">
          Notater (valgfritt):
        </label>
        <textarea
          id="activityNotes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Legg til en kommentar..."
          className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Beregner...' : 'Loggfør og Beregn Utslipp'}
        </button>
      </div>

      <div className="mt-4 text-center min-h-[2em]"> {/* Added min-h to prevent layout shift */}
        {resultCo2e !== null && (
          <p className="text-green-600 font-semibold">
            Beregnet utslipp: {resultCo2e.toFixed(2)} kg CO₂e
          </p>
        )}
        {errorMsg && (
          <p className="text-red-600">{errorMsg}</p>
        )}
      </div>
    </form>
  );
}