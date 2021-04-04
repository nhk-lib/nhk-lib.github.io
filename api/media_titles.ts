
import { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "cross-fetch";

interface NHK_WORLD_JSON_ITEM {
  seriesId:      string,
  airingId:      string,
  title:         string,
  description:   string,
  link?:          string,
  pubDate:       string,
  jstrm:         string,
  wstrm:         string,
  vodReserved:   boolean,
  endDate:       string,
  subtitle:      string,
  content:       string,
  content_clean: string,
  pgm_gr_id:     string,
  thumbnail:     string,
  thumbnail_s:   string,
  showlist:      string,
  internal:      string,
  genre:         object,
  vod_id:        string,
  vod_url:       string,
  analytics:     string
} // interface

class NHK_WORLD {
  static JSON = "http://api.nhk.or.jp/nhkworld/epg/v7a/world/now.json?apikey=EJfK8jdS57GqlupFgAfAAwr573q01y6k"

  static HOST = "https://www3.nhk.or.jp"
  static async json() {
    const resp = await fetch(NHK_WORLD.JSON, {headers: ShoutCast.HEADERS});
    if (resp.status !== 200) {
      return [];
    }
    const json = await resp.json();
    return json.channel.item.map((x : NHK_WORLD_JSON_ITEM) => NHK_WORLD.item_to_json(x));
  } // method

  static item_to_json(x : NHK_WORLD_JSON_ITEM) {
    return {
      airingId:     x.airingId,
      title:        string_join([x.title, x.subtitle], ":"),
      description:  string_join([x.description, x.content_clean], "\n"),
      link:         (x.link) ? `${NHK_WORLD.HOST}${x.link}` : null,
      published_at: parseInt(x.pubDate),
      ends_at:      parseInt(x.endDate),
    }; // return
  }
} // class

function string_join(x : string[], j : string) {
  return x.filter(x => { return x.length > 0; }).join(j).trim();
} // function


interface Shoutcast_Station {
  "Current Song"?: string,
  "Stream Title"?: string,
  "Stream URL"?: string
} // interface

class ShoutCast {
  static URLS = {
    "channel_101": "http://155.138.139.156:8101/",
    "channel_101_b": "http://155.138.139.156:9101/",
    "channel_99": "http://155.138.139.156:8099/",
    "channel_99_b": "http://155.138.139.156:8199/",
    "jpopsuki": "http://213.239.204.252:8000/"
  }; // object

  static TITLE_PATTERN  = /Stream Title:\ +(.+)\n/;
  static CURRENT_TITLE  = /Current Song:\ +(.+?)\n\n/m;
  static TD_MATCH       = /<td(?:[^>]*)>(.+?)<\/td>/g;
  static TAG_MATCH      = /(<([^>]+)>)/gi;
  static TRAILING_COLON = /\:$/;
  static HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Accept-Language": "en-US,en;q=0.9,en-GB;q=0.8"
  };

  static parse(raw : string) {
    const td_match = new RegExp(ShoutCast.TD_MATCH);
    const info : Shoutcast_Station = {};
    let m;
    let last_key : string = "";
    while ((m = td_match.exec(raw)) !== null) {
      const s = m[1].replace(ShoutCast.TAG_MATCH, "").trim();
      switch (last_key) {
        case "Current Song":
          case "Stream Title":
          case "Stream URL":
          if (!info[last_key]) {
          info[last_key] = s;
        }
        last_key = "";
        break;
        default:
          last_key = (s.indexOf(":") > 0) ? s.replace(ShoutCast.TRAILING_COLON, "") : "unknown";
      } // switch
    } // while
    return info;
  } // function

  static async info() {
    const entries = Object.entries(ShoutCast.URLS);
    const promises = entries.map(([k,url]) => fetch(url, { headers: ShoutCast.HEADERS}));
    const results = await Promise.all(promises);
    const bodys = await Promise.all(results.map(p => p.text()));

    return entries.map(([k,url], i) => {
      const body = bodys[i];
      const resp = results[i];
      const is_err = (resp.status !== 200);
      const info = (is_err) ? {} : ShoutCast.parse(body);
      return {
        filename: k,
        title: info["Stream Title"],
        current_title: info["Current Song"],
        stream_url: url,
        homepage: info["Stream URL"],
        error: is_err
      };
    });
  } // function

} // class

function get_cache_seconds(y : number) {
  const d = new Date();
  const s = d.getSeconds();
  const m = (new Date()).getMinutes();
  const next_m = (m - (m % y)) + y;
  const seconds = ((next_m - m) * 60) - s - 1;
  if (seconds < 0) {
    return 1;
  }
  return seconds;
}

export default async (request: VercelRequest, response: VercelResponse) => {
  const results = await Promise.all([ShoutCast.info(), NHK_WORLD.json()]);
  const shoutcast = results[0];
  const nhk_json = results[1];

  response.setHeader("Cache-Control", `s-maxage=${get_cache_seconds(5)}`);

  response.status(200)
  .json({
    "updated_at": (((Date.now() / 1000) | 0) * 1000),
    nhk: nhk_json,
    shoutcast: shoutcast
  });

}; // export
