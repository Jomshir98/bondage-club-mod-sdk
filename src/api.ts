/* eslint-disable @typescript-eslint/no-explicit-any */

/** @public */
export type PatchHook = (args: any[], next: (args: any[]) => any) => any;

/** @public */
export interface ModSDKModAPI {
	unload(): void;
	hookFunction(functionName: string, priority: number, hook: PatchHook): () => void;
	patchFunction(functionName: string, patches: Record<string, string | null>): void;
	removePatches(functionName: string): void;
	callOriginal(functionName: string, args: any[], context?: any): any;
	getOriginalHash(functionName: string): string;
}

/** @public */
export interface ModSDKModInfo {
	name: string;
	version: string;
}

/** @public */
export interface PatchedFunctionInfo {
	name: string;
	originalHash: string;
	hookedByMods: string[];
	patchedByMods: string[];
}

/** @public */
export interface ModSDKGlobalAPI {
	version: string;
	registerMod(name: string, version: string, allowReplace?: boolean): ModSDKModAPI;
	getModsInfo(): ModSDKModInfo[];
	getPatchingInfo(): Map<string, PatchedFunctionInfo>;
}
