import type { ModSDKModAPI, ModSDKModInfo, ModSDKModOptions, PatchHook } from './api';
import { ThrowError } from './errors';
import { CallOriginal, GetOriginalHash, IHookData, UpdateAllPatches } from './patching';
import { IsObject } from './utils';

type FuncType = (...args: any[]) => any;

interface IModPatchesDefinition {
	hooks: IHookData[];
	patches: Map<string, string>;
}

interface ModInfo {
	readonly name: string;
	fullName: string;
	version: string;
	repository?: string;

	allowReplace: boolean;
	api: ModSDKModAPI;
	loaded: boolean;
	patching: Map<string, IModPatchesDefinition>;
}

export const registeredMods: Map<string, ModInfo> = new Map();

export function UnloadMod(mod: ModInfo): void {
	if (registeredMods.get(mod.name) !== mod) {
		ThrowError(`Failed to unload mod '${mod.name}': Not registered`);
	}
	registeredMods.delete(mod.name);
	mod.loaded = false;
	UpdateAllPatches();
}

export function RegisterMod(info: ModSDKModInfo | string, options?: ModSDKModOptions | string, oldAllowReplace?: boolean): ModSDKModAPI {
	if (typeof info === 'string' && typeof options === 'string') {
		alert(
			`Mod SDK warning: Mod '${info}' is registering in a deprecated way.\n` +
			'It will work for now, but please inform author to update.',
		);
		info = {
			name: info,
			fullName: info,
			version: options,
		};
		options = {
			allowReplace: oldAllowReplace === true,
		};
	}
	if (!info || typeof info !== 'object') {
		ThrowError(`Failed to register mod: Expected info object, got ${typeof info}`);
	}
	if (typeof info.name !== 'string' || !info.name) {
		ThrowError(`Failed to register mod: Expected name to be non-empty string, got ${typeof info.name}`);
	}
	let descriptor = `'${info.name}'`;
	if (typeof info.fullName !== 'string' || !info.fullName) {
		ThrowError(`Failed to register mod ${descriptor}: Expected fullName to be non-empty string, got ${typeof info.fullName}`);
	}
	descriptor = `'${info.fullName} (${info.name})'`;
	if (typeof info.version !== 'string') {
		ThrowError(`Failed to register mod ${descriptor}: Expected version to be string, got ${typeof info.version}`);
	}
	if (!info.repository) {
		info.repository = undefined;
	}
	if (info.repository !== undefined && typeof info.repository !== 'string') {
		ThrowError(`Failed to register mod ${descriptor}: Expected repository to be undefined or string, got ${typeof info.version}`);
	}

	if (options == null) {
		options = {};
	}

	if (!options || typeof options !== 'object') {
		ThrowError(`Failed to register mod ${descriptor}: Expected options to be undefined or object, got ${typeof options}`);
	}

	const allowReplace = options.allowReplace === true;

	const currentMod = registeredMods.get(info.name);
	if (currentMod) {
		if (!currentMod.allowReplace || !allowReplace) {
			ThrowError(`Refusing to load mod ${descriptor}: it is already loaded and doesn't allow being replaced.\nWas the mod loaded multiple times?`);
		}
		UnloadMod(currentMod);
	}

	const getPatchInfo = (functionName: string) => {
		if (typeof functionName !== 'string' || !functionName) {
			ThrowError(`Mod ${descriptor} failed to patch a function: Expected function name string, got ${typeof functionName}`);
		}
		let functionPatchInfo = newInfo.patching.get(functionName);
		if (!functionPatchInfo) {
			functionPatchInfo = {
				hooks: [],
				patches: new Map(),
			};
			newInfo.patching.set(functionName, functionPatchInfo);
		}
		return functionPatchInfo;
	};

	const api: ModSDKModAPI = {
		unload: () => UnloadMod(newInfo),
		hookFunction: <T extends FuncType = any>(functionName: string, priority: number, hook: PatchHook<T>): (() => void) => {
			if (!newInfo.loaded) {
				ThrowError(`Mod ${descriptor} attempted to call SDK function after being unloaded`);
			}
			const functionPatchInfo = getPatchInfo(functionName);
			if (typeof priority !== 'number') {
				ThrowError(`Mod ${descriptor} failed to hook function '${functionName}': Expected priority number, got ${typeof priority}`);
			}
			if (typeof hook !== 'function') {
				ThrowError(`Mod ${descriptor} failed to hook function '${functionName}': Expected hook function, got ${typeof hook}`);
			}
			const hookData: IHookData = {
				mod: newInfo.name,
				priority,
				hook,
			};
			functionPatchInfo.hooks.push(hookData);
			UpdateAllPatches();
			return () => {
				const index = functionPatchInfo.hooks.indexOf(hookData);
				if (index >= 0) {
					functionPatchInfo.hooks.splice(index, 1);
					UpdateAllPatches();
				}
			};
		},
		patchFunction: (functionName: string, patches: Record<string, string | null>): void => {
			if (!newInfo.loaded) {
				ThrowError(`Mod ${descriptor} attempted to call SDK function after being unloaded`);
			}
			const functionPatchInfo = getPatchInfo(functionName);
			if (!IsObject(patches)) {
				ThrowError(`Mod ${descriptor} failed to patch function '${functionName}': Expected patches object, got ${typeof patches}`);
			}
			for (const [k, v] of Object.entries(patches)) {
				if (typeof v === 'string') {
					functionPatchInfo.patches.set(k, v);
				} else if (v === null) {
					functionPatchInfo.patches.delete(k);
				} else {
					ThrowError(`Mod ${descriptor} failed to patch function '${functionName}': Invalid format of patch '${k}'`);
				}
			}
			UpdateAllPatches();
		},
		removePatches: (functionName: string): void => {
			if (!newInfo.loaded) {
				ThrowError(`Mod ${descriptor} attempted to call SDK function after being unloaded`);
			}
			const functionPatchInfo = getPatchInfo(functionName);
			functionPatchInfo.patches.clear();
			UpdateAllPatches();
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callOriginal: (functionName: string, args: any[], context?: any): any => {
			if (!newInfo.loaded) {
				ThrowError(`Mod ${descriptor} attempted to call SDK function after being unloaded`);
			}
			if (typeof functionName !== 'string' || !functionName) {
				ThrowError(`Mod ${descriptor} failed to call a function: Expected function name string, got ${typeof functionName}`);
			}
			if (!Array.isArray(args)) {
				ThrowError(`Mod ${descriptor} failed to call a function: Expected args array, got ${typeof args}`);
			}
			return CallOriginal(functionName, args, context);
		},
		getOriginalHash: (functionName: string): string => {
			if (typeof functionName !== 'string' || !functionName) {
				ThrowError(`Mod ${descriptor} failed to get hash: Expected function name string, got ${typeof functionName}`);
			}
			return GetOriginalHash(functionName);
		},
	};

	const newInfo: ModInfo = {
		name: info.name,
		fullName: info.fullName,
		version: info.version,
		repository: info.repository,
		allowReplace,
		api,
		loaded: true,
		patching: new Map(),
	};

	registeredMods.set(info.name, newInfo);

	return Object.freeze(api);
}

export function GetModsInfo(): ModSDKModInfo[] {
	const result: ModSDKModInfo[] = [];
	for (const mod of registeredMods.values()) {
		result.push({
			name: mod.name,
			fullName: mod.fullName,
			version: mod.version,
			repository: mod.repository,
		});
	}
	return result;
}
