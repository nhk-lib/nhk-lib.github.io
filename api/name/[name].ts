
import { VercelRequest, VercelResponse } from '@vercel/node'
import fetch from "cross-fetch";

const URLS = {
  channel_101: "http://155.138.139.156:8101/",
  channel_101_b: "http://155.138.139.156:9101/",
  channel_99: "http://155.138.139.156:8099/",
  channel_99_b: "http://155.138.139.156:8199/",
  jpopsuki: "http://213.239.204.252:8000/"
}; // object

function get_options(url : URL) {
  return {
    method: "GET",
    hostname: url.hostname,
    port: parseInt(url.port),
    path: url.pathname
  };
} // function

export default (request: VercelRequest, response: VercelResponse) => {
  const name = request.query.name.toString();
  const url = URLS[name];
  if (url) {
    fetch(url)
    .then( resp => {
      if (resp.status === 200) {
        return resp.text();
      }
      throw(resp);
    })
    .then(function (txt) {
      response.status(200).json(
        {
          name: name,
          url: URLS[name],
          body: txt
        }
      );
    })
    .catch((err) => {
      response.status(200).json(
        {
          name: name,
          url: URLS[name],
          error: "UNKNOWN",
          status: err.toString()
        }
      );
    });
    return;
  }

  response.status(200).json({ error: "INVALID NAME" });
}; // export
