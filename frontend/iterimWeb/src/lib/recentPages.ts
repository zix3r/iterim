import { fetchWithAuth } from './api';

export interface RecentPage {
  path: string;
  label: string;
  iconType: string;
  accessedAt?: string;
}

const RECENT_PAGES_EVENT = 'recentPagesUpdated';

export async function getRecentPages(): Promise<RecentPage[]> {
  try {
    const res = await fetchWithAuth('/users/me/recent-pages');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to get recent pages', err);
  }
  return [];
}

export async function addRecentPage(page: RecentPage) {
  try {
    const res = await fetchWithAuth('/users/me/recent-pages', {
      method: 'PUT',
      body: JSON.stringify(page),
    });
    if (res.ok) {
      window.dispatchEvent(new Event(RECENT_PAGES_EVENT));
    }
  } catch (err) {
    console.error('Failed to add recent page', err);
  }
}

export async function clearRecentPages() {
  try {
    const res = await fetchWithAuth('/users/me/recent-pages', {
      method: 'DELETE'
    });
    if (res.ok) {
      window.dispatchEvent(new Event(RECENT_PAGES_EVENT));
    }
  } catch (err) {
    console.error('Failed to clear recent pages', err);
  }
}
