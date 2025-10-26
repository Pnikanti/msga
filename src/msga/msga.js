/// <reference types="vite/client" />

const STATE_MAP = new WeakMap();
let popstateInitialized = false;

export function matchRoute(routePattern, currentPath) {
	const routeParts = routePattern.split("/").filter(Boolean);
	const pathParts = currentPath.split("/").filter(Boolean);

	if (routeParts.length !== pathParts.length)
		return null;

	const params = {};

	for (let i = 0; i < routeParts.length; i++) {
		const r = routeParts[i];
		const p = pathParts[i];

		if (r.startsWith(":"))
			params[r.slice(1)] = p;
		else if (r !== p)
			return null;
	}
	return params;
}


export function Router({ routes }) {
	const [path, setPath] = useState(window.location.pathname);

	if (!popstateInitialized) {
		window.addEventListener("popstate", () => setPath(window.location.pathname));
		popstateInitialized = true;
	}

	for (const r of routes) {
		const params = matchRoute(r.route, path);

		if (params !== null) {
			return createElement(r.component, { params });
		}
	}

	return createElement("div", null, "404 Not Found");
}

export function navigate(to) {
	window.history.pushState({}, "", to);
	window.dispatchEvent(new Event("popstate"));
}


/** @jsx createElement */
function createElement(tag, props = {}, ...children) {
	props = props || {}

	if (typeof tag === "function")
		return tag({ ...props, children });

	const el = document.createElement(tag);

	for (const [key, value] of Object.entries(props)) {
		if (key.startsWith("on") && typeof value === "function")
			el.addEventListener(key.slice(2).toLowerCase(), value);
		else if (key === "class" || key === "className")
			el.setAttribute("class", value);
		else if (key === "style")
			Object.assign(el.style, value);
		else
			el.setAttribute(key, value);
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
			component.stateIndex = 0;
			container.innerHTML = "";
			container.appendChild(AppComponent());
		}
	};

	STATE_MAP.currentComponent = component;

	const mount = () => {
		if (!document.body) {
			requestAnimationFrame(mount);
			return;
		}
		container.appendChild(AppComponent());
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

	return [value, setValue];
}

window.createElement = createElement;
window.Fragment = Fragment;