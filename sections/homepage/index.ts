
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="dom" />

import { ShoutCast_Station } from "../../deno_deploy/ShoutCast.ts";
import { NHK_SHOW } from "../../deno_deploy/NHK.ts";

import { DA } from "../../www_modules/da/DA.mjs"


interface ShoutCast_JSON_Response {
  time: number,
  channels: ShoutCast_Station[]
}

interface NHK_JSON_Response {
  time: number,
  shows: NHK_SHOW[]
}

/* interface NHK_Show { */
/*   seriesId: string; */
/*   airingId: string; */
/*   title: string; */
/*   description: string; */
/*   href?: string; */
/*   vodReserved: boolean; */
/*   starts_at: number, */
/*   ends_at: number, */
/*   is_recordable: boolean, */
/*   is_recording: boolean, */
/*   what_to_record: string[], */
/*   thumbnail_small?: string */
/* } */


(function () {
  class Page {
    static start_loading() {
      return document.body.classList.add("loading");
    } // function

    static done_loading() {
      return document.body.classList.remove("loading");
    } // function
  } // class

  const E = new DA.Event();
  const H = new DA.HTML(window);

  function img(alt : string, src : string) {
    return H.new_tag("img", {alt, src});
  };

  class Quarry {
    static next_loop_ms() {
      const min_target = 1;
      const dt         = new Date();
      const now        = dt.getTime();
      const secs       = (((min_target - (dt.getMinutes() % min_target)) * 60) - dt.getSeconds()) + 1;

      const new_ms = secs * 1000
      const new_dt = new Date(now + new_ms);
      return new_ms;
    }

    static fetch() {
      const url = new URL(window.location.href);
      return fetch(url.origin + "/quarry/clients");
    }
  } // class

  function render_shoutcast_title(args: any) {
    const div = document.querySelector("div.loading");
    if (div) {
      div.remove();
      const h = new DA.HTML(window);
      h.div("#updated_at", (new Date()).toString());
      document.body.appendChild(h.fragment());
    } else {
      const ua = document.getElementById("updated_at");
      if (ua) {
        ua.innerText = (new Date()).toString();
      }
    }
    return div;
  } // function

  E.on("media title error", (x : any) => {
    console.log(x);
  });

  function render_shoutcast_titles(json : ShoutCast_Station[]) {
    json.forEach((x : ShoutCast_Station) => {
      render_shoutcast_station(x);
    });
  } // on

  function render_nhk_show(x : any) {
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

  function render_shoutcast_station(x : ShoutCast_Station) {
    const id = `shoutchast_${x.filename}`;
    const e = document.getElementById(id);
    if (e) {
      update_innerText(e.querySelector("div.current_title"), x.current_title);
    } else {
      const h = new DA.HTML(window);
      h.div(`#${id}.shoutcast`, () => {
        h.div(".title", () => {
          h.a({href: x.stream_url}, x.title);
        });
        h.div(".current_title", x.current_title);
      });
      append_child("shoutcast", h.fragment());
    }
  } // on

  function update_innerText(target : HTMLElement | null, txt : string) {
    if (target) {
      target.innerText = txt;
      return target;
    }
    return;
  } // function

  function append_child(id : string, x : DocumentFragment | HTMLElement) {
    const target = document.getElementById(id);
    if (target) {
      return target.appendChild(x);
    }
    return;
  } // function

  function quarry_fetch_and_loop() {
    Page.start_loading();
    return Quarry
    .fetch()
    .then((resp : Response) => {
      Page.done_loading();
      setTimeout(quarry_fetch_and_loop, Quarry.next_loop_ms());
      if (resp.status !== 200) {
        console.log(`ERROR: ${resp.status}`);
        return null;
      }
      return (resp.json());
    })
    .then((x : any) => {
      if (x && x.error === false) {
        render_quarry_clients(x);
      } else {
        console.log("Error in getting quarry info: ");
        console.log(x);
      }
    })
    .catch((x) => {
      Page.done_loading();
      clear_quarry();
      setTimeout(quarry_fetch_and_loop, 10000);
      console.log(x)
    });
  } // function

  function shoutcast_next_loop_ms() {
    const dt   = new Date();
    const now  = dt.getTime();
    const secs = (((5 - (dt.getMinutes() % 5)) * 60) - dt.getSeconds()) + 2;

    const new_ms = secs * 1000
    const new_dt = new Date(now + new_ms);
    return new_ms;
  }

  function shoutcast_fetch_and_loop() {
    Page.start_loading();
    return fetch("https://da99shoutcast.deno.dev/ShoutCast.json")
    .then((resp : Response) => {
      Page.done_loading();
      if (resp.status !== 200) {
        console.log(`ERROR: ${resp.status}`);
        throw new Error(`shoutcast fetch: ${resp.status}`);
      }
      setTimeout(shoutcast_fetch_and_loop, shoutcast_next_loop_ms());
      return (resp.json());
    })
    .then((x : ShoutCast_JSON_Response) => {
      if (x && x.channels) {
        render_shoutcast_titles(x.channels);
      }
    })
    .catch((x) => {
      Page.done_loading();
      setTimeout(shoutcast_fetch_and_loop, shoutcast_next_loop_ms());
      console.log(x)
    });
  } // function

  function clear_quarry() {
    const quarry = document.getElementById("quarry");
    if (quarry) {
      while(quarry.firstChild) {
        quarry.removeChild(quarry.firstChild);
      }
    }
  } // function


  function nhk_loop() {
    Page.start_loading();
    fetch("https://da99shoutcast.deno.dev/NHK.json")
    .then((resp : Response) => {
      Page.done_loading();
      if (resp.status === 200) {
        return resp.json();
      } else {
        console.log(resp);
        throw(new Error("NHK Failed"));
      }
    })
    .then((x : NHK_JSON_Response) => {
      if (x && x.shows) {
        x.shows.forEach((show : NHK_SHOW) => {
          render_nhk_show(show);
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
      Page.done_loading();
      console.log(x);
      setTimeout( nhk_loop, 10000);
    });
  } // function

  function render_quarry_clients(x : any) {
    clear_quarry();
    if (x) {
      x.data.forEach((client : any) => {
        if (client.ignored) return;
        const h = new DA.HTML(window);
        const nickname = client.nickname === "Unknown" ? `${client.hostname}/${client.ip}` : client.nickname;
        h.div(`.client`, {"data-client": client.nickname}, nickname);
        append_child("quarry", h.fragment());
      });
    }
  } // function

  document.body.appendChild(H.fragment());
  console.log("Starting fetch loop.");
 /* quarry_fetch_and_loop(); */
  shoutcast_fetch_and_loop();
  nhk_loop();

})();