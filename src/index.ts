import { ThrowError } from './errors';
import type { ModSDKGlobalAPI, ModSDKModAPI, ModSDKModInfo, ModSDKModOptions } from './api';
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
		// Shim to support new registration way with old api
		if (window.bcModSdk.version.startsWith('1.0.') && typeof (window.bcModSdk as (ModSDKGlobalAPI & { _shim10register?: true; }))._shim10register === 'undefined') {
			const oldAPI = window.bcModSdk;
			const shimmedAPI: ModSDKGlobalAPI & { _shim10register: true; } = Object.freeze({
				...oldAPI,
				registerMod: (info: ModSDKModInfo | string, options?: ModSDKModOptions | string, oldAllowReplace?: boolean): ModSDKModAPI => {
					if (info && typeof info === 'object' && typeof info.name === 'string' && typeof info.version === 'string')
						return oldAPI.registerMod(info.name, info.version, typeof options === 'object' && !!options && options.allowReplace === true);
					// @ts-expect-error: Passing known possibly wrong data
					return oldAPI.registerMod(info, options, oldAllowReplace);
				},
				_shim10register: true,
			});
			window.bcModSdk = shimmedAPI;
		}
	}
	// Otherwise this exact version of Mod SDK is already loaded, so do nothing
	return window.bcModSdk;
}

/** @public */
const bcModSdk = Init();
// Make this both CommonJS and IIFE bundle
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const exports: any;
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
