/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="dom" />

import { NHK_SHOW } from "../../deno_deploy/NHK.ts";

interface NHK_JSON_Response {
  time: number,
  shows: NHK_SHOW[]
}

interface NHK_Show {
seriesId: string;
  airingId: string;
  title: string;
  description: string;
  href?: string;
  vodReserved: boolean;
  starts_at: number,
  ends_at: number,
  is_recordable: boolean,
  is_recording: boolean,
  what_to_record: string[],
  thumbnail_small?: string
}

export const NHK_DOM = {
  loop: function fetch_and_loop() {
    loading('nhk')
    fetch("https://da99shoutcast.deno.dev/NHK.json")
    .then((resp : Response) => {
      not_loading('nhk');
      if (resp.status === 200) {
        return resp.json();
      } else {
        console.log(resp);
        throw(new Error("NHK Failed"));
      }
    })
    .then((x : NHK_JSON_Response) => {
      if (x && x.shows) {
        for (const show of x.shows) {
          NHK_DOM.create.show(show);
        });
        const show = x.shows[0] as NHK_SHOW;
        if (!show) {
          throw(new Error("No shows retrieved."));
        } else {
          const date_now = Date.now();
          if (show.ends_at < date_now) {
            setTimeout(nhk_loop, 5000);
          } else {
            const next_time = Math.floor(show.ends_at - date_now);
            setTimeout(nhk_loop, next_time + 1000);
          }
        }
      }
    })
    .catch((x) => {
      not_loading('quarry');
      console.log(x);
      setTimeout( nhk_loop, 10000);
    });
  }, // loop

  create: {

   show: function render_nhk_show(x : NHK_SHOW) {
    const id = `nhk_${x.ends_at}`;
    const e = document.getElementById(id);
    if (e || (x.ends_at <= Date.now())) { return; }
    const h = new DA.HTML(window);
    let _id = [
      `#${id}.nhk_show`,
      (x.is_recordable ? ".recordable" : ".not_recordable"),
      (x.is_recording ? ".recording" : ".not_recording")
    ].join(" ");
    h.div(_id, {title: (x.is_recordable ? x.what_to_record.toString() : "regular" )}, () => {
      h.div(".title", () => {
        if (x.href) {
          h.a({href: x.href}, x.title);
        } else {
          h.target().appendChild(h.text_node(x.title));
        }
        if (x.title != "NHK NEWSLINE" && x.thumbnail_small) {
          h.new_tag("img", {alt: `preview of ${x.title}`, src: x.thumbnail_small});
        }
      });
      h.div(".description", x.description);
    });
    append_child("nhk", h.fragment());
    setTimeout(
      () => {document.querySelectorAll(`#${id}`).forEach((x) => x.remove());},
        x.ends_at - Date.now()
    );
  } // on
  }, // create
} // expot NHK_DOM
