const STATE_MAP = new WeakMap();

/** @jsx createElement */
function createElement(tag, props = {}, ...children) {
  props = props || {}

  if (typeof tag === "function")
    return tag({ ...props, children });

  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } 
    else if (key === "class" || key === "className") {
      el.setAttribute("class", value);
    }
    else if (key === "style") {
      Object.assign(el.style, value);
    } 
    else {
      el.setAttribute(key, value);
    }
  }

  children.flat().forEach(child => {
    if (child == null) return;
    el.appendChild(child instanceof Node ? child : document.createTextNode(child));
  });

  return el;
}

/** @jsx Fragment */
const Fragment = (props) => props.children;

export function createApp(AppComponent) {
  const container = document.createElement("div");

  const component = {
    states: [],
    stateIndex: 0,
    rerender: () => {
      component.stateIndex = 0;   // reset state index for next render
      container.innerHTML = "";    // clear old DOM
      container.appendChild(AppComponent()); // re-run JSX function
    }
  };

  // make current component accessible to useState
  STATE_MAP.currentComponent = component;

  const mount = () => {
    if (!document.body) {
      requestAnimationFrame(mount);
      return;
    }
    container.appendChild(AppComponent()); // initial render
    document.body.appendChild(container);
  };

  mount();
}

export function useState(initialValue) {
  const comp = STATE_MAP.currentComponent;
  if (!comp) throw new Error("useState must be called inside a component");

  const idx = comp.stateIndex ?? 0;

  if (!comp.states) comp.states = [];
  if (comp.states[idx] === undefined) comp.states[idx] = initialValue;

  let value = comp.states[idx];

  const setValue = (newValue) => {
    value = newValue;
    comp.states[idx] = newValue;
    comp.rerender();
  };

  comp.stateIndex = idx + 1;

  return [value, setValue]; // normal variable
}

// TODO: NOT TESTED CLASSES NOT WORKING ATLEAST
// export function createStatic(tag, props = {}, ...children) {
//   if (typeof tag === "function")
//     return renderToString(tag({ ...props, children }));

//   const attrs = Object.entries(props)
//     .map(([k, v]) => {

//       if (k.startsWith("on"))
//         return "";

//       if (k === "style") {
//         const styleStr = Object.entries(v).map(([k, v]) => `${k}:${v}`).join(";");
//         return ` style="${styleStr}"`;
//       }

//       return ` ${k}="${v}"`;
//     })
//     .join("");

//   const content = children.flat().map(c => (typeof c === "string" ? c : renderToString(c))).join("");
//   return `<${tag}${attrs}>${content}</${tag}>`;
// }

window.createElement = createElement;
window.Fragment = Fragment;