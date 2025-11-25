# Twitter/X API Integration Setup

This extension includes functionality to detect users on X.com/Twitter and display country flags near usernames. Currently, it uses a mock implementation for demonstration purposes.

## Setting up Real X API Integration

To use the actual X API v2, follow these steps:

### 1. Get X API Credentials

1. Go to [X Developer Portal](https://developer.x.com/)
2. Apply for a developer account
3. Create a new app
4. Get your Bearer Token from the app dashboard

### 2. Update the Background Script

Replace the mock implementation in `chrome-extension/src/background/index.ts`:

```typescript
// Replace the mockTwitterUserLookup function with this:
async function fetchTwitterUserReal(username: string): Promise<TwitterUserResponse> {
  try {
    // Your X API Bearer Token (store securely, consider using chrome.storage)
    const bearerToken = 'YOUR_BEARER_TOKEN_HERE';
    
    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=location,public_metrics`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.data) {
      // Extract country from location (you may want to use a geolocation service)
      const countryCode = extractCountryFromLocation(result.data.location);
      
      const userData: TwitterUserData = {
        id: result.data.id,
        name: result.data.name,
        username: result.data.username,
        location: result.data.location,
        country_code: countryCode,
        public_metrics: result.data.public_metrics,
      };

      return { data: userData };
    }
    
    return { error: 'User not found' };
  } catch (error) {
    console.error('X API Error:', error);
    return { error: 'Failed to fetch user data' };
  }
}

// Helper function to extract country code from location string
function extractCountryFromLocation(location: string): string | undefined {
  // You can implement location parsing logic here
  // Or use a geolocation service like Google Maps API
  // For now, returning undefined
  return undefined;
}
```

### 3. Rate Limiting and Caching

The X API has rate limits. Consider implementing:

- Caching user data in `chrome.storage.local`
- Rate limiting requests
- Error handling for rate limit exceeded

### 4. Privacy Considerations

- Only fetch data for users that are publicly visible
- Respect user privacy and X's terms of service
- Consider adding user controls to disable this feature

### 5. Alternative Approaches

If you don't want to use the X API directly, consider:

- Using the user's public profile page to extract location information
- Implementing a backend service that handles X API calls
- Using browser automation to extract information (be careful with terms of service)

## Current Mock Implementation

The current implementation uses a mock that randomly assigns country codes for demonstration purposes. This allows testing the flag display functionality without requiring actual API credentials.

## Testing

To test the current implementation:

1. Build the extension: `npm run build`
2. Load the extension in Chrome
3. Navigate to X.com or Twitter.com
4. Look for country flags appearing next to usernames (with mock random countries)

The flags will appear after a few seconds as the mutation observer detects profile elements and the mock API responds.