
import {
  app,
  get,
  post,
  redirect,
  contentType,
} from "https://denopkg.com/syumai/dinatra/mod.ts";

const greeting = "<h1>Hello From Deno on Fly!</h1>";

app(
  get("/", () => greeting),
  get("/:id", ({ params }) => greeting + `</br>and hello to ${params.id}`),
);

/* var counter = 0; */

/* const resp_o = { */
/*     "content-type": "application/json; charset=utf-8", */
/*     "Access-Control-Allow-Origin" : "*", */
/*     "X-version": "hello4", */
/*     "Cache-Control": "public, max-age=90", */
/*     "Cloudflare-CDN-Cache-Control": "max-age=90" */
/* }; */


/* const server = Deno.listen({ port: 8080 }); */
/* console.log("Localhost: 8080"); */
/* for await (const conn of server) { */
/*   serveHttp(conn); */
/* } */

/* async function serveHttp(conn: Deno.Conn) { */
/*   const httpConn = Deno.serveHttp(conn); */
/*   for await (const requestEvent of httpConn) { */
/*     const body = JSON.stringify({time: (new Date).toString(), channels: ++counter}); */
/*     requestEvent.respondWith( */
/*       new Response(body, {status: 200, headers: { "X-counter": counter.toString(), ...resp_o }}) */
/*     ); */
/*   } // for */
/* } */
