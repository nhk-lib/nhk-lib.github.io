
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="dom" />

// import { DA } from "../../www_modules/da/DA.mjs"

import { Shout_Cast_DOM } from "./Shout_Cast.ts";
import { NHK_DOM } from "./NHK.ts";
import { Quarry_DOM } from "./Quarry.ts";

import {
  not_loading, loading,
  div, a, img, append_child, inner_text, empty,
  fragment, next_loop_ms
} from "../../src/DOM.ts";



Quarry_DOM.initialize('#quarry');

Shout_Cast_DOM.initialize('#shout_cast');

NHK_DOM.initialize('#nhk');

function update_page() {
  if (!document.hidden) {
    NHK_DOM.focus();
    Quarry_DOM.focus();
    Shout_Cast_DOM.focus();
  }
}

document.addEventListener('visibilitychange', update_page);
not_loading('body');

