export function isNativeCapacitorApp(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return Boolean(win.Capacitor?.isNativePlatform?.());
}

export function hasRemoteApi(): boolean {
  const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (configuredBase) return true;
  return !isNativeCapacitorApp();
}

export function apiUrl(path: string): string {
  const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (configuredBase) {
    return `${configuredBase.replace(/\/+$/, '')}${path}`;
  }
  return path;
}
