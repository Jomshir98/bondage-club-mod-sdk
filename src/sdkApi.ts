import { GetModsInfo, RegisterMod } from './modRegistry';
import type { ModSDKGlobalAPI } from './api';
import { GetPatchedFunctionsInfo } from './patching';

export let sdkApi: ModSDKGlobalAPI;
export const API_VERSION: number = 1;

export function CreateGlobalAPI(): ModSDKGlobalAPI {
	const result: ModSDKGlobalAPI = {
		version: VERSION,
		apiVersion: API_VERSION,
		registerMod: RegisterMod,
		getModsInfo: GetModsInfo,
		getPatchingInfo: GetPatchedFunctionsInfo,
		errorReporterHooks: Object.seal({
			apiEndpointEnter: null,
			hookEnter: null,
			hookChainExit: null,
		}),
	};

	sdkApi = result;

	return Object.freeze(result);
}
