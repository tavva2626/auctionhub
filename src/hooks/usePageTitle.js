import { useEffect } from 'react';

/**
 * Custom hook to set document title dynamically
 * @param {string} pageTitle - The title to set for the page
 */
export function usePageTitle(pageTitle) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${pageTitle} | Auction Hub`;
    
    return () => {
      document.title = originalTitle;
    };
  }, [pageTitle]);
}
