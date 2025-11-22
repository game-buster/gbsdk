# Google Ad Manager (GAM) + Prebid Setup Rehberi

Bu rehber, GBSDK'yı Google Ad Manager ve Prebid.js ile entegre etmek için gereken tüm adımları içerir.

## 📋 İçindekiler

1. [Google Ad Manager (GAM) Setup](#google-ad-manager-gam-setup)
2. [Prebid.js Setup](#prebidjs-setup)
3. [GBSDK Konfigürasyonu](#gbsdk-konfigürasyonu)
4. [Test ve Doğrulama](#test-ve-doğrulama)

---

## 🎯 Google Ad Manager (GAM) Setup

### 1. GAM Hesabı Oluşturma

1. **Google Ad Manager'a Git**: https://admanager.google.com/
2. **Hesap Oluştur** veya mevcut hesabınızla giriş yapın
3. **Network Code**'unuzu not edin (örn: `21775744923`)

### 2. Ad Units Oluşturma

#### Interstitial Ad Unit

1. **Inventory** → **Ad units** → **New ad unit**
2. Ayarlar:
   - **Name**: `interstitial_video`
   - **Code**: `interstitial_video` (otomatik)
   - **Sizes**: 
     - `640x480` (Video)
     - `1280x720` (Video)
   - **Ad unit type**: Video
   - **Video settings**:
     - Position: Interstitial
     - Playback method: Auto-play, sound on
     - Skippable: Yes (5 seconds)

#### Rewarded Ad Unit

1. **Inventory** → **Ad units** → **New ad unit**
2. Ayarlar:
   - **Name**: `rewarded_video`
   - **Code**: `rewarded_video`
   - **Sizes**: 
     - `640x480` (Video)
     - `1280x720` (Video)
   - **Ad unit type**: Video
   - **Video settings**:
     - Position: Rewarded
     - Playback method: Auto-play, sound on
     - Skippable: No (must watch to completion)

### 3. Key-Values (Targeting) Oluşturma

1. **Inventory** → **Key-values** → **New key**
2. Aşağıdaki key-value'ları oluşturun:

```
game_category:
  - casual
  - action
  - puzzle
  - strategy

ad_type:
  - interstitial
  - rewarded

game_id:
  - your_game_id
```

### 4. Orders ve Line Items Oluşturma

#### Order Oluşturma

1. **Delivery** → **Orders** → **New order**
2. Ayarlar:
   - **Name**: `Gaming Ads - Q1 2024`
   - **Advertiser**: Kendi advertiser'ınızı seçin veya oluşturun
   - **Trafficker**: Kendinizi seçin

#### Interstitial Line Item

1. **New line item** (Order içinde)
2. Ayarlar:
   - **Name**: `Interstitial Video - CPM $5`
   - **Type**: Price priority
   - **Start time**: Şimdi
   - **End time**: Unlimited
   - **Quantity**: Unlimited
   - **Rate**: $5.00 CPM
   - **Creative type**: Video (VAST)
   - **Sizes**: 640x480, 1280x720
   - **Targeting**:
     - Ad units: `interstitial_video`
     - Key-values: `ad_type = interstitial`

#### Rewarded Line Item

1. **New line item**
2. Ayarlar:
   - **Name**: `Rewarded Video - CPM $10`
   - **Type**: Price priority
   - **Rate**: $10.00 CPM
   - **Creative type**: Video (VAST)
   - **Sizes**: 640x480, 1280x720
   - **Targeting**:
     - Ad units: `rewarded_video`
     - Key-values: `ad_type = rewarded`

### 5. Creatives Ekleme

1. **Delivery** → **Creatives** → **New creative**
2. **Video** seçin
3. Ayarlar:
   - **Name**: `Sample Video Ad`
   - **Duration**: 15-30 seconds
   - **VAST tag URL**: Test VAST URL'inizi girin veya video upload edin
   - **Click-through URL**: Advertiser URL

4. Creative'i Line Item'a attach edin

### 6. GAM Tag URL'lerini Alma

Line item oluşturduktan sonra, tag URL'lerini alın:

**Interstitial Tag URL:**
```
https://pubads.g.doubleclick.net/gampad/ads?
  iu=/[NETWORK_CODE]/interstitial_video
  &sz=640x480
  &cust_params=ad_type%3Dinterstitial
  &output=vast
  &env=vp
  &impl=s
  &correlator=[timestamp]
```

**Rewarded Tag URL:**
```
https://pubads.g.doubleclick.net/gampad/ads?
  iu=/[NETWORK_CODE]/rewarded_video
  &sz=640x480
  &cust_params=ad_type%3Drewarded
  &output=vast
  &env=vp
  &impl=s
  &correlator=[timestamp]
```

---

## 🎲 Prebid.js Setup

### 1. Prebid Hesapları Oluşturma

Aşağıdaki demand partners'dan hesap açın:

#### AppNexus (Xandr)
- **Website**: https://www.xandr.com/
- **Sign up**: Publisher hesabı oluşturun
- **Placement ID** alın

#### Rubicon Project (Magnite)
- **Website**: https://www.magnite.com/
- **Sign up**: Publisher hesabı oluşturun
- **Account ID**, **Site ID**, **Zone ID** alın

#### Index Exchange (IX)
- **Website**: https://www.indexexchange.com/
- **Sign up**: Publisher hesabı oluşturun
- **Site ID** alın

### 2. Prebid Bidder Parametreleri

Her bidder için gerekli parametreleri toplayın:

```json
{
  "appnexus": {
    "placementId": "13144370"  // AppNexus'tan alacağınız
  },
  "rubicon": {
    "accountId": "14062",      // Rubicon'dan alacağınız
    "siteId": "70608",
    "zoneId": "335918"
  },
  "ix": {
    "siteId": "123456"         // Index Exchange'den alacağınız
  }
}
```

### 3. Prebid Test Etme

Prebid.js'in çalıştığını test etmek için:

1. Browser console'da:
```javascript
pbjs.que.push(function() {
  console.log('Prebid loaded:', pbjs);
});
```

2. Bid response'ları kontrol edin:
```javascript
pbjs.que.push(function() {
  pbjs.onEvent('bidResponse', function(bid) {
    console.log('Bid received:', bid);
  });
});
```

---

## ⚙️ GBSDK Konfigürasyonu

### 1. Config Dosyası Oluşturma

`ads-config.json` dosyası oluşturun:

```json
{
  "version": "1.0.0",
  "sdkMin": "1.0.0",
  "cooldownSec": 90,
  "sessionCap": 20,
  "interstitial": {
    "sources": [
      {
        "type": "prebid",
        "prebid": {
          "enabled": true,
          "timeout": 2000,
          "priceGranularity": "medium",
          "enableSendAllBids": true,
          "bidders": [
            {
              "name": "appnexus",
              "params": {
                "placementId": "YOUR_PLACEMENT_ID"
              }
            },
            {
              "name": "rubicon",
              "params": {
                "accountId": "YOUR_ACCOUNT_ID",
                "siteId": "YOUR_SITE_ID",
                "zoneId": "YOUR_ZONE_ID"
              }
            }
          ]
        }
      },
      {
        "type": "gam",
        "gam": {
          "enabled": true,
          "networkCode": "YOUR_NETWORK_CODE",
          "adUnitPath": "interstitial_video",
          "sizes": [[640, 480], [1280, 720]],
          "targeting": {
            "game_category": "casual",
            "ad_type": "interstitial"
          },
          "timeout": 3000
        }
      },
      {
        "type": "vast",
        "vastTags": [
          "https://api.applixi.com/v1/vast?apiKey=YOUR_API_KEY&type=interstitial"
        ]
      }
    ]
  },
  "rewarded": {
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
                "placementId": "YOUR_REWARDED_PLACEMENT_ID"
              }
            }
          ]
        }
      },
      {
        "type": "gam",
        "gam": {
          "enabled": true,
          "networkCode": "YOUR_NETWORK_CODE",
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
          "https://api.applixi.com/v1/vast?apiKey=YOUR_API_KEY&type=rewarded"
        ]
      }
    ]
  }
}
```

### 2. GBSDK Entegrasyonu

```javascript
const gbsdk = new GBSDK.GBSDK();

await gbsdk.init({
  configUrl: 'https://your-cdn.com/ads-config.json',
  debug: true
});

// Interstitial göster
const result = await gbsdk.showInterstitial();
if (result.success) {
  console.log('Ad completed!');
}

// Rewarded göster
const rewardResult = await gbsdk.showRewarded();
if (rewardResult.success) {
  console.log('User earned reward!');
  givePlayerReward();
}
```

---

## 🧪 Test ve Doğrulama

### 1. Waterfall Test

Browser console'da waterfall'u izleyin:

```javascript
// Debug mode açık olmalı
gbsdk.init({ debug: true, ... });

// Console'da görecekleriniz:
// 1. "WaterfallManager: Starting waterfall"
// 2. "WaterfallManager: Trying source 1/3 - prebid"
// 3. "PrebidAdapter: Bids received"
// 4. Eğer Prebid fail olursa: "WaterfallManager: Trying source 2/3 - gam"
// 5. Eğer GAM fail olursa: "WaterfallManager: Trying source 3/3 - vast"
```

### 2. GAM Test

GAM'de test modunu aktif edin:

1. **Admin** → **Global settings** → **Network settings**
2. **Test mode** açın
3. Test creative'lerinizi kullanın

### 3. Prebid Test

Prebid test bidders kullanın:

```json
{
  "bidders": [
    {
      "name": "appnexus",
      "params": {
        "placementId": "13144370"  // AppNexus test placement
      }
    }
  ]
}
```

### 4. Network Inspector

Browser DevTools → Network tab:

1. **Prebid requests**: `prebid.js` yüklendiğini kontrol edin
2. **GAM requests**: `securepubads.g.doubleclick.net` isteklerini kontrol edin
3. **VAST requests**: VAST XML response'larını kontrol edin

---

## 📊 Waterfall Mantığı

GBSDK şu sırayla ad source'ları dener:

```
1. Prebid (Header Bidding)
   ↓ (no fill)
2. Google Ad Manager (GAM)
   ↓ (no fill)
3. VAST Tags (Applixi, vb.)
   ↓ (no fill)
4. No Fill
```

Her source başarısız olursa bir sonrakine geçer. İlk başarılı source kullanılır.

---

## 🔧 Troubleshooting

### Prebid yüklenmiyor
- CDN erişimini kontrol edin
- Console'da `window.pbjs` var mı kontrol edin
- Network tab'da `prebid.js` yüklendiğini kontrol edin

### GAM ads gösterilmiyor
- Network code doğru mu?
- Ad unit path doğru mu?
- Line items active mi?
- Targeting doğru mu?

### Waterfall çalışmıyor
- Debug mode açık mı?
- Config dosyası doğru yüklendi mi?
- Her source'un config'i doğru mu?

---

## 📞 Destek

Sorularınız için:
- GitHub Issues: https://github.com/gamebuster/gbsdk/issues
- Email: support@gamebuster.gg

