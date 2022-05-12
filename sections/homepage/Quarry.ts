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


let MAIN_DIV = '#quarry';

const FIRST_SEEN_IP: Record<string, string> = {};
const LAST_SEEN_IP: Record<string, string> = {};

function date() {
  return (new Date()).toString().split(' ').slice(0,5).join(' ');
}

function first_seen(c: Quarry_Client): string {
  delete LAST_SEEN_IP[c.ip];
  if (!(c.ip in FIRST_SEEN_IP)) {
    FIRST_SEEN_IP[c.ip] = date();
  }
  return FIRST_SEEN_IP[c.ip];
}

function last_seen(ip: string) {
  delete FIRST_SEEN_IP[ip];
  LAST_SEEN_IP[ip] = date();
  console.log(`Left: ${ip} ${date()}`);
  return LAST_SEEN_IP[ip];
}

function title(ip: string): string {
  if (ip in FIRST_SEEN_IP)
    return `entered: ${FIRST_SEEN_IP[ip]}`;
  if (ip in LAST_SEEN_IP)
    return `left: ${LAST_SEEN_IP[ip]}`;
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

      const ips = Object.keys(FIRST_SEEN_IP);
      for (const [ip, __string] of Object.entries(FIRST_SEEN_IP)) {
        if (!ips.includes(ip))
          last_seen(ip);
      }

      for (const client of clients) {
        first_seen(client);
        if (client.ignored) { continue; }
        const nickname = client.nickname === "Unknown" ? `${client.hostname}/${client.ip}` : client.nickname;
        f.appendChild(
          div('.client', {'title': title(client.ip)}, nickname)
        );
      };

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


