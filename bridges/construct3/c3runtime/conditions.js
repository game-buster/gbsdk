"use strict";

{
	self.C3.Plugins.GameBuster_GBSDK.Cnds =
	{
		OnInterstitialComplete(tag)
		{
			return tag === "" || tag === this._lastTriggeredTag;
		},

		OnRewardedComplete(tag)
		{
			return tag === "" || tag === this._lastTriggeredTag;
		},

		LastAdSuccess()
		{
			return this._lastAdSuccess;
		},

		IsInitialized()
		{
			return this._isInitialized;
		},

		CanShowAd(adType)
		{
			if (!this._isInitialized) return false;
			// In preview mode, always return true
			if (this._runtime.IsPreview()) return true;
			// This will be checked via DOM side
			return true;
		},

		DebugModeActive()
		{
			return this._debugMode;
		}
	};
}

