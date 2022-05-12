/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="dom" />

import {
  not_loading, loading,
  div, a, img, append_child, inner_text, empty,
  fragment, next_loop_ms
} from "../../src/DOM.ts";

import { ShoutCast_Station } from "../../deno_deploy/ShoutCast.ts";

let MAIN_DIV = '#shout_cast';

interface ShoutCast_JSON_Response {
  time: number,
  channels: ShoutCast_Station[]
}

export const Shout_Cast_DOM = {
  id(x: ShoutCast_Station) {
    return `shout_cast_${x.filename}`;
  },

  create: {
    station(x: ShoutCast_Station): false | Node[] {
      const id = Shout_Cast_DOM.id(x);
      if (document.getElementById(id))
        return false;

      return append_child(
        MAIN_DIV,
        fragment(
          div(`#${Shout_Cast_DOM.id(x)}.station`, [
            div('.title', a({href: x.stream_url}, x.title)),
            div('.current_title', x.current_title)
          ])
        )
      );
    }
  }, // create

  update: {
    station(x: ShoutCast_Station): false | Node[] {
      return Shout_Cast_DOM.create.station(x) || inner_text(
        `#${Shout_Cast_DOM.id(x)} div.current_title`,
        x.current_title
      );
    },
  }, // update

  async fetch() {
    loading(MAIN_DIV);
    return fetch("https://da99shoutcast.deno.dev/ShoutCast.json")
    .then((resp : Response) => {
      not_loading(MAIN_DIV);
      if (resp.status !== 200) {
        console.log(`ERROR: ${resp.status}`);
        throw new Error(`shoutcast fetch: ${resp.status}`);
      }
      setTimeout(Shout_Cast_DOM.fetch, next_loop_ms(2));
      return (resp.json());
    })
    .then((x : ShoutCast_JSON_Response) => {
      if (typeof x === 'object' && 'channels' in x) {
        for (const c of x.channels)
          Shout_Cast_DOM.update.station(c);
        return x.channels;
      }
      console.log(x);
    })
    .catch((x) => {
      not_loading(MAIN_DIV)
      setTimeout(Shout_Cast_DOM.fetch, next_loop_ms(1));
      console.log(x)
    });
  }, // fetch

  initialize: function (str = '#shout_cast') {
    MAIN_DIV = str;
    return Shout_Cast_DOM.fetch();
  }, // initialize

}; // const Shout_Cast_DOM
