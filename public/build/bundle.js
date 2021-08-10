
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var Filter;
    (function (Filter) {
        Filter["ALL"] = "all";
        Filter["ACTIVE"] = "active";
        Filter["COMPLETED"] = "completed";
    })(Filter || (Filter = {}));

    /* src\components\FilterButton.svelte generated by Svelte v3.37.0 */
    const file$7 = "src\\components\\FilterButton.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let button0;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let button0_aria_pressed_value;
    	let t5;
    	let button1;
    	let span3;
    	let t7;
    	let span4;
    	let t9;
    	let span5;
    	let button1_aria_pressed_value;
    	let t11;
    	let button2;
    	let span6;
    	let t13;
    	let span7;
    	let t15;
    	let span8;
    	let button2_aria_pressed_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			span0 = element("span");
    			span0.textContent = "Show";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "All";
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "tasks";
    			t5 = space();
    			button1 = element("button");
    			span3 = element("span");
    			span3.textContent = "Show";
    			t7 = space();
    			span4 = element("span");
    			span4.textContent = "Active";
    			t9 = space();
    			span5 = element("span");
    			span5.textContent = "tasks";
    			t11 = space();
    			button2 = element("button");
    			span6 = element("span");
    			span6.textContent = "Show";
    			t13 = space();
    			span7 = element("span");
    			span7.textContent = "Completed";
    			t15 = space();
    			span8 = element("span");
    			span8.textContent = "tasks";
    			attr_dev(span0, "class", "visually-hidden");
    			add_location(span0, file$7, 6, 6, 325);
    			add_location(span1, file$7, 7, 6, 374);
    			attr_dev(span2, "class", "visually-hidden");
    			add_location(span2, file$7, 8, 6, 398);
    			attr_dev(button0, "class", "btn toggle-btn");
    			attr_dev(button0, "aria-pressed", button0_aria_pressed_value = /*filter*/ ctx[0] === Filter.ALL);
    			toggle_class(button0, "btn__primary", /*filter*/ ctx[0] === Filter.ALL);
    			add_location(button0, file$7, 5, 4, 169);
    			attr_dev(span3, "class", "visually-hidden");
    			add_location(span3, file$7, 11, 6, 626);
    			add_location(span4, file$7, 12, 6, 675);
    			attr_dev(span5, "class", "visually-hidden");
    			add_location(span5, file$7, 13, 6, 702);
    			attr_dev(button1, "class", "btn toggle-btn");
    			attr_dev(button1, "aria-pressed", button1_aria_pressed_value = /*filter*/ ctx[0] === Filter.ACTIVE);
    			toggle_class(button1, "btn__primary", /*filter*/ ctx[0] === Filter.ACTIVE);
    			add_location(button1, file$7, 10, 4, 461);
    			attr_dev(span6, "class", "visually-hidden");
    			add_location(span6, file$7, 16, 6, 939);
    			add_location(span7, file$7, 17, 6, 988);
    			attr_dev(span8, "class", "visually-hidden");
    			add_location(span8, file$7, 18, 6, 1018);
    			attr_dev(button2, "class", "btn toggle-btn");
    			attr_dev(button2, "aria-pressed", button2_aria_pressed_value = /*filter*/ ctx[0] === Filter.COMPLETED);
    			toggle_class(button2, "btn__primary", /*filter*/ ctx[0] === Filter.COMPLETED);
    			add_location(button2, file$7, 15, 4, 765);
    			attr_dev(div, "class", "filters btn-group stack-exception");
    			add_location(div, file$7, 4, 2, 116);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, span0);
    			append_dev(button0, t1);
    			append_dev(button0, span1);
    			append_dev(button0, t3);
    			append_dev(button0, span2);
    			append_dev(div, t5);
    			append_dev(div, button1);
    			append_dev(button1, span3);
    			append_dev(button1, t7);
    			append_dev(button1, span4);
    			append_dev(button1, t9);
    			append_dev(button1, span5);
    			append_dev(div, t11);
    			append_dev(div, button2);
    			append_dev(button2, span6);
    			append_dev(button2, t13);
    			append_dev(button2, span7);
    			append_dev(button2, t15);
    			append_dev(button2, span8);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*filter*/ 1 && button0_aria_pressed_value !== (button0_aria_pressed_value = /*filter*/ ctx[0] === Filter.ALL)) {
    				attr_dev(button0, "aria-pressed", button0_aria_pressed_value);
    			}

    			if (dirty & /*filter, Filter*/ 1) {
    				toggle_class(button0, "btn__primary", /*filter*/ ctx[0] === Filter.ALL);
    			}

    			if (dirty & /*filter*/ 1 && button1_aria_pressed_value !== (button1_aria_pressed_value = /*filter*/ ctx[0] === Filter.ACTIVE)) {
    				attr_dev(button1, "aria-pressed", button1_aria_pressed_value);
    			}

    			if (dirty & /*filter, Filter*/ 1) {
    				toggle_class(button1, "btn__primary", /*filter*/ ctx[0] === Filter.ACTIVE);
    			}

    			if (dirty & /*filter*/ 1 && button2_aria_pressed_value !== (button2_aria_pressed_value = /*filter*/ ctx[0] === Filter.COMPLETED)) {
    				attr_dev(button2, "aria-pressed", button2_aria_pressed_value);
    			}

    			if (dirty & /*filter, Filter*/ 1) {
    				toggle_class(button2, "btn__primary", /*filter*/ ctx[0] === Filter.COMPLETED);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FilterButton", slots, []);
    	let { filter = Filter.ALL } = $$props;
    	const writable_props = ["filter"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FilterButton> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, filter = Filter.ALL);
    	const click_handler_1 = () => $$invalidate(0, filter = Filter.ACTIVE);
    	const click_handler_2 = () => $$invalidate(0, filter = Filter.COMPLETED);

    	$$self.$$set = $$props => {
    		if ("filter" in $$props) $$invalidate(0, filter = $$props.filter);
    	};

    	$$self.$capture_state = () => ({ Filter, filter });

    	$$self.$inject_state = $$props => {
    		if ("filter" in $$props) $$invalidate(0, filter = $$props.filter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [filter, click_handler, click_handler_1, click_handler_2];
    }

    class FilterButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { filter: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FilterButton",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get filter() {
    		throw new Error("<FilterButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filter(value) {
    		throw new Error("<FilterButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function selectOnFocus(node) {
        if (node && typeof node.select === 'function') { // make sure node is defined and has a select() method
            const onFocus = event => node.select(); // event handler
            node.addEventListener('focus', onFocus); // when node gets focus call onFocus()
            return {
                destroy: () => node.removeEventListener('focus', onFocus) // this will be executed when the node is removed from the DOM
            };
        }
    }
    function focusOnInit(node) {
        if (node && typeof node.focus === 'function') {
            node.focus();
        }
    }

    /* src\components\Todo.svelte generated by Svelte v3.37.0 */

    const { Object: Object_1$1, console: console_1$3 } = globals;
    const file$6 = "src\\components\\Todo.svelte";

    // (66:4) {:else}
    function create_else_block$1(ctx) {
    	let div0;
    	let input;
    	let input_id_value;
    	let input_checked_value;
    	let t0;
    	let label;
    	let t1_value = /*todo*/ ctx[0].title + "";
    	let t1;
    	let label_for_value;
    	let t2;
    	let div1;
    	let button0;
    	let t3;
    	let span0;
    	let t4_value = /*todo*/ ctx[0].title + "";
    	let t4;
    	let t5;
    	let button1;
    	let t6;
    	let span1;
    	let t7_value = /*todo*/ ctx[0].title + "";
    	let t7;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			button0 = element("button");
    			t3 = text("Edit");
    			span0 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			button1 = element("button");
    			t6 = text("Delete");
    			span1 = element("span");
    			t7 = text(t7_value);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", input_id_value = "todo-" + /*todo*/ ctx[0].id);
    			input.checked = input_checked_value = /*todo*/ ctx[0].isComplete;
    			add_location(input, file$6, 68, 8, 3399);
    			attr_dev(label, "for", label_for_value = "todo-" + /*todo*/ ctx[0].id);
    			attr_dev(label, "class", "todo-label");
    			add_location(label, file$6, 70, 8, 3510);
    			attr_dev(div0, "class", "c-cb");
    			add_location(div0, file$6, 67, 6, 3371);
    			attr_dev(span0, "class", "visually-hidden");
    			add_location(span0, file$6, 74, 14, 3720);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn");
    			add_location(button0, file$6, 73, 8, 3632);
    			attr_dev(span1, "class", "visually-hidden");
    			add_location(span1, file$6, 77, 16, 3883);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn__danger");
    			add_location(button1, file$6, 76, 8, 3799);
    			attr_dev(div1, "class", "btn-group");
    			add_location(div1, file$6, 72, 6, 3599);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, input);
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(label, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(button0, t3);
    			append_dev(button0, span0);
    			append_dev(span0, t4);
    			append_dev(div1, t5);
    			append_dev(div1, button1);
    			append_dev(button1, t6);
    			append_dev(button1, span1);
    			append_dev(span1, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "click", /*onToggle*/ ctx[7], false, false, false),
    					listen_dev(button0, "click", /*onEdit*/ ctx[6], false, false, false),
    					action_destroyer(/*focusEditButton*/ ctx[8].call(null, button0)),
    					listen_dev(button1, "click", /*onRemove*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*todo*/ 1 && input_id_value !== (input_id_value = "todo-" + /*todo*/ ctx[0].id)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*todo*/ 1 && input_checked_value !== (input_checked_value = /*todo*/ ctx[0].isComplete)) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty & /*todo*/ 1 && t1_value !== (t1_value = /*todo*/ ctx[0].title + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*todo*/ 1 && label_for_value !== (label_for_value = "todo-" + /*todo*/ ctx[0].id)) {
    				attr_dev(label, "for", label_for_value);
    			}

    			if (dirty & /*todo*/ 1 && t4_value !== (t4_value = /*todo*/ ctx[0].title + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*todo*/ 1 && t7_value !== (t7_value = /*todo*/ ctx[0].title + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(66:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (50:4) {#if editing}
    function create_if_block$2(ctx) {
    	let form;
    	let div0;
    	let label;
    	let t0;
    	let t1_value = /*todo*/ ctx[0].title + "";
    	let t1;
    	let t2;
    	let label_for_value;
    	let t3;
    	let input;
    	let input_id_value;
    	let t4;
    	let div1;
    	let button0;
    	let t5;
    	let span0;
    	let t6;
    	let t7_value = /*todo*/ ctx[0].title + "";
    	let t7;
    	let t8;
    	let button1;
    	let t9;
    	let span1;
    	let t10;
    	let t11_value = /*todo*/ ctx[0].title + "";
    	let t11;
    	let button1_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			div0 = element("div");
    			label = element("label");
    			t0 = text("New name for '");
    			t1 = text(t1_value);
    			t2 = text("'");
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			div1 = element("div");
    			button0 = element("button");
    			t5 = text("Cancel");
    			span0 = element("span");
    			t6 = text("renaming ");
    			t7 = text(t7_value);
    			t8 = space();
    			button1 = element("button");
    			t9 = text("Save");
    			span1 = element("span");
    			t10 = text("new name for ");
    			t11 = text(t11_value);
    			attr_dev(label, "for", label_for_value = "todo-" + /*todo*/ ctx[0].id);
    			attr_dev(label, "class", "todo-label");
    			add_location(label, file$6, 53, 10, 2596);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", input_id_value = "todo-" + /*todo*/ ctx[0].id);
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "class", "todo-text");
    			add_location(input, file$6, 54, 10, 2690);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file$6, 52, 8, 2560);
    			attr_dev(span0, "class", "visually-hidden");
    			add_location(span0, file$6, 58, 18, 2967);
    			attr_dev(button0, "class", "btn todo-cancel");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$6, 57, 10, 2881);
    			attr_dev(span1, "class", "visually-hidden");
    			add_location(span1, file$6, 61, 16, 3152);
    			attr_dev(button1, "class", "btn btn__primary todo-edit");
    			attr_dev(button1, "type", "submit");
    			button1.disabled = button1_disabled_value = !/*name*/ ctx[2];
    			add_location(button1, file$6, 60, 10, 3060);
    			attr_dev(div1, "class", "btn-group");
    			add_location(div1, file$6, 56, 8, 2846);
    			attr_dev(form, "class", "stack-small");
    			add_location(form, file$6, 51, 6, 2439);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div0);
    			append_dev(div0, label);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, t2);
    			append_dev(div0, t3);
    			append_dev(div0, input);
    			set_input_value(input, /*name*/ ctx[2]);
    			append_dev(form, t4);
    			append_dev(form, div1);
    			append_dev(div1, button0);
    			append_dev(button0, t5);
    			append_dev(button0, span0);
    			append_dev(span0, t6);
    			append_dev(span0, t7);
    			append_dev(div1, t8);
    			append_dev(div1, button1);
    			append_dev(button1, t9);
    			append_dev(button1, span1);
    			append_dev(span1, t10);
    			append_dev(span1, t11);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    					action_destroyer(selectOnFocus.call(null, input)),
    					action_destroyer(focusOnInit.call(null, input)),
    					listen_dev(button0, "click", /*onCancel*/ ctx[3], false, false, false),
    					listen_dev(form, "submit", prevent_default(/*onSave*/ ctx[4]), false, true, false),
    					listen_dev(form, "keydown", /*keydown_handler*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*todo*/ 1 && t1_value !== (t1_value = /*todo*/ ctx[0].title + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*todo*/ 1 && label_for_value !== (label_for_value = "todo-" + /*todo*/ ctx[0].id)) {
    				attr_dev(label, "for", label_for_value);
    			}

    			if (dirty & /*todo*/ 1 && input_id_value !== (input_id_value = "todo-" + /*todo*/ ctx[0].id)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*name*/ 4 && input.value !== /*name*/ ctx[2]) {
    				set_input_value(input, /*name*/ ctx[2]);
    			}

    			if (dirty & /*todo*/ 1 && t7_value !== (t7_value = /*todo*/ ctx[0].title + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*todo*/ 1 && t11_value !== (t11_value = /*todo*/ ctx[0].title + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*name*/ 4 && button1_disabled_value !== (button1_disabled_value = !/*name*/ ctx[2])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(50:4) {#if editing}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*editing*/ ctx[1]) return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "stack-small");
    			add_location(div, file$6, 48, 2, 2304);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Todo", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	
    	const dispatch = createEventDispatcher();
    	let { todo } = $$props;
    	console.log("into Todo.svelte : ", todo);
    	let editing = false; // track editing mode
    	let name = todo.title; // hold the name of the todo being edited
    	let editButtonPressed = false; // track if edit button has been pressed, to give focus to it after cancel or save

    	//    let nameEl                              // reference to the name input DOM node
    	function update(updatedTodo) {
    		$$invalidate(0, todo = Object.assign(Object.assign({}, todo), updatedTodo)); // applies modifications to todo
    		dispatch("update", todo); // emit update event
    	}

    	function onCancel() {
    		$$invalidate(2, name = todo.title); // restores name to its initial value and
    		$$invalidate(1, editing = false); // and exit editing mode
    	}

    	function onSave() {
    		update({ title: name }); // updates todo name
    		$$invalidate(1, editing = false); // and exit editing mode
    	}

    	function onRemove() {
    		dispatch("remove", todo); // emit remove event
    	}

    	function onEdit() {
    		return __awaiter(this, void 0, void 0, function* () {
    			editButtonPressed = true; // user pressed the Edit button, focus will come back to the Edit button
    			$$invalidate(1, editing = true); // enter editing mode
    		}); //       await tick()
    		//       nameEl.focus()                        // set focus to name input
    	}

    	function onToggle() {
    		update({ isComplete: !todo.isComplete }); // updates todo status
    	}

    	const focusEditButton = node => editButtonPressed && node.focus();
    	const writable_props = ["todo"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<Todo> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(2, name);
    	}

    	const keydown_handler = e => e.key === "Escape" && onCancel();

    	$$self.$$set = $$props => {
    		if ("todo" in $$props) $$invalidate(0, todo = $$props.todo);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		createEventDispatcher,
    		selectOnFocus,
    		focusOnInit,
    		dispatch,
    		todo,
    		editing,
    		name,
    		editButtonPressed,
    		update,
    		onCancel,
    		onSave,
    		onRemove,
    		onEdit,
    		onToggle,
    		focusEditButton
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("todo" in $$props) $$invalidate(0, todo = $$props.todo);
    		if ("editing" in $$props) $$invalidate(1, editing = $$props.editing);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    		if ("editButtonPressed" in $$props) editButtonPressed = $$props.editButtonPressed;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		todo,
    		editing,
    		name,
    		onCancel,
    		onSave,
    		onRemove,
    		onEdit,
    		onToggle,
    		focusEditButton,
    		input_input_handler,
    		keydown_handler
    	];
    }

    class Todo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { todo: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todo",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*todo*/ ctx[0] === undefined && !("todo" in props)) {
    			console_1$3.warn("<Todo> was created without expected prop 'todo'");
    		}
    	}

    	get todo() {
    		throw new Error("<Todo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todo(value) {
    		throw new Error("<Todo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\MoreActions.svelte generated by Svelte v3.37.0 */

    const { console: console_1$2 } = globals;
    const file$5 = "src\\components\\MoreActions.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let button0;
    	let t0_value = (/*completed*/ ctx[1] ? "Check" : "Uncheck") + "";
    	let t0;
    	let t1;
    	let button0_disabled_value;
    	let t2;
    	let button1;
    	let t3;
    	let button1_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			t0 = text(t0_value);
    			t1 = text(" all");
    			t2 = space();
    			button1 = element("button");
    			t3 = text("Remove completed");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn btn__primary");
    			button0.disabled = button0_disabled_value = /*todos*/ ctx[0].length === 0;
    			add_location(button0, file$5, 26, 2, 822);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn__primary");
    			button1.disabled = button1_disabled_value = /*completedTodos*/ ctx[2] === 0;
    			add_location(button1, file$5, 28, 2, 974);
    			attr_dev(div, "class", "btn-group");
    			add_location(div, file$5, 25, 0, 795);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, t0);
    			append_dev(button0, t1);
    			append_dev(div, t2);
    			append_dev(div, button1);
    			append_dev(button1, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*checkAll*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*removeCompleted*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*completed*/ 2 && t0_value !== (t0_value = (/*completed*/ ctx[1] ? "Check" : "Uncheck") + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*todos*/ 1 && button0_disabled_value !== (button0_disabled_value = /*todos*/ ctx[0].length === 0)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*completedTodos*/ 4 && button1_disabled_value !== (button1_disabled_value = /*completedTodos*/ ctx[2] === 0)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let completedTodos;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MoreActions", slots, []);
    	
    	const dispatch = createEventDispatcher();
    	let completed = true;
    	let { todos } = $$props;

    	const checkAll = () => {
    		dispatch("checkAll", completed);
    		$$invalidate(1, completed = !completed);
    		console.log("MoreActions, completed is : ", completed);
    	};

    	const removeCompleted = () => dispatch("removeCompleted");

    	afterUpdate(() => {
    		console.log("afterupdate");

    		if (completedTodos == todos.length) {
    			console.log("MoreActions, 2 completed is : ", completed);
    			$$invalidate(1, completed = false);
    		} else if (completedTodos == 0) {
    			$$invalidate(1, completed = true);
    		}
    	});

    	const writable_props = ["todos"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<MoreActions> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("todos" in $$props) $$invalidate(0, todos = $$props.todos);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		afterUpdate,
    		dispatch,
    		completed,
    		todos,
    		checkAll,
    		removeCompleted,
    		completedTodos
    	});

    	$$self.$inject_state = $$props => {
    		if ("completed" in $$props) $$invalidate(1, completed = $$props.completed);
    		if ("todos" in $$props) $$invalidate(0, todos = $$props.todos);
    		if ("completedTodos" in $$props) $$invalidate(2, completedTodos = $$props.completedTodos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*todos*/ 1) {
    			// note that the t: TodoType has to be in own brackets
    			$$invalidate(2, completedTodos = todos.filter(t => t.isComplete).length);
    		}
    	};

    	return [todos, completed, completedTodos, checkAll, removeCompleted];
    }

    class MoreActions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { todos: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MoreActions",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*todos*/ ctx[0] === undefined && !("todos" in props)) {
    			console_1$2.warn("<MoreActions> was created without expected prop 'todos'");
    		}
    	}

    	get todos() {
    		throw new Error("<MoreActions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todos(value) {
    		throw new Error("<MoreActions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\NewTodo.svelte generated by Svelte v3.37.0 */
    const file$4 = "src\\components\\NewTodo.svelte";

    function create_fragment$4(ctx) {
    	let form;
    	let h2;
    	let label;
    	let t1;
    	let input;
    	let t2;
    	let button;
    	let t3;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			h2 = element("h2");
    			label = element("label");
    			label.textContent = "What needs to be done?";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			t3 = text("Add");
    			attr_dev(label, "for", "todo-0");
    			attr_dev(label, "class", "label__lg");
    			add_location(label, file$4, 22, 6, 811);
    			attr_dev(h2, "class", "label-wrapper");
    			add_location(h2, file$4, 21, 4, 777);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "todo-0");
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "class", "input input__lg");
    			add_location(input, file$4, 24, 4, 896);
    			attr_dev(button, "type", "submit");
    			button.disabled = button_disabled_value = !/*name*/ ctx[0];
    			attr_dev(button, "class", "btn btn__primary btn__lg");
    			add_location(button, file$4, 25, 4, 1033);
    			add_location(form, file$4, 20, 2, 679);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, h2);
    			append_dev(h2, label);
    			append_dev(form, t1);
    			append_dev(form, input);
    			set_input_value(input, /*name*/ ctx[0]);
    			/*input_binding*/ ctx[6](input);
    			append_dev(form, t2);
    			append_dev(form, button);
    			append_dev(button, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					action_destroyer(selectOnFocus.call(null, input)),
    					listen_dev(form, "submit", prevent_default(/*addTodo*/ ctx[2]), false, true, false),
    					listen_dev(form, "keydown", /*keydown_handler*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1 && input.value !== /*name*/ ctx[0]) {
    				set_input_value(input, /*name*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 1 && button_disabled_value !== (button_disabled_value = !/*name*/ ctx[0])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			/*input_binding*/ ctx[6](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NewTodo", slots, []);
    	const dispatch = createEventDispatcher();
    	let { autofocus = false } = $$props;
    	let name = "";
    	let nameE1; // reference to the name input DOM node, could be "fred"

    	// if (autofocus) nameE1.focus()
    	const addTodo = () => {
    		dispatch("addTodo", name);
    		$$invalidate(0, name = "");
    		nameE1.focus(); // give focus to the name input
    	};

    	const onCancel = () => {
    		$$invalidate(0, name = "");
    		nameE1.focus(); // give focus to the name input
    	};

    	onMount(() => autofocus && nameE1.focus()); // if autofocus is true, we run nameE1.focus()
    	const writable_props = ["autofocus"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NewTodo> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			nameE1 = $$value;
    			$$invalidate(1, nameE1);
    		});
    	}

    	const keydown_handler = e => e.key === "Escape" && onCancel();

    	$$self.$$set = $$props => {
    		if ("autofocus" in $$props) $$invalidate(4, autofocus = $$props.autofocus);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		selectOnFocus,
    		dispatch,
    		autofocus,
    		name,
    		nameE1,
    		addTodo,
    		onCancel
    	});

    	$$self.$inject_state = $$props => {
    		if ("autofocus" in $$props) $$invalidate(4, autofocus = $$props.autofocus);
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("nameE1" in $$props) $$invalidate(1, nameE1 = $$props.nameE1);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		nameE1,
    		addTodo,
    		onCancel,
    		autofocus,
    		input_input_handler,
    		input_binding,
    		keydown_handler
    	];
    }

    class NewTodo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { autofocus: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NewTodo",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get autofocus() {
    		throw new Error("<NewTodo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autofocus(value) {
    		throw new Error("<NewTodo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\TodosStatus.svelte generated by Svelte v3.37.0 */

    const file$3 = "src\\components\\TodosStatus.svelte";

    function create_fragment$3(ctx) {
    	let h2;
    	let t0;
    	let t1;
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(/*completedTodos*/ ctx[2]);
    			t1 = text(" out of ");
    			t2 = text(/*totalTodos*/ ctx[1]);
    			t3 = text(" items completed");
    			attr_dev(h2, "id", "list-heading");
    			attr_dev(h2, "tabindex", -1);
    			add_location(h2, file$3, 13, 2, 384);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(h2, t3);
    			/*h2_binding*/ ctx[5](h2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*completedTodos*/ 4) set_data_dev(t0, /*completedTodos*/ ctx[2]);
    			if (dirty & /*totalTodos*/ 2) set_data_dev(t2, /*totalTodos*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			/*h2_binding*/ ctx[5](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let totalTodos;
    	let completedTodos;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TodosStatus", slots, []);
    	
    	let { todos } = $$props;

    	//    console.log('into TodoStatus.svelte : ', todos)
    	//    console.log('totalTodos : ', totalTodos)
    	//    console.log('completedTodos : ', completedTodos)
    	let headingEl;

    	function focus() {
    		headingEl.focus();
    	}

    	const writable_props = ["todos"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TodosStatus> was created with unknown prop '${key}'`);
    	});

    	function h2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			headingEl = $$value;
    			$$invalidate(0, headingEl);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("todos" in $$props) $$invalidate(3, todos = $$props.todos);
    	};

    	$$self.$capture_state = () => ({
    		todos,
    		headingEl,
    		focus,
    		totalTodos,
    		completedTodos
    	});

    	$$self.$inject_state = $$props => {
    		if ("todos" in $$props) $$invalidate(3, todos = $$props.todos);
    		if ("headingEl" in $$props) $$invalidate(0, headingEl = $$props.headingEl);
    		if ("totalTodos" in $$props) $$invalidate(1, totalTodos = $$props.totalTodos);
    		if ("completedTodos" in $$props) $$invalidate(2, completedTodos = $$props.completedTodos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*todos*/ 8) {
    			$$invalidate(1, totalTodos = todos.length);
    		}

    		if ($$self.$$.dirty & /*todos*/ 8) {
    			$$invalidate(2, completedTodos = todos.filter(todo => todo.isComplete).length);
    		}
    	};

    	return [headingEl, totalTodos, completedTodos, todos, focus, h2_binding];
    }

    class TodosStatus extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { todos: 3, focus: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodosStatus",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*todos*/ ctx[3] === undefined && !("todos" in props)) {
    			console.warn("<TodosStatus> was created without expected prop 'todos'");
    		}
    	}

    	get todos() {
    		throw new Error("<TodosStatus>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todos(value) {
    		throw new Error("<TodosStatus>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focus() {
    		return this.$$.ctx[4];
    	}

    	set focus(value) {
    		throw new Error("<TodosStatus>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    //import { localStore } from './localStore'
    //import type { TodoType } from './types/todo.type'
    //import { onMount } from 'svelte'
    const alert = writable('Welcome to the To-Do list app!');
    const authToken = writable('');
    // read the database now
    /* let initialTodos: TodoType[] = []

     fetch('http:///mint20-loopback4:3000/todos')
    .then(response => response.json() )
    .then(response => {
    //  console.log('response - :', response)
      let a:any = response
      a.forEach(element  => {
        let t: TodoType = { id: 0, title: '0', isComplete: true }
        t.id = element.id
        t.title = element.title
        if (element.isComplete === undefined) {
          t.isComplete = false
        }
        else {
          t.isComplete = element.isComplete
        }
    //    console.log('t is now : ', t)
        initialTodos.push(t)
      })
      console.log('completed fetch : ', initialTodos)
    })


    console.log('about to call writable : ', initialTodos)

    export const todos = writable<TodoType[]>(initialTodos) */
    /*

        const handleLogin = async () => {
            const response = await fetch("http:///mint20-loopback4:3000/todos", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ "title": email, "isComplete": password }),
            });

          const parsed = await response.json()
        }

    */

    /* src\components\Todos.svelte generated by Svelte v3.37.0 */

    const { Object: Object_1, console: console_1$1 } = globals;
    const file$2 = "src\\components\\Todos.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    // (275:6) {:else}
    function create_else_block(ctx) {
    	let li;

    	const block = {
    		c: function create() {
    			li = element("li");
    			li.textContent = "Nothing to do here!";
    			add_location(li, file$2, 275, 8, 10408);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(275:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (271:6) {#each filterTodos(filter, todos) as todo (todo.id)}
    function create_each_block(key_1, ctx) {
    	let li;
    	let todo;
    	let t;
    	let current;

    	todo = new Todo({
    			props: { todo: /*todo*/ ctx[25] },
    			$$inline: true
    		});

    	todo.$on("update", /*update_handler*/ ctx[12]);
    	todo.$on("remove", /*remove_handler*/ ctx[13]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			create_component(todo.$$.fragment);
    			t = space();
    			attr_dev(li, "class", "todo");
    			add_location(li, file$2, 271, 8, 10243);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(todo, li, null);
    			append_dev(li, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const todo_changes = {};
    			if (dirty & /*filter, todos*/ 3) todo_changes.todo = /*todo*/ ctx[25];
    			todo.$set(todo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(todo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(271:6) {#each filterTodos(filter, todos) as todo (todo.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let h1;
    	let t1;
    	let div;
    	let newtodo;
    	let t2;
    	let filterbutton;
    	let updating_filter;
    	let t3;
    	let todosstatus;
    	let t4;
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t5;
    	let hr;
    	let t6;
    	let moreactions;
    	let current;

    	newtodo = new NewTodo({
    			props: { autofocus: true },
    			$$inline: true
    		});

    	newtodo.$on("addTodo", /*addTodo_handler*/ ctx[9]);

    	function filterbutton_filter_binding(value) {
    		/*filterbutton_filter_binding*/ ctx[10](value);
    	}

    	let filterbutton_props = {};

    	if (/*filter*/ ctx[1] !== void 0) {
    		filterbutton_props.filter = /*filter*/ ctx[1];
    	}

    	filterbutton = new FilterButton({
    			props: filterbutton_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(filterbutton, "filter", filterbutton_filter_binding));
    	let todosstatus_props = { todos: /*todos*/ ctx[0] };
    	todosstatus = new TodosStatus({ props: todosstatus_props, $$inline: true });
    	/*todosstatus_binding*/ ctx[11](todosstatus);
    	let each_value = /*filterTodos*/ ctx[6](/*filter*/ ctx[1], /*todos*/ ctx[0]);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*todo*/ ctx[25].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block(ctx);
    	}

    	moreactions = new MoreActions({
    			props: { todos: /*todos*/ ctx[0] },
    			$$inline: true
    		});

    	moreactions.$on("checkAll", /*checkAll_handler*/ ctx[14]);
    	moreactions.$on("removeCompleted", /*removeCompletedTodos*/ ctx[8]);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Svelte To-Do list";
    			t1 = space();
    			div = element("div");
    			create_component(newtodo.$$.fragment);
    			t2 = space();
    			create_component(filterbutton.$$.fragment);
    			t3 = space();
    			create_component(todosstatus.$$.fragment);
    			t4 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			t5 = space();
    			hr = element("hr");
    			t6 = space();
    			create_component(moreactions.$$.fragment);
    			add_location(h1, file$2, 254, 0, 9741);
    			attr_dev(ul, "role", "list");
    			attr_dev(ul, "class", "todo-list stack-large");
    			attr_dev(ul, "aria-labelledby", "list-heading");
    			add_location(ul, file$2, 269, 4, 10096);
    			add_location(hr, file$2, 279, 4, 10472);
    			attr_dev(div, "class", "todoapp stack-large");
    			add_location(div, file$2, 257, 0, 9794);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(newtodo, div, null);
    			append_dev(div, t2);
    			mount_component(filterbutton, div, null);
    			append_dev(div, t3);
    			mount_component(todosstatus, div, null);
    			append_dev(div, t4);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(ul, null);
    			}

    			append_dev(div, t5);
    			append_dev(div, hr);
    			append_dev(div, t6);
    			mount_component(moreactions, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const filterbutton_changes = {};

    			if (!updating_filter && dirty & /*filter*/ 2) {
    				updating_filter = true;
    				filterbutton_changes.filter = /*filter*/ ctx[1];
    				add_flush_callback(() => updating_filter = false);
    			}

    			filterbutton.$set(filterbutton_changes);
    			const todosstatus_changes = {};
    			if (dirty & /*todos*/ 1) todosstatus_changes.todos = /*todos*/ ctx[0];
    			todosstatus.$set(todosstatus_changes);

    			if (dirty & /*filterTodos, filter, todos, updateTodo, removeTodo*/ 107) {
    				each_value = /*filterTodos*/ ctx[6](/*filter*/ ctx[1], /*todos*/ ctx[0]);
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, outro_and_destroy_block, create_each_block, null, get_each_context);
    				check_outros();

    				if (each_value.length) {
    					if (each_1_else) {
    						each_1_else.d(1);
    						each_1_else = null;
    					}
    				} else if (!each_1_else) {
    					each_1_else = create_else_block(ctx);
    					each_1_else.c();
    					each_1_else.m(ul, null);
    				}
    			}

    			const moreactions_changes = {};
    			if (dirty & /*todos*/ 1) moreactions_changes.todos = /*todos*/ ctx[0];
    			moreactions.$set(moreactions_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(newtodo.$$.fragment, local);
    			transition_in(filterbutton.$$.fragment, local);
    			transition_in(todosstatus.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(moreactions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(newtodo.$$.fragment, local);
    			transition_out(filterbutton.$$.fragment, local);
    			transition_out(todosstatus.$$.fragment, local);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(moreactions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_component(newtodo);
    			destroy_component(filterbutton);
    			/*todosstatus_binding*/ ctx[11](null);
    			destroy_component(todosstatus);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (each_1_else) each_1_else.d();
    			destroy_component(moreactions);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $authToken;
    	let $alert;
    	validate_store(authToken, "authToken");
    	component_subscribe($$self, authToken, $$value => $$invalidate(16, $authToken = $$value));
    	validate_store(alert, "alert");
    	component_subscribe($$self, alert, $$value => $$invalidate(17, $alert = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Todos", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	
    	let { todos = [] } = $$props;

    	//    console.log('into Todos.svelte : ', todos)
    	//    console.log('Todos.svelte with length of : ', todos.length)
    	//    $: totalTodos = todos.length
    	//    $: completedTodos = todos.filter(todo => todo.completed).length
    	let todosStatus; // reference to TodosStatus instance

    	let newTodoId;

    	//    $: newTodoId = todos.length ? Math.max(...todos.map(t => t.id)) + 1 : 1
    	/*    $: {
          if (totalTodos === 0) {
            newTodoId = 1;
          } else {
            newTodoId = Math.max(...todos.map(t => t.id)) + 1;
          }
        }
    */
    	function doDelete(todo) {
    		return __awaiter(this, void 0, void 0, function* () {
    			const res = yield fetch("http:///mint20-loopback4:3000/todos/" + todo.id, {
    				method: "DELETE",
    				headers: {
    					"Content-Type": "application/json",
    					"Authorization": "Bearer " + $authToken
    				}
    			});

    			if (res.status != 204) {
    				yield res.json().then(json => {
    					console.log("update todo : ", json);
    				}).catch(error => {
    					console.error("UpdateTodo fetch problem:", error);
    				});
    			}
    		});
    	}

    	function removeTodo(todo) {
    		$$invalidate(0, todos = todos.filter(t => t.id !== todo.id));
    		doDelete(todo);
    		todosStatus.focus(); // give focus to status heading
    		set_store_value(alert, $alert = `Todo '${todo.title}' has been deleted`, $alert);
    	}

    	//    async function doPost (id: number, name: string) {
    	function doPost(name) {
    		return __awaiter(this, void 0, void 0, function* () {
    			const res = yield fetch("http:///mint20-loopback4:3000/todos/", {
    				method: "POST",
    				headers: {
    					"Content-Type": "application/json",
    					"Authorization": "Bearer " + $authToken
    				},
    				body: JSON.stringify({
    					//            "id": newTodoId, 
    					"title": name,
    					"isComplete": false
    				})
    			});

    			if (res.status != 204) {
    				yield res.json().then(json => {
    					console.log("add todo : ", json);
    					console.log("with id of : ", json.id);
    					newTodoId = json.id;
    				}).catch(error => {
    					console.error("AddTodo PUT problem:", error);
    				});
    			}
    		});
    	}

    	function addTodo(name) {
    		// doing this can cause problems as the array is mutated
    		//todos.push({ id: newTodoId, name: newTodoName, isComplete: false })
    		//todos = todos
    		// doing this creates a new array
    		console.log("2 into Todos.svelte : ", todos);

    		doPost(name);
    		set_store_value(alert, $alert = `Todo '${name}' has been added`, $alert);

    		// finally update array
    		$$invalidate(0, todos = [
    			...todos,
    			{
    				id: newTodoId,
    				title: name,
    				isComplete: false
    			}
    		]);
    	}

    	function doPut(todo) {
    		return __awaiter(this, void 0, void 0, function* () {
    			const res = yield fetch("http:///mint20-loopback4:3000/todos/" + todo.id, {
    				method: "PUT",
    				headers: {
    					"Content-Type": "application/json",
    					"Authorization": "Bearer " + $authToken
    				},
    				body: JSON.stringify({
    					"title": todo.title,
    					"isComplete": todo.isComplete
    				})
    			});

    			console.log("update todo status : ", res.status);

    			if (res.status != 204) {
    				yield res.json().then(json => {
    					console.log("update todo : ", json);
    				}).catch(error => {
    					console.error("UpdateTodo doPut problem:", error);
    				});
    			}
    		});
    	}

    	function updateTodo(todo) {
    		const i = todos.findIndex(t => t.id === todo.id);
    		if (todos[i].title !== todo.title) set_store_value(alert, $alert = `todo '${todos[i].title}' has been renamed to '${todo.title}'`, $alert);
    		if (todos[i].isComplete !== todo.isComplete) set_store_value(alert, $alert = `todo '${todos[i].title}' marked as ${todo.isComplete ? "completed" : "active"}`, $alert);
    		$$invalidate(0, todos[i] = Object.assign(Object.assign({}, todos[i]), todo), todos);
    		console.log("UpdateTodo: about to call doPut with token of : ", $authToken);
    		doPut(todo);
    		console.log("UpdateTodo: completed doPut");
    	}

    	let filter = Filter.ALL;

    	const filterTodos = (filter, todos) => filter === Filter.ACTIVE
    	? todos.filter(t => !t.isComplete)
    	: filter === Filter.COMPLETED
    		? todos.filter(t => t.isComplete)
    		: todos;

    	// my functions
    	/*
    function removeCompletedTodos() {
      todos = todos.filter(t => t.isComplete == false)
    }

    function checkAll() {
      todos.forEach(function(item, index) {
        item.isComplete = true
    //        console.log(item.name, item.isComplete, index)
      })
      todos = [...todos]
    }
    */
    	function doCheckAllTodos(completed) {
    		return __awaiter(this, void 0, void 0, function* () {
    			let where = JSON.stringify({ "isComplete": !completed });

    			const res = yield fetch("http:///mint20-loopback4:3000/todos?where=" + where, {
    				method: "PATCH",
    				headers: {
    					"Content-Type": "application/json",
    					"Authorization": "Bearer " + $authToken
    				},
    				body: JSON.stringify({ "isComplete": completed })
    			});

    			console.log("doCheckAllTodos todo status : ", res.status);

    			yield res.json().then(json => {
    				console.log("doCheckAllTodos count : ", json.count);
    			}).catch(error => {
    				if (res.status != 200) {
    					console.error("doCheckAllTodos HTTP problem:", error);
    				}
    			});
    		});
    	}

    	const checkAllTodos = completed => {
    		todos.forEach(t => t.isComplete = completed);
    		$$invalidate(0, todos = [...todos]);
    		doCheckAllTodos(completed);
    		set_store_value(alert, $alert = `${completed ? "Checked" : "Unchecked"} ${todos.length} todos`, $alert);
    	};

    	function doDeleteAllCompletedTodos() {
    		return __awaiter(this, void 0, void 0, function* () {
    			let where = JSON.stringify({ "isComplete": true });

    			const res = yield fetch("http:///mint20-loopback4:3000/todos?where=" + where, {
    				method: "DELETE",
    				headers: {
    					"Content-Type": "application/json",
    					"Authorization": "Bearer " + $authToken
    				}
    			});

    			console.log("doDeleteAllCompletedTodos todo status : ", res.status);

    			yield res.json().then(json => {
    				console.log("doDeleteAllCompletedTodos count : ", json.count);
    			}).catch(error => {
    				if (res.status != 200) {
    					console.error("doDeleteAllCompletedTodos HTTP problem:", error);
    				}
    			});
    		});
    	}

    	const removeCompletedTodos = () => {
    		set_store_value(alert, $alert = `Removed ${todos.filter(t => t.isComplete).length} todos`, $alert);
    		$$invalidate(0, todos = todos.filter(t => !t.isComplete));
    		doDeleteAllCompletedTodos();
    	};

    	function getAllTodos() {
    		return __awaiter(this, void 0, void 0, function* () {
    			console.log("auth token is : ", $authToken);

    			const res = yield fetch("http:///mint20-loopback4:3000/todos", {
    				method: "GET",
    				headers: {
    					"Content-Type": "application/json",
    					"Authorization": "Bearer " + $authToken
    				}
    			});

    			const json = yield res.json().catch(error => {
    				console.error("getAllTodos fetch problem:", error);
    			});

    			console.log("todolist : ", json);

    			json.forEach(element => {
    				let t = { id: 0, title: "0", isComplete: true };
    				t.id = element.id;
    				t.title = element.title;

    				if (element.isComplete === undefined) {
    					t.isComplete = false;
    				} else {
    					t.isComplete = element.isComplete;
    				}

    				// this updates the DOM
    				$$invalidate(0, todos = [...todos, t]);
    			});
    		}); //    console.log('completed mount : ', todos)
    	}

    	onMount(() => {
    		getAllTodos();
    	});

    	const writable_props = ["todos"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Todos> was created with unknown prop '${key}'`);
    	});

    	const addTodo_handler = e => addTodo(e.detail);

    	function filterbutton_filter_binding(value) {
    		filter = value;
    		$$invalidate(1, filter);
    	}

    	function todosstatus_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			todosStatus = $$value;
    			$$invalidate(2, todosStatus);
    		});
    	}

    	const update_handler = e => updateTodo(e.detail);
    	const remove_handler = e => removeTodo(e.detail);
    	const checkAll_handler = e => checkAllTodos(e.detail);

    	$$self.$$set = $$props => {
    		if ("todos" in $$props) $$invalidate(0, todos = $$props.todos);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		FilterButton,
    		Todo,
    		MoreActions,
    		NewTodo,
    		TodosStatus,
    		alert,
    		Filter,
    		onMount,
    		authToken,
    		todos,
    		todosStatus,
    		newTodoId,
    		doDelete,
    		removeTodo,
    		doPost,
    		addTodo,
    		doPut,
    		updateTodo,
    		filter,
    		filterTodos,
    		doCheckAllTodos,
    		checkAllTodos,
    		doDeleteAllCompletedTodos,
    		removeCompletedTodos,
    		getAllTodos,
    		$authToken,
    		$alert
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("todos" in $$props) $$invalidate(0, todos = $$props.todos);
    		if ("todosStatus" in $$props) $$invalidate(2, todosStatus = $$props.todosStatus);
    		if ("newTodoId" in $$props) newTodoId = $$props.newTodoId;
    		if ("filter" in $$props) $$invalidate(1, filter = $$props.filter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*filter*/ 2) {
    			{
    				if (filter === Filter.ALL) set_store_value(alert, $alert = "Browsing all todos", $alert); else if (filter === Filter.ACTIVE) set_store_value(alert, $alert = "Browsing active todos", $alert); else if (filter === Filter.COMPLETED) set_store_value(alert, $alert = "Browsing completed todos", $alert);
    			}
    		}
    	};

    	return [
    		todos,
    		filter,
    		todosStatus,
    		removeTodo,
    		addTodo,
    		updateTodo,
    		filterTodos,
    		checkAllTodos,
    		removeCompletedTodos,
    		addTodo_handler,
    		filterbutton_filter_binding,
    		todosstatus_binding,
    		update_handler,
    		remove_handler,
    		checkAll_handler
    	];
    }

    class Todos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { todos: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todos",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get todos() {
    		throw new Error("<Todos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todos(value) {
    		throw new Error("<Todos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src\components\Alert.svelte generated by Svelte v3.37.0 */
    const file$1 = "src\\components\\Alert.svelte";

    // (34:2) {#if visible}
    function create_if_block$1(ctx) {
    	let div;
    	let svg;
    	let path;
    	let t0;
    	let p;
    	let t1;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			p = element("p");
    			t1 = text(/*$alert*/ ctx[0]);
    			attr_dev(path, "d", "M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z");
    			add_location(path, file$1, 35, 64, 1529);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "class", "svelte-dxta7");
    			add_location(svg, file$1, 35, 4, 1469);
    			attr_dev(p, "class", "svelte-dxta7");
    			add_location(p, file$1, 36, 4, 1977);
    			attr_dev(div, "role", "alert");
    			attr_dev(div, "class", "svelte-dxta7");
    			add_location(div, file$1, 34, 2, 1335);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*$alert*/ 1) set_data_dev(t1, /*$alert*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(
    					div,
    					fly,
    					{
    						delay: 250,
    						duration: 300,
    						x: 0,
    						y: -100,
    						opacity: 0.5
    					},
    					true
    				);

    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(
    				div,
    				fly,
    				{
    					delay: 250,
    					duration: 300,
    					x: 0,
    					y: -100,
    					opacity: 0.5
    				},
    				false
    			);

    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(34:2) {#if visible}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*visible*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*visible*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*visible*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $alert;
    	validate_store(alert, "alert");
    	component_subscribe($$self, alert, $$value => $$invalidate(0, $alert = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Alert", slots, []);
    	let { ms = 3000 } = $$props;
    	let visible;
    	let timeout;

    	const onMessageChange = (message, ms) => {
    		clearTimeout(timeout);

    		if (!message) {
    			// hide Alert if message is empty
    			$$invalidate(1, visible = false);
    		} else {
    			$$invalidate(1, visible = true); // show alert
    			if (ms > 0) timeout = setTimeout(() => $$invalidate(1, visible = false), ms); // and hide it after ms milliseconds
    		}
    	};

    	onDestroy(() => clearTimeout(timeout)); // make sure we clean-up the timeout
    	const writable_props = ["ms"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Alert> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, visible = false);

    	$$self.$$set = $$props => {
    		if ("ms" in $$props) $$invalidate(2, ms = $$props.ms);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		alert,
    		fly,
    		ms,
    		visible,
    		timeout,
    		onMessageChange,
    		$alert
    	});

    	$$self.$inject_state = $$props => {
    		if ("ms" in $$props) $$invalidate(2, ms = $$props.ms);
    		if ("visible" in $$props) $$invalidate(1, visible = $$props.visible);
    		if ("timeout" in $$props) timeout = $$props.timeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$alert, ms*/ 5) {
    			onMessageChange($alert, ms); // whenever the alert store or the ms props changes run onMessageChange
    		}
    	};

    	return [$alert, visible, ms, click_handler];
    }

    class Alert extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { ms: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Alert",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get ms() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ms(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.37.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (78:1) {#if !authorised}
    function create_if_block_1(ctx) {
    	let h2;
    	let t1;
    	let br;
    	let t2;
    	let div;
    	let form;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let label1;
    	let t5;
    	let input1;
    	let t6;
    	let button;
    	let t7;
    	let button_disabled_value;
    	let t8;
    	let mounted;
    	let dispose;
    	let if_block = /*error*/ ctx[2] && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Login to Loopback Todo";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			div = element("div");
    			form = element("form");
    			label0 = element("label");
    			t3 = text("Email:\n        ");
    			input0 = element("input");
    			t4 = space();
    			label1 = element("label");
    			t5 = text("Password:\n        ");
    			input1 = element("input");
    			t6 = space();
    			button = element("button");
    			t7 = text("Login");
    			t8 = space();
    			if (if_block) if_block.c();
    			add_location(h2, file, 78, 2, 2487);
    			add_location(br, file, 79, 1, 2520);
    			attr_dev(input0, "type", "email");
    			add_location(input0, file, 84, 8, 2665);
    			add_location(label0, file, 82, 6, 2634);
    			attr_dev(input1, "type", "password");
    			add_location(input1, file, 88, 8, 2764);
    			add_location(label1, file, 86, 6, 2730);
    			attr_dev(button, "type", "submit");
    			button.disabled = button_disabled_value = /*password*/ ctx[0] == "" || /*email*/ ctx[1] == "";
    			attr_dev(button, "class", "btn");
    			add_location(button, file, 90, 6, 2835);
    			attr_dev(form, "method", "post");
    			add_location(form, file, 81, 4, 2566);
    			attr_dev(div, "class", "todoapp stack-large");
    			add_location(div, file, 80, 3, 2528);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, form);
    			append_dev(form, label0);
    			append_dev(label0, t3);
    			append_dev(label0, input0);
    			set_input_value(input0, /*email*/ ctx[1]);
    			append_dev(form, t4);
    			append_dev(form, label1);
    			append_dev(label1, t5);
    			append_dev(label1, input1);
    			set_input_value(input1, /*password*/ ctx[0]);
    			append_dev(form, t6);
    			append_dev(form, button);
    			append_dev(button, t7);
    			append_dev(div, t8);
    			if (if_block) if_block.m(div, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    					listen_dev(form, "submit", prevent_default(/*handleLogin*/ ctx[5]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*email*/ 2 && input0.value !== /*email*/ ctx[1]) {
    				set_input_value(input0, /*email*/ ctx[1]);
    			}

    			if (dirty & /*password*/ 1 && input1.value !== /*password*/ ctx[0]) {
    				set_input_value(input1, /*password*/ ctx[0]);
    			}

    			if (dirty & /*password, email*/ 3 && button_disabled_value !== (button_disabled_value = /*password*/ ctx[0] == "" || /*email*/ ctx[1] == "")) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (/*error*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(78:1) {#if !authorised}",
    		ctx
    	});

    	return block;
    }

    // (93:4) {#if error}
    function create_if_block_2(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[2].statusCode + "";
    	let t1;
    	let t2;
    	let br;
    	let t3;
    	let t4_value = /*error*/ ctx[2].message + "";
    	let t4;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Status code ");
    			t1 = text(t1_value);
    			t2 = space();
    			br = element("br");
    			t3 = space();
    			t4 = text(t4_value);
    			add_location(br, file, 93, 58, 3009);
    			attr_dev(p, "class", "error-mess svelte-1ju2a49");
    			add_location(p, file, 93, 5, 2956);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, br);
    			append_dev(p, t3);
    			append_dev(p, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 4 && t1_value !== (t1_value = /*error*/ ctx[2].statusCode + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*error*/ 4 && t4_value !== (t4_value = /*error*/ ctx[2].message + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(93:4) {#if error}",
    		ctx
    	});

    	return block;
    }

    // (100:2) {#if authorised}
    function create_if_block(ctx) {
    	let h2;
    	let t1;
    	let br;
    	let t2;
    	let div;
    	let button;
    	let t4;
    	let alert;
    	let t5;
    	let todos_1;
    	let updating_todos;
    	let current;
    	let mounted;
    	let dispose;
    	alert = new Alert({ $$inline: true });

    	function todos_1_todos_binding(value) {
    		/*todos_1_todos_binding*/ ctx[9](value);
    	}

    	let todos_1_props = {};

    	if (/*todos*/ ctx[4] !== void 0) {
    		todos_1_props.todos = /*todos*/ ctx[4];
    	}

    	todos_1 = new Todos({ props: todos_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(todos_1, "todos", todos_1_todos_binding));

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Loopback Todo";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			div = element("div");
    			button = element("button");
    			button.textContent = "Log Out";
    			t4 = space();
    			create_component(alert.$$.fragment);
    			t5 = space();
    			create_component(todos_1.$$.fragment);
    			add_location(h2, file, 101, 4, 3134);
    			add_location(br, file, 102, 4, 3161);
    			attr_dev(button, "class", "btn");
    			add_location(button, file, 104, 6, 3182);
    			add_location(div, file, 103, 4, 3170);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			insert_dev(target, t4, anchor);
    			mount_component(alert, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(todos_1, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*logout*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const todos_1_changes = {};

    			if (!updating_todos && dirty & /*todos*/ 16) {
    				updating_todos = true;
    				todos_1_changes.todos = /*todos*/ ctx[4];
    				add_flush_callback(() => updating_todos = false);
    			}

    			todos_1.$set(todos_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(alert.$$.fragment, local);
    			transition_in(todos_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(alert.$$.fragment, local);
    			transition_out(todos_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t4);
    			destroy_component(alert, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(todos_1, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(100:2) {#if authorised}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = !/*authorised*/ ctx[3] && create_if_block_1(ctx);
    	let if_block1 = /*authorised*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*authorised*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*authorised*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*authorised*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $authToken;
    	validate_store(authToken, "authToken");
    	component_subscribe($$self, authToken, $$value => $$invalidate(10, $authToken = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	
    	let password = "";
    	let email = "";
    	let error;
    	let authorised = false;
    	let todos = [];

    	const handleLogin = () => __awaiter(void 0, void 0, void 0, function* () {
    		const response = yield fetch("http:///mint20-loopback4:3000/users/login", {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({ email, password })
    		});

    		const parsed = yield response.json();

    		//	  console.log(parsed)
    		//	  console.log("NORRIS: reply received")
    		if (parsed.token) {
    			set_store_value(authToken, $authToken = parsed.token, $authToken);
    			$$invalidate(3, authorised = true);
    			$$invalidate(1, email = "");
    			$$invalidate(0, password = "");
    		} else {
    			console.log(parsed.error);
    			$$invalidate(2, error = parsed.error);
    			$$invalidate(1, email = "");
    			$$invalidate(0, password = "");
    		}

    		console.log("NORRIS: " + $authToken);
    	});

    	/*   async function doLogout () {
          const res = await fetch('http:///mint20-loopback4:3000/users/logout', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                "isComplete": completed
            })
          })
          console.log('doLogout status : ', res.status)
          const json = await res.json()
          .catch(error => {
              if (res.status != 204) {
                console.error('doLogout fetch problem:', error)
              }
          })
        } */
    	function logout() {
    		set_store_value(authToken, $authToken = "", $authToken);
    		$$invalidate(3, authorised = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		email = this.value;
    		$$invalidate(1, email);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(0, password);
    	}

    	function todos_1_todos_binding(value) {
    		todos = value;
    		$$invalidate(4, todos);
    	}

    	$$self.$capture_state = () => ({
    		__awaiter,
    		Todos,
    		Alert,
    		onMount,
    		authToken,
    		password,
    		email,
    		error,
    		authorised,
    		todos,
    		handleLogin,
    		logout,
    		$authToken
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("password" in $$props) $$invalidate(0, password = $$props.password);
    		if ("email" in $$props) $$invalidate(1, email = $$props.email);
    		if ("error" in $$props) $$invalidate(2, error = $$props.error);
    		if ("authorised" in $$props) $$invalidate(3, authorised = $$props.authorised);
    		if ("todos" in $$props) $$invalidate(4, todos = $$props.todos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		password,
    		email,
    		error,
    		authorised,
    		todos,
    		handleLogin,
    		logout,
    		input0_input_handler,
    		input1_input_handler,
    		todos_1_todos_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
