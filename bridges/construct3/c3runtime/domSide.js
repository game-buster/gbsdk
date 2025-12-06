"use strict";

{
	const DOM_COMPONENT_ID = "GameBuster_GBSDK";
	
	const HANDLER_CLASS = class GameBusterGBSDKDOMHandler extends self.DOMHandler
	{
		constructor(iRuntime)
		{
			super(iRuntime, DOM_COMPONENT_ID);
			
			this._gbsdk = null;
			this._isInitialized = false;
			
			this.AddRuntimeMessageHandlers([
				["InitializeSDK", (e) => this._InitializeSDK(e)],
				["GameStarted", () => this._GameStarted()],
				["GameEnded", () => this._GameEnded()],
				["ShowInterstitial", () => this._ShowInterstitial()],
				["ShowRewarded", () => this._ShowRewarded()]
			]);
		}
		
		async _InitializeSDK(e)
		{
			try {
				// Check if GBSDK is loaded
				if (typeof GBSDK === 'undefined' || typeof GBSDK.GBSDK === 'undefined') {
					console.error('GBSDK not found. Make sure to include the GBSDK script in your HTML.');
					return {
						"result": false,
						"err": "GBSDK not loaded"
					};
				}
				
				// Create GBSDK instance
				this._gbsdk = new GBSDK.GBSDK();
				
				// Initialize with config
				const config = e.debug ? { debug: true } : {};
				await this._gbsdk.init(config);
				
				this._isInitialized = true;
				console.log('GBSDK initialized successfully from Construct 3');
				
				return {
					"result": true
				};
			} catch (error) {
				console.error('GBSDK initialization error:', error);
				return {
					"result": false,
					"err": error.message || "Initialization failed"
				};
			}
		}
		
		_GameStarted()
		{
			if (!this._isInitialized || !this._gbsdk) {
				console.warn('GBSDK not initialized');
				return;
			}
			
			try {
				this._gbsdk.gameStarted();
			} catch (error) {
				console.error('GBSDK gameStarted error:', error);
			}
		}
		
		_GameEnded()
		{
			if (!this._isInitialized || !this._gbsdk) {
				console.warn('GBSDK not initialized');
				return;
			}
			
			try {
				this._gbsdk.gameEnded();
			} catch (error) {
				console.error('GBSDK gameEnded error:', error);
			}
		}
		
		async _ShowInterstitial()
		{
			if (!this._isInitialized || !this._gbsdk) {
				return {
					"result": { success: false, reason: "not_initialized" },
					"err": "GBSDK not initialized"
				};
			}
			
			try {
				const result = await this._gbsdk.showInterstitial();
				return {
					"result": result
				};
			} catch (error) {
				console.error('GBSDK showInterstitial error:', error);
				return {
					"result": { success: false, reason: "error" },
					"err": error.message || "Unknown error"
				};
			}
		}
		
		async _ShowRewarded()
		{
			if (!this._isInitialized || !this._gbsdk) {
				return {
					"result": { success: false, reason: "not_initialized" },
					"err": "GBSDK not initialized"
				};
			}
			
			try {
				const result = await this._gbsdk.showRewarded();
				return {
					"result": result
				};
			} catch (error) {
				console.error('GBSDK showRewarded error:', error);
				return {
					"result": { success: false, reason: "error" },
					"err": error.message || "Unknown error"
				};
			}
		}
	};
	
	self.RuntimeInterface.AddDOMHandlerClass(HANDLER_CLASS);
}

