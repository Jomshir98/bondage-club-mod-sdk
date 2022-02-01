import { ThrowError } from './errors';
import { GetModsInfo, RegisterMod } from './modRegistry';
import type { ModSDKGlobalAPI } from './api';
import { IsObject } from './utils';
import { GetPatchedFunctionsInfo } from './patching';

function CreateGlobalAPI(): ModSDKGlobalAPI {
	const result: ModSDKGlobalAPI = {
		version: VERSION,
		registerMod: RegisterMod,
		getModsInfo: GetModsInfo,
		getPatchingInfo: GetPatchedFunctionsInfo,
	};

	return Object.freeze(result);
}

function Init(): ModSDKGlobalAPI {
	if (typeof window.bcModSdk === 'undefined') {
		return window.bcModSdk = CreateGlobalAPI();
	}
	if (!IsObject(window.bcModSdk)) {
		ThrowError('Failed to init Mod SDK: Name already in use');
	}
	if (window.bcModSdk.version !== VERSION) {
		ThrowError(`Failed to init Mod SDK: Different version already loaded ('${VERSION}' vs '${window.bcModSdk.version}')`);
	}
	// Otherwise this exact version of Mod SDK is already loaded, so do nothing
	return window.bcModSdk;
}

/** @public */
const bcModSdk = Init();
// Make this both CommonJS and IIFE bundle
if (typeof exports !== 'undefined') {
	Object.defineProperty(exports, '__esModule', {
		value: true,
	});
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	exports.default = bcModSdk;
}
/** @public */
export default bcModSdk;

export * from './api';
