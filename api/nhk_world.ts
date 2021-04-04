
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

  static item_to_json(x : NHK_WORLD_JSON_ITEM) {
    return {
      airingId:     x.airingId,
      title:        NHK_WORLD.string_join([x.title, x.subtitle], ":"),
      description:  NHK_WORLD.string_join([x.description, x.content_clean], " "),
      link:         (x.link) ? `${NHK_WORLD.HOST}${x.link}` : null,
      published_at: parseInt(x.pubDate),
      ends_at:      parseInt(x.endDate),
    }; // return
  }
} // class

function get_cache_seconds(i_min : number) {
  const d = new Date();
  const s = d.getSeconds();
  const m = d.getMinutes();
  const seconds = ((i_min - (m % i_min)) * 60) - s - 1;
  if (seconds < 0) {
    return 1;
  }
  return seconds;
}

export default async (request: VercelRequest, response: VercelResponse) => {
  const nhk_json = await NHK_WORLD.json();

  response.setHeader("Cache-Control", `s-maxage=${get_cache_seconds(5)}`);

  response.status(200).json(nhk_json);

}; // export

