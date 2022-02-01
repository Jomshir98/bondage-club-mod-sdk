export function ThrowError(error: string): never {
	alert(error);
	const err = new Error(error);
	console.error(err);
	throw err;
}
