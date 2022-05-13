/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="dom" />

import { NHK_SHOW } from "../../deno_deploy/NHK.ts";

import {
  not_loading, loading,
  div, a, img, append_child, inner_text, empty,
  fragment, next_loop_ms, br, is_loading
} from "../../src/DOM.ts";

let MAIN_DIV = '#nhk';

interface NHK_JSON_Response {
  time:  number,
  shows: NHK_SHOW[]
}

export const NHK_DOM = {
  initialize(main: string = '#nhk') {
    MAIN_DIV = main;
    NHK_DOM.fetch();
  },

  id(x: NHK_SHOW) {
    return `nhk_${x.ends_at}`;
  },

  focus() {
    return NHK_DOM.fetch();
  },

  async fetch() {
    if (document.hidden || is_loading(MAIN_DIV))
      return false;

    loading(MAIN_DIV);

    return fetch("https://da99shoutcast.deno.dev/NHK.json")
    .then((resp : Response) => {
      not_loading(MAIN_DIV);
      if (resp.status === 200) {
        return resp.json();
      } else {
        console.log(resp);
        throw(new Error("NHK Failed"));
      }
    })
    .then((x : NHK_JSON_Response) => {
      if (!(typeof x === 'object' && 'shows' in x))
        throw new Error(`Unknown value for NHK JSON response: ${x}`);
      for (const show of x.shows)
        NHK_DOM.create.show(show);

      if (x.shows.length === 0)
        throw(new Error("No shows retrieved."));

      const show = x.shows[0];
      const date_now = Date.now();
      if (show.ends_at < date_now) {
        setTimeout(NHK_DOM.fetch, 5000);
        return;
      }

      const next_time = Math.floor(show.ends_at - date_now);
      setTimeout(NHK_DOM.fetch, next_time + 1000);
    })
    .catch((x) => {
      not_loading(MAIN_DIV);
      console.log(x);
      setTimeout(NHK_DOM.fetch, 10000);
    });
  }, // loop

  create: {

   show(x : NHK_SHOW) {
    const id = NHK_DOM.id(x);
    const old_e = document.getElementById(id);
    if (old_e || (x.ends_at <= Date.now()))
      return false;

    // let _id = [
    //   (x.is_recordable ? ".recordable" : ".not_recordable"),
    //   (x.is_recording ? ".recording" : ".not_recording")
    // ].join(" ");

    const preview_img = (x.title != "NHK NEWSLINE" && x.thumbnail_small) ?
          fragment(br(), img(`preview of ${x.title}`,x.thumbnail_small)) : '';

    const new_e = div(`#${id}.nhk_show`);

    if (x.link) {
      new_e.appendChild(
        div(".title", a({href: x.link}, x.title, preview_img))
      );
    } else {
      new_e.appendChild(div(".title", x.title, preview_img));
    }
    new_e.appendChild(div(".description", x.description));

    append_child(MAIN_DIV, new_e);

    setTimeout(
      () => {document.querySelectorAll(`#${id}`).forEach((x) => x.remove());},
        x.ends_at - Date.now()
    );
  } // on
  }, // create
} // expot NHK_DOM
