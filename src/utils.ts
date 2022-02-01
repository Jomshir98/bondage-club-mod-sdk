const encoder = new TextEncoder();

/* eslint-disable no-bitwise */
export function CRC32(str: string): string {
	let crc = 0 ^ -1;
	for (const b of encoder.encode(str)) {
		let c = (crc ^ b) & 0xff;
		for (let j = 0; j < 8; j++) {
			c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1);
		}
		crc = (crc >>> 8) ^ c;
	}

	return ((crc ^ -1) >>> 0).toString(16).padStart(8, '0').toUpperCase();
}
/* eslint-enable no-bitwise */

/** Checks if the `obj` is an object (not null, not array) */
export function IsObject(obj: unknown): obj is Record<string, unknown> {
	return !!obj && typeof obj === 'object' && !Array.isArray(obj);
}

export function ArrayUnique<T>(arr: T[]): T[] {
	const seen = new Set<T>();
	return arr.filter((i) => !seen.has(i) && seen.add(i));
}
