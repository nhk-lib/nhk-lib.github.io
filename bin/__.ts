#!/usr/bin/env -S deno run --allow-run=deno --allow-read=./ --allow-write=./

// import { sleep } from "https://deno.land/x/sleep/mod.ts";
import {
  sh, meta_url, match, values, not_found,
} from "https://raw.githubusercontent.com/da99/da.ts/main/src/Shell.ts";

import {
  path,
} from "https://raw.githubusercontent.com/da99/da.ts/main/src/da.ts";

meta_url(import.meta.url);

if (match("render <file>")) {
  const [file] = values() as string[];
  const ext = path.extname(file);
  switch (ext) {
    case ".mjs": {
      const new_file = file.replace('.mjs', '.ts');
      await sh(`deno bundle ${new_file}`, 'inherit');
      break;
    }
    default: {
      throw new Error(`Unknown file type: ${file}`);
    }
  } // switch
} // if


not_found();
