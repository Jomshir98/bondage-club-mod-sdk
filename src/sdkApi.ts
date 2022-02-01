import { GetModsInfo, RegisterMod } from './modRegistry';
import type { ModSDKGlobalAPI } from './api';
import { GetPatchedFunctionsInfo } from './patching';

export let sdkApi: ModSDKGlobalAPI;

export function CreateGlobalAPI(): ModSDKGlobalAPI {
	const result: ModSDKGlobalAPI = {
		version: VERSION,
		registerMod: RegisterMod,
		getModsInfo: GetModsInfo,
		getPatchingInfo: GetPatchedFunctionsInfo,
		errorReporterHooks: Object.seal({
			hookEnter: null,
			hookChainExit: null,
		}),
	};

	sdkApi = result;

	return Object.freeze(result);
}
