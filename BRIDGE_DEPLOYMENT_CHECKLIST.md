# 🚀 GBSDK BRIDGE DEPLOYMENT CHECKLIST

**Date:** December 6, 2024  
**Launch Date:** December 9, 2024 (3 days)

---

## 📦 NPM Packages to Publish

### 1. Core SDK: `@gamebuster/gbsdk` ⚠️ NOT PUBLISHED

**Current Status:** Local only  
**Package Name:** `@gamebuster/gbsdk`  
**Version:** 1.0.0  
**Location:** Root directory

**Files to Publish:**
- `dist/gbsdk.js` (38.34KB minified)
- `package.json`
- `README.md`
- `LICENSE`

**Publish Command:**
```bash
npm run build
npm publish --access public
```

**Dependencies:** None (zero-dependency)

---

### 2. Phaser 3 Bridge: `@gamebuster/phaser-3` ⚠️ NOT PUBLISHED

**Current Status:** Local only  
**Package Name:** `@gamebuster/phaser-3`  
**Version:** 1.0.0  
**Location:** `bridges/phaser-npm/`

**Files to Publish:**
- `dist/index.js` (CJS)
- `dist/index.mjs` (ESM)
- `dist/index.d.ts` (TypeScript definitions)
- `package.json`
- `README.md`
- `LICENSE`

**Build & Publish Commands:**
```bash
cd bridges/phaser-npm
npm install
npm run build
npm publish --access public
```

**Dependencies:**
- `@gamebuster/gbsdk: ^1.0.0` (peer dependency)
- `phaser: ^3.0.0` (peer dependency)

**⚠️ IMPORTANT:** Must publish `@gamebuster/gbsdk` FIRST!

---

## 📁 File-Based Bridges (No NPM Publish Needed)

### 3. Unity 2019-2021 ✅ READY

**Distribution Method:** GitHub releases / UPM Git URL  
**Location:** `bridges/unity/`

**Installation Methods:**
1. **UPM Git URL:**
   ```
   https://github.com/mertmisirlioglu/gbsdk.git?path=/bridges/unity
   ```

2. **Manual Install:**
   - Download `GBSDK.cs` and `GBSDK.jslib`
   - Place in `Assets/Plugins/GBSDK/`

**Files:**
- `GBSDK.cs` - C# wrapper
- `GBSDK.jslib` - JavaScript bridge
- `package.json` - UPM manifest
- `README.md` - Documentation

**Status:** ✅ Ready to use

---

### 4. Unity 2022+/Unity 6 ✅ READY

**Distribution Method:** GitHub releases / UPM Git URL  
**Location:** `bridges/unity2022/`

**Installation Methods:**
1. **UPM Git URL:**
   ```
   https://github.com/mertmisirlioglu/gbsdk.git?path=/bridges/unity2022
   ```

2. **Manual Install:**
   - Download `GBSDK.cs` and `GBSDK.jslib`
   - Place in `Assets/Plugins/GBSDK/`

**Status:** ✅ Ready to use

---

### 5. Godot 4.x ✅ READY

**Distribution Method:** Godot Asset Library / GitHub  
**Location:** `bridges/godot/`

**Installation Methods:**
1. **Godot Asset Library:** (After submission)
2. **Manual Install:**
   - Download `addons/gbsdk/` folder
   - Place in project's `addons/` directory
   - Enable plugin in Project Settings

**Files:**
- `addons/gbsdk/gbsdk.gd` - Main script
- `addons/gbsdk/plugin.cfg` - Plugin config
- `addons/gbsdk/plugin.gd` - Plugin registration
- `README.md` - Documentation

**Status:** ✅ Ready to use

---

### 6. Construct 3 ✅ READY

**Distribution Method:** Construct 3 Addon Manager / GitHub  
**Location:** `bridges/construct3/`

**Installation Methods:**
1. **Construct 3 Addon Manager:** (After submission)
2. **Manual Install:**
   - Create `.c3addon` file (ZIP all files)
   - Install via Construct 3 menu

**Files:**
- `addon.json` - Addon manifest
- `aces.json` - Actions, Conditions, Expressions
- `c3runtime/` - Runtime files
- `lang/` - Localization
- `icon.svg` - Icon
- `README.md` - Documentation

**Status:** ✅ Ready to use

---

### 7. Cocos Creator ✅ READY

**Distribution Method:** Cocos Store / GitHub  
**Location:** `bridges/cocos/`

**Installation Methods:**
1. **Cocos Store:** (After submission)
2. **Manual Install:**
   - Copy `bridges/cocos/` to project's `extensions/gbsdk/`
   - Restart Cocos Creator
   - Extension auto-installs API files

**Files:**
- `package.json` - Extension manifest
- `main.js` - Extension loader
- `i18n/` - Localization
- `templates/gbsdk-api/` - TypeScript API
- `README.md` - Documentation

**Status:** ✅ Ready to use

---

### 8. HTML5 ✅ READY

**Distribution Method:** CDN / Direct download  
**Location:** `bridges/html5/`

**Installation Methods:**
1. **CDN (After NPM publish):**
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@gamebuster/gbsdk@latest/dist/gbsdk.js"></script>
   ```

2. **Direct Download:**
   - Download `dist/gbsdk.js`
   - Include in HTML

**Files:**
- `example.html` - Complete demo
- `README.md` - Documentation

**Status:** ✅ Ready to use (after core SDK published)

---


