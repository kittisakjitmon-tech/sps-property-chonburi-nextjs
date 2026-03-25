// Favorites System using localStorage - SSR Safe

const FAVORITES_KEY = 'sps_property_favorites';

// Check if we're on the client
function isClient(): boolean {
  return typeof window !== 'undefined';
}

// Safely access localStorage
function safeLocalStorage(): Storage | null {
  if (!isClient()) return null;
  return window.localStorage;
}

export function getFavorites(): string[] {
  try {
    const storage = safeLocalStorage();
    if (!storage) return [];
    const stored = storage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addFavorite(propertyId: string): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  
  const favorites = getFavorites();
  if (!favorites.includes(propertyId)) {
    favorites.push(propertyId);
    storage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(propertyId: string): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  
  const favorites = getFavorites();
  const updated = favorites.filter((id) => id !== propertyId);
  storage.setItem(FAVORITES_KEY, JSON.stringify(updated));
}

export function isFavorite(propertyId: string): boolean {
  if (!isClient()) return false;
  const favorites = getFavorites();
  return favorites.includes(propertyId);
}

export function toggleFavorite(propertyId: string): boolean {
  if (isFavorite(propertyId)) {
    removeFavorite(propertyId);
    return false;
  } else {
    addFavorite(propertyId);
    return true;
  }
}
