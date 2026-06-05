import {create} from 'zustand';

interface RecentSearch {
  id: string;
  label: string;
  category: string;
  params: Record<string, unknown>;
}

interface AppStore {
  recentSearches: RecentSearch[];
  unreadCount: number;
  addRecentSearch: (item: RecentSearch) => void;
  markAllRead: () => void;
  decrementUnread: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  recentSearches: [],
  unreadCount: 3,

  addRecentSearch: (item: RecentSearch) => {
    const existing = get().recentSearches.filter(s => s.id !== item.id);
    const updated = [item, ...existing].slice(0, 3);
    set({recentSearches: updated});
  },

  markAllRead: () => set({unreadCount: 0}),

  decrementUnread: () =>
    set(state => ({unreadCount: Math.max(0, state.unreadCount - 1)})),
}));
