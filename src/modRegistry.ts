import { ModSDKModAPI, ModSDKModInfo } from './api';
import { ThrowError } from './errors';

interface ModInfo {
	readonly name: string;
	version: string;
	allowReplace: boolean;
	api: ModSDKModAPI;
}

const registeredMods: Map<string, ModInfo> = new Map();

export function UnloadMod(mod: ModInfo): void {
	if (registeredMods.get(mod.name) !== mod) {
		ThrowError(`Failed to unload mod '${mod.name}': Not registered`);
	}
	registeredMods.delete(mod.name);
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

	const api: ModSDKModAPI = {
		unload: () => UnloadMod(newInfo),
	};

	const newInfo: ModInfo = {
		name,
		version,
		allowReplace,
		api,
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
