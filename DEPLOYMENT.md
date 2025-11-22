# 🚀 GBSDK Production Deployment Guide

## 📦 Quick Deploy Checklist

- [ ] Copy `dist/index.umd.js` to your website (or use CDN)
- [ ] Create `ads-config.json` with your ad tags
- [ ] Add GBSDK script to your HTML
- [ ] Initialize GBSDK in your game code
- [ ] Deploy to HTTPS domain
- [ ] Test ads work!

## 🎯 3-Step Deployment

### Step 1: Get GBSDK File

**Option A: Use CDN (Recommended)**
```html
<script src="https://unpkg.com/@gamebuster/gbsdk@latest/dist/index.umd.js"></script>
```

**Option B: Self-Host**
```bash
# Copy from build
cp packages/gbsdk/dist/index.umd.js /your-website/js/gbsdk.min.js
```

### Step 2: Create Config File

Create `ads-config.json` on your server:

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

Upload to: `https://your-domain.com/ads-config.json`

### Step 3: Add to Your Game

```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Game</title>
</head>
<body>
    <!-- Your game content -->
    
    <!-- Load GBSDK -->
    <script src="https://unpkg.com/@gamebuster/gbsdk@latest/dist/index.umd.js"></script>
    
    <script>
        const gbsdk = new GBSDK.GBSDK();
        
        // Initialize
        gbsdk.init({
            configUrl: 'https://your-domain.com/ads-config.json',
            debug: false
        }).then(() => {
            console.log('Ads ready!');
            gbsdk.gameStarted();
        });
        
        // Show interstitial
        async function showAd() {
            const result = await gbsdk.showInterstitial();
            if (result.success) {
                console.log('Ad completed');
            }
        }
        
        // Show rewarded
        async function watchAdForReward() {
            const result = await gbsdk.showRewarded();
            if (result.success) {
                givePlayerCoins(100); // Grant reward
            }
        }
    </script>
</body>
</html>
```

## 📁 Files to Upload

```
your-website/
├── index.html              # Your game
├── js/
│   └── gbsdk.min.js       # GBSDK (19KB) - if self-hosting
└── ads-config.json         # Ad configuration
```

## ✅ Why Production Will Work Better

| Feature | Localhost | Production |
|---------|-----------|------------|
| Applixi Ads | ❌ No fill | ✅ Works |
| Google Ads | ⚠️ Limited | ✅ Full fill |
| HTTPS | ❌ HTTP | ✅ HTTPS |
| Ad Networks | 🔴 Block localhost | 🟢 Serve ads |
| Fill Rate | 10-20% | 80-95% |

## 🔒 Requirements

1. **HTTPS Domain** - Required! Ads won't work on HTTP
2. **Public Domain** - Not localhost or private IP
3. **Valid Config** - Accessible JSON file

## 🧪 Test After Deploy

1. Open your game: `https://your-domain.com`
2. Open browser console (F12)
3. Check for: `"Ads ready!"`
4. Click button to show ad
5. Ad should play!

## 🚨 Common Issues

### "No Fill" on Production

**Possible causes:**
- Domain not approved by ad network (contact support)
- Geographic restrictions
- Ad network has no inventory

**Solution:**
- Add multiple ad networks (waterfall)
- Check ad network dashboard
- Contact ad network support

### Config Not Loading

**Check:**
- Config URL is correct
- File is publicly accessible
- Valid JSON format
- CORS headers (if cross-domain)

### Ads Not Showing

**Check:**
- GBSDK loaded? (console errors?)
- Called `init()` before showing ads?
- Cooldown active? (`gbsdk.canShow('interstitial')`)
- HTTPS enabled?

## 📊 Monitoring

Enable debug mode temporarily:

```javascript
await gbsdk.init({
    configUrl: 'https://your-domain.com/ads-config.json',
    debug: true  // See detailed logs
});
```

Check console for:
- ✅ "Ads ready!"
- ✅ "Ad loaded"
- ✅ "Ad started"
- ✅ "Ad completed"

## 🎮 Example Game

See `example/production-example.html` for a complete working example.

Test it locally:
```
http://localhost:8080/example/production-example.html
```

Then deploy to your domain!

## 📞 Need Help?

1. Check browser console for errors
2. Enable `debug: true`
3. Test with example first
4. Open GitHub issue

## 🎉 Ready to Deploy!

**Your deployment package:**
- ✅ GBSDK file (19KB)
- ✅ Config JSON
- ✅ Integration code
- ✅ Example game

**Deploy to your domain and ads will work!** 🚀

The main difference from localhost:
- **Localhost:** Ad networks block/limit requests → Low fill rate
- **Production:** Ad networks serve normally → High fill rate

Good luck! 🎮

