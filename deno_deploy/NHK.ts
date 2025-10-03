

interface NHK_JSON_ITEM {
  seriesId:      string,
  airingId:      string,
  title:         string,
  episodeTitle:  string,
  description:   string,
  link?:          string,
  thumbnail:     string,
  pubDate:       string,
  endDate:       string,
} // interface

export interface NHK_SHOW {
  airingId:        string;
  title:           string;
  description:     string;
  link:            string | null;
  thumbnail:       string | null;
  thumbnail_small: string | null;
  published_at:    number;
  ends_at:         number;
} // return

export class NHK {
  // static JSON       = "http://api.nhk.or.jp/nhkworld/epg/v7a/world/now.json?apikey=EJfK8jdS57GqlupFgAfAAwr573q01y6k"
  // static JSON       = "https://nwapi.nhk.jp/nhkworld/epg/v7b/world/now.json"
  static get JSON() {
    const d = new Date();
    return `https://masterpl.hls.nhkworld.jp/epg/w/${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${(d.getDay() + 1).toString().padStart(2, '0')}.json`
  }
  static HOST       = "https://www3.nhk.or.jp";
  static WHITESPACE = /[\n\t\s]+/g;
  static HEADERS    = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9", "Accept-Language": "en-US,en;q=0.9,en-GB;q=0.8" };

  static string_join(x : string[], j : string) {
    return x.filter(x => { return x.length > 0; }).join(j).replace(NHK.WHITESPACE, " ").trim();
  } // function

  static async json() {
    const resp = await fetch(NHK.JSON, {headers: NHK.HEADERS});
    if (resp.status !== 200) {
      return [];
    }
    const json = await resp.json();
    return json.data.map((x : NHK_JSON_ITEM) => NHK.item_to_json(x));
  } // method

  static item_to_json(x : NHK_JSON_ITEM) : NHK_SHOW {
    return {
      airingId:     x.airingId,
      title:        NHK.string_join([x.title, x.episodeTitle], ": "),
      description:  x.description,
      link:         (x.link) ? `${NHK.HOST}${x.link}` : null,
      thumbnail:    (x.thumbnail == '') ?  null : x.thumbnail,
      thumbnail_small: (x.thumbnail == '') ? null : x.thumbnail,
      published_at: (new Date(x.startTime)).getTime(),
      ends_at:      (new Date(x.endTime)).getTime(),
    }; // return
  } // static

  static cache_seconds(shows : NHK_SHOW[]) {
    const now = Date.now();
    const next_show = shows.find(x => x.ends_at > now);
    if (next_show) {
      return Math.ceil((next_show.ends_at - now) / 1000)  + 1;
    }
    return 3;
  } // static

  static async response() {
    const shows = await NHK.json();
    return new Response(
      JSON.stringify({time: Date.now(), shows: shows}),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin" : "*",
          "Cache-Control": `public, max-age=${NHK.cache_seconds(shows)}`
        }
      }
    );
  } // static

/* async function (event : FetchEvent) { */
/*   const nhk_json = await NHK.json(); */
/*   const cache_secs = NHK.cache_seconds(nhk_json); */
/*   event.response.setHeader("Cache-Control", `s-maxage=${cache_secs}`); */

/*   event.response.status(200).json(nhk_json); */

/* }; // export */
} // class



