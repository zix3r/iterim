import { useContext } from 'react';
import { MyTeamsTreeContext } from '@/context/MyTeamsTreeContext';

export function useMyTeamsTree() {
  const ctx = useContext(MyTeamsTreeContext);
  if (!ctx) {
    throw new Error('useMyTeamsTree must be used within MyTeamsTreeProvider');
  }
  return ctx;
}
