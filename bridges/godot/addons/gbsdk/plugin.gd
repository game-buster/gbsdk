@tool
extends EditorPlugin

func _enter_tree():
	# Add the GBSDK autoload singleton
	add_autoload_singleton("GBSDK", "res://addons/gbsdk/gbsdk.gd")
	print("GameBuster SDK plugin enabled")

func _exit_tree():
	# Remove the autoload singleton
	remove_autoload_singleton("GBSDK")
	print("GameBuster SDK plugin disabled")

