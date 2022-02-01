/* eslint-disable @typescript-eslint/no-explicit-any */
export type PatchHook = (args: any[], next: (args: any[]) => any) => any;

export interface ModSDKModAPI {
	unload(): void;
	hookFunction(functionName: string, priority: number, hook: PatchHook): () => void;
	patchFunction(functionName: string, patches: Record<string, string | null>): void;
	removePatches(functionName: string): void;
	callOriginal(functionName: string, args: any[], context?: any): any;
	getOriginalHash(functionName: string): string;
}

export interface ModSDKModInfo {
	name: string;
	version: string;
}

export interface PatchedFunctionInfo {
	name: string;
	originalHash: string;
	hookedByMods: string[];
	patchedByMods: string[];
}

export interface ModSDKGlobalAPI {
	version: string;
	registerMod(name: string, version: string, allowReplace?: boolean): ModSDKModAPI;
	getModsInfo(): ModSDKModInfo[];
	getPatchingInfo(): Map<string, PatchedFunctionInfo>;
}
