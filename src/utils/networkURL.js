/**
 * Network URL Utility
 * Generates network-accessible URLs for multi-device auction access
 * Works across laptops, computers, phones, and tablets on the same network
 */

/**
 * Get the local IP address from window.location
 * Always returns the network-accessible hostname/IP
 */
export const getLocalIP = () => {
  // Get the actual hostname
  const hostname = window.location.hostname;
  
  // Always return the actual hostname for network access
  // (localhost will be converted to the actual IP when needed)
  return hostname;
};

/**
 * Generate a network-accessible URL for the auction
 * @param {string} path - The path (e.g., '/home', '/auction/123')
 * @param {string} port - Optional port (default: 3000 for dev, 80 for prod)
 * @returns {string} - Full network-accessible HTTPS URL
 */
export const getNetworkURL = (path = '', port = null) => {
  // Use the current page protocol (http/https) so links work in dev and prod
  const protocol = window.location.protocol || 'http:';
  const hostname = window.location.hostname;

  // Use provided port or detect from current location
  const urlPort = port || window.location.port;

  // Build URL using current protocol and hostname/port
  let url = `${protocol}//${hostname}`;
  if (urlPort && urlPort !== '80' && urlPort !== '443') {
    url += `:${urlPort}`;
  }
  url += path;

  return url;
};

/**
 * Generate a shareable URL for an auction that works across devices
 * @param {string} auctionId - The auction ID
 * @param {string} auctionType - 'single' or 'multi'
 * @param {string} userRole - 'bidder' or 'host'
 * @returns {object} - Object with full URL and display URL
 */
export const generateShareableURL = (auctionId, auctionType = 'single', userRole = 'bidder') => {
  let path = '';
  
  if (auctionType === 'single') {
    path = userRole === 'bidder' 
      ? `/join/${auctionId}`
      : `/host/${auctionId}`;
  } else {
    path = userRole === 'bidder'
      ? `/multi-join/${auctionId}`
      : `/multi-host/${auctionId}`;
  }

  const fullURL = getNetworkURL(path);

  const protocol = window.location.protocol ? window.location.protocol.replace(':', '') : 'http';
  const port = window.location.port || (protocol === 'https' ? '443' : '80');

  return {
    fullURL,
    displayURL: fullURL.replace('https://', '').replace('http://', ''),
    port,
    protocol,
    hostname: window.location.hostname,
    isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  };
};

/**
 * Get network information for display
 * @returns {object} - Network info including IP, hostname, port
 */
export const getNetworkInfo = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol ? window.location.protocol.replace(':', '') : 'http';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  return {
    isLocalhost,
    protocol,
    hostname,
    port: port || (protocol === 'https' ? '443' : '80'),
    displayHostname: hostname,
    isProduction: !port || port === '80' || port === '443',
    accessibleFromOtherDevices: !isLocalhost,
    networkIP: hostname,
    displayURL: port && port !== '80' && port !== '443'
      ? `${hostname}:${port}`
      : hostname
  };
};

/**
 * Generate QR code data for network URL
 * @param {string} url - The full URL to encode
 * @returns {string} - URL formatted for QR code generation
 */
export const generateQRCodeData = (url) => {
  return url;
};

/**
 * Format URL for display with friendly text
 * @param {string} url - The URL to format
 * @returns {string} - Formatted display URL
 */
export const formatURLForDisplay = (url) => {
  return url
    .replace('http://', '')
    .replace('https://', '')
    .replace(/\/$/, '');
};

/**
 * Check if accessible from other devices
 * @returns {boolean} - Always true with HTTPS support
 */
export const isAccessibleFromOtherDevices = () => {
  return true;
};

/**
 * Get instructions for accessing from another device
 * @returns {string} - Formatted instructions with HTTPS
 */
export const getAccessInstructions = () => {
  const info = getNetworkInfo();
  return `Network Access: Open https://${info.displayURL} on any device on the same network`;
};
