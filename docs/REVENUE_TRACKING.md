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

  // Save to database (just track impressions, no revenue estimation)
  await db.impressions.insert({
    gameId,
    developerId,
    adType,
    adNetwork,
    timestamp,
    sessionId
  });

  res.status(200).json({ success: true });
});
```

## Revenue Calculation

**Important**: Revenue is calculated from actual ad network payouts, not estimated per impression.

### Process:

1. **Track Impressions**: SDK tracks all ad impressions per game/developer
2. **Get Ad Network Reports**: Monthly reports from ad networks (Google Ad Manager, etc.)
3. **Calculate Total Revenue**: Sum of all ad network payouts for the month
4. **Distribute by Impression Share**: Revenue distributed proportionally based on impressions

### Example SQL Query (Monthly Impressions per Developer)

```sql
SELECT
  developerId,
  gameId,
  COUNT(*) as totalImpressions,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as impressionSharePercent
FROM impressions
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
GROUP BY developerId, gameId
ORDER BY totalImpressions DESC;
```

### Revenue Distribution Formula

```javascript
// Example calculation for November 2024

// Step 1: Get total impressions
const totalImpressions = 500000; // All games combined

// Step 2: Get actual revenue from ad networks
const adNetworkRevenue = {
  'GameBuster': 3200.00,      // From Google Ad Manager report
  'FilthySelection': 2100.00, // From FilthySelection dashboard
  'AdButler': 800.00,         // From AdButler report
  'YourAdExchange': 400.00    // From YourAdExchange report
};
const totalRevenue = 6500.00; // Sum of all networks

// Step 3: Calculate pools
const platformShare = totalRevenue * 0.40; // $2,600
const developerPool = totalRevenue * 0.60; // $3,900

// Step 4: Calculate per developer
const developerImpressions = 50000; // Developer's game impressions
const developerShare = (developerImpressions / totalImpressions) * developerPool;
// = (50000 / 500000) × $3,900 = $390.00
```

## Revenue Share Model

### Fixed 60/40 Split
- **Developer**: 60% of total ad revenue
- **Platform**: 40% of total ad revenue

Revenue is distributed proportionally based on each developer's share of total impressions.

## Dashboard Example

Create a developer dashboard showing:

```javascript
// GET /api/developer/:developerId/revenue
{
  "developerId": "dev_12345",
  "currentMonth": {
    "impressions": 15420,
    "impressionShare": 12.5,  // % of total platform impressions
    "estimatedRevenue": "TBD", // Calculated after month ends based on actual ad network payouts
    "status": "pending"
  },
  "lastMonth": {
    "impressions": 12100,
    "impressionShare": 10.8,
    "totalPlatformRevenue": 8500.00,  // Total from ad networks
    "developerPool": 5100.00,         // 60% of total
    "developerShare": 550.80,         // 10.8% of developer pool
    "status": "paid"
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

