"use strict";

{
	const SDK = self.SDK;

	////////////////////////////////////////////
	// The plugin ID is how Construct identifies different kinds of plugins.
	// *** NEVER CHANGE THE PLUGIN ID! ***
	const PLUGIN_ID = "GameBuster_GBSDK";
	////////////////////////////////////////////

	const PLUGIN_VERSION = "1.0.0";
	const PLUGIN_CATEGORY = "monetisation";

	const PLUGIN_CLASS = SDK.Plugins.GameBuster_GBSDK = class GBSDKPlugin extends SDK.IPluginBase
	{
		constructor()
		{
			super(PLUGIN_ID);

			SDK.Lang.PushContext("plugins." + PLUGIN_ID.toLowerCase());

			this._info.SetName(self.lang(".name"));
			this._info.SetDescription(self.lang(".description"));
			this._info.SetVersion(PLUGIN_VERSION);
			this._info.SetCategory(PLUGIN_CATEGORY);
			this._info.SetAuthor("GameBuster");
			this._info.SetHelpUrl(self.lang(".help-url"));
			this._info.SetIsSingleGlobal(true);

			this._info.SetSupportedRuntimes(["c3"]);
			
			// GBSDK script dependency - users need to include this in their HTML
			// Or it can be auto-loaded from CDN
			this._info.AddRemoteScriptDependency(
				"https://cdn.jsdelivr.net/npm/@gamebuster/gbsdk@latest/dist/gbsdk.js"
			);
			
			this._info.SetDOMSideScripts(["c3runtime/domSide.js"]);

			SDK.Lang.PushContext(".properties");

			this._info.SetProperties([
				new SDK.PluginProperty("check", "debug-mode", false),
				new SDK.PluginProperty("link", "documentation", {
					linkCallback: () => window.open("https://github.com/game-buster/gbsdk#readme"),
					callbackType: "once-for-type"
				})
			]);

			SDK.Lang.PopContext(); // .properties
			SDK.Lang.PopContext();
		}
	};

	PLUGIN_CLASS.Register(PLUGIN_ID, PLUGIN_CLASS);
}

