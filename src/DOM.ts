/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="dom" />

type Attrs = Record<string, string> | string;
// type Element_Body = HTMLElement | string;

export const ATTR_STRING = /^[\#\.]{1}[\.\#a-z\_\-0-9]+$/;

/*
  * Returns the number of milliseconds until the next
  * minute:
  *   5:43 PM -> 60 - 43 * 1000
  */
export function next_loop_ms(mins : number) {
  const dt   = new Date();
  const now  = dt.getTime();
  const secs = (((mins - (dt.getMinutes() % mins)) * 60) - dt.getSeconds()) + 1;

  return secs * 1000;
} // export function

export function fragment(x: HTMLElement | HTMLElement[]) {
  const f = document.createDocumentFragment();
  if (typeof x === "object" && x.constructor.name === "Array") {
    for (const e of x as HTMLElement[])
      f.appendChild(e);
  } else {
    f.appendChild(x as HTMLElement);
  }
  return f;
} // export function

export function img(alt : string, src : string) {
  const i = document.createElement("img");
  i.setAttribute("alt", alt);
  i.setAttribute("src", src);
  return i;
} // export function

export function inner_text(q: string, txt : string): Node[] {
  const nodes = empty(q);
  for (const n of nodes) {
    n.appendChild(document.createTextNode(txt));
  }
  return nodes;
} // export function

// export function crup<T>(x: T, u: (x: T) => boolean, c: (x: T) => boolean) {
//   return u(x) || c(x);
// } // export function

export function append_child(query: string, x : DocumentFragment | HTMLElement): Node[] {
  const nodes = Array.from(document.querySelectorAll(query));
  for (const t of nodes) {
    t.appendChild(x);
  }
  return nodes;
} // export function

export function empty(q: string): Node[] {
  const nodes = Array.from(document.querySelectorAll(q));
  for (const n of nodes)
    while(n.firstChild) {
      n.removeChild(n.firstChild);
    }
  return nodes;
} // export function

export function div(...args: Array<Attrs | Node | Node[]>) { // attrs: Attrs = '', body: Element_Body = '') {
  return new_tag('div', ...args);
} // export functionn

export function a(...args: Array<Attrs | Node | Node[]>) { // attrs: Attrs = '', body: Element_Body = '') {
  return new_tag('a', ...args);
} // export functionn

export function set_attribute(q: string, a_name: string, val: string): Node[] {
  const nodes = Array.from(document.querySelectorAll(q));
  for (const n of nodes)
    n.setAttribute(a_name, val);
  return nodes;
}

export function new_tag(tag_name: string, ...args: Array<Attrs | Node | Node[]>): HTMLElement {
  let e = document.createElement(tag_name);
  for (const x of args) {
    if (is_attrs(x)) {
      set_attrs(e, x);
      continue;
    }

    if (Array.isArray(x)) {
      for (const child of x as HTMLElement[])
        e.appendChild(child);
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
  } // for

  return e;
} // export function

export function is_attrs(x: any): x is Attrs {
  if (typeof x === 'string' && x.match(ATTR_STRING))
    return true;
  if (!x)
    return false
  return typeof x === 'object' && x.constructor.name === 'Object';
} // export function

export function set_attrs(e: HTMLElement, x: Attrs) {
  for (const [k,v] of Object.entries((typeof x === 'string') ? split_attributes(x) : x)) {
    switch (k) {
      case 'href': {
        e.setAttribute(k, clean_url(v));
      }
      default: {
        e.setAttribute(k, v);
      }
    } // switch
  } // for
  return e;
} // export function


function split_attributes(str: string): Record<string, string> {
  const new_attr: Record<string, string> = {};
  let classes: Array<string>             = [];
  const pieces                           = str.split(".");

  for (const raw_y of pieces) {
    const y = raw_y.trim();
    if (y.length === 0)
      continue;

    if (y.indexOf("#") === -1) {
      classes.push(y.trim());
      continue;
    }

    if (y.length < 2) {
      continue
    }

    const id = y.split("#")[1];
    if (id)
      new_attr["id"] = id.trim();
  }; // for

  let classes_str: string = classes.join(" ").trim();
  if (classes_str.length > 0) {
    new_attr["class"] = classes_str;
  }
  return new_attr;
} // function

export function loading(q: string): Node[] {
  const nodes = Array.from(document.querySelectorAll(q));
  for (const e of nodes)
    e.classList.add('loading');
  return nodes;
} // export function

export function not_loading(q: string): Node[] {
  const nodes = Array.from(document.querySelectorAll(q));
  for (const e of nodes)
    e.classList.remove('loading');
  return nodes;
} // export function


export function clean_url(raw: string): string {
  const str = raw.trim();
  let u: null | URL = null;
  try {
    u = new URL(str);
  } catch (e) {
    const new_v = str
    .replaceAll(/[^a-z0-9\_\-\.\/]+/ig, '')
    .replaceAll(/\.+/g, '.')
    .replaceAll(/\/+/g, '/');
    if (new_v !== str)
      throw new Error(`Invalid href attribute: ${str}`);
    return new_v;
  }
  const protocol = u.protocol.trim().toLowerCase();
  switch (protocol) {
    case "http:":
    case "https:":
    case "ssh:":
    case "ftp:":
    case "sftp:":
    case "git:":
    case "magnet:":
    case "gopher:": {
      return u.toString();
    }
    default: {
      throw new Error(`Invalid href attribute protocol: ${str}`);
    }
  }
} // export function
