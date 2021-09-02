import { DA } from "../../www_modules/da/dist/src/DA.mjs";
(function () {
    const E = new DA.Event();
    const H = new DA.HTML(window);
    function img(alt, src) {
        return H.new_tag("img", { alt, src });
    }
    ;
    function start_loading() {
        add_class(document.body, "loading");
    }
    function done_loading() {
        remove_class(document.body, "loading");
    }
    function add_class(e, x) {
        e.classList.add(x);
        return e.className;
    }
    function remove_class(e, x) {
        e.classList.remove(x);
        return e.className;
    }
    class Quarry {
        static next_loop_ms() {
            const min_target = 1;
            const dt = new Date();
            const now = dt.getTime();
            const secs = (((min_target - (dt.getMinutes() % min_target)) * 60) - dt.getSeconds()) + 1;
            const new_ms = secs * 1000;
            const new_dt = new Date(now + new_ms);
            return new_ms;
        }
        static fetch() {
            const url = new URL(window.location.href);
            return fetch(url.origin + "/quarry/clients");
        }
    }
    class Media_Titles {
        static next_loop_ms() {
            const dt = new Date();
            const now = dt.getTime();
            const secs = (((5 - (dt.getMinutes() % 5)) * 60) - dt.getSeconds()) + 2;
            const new_ms = secs * 1000;
            const new_dt = new Date(now + new_ms);
            return new_ms;
        }
        static fetch() {
            return fetch("https://objects.diegoalban.com/shoutcast.json");
        }
    }
    document.body.appendChild(H.fragment());
    console.log("Starting fetch loop.");
    E.on("media title rendering", (args) => {
        const div = document.querySelector("div.loading");
        if (div) {
            div.remove();
            const h = new DA.HTML(window);
            h.div("#updated_at", (new Date()).toString());
            document.body.appendChild(h.fragment());
        }
        else {
            const ua = document.getElementById("updated_at");
            if (ua) {
                ua.innerText = (new Date()).toString();
            }
        }
        return div;
    });
    E.on("media title error", (x) => {
        console.log(x);
    });
    E.on("render media titles", function (json) {
        json.forEach((x) => {
            E.emit("render shoutcast station", x);
        });
    });
    E.on("render nhk show", (x) => {
        const id = `nhk_${x.ends_at}`;
        const e = document.getElementById(id);
        if (e || (x.ends_at <= Date.now())) {
            return;
        }
        const h = new DA.HTML(window);
        let _id = [
            `#${id}.nhk_show`,
            (x.is_recordable ? ".recordable" : ".not_recordable"),
            (x.is_recording ? ".recording" : ".not_recording")
        ].join(" ");
        h.div(_id, { title: (x.is_recordable ? x.what_to_record.toString() : "regular") }, () => {
            h.div(".title", () => {
                if (x.href) {
                    h.a({ href: x.href }, x.title);
                }
                else {
                    h.target().appendChild(h.text_node(x.title));
                }
                if (x.title != "NHK NEWSLINE" && x.thumbnail_small) {
                    h.new_tag("img", { alt: `preview of ${x.title}`, src: x.thumbnail_small });
                }
            });
            h.div(".description", x.description);
        });
        append_child("nhk", h.fragment());
        setTimeout(() => { document.querySelectorAll(`#${id}`).forEach((x) => x.remove()); }, x.ends_at - Date.now());
    });
    E.on("render shoutcast station", (x) => {
        const id = `shoutchast_${x.filename}`;
        const e = document.getElementById(id);
        if (e) {
            update_innerText(e.querySelector("div.current_title"), x.current_title);
        }
        else {
            const h = new DA.HTML(window);
            h.div(`#${id}.shoutcast`, () => {
                h.div(".title", () => {
                    h.a({ href: x.stream_url }, x.title);
                });
                h.div(".current_title", x.current_title);
            });
            append_child("shoutcast", h.fragment());
        }
    });
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
        start_loading();
        return Quarry
            .fetch()
            .then((resp) => {
            done_loading();
            setTimeout(quarry_fetch_and_loop, Quarry.next_loop_ms());
            if (resp.status !== 200) {
                console.log(`ERROR: ${resp.status}`);
                return null;
            }
            return (resp.json());
        })
            .then((x) => {
            if (x && x.error === false) {
                E.emit("render quarry clients", x);
            }
            else {
                console.log("Error in getting quarry info: ");
                console.log(x);
            }
        })
            .catch((x) => {
            done_loading();
            clear_quarry();
            setTimeout(quarry_fetch_and_loop, 10000);
            console.log(x);
        });
    }
    function media_title_fetch_and_loop() {
        start_loading();
        return Media_Titles
            .fetch()
            .then((resp) => {
            done_loading();
            setTimeout(media_title_fetch_and_loop, Media_Titles.next_loop_ms());
            if (resp.status !== 200) {
                console.log(`ERROR: ${resp.status}`);
                return null;
            }
            return (resp.json());
        })
            .then((x) => {
            if (x) {
                E.emit("render media titles", x);
            }
        })
            .catch((x) => {
            done_loading();
            setTimeout(media_title_fetch_and_loop, Media_Titles.next_loop_ms());
            console.log(x);
        });
    }
    function clear_quarry() {
        const quarry = document.getElementById("quarry");
        if (quarry) {
            while (quarry.firstChild) {
                quarry.removeChild(quarry.firstChild);
            }
        }
    }
    function hostname_inspection_loop() {
        start_loading();
        fetch("https://objects.diegoalban.com/inspection.json")
            .then((resp) => {
            done_loading();
            setTimeout(hostname_inspection_loop, Quarry.next_loop_ms());
            if (resp.status === 200) {
                return resp.json();
            }
            else {
                console.log(resp);
                throw (new Error("Hostname inspection retrieval failed."));
            }
        })
            .then((x) => {
            if (x.is_success) {
                document.body.classList.add("hostname_inspection_success");
                remove_class(document.body, "hostname_inspection_error");
            }
            else {
                document.body.classList.add("hostname_inspection_error");
                remove_class(document.body, "hostname_inspection_success");
            }
        })
            .catch((x) => {
            done_loading();
            console.log(x);
            remove_class(document.body, "hostname_inspection_success");
            remove_class(document.body, "hostname_inspection_error");
            setTimeout(hostname_inspection_loop, 10000);
        });
    }
    function nhk_loop() {
        start_loading();
        fetch("https://objects.diegoalban.com/nhk.json")
            .then((resp) => {
            done_loading();
            if (resp.status === 200) {
                return resp.json();
            }
            else {
                console.log(resp);
                throw (new Error("NHK Failed"));
            }
        })
            .then((x) => {
            x.forEach((show) => {
                E.emit("render nhk show", show);
            });
            const show = x[0];
            if (!show) {
                throw (new Error("No shows retrieved."));
            }
            else {
                const date_now = Date.now();
                if (show.ends_at < date_now) {
                    setTimeout(nhk_loop, 5000);
                }
                else {
                    const next_time = Math.floor(show.ends_at - date_now);
                    setTimeout(nhk_loop, next_time + 1000);
                }
            }
        })
            .catch((x) => {
            done_loading();
            console.log(x);
            setTimeout(nhk_loop, 10000);
        });
    }
    E.on("render quarry clients", function (x) {
        clear_quarry();
        if (x) {
            x.data.forEach((client) => {
                if (client.ignored)
                    return;
                const h = new DA.HTML(window);
                const nickname = client.nickname === "Unknown" ? `${client.hostname}/${client.ip}` : client.nickname;
                h.div(`.client`, { "data-client": client.nickname }, nickname);
                append_child("quarry", h.fragment());
            });
        }
    });
    quarry_fetch_and_loop();
})();
