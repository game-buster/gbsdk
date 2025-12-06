"use strict";

{
	self.C3.Plugins.GameBuster_GBSDK.Exps =
	{
		LastAdSuccess()
		{
			return this._lastAdSuccess ? 1 : 0;
		},

		LastAdReason()
		{
			return this._lastAdReason || "";
		},

		SDKVersion()
		{
			return "1.0.0";
		},

		LastError()
		{
			return this._lastError || "";
		}
	};
}

