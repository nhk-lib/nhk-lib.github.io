
export interface ShoutCast_Station {
  "filename":      string,
  "stream_url":    string,
  "title":         string,
  "homepage":      string,
  "current_title": string
} // interface


export class ShoutCast {
  static URLS = {
    channel_101:   "http://155.138.139.156:8101/",
    channel_101_b: "http://155.138.139.156:9101/",
    channel_99:    "http://155.138.139.156:8099/",
    channel_99_hd: "http://155.138.139.156:9999/",
    channel_99_b:  "http://155.138.139.156:8199/",
    jpopsuki:      "http://213.239.204.252:8000/"
  };

  static request_options = {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "Accept-Language": "en-US,en;q=0.9,en-GB;q=0.8"
    }
  };


  static TITLE_PATTERN  = /Stream Title:\ +(.+)\n/;
  static CURRENT_TITLE  = /Current Song:\ +(.+?)\n\n/m;
  static TD_MATCH       = /<td(?:[^>]*)>(.+?)<\/td>/g;
  static TAG_MATCH      = /(<([^>]+)>)/gi;
  static TRAILING_COLON = /\:$/;

  static parse(filename : string, origin_url : string, raw : string) {
    const match = raw.matchAll(ShoutCast.TD_MATCH);
    const info : ShoutCast_Station = {
      filename:      filename,
      stream_url:    "",
      title:         "",
      homepage:      "",
      current_title: ""
    };

    let last_key : string = "";

    for(let m of match) {

      // Once the current song title is found,
      //  we no longer need to process anything else.
      //  This is mainly for JpopSuki, which has multiple current songs
      //  titles after the one we want.
      if (info.current_title != "") 
        break;

      const text = m[1].replace(ShoutCast.TAG_MATCH, "").trim();

      /* if (last_key !== "") */
      /* console.log(`${last_key} => ${text}`); */

      switch (last_key) {
        case "title":
        case "homepage":
        case "current_title":
          info[last_key] = text;
          last_key = "";
        break;

        default:
          if (text.indexOf(":") === (text.length - 1)) {
            /* last_key = s.replace(ShoutCast.TRAILING_COLON, ""); */
            switch(text) {
              case "Stream Title:":
                last_key = "title";
              break;
              case "Stream URL:":
                last_key = "homepage";
              break;
              case "Current Song:":
                last_key = "current_title";
              break;
              default:
                last_key = text;
            } // switch
          } else {
            last_key = "";
          }
      }
    } // for
    info["stream_url"] = origin_url;
    return info;
  } // static


  static get_all() {
    const filenames = Object.keys(ShoutCast.URLS) as (keyof typeof ShoutCast.URLS)[];

    const fetches = filenames.map((f) => {
      const url : string = ShoutCast.URLS[f];
      return fetch(url, ShoutCast.request_options)
      .then((resp) => resp.text())
      .then((txt) => ShoutCast.parse(f, url, txt));
    });

    return Promise.all(fetches);
  } // static

  static async response() {
    const fetches = await ShoutCast.get_all();
    return new Response(
      JSON.stringify({time: Date.now(), channels: fetches}),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin" : "*",
          "Cache-Control": "public, max-age=90"
        }
      }
    );
  } // static

} // class




