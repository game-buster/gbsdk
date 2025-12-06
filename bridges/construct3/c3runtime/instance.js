"use strict";

{
	const C3 = self.C3;
	const DOM_COMPONENT_ID = "GameBuster_GBSDK";

	C3.Plugins.GameBuster_GBSDK.Instance = class GBSDKInstance extends C3.SDKInstanceBase
	{
		constructor(inst, properties)
		{
			super(inst, DOM_COMPONENT_ID);

			// State variables
			this._isInitialized = false;
			this._debugMode = false;
			this._lastError = "";
			this._lastAdSuccess = false;
			this._lastAdReason = "";
			this._lastTriggeredTag = "";

			// Initialize properties from editor
			if (properties) {
				// Properties can be added in type.js if needed
			}
		}

		Release()
		{
			super.Release();
		}
	};
}

