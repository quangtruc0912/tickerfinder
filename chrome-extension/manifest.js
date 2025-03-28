import fs from 'node:fs';
import deepmerge from 'deepmerge';

const packageJson = JSON.parse(fs.readFileSync('../package.json', 'utf8'));

const isFirefox = process.env.__FIREFOX__ === 'true';

/**
 * If you want to disable the sidePanel, you can delete withSidePanel function and remove the sidePanel HoC on the manifest declaration.
 *
 * ```js
 * const manifest = { // remove `withSidePanel()`
 * ```
 */
function withSidePanel(manifest) {
  // Firefox does not support sidePanel
  if (isFirefox) {
    return manifest;
  }
  return deepmerge(manifest, {
    side_panel: {
      default_path: 'side-panel/index.html',
    },
    permissions: ['sidePanel'],
  });
}

const allowedWebsites = [
  'https://twitter.com/*',
  'https://x.com/*',
  'https://facebook.com/*',
  'https://www.facebook.com/*',
  'https://*/',
];
const allowedAPIs = ['https://api.dexscreener.com/*', 'https://api.kucoin.com/*'];

/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const manifest = withSidePanel({
  manifest_version: 3,
  default_locale: 'en',
  /**
   * if you want to support multiple languages, you can use the following reference
   * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
   */
  name: '__MSG_extensionName__',
  version: packageJson.version,
  description: '__MSG_extensionDescription__',
  host_permissions: [...allowedWebsites, ...allowedAPIs], // Twitter/X and APIs
  permissions: ['storage', 'scripting', 'notifications', 'contextMenus'],
  options_page: 'options/index.html',
  commands: {
    toggle_side_panel: {
      suggested_key: {
        default: 'Ctrl+B',
      },
      description: 'Toggle side panel',
    },
  },
  background: {
    service_worker: 'background.iife.js',
    type: 'module',
  },
  action: {
    default_popup: 'popup/index.html',
    default_icon: 'icon-34.png',
  },
  icons: {
    128: 'icon-128.png',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['content/index.iife.js'],
    },
    {
      matches: ['<all_urls>'],
      js: ['content-ui/index.iife.js'],
    },
    {
      matches: ['<all_urls>'],
      css: ['content.css'], // public folder
    },
  ],
  devtools_page: 'devtools/index.html',
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', '*.svg', '*.json', 'icon-128.png', 'icon-34.png'],
      matches: ['<all_urls>'],
    },
  ],
});

export default manifest;
