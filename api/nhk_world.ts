
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

interface NHK_WORLD_SHOW {
  airingId:     string;
  title:        string;
  description:  string;
  link:         string | null;
  published_at: number;
  ends_at:      number;
} // return

class NHK_WORLD {
  static JSON = "http://api.nhk.or.jp/nhkworld/epg/v7a/world/now.json?apikey=EJfK8jdS57GqlupFgAfAAwr573q01y6k"

  static HOST = "https://www3.nhk.or.jp";
  static WHITESPACE = /[\n\t\s]+/g;

  static HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Accept-Language": "en-US,en;q=0.9,en-GB;q=0.8"
  };

  static string_join(x : string[], j : string) {
    return x.filter(x => { return x.length > 0; }).join(j).replace(NHK_WORLD.WHITESPACE, " ").trim();
  } // function

  static async json() {
    const resp = await fetch(NHK_WORLD.JSON, {headers: NHK_WORLD.HEADERS});
    if (resp.status !== 200) {
      return [];
    }
    const json = await resp.json();
    return json.channel.item.map((x : NHK_WORLD_JSON_ITEM) => NHK_WORLD.item_to_json(x));
  } // method

  static item_to_json(x : NHK_WORLD_JSON_ITEM) : NHK_WORLD_SHOW {
    return {
      airingId:     x.airingId,
      title:        NHK_WORLD.string_join([x.title, x.subtitle], ": "),
      description:  NHK_WORLD.string_join([x.description, x.content_clean], " "),
      link:         (x.link) ? `${NHK_WORLD.HOST}${x.link}` : null,
      published_at: parseInt(x.pubDate),
      ends_at:      parseInt(x.endDate),
    }; // return
  } // static

  static cache_seconds(shows : NHK_WORLD_SHOW[]) {
    const now = Date.now();
    const next_show = shows.find(x => x.ends_at > now);
    if (next_show) {
      return Math.ceil((next_show.ends_at - now) / 1000)  + 1;
    }
    return 3;
  } // static

} // class


export default async (request: VercelRequest, response: VercelResponse) => {
  const nhk_json = await NHK_WORLD.json();
  const cache_secs = NHK_WORLD.cache_seconds(nhk_json);
  console.log(cache_secs, cache_secs / 60);
  response.setHeader("Cache-Control", `s-maxage=${cache_secs}`);

  response.status(200).json(nhk_json);

}; // export

