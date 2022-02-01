export interface ModSDKModAPI {
	unload(): void;
}

export interface ModSDKModInfo {
	name: string;
	version: string;
}

export interface ModSDKGlobalAPI {
	version: string;
	registerMod(name: string, version: string, allowReplace?: boolean): ModSDKModAPI;
	getModsInfo(): ModSDKModInfo[];
}
