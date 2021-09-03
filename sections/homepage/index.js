const ASTERISK = "*";
const WHITESPACE = /(\s+)/;
class DA_Event {
    constructor(){
        this._events = {
        };
    }
    on(raw_key, func) {
        let new_key = this._standard_msg(raw_key);
        if (!this._events[new_key]) {
            this._events[new_key] = [];
        }
        this._events[new_key].push(func);
    }
    has(raw_key) {
        const key = this._standard_msg(raw_key);
        if (this._events[ASTERISK]) {
            return ASTERISK;
        }
        if (this._events[key]) {
            return key;
        }
        return null;
    }
    emit(raw_key, ...args) {
        let msg = this._standard_msg(raw_key);
        if (msg === ASTERISK) {
            return;
        }
        this._emit("*", msg, ...args);
        this._emit(msg, ...args);
    }
    _standard_msg(raw) {
        return raw.split(WHITESPACE).filter((e)=>e !== ""
        ).join(" ");
    }
    _emit(msg, ...args) {
        if (this._events[msg]) {
            this._events[msg].forEach((f)=>{
                f(...args);
            });
        }
    }
}
class DA_Element {
    constructor(html, tagName){
        this.element = typeof tagName == "string" ? html.document.createElement(tagName) : tagName;
        this.html = html;
    }
    attributes(o) {
        let doc = this.html.document;
        let ele = this.element;
        if (typeof o === "string") {
            let classes = [];
            o.split(".").forEach((y)=>{
                if (y.length === 0) {
                    return;
                }
                if (y.indexOf("#") === 0) {
                    let attr = doc.createAttribute("id");
                    attr.value = y.split("#")[1];
                    ele.setAttributeNode(attr);
                    return;
                }
                classes.push(y);
            });
            let classes_str = classes.join(" ");
            if (classes_str.length > 0) {
                let attr = doc.createAttribute("class");
                attr.value = classes_str;
                ele.setAttributeNode(attr);
            }
            return this;
        }
        if (typeof o === "object") {
            for (const [k, v] of Object.entries(o)){
                let attr = doc.createAttribute(k);
                if (typeof v == "string") {
                    attr.value = v;
                }
                ele.setAttributeNode(attr);
            }
        }
        return this;
    }
}
class DA_HTML {
    constructor(window1){
        this.window = window1;
        this.document = this.window.document;
        this._fragment = this.document.createDocumentFragment();
        this.current = [
            this._fragment
        ];
        this.is_finish = false;
    }
    new_tag(name, ...args) {
        if (this.is_finish) {
            throw new Error("No more nodes/elements allowed.");
        }
        let target = this.target();
        let element = this.document.createElement(name);
        this.current.push(element);
        let this_o = this;
        args.forEach(function(x, i) {
            if (typeof x === "string" && i === 0 && (x.indexOf('#') == 0 || x.indexOf('.') === 0)) {
                this_o.set_attributes(x);
            } else if (typeof x === "string") {
                element.appendChild(this_o.text_node(x));
            } else if (typeof x === "function") {
                x(this_o);
            } else if (typeof x === "object" && x.wholeText) {
                element.appendChild(x);
            } else if (typeof x === "object") {
                this_o.set_attributes(x);
            } else {
                throw new Error("Invalid argument for new tag: " + x);
            }
        });
        let new_child = this.current.pop();
        if (new_child) {
            target.appendChild(new_child);
        }
        return this;
    }
    target() {
        return this.current[this.current.length - 1];
    }
    set_attributes(x) {
        let ele = new DA_Element(this, this.target());
        ele.attributes(x);
        return this;
    }
    to_element(x) {
        if (!x || x === true) {
            return null;
        }
        switch(typeof x){
            case "string":
                return this.text_node(x);
            case "number":
                return this.text_node(x.toString());
            case "object":
                return x;
        }
        return null;
    }
    finish(selector) {
        this.is_finish = true;
        return;
    }
    append_child(x) {
        let target = this.target();
        if (!x || x === true) {
            return;
        }
        if (Array.isArray(x)) {
            x.forEach((y)=>{
                this.append_child(y);
                return this;
            });
        }
        if (typeof x == "string") {
            this.target().appendChild(this.document.createTextNode(x));
            return this;
        }
        if (typeof x == "function") {
            x(target);
            return this;
        }
        if (Object.getPrototypeOf(x) == Object.prototype) {
            this.set_attributes(x);
            return this;
        }
        throw new Error("Invalid argument for child element.");
    }
    title(raw_text) {
        let title = this.document.querySelectorAll("title")[0];
        while(title.firstChild){
            title.removeChild(title.firstChild);
        }
        title.appendChild(this.text_node(raw_text));
        return title;
    }
    link(attrs) {
        let l = new DA_Element(this, "link");
        l.attributes(attrs);
        let head = this.document.querySelector("head");
        if (head) {
            head.appendChild(l.element);
        }
        return l.element;
    }
    meta(attrs) {
        let m;
        if (attrs["charset"]) {
            m = new DA_Element(this, this.document.querySelector("meta[charset]") || "meta");
            m.attributes(attrs);
        } else {
            m = new DA_Element(this, "meta");
            m.attributes(attrs);
            let head = this.document.querySelector("head");
            if (head) {
                head.appendChild(m.element);
            }
        }
        return m.element;
    }
    serialize() {
        let e = this.document.createElement("div");
        e.appendChild(this._fragment);
        return e.innerHTML;
    }
    partial(func) {
        this.current.push(this._fragment);
        func(this);
        this.current.pop();
        return this;
    }
    fragment() {
        return this._fragment;
    }
    body(...args) {
        let doc = this.document.querySelector("body");
        if (!doc) {
            return this;
        }
        this.current.push(doc);
        let ele = new DA_Element(this, doc);
        let this_o = this;
        args.forEach(function(x) {
            if (typeof x === "function") {
                x(this_o);
            } else {
                if (typeof x === "string" || typeof x === "object") {
                    ele.attributes(x);
                } else {
                    throw new Error(`Unknown argument type: ${typeof x} -> ${x}`);
                }
            }
        });
        this.current.pop();
        return this;
    }
    script(...args) {
        return this.new_tag("script", ...args);
    }
    text_node(raw_txt) {
        return this.document.createTextNode(raw_txt);
    }
    a(...args) {
        return this.new_tag("a", ...args);
    }
    div(...args) {
        return this.new_tag("div", ...args);
    }
    p(...args) {
        return this.new_tag("p", ...args);
    }
    strong(...args) {
        return this.new_tag("strong", ...args);
    }
    textarea(...args) {
        return this.new_tag("textarea", ...args);
    }
    input(...args) {
        return this.new_tag("input", ...args);
    }
}
const WHITESPACE_PATTERN = /\s+/;
const DA = {
    HTML: DA_HTML,
    Event: DA_Event,
    split_whitespace: function(x) {
        return x.split(WHITESPACE_PATTERN).filter((x1)=>x1.length != 0
        );
    }
};
(function() {
    class Page {
        static start_loading() {
            return document.body.classList.add("loading");
        }
        static done_loading() {
            return document.body.classList.remove("loading");
        }
    }
    const E = new DA.Event();
    const H = new DA.HTML(window);
    function img(alt, src) {
        return H.new_tag("img", {
            alt,
            src
        });
    }
    class Quarry {
        static next_loop_ms() {
            const min_target = 1;
            const dt = new Date();
            const now = dt.getTime();
            const secs = (1 - dt.getMinutes() % 1) * 60 - dt.getSeconds() + 1;
            const new_ms = secs * 1000;
            const new_dt = new Date(now + new_ms);
            return new_ms;
        }
        static fetch() {
            const url = new URL(window.location.href);
            return fetch(url.origin + "/quarry/clients");
        }
    }
    function render_shoutcast_title(args) {
        const div = document.querySelector("div.loading");
        if (div) {
            div.remove();
            const h = new DA.HTML(window);
            h.div("#updated_at", new Date().toString());
            document.body.appendChild(h.fragment());
        } else {
            const ua = document.getElementById("updated_at");
            if (ua) {
                ua.innerText = new Date().toString();
            }
        }
        return div;
    }
    E.on("media title error", (x)=>{
        console.log(x);
    });
    function render_shoutcast_titles(json) {
        json.forEach((x)=>{
            render_shoutcast_station(x);
        });
    }
    function render_nhk_show(x) {
        const id = `nhk_${x.ends_at}`;
        const e = document.getElementById(id);
        if (e || x.ends_at <= Date.now()) {
            return;
        }
        const h = new DA.HTML(window);
        let _id = [
            `#${id}.nhk_show`,
            x.is_recordable ? ".recordable" : ".not_recordable",
            x.is_recording ? ".recording" : ".not_recording"
        ].join(" ");
        h.div(_id, {
            title: x.is_recordable ? x.what_to_record.toString() : "regular"
        }, ()=>{
            h.div(".title", ()=>{
                if (x.href) {
                    h.a({
                        href: x.href
                    }, x.title);
                } else {
                    h.target().appendChild(h.text_node(x.title));
                }
                if (x.title != "NHK NEWSLINE" && x.thumbnail_small) {
                    h.new_tag("img", {
                        alt: `preview of ${x.title}`,
                        src: x.thumbnail_small
                    });
                }
            });
            h.div(".description", x.description);
        });
        append_child("nhk", h.fragment());
        setTimeout(()=>{
            document.querySelectorAll(`#${id}`).forEach((x1)=>x1.remove()
            );
        }, x.ends_at - Date.now());
    }
    function render_shoutcast_station(x) {
        const id = `shoutchast_${x.filename}`;
        const e = document.getElementById(id);
        if (e) {
            update_innerText(e.querySelector("div.current_title"), x.current_title);
        } else {
            const h = new DA.HTML(window);
            h.div(`#${id}.shoutcast`, ()=>{
                h.div(".title", ()=>{
                    h.a({
                        href: x.stream_url
                    }, x.title);
                });
                h.div(".current_title", x.current_title);
            });
            append_child("shoutcast", h.fragment());
        }
    }
    function update_innerText(target, txt) {
        if (target) {
            target.innerText = txt;
            return target;
        }
        return;
    }
    function append_child(id, x) {
        const target = document.getElementById(id);
        if (target) {
            return target.appendChild(x);
        }
        return;
    }
    function quarry_fetch_and_loop() {
        Page.start_loading();
        return Quarry.fetch().then((resp)=>{
            Page.done_loading();
            setTimeout(quarry_fetch_and_loop, Quarry.next_loop_ms());
            if (resp.status !== 200) {
                console.log(`ERROR: ${resp.status}`);
                return null;
            }
            return resp.json();
        }).then((x)=>{
            if (x && x.error === false) {
                render_quarry_clients(x);
            } else {
                console.log("Error in getting quarry info: ");
                console.log(x);
            }
        }).catch((x)=>{
            Page.done_loading();
            clear_quarry();
            setTimeout(quarry_fetch_and_loop, 10000);
            console.log(x);
        });
    }
    function shoutcast_next_loop_ms() {
        const dt = new Date();
        const now = dt.getTime();
        const secs = (5 - dt.getMinutes() % 5) * 60 - dt.getSeconds() + 2;
        const new_ms = secs * 1000;
        const new_dt = new Date(now + new_ms);
        return new_ms;
    }
    function shoutcast_fetch_and_loop() {
        Page.start_loading();
        return fetch("https://da99shoutcast.deno.dev/ShoutCast.json").then((resp)=>{
            Page.done_loading();
            if (resp.status !== 200) {
                console.log(`ERROR: ${resp.status}`);
                throw new Error(`shoutcast fetch: ${resp.status}`);
            }
            setTimeout(shoutcast_fetch_and_loop, shoutcast_next_loop_ms());
            return resp.json();
        }).then((x)=>{
            if (x && x.channels) {
                render_shoutcast_titles(x.channels);
            }
        }).catch((x)=>{
            Page.done_loading();
            setTimeout(shoutcast_fetch_and_loop, shoutcast_next_loop_ms());
            console.log(x);
        });
    }
    function clear_quarry() {
        const quarry = document.getElementById("quarry");
        if (quarry) {
            while(quarry.firstChild){
                quarry.removeChild(quarry.firstChild);
            }
        }
    }
    function nhk_loop() {
        Page.start_loading();
        fetch("https://da99shoutcast.deno.dev/NHK.json").then((resp)=>{
            Page.done_loading();
            if (resp.status === 200) {
                return resp.json();
            } else {
                console.log(resp);
                throw new Error("NHK Failed");
            }
        }).then((x)=>{
            if (x && x.shows) {
                x.shows.forEach((show)=>{
                    render_nhk_show(show);
                });
                const show = x.shows[0];
                if (!show) {
                    throw new Error("No shows retrieved.");
                } else {
                    const date_now = Date.now();
                    if (show.ends_at < date_now) {
                        setTimeout(nhk_loop, 5000);
                    } else {
                        const next_time = Math.floor(show.ends_at - date_now);
                        setTimeout(nhk_loop, next_time + 1000);
                    }
                }
            }
        }).catch((x)=>{
            Page.done_loading();
            console.log(x);
            setTimeout(nhk_loop, 10000);
        });
    }
    function render_quarry_clients(x) {
        clear_quarry();
        if (x) {
            x.data.forEach((client)=>{
                if (client.ignored) return;
                const h = new DA.HTML(window);
                const nickname = client.nickname === "Unknown" ? `${client.hostname}/${client.ip}` : client.nickname;
                h.div(`.client`, {
                    "data-client": client.nickname
                }, nickname);
                append_child("quarry", h.fragment());
            });
        }
    }
    document.body.appendChild(H.fragment());
    console.log("Starting fetch loop.");
    quarry_fetch_and_loop();
    shoutcast_fetch_and_loop();
    nhk_loop();
})();
