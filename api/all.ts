
import { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "cross-fetch";

const URLS = {
  "channel_101": "http://155.138.139.156:8101/",
  "channel_101_b": "http://155.138.139.156:9101/",
  "channel_99": "http://155.138.139.156:8099/",
  "channel_99_b": "http://155.138.139.156:8199/",
  "jpopsuki": "http://213.239.204.252:8000/"
}; // object

function get_options(url : URL) {
  return {
    method: "GET",
    hostname: url.hostname,
    port: parseInt(url.port),
    path: url.pathname
  };
} // function

interface Shoutcast_Station {
  "Current Song"?: string,
  "Stream Title"?: string,
  "Play URL"?: string
} // interface

class ShoutCast {
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
} // class

function parse(raw : string) {
  const td_match = new RegExp(ShoutCast.TD_MATCH);
  const info : Shoutcast_Station = {};
  let m;
  let last_key : string = "";
  while ((m = td_match.exec(raw)) !== null) {
    const s = m[1].replace(ShoutCast.TAG_MATCH, "").trim();
    switch (last_key) {
      case "Current Song":
        case "Stream Title":
        if (!info[last_key]) {
        info[last_key] = s;
      }
      last_key = "";
      break;
      default:
        last_key = s.replace(ShoutCast.TRAILING_COLON, "");
    }
  }
  return info;
} // func

async function get_all_info(urls : object) {
  const entries = Object.entries(urls);
  const promises = entries.map(([k,url]) => fetch(url, { headers: ShoutCast.HEADERS}));
  const results = await Promise.all(promises);
  const bodys = await Promise.all(results.map(p => p.text()));

  return entries.map(([k,url], i) => {
    const body = bodys[i];
    const resp = results[i];
    const is_err = (resp.status !== 200);
    const info = (is_err) ? {} : parse(body);
    return {
      name: k,
      url: url,
      error: is_err,
      info: info
    };
  });
} // function

export default async (request: VercelRequest, response: VercelResponse) => {
  const results = await get_all_info(URLS);
  response.status(200).json(results);
}; // export
