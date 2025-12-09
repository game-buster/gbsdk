# GameBuster WebGL Template for Unity

A professional WebGL template for Unity games with **GameBuster SDK pre-integrated**.

Based on Unity's default template with GameBuster SDK automatically loaded from CDN.

## 🎨 Features

- ✅ **GameBuster SDK Auto-loaded** - No manual script inclusion needed
- ✅ **Unity Default Template** - 100% compatible with Unity's standard template
- ✅ **Responsive** - Works on desktop and mobile devices
- ✅ **Progress Bar** - Animated loading progress
- ✅ **Fullscreen Support** - One-click fullscreen toggle
- ✅ **Error Handling** - User-friendly error messages
- ✅ **Production Ready** - Tested and optimized
- ✅ **Purple Gradient Background** - GameBuster branded design

## 🚀 Installation

### Method 1: Copy to Unity Project

1. Copy the entire `GameBuster` folder to your Unity project:
   ```
   YourProject/Assets/WebGLTemplates/GameBuster/
   ```

2. Select the template in Unity:
   - Go to `Edit → Project Settings → Player`
   - Select the `WebGL` tab
   - Under `Resolution and Presentation`, find `WebGL Template`
   - Select `GameBuster` from the dropdown

3. Build your game:
   - `File → Build Settings → WebGL → Build`

4. Done! Your game now includes GameBuster SDK automatically.

### Method 2: UPM Package

If you installed the Unity bridge via UPM, the template is already included.

## 🎮 What's Included

### GameBuster SDK Integration

The template automatically includes the GameBuster SDK from official CDN:

```html
<script src="https://cdn.game-buster.com/gbsdk.js"></script>
```

This means:
- ✅ No manual script tags needed
- ✅ Always uses the latest SDK version
- ✅ Fast CDN delivery
- ✅ Works with GBSDK.cs and GBSDK.jslib automatically
- ✅ Official GameBuster CDN

### Visual Design

- **Background**: Purple gradient (customizable in CSS)
- **Logo**: Unity logo (standard)
- **Progress Bar**: Unity's standard progress bar
- **Footer**: Game title + fullscreen button
- **Colors**: Purple gradient background + white text
- **Assets**: All Unity default template assets included (logos, icons, etc.)

## 🎨 Customization

### Change Background Color

Edit the `body` style in `TemplateData/style.css`:

```css
body {
    background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Change Text Color

Edit the `#unity-build-title` style in `TemplateData/style.css`:

```css
#unity-build-title {
    color: white; /* Change to your preferred color */
}
```

### Use Different Assets

Replace the PNG files in `TemplateData/` folder with your own branded assets:
- `unity-logo-dark.png` / `unity-logo-light.png` - Loading logo
- `progress-bar-empty-dark.png` / `progress-bar-empty-light.png` - Progress bar background
- `progress-bar-full-dark.png` / `progress-bar-full-light.png` - Progress bar fill
- `webgl-logo.png` - Footer logo
- `fullscreen-button.png` - Fullscreen button icon
- `favicon.ico` - Browser tab icon

## 📱 Mobile Support

The template automatically detects mobile devices and adjusts:
- Viewport meta tag for proper scaling
- Responsive font sizes
- Touch-friendly UI elements

## 🔧 Technical Details

### Unity Variables Used

The template uses Unity's standard template variables:

- `{{{ PRODUCT_NAME }}}` - Game title
- `{{{ COMPANY_NAME }}}` - Company name
- `{{{ PRODUCT_VERSION }}}` - Version
- `{{{ LOADER_FILENAME }}}` - Unity loader
- `{{{ DATA_FILENAME }}}` - Game data
- `{{{ FRAMEWORK_FILENAME }}}` - Unity framework
- `{{{ CODE_FILENAME }}}` - Game code
- `{{{ MEMORY_FILENAME }}}` - Memory file (optional)
- `{{{ SYMBOLS_FILENAME }}}` - Debug symbols (optional)

### Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎯 Usage with GameBuster SDK

Once your game is built with this template, you can use the GameBuster SDK in your C# code:

```csharp
using GameBuster;

public class AdManager : MonoBehaviour
{
    async void Start()
    {
        // Initialize SDK
        bool success = await GBSDK.Initialize(debug: true);
        
        if (success)
        {
            Debug.Log("GameBuster SDK ready!");
            
            // Show ads
            var result = await GBSDK.ShowInterstitial();
            if (result.success)
            {
                Debug.Log("Ad shown successfully!");
            }
        }
    }
}
```

## 📄 License

This template is part of the GameBuster SDK and follows the same MIT license.

## 🆘 Support

For issues or questions:
- GitHub: https://github.com/mertmisirlioglu/gbsdk
- Documentation: See main README.md

---

**Powered by GameBuster** ⚡

