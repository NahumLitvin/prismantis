var E = (e, a) => () => {
  try {
    return a || e((a = { exports: {} }).exports, a), a.exports;
  } catch (n) {
    throw a = 0, n;
  }
};

// node_modules/prismjs/components/prism-core.js
var X = E((Te, q) => {
  var xe = typeof window < "u" ? window : typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope ? self : {};
  var W = (function(e) {
    var a = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i, n = 0, d = {}, i = {
      /**
       * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
       * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
       * additional languages or plugins yourself.
       *
       * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
       *
       * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
       * empty Prism object into the global scope before loading the Prism script like this:
       *
       * ```js
       * window.Prism = window.Prism || {};
       * Prism.manual = true;
       * // add a new <script> to load Prism's script
       * ```
       *
       * @default false
       * @type {boolean}
       * @memberof Prism
       * @public
       */
      manual: e.Prism && e.Prism.manual,
      /**
       * By default, if Prism is in a web worker, it assumes that it is in a worker it created itself, so it uses
       * `addEventListener` to communicate with its parent instance. However, if you're using Prism manually in your
       * own worker, you don't want it to do this.
       *
       * By setting this value to `true`, Prism will not add its own listeners to the worker.
       *
       * You obviously have to change this value before Prism executes. To do this, you can add an
       * empty Prism object into the global scope before loading the Prism script like this:
       *
       * ```js
       * window.Prism = window.Prism || {};
       * Prism.disableWorkerMessageHandler = true;
       * // Load Prism's script
       * ```
       *
       * @default false
       * @type {boolean}
       * @memberof Prism
       * @public
       */
      disableWorkerMessageHandler: e.Prism && e.Prism.disableWorkerMessageHandler,
      /**
       * A namespace for utility methods.
       *
       * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
       * change or disappear at any time.
       *
       * @namespace
       * @memberof Prism
       */
      util: {
        encode: function r(t) {
          return t instanceof b ? new b(t.type, r(t.content), t.alias) : Array.isArray(t) ? t.map(r) : t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
        },
        /**
         * Returns the name of the type of the given value.
         *
         * @param {any} o
         * @returns {string}
         * @example
         * type(null)      === 'Null'
         * type(undefined) === 'Undefined'
         * type(123)       === 'Number'
         * type('foo')     === 'String'
         * type(true)      === 'Boolean'
         * type([1, 2])    === 'Array'
         * type({})        === 'Object'
         * type(String)    === 'Function'
         * type(/abc+/)    === 'RegExp'
         */
        type: function(r) {
          return Object.prototype.toString.call(r).slice(8, -1);
        },
        /**
         * Returns a unique number for the given object. Later calls will still return the same number.
         *
         * @param {Object} obj
         * @returns {number}
         */
        objId: function(r) {
          return r.__id || Object.defineProperty(r, "__id", { value: ++n }), r.__id;
        },
        /**
         * Creates a deep clone of the given object.
         *
         * The main intended use of this function is to clone language definitions.
         *
         * @param {T} o
         * @param {Record<number, any>} [visited]
         * @returns {T}
         * @template T
         */
        clone: function r(t, o) {
          o = o || {};
          var s, u;
          switch (i.util.type(t)) {
            case "Object":
              if (u = i.util.objId(t), o[u])
                return o[u];
              s = /** @type {Record<string, any>} */
              {}, o[u] = s;
              for (var l in t)
                t.hasOwnProperty(l) && (s[l] = r(t[l], o));
              return (
                /** @type {any} */
                s
              );
            case "Array":
              return u = i.util.objId(t), o[u] ? o[u] : (s = [], o[u] = s, /** @type {Array} */
              /** @type {any} */
              t.forEach(function(m, p) {
                s[p] = r(m, o);
              }), /** @type {any} */
              s);
            default:
              return t;
          }
        },
        /**
         * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
         *
         * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
         *
         * @param {Element} element
         * @returns {string}
         */
        getLanguage: function(r) {
          for (; r; ) {
            var t = a.exec(r.className);
            if (t)
              return t[1].toLowerCase();
            r = r.parentElement;
          }
          return "none";
        },
        /**
         * Sets the Prism `language-xxxx` class of the given element.
         *
         * @param {Element} element
         * @param {string} language
         * @returns {void}
         */
        setLanguage: function(r, t) {
          r.className = r.className.replace(RegExp(a, "gi"), ""), r.classList.add("language-" + t);
        },
        /**
         * Returns the script element that is currently executing.
         *
         * This does __not__ work for line script element.
         *
         * @returns {HTMLScriptElement | null}
         */
        currentScript: function() {
          if (typeof document > "u")
            return null;
          if (document.currentScript && document.currentScript.tagName === "SCRIPT")
            return (
              /** @type {any} */
              document.currentScript
            );
          try {
            throw new Error();
          } catch (s) {
            var r = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(s.stack) || [])[1];
            if (r) {
              var t = document.getElementsByTagName("script");
              for (var o in t)
                if (t[o].src == r)
                  return t[o];
            }
            return null;
          }
        },
        /**
         * Returns whether a given class is active for `element`.
         *
         * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
         * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
         * given class is just the given class with a `no-` prefix.
         *
         * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
         * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
         * ancestors have the given class or the negated version of it, then the default activation will be returned.
         *
         * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
         * version of it, the class is considered active.
         *
         * @param {Element} element
         * @param {string} className
         * @param {boolean} [defaultActivation=false]
         * @returns {boolean}
         */
        isActive: function(r, t, o) {
          for (var s = "no-" + t; r; ) {
            var u = r.classList;
            if (u.contains(t))
              return !0;
            if (u.contains(s))
              return !1;
            r = r.parentElement;
          }
          return !!o;
        }
      },
      /**
       * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
       *
       * @namespace
       * @memberof Prism
       * @public
       */
      languages: {
        /**
         * The grammar for plain, unformatted text.
         */
        plain: d,
        plaintext: d,
        text: d,
        txt: d,
        /**
         * Creates a deep copy of the language with the given id and appends the given tokens.
         *
         * If a token in `redef` also appears in the copied language, then the existing token in the copied language
         * will be overwritten at its original position.
         *
         * ## Best practices
         *
         * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
         * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
         * understand the language definition because, normally, the order of tokens matters in Prism grammars.
         *
         * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
         * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
         *
         * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
         * @param {Grammar} redef The new tokens to append.
         * @returns {Grammar} The new language created.
         * @public
         * @example
         * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
         *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
         *     // at its original position
         *     'comment': { ... },
         *     // CSS doesn't have a 'color' token, so this token will be appended
         *     'color': /\b(?:red|green|blue)\b/
         * });
         */
        extend: function(r, t) {
          var o = i.util.clone(i.languages[r]);
          for (var s in t)
            o[s] = t[s];
          return o;
        },
        /**
         * Inserts tokens _before_ another token in a language definition or any other grammar.
         *
         * ## Usage
         *
         * This helper method makes it easy to modify existing languages. For example, the CSS language definition
         * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
         * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
         * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
         * this:
         *
         * ```js
         * Prism.languages.markup.style = {
         *     // token
         * };
         * ```
         *
         * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
         * before existing tokens. For the CSS example above, you would use it like this:
         *
         * ```js
         * Prism.languages.insertBefore('markup', 'cdata', {
         *     'style': {
         *         // token
         *     }
         * });
         * ```
         *
         * ## Special cases
         *
         * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
         * will be ignored.
         *
         * This behavior can be used to insert tokens after `before`:
         *
         * ```js
         * Prism.languages.insertBefore('markup', 'comment', {
         *     'comment': Prism.languages.markup.comment,
         *     // tokens after 'comment'
         * });
         * ```
         *
         * ## Limitations
         *
         * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
         * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
         * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
         * deleting properties which is necessary to insert at arbitrary positions.
         *
         * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
         * Instead, it will create a new object and replace all references to the target object with the new one. This
         * can be done without temporarily deleting properties, so the iteration order is well-defined.
         *
         * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
         * you hold the target object in a variable, then the value of the variable will not change.
         *
         * ```js
         * var oldMarkup = Prism.languages.markup;
         * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
         *
         * assert(oldMarkup !== Prism.languages.markup);
         * assert(newMarkup === Prism.languages.markup);
         * ```
         *
         * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
         * object to be modified.
         * @param {string} before The key to insert before.
         * @param {Grammar} insert An object containing the key-value pairs to be inserted.
         * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
         * object to be modified.
         *
         * Defaults to `Prism.languages`.
         * @returns {Grammar} The new grammar object.
         * @public
         */
        insertBefore: function(r, t, o, s) {
          s = s || /** @type {any} */
          i.languages;
          var u = s[r], l = {};
          for (var m in u)
            if (u.hasOwnProperty(m)) {
              if (m == t)
                for (var p in o)
                  o.hasOwnProperty(p) && (l[p] = o[p]);
              o.hasOwnProperty(m) || (l[m] = u[m]);
            }
          var x = s[r];
          return s[r] = l, i.languages.DFS(i.languages, function(A, F) {
            F === x && A != r && (this[A] = l);
          }), l;
        },
        // Traverse a language definition with Depth First Search
        DFS: function r(t, o, s, u) {
          u = u || {};
          var l = i.util.objId;
          for (var m in t)
            if (t.hasOwnProperty(m)) {
              o.call(t, m, t[m], s || m);
              var p = t[m], x = i.util.type(p);
              x === "Object" && !u[l(p)] ? (u[l(p)] = !0, r(p, o, null, u)) : x === "Array" && !u[l(p)] && (u[l(p)] = !0, r(p, o, m, u));
            }
        }
      },
      plugins: {},
      /**
       * This is the most high-level function in Prism’s API.
       * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
       * each one of them.
       *
       * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
       *
       * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
       * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
       * @memberof Prism
       * @public
       */
      highlightAll: function(r, t) {
        i.highlightAllUnder(document, r, t);
      },
      /**
       * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
       * {@link Prism.highlightElement} on each one of them.
       *
       * The following hooks will be run:
       * 1. `before-highlightall`
       * 2. `before-all-elements-highlight`
       * 3. All hooks of {@link Prism.highlightElement} for each element.
       *
       * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
       * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
       * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
       * @memberof Prism
       * @public
       */
      highlightAllUnder: function(r, t, o) {
        var s = {
          callback: o,
          container: r,
          selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
        };
        i.hooks.run("before-highlightall", s), s.elements = Array.prototype.slice.apply(s.container.querySelectorAll(s.selector)), i.hooks.run("before-all-elements-highlight", s);
        for (var u = 0, l; l = s.elements[u++]; )
          i.highlightElement(l, t === !0, s.callback);
      },
      /**
       * Highlights the code inside a single element.
       *
       * The following hooks will be run:
       * 1. `before-sanity-check`
       * 2. `before-highlight`
       * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
       * 4. `before-insert`
       * 5. `after-highlight`
       * 6. `complete`
       *
       * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
       * the element's language.
       *
       * @param {Element} element The element containing the code.
       * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
       * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
       * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
       * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
       *
       * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
       * asynchronous highlighting to work. You can build your own bundle on the
       * [Download page](https://prismjs.com/download.html).
       * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
       * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
       * @memberof Prism
       * @public
       */
      highlightElement: function(r, t, o) {
        var s = i.util.getLanguage(r), u = i.languages[s];
        i.util.setLanguage(r, s);
        var l = r.parentElement;
        l && l.nodeName.toLowerCase() === "pre" && i.util.setLanguage(l, s);
        var m = r.textContent, p = {
          element: r,
          language: s,
          grammar: u,
          code: m
        };
        function x(F) {
          p.highlightedCode = F, i.hooks.run("before-insert", p), p.element.innerHTML = p.highlightedCode, i.hooks.run("after-highlight", p), i.hooks.run("complete", p), o && o.call(p.element);
        }
        if (i.hooks.run("before-sanity-check", p), l = p.element.parentElement, l && l.nodeName.toLowerCase() === "pre" && !l.hasAttribute("tabindex") && l.setAttribute("tabindex", "0"), !p.code) {
          i.hooks.run("complete", p), o && o.call(p.element);
          return;
        }
        if (i.hooks.run("before-highlight", p), !p.grammar) {
          x(i.util.encode(p.code));
          return;
        }
        if (t && e.Worker) {
          var A = new Worker(i.filename);
          A.onmessage = function(F) {
            x(F.data);
          }, A.postMessage(JSON.stringify({
            language: p.language,
            code: p.code,
            immediateClose: !0
          }));
        } else
          x(i.highlight(p.code, p.grammar, p.language));
      },
      /**
       * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
       * and the language definitions to use, and returns a string with the HTML produced.
       *
       * The following hooks will be run:
       * 1. `before-tokenize`
       * 2. `after-tokenize`
       * 3. `wrap`: On each {@link Token}.
       *
       * @param {string} text A string with the code to be highlighted.
       * @param {Grammar} grammar An object containing the tokens to use.
       *
       * Usually a language definition like `Prism.languages.markup`.
       * @param {string} language The name of the language definition passed to `grammar`.
       * @returns {string} The highlighted HTML.
       * @memberof Prism
       * @public
       * @example
       * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
       */
      highlight: function(r, t, o) {
        var s = {
          code: r,
          grammar: t,
          language: o
        };
        if (i.hooks.run("before-tokenize", s), !s.grammar)
          throw new Error('The language "' + s.language + '" has no grammar.');
        return s.tokens = i.tokenize(s.code, s.grammar), i.hooks.run("after-tokenize", s), b.stringify(i.util.encode(s.tokens), s.language);
      },
      /**
       * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
       * and the language definitions to use, and returns an array with the tokenized code.
       *
       * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
       *
       * This method could be useful in other contexts as well, as a very crude parser.
       *
       * @param {string} text A string with the code to be highlighted.
       * @param {Grammar} grammar An object containing the tokens to use.
       *
       * Usually a language definition like `Prism.languages.markup`.
       * @returns {TokenStream} An array of strings and tokens, a token stream.
       * @memberof Prism
       * @public
       * @example
       * let code = `var foo = 0;`;
       * let tokens = Prism.tokenize(code, Prism.languages.javascript);
       * tokens.forEach(token => {
       *     if (token instanceof Prism.Token && token.type === 'number') {
       *         console.log(`Found numeric literal: ${token.content}`);
       *     }
       * });
       */
      tokenize: function(r, t) {
        var o = t.rest;
        if (o) {
          for (var s in o)
            t[s] = o[s];
          delete t.rest;
        }
        var u = new c();
        return g(u, u.head, r), h(r, u, t, u.head, 0), y(u);
      },
      /**
       * @namespace
       * @memberof Prism
       * @public
       */
      hooks: {
        all: {},
        /**
         * Adds the given callback to the list of callbacks for the given hook.
         *
         * The callback will be invoked when the hook it is registered for is run.
         * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
         *
         * One callback function can be registered to multiple hooks and the same hook multiple times.
         *
         * @param {string} name The name of the hook.
         * @param {HookCallback} callback The callback function which is given environment variables.
         * @public
         */
        add: function(r, t) {
          var o = i.hooks.all;
          o[r] = o[r] || [], o[r].push(t);
        },
        /**
         * Runs a hook invoking all registered callbacks with the given environment variables.
         *
         * Callbacks will be invoked synchronously and in the order in which they were registered.
         *
         * @param {string} name The name of the hook.
         * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
         * @public
         */
        run: function(r, t) {
          var o = i.hooks.all[r];
          if (!(!o || !o.length))
            for (var s = 0, u; u = o[s++]; )
              u(t);
        }
      },
      Token: b
    };
    e.Prism = i;
    function b(r, t, o, s) {
      this.type = r, this.content = t, this.alias = o, this.length = (s || "").length | 0;
    }
    b.stringify = function r(t, o) {
      if (typeof t == "string")
        return t;
      if (Array.isArray(t)) {
        var s = "";
        return t.forEach(function(x) {
          s += r(x, o);
        }), s;
      }
      var u = {
        type: t.type,
        content: r(t.content, o),
        tag: "span",
        classes: ["token", t.type],
        attributes: {},
        language: o
      }, l = t.alias;
      l && (Array.isArray(l) ? Array.prototype.push.apply(u.classes, l) : u.classes.push(l)), i.hooks.run("wrap", u);
      var m = "";
      for (var p in u.attributes)
        m += " " + p + '="' + (u.attributes[p] || "").replace(/"/g, "&quot;") + '"';
      return "<" + u.tag + ' class="' + u.classes.join(" ") + '"' + m + ">" + u.content + "</" + u.tag + ">";
    };
    function f(r, t, o, s) {
      r.lastIndex = t;
      var u = r.exec(o);
      if (u && s && u[1]) {
        var l = u[1].length;
        u.index += l, u[0] = u[0].slice(l);
      }
      return u;
    }
    function h(r, t, o, s, u, l) {
      for (var m in o)
        if (!(!o.hasOwnProperty(m) || !o[m])) {
          var p = o[m];
          p = Array.isArray(p) ? p : [p];
          for (var x = 0; x < p.length; ++x) {
            if (l && l.cause == m + "," + x)
              return;
            var A = p[x], F = A.inside, C = !!A.lookbehind, D = !!A.greedy, Z = A.alias;
            if (D && !A.pattern.global) {
              var z = A.pattern.toString().match(/[imsuy]*$/)[0];
              A.pattern = RegExp(A.pattern.source, z + "g");
            }
            for (var P = A.pattern || A, k = s.next, I = u; k !== t.tail && !(l && I >= l.reach); I += k.value.length, k = k.next) {
              var N = k.value;
              if (t.length > r.length)
                return;
              if (!(N instanceof b)) {
                var L = 1, v;
                if (D) {
                  if (v = f(P, I, r, C), !v || v.index >= r.length)
                    break;
                  var B = v.index, O = v.index + v[0].length, R = I;
                  for (R += k.value.length; B >= R; )
                    k = k.next, R += k.value.length;
                  if (R -= k.value.length, I = R, k.value instanceof b)
                    continue;
                  for (var $ = k; $ !== t.tail && (R < O || typeof $.value == "string"); $ = $.next)
                    L++, R += $.value.length;
                  L--, N = r.slice(I, R), v.index -= I;
                } else if (v = f(P, 0, N, C), !v)
                  continue;
                var B = v.index, U = v[0], j = N.slice(0, B), Y = N.slice(B + U.length), G = I + N.length;
                l && G > l.reach && (l.reach = G);
                var M = k.prev;
                j && (M = g(t, M, j), I += j.length), w(t, M, L);
                var ke = new b(m, F ? i.tokenize(U, F) : U, Z, U);
                if (k = g(t, M, ke), Y && g(t, k, Y), L > 1) {
                  var H = {
                    cause: m + "," + x,
                    reach: G
                  };
                  h(r, t, o, k.prev, I, H), l && H.reach > l.reach && (l.reach = H.reach);
                }
              }
            }
          }
        }
    }
    function c() {
      var r = { value: null, prev: null, next: null }, t = { value: null, prev: r, next: null };
      r.next = t, this.head = r, this.tail = t, this.length = 0;
    }
    function g(r, t, o) {
      var s = t.next, u = { value: o, prev: t, next: s };
      return t.next = u, s.prev = u, r.length++, u;
    }
    function w(r, t, o) {
      for (var s = t.next, u = 0; u < o && s !== r.tail; u++)
        s = s.next;
      t.next = s, s.prev = t, r.length -= u;
    }
    function y(r) {
      for (var t = [], o = r.head.next; o !== r.tail; )
        t.push(o.value), o = o.next;
      return t;
    }
    if (!e.document)
      return e.addEventListener && (i.disableWorkerMessageHandler || e.addEventListener("message", function(r) {
        var t = JSON.parse(r.data), o = t.language, s = t.code, u = t.immediateClose;
        e.postMessage(i.highlight(s, i.languages[o], o)), u && e.close();
      }, !1)), i;
    var S = i.util.currentScript();
    S && (i.filename = S.src, S.hasAttribute("data-manual") && (i.manual = !0));
    function _() {
      i.manual || i.highlightAll();
    }
    if (!i.manual) {
      var T = document.readyState;
      T === "loading" || T === "interactive" && S && S.defer ? document.addEventListener("DOMContentLoaded", _) : window.requestAnimationFrame ? window.requestAnimationFrame(_) : window.setTimeout(_, 16);
    }
    return i;
  })(xe);
  typeof q < "u" && q.exports && (q.exports = W);
  typeof global < "u" && (global.Prism = W);
});

// node_modules/prismjs/components/prism-clike.js
var V = E(() => {
  Prism.languages.clike = {
    comment: [
      {
        pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
        lookbehind: !0,
        greedy: !0
      },
      {
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: !0,
        greedy: !0
      }
    ],
    string: {
      pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
      greedy: !0
    },
    "class-name": {
      pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
      lookbehind: !0,
      inside: {
        punctuation: /[.\\]/
      }
    },
    keyword: /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
    boolean: /\b(?:false|true)\b/,
    function: /\b\w+(?=\()/,
    number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    punctuation: /[{}[\];(),.:]/
  };
});

// node_modules/prismjs/components/prism-markup.js
var Q = E(() => {
  Prism.languages.markup = {
    comment: {
      pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
      greedy: !0
    },
    prolog: {
      pattern: /<\?[\s\S]+?\?>/,
      greedy: !0
    },
    doctype: {
      // https://www.w3.org/TR/xml/#NT-doctypedecl
      pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
      greedy: !0,
      inside: {
        "internal-subset": {
          pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
          lookbehind: !0,
          greedy: !0,
          inside: null
          // see below
        },
        string: {
          pattern: /"[^"]*"|'[^']*'/,
          greedy: !0
        },
        punctuation: /^<!|>$|[[\]]/,
        "doctype-tag": /^DOCTYPE/i,
        name: /[^\s<>'"]+/
      }
    },
    cdata: {
      pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
      greedy: !0
    },
    tag: {
      pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
      greedy: !0,
      inside: {
        tag: {
          pattern: /^<\/?[^\s>\/]+/,
          inside: {
            punctuation: /^<\/?/,
            namespace: /^[^\s>\/:]+:/
          }
        },
        "special-attr": [],
        "attr-value": {
          pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
          inside: {
            punctuation: [
              {
                pattern: /^=/,
                alias: "attr-equals"
              },
              {
                pattern: /^(\s*)["']|["']$/,
                lookbehind: !0
              }
            ]
          }
        },
        punctuation: /\/?>/,
        "attr-name": {
          pattern: /[^\s>\/]+/,
          inside: {
            namespace: /^[^\s>\/:]+:/
          }
        }
      }
    },
    entity: [
      {
        pattern: /&[\da-z]{1,8};/i,
        alias: "named-entity"
      },
      /&#x?[\da-f]{1,8};/i
    ]
  };
  Prism.languages.markup.tag.inside["attr-value"].inside.entity = Prism.languages.markup.entity;
  Prism.languages.markup.doctype.inside["internal-subset"].inside = Prism.languages.markup;
  Prism.hooks.add("wrap", function(e) {
    e.type === "entity" && (e.attributes.title = e.content.replace(/&amp;/, "&"));
  });
  Object.defineProperty(Prism.languages.markup.tag, "addInlined", {
    /**
     * Adds an inlined language to markup.
     *
     * An example of an inlined language is CSS with `<style>` tags.
     *
     * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
     * case insensitive.
     * @param {string} lang The language key.
     * @example
     * addInlined('style', 'css');
     */
    value: function(a, n) {
      var d = {};
      d["language-" + n] = {
        pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
        lookbehind: !0,
        inside: Prism.languages[n]
      }, d.cdata = /^<!\[CDATA\[|\]\]>$/i;
      var i = {
        "included-cdata": {
          pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
          inside: d
        }
      };
      i["language-" + n] = {
        pattern: /[\s\S]+/,
        inside: Prism.languages[n]
      };
      var b = {};
      b[a] = {
        pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function() {
          return a;
        }), "i"),
        lookbehind: !0,
        greedy: !0,
        inside: i
      }, Prism.languages.insertBefore("markup", "cdata", b);
    }
  });
  Object.defineProperty(Prism.languages.markup.tag, "addAttribute", {
    /**
     * Adds an pattern to highlight languages embedded in HTML attributes.
     *
     * An example of an inlined language is CSS with `style` attributes.
     *
     * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
     * case insensitive.
     * @param {string} lang The language key.
     * @example
     * addAttribute('style', 'css');
     */
    value: function(e, a) {
      Prism.languages.markup.tag.inside["special-attr"].push({
        pattern: RegExp(
          /(^|["'\s])/.source + "(?:" + e + ")" + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
          "i"
        ),
        lookbehind: !0,
        inside: {
          "attr-name": /^[^\s=]+/,
          "attr-value": {
            pattern: /=[\s\S]+/,
            inside: {
              value: {
                pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                lookbehind: !0,
                alias: [a, "language-" + a],
                inside: Prism.languages[a]
              },
              punctuation: [
                {
                  pattern: /^=/,
                  alias: "attr-equals"
                },
                /"|'/
              ]
            }
          }
        }
      });
    }
  });
  Prism.languages.html = Prism.languages.markup;
  Prism.languages.mathml = Prism.languages.markup;
  Prism.languages.svg = Prism.languages.markup;
  Prism.languages.xml = Prism.languages.extend("markup", {});
  Prism.languages.ssml = Prism.languages.xml;
  Prism.languages.atom = Prism.languages.xml;
  Prism.languages.rss = Prism.languages.xml;
});

// node_modules/prismjs/components/prism-markup-templating.js
var J = E(() => {
  (function(e) {
    function a(n, d) {
      return "___" + n.toUpperCase() + d + "___";
    }
    Object.defineProperties(e.languages["markup-templating"] = {}, {
      buildPlaceholders: {
        /**
         * Tokenize all inline templating expressions matching `placeholderPattern`.
         *
         * If `replaceFilter` is provided, only matches of `placeholderPattern` for which `replaceFilter` returns
         * `true` will be replaced.
         *
         * @param {object} env The environment of the `before-tokenize` hook.
         * @param {string} language The language id.
         * @param {RegExp} placeholderPattern The matches of this pattern will be replaced by placeholders.
         * @param {(match: string) => boolean} [replaceFilter]
         */
        value: function(n, d, i, b) {
          if (n.language === d) {
            var f = n.tokenStack = [];
            n.code = n.code.replace(i, function(h) {
              if (typeof b == "function" && !b(h))
                return h;
              for (var c = f.length, g; n.code.indexOf(g = a(d, c)) !== -1; )
                ++c;
              return f[c] = h, g;
            }), n.grammar = e.languages.markup;
          }
        }
      },
      tokenizePlaceholders: {
        /**
         * Replace placeholders with proper tokens after tokenizing.
         *
         * @param {object} env The environment of the `after-tokenize` hook.
         * @param {string} language The language id.
         */
        value: function(n, d) {
          if (n.language !== d || !n.tokenStack)
            return;
          n.grammar = e.languages[d];
          var i = 0, b = Object.keys(n.tokenStack);
          function f(h) {
            for (var c = 0; c < h.length && !(i >= b.length); c++) {
              var g = h[c];
              if (typeof g == "string" || g.content && typeof g.content == "string") {
                var w = b[i], y = n.tokenStack[w], S = typeof g == "string" ? g : g.content, _ = a(d, w), T = S.indexOf(_);
                if (T > -1) {
                  ++i;
                  var r = S.substring(0, T), t = new e.Token(d, e.tokenize(y, n.grammar), "language-" + d, y), o = S.substring(T + _.length), s = [];
                  r && s.push.apply(s, f([r])), s.push(t), o && s.push.apply(s, f([o])), typeof g == "string" ? h.splice.apply(h, [c, 1].concat(s)) : g.content = s;
                }
              } else g.content && f(g.content);
            }
            return h;
          }
          f(n.tokens);
        }
      }
    });
  })(Prism);
});

// node_modules/prismjs/components/prism-php.js
var ee = E(() => {
  (function(e) {
    var a = /\/\*[\s\S]*?\*\/|\/\/.*|#(?!\[).*/, n = [
      {
        pattern: /\b(?:false|true)\b/i,
        alias: "boolean"
      },
      {
        pattern: /(::\s*)\b[a-z_]\w*\b(?!\s*\()/i,
        greedy: !0,
        lookbehind: !0
      },
      {
        pattern: /(\b(?:case|const)\s+)\b[a-z_]\w*(?=\s*[;=])/i,
        greedy: !0,
        lookbehind: !0
      },
      /\b(?:null)\b/i,
      /\b[A-Z_][A-Z0-9_]*\b(?!\s*\()/
    ], d = /\b0b[01]+(?:_[01]+)*\b|\b0o[0-7]+(?:_[0-7]+)*\b|\b0x[\da-f]+(?:_[\da-f]+)*\b|(?:\b\d+(?:_\d+)*\.?(?:\d+(?:_\d+)*)?|\B\.\d+)(?:e[+-]?\d+)?/i, i = /<?=>|\?\?=?|\.{3}|\??->|[!=]=?=?|::|\*\*=?|--|\+\+|&&|\|\||<<|>>|[?~]|[/^|%*&<>.+-]=?/, b = /[{}\[\](),:;]/;
    e.languages.php = {
      delimiter: {
        pattern: /\?>$|^<\?(?:php(?=\s)|=)?/i,
        alias: "important"
      },
      comment: a,
      variable: /\$+(?:\w+\b|(?=\{))/,
      package: {
        pattern: /(namespace\s+|use\s+(?:function\s+)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
        lookbehind: !0,
        inside: {
          punctuation: /\\/
        }
      },
      "class-name-definition": {
        pattern: /(\b(?:class|enum|interface|trait)\s+)\b[a-z_]\w*(?!\\)\b/i,
        lookbehind: !0,
        alias: "class-name"
      },
      "function-definition": {
        pattern: /(\bfunction\s+)[a-z_]\w*(?=\s*\()/i,
        lookbehind: !0,
        alias: "function"
      },
      keyword: [
        {
          pattern: /(\(\s*)\b(?:array|bool|boolean|float|int|integer|object|string)\b(?=\s*\))/i,
          alias: "type-casting",
          greedy: !0,
          lookbehind: !0
        },
        {
          pattern: /([(,?]\s*)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|object|self|static|string)\b(?=\s*\$)/i,
          alias: "type-hint",
          greedy: !0,
          lookbehind: !0
        },
        {
          pattern: /(\)\s*:\s*(?:\?\s*)?)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|never|object|self|static|string|void)\b/i,
          alias: "return-type",
          greedy: !0,
          lookbehind: !0
        },
        {
          pattern: /\b(?:array(?!\s*\()|bool|float|int|iterable|mixed|object|string|void)\b/i,
          alias: "type-declaration",
          greedy: !0
        },
        {
          pattern: /(\|\s*)(?:false|null)\b|\b(?:false|null)(?=\s*\|)/i,
          alias: "type-declaration",
          greedy: !0,
          lookbehind: !0
        },
        {
          pattern: /\b(?:parent|self|static)(?=\s*::)/i,
          alias: "static-context",
          greedy: !0
        },
        {
          // yield from
          pattern: /(\byield\s+)from\b/i,
          lookbehind: !0
        },
        // `class` is always a keyword unlike other keywords
        /\bclass\b/i,
        {
          // https://www.php.net/manual/en/reserved.keywords.php
          //
          // keywords cannot be preceded by "->"
          // the complex lookbehind means `(?<!(?:->|::)\s*)`
          pattern: /((?:^|[^\s>:]|(?:^|[^-])>|(?:^|[^:]):)\s*)\b(?:abstract|and|array|as|break|callable|case|catch|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|eval|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|never|new|or|parent|print|private|protected|public|readonly|require|require_once|return|self|static|switch|throw|trait|try|unset|use|var|while|xor|yield|__halt_compiler)\b/i,
          lookbehind: !0
        }
      ],
      "argument-name": {
        pattern: /([(,]\s*)\b[a-z_]\w*(?=\s*:(?!:))/i,
        lookbehind: !0
      },
      "class-name": [
        {
          pattern: /(\b(?:extends|implements|instanceof|new(?!\s+self|\s+static))\s+|\bcatch\s*\()\b[a-z_]\w*(?!\\)\b/i,
          greedy: !0,
          lookbehind: !0
        },
        {
          pattern: /(\|\s*)\b[a-z_]\w*(?!\\)\b/i,
          greedy: !0,
          lookbehind: !0
        },
        {
          pattern: /\b[a-z_]\w*(?!\\)\b(?=\s*\|)/i,
          greedy: !0
        },
        {
          pattern: /(\|\s*)(?:\\?\b[a-z_]\w*)+\b/i,
          alias: "class-name-fully-qualified",
          greedy: !0,
          lookbehind: !0,
          inside: {
            punctuation: /\\/
          }
        },
        {
          pattern: /(?:\\?\b[a-z_]\w*)+\b(?=\s*\|)/i,
          alias: "class-name-fully-qualified",
          greedy: !0,
          inside: {
            punctuation: /\\/
          }
        },
        {
          pattern: /(\b(?:extends|implements|instanceof|new(?!\s+self\b|\s+static\b))\s+|\bcatch\s*\()(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
          alias: "class-name-fully-qualified",
          greedy: !0,
          lookbehind: !0,
          inside: {
            punctuation: /\\/
          }
        },
        {
          pattern: /\b[a-z_]\w*(?=\s*\$)/i,
          alias: "type-declaration",
          greedy: !0
        },
        {
          pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i,
          alias: ["class-name-fully-qualified", "type-declaration"],
          greedy: !0,
          inside: {
            punctuation: /\\/
          }
        },
        {
          pattern: /\b[a-z_]\w*(?=\s*::)/i,
          alias: "static-context",
          greedy: !0
        },
        {
          pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*::)/i,
          alias: ["class-name-fully-qualified", "static-context"],
          greedy: !0,
          inside: {
            punctuation: /\\/
          }
        },
        {
          pattern: /([(,?]\s*)[a-z_]\w*(?=\s*\$)/i,
          alias: "type-hint",
          greedy: !0,
          lookbehind: !0
        },
        {
          pattern: /([(,?]\s*)(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i,
          alias: ["class-name-fully-qualified", "type-hint"],
          greedy: !0,
          lookbehind: !0,
          inside: {
            punctuation: /\\/
          }
        },
        {
          pattern: /(\)\s*:\s*(?:\?\s*)?)\b[a-z_]\w*(?!\\)\b/i,
          alias: "return-type",
          greedy: !0,
          lookbehind: !0
        },
        {
          pattern: /(\)\s*:\s*(?:\?\s*)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
          alias: ["class-name-fully-qualified", "return-type"],
          greedy: !0,
          lookbehind: !0,
          inside: {
            punctuation: /\\/
          }
        }
      ],
      constant: n,
      function: {
        pattern: /(^|[^\\\w])\\?[a-z_](?:[\w\\]*\w)?(?=\s*\()/i,
        lookbehind: !0,
        inside: {
          punctuation: /\\/
        }
      },
      property: {
        pattern: /(->\s*)\w+/,
        lookbehind: !0
      },
      number: d,
      operator: i,
      punctuation: b
    };
    var f = {
      pattern: /\{\$(?:\{(?:\{[^{}]+\}|[^{}]+)\}|[^{}])+\}|(^|[^\\{])\$+(?:\w+(?:\[[^\r\n\[\]]+\]|->\w+)?)/,
      lookbehind: !0,
      inside: e.languages.php
    }, h = [
      {
        pattern: /<<<'([^']+)'[\r\n](?:.*[\r\n])*?\1;/,
        alias: "nowdoc-string",
        greedy: !0,
        inside: {
          delimiter: {
            pattern: /^<<<'[^']+'|[a-z_]\w*;$/i,
            alias: "symbol",
            inside: {
              punctuation: /^<<<'?|[';]$/
            }
          }
        }
      },
      {
        pattern: /<<<(?:"([^"]+)"[\r\n](?:.*[\r\n])*?\1;|([a-z_]\w*)[\r\n](?:.*[\r\n])*?\2;)/i,
        alias: "heredoc-string",
        greedy: !0,
        inside: {
          delimiter: {
            pattern: /^<<<(?:"[^"]+"|[a-z_]\w*)|[a-z_]\w*;$/i,
            alias: "symbol",
            inside: {
              punctuation: /^<<<"?|[";]$/
            }
          },
          interpolation: f
        }
      },
      {
        pattern: /`(?:\\[\s\S]|[^\\`])*`/,
        alias: "backtick-quoted-string",
        greedy: !0
      },
      {
        pattern: /'(?:\\[\s\S]|[^\\'])*'/,
        alias: "single-quoted-string",
        greedy: !0
      },
      {
        pattern: /"(?:\\[\s\S]|[^\\"])*"/,
        alias: "double-quoted-string",
        greedy: !0,
        inside: {
          interpolation: f
        }
      }
    ];
    e.languages.insertBefore("php", "variable", {
      string: h,
      attribute: {
        pattern: /#\[(?:[^"'\/#]|\/(?![*/])|\/\/.*$|#(?!\[).*$|\/\*(?:[^*]|\*(?!\/))*\*\/|"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*')+\](?=\s*[a-z$#])/im,
        greedy: !0,
        inside: {
          "attribute-content": {
            pattern: /^(#\[)[\s\S]+(?=\]$)/,
            lookbehind: !0,
            // inside can appear subset of php
            inside: {
              comment: a,
              string: h,
              "attribute-class-name": [
                {
                  pattern: /([^:]|^)\b[a-z_]\w*(?!\\)\b/i,
                  alias: "class-name",
                  greedy: !0,
                  lookbehind: !0
                },
                {
                  pattern: /([^:]|^)(?:\\?\b[a-z_]\w*)+/i,
                  alias: [
                    "class-name",
                    "class-name-fully-qualified"
                  ],
                  greedy: !0,
                  lookbehind: !0,
                  inside: {
                    punctuation: /\\/
                  }
                }
              ],
              constant: n,
              number: d,
              operator: i,
              punctuation: b
            }
          },
          delimiter: {
            pattern: /^#\[|\]$/,
            alias: "punctuation"
          }
        }
      }
    }), e.hooks.add("before-tokenize", function(c) {
      if (/<\?/.test(c.code)) {
        var g = /<\?(?:[^"'/#]|\/(?![*/])|("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|(?:\/\/|#(?!\[))(?:[^?\n\r]|\?(?!>))*(?=$|\?>|[\r\n])|#\[|\/\*(?:[^*]|\*(?!\/))*(?:\*\/|$))*?(?:\?>|$)/g;
        e.languages["markup-templating"].buildPlaceholders(c, "php", g);
      }
    }), e.hooks.add("after-tokenize", function(c) {
      e.languages["markup-templating"].tokenizePlaceholders(c, "php");
    });
  })(Prism);
});

// node_modules/prismjs/components/prism-css.js
var te = E(() => {
  (function(e) {
    var a = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
    e.languages.css = {
      comment: /\/\*[\s\S]*?\*\//,
      atrule: {
        pattern: RegExp("@[\\w-](?:" + /[^;{\s"']|\s+(?!\s)/.source + "|" + a.source + ")*?" + /(?:;|(?=\s*\{))/.source),
        inside: {
          rule: /^@[\w-]+/,
          "selector-function-argument": {
            pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
            lookbehind: !0,
            alias: "selector"
          },
          keyword: {
            pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
            lookbehind: !0
          }
          // See rest below
        }
      },
      url: {
        // https://drafts.csswg.org/css-values-3/#urls
        pattern: RegExp("\\burl\\((?:" + a.source + "|" + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ")\\)", "i"),
        greedy: !0,
        inside: {
          function: /^url/i,
          punctuation: /^\(|\)$/,
          string: {
            pattern: RegExp("^" + a.source + "$"),
            alias: "url"
          }
        }
      },
      selector: {
        pattern: RegExp(`(^|[{}\\s])[^{}\\s](?:[^{};"'\\s]|\\s+(?![\\s{])|` + a.source + ")*(?=\\s*\\{)"),
        lookbehind: !0
      },
      string: {
        pattern: a,
        greedy: !0
      },
      property: {
        pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
        lookbehind: !0
      },
      important: /!important\b/i,
      function: {
        pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
        lookbehind: !0
      },
      punctuation: /[(){};:,]/
    }, e.languages.css.atrule.inside.rest = e.languages.css;
    var n = e.languages.markup;
    n && (n.tag.addInlined("style", "css"), n.tag.addAttribute("style", "css"));
  })(Prism);
});

// node_modules/prismjs/components/prism-javascript.js
var ne = E(() => {
  Prism.languages.javascript = Prism.languages.extend("clike", {
    "class-name": [
      Prism.languages.clike["class-name"],
      {
        pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
        lookbehind: !0
      }
    ],
    keyword: [
      {
        pattern: /((?:^|\})\s*)catch\b/,
        lookbehind: !0
      },
      {
        pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
        lookbehind: !0
      }
    ],
    // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
    function: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    number: {
      pattern: RegExp(
        /(^|[^\w$])/.source + "(?:" + // constant
        (/NaN|Infinity/.source + "|" + // binary integer
        /0[bB][01]+(?:_[01]+)*n?/.source + "|" + // octal integer
        /0[oO][0-7]+(?:_[0-7]+)*n?/.source + "|" + // hexadecimal integer
        /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source + "|" + // decimal bigint
        /\d+(?:_\d+)*n/.source + "|" + // decimal number (integer or float) but no bigint
        /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source) + ")" + /(?![\w$])/.source
      ),
      lookbehind: !0
    },
    operator: /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
  });
  Prism.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;
  Prism.languages.insertBefore("javascript", "keyword", {
    regex: {
      pattern: RegExp(
        // lookbehind
        // eslint-disable-next-line regexp/no-dupe-characters-character-class
        /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source + // Regex pattern:
        // There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
        // classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
        // with the only syntax, so we have to define 2 different regex patterns.
        /\//.source + "(?:" + /(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source + "|" + // `v` flag syntax. This supports 3 levels of nested character classes.
        /(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source + ")" + // lookahead
        /(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
      ),
      lookbehind: !0,
      greedy: !0,
      inside: {
        "regex-source": {
          pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
          lookbehind: !0,
          alias: "language-regex",
          inside: Prism.languages.regex
        },
        "regex-delimiter": /^\/|\/$/,
        "regex-flags": /^[a-z]+$/
      }
    },
    // This must be declared before keyword because we use "function" inside the look-forward
    "function-variable": {
      pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
      alias: "function"
    },
    parameter: [
      {
        pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
        lookbehind: !0,
        inside: Prism.languages.javascript
      },
      {
        pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
        lookbehind: !0,
        inside: Prism.languages.javascript
      },
      {
        pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
        lookbehind: !0,
        inside: Prism.languages.javascript
      },
      {
        pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
        lookbehind: !0,
        inside: Prism.languages.javascript
      }
    ],
    constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/
  });
  Prism.languages.insertBefore("javascript", "string", {
    hashbang: {
      pattern: /^#!.*/,
      greedy: !0,
      alias: "comment"
    },
    "template-string": {
      pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
      greedy: !0,
      inside: {
        "template-punctuation": {
          pattern: /^`|`$/,
          alias: "string"
        },
        interpolation: {
          pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
          lookbehind: !0,
          inside: {
            "interpolation-punctuation": {
              pattern: /^\$\{|\}$/,
              alias: "punctuation"
            },
            rest: Prism.languages.javascript
          }
        },
        string: /[\s\S]+/
      }
    },
    "string-property": {
      pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
      lookbehind: !0,
      greedy: !0,
      alias: "property"
    }
  });
  Prism.languages.insertBefore("javascript", "operator", {
    "literal-property": {
      pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
      lookbehind: !0,
      alias: "property"
    }
  });
  Prism.languages.markup && (Prism.languages.markup.tag.addInlined("script", "javascript"), Prism.languages.markup.tag.addAttribute(
    /on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
    "javascript"
  ));
  Prism.languages.js = Prism.languages.javascript;
});

// node_modules/prismjs/components/prism-typescript.js
var re = E(() => {
  (function(e) {
    e.languages.typescript = e.languages.extend("javascript", {
      "class-name": {
        pattern: /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
        lookbehind: !0,
        greedy: !0,
        inside: null
        // see below
      },
      builtin: /\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\b/
    }), e.languages.typescript.keyword.push(
      /\b(?:abstract|declare|is|keyof|readonly|require)\b/,
      // keywords that have to be followed by an identifier
      /\b(?:asserts|infer|interface|module|namespace|type)\b(?=\s*(?:[{_$a-zA-Z\xA0-\uFFFF]|$))/,
      // This is for `import type *, {}`
      /\btype\b(?=\s*(?:[\{*]|$))/
    ), delete e.languages.typescript.parameter, delete e.languages.typescript["literal-property"];
    var a = e.languages.extend("typescript", {});
    delete a["class-name"], e.languages.typescript["class-name"].inside = a, e.languages.insertBefore("typescript", "function", {
      decorator: {
        pattern: /@[$\w\xA0-\uFFFF]+/,
        inside: {
          at: {
            pattern: /^@/,
            alias: "operator"
          },
          function: /^[\s\S]+/
        }
      },
      "generic-function": {
        // e.g. foo<T extends "bar" | "baz">( ...
        pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/,
        greedy: !0,
        inside: {
          function: /^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/,
          generic: {
            pattern: /<[\s\S]+/,
            // everything after the first <
            alias: "class-name",
            inside: a
          }
        }
      }
    }), e.languages.ts = e.languages.typescript;
  })(Prism);
});

// node_modules/prismjs/components/prism-jsx.js
var ae = E(() => {
  (function(e) {
    var a = e.util.clone(e.languages.javascript), n = /(?:\s|\/\/.*(?!.)|\/\*(?:[^*]|\*(?!\/))\*\/)/.source, d = /(?:\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])*\})/.source, i = /(?:\{<S>*\.{3}(?:[^{}]|<BRACES>)*\})/.source;
    function b(c, g) {
      return c = c.replace(/<S>/g, function() {
        return n;
      }).replace(/<BRACES>/g, function() {
        return d;
      }).replace(/<SPREAD>/g, function() {
        return i;
      }), RegExp(c, g);
    }
    i = b(i).source, e.languages.jsx = e.languages.extend("markup", a), e.languages.jsx.tag.pattern = b(
      /<\/?(?:[\w.:-]+(?:<S>+(?:[\w.:$-]+(?:=(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s{'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*\/?)?>/.source
    ), e.languages.jsx.tag.inside.tag.pattern = /^<\/?[^\s>\/]*/, e.languages.jsx.tag.inside["attr-value"].pattern = /=(?!\{)(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s'">]+)/, e.languages.jsx.tag.inside.tag.inside["class-name"] = /^[A-Z]\w*(?:\.[A-Z]\w*)*$/, e.languages.jsx.tag.inside.comment = a.comment, e.languages.insertBefore("inside", "attr-name", {
      spread: {
        pattern: b(/<SPREAD>/.source),
        inside: e.languages.jsx
      }
    }, e.languages.jsx.tag), e.languages.insertBefore("inside", "special-attr", {
      script: {
        // Allow for two levels of nesting
        pattern: b(/=<BRACES>/.source),
        alias: "language-javascript",
        inside: {
          "script-punctuation": {
            pattern: /^=(?=\{)/,
            alias: "punctuation"
          },
          rest: e.languages.jsx
        }
      }
    }, e.languages.jsx.tag);
    var f = function(c) {
      return c ? typeof c == "string" ? c : typeof c.content == "string" ? c.content : c.content.map(f).join("") : "";
    }, h = function(c) {
      for (var g = [], w = 0; w < c.length; w++) {
        var y = c[w], S = !1;
        if (typeof y != "string" && (y.type === "tag" && y.content[0] && y.content[0].type === "tag" ? y.content[0].content[0].content === "</" ? g.length > 0 && g[g.length - 1].tagName === f(y.content[0].content[1]) && g.pop() : y.content[y.content.length - 1].content === "/>" || g.push({
          tagName: f(y.content[0].content[1]),
          openedBraces: 0
        }) : g.length > 0 && y.type === "punctuation" && y.content === "{" ? g[g.length - 1].openedBraces++ : g.length > 0 && g[g.length - 1].openedBraces > 0 && y.type === "punctuation" && y.content === "}" ? g[g.length - 1].openedBraces-- : S = !0), (S || typeof y == "string") && g.length > 0 && g[g.length - 1].openedBraces === 0) {
          var _ = f(y);
          w < c.length - 1 && (typeof c[w + 1] == "string" || c[w + 1].type === "plain-text") && (_ += f(c[w + 1]), c.splice(w + 1, 1)), w > 0 && (typeof c[w - 1] == "string" || c[w - 1].type === "plain-text") && (_ = f(c[w - 1]) + _, c.splice(w - 1, 1), w--), c[w] = new e.Token("plain-text", _, null, _);
        }
        y.content && typeof y.content != "string" && h(y.content);
      }
    };
    e.hooks.add("after-tokenize", function(c) {
      c.language !== "jsx" && c.language !== "tsx" || h(c.tokens);
    });
  })(Prism);
});

// node_modules/prismjs/components/prism-tsx.js
var ie = E(() => {
  (function(e) {
    var a = e.util.clone(e.languages.typescript);
    e.languages.tsx = e.languages.extend("jsx", a), delete e.languages.tsx.parameter, delete e.languages.tsx["literal-property"];
    var n = e.languages.tsx.tag;
    n.pattern = RegExp(/(^|[^\w$]|(?=<\/))/.source + "(?:" + n.pattern.source + ")", n.pattern.flags), n.lookbehind = !0;
  })(Prism);
});

// node_modules/prismjs/components/prism-python.js
var se = E(() => {
  Prism.languages.python = {
    comment: {
      pattern: /(^|[^\\])#.*/,
      lookbehind: !0,
      greedy: !0
    },
    "string-interpolation": {
      pattern: /(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
      greedy: !0,
      inside: {
        interpolation: {
          // "{" <expression> <optional "!s", "!r", or "!a"> <optional ":" format specifier> "}"
          pattern: /((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}])+\})+\})+\}/,
          lookbehind: !0,
          inside: {
            "format-spec": {
              pattern: /(:)[^:(){}]+(?=\}$)/,
              lookbehind: !0
            },
            "conversion-option": {
              pattern: /![sra](?=[:}]$)/,
              alias: "punctuation"
            },
            rest: null
          }
        },
        string: /[\s\S]+/
      }
    },
    "triple-quoted-string": {
      pattern: /(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i,
      greedy: !0,
      alias: "string"
    },
    string: {
      pattern: /(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
      greedy: !0
    },
    function: {
      pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
      lookbehind: !0
    },
    "class-name": {
      pattern: /(\bclass\s+)\w+/i,
      lookbehind: !0
    },
    decorator: {
      pattern: /(^[\t ]*)@\w+(?:\.\w+)*/m,
      lookbehind: !0,
      alias: ["annotation", "punctuation"],
      inside: {
        punctuation: /\./
      }
    },
    keyword: /\b(?:_(?=\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
    builtin: /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
    boolean: /\b(?:False|None|True)\b/,
    number: /\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i,
    operator: /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
    punctuation: /[{}[\];(),.:]/
  };
  Prism.languages.python["string-interpolation"].inside.interpolation.inside.rest = Prism.languages.python;
  Prism.languages.py = Prism.languages.python;
});

// node_modules/prismjs/components/prism-go.js
var oe = E(() => {
  Prism.languages.go = Prism.languages.extend("clike", {
    string: {
      pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"|`[^`]*`/,
      lookbehind: !0,
      greedy: !0
    },
    keyword: /\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(?:to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,
    boolean: /\b(?:_|false|iota|nil|true)\b/,
    number: [
      // binary and octal integers
      /\b0(?:b[01_]+|o[0-7_]+)i?\b/i,
      // hexadecimal integers and floats
      /\b0x(?:[a-f\d_]+(?:\.[a-f\d_]*)?|\.[a-f\d_]+)(?:p[+-]?\d+(?:_\d+)*)?i?(?!\w)/i,
      // decimal integers and floats
      /(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?[\d_]+)?i?(?!\w)/i
    ],
    operator: /[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./,
    builtin: /\b(?:append|bool|byte|cap|close|complex|complex(?:64|128)|copy|delete|error|float(?:32|64)|u?int(?:8|16|32|64)?|imag|len|make|new|panic|print(?:ln)?|real|recover|rune|string|uintptr)\b/
  });
  Prism.languages.insertBefore("go", "string", {
    char: {
      pattern: /'(?:\\.|[^'\\\r\n]){0,10}'/,
      greedy: !0
    }
  });
  delete Prism.languages.go["class-name"];
});

// node_modules/prismjs/components/prism-rust.js
var ue = E(() => {
  (function(e) {
    for (var a = /\/\*(?:[^*/]|\*(?!\/)|\/(?!\*)|<self>)*\*\//.source, n = 0; n < 2; n++)
      a = a.replace(/<self>/g, function() {
        return a;
      });
    a = a.replace(/<self>/g, function() {
      return /[^\s\S]/.source;
    }), e.languages.rust = {
      comment: [
        {
          pattern: RegExp(/(^|[^\\])/.source + a),
          lookbehind: !0,
          greedy: !0
        },
        {
          pattern: /(^|[^\\:])\/\/.*/,
          lookbehind: !0,
          greedy: !0
        }
      ],
      string: {
        pattern: /b?"(?:\\[\s\S]|[^\\"])*"|b?r(#*)"(?:[^"]|"(?!\1))*"\1/,
        greedy: !0
      },
      char: {
        pattern: /b?'(?:\\(?:x[0-7][\da-fA-F]|u\{(?:[\da-fA-F]_*){1,6}\}|.)|[^\\\r\n\t'])'/,
        greedy: !0
      },
      attribute: {
        pattern: /#!?\[(?:[^\[\]"]|"(?:\\[\s\S]|[^\\"])*")*\]/,
        greedy: !0,
        alias: "attr-name",
        inside: {
          string: null
          // see below
        }
      },
      // Closure params should not be confused with bitwise OR |
      "closure-params": {
        pattern: /([=(,:]\s*|\bmove\s*)\|[^|]*\||\|[^|]*\|(?=\s*(?:\{|->))/,
        lookbehind: !0,
        greedy: !0,
        inside: {
          "closure-punctuation": {
            pattern: /^\||\|$/,
            alias: "punctuation"
          },
          rest: null
          // see below
        }
      },
      "lifetime-annotation": {
        pattern: /'\w+/,
        alias: "symbol"
      },
      "fragment-specifier": {
        pattern: /(\$\w+:)[a-z]+/,
        lookbehind: !0,
        alias: "punctuation"
      },
      variable: /\$\w+/,
      "function-definition": {
        pattern: /(\bfn\s+)\w+/,
        lookbehind: !0,
        alias: "function"
      },
      "type-definition": {
        pattern: /(\b(?:enum|struct|trait|type|union)\s+)\w+/,
        lookbehind: !0,
        alias: "class-name"
      },
      "module-declaration": [
        {
          pattern: /(\b(?:crate|mod)\s+)[a-z][a-z_\d]*/,
          lookbehind: !0,
          alias: "namespace"
        },
        {
          pattern: /(\b(?:crate|self|super)\s*)::\s*[a-z][a-z_\d]*\b(?:\s*::(?:\s*[a-z][a-z_\d]*\s*::)*)?/,
          lookbehind: !0,
          alias: "namespace",
          inside: {
            punctuation: /::/
          }
        }
      ],
      keyword: [
        // https://github.com/rust-lang/reference/blob/master/src/keywords.md
        /\b(?:Self|abstract|as|async|await|become|box|break|const|continue|crate|do|dyn|else|enum|extern|final|fn|for|if|impl|in|let|loop|macro|match|mod|move|mut|override|priv|pub|ref|return|self|static|struct|super|trait|try|type|typeof|union|unsafe|unsized|use|virtual|where|while|yield)\b/,
        // primitives and str
        // https://doc.rust-lang.org/stable/rust-by-example/primitives.html
        /\b(?:bool|char|f(?:32|64)|[ui](?:8|16|32|64|128|size)|str)\b/
      ],
      // functions can technically start with an upper-case letter, but this will introduce a lot of false positives
      // and Rust's naming conventions recommend snake_case anyway.
      // https://doc.rust-lang.org/1.0.0/style/style/naming/README.html
      function: /\b[a-z_]\w*(?=\s*(?:::\s*<|\())/,
      macro: {
        pattern: /\b\w+!/,
        alias: "property"
      },
      constant: /\b[A-Z_][A-Z_\d]+\b/,
      "class-name": /\b[A-Z]\w*\b/,
      namespace: {
        pattern: /(?:\b[a-z][a-z_\d]*\s*::\s*)*\b[a-z][a-z_\d]*\s*::(?!\s*<)/,
        inside: {
          punctuation: /::/
        }
      },
      // Hex, oct, bin, dec numbers with visual separators and type suffix
      number: /\b(?:0x[\dA-Fa-f](?:_?[\dA-Fa-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|(?:(?:\d(?:_?\d)*)?\.)?\d(?:_?\d)*(?:[Ee][+-]?\d+)?)(?:_?(?:f32|f64|[iu](?:8|16|32|64|size)?))?\b/,
      boolean: /\b(?:false|true)\b/,
      punctuation: /->|\.\.=|\.{1,3}|::|[{}[\];(),:]/,
      operator: /[-+*\/%!^]=?|=[=>]?|&[&=]?|\|[|=]?|<<?=?|>>?=?|[@?]/
    }, e.languages.rust["closure-params"].inside.rest = e.languages.rust, e.languages.rust.attribute.inside.string = e.languages.rust.string;
  })(Prism);
});

// node_modules/prismjs/components/prism-java.js
var le = E(() => {
  (function(e) {
    var a = /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|non-sealed|null|open|opens|package|permits|private|protected|provides|public|record(?!\s*[(){}[\]<>=%~.:,;?+\-*/&|^])|requires|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/, n = /(?:[a-z]\w*\s*\.\s*)*(?:[A-Z]\w*\s*\.\s*)*/.source, d = {
      pattern: RegExp(/(^|[^\w.])/.source + n + /[A-Z](?:[\d_A-Z]*[a-z]\w*)?\b/.source),
      lookbehind: !0,
      inside: {
        namespace: {
          pattern: /^[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.)?/,
          inside: {
            punctuation: /\./
          }
        },
        punctuation: /\./
      }
    };
    e.languages.java = e.languages.extend("clike", {
      string: {
        pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"/,
        lookbehind: !0,
        greedy: !0
      },
      "class-name": [
        d,
        {
          // variables, parameters, and constructor references
          // this to support class names (or generic parameters) which do not contain a lower case letter (also works for methods)
          pattern: RegExp(/(^|[^\w.])/.source + n + /[A-Z]\w*(?=\s+\w+\s*[;,=()]|\s*(?:\[[\s,]*\]\s*)?::\s*new\b)/.source),
          lookbehind: !0,
          inside: d.inside
        },
        {
          // class names based on keyword
          // this to support class names (or generic parameters) which do not contain a lower case letter (also works for methods)
          pattern: RegExp(/(\b(?:class|enum|extends|implements|instanceof|interface|new|record|throws)\s+)/.source + n + /[A-Z]\w*\b/.source),
          lookbehind: !0,
          inside: d.inside
        }
      ],
      keyword: a,
      function: [
        e.languages.clike.function,
        {
          pattern: /(::\s*)[a-z_]\w*/,
          lookbehind: !0
        }
      ],
      number: /\b0b[01][01_]*L?\b|\b0x(?:\.[\da-f_p+-]+|[\da-f_]+(?:\.[\da-f_p+-]+)?)\b|(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
      operator: {
        pattern: /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m,
        lookbehind: !0
      },
      constant: /\b[A-Z][A-Z_\d]+\b/
    }), e.languages.insertBefore("java", "string", {
      "triple-quoted-string": {
        // http://openjdk.java.net/jeps/355#Description
        pattern: /"""[ \t]*[\r\n](?:(?:"|"")?(?:\\.|[^"\\]))*"""/,
        greedy: !0,
        alias: "string"
      },
      char: {
        pattern: /'(?:\\.|[^'\\\r\n]){1,6}'/,
        greedy: !0
      }
    }), e.languages.insertBefore("java", "class-name", {
      annotation: {
        pattern: /(^|[^.])@\w+(?:\s*\.\s*\w+)*/,
        lookbehind: !0,
        alias: "punctuation"
      },
      generics: {
        pattern: /<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&))*>)*>)*>)*>/,
        inside: {
          "class-name": d,
          keyword: a,
          punctuation: /[<>(),.:]/,
          operator: /[?&|]/
        }
      },
      import: [
        {
          pattern: RegExp(/(\bimport\s+)/.source + n + /(?:[A-Z]\w*|\*)(?=\s*;)/.source),
          lookbehind: !0,
          inside: {
            namespace: d.inside.namespace,
            punctuation: /\./,
            operator: /\*/,
            "class-name": /\w+/
          }
        },
        {
          pattern: RegExp(/(\bimport\s+static\s+)/.source + n + /(?:\w+|\*)(?=\s*;)/.source),
          lookbehind: !0,
          alias: "static",
          inside: {
            namespace: d.inside.namespace,
            static: /\b\w+$/,
            punctuation: /\./,
            operator: /\*/,
            "class-name": /\w+/
          }
        }
      ],
      namespace: {
        pattern: RegExp(
          /(\b(?:exports|import(?:\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\s+)(?!<keyword>)[a-z]\w*(?:\.[a-z]\w*)*\.?/.source.replace(/<keyword>/g, function() {
            return a.source;
          })
        ),
        lookbehind: !0,
        inside: {
          punctuation: /\./
        }
      }
    });
  })(Prism);
});

// node_modules/prismjs/components/prism-kotlin.js
var ce = E(() => {
  (function(e) {
    e.languages.kotlin = e.languages.extend("clike", {
      keyword: {
        // The lookbehind prevents wrong highlighting of e.g. kotlin.properties.get
        pattern: /(^|[^.])\b(?:abstract|actual|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|do|dynamic|else|enum|expect|external|final|finally|for|fun|get|if|import|in|infix|init|inline|inner|interface|internal|is|lateinit|noinline|null|object|open|operator|out|override|package|private|protected|public|reified|return|sealed|set|super|suspend|tailrec|this|throw|to|try|typealias|val|var|vararg|when|where|while)\b/,
        lookbehind: !0
      },
      function: [
        {
          pattern: /(?:`[^\r\n`]+`|\b\w+)(?=\s*\()/,
          greedy: !0
        },
        {
          pattern: /(\.)(?:`[^\r\n`]+`|\w+)(?=\s*\{)/,
          lookbehind: !0,
          greedy: !0
        }
      ],
      number: /\b(?:0[xX][\da-fA-F]+(?:_[\da-fA-F]+)*|0[bB][01]+(?:_[01]+)*|\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?[fFL]?)\b/,
      operator: /\+[+=]?|-[-=>]?|==?=?|!(?:!|==?)?|[\/*%<>]=?|[?:]:?|\.\.|&&|\|\||\b(?:and|inv|or|shl|shr|ushr|xor)\b/
    }), delete e.languages.kotlin["class-name"];
    var a = {
      "interpolation-punctuation": {
        pattern: /^\$\{?|\}$/,
        alias: "punctuation"
      },
      expression: {
        pattern: /[\s\S]+/,
        inside: e.languages.kotlin
      }
    };
    e.languages.insertBefore("kotlin", "string", {
      // https://kotlinlang.org/spec/expressions.html#string-interpolation-expressions
      "string-literal": [
        {
          pattern: /"""(?:[^$]|\$(?:(?!\{)|\{[^{}]*\}))*?"""/,
          alias: "multiline",
          inside: {
            interpolation: {
              pattern: /\$(?:[a-z_]\w*|\{[^{}]*\})/i,
              inside: a
            },
            string: /[\s\S]+/
          }
        },
        {
          pattern: /"(?:[^"\\\r\n$]|\\.|\$(?:(?!\{)|\{[^{}]*\}))*"/,
          alias: "singleline",
          inside: {
            interpolation: {
              pattern: /((?:^|[^\\])(?:\\{2})*)\$(?:[a-z_]\w*|\{[^{}]*\})/i,
              lookbehind: !0,
              inside: a
            },
            string: /[\s\S]+/
          }
        }
      ],
      char: {
        // https://kotlinlang.org/spec/expressions.html#character-literals
        pattern: /'(?:[^'\\\r\n]|\\(?:.|u[a-fA-F0-9]{0,4}))'/,
        greedy: !0
      }
    }), delete e.languages.kotlin.string, e.languages.insertBefore("kotlin", "keyword", {
      annotation: {
        pattern: /\B@(?:\w+:)?(?:[A-Z]\w*|\[[^\]]+\])/,
        alias: "builtin"
      }
    }), e.languages.insertBefore("kotlin", "function", {
      label: {
        pattern: /\b\w+@|@\w+\b/,
        alias: "symbol"
      }
    }), e.languages.kt = e.languages.kotlin, e.languages.kts = e.languages.kotlin;
  })(Prism);
});

// node_modules/prismjs/components/prism-swift.js
var de = E(() => {
  Prism.languages.swift = {
    comment: {
      // Nested comments are supported up to 2 levels
      pattern: /(^|[^\\:])(?:\/\/.*|\/\*(?:[^/*]|\/(?!\*)|\*(?!\/)|\/\*(?:[^*]|\*(?!\/))*\*\/)*\*\/)/,
      lookbehind: !0,
      greedy: !0
    },
    "string-literal": [
      // https://docs.swift.org/swift-book/LanguageGuide/StringsAndCharacters.html
      {
        pattern: RegExp(
          /(^|[^"#])/.source + "(?:" + /"(?:\\(?:\((?:[^()]|\([^()]*\))*\)|\r\n|[^(])|[^\\\r\n"])*"/.source + "|" + /"""(?:\\(?:\((?:[^()]|\([^()]*\))*\)|[^(])|[^\\"]|"(?!""))*"""/.source + ")" + /(?!["#])/.source
        ),
        lookbehind: !0,
        greedy: !0,
        inside: {
          interpolation: {
            pattern: /(\\\()(?:[^()]|\([^()]*\))*(?=\))/,
            lookbehind: !0,
            inside: null
            // see below
          },
          "interpolation-punctuation": {
            pattern: /^\)|\\\($/,
            alias: "punctuation"
          },
          punctuation: /\\(?=[\r\n])/,
          string: /[\s\S]+/
        }
      },
      {
        pattern: RegExp(
          /(^|[^"#])(#+)/.source + "(?:" + /"(?:\\(?:#+\((?:[^()]|\([^()]*\))*\)|\r\n|[^#])|[^\\\r\n])*?"/.source + "|" + /"""(?:\\(?:#+\((?:[^()]|\([^()]*\))*\)|[^#])|[^\\])*?"""/.source + ")\\2"
        ),
        lookbehind: !0,
        greedy: !0,
        inside: {
          interpolation: {
            pattern: /(\\#+\()(?:[^()]|\([^()]*\))*(?=\))/,
            lookbehind: !0,
            inside: null
            // see below
          },
          "interpolation-punctuation": {
            pattern: /^\)|\\#+\($/,
            alias: "punctuation"
          },
          string: /[\s\S]+/
        }
      }
    ],
    directive: {
      // directives with conditions
      pattern: RegExp(
        /#/.source + "(?:" + (/(?:elseif|if)\b/.source + "(?:[ 	]*" + /(?:![ \t]*)?(?:\b\w+\b(?:[ \t]*\((?:[^()]|\([^()]*\))*\))?|\((?:[^()]|\([^()]*\))*\))(?:[ \t]*(?:&&|\|\|))?/.source + ")+") + "|" + /(?:else|endif)\b/.source + ")"
      ),
      alias: "property",
      inside: {
        "directive-name": /^#\w+/,
        boolean: /\b(?:false|true)\b/,
        number: /\b\d+(?:\.\d+)*\b/,
        operator: /!|&&|\|\||[<>]=?/,
        punctuation: /[(),]/
      }
    },
    literal: {
      pattern: /#(?:colorLiteral|column|dsohandle|file(?:ID|Literal|Path)?|function|imageLiteral|line)\b/,
      alias: "constant"
    },
    "other-directive": {
      pattern: /#\w+\b/,
      alias: "property"
    },
    attribute: {
      pattern: /@\w+/,
      alias: "atrule"
    },
    "function-definition": {
      pattern: /(\bfunc\s+)\w+/,
      lookbehind: !0,
      alias: "function"
    },
    label: {
      // https://docs.swift.org/swift-book/LanguageGuide/ControlFlow.html#ID141
      pattern: /\b(break|continue)\s+\w+|\b[a-zA-Z_]\w*(?=\s*:\s*(?:for|repeat|while)\b)/,
      lookbehind: !0,
      alias: "important"
    },
    keyword: /\b(?:Any|Protocol|Self|Type|actor|as|assignment|associatedtype|associativity|async|await|break|case|catch|class|continue|convenience|default|defer|deinit|didSet|do|dynamic|else|enum|extension|fallthrough|fileprivate|final|for|func|get|guard|higherThan|if|import|in|indirect|infix|init|inout|internal|is|isolated|lazy|left|let|lowerThan|mutating|none|nonisolated|nonmutating|open|operator|optional|override|postfix|precedencegroup|prefix|private|protocol|public|repeat|required|rethrows|return|right|safe|self|set|some|static|struct|subscript|super|switch|throw|throws|try|typealias|unowned|unsafe|var|weak|where|while|willSet)\b/,
    boolean: /\b(?:false|true)\b/,
    nil: {
      pattern: /\bnil\b/,
      alias: "constant"
    },
    "short-argument": /\$\d+\b/,
    omit: {
      pattern: /\b_\b/,
      alias: "keyword"
    },
    number: /\b(?:[\d_]+(?:\.[\de_]+)?|0x[a-f0-9_]+(?:\.[a-f0-9p_]+)?|0b[01_]+|0o[0-7_]+)\b/i,
    // A class name must start with an upper-case letter and be either 1 letter long or contain a lower-case letter.
    "class-name": /\b[A-Z](?:[A-Z_\d]*[a-z]\w*)?\b/,
    function: /\b[a-z_]\w*(?=\s*\()/i,
    constant: /\b(?:[A-Z_]{2,}|k[A-Z][A-Za-z_]+)\b/,
    // Operators are generic in Swift. Developers can even create new operators (e.g. +++).
    // https://docs.swift.org/swift-book/ReferenceManual/zzSummaryOfTheGrammar.html#ID481
    // This regex only supports ASCII operators.
    operator: /[-+*/%=!<>&|^~?]+|\.[.\-+*/%=!<>&|^~?]+/,
    punctuation: /[{}[\]();,.:\\]/
  };
  Prism.languages.swift["string-literal"].forEach(function(e) {
    e.inside.interpolation.inside = Prism.languages.swift;
  });
});

// node_modules/prismjs/components/prism-c.js
var pe = E(() => {
  Prism.languages.c = Prism.languages.extend("clike", {
    comment: {
      pattern: /\/\/(?:[^\r\n\\]|\\(?:\r\n?|\n|(?![\r\n])))*|\/\*[\s\S]*?(?:\*\/|$)/,
      greedy: !0
    },
    string: {
      // https://en.cppreference.com/w/c/language/string_literal
      pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
      greedy: !0
    },
    "class-name": {
      pattern: /(\b(?:enum|struct)\s+(?:__attribute__\s*\(\([\s\S]*?\)\)\s*)?)\w+|\b[a-z]\w*_t\b/,
      lookbehind: !0
    },
    keyword: /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|__attribute__|asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|typeof|union|unsigned|void|volatile|while)\b/,
    function: /\b[a-z_]\w*(?=\s*\()/i,
    number: /(?:\b0x(?:[\da-f]+(?:\.[\da-f]*)?|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?)[ful]{0,4}/i,
    operator: />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/
  });
  Prism.languages.insertBefore("c", "string", {
    char: {
      // https://en.cppreference.com/w/c/language/character_constant
      pattern: /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n]){0,32}'/,
      greedy: !0
    }
  });
  Prism.languages.insertBefore("c", "string", {
    macro: {
      // allow for multiline macro definitions
      // spaces after the # character compile fine with gcc
      pattern: /(^[\t ]*)#\s*[a-z](?:[^\r\n\\/]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|\\(?:\r\n|[\s\S]))*/im,
      lookbehind: !0,
      greedy: !0,
      alias: "property",
      inside: {
        string: [
          {
            // highlight the path of the include statement as a string
            pattern: /^(#\s*include\s*)<[^>]+>/,
            lookbehind: !0
          },
          Prism.languages.c.string
        ],
        char: Prism.languages.c.char,
        comment: Prism.languages.c.comment,
        "macro-name": [
          {
            pattern: /(^#\s*define\s+)\w+\b(?!\()/i,
            lookbehind: !0
          },
          {
            pattern: /(^#\s*define\s+)\w+\b(?=\()/i,
            lookbehind: !0,
            alias: "function"
          }
        ],
        // highlight macro directives as keywords
        directive: {
          pattern: /^(#\s*)[a-z]+/,
          lookbehind: !0,
          alias: "keyword"
        },
        "directive-hash": /^#/,
        punctuation: /##|\\(?=[\r\n])/,
        expression: {
          pattern: /\S[\s\S]*/,
          inside: Prism.languages.c
        }
      }
    }
  });
  Prism.languages.insertBefore("c", "function", {
    // highlight predefined macros as constants
    constant: /\b(?:EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|__DATE__|__FILE__|__LINE__|__TIMESTAMP__|__TIME__|__func__|stderr|stdin|stdout)\b/
  });
  delete Prism.languages.c.boolean;
});

// node_modules/prismjs/components/prism-cpp.js
var ge = E(() => {
  (function(e) {
    var a = /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|char8_t|class|co_await|co_return|co_yield|compl|concept|const|const_cast|consteval|constexpr|constinit|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|final|float|for|friend|goto|if|import|inline|int|int16_t|int32_t|int64_t|int8_t|long|module|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|uint16_t|uint32_t|uint64_t|uint8_t|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/, n = /\b(?!<keyword>)\w+(?:\s*\.\s*\w+)*\b/.source.replace(/<keyword>/g, function() {
      return a.source;
    });
    e.languages.cpp = e.languages.extend("c", {
      "class-name": [
        {
          pattern: RegExp(/(\b(?:class|concept|enum|struct|typename)\s+)(?!<keyword>)\w+/.source.replace(/<keyword>/g, function() {
            return a.source;
          })),
          lookbehind: !0
        },
        // This is intended to capture the class name of method implementations like:
        //   void foo::bar() const {}
        // However! The `foo` in the above example could also be a namespace, so we only capture the class name if
        // it starts with an uppercase letter. This approximation should give decent results.
        /\b[A-Z]\w*(?=\s*::\s*\w+\s*\()/,
        // This will capture the class name before destructors like:
        //   Foo::~Foo() {}
        /\b[A-Z_]\w*(?=\s*::\s*~\w+\s*\()/i,
        // This also intends to capture the class name of method implementations but here the class has template
        // parameters, so it can't be a namespace (until C++ adds generic namespaces).
        /\b\w+(?=\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>\s*::\s*\w+\s*\()/
      ],
      keyword: a,
      number: {
        pattern: /(?:\b0b[01']+|\b0x(?:[\da-f']+(?:\.[\da-f']*)?|\.[\da-f']+)(?:p[+-]?[\d']+)?|(?:\b[\d']+(?:\.[\d']*)?|\B\.[\d']+)(?:e[+-]?[\d']+)?)[ful]{0,4}/i,
        greedy: !0
      },
      operator: />>=?|<<=?|->|--|\+\+|&&|\|\||[?:~]|<=>|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/,
      boolean: /\b(?:false|true)\b/
    }), e.languages.insertBefore("cpp", "string", {
      module: {
        // https://en.cppreference.com/w/cpp/language/modules
        pattern: RegExp(
          /(\b(?:import|module)\s+)/.source + "(?:" + // header-name
          /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|<[^<>\r\n]*>/.source + "|" + // module name or partition or both
          /<mod-name>(?:\s*:\s*<mod-name>)?|:\s*<mod-name>/.source.replace(/<mod-name>/g, function() {
            return n;
          }) + ")"
        ),
        lookbehind: !0,
        greedy: !0,
        inside: {
          string: /^[<"][\s\S]+/,
          operator: /:/,
          punctuation: /\./
        }
      },
      "raw-string": {
        pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/,
        alias: "string",
        greedy: !0
      }
    }), e.languages.insertBefore("cpp", "keyword", {
      "generic-function": {
        pattern: /\b(?!operator\b)[a-z_]\w*\s*<(?:[^<>]|<[^<>]*>)*>(?=\s*\()/i,
        inside: {
          function: /^\w+/,
          generic: {
            pattern: /<[\s\S]+/,
            alias: "class-name",
            inside: e.languages.cpp
          }
        }
      }
    }), e.languages.insertBefore("cpp", "operator", {
      "double-colon": {
        pattern: /::/,
        alias: "punctuation"
      }
    }), e.languages.insertBefore("cpp", "class-name", {
      // the base clause is an optional list of parent classes
      // https://en.cppreference.com/w/cpp/language/class
      "base-clause": {
        pattern: /(\b(?:class|struct)\s+\w+\s*:\s*)[^;{}"'\s]+(?:\s+[^;{}"'\s]+)*(?=\s*[;{])/,
        lookbehind: !0,
        greedy: !0,
        inside: e.languages.extend("cpp", {})
      }
    }), e.languages.insertBefore("inside", "double-colon", {
      // All untokenized words that are not namespaces should be class names
      "class-name": /\b[a-z_]\w*\b(?!\s*::)/i
    }, e.languages.cpp["base-clause"]);
  })(Prism);
});

// node_modules/prismjs/components/prism-csharp.js
var be = E(() => {
  (function(e) {
    function a(v, O) {
      return v.replace(/<<(\d+)>>/g, function(R, $) {
        return "(?:" + O[+$] + ")";
      });
    }
    function n(v, O, R) {
      return RegExp(a(v, O), R || "");
    }
    function d(v, O) {
      for (var R = 0; R < O; R++)
        v = v.replace(/<<self>>/g, function() {
          return "(?:" + v + ")";
        });
      return v.replace(/<<self>>/g, "[^\\s\\S]");
    }
    var i = {
      // keywords which represent a return or variable type
      type: "bool byte char decimal double dynamic float int long object sbyte short string uint ulong ushort var void",
      // keywords which are used to declare a type
      typeDeclaration: "class enum interface record struct",
      // contextual keywords
      // ("var" and "dynamic" are missing because they are used like types)
      contextual: "add alias and ascending async await by descending from(?=\\s*(?:\\w|$)) get global group into init(?=\\s*;) join let nameof not notnull on or orderby partial remove select set unmanaged value when where with(?=\\s*{)",
      // all other keywords
      other: "abstract as base break case catch checked const continue default delegate do else event explicit extern finally fixed for foreach goto if implicit in internal is lock namespace new null operator out override params private protected public readonly ref return sealed sizeof stackalloc static switch this throw try typeof unchecked unsafe using virtual volatile while yield"
    };
    function b(v) {
      return "\\b(?:" + v.trim().replace(/ /g, "|") + ")\\b";
    }
    var f = b(i.typeDeclaration), h = RegExp(b(i.type + " " + i.typeDeclaration + " " + i.contextual + " " + i.other)), c = b(i.typeDeclaration + " " + i.contextual + " " + i.other), g = b(i.type + " " + i.typeDeclaration + " " + i.other), w = d(/<(?:[^<>;=+\-*/%&|^]|<<self>>)*>/.source, 2), y = d(/\((?:[^()]|<<self>>)*\)/.source, 2), S = /@?\b[A-Za-z_]\w*\b/.source, _ = a(/<<0>>(?:\s*<<1>>)?/.source, [S, w]), T = a(/(?!<<0>>)<<1>>(?:\s*\.\s*<<1>>)*/.source, [c, _]), r = /\[\s*(?:,\s*)*\]/.source, t = a(/<<0>>(?:\s*(?:\?\s*)?<<1>>)*(?:\s*\?)?/.source, [T, r]), o = a(/[^,()<>[\];=+\-*/%&|^]|<<0>>|<<1>>|<<2>>/.source, [w, y, r]), s = a(/\(<<0>>+(?:,<<0>>+)+\)/.source, [o]), u = a(/(?:<<0>>|<<1>>)(?:\s*(?:\?\s*)?<<2>>)*(?:\s*\?)?/.source, [s, T, r]), l = {
      keyword: h,
      punctuation: /[<>()?,.:[\]]/
    }, m = /'(?:[^\r\n'\\]|\\.|\\[Uux][\da-fA-F]{1,8})'/.source, p = /"(?:\\.|[^\\"\r\n])*"/.source, x = /@"(?:""|\\[\s\S]|[^\\"])*"(?!")/.source;
    e.languages.csharp = e.languages.extend("clike", {
      string: [
        {
          pattern: n(/(^|[^$\\])<<0>>/.source, [x]),
          lookbehind: !0,
          greedy: !0
        },
        {
          pattern: n(/(^|[^@$\\])<<0>>/.source, [p]),
          lookbehind: !0,
          greedy: !0
        }
      ],
      "class-name": [
        {
          // Using static
          // using static System.Math;
          pattern: n(/(\busing\s+static\s+)<<0>>(?=\s*;)/.source, [T]),
          lookbehind: !0,
          inside: l
        },
        {
          // Using alias (type)
          // using Project = PC.MyCompany.Project;
          pattern: n(/(\busing\s+<<0>>\s*=\s*)<<1>>(?=\s*;)/.source, [S, u]),
          lookbehind: !0,
          inside: l
        },
        {
          // Using alias (alias)
          // using Project = PC.MyCompany.Project;
          pattern: n(/(\busing\s+)<<0>>(?=\s*=)/.source, [S]),
          lookbehind: !0
        },
        {
          // Type declarations
          // class Foo<A, B>
          // interface Foo<out A, B>
          pattern: n(/(\b<<0>>\s+)<<1>>/.source, [f, _]),
          lookbehind: !0,
          inside: l
        },
        {
          // Single catch exception declaration
          // catch(Foo)
          // (things like catch(Foo e) is covered by variable declaration)
          pattern: n(/(\bcatch\s*\(\s*)<<0>>/.source, [T]),
          lookbehind: !0,
          inside: l
        },
        {
          // Name of the type parameter of generic constraints
          // where Foo : class
          pattern: n(/(\bwhere\s+)<<0>>/.source, [S]),
          lookbehind: !0
        },
        {
          // Casts and checks via as and is.
          // as Foo<A>, is Bar<B>
          // (things like if(a is Foo b) is covered by variable declaration)
          pattern: n(/(\b(?:is(?:\s+not)?|as)\s+)<<0>>/.source, [t]),
          lookbehind: !0,
          inside: l
        },
        {
          // Variable, field and parameter declaration
          // (Foo bar, Bar baz, Foo[,,] bay, Foo<Bar, FooBar<Bar>> bax)
          pattern: n(/\b<<0>>(?=\s+(?!<<1>>|with\s*\{)<<2>>(?:\s*[=,;:{)\]]|\s+(?:in|when)\b))/.source, [u, g, S]),
          inside: l
        }
      ],
      keyword: h,
      // https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/lexical-structure#literals
      number: /(?:\b0(?:x[\da-f_]*[\da-f]|b[01_]*[01])|(?:\B\.\d+(?:_+\d+)*|\b\d+(?:_+\d+)*(?:\.\d+(?:_+\d+)*)?)(?:e[-+]?\d+(?:_+\d+)*)?)(?:[dflmu]|lu|ul)?\b/i,
      operator: />>=?|<<=?|[-=]>|([-+&|])\1|~|\?\?=?|[-+*/%&|^!=<>]=?/,
      punctuation: /\?\.?|::|[{}[\];(),.:]/
    }), e.languages.insertBefore("csharp", "number", {
      range: {
        pattern: /\.\./,
        alias: "operator"
      }
    }), e.languages.insertBefore("csharp", "punctuation", {
      "named-parameter": {
        pattern: n(/([(,]\s*)<<0>>(?=\s*:)/.source, [S]),
        lookbehind: !0,
        alias: "punctuation"
      }
    }), e.languages.insertBefore("csharp", "class-name", {
      namespace: {
        // namespace Foo.Bar {}
        // using Foo.Bar;
        pattern: n(/(\b(?:namespace|using)\s+)<<0>>(?:\s*\.\s*<<0>>)*(?=\s*[;{])/.source, [S]),
        lookbehind: !0,
        inside: {
          punctuation: /\./
        }
      },
      "type-expression": {
        // default(Foo), typeof(Foo<Bar>), sizeof(int)
        pattern: n(/(\b(?:default|sizeof|typeof)\s*\(\s*(?!\s))(?:[^()\s]|\s(?!\s)|<<0>>)*(?=\s*\))/.source, [y]),
        lookbehind: !0,
        alias: "class-name",
        inside: l
      },
      "return-type": {
        // Foo<Bar> ForBar(); Foo IFoo.Bar() => 0
        // int this[int index] => 0; T IReadOnlyList<T>.this[int index] => this[index];
        // int Foo => 0; int Foo { get; set } = 0;
        pattern: n(/<<0>>(?=\s+(?:<<1>>\s*(?:=>|[({]|\.\s*this\s*\[)|this\s*\[))/.source, [u, T]),
        inside: l,
        alias: "class-name"
      },
      "constructor-invocation": {
        // new List<Foo<Bar[]>> { }
        pattern: n(/(\bnew\s+)<<0>>(?=\s*[[({])/.source, [u]),
        lookbehind: !0,
        inside: l,
        alias: "class-name"
      },
      /*'explicit-implementation': {
      	// int IFoo<Foo>.Bar => 0; void IFoo<Foo<Foo>>.Foo<T>();
      	pattern: replace(/\b<<0>>(?=\.<<1>>)/, className, methodOrPropertyDeclaration),
      	inside: classNameInside,
      	alias: 'class-name'
      },*/
      "generic-method": {
        // foo<Bar>()
        pattern: n(/<<0>>\s*<<1>>(?=\s*\()/.source, [S, w]),
        inside: {
          function: n(/^<<0>>/.source, [S]),
          generic: {
            pattern: RegExp(w),
            alias: "class-name",
            inside: l
          }
        }
      },
      "type-list": {
        // The list of types inherited or of generic constraints
        // class Foo<F> : Bar, IList<FooBar>
        // where F : Bar, IList<int>
        pattern: n(
          /\b((?:<<0>>\s+<<1>>|record\s+<<1>>\s*<<5>>|where\s+<<2>>)\s*:\s*)(?:<<3>>|<<4>>|<<1>>\s*<<5>>|<<6>>)(?:\s*,\s*(?:<<3>>|<<4>>|<<6>>))*(?=\s*(?:where|[{;]|=>|$))/.source,
          [f, _, S, u, h.source, y, /\bnew\s*\(\s*\)/.source]
        ),
        lookbehind: !0,
        inside: {
          "record-arguments": {
            pattern: n(/(^(?!new\s*\()<<0>>\s*)<<1>>/.source, [_, y]),
            lookbehind: !0,
            greedy: !0,
            inside: e.languages.csharp
          },
          keyword: h,
          "class-name": {
            pattern: RegExp(u),
            greedy: !0,
            inside: l
          },
          punctuation: /[,()]/
        }
      },
      preprocessor: {
        pattern: /(^[\t ]*)#.*/m,
        lookbehind: !0,
        alias: "property",
        inside: {
          // highlight preprocessor directives as keywords
          directive: {
            pattern: /(#)\b(?:define|elif|else|endif|endregion|error|if|line|nullable|pragma|region|undef|warning)\b/,
            lookbehind: !0,
            alias: "keyword"
          }
        }
      }
    });
    var A = p + "|" + m, F = a(/\/(?![*/])|\/\/[^\r\n]*[\r\n]|\/\*(?:[^*]|\*(?!\/))*\*\/|<<0>>/.source, [A]), C = d(a(/[^"'/()]|<<0>>|\(<<self>>*\)/.source, [F]), 2), D = /\b(?:assembly|event|field|method|module|param|property|return|type)\b/.source, Z = a(/<<0>>(?:\s*\(<<1>>*\))?/.source, [T, C]);
    e.languages.insertBefore("csharp", "class-name", {
      attribute: {
        // Attributes
        // [Foo], [Foo(1), Bar(2, Prop = "foo")], [return: Foo(1), Bar(2)], [assembly: Foo(Bar)]
        pattern: n(/((?:^|[^\s\w>)?])\s*\[\s*)(?:<<0>>\s*:\s*)?<<1>>(?:\s*,\s*<<1>>)*(?=\s*\])/.source, [D, Z]),
        lookbehind: !0,
        greedy: !0,
        inside: {
          target: {
            pattern: n(/^<<0>>(?=\s*:)/.source, [D]),
            alias: "keyword"
          },
          "attribute-arguments": {
            pattern: n(/\(<<0>>*\)/.source, [C]),
            inside: e.languages.csharp
          },
          "class-name": {
            pattern: RegExp(T),
            inside: {
              punctuation: /\./
            }
          },
          punctuation: /[:,]/
        }
      }
    });
    var z = /:[^}\r\n]+/.source, P = d(a(/[^"'/()]|<<0>>|\(<<self>>*\)/.source, [F]), 2), k = a(/\{(?!\{)(?:(?![}:])<<0>>)*<<1>>?\}/.source, [P, z]), I = d(a(/[^"'/()]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|<<0>>|\(<<self>>*\)/.source, [A]), 2), N = a(/\{(?!\{)(?:(?![}:])<<0>>)*<<1>>?\}/.source, [I, z]);
    function L(v, O) {
      return {
        interpolation: {
          pattern: n(/((?:^|[^{])(?:\{\{)*)<<0>>/.source, [v]),
          lookbehind: !0,
          inside: {
            "format-string": {
              pattern: n(/(^\{(?:(?![}:])<<0>>)*)<<1>>(?=\}$)/.source, [O, z]),
              lookbehind: !0,
              inside: {
                punctuation: /^:/
              }
            },
            punctuation: /^\{|\}$/,
            expression: {
              pattern: /[\s\S]+/,
              alias: "language-csharp",
              inside: e.languages.csharp
            }
          }
        },
        string: /[\s\S]+/
      };
    }
    e.languages.insertBefore("csharp", "string", {
      "interpolation-string": [
        {
          pattern: n(/(^|[^\\])(?:\$@|@\$)"(?:""|\\[\s\S]|\{\{|<<0>>|[^\\{"])*"/.source, [k]),
          lookbehind: !0,
          greedy: !0,
          inside: L(k, P)
        },
        {
          pattern: n(/(^|[^@\\])\$"(?:\\.|\{\{|<<0>>|[^\\"{])*"/.source, [N]),
          lookbehind: !0,
          greedy: !0,
          inside: L(N, I)
        }
      ],
      char: {
        pattern: RegExp(m),
        greedy: !0
      }
    }), e.languages.dotnet = e.languages.cs = e.languages.csharp;
  })(Prism);
});

// node_modules/prismjs/components/prism-ruby.js
var fe = E(() => {
  (function(e) {
    e.languages.ruby = e.languages.extend("clike", {
      comment: {
        pattern: /#.*|^=begin\s[\s\S]*?^=end/m,
        greedy: !0
      },
      "class-name": {
        pattern: /(\b(?:class|module)\s+|\bcatch\s+\()[\w.\\]+|\b[A-Z_]\w*(?=\s*\.\s*new\b)/,
        lookbehind: !0,
        inside: {
          punctuation: /[.\\]/
        }
      },
      keyword: /\b(?:BEGIN|END|alias|and|begin|break|case|class|def|define_method|defined|do|each|else|elsif|end|ensure|extend|for|if|in|include|module|new|next|nil|not|or|prepend|private|protected|public|raise|redo|require|rescue|retry|return|self|super|then|throw|undef|unless|until|when|while|yield)\b/,
      operator: /\.{2,3}|&\.|===|<?=>|[!=]?~|(?:&&|\|\||<<|>>|\*\*|[+\-*/%<>!^&|=])=?|[?:]/,
      punctuation: /[(){}[\].,;]/
    }), e.languages.insertBefore("ruby", "operator", {
      "double-colon": {
        pattern: /::/,
        alias: "punctuation"
      }
    });
    var a = {
      pattern: /((?:^|[^\\])(?:\\{2})*)#\{(?:[^{}]|\{[^{}]*\})*\}/,
      lookbehind: !0,
      inside: {
        content: {
          pattern: /^(#\{)[\s\S]+(?=\}$)/,
          lookbehind: !0,
          inside: e.languages.ruby
        },
        delimiter: {
          pattern: /^#\{|\}$/,
          alias: "punctuation"
        }
      }
    };
    delete e.languages.ruby.function;
    var n = "(?:" + [
      /([^a-zA-Z0-9\s{(\[<=])(?:(?!\1)[^\\]|\\[\s\S])*\1/.source,
      /\((?:[^()\\]|\\[\s\S]|\((?:[^()\\]|\\[\s\S])*\))*\)/.source,
      /\{(?:[^{}\\]|\\[\s\S]|\{(?:[^{}\\]|\\[\s\S])*\})*\}/.source,
      /\[(?:[^\[\]\\]|\\[\s\S]|\[(?:[^\[\]\\]|\\[\s\S])*\])*\]/.source,
      /<(?:[^<>\\]|\\[\s\S]|<(?:[^<>\\]|\\[\s\S])*>)*>/.source
    ].join("|") + ")", d = /(?:"(?:\\.|[^"\\\r\n])*"|(?:\b[a-zA-Z_]\w*|[^\s\0-\x7F]+)[?!]?|\$.)/.source;
    e.languages.insertBefore("ruby", "keyword", {
      "regex-literal": [
        {
          pattern: RegExp(/%r/.source + n + /[egimnosux]{0,6}/.source),
          greedy: !0,
          inside: {
            interpolation: a,
            regex: /[\s\S]+/
          }
        },
        {
          pattern: /(^|[^/])\/(?!\/)(?:\[[^\r\n\]]+\]|\\.|[^[/\\\r\n])+\/[egimnosux]{0,6}(?=\s*(?:$|[\r\n,.;})#]))/,
          lookbehind: !0,
          greedy: !0,
          inside: {
            interpolation: a,
            regex: /[\s\S]+/
          }
        }
      ],
      variable: /[@$]+[a-zA-Z_]\w*(?:[?!]|\b)/,
      symbol: [
        {
          pattern: RegExp(/(^|[^:]):/.source + d),
          lookbehind: !0,
          greedy: !0
        },
        {
          pattern: RegExp(/([\r\n{(,][ \t]*)/.source + d + /(?=:(?!:))/.source),
          lookbehind: !0,
          greedy: !0
        }
      ],
      "method-definition": {
        pattern: /(\bdef\s+)\w+(?:\s*\.\s*\w+)?/,
        lookbehind: !0,
        inside: {
          function: /\b\w+$/,
          keyword: /^self\b/,
          "class-name": /^\w+/,
          punctuation: /\./
        }
      }
    }), e.languages.insertBefore("ruby", "string", {
      "string-literal": [
        {
          pattern: RegExp(/%[qQiIwWs]?/.source + n),
          greedy: !0,
          inside: {
            interpolation: a,
            string: /[\s\S]+/
          }
        },
        {
          pattern: /("|')(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|(?!\1)[^\\#\r\n])*\1/,
          greedy: !0,
          inside: {
            interpolation: a,
            string: /[\s\S]+/
          }
        },
        {
          pattern: /<<[-~]?([a-z_]\w*)[\r\n](?:.*[\r\n])*?[\t ]*\1/i,
          alias: "heredoc-string",
          greedy: !0,
          inside: {
            delimiter: {
              pattern: /^<<[-~]?[a-z_]\w*|\b[a-z_]\w*$/i,
              inside: {
                symbol: /\b\w+/,
                punctuation: /^<<[-~]?/
              }
            },
            interpolation: a,
            string: /[\s\S]+/
          }
        },
        {
          pattern: /<<[-~]?'([a-z_]\w*)'[\r\n](?:.*[\r\n])*?[\t ]*\1/i,
          alias: "heredoc-string",
          greedy: !0,
          inside: {
            delimiter: {
              pattern: /^<<[-~]?'[a-z_]\w*'|\b[a-z_]\w*$/i,
              inside: {
                symbol: /\b\w+/,
                punctuation: /^<<[-~]?'|'$/
              }
            },
            string: /[\s\S]+/
          }
        }
      ],
      "command-literal": [
        {
          pattern: RegExp(/%x/.source + n),
          greedy: !0,
          inside: {
            interpolation: a,
            command: {
              pattern: /[\s\S]+/,
              alias: "string"
            }
          }
        },
        {
          pattern: /`(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|[^\\`#\r\n])*`/,
          greedy: !0,
          inside: {
            interpolation: a,
            command: {
              pattern: /[\s\S]+/,
              alias: "string"
            }
          }
        }
      ]
    }), delete e.languages.ruby.string, e.languages.insertBefore("ruby", "number", {
      builtin: /\b(?:Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Fixnum|Float|Hash|IO|Integer|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|Stat|String|Struct|Symbol|TMS|Thread|ThreadGroup|Time|TrueClass)\b/,
      constant: /\b[A-Z][A-Z0-9_]*(?:[?!]|\b)/
    }), e.languages.rb = e.languages.ruby;
  })(Prism);
});

// node_modules/prismjs/components/prism-json.js
var he = E(() => {
  Prism.languages.json = {
    property: {
      pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
      lookbehind: !0,
      greedy: !0
    },
    string: {
      pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
      lookbehind: !0,
      greedy: !0
    },
    comment: {
      pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
      greedy: !0
    },
    number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
    punctuation: /[{}[\],]/,
    operator: /:/,
    boolean: /\b(?:false|true)\b/,
    null: {
      pattern: /\bnull\b/,
      alias: "keyword"
    }
  };
  Prism.languages.webmanifest = Prism.languages.json;
});

// node_modules/prismjs/components/prism-yaml.js
var me = E(() => {
  (function(e) {
    var a = /[*&][^\s[\]{},]+/, n = /!(?:<[\w\-%#;/?:@&=+$,.!~*'()[\]]+>|(?:[a-zA-Z\d-]*!)?[\w\-%#;/?:@&=+$.~*'()]+)?/, d = "(?:" + n.source + "(?:[ 	]+" + a.source + ")?|" + a.source + "(?:[ 	]+" + n.source + ")?)", i = /(?:[^\s\x00-\x08\x0e-\x1f!"#%&'*,\-:>?@[\]`{|}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]|[?:-]<PLAIN>)(?:[ \t]*(?:(?![#:])<PLAIN>|:<PLAIN>))*/.source.replace(/<PLAIN>/g, function() {
      return /[^\s\x00-\x08\x0e-\x1f,[\]{}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]/.source;
    }), b = /"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*'/.source;
    function f(h, c) {
      c = (c || "").replace(/m/g, "") + "m";
      var g = /([:\-,[{]\s*(?:\s<<prop>>[ \t]+)?)(?:<<value>>)(?=[ \t]*(?:$|,|\]|\}|(?:[\r\n]\s*)?#))/.source.replace(/<<prop>>/g, function() {
        return d;
      }).replace(/<<value>>/g, function() {
        return h;
      });
      return RegExp(g, c);
    }
    e.languages.yaml = {
      scalar: {
        pattern: RegExp(/([\-:]\s*(?:\s<<prop>>[ \t]+)?[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)\S[^\r\n]*(?:\2[^\r\n]+)*)/.source.replace(/<<prop>>/g, function() {
          return d;
        })),
        lookbehind: !0,
        alias: "string"
      },
      comment: /#.*/,
      key: {
        pattern: RegExp(/((?:^|[:\-,[{\r\n?])[ \t]*(?:<<prop>>[ \t]+)?)<<key>>(?=\s*:\s)/.source.replace(/<<prop>>/g, function() {
          return d;
        }).replace(/<<key>>/g, function() {
          return "(?:" + i + "|" + b + ")";
        })),
        lookbehind: !0,
        greedy: !0,
        alias: "atrule"
      },
      directive: {
        pattern: /(^[ \t]*)%.+/m,
        lookbehind: !0,
        alias: "important"
      },
      datetime: {
        pattern: f(/\d{4}-\d\d?-\d\d?(?:[tT]|[ \t]+)\d\d?:\d{2}:\d{2}(?:\.\d*)?(?:[ \t]*(?:Z|[-+]\d\d?(?::\d{2})?))?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(?::\d{2}(?:\.\d*)?)?/.source),
        lookbehind: !0,
        alias: "number"
      },
      boolean: {
        pattern: f(/false|true/.source, "i"),
        lookbehind: !0,
        alias: "important"
      },
      null: {
        pattern: f(/null|~/.source, "i"),
        lookbehind: !0,
        alias: "important"
      },
      string: {
        pattern: f(b),
        lookbehind: !0,
        greedy: !0
      },
      number: {
        pattern: f(/[+-]?(?:0x[\da-f]+|0o[0-7]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|\.inf|\.nan)/.source, "i"),
        lookbehind: !0
      },
      tag: n,
      important: a,
      punctuation: /---|[:[\]{}\-,|>?]|\.\.\./
    }, e.languages.yml = e.languages.yaml;
  })(Prism);
});

// node_modules/prismjs/components/prism-toml.js
var ye = E(() => {
  (function(e) {
    var a = /(?:[\w-]+|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*")/.source;
    function n(d) {
      return d.replace(/__/g, function() {
        return a;
      });
    }
    e.languages.toml = {
      comment: {
        pattern: /#.*/,
        greedy: !0
      },
      table: {
        pattern: RegExp(n(/(^[\t ]*\[\s*(?:\[\s*)?)__(?:\s*\.\s*__)*(?=\s*\])/.source), "m"),
        lookbehind: !0,
        greedy: !0,
        alias: "class-name"
      },
      key: {
        pattern: RegExp(n(/(^[\t ]*|[{,]\s*)__(?:\s*\.\s*__)*(?=\s*=)/.source), "m"),
        lookbehind: !0,
        greedy: !0,
        alias: "property"
      },
      string: {
        pattern: /"""(?:\\[\s\S]|[^\\])*?"""|'''[\s\S]*?'''|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*"/,
        greedy: !0
      },
      date: [
        {
          // Offset Date-Time, Local Date-Time, Local Date
          pattern: /\b\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?\b/i,
          alias: "number"
        },
        {
          // Local Time
          pattern: /\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/,
          alias: "number"
        }
      ],
      number: /(?:\b0(?:x[\da-zA-Z]+(?:_[\da-zA-Z]+)*|o[0-7]+(?:_[0-7]+)*|b[10]+(?:_[10]+)*))\b|[-+]?\b\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?\b|[-+]?\b(?:inf|nan)\b/,
      boolean: /\b(?:false|true)\b/,
      punctuation: /[.,=[\]{}]/
    };
  })(Prism);
});

// node_modules/prismjs/components/prism-sql.js
var Ee = E(() => {
  Prism.languages.sql = {
    comment: {
      pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,
      lookbehind: !0
    },
    variable: [
      {
        pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,
        greedy: !0
      },
      /@[\w.$]+/
    ],
    string: {
      pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,
      greedy: !0,
      lookbehind: !0
    },
    identifier: {
      pattern: /(^|[^@\\])`(?:\\[\s\S]|[^`\\]|``)*`/,
      greedy: !0,
      lookbehind: !0,
      inside: {
        punctuation: /^`|`$/
      }
    },
    function: /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i,
    // Should we highlight user defined functions too?
    keyword: /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:COL|_INSERT)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN(?:ING|S)?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i,
    boolean: /\b(?:FALSE|NULL|TRUE)\b/i,
    number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i,
    operator: /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|DIV|ILIKE|IN|IS|LIKE|NOT|OR|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,
    punctuation: /[;[\]()`,.]/
  };
});

// node_modules/prismjs/components/prism-diff.js
var we = E(() => {
  (function(e) {
    e.languages.diff = {
      coord: [
        // Match all kinds of coord lines (prefixed by "+++", "---" or "***").
        /^(?:\*{3}|-{3}|\+{3}).*$/m,
        // Match "@@ ... @@" coord lines in unified diff.
        /^@@.*@@$/m,
        // Match coord lines in normal diff (starts with a number).
        /^\d.*$/m
      ]
      // deleted, inserted, unchanged, diff
    };
    var a = {
      "deleted-sign": "-",
      "deleted-arrow": "<",
      "inserted-sign": "+",
      "inserted-arrow": ">",
      unchanged: " ",
      diff: "!"
    };
    Object.keys(a).forEach(function(n) {
      var d = a[n], i = [];
      /^\w+$/.test(n) || i.push(/\w+/.exec(n)[0]), n === "diff" && i.push("bold"), e.languages.diff[n] = {
        pattern: RegExp("^(?:[" + d + `].*(?:\r
?|
|(?![\\s\\S])))+`, "m"),
        alias: i,
        inside: {
          line: {
            pattern: /(.)(?=[\s\S]).*(?:\r\n?|\n)?/,
            lookbehind: !0
          },
          prefix: {
            pattern: /[\s\S]/,
            alias: /\w+/.exec(n)[0]
          }
        }
      };
    }), Object.defineProperty(e.languages.diff, "PREFIXES", {
      value: a
    });
  })(Prism);
});

// node_modules/prismjs/components/prism-docker.js
var ve = E(() => {
  (function(e) {
    var a = /\\[\r\n](?:\s|\\[\r\n]|#.*(?!.))*(?![\s#]|\\[\r\n])/.source, n = /(?:[ \t]+(?![ \t])(?:<SP_BS>)?|<SP_BS>)/.source.replace(/<SP_BS>/g, function() {
      return a;
    }), d = /"(?:[^"\\\r\n]|\\(?:\r\n|[\s\S]))*"|'(?:[^'\\\r\n]|\\(?:\r\n|[\s\S]))*'/.source, i = /--[\w-]+=(?:<STR>|(?!["'])(?:[^\s\\]|\\.)+)/.source.replace(/<STR>/g, function() {
      return d;
    }), b = {
      pattern: RegExp(d),
      greedy: !0
    }, f = {
      pattern: /(^[ \t]*)#.*/m,
      lookbehind: !0,
      greedy: !0
    };
    function h(c, g) {
      return c = c.replace(/<OPT>/g, function() {
        return i;
      }).replace(/<SP>/g, function() {
        return n;
      }), RegExp(c, g);
    }
    e.languages.docker = {
      instruction: {
        pattern: /(^[ \t]*)(?:ADD|ARG|CMD|COPY|ENTRYPOINT|ENV|EXPOSE|FROM|HEALTHCHECK|LABEL|MAINTAINER|ONBUILD|RUN|SHELL|STOPSIGNAL|USER|VOLUME|WORKDIR)(?=\s)(?:\\.|[^\r\n\\])*(?:\\$(?:\s|#.*$)*(?![\s#])(?:\\.|[^\r\n\\])*)*/im,
        lookbehind: !0,
        greedy: !0,
        inside: {
          options: {
            pattern: h(/(^(?:ONBUILD<SP>)?\w+<SP>)<OPT>(?:<SP><OPT>)*/.source, "i"),
            lookbehind: !0,
            greedy: !0,
            inside: {
              property: {
                pattern: /(^|\s)--[\w-]+/,
                lookbehind: !0
              },
              string: [
                b,
                {
                  pattern: /(=)(?!["'])(?:[^\s\\]|\\.)+/,
                  lookbehind: !0
                }
              ],
              operator: /\\$/m,
              punctuation: /=/
            }
          },
          keyword: [
            {
              // https://docs.docker.com/engine/reference/builder/#healthcheck
              pattern: h(/(^(?:ONBUILD<SP>)?HEALTHCHECK<SP>(?:<OPT><SP>)*)(?:CMD|NONE)\b/.source, "i"),
              lookbehind: !0,
              greedy: !0
            },
            {
              // https://docs.docker.com/engine/reference/builder/#from
              pattern: h(/(^(?:ONBUILD<SP>)?FROM<SP>(?:<OPT><SP>)*(?!--)[^ \t\\]+<SP>)AS/.source, "i"),
              lookbehind: !0,
              greedy: !0
            },
            {
              // https://docs.docker.com/engine/reference/builder/#onbuild
              pattern: h(/(^ONBUILD<SP>)\w+/.source, "i"),
              lookbehind: !0,
              greedy: !0
            },
            {
              pattern: /^\w+/,
              greedy: !0
            }
          ],
          comment: f,
          string: b,
          variable: /\$(?:\w+|\{[^{}"'\\]*\})/,
          operator: /\\$/m
        }
      },
      comment: f
    }, e.languages.dockerfile = e.languages.docker;
  })(Prism);
});

// node_modules/prismjs/components/prism-hcl.js
var Se = E(() => {
  Prism.languages.hcl = {
    comment: /(?:\/\/|#).*|\/\*[\s\S]*?(?:\*\/|$)/,
    heredoc: {
      pattern: /<<-?(\w+\b)[\s\S]*?^[ \t]*\1/m,
      greedy: !0,
      alias: "string"
    },
    keyword: [
      {
        pattern: /(?:data|resource)\s+(?:"(?:\\[\s\S]|[^\\"])*")(?=\s+"[\w-]+"\s+\{)/i,
        inside: {
          type: {
            pattern: /(resource|data|\s+)(?:"(?:\\[\s\S]|[^\\"])*")/i,
            lookbehind: !0,
            alias: "variable"
          }
        }
      },
      {
        pattern: /(?:backend|module|output|provider|provisioner|variable)\s+(?:[\w-]+|"(?:\\[\s\S]|[^\\"])*")\s+(?=\{)/i,
        inside: {
          type: {
            pattern: /(backend|module|output|provider|provisioner|variable)\s+(?:[\w-]+|"(?:\\[\s\S]|[^\\"])*")\s+/i,
            lookbehind: !0,
            alias: "variable"
          }
        }
      },
      /[\w-]+(?=\s+\{)/
    ],
    property: [
      /[-\w\.]+(?=\s*=(?!=))/,
      /"(?:\\[\s\S]|[^\\"])+"(?=\s*[:=])/
    ],
    string: {
      pattern: /"(?:[^\\$"]|\\[\s\S]|\$(?:(?=")|\$+(?!\$)|[^"${])|\$\{(?:[^{}"]|"(?:[^\\"]|\\[\s\S])*")*\})*"/,
      greedy: !0,
      inside: {
        interpolation: {
          pattern: /(^|[^$])\$\{(?:[^{}"]|"(?:[^\\"]|\\[\s\S])*")*\}/,
          lookbehind: !0,
          inside: {
            type: {
              pattern: /(\b(?:count|data|local|module|path|self|terraform|var)\b\.)[\w\*]+/i,
              lookbehind: !0,
              alias: "variable"
            },
            keyword: /\b(?:count|data|local|module|path|self|terraform|var)\b/i,
            function: /\w+(?=\()/,
            string: {
              pattern: /"(?:\\[\s\S]|[^\\"])*"/,
              greedy: !0
            },
            number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?(?:e[+-]?\d+)?/i,
            punctuation: /[!\$#%&'()*+,.\/;<=>@\[\\\]^`{|}~?:]/
          }
        }
      }
    },
    number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?(?:e[+-]?\d+)?/i,
    boolean: /\b(?:false|true)\b/i,
    punctuation: /[=\[\]{}]/
  };
});

// node_modules/prismjs/components/prism-lua.js
var Ae = E(() => {
  Prism.languages.lua = {
    comment: /^#!.+|--(?:\[(=*)\[[\s\S]*?\]\1\]|.*)/m,
    // \z may be used to skip the following space
    string: {
      pattern: /(["'])(?:(?!\1)[^\\\r\n]|\\z(?:\r\n|\s)|\\(?:\r\n|[^z]))*\1|\[(=*)\[[\s\S]*?\]\2\]/,
      greedy: !0
    },
    number: /\b0x[a-f\d]+(?:\.[a-f\d]*)?(?:p[+-]?\d+)?\b|\b\d+(?:\.\B|(?:\.\d*)?(?:e[+-]?\d+)?\b)|\B\.\d+(?:e[+-]?\d+)?\b/i,
    keyword: /\b(?:and|break|do|else|elseif|end|false|for|function|goto|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/,
    function: /(?!\d)\w+(?=\s*(?:[({]))/,
    operator: [
      /[-+*%^&|#]|\/\/?|<[<=]?|>[>=]?|[=~]=?/,
      {
        // Match ".." but don't break "..."
        pattern: /(^|[^.])\.\.(?!\.)/,
        lookbehind: !0
      }
    ],
    punctuation: /[\[\](){},;]|\.+|:+/
  };
});

// <stdin>
var K = X();
globalThis.Prism = K;
V();
Q();
J();
ee();
te();
ne();
re();
ae();
ie();
se();
oe();
ue();
le();
ce();
de();
pe();
ge();
be();
fe();
he();
me();
ye();
Ee();
we();
ve();
Se();
Ae();
var Rt = K.languages, It = (e, a) => K.tokenize(e, a);
export {
  Rt as languages,
  It as tokenize
};
