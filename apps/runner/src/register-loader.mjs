// the workspace packages ship typescript and import each other with the .js
// specifiers typescript's nodenext resolution requires. node's own type
// stripping does not rewrite those, so this hook points them at the .ts file
// that is actually there. it disappears the day the packages emit javascript.

import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath, URL } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith('./') || specifier.startsWith('../');
    if (relative && specifier.endsWith('.js') && context.parentURL !== undefined) {
      const asTypeScript = specifier.replace(/\.js$/, '.ts');
      if (existsSync(fileURLToPath(new URL(asTypeScript, context.parentURL)))) {
        return nextResolve(asTypeScript, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
