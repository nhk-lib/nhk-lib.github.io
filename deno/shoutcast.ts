
interface Shoutcast_Station {
  "filename"?:      string,
  "stream_url"?:    string,
  "title"?:         string,
  "homepage"?:      string,
  "current_title"?: string
} // interface


class ShoutCast {
  static URLS : any = {
    channel_101:   "http://155.138.139.156:8101/",
    channel_101_b: "http://155.138.139.156:9101/",
    channel_99:    "http://155.138.139.156:8099/",
    channel_99_hd: "http://155.138.139.156:9999/",
    channel_99_b:  "http://155.138.139.156:8199/",
    jpopsuki:      "http://213.239.204.252:8000/"
  };

  static TITLE_PATTERN  = /Stream Title:\ +(.+)\n/;
  static CURRENT_TITLE  = /Current Song:\ +(.+?)\n\n/m;
  static TD_MATCH       = /<td(?:[^>]*)>(.+?)<\/td>/g;
  static TAG_MATCH      = /(<([^>]+)>)/gi;
  static TRAILING_COLON = /\:$/;

  static parse(filename : string, origin_url : string, raw : string) {
    const match = raw.matchAll(ShoutCast.TD_MATCH);
    const info : Shoutcast_Station = {};
    let last_key : string = "";
    for(let m of match) {
      const text = m[1].replace(ShoutCast.TAG_MATCH, "").trim();

      /* if (last_key !== "") */
      /* console.log(`${last_key} => ${text}`); */

      switch (last_key) {
        case "title":
        case "homepage":
        case "current_title":
          if (!info[last_key]) {
            info[last_key] = text;
          }
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

} // class

const options = {
  method: "GET",
  headers: {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Accept-Language": "en-US,en;q=0.9,en-GB;q=0.8"
  }
};


const resp_o = {
  status: 200,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin" : "*",
    "Cache-Control": "public, max-age=90, s-maxage=90",
    "CDN-Cache-Control": "90",
    "Cloudflare-CDN-Cache-Control": "public, max-age=90"
  }
};


function get_all(event : any) {
  const fetches = Object.keys(ShoutCast.URLS).map((filename) => {
    const url = ShoutCast.URLS[filename];
    return fetch(url, options)
    .then((resp) => resp.text())
    .then((txt) => ShoutCast.parse(filename, url, txt));
  });

  Promise.all(fetches).then((bodies) => {
    const response = new Response(JSON.stringify(bodies), resp_o);
    event.respondWith(response);
  });
} // function


addEventListener("fetch", get_all); // addEventListener


