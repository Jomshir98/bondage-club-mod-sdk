import { ModSDKModAPI, ModSDKModInfo, PatchHook } from './api';
import { ThrowError } from './errors';
import { CallOriginal, GetOriginalHash, IHookData, UpdateAllPatches } from './patching';
import { IsObject } from './utils';

interface IModPatchesDefinition {
	hooks: IHookData[];
	patches: Map<string, string>;
}

interface ModInfo {
	readonly name: string;
	version: string;
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

export function RegisterMod(name: string, version: string, allowReplace?: boolean): ModSDKModAPI {
	if (typeof name !== 'string' || !name) {
		ThrowError(`Failed to register mod: Expected non-empty name string, got ${typeof name}`);
	}
	if (typeof version !== 'string') {
		ThrowError(`Failed to register mod '${name}': Expected version string, got ${typeof version}`);
	}
	allowReplace = allowReplace === true;

	const currentMod = registeredMods.get(name);
	if (currentMod) {
		if (!currentMod.allowReplace || !allowReplace) {
			ThrowError(`Refusing to load mod '${name}': it is already loaded and doesn't allow being replaced.\nWas the mod loaded multiple times?`);
		}
		UnloadMod(currentMod);
	}

	const getPatchInfo = (functionName: string) => {
		if (typeof functionName !== 'string' || !functionName) {
			ThrowError(`Mod '${name}' failed to patch a function: Expected function name string, got ${typeof functionName}`);
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
		hookFunction: (functionName: string, priority: number, hook: PatchHook): (() => void) => {
			if (!newInfo.loaded) {
				ThrowError(`Mod '${newInfo.name}' attempted to call SDK function after being unloaded`);
			}
			const functionPatchInfo = getPatchInfo(functionName);
			if (typeof priority !== 'number') {
				ThrowError(`Mod '${name}' failed to hook function '${functionName}': Expected priority number, got ${typeof priority}`);
			}
			if (typeof hook !== 'function') {
				ThrowError(`Mod '${name}' failed to hook function '${functionName}': Expected hook function, got ${typeof hook}`);
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
				ThrowError(`Mod '${newInfo.name}' attempted to call SDK function after being unloaded`);
			}
			const functionPatchInfo = getPatchInfo(functionName);
			if (!IsObject(patches)) {
				ThrowError(`Mod '${name}' failed to patch function '${functionName}': Expected patches object, got ${typeof patches}`);
			}
			for (const [k, v] of Object.entries(patches)) {
				if (typeof v === 'string') {
					functionPatchInfo.patches.set(k, v);
				} else if (v === null) {
					functionPatchInfo.patches.delete(k);
				} else {
					ThrowError(`Mod '${name}' failed to patch function '${functionName}': Invalid format of patch '${k}'`);
				}
			}
			UpdateAllPatches();
		},
		removePatches: (functionName: string): void => {
			if (!newInfo.loaded) {
				ThrowError(`Mod '${newInfo.name}' attempted to call SDK function after being unloaded`);
			}
			const functionPatchInfo = getPatchInfo(functionName);
			functionPatchInfo.patches.clear();
			UpdateAllPatches();
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callOriginal: (functionName: string, args: any[], context?: any): any => {
			if (!newInfo.loaded) {
				ThrowError(`Mod '${newInfo.name}' attempted to call SDK function after being unloaded`);
			}
			if (typeof functionName !== 'string' || !functionName) {
				ThrowError(`Mod '${name}' failed to call a function: Expected function name string, got ${typeof functionName}`);
			}
			if (!Array.isArray(args)) {
				ThrowError(`Mod '${name}' failed to call a function: Expected args array, got ${typeof args}`);
			}
			return CallOriginal(functionName, args, context);
		},
		getOriginalHash: (functionName: string): string => {
			if (typeof functionName !== 'string' || !functionName) {
				ThrowError(`Mod '${name}' failed to get hash: Expected function name string, got ${typeof functionName}`);
			}
			return GetOriginalHash(functionName);
		},
	};

	const newInfo: ModInfo = {
		name,
		version,
		allowReplace,
		api,
		loaded: true,
		patching: new Map(),
	};

	registeredMods.set(name, newInfo);

	return Object.freeze(api);
}

export function GetModsInfo(): ModSDKModInfo[] {
	const result: ModSDKModInfo[] = [];
	for (const mod of registeredMods.values()) {
		result.push({
			name: mod.name,
			version: mod.version,
		});
	}
	return result;
}
