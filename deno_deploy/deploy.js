// deno_deploy/ShoutCast.ts
class ShoutCast {
  static URLS = {
    channel_99: "http://155.138.139.156:8099/",
    channel_99_half: "http://155.138.139.156:8199/",
    channel_99_classic: "http://155.138.139.156:8060/",
    channel_99_hd: "http://155.138.139.156:9999/",
    channel_2501: "http://155.138.139.156:2501/",
    channel_101: "http://155.138.139.156:8101/",
    channel_101_b: "http://155.138.139.156:9101/",
    channel_101_dropout: "http://155.138.139.156:2007/",
    channel_19_5: "http://155.138.139.156:9150/",
    channel_42: "http://155.138.139.156:8042/",
    jpopsuki: "http://65.21.170.149:8000/"
  };
  static request_options = {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "Accept-Language": "en-US,en;q=0.9,en-GB;q=0.8"
    }
  };
  static TITLE_PATTERN = /Stream Title:\ +(.+)\n/;
  static CURRENT_TITLE = /Current Song:\ +(.+?)\n\n/m;
  static TD_MATCH = /<td(?:[^>]*)>(.+?)<\/td>/g;
  static TAG_MATCH = /(<([^>]+)>)/gi;
  static TRAILING_COLON = /\:$/;
  static error(err, filename, origin_url) {
    const info = {
      filename,
      stream_url: origin_url,
      title: filename,
      homepage: origin_url,
      current_title: err.toString()
    };
    return info;
  }
  static parse(filename, origin_url, raw) {
    const match = raw.matchAll(ShoutCast.TD_MATCH);
    const info = {
      filename,
      stream_url: "",
      title: "",
      homepage: "",
      current_title: ""
    };
    let last_key = "";
    for (let m of match) {
      if (info.current_title != "")
        break;
      const text = m[1].replace(ShoutCast.TAG_MATCH, "").trim();
      switch (last_key) {
        case "title":
        case "homepage":
        case "current_title":
          info[last_key] = text;
          last_key = "";
          break;
        default:
          if (text.indexOf(":") === text.length - 1) {
            switch (text) {
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
            }
          } else {
            last_key = "";
          }
      }
    }
    info["stream_url"] = origin_url;
    return info;
  }
  static get_all() {
    const filenames = Object.keys(ShoutCast.URLS);
    const fetches = filenames.map((f) => {
      const url = ShoutCast.URLS[f];
      return fetch(url, ShoutCast.request_options).then((resp) => resp.text()).then((txt) => ShoutCast.parse(f, url, txt)).catch((err) => ShoutCast.error(err, f, url));
    });
    return Promise.all(fetches);
  }
  static async response() {
    const fetches = await ShoutCast.get_all();
    return new Response(JSON.stringify({ time: Date.now(), channels: fetches }), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=90"
      }
    });
  }
}

// deno_deploy/NHK.ts
class NHK {
  static get JSON() {
    const d = new Date;
    return `https://masterpl.hls.nhkworld.jp/epg/w/${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, "0")}${(d.getDay() + 1).toString().padStart(2, "0")}.json`;
  }
  static HOST = "https://www3.nhk.or.jp";
  static WHITESPACE = /[\n\t\s]+/g;
  static HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Accept-Language": "en-US,en;q=0.9,en-GB;q=0.8"
  };
  static string_join(x, j) {
    return x.filter((x2) => {
      return x2.length > 0;
    }).join(j).replace(NHK.WHITESPACE, " ").trim();
  }
  static async json() {
    const resp = await fetch(NHK.JSON, { headers: NHK.HEADERS });
    if (resp.status !== 200) {
      return [];
    }
    const json = await resp.json();
    return json.data.map((x) => NHK.item_to_json(x));
  }
  static item_to_json(x) {
    return {
      airingId: x.airingId,
      title: NHK.string_join([x.title, x.episodeTitle], ": "),
      description: x.description,
      link: x.link ? `${NHK.HOST}${x.link}` : null,
      thumbnail: x.thumbnail == "" ? null : x.thumbnail,
      thumbnail_small: x.thumbnail == "" ? null : x.thumbnail,
      published_at: new Date(x.startTime).getTime(),
      ends_at: new Date(x.endTime).getTime()
    };
  }
  static cache_seconds(shows) {
    const now = Date.now();
    const next_show = shows.find((x) => x.ends_at > now);
    if (next_show) {
      return Math.ceil((next_show.ends_at - now) / 1000) + 1;
    }
    return 3;
  }
  static async response() {
    const shows = await NHK.json();
    return new Response(JSON.stringify({ time: Date.now(), shows }), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": `public, max-age=${NHK.cache_seconds(shows)}`
      }
    });
  }
}

// deno_deploy/main.ts
var GIT_REPO = "https://raw.githubusercontent.com/da99/diegoalban/master/Public";
async function get_file(event, path) {
  const origin = new URL(event.request.url);
  const old_headers = event.request.headers;
  const new_url = `${GIT_REPO}${path}${origin.search}`;
  console.log(new_url);
  const result = await fetch(new_url, {
    headers: {
      accept: "text/html,application/javascript,text/css",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.58 Safari/53"
    }
  });
  if (result.status !== 200) {
    return result;
  }
  const headers = new Headers(result.headers);
  const path_pieces = path.split(".");
  const ext = path_pieces[path_pieces.length - 1];
  switch (ext) {
    case "js":
      headers.set("content-type", "application/javascript; charset=utf-8");
      break;
    case "css":
      headers.set("content-type", "text/css; charset=utf-8");
      break;
    case "html":
      headers.set("content-type", "text/html; charset=utf-8");
      headers.set("Content-Security-Policy", "default-src 'self'; img-src https://live.staticflickr.com 'self'");
      break;
  }
  return new Response(result.body, { ...result, headers });
}
addEventListener("fetch", (event) => {
  const { pathname } = new URL(event.request.url);
  switch (pathname) {
    case "/":
      event.respondWith(new Response("not ready", { status: 200, headers: { "content-type": "text/plain" } }));
      break;
    case "/info":
      event.respondWith(new Response(import.meta.url, { status: 200, headers: { "content-type": "text/plain" } }));
      break;
    case "/NHK.json":
      event.respondWith(NHK.response());
      break;
    case "/ShoutCast.json":
      event.respondWith(ShoutCast.response());
      break;
    default:
      event.respondWith(get_file(event, pathname));
  }
});
