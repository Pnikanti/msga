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
		effects: [],
		stateIndex: 0,
		effectIndex: 0,
		rerenderCount: 0,
		rerender: () => {
			component.rerender++;
			if (component.rerenderCount > 50) {
				throw new Error(
					`Too many rerenders in component "${AppComponent.name}".
				Check for useState or useEffect updating state unconditionally.`
				);
			}
			console.log("Rerender..");
			component.stateIndex = 0;
			component.effectIndex = 0;
			STATE_MAP.currentComponent = component;

			container.innerHTML = "";
			container.appendChild(AppComponent());

			// Run effects after DOM is updated
			queueMicrotask(() => {
				component.rerenderCount = 0;
				runEffects(component)
			});
		},
	};

	STATE_MAP.currentComponent = component;

	const mount = () => {
		if (!document.body) {
			requestAnimationFrame(mount);
			return;
		}

		container.appendChild(AppComponent());
		document.body.appendChild(container);

		// Run initial effects
		queueMicrotask(() => runEffects(component));
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
		console.log({newValue})
		value = newValue;
		comp.states[idx] = newValue;
		comp.rerender();
	};

	comp.stateIndex = idx + 1;

	return [value, setValue];
}

export function useEffect(callback, deps) {
	const comp = STATE_MAP.currentComponent;
	if (!comp) throw new Error("useEffect must be called inside a component");

	const idx = comp.effectIndex ?? 0;
	if (!comp.effects) comp.effects = [];

	const prev = comp.effects[idx];
	let changed = true;

	// Compare deps if available
	if (prev) {
		if (!deps) changed = true;          // no deps → run every time
		else changed = deps.some((d, i) => d !== prev.deps?.[i]);
	}

	// Always store callback + deps
	comp.effects[idx] = { callback, deps, cleanup: prev?.cleanup };

	comp.effectIndex = idx + 1;

	if (!prev || changed) {
		// Mark effect to run after render
		comp.effects[idx].run = true;
	}
}

function runEffects(comp) {
	if (!comp.effects) return;

	comp.effects.forEach((eff) => {
		if (!eff.run) return;

		// cleanup previous effect
		if (eff.cleanup) eff.cleanup();

		const result = eff.callback();
		if (typeof result === "function") eff.cleanup = result;

		eff.run = false; // mark as done
	});
}


window.createElement = createElement;
window.Fragment = Fragment;