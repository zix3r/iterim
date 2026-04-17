import { useState } from 'react';

export function useNavExpansion(storageKey: string, autoOpen: boolean): [boolean, () => void] {
  const [stored, setStored] = useState<boolean>(() => {
    const val = localStorage.getItem(storageKey);
    return val === '1';
  });

  const expanded = autoOpen || stored;

  const toggle = () => {
    const next = !expanded;
    localStorage.setItem(storageKey, next ? '1' : '0');
    setStored(next);
  };

  return [expanded, toggle];
}
