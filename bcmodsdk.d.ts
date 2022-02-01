/** @public */
declare const bcModSdk: ModSDKGlobalAPI;
export default bcModSdk;

/** @public */
export declare interface ModSDKGlobalAPI {
    version: string;
    registerMod(name: string, version: string, allowReplace?: boolean): ModSDKModAPI;
    getModsInfo(): ModSDKModInfo[];
    getPatchingInfo(): Map<string, PatchedFunctionInfo>;
}

/** @public */
export declare interface ModSDKModAPI {
    unload(): void;
    hookFunction(functionName: string, priority: number, hook: PatchHook): () => void;
    patchFunction(functionName: string, patches: Record<string, string | null>): void;
    removePatches(functionName: string): void;
    callOriginal(functionName: string, args: any[], context?: any): any;
    getOriginalHash(functionName: string): string;
}

/** @public */
export declare interface ModSDKModInfo {
    name: string;
    version: string;
}

/** @public */
export declare interface PatchedFunctionInfo {
    name: string;
    originalHash: string;
    hookedByMods: string[];
    patchedByMods: string[];
}

/** @public */
export declare type PatchHook = (args: any[], next: (args: any[]) => any) => any;

export { }
