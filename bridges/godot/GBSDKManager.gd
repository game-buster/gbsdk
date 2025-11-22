# GBSDKManager.gd
# Godot integration for GBSDK - GameBuster Ads SDK
# This script provides a clean GDScript API for GBSDK integration

extends Node

# Signals for ad events
signal gbsdk_initialized
signal interstitial_completed(success: bool, reason: String)
signal rewarded_completed(success: bool, reason: String)
signal reward_granted
signal game_started
signal game_ended

# Configuration
export var config_url: String = "https://your-config-url.json"
export var debug_mode: bool = true
export var auto_initialize: bool = true

# State
var is_initialized: bool = false
var is_html5: bool = false

func _ready():
	# Check if running in HTML5
	is_html5 = OS.get_name() == "HTML5"
	
	if not is_html5:
		print("GBSDK: Not running in HTML5, ads will be simulated")
		is_initialized = true
		emit_signal("gbsdk_initialized")
		return
	
	if auto_initialize:
		initialize_gbsdk()

# Initialize GBSDK with configuration
func initialize_gbsdk(custom_config: Dictionary = {}):
	if is_initialized:
		print("GBSDK: Already initialized")
		return
	
	if not is_html5:
		print("GBSDK: Simulating initialization (not HTML5)")
		is_initialized = true
		emit_signal("gbsdk_initialized")
		return
	
	print("GBSDK: Initializing...")
	
	# Build configuration
	var config = {
		"configUrl": config_url,
		"debug": debug_mode
	}
	
	# Merge custom config
	for key in custom_config:
		config[key] = custom_config[key]
	
	# JavaScript initialization
	var js_code = """
		if (typeof window.gbsdk === 'undefined') {
			if (typeof GBSDK === 'undefined') {
				console.error('GBSDK not found. Include the GBSDK script in your HTML.');
				window.gbsdk_init_result = 'error';
			} else {
				window.gbsdk = new GBSDK.GBSDK();
				window.gbsdk.init(%s).then(() => {
					window.gbsdk_init_result = 'success';
					console.log('GBSDK initialized successfully');
				}).catch((error) => {
					console.error('GBSDK initialization failed:', error);
					window.gbsdk_init_result = 'error';
				});
			}
		} else {
			window.gbsdk_init_result = 'already_initialized';
		}
	""" % [JSON.print(config)]
	
	JavaScript.eval(js_code)
	
	# Wait for initialization result
	_wait_for_init_result()

# Wait for JavaScript initialization to complete
func _wait_for_init_result():
	var check_code = "window.gbsdk_init_result || 'pending'"
	var max_attempts = 50  # 5 seconds max
	var attempts = 0
	
	while attempts < max_attempts:
		var result = JavaScript.eval(check_code)
		
		if result == "success":
			is_initialized = true
			print("GBSDK: Initialization successful")
			emit_signal("gbsdk_initialized")
			break
		elif result == "error":
			print("GBSDK: Initialization failed")
			break
		elif result == "already_initialized":
			is_initialized = true
			print("GBSDK: Already initialized")
			emit_signal("gbsdk_initialized")
			break
		
		yield(get_tree().create_timer(0.1), "timeout")
		attempts += 1
	
	if attempts >= max_attempts:
		print("GBSDK: Initialization timeout")

# Show interstitial ad
func show_interstitial():
	if not is_initialized:
		print("GBSDK: Not initialized")
		emit_signal("interstitial_completed", false, "not_initialized")
		return
	
	if not is_html5:
		print("GBSDK: Simulating interstitial ad")
		yield(get_tree().create_timer(1.0), "timeout")
		emit_signal("interstitial_completed", true, "")
		return
	
	print("GBSDK: Showing interstitial ad...")
	
	var js_code = """
		if (window.gbsdk && window.gbsdk.canShow('interstitial')) {
			window.gbsdk.showInterstitial().then(result => {
				window.gbsdk_interstitial_result = JSON.stringify(result);
			}).catch(error => {
				window.gbsdk_interstitial_result = JSON.stringify({success: false, reason: 'error'});
			});
		} else {
			window.gbsdk_interstitial_result = JSON.stringify({success: false, reason: 'not_available'});
		}
	"""
	
	JavaScript.eval(js_code)
	_wait_for_interstitial_result()

# Wait for interstitial ad result
func _wait_for_interstitial_result():
	var check_code = "window.gbsdk_interstitial_result || 'pending'"
	var max_attempts = 100  # 10 seconds max
	var attempts = 0
	
	while attempts < max_attempts:
		var result_json = JavaScript.eval(check_code)
		
		if result_json != "pending":
			var result = JSON.parse(result_json).result
			var success = result.get("success", false)
			var reason = result.get("reason", "")
			
			print("GBSDK: Interstitial result - success: %s, reason: %s" % [success, reason])
			emit_signal("interstitial_completed", success, reason)
			
			# Clear result
			JavaScript.eval("window.gbsdk_interstitial_result = undefined")
			break
		
		yield(get_tree().create_timer(0.1), "timeout")
		attempts += 1
	
	if attempts >= max_attempts:
		print("GBSDK: Interstitial timeout")
		emit_signal("interstitial_completed", false, "timeout")

# Show rewarded ad
func show_rewarded():
	if not is_initialized:
		print("GBSDK: Not initialized")
		emit_signal("rewarded_completed", false, "not_initialized")
		return
	
	if not is_html5:
		print("GBSDK: Simulating rewarded ad")
		yield(get_tree().create_timer(2.0), "timeout")
		emit_signal("rewarded_completed", true, "")
		emit_signal("reward_granted")
		return
	
	print("GBSDK: Showing rewarded ad...")
	
	var js_code = """
		if (window.gbsdk && window.gbsdk.canShow('rewarded')) {
			window.gbsdk.showRewarded().then(result => {
				window.gbsdk_rewarded_result = JSON.stringify(result);
			}).catch(error => {
				window.gbsdk_rewarded_result = JSON.stringify({success: false, reason: 'error'});
			});
		} else {
			window.gbsdk_rewarded_result = JSON.stringify({success: false, reason: 'not_available'});
		}
	"""
	
	JavaScript.eval(js_code)
	_wait_for_rewarded_result()

# Wait for rewarded ad result
func _wait_for_rewarded_result():
	var check_code = "window.gbsdk_rewarded_result || 'pending'"
	var max_attempts = 100  # 10 seconds max
	var attempts = 0
	
	while attempts < max_attempts:
		var result_json = JavaScript.eval(check_code)
		
		if result_json != "pending":
			var result = JSON.parse(result_json).result
			var success = result.get("success", false)
			var reason = result.get("reason", "")
			
			print("GBSDK: Rewarded result - success: %s, reason: %s" % [success, reason])
			emit_signal("rewarded_completed", success, reason)
			
			if success:
				emit_signal("reward_granted")
			
			# Clear result
			JavaScript.eval("window.gbsdk_rewarded_result = undefined")
			break
		
		yield(get_tree().create_timer(0.1), "timeout")
		attempts += 1
	
	if attempts >= max_attempts:
		print("GBSDK: Rewarded timeout")
		emit_signal("rewarded_completed", false, "timeout")

# Track game started
func track_game_started():
	if not is_initialized:
		print("GBSDK: Not initialized, game started ignored")
		return
	
	if not is_html5:
		print("GBSDK: Simulating game started")
		emit_signal("game_started")
		return
	
	JavaScript.eval("if (window.gbsdk) window.gbsdk.gameStarted()")
	emit_signal("game_started")
	print("GBSDK: Game started tracked")

# Track game ended
func track_game_ended():
	if not is_initialized:
		print("GBSDK: Not initialized, game ended ignored")
		return
	
	if not is_html5:
		print("GBSDK: Simulating game ended")
		emit_signal("game_ended")
		return
	
	JavaScript.eval("if (window.gbsdk) window.gbsdk.gameEnded()")
	emit_signal("game_ended")
	print("GBSDK: Game ended tracked")

# Check if ad can be shown
func can_show_ad(ad_type: String) -> bool:
	if not is_initialized:
		return false
	
	if not is_html5:
		return true  # Always return true for testing
	
	var js_code = "window.gbsdk ? window.gbsdk.canShow('%s') : false" % [ad_type]
	return JavaScript.eval(js_code)

# Get initialization status
func is_ready() -> bool:
	return is_initialized

# Destroy GBSDK
func destroy():
	if not is_html5:
		return
	
	if is_initialized:
		JavaScript.eval("if (window.gbsdk) window.gbsdk.destroy()")
		is_initialized = false
		print("GBSDK: Destroyed")

# Example usage in your game scenes:
"""
# In your main scene or autoload:

extends Node

func _ready():
	# Get GBSDK manager
	var gbsdk = get_node("/root/GBSDKManager")  # If autoloaded
	
	# Connect to signals
	gbsdk.connect("gbsdk_initialized", self, "_on_gbsdk_ready")
	gbsdk.connect("interstitial_completed", self, "_on_interstitial_completed")
	gbsdk.connect("rewarded_completed", self, "_on_rewarded_completed")
	gbsdk.connect("reward_granted", self, "_on_reward_granted")

func _on_gbsdk_ready():
	print("GBSDK is ready!")
	# Track game start
	get_node("/root/GBSDKManager").track_game_started()

func show_interstitial_ad():
	var gbsdk = get_node("/root/GBSDKManager")
	if gbsdk.can_show_ad("interstitial"):
		gbsdk.show_interstitial()

func show_rewarded_ad():
	var gbsdk = get_node("/root/GBSDKManager")
	if gbsdk.can_show_ad("rewarded"):
		gbsdk.show_rewarded()

func _on_interstitial_completed(success: bool, reason: String):
	if success:
		print("Interstitial ad completed")
	else:
		print("Interstitial ad failed: ", reason)

func _on_rewarded_completed(success: bool, reason: String):
	if success:
		print("Rewarded ad completed")
	else:
		print("Rewarded ad failed: ", reason)

func _on_reward_granted():
	print("Player earned reward!")
	# Grant coins, lives, power-ups, etc.
	PlayerData.coins += 100
"""
