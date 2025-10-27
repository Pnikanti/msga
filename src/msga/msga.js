/// <reference types="vite/client" />
const STATE_MAP = new WeakMap();
let popstateInitialized = false;
let CURRENT_COMPONENT = null;

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

	let NotFound = null;

	for (const r of routes) {
		if (r.route === "*" || r.route === "/404") {
			NotFound = r.component;
			continue;
		}

		const params = matchRoute(r.route, path);
		if (params !== null) {
			return createElement(r.component, { params });
		}
	}

	return NotFound
		? createElement(NotFound)
		: createElement("div", null, "404 Not Found");
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
	const component = {};

	STATE_MAP.set(component, { states: [], effects: [], stateIndex: 0, effectIndex: 0, isRendering: false, rerenderCount: 0, lastRenderTimestamp: 0});

	const rerender = () => {
		const state = STATE_MAP.get(component);
		const now = performance.now();

		if (now - state.lastRenderTimestamp > 1000)
			state.rerenderCount = 0;

		state.rerenderCount++;
		state.lastRenderTimestamp = now;

		if (state.rerenderCount > 50) {
			const message = `Too many rerenders / setState called during render in "${AppComponent.name}"`;
			console.error(message);
			showErrorNotification(message);
			return;
		}


		if (state.isRendering)
			return;

		state.stateIndex = 0;
		state.effectIndex = 0;

		state.isRendering = true;
		CURRENT_COMPONENT = component;

		container.innerHTML = "";
		container.appendChild(AppComponent());

		state.isRendering = false;
		CURRENT_COMPONENT = null;

		queueMicrotask(() => runEffects(state));
	};

	component.rerender = rerender;

	const mount = () => {
		if (!document.body) {
			requestAnimationFrame(mount);
			return;
		}

		const state = STATE_MAP.get(component);

		state.stateIndex = 0;
    	state.effectIndex = 0;  

		state.isRendering = true;
		CURRENT_COMPONENT = component;

		container.appendChild(AppComponent());
		document.body.appendChild(container);

		state.isRendering = false;
		CURRENT_COMPONENT = null;

		queueMicrotask(() => runEffects(state));
	};

	mount();
}

export function useState(initialValue) {
	const comp = CURRENT_COMPONENT;

	if (!comp) {
		const message = "useState must be called inside a component"
		console.error(message);
		showErrorNotification(message);
	}

	const data = STATE_MAP.get(comp);
	const idx = data.stateIndex ?? 0;

	if (!data.states)
		data.states = [];
	if (data.states[idx] === undefined)
		data.states[idx] = initialValue;

	let value = data.states[idx];

	const setValue = (newValue) => {
		if (data.isRendering) {
			const message = "Can't setState during render. Move call to useEffect, event handler or async callback."
			console.error(message);
			showErrorNotification(message);
		}

		value = newValue;
		data.states[idx] = newValue;
		comp.rerender();
	};

	data.stateIndex = idx + 1;

	return [value, setValue];
}

export function useEffect(callback, deps) {
	const comp = CURRENT_COMPONENT;

	if (!comp) {
		const message = "useEffect must be called inside a component";
		console.error(message);
		showErrorNotification(message);
	}
	const data = STATE_MAP.get(comp);
	const idx = data.effectIndex ?? 0;

	if (!data.effects)
		data.effects = [];

	const prev = data.effects[idx];

	let changed = true;

	if (prev) {
		if (!deps)
			changed = true;
		else
			changed = deps.some((d, i) => d !== prev.deps?.[i]);
	}

	data.effects[idx] = {
		callback,
		deps: deps ?? null,
		cleanup: prev?.cleanup,
		run: !prev || changed,
	}

	data.effectIndex = idx + 1;
}


function runEffects(state) {
	if (!state.effects)
		return;

	state.effects.forEach((eff) => {
		if (!eff.run)
			return;

		if (eff.cleanup)
			eff.cleanup();

		const result = eff.callback();

		if (typeof result === "function")
			eff.cleanup = result;

		eff.run = false;
	});
}

function showErrorNotification(message) {
	let container = document.getElementById("error-overlay");

	if (!container) {
		container = document.createElement("div");
		container.id = "error-overlay";
		Object.assign(container.style, {
			position: "fixed",
			top: "10px",
			left: "50%",
			transform: "translateX(-50%)",
			backgroundColor: "rgba(255,0,0,0.9)",
			color: "white",
			padding: "12px 20px",
			borderRadius: "6px",
			zIndex: 9999,
			fontFamily: "sans-serif",
			fontSize: "14px",
			maxWidth: "90%",
			boxShadow: "0 0 10px rgba(0,0,0,0.5)",
		});
		document.body.appendChild(container);
	}

	container.textContent = message;
}

window.addEventListener("error", (event) => {
	const msg = `Runtime error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
	console.error(msg, event.error);
	showErrorNotification(msg);
});

window.addEventListener("unhandledrejection", (event) => {
	const msg = `Unhandled promise rejection: ${event.reason}`;
	console.error(msg, event.reason);
	showErrorNotification(msg);
});

window.createElement = createElement;
window.Fragment = Fragment;

// window.msga = { createElement, Fragment };