import { ThrowError } from './errors';
import { GetModsInfo, RegisterMod } from './modRegistry';
import type { ModSDKGlobalAPI } from './api';

function CreateGlobalAPI(): ModSDKGlobalAPI {
	const result: ModSDKGlobalAPI = {
		version: VERSION,
		registerMod: RegisterMod,
		getModsInfo: GetModsInfo,
	};

	return Object.freeze(result);
}

function Init(): ModSDKGlobalAPI {
	if (typeof window.bcModSdk === 'undefined') {
		return window.bcModSdk = CreateGlobalAPI();
	}
	if (!window.bcModSdk || typeof window.bcModSdk !== 'object' || Array.isArray(window.bcModSdk)) {
		ThrowError('Failed to init Mod SDK: Name already in use');
	}
	if (window.bcModSdk.version !== VERSION) {
		ThrowError(`Failed to init Mod SDK: Different version already loaded ('${VERSION}' vs '${window.bcModSdk.version}')`);
	}
	// Otherwise this exact version of Mod SDK is already loaded, so do nothing
	return window.bcModSdk;
}

const API = Init();
// Make this both CommonJS and IIFE bundle
if (typeof exports !== 'undefined') {
	Object.defineProperty(exports, '__esModule', {
		value: true,
	});
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	exports.default = API;
}
export default API;
