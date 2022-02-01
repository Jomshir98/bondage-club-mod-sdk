export function ThrowError(error: string): never {
	alert('Mod ERROR:\n' + error);
	const err = new Error(error);
	console.error(err);
	throw err;
}
