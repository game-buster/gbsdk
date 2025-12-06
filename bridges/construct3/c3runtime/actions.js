"use strict";

{
	self.C3.Plugins.GameBuster_GBSDK.Acts =
	{		
		async InitializeSDK(debug)
		{
			this._debugMode = debug;
			const {result, err} = await this.PostToDOMAsync("InitializeSDK", {debug});
			if (err) {
				this._lastError = err;
				this._isInitialized = false;
			} else {
				this._isInitialized = result;
			}
		},

		GameStarted()
		{
			if (!this._isInitialized) {
				console.warn("GBSDK: Not initialized. Call Initialize SDK first.");
				return;
			}
			this.PostToDOMAsync("GameStarted");
		},

		GameEnded()
		{
			if (!this._isInitialized) {
				console.warn("GBSDK: Not initialized. Call Initialize SDK first.");
				return;
			}
			this.PostToDOMAsync("GameEnded");
		},

		async ShowInterstitial(tag)
		{
			if (!this._isInitialized) {
				console.error("GBSDK: Not initialized. Call Initialize SDK first.");
				this._lastAdSuccess = false;
				this._lastAdReason = "not_initialized";
				this._lastTriggeredTag = tag;
				this.Trigger(self.C3.Plugins.GameBuster_GBSDK.Cnds.OnInterstitialComplete);
				return;
			}

			// Simulate in preview mode
			if (this._runtime.IsPreview()) {
				await new Promise(resolve => setTimeout(resolve, 1000));
				this._lastAdSuccess = true;
				this._lastAdReason = "";
				this._lastTriggeredTag = tag;
				this.Trigger(self.C3.Plugins.GameBuster_GBSDK.Cnds.OnInterstitialComplete);
				return;
			}

			const {result, err} = await this.PostToDOMAsync("ShowInterstitial");
			if (err) {
				this._lastError = err;
				this._lastAdSuccess = false;
				this._lastAdReason = err;
			} else {
				this._lastAdSuccess = result.success;
				this._lastAdReason = result.reason || "";
			}
			this._lastTriggeredTag = tag;
			
			this.Trigger(self.C3.Plugins.GameBuster_GBSDK.Cnds.OnInterstitialComplete);
		},

		async ShowRewarded(tag)
		{
			if (!this._isInitialized) {
				console.error("GBSDK: Not initialized. Call Initialize SDK first.");
				this._lastAdSuccess = false;
				this._lastAdReason = "not_initialized";
				this._lastTriggeredTag = tag;
				this.Trigger(self.C3.Plugins.GameBuster_GBSDK.Cnds.OnRewardedComplete);
				return;
			}

			// Simulate in preview mode
			if (this._runtime.IsPreview()) {
				await new Promise(resolve => setTimeout(resolve, 2000));
				this._lastAdSuccess = true;
				this._lastAdReason = "";
				this._lastTriggeredTag = tag;
				this.Trigger(self.C3.Plugins.GameBuster_GBSDK.Cnds.OnRewardedComplete);
				return;
			}

			const {result, err} = await this.PostToDOMAsync("ShowRewarded");
			if (err) {
				this._lastError = err;
				this._lastAdSuccess = false;
				this._lastAdReason = err;
			} else {
				this._lastAdSuccess = result.success;
				this._lastAdReason = result.reason || "";
			}
			this._lastTriggeredTag = tag;
			
			this.Trigger(self.C3.Plugins.GameBuster_GBSDK.Cnds.OnRewardedComplete);
		}
	};
}

