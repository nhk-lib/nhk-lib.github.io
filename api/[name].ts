
import { VercelRequest, VercelResponse } from '@vercel/node'

const URLS = {
  channel_101: "http://155.138.139.156:8101/",
  channel_101_b: "http://155.138.139.156:9101/",
  channel_99: "http://155.138.139.156:8099/",
  channel_99_b: "http://155.138.139.156:8199/",
  jpopsuki: "http://213.239.204.252:8000/"
}; // object

export default (request: VercelRequest, response: VercelResponse) => {
    response.status(200).json(
      JSON.stringify({
        name: request.query,
        url: URLS[request.query.toString()]
      })
    );
};
