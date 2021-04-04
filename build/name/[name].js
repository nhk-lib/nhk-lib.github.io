var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fetch from "cross-fetch";
const URLS = {
    "channel_101": "http://155.138.139.156:8101/",
    "channel_101_b": "http://155.138.139.156:9101/",
    "channel_99": "http://155.138.139.156:8099/",
    "channel_99_b": "http://155.138.139.156:8199/",
    "jpopsuki": "http://213.239.204.252:8000/"
};
function get_options(url) {
    return {
        method: "GET",
        hostname: url.hostname,
        port: parseInt(url.port),
        path: url.pathname
    };
}
class ShoutCast {
}
ShoutCast.TITLE_PATTERN = /Stream Title:\ +(.+)\n/;
ShoutCast.CURRENT_TITLE = /Current Song:\ +(.+?)\n\n/m;
ShoutCast.TD_MATCH = /<td(?:[^>]*)>(.+?)<\/td>/g;
ShoutCast.TAG_MATCH = /(<([^>]+)>)/gi;
ShoutCast.TRAILING_COLON = /\:$/;
function parse(raw) {
    const td_match = new RegExp(ShoutCast.TD_MATCH);
    const info = {};
    let m;
    let last_key = "";
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
}
export default (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const name = request.query.name.toString();
    const url = URLS[name];
    if (url) {
        const resp = yield fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "Accept-Language": "en-US,en;q=0.9,en-GB;q=0.8"
            }
        });
        const body = yield resp.text();
        const fin = {
            status: resp.status,
            body: body,
            name: name,
            url: URLS[name],
            error: (resp.status !== 200)
        };
        response.status(200).json(fin);
        return;
    }
    response.status(200).json({ error: "INVALID NAME" });
});
