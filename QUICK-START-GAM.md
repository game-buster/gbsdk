# 🚀 Quick Start: GAM + Prebid

GBSDK'yı Google Ad Manager ve Prebid ile 5 dakikada başlatın!

## 📋 Önkoşullar

1. **Google Ad Manager Hesabı**
   - Network Code: `21775744923` (örnek)
   - Ad Units: `interstitial_video`, `rewarded_video`

2. **Prebid Bidder Hesapları** (Opsiyonel)
   - AppNexus Placement ID
   - Rubicon Account/Site/Zone ID
   - Index Exchange Site ID

## 🎯 Adım 1: Config Dosyası Oluştur

`ads-config.json` dosyası oluşturun:

```json
{
  "version": "1.0.0",
  "cooldownSec": 90,
  "sessionCap": 20,
  "interstitial": {
    "sources": [
      {
        "type": "gam",
        "gam": {
          "enabled": true,
          "networkCode": "21775744923",
          "adUnitPath": "interstitial_video",
          "sizes": [[640, 480], [1280, 720]],
          "targeting": {
            "ad_type": "interstitial"
          }
        }
      },
      {
        "type": "vast",
        "vastTags": [
          "https://api.applixi.com/v1/vast?apiKey=YOUR_KEY&type=interstitial"
        ]
      }
    ]
  },
  "rewarded": {
    "sources": [
      {
        "type": "gam",
        "gam": {
          "enabled": true,
          "networkCode": "21775744923",
          "adUnitPath": "rewarded_video",
          "sizes": [[640, 480], [1280, 720]],
          "targeting": {
            "ad_type": "rewarded"
          }
        }
      },
      {
        "type": "vast",
        "vastTags": [
          "https://api.applixi.com/v1/vast?apiKey=YOUR_KEY&type=rewarded"
        ]
      }
    ]
  }
}
```

## 🎮 Adım 2: HTML'e Ekle

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Game</title>
</head>
<body>
    <!-- Your game canvas/content -->
    <div id="game"></div>

    <!-- Load GBSDK -->
    <script src="https://unpkg.com/@gamebuster/gbsdk@latest/dist/index.umd.js"></script>
    
    <script>
        // Initialize GBSDK
        const gbsdk = new GBSDK.GBSDK();
        
        async function initAds() {
            await gbsdk.init({
                configUrl: './ads-config.json',
                debug: true
            });
            
            console.log('Ads ready!');
            gbsdk.gameStarted();
        }
        
        // Show interstitial (between levels)
        async function showInterstitial() {
            const result = await gbsdk.showInterstitial();
            if (result.success) {
                console.log('Ad completed!');
                // Continue to next level
            }
        }
        
        // Show rewarded (for coins/lives)
        async function showRewarded() {
            const result = await gbsdk.showRewarded();
            if (result.success) {
                console.log('User earned reward!');
                givePlayerCoins(100);
            }
        }
        
        // Initialize on load
        initAds();
    </script>
</body>
</html>
```

## 🎲 Adım 3: Prebid Ekle (Opsiyonel - Daha Fazla Gelir)

Config'e Prebid ekleyin:

```json
{
  "interstitial": {
    "sources": [
      {
        "type": "prebid",
        "prebid": {
          "enabled": true,
          "timeout": 2000,
          "bidders": [
            {
              "name": "appnexus",
              "params": {
                "placementId": "13144370"
              }
            },
            {
              "name": "rubicon",
              "params": {
                "accountId": "14062",
                "siteId": "70608",
                "zoneId": "335918"
              }
            }
          ]
        }
      },
      {
        "type": "gam",
        "gam": {
          "networkCode": "21775744923",
          "adUnitPath": "interstitial_video"
        }
      }
    ]
  }
}
```

## 🧪 Adım 4: Test Et

1. **Local test:**
   ```bash
   # Simple HTTP server
   python3 -m http.server 8000
   # veya
   npx serve .
   ```

2. **Browser'da aç:**
   ```
   http://localhost:8000
   ```

3. **Console'u kontrol et:**
   - Debug mode açıksa waterfall loglarını göreceksiniz
   - "WaterfallManager: Starting waterfall"
   - "Trying source 1/2 - gam"
   - "Ad completed successfully!"

## 📊 Waterfall Nasıl Çalışır?

```
1. Prebid (varsa)
   ├─ Bids var mı? → Oynat ✅
   └─ Yok → GAM'e geç
        ↓
2. Google Ad Manager
   ├─ Ad var mı? → Oynat ✅
   └─ Yok → VAST'a geç
        ↓
3. VAST Tags (Applixi)
   ├─ Ad var mı? → Oynat ✅
   └─ Yok → No Fill ❌
```

## 🔧 GAM Panel Setup (Hızlı)

### 1. Ad Units Oluştur

**Interstitial:**
- Name: `interstitial_video`
- Type: Video
- Sizes: 640x480, 1280x720
- Position: Interstitial

**Rewarded:**
- Name: `rewarded_video`
- Type: Video
- Sizes: 640x480, 1280x720
- Position: Rewarded

### 2. Line Items Oluştur

- Type: Price priority
- Rate: $5-10 CPM
- Creative type: Video (VAST)
- Targeting: Ad unit + key-values

### 3. Creatives Ekle

- Video creative upload et veya VAST tag ekle
- Line item'a attach et

**📖 Detaylı setup: [GAM-PREBID-SETUP.md](./GAM-PREBID-SETUP.md)**

## 🎯 Game Engine Entegrasyonları

### Unity WebGL
```csharp
// C# tarafında
[DllImport("__Internal")]
private static extern void ShowInterstitial();

public void OnLevelComplete() {
    ShowInterstitial();
}
```

### Phaser
```javascript
// Phaser scene
this.events.on('levelComplete', async () => {
    const result = await gbsdk.showInterstitial();
    if (result.success) {
        this.scene.start('NextLevel');
    }
});
```

### PixiJS
```javascript
import { PixiGBSDK } from '@gamebuster/gbsdk/bridges/pixi';

const ads = new PixiGBSDK(app);
await ads.init({ configUrl: './ads-config.json' });

// Show ad
await ads.showInterstitial();
```

## 💡 Best Practices

### 1. Cooldown Kullan
```json
{
  "cooldownSec": 90  // 90 saniye arası minimum
}
```

### 2. Session Cap Belirle
```json
{
  "sessionCap": 20  // Session başına max 20 ad
}
```

### 3. Debug Mode'u Production'da Kapat
```javascript
await gbsdk.init({
  configUrl: './ads-config.json',
  debug: false  // Production'da false
});
```

### 4. Error Handling
```javascript
const result = await gbsdk.showInterstitial();

if (!result.success) {
  switch (result.reason) {
    case 'cooldown':
      console.log('Too soon, wait a bit');
      break;
    case 'capped':
      console.log('Too many ads this session');
      break;
    case 'no_fill':
      console.log('No ads available');
      break;
  }
}
```

## 🚀 Production Deployment

### 1. Build
```bash
npm run build
```

### 2. Deploy
```bash
# CDN'e upload et
aws s3 cp dist/index.umd.js s3://your-bucket/gbsdk.min.js
aws s3 cp ads-config.json s3://your-bucket/ads-config.json
```

### 3. HTML'de CDN kullan
```html
<script src="https://your-cdn.com/gbsdk.min.js"></script>
<script>
  gbsdk.init({
    configUrl: 'https://your-cdn.com/ads-config.json'
  });
</script>
```

## 📞 Yardım

- **Dokümantasyon**: [README.md](./README.md)
- **GAM Setup**: [GAM-PREBID-SETUP.md](./GAM-PREBID-SETUP.md)
- **Production Guide**: [PRODUCTION-READY.md](./PRODUCTION-READY.md)
- **GitHub Issues**: https://github.com/gamebuster/gbsdk/issues

## ✅ Checklist

- [ ] GAM hesabı oluşturuldu
- [ ] Ad units oluşturuldu (interstitial_video, rewarded_video)
- [ ] Line items ve creatives eklendi
- [ ] Config dosyası hazırlandı
- [ ] GBSDK HTML'e eklendi
- [ ] Local test yapıldı
- [ ] Production'a deploy edildi

**Hepsi tamam mı? Yayına hazırsınız! 🎉**

