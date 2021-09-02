
/// <reference path="./deploy.d.ts" />

import { ShoutCast } from "./ShoutCast.ts";

addEventListener("fetch", (event : FetchEvent) => {

  const response = new Response("Hello World!", {
    headers: { "content-type": "text/plain" },
  });

  event.respondWith(ShoutCast.response());

});
