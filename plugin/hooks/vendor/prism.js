var w = (e, a) => () => {
  try {
    return a || e((a = { exports: {} }).exports, a), a.exports;
  } catch (n) {
    throw a = 0, n;
  }
};

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-core.js
var X = w((Re, G) => {
  var xe = typeof window < "u" ? window : typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope ? self : {};
  var _e = (function(e) {
    var a = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i, n = 0, c = /* @__PURE__ */ new WeakMap(), b = {}, u = { manual: e.Prism && e.Prism.manual, disableWorkerMessageHandler: e.Prism && e.Prism.disableWorkerMessageHandler, util: { encode: function r(t) {
      return t instanceof f ? new f(t.type, r(t.content), t.alias) : Array.isArray(t) ? t.map(r) : t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
    }, type: function(r) {
      return Object.prototype.toString.call(r).slice(8, -1);
    }, objId: function(r) {
      return c.has(r) || c.set(r, ++n), c.get(r);
    }, clone: function r(t, s) {
      s = s || {};
      var o, i;
      switch (u.util.type(t)) {
        case "Object":
          if (i = u.util.objId(t), s[i])
            return s[i];
          o = {}, s[i] = o;
          for (var d in t)
            t.hasOwnProperty(d) && (o[d] = r(t[d], s));
          return o;
        case "Array":
          return i = u.util.objId(t), s[i] ? s[i] : (o = [], s[i] = o, t.forEach(function(m, p) {
            o[p] = r(m, s);
          }), o);
        default:
          return t;
      }
    }, getLanguage: function(r) {
      for (; r; ) {
        var t = a.exec(r.className);
        if (t)
          return t[1].toLowerCase();
        r = r.parentElement;
      }
      return "none";
    }, setLanguage: function(r, t) {
      r.className = r.className.replace(RegExp(a, "gi"), ""), r.classList.add("language-" + t);
    }, currentScript: function() {
      if (typeof document > "u")
        return null;
      if (document.currentScript && document.currentScript.tagName === "SCRIPT")
        return document.currentScript;
      try {
        throw new Error();
      } catch (o) {
        var r = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(o.stack) || [])[1];
        if (r) {
          var t = document.getElementsByTagName("script");
          for (var s in t)
            if (t[s].src == r)
              return t[s];
        }
        return null;
      }
    }, isActive: function(r, t, s) {
      for (var o = "no-" + t; r; ) {
        var i = r.classList;
        if (i.contains(t))
          return !0;
        if (i.contains(o))
          return !1;
        r = r.parentElement;
      }
      return !!s;
    } }, languages: { plain: b, plaintext: b, text: b, txt: b, extend: function(r, t) {
      var s = u.util.clone(u.languages[r]);
      for (var o in t)
        s[o] = t[o];
      return s;
    }, insertBefore: function(r, t, s, o) {
      o = o || u.languages;
      var i = o[r], d = {};
      for (var m in i)
        if (i.hasOwnProperty(m)) {
          if (m == t)
            for (var p in s)
              s.hasOwnProperty(p) && (d[p] = s[p]);
          s.hasOwnProperty(m) || (d[m] = i[m]);
        }
      var A = o[r];
      return o[r] = d, u.languages.DFS(u.languages, function(k, F) {
        F === A && k != r && (this[k] = d);
      }), d;
    }, DFS: function r(t, s, o, i) {
      i = i || {};
      var d = u.util.objId;
      for (var m in t)
        if (t.hasOwnProperty(m)) {
          s.call(t, m, t[m], o || m);
          var p = t[m], A = u.util.type(p);
          A === "Object" && !i[d(p)] ? (i[d(p)] = !0, r(p, s, null, i)) : A === "Array" && !i[d(p)] && (i[d(p)] = !0, r(p, s, m, i));
        }
    } }, plugins: {}, highlightAll: function(r, t) {
      u.highlightAllUnder(document, r, t);
    }, highlightAllUnder: function(r, t, s) {
      var o = { callback: s, container: r, selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code' };
      u.hooks.run("before-highlightall", o), o.elements = Array.prototype.slice.apply(o.container.querySelectorAll(o.selector)), u.hooks.run("before-all-elements-highlight", o);
      for (var i = 0, d; d = o.elements[i++]; )
        u.highlightElement(d, t === !0, o.callback);
    }, highlightElement: function(r, t, s) {
      var o = u.util.getLanguage(r), i = u.languages[o];
      u.util.setLanguage(r, o);
      var d = r.parentElement;
      d && d.nodeName.toLowerCase() === "pre" && u.util.setLanguage(d, o);
      var m = r.textContent, p = { element: r, language: o, grammar: i, code: m };
      function A(F) {
        p.highlightedCode = F, u.hooks.run("before-insert", p), p.element.innerHTML = p.highlightedCode, u.hooks.run("after-highlight", p), u.hooks.run("complete", p), s && s.call(p.element);
      }
      if (u.hooks.run("before-sanity-check", p), d = p.element.parentElement, d && d.nodeName.toLowerCase() === "pre" && !d.hasAttribute("tabindex") && d.setAttribute("tabindex", "0"), !p.code) {
        u.hooks.run("complete", p), s && s.call(p.element);
        return;
      }
      if (u.hooks.run("before-highlight", p), !p.grammar) {
        A(u.util.encode(p.code));
        return;
      }
      if (t && e.Worker) {
        var k = new Worker(u.filename);
        k.onmessage = function(F) {
          A(F.data);
        }, k.postMessage(JSON.stringify({ language: p.language, code: p.code, immediateClose: !0 }));
      } else
        A(u.highlight(p.code, p.grammar, p.language));
    }, highlight: function(r, t, s) {
      var o = { code: r, grammar: t, language: s };
      if (u.hooks.run("before-tokenize", o), !o.grammar)
        throw new Error('The language "' + o.language + '" has no grammar.');
      return o.tokens = u.tokenize(o.code, o.grammar), u.hooks.run("after-tokenize", o), f.stringify(u.util.encode(o.tokens), o.language);
    }, tokenize: function(r, t) {
      var s = t.rest;
      if (s) {
        for (var o in s)
          t[o] = s[o];
        delete t.rest;
      }
      var i = new g();
      return y(i, i.head, r), l(r, i, t, i.head, 0), v(i);
    }, hooks: { all: {}, add: function(r, t) {
      var s = u.hooks.all;
      s[r] = s[r] || [], s[r].push(t);
    }, run: function(r, t) {
      var s = u.hooks.all[r];
      if (!(!s || !s.length))
        for (var o = 0, i; i = s[o++]; )
          i(t);
    } }, Token: f };
    e.Prism = u;
    function f(r, t, s, o) {
      this.type = r, this.content = t, this.alias = s, this.length = (o || "").length | 0;
    }
    f.stringify = function r(t, s) {
      if (typeof t == "string")
        return t;
      if (Array.isArray(t)) {
        var o = "";
        return t.forEach(function(A) {
          o += r(A, s);
        }), o;
      }
      var i = { type: t.type, content: r(t.content, s), tag: "span", classes: ["token", t.type], attributes: {}, language: s }, d = t.alias;
      d && (Array.isArray(d) ? Array.prototype.push.apply(i.classes, d) : i.classes.push(d)), u.hooks.run("wrap", i);
      var m = "";
      for (var p in i.attributes)
        m += " " + p + '="' + (i.attributes[p] || "").replace(/"/g, "&quot;") + '"';
      return "<" + i.tag + ' class="' + i.classes.join(" ") + '"' + m + ">" + i.content + "</" + i.tag + ">";
    };
    function h(r, t, s, o) {
      r.lastIndex = t;
      var i = r.exec(s);
      if (i && o && i[1]) {
        var d = i[1].length;
        i.index += d, i[0] = i[0].slice(d);
      }
      return i;
    }
    function l(r, t, s, o, i, d) {
      for (var m in s)
        if (!(!s.hasOwnProperty(m) || !s[m])) {
          var p = s[m];
          p = Array.isArray(p) ? p : [p];
          for (var A = 0; A < p.length; ++A) {
            if (d && d.cause == m + "," + A)
              return;
            var k = p[A], F = k.inside, C = !!k.lookbehind, P = !!k.greedy, D = k.alias;
            if (P && !k.pattern.global) {
              var U = k.pattern.toString().match(/[imsuy]*$/)[0];
              k.pattern = RegExp(k.pattern.source, U + "g");
            }
            for (var z = k.pattern || k, x = o.next, I = i; x !== t.tail && !(d && I >= d.reach); I += x.value.length, x = x.next) {
              var L = x.value;
              if (t.length > r.length)
                return;
              if (!(L instanceof f)) {
                var T = 1, _;
                if (P) {
                  if (_ = h(z, I, r, C), !_ || _.index >= r.length)
                    break;
                  var M = _.index, $ = _.index + _[0].length, N = I;
                  for (N += x.value.length; M >= N; )
                    x = x.next, N += x.value.length;
                  if (N -= x.value.length, I = N, x.value instanceof f)
                    continue;
                  for (var B = x; B !== t.tail && (N < $ || typeof B.value == "string"); B = B.next)
                    T++, N += B.value.length;
                  T--, L = r.slice(I, N), _.index -= I;
                } else if (_ = h(z, 0, L, C), !_)
                  continue;
                var M = _.index, q = _[0], j = L.slice(0, M), W = L.slice(M + q.length), H = I + L.length;
                d && H > d.reach && (d.reach = H);
                var Z = x.prev;
                j && (Z = y(t, Z, j), I += j.length), E(t, Z, T);
                var ke = new f(m, F ? u.tokenize(q, F) : q, D, q);
                if (x = y(t, Z, ke), W && y(t, x, W), T > 1) {
                  var K = { cause: m + "," + A, reach: H };
                  l(r, t, s, x.prev, I, K), d && K.reach > d.reach && (d.reach = K.reach);
                }
              }
            }
          }
        }
    }
    function g() {
      var r = { value: null, prev: null, next: null }, t = { value: null, prev: r, next: null };
      r.next = t, this.head = r, this.tail = t, this.length = 0;
    }
    function y(r, t, s) {
      var o = t.next, i = { value: s, prev: t, next: o };
      return t.next = i, o.prev = i, r.length++, i;
    }
    function E(r, t, s) {
      for (var o = t.next, i = 0; i < s && o !== r.tail; i++)
        o = o.next;
      t.next = o, o.prev = t, r.length -= i;
    }
    function v(r) {
      for (var t = [], s = r.head.next; s !== r.tail; )
        t.push(s.value), s = s.next;
      return t;
    }
    if (!e.document)
      return e.addEventListener && (u.disableWorkerMessageHandler || e.addEventListener("message", function(r) {
        var t = JSON.parse(r.data), s = t.language, o = t.code, i = t.immediateClose;
        e.postMessage(u.highlight(o, u.languages[s], s)), i && e.close();
      }, !1)), u;
    var S = u.util.currentScript();
    S && (u.filename = S.src, S.hasAttribute("data-manual") && (u.manual = !0));
    function R() {
      u.manual || u.highlightAll();
    }
    if (!u.manual) {
      var O = document.readyState;
      O === "loading" || O === "interactive" && S && S.defer ? document.addEventListener("DOMContentLoaded", R) : window.requestAnimationFrame ? window.requestAnimationFrame(R) : window.setTimeout(R, 16);
    }
    return u;
  })(xe);
  typeof G < "u" && G.exports && (G.exports = _e);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-clike.js
var V = w(() => {
  Prism.languages.clike = { comment: [{ pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/, lookbehind: !0, greedy: !0 }, { pattern: /(^|[^\\:])\/\/.*/, lookbehind: !0, greedy: !0 }], string: { pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/, greedy: !0 }, "class-name": { pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i, lookbehind: !0, inside: { punctuation: /[.\\]/ } }, keyword: /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/, boolean: /\b(?:false|true)\b/, function: /\b\w+(?=\()/, number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i, operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/, punctuation: /[{}[\];(),.:]/ };
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-markup.js
var Q = w(() => {
  Prism.languages.markup = { comment: { pattern: /<!--(?:(?!<!--)[\s\S])*?-->/, greedy: !0 }, prolog: { pattern: /<\?[\s\S]+?\?>/, greedy: !0 }, doctype: { pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i, greedy: !0, inside: { "internal-subset": { pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/, lookbehind: !0, greedy: !0, inside: null }, string: { pattern: /"[^"]*"|'[^']*'/, greedy: !0 }, punctuation: /^<!|>$|[[\]]/, "doctype-tag": /^DOCTYPE/i, name: /[^\s<>'"]+/ } }, cdata: { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, greedy: !0 }, tag: { pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/, greedy: !0, inside: { tag: { pattern: /^<\/?[^\s>\/]+/, inside: { punctuation: /^<\/?/, namespace: /^[^\s>\/:]+:/ } }, "special-attr": [], "attr-value": { pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/, inside: { punctuation: [{ pattern: /^=/, alias: "attr-equals" }, { pattern: /^(\s*)["']|["']$/, lookbehind: !0 }] } }, punctuation: /\/?>/, "attr-name": { pattern: /[^\s>\/]+/, inside: { namespace: /^[^\s>\/:]+:/ } } } }, entity: [{ pattern: /&[\da-z]{1,8};/i, alias: "named-entity" }, /&#x?[\da-f]{1,8};/i] };
  Prism.languages.markup.tag.inside["attr-value"].inside.entity = Prism.languages.markup.entity;
  Prism.languages.markup.doctype.inside["internal-subset"].inside = Prism.languages.markup;
  Prism.hooks.add("wrap", function(e) {
    e.type === "entity" && (e.attributes.title = e.content.replace(/&amp;/, "&"));
  });
  Object.defineProperty(Prism.languages.markup.tag, "addInlined", { value: function(a, n) {
    var c = {};
    c["language-" + n] = { pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i, lookbehind: !0, inside: Prism.languages[n] }, c.cdata = /^<!\[CDATA\[|\]\]>$/i;
    var b = { "included-cdata": { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, inside: c } };
    b["language-" + n] = { pattern: /[\s\S]+/, inside: Prism.languages[n] };
    var u = {};
    u[a] = { pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function() {
      return a;
    }), "i"), lookbehind: !0, greedy: !0, inside: b }, Prism.languages.insertBefore("markup", "cdata", u);
  } });
  Object.defineProperty(Prism.languages.markup.tag, "addAttribute", { value: function(e, a) {
    Prism.languages.markup.tag.inside["special-attr"].push({ pattern: RegExp(/(^|["'\s])/.source + "(?:" + e + ")" + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source, "i"), lookbehind: !0, inside: { "attr-name": /^[^\s=]+/, "attr-value": { pattern: /=[\s\S]+/, inside: { value: { pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/, lookbehind: !0, alias: [a, "language-" + a], inside: Prism.languages[a] }, punctuation: [{ pattern: /^=/, alias: "attr-equals" }, /"|'/] } } } });
  } });
  Prism.languages.html = Prism.languages.markup;
  Prism.languages.mathml = Prism.languages.markup;
  Prism.languages.svg = Prism.languages.markup;
  Prism.languages.xml = Prism.languages.extend("markup", {});
  Prism.languages.ssml = Prism.languages.xml;
  Prism.languages.atom = Prism.languages.xml;
  Prism.languages.rss = Prism.languages.xml;
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-markup-templating.js
var J = w(() => {
  (function(e) {
    function a(n, c) {
      return "___" + n.toUpperCase() + c + "___";
    }
    Object.defineProperties(e.languages["markup-templating"] = {}, { buildPlaceholders: { value: function(n, c, b, u) {
      if (n.language === c) {
        var f = n.tokenStack = [];
        n.code = n.code.replace(b, function(h) {
          if (typeof u == "function" && !u(h))
            return h;
          for (var l = f.length, g; n.code.indexOf(g = a(c, l)) !== -1; )
            ++l;
          return f[l] = h, g;
        }), n.grammar = e.languages.markup;
      }
    } }, tokenizePlaceholders: { value: function(n, c) {
      if (n.language !== c || !n.tokenStack)
        return;
      n.grammar = e.languages[c];
      var b = 0, u = Object.keys(n.tokenStack);
      function f(h) {
        for (var l = 0; l < h.length && !(b >= u.length); l++) {
          var g = h[l];
          if (typeof g == "string" || g.content && typeof g.content == "string") {
            var y = u[b], E = n.tokenStack[y], v = typeof g == "string" ? g : g.content, S = a(c, y), R = v.indexOf(S);
            if (R > -1) {
              ++b;
              var O = v.substring(0, R), r = new e.Token(c, e.tokenize(E, n.grammar), "language-" + c, E), t = v.substring(R + S.length), s = [];
              O && s.push.apply(s, f([O])), s.push(r), t && s.push.apply(s, f([t])), typeof g == "string" ? h.splice.apply(h, [l, 1].concat(s)) : g.content = s;
            }
          } else g.content && f(g.content);
        }
        return h;
      }
      f(n.tokens);
    } } });
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-php.js
var ee = w(() => {
  (function(e) {
    var a = /\/\*[\s\S]*?\*\/|\/\/.*|#(?!\[).*/, n = [{ pattern: /\b(?:false|true)\b/i, alias: "boolean" }, { pattern: /(::\s*)\b[a-z_]\w*\b(?!\s*\()/i, greedy: !0, lookbehind: !0 }, { pattern: /(\b(?:case|const)\s+)\b[a-z_]\w*(?=\s*[;=])/i, greedy: !0, lookbehind: !0 }, /\b(?:null)\b/i, /\b[A-Z_][A-Z0-9_]*\b(?!\s*\()/], c = /\b0b[01]+(?:_[01]+)*\b|\b0o[0-7]+(?:_[0-7]+)*\b|\b0x[\da-f]+(?:_[\da-f]+)*\b|(?:\b\d+(?:_\d+)*\.?(?:\d+(?:_\d+)*)?|\B\.\d+)(?:e[+-]?\d+)?/i, b = /<?=>|\?\?=?|\.{3}|\??->|[!=]=?=?|::|\*\*=?|--|\+\+|&&|\|\||<<|>>|[?~]|[/^|%*&<>.+-]=?/, u = /[{}\[\](),:;]/;
    e.languages.php = { delimiter: { pattern: /\?>$|^<\?(?:php(?=\s)|=)?/i, alias: "important" }, comment: a, variable: /\$+(?:\w+\b|(?=\{))/, package: { pattern: /(namespace\s+|use\s+(?:function\s+)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i, lookbehind: !0, inside: { punctuation: /\\/ } }, "class-name-definition": { pattern: /(\b(?:class|enum|interface|trait)\s+)\b[a-z_]\w*(?!\\)\b/i, lookbehind: !0, alias: "class-name" }, "function-definition": { pattern: /(\bfunction\s+)[a-z_]\w*(?=\s*\()/i, lookbehind: !0, alias: "function" }, keyword: [{ pattern: /(\(\s*)\b(?:array|bool|boolean|float|int|integer|object|string)\b(?=\s*\))/i, alias: "type-casting", greedy: !0, lookbehind: !0 }, { pattern: /([(,?]\s*)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|object|self|static|string)\b(?=\s*\$)/i, alias: "type-hint", greedy: !0, lookbehind: !0 }, { pattern: /(\)\s*:\s*(?:\?\s*)?)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|never|object|self|static|string|void)\b/i, alias: "return-type", greedy: !0, lookbehind: !0 }, { pattern: /\b(?:array(?!\s*\()|bool|float|int|iterable|mixed|object|string|void)\b/i, alias: "type-declaration", greedy: !0 }, { pattern: /(\|\s*)(?:false|null)\b|\b(?:false|null)(?=\s*\|)/i, alias: "type-declaration", greedy: !0, lookbehind: !0 }, { pattern: /\b(?:parent|self|static)(?=\s*::)/i, alias: "static-context", greedy: !0 }, { pattern: /(\byield\s+)from\b/i, lookbehind: !0 }, /\bclass\b/i, { pattern: /((?:^|[^\s>:]|(?:^|[^-])>|(?:^|[^:]):)\s*)\b(?:abstract|and|array|as|break|callable|case|catch|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|eval|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|never|new|or|parent|print|private|protected|public|readonly|require|require_once|return|self|static|switch|throw|trait|try|unset|use|var|while|xor|yield|__halt_compiler)\b/i, lookbehind: !0 }], "argument-name": { pattern: /([(,]\s*)\b[a-z_]\w*(?=\s*:(?!:))/i, lookbehind: !0 }, "class-name": [{ pattern: /(\b(?:extends|implements|instanceof|new(?!\s+self|\s+static))\s+|\bcatch\s*\()\b[a-z_]\w*(?!\\)\b/i, greedy: !0, lookbehind: !0 }, { pattern: /(\|\s*)\b[a-z_]\w*(?!\\)\b/i, greedy: !0, lookbehind: !0 }, { pattern: /\b[a-z_]\w*(?!\\)\b(?=\s*\|)/i, greedy: !0 }, { pattern: /(\|\s*)(?:\\?\b[a-z_]\w*)+\b/i, alias: "class-name-fully-qualified", greedy: !0, lookbehind: !0, inside: { punctuation: /\\/ } }, { pattern: /(?:\\?\b[a-z_]\w*)+\b(?=\s*\|)/i, alias: "class-name-fully-qualified", greedy: !0, inside: { punctuation: /\\/ } }, { pattern: /(\b(?:extends|implements|instanceof|new(?!\s+self\b|\s+static\b))\s+|\bcatch\s*\()(?:\\?\b[a-z_]\w*)+\b(?!\\)/i, alias: "class-name-fully-qualified", greedy: !0, lookbehind: !0, inside: { punctuation: /\\/ } }, { pattern: /\b[a-z_]\w*(?=\s*\$)/i, alias: "type-declaration", greedy: !0 }, { pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i, alias: ["class-name-fully-qualified", "type-declaration"], greedy: !0, inside: { punctuation: /\\/ } }, { pattern: /\b[a-z_]\w*(?=\s*::)/i, alias: "static-context", greedy: !0 }, { pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*::)/i, alias: ["class-name-fully-qualified", "static-context"], greedy: !0, inside: { punctuation: /\\/ } }, { pattern: /([(,?]\s*)[a-z_]\w*(?=\s*\$)/i, alias: "type-hint", greedy: !0, lookbehind: !0 }, { pattern: /([(,?]\s*)(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i, alias: ["class-name-fully-qualified", "type-hint"], greedy: !0, lookbehind: !0, inside: { punctuation: /\\/ } }, { pattern: /(\)\s*:\s*(?:\?\s*)?)\b[a-z_]\w*(?!\\)\b/i, alias: "return-type", greedy: !0, lookbehind: !0 }, { pattern: /(\)\s*:\s*(?:\?\s*)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i, alias: ["class-name-fully-qualified", "return-type"], greedy: !0, lookbehind: !0, inside: { punctuation: /\\/ } }], constant: n, function: { pattern: /(^|[^\\\w])\\?[a-z_](?:[\w\\]*\w)?(?=\s*\()/i, lookbehind: !0, inside: { punctuation: /\\/ } }, property: { pattern: /(->\s*)\w+/, lookbehind: !0 }, number: c, operator: b, punctuation: u };
    var f = { pattern: /\{\$(?:\{(?:\{[^{}]+\}|[^{}]+)\}|[^{}])+\}|(^|[^\\{])\$+(?:\w+(?:\[[^\r\n\[\]]+\]|->\w+)?)/, lookbehind: !0, inside: e.languages.php }, h = [{ pattern: /<<<'([^']+)'[\r\n](?:.*[\r\n])*?\1;/, alias: "nowdoc-string", greedy: !0, inside: { delimiter: { pattern: /^<<<'[^']+'|[a-z_]\w*;$/i, alias: "symbol", inside: { punctuation: /^<<<'?|[';]$/ } } } }, { pattern: /<<<(?:"([^"]+)"[\r\n](?:.*[\r\n])*?\1;|([a-z_]\w*)[\r\n](?:.*[\r\n])*?\2;)/i, alias: "heredoc-string", greedy: !0, inside: { delimiter: { pattern: /^<<<(?:"[^"]+"|[a-z_]\w*)|[a-z_]\w*;$/i, alias: "symbol", inside: { punctuation: /^<<<"?|[";]$/ } }, interpolation: f } }, { pattern: /`(?:\\[\s\S]|[^\\`])*`/, alias: "backtick-quoted-string", greedy: !0 }, { pattern: /'(?:\\[\s\S]|[^\\'])*'/, alias: "single-quoted-string", greedy: !0 }, { pattern: /"(?:\\[\s\S]|[^\\"])*"/, alias: "double-quoted-string", greedy: !0, inside: { interpolation: f } }];
    e.languages.insertBefore("php", "variable", { string: h, attribute: { pattern: /#\[(?:[^"'\/#]|\/(?![*/])|\/\/.*$|#(?!\[).*$|\/\*(?:[^*]|\*(?!\/))*\*\/|"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*')+\](?=\s*[a-z$#])/im, greedy: !0, inside: { "attribute-content": { pattern: /^(#\[)[\s\S]+(?=\]$)/, lookbehind: !0, inside: { comment: a, string: h, "attribute-class-name": [{ pattern: /([^:]|^)\b[a-z_]\w*(?!\\)\b/i, alias: "class-name", greedy: !0, lookbehind: !0 }, { pattern: /([^:]|^)(?:\\?\b[a-z_]\w*)+/i, alias: ["class-name", "class-name-fully-qualified"], greedy: !0, lookbehind: !0, inside: { punctuation: /\\/ } }], constant: n, number: c, operator: b, punctuation: u } }, delimiter: { pattern: /^#\[|\]$/, alias: "punctuation" } } } }), e.hooks.add("before-tokenize", function(l) {
      if (/<\?/.test(l.code)) {
        var g = /<\?(?:[^"'/#]|\/(?![*/])|("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|(?:\/\/|#(?!\[))(?:[^?\n\r]|\?(?!>))*(?=$|\?>|[\r\n])|#\[|\/\*(?:[^*]|\*(?!\/))*(?:\*\/|$))*?(?:\?>|$)/g;
        e.languages["markup-templating"].buildPlaceholders(l, "php", g);
      }
    }), e.hooks.add("after-tokenize", function(l) {
      e.languages["markup-templating"].tokenizePlaceholders(l, "php");
    });
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-css.js
var te = w(() => {
  (function(e) {
    var a = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
    e.languages.css = { comment: /\/\*[\s\S]*?\*\//, atrule: { pattern: RegExp("@[\\w-](?:" + /[^;{\s"']|\s+(?!\s)/.source + "|" + a.source + ")*?" + /(?:;|(?=\s*\{))/.source), inside: { rule: /^@[\w-]+/, "selector-function-argument": { pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/, lookbehind: !0, alias: "selector" }, keyword: { pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/, lookbehind: !0 } } }, url: { pattern: RegExp("\\burl\\((?:" + a.source + "|" + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ")\\)", "i"), greedy: !0, inside: { function: /^url/i, punctuation: /^\(|\)$/, string: { pattern: RegExp("^" + a.source + "$"), alias: "url" } } }, selector: { pattern: RegExp(`(^|[{}\\s])[^{}\\s](?:[^{};"'\\s]|\\s+(?![\\s{])|` + a.source + ")*(?=\\s*\\{)"), lookbehind: !0 }, string: { pattern: a, greedy: !0 }, property: { pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i, lookbehind: !0 }, important: /!important\b/i, function: { pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i, lookbehind: !0 }, punctuation: /[(){};:,]/ }, e.languages.css.atrule.inside.rest = e.languages.css;
    var n = e.languages.markup;
    n && (n.tag.addInlined("style", "css"), n.tag.addAttribute("style", "css"));
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-javascript.js
var ne = w(() => {
  Prism.languages.javascript = Prism.languages.extend("clike", { "class-name": [Prism.languages.clike["class-name"], { pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/, lookbehind: !0 }], keyword: [{ pattern: /((?:^|\})\s*)catch\b/, lookbehind: !0 }, { pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/, lookbehind: !0 }], function: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/, number: { pattern: RegExp(/(^|[^\w$])/.source + "(?:" + (/NaN|Infinity/.source + "|" + /0[bB][01]+(?:_[01]+)*n?/.source + "|" + /0[oO][0-7]+(?:_[0-7]+)*n?/.source + "|" + /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source + "|" + /\d+(?:_\d+)*n/.source + "|" + /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source) + ")" + /(?![\w$])/.source), lookbehind: !0 }, operator: /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/ });
  Prism.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;
  Prism.languages.insertBefore("javascript", "keyword", { regex: { pattern: RegExp(/((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source + /\//.source + "(?:" + /(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source + "|" + /(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source + ")" + /(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source), lookbehind: !0, greedy: !0, inside: { "regex-source": { pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/, lookbehind: !0, alias: "language-regex", inside: Prism.languages.regex }, "regex-delimiter": /^\/|\/$/, "regex-flags": /^[a-z]+$/ } }, "function-variable": { pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/, alias: "function" }, parameter: [{ pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/, lookbehind: !0, inside: Prism.languages.javascript }, { pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i, lookbehind: !0, inside: Prism.languages.javascript }, { pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/, lookbehind: !0, inside: Prism.languages.javascript }, { pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/, lookbehind: !0, inside: Prism.languages.javascript }], constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/ });
  Prism.languages.insertBefore("javascript", "string", { hashbang: { pattern: /^#!.*/, greedy: !0, alias: "comment" }, "template-string": { pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/, greedy: !0, inside: { "template-punctuation": { pattern: /^`|`$/, alias: "string" }, interpolation: { pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/, lookbehind: !0, inside: { "interpolation-punctuation": { pattern: /^\$\{|\}$/, alias: "punctuation" }, rest: Prism.languages.javascript } }, string: /[\s\S]+/ } }, "string-property": { pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m, lookbehind: !0, greedy: !0, alias: "property" } });
  Prism.languages.insertBefore("javascript", "operator", { "literal-property": { pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m, lookbehind: !0, alias: "property" } });
  Prism.languages.markup && (Prism.languages.markup.tag.addInlined("script", "javascript"), Prism.languages.markup.tag.addAttribute(/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source, "javascript"));
  Prism.languages.js = Prism.languages.javascript;
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-typescript.js
var re = w(() => {
  (function(e) {
    e.languages.typescript = e.languages.extend("javascript", { "class-name": { pattern: /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/, lookbehind: !0, greedy: !0, inside: null }, builtin: /\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\b/ }), e.languages.typescript.keyword.push(/\b(?:abstract|declare|is|keyof|readonly|require)\b/, /\b(?:asserts|infer|interface|module|namespace|type)\b(?=\s*(?:[{_$a-zA-Z\xA0-\uFFFF]|$))/, /\btype\b(?=\s*(?:[\{*]|$))/), delete e.languages.typescript.parameter, delete e.languages.typescript["literal-property"];
    var a = e.languages.extend("typescript", {});
    delete a["class-name"], e.languages.typescript["class-name"].inside = a, e.languages.insertBefore("typescript", "function", { decorator: { pattern: /@[$\w\xA0-\uFFFF]+/, inside: { at: { pattern: /^@/, alias: "operator" }, function: /^[\s\S]+/ } }, "generic-function": { pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/, greedy: !0, inside: { function: /^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/, generic: { pattern: /<[\s\S]+/, alias: "class-name", inside: a } } } }), e.languages.ts = e.languages.typescript;
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-jsx.js
var ae = w(() => {
  (function(e) {
    var a = e.util.clone(e.languages.javascript), n = /(?:\s|\/\/.*(?!.)|\/\*(?:[^*]|\*(?!\/))\*\/)/.source, c = /(?:\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])*\})/.source, b = /(?:\{<S>*\.{3}(?:[^{}]|<BRACES>)*\})/.source;
    function u(l, g) {
      return l = l.replace(/<S>/g, function() {
        return n;
      }).replace(/<BRACES>/g, function() {
        return c;
      }).replace(/<SPREAD>/g, function() {
        return b;
      }), RegExp(l, g);
    }
    b = u(b).source, e.languages.jsx = e.languages.extend("markup", a), e.languages.jsx.tag.pattern = u(/<\/?(?:[\w.:-]+(?:<S>+(?:[\w.:$-]+(?:=(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s{'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*\/?)?>/.source), e.languages.jsx.tag.inside.tag.pattern = /^<\/?[^\s>\/]*/, e.languages.jsx.tag.inside["attr-value"].pattern = /=(?!\{)(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s'">]+)/, e.languages.jsx.tag.inside.tag.inside["class-name"] = /^[A-Z]\w*(?:\.[A-Z]\w*)*$/, e.languages.jsx.tag.inside.comment = a.comment, e.languages.insertBefore("inside", "attr-name", { spread: { pattern: u(/<SPREAD>/.source), inside: e.languages.jsx } }, e.languages.jsx.tag), e.languages.insertBefore("inside", "special-attr", { script: { pattern: u(/=<BRACES>/.source), alias: "language-javascript", inside: { "script-punctuation": { pattern: /^=(?=\{)/, alias: "punctuation" }, rest: e.languages.jsx } } }, e.languages.jsx.tag);
    var f = function(l) {
      return l ? typeof l == "string" ? l : typeof l.content == "string" ? l.content : l.content.map(f).join("") : "";
    }, h = function(l) {
      for (var g = [], y = 0; y < l.length; y++) {
        var E = l[y], v = !1;
        if (typeof E != "string" && (E.type === "tag" && E.content[0] && E.content[0].type === "tag" ? E.content[0].content[0].content === "</" ? g.length > 0 && g[g.length - 1].tagName === f(E.content[0].content[1]) && g.pop() : E.content[E.content.length - 1].content === "/>" || g.push({ tagName: f(E.content[0].content[1]), openedBraces: 0 }) : g.length > 0 && E.type === "punctuation" && E.content === "{" ? g[g.length - 1].openedBraces++ : g.length > 0 && g[g.length - 1].openedBraces > 0 && E.type === "punctuation" && E.content === "}" ? g[g.length - 1].openedBraces-- : v = !0), (v || typeof E == "string") && g.length > 0 && g[g.length - 1].openedBraces === 0) {
          var S = f(E);
          y < l.length - 1 && (typeof l[y + 1] == "string" || l[y + 1].type === "plain-text") && (S += f(l[y + 1]), l.splice(y + 1, 1)), y > 0 && (typeof l[y - 1] == "string" || l[y - 1].type === "plain-text") && (S = f(l[y - 1]) + S, l.splice(y - 1, 1), y--), l[y] = new e.Token("plain-text", S, null, S);
        }
        E.content && typeof E.content != "string" && h(E.content);
      }
    };
    e.hooks.add("after-tokenize", function(l) {
      l.language !== "jsx" && l.language !== "tsx" || h(l.tokens);
    });
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-tsx.js
var se = w(() => {
  (function(e) {
    var a = e.util.clone(e.languages.typescript);
    e.languages.tsx = e.languages.extend("jsx", a), delete e.languages.tsx.parameter, delete e.languages.tsx["literal-property"];
    var n = e.languages.tsx.tag;
    n.pattern = RegExp(/(^|[^\w$]|(?=<\/))/.source + "(?:" + n.pattern.source + ")", n.pattern.flags), n.lookbehind = !0;
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-python.js
var ie = w(() => {
  Prism.languages.python = { comment: { pattern: /(^|[^\\])#.*/, lookbehind: !0, greedy: !0 }, "string-interpolation": { pattern: /(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i, greedy: !0, inside: { interpolation: { pattern: /((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}])+\})+\})+\}/, lookbehind: !0, inside: { "format-spec": { pattern: /(:)[^:(){}]+(?=\}$)/, lookbehind: !0 }, "conversion-option": { pattern: /![sra](?=[:}]$)/, alias: "punctuation" }, rest: null } }, string: /[\s\S]+/ } }, "triple-quoted-string": { pattern: /(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i, greedy: !0, alias: "string" }, string: { pattern: /(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i, greedy: !0 }, function: { pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g, lookbehind: !0 }, "class-name": { pattern: /(\bclass\s+)\w+/i, lookbehind: !0 }, decorator: { pattern: /(^[\t ]*)@\w+(?:\.\w+)*/m, lookbehind: !0, alias: ["annotation", "punctuation"], inside: { punctuation: /\./ } }, keyword: /\b(?:_(?=\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/, builtin: /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/, boolean: /\b(?:False|None|True)\b/, number: /\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i, operator: /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/, punctuation: /[{}[\];(),.:]/ };
  Prism.languages.python["string-interpolation"].inside.interpolation.inside.rest = Prism.languages.python;
  Prism.languages.py = Prism.languages.python;
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-go.js
var oe = w(() => {
  Prism.languages.go = Prism.languages.extend("clike", { string: { pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"|`[^`]*`/, lookbehind: !0, greedy: !0 }, keyword: /\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(?:to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/, boolean: /\b(?:_|false|iota|nil|true)\b/, number: [/\b0(?:b[01_]+|o[0-7_]+)i?\b/i, /\b0x(?:[a-f\d_]+(?:\.[a-f\d_]*)?|\.[a-f\d_]+)(?:p[+-]?\d+(?:_\d+)*)?i?(?!\w)/i, /(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?[\d_]+)?i?(?!\w)/i], operator: /[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./, builtin: /\b(?:append|bool|byte|cap|close|complex|complex(?:64|128)|copy|delete|error|float(?:32|64)|u?int(?:8|16|32|64)?|imag|len|make|new|panic|print(?:ln)?|real|recover|rune|string|uintptr)\b/ });
  Prism.languages.insertBefore("go", "string", { char: { pattern: /'(?:\\.|[^'\\\r\n]){0,10}'/, greedy: !0 } });
  delete Prism.languages.go["class-name"];
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-rust.js
var ue = w(() => {
  (function(e) {
    for (var a = /\/\*(?:[^*/]|\*(?!\/)|\/(?!\*)|<self>)*\*\//.source, n = 0; n < 2; n++)
      a = a.replace(/<self>/g, function() {
        return a;
      });
    a = a.replace(/<self>/g, function() {
      return /[^\s\S]/.source;
    }), e.languages.rust = { comment: [{ pattern: RegExp(/(^|[^\\])/.source + a), lookbehind: !0, greedy: !0 }, { pattern: /(^|[^\\:])\/\/.*/, lookbehind: !0, greedy: !0 }], string: { pattern: /b?"(?:\\[\s\S]|[^\\"])*"|b?r(#*)"(?:[^"]|"(?!\1))*"\1/, greedy: !0 }, char: { pattern: /b?'(?:\\(?:x[0-7][\da-fA-F]|u\{(?:[\da-fA-F]_*){1,6}\}|.)|[^\\\r\n\t'])'/, greedy: !0 }, attribute: { pattern: /#!?\[(?:[^\[\]"]|"(?:\\[\s\S]|[^\\"])*")*\]/, greedy: !0, alias: "attr-name", inside: { string: null } }, "closure-params": { pattern: /([=(,:]\s*|\bmove\s*)\|[^|]*\||\|[^|]*\|(?=\s*(?:\{|->))/, lookbehind: !0, greedy: !0, inside: { "closure-punctuation": { pattern: /^\||\|$/, alias: "punctuation" }, rest: null } }, "lifetime-annotation": { pattern: /'\w+/, alias: "symbol" }, "fragment-specifier": { pattern: /(\$\w+:)[a-z]+/, lookbehind: !0, alias: "punctuation" }, variable: /\$\w+/, "function-definition": { pattern: /(\bfn\s+)\w+/, lookbehind: !0, alias: "function" }, "type-definition": { pattern: /(\b(?:enum|struct|trait|type|union)\s+)\w+/, lookbehind: !0, alias: "class-name" }, "module-declaration": [{ pattern: /(\b(?:crate|mod)\s+)[a-z][a-z_\d]*/, lookbehind: !0, alias: "namespace" }, { pattern: /(\b(?:crate|self|super)\s*)::\s*[a-z][a-z_\d]*\b(?:\s*::(?:\s*[a-z][a-z_\d]*\s*::)*)?/, lookbehind: !0, alias: "namespace", inside: { punctuation: /::/ } }], keyword: [/\b(?:Self|abstract|as|async|await|become|box|break|const|continue|crate|do|dyn|else|enum|extern|final|fn|for|if|impl|in|let|loop|macro|match|mod|move|mut|override|priv|pub|ref|return|self|static|struct|super|trait|try|type|typeof|union|unsafe|unsized|use|virtual|where|while|yield)\b/, /\b(?:bool|char|f(?:32|64)|[ui](?:8|16|32|64|128|size)|str)\b/], function: /\b[a-z_]\w*(?=\s*(?:::\s*<|\())/, macro: { pattern: /\b\w+!/, alias: "property" }, constant: /\b[A-Z_][A-Z_\d]+\b/, "class-name": /\b[A-Z]\w*\b/, namespace: { pattern: /(?:\b[a-z][a-z_\d]*\s*::\s*)*\b[a-z][a-z_\d]*\s*::(?!\s*<)/, inside: { punctuation: /::/ } }, number: /\b(?:0x[\dA-Fa-f](?:_?[\dA-Fa-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|(?:(?:\d(?:_?\d)*)?\.)?\d(?:_?\d)*(?:[Ee][+-]?\d+)?)(?:_?(?:f32|f64|[iu](?:8|16|32|64|size)?))?\b/, boolean: /\b(?:false|true)\b/, punctuation: /->|\.\.=|\.{1,3}|::|[{}[\];(),:]/, operator: /[-+*\/%!^]=?|=[=>]?|&[&=]?|\|[|=]?|<<?=?|>>?=?|[@?]/ }, e.languages.rust["closure-params"].inside.rest = e.languages.rust, e.languages.rust.attribute.inside.string = e.languages.rust.string;
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-java.js
var le = w(() => {
  (function(e) {
    var a = /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|non-sealed|null|open|opens|package|permits|private|protected|provides|public|record(?!\s*[(){}[\]<>=%~.:,;?+\-*/&|^])|requires|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/, n = /(?:[a-z]\w*\s*\.\s*)*(?:[A-Z]\w*\s*\.\s*)*/.source, c = { pattern: RegExp(/(^|[^\w.])/.source + n + /[A-Z](?:[\d_A-Z]*[a-z]\w*)?\b/.source), lookbehind: !0, inside: { namespace: { pattern: /^[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.)?/, inside: { punctuation: /\./ } }, punctuation: /\./ } };
    e.languages.java = e.languages.extend("clike", { string: { pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"/, lookbehind: !0, greedy: !0 }, "class-name": [c, { pattern: RegExp(/(^|[^\w.])/.source + n + /[A-Z]\w*(?=\s+\w+\s*[;,=()]|\s*(?:\[[\s,]*\]\s*)?::\s*new\b)/.source), lookbehind: !0, inside: c.inside }, { pattern: RegExp(/(\b(?:class|enum|extends|implements|instanceof|interface|new|record|throws)\s+)/.source + n + /[A-Z]\w*\b/.source), lookbehind: !0, inside: c.inside }], keyword: a, function: [e.languages.clike.function, { pattern: /(::\s*)[a-z_]\w*/, lookbehind: !0 }], number: /\b0b[01][01_]*L?\b|\b0x(?:\.[\da-f_p+-]+|[\da-f_]+(?:\.[\da-f_p+-]+)?)\b|(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i, operator: { pattern: /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m, lookbehind: !0 }, constant: /\b[A-Z][A-Z_\d]+\b/ }), e.languages.insertBefore("java", "string", { "triple-quoted-string": { pattern: /"""[ \t]*[\r\n](?:(?:"|"")?(?:\\.|[^"\\]))*"""/, greedy: !0, alias: "string" }, char: { pattern: /'(?:\\.|[^'\\\r\n]){1,6}'/, greedy: !0 } }), e.languages.insertBefore("java", "class-name", { annotation: { pattern: /(^|[^.])@\w+(?:\s*\.\s*\w+)*/, lookbehind: !0, alias: "punctuation" }, generics: { pattern: /<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&))*>)*>)*>)*>/, inside: { "class-name": c, keyword: a, punctuation: /[<>(),.:]/, operator: /[?&|]/ } }, import: [{ pattern: RegExp(/(\bimport\s+)/.source + n + /(?:[A-Z]\w*|\*)(?=\s*;)/.source), lookbehind: !0, inside: { namespace: c.inside.namespace, punctuation: /\./, operator: /\*/, "class-name": /\w+/ } }, { pattern: RegExp(/(\bimport\s+static\s+)/.source + n + /(?:\w+|\*)(?=\s*;)/.source), lookbehind: !0, alias: "static", inside: { namespace: c.inside.namespace, static: /\b\w+$/, punctuation: /\./, operator: /\*/, "class-name": /\w+/ } }], namespace: { pattern: RegExp(/(\b(?:exports|import(?:\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\s+)(?!<keyword>)[a-z]\w*(?:\.[a-z]\w*)*\.?/.source.replace(/<keyword>/g, function() {
      return a.source;
    })), lookbehind: !0, inside: { punctuation: /\./ } } });
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-kotlin.js
var ce = w(() => {
  (function(e) {
    e.languages.kotlin = e.languages.extend("clike", { keyword: { pattern: /(^|[^.])\b(?:abstract|actual|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|do|dynamic|else|enum|expect|external|final|finally|for|fun|get|if|import|in|infix|init|inline|inner|interface|internal|is|lateinit|noinline|null|object|open|operator|out|override|package|private|protected|public|reified|return|sealed|set|super|suspend|tailrec|this|throw|to|try|typealias|val|var|vararg|when|where|while)\b/, lookbehind: !0 }, function: [{ pattern: /(?:`[^\r\n`]+`|\b\w+)(?=\s*\()/, greedy: !0 }, { pattern: /(\.)(?:`[^\r\n`]+`|\w+)(?=\s*\{)/, lookbehind: !0, greedy: !0 }], number: /\b(?:0[xX][\da-fA-F]+(?:_[\da-fA-F]+)*|0[bB][01]+(?:_[01]+)*|\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?[fFL]?)\b/, operator: /\+[+=]?|-[-=>]?|==?=?|!(?:!|==?)?|[\/*%<>]=?|[?:]:?|\.\.|&&|\|\||\b(?:and|inv|or|shl|shr|ushr|xor)\b/ }), delete e.languages.kotlin["class-name"];
    var a = { "interpolation-punctuation": { pattern: /^\$\{?|\}$/, alias: "punctuation" }, expression: { pattern: /[\s\S]+/, inside: e.languages.kotlin } };
    e.languages.insertBefore("kotlin", "string", { "string-literal": [{ pattern: /"""(?:[^$]|\$(?:(?!\{)|\{[^{}]*\}))*?"""/, alias: "multiline", inside: { interpolation: { pattern: /\$(?:[a-z_]\w*|\{[^{}]*\})/i, inside: a }, string: /[\s\S]+/ } }, { pattern: /"(?:[^"\\\r\n$]|\\.|\$(?:(?!\{)|\{[^{}]*\}))*"/, alias: "singleline", inside: { interpolation: { pattern: /((?:^|[^\\])(?:\\{2})*)\$(?:[a-z_]\w*|\{[^{}]*\})/i, lookbehind: !0, inside: a }, string: /[\s\S]+/ } }], char: { pattern: /'(?:[^'\\\r\n]|\\(?:.|u[a-fA-F0-9]{0,4}))'/, greedy: !0 } }), delete e.languages.kotlin.string, e.languages.insertBefore("kotlin", "keyword", { annotation: { pattern: /\B@(?:\w+:)?(?:[A-Z]\w*|\[[^\]]+\])/, alias: "builtin" } }), e.languages.insertBefore("kotlin", "function", { label: { pattern: /\b\w+@|@\w+\b/, alias: "symbol" } }), e.languages.kt = e.languages.kotlin, e.languages.kts = e.languages.kotlin;
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-swift.js
var de = w(() => {
  Prism.languages.swift = { comment: { pattern: /(^|[^\\:])(?:\/\/.*|\/\*(?:[^/*]|\/(?!\*)|\*(?!\/)|\/\*(?:[^*]|\*(?!\/))*\*\/)*\*\/)/, lookbehind: !0, greedy: !0 }, "string-literal": [{ pattern: RegExp(/(^|[^"#])/.source + "(?:" + /"(?:\\(?:\((?:[^()]|\([^()]*\))*\)|\r\n|[^(])|[^\\\r\n"])*"/.source + "|" + /"""(?:\\(?:\((?:[^()]|\([^()]*\))*\)|[^(])|[^\\"]|"(?!""))*"""/.source + ")" + /(?!["#])/.source), lookbehind: !0, greedy: !0, inside: { interpolation: { pattern: /(\\\()(?:[^()]|\([^()]*\))*(?=\))/, lookbehind: !0, inside: null }, "interpolation-punctuation": { pattern: /^\)|\\\($/, alias: "punctuation" }, punctuation: /\\(?=[\r\n])/, string: /[\s\S]+/ } }, { pattern: RegExp(/(^|[^"#])(#+)/.source + "(?:" + /"(?:\\(?:#+\((?:[^()]|\([^()]*\))*\)|\r\n|[^#])|[^\\\r\n])*?"/.source + "|" + /"""(?:\\(?:#+\((?:[^()]|\([^()]*\))*\)|[^#])|[^\\])*?"""/.source + ")\\2"), lookbehind: !0, greedy: !0, inside: { interpolation: { pattern: /(\\#+\()(?:[^()]|\([^()]*\))*(?=\))/, lookbehind: !0, inside: null }, "interpolation-punctuation": { pattern: /^\)|\\#+\($/, alias: "punctuation" }, string: /[\s\S]+/ } }], directive: { pattern: RegExp(/#/.source + "(?:" + (/(?:elseif|if)\b/.source + "(?:[ 	]*" + /(?:![ \t]*)?(?:\b\w+\b(?:[ \t]*\((?:[^()]|\([^()]*\))*\))?|\((?:[^()]|\([^()]*\))*\))(?:[ \t]*(?:&&|\|\|))?/.source + ")+") + "|" + /(?:else|endif)\b/.source + ")"), alias: "property", inside: { "directive-name": /^#\w+/, boolean: /\b(?:false|true)\b/, number: /\b\d+(?:\.\d+)*\b/, operator: /!|&&|\|\||[<>]=?/, punctuation: /[(),]/ } }, literal: { pattern: /#(?:colorLiteral|column|dsohandle|file(?:ID|Literal|Path)?|function|imageLiteral|line)\b/, alias: "constant" }, "other-directive": { pattern: /#\w+\b/, alias: "property" }, attribute: { pattern: /@\w+/, alias: "atrule" }, "function-definition": { pattern: /(\bfunc\s+)\w+/, lookbehind: !0, alias: "function" }, label: { pattern: /\b(break|continue)\s+\w+|\b[a-zA-Z_]\w*(?=\s*:\s*(?:for|repeat|while)\b)/, lookbehind: !0, alias: "important" }, keyword: /\b(?:Any|Protocol|Self|Type|actor|as|assignment|associatedtype|associativity|async|await|break|case|catch|class|continue|convenience|default|defer|deinit|didSet|do|dynamic|else|enum|extension|fallthrough|fileprivate|final|for|func|get|guard|higherThan|if|import|in|indirect|infix|init|inout|internal|is|isolated|lazy|left|let|lowerThan|mutating|none|nonisolated|nonmutating|open|operator|optional|override|postfix|precedencegroup|prefix|private|protocol|public|repeat|required|rethrows|return|right|safe|self|set|some|static|struct|subscript|super|switch|throw|throws|try|typealias|unowned|unsafe|var|weak|where|while|willSet)\b/, boolean: /\b(?:false|true)\b/, nil: { pattern: /\bnil\b/, alias: "constant" }, "short-argument": /\$\d+\b/, omit: { pattern: /\b_\b/, alias: "keyword" }, number: /\b(?:[\d_]+(?:\.[\de_]+)?|0x[a-f0-9_]+(?:\.[a-f0-9p_]+)?|0b[01_]+|0o[0-7_]+)\b/i, "class-name": /\b[A-Z](?:[A-Z_\d]*[a-z]\w*)?\b/, function: /\b[a-z_]\w*(?=\s*\()/i, constant: /\b(?:[A-Z_]{2,}|k[A-Z][A-Za-z_]+)\b/, operator: /[-+*/%=!<>&|^~?]+|\.[.\-+*/%=!<>&|^~?]+/, punctuation: /[{}[\]();,.:\\]/ };
  Prism.languages.swift["string-literal"].forEach(function(e) {
    e.inside.interpolation.inside = Prism.languages.swift;
  });
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-c.js
var pe = w(() => {
  Prism.languages.c = Prism.languages.extend("clike", { comment: { pattern: /\/\/(?:[^\r\n\\]|\\(?:\r\n?|\n|(?![\r\n])))*|\/\*[\s\S]*?(?:\*\/|$)/, greedy: !0 }, string: { pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/, greedy: !0 }, "class-name": { pattern: /(\b(?:enum|struct)\s+(?:__attribute__\s*\(\([\s\S]*?\)\)\s*)?)\w+|\b[a-z]\w*_t\b/, lookbehind: !0 }, keyword: /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|__attribute__|asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|typeof|union|unsigned|void|volatile|while)\b/, function: /\b[a-z_]\w*(?=\s*\()/i, number: /(?:\b0x(?:[\da-f]+(?:\.[\da-f]*)?|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?)[ful]{0,4}/i, operator: />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/ });
  Prism.languages.insertBefore("c", "string", { char: { pattern: /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n]){0,32}'/, greedy: !0 } });
  Prism.languages.insertBefore("c", "string", { macro: { pattern: /(^[\t ]*)#\s*[a-z](?:[^\r\n\\/]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|\\(?:\r\n|[\s\S]))*/im, lookbehind: !0, greedy: !0, alias: "property", inside: { string: [{ pattern: /^(#\s*include\s*)<[^>]+>/, lookbehind: !0 }, Prism.languages.c.string], char: Prism.languages.c.char, comment: Prism.languages.c.comment, "macro-name": [{ pattern: /(^#\s*define\s+)\w+\b(?!\()/i, lookbehind: !0 }, { pattern: /(^#\s*define\s+)\w+\b(?=\()/i, lookbehind: !0, alias: "function" }], directive: { pattern: /^(#\s*)[a-z]+/, lookbehind: !0, alias: "keyword" }, "directive-hash": /^#/, punctuation: /##|\\(?=[\r\n])/, expression: { pattern: /\S[\s\S]*/, inside: Prism.languages.c } } } });
  Prism.languages.insertBefore("c", "function", { constant: /\b(?:EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|__DATE__|__FILE__|__LINE__|__TIMESTAMP__|__TIME__|__func__|stderr|stdin|stdout)\b/ });
  delete Prism.languages.c.boolean;
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-cpp.js
var ge = w(() => {
  (function(e) {
    var a = /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|char8_t|class|co_await|co_return|co_yield|compl|concept|const|const_cast|consteval|constexpr|constinit|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|final|float|for|friend|goto|if|import|inline|int|int16_t|int32_t|int64_t|int8_t|long|module|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|uint16_t|uint32_t|uint64_t|uint8_t|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/, n = /\b(?!<keyword>)\w+(?:\s*\.\s*\w+)*\b/.source.replace(/<keyword>/g, function() {
      return a.source;
    });
    e.languages.cpp = e.languages.extend("c", { "class-name": [{ pattern: RegExp(/(\b(?:class|concept|enum|struct|typename)\s+)(?!<keyword>)\w+/.source.replace(/<keyword>/g, function() {
      return a.source;
    })), lookbehind: !0 }, /\b[A-Z]\w*(?=\s*::\s*\w+\s*\()/, /\b[A-Z_]\w*(?=\s*::\s*~\w+\s*\()/i, /\b\w+(?=\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>\s*::\s*\w+\s*\()/], keyword: a, number: { pattern: /(?:\b0b[01']+|\b0x(?:[\da-f']+(?:\.[\da-f']*)?|\.[\da-f']+)(?:p[+-]?[\d']+)?|(?:\b[\d']+(?:\.[\d']*)?|\B\.[\d']+)(?:e[+-]?[\d']+)?)[ful]{0,4}/i, greedy: !0 }, operator: />>=?|<<=?|->|--|\+\+|&&|\|\||[?:~]|<=>|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/, boolean: /\b(?:false|true)\b/ }), e.languages.insertBefore("cpp", "string", { module: { pattern: RegExp(/(\b(?:import|module)\s+)/.source + "(?:" + /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|<[^<>\r\n]*>/.source + "|" + /<mod-name>(?:\s*:\s*<mod-name>)?|:\s*<mod-name>/.source.replace(/<mod-name>/g, function() {
      return n;
    }) + ")"), lookbehind: !0, greedy: !0, inside: { string: /^[<"][\s\S]+/, operator: /:/, punctuation: /\./ } }, "raw-string": { pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/, alias: "string", greedy: !0 } }), e.languages.insertBefore("cpp", "keyword", { "generic-function": { pattern: /\b(?!operator\b)[a-z_]\w*\s*<(?:[^<>]|<[^<>]*>)*>(?=\s*\()/i, inside: { function: /^\w+/, generic: { pattern: /<[\s\S]+/, alias: "class-name", inside: e.languages.cpp } } } }), e.languages.insertBefore("cpp", "operator", { "double-colon": { pattern: /::/, alias: "punctuation" } }), e.languages.insertBefore("cpp", "class-name", { "base-clause": { pattern: /(\b(?:class|struct)\s+\w+\s*:\s*)[^;{}"'\s]+(?:\s+[^;{}"'\s]+)*(?=\s*[;{])/, lookbehind: !0, greedy: !0, inside: e.languages.extend("cpp", {}) } }), e.languages.insertBefore("inside", "double-colon", { "class-name": /\b[a-z_]\w*\b(?!\s*::)/i }, e.languages.cpp["base-clause"]);
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-csharp.js
var be = w(() => {
  (function(e) {
    function a(T, _) {
      return T.replace(/<<(\d+)>>/g, function($, N) {
        return "(?:" + _[+N] + ")";
      });
    }
    function n(T, _, $) {
      return RegExp(a(T, _), $ || "");
    }
    function c(T, _) {
      for (var $ = 0; $ < _; $++)
        T = T.replace(/<<self>>/g, function() {
          return "(?:" + T + ")";
        });
      return T.replace(/<<self>>/g, "[^\\s\\S]");
    }
    var b = { type: "bool byte char decimal double dynamic float int long object sbyte short string uint ulong ushort var void", typeDeclaration: "class enum interface record struct", contextual: "add alias and ascending async await by descending from(?=\\s*(?:\\w|$)) get global group into init(?=\\s*;) join let nameof not notnull on or orderby partial remove select set unmanaged value when where with(?=\\s*{)", other: "abstract as base break case catch checked const continue default delegate do else event explicit extern finally fixed for foreach goto if implicit in internal is lock namespace new null operator out override params private protected public readonly ref return sealed sizeof stackalloc static switch this throw try typeof unchecked unsafe using virtual volatile while yield" };
    function u(T) {
      return "\\b(?:" + T.trim().replace(/ /g, "|") + ")\\b";
    }
    var f = u(b.typeDeclaration), h = RegExp(u(b.type + " " + b.typeDeclaration + " " + b.contextual + " " + b.other)), l = u(b.typeDeclaration + " " + b.contextual + " " + b.other), g = u(b.type + " " + b.typeDeclaration + " " + b.other), y = c(/<(?:[^<>;=+\-*/%&|^]|<<self>>)*>/.source, 2), E = c(/\((?:[^()]|<<self>>)*\)/.source, 2), v = /@?\b[A-Za-z_]\w*\b/.source, S = a(/<<0>>(?:\s*<<1>>)?/.source, [v, y]), R = a(/(?!<<0>>)<<1>>(?:\s*\.\s*<<1>>)*/.source, [l, S]), O = /\[\s*(?:,\s*)*\]/.source, r = a(/<<0>>(?:\s*(?:\?\s*)?<<1>>)*(?:\s*\?)?/.source, [R, O]), t = a(/[^,()<>[\];=+\-*/%&|^]|<<0>>|<<1>>|<<2>>/.source, [y, E, O]), s = a(/\(<<0>>+(?:,<<0>>+)+\)/.source, [t]), o = a(/(?:<<0>>|<<1>>)(?:\s*(?:\?\s*)?<<2>>)*(?:\s*\?)?/.source, [s, R, O]), i = { keyword: h, punctuation: /[<>()?,.:[\]]/ }, d = /'(?:[^\r\n'\\]|\\.|\\[Uux][\da-fA-F]{1,8})'/.source, m = /"(?:\\.|[^\\"\r\n])*"/.source, p = /@"(?:""|\\[\s\S]|[^\\"])*"(?!")/.source;
    e.languages.csharp = e.languages.extend("clike", { string: [{ pattern: n(/(^|[^$\\])<<0>>/.source, [p]), lookbehind: !0, greedy: !0 }, { pattern: n(/(^|[^@$\\])<<0>>/.source, [m]), lookbehind: !0, greedy: !0 }], "class-name": [{ pattern: n(/(\busing\s+static\s+)<<0>>(?=\s*;)/.source, [R]), lookbehind: !0, inside: i }, { pattern: n(/(\busing\s+<<0>>\s*=\s*)<<1>>(?=\s*;)/.source, [v, o]), lookbehind: !0, inside: i }, { pattern: n(/(\busing\s+)<<0>>(?=\s*=)/.source, [v]), lookbehind: !0 }, { pattern: n(/(\b<<0>>\s+)<<1>>/.source, [f, S]), lookbehind: !0, inside: i }, { pattern: n(/(\bcatch\s*\(\s*)<<0>>/.source, [R]), lookbehind: !0, inside: i }, { pattern: n(/(\bwhere\s+)<<0>>/.source, [v]), lookbehind: !0 }, { pattern: n(/(\b(?:is(?:\s+not)?|as)\s+)<<0>>/.source, [r]), lookbehind: !0, inside: i }, { pattern: n(/\b<<0>>(?=\s+(?!<<1>>|with\s*\{)<<2>>(?:\s*[=,;:{)\]]|\s+(?:in|when)\b))/.source, [o, g, v]), inside: i }], keyword: h, number: /(?:\b0(?:x[\da-f_]*[\da-f]|b[01_]*[01])|(?:\B\.\d+(?:_+\d+)*|\b\d+(?:_+\d+)*(?:\.\d+(?:_+\d+)*)?)(?:e[-+]?\d+(?:_+\d+)*)?)(?:[dflmu]|lu|ul)?\b/i, operator: />>=?|<<=?|[-=]>|([-+&|])\1|~|\?\?=?|[-+*/%&|^!=<>]=?/, punctuation: /\?\.?|::|[{}[\];(),.:]/ }), e.languages.insertBefore("csharp", "number", { range: { pattern: /\.\./, alias: "operator" } }), e.languages.insertBefore("csharp", "punctuation", { "named-parameter": { pattern: n(/([(,]\s*)<<0>>(?=\s*:)/.source, [v]), lookbehind: !0, alias: "punctuation" } }), e.languages.insertBefore("csharp", "class-name", { namespace: { pattern: n(/(\b(?:namespace|using)\s+)<<0>>(?:\s*\.\s*<<0>>)*(?=\s*[;{])/.source, [v]), lookbehind: !0, inside: { punctuation: /\./ } }, "type-expression": { pattern: n(/(\b(?:default|sizeof|typeof)\s*\(\s*(?!\s))(?:[^()\s]|\s(?!\s)|<<0>>)*(?=\s*\))/.source, [E]), lookbehind: !0, alias: "class-name", inside: i }, "return-type": { pattern: n(/<<0>>(?=\s+(?:<<1>>\s*(?:=>|[({]|\.\s*this\s*\[)|this\s*\[))/.source, [o, R]), inside: i, alias: "class-name" }, "constructor-invocation": { pattern: n(/(\bnew\s+)<<0>>(?=\s*[[({])/.source, [o]), lookbehind: !0, inside: i, alias: "class-name" }, "generic-method": { pattern: n(/<<0>>\s*<<1>>(?=\s*\()/.source, [v, y]), inside: { function: n(/^<<0>>/.source, [v]), generic: { pattern: RegExp(y), alias: "class-name", inside: i } } }, "type-list": { pattern: n(/\b((?:<<0>>\s+<<1>>|record\s+<<1>>\s*<<5>>|where\s+<<2>>)\s*:\s*)(?:<<3>>|<<4>>|<<1>>\s*<<5>>|<<6>>)(?:\s*,\s*(?:<<3>>|<<4>>|<<6>>))*(?=\s*(?:where|[{;]|=>|$))/.source, [f, S, v, o, h.source, E, /\bnew\s*\(\s*\)/.source]), lookbehind: !0, inside: { "record-arguments": { pattern: n(/(^(?!new\s*\()<<0>>\s*)<<1>>/.source, [S, E]), lookbehind: !0, greedy: !0, inside: e.languages.csharp }, keyword: h, "class-name": { pattern: RegExp(o), greedy: !0, inside: i }, punctuation: /[,()]/ } }, preprocessor: { pattern: /(^[\t ]*)#.*/m, lookbehind: !0, alias: "property", inside: { directive: { pattern: /(#)\b(?:define|elif|else|endif|endregion|error|if|line|nullable|pragma|region|undef|warning)\b/, lookbehind: !0, alias: "keyword" } } } });
    var A = m + "|" + d, k = a(/\/(?![*/])|\/\/[^\r\n]*[\r\n]|\/\*(?:[^*]|\*(?!\/))*\*\/|<<0>>/.source, [A]), F = c(a(/[^"'/()]|<<0>>|\(<<self>>*\)/.source, [k]), 2), C = /\b(?:assembly|event|field|method|module|param|property|return|type)\b/.source, P = a(/<<0>>(?:\s*\(<<1>>*\))?/.source, [R, F]);
    e.languages.insertBefore("csharp", "class-name", { attribute: { pattern: n(/((?:^|[^\s\w>)?])\s*\[\s*)(?:<<0>>\s*:\s*)?<<1>>(?:\s*,\s*<<1>>)*(?=\s*\])/.source, [C, P]), lookbehind: !0, greedy: !0, inside: { target: { pattern: n(/^<<0>>(?=\s*:)/.source, [C]), alias: "keyword" }, "attribute-arguments": { pattern: n(/\(<<0>>*\)/.source, [F]), inside: e.languages.csharp }, "class-name": { pattern: RegExp(R), inside: { punctuation: /\./ } }, punctuation: /[:,]/ } } });
    var D = /:[^}\r\n]+/.source, U = c(a(/[^"'/()]|<<0>>|\(<<self>>*\)/.source, [k]), 2), z = a(/\{(?!\{)(?:(?![}:])<<0>>)*<<1>>?\}/.source, [U, D]), x = c(a(/[^"'/()]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|<<0>>|\(<<self>>*\)/.source, [A]), 2), I = a(/\{(?!\{)(?:(?![}:])<<0>>)*<<1>>?\}/.source, [x, D]);
    function L(T, _) {
      return { interpolation: { pattern: n(/((?:^|[^{])(?:\{\{)*)<<0>>/.source, [T]), lookbehind: !0, inside: { "format-string": { pattern: n(/(^\{(?:(?![}:])<<0>>)*)<<1>>(?=\}$)/.source, [_, D]), lookbehind: !0, inside: { punctuation: /^:/ } }, punctuation: /^\{|\}$/, expression: { pattern: /[\s\S]+/, alias: "language-csharp", inside: e.languages.csharp } } }, string: /[\s\S]+/ };
    }
    e.languages.insertBefore("csharp", "string", { "interpolation-string": [{ pattern: n(/(^|[^\\])(?:\$@|@\$)"(?:""|\\[\s\S]|\{\{|<<0>>|[^\\{"])*"/.source, [z]), lookbehind: !0, greedy: !0, inside: L(z, U) }, { pattern: n(/(^|[^@\\])\$"(?:\\.|\{\{|<<0>>|[^\\"{])*"/.source, [I]), lookbehind: !0, greedy: !0, inside: L(I, x) }], char: { pattern: RegExp(d), greedy: !0 } }), e.languages.dotnet = e.languages.cs = e.languages.csharp;
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-ruby.js
var fe = w(() => {
  (function(e) {
    e.languages.ruby = e.languages.extend("clike", { comment: { pattern: /#.*|^=begin\s[\s\S]*?^=end/m, greedy: !0 }, "class-name": { pattern: /(\b(?:class|module)\s+|\bcatch\s+\()[\w.\\]+|\b[A-Z_]\w*(?=\s*\.\s*new\b)/, lookbehind: !0, inside: { punctuation: /[.\\]/ } }, keyword: /\b(?:BEGIN|END|alias|and|begin|break|case|class|def|define_method|defined|do|each|else|elsif|end|ensure|extend|for|if|in|include|module|new|next|nil|not|or|prepend|private|protected|public|raise|redo|require|rescue|retry|return|self|super|then|throw|undef|unless|until|when|while|yield)\b/, operator: /\.{2,3}|&\.|===|<?=>|[!=]?~|(?:&&|\|\||<<|>>|\*\*|[+\-*/%<>!^&|=])=?|[?:]/, punctuation: /[(){}[\].,;]/ }), e.languages.insertBefore("ruby", "operator", { "double-colon": { pattern: /::/, alias: "punctuation" } });
    var a = { pattern: /((?:^|[^\\])(?:\\{2})*)#\{(?:[^{}]|\{[^{}]*\})*\}/, lookbehind: !0, inside: { content: { pattern: /^(#\{)[\s\S]+(?=\}$)/, lookbehind: !0, inside: e.languages.ruby }, delimiter: { pattern: /^#\{|\}$/, alias: "punctuation" } } };
    delete e.languages.ruby.function;
    var n = "(?:" + [/([^a-zA-Z0-9\s{(\[<=])(?:(?!\1)[^\\]|\\[\s\S])*\1/.source, /\((?:[^()\\]|\\[\s\S]|\((?:[^()\\]|\\[\s\S])*\))*\)/.source, /\{(?:[^{}\\]|\\[\s\S]|\{(?:[^{}\\]|\\[\s\S])*\})*\}/.source, /\[(?:[^\[\]\\]|\\[\s\S]|\[(?:[^\[\]\\]|\\[\s\S])*\])*\]/.source, /<(?:[^<>\\]|\\[\s\S]|<(?:[^<>\\]|\\[\s\S])*>)*>/.source].join("|") + ")", c = /(?:"(?:\\.|[^"\\\r\n])*"|(?:\b[a-zA-Z_]\w*|[^\s\0-\x7F]+)[?!]?|\$.)/.source;
    e.languages.insertBefore("ruby", "keyword", { "regex-literal": [{ pattern: RegExp(/%r/.source + n + /[egimnosux]{0,6}/.source), greedy: !0, inside: { interpolation: a, regex: /[\s\S]+/ } }, { pattern: /(^|[^/])\/(?!\/)(?:\[[^\r\n\]]+\]|\\.|[^[/\\\r\n])+\/[egimnosux]{0,6}(?=\s*(?:$|[\r\n,.;})#]))/, lookbehind: !0, greedy: !0, inside: { interpolation: a, regex: /[\s\S]+/ } }], variable: /[@$]+[a-zA-Z_]\w*(?:[?!]|\b)/, symbol: [{ pattern: RegExp(/(^|[^:]):/.source + c), lookbehind: !0, greedy: !0 }, { pattern: RegExp(/([\r\n{(,][ \t]*)/.source + c + /(?=:(?!:))/.source), lookbehind: !0, greedy: !0 }], "method-definition": { pattern: /(\bdef\s+)\w+(?:\s*\.\s*\w+)?/, lookbehind: !0, inside: { function: /\b\w+$/, keyword: /^self\b/, "class-name": /^\w+/, punctuation: /\./ } } }), e.languages.insertBefore("ruby", "string", { "string-literal": [{ pattern: RegExp(/%[qQiIwWs]?/.source + n), greedy: !0, inside: { interpolation: a, string: /[\s\S]+/ } }, { pattern: /("|')(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|(?!\1)[^\\#\r\n])*\1/, greedy: !0, inside: { interpolation: a, string: /[\s\S]+/ } }, { pattern: /<<[-~]?([a-z_]\w*)[\r\n](?:.*[\r\n])*?[\t ]*\1/i, alias: "heredoc-string", greedy: !0, inside: { delimiter: { pattern: /^<<[-~]?[a-z_]\w*|\b[a-z_]\w*$/i, inside: { symbol: /\b\w+/, punctuation: /^<<[-~]?/ } }, interpolation: a, string: /[\s\S]+/ } }, { pattern: /<<[-~]?'([a-z_]\w*)'[\r\n](?:.*[\r\n])*?[\t ]*\1/i, alias: "heredoc-string", greedy: !0, inside: { delimiter: { pattern: /^<<[-~]?'[a-z_]\w*'|\b[a-z_]\w*$/i, inside: { symbol: /\b\w+/, punctuation: /^<<[-~]?'|'$/ } }, string: /[\s\S]+/ } }], "command-literal": [{ pattern: RegExp(/%x/.source + n), greedy: !0, inside: { interpolation: a, command: { pattern: /[\s\S]+/, alias: "string" } } }, { pattern: /`(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|[^\\`#\r\n])*`/, greedy: !0, inside: { interpolation: a, command: { pattern: /[\s\S]+/, alias: "string" } } }] }), delete e.languages.ruby.string, e.languages.insertBefore("ruby", "number", { builtin: /\b(?:Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Fixnum|Float|Hash|IO|Integer|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|Stat|String|Struct|Symbol|TMS|Thread|ThreadGroup|Time|TrueClass)\b/, constant: /\b[A-Z][A-Z0-9_]*(?:[?!]|\b)/ }), e.languages.rb = e.languages.ruby;
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-json.js
var he = w(() => {
  Prism.languages.json = { property: { pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/, lookbehind: !0, greedy: !0 }, string: { pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/, lookbehind: !0, greedy: !0 }, comment: { pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/, greedy: !0 }, number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i, punctuation: /[{}[\],]/, operator: /:/, boolean: /\b(?:false|true)\b/, null: { pattern: /\bnull\b/, alias: "keyword" } };
  Prism.languages.webmanifest = Prism.languages.json;
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-yaml.js
var me = w(() => {
  (function(e) {
    var a = /[*&][^\s[\]{},]+/, n = /!(?:<[\w\-%#;/?:@&=+$,.!~*'()[\]]+>|(?:[a-zA-Z\d-]*!)?[\w\-%#;/?:@&=+$.~*'()]+)?/, c = "(?:" + n.source + "(?:[ 	]+" + a.source + ")?|" + a.source + "(?:[ 	]+" + n.source + ")?)", b = /(?:[^\s\x00-\x08\x0e-\x1f!"#%&'*,\-:>?@[\]`{|}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]|[?:-]<PLAIN>)(?:[ \t]*(?:(?![#:])<PLAIN>|:<PLAIN>))*/.source.replace(/<PLAIN>/g, function() {
      return /[^\s\x00-\x08\x0e-\x1f,[\]{}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]/.source;
    }), u = /"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*'/.source;
    function f(h, l) {
      l = (l || "").replace(/m/g, "") + "m";
      var g = /([:\-,[{]\s*(?:\s<<prop>>[ \t]+)?)(?:<<value>>)(?=[ \t]*(?:$|,|\]|\}|(?:[\r\n]\s*)?#))/.source.replace(/<<prop>>/g, function() {
        return c;
      }).replace(/<<value>>/g, function() {
        return h;
      });
      return RegExp(g, l);
    }
    e.languages.yaml = { scalar: { pattern: RegExp(/([\-:]\s*(?:\s<<prop>>[ \t]+)?[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)\S[^\r\n]*(?:\2[^\r\n]+)*)/.source.replace(/<<prop>>/g, function() {
      return c;
    })), lookbehind: !0, alias: "string" }, comment: /#.*/, key: { pattern: RegExp(/((?:^|[:\-,[{\r\n?])[ \t]*(?:<<prop>>[ \t]+)?)<<key>>(?=\s*:\s)/.source.replace(/<<prop>>/g, function() {
      return c;
    }).replace(/<<key>>/g, function() {
      return "(?:" + b + "|" + u + ")";
    })), lookbehind: !0, greedy: !0, alias: "atrule" }, directive: { pattern: /(^[ \t]*)%.+/m, lookbehind: !0, alias: "important" }, datetime: { pattern: f(/\d{4}-\d\d?-\d\d?(?:[tT]|[ \t]+)\d\d?:\d{2}:\d{2}(?:\.\d*)?(?:[ \t]*(?:Z|[-+]\d\d?(?::\d{2})?))?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(?::\d{2}(?:\.\d*)?)?/.source), lookbehind: !0, alias: "number" }, boolean: { pattern: f(/false|true/.source, "i"), lookbehind: !0, alias: "important" }, null: { pattern: f(/null|~/.source, "i"), lookbehind: !0, alias: "important" }, string: { pattern: f(u), lookbehind: !0, greedy: !0 }, number: { pattern: f(/[+-]?(?:0x[\da-f]+|0o[0-7]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|\.inf|\.nan)/.source, "i"), lookbehind: !0 }, tag: n, important: a, punctuation: /---|[:[\]{}\-,|>?]|\.\.\./ }, e.languages.yml = e.languages.yaml;
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-toml.js
var ye = w(() => {
  (function(e) {
    var a = /(?:[\w-]+|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*")/.source;
    function n(c) {
      return c.replace(/__/g, function() {
        return a;
      });
    }
    e.languages.toml = { comment: { pattern: /#.*/, greedy: !0 }, table: { pattern: RegExp(n(/(^[\t ]*\[\s*(?:\[\s*)?)__(?:\s*\.\s*__)*(?=\s*\])/.source), "m"), lookbehind: !0, greedy: !0, alias: "class-name" }, key: { pattern: RegExp(n(/(^[\t ]*|[{,]\s*)__(?:\s*\.\s*__)*(?=\s*=)/.source), "m"), lookbehind: !0, greedy: !0, alias: "property" }, string: { pattern: /"""(?:\\[\s\S]|[^\\])*?"""|'''[\s\S]*?'''|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*"/, greedy: !0 }, date: [{ pattern: /\b\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?\b/i, alias: "number" }, { pattern: /\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/, alias: "number" }], number: /(?:\b0(?:x[\da-zA-Z]+(?:_[\da-zA-Z]+)*|o[0-7]+(?:_[0-7]+)*|b[10]+(?:_[10]+)*))\b|[-+]?\b\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?\b|[-+]?\b(?:inf|nan)\b/, boolean: /\b(?:false|true)\b/, punctuation: /[.,=[\]{}]/ };
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-sql.js
var Ee = w(() => {
  Prism.languages.sql = { comment: { pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/, lookbehind: !0 }, variable: [{ pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/, greedy: !0 }, /@[\w.$]+/], string: { pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/, greedy: !0, lookbehind: !0 }, identifier: { pattern: /(^|[^@\\])`(?:\\[\s\S]|[^`\\]|``)*`/, greedy: !0, lookbehind: !0, inside: { punctuation: /^`|`$/ } }, function: /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i, keyword: /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:COL|_INSERT)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN(?:ING|S)?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i, boolean: /\b(?:FALSE|NULL|TRUE)\b/i, number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i, operator: /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|DIV|ILIKE|IN|IS|LIKE|NOT|OR|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i, punctuation: /[;[\]()`,.]/ };
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-diff.js
var we = w(() => {
  (function(e) {
    e.languages.diff = { coord: [/^(?:\*{3}|-{3}|\+{3}).*$/m, /^@@.*@@$/m, /^\d.*$/m] };
    var a = { "deleted-sign": "-", "deleted-arrow": "<", "inserted-sign": "+", "inserted-arrow": ">", unchanged: " ", diff: "!" };
    Object.keys(a).forEach(function(n) {
      var c = a[n], b = [];
      /^\w+$/.test(n) || b.push(/\w+/.exec(n)[0]), n === "diff" && b.push("bold"), e.languages.diff[n] = { pattern: RegExp("^(?:[" + c + `].*(?:\r
?|
|(?![\\s\\S])))+`, "m"), alias: b, inside: { line: { pattern: /(.)(?=[\s\S]).*(?:\r\n?|\n)?/, lookbehind: !0 }, prefix: { pattern: /[\s\S]/, alias: /\w+/.exec(n)[0] } } };
    });
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-docker.js
var ve = w(() => {
  (function(e) {
    var a = /\\[\r\n](?:\s|\\[\r\n]|#.*(?!.))*(?![\s#]|\\[\r\n])/.source, n = /(?:[ \t]+(?![ \t])(?:<SP_BS>)?|<SP_BS>)/.source.replace(/<SP_BS>/g, function() {
      return a;
    }), c = /"(?:[^"\\\r\n]|\\(?:\r\n|[\s\S]))*"|'(?:[^'\\\r\n]|\\(?:\r\n|[\s\S]))*'/.source, b = /--[\w-]+=(?:<STR>|(?!["'])(?:[^\s\\]|\\.)+)/.source.replace(/<STR>/g, function() {
      return c;
    }), u = { pattern: RegExp(c), greedy: !0 }, f = { pattern: /(^[ \t]*)#.*/m, lookbehind: !0, greedy: !0 };
    function h(l, g) {
      return l = l.replace(/<OPT>/g, function() {
        return b;
      }).replace(/<SP>/g, function() {
        return n;
      }), RegExp(l, g);
    }
    e.languages.docker = { instruction: { pattern: /(^[ \t]*)(?:ADD|ARG|CMD|COPY|ENTRYPOINT|ENV|EXPOSE|FROM|HEALTHCHECK|LABEL|MAINTAINER|ONBUILD|RUN|SHELL|STOPSIGNAL|USER|VOLUME|WORKDIR)(?=\s)(?:\\.|[^\r\n\\])*(?:\\$(?:\s|#.*$)*(?![\s#])(?:\\.|[^\r\n\\])*)*/im, lookbehind: !0, greedy: !0, inside: { options: { pattern: h(/(^(?:ONBUILD<SP>)?\w+<SP>)<OPT>(?:<SP><OPT>)*/.source, "i"), lookbehind: !0, greedy: !0, inside: { property: { pattern: /(^|\s)--[\w-]+/, lookbehind: !0 }, string: [u, { pattern: /(=)(?!["'])(?:[^\s\\]|\\.)+/, lookbehind: !0 }], operator: /\\$/m, punctuation: /=/ } }, keyword: [{ pattern: h(/(^(?:ONBUILD<SP>)?HEALTHCHECK<SP>(?:<OPT><SP>)*)(?:CMD|NONE)\b/.source, "i"), lookbehind: !0, greedy: !0 }, { pattern: h(/(^(?:ONBUILD<SP>)?FROM<SP>(?:<OPT><SP>)*(?!--)[^ \t\\]+<SP>)AS/.source, "i"), lookbehind: !0, greedy: !0 }, { pattern: h(/(^ONBUILD<SP>)\w+/.source, "i"), lookbehind: !0, greedy: !0 }, { pattern: /^\w+/, greedy: !0 }], comment: f, string: u, variable: /\$(?:\w+|\{[^{}"'\\]*\})/, operator: /\\$/m } }, comment: f }, e.languages.dockerfile = e.languages.docker;
  })(Prism);
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-hcl.js
var Se = w(() => {
  Prism.languages.hcl = { comment: /(?:\/\/|#).*|\/\*[\s\S]*?(?:\*\/|$)/, heredoc: { pattern: /<<-?(\w+\b)[\s\S]*?^[ \t]*\1/m, greedy: !0, alias: "string" }, keyword: [{ pattern: /(?:data|resource)\s+(?:"(?:\\[\s\S]|[^\\"])*")(?=\s+"[\w-]+"\s+\{)/i, inside: { type: { pattern: /(resource|data|\s+)(?:"(?:\\[\s\S]|[^\\"])*")/i, lookbehind: !0, alias: "variable" } } }, { pattern: /(?:backend|module|output|provider|provisioner|variable)\s+(?:[\w-]+|"(?:\\[\s\S]|[^\\"])*")\s+(?=\{)/i, inside: { type: { pattern: /(backend|module|output|provider|provisioner|variable)\s+(?:[\w-]+|"(?:\\[\s\S]|[^\\"])*")\s+/i, lookbehind: !0, alias: "variable" } } }, /[\w-]+(?=\s+\{)/], property: [/[-\w\.]+(?=\s*=(?!=))/, /"(?:\\[\s\S]|[^\\"])+"(?=\s*[:=])/], string: { pattern: /"(?:[^\\$"]|\\[\s\S]|\$(?:(?=")|\$+(?!\$)|[^"${])|\$\{(?:[^{}"]|"(?:[^\\"]|\\[\s\S])*")*\})*"/, greedy: !0, inside: { interpolation: { pattern: /(^|[^$])\$\{(?:[^{}"]|"(?:[^\\"]|\\[\s\S])*")*\}/, lookbehind: !0, inside: { type: { pattern: /(\b(?:count|data|local|module|path|self|terraform|var)\b\.)[\w\*]+/i, lookbehind: !0, alias: "variable" }, keyword: /\b(?:count|data|local|module|path|self|terraform|var)\b/i, function: /\w+(?=\()/, string: { pattern: /"(?:\\[\s\S]|[^\\"])*"/, greedy: !0 }, number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?(?:e[+-]?\d+)?/i, punctuation: /[!\$#%&'()*+,.\/;<=>@\[\\\]^`{|}~?:]/ } } } }, number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?(?:e[+-]?\d+)?/i, boolean: /\b(?:false|true)\b/i, punctuation: /[=\[\]{}]/ };
});

// ../../../prismantis/scripts/node_modules/prismjs/components/prism-lua.js
var Ae = w(() => {
  Prism.languages.lua = { comment: /^#!.+|--(?:\[(=*)\[[\s\S]*?\]\1\]|.*)/m, string: { pattern: /(["'])(?:(?!\1)[^\\\r\n]|\\z(?:\r\n|\s)|\\(?:\r\n|[^z]))*\1|\[(=*)\[[\s\S]*?\]\2\]/, greedy: !0 }, number: /\b0x[a-f\d]+(?:\.[a-f\d]*)?(?:p[+-]?\d+)?\b|\b\d+(?:\.\B|(?:\.\d*)?(?:e[+-]?\d+)?\b)|\B\.\d+(?:e[+-]?\d+)?\b/i, keyword: /\b(?:and|break|do|else|elseif|end|false|for|function|goto|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/, function: /(?!\d)\w+(?=\s*(?:[({]))/, operator: [/[-+*%^&|#]|\/\/?|<[<=]?|>[>=]?|[=~]=?/, { pattern: /(^|[^.])\.\.(?!\.)/, lookbehind: !0 }], punctuation: /[\[\](){},;]|\.+|:+/ };
});

// <stdin>
var Y = X();
globalThis.Prism = Y;
V();
Q();
J();
ee();
te();
ne();
re();
ae();
se();
ie();
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
var It = Y.languages, Ft = (e, a) => Y.tokenize(e, a);
export {
  It as languages,
  Ft as tokenize
};
