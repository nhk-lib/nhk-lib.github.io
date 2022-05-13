/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="dom" />

import {
  not_loading, loading,
  div, append_child, empty,
  fragment, next_loop_ms,
  set_attribute
} from "../../src/DOM.ts";

interface Quarry_Client_JSON_Response {
  error:      boolean,
  updated_at: number,
  msg:        string,
  data:       Quarry_Client[]
} // interface

interface Quarry_Client {
  mac:      string,
  ip:       string,
  hostname: string,
  nickname: string,
  ignored:  boolean
} // interface

interface Movement {
  date: string,
  client: Quarry_Client
}


let MAIN_DIV = '#quarry';

const IN_HOUSE: Record<string, Movement> = {};
let CURRENT_HOUSE: Record<string, Movement> = {};
const OUT_HOUSE: Record<string, Movement> = {};

function date() {
  return (new Date()).toLocaleString();
}

function first_seen(c: Quarry_Client): string {
  delete OUT_HOUSE[c.ip];
  if (!(c.ip in IN_HOUSE)) {
    IN_HOUSE[c.ip] = {date: date(), client: c};
  }
  return IN_HOUSE[c.ip].date;
}

function now_gone(c: Quarry_Client): string {
  delete IN_HOUSE[c.ip];
  const now = date();
  OUT_HOUSE[c.ip] = {date: now, client: c};
  console.log(`Left: ${c.nickname} (${c.ip}) @ ${now}`);
  return OUT_HOUSE[c.ip].date;
}

function title(ip: string): string {
  if (ip in IN_HOUSE)
    return `entered: ${IN_HOUSE[ip].date}`;
  return 'unknown';
}

function loop_ms(): number {
  const x = new Date();
  const hours = x.getHours();

  if (hours > 12 + 1)
    return next_loop_ms(1);

  if (hours > 3 && hours < 10)
    return next_loop_ms(5);

  if (hours > 0 && hours < 4)
    return next_loop_ms(10);

  return next_loop_ms(5);
}

export const Quarry_DOM = {
  initialize(main: string = '#quarry'): void {
    MAIN_DIV = main;
    Quarry_DOM.fetch();
  },

  update: {
    clients: function (clients : Quarry_Client[]) {
      const f = document.createDocumentFragment();

      CURRENT_HOUSE = clients.reduce((p, c) => {
        p[c.ip] = {date: date(), client: c};
        return p;
      } , {} as Record<string, Movement>);

      // Find out which ips are now gone:
      for (const [in_ip, mov] of Object.entries(IN_HOUSE)) {
        if (!(in_ip in CURRENT_HOUSE))
          now_gone(mov.client);
      } // for

      // Finish creating document fragment:
      for (const client of clients) {
        first_seen(client);
        if (client.ignored) { continue; }
        const nickname = client.nickname === "Unknown" ? `${client.hostname}/${client.ip}` : client.nickname;
        f.appendChild(
          div('.client', {'title': title(client.ip)}, nickname)
        );
      } // for

      empty(MAIN_DIV);
      append_child(MAIN_DIV, f);
      set_attribute(MAIN_DIV, 'title', `updated: ${date()}`);
      return true;
    } // function
  },

  async fetch() {
    loading(MAIN_DIV);
    return fetch("https://www.miniuni.com/quarry/clients")
    .then((resp : Response) => {
      not_loading(MAIN_DIV);
      setTimeout(Quarry_DOM.fetch, loop_ms());
      if (resp.status !== 200) {
        console.log(`ERROR: ${resp.status}`);
        throw new Error(`Failed to get quarry clients: ${resp.status}`);
      }
      return (resp.json());
    })
    .then((x : Quarry_Client_JSON_Response) => {
      if (typeof x === 'object' && x.error === false) {
        Quarry_DOM.update.clients(x.data);
      } else {
        console.log("Error in getting quarry info: ");
        console.log(x);
      }
    })
    .catch((x) => {
      not_loading(MAIN_DIV);
      empty(MAIN_DIV);
      setTimeout(Quarry_DOM.fetch, 10000);
      console.log(x);
    });
  }
} // const Quarry


