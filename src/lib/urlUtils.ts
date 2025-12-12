/**
 * URL utility functions for cross-device sharing
 * Handles both localhost (dev) and network IP (mobile testing) scenarios
 */

export function getNetworkUrl(path: string = ''): string {
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  // For localhost, we need to use the network IP
  // The dev server will display something like: "➜  Network: http://192.168.X.X:8080/"
  // For now, we'll provide a helper that users can configure
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // In development, return localhost URL
    // Users scanning QR codes on mobile should manually replace 'localhost' with their network IP
    // Or set the VITE_NETWORK_URL environment variable
    
    const networkUrl = import.meta.env.VITE_NETWORK_URL;
    if (networkUrl) {
      // Use configured network URL (e.g., http://192.168.0.158:8080)
      return `${networkUrl}${path}`;
    }
    
    // Fallback: return localhost URL
    // This will work for same-device testing but not for mobile on same network
    return `http://${hostname}${port}${path}`;
  }
  
  // If already accessing via network IP or production URL, use origin
  const baseUrl = window.location.origin;
  return `${baseUrl}${path}`;
}

/**
 * Generate a shareable link that works across devices
 * On mobile networks, this should use the network IP not localhost
 * 
 * Example: 
 *   Development: http://192.168.0.158:8080/connect?code=VEN-ABC12345
 *   Production: https://example.com/connect?code=VEN-ABC12345
 */
export function generateShareableLink(code: string): string {
  return getNetworkUrl(`/connect?code=${code}`);
}

/**
 * Get a human-readable URL hint for users
 * Useful for displaying in UI where user can manually update if needed
 */
export function getNetworkUrlHint(): string {
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const networkUrl = import.meta.env.VITE_NETWORK_URL;
    if (networkUrl) {
      return `Using network URL: ${networkUrl}`;
    }
    
    // Check if there's a possible network IP we can suggest
    // In your case: 192.168.0.158:8080
    return `Development mode: For mobile QR scanning, set VITE_NETWORK_URL to your network IP (e.g., http://192.168.0.158${port})`;
  }
  
  return `Production mode: Using ${window.location.origin}`;
}
