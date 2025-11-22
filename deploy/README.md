# 🚀 GBSDK Deployment Package

This folder contains everything you need to deploy GBSDK to your production website.

## 📦 Files Included

```
deploy/
├── gbsdk.js            # GBSDK library (30KB, single file)
├── index.html          # Example game
├── simple-game.html    # Simple test page
└── README.md           # This file
```

## 🎯 Quick Deploy (2 Minutes)

### 1. Upload Files to Your Website

Upload these files to your web server:

```bash
# Via FTP, cPanel, or your hosting provider
your-website/
├── index.html          # Your game (or rename to game.html)
├── gbsdk.min.js        # GBSDK library
└── ads-config.json     # Ad configuration
```

### 2. Update Config File

Edit `ads-config.json` with your API keys:

```json
{
  "interstitial": {
    "tags": [
      "https://api.applixi.com/v1/vast?apiKey=YOUR_API_KEY&type=interstitial"
    ]
  },
  "rewarded": {
    "tags": [
      "https://api.applixi.com/v1/vast?apiKey=YOUR_API_KEY&type=rewarded"
    ]
  }
}
```

### 3. Test Your Deployment

Open your website:
```
https://your-domain.com/index.html
```

Click "Play Game" and "Watch Ad for Coins" buttons to test!

## ✅ Requirements

- ✅ **HTTPS domain** (required for ads)
- ✅ **Public domain** (not localhost)
- ✅ **Web server** (Apache, Nginx, or any hosting)

## 🔧 Integration with Your Game

Replace the example game in `index.html` with your own game code:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Game</title>
</head>
<body>
    <!-- Your game HTML -->
    
    <!-- Load GBSDK -->
    <script src="./gbsdk.min.js"></script>
    
    <script>
        // Initialize GBSDK
        const gbsdk = new GBSDK.GBSDK();
        
        gbsdk.init({
            configUrl: './ads-config.json',
            debug: false
        }).then(() => {
            console.log('Ads ready!');
        });
        
        // Show interstitial ad
        async function showInterstitialAd() {
            const result = await gbsdk.showInterstitial();
            if (result.success) {
                console.log('Ad completed!');
            }
        }
        
        // Show rewarded ad
        async function showRewardedAd() {
            const result = await gbsdk.showRewarded();
            if (result.success) {
                // Grant reward to player
                console.log('Reward granted!');
            }
        }
    </script>
</body>
</html>
```

## 🌐 Alternative: Use CDN

Instead of uploading `gbsdk.min.js`, you can use CDN:

```html
<!-- Replace local file -->
<script src="./gbsdk.min.js"></script>

<!-- With CDN -->
<script src="https://unpkg.com/@gamebuster/gbsdk@latest/dist/index.umd.js"></script>
```

**Benefits:**
- Always latest version
- Faster loading (cached globally)
- No need to upload GBSDK file

## 📊 Expected Results

### Localhost vs Production

| Metric | Localhost | Production |
|--------|-----------|------------|
| Applixi Fill Rate | 0% | 80-90% |
| Google Ads Fill Rate | 10-20% | 90-95% |
| Ad Load Time | Slow | Fast |
| User Experience | Poor | Good |

### Why Production Works Better

1. **Ad networks serve real ads** to public domains
2. **HTTPS** enables all ad features
3. **Real user traffic** gets better ad inventory
4. **No localhost restrictions** from ad networks

## 🧪 Testing Checklist

After deployment, test:

- [ ] Website loads on HTTPS
- [ ] GBSDK initializes (check console)
- [ ] Config file loads (check Network tab)
- [ ] Interstitial ads show and complete
- [ ] Rewarded ads show and grant rewards
- [ ] Ads work on mobile devices
- [ ] Ads work on different browsers
- [ ] No console errors

## 🚨 Troubleshooting

### Ads Not Showing

1. **Check HTTPS:** Must be `https://` not `http://`
2. **Check Console:** Press F12, look for errors
3. **Check Config:** Is `ads-config.json` accessible?
4. **Enable Debug:**
   ```javascript
   gbsdk.init({ configUrl: './ads-config.json', debug: true })
   ```

### "No Fill" Errors

This is normal if:
- Domain is new (ad networks need approval)
- Low traffic (ad networks prioritize high-traffic sites)
- Geographic restrictions

**Solution:** Add multiple ad networks in config (waterfall)

### Config Not Loading

Check:
- File path is correct: `./ads-config.json`
- File is valid JSON (use JSONLint.com)
- File is publicly accessible
- No CORS errors (check console)

## 📈 Optimization Tips

### 1. Preload GBSDK

```html
<link rel="preload" href="./gbsdk.min.js" as="script">
```

### 2. Initialize Early

```javascript
// Initialize during game loading
window.addEventListener('load', async () => {
    await gbsdk.init({ configUrl: './ads-config.json' });
});
```

### 3. Cache Config

Set cache headers on your server:
```
Cache-Control: public, max-age=300
```

## 🎮 Example Integrations

### Unity WebGL

See: `../bridges/unity/README.md`

### Phaser 3

```javascript
class GameScene extends Phaser.Scene {
    async create() {
        this.gbsdk = new GBSDK.GBSDK();
        await this.gbsdk.init({ configUrl: './ads-config.json' });
    }
}
```

### Pixi.js

```javascript
const gbsdk = new GBSDK.GBSDK();
await gbsdk.init({ configUrl: './ads-config.json' });
```

## 📞 Support

### Issues?

1. Enable debug mode: `debug: true`
2. Check browser console
3. Test with example first
4. Open GitHub issue

### Ad Network Support

- **Applixi:** support@applixi.com
- **Google Ad Manager:** support.google.com/admanager

## 🎉 You're Ready!

**Deployment Steps:**
1. ✅ Upload files to your server
2. ✅ Update `ads-config.json` with your API keys
3. ✅ Test on your HTTPS domain
4. ✅ Ads should work!

**Key Difference:**
- **Localhost:** Ad networks block → No ads
- **Production:** Ad networks serve → Ads work! 🎉

Good luck with your deployment! 🚀

---

**Need more help?**
- Full documentation: `../README.md`
- Deployment guide: `../DEPLOYMENT.md`
- Applixi guide: `../APPLIXI-INTEGRATION.md`

