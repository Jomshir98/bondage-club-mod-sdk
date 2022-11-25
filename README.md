# Bondage Club Mod Development Kit

An extension/mod development kit for the Bondage Club online game ([https://www.bondageprojects.com/club_game/](https://www.bondageprojects.com/club_game/)) by Jomshir98, one of the club's coders.

Bondage Club Mod Development Kit is an experimental library aiming to improve compatibility between multiple mods by providing a common interface that mods can use to modify Bondage Club's functions without overwriting one another's changes, if those mods use this library.

# Usage

This package can be used either by copying the code into your script or by including it as dependency using a build system.

## Using the code by copying it

Simply take the code from JS file in the latest [Release](https://github.com/Jomshir98/bondage-club-mod-sdk/releases) and put it on the very top of your script, using the result `bcModSdk` variable.

## Using the code by importing it

The file is a CommonJS module that exports a **default** export you can use:

```ts
import bcModSDK from 'bondage-club-mod-sdk';
```

## Example usage

```ts
const modApi = bcModSDK.registerMod({
	name: 'MyExMod',
	fullName: 'My example mod',
	version: '1.0.0',
	// Optional - Link to the source code of the mod
	repository: 'https://github.com/Jomshir98/bondage-club-mod-sdk',
});

// Example: Add original text to the end of any garble text
// For more details see `SpeechGarble` function in BC code
modApi.hookFunction('SpeechGarble', 4, (args, next) => {
	// Copy original, which is second argument
	const originalText = args[1];
	// Call the original function, saving result
	const garbledText = next(args);
	// Return modified result by adding original text after the garbled text
	return garbledText + ' <> ' + originalText;
});
```

For full API documentation see `.d.ts` file in latest release.

-----------------------------------------------
**Made by Jomshir98 - Jomshir98#0022**

Associated Discord server:

[![Discord image](https://discordapp.com/api/guilds/842082194209112074/widget.png?style=banner1)](https://discord.gg/SHJMjEh9VH)

**THIS PAGE WAS LAST EDITED ON 1-2-2022**
