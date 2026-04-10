import { useState, useEffect, useCallback } from 'react';
import { getPinnedTeams, pinTeam, unpinTeam } from './api';
import type { PinnedTeam } from './api';

// Create a custom event target so we can dispatch global events and sync state across components
export const favoritesEventTarget = new EventTarget();

export function usePinnedTeams() {
  const [pinnedTeams, setPinnedTeams] = useState<PinnedTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPins = useCallback(async () => {
    try {
      const pins = await getPinnedTeams();
      setPinnedTeams(pins);
    } catch (err) {
      console.error('Failed to load pinned teams', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPins();

    const handleUpdate = () => {
      fetchPins();
    };

    favoritesEventTarget.addEventListener('favorites-updated', handleUpdate);
    return () => {
      favoritesEventTarget.removeEventListener('favorites-updated', handleUpdate);
    };
  }, [fetchPins]);

  const togglePin = async (teamId: number, isCurrentlyPinned: boolean) => {
    try {
      if (isCurrentlyPinned) {
        await unpinTeam(teamId);
      } else {
        await pinTeam(teamId);
      }
      favoritesEventTarget.dispatchEvent(new Event('favorites-updated'));
      return true;
    } catch (err: any) {
      console.error('Failed to toggle pinned team', err);
      throw err;
    }
  };

  const isPinned = (teamId: number) => {
    return pinnedTeams.some(pt => pt.teamId === teamId);
  };

  return { pinnedTeams, isLoading, togglePin, isPinned };
}
