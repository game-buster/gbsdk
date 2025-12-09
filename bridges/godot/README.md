# GameBuster SDK - Godot Plugin

Production-ready in-game ads SDK for Godot with VAST 4.x + Google IMA HTML5 support.

## Compatibility

- **Godot 4.x**: ✅ Fully supported
- **Godot 3.x**: ⚠️ Use the legacy version (see branches)
- **Export Target**: HTML5/Web only

## Installation

### Method 1: AssetLib (Recommended)

1. Open Godot Editor
2. Go to AssetLib tab
3. Search for "GameBuster SDK"
4. Click Download → Install

### Method 2: Manual Installation

1. Download the `addons/gbsdk` folder
2. Copy it to your project's `addons/` directory
3. In Godot, go to Project → Project Settings → Plugins
4. Enable "GameBuster SDK"

The plugin will automatically add `GBSDK` as an autoload singleton.

## Quick Start

### 1. Initialize the SDK

```gdscript
extends Node

func _ready():
	# Connect to initialization signal
	GBSDK.connect("gbsdk_initialized", _on_gbsdk_ready)
	
	# Initialize (auto-initialization is enabled by default)
	# Or manually:
	# GBSDK.initialize_gbsdk({"debug": true})

func _on_gbsdk_ready():
	print("GBSDK is ready!")
	GBSDK.track_game_started()
```

### 2. Show Interstitial Ads

```gdscript
func show_level_complete_ad():
	# Connect to completion signal
	GBSDK.connect("interstitial_completed", _on_interstitial_done)
	
	# Show the ad
	if GBSDK.can_show_ad("interstitial"):
		GBSDK.show_interstitial()

func _on_interstitial_done(success: bool, reason: String):
	if success:
		print("Ad completed successfully")
		# Continue to next level
		get_tree().change_scene_to_file("res://scenes/next_level.tscn")
	else:
		print("Ad failed: ", reason)
		# Still continue (don't punish player for ad failure)
		get_tree().change_scene_to_file("res://scenes/next_level.tscn")
```

### 3. Show Rewarded Ads

```gdscript
func show_reward_ad():
	# Connect to signals
	GBSDK.connect("rewarded_completed", _on_rewarded_done)
	GBSDK.connect("reward_granted", _on_reward_granted)
	
	# Show the ad
	if GBSDK.can_show_ad("rewarded"):
		GBSDK.show_rewarded()

func _on_rewarded_done(success: bool, reason: String):
	if success:
		print("Rewarded ad completed")
	else:
		print("Rewarded ad failed: ", reason)

func _on_reward_granted():
	print("Player earned reward!")
	# Grant the reward
	PlayerData.coins += 100
	update_ui()
```

### 4. Track Gameplay

```gdscript
func start_game():
	GBSDK.track_game_started()
	# Start your game logic

func game_over():
	GBSDK.track_game_ended()
	# Show game over screen
```

## API Reference

### Signals

- `gbsdk_initialized` - Emitted when SDK is ready
- `interstitial_completed(success: bool, reason: String)` - Interstitial ad finished
- `rewarded_completed(success: bool, reason: String)` - Rewarded ad finished
- `reward_granted` - Player earned reward (only on success)
- `game_started` - Game session started
- `game_ended` - Game session ended

### Methods

- `initialize_gbsdk(config: Dictionary = {})` - Initialize SDK
- `show_interstitial()` - Show interstitial ad
- `show_rewarded()` - Show rewarded ad
- `track_game_started()` - Track gameplay start
- `track_game_ended()` - Track gameplay end
- `can_show_ad(ad_type: String) -> bool` - Check if ad can be shown
- `is_ready() -> bool` - Check if SDK is initialized
- `destroy()` - Clean up SDK resources

### Configuration

```gdscript
# Custom configuration
var config = {
	"debug": true,
	"configUrl": "https://your-config-url.json",
	"cooldownSec": 90,
	"sessionCap": 20
}
GBSDK.initialize_gbsdk(config)
```

## HTML Export Setup

Make sure your exported HTML includes the GBSDK script. Add this to your export template or HTML file:

```html
<script src="https://cdn.game-buster.com/gbsdk.js"></script>
```

## Testing

The plugin works in the Godot editor and simulates ads when not running in HTML5:
- Interstitial ads: 1 second delay
- Rewarded ads: 2 second delay
- All ads succeed in simulation mode

## Support

- GitHub: https://github.com/game-buster/gbsdk
- Issues: https://github.com/game-buster/gbsdk/issues
- Documentation: https://github.com/game-buster/gbsdk#readme

## License

MIT License - See LICENSE file for details

