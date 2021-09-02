
/// <reference path="./deploy.d.ts" />

import { ShoutCast } from "./ShoutCast.ts";
import { NHK } from "./NHK.ts";


const GIT_REPO = "https://raw.githubusercontent.com/da99/diegoalban/master/Public";

async function get_file(event : FetchEvent, path : string) {
  const origin      = new URL(event.request.url);
  const old_headers = event.request.headers;
  const new_url     = `${GIT_REPO}${path}${origin.search}`;

  console.log(new_url);

  const result = await fetch(new_url, {
    headers: {
      "accept": "text/html,application/javascript,text/css",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.58 Safari/53"
    }
  });

  if (result.status !== 200) {
    return result;
  }

  const headers = new Headers(result.headers);
  const path_pieces = path.split(".")
  const ext = path_pieces[path_pieces.length - 1];
  switch(ext) {
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

  } // switch

  return new Response(result.body, { ...result, headers });
} // function

addEventListener("fetch", (event : FetchEvent) => {

  const { pathname }  = new URL(event.request.url);
  switch(pathname) {

    case "/":
      event.respondWith( get_file(event, "/index.html"));
      break;

    case "/info":
      event.respondWith( new Response(import.meta.url, {status: 200, headers: {"content-type": "text/plain"}}) );
      break;

    case "/NHK.json":
      event.respondWith(NHK.response());
      break;

    case "/ShoutCast.json":
      event.respondWith(ShoutCast.response());
      break;

    default:
      event.respondWith( get_file(event, pathname) );
  } // switch

}); // addEventListener

