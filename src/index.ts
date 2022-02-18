import { ThrowError } from './errors';
import type { ModSDKGlobalAPI } from './api';
import { API_VERSION, CreateGlobalAPI } from './sdkApi';
import { IsObject } from './utils';

function Init(): ModSDKGlobalAPI {
	if (typeof window.bcModSdk === 'undefined') {
		return window.bcModSdk = CreateGlobalAPI();
	}
	if (!IsObject(window.bcModSdk)) {
		ThrowError('Failed to init Mod SDK: Name already in use');
	}
	if (window.bcModSdk.apiVersion !== API_VERSION) {
		ThrowError(`Failed to init Mod SDK: Different version already loaded ('${VERSION}' vs '${window.bcModSdk.version}')`);
	}
	if (window.bcModSdk.version !== VERSION) {
		alert(
			`Mod SDK warning: Loading different but compatible versions ('${VERSION}' vs '${window.bcModSdk.version}')\n` +
			'One of mods you are using is using an old version of SDK. It will work for now but please inform author to update',
		);
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
