# Revenue Tracking & Developer Payouts

GBSDK includes built-in revenue tracking to help you distribute ad revenue to game developers.

## How It Works

1. **Client-Side Tracking**: GBSDK tracks every completed ad impression
2. **Backend Logging**: Impression data is sent to your tracking endpoint
3. **Revenue Calculation**: Your backend calculates revenue share per developer
4. **Payout Distribution**: You distribute payments based on tracked impressions

## Setup

### 1. Enable Tracking in SDK

```javascript
await gbsdk.init({
  configUrl: 'https://cdn.game-buster.com/config.json',
  
  // Revenue tracking configuration
  gameId: 'my-awesome-game',           // Unique game identifier
  developerId: 'dev_12345',             // Developer identifier
  trackingUrl: 'https://api.game-buster.com/track/impression',
  
  debug: true
});
```

### 2. Backend Endpoint

Create an endpoint to receive impression data:

**POST** `/track/impression`

**Request Body:**
```json
{
  "gameId": "my-awesome-game",
  "developerId": "dev_12345",
  "adType": "rewarded",
  "adNetwork": "GameBuster",
  "timestamp": 1700000000000,
  "sessionId": "1700000000000-abc123",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://game-portal.com"
}
```

### 3. Example Backend (Node.js + Express)

```javascript
const express = require('express');
const app = express();

app.post('/track/impression', express.json(), async (req, res) => {
  const {
    gameId,
    developerId,
    adType,
    adNetwork,
    timestamp,
    sessionId
  } = req.body;

  // Save to database
  await db.impressions.insert({
    gameId,
    developerId,
    adType,
    adNetwork,
    timestamp,
    sessionId,
    // Add estimated revenue based on ad network
    estimatedRevenue: getEstimatedRevenue(adNetwork, adType),
    currency: 'USD'
  });

  res.status(200).json({ success: true });
});

function getEstimatedRevenue(adNetwork, adType) {
  // Example CPM rates (adjust based on your actual rates)
  const rates = {
    'GameBuster': { rewarded: 0.015, interstitial: 0.010 },
    'FilthySelection': { rewarded: 0.012, interstitial: 0.008 },
    'AdButler': { rewarded: 0.010, interstitial: 0.007 },
    'YourAdExchange': { rewarded: 0.008, interstitial: 0.005 }
  };
  
  return rates[adNetwork]?.[adType] || 0.005;
}
```

## Revenue Calculation

### Example SQL Query (Monthly Revenue per Developer)

```sql
SELECT 
  developerId,
  gameId,
  COUNT(*) as totalImpressions,
  SUM(estimatedRevenue) as totalRevenue,
  SUM(estimatedRevenue) * 0.70 as developerShare,  -- 70% to developer
  SUM(estimatedRevenue) * 0.30 as platformShare    -- 30% to platform
FROM impressions
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
GROUP BY developerId, gameId
ORDER BY totalRevenue DESC;
```

## Revenue Share Models

### Option 1: Fixed Percentage (Recommended)
- **Developer**: 70% of ad revenue
- **Platform**: 30% of ad revenue

### Option 2: Tiered System
- **0-1000 impressions**: 60% to developer
- **1000-10000 impressions**: 70% to developer
- **10000+ impressions**: 80% to developer

### Option 3: Performance-Based
- Base: 70% to developer
- Bonus: +5% if retention > 50%
- Bonus: +5% if session time > 5 minutes

## Dashboard Example

Create a developer dashboard showing:

```javascript
// GET /api/developer/:developerId/revenue
{
  "developerId": "dev_12345",
  "currentMonth": {
    "impressions": 15420,
    "revenue": 185.04,
    "developerShare": 129.53,
    "games": [
      {
        "gameId": "my-awesome-game",
        "impressions": 12300,
        "revenue": 147.60,
        "developerShare": 103.32
      }
    ]
  },
  "lastMonth": {
    "impressions": 12100,
    "revenue": 145.20,
    "developerShare": 101.64
  }
}
```

## Best Practices

1. **Deduplication**: Use `sessionId` to prevent duplicate tracking
2. **Fraud Detection**: Monitor for suspicious patterns (too many impressions from same IP)
3. **Minimum Payout**: Set a minimum threshold (e.g., $50) before payout
4. **Payment Schedule**: Monthly or bi-weekly payouts
5. **Transparency**: Provide detailed reports to developers

## Security

- Use HTTPS for tracking endpoint
- Validate `gameId` and `developerId` against your database
- Rate limit the tracking endpoint
- Consider adding HMAC signature for request verification

## Testing

```javascript
// Test tracking in development
await gbsdk.init({
  gameId: 'test-game',
  developerId: 'test-dev',
  trackingUrl: 'http://localhost:3000/track/impression',
  debug: true
});

// Watch console for tracking logs
// 📊 Ad impression tracked: { gameId: 'test-game', ... }
```

