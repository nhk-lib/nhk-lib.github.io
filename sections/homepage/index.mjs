// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const ATTR_STRING = /^[\#\.]{1}[\.\#a-z\_\-0-9]+$/;
function next_loop_ms(mins) {
    const dt = new Date();
    dt.getTime();
    const secs = (mins - dt.getMinutes() % mins) * 60 - dt.getSeconds() + 1;
    return secs * 1000;
}
function fragment(...args) {
    const f = document.createDocumentFragment();
    for (const x of args){
        f.appendChild(x);
    }
    return f;
}
function img(alt, src) {
    const i = document.createElement("img");
    i.setAttribute("alt", alt);
    i.setAttribute("src", src);
    return i;
}
function inner_text(q, txt) {
    const nodes = empty(q);
    for (const n of nodes){
        n.appendChild(document.createTextNode(txt));
    }
    return nodes;
}
function append_child(query, x) {
    const nodes = Array.from(document.querySelectorAll(query));
    for (const t of nodes){
        t.appendChild(x);
    }
    return nodes;
}
function empty(q) {
    const nodes = Array.from(document.querySelectorAll(q));
    for (const n of nodes)while(n.firstChild){
        n.removeChild(n.firstChild);
    }
    return nodes;
}
function div(...args) {
    return new_tag('div', ...args);
}
function br() {
    return new_tag('br');
}
function a(...args) {
    return new_tag('a', ...args);
}
function set_attribute(q, a_name, val) {
    const nodes = Array.from(document.querySelectorAll(q));
    for (const n of nodes)n.setAttribute(a_name, val);
    return nodes;
}
function new_tag(tag_name, ...args) {
    let e = document.createElement(tag_name);
    for (const x of args){
        if (is_attrs(x)) {
            set_attrs(e, x);
            continue;
        }
        if (Array.isArray(x)) {
            for (const child of x)e.appendChild(child);
            continue;
        }
        if (x instanceof Node) {
            e.appendChild(x);
            continue;
        }
        if (typeof x === 'string') {
            e.appendChild(document.createTextNode(x));
            continue;
        }
        throw new Error(`Unknown type for new_tag body: ${JSON.stringify(x)}`);
    }
    return e;
}
function is_attrs(x) {
    if (typeof x === 'string' && x.match(ATTR_STRING)) return true;
    if (!x) return false;
    return typeof x === 'object' && x.constructor.name === 'Object';
}
function set_attrs(e, x) {
    for (const [k, v] of Object.entries(typeof x === 'string' ? split_attributes(x) : x)){
        switch(k){
            case 'href':
                {
                    e.setAttribute(k, clean_url(v));
                }
            default:
                {
                    e.setAttribute(k, v);
                }
        }
    }
    return e;
}
function split_attributes(str) {
    const new_attr = {};
    let classes = [];
    const pieces = str.split(".");
    for (const raw_y of pieces){
        const y = raw_y.trim();
        if (y.length === 0) continue;
        if (y.indexOf("#") === -1) {
            classes.push(y.trim());
            continue;
        }
        if (y.length < 2) {
            continue;
        }
        const id = y.split("#")[1];
        if (id) new_attr["id"] = id.trim();
    }
    let classes_str = classes.join(" ").trim();
    if (classes_str.length > 0) {
        new_attr["class"] = classes_str;
    }
    return new_attr;
}
function is_loading(q) {
    const nodes = Array.from(document.querySelectorAll(q));
    for (const e of nodes){
        if (e.matches('.loading')) return true;
    }
    return false;
}
function loading(q) {
    const nodes = Array.from(document.querySelectorAll(q));
    for (const e of nodes)e.classList.add('loading');
    return nodes;
}
function not_loading(q) {
    const nodes = Array.from(document.querySelectorAll(q));
    for (const e of nodes)e.classList.remove('loading');
    return nodes;
}
function clean_url(raw) {
    const str = raw.trim();
    let u = null;
    try {
        u = new URL(str);
    } catch (e) {
        const new_v = str.replaceAll(/[^a-z0-9\_\-\.\/]+/ig, '').replaceAll(/\.+/g, '.').replaceAll(/\/+/g, '/');
        if (new_v !== str) throw new Error(`Invalid href attribute: ${str}`);
        return new_v;
    }
    const protocol = u.protocol.trim().toLowerCase();
    switch(protocol){
        case "http:":
        case "https:":
        case "ssh:":
        case "ftp:":
        case "sftp:":
        case "git:":
        case "magnet:":
        case "gopher:":
            {
                return u.toString();
            }
        default:
            {
                throw new Error(`Invalid href attribute protocol: ${str}`);
            }
    }
}
let MAIN_DIV = '#shout_cast';
const Shout_Cast_DOM = {
    id (x) {
        return `shout_cast_${x.filename}`;
    },
    focus () {
        return Shout_Cast_DOM.fetch();
    },
    create: {
        station (x) {
            const id = Shout_Cast_DOM.id(x);
            if (document.getElementById(id)) return false;
            return append_child(MAIN_DIV, fragment(div(`#${Shout_Cast_DOM.id(x)}.station`, [
                div('.title', a({
                    href: x.stream_url
                }, x.title)),
                div('.current_title', x.current_title)
            ])));
        }
    },
    update: {
        station (x) {
            return Shout_Cast_DOM.create.station(x) || inner_text(`#${Shout_Cast_DOM.id(x)} div.current_title`, x.current_title);
        }
    },
    async fetch () {
        if (document.hidden || is_loading(MAIN_DIV)) return false;
        loading(MAIN_DIV);
        return fetch("https://da99shoutcast.deno.dev/ShoutCast.json").then((resp)=>{
            not_loading(MAIN_DIV);
            if (resp.status !== 200) {
                console.log(`ERROR: ${resp.status}`);
                throw new Error(`shoutcast fetch: ${resp.status}`);
            }
            setTimeout(Shout_Cast_DOM.fetch, next_loop_ms(2));
            return resp.json();
        }).then((x)=>{
            if (typeof x === 'object' && 'channels' in x) {
                for (const c of x.channels)Shout_Cast_DOM.update.station(c);
                return x.channels;
            }
            console.log(x);
        }).catch((x)=>{
            not_loading(MAIN_DIV);
            setTimeout(Shout_Cast_DOM.fetch, next_loop_ms(1));
            console.log(x);
        });
    },
    initialize: function(str = '#shout_cast') {
        MAIN_DIV = str;
        return Shout_Cast_DOM.fetch();
    }
};
let MAIN_DIV1 = '#nhk';
const NHK_DOM = {
    initialize (main = '#nhk') {
        MAIN_DIV1 = main;
        NHK_DOM.fetch();
    },
    id (x) {
        return `nhk_${x.ends_at}`;
    },
    focus () {
        return NHK_DOM.fetch();
    },
    async fetch () {
        if (document.hidden || is_loading(MAIN_DIV1)) return false;
        loading(MAIN_DIV1);
        return fetch("https://da99shoutcast.deno.dev/NHK.json").then((resp)=>{
            not_loading(MAIN_DIV1);
            if (resp.status === 200) {
                return resp.json();
            } else {
                console.log(resp);
                throw new Error("NHK Failed");
            }
        }).then((x)=>{
            if (!(typeof x === 'object' && 'shows' in x)) throw new Error(`Unknown value for NHK JSON response: ${x}`);
            for (const show of x.shows)NHK_DOM.create.show(show);
            if (x.shows.length === 0) throw new Error("No shows retrieved.");
            const show = x.shows[0];
            const date_now = Date.now();
            if (show.ends_at < date_now) {
                setTimeout(NHK_DOM.fetch, 5000);
                return;
            }
            const next_time = Math.floor(show.ends_at - date_now);
            setTimeout(NHK_DOM.fetch, next_time + 1000);
        }).catch((x)=>{
            not_loading(MAIN_DIV1);
            console.log(x);
            setTimeout(NHK_DOM.fetch, 10000);
        });
    },
    create: {
        show (x) {
            const id = NHK_DOM.id(x);
            const old_e = document.getElementById(id);
            if (old_e || x.ends_at <= Date.now()) return false;
            const preview_img = x.title != "NHK NEWSLINE" && x.thumbnail_small ? fragment(br(), img(`preview of ${x.title}`, x.thumbnail_small)) : '';
            const new_e = div(`#${id}.nhk_show`);
            if (x.link) {
                new_e.appendChild(div(".title", a({
                    href: x.link
                }, x.title, preview_img)));
            } else {
                new_e.appendChild(div(".title", x.title, preview_img));
            }
            new_e.appendChild(div(".description", x.description));
            append_child(MAIN_DIV1, new_e);
            setTimeout(()=>{
                document.querySelectorAll(`#${id}`).forEach((x)=>x.remove());
            }, x.ends_at - Date.now());
        }
    }
};
let MAIN_DIV2 = '#quarry';
const IN_HOUSE = {};
let CURRENT_HOUSE = {};
const OUT_HOUSE = {};
function date() {
    return new Date().toLocaleString();
}
function first_seen(c) {
    delete OUT_HOUSE[c.ip];
    if (!(c.ip in IN_HOUSE)) {
        IN_HOUSE[c.ip] = {
            date: date(),
            client: c
        };
    }
    return IN_HOUSE[c.ip].date;
}
function now_gone(c) {
    delete IN_HOUSE[c.ip];
    const now = date();
    OUT_HOUSE[c.ip] = {
        date: now,
        client: c
    };
    console.log(`Left: ${c.nickname} (${c.ip}) @ ${now}`);
    return OUT_HOUSE[c.ip].date;
}
function title(ip) {
    if (ip in IN_HOUSE) return `entered: ${IN_HOUSE[ip].date}`;
    return 'unknown';
}
function loop_ms() {
    const x = new Date();
    const hours = x.getHours();
    if (hours > 12 + 1) return next_loop_ms(1);
    if (hours > 3 && hours < 10) return next_loop_ms(5);
    if (hours > 0 && hours < 4) return next_loop_ms(10);
    return next_loop_ms(5);
}
const Quarry_DOM = {
    initialize (main = '#quarry') {
        MAIN_DIV2 = main;
        Quarry_DOM.fetch();
    },
    focus () {
        return Quarry_DOM.fetch();
    },
    update: {
        clients: function(clients) {
            const f = document.createDocumentFragment();
            CURRENT_HOUSE = clients.reduce((p, c)=>{
                p[c.ip] = {
                    date: date(),
                    client: c
                };
                return p;
            }, {});
            for (const [in_ip, mov] of Object.entries(IN_HOUSE)){
                if (!(in_ip in CURRENT_HOUSE)) now_gone(mov.client);
            }
            for (const client of clients){
                first_seen(client);
                if (client.ignored) {
                    continue;
                }
                const nickname = client.nickname === "Unknown" ? `${client.hostname}/${client.ip}` : client.nickname;
                f.appendChild(div('.client', {
                    'title': title(client.ip)
                }, nickname));
            }
            empty(MAIN_DIV2);
            append_child(MAIN_DIV2, f);
            set_attribute(MAIN_DIV2, 'title', `updated: ${date()}`);
            return true;
        }
    },
    async fetch () {
        if (document.hidden || is_loading(MAIN_DIV2)) return false;
        loading(MAIN_DIV2);
        return fetch("https://www.miniuni.com/quarry/clients").then((resp)=>{
            not_loading(MAIN_DIV2);
            setTimeout(Quarry_DOM.fetch, loop_ms());
            if (resp.status !== 200) {
                console.log(`ERROR: ${resp.status}`);
                throw new Error(`Failed to get quarry clients: ${resp.status}`);
            }
            return resp.json();
        }).then((x)=>{
            if (typeof x === 'object' && x.error === false) {
                Quarry_DOM.update.clients(x.data);
            } else {
                console.log("Error in getting quarry info: ");
                console.log(x);
            }
        }).catch((x)=>{
            not_loading(MAIN_DIV2);
            empty(MAIN_DIV2);
            setTimeout(Quarry_DOM.fetch, 10000);
            console.log(x);
        });
    }
};
Quarry_DOM.initialize('#quarry');
Shout_Cast_DOM.initialize('#shout_cast');
NHK_DOM.initialize('#nhk');
function update_page() {
    if (!document.hidden) {
        NHK_DOM.focus();
        Quarry_DOM.focus();
        Shout_Cast_DOM.focus();
    }
}
document.addEventListener('visibilitychange', update_page);
not_loading('body');
