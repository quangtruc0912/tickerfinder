import { toggleTheme } from '@src/toggleTheme';
import { TICKER_PROCESSED, HIGHTLIGHTED_COLOR, injectReact, ArrowDirection } from '@extension/shared';

import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { createRoot } from 'react-dom/client';
import _ from 'lodash';
import TickerPopup from '@src/TickerPopup';
import { settingStorage, PRIORITYCHAINLIST } from '@extension/storage';
import SearchModal from '@src/SearchModal';
import { getCountryFlag, createFlagElement } from '@src/countryFlags';

const TWITTER_USER_PROCESSED = '__TWITTER_USER_PROCESSED';
const TWITTER_FLAG_PROCESSED = '__TWITTER_FLAG_PROCESSED';

// Twitter location cache
let locationCache = new Map<string, string | null>();
const CACHE_KEY = 'twitter_location_cache';
const CACHE_EXPIRY_DAYS = 30;

// Rate limiting
interface QueueItem {
  screenName: string;
  resolve: (value: string | null) => void;
  reject: (error: any) => void;
}
const requestQueue: QueueItem[] = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
const MAX_CONCURRENT_REQUESTS = 2;
let activeRequests = 0;
let rateLimitResetTime = 0; // Unix timestamp when rate limit resets

// Track usernames currently being processed
const processingUsernames = new Set<string>();
let observer: MutationObserver | null = null;

const isTwitterSite = (): boolean => {
  return window.location.hostname === 'twitter.com' || window.location.hostname === 'x.com';
};

const injectTicker = async () => {
  const regexStr = /\$(\w)+/g;

  //FIND FROM A , COULD BE DIV AND SPAN NEXT, EACH HAVE DIF WAY TO IMPLEMENT
  const aNodes = Array.from(document.querySelectorAll('a'));

  var tickerNodes = [
    ...aNodes.map(node => ({
      node,
      type: 'a',
    })),
  ] as {
    node: HTMLElement;
    type: string;
  }[];

  var filteredTickers = tickerNodes.filter(el => el.node.textContent && el.node.textContent.match(regexStr));

  filteredTickers.forEach(async ({ node, type }) => {
    if (node.dataset[TICKER_PROCESSED]) return;

    //FIND BETTER SOLUTION FOR DIR/ LTR JUST TEMPORARY
    if (type === 'a' && node.dir == 'ltr') {
      const setting = await settingStorage.getSetting();
      node.dataset[TICKER_PROCESSED] = '1';
      node.dataset.popupText = node?.textContent ?? undefined;
      node.style.backgroundColor = !setting.tickerBackgroundColor ? HIGHTLIGHTED_COLOR : setting.tickerBackgroundColor;
    }
  });
};

function getUniqueTextContentFromPriority(
  elements: HTMLElement[],
  priorityChainList: readonly [string, string][],
): string[] {
  const priorityKeys = new Set(priorityChainList.map(([key]) => key));
  const uniqueTexts = new Set<string>();
  elements.forEach(element => {
    if (element && element.textContent) {
      const text = element.textContent.trim().toUpperCase().substring(1);

      if (text && priorityKeys.has(text)) {
        uniqueTexts.add(text);
      }
    }
  });

  // Convert the set to an array for the result
  return Array.from(uniqueTexts);
}

const renderIndicator = (ele: HTMLElement, percentChange: number) => {
  let span = ele.querySelector('span[data-arrow]') as HTMLElement | null;
  ele.style.display = 'inline-flex';
  ele.style.alignItems = 'center';
  const arrowDirection: ArrowDirection = percentChange > 0 ? 'up' : 'down';
  if (!span) {
    span = document.createElement('span');
    span.setAttribute('data-arrow', 'true');
    span.style.display = 'inline-flex'; // Use flexbox for alignment
    span.style.alignItems = 'center'; // Vertical centering
    arrowDirection === 'up' ? (span.style.color = 'green') : (span.style.color = 'red');
    ele.appendChild(span);
  }

  span.innerHTML = ' ';
  // Create a container for the icon and render it
  const iconContainer = document.createElement('span');
  iconContainer.style.display = 'flex'; // Flexbox ensures proper alignment
  iconContainer.style.alignItems = 'center'; // Center vertically
  iconContainer.style.justifyContent = 'center';
  span.appendChild(iconContainer);

  const root = createRoot(iconContainer);
  root.render(arrowDirection === 'up' ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />);
};

const injectIndicating = async () => {
  const regexStr = /\$(\w)+/g;

  //FIND FROM A , COULD BE DIV AND SPAN NEXT, EACH HAVE DIF WAY TO IMPLEMENT
  const elements = Array.from(document.querySelectorAll('a'));

  const spans = Array.from(document.querySelectorAll('span'));

  var filteredSpan = spans.filter(el => el.textContent && el.textContent.match(regexStr) && el.dataset.popupText);

  var filteredElements = elements.filter(
    el => el.textContent && el.textContent.match(regexStr) && el.dataset[TICKER_PROCESSED],
  );

  var uniqueTickersElements = getUniqueTextContentFromPriority(filteredElements, PRIORITYCHAINLIST);

  var uniqueTickersSpan = getUniqueTextContentFromPriority(filteredSpan, PRIORITYCHAINLIST);

  var uniqueTickers = uniqueTickersElements.concat(uniqueTickersSpan);

  uniqueTickers.forEach((ticker: string) => {
    chrome.runtime.sendMessage({ type: 'FETCH_KUCOIN', ticker }, response => {
      if (response.data) {
        filteredElements.forEach(element => {
          let temp = element.textContent?.toUpperCase().substring(1);
          if (temp === ticker) {
            renderIndicator(element, response.data.changeRate);
          }
        });
      } else {
        console.error('Error:', response.error);
      }
    });
  });
};

// Load cache from persistent storage
async function loadCache() {
  try {
    if (!chrome.runtime?.id) {
      console.log('Extension context invalidated, skipping cache load');
      return;
    }

    const result = await chrome.storage.local.get(CACHE_KEY);
    if (result[CACHE_KEY]) {
      const cached = result[CACHE_KEY] as Record<string, { location: string | null; expiry: number; cachedAt: number }>;
      const now = Date.now();

      // Filter out expired entries and null entries (allow retry)
      for (const [username, data] of Object.entries(cached)) {
        if (data.expiry && data.expiry > now && data.location !== null) {
          locationCache.set(username, data.location);
        }
      }
      console.log(`Loaded ${locationCache.size} cached locations (excluding null entries)`);
    }
  } catch (error: any) {
    if (error.message?.includes('Extension context invalidated') || error.message?.includes('message port closed')) {
      console.log('Extension context invalidated, cache load skipped');
    } else {
      console.error('Error loading cache:', error);
    }
  }
}

// Save cache to persistent storage
async function saveCache() {
  try {
    if (!chrome.runtime?.id) {
      console.log('Extension context invalidated, skipping cache save');
      return;
    }

    const cacheObj: Record<string, { location: string | null; expiry: number; cachedAt: number }> = {};
    const now = Date.now();
    const expiry = now + CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    for (const [username, location] of locationCache.entries()) {
      cacheObj[username] = {
        location: location,
        expiry: expiry,
        cachedAt: now,
      };
    }

    await chrome.storage.local.set({ [CACHE_KEY]: cacheObj });
  } catch (error: any) {
    if (error.message?.includes('Extension context invalidated') || error.message?.includes('message port closed')) {
      console.log('Extension context invalidated, cache save skipped');
    } else {
      console.error('Error saving cache:', error);
    }
  }
}

// Save a single entry to cache
async function saveCacheEntry(username: string, location: string | null) {
  if (!chrome.runtime?.id) {
    console.log('Extension context invalidated, skipping cache entry save');
    return;
  }

  locationCache.set(username, location);
  // Debounce saves - only save every 5 seconds
  if (!(saveCache as any).timeout) {
    (saveCache as any).timeout = setTimeout(async () => {
      await saveCache();
      (saveCache as any).timeout = null;
    }, 5000);
  }
}

// Inject script into page context to access fetch with proper cookies
function injectPageScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('twitterPageScript.js');
  script.onload = function () {
    (this as HTMLScriptElement).remove();
  };
  (document.head || document.documentElement).appendChild(script);

  // Listen for rate limit info from page script
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window) return;
    if (event.data && event.data.type === '__twitterRateLimitInfo') {
      rateLimitResetTime = event.data.resetTime;
      const waitTime = event.data.waitTime;
      console.log(`Rate limit detected. Will resume requests in ${Math.ceil(waitTime / 1000 / 60)} minutes`);

      // Clean up all existing shimmers when rate limited
      cleanupAllShimmers();
    }
  });
}

// Clean up all shimmer elements when rate limited
function cleanupAllShimmers() {
  const shimmers = document.querySelectorAll('[data-twitter-flag-shimmer="true"]');
  console.log(`Cleaning up ${shimmers.length} shimmer elements due to rate limiting`);

  shimmers.forEach(shimmer => {
    try {
      // Find the associated username element and mark it for retry
      const usernameElement = shimmer.closest(
        '[data-testid="User-Name"], [data-testid="UserName"], article[data-testid="tweet"]',
      );
      if (usernameElement) {
        // Reset processing state so it can be retried later
        delete (usernameElement as HTMLElement).dataset[TWITTER_FLAG_PROCESSED];

        // Extract username and remove from processing set
        const username = extractUsername(usernameElement as HTMLElement);
        if (username) {
          processingUsernames.delete(username);
        }
      }

      shimmer.remove();
    } catch (e) {
      console.log('Error removing shimmer:', e);
    }
  });
}

// Process request queue with rate limiting
async function processRequestQueue() {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  // Check if we're rate limited
  if (rateLimitResetTime > 0) {
    const now = Math.floor(Date.now() / 1000);
    if (now < rateLimitResetTime) {
      const waitTime = (rateLimitResetTime - now) * 1000;
      console.log(`Rate limited. Waiting ${Math.ceil(waitTime / 1000 / 60)} minutes...`);

      // Clean up shimmers when we detect we're still rate limited
      cleanupAllShimmers();

      setTimeout(processRequestQueue, Math.min(waitTime, 60000)); // Check every minute max
      return;
    } else {
      // Rate limit expired, reset
      rateLimitResetTime = 0;
    }
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    // Wait if needed to respect rate limit
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }

    const item = requestQueue.shift();
    if (!item) break;
    const { screenName, resolve, reject } = item;
    activeRequests++;
    lastRequestTime = Date.now();

    // Make the request
    makeLocationRequest(screenName)
      .then(location => {
        resolve(location);
      })
      .catch(error => {
        reject(error);
      })
      .finally(() => {
        activeRequests--;
        // Continue processing queue
        setTimeout(processRequestQueue, 200);
      });
  }

  isProcessingQueue = false;
}

// Make actual API request
function makeLocationRequest(screenName: string) {
  return new Promise<string | null>((resolve, reject) => {
    const requestId = Date.now() + Math.random();

    // Listen for response via postMessage
    const handler = (event: MessageEvent) => {
      // Only accept messages from the page (not from extension)
      if (event.source !== window) return;

      if (
        event.data &&
        event.data.type === '__twitterLocationResponse' &&
        event.data.screenName === screenName &&
        event.data.requestId === requestId
      ) {
        window.removeEventListener('message', handler);
        const location = event.data.location;
        const isRateLimited = event.data.isRateLimited || false;

        // Only cache if not rate limited (don't cache failures due to rate limiting)
        if (!isRateLimited) {
          saveCacheEntry(screenName, location || null);
        } else {
          console.log(`Not caching null for ${screenName} due to rate limit`);
        }

        resolve(location || null);
      }
    };
    window.addEventListener('message', handler);

    // Send fetch request to page script via postMessage
    window.postMessage(
      {
        type: '__fetchTwitterLocation',
        screenName,
        requestId,
      },
      '*',
    );

    // Timeout after 10 seconds
    setTimeout(() => {
      window.removeEventListener('message', handler);
      // Don't cache timeout failures - allow retry
      console.log(`Request timeout for ${screenName}, not caching`);
      resolve(null);
    }, 10000);
  });
}

// Function to query Twitter GraphQL API for user location (with rate limiting)
async function getUserLocation(screenName: string): Promise<string | null> {
  // Check cache first
  if (locationCache.has(screenName)) {
    const cached = locationCache.get(screenName);
    // Don't return cached null - retry if it was null before (might have been rate limited)
    if (cached !== null && cached !== undefined) {
      console.log(`Using cached location for ${screenName}: ${cached}`);
      return cached;
    } else {
      console.log(`Found null in cache for ${screenName}, will retry API call`);
      // Remove from cache to allow retry
      locationCache.delete(screenName);
    }
  }

  console.log(`Queueing API request for ${screenName}`);
  // Queue the request
  return new Promise<string | null>((resolve, reject) => {
    requestQueue.push({ screenName, resolve, reject });
    processRequestQueue();
  });
}

// Function to extract username from various Twitter UI elements
function extractUsername(element: HTMLElement): string | null {
  // Try data-testid="UserName" or "User-Name" first (most reliable)
  const usernameElement = element.querySelector('[data-testid="UserName"], [data-testid="User-Name"]');
  if (usernameElement) {
    const links = Array.from(usernameElement.querySelectorAll('a[href^="/"]'));
    for (const link of links) {
      const href = (link as HTMLAnchorElement).getAttribute('href');
      const match = href?.match(/^\/([^\/\?]+)/);
      if (match && match[1]) {
        const username = match[1];
        // Filter out common routes
        const excludedRoutes = [
          'home',
          'explore',
          'notifications',
          'messages',
          'i',
          'compose',
          'search',
          'settings',
          'bookmarks',
          'lists',
          'communities',
        ];
        if (
          !excludedRoutes.includes(username) &&
          !username.startsWith('hashtag') &&
          !username.startsWith('search') &&
          username.length > 0 &&
          username.length < 20
        ) {
          // Usernames are typically short
          return username;
        }
      }
    }
  }

  // Try finding username links in the entire element (broader search)
  const allLinks = Array.from(element.querySelectorAll('a[href^="/"]'));
  const seenUsernames = new Set();

  for (const link of allLinks) {
    const href = (link as HTMLAnchorElement).getAttribute('href');
    if (!href) continue;

    const match = href.match(/^\/([^\/\?]+)/);
    if (!match || !match[1]) continue;

    const potentialUsername = match[1];

    // Skip if we've already checked this username
    if (seenUsernames.has(potentialUsername)) continue;
    seenUsernames.add(potentialUsername);

    // Filter out routes and invalid usernames
    const excludedRoutes = [
      'home',
      'explore',
      'notifications',
      'messages',
      'i',
      'compose',
      'search',
      'settings',
      'bookmarks',
      'lists',
      'communities',
      'hashtag',
    ];
    if (excludedRoutes.some(route => potentialUsername === route || potentialUsername.startsWith(route))) {
      continue;
    }

    // Skip status/tweet links
    if (potentialUsername.includes('status') || potentialUsername.match(/^\d+$/)) {
      continue;
    }

    // Check link text/content for username indicators
    const text = link.textContent?.trim() || '';
    const linkText = text.toLowerCase();
    const usernameLower = potentialUsername.toLowerCase();

    // If link text starts with @, it's definitely a username
    if (text.startsWith('@')) {
      return potentialUsername;
    }

    // If link text matches the username (without @), it's likely a username
    if (linkText === usernameLower || linkText === `@${usernameLower}`) {
      return potentialUsername;
    }

    // Check if link is in a UserName container or has username-like structure
    const parent = link.closest('[data-testid="UserName"], [data-testid="User-Name"]');
    if (parent) {
      // If it's in a UserName container and looks like a username, return it
      if (potentialUsername.length > 0 && potentialUsername.length < 20 && !potentialUsername.includes('/')) {
        return potentialUsername;
      }
    }

    // Also check if link text is @username format
    if (text && text.trim().startsWith('@')) {
      const atUsername = text.trim().substring(1);
      if (atUsername === potentialUsername) {
        return potentialUsername;
      }
    }
  }

  // Last resort: look for @username pattern in text content and verify with link
  const textContent = element.textContent || '';
  const atMentionMatches = textContent.matchAll(/@([a-zA-Z0-9_]+)/g);
  for (const match of atMentionMatches) {
    const username = match[1];
    // Verify it's actually a link in a User-Name container
    const link = element.querySelector(`a[href="/${username}"], a[href^="/${username}?"]`);
    if (link) {
      // Make sure it's in a username context, not just mentioned in tweet text
      const isInUserNameContainer = link.closest('[data-testid="UserName"], [data-testid="User-Name"]');
      if (isInUserNameContainer) {
        return username;
      }
    }
  }

  return null;
}

// Helper function to find handle section
function findHandleSection(container: HTMLElement, screenName: string): HTMLElement | null {
  return (
    Array.from(container.querySelectorAll('div')).find(div => {
      const link = div.querySelector(`a[href="/${screenName}"]`);
      if (link) {
        const text = link.textContent?.trim();
        return text === `@${screenName}`;
      }
      return false;
    }) || null
  );
}

// Create loading shimmer placeholder
function createLoadingShimmer(): HTMLElement {
  const shimmer = document.createElement('span');
  shimmer.setAttribute('data-twitter-flag-shimmer', 'true');
  shimmer.style.display = 'inline-block';
  shimmer.style.width = '20px';
  shimmer.style.height = '16px';
  shimmer.style.marginLeft = '4px';
  shimmer.style.marginRight = '4px';
  shimmer.style.verticalAlign = 'middle';
  shimmer.style.borderRadius = '2px';
  shimmer.style.background =
    'linear-gradient(90deg, rgba(113, 118, 123, 0.2) 25%, rgba(113, 118, 123, 0.4) 50%, rgba(113, 118, 123, 0.2) 75%)';
  shimmer.style.backgroundSize = '200% 100%';
  shimmer.style.animation = 'shimmer 1.5s infinite';

  // Add animation keyframes if not already added
  if (!document.getElementById('twitter-flag-shimmer-style')) {
    const style = document.createElement('style');
    style.id = 'twitter-flag-shimmer-style';
    style.textContent = `
      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  return shimmer;
}

// Function to add flag to username element
async function addFlagToUsername(usernameElement: HTMLElement, screenName: string) {
  // Check if flag already added
  if (usernameElement.dataset[TWITTER_FLAG_PROCESSED] === 'true') {
    return;
  }

  // Check if this username is already being processed (prevent duplicate API calls)
  if (processingUsernames.has(screenName)) {
    // Wait a bit and check if flag was added by the other process
    await new Promise(resolve => setTimeout(resolve, 500));
    if (usernameElement.dataset[TWITTER_FLAG_PROCESSED] === 'true') {
      return;
    }
    // If still not added, mark this container as waiting
    usernameElement.dataset[TWITTER_FLAG_PROCESSED] = 'waiting';
    return;
  }

  // Mark as processing to avoid duplicate requests
  usernameElement.dataset[TWITTER_FLAG_PROCESSED] = 'processing';
  processingUsernames.add(screenName);

  // Find User-Name container for shimmer placement
  const userNameContainer = usernameElement.querySelector(
    '[data-testid="UserName"], [data-testid="User-Name"]',
  ) as HTMLElement;

  // Create and insert loading shimmer
  const shimmerSpan = createLoadingShimmer();
  let shimmerInserted = false;

  if (userNameContainer) {
    // Try to insert shimmer before handle section (same place flag will go)
    const handleSection = findHandleSection(userNameContainer, screenName);
    if (handleSection && handleSection.parentNode) {
      try {
        handleSection.parentNode.insertBefore(shimmerSpan, handleSection);
        shimmerInserted = true;
      } catch (e) {
        // Fallback: insert at end of container
        try {
          userNameContainer.appendChild(shimmerSpan);
          shimmerInserted = true;
        } catch (e2) {
          console.log('Failed to insert shimmer');
        }
      }
    } else {
      // Fallback: insert at end of container
      try {
        userNameContainer.appendChild(shimmerSpan);
        shimmerInserted = true;
      } catch (e) {
        console.log('Failed to insert shimmer');
      }
    }
  }

  try {
    console.log(`Processing flag for ${screenName}...`);

    // Get location
    const location = await getUserLocation(screenName);
    console.log(`Location for ${screenName}:`, location);

    // Remove shimmer
    if (shimmerInserted && shimmerSpan.parentNode) {
      shimmerSpan.remove();
    }

    if (!location) {
      console.log(`No location found for ${screenName}, marking as failed`);
      usernameElement.dataset[TWITTER_FLAG_PROCESSED] = 'failed';
      return;
    }

    // Get flag element
    const flagElement = createFlagElement(location);
    if (!flagElement) {
      console.log(`No flag found for location: ${location}`);
      // Shimmer already removed above, but ensure it's gone
      if (shimmerInserted && shimmerSpan.parentNode) {
        shimmerSpan.remove();
      }
      usernameElement.dataset[TWITTER_FLAG_PROCESSED] = 'failed';
      return;
    }

    console.log(`Found flag element for ${screenName} (${location})`);

    // Find the username link - try multiple strategies
    // Priority: Find the @username link, not the display name link
    let usernameLink = null;

    // Find the User-Name container (reuse from above if available, otherwise find it)
    const containerForLink =
      userNameContainer || usernameElement.querySelector('[data-testid="UserName"], [data-testid="User-Name"]');

    // Strategy 1: Find link with @username text content (most reliable - this is the actual handle)
    if (containerForLink) {
      const containerLinks = Array.from(containerForLink.querySelectorAll('a[href^="/"]'));
      for (const link of containerLinks) {
        const text = (link as HTMLElement).textContent?.trim();
        const href = (link as HTMLAnchorElement).getAttribute('href');
        const match = href?.match(/^\/([^\/\?]+)/);

        // Prioritize links that have @username as text
        if (match && match[1] === screenName) {
          if (text === `@${screenName}` || text === screenName) {
            usernameLink = link as HTMLElement;
            break;
          }
        }
      }
    }

    // Strategy 2: Find any link with @username text in UserName container
    if (!usernameLink && containerForLink) {
      const containerLinks = Array.from(containerForLink.querySelectorAll('a[href^="/"]'));
      for (const link of containerLinks) {
        const text = (link as HTMLElement).textContent?.trim();
        if (text === `@${screenName}`) {
          usernameLink = link as HTMLElement;
          break;
        }
      }
    }

    // Strategy 3: Find link with exact matching href that has @username text anywhere in element
    if (!usernameLink) {
      const links = Array.from(usernameElement.querySelectorAll('a[href^="/"]'));
      for (const link of links) {
        const href = (link as HTMLAnchorElement).getAttribute('href');
        const match = href?.match(/^\/([^\/\?]+)/);
        if (match && match[1] === screenName) {
          const text = (link as HTMLElement).textContent?.trim();
          if (
            href &&
            (href === `/${screenName}` || href.startsWith(`/${screenName}?`)) &&
            (text === `@${screenName}` || text === screenName)
          ) {
            usernameLink = link as HTMLElement;
            break;
          }
        }
      }
    }

    // Strategy 4: Fallback to any matching href (but prefer ones not in display name area)
    if (!usernameLink) {
      const links = Array.from(usernameElement.querySelectorAll('a[href^="/"]'));
      for (const link of links) {
        const href = (link as HTMLAnchorElement).getAttribute('href');
        const match = href?.match(/^\/([^\/\?]+)/);
        if (match && match[1] === screenName) {
          // Skip if this looks like a display name link (has verification badge nearby)
          const hasVerificationBadge = (link as HTMLElement)
            .closest('[data-testid="User-Name"]')
            ?.querySelector('[data-testid="icon-verified"]');
          if (!hasVerificationBadge || (link as HTMLElement).textContent?.trim() === `@${screenName}`) {
            usernameLink = link as HTMLElement;
            break;
          }
        }
      }
    }

    if (!usernameLink) {
      console.error(`Could not find username link for ${screenName}`);
      console.error(
        'Available links in container:',
        Array.from(usernameElement.querySelectorAll('a[href^="/"]')).map(l => ({
          href: l.getAttribute('href'),
          text: l.textContent?.trim(),
        })),
      );
      // Remove shimmer on error
      if (shimmerInserted && shimmerSpan.parentNode) {
        shimmerSpan.remove();
      }
      usernameElement.dataset[TWITTER_FLAG_PROCESSED] = 'failed';
      return;
    }

    console.log(
      `Found username link for ${screenName}:`,
      (usernameLink as HTMLAnchorElement).href,
      usernameLink.textContent?.trim(),
    );

    // Check if flag already exists (check in the entire container, not just parent)
    const existingFlag = usernameElement.querySelector('[data-twitter-flag]');
    if (existingFlag) {
      // Remove shimmer if flag already exists
      if (shimmerInserted && shimmerSpan.parentNode) {
        shimmerSpan.remove();
      }
      usernameElement.dataset[TWITTER_FLAG_PROCESSED] = 'true';
      return;
    }

    // Add flag element - place it next to verification badge, before @ handle
    // Use userNameContainer found above, or find it if not found
    const containerForFlag =
      userNameContainer ||
      (usernameElement.querySelector('[data-testid="UserName"], [data-testid="User-Name"]') as HTMLElement);

    if (!containerForFlag) {
      console.error(`Could not find UserName container for ${screenName}`);
      // Remove shimmer on error
      if (shimmerInserted && shimmerSpan.parentNode) {
        shimmerSpan.remove();
      }
      usernameElement.dataset[TWITTER_FLAG_PROCESSED] = 'failed';
      return;
    }

    // Detect if we're on a tweet detail page by checking URL
    const isDetailPage = window.location.pathname.includes('/status/');

    // Find the verification badge (SVG with data-testid="icon-verified")
    const verificationBadge = containerForFlag.querySelector('[data-testid="icon-verified"]');

    // Find the handle section - the div that contains the @username link
    // The structure is: User-Name > div (display name) > div (handle section with @username)
    const handleSection = findHandleSection(containerForFlag, screenName);

    let inserted = false;

    // Special handling for tweet detail pages
    if (isDetailPage) {
      console.log(`Processing tweet detail page for ${screenName}`);

      // On detail pages, try to find the display name and handle structure
      const displayNameLink = containerForFlag.querySelector('a[href^="/"]');
      const handleLink = Array.from(containerForFlag.querySelectorAll('a[href^="/"]')).find(link => {
        return (link as HTMLElement).textContent?.trim() === `@${screenName}`;
      });

      if (handleLink && handleLink.parentNode) {
        try {
          // Insert flag right before the @handle link
          handleLink.parentNode.insertBefore(flagElement, handleLink);
          inserted = true;
          console.log(`✓ Inserted flag before @handle on detail page for ${screenName}`);
        } catch (e) {
          console.log('Failed to insert before @handle on detail page:', e);
        }
      }

      // If that didn't work, try inserting after display name but before handle
      if (!inserted && displayNameLink && displayNameLink.parentNode) {
        try {
          // Insert after display name container
          displayNameLink.parentNode.parentNode?.insertBefore(flagElement, displayNameLink.parentNode.nextSibling);
          inserted = true;
          console.log(`✓ Inserted flag after display name on detail page for ${screenName}`);
        } catch (e) {
          console.log('Failed to insert after display name on detail page:', e);
        }
      }
    }

    // Strategy 1: Insert right before the handle section div (which contains @username)
    // The handle section is a direct child of User-Name container
    if (!inserted && handleSection && handleSection.parentNode === containerForFlag) {
      try {
        containerForFlag.insertBefore(flagElement, handleSection);
        inserted = true;
        console.log(`✓ Inserted flag before handle section for ${screenName}`);
      } catch (e) {
        console.log('Failed to insert before handle section:', e);
      }
    }

    // Strategy 2: Find the handle section's parent and insert before it
    if (!inserted && handleSection && handleSection.parentNode) {
      try {
        // Insert before the handle section's parent (if it's not User-Name)
        const handleParent = handleSection.parentNode;
        if (handleParent !== containerForFlag && handleParent.parentNode) {
          handleParent.parentNode.insertBefore(flagElement, handleParent);
          inserted = true;
          console.log(`✓ Inserted flag before handle parent for ${screenName}`);
        } else if (handleParent === containerForFlag) {
          // Handle section is direct child, insert before it
          containerForFlag.insertBefore(flagElement, handleSection);
          inserted = true;
          console.log(`✓ Inserted flag before handle section (direct child) for ${screenName}`);
        }
      } catch (e) {
        console.log('Failed to insert before handle parent:', e);
      }
    }

    // Strategy 3: Find display name container and insert after it, before handle section
    if (!inserted && handleSection) {
      try {
        // Find the display name link (first link)
        const displayNameLink = containerForFlag.querySelector('a[href^="/"]');
        if (displayNameLink) {
          // Find the div that contains the display name link
          const displayNameContainer = displayNameLink.closest('div');
          if (displayNameContainer && displayNameContainer.parentNode) {
            // Check if handle section is a sibling
            if (displayNameContainer.parentNode === handleSection.parentNode) {
              displayNameContainer.parentNode.insertBefore(flagElement, handleSection);
              inserted = true;
              console.log(`✓ Inserted flag between display name and handle (siblings) for ${screenName}`);
            } else {
              // Try inserting after display name container
              displayNameContainer.parentNode.insertBefore(flagElement, displayNameContainer.nextSibling);
              inserted = true;
              console.log(`✓ Inserted flag after display name container for ${screenName}`);
            }
          }
        }
      } catch (e) {
        console.log('Failed to insert after display name:', e);
      }
    }

    // Strategy 4: Insert at the end of User-Name container (fallback)
    if (!inserted) {
      try {
        containerForFlag.appendChild(flagElement);
        inserted = true;
        console.log(`✓ Inserted flag at end of UserName container for ${screenName}`);
      } catch (e) {
        console.error('Failed to append flag to User-Name container:', e);
      }
    }

    if (inserted) {
      // Mark as processed
      usernameElement.dataset[TWITTER_FLAG_PROCESSED] = 'true';
      console.log(`✓ Successfully added flag element for ${screenName} (${location})`);

      // Also mark any other containers waiting for this username
      const waitingContainers = document.querySelectorAll(`[data-${TWITTER_FLAG_PROCESSED}="waiting"]`);
      waitingContainers.forEach(container => {
        const waitingUsername = extractUsername(container as HTMLElement);
        if (waitingUsername === screenName) {
          // Try to add flag to this container too
          addFlagToUsername(container as HTMLElement, screenName).catch(() => {});
        }
      });
    } else {
      console.error(`✗ Failed to insert flag for ${screenName} - tried all strategies`);
      console.error('Username link:', usernameLink);
      console.error('Parent structure:', usernameLink.parentNode);
      // Remove shimmer on failure
      if (shimmerInserted && shimmerSpan.parentNode) {
        shimmerSpan.remove();
      }
      usernameElement.dataset[TWITTER_FLAG_PROCESSED] = 'failed';
    }
  } catch (error) {
    console.error(`Error processing flag for ${screenName}:`, error);
    // Remove shimmer on error
    if (shimmerInserted && shimmerSpan.parentNode) {
      shimmerSpan.remove();
    }
    usernameElement.dataset[TWITTER_FLAG_PROCESSED] = 'failed';
  } finally {
    // Remove from processing set
    processingUsernames.delete(screenName);
  }
}

// Function to process all username elements on the page
async function processUsernames() {
  if (!isTwitterSite()) return;

  // Find all tweet/article containers and user cells
  const containers = Array.from(
    document.querySelectorAll(
      'article[data-testid="tweet"], [data-testid="UserCell"], [data-testid="User-Names"], [data-testid="User-Name"]',
    ),
  );

  console.log(`Processing ${containers.length} containers for usernames`);

  let foundCount = 0;
  let processedCount = 0;
  let skippedCount = 0;

  for (const container of containers) {
    const screenName = extractUsername(container as HTMLElement);
    if (screenName) {
      foundCount++;
      const status = (container as HTMLElement).dataset[TWITTER_FLAG_PROCESSED];
      if (!status || status === 'failed') {
        processedCount++;
        // Process in parallel but limit concurrency
        addFlagToUsername(container as HTMLElement, screenName).catch(err => {
          console.error(`Error processing ${screenName}:`, err);
          (container as HTMLElement).dataset[TWITTER_FLAG_PROCESSED] = 'failed';
        });
      } else {
        skippedCount++;
      }
    } else {
      // Debug: log containers that don't have usernames
      const hasUserName = container.querySelector('[data-testid="UserName"], [data-testid="User-Name"]');
      if (hasUserName) {
        console.log('Found UserName container but no username extracted');
      }
    }
  }

  if (foundCount > 0) {
    console.log(
      `Found ${foundCount} usernames, processing ${processedCount} new ones, skipped ${skippedCount} already processed`,
    );
  } else {
    console.log('No usernames found in containers');
  }
}

// Initialize observer for dynamically loaded content
function initTwitterObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver(mutations => {
    if (!isTwitterSite()) return;

    let shouldProcess = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldProcess = true;
        break;
      }
    }

    if (shouldProcess) {
      // Debounce processing
      setTimeout(processUsernames, 500);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Main initialization for Twitter flags
async function initTwitterFlags() {
  if (!isTwitterSite()) return;

  console.log('Twitter Location Flag extension initialized');

  // Load persistent cache
  await loadCache();

  // Inject page script
  injectPageScript();

  // Wait a bit for page to fully load
  setTimeout(() => {
    processUsernames();
  }, 2000);

  // Set up observer for new content
  initTwitterObserver();

  // Re-process on navigation (Twitter uses SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log('Page navigation detected, reprocessing usernames');
      setTimeout(processUsernames, 2000);
    }
  }).observe(document, { subtree: true, childList: true });

  // Save cache periodically
  setInterval(saveCache, 30000); // Save every 30 seconds
}

const throttledInjecTicker = _.throttle(injectTicker, 5000);
const throttledInjecIndicating = _.throttle(injectIndicating, 5000);
const throttledProcessUsernames = _.throttle(processUsernames, 3000);

const setupInjections = async () => {
  const globalContainer = document.createElement('div');
  document.body.appendChild(globalContainer);
  injectReact(<TickerPopup />, globalContainer);

  // create another root
  let root = document.createElement('div');
  root.id = 'runtime-content-view-root';
  document.body.append(root);

  const shadowRoot = root.attachShadow({ mode: 'open' });

  const rootIntoShadow = document.createElement('div');
  rootIntoShadow.id = 'shadow-root';
  shadowRoot.appendChild(rootIntoShadow);

  injectReact(<SearchModal />, rootIntoShadow);

  const observer = new MutationObserver(() => {
    throttledInjecTicker();
    throttledInjecIndicating();

    // Only process Twitter usernames if we're on Twitter/X
    if (isTwitterSite()) {
      throttledProcessUsernames();
    }
  });

  observer.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  // Initialize Twitter flags if on Twitter
  if (isTwitterSite()) {
    initTwitterFlags();
  }
};

// console.log('content script loaded zzz');

setupInjections();
