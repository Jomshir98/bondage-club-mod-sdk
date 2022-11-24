/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PatchedFunctionInfo, PatchHook } from './api';
import { registeredMods } from './modRegistry';
import { sdkApi } from './sdkApi';
import { ArrayUnique, CRC32, IsObject } from './utils';

export interface IHookData {
	readonly mod: string;
	readonly priority: number;
	readonly hook: PatchHook;
}

interface IPatchedFunctionPrecomputed {
	readonly hooks: readonly IHookData[];
	readonly patches: ReadonlyMap<string, string>;
	readonly patchesSources: ReadonlySet<string>;
	readonly enter: (args: any[]) => any;
	readonly final: (...args: any[]) => any;
}

interface IPatchedFunctionDataBase {
	readonly name: string;
	readonly original: (...args: any[]) => any;
	readonly originalHash: string;
}

interface IPatchedFunctionData extends IPatchedFunctionDataBase {
	precomputed: IPatchedFunctionPrecomputed;
	readonly context: any;
	readonly contextProperty: string;
	router: (...args: any[]) => any;
}

const patchedFunctions: Map<string, IPatchedFunctionData> = new Map();

const displayedWarnings: Set<string> = new Set();
function WarnUnique(warning: string): void {
	if (displayedWarnings.has(warning))
		return;
	displayedWarnings.add(warning);
	console.warn(warning);
}

function MakePatchRouter(data: IPatchedFunctionData): (...args: any[]) => any {
	return function modSDKPatchRouter(this: any, ...args: any[]) {
		// Mod SDK Function hook
		return data.precomputed.enter.apply(this, [args]);
	};
}

function ApplyPatches(original: (...args: any[]) => any, patches: Map<string, string>): (...args: any[]) => any {
	if (patches.size === 0) {
		return original;
	}
	let fnStr = original.toString().replaceAll('\r\n', '\n');
	for (const [k, v] of patches.entries()) {
		if (!fnStr.includes(k)) {
			WarnUnique(`ModSDK: Patching ${original.name}: Patch ${k} not applied`);
		}
		fnStr = fnStr.replaceAll(k, v);
	}
	// eslint-disable-next-line no-eval
	return (1, eval)(`(${fnStr})`);
}

function UpdatePatchedFunction(data: IPatchedFunctionDataBase): IPatchedFunctionPrecomputed {
	const hooks: IHookData[] = [];
	const patches: Map<string, string> = new Map();
	const patchesSources: Set<string> = new Set();

	for (const mod of registeredMods.values()) {
		const functionPatches = mod.patching.get(data.name);
		if (!functionPatches)
			continue;
		hooks.push(...functionPatches.hooks);
		for (const [k, v] of functionPatches.patches.entries()) {
			if (patches.has(k) && patches.get(k) !== v) {
				WarnUnique(
					`ModSDK: Mod '${mod.name}' is patching function ${data.name} with same pattern that is already applied by different mod, but with different pattern:\n` +
					`Pattern:\n${k}\n` +
					`Patch1:\n${patches.get(k) || ''}\n` +
					`Patch2:\n${v}`,
				);
			}
			patches.set(k, v);
			patchesSources.add(mod.name);
		}
	}

	hooks.sort((a, b) => b.priority - a.priority);
	const final = ApplyPatches(data.original, patches);

	let next: (this: any, nextargs: any[]) => any = function (args) {
		const onExit = sdkApi.errorReporterHooks.hookChainExit?.(data.name, patchesSources);
		const resExit = final.apply(this, args);
		onExit?.();
		return resExit;
	};

	for (let i = hooks.length - 1; i >= 0; i--) {
		const hook = hooks[i];
		const nextHook = next;

		next = function (args) {
			const onExit = sdkApi.errorReporterHooks.hookEnter?.(data.name, hook.mod);
			const resIntermediate = hook.hook.apply(this, [args, (nextargs) => {
				if (arguments.length !== 1 || !Array.isArray(args)) {
					throw new Error(`Mod ${hook.mod} failed to call next hook: Expected args to be array, got ${typeof nextargs}`);
				}
				nextHook.call(this, nextargs);
			}]);
			onExit?.();
			return resIntermediate;
		};
	}

	return {
		hooks,
		patches,
		patchesSources,
		enter: next,
		final,
	};
}

function InitPatchableFunction(target: string, forceUpdate: boolean = false): IPatchedFunctionData {
	let result = patchedFunctions.get(target);
	if (!result) {
		let context: Record<string, any> = window as any;
		const targetPath = target.split('.');
		for (let i = 0; i < targetPath.length - 1; i++) {
			context = context[targetPath[i]];
			if (!IsObject(context)) {
				throw new Error(`ModSDK: Function ${target} to be patched not found; ${targetPath.slice(0, i + 1).join('.')} is not object`);
			}
		}
		const original: (...args: any[]) => any = context[targetPath[targetPath.length - 1]];

		if (typeof original !== 'function') {
			throw new Error(`ModSDK: Function ${target} to be patched not found`);
		}

		const originalHash = CRC32(original.toString().replaceAll('\r\n', '\n'));

		const data: IPatchedFunctionDataBase = {
			name: target,
			original,
			originalHash,
		};

		result = {
			...data,
			precomputed: UpdatePatchedFunction(data),
			router: () => undefined,
			context,
			contextProperty: targetPath[targetPath.length - 1]
		};
		result.router = MakePatchRouter(result);
		patchedFunctions.set(target, result);
		context[result.contextProperty] = result.router;
	} else if (forceUpdate) {
		result.precomputed = UpdatePatchedFunction(result);
	}
	return result;
}

export function UpdateAllPatches(): void {
	const functions: Set<string> = new Set();

	for (const mod of registeredMods.values()) {
		for (const functionName of mod.patching.keys()) {
			functions.add(functionName);
		}
	}

	for (const functionName of patchedFunctions.keys()) {
		functions.add(functionName);
	}

	for (const functionName of functions) {
		InitPatchableFunction(functionName, true);
	}
}

export function CallOriginal(target: string, args: any[], context: any = window): any {
	const data = InitPatchableFunction(target);
	return data.original.apply(context, args);
}

export function GetPatchedFunctionsInfo(): Map<string, PatchedFunctionInfo> {
	const result: Map<string, PatchedFunctionInfo> = new Map();
	for (const [name, data] of patchedFunctions) {
		result.set(name, {
			name,
			original: data.original,
			originalHash: data.originalHash,
			sdkEntrypoint: data.router,
			currentEntrypoint: data.context[data.contextProperty],
			hookedByMods: ArrayUnique(data.precomputed.hooks.map((h) => h.mod)),
			patchedByMods: Array.from(data.precomputed.patchesSources),
		});
	}
	return result;
}

export function GetOriginalHash(target: string): string {
	return InitPatchableFunction(target).originalHash;
}
