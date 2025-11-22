# Applixi Integration Guide for GBSDK

This guide explains how to integrate Applixi ad network with GameBuster SDK (GBSDK).

## 📋 Overview

GBSDK supports Applixi through VAST 4.x protocol. Applixi provides video ads for both interstitial and rewarded ad formats.

**API Key:** `7c86d490-107f-48c4-ab66-0419cd2d1e34`

## 🚀 Quick Setup

### 1. Configuration File

Create a JSON configuration file with Applixi VAST endpoints:

```json
{
  "version": "1.0.0",
  "cooldownSec": 90,
  "sessionCap": 20,
  "interstitial": {
    "tags": [
      "https://api.applixi.com/v1/vast?apiKey=7c86d490-107f-48c4-ab66-0419cd2d1e34&type=interstitial",
      "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator="
    ]
  },
  "rewarded": {
    "tags": [
      "https://api.applixi.com/v1/vast?apiKey=7c86d490-107f-48c4-ab66-0419cd2d1e34&type=rewarded",
      "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator="
    ]
  }
}
```

### 2. Initialize GBSDK

```javascript
const gbsdk = new GBSDK.GBSDK();

await gbsdk.init({
  configUrl: 'https://your-cdn.com/ads/config.json',
  debug: true
});
```

### 3. Show Ads

```javascript
// Interstitial ad
const interstitialResult = await gbsdk.showInterstitial();
if (interstitialResult.success) {
  console.log('Applixi interstitial completed!');
}

// Rewarded ad
const rewardedResult = await gbsdk.showRewarded();
if (rewardedResult.success) {
  console.log('User earned reward!');
  // Grant reward to player
}
```

## 🔧 Configuration Options

### Waterfall Setup

GBSDK supports waterfall ad serving. List multiple ad networks in priority order:

```json
{
  "interstitial": {
    "tags": [
      "https://api.applixi.com/v1/vast?apiKey=YOUR_KEY&type=interstitial",
      "https://backup-network.com/vast",
      "https://fallback-network.com/vast"
    ]
  }
}
```

If Applixi doesn't fill, GBSDK automatically tries the next network.

### Test Mode

For localhost testing, add `&test=1` parameter:

```
https://api.applixi.com/v1/vast?apiKey=7c86d490-107f-48c4-ab66-0419cd2d1e34&type=interstitial&test=1
```

### Cooldown & Session Caps

Control ad frequency:

```json
{
  "cooldownSec": 90,    // Minimum 90 seconds between ads
  "sessionCap": 20      // Maximum 20 ads per session
}
```

## 🌐 Production Deployment

### Important Notes

1. **Domain Restrictions**: Applixi may not serve ads from:
   - `localhost`
   - `127.0.0.1`
   - Local IP addresses (192.168.x.x, 10.x.x.x)
   - File protocol (`file://`)

2. **HTTPS Required**: Always use HTTPS in production:
   ```
   https://your-game.com/game.html
   ```

3. **Public Domain**: Deploy to a public domain for testing:
   - Use ngrok: `ngrok http 8080`
   - Use localtunnel: `lt --port 8080`
   - Deploy to staging server

### Testing Workflow

**Local Development:**
```json
{
  "interstitial": {
    "tags": [
      "https://pubads.g.doubleclick.net/gampad/ads?...",  // Primary for localhost
      "https://api.applixi.com/v1/vast?apiKey=YOUR_KEY&type=interstitial"
    ]
  }
}
```

**Production:**
```json
{
  "interstitial": {
    "tags": [
      "https://api.applixi.com/v1/vast?apiKey=YOUR_KEY&type=interstitial",  // Primary
      "https://pubads.g.doubleclick.net/gampad/ads?..."  // Fallback
    ]
  }
}
```

## 📊 Event Tracking

Monitor Applixi ad performance:

```javascript
gbsdk.on('loaded', () => console.log('Ad loaded'));
gbsdk.on('started', () => console.log('Ad started'));
gbsdk.on('complete', () => console.log('Ad completed'));
gbsdk.on('error', (data) => console.log('Ad error:', data.error));
gbsdk.on('no_fill', () => console.log('No ad available'));
```

## 🐛 Troubleshooting

### "No Fill" Error

**Cause:** Applixi cannot serve ads from localhost

**Solutions:**
1. Use ngrok for public URL:
   ```bash
   ngrok http 8080
   # Use the https://xxx.ngrok.io URL
   ```

2. Deploy to staging server

3. Use test parameter: `&test=1`

4. Check waterfall - ensure fallback networks are configured

### Ads Not Loading

**Check:**
- ✅ HTTPS protocol (not HTTP)
- ✅ Public domain (not localhost)
- ✅ API key is correct
- ✅ Browser console for errors
- ✅ Network tab for VAST requests

### CORS Errors

**Solution:** Applixi VAST endpoints support CORS. If you see CORS errors:
- Ensure you're using the correct endpoint
- Check if you're on HTTPS
- Verify domain is public

## 📱 Platform Support

| Platform | Support | Notes |
|----------|---------|-------|
| Web (Desktop) | ✅ Full | Chrome, Firefox, Safari, Edge |
| Web (Mobile) | ✅ Full | iOS Safari, Chrome Mobile |
| Unity WebGL | ✅ Full | Use Unity bridge |
| Phaser 3 | ✅ Full | Use Phaser bridge |
| Pixi.js | ✅ Full | Use Pixi bridge |
| HTML5 Games | ✅ Full | Direct integration |

## 🔐 Security

### API Key Protection

**Don't:**
- ❌ Commit API keys to public repos
- ❌ Hardcode keys in client code

**Do:**
- ✅ Store keys in remote config
- ✅ Use environment variables
- ✅ Rotate keys periodically

### Remote Configuration

Host config on CDN with HTTPS:

```javascript
await gbsdk.init({
  configUrl: 'https://cdn.your-game.com/ads/config.json',
  allowDomains: ['cdn.your-game.com']  // Whitelist
});
```

## 📈 Best Practices

### 1. Waterfall Strategy

```json
{
  "interstitial": {
    "tags": [
      "https://api.applixi.com/v1/vast?apiKey=KEY&type=interstitial",
      "https://secondary-network.com/vast",
      "https://fallback-network.com/vast"
    ]
  }
}
```

### 2. Ad Frequency

```javascript
// Check if ad can be shown
if (gbsdk.canShow('interstitial')) {
  await gbsdk.showInterstitial();
}
```

### 3. User Experience

```javascript
// Show interstitial between levels
async function onLevelComplete() {
  // Save progress first
  saveProgress();
  
  // Show ad
  await gbsdk.showInterstitial();
  
  // Load next level
  loadNextLevel();
}

// Show rewarded for optional rewards
async function watchAdForCoins() {
  const result = await gbsdk.showRewarded();
  if (result.success) {
    grantCoins(100);  // Only grant if completed
  }
}
```

### 4. Error Handling

```javascript
try {
  const result = await gbsdk.showInterstitial();
  if (!result.success) {
    console.log('Ad failed:', result.reason);
    // Continue game flow anyway
  }
} catch (error) {
  console.error('Ad error:', error);
  // Continue game flow
}
```

## 🧪 Testing

### Test Page

A complete test page is included:

```bash
cd packages/gbsdk
npm run build
python3 -m http.server 8080
```

Open: `http://localhost:8080/example/test-applixi.html`

### Test Checklist

- [ ] SDK initializes successfully
- [ ] Interstitial ads load and play
- [ ] Rewarded ads load and play
- [ ] Rewards only granted on completion
- [ ] Cooldown prevents rapid ad requests
- [ ] Session cap limits total ads
- [ ] Waterfall works when primary fails
- [ ] Events fire correctly
- [ ] Error handling works

## 📞 Support

### Applixi Support
- Documentation: [Applixi Docs](https://applixi.com/docs)
- Support: support@applixi.com

### GBSDK Support
- GitHub: [GBSDK Repository](https://github.com/gamebuster/gbsdk)
- Issues: [Report Issues](https://github.com/gamebuster/gbsdk/issues)

## 📄 License

GBSDK is MIT licensed. See LICENSE file for details.

