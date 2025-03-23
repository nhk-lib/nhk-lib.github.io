#!/usr/bin/env -S deno run --allow-run=deno --allow-read=./ --allow-write=./

// import { sleep } from "https://deno.land/x/sleep/mod.ts";
// import {
//   sh, meta_url, match, values, not_found,
// } from "https://raw.githubusercontent.com/da99/da.ts/main/src/Shell.ts";
//
// import {
//   path,
// } from "https://raw.githubusercontent.com/da99/da.ts/main/src/da.ts";
//
// meta_url(import.meta.url);

import * as esbuild from "npm:esbuild";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader";

const result = await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: ["./sections/homepage/index.ts"],
  outfile: "./sections/homepage/index.mjs",
  bundle: true,
  format: "esm",
});

esbuild.stop();

