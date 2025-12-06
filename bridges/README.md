# GBSDK Platform Bridges

This directory contains official platform integrations for GameBuster SDK across all major game engines and frameworks.

## 📦 Available Platforms

### Game Engines

#### Unity
- **[Unity 2019.4 - 2021.x](./unity/)** - Unity Package Manager (UPM) package for older Unity versions
- **[Unity 2022+ / Unity 6](./unity2022/)** - UPM package optimized for latest Unity versions

#### Construct 3
- **[Construct 3 Plugin](./construct3/)** - Complete C3 addon with Actions, Conditions, and Expressions
- No coding required - visual scripting support

#### Godot
- **[Godot 4.x Plugin](./godot/)** - Autoload singleton plugin for Godot 4
- Signal-based event system
- HTML5 export support

#### Cocos Creator
- **[Cocos Creator 3.x Extension](./cocos/)** - Editor extension with TypeScript API
- Automatic asset copying
- Build template integration

### JavaScript Frameworks

#### Phaser 3
- **[Phaser 3 NPM Package](./phaser-npm/)** - `@gamebuster/phaser-3`
- TypeScript support
- Auto pause/resume during ads
- Event-driven architecture

#### HTML5/Vanilla JavaScript
- **[HTML5 Integration](./html5/)** - Pure JavaScript integration
- Zero dependencies
- CDN or NPM installation
- Works with any HTML5 game framework

## 🚀 Quick Start by Platform

### Unity (2019-2021)
```bash
# Add via Package Manager
# Window → Package Manager → + → Add package from git URL
https://github.com/game-buster/gbsdk.git?path=/bridges/unity
```

### Unity (2022+/Unity 6)
```bash
# Add via Package Manager
# Window → Package Manager → + → Add package from git URL
https://github.com/game-buster/gbsdk.git?path=/bridges/unity2022
```

### Construct 3
1. Download `bridges/construct3/` folder
2. In C3: Menu → View → Addon Manager → Install new addon
3. Select the folder and restart C3

### Godot 4.x
1. Copy `bridges/godot/addons/gbsdk/` to your project's `addons/` folder
2. Project → Project Settings → Plugins
3. Enable "GameBuster SDK"

### Cocos Creator 3.x
1. Copy `bridges/cocos/` to your project's `extensions/` folder
2. Extensions → Extension Manager
3. Enable "GameBuster SDK"

### Phaser 3
```bash
npm install @gamebuster/phaser-3
```

### HTML5/JavaScript
```html
<script src="https://cdn.jsdelivr.net/npm/@gamebuster/gbsdk@latest/dist/gbsdk.js"></script>
```

## 📚 Documentation

Each platform has its own detailed README with:
- Installation instructions
- Quick start guide
- API reference
- Code examples
- Best practices

Click on the platform links above to view the specific documentation.

## 🎯 Feature Comparison

| Feature | Unity | Construct 3 | Godot | Cocos | Phaser 3 | HTML5 |
|---------|-------|-------------|-------|-------|----------|-------|
| Interstitial Ads | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rewarded Ads | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auto Pause/Resume | ✅ | ✅ | ✅ | ✅ | ✅ | Manual |
| TypeScript Support | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Visual Scripting | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Event System | Callbacks | Conditions | Signals | Promises | Events | Promises |
| Debug Mode | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🔧 Development

### Building Platform Packages

Each platform has its own build process:

**Unity**: No build needed - C# source files are used directly  
**Construct 3**: No build needed - Runtime JavaScript files  
**Godot**: No build needed - GDScript source files  
**Cocos Creator**: No build needed - TypeScript source files  
**Phaser 3**: `cd bridges/phaser-npm && npm run build`  
**HTML5**: Uses main GBSDK build from root

### Testing

Each platform includes example projects or test scenes:
- Unity: See `bridges/unity/README.md` for test scene setup
- Construct 3: Import the addon and use the example events
- Godot: See `bridges/godot/README.md` for test scene
- Cocos Creator: Extension auto-copies demo to assets
- Phaser 3: See `bridges/phaser-npm/README.md` for examples
- HTML5: Open `bridges/html5/example.html` in browser

## 🤝 Contributing

When adding a new platform integration:

1. Create a new folder in `bridges/[platform-name]/`
2. Include a comprehensive README.md
3. Add installation instructions
4. Provide code examples
5. Update this main bridges README
6. Update the root README.md platform table

## 📄 License

All platform bridges are licensed under MIT License - see individual LICENSE files.

## 🆘 Support

- **GitHub Issues**: https://github.com/game-buster/gbsdk/issues
- **Documentation**: https://github.com/game-buster/gbsdk#readme
- **Main SDK**: https://github.com/game-buster/gbsdk

## 🎮 Platform-Specific Notes

### Unity
- WebGL export only
- Requires Unity 2019.4 or later
- Use Unity 2022+ package for latest Unity versions

### Construct 3
- Web export only
- Requires Construct 3 r300+
- Works in both runtime and editor preview

### Godot
- HTML5 export only
- Godot 4.x recommended (Godot 3.x on legacy branch)
- Uses JavaScriptBridge for web communication

### Cocos Creator
- Web export only
- Cocos Creator 3.x required
- Extension auto-installs on first load

### Phaser 3
- Requires Phaser 3.0.0+
- Works with both Webpack and Vite
- Auto pause/resume during ads

### HTML5
- Works with any HTML5 game framework
- No dependencies
- Can be used with Pixi.js, Three.js, Babylon.js, etc.

