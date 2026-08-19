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
    if (relative && context.parentURL !== undefined) {
      // .js because nodenext writes it that way, no extension because the web
      // app is bundled by vite and writes it that way.
      const candidate = specifier.endsWith('.js')
        ? specifier.replace(/\.js$/, '.ts')
        : /\.[a-z]+$/.test(specifier)
          ? null
          : `${specifier}.ts`;
      if (candidate !== null && existsSync(fileURLToPath(new URL(candidate, context.parentURL)))) {
        return nextResolve(candidate, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
