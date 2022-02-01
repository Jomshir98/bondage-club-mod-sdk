import { ModSDKModAPI, ModSDKModInfo } from './api';
interface ModInfo {
    readonly name: string;
    version: string;
    allowReplace: boolean;
    api: ModSDKModAPI;
}
export declare function UnloadMod(mod: ModInfo): void;
export declare function RegisterMod(name: string, version: string, allowReplace?: boolean): ModSDKModAPI;
export declare function GetModsInfo(): ModSDKModInfo[];
export {};
