
import { useEffect, useState } from 'react';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

// État React sauvegardé dans le navigateur (localStorage). Si le stockage est
// indisponible (navigation privée, aperçu), l'état reste simplement en mémoire.
export const usePersistentState = <T,>(key: string, fallback: T) => {
  const [value, setValue] = useState<T>(() => read(key, fallback));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // stockage indisponible
    }
  }, [key, value]);

  return [value, setValue] as const;
};
