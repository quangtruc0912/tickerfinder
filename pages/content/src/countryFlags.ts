// Country name to flag data mapping - using data attributes for proper emoji rendering
export const COUNTRY_FLAGS: Record<string, { emoji: string; alt: string }> = {
  Afghanistan: { emoji: '🇦🇫', alt: 'AF' },
  Albania: { emoji: '🇦🇱', alt: 'AL' },
  Algeria: { emoji: '🇩🇿', alt: 'DZ' },
  Argentina: { emoji: '🇦🇷', alt: 'AR' },
  Australia: { emoji: '🇦🇺', alt: 'AU' },
  Austria: { emoji: '🇦🇹', alt: 'AT' },
  Bangladesh: { emoji: '🇧🇩', alt: 'BD' },
  Belgium: { emoji: '🇧🇪', alt: 'BE' },
  Brazil: { emoji: '🇧🇷', alt: 'BR' },
  Canada: { emoji: '🇨🇦', alt: 'CA' },
  Chile: { emoji: '🇨🇱', alt: 'CL' },
  China: { emoji: '🇨🇳', alt: 'CN' },
  Colombia: { emoji: '🇨🇴', alt: 'CO' },
  'Czech Republic': { emoji: '🇨🇿', alt: 'CZ' },
  Denmark: { emoji: '🇩🇰', alt: 'DK' },
  Egypt: { emoji: '🇪🇬', alt: 'EG' },
  Europe: { emoji: '🇪🇺', alt: 'EU' },
  Finland: { emoji: '🇫🇮', alt: 'FI' },
  France: { emoji: '🇫🇷', alt: 'FR' },
  Germany: { emoji: '🇩🇪', alt: 'DE' },
  Greece: { emoji: '🇬🇷', alt: 'GR' },
  'Hong Kong': { emoji: '🇭🇰', alt: 'HK' },
  Hungary: { emoji: '🇭🇺', alt: 'HU' },
  India: { emoji: '🇮🇳', alt: 'IN' },
  Indonesia: { emoji: '🇮🇩', alt: 'ID' },
  Iran: { emoji: '🇮🇷', alt: 'IR' },
  Iraq: { emoji: '🇮🇶', alt: 'IQ' },
  Ireland: { emoji: '🇮🇪', alt: 'IE' },
  Israel: { emoji: '🇮🇱', alt: 'IL' },
  Italy: { emoji: '🇮🇹', alt: 'IT' },
  Japan: { emoji: '🇯🇵', alt: 'JP' },
  Kenya: { emoji: '🇰🇪', alt: 'KE' },
  Malaysia: { emoji: '🇲🇾', alt: 'MY' },
  Mexico: { emoji: '🇲🇽', alt: 'MX' },
  Netherlands: { emoji: '🇳🇱', alt: 'NL' },
  'New Zealand': { emoji: '🇳🇿', alt: 'NZ' },
  Nigeria: { emoji: '🇳🇬', alt: 'NG' },
  Norway: { emoji: '🇳🇴', alt: 'NO' },
  Pakistan: { emoji: '🇵🇰', alt: 'PK' },
  Philippines: { emoji: '🇵🇭', alt: 'PH' },
  Poland: { emoji: '🇵🇱', alt: 'PL' },
  Portugal: { emoji: '🇵🇹', alt: 'PT' },
  Romania: { emoji: '🇷🇴', alt: 'RO' },
  Russia: { emoji: '🇷🇺', alt: 'RU' },
  'Saudi Arabia': { emoji: '🇸🇦', alt: 'SA' },
  Singapore: { emoji: '🇸🇬', alt: 'SG' },
  'South Africa': { emoji: '🇿🇦', alt: 'ZA' },
  Korea: { emoji: '🇰🇷', alt: 'KR' },
  'South Korea': { emoji: '🇰🇷', alt: 'KR' },
  Spain: { emoji: '🇪🇸', alt: 'ES' },
  Sweden: { emoji: '🇸🇪', alt: 'SE' },
  Switzerland: { emoji: '🇨🇭', alt: 'CH' },
  Taiwan: { emoji: '🇹🇼', alt: 'TW' },
  Thailand: { emoji: '🇹🇭', alt: 'TH' },
  Turkey: { emoji: '🇹🇷', alt: 'TR' },
  Ukraine: { emoji: '🇺🇦', alt: 'UA' },
  'United Arab Emirates': { emoji: '🇦🇪', alt: 'AE' },
  'United Kingdom': { emoji: '🇬🇧', alt: 'GB' },
  'United States': { emoji: '🇺🇸', alt: 'US' },
  Venezuela: { emoji: '🇻🇪', alt: 'VE' },
  Vietnam: { emoji: '🇻🇳', alt: 'VN' },
};

export function getCountryFlag(countryName: string): { emoji: string; alt: string } | null {
  if (!countryName) return null;

  // Try exact match first
  if (COUNTRY_FLAGS[countryName]) {
    return COUNTRY_FLAGS[countryName];
  }

  // Try case-insensitive match
  const normalized = countryName.trim();
  for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (country.toLowerCase() === normalized.toLowerCase()) {
      return flag;
    }
  }

  return null;
}

// Create a proper flag element that will render as an icon
export function createFlagElement(countryName: string): HTMLElement | null {
  const flagData = getCountryFlag(countryName);
  if (!flagData) return null;

  // Try creating an image-based flag first for better reliability
  const flagElement = document.createElement('img');
  const countryCode = flagData.alt.toLowerCase();

  // Use flag-icons.css CDN for reliable flag images
  flagElement.src = `https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/4x3/${countryCode}.svg`;
  flagElement.alt = flagData.emoji;
  flagElement.title = countryName;
  flagElement.setAttribute('data-country', flagData.alt);
  flagElement.setAttribute('data-twitter-flag', 'true');

  // Detect if we're on a tweet detail page for better styling
  const isDetailPage = window.location.pathname.includes('/status/');

  flagElement.style.cssText = `
    display: inline-block !important;
    width: 18px !important;
    height: 14px !important;
    margin: ${isDetailPage ? '0 6px 0 4px' : '0 4px'} !important;
    vertical-align: ${isDetailPage ? 'text-top' : 'middle'} !important;
    border: none !important;
    outline: none !important;
    background: transparent !important;
    object-fit: cover !important;
    border-radius: 2px !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: none !important;
    line-height: 1 !important;
    position: relative !important;
    ${isDetailPage ? 'top: 2px !important;' : ''}
  `;

  // Fallback to emoji if image fails to load
  flagElement.onerror = function () {
    const emojiElement = document.createElement('span');
    emojiElement.innerHTML = flagData.emoji;
    emojiElement.setAttribute('data-country', flagData.alt);
    emojiElement.setAttribute('data-twitter-flag', 'true');
    emojiElement.setAttribute('title', countryName);

    emojiElement.style.cssText = `
      display: inline-block !important;
      margin: ${isDetailPage ? '0 6px 0 4px' : '0 4px'} !important;
      font-size: 16px !important;
      line-height: 1 !important;
      vertical-align: ${isDetailPage ? 'text-top' : 'middle'} !important;
      font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiOne", "Twemoji Mozilla", "Twitter Color Emoji", "Segoe UI Symbol", "Android Emoji", "Noto Emoji", sans-serif !important;
      font-variant-emoji: emoji !important;
      text-rendering: optimizeQuality !important;
      -webkit-font-feature-settings: "liga" !important;
      font-feature-settings: "liga" !important;
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: none !important;
      position: relative !important;
      ${isDetailPage ? 'top: 2px !important;' : ''}
    `;

    // Replace the img element with the emoji element
    if (flagElement.parentNode) {
      flagElement.parentNode.replaceChild(emojiElement, flagElement);
    }
  };

  return flagElement;
}
