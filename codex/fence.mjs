// codex-fence.mjs
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// ../hooks/markdown.ts
var scriptMap = (from, to) => new Map(Array.from(from).map((c, i) => [c, Array.from(to)[i]]));
var SUP = scriptMap("0123456789+-\u2212=()niabcdefghjklmoprstuvwxyzABDEGHIJKLMNOPRTUVW", "\u2070\xB9\xB2\xB3\u2074\u2075\u2076\u2077\u2078\u2079\u207A\u207B\u207B\u207C\u207D\u207E\u207F\u2071\u1D43\u1D47\u1D9C\u1D48\u1D49\u1DA0\u1D4D\u02B0\u02B2\u1D4F\u02E1\u1D50\u1D52\u1D56\u02B3\u02E2\u1D57\u1D58\u1D5B\u02B7\u02E3\u02B8\u1DBB\u1D2C\u1D2E\u1D30\u1D31\u1D33\u1D34\u1D35\u1D36\u1D37\u1D38\u1D39\u1D3A\u1D3C\u1D3E\u1D3F\u1D40\u1D41\u2C7D\u1D42");
var SUB = scriptMap("0123456789+-\u2212=()aehijklmnoprstuvx", "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089\u208A\u208B\u208B\u208C\u208D\u208E\u2090\u2091\u2095\u1D62\u2C7C\u2096\u2097\u2098\u2099\u2092\u209A\u1D63\u209B\u209C\u1D64\u1D65\u2093");

// ../hooks/rtl.ts
var TERMINALS = {
  warp: "visual",
  ghostty: "visual",
  wezterm: "visual",
  vscode: "visual",
  alacritty: "visual",
  "windows-terminal": "visual",
  "apple-terminal": "logical",
  kitty: "words",
  iterm: "logical",
  gnome: "logical",
  konsole: "logical"
};
var R = /[֐-׿؀-ٟ٪-ۯۺ-ݿࢠ-ࣿיִ-﷿ﹰ-﻿]/;
var RUN = new RegExp(`(?:${R.source}|\\p{M})+`, "gu");

// ../hooks/vendor/prism.js
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var require_prism_core = __commonJS({ "node_modules/prismjs/components/prism-core.js"(exports, module) {
  var _self = typeof window < "u" ? window : typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope ? self : {};
  var Prism3 = (function(_self2) {
    var lang2 = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i, uniqueId = 0, plainTextGrammar = {}, _ = { manual: _self2.Prism && _self2.Prism.manual, disableWorkerMessageHandler: _self2.Prism && _self2.Prism.disableWorkerMessageHandler, util: { encode: function encode(tokens) {
      return tokens instanceof Token ? new Token(tokens.type, encode(tokens.content), tokens.alias) : Array.isArray(tokens) ? tokens.map(encode) : tokens.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
    }, type: function(o) {
      return Object.prototype.toString.call(o).slice(8, -1);
    }, objId: function(obj) {
      return obj.__id || Object.defineProperty(obj, "__id", { value: ++uniqueId }), obj.__id;
    }, clone: function deepClone(o, visited) {
      visited = visited || {};
      var clone, id;
      switch (_.util.type(o)) {
        case "Object":
          if (id = _.util.objId(o), visited[id]) return visited[id];
          clone = {}, visited[id] = clone;
          for (var key in o) o.hasOwnProperty(key) && (clone[key] = deepClone(o[key], visited));
          return clone;
        case "Array":
          return id = _.util.objId(o), visited[id] ? visited[id] : (clone = [], visited[id] = clone, o.forEach(function(v, i) {
            clone[i] = deepClone(v, visited);
          }), clone);
        default:
          return o;
      }
    }, getLanguage: function(element) {
      for (; element; ) {
        var m = lang2.exec(element.className);
        if (m) return m[1].toLowerCase();
        element = element.parentElement;
      }
      return "none";
    }, setLanguage: function(element, language) {
      element.className = element.className.replace(RegExp(lang2, "gi"), ""), element.classList.add("language-" + language);
    }, currentScript: function() {
      if (typeof document > "u") return null;
      if (document.currentScript && document.currentScript.tagName === "SCRIPT") return document.currentScript;
      try {
        throw new Error();
      } catch (err) {
        var src = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(err.stack) || [])[1];
        if (src) {
          var scripts = document.getElementsByTagName("script");
          for (var i in scripts) if (scripts[i].src == src) return scripts[i];
        }
        return null;
      }
    }, isActive: function(element, className, defaultActivation) {
      for (var no = "no-" + className; element; ) {
        var classList = element.classList;
        if (classList.contains(className)) return true;
        if (classList.contains(no)) return false;
        element = element.parentElement;
      }
      return !!defaultActivation;
    } }, languages: { plain: plainTextGrammar, plaintext: plainTextGrammar, text: plainTextGrammar, txt: plainTextGrammar, extend: function(id, redef) {
      var lang22 = _.util.clone(_.languages[id]);
      for (var key in redef) lang22[key] = redef[key];
      return lang22;
    }, insertBefore: function(inside, before, insert, root) {
      root = root || _.languages;
      var grammar = root[inside], ret = {};
      for (var token in grammar) if (grammar.hasOwnProperty(token)) {
        if (token == before) for (var newToken in insert) insert.hasOwnProperty(newToken) && (ret[newToken] = insert[newToken]);
        insert.hasOwnProperty(token) || (ret[token] = grammar[token]);
      }
      var old = root[inside];
      return root[inside] = ret, _.languages.DFS(_.languages, function(key, value) {
        value === old && key != inside && (this[key] = ret);
      }), ret;
    }, DFS: function DFS(o, callback, type, visited) {
      visited = visited || {};
      var objId = _.util.objId;
      for (var i in o) if (o.hasOwnProperty(i)) {
        callback.call(o, i, o[i], type || i);
        var property = o[i], propertyType = _.util.type(property);
        propertyType === "Object" && !visited[objId(property)] ? (visited[objId(property)] = true, DFS(property, callback, null, visited)) : propertyType === "Array" && !visited[objId(property)] && (visited[objId(property)] = true, DFS(property, callback, i, visited));
      }
    } }, plugins: {}, highlightAll: function(async, callback) {
      _.highlightAllUnder(document, async, callback);
    }, highlightAllUnder: function(container, async, callback) {
      var env = { callback, container, selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code' };
      _.hooks.run("before-highlightall", env), env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector)), _.hooks.run("before-all-elements-highlight", env);
      for (var i = 0, element; element = env.elements[i++]; ) _.highlightElement(element, async === true, env.callback);
    }, highlightElement: function(element, async, callback) {
      var language = _.util.getLanguage(element), grammar = _.languages[language];
      _.util.setLanguage(element, language);
      var parent = element.parentElement;
      parent && parent.nodeName.toLowerCase() === "pre" && _.util.setLanguage(parent, language);
      var code = element.textContent, env = { element, language, grammar, code };
      function insertHighlightedCode(highlightedCode) {
        env.highlightedCode = highlightedCode, _.hooks.run("before-insert", env), env.element.innerHTML = env.highlightedCode, _.hooks.run("after-highlight", env), _.hooks.run("complete", env), callback && callback.call(env.element);
      }
      if (_.hooks.run("before-sanity-check", env), parent = env.element.parentElement, parent && parent.nodeName.toLowerCase() === "pre" && !parent.hasAttribute("tabindex") && parent.setAttribute("tabindex", "0"), !env.code) {
        _.hooks.run("complete", env), callback && callback.call(env.element);
        return;
      }
      if (_.hooks.run("before-highlight", env), !env.grammar) {
        insertHighlightedCode(_.util.encode(env.code));
        return;
      }
      if (async && _self2.Worker) {
        var worker = new Worker(_.filename);
        worker.onmessage = function(evt) {
          insertHighlightedCode(evt.data);
        }, worker.postMessage(JSON.stringify({ language: env.language, code: env.code, immediateClose: true }));
      } else insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
    }, highlight: function(text2, grammar, language) {
      var env = { code: text2, grammar, language };
      if (_.hooks.run("before-tokenize", env), !env.grammar) throw new Error('The language "' + env.language + '" has no grammar.');
      return env.tokens = _.tokenize(env.code, env.grammar), _.hooks.run("after-tokenize", env), Token.stringify(_.util.encode(env.tokens), env.language);
    }, tokenize: function(text2, grammar) {
      var rest = grammar.rest;
      if (rest) {
        for (var token in rest) grammar[token] = rest[token];
        delete grammar.rest;
      }
      var tokenList = new LinkedList();
      return addAfter(tokenList, tokenList.head, text2), matchGrammar(text2, tokenList, grammar, tokenList.head, 0), toArray(tokenList);
    }, hooks: { all: {}, add: function(name, callback) {
      var hooks = _.hooks.all;
      hooks[name] = hooks[name] || [], hooks[name].push(callback);
    }, run: function(name, env) {
      var callbacks = _.hooks.all[name];
      if (!(!callbacks || !callbacks.length)) for (var i = 0, callback; callback = callbacks[i++]; ) callback(env);
    } }, Token };
    _self2.Prism = _;
    function Token(type, content, alias, matchedStr) {
      this.type = type, this.content = content, this.alias = alias, this.length = (matchedStr || "").length | 0;
    }
    Token.stringify = function stringify(o, language) {
      if (typeof o == "string") return o;
      if (Array.isArray(o)) {
        var s = "";
        return o.forEach(function(e) {
          s += stringify(e, language);
        }), s;
      }
      var env = { type: o.type, content: stringify(o.content, language), tag: "span", classes: ["token", o.type], attributes: {}, language }, aliases = o.alias;
      aliases && (Array.isArray(aliases) ? Array.prototype.push.apply(env.classes, aliases) : env.classes.push(aliases)), _.hooks.run("wrap", env);
      var attributes = "";
      for (var name in env.attributes) attributes += " " + name + '="' + (env.attributes[name] || "").replace(/"/g, "&quot;") + '"';
      return "<" + env.tag + ' class="' + env.classes.join(" ") + '"' + attributes + ">" + env.content + "</" + env.tag + ">";
    };
    function matchPattern(pattern, pos, text2, lookbehind) {
      pattern.lastIndex = pos;
      var match = pattern.exec(text2);
      if (match && lookbehind && match[1]) {
        var lookbehindLength = match[1].length;
        match.index += lookbehindLength, match[0] = match[0].slice(lookbehindLength);
      }
      return match;
    }
    function matchGrammar(text2, tokenList, grammar, startNode, startPos, rematch) {
      for (var token in grammar) if (!(!grammar.hasOwnProperty(token) || !grammar[token])) {
        var patterns = grammar[token];
        patterns = Array.isArray(patterns) ? patterns : [patterns];
        for (var j = 0; j < patterns.length; ++j) {
          if (rematch && rematch.cause == token + "," + j) return;
          var patternObj = patterns[j], inside = patternObj.inside, lookbehind = !!patternObj.lookbehind, greedy = !!patternObj.greedy, alias = patternObj.alias;
          if (greedy && !patternObj.pattern.global) {
            var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
            patternObj.pattern = RegExp(patternObj.pattern.source, flags + "g");
          }
          for (var pattern = patternObj.pattern || patternObj, currentNode = startNode.next, pos = startPos; currentNode !== tokenList.tail && !(rematch && pos >= rematch.reach); pos += currentNode.value.length, currentNode = currentNode.next) {
            var str = currentNode.value;
            if (tokenList.length > text2.length) return;
            if (!(str instanceof Token)) {
              var removeCount = 1, match;
              if (greedy) {
                if (match = matchPattern(pattern, pos, text2, lookbehind), !match || match.index >= text2.length) break;
                var from = match.index, to = match.index + match[0].length, p = pos;
                for (p += currentNode.value.length; from >= p; ) currentNode = currentNode.next, p += currentNode.value.length;
                if (p -= currentNode.value.length, pos = p, currentNode.value instanceof Token) continue;
                for (var k = currentNode; k !== tokenList.tail && (p < to || typeof k.value == "string"); k = k.next) removeCount++, p += k.value.length;
                removeCount--, str = text2.slice(pos, p), match.index -= pos;
              } else if (match = matchPattern(pattern, 0, str, lookbehind), !match) continue;
              var from = match.index, matchStr = match[0], before = str.slice(0, from), after = str.slice(from + matchStr.length), reach = pos + str.length;
              rematch && reach > rematch.reach && (rematch.reach = reach);
              var removeFrom = currentNode.prev;
              before && (removeFrom = addAfter(tokenList, removeFrom, before), pos += before.length), removeRange(tokenList, removeFrom, removeCount);
              var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
              if (currentNode = addAfter(tokenList, removeFrom, wrapped), after && addAfter(tokenList, currentNode, after), removeCount > 1) {
                var nestedRematch = { cause: token + "," + j, reach };
                matchGrammar(text2, tokenList, grammar, currentNode.prev, pos, nestedRematch), rematch && nestedRematch.reach > rematch.reach && (rematch.reach = nestedRematch.reach);
              }
            }
          }
        }
      }
    }
    function LinkedList() {
      var head = { value: null, prev: null, next: null }, tail = { value: null, prev: head, next: null };
      head.next = tail, this.head = head, this.tail = tail, this.length = 0;
    }
    function addAfter(list, node, value) {
      var next = node.next, newNode = { value, prev: node, next };
      return node.next = newNode, next.prev = newNode, list.length++, newNode;
    }
    function removeRange(list, node, count) {
      for (var next = node.next, i = 0; i < count && next !== list.tail; i++) next = next.next;
      node.next = next, next.prev = node, list.length -= i;
    }
    function toArray(list) {
      for (var array = [], node = list.head.next; node !== list.tail; ) array.push(node.value), node = node.next;
      return array;
    }
    if (!_self2.document) return _self2.addEventListener && (_.disableWorkerMessageHandler || _self2.addEventListener("message", function(evt) {
      var message = JSON.parse(evt.data), lang22 = message.language, code = message.code, immediateClose = message.immediateClose;
      _self2.postMessage(_.highlight(code, _.languages[lang22], lang22)), immediateClose && _self2.close();
    }, false)), _;
    var script = _.util.currentScript();
    script && (_.filename = script.src, script.hasAttribute("data-manual") && (_.manual = true));
    function highlightAutomaticallyCallback() {
      _.manual || _.highlightAll();
    }
    if (!_.manual) {
      var readyState = document.readyState;
      readyState === "loading" || readyState === "interactive" && script && script.defer ? document.addEventListener("DOMContentLoaded", highlightAutomaticallyCallback) : window.requestAnimationFrame ? window.requestAnimationFrame(highlightAutomaticallyCallback) : window.setTimeout(highlightAutomaticallyCallback, 16);
    }
    return _;
  })(_self);
  typeof module < "u" && module.exports && (module.exports = Prism3);
  typeof global < "u" && (global.Prism = Prism3);
} });
var require_prism_clike = __commonJS({ "node_modules/prismjs/components/prism-clike.js"() {
  Prism.languages.clike = { comment: [{ pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/, lookbehind: true, greedy: true }, { pattern: /(^|[^\\:])\/\/.*/, lookbehind: true, greedy: true }], string: { pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/, greedy: true }, "class-name": { pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i, lookbehind: true, inside: { punctuation: /[.\\]/ } }, keyword: /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/, boolean: /\b(?:false|true)\b/, function: /\b\w+(?=\()/, number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i, operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/, punctuation: /[{}[\];(),.:]/ };
} });
var require_prism_markup = __commonJS({ "node_modules/prismjs/components/prism-markup.js"() {
  Prism.languages.markup = { comment: { pattern: /<!--(?:(?!<!--)[\s\S])*?-->/, greedy: true }, prolog: { pattern: /<\?[\s\S]+?\?>/, greedy: true }, doctype: { pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i, greedy: true, inside: { "internal-subset": { pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/, lookbehind: true, greedy: true, inside: null }, string: { pattern: /"[^"]*"|'[^']*'/, greedy: true }, punctuation: /^<!|>$|[[\]]/, "doctype-tag": /^DOCTYPE/i, name: /[^\s<>'"]+/ } }, cdata: { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, greedy: true }, tag: { pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/, greedy: true, inside: { tag: { pattern: /^<\/?[^\s>\/]+/, inside: { punctuation: /^<\/?/, namespace: /^[^\s>\/:]+:/ } }, "special-attr": [], "attr-value": { pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/, inside: { punctuation: [{ pattern: /^=/, alias: "attr-equals" }, { pattern: /^(\s*)["']|["']$/, lookbehind: true }] } }, punctuation: /\/?>/, "attr-name": { pattern: /[^\s>\/]+/, inside: { namespace: /^[^\s>\/:]+:/ } } } }, entity: [{ pattern: /&[\da-z]{1,8};/i, alias: "named-entity" }, /&#x?[\da-f]{1,8};/i] };
  Prism.languages.markup.tag.inside["attr-value"].inside.entity = Prism.languages.markup.entity;
  Prism.languages.markup.doctype.inside["internal-subset"].inside = Prism.languages.markup;
  Prism.hooks.add("wrap", function(env) {
    env.type === "entity" && (env.attributes.title = env.content.replace(/&amp;/, "&"));
  });
  Object.defineProperty(Prism.languages.markup.tag, "addInlined", { value: function(tagName, lang2) {
    var includedCdataInside = {};
    includedCdataInside["language-" + lang2] = { pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i, lookbehind: true, inside: Prism.languages[lang2] }, includedCdataInside.cdata = /^<!\[CDATA\[|\]\]>$/i;
    var inside = { "included-cdata": { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, inside: includedCdataInside } };
    inside["language-" + lang2] = { pattern: /[\s\S]+/, inside: Prism.languages[lang2] };
    var def = {};
    def[tagName] = { pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function() {
      return tagName;
    }), "i"), lookbehind: true, greedy: true, inside }, Prism.languages.insertBefore("markup", "cdata", def);
  } });
  Object.defineProperty(Prism.languages.markup.tag, "addAttribute", { value: function(attrName, lang2) {
    Prism.languages.markup.tag.inside["special-attr"].push({ pattern: RegExp(/(^|["'\s])/.source + "(?:" + attrName + ")" + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source, "i"), lookbehind: true, inside: { "attr-name": /^[^\s=]+/, "attr-value": { pattern: /=[\s\S]+/, inside: { value: { pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/, lookbehind: true, alias: [lang2, "language-" + lang2], inside: Prism.languages[lang2] }, punctuation: [{ pattern: /^=/, alias: "attr-equals" }, /"|'/] } } } });
  } });
  Prism.languages.html = Prism.languages.markup;
  Prism.languages.mathml = Prism.languages.markup;
  Prism.languages.svg = Prism.languages.markup;
  Prism.languages.xml = Prism.languages.extend("markup", {});
  Prism.languages.ssml = Prism.languages.xml;
  Prism.languages.atom = Prism.languages.xml;
  Prism.languages.rss = Prism.languages.xml;
} });
var require_prism_css = __commonJS({ "node_modules/prismjs/components/prism-css.js"() {
  (function(Prism3) {
    var string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
    Prism3.languages.css = { comment: /\/\*[\s\S]*?\*\//, atrule: { pattern: RegExp("@[\\w-](?:" + /[^;{\s"']|\s+(?!\s)/.source + "|" + string.source + ")*?" + /(?:;|(?=\s*\{))/.source), inside: { rule: /^@[\w-]+/, "selector-function-argument": { pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/, lookbehind: true, alias: "selector" }, keyword: { pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/, lookbehind: true } } }, url: { pattern: RegExp("\\burl\\((?:" + string.source + "|" + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ")\\)", "i"), greedy: true, inside: { function: /^url/i, punctuation: /^\(|\)$/, string: { pattern: RegExp("^" + string.source + "$"), alias: "url" } } }, selector: { pattern: RegExp(`(^|[{}\\s])[^{}\\s](?:[^{};"'\\s]|\\s+(?![\\s{])|` + string.source + ")*(?=\\s*\\{)"), lookbehind: true }, string: { pattern: string, greedy: true }, property: { pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i, lookbehind: true }, important: /!important\b/i, function: { pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i, lookbehind: true }, punctuation: /[(){};:,]/ }, Prism3.languages.css.atrule.inside.rest = Prism3.languages.css;
    var markup = Prism3.languages.markup;
    markup && (markup.tag.addInlined("style", "css"), markup.tag.addAttribute("style", "css"));
  })(Prism);
} });
var require_prism_javascript = __commonJS({ "node_modules/prismjs/components/prism-javascript.js"() {
  Prism.languages.javascript = Prism.languages.extend("clike", { "class-name": [Prism.languages.clike["class-name"], { pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/, lookbehind: true }], keyword: [{ pattern: /((?:^|\})\s*)catch\b/, lookbehind: true }, { pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/, lookbehind: true }], function: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/, number: { pattern: RegExp(/(^|[^\w$])/.source + "(?:" + (/NaN|Infinity/.source + "|" + /0[bB][01]+(?:_[01]+)*n?/.source + "|" + /0[oO][0-7]+(?:_[0-7]+)*n?/.source + "|" + /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source + "|" + /\d+(?:_\d+)*n/.source + "|" + /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source) + ")" + /(?![\w$])/.source), lookbehind: true }, operator: /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/ });
  Prism.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;
  Prism.languages.insertBefore("javascript", "keyword", { regex: { pattern: RegExp(/((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source + /\//.source + "(?:" + /(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source + "|" + /(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source + ")" + /(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source), lookbehind: true, greedy: true, inside: { "regex-source": { pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/, lookbehind: true, alias: "language-regex", inside: Prism.languages.regex }, "regex-delimiter": /^\/|\/$/, "regex-flags": /^[a-z]+$/ } }, "function-variable": { pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/, alias: "function" }, parameter: [{ pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/, lookbehind: true, inside: Prism.languages.javascript }, { pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i, lookbehind: true, inside: Prism.languages.javascript }, { pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/, lookbehind: true, inside: Prism.languages.javascript }, { pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/, lookbehind: true, inside: Prism.languages.javascript }], constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/ });
  Prism.languages.insertBefore("javascript", "string", { hashbang: { pattern: /^#!.*/, greedy: true, alias: "comment" }, "template-string": { pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/, greedy: true, inside: { "template-punctuation": { pattern: /^`|`$/, alias: "string" }, interpolation: { pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/, lookbehind: true, inside: { "interpolation-punctuation": { pattern: /^\$\{|\}$/, alias: "punctuation" }, rest: Prism.languages.javascript } }, string: /[\s\S]+/ } }, "string-property": { pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m, lookbehind: true, greedy: true, alias: "property" } });
  Prism.languages.insertBefore("javascript", "operator", { "literal-property": { pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m, lookbehind: true, alias: "property" } });
  Prism.languages.markup && (Prism.languages.markup.tag.addInlined("script", "javascript"), Prism.languages.markup.tag.addAttribute(/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source, "javascript"));
  Prism.languages.js = Prism.languages.javascript;
} });
var require_prism_typescript = __commonJS({ "node_modules/prismjs/components/prism-typescript.js"() {
  (function(Prism3) {
    Prism3.languages.typescript = Prism3.languages.extend("javascript", { "class-name": { pattern: /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/, lookbehind: true, greedy: true, inside: null }, builtin: /\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\b/ }), Prism3.languages.typescript.keyword.push(/\b(?:abstract|declare|is|keyof|readonly|require)\b/, /\b(?:asserts|infer|interface|module|namespace|type)\b(?=\s*(?:[{_$a-zA-Z\xA0-\uFFFF]|$))/, /\btype\b(?=\s*(?:[\{*]|$))/), delete Prism3.languages.typescript.parameter, delete Prism3.languages.typescript["literal-property"];
    var typeInside = Prism3.languages.extend("typescript", {});
    delete typeInside["class-name"], Prism3.languages.typescript["class-name"].inside = typeInside, Prism3.languages.insertBefore("typescript", "function", { decorator: { pattern: /@[$\w\xA0-\uFFFF]+/, inside: { at: { pattern: /^@/, alias: "operator" }, function: /^[\s\S]+/ } }, "generic-function": { pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/, greedy: true, inside: { function: /^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/, generic: { pattern: /<[\s\S]+/, alias: "class-name", inside: typeInside } } } }), Prism3.languages.ts = Prism3.languages.typescript;
  })(Prism);
} });
var require_prism_jsx = __commonJS({ "node_modules/prismjs/components/prism-jsx.js"() {
  (function(Prism3) {
    var javascript = Prism3.util.clone(Prism3.languages.javascript), space = /(?:\s|\/\/.*(?!.)|\/\*(?:[^*]|\*(?!\/))\*\/)/.source, braces = /(?:\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])*\})/.source, spread = /(?:\{<S>*\.{3}(?:[^{}]|<BRACES>)*\})/.source;
    function re(source2, flags) {
      return source2 = source2.replace(/<S>/g, function() {
        return space;
      }).replace(/<BRACES>/g, function() {
        return braces;
      }).replace(/<SPREAD>/g, function() {
        return spread;
      }), RegExp(source2, flags);
    }
    spread = re(spread).source, Prism3.languages.jsx = Prism3.languages.extend("markup", javascript), Prism3.languages.jsx.tag.pattern = re(/<\/?(?:[\w.:-]+(?:<S>+(?:[\w.:$-]+(?:=(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s{'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*\/?)?>/.source), Prism3.languages.jsx.tag.inside.tag.pattern = /^<\/?[^\s>\/]*/, Prism3.languages.jsx.tag.inside["attr-value"].pattern = /=(?!\{)(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s'">]+)/, Prism3.languages.jsx.tag.inside.tag.inside["class-name"] = /^[A-Z]\w*(?:\.[A-Z]\w*)*$/, Prism3.languages.jsx.tag.inside.comment = javascript.comment, Prism3.languages.insertBefore("inside", "attr-name", { spread: { pattern: re(/<SPREAD>/.source), inside: Prism3.languages.jsx } }, Prism3.languages.jsx.tag), Prism3.languages.insertBefore("inside", "special-attr", { script: { pattern: re(/=<BRACES>/.source), alias: "language-javascript", inside: { "script-punctuation": { pattern: /^=(?=\{)/, alias: "punctuation" }, rest: Prism3.languages.jsx } } }, Prism3.languages.jsx.tag);
    var stringifyToken = function(token) {
      return token ? typeof token == "string" ? token : typeof token.content == "string" ? token.content : token.content.map(stringifyToken).join("") : "";
    }, walkTokens = function(tokens) {
      for (var openedTags = [], i = 0; i < tokens.length; i++) {
        var token = tokens[i], notTagNorBrace = false;
        if (typeof token != "string" && (token.type === "tag" && token.content[0] && token.content[0].type === "tag" ? token.content[0].content[0].content === "</" ? openedTags.length > 0 && openedTags[openedTags.length - 1].tagName === stringifyToken(token.content[0].content[1]) && openedTags.pop() : token.content[token.content.length - 1].content === "/>" || openedTags.push({ tagName: stringifyToken(token.content[0].content[1]), openedBraces: 0 }) : openedTags.length > 0 && token.type === "punctuation" && token.content === "{" ? openedTags[openedTags.length - 1].openedBraces++ : openedTags.length > 0 && openedTags[openedTags.length - 1].openedBraces > 0 && token.type === "punctuation" && token.content === "}" ? openedTags[openedTags.length - 1].openedBraces-- : notTagNorBrace = true), (notTagNorBrace || typeof token == "string") && openedTags.length > 0 && openedTags[openedTags.length - 1].openedBraces === 0) {
          var plainText = stringifyToken(token);
          i < tokens.length - 1 && (typeof tokens[i + 1] == "string" || tokens[i + 1].type === "plain-text") && (plainText += stringifyToken(tokens[i + 1]), tokens.splice(i + 1, 1)), i > 0 && (typeof tokens[i - 1] == "string" || tokens[i - 1].type === "plain-text") && (plainText = stringifyToken(tokens[i - 1]) + plainText, tokens.splice(i - 1, 1), i--), tokens[i] = new Prism3.Token("plain-text", plainText, null, plainText);
        }
        token.content && typeof token.content != "string" && walkTokens(token.content);
      }
    };
    Prism3.hooks.add("after-tokenize", function(env) {
      env.language !== "jsx" && env.language !== "tsx" || walkTokens(env.tokens);
    });
  })(Prism);
} });
var require_prism_tsx = __commonJS({ "node_modules/prismjs/components/prism-tsx.js"() {
  (function(Prism3) {
    var typescript = Prism3.util.clone(Prism3.languages.typescript);
    Prism3.languages.tsx = Prism3.languages.extend("jsx", typescript), delete Prism3.languages.tsx.parameter, delete Prism3.languages.tsx["literal-property"];
    var tag = Prism3.languages.tsx.tag;
    tag.pattern = RegExp(/(^|[^\w$]|(?=<\/))/.source + "(?:" + tag.pattern.source + ")", tag.pattern.flags), tag.lookbehind = true;
  })(Prism);
} });
var require_prism_python = __commonJS({ "node_modules/prismjs/components/prism-python.js"() {
  Prism.languages.python = { comment: { pattern: /(^|[^\\])#.*/, lookbehind: true, greedy: true }, "string-interpolation": { pattern: /(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i, greedy: true, inside: { interpolation: { pattern: /((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}])+\})+\})+\}/, lookbehind: true, inside: { "format-spec": { pattern: /(:)[^:(){}]+(?=\}$)/, lookbehind: true }, "conversion-option": { pattern: /![sra](?=[:}]$)/, alias: "punctuation" }, rest: null } }, string: /[\s\S]+/ } }, "triple-quoted-string": { pattern: /(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i, greedy: true, alias: "string" }, string: { pattern: /(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i, greedy: true }, function: { pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g, lookbehind: true }, "class-name": { pattern: /(\bclass\s+)\w+/i, lookbehind: true }, decorator: { pattern: /(^[\t ]*)@\w+(?:\.\w+)*/m, lookbehind: true, alias: ["annotation", "punctuation"], inside: { punctuation: /\./ } }, keyword: /\b(?:_(?=\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/, builtin: /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/, boolean: /\b(?:False|None|True)\b/, number: /\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i, operator: /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/, punctuation: /[{}[\];(),.:]/ };
  Prism.languages.python["string-interpolation"].inside.interpolation.inside.rest = Prism.languages.python;
  Prism.languages.py = Prism.languages.python;
} });
var require_prism_go = __commonJS({ "node_modules/prismjs/components/prism-go.js"() {
  Prism.languages.go = Prism.languages.extend("clike", { string: { pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"|`[^`]*`/, lookbehind: true, greedy: true }, keyword: /\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(?:to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/, boolean: /\b(?:_|false|iota|nil|true)\b/, number: [/\b0(?:b[01_]+|o[0-7_]+)i?\b/i, /\b0x(?:[a-f\d_]+(?:\.[a-f\d_]*)?|\.[a-f\d_]+)(?:p[+-]?\d+(?:_\d+)*)?i?(?!\w)/i, /(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?[\d_]+)?i?(?!\w)/i], operator: /[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./, builtin: /\b(?:append|bool|byte|cap|close|complex|complex(?:64|128)|copy|delete|error|float(?:32|64)|u?int(?:8|16|32|64)?|imag|len|make|new|panic|print(?:ln)?|real|recover|rune|string|uintptr)\b/ });
  Prism.languages.insertBefore("go", "string", { char: { pattern: /'(?:\\.|[^'\\\r\n]){0,10}'/, greedy: true } });
  delete Prism.languages.go["class-name"];
} });
var require_prism_rust = __commonJS({ "node_modules/prismjs/components/prism-rust.js"() {
  (function(Prism3) {
    for (var multilineComment = /\/\*(?:[^*/]|\*(?!\/)|\/(?!\*)|<self>)*\*\//.source, i = 0; i < 2; i++) multilineComment = multilineComment.replace(/<self>/g, function() {
      return multilineComment;
    });
    multilineComment = multilineComment.replace(/<self>/g, function() {
      return /[^\s\S]/.source;
    }), Prism3.languages.rust = { comment: [{ pattern: RegExp(/(^|[^\\])/.source + multilineComment), lookbehind: true, greedy: true }, { pattern: /(^|[^\\:])\/\/.*/, lookbehind: true, greedy: true }], string: { pattern: /b?"(?:\\[\s\S]|[^\\"])*"|b?r(#*)"(?:[^"]|"(?!\1))*"\1/, greedy: true }, char: { pattern: /b?'(?:\\(?:x[0-7][\da-fA-F]|u\{(?:[\da-fA-F]_*){1,6}\}|.)|[^\\\r\n\t'])'/, greedy: true }, attribute: { pattern: /#!?\[(?:[^\[\]"]|"(?:\\[\s\S]|[^\\"])*")*\]/, greedy: true, alias: "attr-name", inside: { string: null } }, "closure-params": { pattern: /([=(,:]\s*|\bmove\s*)\|[^|]*\||\|[^|]*\|(?=\s*(?:\{|->))/, lookbehind: true, greedy: true, inside: { "closure-punctuation": { pattern: /^\||\|$/, alias: "punctuation" }, rest: null } }, "lifetime-annotation": { pattern: /'\w+/, alias: "symbol" }, "fragment-specifier": { pattern: /(\$\w+:)[a-z]+/, lookbehind: true, alias: "punctuation" }, variable: /\$\w+/, "function-definition": { pattern: /(\bfn\s+)\w+/, lookbehind: true, alias: "function" }, "type-definition": { pattern: /(\b(?:enum|struct|trait|type|union)\s+)\w+/, lookbehind: true, alias: "class-name" }, "module-declaration": [{ pattern: /(\b(?:crate|mod)\s+)[a-z][a-z_\d]*/, lookbehind: true, alias: "namespace" }, { pattern: /(\b(?:crate|self|super)\s*)::\s*[a-z][a-z_\d]*\b(?:\s*::(?:\s*[a-z][a-z_\d]*\s*::)*)?/, lookbehind: true, alias: "namespace", inside: { punctuation: /::/ } }], keyword: [/\b(?:Self|abstract|as|async|await|become|box|break|const|continue|crate|do|dyn|else|enum|extern|final|fn|for|if|impl|in|let|loop|macro|match|mod|move|mut|override|priv|pub|ref|return|self|static|struct|super|trait|try|type|typeof|union|unsafe|unsized|use|virtual|where|while|yield)\b/, /\b(?:bool|char|f(?:32|64)|[ui](?:8|16|32|64|128|size)|str)\b/], function: /\b[a-z_]\w*(?=\s*(?:::\s*<|\())/, macro: { pattern: /\b\w+!/, alias: "property" }, constant: /\b[A-Z_][A-Z_\d]+\b/, "class-name": /\b[A-Z]\w*\b/, namespace: { pattern: /(?:\b[a-z][a-z_\d]*\s*::\s*)*\b[a-z][a-z_\d]*\s*::(?!\s*<)/, inside: { punctuation: /::/ } }, number: /\b(?:0x[\dA-Fa-f](?:_?[\dA-Fa-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|(?:(?:\d(?:_?\d)*)?\.)?\d(?:_?\d)*(?:[Ee][+-]?\d+)?)(?:_?(?:f32|f64|[iu](?:8|16|32|64|size)?))?\b/, boolean: /\b(?:false|true)\b/, punctuation: /->|\.\.=|\.{1,3}|::|[{}[\];(),:]/, operator: /[-+*\/%!^]=?|=[=>]?|&[&=]?|\|[|=]?|<<?=?|>>?=?|[@?]/ }, Prism3.languages.rust["closure-params"].inside.rest = Prism3.languages.rust, Prism3.languages.rust.attribute.inside.string = Prism3.languages.rust.string;
  })(Prism);
} });
var require_prism_java = __commonJS({ "node_modules/prismjs/components/prism-java.js"() {
  (function(Prism3) {
    var keywords = /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|non-sealed|null|open|opens|package|permits|private|protected|provides|public|record(?!\s*[(){}[\]<>=%~.:,;?+\-*/&|^])|requires|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/, classNamePrefix = /(?:[a-z]\w*\s*\.\s*)*(?:[A-Z]\w*\s*\.\s*)*/.source, className = { pattern: RegExp(/(^|[^\w.])/.source + classNamePrefix + /[A-Z](?:[\d_A-Z]*[a-z]\w*)?\b/.source), lookbehind: true, inside: { namespace: { pattern: /^[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.)?/, inside: { punctuation: /\./ } }, punctuation: /\./ } };
    Prism3.languages.java = Prism3.languages.extend("clike", { string: { pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"/, lookbehind: true, greedy: true }, "class-name": [className, { pattern: RegExp(/(^|[^\w.])/.source + classNamePrefix + /[A-Z]\w*(?=\s+\w+\s*[;,=()]|\s*(?:\[[\s,]*\]\s*)?::\s*new\b)/.source), lookbehind: true, inside: className.inside }, { pattern: RegExp(/(\b(?:class|enum|extends|implements|instanceof|interface|new|record|throws)\s+)/.source + classNamePrefix + /[A-Z]\w*\b/.source), lookbehind: true, inside: className.inside }], keyword: keywords, function: [Prism3.languages.clike.function, { pattern: /(::\s*)[a-z_]\w*/, lookbehind: true }], number: /\b0b[01][01_]*L?\b|\b0x(?:\.[\da-f_p+-]+|[\da-f_]+(?:\.[\da-f_p+-]+)?)\b|(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i, operator: { pattern: /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m, lookbehind: true }, constant: /\b[A-Z][A-Z_\d]+\b/ }), Prism3.languages.insertBefore("java", "string", { "triple-quoted-string": { pattern: /"""[ \t]*[\r\n](?:(?:"|"")?(?:\\.|[^"\\]))*"""/, greedy: true, alias: "string" }, char: { pattern: /'(?:\\.|[^'\\\r\n]){1,6}'/, greedy: true } }), Prism3.languages.insertBefore("java", "class-name", { annotation: { pattern: /(^|[^.])@\w+(?:\s*\.\s*\w+)*/, lookbehind: true, alias: "punctuation" }, generics: { pattern: /<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&))*>)*>)*>)*>/, inside: { "class-name": className, keyword: keywords, punctuation: /[<>(),.:]/, operator: /[?&|]/ } }, import: [{ pattern: RegExp(/(\bimport\s+)/.source + classNamePrefix + /(?:[A-Z]\w*|\*)(?=\s*;)/.source), lookbehind: true, inside: { namespace: className.inside.namespace, punctuation: /\./, operator: /\*/, "class-name": /\w+/ } }, { pattern: RegExp(/(\bimport\s+static\s+)/.source + classNamePrefix + /(?:\w+|\*)(?=\s*;)/.source), lookbehind: true, alias: "static", inside: { namespace: className.inside.namespace, static: /\b\w+$/, punctuation: /\./, operator: /\*/, "class-name": /\w+/ } }], namespace: { pattern: RegExp(/(\b(?:exports|import(?:\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\s+)(?!<keyword>)[a-z]\w*(?:\.[a-z]\w*)*\.?/.source.replace(/<keyword>/g, function() {
      return keywords.source;
    })), lookbehind: true, inside: { punctuation: /\./ } } });
  })(Prism);
} });
var require_prism_kotlin = __commonJS({ "node_modules/prismjs/components/prism-kotlin.js"() {
  (function(Prism3) {
    Prism3.languages.kotlin = Prism3.languages.extend("clike", { keyword: { pattern: /(^|[^.])\b(?:abstract|actual|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|do|dynamic|else|enum|expect|external|final|finally|for|fun|get|if|import|in|infix|init|inline|inner|interface|internal|is|lateinit|noinline|null|object|open|operator|out|override|package|private|protected|public|reified|return|sealed|set|super|suspend|tailrec|this|throw|to|try|typealias|val|var|vararg|when|where|while)\b/, lookbehind: true }, function: [{ pattern: /(?:`[^\r\n`]+`|\b\w+)(?=\s*\()/, greedy: true }, { pattern: /(\.)(?:`[^\r\n`]+`|\w+)(?=\s*\{)/, lookbehind: true, greedy: true }], number: /\b(?:0[xX][\da-fA-F]+(?:_[\da-fA-F]+)*|0[bB][01]+(?:_[01]+)*|\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?[fFL]?)\b/, operator: /\+[+=]?|-[-=>]?|==?=?|!(?:!|==?)?|[\/*%<>]=?|[?:]:?|\.\.|&&|\|\||\b(?:and|inv|or|shl|shr|ushr|xor)\b/ }), delete Prism3.languages.kotlin["class-name"];
    var interpolationInside = { "interpolation-punctuation": { pattern: /^\$\{?|\}$/, alias: "punctuation" }, expression: { pattern: /[\s\S]+/, inside: Prism3.languages.kotlin } };
    Prism3.languages.insertBefore("kotlin", "string", { "string-literal": [{ pattern: /"""(?:[^$]|\$(?:(?!\{)|\{[^{}]*\}))*?"""/, alias: "multiline", inside: { interpolation: { pattern: /\$(?:[a-z_]\w*|\{[^{}]*\})/i, inside: interpolationInside }, string: /[\s\S]+/ } }, { pattern: /"(?:[^"\\\r\n$]|\\.|\$(?:(?!\{)|\{[^{}]*\}))*"/, alias: "singleline", inside: { interpolation: { pattern: /((?:^|[^\\])(?:\\{2})*)\$(?:[a-z_]\w*|\{[^{}]*\})/i, lookbehind: true, inside: interpolationInside }, string: /[\s\S]+/ } }], char: { pattern: /'(?:[^'\\\r\n]|\\(?:.|u[a-fA-F0-9]{0,4}))'/, greedy: true } }), delete Prism3.languages.kotlin.string, Prism3.languages.insertBefore("kotlin", "keyword", { annotation: { pattern: /\B@(?:\w+:)?(?:[A-Z]\w*|\[[^\]]+\])/, alias: "builtin" } }), Prism3.languages.insertBefore("kotlin", "function", { label: { pattern: /\b\w+@|@\w+\b/, alias: "symbol" } }), Prism3.languages.kt = Prism3.languages.kotlin, Prism3.languages.kts = Prism3.languages.kotlin;
  })(Prism);
} });
var require_prism_swift = __commonJS({ "node_modules/prismjs/components/prism-swift.js"() {
  Prism.languages.swift = { comment: { pattern: /(^|[^\\:])(?:\/\/.*|\/\*(?:[^/*]|\/(?!\*)|\*(?!\/)|\/\*(?:[^*]|\*(?!\/))*\*\/)*\*\/)/, lookbehind: true, greedy: true }, "string-literal": [{ pattern: RegExp(/(^|[^"#])/.source + "(?:" + /"(?:\\(?:\((?:[^()]|\([^()]*\))*\)|\r\n|[^(])|[^\\\r\n"])*"/.source + "|" + /"""(?:\\(?:\((?:[^()]|\([^()]*\))*\)|[^(])|[^\\"]|"(?!""))*"""/.source + ")" + /(?!["#])/.source), lookbehind: true, greedy: true, inside: { interpolation: { pattern: /(\\\()(?:[^()]|\([^()]*\))*(?=\))/, lookbehind: true, inside: null }, "interpolation-punctuation": { pattern: /^\)|\\\($/, alias: "punctuation" }, punctuation: /\\(?=[\r\n])/, string: /[\s\S]+/ } }, { pattern: RegExp(/(^|[^"#])(#+)/.source + "(?:" + /"(?:\\(?:#+\((?:[^()]|\([^()]*\))*\)|\r\n|[^#])|[^\\\r\n])*?"/.source + "|" + /"""(?:\\(?:#+\((?:[^()]|\([^()]*\))*\)|[^#])|[^\\])*?"""/.source + ")\\2"), lookbehind: true, greedy: true, inside: { interpolation: { pattern: /(\\#+\()(?:[^()]|\([^()]*\))*(?=\))/, lookbehind: true, inside: null }, "interpolation-punctuation": { pattern: /^\)|\\#+\($/, alias: "punctuation" }, string: /[\s\S]+/ } }], directive: { pattern: RegExp(/#/.source + "(?:" + (/(?:elseif|if)\b/.source + "(?:[ 	]*" + /(?:![ \t]*)?(?:\b\w+\b(?:[ \t]*\((?:[^()]|\([^()]*\))*\))?|\((?:[^()]|\([^()]*\))*\))(?:[ \t]*(?:&&|\|\|))?/.source + ")+") + "|" + /(?:else|endif)\b/.source + ")"), alias: "property", inside: { "directive-name": /^#\w+/, boolean: /\b(?:false|true)\b/, number: /\b\d+(?:\.\d+)*\b/, operator: /!|&&|\|\||[<>]=?/, punctuation: /[(),]/ } }, literal: { pattern: /#(?:colorLiteral|column|dsohandle|file(?:ID|Literal|Path)?|function|imageLiteral|line)\b/, alias: "constant" }, "other-directive": { pattern: /#\w+\b/, alias: "property" }, attribute: { pattern: /@\w+/, alias: "atrule" }, "function-definition": { pattern: /(\bfunc\s+)\w+/, lookbehind: true, alias: "function" }, label: { pattern: /\b(break|continue)\s+\w+|\b[a-zA-Z_]\w*(?=\s*:\s*(?:for|repeat|while)\b)/, lookbehind: true, alias: "important" }, keyword: /\b(?:Any|Protocol|Self|Type|actor|as|assignment|associatedtype|associativity|async|await|break|case|catch|class|continue|convenience|default|defer|deinit|didSet|do|dynamic|else|enum|extension|fallthrough|fileprivate|final|for|func|get|guard|higherThan|if|import|in|indirect|infix|init|inout|internal|is|isolated|lazy|left|let|lowerThan|mutating|none|nonisolated|nonmutating|open|operator|optional|override|postfix|precedencegroup|prefix|private|protocol|public|repeat|required|rethrows|return|right|safe|self|set|some|static|struct|subscript|super|switch|throw|throws|try|typealias|unowned|unsafe|var|weak|where|while|willSet)\b/, boolean: /\b(?:false|true)\b/, nil: { pattern: /\bnil\b/, alias: "constant" }, "short-argument": /\$\d+\b/, omit: { pattern: /\b_\b/, alias: "keyword" }, number: /\b(?:[\d_]+(?:\.[\de_]+)?|0x[a-f0-9_]+(?:\.[a-f0-9p_]+)?|0b[01_]+|0o[0-7_]+)\b/i, "class-name": /\b[A-Z](?:[A-Z_\d]*[a-z]\w*)?\b/, function: /\b[a-z_]\w*(?=\s*\()/i, constant: /\b(?:[A-Z_]{2,}|k[A-Z][A-Za-z_]+)\b/, operator: /[-+*/%=!<>&|^~?]+|\.[.\-+*/%=!<>&|^~?]+/, punctuation: /[{}[\]();,.:\\]/ };
  Prism.languages.swift["string-literal"].forEach(function(rule) {
    rule.inside.interpolation.inside = Prism.languages.swift;
  });
} });
var require_prism_c = __commonJS({ "node_modules/prismjs/components/prism-c.js"() {
  Prism.languages.c = Prism.languages.extend("clike", { comment: { pattern: /\/\/(?:[^\r\n\\]|\\(?:\r\n?|\n|(?![\r\n])))*|\/\*[\s\S]*?(?:\*\/|$)/, greedy: true }, string: { pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/, greedy: true }, "class-name": { pattern: /(\b(?:enum|struct)\s+(?:__attribute__\s*\(\([\s\S]*?\)\)\s*)?)\w+|\b[a-z]\w*_t\b/, lookbehind: true }, keyword: /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|__attribute__|asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|typeof|union|unsigned|void|volatile|while)\b/, function: /\b[a-z_]\w*(?=\s*\()/i, number: /(?:\b0x(?:[\da-f]+(?:\.[\da-f]*)?|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?)[ful]{0,4}/i, operator: />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/ });
  Prism.languages.insertBefore("c", "string", { char: { pattern: /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n]){0,32}'/, greedy: true } });
  Prism.languages.insertBefore("c", "string", { macro: { pattern: /(^[\t ]*)#\s*[a-z](?:[^\r\n\\/]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|\\(?:\r\n|[\s\S]))*/im, lookbehind: true, greedy: true, alias: "property", inside: { string: [{ pattern: /^(#\s*include\s*)<[^>]+>/, lookbehind: true }, Prism.languages.c.string], char: Prism.languages.c.char, comment: Prism.languages.c.comment, "macro-name": [{ pattern: /(^#\s*define\s+)\w+\b(?!\()/i, lookbehind: true }, { pattern: /(^#\s*define\s+)\w+\b(?=\()/i, lookbehind: true, alias: "function" }], directive: { pattern: /^(#\s*)[a-z]+/, lookbehind: true, alias: "keyword" }, "directive-hash": /^#/, punctuation: /##|\\(?=[\r\n])/, expression: { pattern: /\S[\s\S]*/, inside: Prism.languages.c } } } });
  Prism.languages.insertBefore("c", "function", { constant: /\b(?:EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|__DATE__|__FILE__|__LINE__|__TIMESTAMP__|__TIME__|__func__|stderr|stdin|stdout)\b/ });
  delete Prism.languages.c.boolean;
} });
var require_prism_cpp = __commonJS({ "node_modules/prismjs/components/prism-cpp.js"() {
  (function(Prism3) {
    var keyword = /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|char8_t|class|co_await|co_return|co_yield|compl|concept|const|const_cast|consteval|constexpr|constinit|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|final|float|for|friend|goto|if|import|inline|int|int16_t|int32_t|int64_t|int8_t|long|module|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|uint16_t|uint32_t|uint64_t|uint8_t|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/, modName = /\b(?!<keyword>)\w+(?:\s*\.\s*\w+)*\b/.source.replace(/<keyword>/g, function() {
      return keyword.source;
    });
    Prism3.languages.cpp = Prism3.languages.extend("c", { "class-name": [{ pattern: RegExp(/(\b(?:class|concept|enum|struct|typename)\s+)(?!<keyword>)\w+/.source.replace(/<keyword>/g, function() {
      return keyword.source;
    })), lookbehind: true }, /\b[A-Z]\w*(?=\s*::\s*\w+\s*\()/, /\b[A-Z_]\w*(?=\s*::\s*~\w+\s*\()/i, /\b\w+(?=\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>\s*::\s*\w+\s*\()/], keyword, number: { pattern: /(?:\b0b[01']+|\b0x(?:[\da-f']+(?:\.[\da-f']*)?|\.[\da-f']+)(?:p[+-]?[\d']+)?|(?:\b[\d']+(?:\.[\d']*)?|\B\.[\d']+)(?:e[+-]?[\d']+)?)[ful]{0,4}/i, greedy: true }, operator: />>=?|<<=?|->|--|\+\+|&&|\|\||[?:~]|<=>|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/, boolean: /\b(?:false|true)\b/ }), Prism3.languages.insertBefore("cpp", "string", { module: { pattern: RegExp(/(\b(?:import|module)\s+)/.source + "(?:" + /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|<[^<>\r\n]*>/.source + "|" + /<mod-name>(?:\s*:\s*<mod-name>)?|:\s*<mod-name>/.source.replace(/<mod-name>/g, function() {
      return modName;
    }) + ")"), lookbehind: true, greedy: true, inside: { string: /^[<"][\s\S]+/, operator: /:/, punctuation: /\./ } }, "raw-string": { pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/, alias: "string", greedy: true } }), Prism3.languages.insertBefore("cpp", "keyword", { "generic-function": { pattern: /\b(?!operator\b)[a-z_]\w*\s*<(?:[^<>]|<[^<>]*>)*>(?=\s*\()/i, inside: { function: /^\w+/, generic: { pattern: /<[\s\S]+/, alias: "class-name", inside: Prism3.languages.cpp } } } }), Prism3.languages.insertBefore("cpp", "operator", { "double-colon": { pattern: /::/, alias: "punctuation" } }), Prism3.languages.insertBefore("cpp", "class-name", { "base-clause": { pattern: /(\b(?:class|struct)\s+\w+\s*:\s*)[^;{}"'\s]+(?:\s+[^;{}"'\s]+)*(?=\s*[;{])/, lookbehind: true, greedy: true, inside: Prism3.languages.extend("cpp", {}) } }), Prism3.languages.insertBefore("inside", "double-colon", { "class-name": /\b[a-z_]\w*\b(?!\s*::)/i }, Prism3.languages.cpp["base-clause"]);
  })(Prism);
} });
var require_prism_csharp = __commonJS({ "node_modules/prismjs/components/prism-csharp.js"() {
  (function(Prism3) {
    function replace(pattern, replacements) {
      return pattern.replace(/<<(\d+)>>/g, function(m, index) {
        return "(?:" + replacements[+index] + ")";
      });
    }
    function re(pattern, replacements, flags) {
      return RegExp(replace(pattern, replacements), flags || "");
    }
    function nested(pattern, depthLog2) {
      for (var i = 0; i < depthLog2; i++) pattern = pattern.replace(/<<self>>/g, function() {
        return "(?:" + pattern + ")";
      });
      return pattern.replace(/<<self>>/g, "[^\\s\\S]");
    }
    var keywordKinds = { type: "bool byte char decimal double dynamic float int long object sbyte short string uint ulong ushort var void", typeDeclaration: "class enum interface record struct", contextual: "add alias and ascending async await by descending from(?=\\s*(?:\\w|$)) get global group into init(?=\\s*;) join let nameof not notnull on or orderby partial remove select set unmanaged value when where with(?=\\s*{)", other: "abstract as base break case catch checked const continue default delegate do else event explicit extern finally fixed for foreach goto if implicit in internal is lock namespace new null operator out override params private protected public readonly ref return sealed sizeof stackalloc static switch this throw try typeof unchecked unsafe using virtual volatile while yield" };
    function keywordsToPattern(words) {
      return "\\b(?:" + words.trim().replace(/ /g, "|") + ")\\b";
    }
    var typeDeclarationKeywords = keywordsToPattern(keywordKinds.typeDeclaration), keywords = RegExp(keywordsToPattern(keywordKinds.type + " " + keywordKinds.typeDeclaration + " " + keywordKinds.contextual + " " + keywordKinds.other)), nonTypeKeywords = keywordsToPattern(keywordKinds.typeDeclaration + " " + keywordKinds.contextual + " " + keywordKinds.other), nonContextualKeywords = keywordsToPattern(keywordKinds.type + " " + keywordKinds.typeDeclaration + " " + keywordKinds.other), generic = nested(/<(?:[^<>;=+\-*/%&|^]|<<self>>)*>/.source, 2), nestedRound = nested(/\((?:[^()]|<<self>>)*\)/.source, 2), name = /@?\b[A-Za-z_]\w*\b/.source, genericName = replace(/<<0>>(?:\s*<<1>>)?/.source, [name, generic]), identifier = replace(/(?!<<0>>)<<1>>(?:\s*\.\s*<<1>>)*/.source, [nonTypeKeywords, genericName]), array = /\[\s*(?:,\s*)*\]/.source, typeExpressionWithoutTuple = replace(/<<0>>(?:\s*(?:\?\s*)?<<1>>)*(?:\s*\?)?/.source, [identifier, array]), tupleElement = replace(/[^,()<>[\];=+\-*/%&|^]|<<0>>|<<1>>|<<2>>/.source, [generic, nestedRound, array]), tuple = replace(/\(<<0>>+(?:,<<0>>+)+\)/.source, [tupleElement]), typeExpression = replace(/(?:<<0>>|<<1>>)(?:\s*(?:\?\s*)?<<2>>)*(?:\s*\?)?/.source, [tuple, identifier, array]), typeInside = { keyword: keywords, punctuation: /[<>()?,.:[\]]/ }, character = /'(?:[^\r\n'\\]|\\.|\\[Uux][\da-fA-F]{1,8})'/.source, regularString = /"(?:\\.|[^\\"\r\n])*"/.source, verbatimString = /@"(?:""|\\[\s\S]|[^\\"])*"(?!")/.source;
    Prism3.languages.csharp = Prism3.languages.extend("clike", { string: [{ pattern: re(/(^|[^$\\])<<0>>/.source, [verbatimString]), lookbehind: true, greedy: true }, { pattern: re(/(^|[^@$\\])<<0>>/.source, [regularString]), lookbehind: true, greedy: true }], "class-name": [{ pattern: re(/(\busing\s+static\s+)<<0>>(?=\s*;)/.source, [identifier]), lookbehind: true, inside: typeInside }, { pattern: re(/(\busing\s+<<0>>\s*=\s*)<<1>>(?=\s*;)/.source, [name, typeExpression]), lookbehind: true, inside: typeInside }, { pattern: re(/(\busing\s+)<<0>>(?=\s*=)/.source, [name]), lookbehind: true }, { pattern: re(/(\b<<0>>\s+)<<1>>/.source, [typeDeclarationKeywords, genericName]), lookbehind: true, inside: typeInside }, { pattern: re(/(\bcatch\s*\(\s*)<<0>>/.source, [identifier]), lookbehind: true, inside: typeInside }, { pattern: re(/(\bwhere\s+)<<0>>/.source, [name]), lookbehind: true }, { pattern: re(/(\b(?:is(?:\s+not)?|as)\s+)<<0>>/.source, [typeExpressionWithoutTuple]), lookbehind: true, inside: typeInside }, { pattern: re(/\b<<0>>(?=\s+(?!<<1>>|with\s*\{)<<2>>(?:\s*[=,;:{)\]]|\s+(?:in|when)\b))/.source, [typeExpression, nonContextualKeywords, name]), inside: typeInside }], keyword: keywords, number: /(?:\b0(?:x[\da-f_]*[\da-f]|b[01_]*[01])|(?:\B\.\d+(?:_+\d+)*|\b\d+(?:_+\d+)*(?:\.\d+(?:_+\d+)*)?)(?:e[-+]?\d+(?:_+\d+)*)?)(?:[dflmu]|lu|ul)?\b/i, operator: />>=?|<<=?|[-=]>|([-+&|])\1|~|\?\?=?|[-+*/%&|^!=<>]=?/, punctuation: /\?\.?|::|[{}[\];(),.:]/ }), Prism3.languages.insertBefore("csharp", "number", { range: { pattern: /\.\./, alias: "operator" } }), Prism3.languages.insertBefore("csharp", "punctuation", { "named-parameter": { pattern: re(/([(,]\s*)<<0>>(?=\s*:)/.source, [name]), lookbehind: true, alias: "punctuation" } }), Prism3.languages.insertBefore("csharp", "class-name", { namespace: { pattern: re(/(\b(?:namespace|using)\s+)<<0>>(?:\s*\.\s*<<0>>)*(?=\s*[;{])/.source, [name]), lookbehind: true, inside: { punctuation: /\./ } }, "type-expression": { pattern: re(/(\b(?:default|sizeof|typeof)\s*\(\s*(?!\s))(?:[^()\s]|\s(?!\s)|<<0>>)*(?=\s*\))/.source, [nestedRound]), lookbehind: true, alias: "class-name", inside: typeInside }, "return-type": { pattern: re(/<<0>>(?=\s+(?:<<1>>\s*(?:=>|[({]|\.\s*this\s*\[)|this\s*\[))/.source, [typeExpression, identifier]), inside: typeInside, alias: "class-name" }, "constructor-invocation": { pattern: re(/(\bnew\s+)<<0>>(?=\s*[[({])/.source, [typeExpression]), lookbehind: true, inside: typeInside, alias: "class-name" }, "generic-method": { pattern: re(/<<0>>\s*<<1>>(?=\s*\()/.source, [name, generic]), inside: { function: re(/^<<0>>/.source, [name]), generic: { pattern: RegExp(generic), alias: "class-name", inside: typeInside } } }, "type-list": { pattern: re(/\b((?:<<0>>\s+<<1>>|record\s+<<1>>\s*<<5>>|where\s+<<2>>)\s*:\s*)(?:<<3>>|<<4>>|<<1>>\s*<<5>>|<<6>>)(?:\s*,\s*(?:<<3>>|<<4>>|<<6>>))*(?=\s*(?:where|[{;]|=>|$))/.source, [typeDeclarationKeywords, genericName, name, typeExpression, keywords.source, nestedRound, /\bnew\s*\(\s*\)/.source]), lookbehind: true, inside: { "record-arguments": { pattern: re(/(^(?!new\s*\()<<0>>\s*)<<1>>/.source, [genericName, nestedRound]), lookbehind: true, greedy: true, inside: Prism3.languages.csharp }, keyword: keywords, "class-name": { pattern: RegExp(typeExpression), greedy: true, inside: typeInside }, punctuation: /[,()]/ } }, preprocessor: { pattern: /(^[\t ]*)#.*/m, lookbehind: true, alias: "property", inside: { directive: { pattern: /(#)\b(?:define|elif|else|endif|endregion|error|if|line|nullable|pragma|region|undef|warning)\b/, lookbehind: true, alias: "keyword" } } } });
    var regularStringOrCharacter = regularString + "|" + character, regularStringCharacterOrComment = replace(/\/(?![*/])|\/\/[^\r\n]*[\r\n]|\/\*(?:[^*]|\*(?!\/))*\*\/|<<0>>/.source, [regularStringOrCharacter]), roundExpression = nested(replace(/[^"'/()]|<<0>>|\(<<self>>*\)/.source, [regularStringCharacterOrComment]), 2), attrTarget = /\b(?:assembly|event|field|method|module|param|property|return|type)\b/.source, attr = replace(/<<0>>(?:\s*\(<<1>>*\))?/.source, [identifier, roundExpression]);
    Prism3.languages.insertBefore("csharp", "class-name", { attribute: { pattern: re(/((?:^|[^\s\w>)?])\s*\[\s*)(?:<<0>>\s*:\s*)?<<1>>(?:\s*,\s*<<1>>)*(?=\s*\])/.source, [attrTarget, attr]), lookbehind: true, greedy: true, inside: { target: { pattern: re(/^<<0>>(?=\s*:)/.source, [attrTarget]), alias: "keyword" }, "attribute-arguments": { pattern: re(/\(<<0>>*\)/.source, [roundExpression]), inside: Prism3.languages.csharp }, "class-name": { pattern: RegExp(identifier), inside: { punctuation: /\./ } }, punctuation: /[:,]/ } } });
    var formatString = /:[^}\r\n]+/.source, mInterpolationRound = nested(replace(/[^"'/()]|<<0>>|\(<<self>>*\)/.source, [regularStringCharacterOrComment]), 2), mInterpolation = replace(/\{(?!\{)(?:(?![}:])<<0>>)*<<1>>?\}/.source, [mInterpolationRound, formatString]), sInterpolationRound = nested(replace(/[^"'/()]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|<<0>>|\(<<self>>*\)/.source, [regularStringOrCharacter]), 2), sInterpolation = replace(/\{(?!\{)(?:(?![}:])<<0>>)*<<1>>?\}/.source, [sInterpolationRound, formatString]);
    function createInterpolationInside(interpolation, interpolationRound) {
      return { interpolation: { pattern: re(/((?:^|[^{])(?:\{\{)*)<<0>>/.source, [interpolation]), lookbehind: true, inside: { "format-string": { pattern: re(/(^\{(?:(?![}:])<<0>>)*)<<1>>(?=\}$)/.source, [interpolationRound, formatString]), lookbehind: true, inside: { punctuation: /^:/ } }, punctuation: /^\{|\}$/, expression: { pattern: /[\s\S]+/, alias: "language-csharp", inside: Prism3.languages.csharp } } }, string: /[\s\S]+/ };
    }
    Prism3.languages.insertBefore("csharp", "string", { "interpolation-string": [{ pattern: re(/(^|[^\\])(?:\$@|@\$)"(?:""|\\[\s\S]|\{\{|<<0>>|[^\\{"])*"/.source, [mInterpolation]), lookbehind: true, greedy: true, inside: createInterpolationInside(mInterpolation, mInterpolationRound) }, { pattern: re(/(^|[^@\\])\$"(?:\\.|\{\{|<<0>>|[^\\"{])*"/.source, [sInterpolation]), lookbehind: true, greedy: true, inside: createInterpolationInside(sInterpolation, sInterpolationRound) }], char: { pattern: RegExp(character), greedy: true } }), Prism3.languages.dotnet = Prism3.languages.cs = Prism3.languages.csharp;
  })(Prism);
} });
var require_prism_ruby = __commonJS({ "node_modules/prismjs/components/prism-ruby.js"() {
  (function(Prism3) {
    Prism3.languages.ruby = Prism3.languages.extend("clike", { comment: { pattern: /#.*|^=begin\s[\s\S]*?^=end/m, greedy: true }, "class-name": { pattern: /(\b(?:class|module)\s+|\bcatch\s+\()[\w.\\]+|\b[A-Z_]\w*(?=\s*\.\s*new\b)/, lookbehind: true, inside: { punctuation: /[.\\]/ } }, keyword: /\b(?:BEGIN|END|alias|and|begin|break|case|class|def|define_method|defined|do|each|else|elsif|end|ensure|extend|for|if|in|include|module|new|next|nil|not|or|prepend|private|protected|public|raise|redo|require|rescue|retry|return|self|super|then|throw|undef|unless|until|when|while|yield)\b/, operator: /\.{2,3}|&\.|===|<?=>|[!=]?~|(?:&&|\|\||<<|>>|\*\*|[+\-*/%<>!^&|=])=?|[?:]/, punctuation: /[(){}[\].,;]/ }), Prism3.languages.insertBefore("ruby", "operator", { "double-colon": { pattern: /::/, alias: "punctuation" } });
    var interpolation = { pattern: /((?:^|[^\\])(?:\\{2})*)#\{(?:[^{}]|\{[^{}]*\})*\}/, lookbehind: true, inside: { content: { pattern: /^(#\{)[\s\S]+(?=\}$)/, lookbehind: true, inside: Prism3.languages.ruby }, delimiter: { pattern: /^#\{|\}$/, alias: "punctuation" } } };
    delete Prism3.languages.ruby.function;
    var percentExpression = "(?:" + [/([^a-zA-Z0-9\s{(\[<=])(?:(?!\1)[^\\]|\\[\s\S])*\1/.source, /\((?:[^()\\]|\\[\s\S]|\((?:[^()\\]|\\[\s\S])*\))*\)/.source, /\{(?:[^{}\\]|\\[\s\S]|\{(?:[^{}\\]|\\[\s\S])*\})*\}/.source, /\[(?:[^\[\]\\]|\\[\s\S]|\[(?:[^\[\]\\]|\\[\s\S])*\])*\]/.source, /<(?:[^<>\\]|\\[\s\S]|<(?:[^<>\\]|\\[\s\S])*>)*>/.source].join("|") + ")", symbolName = /(?:"(?:\\.|[^"\\\r\n])*"|(?:\b[a-zA-Z_]\w*|[^\s\0-\x7F]+)[?!]?|\$.)/.source;
    Prism3.languages.insertBefore("ruby", "keyword", { "regex-literal": [{ pattern: RegExp(/%r/.source + percentExpression + /[egimnosux]{0,6}/.source), greedy: true, inside: { interpolation, regex: /[\s\S]+/ } }, { pattern: /(^|[^/])\/(?!\/)(?:\[[^\r\n\]]+\]|\\.|[^[/\\\r\n])+\/[egimnosux]{0,6}(?=\s*(?:$|[\r\n,.;})#]))/, lookbehind: true, greedy: true, inside: { interpolation, regex: /[\s\S]+/ } }], variable: /[@$]+[a-zA-Z_]\w*(?:[?!]|\b)/, symbol: [{ pattern: RegExp(/(^|[^:]):/.source + symbolName), lookbehind: true, greedy: true }, { pattern: RegExp(/([\r\n{(,][ \t]*)/.source + symbolName + /(?=:(?!:))/.source), lookbehind: true, greedy: true }], "method-definition": { pattern: /(\bdef\s+)\w+(?:\s*\.\s*\w+)?/, lookbehind: true, inside: { function: /\b\w+$/, keyword: /^self\b/, "class-name": /^\w+/, punctuation: /\./ } } }), Prism3.languages.insertBefore("ruby", "string", { "string-literal": [{ pattern: RegExp(/%[qQiIwWs]?/.source + percentExpression), greedy: true, inside: { interpolation, string: /[\s\S]+/ } }, { pattern: /("|')(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|(?!\1)[^\\#\r\n])*\1/, greedy: true, inside: { interpolation, string: /[\s\S]+/ } }, { pattern: /<<[-~]?([a-z_]\w*)[\r\n](?:.*[\r\n])*?[\t ]*\1/i, alias: "heredoc-string", greedy: true, inside: { delimiter: { pattern: /^<<[-~]?[a-z_]\w*|\b[a-z_]\w*$/i, inside: { symbol: /\b\w+/, punctuation: /^<<[-~]?/ } }, interpolation, string: /[\s\S]+/ } }, { pattern: /<<[-~]?'([a-z_]\w*)'[\r\n](?:.*[\r\n])*?[\t ]*\1/i, alias: "heredoc-string", greedy: true, inside: { delimiter: { pattern: /^<<[-~]?'[a-z_]\w*'|\b[a-z_]\w*$/i, inside: { symbol: /\b\w+/, punctuation: /^<<[-~]?'|'$/ } }, string: /[\s\S]+/ } }], "command-literal": [{ pattern: RegExp(/%x/.source + percentExpression), greedy: true, inside: { interpolation, command: { pattern: /[\s\S]+/, alias: "string" } } }, { pattern: /`(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|[^\\`#\r\n])*`/, greedy: true, inside: { interpolation, command: { pattern: /[\s\S]+/, alias: "string" } } }] }), delete Prism3.languages.ruby.string, Prism3.languages.insertBefore("ruby", "number", { builtin: /\b(?:Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Fixnum|Float|Hash|IO|Integer|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|Stat|String|Struct|Symbol|TMS|Thread|ThreadGroup|Time|TrueClass)\b/, constant: /\b[A-Z][A-Z0-9_]*(?:[?!]|\b)/ }), Prism3.languages.rb = Prism3.languages.ruby;
  })(Prism);
} });
var require_prism_json = __commonJS({ "node_modules/prismjs/components/prism-json.js"() {
  Prism.languages.json = { property: { pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/, lookbehind: true, greedy: true }, string: { pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/, lookbehind: true, greedy: true }, comment: { pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/, greedy: true }, number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i, punctuation: /[{}[\],]/, operator: /:/, boolean: /\b(?:false|true)\b/, null: { pattern: /\bnull\b/, alias: "keyword" } };
  Prism.languages.webmanifest = Prism.languages.json;
} });
var require_prism_yaml = __commonJS({ "node_modules/prismjs/components/prism-yaml.js"() {
  (function(Prism3) {
    var anchorOrAlias = /[*&][^\s[\]{},]+/, tag = /!(?:<[\w\-%#;/?:@&=+$,.!~*'()[\]]+>|(?:[a-zA-Z\d-]*!)?[\w\-%#;/?:@&=+$.~*'()]+)?/, properties = "(?:" + tag.source + "(?:[ 	]+" + anchorOrAlias.source + ")?|" + anchorOrAlias.source + "(?:[ 	]+" + tag.source + ")?)", plainKey = /(?:[^\s\x00-\x08\x0e-\x1f!"#%&'*,\-:>?@[\]`{|}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]|[?:-]<PLAIN>)(?:[ \t]*(?:(?![#:])<PLAIN>|:<PLAIN>))*/.source.replace(/<PLAIN>/g, function() {
      return /[^\s\x00-\x08\x0e-\x1f,[\]{}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]/.source;
    }), string = /"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*'/.source;
    function createValuePattern(value, flags) {
      flags = (flags || "").replace(/m/g, "") + "m";
      var pattern = /([:\-,[{]\s*(?:\s<<prop>>[ \t]+)?)(?:<<value>>)(?=[ \t]*(?:$|,|\]|\}|(?:[\r\n]\s*)?#))/.source.replace(/<<prop>>/g, function() {
        return properties;
      }).replace(/<<value>>/g, function() {
        return value;
      });
      return RegExp(pattern, flags);
    }
    Prism3.languages.yaml = { scalar: { pattern: RegExp(/([\-:]\s*(?:\s<<prop>>[ \t]+)?[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)\S[^\r\n]*(?:\2[^\r\n]+)*)/.source.replace(/<<prop>>/g, function() {
      return properties;
    })), lookbehind: true, alias: "string" }, comment: /#.*/, key: { pattern: RegExp(/((?:^|[:\-,[{\r\n?])[ \t]*(?:<<prop>>[ \t]+)?)<<key>>(?=\s*:\s)/.source.replace(/<<prop>>/g, function() {
      return properties;
    }).replace(/<<key>>/g, function() {
      return "(?:" + plainKey + "|" + string + ")";
    })), lookbehind: true, greedy: true, alias: "atrule" }, directive: { pattern: /(^[ \t]*)%.+/m, lookbehind: true, alias: "important" }, datetime: { pattern: createValuePattern(/\d{4}-\d\d?-\d\d?(?:[tT]|[ \t]+)\d\d?:\d{2}:\d{2}(?:\.\d*)?(?:[ \t]*(?:Z|[-+]\d\d?(?::\d{2})?))?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(?::\d{2}(?:\.\d*)?)?/.source), lookbehind: true, alias: "number" }, boolean: { pattern: createValuePattern(/false|true/.source, "i"), lookbehind: true, alias: "important" }, null: { pattern: createValuePattern(/null|~/.source, "i"), lookbehind: true, alias: "important" }, string: { pattern: createValuePattern(string), lookbehind: true, greedy: true }, number: { pattern: createValuePattern(/[+-]?(?:0x[\da-f]+|0o[0-7]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|\.inf|\.nan)/.source, "i"), lookbehind: true }, tag, important: anchorOrAlias, punctuation: /---|[:[\]{}\-,|>?]|\.\.\./ }, Prism3.languages.yml = Prism3.languages.yaml;
  })(Prism);
} });
var require_prism_toml = __commonJS({ "node_modules/prismjs/components/prism-toml.js"() {
  (function(Prism3) {
    var key = /(?:[\w-]+|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*")/.source;
    function insertKey(pattern) {
      return pattern.replace(/__/g, function() {
        return key;
      });
    }
    Prism3.languages.toml = { comment: { pattern: /#.*/, greedy: true }, table: { pattern: RegExp(insertKey(/(^[\t ]*\[\s*(?:\[\s*)?)__(?:\s*\.\s*__)*(?=\s*\])/.source), "m"), lookbehind: true, greedy: true, alias: "class-name" }, key: { pattern: RegExp(insertKey(/(^[\t ]*|[{,]\s*)__(?:\s*\.\s*__)*(?=\s*=)/.source), "m"), lookbehind: true, greedy: true, alias: "property" }, string: { pattern: /"""(?:\\[\s\S]|[^\\])*?"""|'''[\s\S]*?'''|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*"/, greedy: true }, date: [{ pattern: /\b\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?\b/i, alias: "number" }, { pattern: /\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/, alias: "number" }], number: /(?:\b0(?:x[\da-zA-Z]+(?:_[\da-zA-Z]+)*|o[0-7]+(?:_[0-7]+)*|b[10]+(?:_[10]+)*))\b|[-+]?\b\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?\b|[-+]?\b(?:inf|nan)\b/, boolean: /\b(?:false|true)\b/, punctuation: /[.,=[\]{}]/ };
  })(Prism);
} });
var require_prism_sql = __commonJS({ "node_modules/prismjs/components/prism-sql.js"() {
  Prism.languages.sql = { comment: { pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/, lookbehind: true }, variable: [{ pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/, greedy: true }, /@[\w.$]+/], string: { pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/, greedy: true, lookbehind: true }, identifier: { pattern: /(^|[^@\\])`(?:\\[\s\S]|[^`\\]|``)*`/, greedy: true, lookbehind: true, inside: { punctuation: /^`|`$/ } }, function: /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i, keyword: /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:COL|_INSERT)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN(?:ING|S)?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i, boolean: /\b(?:FALSE|NULL|TRUE)\b/i, number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i, operator: /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|DIV|ILIKE|IN|IS|LIKE|NOT|OR|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i, punctuation: /[;[\]()`,.]/ };
} });
var require_prism_diff = __commonJS({ "node_modules/prismjs/components/prism-diff.js"() {
  (function(Prism3) {
    Prism3.languages.diff = { coord: [/^(?:\*{3}|-{3}|\+{3}).*$/m, /^@@.*@@$/m, /^\d.*$/m] };
    var PREFIXES = { "deleted-sign": "-", "deleted-arrow": "<", "inserted-sign": "+", "inserted-arrow": ">", unchanged: " ", diff: "!" };
    Object.keys(PREFIXES).forEach(function(name) {
      var prefix = PREFIXES[name], alias = [];
      /^\w+$/.test(name) || alias.push(/\w+/.exec(name)[0]), name === "diff" && alias.push("bold"), Prism3.languages.diff[name] = { pattern: RegExp("^(?:[" + prefix + `].*(?:\r
?|
|(?![\\s\\S])))+`, "m"), alias, inside: { line: { pattern: /(.)(?=[\s\S]).*(?:\r\n?|\n)?/, lookbehind: true }, prefix: { pattern: /[\s\S]/, alias: /\w+/.exec(name)[0] } } };
    }), Object.defineProperty(Prism3.languages.diff, "PREFIXES", { value: PREFIXES });
  })(Prism);
} });
var require_prism_docker = __commonJS({ "node_modules/prismjs/components/prism-docker.js"() {
  (function(Prism3) {
    var spaceAfterBackSlash = /\\[\r\n](?:\s|\\[\r\n]|#.*(?!.))*(?![\s#]|\\[\r\n])/.source, space = /(?:[ \t]+(?![ \t])(?:<SP_BS>)?|<SP_BS>)/.source.replace(/<SP_BS>/g, function() {
      return spaceAfterBackSlash;
    }), string = /"(?:[^"\\\r\n]|\\(?:\r\n|[\s\S]))*"|'(?:[^'\\\r\n]|\\(?:\r\n|[\s\S]))*'/.source, option = /--[\w-]+=(?:<STR>|(?!["'])(?:[^\s\\]|\\.)+)/.source.replace(/<STR>/g, function() {
      return string;
    }), stringRule = { pattern: RegExp(string), greedy: true }, commentRule = { pattern: /(^[ \t]*)#.*/m, lookbehind: true, greedy: true };
    function re(source2, flags) {
      return source2 = source2.replace(/<OPT>/g, function() {
        return option;
      }).replace(/<SP>/g, function() {
        return space;
      }), RegExp(source2, flags);
    }
    Prism3.languages.docker = { instruction: { pattern: /(^[ \t]*)(?:ADD|ARG|CMD|COPY|ENTRYPOINT|ENV|EXPOSE|FROM|HEALTHCHECK|LABEL|MAINTAINER|ONBUILD|RUN|SHELL|STOPSIGNAL|USER|VOLUME|WORKDIR)(?=\s)(?:\\.|[^\r\n\\])*(?:\\$(?:\s|#.*$)*(?![\s#])(?:\\.|[^\r\n\\])*)*/im, lookbehind: true, greedy: true, inside: { options: { pattern: re(/(^(?:ONBUILD<SP>)?\w+<SP>)<OPT>(?:<SP><OPT>)*/.source, "i"), lookbehind: true, greedy: true, inside: { property: { pattern: /(^|\s)--[\w-]+/, lookbehind: true }, string: [stringRule, { pattern: /(=)(?!["'])(?:[^\s\\]|\\.)+/, lookbehind: true }], operator: /\\$/m, punctuation: /=/ } }, keyword: [{ pattern: re(/(^(?:ONBUILD<SP>)?HEALTHCHECK<SP>(?:<OPT><SP>)*)(?:CMD|NONE)\b/.source, "i"), lookbehind: true, greedy: true }, { pattern: re(/(^(?:ONBUILD<SP>)?FROM<SP>(?:<OPT><SP>)*(?!--)[^ \t\\]+<SP>)AS/.source, "i"), lookbehind: true, greedy: true }, { pattern: re(/(^ONBUILD<SP>)\w+/.source, "i"), lookbehind: true, greedy: true }, { pattern: /^\w+/, greedy: true }], comment: commentRule, string: stringRule, variable: /\$(?:\w+|\{[^{}"'\\]*\})/, operator: /\\$/m } }, comment: commentRule }, Prism3.languages.dockerfile = Prism3.languages.docker;
  })(Prism);
} });
var require_prism_hcl = __commonJS({ "node_modules/prismjs/components/prism-hcl.js"() {
  Prism.languages.hcl = { comment: /(?:\/\/|#).*|\/\*[\s\S]*?(?:\*\/|$)/, heredoc: { pattern: /<<-?(\w+\b)[\s\S]*?^[ \t]*\1/m, greedy: true, alias: "string" }, keyword: [{ pattern: /(?:data|resource)\s+(?:"(?:\\[\s\S]|[^\\"])*")(?=\s+"[\w-]+"\s+\{)/i, inside: { type: { pattern: /(resource|data|\s+)(?:"(?:\\[\s\S]|[^\\"])*")/i, lookbehind: true, alias: "variable" } } }, { pattern: /(?:backend|module|output|provider|provisioner|variable)\s+(?:[\w-]+|"(?:\\[\s\S]|[^\\"])*")\s+(?=\{)/i, inside: { type: { pattern: /(backend|module|output|provider|provisioner|variable)\s+(?:[\w-]+|"(?:\\[\s\S]|[^\\"])*")\s+/i, lookbehind: true, alias: "variable" } } }, /[\w-]+(?=\s+\{)/], property: [/[-\w\.]+(?=\s*=(?!=))/, /"(?:\\[\s\S]|[^\\"])+"(?=\s*[:=])/], string: { pattern: /"(?:[^\\$"]|\\[\s\S]|\$(?:(?=")|\$+(?!\$)|[^"${])|\$\{(?:[^{}"]|"(?:[^\\"]|\\[\s\S])*")*\})*"/, greedy: true, inside: { interpolation: { pattern: /(^|[^$])\$\{(?:[^{}"]|"(?:[^\\"]|\\[\s\S])*")*\}/, lookbehind: true, inside: { type: { pattern: /(\b(?:count|data|local|module|path|self|terraform|var)\b\.)[\w\*]+/i, lookbehind: true, alias: "variable" }, keyword: /\b(?:count|data|local|module|path|self|terraform|var)\b/i, function: /\w+(?=\()/, string: { pattern: /"(?:\\[\s\S]|[^\\"])*"/, greedy: true }, number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?(?:e[+-]?\d+)?/i, punctuation: /[!\$#%&'()*+,.\/;<=>@\[\\\]^`{|}~?:]/ } } } }, number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?(?:e[+-]?\d+)?/i, boolean: /\b(?:false|true)\b/i, punctuation: /[=\[\]{}]/ };
} });
var Prism2 = require_prism_core();
globalThis.Prism = Prism2;
require_prism_clike();
require_prism_markup();
require_prism_css();
require_prism_javascript();
require_prism_typescript();
require_prism_jsx();
require_prism_tsx();
require_prism_python();
require_prism_go();
require_prism_rust();
require_prism_java();
require_prism_kotlin();
require_prism_swift();
require_prism_c();
require_prism_cpp();
require_prism_csharp();
require_prism_ruby();
require_prism_json();
require_prism_yaml();
require_prism_toml();
require_prism_sql();
require_prism_diff();
require_prism_docker();
require_prism_hcl();
var languages = Prism2.languages;

// ../hooks/render.tsx
var WIDE = /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]|\p{Extended_Pictographic}/u;
var segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter() : void 0;
var graphemes = (s) => segmenter ? [...segmenter.segment(s)].map((g) => g.segment) : [...s];
var cells = (s) => /^[ -~]*$/.test(s) ? [...s] : graphemes(s).flatMap((g) => WIDE.test(g) ? [g, ""] : [g]);
var width = (s) => /^[ -~]*$/.test(s) ? s.length : graphemes(s).reduce((w, g) => /^\p{M}+$/u.test(g) ? w : w + (WIDE.test(g) ? 2 : 1), 0);
var remember = (cache, key, make, limit = 200) => {
  const hit = cache.get(key);
  if (hit !== void 0) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const value = make();
  cache.set(key, value);
  if (cache.size > limit) cache.delete(cache.keys().next().value);
  return value;
};

// ../hooks/figure.tsx
var FIGURE_ROLES = ["accent", "warn", "ok", "note", "dim", "strong"];
var FIGURE_MAX_COLUMNS = 100;
var FIGURE_MAX_LINES = 80;
var FIGURE_SAFE_COLUMNS = 74;
var RAW_MAX_LINE = FIGURE_MAX_COLUMNS * 4;
var LISTED_GLYPHS = 8;
var FIGURE_GLYPHS = "\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550\u2551\u2192\u2190\u25BA\u25C4\u25B2\u25BC\u2713\u2717\u25CF\u25CB\u2588\u258F\u25A0\u25A1\xB7";
var FIGURE_HINT = [
  "A fenced block whose opening line is exactly ```figure is drawn as a text picture, as written.",
  "Prefer one over mermaid when position carries meaning: durations racing on a time axis, a screen layout, phases, before/after; mermaid stays for plain flows and charts; none for short answers, code changes or reports. The prose never retells the picture.",
  "When the user asks you to explain, compare or plan something and pictures would make it easier to grasp, build the reply around them, with the core on the first screen as a picture or a sentence.",
  "Color with {role:text}, not nested: accent for lines, warn for risk, ok for healthy, note for time, dim for asides, strong for emphasis.",
  `At most ${FIGURE_SAFE_COLUMNS} columns, glyphs one column wide such as ${FIGURE_GLYPHS}, no emoji or tabs; markup takes no columns, so align on the drawn text. Draw a time axis with edge ticks like \u258F\u2500\u2500\u2500\u258F\u2500\u2500\u2500\u258F, not \u251C\u253C\u2524: \u2588 fills its cell, \u251C\u253C\u2524 sit mid-cell.`
].join(" ");
var MARKUP = new RegExp(`\\{(${FIGURE_ROLES.join("|")}):([^{}]*)\\}`, "g");
var MARKER = /\{([A-Za-z][\w-]*):/g;
var TEXT_FORMS = { "\u25B6": "\u25BA", "\u25C0": "\u25C4" };
var ROLE_TOKENS = { accent: "diagram", warn: "codeFlag", ok: "codeString", note: "heading", dim: "codeComment", strong: "strong" };
var EMOJI_CAPABLE = /\p{Extended_Pictographic}/u;
var CONTROL = /[\0-\x08\x0b-\x1f\x7f-\x9f]/;
var DIRECTION_MARK = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/;
var INVISIBLE = /[\u00ad\u200b-\u200d\u2028\u2029\ufeff]/;
var isRole = (name) => FIGURE_ROLES.some((role) => role === name);
var textForm = (text2) => text2.replace(/[▶◀]/g, (glyph) => TEXT_FORMS[glyph] ?? glyph);
var figureRuns = (line) => {
  const runs = [];
  let at = 0;
  for (const match of line.matchAll(MARKUP)) {
    const [whole, role, text2 = ""] = match;
    if (match.index > at) runs.push({ text: textForm(line.slice(at, match.index)) });
    if (text2 && isRole(role)) runs.push({ text: textForm(text2), role });
    at = match.index + whole.length;
  }
  if (at < line.length) runs.push({ text: textForm(line.slice(at)) });
  return runs;
};
var figureText = (line) => figureRuns(line).map((run) => run.text).join("");
var swapsTwoLetters = (name, role) => {
  if (name.length !== role.length) return false;
  const differ = [...name].flatMap((letter, i) => letter === role[i] ? [] : [i]);
  const [first = -1, second = -1] = differ;
  return differ.length === 2 && second === first + 1 && name[first] === role[second] && name[second] === role[first];
};
var markupMessage = (marker, drawn2, lastClose) => {
  const [written, name = ""] = marker;
  if (drawn2.has(marker.index)) return void 0;
  const lower = name.toLowerCase();
  const role = FIGURE_ROLES.find((candidate) => candidate === lower || swapsTwoLetters(lower, candidate));
  if (!role) return void 0;
  if (name !== role) return `"${written}" is not a role, roles are ${FIGURE_ROLES.join(", ")} in lower case`;
  if (lastClose < marker.index + written.length) return `"${written}" is not closed, end it with }`;
  return `"${written}" holds braces, markup does not nest`;
};
var markupMessages = (line) => {
  const drawn2 = new Set([...line.matchAll(MARKUP)].map((match) => match.index));
  const lastClose = line.lastIndexOf("}");
  return [...line.matchAll(MARKER)].flatMap((marker) => markupMessage(marker, drawn2, lastClose) ?? []);
};
var quoted = (glyphs) => {
  const distinct = [...new Set(glyphs)];
  const listed = distinct.slice(0, LISTED_GLYPHS).map((glyph) => `"${glyph}"`).join(", ");
  return distinct.length > LISTED_GLYPHS ? `${listed} and ${distinct.length - LISTED_GLYPHS} more` : listed;
};
var lineMessages = (line) => {
  const text2 = figureText(line);
  const glyphs = graphemes(text2);
  const emoji = glyphs.filter((glyph) => EMOJI_CAPABLE.test(glyph));
  const wide = glyphs.filter((glyph) => !EMOJI_CAPABLE.test(glyph) && width(glyph) === 2);
  const columns2 = width(text2);
  return [
    ...columns2 > FIGURE_MAX_COLUMNS ? [`${columns2} columns wide, at most ${FIGURE_MAX_COLUMNS}`] : [],
    ...text2.includes("	") ? ["tab, use spaces"] : [],
    ...CONTROL.test(text2) ? ["control character, use plain text"] : [],
    ...DIRECTION_MARK.test(text2) ? ["direction mark, use plain text"] : [],
    ...INVISIBLE.test(text2) ? ["invisible character, use plain text"] : [],
    ...emoji.length ? [`${quoted(emoji)} may draw as an emoji, use a text glyph`] : [],
    ...wide.length ? [`${quoted(wide)} take two columns, use one-column glyphs`] : [],
    ...markupMessages(line)
  ];
};
var withoutTrailingBlanks = (lines2) => {
  let end = lines2.length;
  while (end > 0 && !lines2[end - 1]?.trim()) end--;
  return lines2.slice(0, end);
};
var checkFigure = (lines2, first = 0) => lines2.flatMap((line, index) => lineMessages(line).map((message) => ({ line: first + index + 1, message })));
var leadingBlanks = (lines2) => {
  const start = lines2.findIndex((line) => line.trim());
  return start < 0 ? lines2.length : start;
};
var ROLE_HUES = { warn: 0, ok: 120, note: 45 };
var INK = ["accent", "heading", "tableHeader", "emphasis", "inlineCode", "codeCommand", "codeFlag", "codeString", "link", "path", "number", "bullet", "quote"];
var HEX = /^#(?:[0-9a-f]{3}){1,2}$/i;
var RGB = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
var channelsOf = (color) => {
  const value = color.trim();
  if (HEX.test(value)) {
    const full = value.length === 4 ? [...value.slice(1)].map((digit) => digit + digit).join("") : value.slice(1);
    const [r = 0, g = 0, b = 0] = [0, 2, 4].map((at) => parseInt(full.slice(at, at + 2), 16));
    return [r, g, b];
  }
  const rgb = RGB.exec(value);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : void 0;
};
var colorKey = (channels) => channels.join(",");
var hueOf = (channels) => {
  const [r, g, b] = channels.map((channel) => Math.min(channel, 255) / 255);
  const max = Math.max(r, g, b);
  const spread = max - Math.min(r, g, b);
  const lightness = (max + max - spread) / 2;
  const saturation = spread === 0 ? 0 : spread / (1 - Math.abs(2 * lightness - 1));
  const sector = spread === 0 ? 0 : max === r ? (g - b) / spread % 6 : max === g ? (b - r) / spread + 2 : (r - g) / spread + 4;
  return { hue: (sector * 60 + 360) % 360, saturation };
};
var hueDistance = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
var pickedRoles = /* @__PURE__ */ new WeakMap();
var figureRoleColors = (theme) => {
  const known = pickedRoles.get(theme);
  if (known) return known;
  const inks = [...new Set(INK.map((token) => theme[token]).filter((color) => color !== void 0))].flatMap((color) => {
    const channels = channelsOf(color);
    return channels ? [{ color, key: colorKey(channels), ...hueOf(channels) }] : [];
  }).filter((ink) => ink.saturation > 0.15);
  const frame = theme.diagram === void 0 ? void 0 : channelsOf(theme.diagram);
  const taken = new Set(frame ? [colorKey(frame)] : []);
  const picked = {};
  for (const role of Object.keys(ROLE_HUES)) {
    const [best] = inks.filter((ink) => !taken.has(ink.key)).sort((a, b) => hueDistance(a.hue, ROLE_HUES[role]) - hueDistance(b.hue, ROLE_HUES[role]));
    if (!best) continue;
    picked[role] = best.color;
    taken.add(best.key);
  }
  pickedRoles.set(theme, picked);
  return picked;
};
var isHued = (role) => role in ROLE_HUES;
var runColor = (style2, role) => {
  if (!role) return style2.theme.diagramText;
  const own = style2.theme[ROLE_TOKENS[role]];
  if (!isHued(role) || own !== void 0 && !channelsOf(own)) return own;
  return figureRoleColors(style2.theme)[role] ?? own;
};
var isBold = (style2, role) => role === "strong" || role === "warn" && !runColor(style2, "warn");
var figureElement = ({ Box, Text }, style2, lines2, key) => /* @__PURE__ */ h(Box, { key, flexDirection: "column", paddingLeft: 2 }, lines2.map((line, i) => {
  const runs = figureRuns(line);
  return /* @__PURE__ */ h(Text, { key: `${key}.${i}` }, runs.length ? runs.map((run, r) => /* @__PURE__ */ h(Text, { key: `r${r}`, color: runColor(style2, run.role), bold: isBold(style2, run.role), dimColor: run.role === "dim" && !style2.theme.codeComment }, run.text)) : " ");
}));
var decisions = /* @__PURE__ */ new Map();
var drawable = (lines2) => {
  const texts = lines2.map(figureText);
  return { lines: lines2, texts, widest: Math.max(0, ...texts.map(width)) };
};
var decide = (raw) => {
  const tooLong = raw.findIndex((line) => line.length > RAW_MAX_LINE);
  if (tooLong >= 0) return { note: `figure line ${tooLong + 1} is ${raw[tooLong].length} characters long` };
  if (raw.length > FIGURE_MAX_LINES * 2) return { note: `figure has ${raw.length} lines, at most ${FIGURE_MAX_LINES}` };
  const first = leadingBlanks(raw);
  const lines2 = withoutTrailingBlanks(raw.slice(first));
  if (lines2.length > FIGURE_MAX_LINES) return { note: `figure has ${lines2.length} lines, at most ${FIGURE_MAX_LINES}` };
  const [finding] = checkFigure(lines2, first);
  return finding ? { note: `figure line ${finding.line}: ${finding.message}` } : drawable(lines2);
};
var drawFigure = (el2, style2, block, columns2, key) => {
  if (block.isOpen) return null;
  const decision = remember(decisions, block.lines.join("\n"), () => decide(block.lines));
  if ("note" in decision) return decision;
  if (decision.lines.length === 0) return null;
  if (decision.widest > columns2 - 2) return { note: `figure is ${decision.widest} cols, terminal is ${columns2}` };
  return { element: figureElement(el2, style2, decision.lines, key), art: decision.texts.join("\n") };
};

// ../hooks/vendor/mermaid-text.js
function normalizeBrTags(label) {
  return (label.startsWith('"') && label.endsWith('"') ? label.slice(1, -1) : label).replace(/<br\s*\/?>/gi, `
`).replace(/\\n/g, `
`).replace(/<\/?(?:sub|sup|small|mark)\s*>/gi, "").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(?<!\*)\*([^\s*](?:[^*]*[^\s*])?)\*(?!\*)/g, "<i>$1</i>").replace(/~~(.+?)~~/g, "<s>$1</s>");
}
function parseMermaid(text2) {
  let lines2 = text2.split(`
`).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("%%"));
  if (lines2.length === 0) throw new Error("Empty mermaid diagram");
  let header = lines2[0];
  return /^stateDiagram(-v2)?\s*$/i.test(header) ? parseStateDiagram(lines2) : parseFlowchart(lines2);
}
function parseFlowchart(lines2) {
  let headerMatch = lines2[0].match(/^(?:graph|flowchart)\s+(TD|TB|LR|BT|RL)\s*$/i);
  if (!headerMatch) throw new Error(`Invalid mermaid header: "${lines2[0]}". Expected "graph TD", "flowchart LR", "stateDiagram-v2", etc.`);
  let graph = { direction: headerMatch[1].toUpperCase(), nodes: /* @__PURE__ */ new Map(), edges: [], subgraphs: [], classDefs: /* @__PURE__ */ new Map(), classAssignments: /* @__PURE__ */ new Map(), nodeStyles: /* @__PURE__ */ new Map(), linkStyles: /* @__PURE__ */ new Map() }, subgraphStack = [];
  for (let i = 1; i < lines2.length; i++) {
    let line = lines2[i], classDefMatch = line.match(/^classDef\s+(\w+)\s+(.+)$/);
    if (classDefMatch) {
      let name = classDefMatch[1], propsStr = classDefMatch[2], props = parseStyleProps(propsStr);
      graph.classDefs.set(name, props);
      continue;
    }
    let classAssignMatch = line.match(/^class\s+([\w,-]+)\s+(\w+)$/);
    if (classAssignMatch) {
      let nodeIds = classAssignMatch[1].split(",").map((s) => s.trim()), className = classAssignMatch[2];
      for (let id of nodeIds) graph.classAssignments.set(id, className);
      continue;
    }
    let styleMatch = line.match(/^style\s+([\w,-]+)\s+(.+)$/);
    if (styleMatch) {
      let nodeIds = styleMatch[1].split(",").map((s) => s.trim()), props = parseStyleProps(styleMatch[2]);
      for (let id of nodeIds) graph.nodeStyles.set(id, { ...graph.nodeStyles.get(id), ...props });
      continue;
    }
    let linkStyleMatch = line.match(/^linkStyle\s+(default|[\d,\s]+)\s+(.+)$/);
    if (linkStyleMatch) {
      let target = linkStyleMatch[1].trim(), props = parseStyleProps(linkStyleMatch[2]);
      if (target === "default") graph.linkStyles.set("default", { ...graph.linkStyles.get("default"), ...props });
      else {
        let indices = target.split(",").map((s) => parseInt(s.trim(), 10));
        for (let idx of indices) isNaN(idx) || graph.linkStyles.set(idx, { ...graph.linkStyles.get(idx), ...props });
      }
      continue;
    }
    let dirMatch = line.match(/^direction\s+(TD|TB|LR|BT|RL)\s*$/i);
    if (dirMatch && subgraphStack.length > 0) {
      subgraphStack[subgraphStack.length - 1].direction = dirMatch[1].toUpperCase();
      continue;
    }
    let subgraphMatch = line.match(/^subgraph\s+(.+)$/);
    if (subgraphMatch) {
      let rest = subgraphMatch[1].trim(), bracketMatch = rest.match(/^([\w-]+)\s*\[(.+)\]$/), id, label;
      bracketMatch ? (id = bracketMatch[1], label = normalizeBrTags(bracketMatch[2])) : (label = normalizeBrTags(rest), id = rest.replace(/\s+/g, "_").replace(/[^\w]/g, ""));
      let sg = { id, label, nodeIds: [], children: [] };
      subgraphStack.push(sg);
      continue;
    }
    if (line === "end") {
      let completed = subgraphStack.pop();
      completed && (subgraphStack.length > 0 ? subgraphStack[subgraphStack.length - 1].children.push(completed) : graph.subgraphs.push(completed));
      continue;
    }
    parseEdgeLine(line, graph, subgraphStack);
  }
  return graph;
}
function parseStateDiagram(lines2) {
  let graph = { direction: "TD", nodes: /* @__PURE__ */ new Map(), edges: [], subgraphs: [], classDefs: /* @__PURE__ */ new Map(), classAssignments: /* @__PURE__ */ new Map(), nodeStyles: /* @__PURE__ */ new Map(), linkStyles: /* @__PURE__ */ new Map() }, compositeStack = [], compositeStateIds = /* @__PURE__ */ new Set(), startCount = 0, endCount = 0;
  for (let i = 1; i < lines2.length; i++) {
    let line = lines2[i], dirMatch = line.match(/^direction\s+(TD|TB|LR|BT|RL)\s*$/i);
    if (dirMatch) {
      compositeStack.length > 0 ? compositeStack[compositeStack.length - 1].direction = dirMatch[1].toUpperCase() : graph.direction = dirMatch[1].toUpperCase();
      continue;
    }
    let linkStyleMatch = line.match(/^linkStyle\s+(default|[\d,\s]+)\s+(.+)$/);
    if (linkStyleMatch) {
      let target = linkStyleMatch[1].trim(), props = parseStyleProps(linkStyleMatch[2]);
      if (target === "default") graph.linkStyles.set("default", { ...graph.linkStyles.get("default"), ...props });
      else {
        let indices = target.split(",").map((s) => parseInt(s.trim(), 10));
        for (let idx of indices) isNaN(idx) || graph.linkStyles.set(idx, { ...graph.linkStyles.get(idx), ...props });
      }
      continue;
    }
    let compositeMatch = line.match(/^state\s+(?:"([^"]+)"\s+as\s+)?([\w\p{L}]+)\s*\{$/u);
    if (compositeMatch) {
      let label = compositeMatch[1] ?? compositeMatch[2], id = compositeMatch[2], sg = { id, label, nodeIds: [], children: [] };
      compositeStack.push(sg), compositeStateIds.add(id), graph.nodes.delete(id);
      continue;
    }
    if (line === "}") {
      let completed = compositeStack.pop();
      completed && (compositeStack.length > 0 ? compositeStack[compositeStack.length - 1].children.push(completed) : graph.subgraphs.push(completed));
      continue;
    }
    let stateAliasMatch = line.match(/^state\s+"([^"]+)"\s+as\s+([\w\p{L}]+)\s*$/u);
    if (stateAliasMatch) {
      let label = normalizeBrTags(stateAliasMatch[1]), id = stateAliasMatch[2];
      registerStateNode(graph, compositeStack, { id, label, shape: "rounded" });
      continue;
    }
    let transitionMatch = line.match(/^(\[\*\]|[\w\p{L}-]+)\s*(-->)\s*(\[\*\]|[\w\p{L}-]+)(?:\s*:\s*(.+))?$/u);
    if (transitionMatch) {
      let sourceId = transitionMatch[1], targetId = transitionMatch[3], rawTransitionLabel = transitionMatch[4]?.trim(), edgeLabel = rawTransitionLabel ? normalizeBrTags(rawTransitionLabel) : void 0;
      sourceId === "[*]" ? (startCount++, sourceId = `_start${startCount > 1 ? startCount : ""}`, registerStateNode(graph, compositeStack, { id: sourceId, label: "", shape: "state-start" })) : compositeStateIds.has(sourceId) || ensureStateNode(graph, compositeStack, sourceId), targetId === "[*]" ? (endCount++, targetId = `_end${endCount > 1 ? endCount : ""}`, registerStateNode(graph, compositeStack, { id: targetId, label: "", shape: "state-end" })) : compositeStateIds.has(targetId) || ensureStateNode(graph, compositeStack, targetId), graph.edges.push({ source: sourceId, target: targetId, label: edgeLabel, style: "solid", hasArrowStart: false, hasArrowEnd: true });
      continue;
    }
    let stateDescMatch = line.match(/^([\w\p{L}-]+)\s*:\s*(.+)$/u);
    if (stateDescMatch) {
      let id = stateDescMatch[1], label = normalizeBrTags(stateDescMatch[2].trim());
      registerStateNode(graph, compositeStack, { id, label, shape: "rounded" });
      continue;
    }
  }
  return graph;
}
function registerStateNode(graph, compositeStack, node) {
  if (!graph.nodes.has(node.id) && graph.nodes.set(node.id, node), compositeStack.length > 0) {
    let current = compositeStack[compositeStack.length - 1];
    current.nodeIds.includes(node.id) || current.nodeIds.push(node.id);
  }
}
function ensureStateNode(graph, compositeStack, id) {
  if (!graph.nodes.has(id)) registerStateNode(graph, compositeStack, { id, label: id, shape: "rounded" });
  else if (compositeStack.length > 0) {
    let current = compositeStack[compositeStack.length - 1];
    current.nodeIds.includes(id) || current.nodeIds.push(id);
  }
}
function parseStyleProps(propsStr) {
  let cleaned = propsStr.replace(/;\s*$/, ""), props = {};
  for (let pair of cleaned.split(",")) {
    let colonIdx = pair.indexOf(":");
    if (colonIdx > 0) {
      let key = pair.slice(0, colonIdx).trim(), val = pair.slice(colonIdx + 1).trim();
      key && val && (props[key] = val);
    }
  }
  return props;
}
var ARROW_REGEX = /^(<)?(-->|-.->|==>|---|-\.-|===)(?:\|([^|]*)\|)?/;
var TEXT_ARROW_REGEX = /^(<)?(--|-\.|==)\s+(.+?)\s+(-->|---|\.\->|-\.\-|==>|===)/;
var NODE_PATTERNS = [{ regex: /^((?:\w|-(?![-.>]))+)\(\(\((.+?)\)\)\)/, shape: "doublecircle" }, { regex: /^((?:\w|-(?![-.>]))+)\(\[(.+?)\]\)/, shape: "stadium" }, { regex: /^((?:\w|-(?![-.>]))+)\(\((.+?)\)\)/, shape: "circle" }, { regex: /^((?:\w|-(?![-.>]))+)\[\[(.+?)\]\]/, shape: "subroutine" }, { regex: /^((?:\w|-(?![-.>]))+)\[\((.+?)\)\]/, shape: "cylinder" }, { regex: /^((?:\w|-(?![-.>]))+)\[\/(.+?)\\\]/, shape: "trapezoid" }, { regex: /^((?:\w|-(?![-.>]))+)\[\\(.+?)\/\]/, shape: "trapezoid-alt" }, { regex: /^((?:\w|-(?![-.>]))+)>(.+?)\]/, shape: "asymmetric" }, { regex: /^((?:\w|-(?![-.>]))+)\{\{(.+?)\}\}/, shape: "hexagon" }, { regex: /^((?:\w|-(?![-.>]))+)\[(.+?)\]/, shape: "rectangle" }, { regex: /^((?:\w|-(?![-.>]))+)\((.+?)\)/, shape: "rounded" }, { regex: /^((?:\w|-(?![-.>]))+)\{(.+?)\}/, shape: "diamond" }];
var BARE_NODE_REGEX = /^((?:\w|-(?![-.>]))+)/;
var CLASS_SHORTHAND_REGEX = /^:::([\w][\w-]*)/;
function parseEdgeLine(line, graph, subgraphStack) {
  let remaining = line.trim(), firstGroup = consumeNodeGroup(remaining, graph, subgraphStack);
  if (!firstGroup || firstGroup.ids.length === 0) return;
  remaining = firstGroup.remaining.trim();
  let prevGroupIds = firstGroup.ids;
  for (; remaining.length > 0; ) {
    let hasArrowStart, style2, hasArrowEnd, edgeLabel, arrowMatch = remaining.match(ARROW_REGEX);
    if (arrowMatch) {
      hasArrowStart = !!arrowMatch[1];
      let arrowOp = arrowMatch[2], rawEdgeLabel = arrowMatch[3]?.trim();
      edgeLabel = rawEdgeLabel ? normalizeBrTags(rawEdgeLabel) : void 0, remaining = remaining.slice(arrowMatch[0].length).trim(), style2 = arrowStyleFromOp(arrowOp), hasArrowEnd = arrowOp.endsWith(">");
    } else {
      let textMatch = remaining.match(TEXT_ARROW_REGEX);
      if (!textMatch) break;
      hasArrowStart = !!textMatch[1];
      let rawLabel = textMatch[3].trim();
      edgeLabel = rawLabel ? normalizeBrTags(rawLabel) : void 0;
      let openOp = textMatch[2], closeOp = textMatch[4];
      remaining = remaining.slice(textMatch[0].length).trim(), style2 = textArrowStyleFromOps(openOp, closeOp), hasArrowEnd = closeOp.endsWith(">");
    }
    let nextGroup = consumeNodeGroup(remaining, graph, subgraphStack);
    if (!nextGroup || nextGroup.ids.length === 0) break;
    remaining = nextGroup.remaining.trim();
    for (let sourceId of prevGroupIds) for (let targetId of nextGroup.ids) graph.edges.push({ source: sourceId, target: targetId, label: edgeLabel, style: style2, hasArrowStart, hasArrowEnd });
    prevGroupIds = nextGroup.ids;
  }
}
function consumeNodeGroup(text2, graph, subgraphStack) {
  let first = consumeNode(text2, graph, subgraphStack);
  if (!first) return null;
  let ids = [first.id], remaining = first.remaining.trim();
  for (; remaining.startsWith("&"); ) {
    remaining = remaining.slice(1).trim();
    let next = consumeNode(remaining, graph, subgraphStack);
    if (!next) break;
    ids.push(next.id), remaining = next.remaining.trim();
  }
  return { ids, remaining };
}
function consumeNode(text2, graph, subgraphStack) {
  let id = null, remaining = text2;
  for (let { regex, shape } of NODE_PATTERNS) {
    let match = text2.match(regex);
    if (match) {
      id = match[1];
      let label = normalizeBrTags(match[2]);
      registerNode(graph, subgraphStack, { id, label, shape }), remaining = text2.slice(match[0].length);
      break;
    }
  }
  if (id === null) {
    let bareMatch = text2.match(BARE_NODE_REGEX);
    bareMatch && (id = bareMatch[1], graph.nodes.has(id) || registerNode(graph, subgraphStack, { id, label: id, shape: "rectangle" }), remaining = text2.slice(bareMatch[0].length));
  }
  if (id === null) return null;
  let classMatch = remaining.match(CLASS_SHORTHAND_REGEX);
  return classMatch && (graph.classAssignments.set(id, classMatch[1]), remaining = remaining.slice(classMatch[0].length)), { id, remaining };
}
function registerNode(graph, subgraphStack, node) {
  !graph.nodes.has(node.id) && graph.nodes.set(node.id, node), trackInSubgraph(subgraphStack, node.id);
}
function trackInSubgraph(subgraphStack, nodeId) {
  if (subgraphStack.length > 0) {
    let current = subgraphStack[subgraphStack.length - 1];
    current.nodeIds.includes(nodeId) || current.nodeIds.push(nodeId);
  }
}
function arrowStyleFromOp(op) {
  return op === "-.->" || op === "-.-" ? "dotted" : op === "==>" || op === "===" ? "thick" : "solid";
}
function textArrowStyleFromOps(openOp, closeOp) {
  return openOp === "-." || closeOp === ".->" || closeOp === "-.-" ? "dotted" : openOp === "==" || closeOp === "==>" || closeOp === "===" ? "thick" : "solid";
}
var Up = { x: 1, y: 0 };
var Down = { x: 1, y: 2 };
var Left = { x: 0, y: 1 };
var Right = { x: 2, y: 1 };
var UpperRight = { x: 2, y: 0 };
var UpperLeft = { x: 0, y: 0 };
var LowerRight = { x: 2, y: 2 };
var LowerLeft = { x: 0, y: 2 };
var Middle = { x: 1, y: 1 };
function gridCoordEquals(a, b) {
  return a.x === b.x && a.y === b.y;
}
function drawingCoordEquals(a, b) {
  return a.x === b.x && a.y === b.y;
}
function gridCoordDirection(c, dir) {
  return { x: c.x + dir.x, y: c.y + dir.y };
}
function gridKey(c) {
  return `${c.x},${c.y}`;
}
var EMPTY_STYLE = { name: "", styles: {} };
var DEFAULT_ASCII_THEME = { fg: "#27272a", border: "#a1a1aa", line: "#71717a", arrow: "#52525b", corner: "#71717a", junction: "#a1a1aa" };
function detectColorMode() {
  let proc = globalThis.process;
  if (proc) {
    if (!proc.stdout?.isTTY) return "none";
    let colorTerm = proc.env?.COLORTERM?.toLowerCase() ?? "", term = proc.env?.TERM?.toLowerCase() ?? "";
    return colorTerm === "truecolor" || colorTerm === "24bit" ? "truecolor" : term.includes("256color") || term.includes("256") ? "ansi256" : term && term !== "dumb" ? "ansi16" : "none";
  }
  return typeof document < "u" ? "html" : "none";
}
function parseHex(hex) {
  let h2 = hex.replace("#", "");
  return h2.length === 3 ? { r: parseInt(h2[0] + h2[0], 16), g: parseInt(h2[1] + h2[1], 16), b: parseInt(h2[2] + h2[2], 16) } : { r: parseInt(h2.substring(0, 2), 16), g: parseInt(h2.substring(2, 4), 16), b: parseInt(h2.substring(4, 6), 16) };
}
var ESC = "\x1B[";
var RESET = `${ESC}0m`;
function truecolorFg(hex) {
  let { r, g, b } = parseHex(hex);
  return `${ESC}38;2;${r};${g};${b}m`;
}
function rgbTo256(r, g, b) {
  let avg = (r + g + b) / 3;
  if (Math.max(Math.abs(r - avg), Math.abs(g - avg), Math.abs(b - avg)) < 10) {
    let gray = Math.round(avg / 255 * 23);
    return 232 + Math.min(23, Math.max(0, gray));
  }
  let toIndex = (v) => v < 48 ? 0 : v < 115 ? 1 : Math.min(5, Math.floor((v - 35) / 40)), ri = toIndex(r), gi = toIndex(g), bi = toIndex(b);
  return 16 + 36 * ri + 6 * gi + bi;
}
function ansi256Fg(hex) {
  let { r, g, b } = parseHex(hex), index = rgbTo256(r, g, b);
  return `${ESC}38;5;${index}m`;
}
function ansi16Fg(hex) {
  let { r, g, b } = parseHex(hex), luma = 0.299 * r + 0.587 * g + 0.114 * b, bright = luma > 100 ? 0 : 60, code;
  return r > 180 && g < 100 && b < 100 ? code = 31 : g > 180 && r < 100 && b < 100 ? code = 32 : r > 150 && g > 150 && b < 100 ? code = 33 : b > 180 && r < 100 && g < 100 ? code = 34 : r > 150 && b > 150 && g < 100 ? code = 35 : g > 150 && b > 150 && r < 100 ? code = 36 : luma > 200 ? code = 37 : luma < 50 ? code = 30 : code = 37, `${ESC}${code + bright}m`;
}
function escapeHtml(text2) {
  return text2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function htmlSpan(hex, text2) {
  return `<span style="color:${hex}">${escapeHtml(text2)}</span>`;
}
function getRoleColor(role, theme) {
  switch (role) {
    case "text":
      return theme.fg;
    case "border":
      return theme.border;
    case "line":
      return theme.line;
    case "arrow":
      return theme.arrow;
    case "corner":
      return theme.corner ?? theme.line;
    case "junction":
      return theme.junction ?? theme.border;
    default:
      return theme.fg;
  }
}
function getAnsiColor(role, theme, mode) {
  if (mode === "none") return "";
  let hex = getRoleColor(role, theme);
  switch (mode) {
    case "truecolor":
      return truecolorFg(hex);
    case "ansi256":
      return ansi256Fg(hex);
    case "ansi16":
      return ansi16Fg(hex);
    default:
      return "";
  }
}
function colorizeLine(chars, roles, theme, mode) {
  if (mode === "none") return chars.join("");
  if (mode === "html") return colorizeLineHtml(chars, roles, theme);
  let result = "", currentRole = null, buffer = "";
  for (let i = 0; i < chars.length; i++) {
    let char = chars[i], role = roles[i] ?? null;
    if (char === " ") {
      buffer.length > 0 && (currentRole !== null ? result += getAnsiColor(currentRole, theme, mode) + buffer + RESET : result += buffer, buffer = "", currentRole = null), result += char;
      continue;
    }
    if (role === currentRole) {
      buffer += char;
      continue;
    }
    buffer.length > 0 && (currentRole !== null ? result += getAnsiColor(currentRole, theme, mode) + buffer + RESET : result += buffer), buffer = char, currentRole = role;
  }
  return buffer.length > 0 && currentRole !== null ? result += getAnsiColor(currentRole, theme, mode) + buffer + RESET : buffer.length > 0 && (result += buffer), result;
}
function colorizeLineHtml(chars, roles, theme) {
  let result = "", currentRole = null, buffer = "", flush = () => {
    buffer.length !== 0 && (currentRole !== null ? result += htmlSpan(getRoleColor(currentRole, theme), buffer) : result += escapeHtml(buffer), buffer = "", currentRole = null);
  };
  for (let i = 0; i < chars.length; i++) {
    let char = chars[i], role = roles[i] ?? null;
    if (char === " ") {
      flush(), result += " ";
      continue;
    }
    if (role === currentRole) {
      buffer += char;
      continue;
    }
    flush(), buffer = char, currentRole = role;
  }
  return flush(), result;
}
function colorizeText(text2, hex, mode) {
  if (mode === "none" || text2.length === 0) return text2;
  if (mode === "html") return htmlSpan(hex, text2);
  let code;
  switch (mode) {
    case "truecolor":
      code = truecolorFg(hex);
      break;
    case "ansi256":
      code = ansi256Fg(hex);
      break;
    case "ansi16":
      code = ansi16Fg(hex);
      break;
    default:
      return text2;
  }
  return `${code}${text2}${RESET}`;
}
function mkCanvas(x, y) {
  let canvas = [];
  for (let i = 0; i <= x; i++) {
    let col = [];
    for (let j = 0; j <= y; j++) col.push(" ");
    canvas.push(col);
  }
  return canvas;
}
function copyCanvas(source2) {
  let [maxX, maxY] = getCanvasSize(source2);
  return mkCanvas(maxX, maxY);
}
function mkRoleCanvas(x, y) {
  let roleCanvas = [];
  for (let i = 0; i <= x; i++) {
    let col = [];
    for (let j = 0; j <= y; j++) col.push(null);
    roleCanvas.push(col);
  }
  return roleCanvas;
}
function increaseRoleCanvasSize(roleCanvas, newX, newY) {
  let currX = roleCanvas.length - 1, currY = (roleCanvas[0]?.length ?? 1) - 1, targetX = Math.max(newX, currX), targetY = Math.max(newY, currY), grown = mkRoleCanvas(targetX, targetY);
  for (let x = 0; x < grown.length; x++) for (let y = 0; y < grown[0].length; y++) x < roleCanvas.length && y < roleCanvas[0].length && (grown[x][y] = roleCanvas[x][y]);
  return roleCanvas.length = 0, roleCanvas.push(...grown), roleCanvas;
}
function setRole(roleCanvas, x, y, role) {
  (x >= roleCanvas.length || y >= (roleCanvas[0]?.length ?? 0)) && increaseRoleCanvasSize(roleCanvas, x, y), roleCanvas[x][y] = role;
}
function getCanvasSize(canvas) {
  return [canvas.length - 1, (canvas[0]?.length ?? 1) - 1];
}
function increaseSize(canvas, newX, newY) {
  let [currX, currY] = getCanvasSize(canvas), targetX = Math.max(newX, currX), targetY = Math.max(newY, currY), grown = mkCanvas(targetX, targetY);
  for (let x = 0; x < grown.length; x++) for (let y = 0; y < grown[0].length; y++) x < canvas.length && y < canvas[0].length && (grown[x][y] = canvas[x][y]);
  return canvas.length = 0, canvas.push(...grown), canvas;
}
var JUNCTION_CHARS = /* @__PURE__ */ new Set(["\u2500", "\u2502", "\u250C", "\u2510", "\u2514", "\u2518", "\u251C", "\u2524", "\u252C", "\u2534", "\u253C", "\u2574", "\u2575", "\u2576", "\u2577"]);
function clearLabelGaps(canvas, label) {
  for (let y = 0; y < (label[0]?.length ?? 0); y++) {
    let xs = label.map((col, x) => col[y] !== " " ? x : -1).filter((x) => x >= 0);
    if (xs.length !== 0) for (let x = xs[0]; x <= xs[xs.length - 1]; x++) label[x][y] === " " && !isAlphanumeric(canvas[x][y]) && (canvas[x][y] = " ");
  }
}
function isJunctionChar(c) {
  return JUNCTION_CHARS.has(c);
}
function isAlphanumeric(c) {
  return /^[a-zA-Z0-9]$/.test(c);
}
var JUNCTION_MAP = { "\u2500": { "\u2502": "\u253C", "\u250C": "\u252C", "\u2510": "\u252C", "\u2514": "\u2534", "\u2518": "\u2534", "\u251C": "\u253C", "\u2524": "\u253C", "\u252C": "\u252C", "\u2534": "\u2534" }, "\u2502": { "\u2500": "\u253C", "\u250C": "\u251C", "\u2510": "\u2524", "\u2514": "\u251C", "\u2518": "\u2524", "\u251C": "\u251C", "\u2524": "\u2524", "\u252C": "\u253C", "\u2534": "\u253C" }, "\u250C": { "\u2500": "\u252C", "\u2502": "\u251C", "\u2510": "\u252C", "\u2514": "\u251C", "\u2518": "\u253C", "\u251C": "\u251C", "\u2524": "\u253C", "\u252C": "\u252C", "\u2534": "\u253C" }, "\u2510": { "\u2500": "\u252C", "\u2502": "\u2524", "\u250C": "\u252C", "\u2514": "\u253C", "\u2518": "\u2524", "\u251C": "\u253C", "\u2524": "\u2524", "\u252C": "\u252C", "\u2534": "\u253C" }, "\u2514": { "\u2500": "\u2534", "\u2502": "\u251C", "\u250C": "\u251C", "\u2510": "\u253C", "\u2518": "\u2534", "\u251C": "\u251C", "\u2524": "\u253C", "\u252C": "\u253C", "\u2534": "\u2534" }, "\u2518": { "\u2500": "\u2534", "\u2502": "\u2524", "\u250C": "\u253C", "\u2510": "\u2524", "\u2514": "\u2534", "\u251C": "\u253C", "\u2524": "\u2524", "\u252C": "\u253C", "\u2534": "\u2534" }, "\u251C": { "\u2500": "\u253C", "\u2502": "\u251C", "\u250C": "\u251C", "\u2510": "\u253C", "\u2514": "\u251C", "\u2518": "\u253C", "\u2524": "\u253C", "\u252C": "\u253C", "\u2534": "\u253C" }, "\u2524": { "\u2500": "\u253C", "\u2502": "\u2524", "\u250C": "\u253C", "\u2510": "\u2524", "\u2514": "\u253C", "\u2518": "\u2524", "\u251C": "\u253C", "\u252C": "\u253C", "\u2534": "\u253C" }, "\u252C": { "\u2500": "\u252C", "\u2502": "\u253C", "\u250C": "\u252C", "\u2510": "\u252C", "\u2514": "\u253C", "\u2518": "\u253C", "\u251C": "\u253C", "\u2524": "\u253C", "\u2534": "\u253C" }, "\u2534": { "\u2500": "\u2534", "\u2502": "\u253C", "\u250C": "\u253C", "\u2510": "\u253C", "\u2514": "\u2534", "\u2518": "\u2534", "\u251C": "\u253C", "\u2524": "\u253C", "\u252C": "\u253C" } };
function mergeJunctions(c1, c2) {
  return JUNCTION_MAP[c1]?.[c2] ?? c1;
}
function mergeCanvases(base, offset, useAscii, ...overlays) {
  let [maxX, maxY] = getCanvasSize(base);
  for (let overlay of overlays) {
    let [oX, oY] = getCanvasSize(overlay);
    maxX = Math.max(maxX, oX + offset.x), maxY = Math.max(maxY, oY + offset.y);
  }
  let merged = mkCanvas(maxX, maxY);
  for (let x = 0; x <= maxX; x++) for (let y = 0; y <= maxY; y++) x < base.length && y < base[0].length && (merged[x][y] = base[x][y]);
  for (let overlay of overlays) for (let x = 0; x < overlay.length; x++) for (let y = 0; y < overlay[0].length; y++) {
    let c = overlay[x][y];
    if (c !== " ") {
      let mx = x + offset.x, my = y + offset.y, current = merged[mx][my];
      !useAscii && isJunctionChar(c) && isJunctionChar(current) ? merged[mx][my] = mergeJunctions(current, c) : isAlphanumeric(current) && isAlphanumeric(c) || (merged[mx][my] = c);
    }
  }
  return merged;
}
function canvasToString(canvas, options) {
  let [maxX, maxY] = getCanvasSize(canvas), lines2 = [], roleCanvas = options?.roleCanvas, colorMode = options?.colorMode ?? "none", theme = options?.theme ?? DEFAULT_ASCII_THEME;
  for (let y = 0; y <= maxY; y++) if (colorMode === "none" || !roleCanvas) {
    let line = "";
    for (let x = 0; x <= maxX; x++) line += canvas[x][y];
    lines2.push(line);
  } else {
    let chars = [], roles = [];
    for (let x = 0; x <= maxX; x++) chars.push(canvas[x][y]), roles.push(roleCanvas[x]?.[y] ?? null);
    lines2.push(colorizeLine(chars, roles, theme, colorMode));
  }
  return lines2.join(`
`);
}
var VERTICAL_FLIP_MAP = { "\u25B2": "\u25BC", "\u25BC": "\u25B2", "\u25E4": "\u25E3", "\u25E3": "\u25E4", "\u25E5": "\u25E2", "\u25E2": "\u25E5", "^": "v", v: "^", "\u250C": "\u2514", "\u2514": "\u250C", "\u2510": "\u2518", "\u2518": "\u2510", "\u252C": "\u2534", "\u2534": "\u252C", "\u2575": "\u2577", "\u2577": "\u2575" };
function flipCanvasVertically(canvas) {
  for (let col of canvas) col.reverse();
  for (let col of canvas) for (let y = 0; y < col.length; y++) {
    let flipped = VERTICAL_FLIP_MAP[col[y]];
    flipped && (col[y] = flipped);
  }
  return canvas;
}
function flipRoleCanvasVertically(roleCanvas) {
  for (let col of roleCanvas) col.reverse();
  return roleCanvas;
}
function drawText(canvas, start, text2, forceOverwrite = false) {
  increaseSize(canvas, start.x + text2.length, start.y);
  for (let i = 0; i < text2.length; i++) {
    let x = start.x + i, current = canvas[x][start.y];
    (forceOverwrite || current === " ") && (canvas[x][start.y] = text2[i]);
  }
}
function setCanvasSizeToGrid(canvas, columnWidth, rowHeight) {
  let maxX = 0, maxY = 0;
  for (let w of columnWidth.values()) maxX += w;
  for (let h2 of rowHeight.values()) maxY += h2;
  increaseSize(canvas, maxX - 1, maxY - 1);
}
function setRoleCanvasSizeToGrid(roleCanvas, columnWidth, rowHeight) {
  let maxX = 0, maxY = 0;
  for (let w of columnWidth.values()) maxX += w;
  for (let h2 of rowHeight.values()) maxY += h2;
  increaseRoleCanvasSize(roleCanvas, maxX - 1, maxY - 1);
}
function convertToAsciiGraph(parsed, config) {
  let nodeMap = /* @__PURE__ */ new Map(), index = 0;
  for (let [id, mNode] of parsed.nodes) {
    let asciiNode = { name: id, displayLabel: mNode.label, shape: mNode.shape, index, gridCoord: null, drawingCoord: null, drawing: null, drawn: false, styleClassName: "", styleClass: EMPTY_STYLE };
    nodeMap.set(id, asciiNode), index++;
  }
  let nodes = [...nodeMap.values()], edges = [];
  for (let mEdge of parsed.edges) {
    let from = nodeMap.get(mEdge.source), to = nodeMap.get(mEdge.target);
    !from || !to || edges.push({ from, to, text: mEdge.label ?? "", path: [], labelLine: [], startDir: { x: 0, y: 0 }, endDir: { x: 0, y: 0 }, style: mEdge.style, hasArrowStart: mEdge.hasArrowStart, hasArrowEnd: mEdge.hasArrowEnd });
  }
  let subgraphs = [];
  for (let mSg of parsed.subgraphs) convertSubgraph(mSg, null, nodeMap, subgraphs);
  deduplicateSubgraphNodes(parsed.subgraphs, subgraphs, nodeMap, parsed);
  for (let [nodeId, className] of parsed.classAssignments) {
    let node = nodeMap.get(nodeId), classDef = parsed.classDefs.get(className);
    node && classDef && (node.styleClassName = className, node.styleClass = { name: className, styles: classDef });
  }
  return { nodes, edges, canvas: mkCanvas(0, 0), roleCanvas: mkRoleCanvas(0, 0), grid: /* @__PURE__ */ new Map(), columnWidth: /* @__PURE__ */ new Map(), rowHeight: /* @__PURE__ */ new Map(), subgraphs, config, offsetX: 0, offsetY: 0, bundles: [] };
}
function convertSubgraph(mSg, parent, nodeMap, allSubgraphs) {
  let normalizedDirection;
  mSg.direction && (normalizedDirection = mSg.direction === "LR" || mSg.direction === "RL" ? "LR" : "TD");
  let sg = { name: mSg.label, nodes: [], parent, children: [], minX: 0, minY: 0, maxX: 0, maxY: 0, direction: normalizedDirection };
  for (let nodeId of mSg.nodeIds) {
    let node = nodeMap.get(nodeId);
    node && sg.nodes.push(node);
  }
  allSubgraphs.push(sg);
  for (let childMSg of mSg.children) {
    let child = convertSubgraph(childMSg, sg, nodeMap, allSubgraphs);
    sg.children.push(child);
    for (let childNode of child.nodes) sg.nodes.includes(childNode) || sg.nodes.push(childNode);
  }
  return sg;
}
function deduplicateSubgraphNodes(mermaidSubgraphs, asciiSubgraphs, nodeMap, parsed) {
  let sgMap = /* @__PURE__ */ new Map();
  buildSgMap(mermaidSubgraphs, asciiSubgraphs, sgMap);
  let nodeOwner = /* @__PURE__ */ new Map();
  function claimNodes(mSg) {
    let asciiSg = sgMap.get(mSg);
    if (asciiSg) {
      for (let child of mSg.children) claimNodes(child);
      for (let nodeId of mSg.nodeIds) nodeOwner.has(nodeId) || nodeOwner.set(nodeId, asciiSg);
    }
  }
  for (let mSg of mermaidSubgraphs) claimNodes(mSg);
  for (let asciiSg of asciiSubgraphs) asciiSg.nodes = asciiSg.nodes.filter((node) => {
    let nodeId;
    for (let [id, n] of nodeMap) if (n === node) {
      nodeId = id;
      break;
    }
    if (!nodeId) return false;
    let owner = nodeOwner.get(nodeId);
    return owner ? isAncestorOrSelf(asciiSg, owner) : true;
  });
}
function isAncestorOrSelf(candidate, target) {
  let current = target;
  for (; current !== null; ) {
    if (current === candidate) return true;
    current = current.parent;
  }
  return false;
}
function buildSgMap(mSgs, aSgs, result) {
  let flatMermaid = [];
  function flatten(sgs) {
    for (let sg of sgs) flatMermaid.push(sg), flatten(sg.children);
  }
  flatten(mSgs);
  for (let i = 0; i < flatMermaid.length && i < aSgs.length; i++) result.set(flatMermaid[i], aSgs[i]);
}
var MinHeap = class {
  items = [];
  get length() {
    return this.items.length;
  }
  push(item) {
    this.items.push(item), this.bubbleUp(this.items.length - 1);
  }
  pop() {
    if (this.items.length === 0) return;
    let top = this.items[0], last = this.items.pop();
    return this.items.length > 0 && (this.items[0] = last, this.sinkDown(0)), top;
  }
  bubbleUp(i) {
    for (; i > 0; ) {
      let parent = i - 1 >> 1;
      if (this.items[i].priority < this.items[parent].priority) [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]], i = parent;
      else break;
    }
  }
  sinkDown(i) {
    let n = this.items.length;
    for (; ; ) {
      let smallest = i, left = 2 * i + 1, right = 2 * i + 2;
      if (left < n && this.items[left].priority < this.items[smallest].priority && (smallest = left), right < n && this.items[right].priority < this.items[smallest].priority && (smallest = right), smallest !== i) [this.items[i], this.items[smallest]] = [this.items[smallest], this.items[i]], i = smallest;
      else break;
    }
  }
};
function heuristic(a, b) {
  let absX = Math.abs(a.x - b.x), absY = Math.abs(a.y - b.y);
  return absX === 0 || absY === 0 ? absX + absY : absX + absY + 1;
}
var MOVE_DIRS = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
function isFreeInGrid(grid, c) {
  return c.x < 0 || c.y < 0 ? false : !grid.has(gridKey(c));
}
function getPath(grid, from, to) {
  let pq = new MinHeap();
  pq.push({ coord: from, priority: 0 });
  let costSoFar = /* @__PURE__ */ new Map();
  costSoFar.set(gridKey(from), 0);
  let cameFrom = /* @__PURE__ */ new Map();
  for (cameFrom.set(gridKey(from), null); pq.length > 0; ) {
    let current = pq.pop().coord;
    if (gridCoordEquals(current, to)) {
      let path = [], c = current;
      for (; c !== null; ) path.unshift(c), c = cameFrom.get(gridKey(c)) ?? null;
      return path;
    }
    let currentCost = costSoFar.get(gridKey(current));
    for (let dir of MOVE_DIRS) {
      let next = { x: current.x + dir.x, y: current.y + dir.y };
      if (!isFreeInGrid(grid, next) && !gridCoordEquals(next, to)) continue;
      let newCost = currentCost + 1, nextKey = gridKey(next), existingCost = costSoFar.get(nextKey);
      if (existingCost === void 0 || newCost < existingCost) {
        costSoFar.set(nextKey, newCost);
        let priority = newCost + heuristic(next, to);
        pq.push({ coord: next, priority }), cameFrom.set(nextKey, current);
      }
    }
  }
  return null;
}
function mergePath(path) {
  if (path.length <= 2) return path;
  let toRemove = /* @__PURE__ */ new Set(), step0 = path[0], step1 = path[1];
  for (let idx = 2; idx < path.length; idx++) {
    let step2 = path[idx], prevDx = step1.x - step0.x, prevDy = step1.y - step0.y, dx = step2.x - step1.x, dy = step2.y - step1.y;
    prevDx === dx && prevDy === dy && toRemove.add(idx - 1), step0 = step1, step1 = step2;
  }
  return path.filter((_, i) => !toRemove.has(i));
}
function getOpposite(d) {
  return d === Up ? Down : d === Down ? Up : d === Left ? Right : d === Right ? Left : d === UpperRight ? LowerLeft : d === UpperLeft ? LowerRight : d === LowerRight ? UpperLeft : d === LowerLeft ? UpperRight : Middle;
}
function dirEquals(a, b) {
  return a.x === b.x && a.y === b.y;
}
function determineDirection(from, to) {
  return from.x === to.x ? from.y < to.y ? Down : Up : from.y === to.y ? from.x < to.x ? Right : Left : from.x < to.x ? from.y < to.y ? LowerRight : UpperRight : from.y < to.y ? LowerLeft : UpperLeft;
}
function selfReferenceDirection(graphDirection) {
  return graphDirection === "LR" ? [Right, Down, Down, Right] : [Down, Right, Right, Down];
}
function determineStartAndEndDir(edge, graphDirection) {
  if (edge.from === edge.to) return selfReferenceDirection(graphDirection);
  let d = determineDirection(edge.from.gridCoord, edge.to.gridCoord), preferredDir, preferredOppositeDir, alternativeDir, alternativeOppositeDir, isBackwards = graphDirection === "LR" ? dirEquals(d, Left) || dirEquals(d, UpperLeft) || dirEquals(d, LowerLeft) : dirEquals(d, Up) || dirEquals(d, UpperLeft) || dirEquals(d, UpperRight);
  return dirEquals(d, LowerRight) ? graphDirection === "LR" ? (preferredDir = Down, preferredOppositeDir = Left, alternativeDir = Right, alternativeOppositeDir = Up) : (preferredDir = Right, preferredOppositeDir = Up, alternativeDir = Down, alternativeOppositeDir = Left) : dirEquals(d, UpperRight) ? graphDirection === "LR" ? (preferredDir = Up, preferredOppositeDir = Left, alternativeDir = Right, alternativeOppositeDir = Down) : (preferredDir = Right, preferredOppositeDir = Down, alternativeDir = Up, alternativeOppositeDir = Left) : dirEquals(d, LowerLeft) ? graphDirection === "LR" ? (preferredDir = Down, preferredOppositeDir = Down, alternativeDir = Left, alternativeOppositeDir = Up) : (preferredDir = Left, preferredOppositeDir = Up, alternativeDir = Down, alternativeOppositeDir = Right) : dirEquals(d, UpperLeft) ? graphDirection === "LR" ? (preferredDir = Down, preferredOppositeDir = Down, alternativeDir = Left, alternativeOppositeDir = Down) : (preferredDir = Right, preferredOppositeDir = Right, alternativeDir = Up, alternativeOppositeDir = Right) : isBackwards ? graphDirection === "LR" && dirEquals(d, Left) ? (preferredDir = Down, preferredOppositeDir = Down, alternativeDir = Left, alternativeOppositeDir = Right) : graphDirection === "TD" && dirEquals(d, Up) ? (preferredDir = Right, preferredOppositeDir = Right, alternativeDir = Up, alternativeOppositeDir = Down) : (preferredDir = d, preferredOppositeDir = getOpposite(d), alternativeDir = d, alternativeOppositeDir = getOpposite(d)) : (preferredDir = d, preferredOppositeDir = getOpposite(d), alternativeDir = d, alternativeOppositeDir = getOpposite(d)), [preferredDir, preferredOppositeDir, alternativeDir, alternativeOppositeDir];
}
function determinePath(graph, edge) {
  let sourceSg = getNodeSubgraph(graph, edge.from), targetSg = getNodeSubgraph(graph, edge.to), effectiveDir = sourceSg && sourceSg === targetSg && sourceSg.direction ? sourceSg.direction : graph.config.graphDirection, [preferredDir, preferredOppositeDir, alternativeDir, alternativeOppositeDir] = determineStartAndEndDir(edge, effectiveDir), prefFrom = gridCoordDirection(edge.from.gridCoord, preferredDir), prefTo = gridCoordDirection(edge.to.gridCoord, preferredOppositeDir), preferredPath = getPath(graph.grid, prefFrom, prefTo), altFrom = gridCoordDirection(edge.from.gridCoord, alternativeDir), altTo = gridCoordDirection(edge.to.gridCoord, alternativeOppositeDir), alternativePath = getPath(graph.grid, altFrom, altTo);
  if (preferredPath !== null && alternativePath !== null) {
    preferredPath = mergePath(preferredPath), alternativePath = mergePath(alternativePath), preferredPath.length <= alternativePath.length ? (edge.startDir = preferredDir, edge.endDir = preferredOppositeDir, edge.path = preferredPath) : (edge.startDir = alternativeDir, edge.endDir = alternativeOppositeDir, edge.path = alternativePath);
    return;
  }
  if (preferredPath !== null) {
    edge.startDir = preferredDir, edge.endDir = preferredOppositeDir, edge.path = mergePath(preferredPath);
    return;
  }
  if (alternativePath !== null) {
    edge.startDir = alternativeDir, edge.endDir = alternativeOppositeDir, edge.path = mergePath(alternativePath);
    return;
  }
  edge.startDir = preferredDir, edge.endDir = preferredOppositeDir, edge.path = [prefFrom, prefTo];
}
function determineLabelLine(graph, edge) {
  if (edge.text.length === 0) return;
  let lenLabel = edge.text.length, pathLen = edge.path.length, isVerticalFlow = graph.config.graphDirection === "TD", segments = [];
  for (let i = 1; i < pathLen; i++) {
    let p1 = edge.path[i - 1], p2 = edge.path[i], line = [p1, p2], width2 = calculateLineWidth(graph, line), isVertical = p1.x === p2.x;
    segments.push({ line, width: width2, index: i, isVertical });
  }
  let suitableSegments = segments.filter((s) => s.width >= lenLabel && s.index > 1), largestLine;
  if (suitableSegments.length > 0) suitableSegments.sort((a, b) => b.index - a.index), largestLine = suitableSegments[0].line;
  else {
    let fallbackSegments = segments.filter((s) => s.width >= lenLabel);
    fallbackSegments.length > 0 ? (fallbackSegments.sort((a, b) => b.index - a.index), largestLine = fallbackSegments[0].line) : (segments.sort((a, b) => b.width - a.width), largestLine = segments[0]?.line ?? [edge.path[0], edge.path[1]]);
  }
  let minX = Math.min(largestLine[0].x, largestLine[1].x), maxX = Math.max(largestLine[0].x, largestLine[1].x), middleX = minX + Math.floor((maxX - minX) / 2), current = graph.columnWidth.get(middleX) ?? 0;
  graph.columnWidth.set(middleX, Math.max(current, lenLabel + 2)), edge.labelLine = [largestLine[0], largestLine[1]];
}
function calculateLineWidth(graph, line) {
  let total = 0, startX = Math.min(line[0].x, line[1].x), endX = Math.max(line[0].x, line[1].x);
  for (let x = startX; x <= endX; x++) total += graph.columnWidth.get(x) ?? 0;
  return total;
}
function analyzeEdgeBundles(graph) {
  if (graph.config.graphDirection !== "TD") return [];
  let bundles = [], bundledEdges = /* @__PURE__ */ new Set(), edgesByTarget = /* @__PURE__ */ new Map();
  for (let edge of graph.edges) {
    if (edge.from === edge.to) continue;
    let existing = edgesByTarget.get(edge.to) ?? [];
    existing.push(edge), edgesByTarget.set(edge.to, existing);
  }
  for (let [target, edges] of edgesByTarget) {
    if (edges.length < 2 || !canBundle(edges, graph) || edges.some((e) => bundledEdges.has(e))) continue;
    let bundle = { type: "fan-in", edges: [...edges], sharedNode: target, otherNodes: edges.map((e) => e.from), junctionPoint: null, sharedPath: [], junctionDir: Middle, sharedNodeDir: Middle };
    for (let edge of edges) edge.bundle = bundle, bundledEdges.add(edge);
    bundles.push(bundle);
  }
  let edgesBySource = /* @__PURE__ */ new Map();
  for (let edge of graph.edges) {
    if (edge.from === edge.to || bundledEdges.has(edge)) continue;
    let existing = edgesBySource.get(edge.from) ?? [];
    existing.push(edge), edgesBySource.set(edge.from, existing);
  }
  for (let [source2, edges] of edgesBySource) {
    if (edges.length < 2 || !canBundle(edges, graph)) continue;
    let bundle = { type: "fan-out", edges: [...edges], sharedNode: source2, otherNodes: edges.map((e) => e.to), junctionPoint: null, sharedPath: [], junctionDir: Middle, sharedNodeDir: Middle };
    for (let edge of edges) edge.bundle = bundle, bundledEdges.add(edge);
    bundles.push(bundle);
  }
  return bundles;
}
function canBundle(edges, graph) {
  if (edges.length < 2) return false;
  let firstStyle = edges[0].style, firstFromSg = getNodeSubgraph(graph, edges[0].from), firstToSg = getNodeSubgraph(graph, edges[0].to);
  for (let edge of edges) {
    if (edge.style !== firstStyle || edge.text.length > 0) return false;
    let fromSg = getNodeSubgraph(graph, edge.from), toSg = getNodeSubgraph(graph, edge.to);
    if (fromSg !== firstFromSg || toSg !== firstToSg || fromSg !== toSg) return false;
  }
  return true;
}
function calculateJunctionPoint(graph, bundle) {
  let dir = graph.config.graphDirection, sharedCoord = bundle.sharedNode.gridCoord, otherCoords = bundle.otherNodes.map((n) => n.gridCoord);
  if (bundle.type === "fan-in") {
    let minX = Math.min(...otherCoords.map((c) => c.x)), maxX = Math.max(...otherCoords.map((c) => c.x)), minY = Math.min(...otherCoords.map((c) => c.y)), maxY = Math.max(...otherCoords.map((c) => c.y));
    if (dir === "TD") {
      let junctionY = sharedCoord.y - 1, centerX = Math.floor((minX + maxX) / 2) + 1;
      return { x: sharedCoord.x + 1, y: junctionY };
    } else {
      let junctionX = sharedCoord.x - 1, junctionY = sharedCoord.y + 1;
      return { x: junctionX, y: junctionY };
    }
  } else {
    let minX = Math.min(...otherCoords.map((c) => c.x)), maxX = Math.max(...otherCoords.map((c) => c.x)), minY = Math.min(...otherCoords.map((c) => c.y)), maxY = Math.max(...otherCoords.map((c) => c.y));
    if (dir === "TD") {
      let junctionY = sharedCoord.y + 3;
      return { x: sharedCoord.x + 1, y: junctionY };
    } else {
      let junctionX = sharedCoord.x + 3, junctionY = sharedCoord.y + 1;
      return { x: junctionX, y: junctionY };
    }
  }
}
function routeBundledEdges(graph, bundle) {
  let dir = graph.config.graphDirection;
  bundle.junctionPoint = calculateJunctionPoint(graph, bundle);
  let junction = bundle.junctionPoint;
  if (bundle.type === "fan-in") {
    bundle.junctionDir = dir === "TD" ? Up : Left, bundle.sharedNodeDir = dir === "TD" ? Down : Right;
    let targetCoord = bundle.sharedNode.gridCoord, targetEntry = dir === "TD" ? { x: targetCoord.x + 1, y: targetCoord.y } : { x: targetCoord.x, y: targetCoord.y + 1 }, sharedPath = getPath(graph.grid, junction, targetEntry);
    bundle.sharedPath = sharedPath ? mergePath(sharedPath) : [junction, targetEntry];
    for (let edge of bundle.edges) {
      let sourceCoord = edge.from.gridCoord, sourceExit = dir === "TD" ? { x: sourceCoord.x + 1, y: sourceCoord.y + 2 } : { x: sourceCoord.x + 2, y: sourceCoord.y + 1 }, pathToJunction = getPath(graph.grid, sourceExit, junction);
      edge.pathToJunction = pathToJunction ? mergePath(pathToJunction) : [sourceExit, junction], edge.startDir = dir === "TD" ? Down : Right, edge.endDir = dir === "TD" ? Up : Left, edge.path = [...edge.pathToJunction, ...bundle.sharedPath.slice(1)];
    }
  } else {
    bundle.junctionDir = dir === "TD" ? Down : Right, bundle.sharedNodeDir = dir === "TD" ? Up : Left;
    let sourceCoord = bundle.sharedNode.gridCoord, sourceExit = dir === "TD" ? { x: sourceCoord.x + 1, y: sourceCoord.y + 2 } : { x: sourceCoord.x + 2, y: sourceCoord.y + 1 }, sharedPath = getPath(graph.grid, sourceExit, junction);
    bundle.sharedPath = sharedPath ? mergePath(sharedPath) : [sourceExit, junction];
    for (let edge of bundle.edges) {
      let targetCoord = edge.to.gridCoord, targetEntry = dir === "TD" ? { x: targetCoord.x + 1, y: targetCoord.y } : { x: targetCoord.x, y: targetCoord.y + 1 }, pathToJunction = getPath(graph.grid, junction, targetEntry);
      edge.pathToJunction = pathToJunction ? mergePath(pathToJunction) : [junction, targetEntry], edge.startDir = dir === "TD" ? Down : Right, edge.endDir = dir === "TD" ? Up : Left, edge.path = [...bundle.sharedPath, ...edge.pathToJunction.slice(1)];
    }
  }
}
function processBundles(graph) {
  for (let bundle of graph.bundles) routeBundledEdges(graph, bundle);
}
function splitLines(label) {
  return label.split(`
`);
}
function maxLineWidth(label) {
  let lines2 = splitLines(label);
  return Math.max(...lines2.map((l) => l.length), 0);
}
function lineCount(label) {
  return splitLines(label).length;
}
var SHAPE_CORNERS = { rectangle: { unicode: { tl: "\u250C", tr: "\u2510", bl: "\u2514", br: "\u2518" }, ascii: { tl: "+", tr: "+", bl: "+", br: "+" } }, rounded: { unicode: { tl: "\u256D", tr: "\u256E", bl: "\u2570", br: "\u256F" }, ascii: { tl: ".", tr: ".", bl: "'", br: "'" } }, circle: { unicode: { tl: "\u25EF", tr: "\u25EF", bl: "\u25EF", br: "\u25EF" }, ascii: { tl: "o", tr: "o", bl: "o", br: "o" } }, doublecircle: { unicode: { tl: "\u25CE", tr: "\u25CE", bl: "\u25CE", br: "\u25CE" }, ascii: { tl: "@", tr: "@", bl: "@", br: "@" } }, diamond: { unicode: { tl: "\u25C7", tr: "\u25C7", bl: "\u25C7", br: "\u25C7" }, ascii: { tl: "<", tr: ">", bl: "<", br: ">" } }, hexagon: { unicode: { tl: "\u231C", tr: "\u231D", bl: "\u231E", br: "\u231F" }, ascii: { tl: "*", tr: "*", bl: "*", br: "*" } }, stadium: { unicode: { tl: "(", tr: ")", bl: "(", br: ")" }, ascii: { tl: "(", tr: ")", bl: "(", br: ")" } }, subroutine: { unicode: { tl: "\u255F", tr: "\u2562", bl: "\u255F", br: "\u2562" }, ascii: { tl: "|", tr: "|", bl: "|", br: "|" } }, cylinder: { unicode: { tl: "\u256D", tr: "\u256E", bl: "\u2570", br: "\u256F" }, ascii: { tl: ".", tr: ".", bl: "'", br: "'" } }, asymmetric: { unicode: { tl: "\u25B7", tr: "\u2510", bl: "\u25B7", br: "\u2518" }, ascii: { tl: ">", tr: "+", bl: ">", br: "+" } }, trapezoid: { unicode: { tl: "/", tr: "\\", bl: "\u2514", br: "\u2518" }, ascii: { tl: "/", tr: "\\", bl: "+", br: "+" } }, "trapezoid-alt": { unicode: { tl: "\u250C", tr: "\u2510", bl: "\\", br: "/" }, ascii: { tl: "+", tr: "+", bl: "\\", br: "/" } }, "state-start": { unicode: { tl: "\u25CF", tr: "\u25CF", bl: "\u25CF", br: "\u25CF" }, ascii: { tl: "*", tr: "*", bl: "*", br: "*" } }, "state-end": { unicode: { tl: "\u25C9", tr: "\u25C9", bl: "\u25C9", br: "\u25C9" }, ascii: { tl: "@", tr: "@", bl: "@", br: "@" } } };
function getCorners(shape, useAscii) {
  let corners = SHAPE_CORNERS[shape] ?? SHAPE_CORNERS.rectangle;
  return useAscii ? corners.ascii : corners.unicode;
}
function getBoxDimensions(label, options) {
  let lines2 = splitLines(label), maxLineWidth2 = Math.max(...lines2.map((l) => l.length), 0), lineCount2 = lines2.length, innerWidth = 2 * options.padding + maxLineWidth2, width2 = innerWidth + 2, rawInnerHeight = lineCount2 + 2 * options.padding, innerHeight = rawInnerHeight % 2 === 0 ? rawInnerHeight + 1 : rawInnerHeight, height = innerHeight + 2;
  return { width: width2, height, labelArea: { x: 1 + options.padding, y: 1 + options.padding, width: maxLineWidth2, height: lineCount2 }, gridColumns: [1, innerWidth, 1], gridRows: [1, innerHeight, 1] };
}
function renderBox(label, dimensions, corners, useAscii) {
  let { width: width2, height } = dimensions, canvas = mkCanvas(width2 - 1, height - 1), from = { x: 0, y: 0 }, to = { x: width2 - 1, y: height - 1 }, hLine = useAscii ? "-" : "\u2500", vLine = useAscii ? "|" : "\u2502";
  for (let x = from.x + 1; x < to.x; x++) canvas[x][from.y] = hLine, canvas[x][to.y] = hLine;
  for (let y = from.y + 1; y < to.y; y++) canvas[from.x][y] = vLine, canvas[to.x][y] = vLine;
  canvas[from.x][from.y] = corners.tl, canvas[to.x][from.y] = corners.tr, canvas[from.x][to.y] = corners.bl, canvas[to.x][to.y] = corners.br;
  let lines2 = splitLines(label), w = width2 - 1, h2 = height - 1, startY = Math.floor(h2 / 2) - Math.floor((lines2.length - 1) / 2);
  for (let i = 0; i < lines2.length; i++) {
    let line = lines2[i], textX = Math.floor(w / 2) - Math.ceil(line.length / 2) + 1;
    for (let j = 0; j < line.length; j++) {
      let x = textX + j, y = startY + i;
      x >= 0 && x < canvas.length && y >= 0 && y < canvas[0].length && (canvas[x][y] = line[j]);
    }
  }
  return canvas;
}
function getBoxAttachmentPoint(dir, dimensions, baseCoord) {
  let { width: width2, height } = dimensions, centerX = baseCoord.x + Math.floor(width2 / 2), centerY = baseCoord.y + Math.floor(height / 2);
  return dirEquals(dir, Up) ? { x: centerX, y: baseCoord.y } : dirEquals(dir, Down) ? { x: centerX, y: baseCoord.y + height - 1 } : dirEquals(dir, Left) ? { x: baseCoord.x, y: centerY } : dirEquals(dir, Right) ? { x: baseCoord.x + width2 - 1, y: centerY } : dirEquals(dir, UpperLeft) ? { x: baseCoord.x, y: baseCoord.y } : dirEquals(dir, UpperRight) ? { x: baseCoord.x + width2 - 1, y: baseCoord.y } : dirEquals(dir, LowerLeft) ? { x: baseCoord.x, y: baseCoord.y + height - 1 } : dirEquals(dir, LowerRight) ? { x: baseCoord.x + width2 - 1, y: baseCoord.y + height - 1 } : { x: centerX, y: centerY };
}
var rectangleRenderer = { getDimensions: getBoxDimensions, render(label, dimensions, options) {
  let corners = getCorners("rectangle", options.useAscii);
  return renderBox(label, dimensions, corners, options.useAscii);
}, getAttachmentPoint: getBoxAttachmentPoint };
var diamondRenderer = { getDimensions: getBoxDimensions, render(label, dimensions, options) {
  let corners = getCorners("diamond", options.useAscii);
  return renderBox(label, dimensions, corners, options.useAscii);
}, getAttachmentPoint: getBoxAttachmentPoint };
var circleRenderer = { getDimensions: getBoxDimensions, render(label, dimensions, options) {
  let corners = getCorners("circle", options.useAscii);
  return renderBox(label, dimensions, corners, options.useAscii);
}, getAttachmentPoint: getBoxAttachmentPoint };
var stateStartRenderer = { getDimensions(_label, _options) {
  return { width: 5, height: 3, labelArea: { x: 2, y: 1, width: 1, height: 1 }, gridColumns: [1, 3, 1], gridRows: [1, 1, 1] };
}, render(_label, dimensions, options) {
  let { width: width2, height } = dimensions, canvas = mkCanvas(width2 - 1, height - 1), centerX = Math.floor(width2 / 2);
  return options.useAscii ? (canvas[0][0] = ".", canvas[1][0] = "-", canvas[2][0] = "-", canvas[3][0] = "-", canvas[4][0] = ".", canvas[0][1] = "|", canvas[centerX][1] = "*", canvas[4][1] = "|", canvas[0][2] = "'", canvas[1][2] = "-", canvas[2][2] = "-", canvas[3][2] = "-", canvas[4][2] = "'") : (canvas[0][0] = "\u256D", canvas[1][0] = "\u2500", canvas[2][0] = "\u2500", canvas[3][0] = "\u2500", canvas[4][0] = "\u256E", canvas[0][1] = "\u2502", canvas[centerX][1] = "\u25CF", canvas[4][1] = "\u2502", canvas[0][2] = "\u2570", canvas[1][2] = "\u2500", canvas[2][2] = "\u2500", canvas[3][2] = "\u2500", canvas[4][2] = "\u256F"), canvas;
}, getAttachmentPoint(dir, dimensions, baseCoord) {
  let { width: width2, height } = dimensions, centerX = baseCoord.x + Math.floor(width2 / 2), centerY = baseCoord.y + Math.floor(height / 2);
  return dirEquals(dir, Up) ? { x: centerX, y: baseCoord.y } : dirEquals(dir, Down) ? { x: centerX, y: baseCoord.y + height - 1 } : dirEquals(dir, Left) ? { x: baseCoord.x, y: centerY } : dirEquals(dir, Right) ? { x: baseCoord.x + width2 - 1, y: centerY } : { x: centerX, y: centerY };
} };
var stateEndRenderer = { getDimensions(_label, _options) {
  return { width: 5, height: 3, labelArea: { x: 2, y: 1, width: 1, height: 1 }, gridColumns: [1, 3, 1], gridRows: [1, 1, 1] };
}, render(_label, dimensions, options) {
  let { width: width2, height } = dimensions, canvas = mkCanvas(width2 - 1, height - 1), centerX = Math.floor(width2 / 2);
  return options.useAscii ? (canvas[0][0] = "#", canvas[1][0] = "=", canvas[2][0] = "=", canvas[3][0] = "=", canvas[4][0] = "#", canvas[0][1] = "#", canvas[centerX][1] = "*", canvas[4][1] = "#", canvas[0][2] = "#", canvas[1][2] = "=", canvas[2][2] = "=", canvas[3][2] = "=", canvas[4][2] = "#") : (canvas[0][0] = "\u2554", canvas[1][0] = "\u2550", canvas[2][0] = "\u2550", canvas[3][0] = "\u2550", canvas[4][0] = "\u2557", canvas[0][1] = "\u2551", canvas[centerX][1] = "\u25CE", canvas[4][1] = "\u2551", canvas[0][2] = "\u255A", canvas[1][2] = "\u2550", canvas[2][2] = "\u2550", canvas[3][2] = "\u2550", canvas[4][2] = "\u255D"), canvas;
}, getAttachmentPoint(dir, dimensions, baseCoord) {
  let { width: width2, height } = dimensions, centerX = baseCoord.x + Math.floor(width2 / 2), centerY = baseCoord.y + Math.floor(height / 2);
  return dirEquals(dir, Up) ? { x: centerX, y: baseCoord.y } : dirEquals(dir, Down) ? { x: centerX, y: baseCoord.y + height - 1 } : dirEquals(dir, Left) ? { x: baseCoord.x, y: centerY } : dirEquals(dir, Right) ? { x: baseCoord.x + width2 - 1, y: centerY } : { x: centerX, y: centerY };
} };
var roundedRenderer = { getDimensions: getBoxDimensions, render(label, dimensions, options) {
  let corners = getCorners("rounded", options.useAscii);
  return renderBox(label, dimensions, corners, options.useAscii);
}, getAttachmentPoint: getBoxAttachmentPoint };
var stadiumRenderer = { getDimensions(label, options) {
  let lines2 = splitLines(label), maxLineWidth2 = Math.max(...lines2.map((l) => l.length), 0), lineCount2 = lines2.length, innerWidth = 2 * options.padding + maxLineWidth2, width2 = innerWidth + 4, innerHeight = lineCount2 + 2 * options.padding, height = Math.max(innerHeight + 2, 3);
  return { width: width2, height, labelArea: { x: 2 + options.padding, y: 1 + options.padding, width: maxLineWidth2, height: lineCount2 }, gridColumns: [2, innerWidth, 2], gridRows: [1, innerHeight, 1] };
}, render(label, dimensions, options) {
  let { width: width2, height } = dimensions, canvas = mkCanvas(width2 - 1, height - 1), centerY = Math.floor(height / 2), hChar = options.useAscii ? "-" : "\u2500";
  if (height === 3) canvas[0][centerY] = "(", canvas[width2 - 1][centerY] = ")";
  else if (options.useAscii) {
    for (let y = 0; y < height; y++) canvas[0][y] = "(", canvas[width2 - 1][y] = ")";
    for (let x = 1; x < width2 - 1; x++) canvas[x][0] = hChar, canvas[x][height - 1] = hChar;
  } else {
    canvas[0][0] = "\u256D";
    for (let x = 1; x < width2 - 1; x++) canvas[x][0] = hChar;
    canvas[width2 - 1][0] = "\u256E";
    for (let y = 1; y < height - 1; y++) canvas[0][y] = "\u2502", canvas[width2 - 1][y] = "\u2502";
    canvas[0][height - 1] = "\u2570";
    for (let x = 1; x < width2 - 1; x++) canvas[x][height - 1] = hChar;
    canvas[width2 - 1][height - 1] = "\u256F";
  }
  let lines2 = splitLines(label), startY = centerY - Math.floor((lines2.length - 1) / 2);
  for (let i = 0; i < lines2.length; i++) {
    let line = lines2[i], textX = Math.floor(width2 / 2) - Math.floor(line.length / 2);
    for (let j = 0; j < line.length; j++) {
      let x = textX + j, y = startY + i;
      x > 0 && x < width2 - 1 && y >= 0 && y < height && (canvas[x][y] = line[j]);
    }
  }
  return canvas;
}, getAttachmentPoint: getBoxAttachmentPoint };
var hexagonRenderer = { getDimensions: getBoxDimensions, render(label, dimensions, options) {
  let corners = getCorners("hexagon", options.useAscii);
  return renderBox(label, dimensions, corners, options.useAscii);
}, getAttachmentPoint: getBoxAttachmentPoint };
var subroutineRenderer = { getDimensions(label, options) {
  let lines2 = splitLines(label), maxLineWidth2 = Math.max(...lines2.map((l) => l.length), 0), lineCount2 = lines2.length, innerWidth = 2 * options.padding + maxLineWidth2, width2 = innerWidth + 4, innerHeight = lineCount2 + 2 * options.padding, height = innerHeight + 2;
  return { width: width2, height, labelArea: { x: 2 + options.padding, y: 1 + options.padding, width: maxLineWidth2, height: lineCount2 }, gridColumns: [2, innerWidth, 2], gridRows: [1, innerHeight, 1] };
}, render(label, dimensions, options) {
  let { width: width2, height } = dimensions, canvas = mkCanvas(width2 - 1, height - 1), hChar = options.useAscii ? "-" : "\u2500", vChar = options.useAscii ? "|" : "\u2502";
  canvas[0][0] = options.useAscii ? "+" : "\u250C", canvas[1][0] = options.useAscii ? "+" : "\u252C";
  for (let x = 2; x < width2 - 2; x++) canvas[x][0] = hChar;
  canvas[width2 - 2][0] = options.useAscii ? "+" : "\u252C", canvas[width2 - 1][0] = options.useAscii ? "+" : "\u2510";
  for (let y = 1; y < height - 1; y++) canvas[0][y] = vChar, canvas[1][y] = vChar, canvas[width2 - 2][y] = vChar, canvas[width2 - 1][y] = vChar;
  canvas[0][height - 1] = options.useAscii ? "+" : "\u2514", canvas[1][height - 1] = options.useAscii ? "+" : "\u2534";
  for (let x = 2; x < width2 - 2; x++) canvas[x][height - 1] = hChar;
  canvas[width2 - 2][height - 1] = options.useAscii ? "+" : "\u2534", canvas[width2 - 1][height - 1] = options.useAscii ? "+" : "\u2518";
  let lines2 = splitLines(label), startY = Math.floor(height / 2) - Math.floor((lines2.length - 1) / 2);
  for (let i = 0; i < lines2.length; i++) {
    let line = lines2[i], textX = Math.floor(width2 / 2) - Math.floor(line.length / 2);
    for (let j = 0; j < line.length; j++) {
      let x = textX + j, y = startY + i;
      x > 1 && x < width2 - 2 && y > 0 && y < height - 1 && (canvas[x][y] = line[j]);
    }
  }
  return canvas;
}, getAttachmentPoint: getBoxAttachmentPoint };
var doublecircleRenderer = { getDimensions: getBoxDimensions, render(label, dimensions, options) {
  let corners = getCorners("doublecircle", options.useAscii);
  return renderBox(label, dimensions, corners, options.useAscii);
}, getAttachmentPoint: getBoxAttachmentPoint };
var cylinderRenderer = { getDimensions(label, options) {
  let lines2 = splitLines(label), maxLineWidth2 = Math.max(...lines2.map((l) => l.length), 0), lineCount2 = lines2.length, innerWidth = 2 * options.padding + maxLineWidth2, width2 = innerWidth + 2, innerHeight = lineCount2 + 2 * options.padding + 2, height = innerHeight + 2;
  return { width: width2, height, labelArea: { x: 1 + options.padding, y: 2 + options.padding, width: maxLineWidth2, height: lineCount2 }, gridColumns: [1, innerWidth, 1], gridRows: [2, innerHeight - 2, 2] };
}, render(label, dimensions, options) {
  let { width: width2, height } = dimensions, canvas = mkCanvas(width2 - 1, height - 1), hChar = options.useAscii ? "-" : "\u2500", vChar = options.useAscii ? "|" : "\u2502";
  canvas[0][0] = options.useAscii ? "." : "\u256D";
  for (let x = 1; x < width2 - 1; x++) canvas[x][0] = hChar;
  canvas[width2 - 1][0] = options.useAscii ? "." : "\u256E", canvas[0][1] = vChar;
  for (let x = 1; x < width2 - 1; x++) canvas[x][1] = hChar;
  canvas[width2 - 1][1] = vChar;
  for (let y = 2; y < height - 2; y++) canvas[0][y] = vChar, canvas[width2 - 1][y] = vChar;
  canvas[0][height - 2] = vChar;
  for (let x = 1; x < width2 - 1; x++) canvas[x][height - 2] = hChar;
  canvas[width2 - 1][height - 2] = vChar, canvas[0][height - 1] = options.useAscii ? "'" : "\u2570";
  for (let x = 1; x < width2 - 1; x++) canvas[x][height - 1] = hChar;
  canvas[width2 - 1][height - 1] = options.useAscii ? "'" : "\u256F";
  let lines2 = splitLines(label), startY = Math.floor(height / 2) - Math.floor((lines2.length - 1) / 2);
  for (let i = 0; i < lines2.length; i++) {
    let line = lines2[i], textX = Math.floor(width2 / 2) - Math.floor(line.length / 2);
    for (let j = 0; j < line.length; j++) {
      let x = textX + j, y = startY + i;
      x > 0 && x < width2 - 1 && y > 1 && y < height - 2 && (canvas[x][y] = line[j]);
    }
  }
  return canvas;
}, getAttachmentPoint: getBoxAttachmentPoint };
var asymmetricRenderer = { getDimensions: getBoxDimensions, render(label, dimensions, options) {
  let corners = getCorners("asymmetric", options.useAscii);
  return renderBox(label, dimensions, corners, options.useAscii);
}, getAttachmentPoint: getBoxAttachmentPoint };
var trapezoidRenderer = { getDimensions: getBoxDimensions, render(label, dimensions, options) {
  let corners = getCorners("trapezoid", options.useAscii);
  return renderBox(label, dimensions, corners, options.useAscii);
}, getAttachmentPoint: getBoxAttachmentPoint };
var trapezoidAltRenderer = { getDimensions: getBoxDimensions, render(label, dimensions, options) {
  let corners = getCorners("trapezoid-alt", options.useAscii);
  return renderBox(label, dimensions, corners, options.useAscii);
}, getAttachmentPoint: getBoxAttachmentPoint };
var shapeRegistry = /* @__PURE__ */ new Map([["rectangle", rectangleRenderer], ["rounded", roundedRenderer], ["diamond", diamondRenderer], ["stadium", stadiumRenderer], ["circle", circleRenderer], ["subroutine", subroutineRenderer], ["doublecircle", doublecircleRenderer], ["hexagon", hexagonRenderer], ["cylinder", cylinderRenderer], ["asymmetric", asymmetricRenderer], ["trapezoid", trapezoidRenderer], ["trapezoid-alt", trapezoidAltRenderer], ["state-start", stateStartRenderer], ["state-end", stateEndRenderer]]);
function getShapeRenderer(shape) {
  return shapeRegistry.get(shape) ?? rectangleRenderer;
}
function getShapeDimensions(shape, label, options) {
  return getShapeRenderer(shape).getDimensions(label, options);
}
function getShapeAttachmentPoint(shape, dir, dimensions, baseCoord) {
  return getShapeRenderer(shape).getAttachmentPoint(dir, dimensions, baseCoord);
}
function drawNode(node, graph) {
  return drawBoxWithGridDimensions(node, graph);
}
function drawBoxWithGridDimensions(node, graph) {
  let gc = node.gridCoord, useAscii = graph.config.useAscii, w = 0;
  for (let i = 0; i < 2; i++) w += graph.columnWidth.get(gc.x + i) ?? 0;
  let h2 = 0;
  for (let i = 0; i < 2; i++) h2 += graph.rowHeight.get(gc.y + i) ?? 0;
  let from = { x: 0, y: 0 }, to = { x: w, y: h2 }, box = mkCanvas(Math.max(from.x, to.x), Math.max(from.y, to.y)), corners = getCorners(node.shape, useAscii), isDoubleBox = node.shape === "state-end", hChar = useAscii ? isDoubleBox ? "=" : "-" : isDoubleBox ? "\u2550" : "\u2500", vChar = useAscii ? isDoubleBox ? "\u2016" : "|" : isDoubleBox ? "\u2551" : "\u2502", effectiveCorners = isDoubleBox ? useAscii ? { tl: "#", tr: "#", bl: "#", br: "#" } : { tl: "\u2554", tr: "\u2557", bl: "\u255A", br: "\u255D" } : corners;
  for (let x = from.x + 1; x < to.x; x++) box[x][from.y] = hChar;
  for (let x = from.x + 1; x < to.x; x++) box[x][to.y] = hChar;
  for (let y = from.y + 1; y < to.y; y++) box[from.x][y] = vChar;
  for (let y = from.y + 1; y < to.y; y++) box[to.x][y] = vChar;
  box[from.x][from.y] = effectiveCorners.tl, box[to.x][from.y] = effectiveCorners.tr, box[from.x][to.y] = effectiveCorners.bl, box[to.x][to.y] = effectiveCorners.br;
  let label = node.displayLabel, lines2 = splitLines(label), startY = from.y + Math.floor(h2 / 2) - Math.floor((lines2.length - 1) / 2);
  for (let i = 0; i < lines2.length; i++) {
    let line = lines2[i], textX = from.x + Math.floor(w / 2) - Math.ceil(line.length / 2) + 1;
    for (let j = 0; j < line.length; j++) textX + j >= 0 && textX + j < box.length && startY + i >= 0 && startY + i < box[0].length && (box[textX + j][startY + i] = line[j]);
  }
  return box;
}
function drawBox(node, graph) {
  return drawNode(node, graph);
}
function drawMultiBox(sections, useAscii, padding = 1) {
  let maxTextWidth = 0;
  for (let section of sections) for (let line of section) maxTextWidth = Math.max(maxTextWidth, line.length);
  let boxWidth = maxTextWidth + 2 * padding + 2, totalLines = 0;
  for (let section of sections) totalLines += Math.max(section.length, 1);
  let numDividers = sections.length - 1, boxHeight = totalLines + numDividers + 2, hLine = useAscii ? "-" : "\u2500", vLine = useAscii ? "|" : "\u2502", tl = useAscii ? "+" : "\u250C", tr = useAscii ? "+" : "\u2510", bl = useAscii ? "+" : "\u2514", br = useAscii ? "+" : "\u2518", divL = useAscii ? "+" : "\u251C", divR = useAscii ? "+" : "\u2524", canvas = mkCanvas(boxWidth - 1, boxHeight - 1);
  canvas[0][0] = tl;
  for (let x = 1; x < boxWidth - 1; x++) canvas[x][0] = hLine;
  canvas[boxWidth - 1][0] = tr, canvas[0][boxHeight - 1] = bl;
  for (let x = 1; x < boxWidth - 1; x++) canvas[x][boxHeight - 1] = hLine;
  canvas[boxWidth - 1][boxHeight - 1] = br;
  for (let y = 1; y < boxHeight - 1; y++) canvas[0][y] = vLine, canvas[boxWidth - 1][y] = vLine;
  let row = 1;
  for (let s = 0; s < sections.length; s++) {
    let section = sections[s], lines2 = section.length > 0 ? section : [""];
    for (let line of lines2) {
      let startX = 1 + padding;
      for (let i = 0; i < line.length; i++) canvas[startX + i][row] = line[i];
      row++;
    }
    if (s < sections.length - 1) {
      canvas[0][row] = divL;
      for (let x = 1; x < boxWidth - 1; x++) canvas[x][row] = hLine;
      canvas[boxWidth - 1][row] = divR, row++;
    }
  }
  return canvas;
}
var LINE_CHARS = { solid: { h: { unicode: "\u2500", ascii: "-" }, v: { unicode: "\u2502", ascii: "|" } }, dotted: { h: { unicode: "\u2504", ascii: "." }, v: { unicode: "\u2506", ascii: ":" } }, thick: { h: { unicode: "\u2501", ascii: "=" }, v: { unicode: "\u2503", ascii: "\u2016" } } };
function drawLine(canvas, from, to, offsetFrom, offsetTo, useAscii, style2 = "solid") {
  let dir = determineDirection(from, to), drawnCoords = [], chars = LINE_CHARS[style2], hChar = useAscii ? chars.h.ascii : chars.h.unicode, vChar = useAscii ? chars.v.ascii : chars.v.unicode;
  if (dirEquals(dir, Up)) for (let y = from.y - offsetFrom; y >= to.y - offsetTo; y--) drawnCoords.push({ x: from.x, y }), canvas[from.x][y] = vChar;
  else if (dirEquals(dir, Down)) for (let y = from.y + offsetFrom; y <= to.y + offsetTo; y++) drawnCoords.push({ x: from.x, y }), canvas[from.x][y] = vChar;
  else if (dirEquals(dir, Left)) for (let x = from.x - offsetFrom; x >= to.x - offsetTo; x--) drawnCoords.push({ x, y: from.y }), canvas[x][from.y] = hChar;
  else if (dirEquals(dir, Right)) for (let x = from.x + offsetFrom; x <= to.x + offsetTo; x++) drawnCoords.push({ x, y: from.y }), canvas[x][from.y] = hChar;
  else if (dirEquals(dir, UpperLeft)) {
    for (let x = from.x - offsetFrom; x >= to.x; x--) drawnCoords.push({ x, y: from.y }), canvas[x][from.y] = hChar;
    for (let y = from.y - 1; y >= to.y - offsetTo; y--) drawnCoords.push({ x: to.x, y }), canvas[to.x][y] = vChar;
  } else if (dirEquals(dir, UpperRight)) {
    for (let x = from.x + offsetFrom; x <= to.x; x++) drawnCoords.push({ x, y: from.y }), canvas[x][from.y] = hChar;
    for (let y = from.y - 1; y >= to.y - offsetTo; y--) drawnCoords.push({ x: to.x, y }), canvas[to.x][y] = vChar;
  } else if (dirEquals(dir, LowerLeft)) {
    for (let x = from.x - offsetFrom; x >= to.x; x--) drawnCoords.push({ x, y: from.y }), canvas[x][from.y] = hChar;
    for (let y = from.y + 1; y <= to.y + offsetTo; y++) drawnCoords.push({ x: to.x, y }), canvas[to.x][y] = vChar;
  } else if (dirEquals(dir, LowerRight)) if (to.x - from.x <= 1) for (let y = from.y + offsetFrom; y <= to.y + offsetTo; y++) drawnCoords.push({ x: from.x, y }), canvas[from.x][y] = vChar;
  else {
    for (let x = from.x + offsetFrom; x <= to.x; x++) drawnCoords.push({ x, y: from.y }), canvas[x][from.y] = hChar;
    for (let y = from.y + 1; y <= to.y + offsetTo; y++) drawnCoords.push({ x: to.x, y }), canvas[to.x][y] = vChar;
  }
  return drawnCoords;
}
function drawArrow(graph, edge) {
  if (edge.path.length === 0) {
    let empty = copyCanvas(graph.canvas);
    return [empty, empty, empty, empty, empty, empty];
  }
  let labelCanvas = drawArrowLabel(graph, edge), [pathCanvas, linesDrawn, lineDirs] = drawPath(graph, edge.path, edge.style), boxStartCanvas = drawBoxStart(graph, edge.path, linesDrawn[0], edge.from.shape), arrowHeadEndCanvas;
  edge.hasArrowEnd ? arrowHeadEndCanvas = drawArrowHead(graph, linesDrawn[linesDrawn.length - 1], lineDirs[lineDirs.length - 1]) : arrowHeadEndCanvas = copyCanvas(graph.canvas);
  let arrowHeadStartCanvas;
  if (edge.hasArrowStart && linesDrawn.length > 0) {
    let firstPoint = linesDrawn[0][0], startDir = reverseDirection(lineDirs[0]), arrowPos = { x: firstPoint.x, y: firstPoint.y };
    dirEquals(lineDirs[0], Right) ? arrowPos.x = firstPoint.x - 1 : dirEquals(lineDirs[0], Left) ? arrowPos.x = firstPoint.x + 1 : dirEquals(lineDirs[0], Down) ? arrowPos.y = firstPoint.y - 1 : dirEquals(lineDirs[0], Up) && (arrowPos.y = firstPoint.y + 1), arrowHeadStartCanvas = drawArrowHead(graph, [firstPoint, arrowPos], startDir);
  } else arrowHeadStartCanvas = copyCanvas(graph.canvas);
  let cornersCanvas = drawCorners(graph, edge.path);
  return [pathCanvas, boxStartCanvas, arrowHeadEndCanvas, arrowHeadStartCanvas, cornersCanvas, labelCanvas];
}
function reverseDirection(dir) {
  return dirEquals(dir, Up) ? Down : dirEquals(dir, Down) ? Up : dirEquals(dir, Left) ? Right : dirEquals(dir, Right) ? Left : dirEquals(dir, UpperLeft) ? LowerRight : dirEquals(dir, UpperRight) ? LowerLeft : dirEquals(dir, LowerLeft) ? UpperRight : dirEquals(dir, LowerRight) ? UpperLeft : Middle;
}
function drawPath(graph, path, style2 = "solid") {
  let canvas = copyCanvas(graph.canvas), previousCoord = path[0], linesDrawn = [], lineDirs = [];
  for (let i = 1; i < path.length; i++) {
    let nextCoord = path[i], prevDC = gridToDrawingCoord(graph, previousCoord), nextDC = gridToDrawingCoord(graph, nextCoord);
    if (drawingCoordEquals(prevDC, nextDC)) {
      previousCoord = nextCoord;
      continue;
    }
    let dir = determineDirection(previousCoord, nextCoord), segment = drawLine(canvas, prevDC, nextDC, 1, -1, graph.config.useAscii, style2);
    segment.length === 0 && segment.push(prevDC), linesDrawn.push(segment), lineDirs.push(dir), previousCoord = nextCoord;
  }
  return [canvas, linesDrawn, lineDirs];
}
function drawBoxStart(graph, path, firstLine, sourceShape) {
  let canvas = copyCanvas(graph.canvas);
  if (graph.config.useAscii || sourceShape === "state-start" || sourceShape === "state-end") return canvas;
  let from = firstLine[0], dir = determineDirection(path[0], path[1]);
  return dirEquals(dir, Up) ? canvas[from.x][from.y + 1] = "\u2534" : dirEquals(dir, Down) ? canvas[from.x][from.y - 1] = "\u252C" : dirEquals(dir, Left) ? canvas[from.x + 1][from.y] = "\u2524" : dirEquals(dir, Right) && (canvas[from.x - 1][from.y] = "\u251C"), canvas;
}
function drawArrowHead(graph, lastLine, fallbackDir) {
  let canvas = copyCanvas(graph.canvas);
  if (lastLine.length === 0) return canvas;
  let from = lastLine[0], lastPos = lastLine[lastLine.length - 1], dir = determineDirection(from, lastPos);
  (lastLine.length === 1 || dirEquals(dir, Middle)) && (dir = fallbackDir);
  let char;
  return graph.config.useAscii ? dirEquals(dir, Up) ? char = "^" : dirEquals(dir, Down) ? char = "v" : dirEquals(dir, Left) ? char = "<" : dirEquals(dir, Right) ? char = ">" : dirEquals(fallbackDir, Up) ? char = "^" : dirEquals(fallbackDir, Down) ? char = "v" : dirEquals(fallbackDir, Left) ? char = "<" : dirEquals(fallbackDir, Right) ? char = ">" : char = "*" : dirEquals(dir, Up) ? char = "\u25B2" : dirEquals(dir, Down) ? char = "\u25BC" : dirEquals(dir, Left) ? char = "\u25C4" : dirEquals(dir, Right) ? char = "\u25BA" : dirEquals(dir, UpperRight) ? char = "\u25E5" : dirEquals(dir, UpperLeft) ? char = "\u25E4" : dirEquals(dir, LowerRight) ? char = "\u25E2" : dirEquals(dir, LowerLeft) ? char = "\u25E3" : dirEquals(fallbackDir, Up) ? char = "\u25B2" : dirEquals(fallbackDir, Down) ? char = "\u25BC" : dirEquals(fallbackDir, Left) ? char = "\u25C4" : dirEquals(fallbackDir, Right) ? char = "\u25BA" : dirEquals(fallbackDir, UpperRight) ? char = "\u25E5" : dirEquals(fallbackDir, UpperLeft) ? char = "\u25E4" : dirEquals(fallbackDir, LowerRight) ? char = "\u25E2" : dirEquals(fallbackDir, LowerLeft) ? char = "\u25E3" : char = "\u25CF", canvas[lastPos.x][lastPos.y] = char, canvas;
}
function drawCorners(graph, path) {
  let canvas = copyCanvas(graph.canvas);
  for (let idx = 1; idx < path.length - 1; idx++) {
    let coord = path[idx], dc = gridToDrawingCoord(graph, coord), prevDir = determineDirection(path[idx - 1], coord), nextDir = determineDirection(coord, path[idx + 1]), corner;
    graph.config.useAscii ? corner = "+" : dirEquals(prevDir, Right) && dirEquals(nextDir, Down) || dirEquals(prevDir, Up) && dirEquals(nextDir, Left) ? corner = "\u2510" : dirEquals(prevDir, Right) && dirEquals(nextDir, Up) || dirEquals(prevDir, Down) && dirEquals(nextDir, Left) ? corner = "\u2518" : dirEquals(prevDir, Left) && dirEquals(nextDir, Down) || dirEquals(prevDir, Up) && dirEquals(nextDir, Right) ? corner = "\u250C" : dirEquals(prevDir, Left) && dirEquals(nextDir, Up) || dirEquals(prevDir, Down) && dirEquals(nextDir, Right) ? corner = "\u2514" : corner = "+", canvas[dc.x][dc.y] = corner;
  }
  return canvas;
}
function drawArrowLabel(graph, edge) {
  let canvas = copyCanvas(graph.canvas);
  if (edge.text.length === 0) return canvas;
  let drawingLine = lineToDrawing(graph, edge.labelLine), isUpwardEdge;
  if (edge.path.length >= 2) {
    let startY = edge.path[0].y, endY = edge.path[edge.path.length - 1].y;
    endY < startY ? isUpwardEdge = true : endY > startY && (isUpwardEdge = false);
  }
  return drawTextOnLine(canvas, drawingLine, edge.text, isUpwardEdge), canvas;
}
function drawTextOnLine(canvas, line, label, isUpwardEdge) {
  if (line.length < 2) return;
  let minX = Math.min(line[0].x, line[1].x), maxX = Math.max(line[0].x, line[1].x), minY = Math.min(line[0].y, line[1].y), maxY = Math.max(line[0].y, line[1].y), middleX = minX + Math.floor((maxX - minX) / 2), middleY = minY + Math.floor((maxY - minY) / 2);
  if (isUpwardEdge !== void 0 && minX === maxX) {
    let segmentHeight = maxY - minY, offset = Math.max(1, Math.floor(segmentHeight / 4));
    isUpwardEdge ? middleY = middleY + offset : middleY = middleY - offset;
  }
  let lines2 = splitLines(label), startY = middleY - Math.floor((lines2.length - 1) / 2);
  for (let i = 0; i < lines2.length; i++) {
    let lineText = lines2[i], startX = middleX - Math.floor(lineText.length / 2);
    drawText(canvas, { x: startX, y: startY + i }, lineText);
  }
}
function getNodeAttachmentPoint(graph, node, dir) {
  let gc = node.gridCoord, w = 0;
  for (let i = 0; i < 2; i++) w += graph.columnWidth.get(gc.x + i) ?? 0;
  let h2 = 0;
  for (let i = 0; i < 2; i++) h2 += graph.rowHeight.get(gc.y + i) ?? 0;
  let gridDimensions = { width: w + 1, height: h2 + 1, labelArea: { x: 0, y: 0, width: 0, height: 0 }, gridColumns: [0, 0, 0], gridRows: [0, 0, 0] }, baseCoord = node.drawingCoord;
  return getShapeAttachmentPoint(node.shape, dir, gridDimensions, baseCoord);
}
function drawBundledEdgeSegment(graph, edge, bundle) {
  let empty = copyCanvas(graph.canvas);
  if (!edge.pathToJunction || edge.pathToJunction.length === 0) return [empty, empty, empty, empty, empty, empty];
  let pathCanvas = copyCanvas(graph.canvas), useAscii = graph.config.useAscii, drawingPath = edge.pathToJunction.map((gc, idx) => bundle.type === "fan-in" && idx === 0 ? getNodeAttachmentPoint(graph, edge.from, edge.startDir) : bundle.type === "fan-out" && idx === edge.pathToJunction.length - 1 ? getNodeAttachmentPoint(graph, edge.to, edge.endDir) : gridToDrawingCoord(graph, gc));
  for (let i = 1; i < drawingPath.length; i++) {
    let from = drawingPath[i - 1], to = drawingPath[i];
    drawingCoordEquals(from, to) || drawLine(pathCanvas, from, to, 1, -1, useAscii, edge.style);
  }
  let cornersCanvas = copyCanvas(graph.canvas);
  for (let idx = 1; idx < edge.pathToJunction.length - 1; idx++) {
    let coord = edge.pathToJunction[idx], dc = gridToDrawingCoord(graph, coord), prevDir = determineDirection(edge.pathToJunction[idx - 1], coord), nextDir = determineDirection(coord, edge.pathToJunction[idx + 1]), corner;
    useAscii ? corner = "+" : dirEquals(prevDir, Right) && dirEquals(nextDir, Down) || dirEquals(prevDir, Up) && dirEquals(nextDir, Left) ? corner = "\u2510" : dirEquals(prevDir, Right) && dirEquals(nextDir, Up) || dirEquals(prevDir, Down) && dirEquals(nextDir, Left) ? corner = "\u2518" : dirEquals(prevDir, Left) && dirEquals(nextDir, Down) || dirEquals(prevDir, Up) && dirEquals(nextDir, Right) ? corner = "\u250C" : dirEquals(prevDir, Left) && dirEquals(nextDir, Up) || dirEquals(prevDir, Down) && dirEquals(nextDir, Right) ? corner = "\u2514" : corner = "+", cornersCanvas[dc.x][dc.y] = corner;
  }
  let boxStartCanvas = copyCanvas(graph.canvas);
  if (bundle.type === "fan-in" && edge.pathToJunction.length >= 2) {
    let firstPoint = drawingPath[0], dir = determineDirection(edge.pathToJunction[0], edge.pathToJunction[1]);
    useAscii || (dirEquals(dir, Up) ? boxStartCanvas[firstPoint.x][firstPoint.y] = "\u2534" : dirEquals(dir, Down) ? boxStartCanvas[firstPoint.x][firstPoint.y] = "\u252C" : dirEquals(dir, Left) ? boxStartCanvas[firstPoint.x][firstPoint.y] = "\u2524" : dirEquals(dir, Right) && (boxStartCanvas[firstPoint.x][firstPoint.y] = "\u251C"));
  }
  let labelCanvas = copyCanvas(graph.canvas);
  return [pathCanvas, boxStartCanvas, empty, empty, cornersCanvas, labelCanvas];
}
function drawBundleSharedPath(graph, bundle) {
  let pathCanvas = copyCanvas(graph.canvas), cornersCanvas = copyCanvas(graph.canvas);
  if (bundle.sharedPath.length < 2) return [pathCanvas, cornersCanvas];
  let useAscii = graph.config.useAscii, style2 = bundle.edges[0]?.style ?? "solid", graphDir = graph.config.graphDirection, drawingPath = bundle.sharedPath.map((gc, idx) => {
    if (bundle.type === "fan-in" && idx === bundle.sharedPath.length - 1) {
      let entryDir = graphDir === "TD" ? Up : Left;
      return getNodeAttachmentPoint(graph, bundle.sharedNode, entryDir);
    }
    if (bundle.type === "fan-out" && idx === 0) {
      let exitDir = graphDir === "TD" ? Down : Right;
      return getNodeAttachmentPoint(graph, bundle.sharedNode, exitDir);
    }
    return gridToDrawingCoord(graph, gc);
  });
  for (let i = 1; i < drawingPath.length; i++) {
    let from = drawingPath[i - 1], to = drawingPath[i];
    drawingCoordEquals(from, to) || drawLine(pathCanvas, from, to, 1, -1, useAscii, style2);
  }
  for (let idx = 1; idx < bundle.sharedPath.length - 1; idx++) {
    let coord = bundle.sharedPath[idx], dc = gridToDrawingCoord(graph, coord), prevDir = determineDirection(bundle.sharedPath[idx - 1], coord), nextDir = determineDirection(coord, bundle.sharedPath[idx + 1]), corner;
    useAscii ? corner = "+" : dirEquals(prevDir, Right) && dirEquals(nextDir, Down) || dirEquals(prevDir, Up) && dirEquals(nextDir, Left) ? corner = "\u2510" : dirEquals(prevDir, Right) && dirEquals(nextDir, Up) || dirEquals(prevDir, Down) && dirEquals(nextDir, Left) ? corner = "\u2518" : dirEquals(prevDir, Left) && dirEquals(nextDir, Down) || dirEquals(prevDir, Up) && dirEquals(nextDir, Right) ? corner = "\u250C" : dirEquals(prevDir, Left) && dirEquals(nextDir, Up) || dirEquals(prevDir, Down) && dirEquals(nextDir, Right) ? corner = "\u2514" : corner = "+", cornersCanvas[dc.x][dc.y] = corner;
  }
  return [pathCanvas, cornersCanvas];
}
function drawBundleArrowhead(graph, bundle) {
  let canvas = copyCanvas(graph.canvas);
  if (bundle.sharedPath.length < 2) return canvas;
  let lastIdx = bundle.sharedPath.length - 1, secondLast = bundle.sharedPath[lastIdx - 1], last = bundle.sharedPath[lastIdx], dir = determineDirection(secondLast, last), graphDir = graph.config.graphDirection, entryDir = graphDir === "TD" ? Up : Left, dc = getNodeAttachmentPoint(graph, bundle.sharedNode, entryDir);
  graphDir === "TD" ? dc.y -= 1 : dc.x -= 1;
  let char;
  return graph.config.useAscii ? dirEquals(dir, Up) ? char = "^" : dirEquals(dir, Down) ? char = "v" : dirEquals(dir, Left) ? char = "<" : dirEquals(dir, Right) ? char = ">" : char = "v" : dirEquals(dir, Up) ? char = "\u25B2" : dirEquals(dir, Down) ? char = "\u25BC" : dirEquals(dir, Left) ? char = "\u25C4" : dirEquals(dir, Right) ? char = "\u25BA" : char = "\u25BC", canvas[dc.x][dc.y] = char, canvas;
}
function drawBundledEdgeArrowhead(graph, edge) {
  let canvas = copyCanvas(graph.canvas);
  if (!edge.pathToJunction || edge.pathToJunction.length < 2) return canvas;
  let lastIdx = edge.pathToJunction.length - 1, secondLast = edge.pathToJunction[lastIdx - 1], last = edge.pathToJunction[lastIdx], dir = determineDirection(secondLast, last), graphDir = graph.config.graphDirection, entryDir = graphDir === "TD" ? Up : Left, dc = getNodeAttachmentPoint(graph, edge.to, entryDir);
  graphDir === "TD" ? dc.y -= 1 : dc.x -= 1;
  let char;
  return graph.config.useAscii ? dirEquals(dir, Up) ? char = "^" : dirEquals(dir, Down) ? char = "v" : dirEquals(dir, Left) ? char = "<" : dirEquals(dir, Right) ? char = ">" : char = "v" : dirEquals(dir, Up) ? char = "\u25B2" : dirEquals(dir, Down) ? char = "\u25BC" : dirEquals(dir, Left) ? char = "\u25C4" : dirEquals(dir, Right) ? char = "\u25BA" : char = "\u25BC", canvas[dc.x][dc.y] = char, canvas;
}
function drawJunctionCharacter(graph, bundle) {
  let canvas = copyCanvas(graph.canvas);
  if (!bundle.junctionPoint) return canvas;
  let dc = gridToDrawingCoord(graph, bundle.junctionPoint), useAscii = graph.config.useAscii, hasUp = false, hasDown = false, hasLeft = false, hasRight = false;
  if (bundle.sharedPath.length >= 2) {
    let junctionIdx = bundle.type === "fan-in" ? 0 : bundle.sharedPath.length - 1, adjacentIdx = bundle.type === "fan-in" ? 1 : bundle.sharedPath.length - 2, sharedDir = determineDirection(bundle.sharedPath[junctionIdx], bundle.sharedPath[adjacentIdx]);
    dirEquals(sharedDir, Down) ? hasDown = true : dirEquals(sharedDir, Up) ? hasUp = true : dirEquals(sharedDir, Right) ? hasRight = true : dirEquals(sharedDir, Left) && (hasLeft = true);
  }
  for (let edge of bundle.edges) if (edge.pathToJunction && edge.pathToJunction.length >= 2) {
    let junctionIdx = bundle.type === "fan-in" ? edge.pathToJunction.length - 1 : 0, adjacentIdx = bundle.type === "fan-in" ? edge.pathToJunction.length - 2 : 1, arrivalDir = determineDirection(edge.pathToJunction[adjacentIdx], edge.pathToJunction[junctionIdx]);
    dirEquals(arrivalDir, Down) ? hasUp = true : dirEquals(arrivalDir, Up) ? hasDown = true : dirEquals(arrivalDir, Right) ? hasLeft = true : dirEquals(arrivalDir, Left) && (hasRight = true);
  }
  let char;
  return useAscii ? char = "+" : hasUp && hasDown && hasLeft && hasRight ? char = "\u253C" : hasDown && hasLeft && hasRight && !hasUp ? char = "\u252C" : hasUp && hasLeft && hasRight && !hasDown ? char = "\u2534" : hasUp && hasDown && hasRight && !hasLeft ? char = "\u251C" : hasUp && hasDown && hasLeft && !hasRight ? char = "\u2524" : hasLeft && hasRight ? char = "\u2500" : hasUp && hasDown ? char = "\u2502" : hasDown && hasRight ? char = "\u250C" : hasDown && hasLeft ? char = "\u2510" : hasUp && hasRight ? char = "\u2514" : hasUp && hasLeft ? char = "\u2518" : char = "\u253C", canvas[dc.x][dc.y] = char, canvas;
}
function drawSubgraphBox(sg, graph) {
  let width2 = sg.maxX - sg.minX, height = sg.maxY - sg.minY;
  if (width2 <= 0 || height <= 0) return mkCanvas(0, 0);
  let from = { x: 0, y: 0 }, to = { x: width2, y: height }, canvas = mkCanvas(width2, height);
  if (graph.config.useAscii) {
    for (let x = from.x + 1; x < to.x; x++) canvas[x][from.y] = "-";
    for (let x = from.x + 1; x < to.x; x++) canvas[x][to.y] = "-";
    for (let y = from.y + 1; y < to.y; y++) canvas[from.x][y] = "|";
    for (let y = from.y + 1; y < to.y; y++) canvas[to.x][y] = "|";
    canvas[from.x][from.y] = "+", canvas[to.x][from.y] = "+", canvas[from.x][to.y] = "+", canvas[to.x][to.y] = "+";
  } else {
    for (let x = from.x + 1; x < to.x; x++) canvas[x][from.y] = "\u2500";
    for (let x = from.x + 1; x < to.x; x++) canvas[x][to.y] = "\u2500";
    for (let y = from.y + 1; y < to.y; y++) canvas[from.x][y] = "\u2502";
    for (let y = from.y + 1; y < to.y; y++) canvas[to.x][y] = "\u2502";
    canvas[from.x][from.y] = "\u250C", canvas[to.x][from.y] = "\u2510", canvas[from.x][to.y] = "\u2514", canvas[to.x][to.y] = "\u2518";
  }
  return canvas;
}
function drawSubgraphLabel(sg, graph) {
  let width2 = sg.maxX - sg.minX, height = sg.maxY - sg.minY;
  if (width2 <= 0 || height <= 0) return [mkCanvas(0, 0), { x: 0, y: 0 }];
  let canvas = mkCanvas(width2, height), lines2 = splitLines(sg.name);
  for (let i = 0; i < lines2.length; i++) {
    let line = lines2[i], labelY = 1 + i, labelX = Math.floor(width2 / 2) - Math.floor(line.length / 2);
    labelX < 1 && (labelX = 1);
    for (let j = 0; j < line.length; j++) labelX + j < width2 && labelY < height && (canvas[labelX + j][labelY] = line[j]);
  }
  return [canvas, { x: sg.minX, y: sg.minY }];
}
function sortSubgraphsByDepth(subgraphs) {
  function getDepth(sg) {
    return sg.parent === null ? 0 : 1 + getDepth(sg.parent);
  }
  let sorted = [...subgraphs];
  return sorted.sort((a, b) => getDepth(a) - getDepth(b)), sorted;
}
function fillRolesFromCanvas(roleCanvas, canvas, offset, role) {
  for (let x = 0; x < canvas.length; x++) for (let y = 0; y < (canvas[0]?.length ?? 0); y++) {
    let char = canvas[x]?.[y];
    if (char && char !== " ") {
      let rx = x + offset.x, ry = y + offset.y;
      rx >= 0 && ry >= 0 && setRole(roleCanvas, rx, ry, role);
    }
  }
}
function fillRolesFromCanvases(roleCanvas, canvases, offset, role) {
  for (let canvas of canvases) fillRolesFromCanvas(roleCanvas, canvas, offset, role);
}
function fillRolesForNodeBox(roleCanvas, canvas, offset) {
  let isBorderChar = (c) => /^[┌┐└┘├┤┬┴┼│─╭╮╰╯+\-|.':]$/.test(c);
  for (let x = 0; x < canvas.length; x++) for (let y = 0; y < (canvas[0]?.length ?? 0); y++) {
    let char = canvas[x]?.[y];
    if (char && char !== " ") {
      let rx = x + offset.x, ry = y + offset.y;
      rx >= 0 && ry >= 0 && setRole(roleCanvas, rx, ry, isBorderChar(char) ? "border" : "text");
    }
  }
}
function drawGraph(graph) {
  let useAscii = graph.config.useAscii, zero = { x: 0, y: 0 }, sortedSgs = sortSubgraphsByDepth(graph.subgraphs);
  for (let sg of sortedSgs) {
    let sgCanvas = drawSubgraphBox(sg, graph), offset = { x: sg.minX, y: sg.minY };
    graph.canvas = mergeCanvases(graph.canvas, offset, useAscii, sgCanvas), fillRolesFromCanvas(graph.roleCanvas, sgCanvas, offset, "border");
  }
  for (let node of graph.nodes) !node.drawn && node.drawingCoord && node.drawing && (graph.canvas = mergeCanvases(graph.canvas, node.drawingCoord, useAscii, node.drawing), fillRolesForNodeBox(graph.roleCanvas, node.drawing, node.drawingCoord), node.drawn = true);
  let lineCanvases = [], cornerCanvases = [], arrowHeadEndCanvases = [], arrowHeadStartCanvases = [], boxStartCanvases = [], labelCanvases = [], junctionCanvases = [], processedBundles = /* @__PURE__ */ new Set();
  for (let edge of graph.edges) if (edge.bundle && edge.pathToJunction) {
    let bundle = edge.bundle, [pathC, boxStartC, , , cornersC, labelC] = drawBundledEdgeSegment(graph, edge, bundle);
    if (lineCanvases.push(pathC), cornerCanvases.push(cornersC), boxStartCanvases.push(boxStartC), labelCanvases.push(labelC), !processedBundles.has(bundle)) {
      processedBundles.add(bundle);
      let [sharedPathC, sharedCornersC] = drawBundleSharedPath(graph, bundle);
      if (lineCanvases.push(sharedPathC), cornerCanvases.push(sharedCornersC), bundle.type === "fan-in") {
        let arrowHeadC = drawBundleArrowhead(graph, bundle);
        arrowHeadEndCanvases.push(arrowHeadC);
      }
      let junctionC = drawJunctionCharacter(graph, bundle);
      junctionCanvases.push(junctionC);
    }
    if (bundle.type === "fan-out" && edge.hasArrowEnd) {
      let arrowHeadC = drawBundledEdgeArrowhead(graph, edge);
      arrowHeadEndCanvases.push(arrowHeadC);
    }
  } else {
    let [pathC, boxStartC, arrowHeadEndC, arrowHeadStartC, cornersC, labelC] = drawArrow(graph, edge);
    lineCanvases.push(pathC), cornerCanvases.push(cornersC), arrowHeadEndCanvases.push(arrowHeadEndC), arrowHeadStartCanvases.push(arrowHeadStartC), boxStartCanvases.push(boxStartC), labelCanvases.push(labelC);
  }
  graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...lineCanvases), fillRolesFromCanvases(graph.roleCanvas, lineCanvases, zero, "line"), graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...cornerCanvases), fillRolesFromCanvases(graph.roleCanvas, cornerCanvases, zero, "corner"), graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...junctionCanvases), fillRolesFromCanvases(graph.roleCanvas, junctionCanvases, zero, "junction"), graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...arrowHeadEndCanvases), fillRolesFromCanvases(graph.roleCanvas, arrowHeadEndCanvases, zero, "arrow"), graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...boxStartCanvases), fillRolesFromCanvases(graph.roleCanvas, boxStartCanvases, zero, "junction"), graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...arrowHeadStartCanvases), fillRolesFromCanvases(graph.roleCanvas, arrowHeadStartCanvases, zero, "arrow"), graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...labelCanvases);
  for (let label of labelCanvases) clearLabelGaps(graph.canvas, label);
  fillRolesFromCanvases(graph.roleCanvas, labelCanvases, zero, "text");
  for (let sg of graph.subgraphs) {
    if (sg.nodes.length === 0) continue;
    let [labelCanvas, offset] = drawSubgraphLabel(sg, graph);
    graph.canvas = mergeCanvases(graph.canvas, offset, useAscii, labelCanvas), fillRolesFromCanvas(graph.roleCanvas, labelCanvas, offset, "text");
  }
  return graph.canvas;
}
function gridToDrawingCoord(graph, c, dir) {
  let target = dir ? { x: c.x + dir.x, y: c.y + dir.y } : c, x = 0;
  for (let col = 0; col < target.x; col++) x += graph.columnWidth.get(col) ?? 0;
  let y = 0;
  for (let row = 0; row < target.y; row++) y += graph.rowHeight.get(row) ?? 0;
  let colW = graph.columnWidth.get(target.x) ?? 0, rowH = graph.rowHeight.get(target.y) ?? 0;
  return { x: x + Math.floor(colW / 2) + graph.offsetX, y: y + Math.floor(rowH / 2) + graph.offsetY };
}
function lineToDrawing(graph, line) {
  return line.map((c) => gridToDrawingCoord(graph, c));
}
function reserveSpotInGrid(graph, node, requested, effectiveDir) {
  let dir = effectiveDir ?? getEffectiveDirection2(graph, node);
  if (graph.grid.has(gridKey(requested))) return dir === "LR" ? reserveSpotInGrid(graph, node, { x: requested.x, y: requested.y + 4 }, dir) : reserveSpotInGrid(graph, node, { x: requested.x + 4, y: requested.y }, dir);
  for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) {
    let reserved = { x: requested.x + dx, y: requested.y + dy };
    graph.grid.set(gridKey(reserved), node);
  }
  return node.gridCoord = requested, requested;
}
function setColumnWidth(graph, node) {
  let gc = node.gridCoord, padding = graph.config.boxBorderPadding, shapeDims = getShapeDimensions(node.shape, node.displayLabel, { useAscii: graph.config.useAscii, padding }), colWidths = shapeDims.gridColumns, rowHeights = shapeDims.gridRows;
  for (let idx = 0; idx < colWidths.length; idx++) {
    let xCoord = gc.x + idx, current = graph.columnWidth.get(xCoord) ?? 0;
    graph.columnWidth.set(xCoord, Math.max(current, colWidths[idx]));
  }
  for (let idx = 0; idx < rowHeights.length; idx++) {
    let yCoord = gc.y + idx, current = graph.rowHeight.get(yCoord) ?? 0;
    graph.rowHeight.set(yCoord, Math.max(current, rowHeights[idx]));
  }
  if (gc.x > 0) {
    let current = graph.columnWidth.get(gc.x - 1) ?? 0;
    graph.columnWidth.set(gc.x - 1, Math.max(current, graph.config.paddingX));
  }
  if (gc.y > 0) {
    let basePadding = graph.config.paddingY;
    hasIncomingEdgeFromOutsideSubgraph(graph, node) && (basePadding += 4);
    let current = graph.rowHeight.get(gc.y - 1) ?? 0;
    graph.rowHeight.set(gc.y - 1, Math.max(current, basePadding));
  }
}
function increaseGridSizeForPath(graph, path) {
  for (let c of path) graph.columnWidth.has(c.x) || graph.columnWidth.set(c.x, Math.floor(graph.config.paddingX / 2)), graph.rowHeight.has(c.y) || graph.rowHeight.set(c.y, Math.floor(graph.config.paddingY / 2));
}
function isNodeInAnySubgraph(graph, node) {
  return graph.subgraphs.some((sg) => sg.nodes.includes(node));
}
function getNodeSubgraph(graph, node) {
  let innermost = null;
  for (let sg of graph.subgraphs) sg.nodes.includes(node) && (!innermost || isAncestorOrSelf2(innermost, sg)) && (innermost = sg);
  return innermost;
}
function isAncestorOrSelf2(candidate, target) {
  let current = target;
  for (; current !== null; ) {
    if (current === candidate) return true;
    current = current.parent;
  }
  return false;
}
function getEffectiveDirection2(graph, node) {
  let sg = getNodeSubgraph(graph, node);
  return sg?.direction ? sg.direction : graph.config.graphDirection;
}
function hasIncomingEdgeFromOutsideSubgraph(graph, node) {
  let nodeSg = getNodeSubgraph(graph, node);
  if (!nodeSg) return false;
  let hasExternalEdge = false;
  for (let edge of graph.edges) if (edge.to === node && getNodeSubgraph(graph, edge.from) !== nodeSg) {
    hasExternalEdge = true;
    break;
  }
  if (!hasExternalEdge) return false;
  for (let otherNode of nodeSg.nodes) {
    if (otherNode === node || !otherNode.gridCoord) continue;
    let otherHasExternal = false;
    for (let edge of graph.edges) if (edge.to === otherNode && getNodeSubgraph(graph, edge.from) !== nodeSg) {
      otherHasExternal = true;
      break;
    }
    if (otherHasExternal && otherNode.gridCoord.y < node.gridCoord.y) return false;
  }
  return true;
}
function calculateSubgraphBoundingBox(graph, sg) {
  if (sg.nodes.length === 0) return;
  let minX = 1e6, minY = 1e6, maxX = -1e6, maxY = -1e6;
  for (let child of sg.children) calculateSubgraphBoundingBox(graph, child), child.nodes.length > 0 && (minX = Math.min(minX, child.minX), minY = Math.min(minY, child.minY), maxX = Math.max(maxX, child.maxX), maxY = Math.max(maxY, child.maxY));
  for (let node of sg.nodes) {
    if (!node.drawingCoord || !node.drawing) continue;
    let nodeMinX = node.drawingCoord.x, nodeMinY = node.drawingCoord.y, nodeMaxX = nodeMinX + node.drawing.length - 1, nodeMaxY = nodeMinY + node.drawing[0].length - 1;
    minX = Math.min(minX, nodeMinX), minY = Math.min(minY, nodeMinY), maxX = Math.max(maxX, nodeMaxX), maxY = Math.max(maxY, nodeMaxY);
  }
  let subgraphPadding = 2, subgraphLabelSpace = 2;
  sg.minX = minX - subgraphPadding, sg.minY = minY - subgraphPadding - subgraphLabelSpace, sg.maxX = maxX + subgraphPadding, sg.maxY = maxY + subgraphPadding;
}
function ensureSubgraphSpacing(graph) {
  let rootSubgraphs = graph.subgraphs.filter((sg) => sg.parent === null && sg.nodes.length > 0);
  for (let i = 0; i < rootSubgraphs.length; i++) for (let j = i + 1; j < rootSubgraphs.length; j++) {
    let sg1 = rootSubgraphs[i], sg2 = rootSubgraphs[j];
    sg1.minX < sg2.maxX && sg1.maxX > sg2.minX && (sg1.maxY >= sg2.minY - 1 && sg1.minY < sg2.minY ? sg2.minY = sg1.maxY + 1 + 1 : sg2.maxY >= sg1.minY - 1 && sg2.minY < sg1.minY && (sg1.minY = sg2.maxY + 1 + 1)), sg1.minY < sg2.maxY && sg1.maxY > sg2.minY && (sg1.maxX >= sg2.minX - 1 && sg1.minX < sg2.minX ? sg2.minX = sg1.maxX + 1 + 1 : sg2.maxX >= sg1.minX - 1 && sg2.minX < sg1.minX && (sg1.minX = sg2.maxX + 1 + 1));
  }
}
function calculateSubgraphBoundingBoxes(graph) {
  for (let sg of graph.subgraphs) calculateSubgraphBoundingBox(graph, sg);
  ensureSubgraphSpacing(graph);
}
function offsetDrawingForSubgraphs(graph) {
  if (graph.subgraphs.length === 0) return;
  let minX = 0, minY = 0;
  for (let sg of graph.subgraphs) minX = Math.min(minX, sg.minX), minY = Math.min(minY, sg.minY);
  let offsetX = -minX, offsetY = -minY;
  if (!(offsetX === 0 && offsetY === 0)) {
    graph.offsetX = offsetX, graph.offsetY = offsetY;
    for (let sg of graph.subgraphs) sg.minX += offsetX, sg.minY += offsetY, sg.maxX += offsetX, sg.maxY += offsetY;
    for (let node of graph.nodes) node.drawingCoord && (node.drawingCoord.x += offsetX, node.drawingCoord.y += offsetY);
  }
}
function createMapping(graph) {
  let dir = graph.config.graphDirection, highestPositionPerLevel = new Array(100).fill(0), nodesFound = /* @__PURE__ */ new Set(), initialRoots = [];
  for (let node of graph.nodes) {
    nodesFound.has(node.name) || initialRoots.push(node), nodesFound.add(node.name);
    for (let child of getChildren(graph, node)) nodesFound.add(child.name);
  }
  let rootNodes = initialRoots.filter((node) => {
    let nodeSg = getNodeSubgraph(graph, node);
    if (!nodeSg) return true;
    for (let edge of graph.edges) if (edge.to === node && getNodeSubgraph(graph, edge.from) !== nodeSg) return false;
    return true;
  }), hasExternalRoots = false, hasSubgraphRootsWithEdges = false;
  for (let node of rootNodes) isNodeInAnySubgraph(graph, node) ? getChildren(graph, node).length > 0 && (hasSubgraphRootsWithEdges = true) : hasExternalRoots = true;
  let shouldSeparate = dir === "LR" && hasExternalRoots && hasSubgraphRootsWithEdges, externalRootNodes, subgraphRootNodes = [];
  shouldSeparate ? (externalRootNodes = rootNodes.filter((n) => !isNodeInAnySubgraph(graph, n)), subgraphRootNodes = rootNodes.filter((n) => isNodeInAnySubgraph(graph, n))) : externalRootNodes = rootNodes;
  for (let node of externalRootNodes) {
    let requested = dir === "LR" ? { x: 0, y: highestPositionPerLevel[0] } : { x: highestPositionPerLevel[0], y: 0 };
    reserveSpotInGrid(graph, graph.nodes[node.index], requested), highestPositionPerLevel[0] = highestPositionPerLevel[0] + 4;
  }
  if (shouldSeparate && subgraphRootNodes.length > 0) for (let node of subgraphRootNodes) {
    let requested = dir === "LR" ? { x: 4, y: highestPositionPerLevel[4] } : { x: highestPositionPerLevel[4], y: 4 };
    reserveSpotInGrid(graph, graph.nodes[node.index], requested), highestPositionPerLevel[4] = highestPositionPerLevel[4] + 4;
  }
  let placedCount = externalRootNodes.length + subgraphRootNodes.length;
  for (; placedCount < graph.nodes.length; ) {
    let prevCount = placedCount;
    for (let node of graph.nodes) {
      if (node.gridCoord === null) continue;
      let gc = node.gridCoord;
      for (let child of getChildren(graph, node)) {
        if (child.gridCoord !== null) continue;
        let parentSg = getNodeSubgraph(graph, node), childSg = getNodeSubgraph(graph, child), edgeDir = parentSg && parentSg === childSg && parentSg.direction ? parentSg.direction : graph.config.graphDirection, childLevel = edgeDir === "LR" ? gc.x + 4 : gc.y + 4, highestPosition;
        edgeDir !== graph.config.graphDirection ? highestPosition = edgeDir === "LR" ? gc.y : gc.x : highestPosition = highestPositionPerLevel[childLevel];
        let requested = edgeDir === "LR" ? { x: childLevel, y: highestPosition } : { x: highestPosition, y: childLevel };
        reserveSpotInGrid(graph, graph.nodes[child.index], requested, edgeDir), edgeDir === graph.config.graphDirection && (highestPositionPerLevel[childLevel] = highestPosition + 4), placedCount++;
      }
    }
    if (placedCount === prevCount) break;
  }
  for (let node of graph.nodes) setColumnWidth(graph, node);
  graph.bundles = analyzeEdgeBundles(graph), processBundles(graph);
  for (let edge of graph.edges) {
    if (edge.bundle && edge.path.length > 0) {
      increaseGridSizeForPath(graph, edge.path), determineLabelLine(graph, edge);
      continue;
    }
    determinePath(graph, edge), increaseGridSizeForPath(graph, edge.path), determineLabelLine(graph, edge);
  }
  for (let node of graph.nodes) node.drawingCoord = gridToDrawingCoord(graph, node.gridCoord), node.drawing = drawBox(node, graph);
  setCanvasSizeToGrid(graph.canvas, graph.columnWidth, graph.rowHeight), setRoleCanvasSizeToGrid(graph.roleCanvas, graph.columnWidth, graph.rowHeight), calculateSubgraphBoundingBoxes(graph), offsetDrawingForSubgraphs(graph);
}
function getEdgesFromNode(graph, node) {
  return graph.edges.filter((e) => e.from.name === node.name);
}
function getChildren(graph, node) {
  return getEdgesFromNode(graph, node).map((e) => e.to);
}
function parseSequenceDiagram(lines2) {
  let diagram = { actors: [], messages: [], blocks: [], notes: [] }, actorIds = /* @__PURE__ */ new Set(), blockStack = [];
  for (let i = 1; i < lines2.length; i++) {
    let line = lines2[i], actorMatch = line.match(/^(participant|actor)\s+(\S+?)(?:\s+as\s+(.+))?$/);
    if (actorMatch) {
      let type = actorMatch[1], id = actorMatch[2], rawLabel = actorMatch[3]?.trim() ?? id, label = normalizeBrTags(rawLabel);
      actorIds.has(id) || (actorIds.add(id), diagram.actors.push({ id, label, type }));
      continue;
    }
    let noteMatch = line.match(/^Note\s+(left of|right of|over)\s+([^:]+):\s*(.+)$/i);
    if (noteMatch) {
      let posStr = noteMatch[1].toLowerCase(), actorsStr = noteMatch[2].trim(), text2 = normalizeBrTags(noteMatch[3].trim()), noteActorIds = actorsStr.split(",").map((s) => s.trim());
      for (let aid of noteActorIds) ensureActor(diagram, actorIds, aid);
      let position = "over";
      posStr === "left of" ? position = "left" : posStr === "right of" && (position = "right"), diagram.notes.push({ actorIds: noteActorIds, text: text2, position, afterIndex: diagram.messages.length - 1 });
      continue;
    }
    let blockMatch = line.match(/^(loop|alt|opt|par|critical|break|rect)\s*(.*)$/);
    if (blockMatch) {
      let blockType = blockMatch[1], rawBlockLabel = blockMatch[2]?.trim() ?? "", label = normalizeBrTags(rawBlockLabel);
      blockStack.push({ type: blockType, label, startIndex: diagram.messages.length, dividers: [] });
      continue;
    }
    let dividerMatch = line.match(/^(else|and)\s*(.*)$/);
    if (dividerMatch && blockStack.length > 0) {
      let rawDividerLabel = dividerMatch[2]?.trim() ?? "", label = normalizeBrTags(rawDividerLabel);
      blockStack[blockStack.length - 1].dividers.push({ index: diagram.messages.length, label });
      continue;
    }
    if (line === "end" && blockStack.length > 0) {
      let completed = blockStack.pop();
      diagram.blocks.push({ type: completed.type, label: completed.label, startIndex: completed.startIndex, endIndex: Math.max(diagram.messages.length - 1, completed.startIndex), dividers: completed.dividers });
      continue;
    }
    let msgMatch = line.match(/^(\S+?)\s*(--?>?>|--?[)x]|--?>>|--?>)\s*([+-]?)(\S+?)\s*:\s*(.+)$/);
    if (msgMatch) {
      let from = msgMatch[1], arrow = msgMatch[2], activationMark = msgMatch[3], to = msgMatch[4], label = normalizeBrTags(msgMatch[5].trim());
      ensureActor(diagram, actorIds, from), ensureActor(diagram, actorIds, to);
      let lineStyle = arrow.startsWith("--") ? "dashed" : "solid", arrowHead = arrow.includes(">>") || arrow.includes("x") ? "filled" : "open", msg = { from, to, label, lineStyle, arrowHead };
      activationMark === "+" && (msg.activate = true), activationMark === "-" && (msg.deactivate = true), diagram.messages.push(msg);
      continue;
    }
    let simpleMsgMatch = line.match(/^(\S+?)\s*(->>|-->>|-\)|--\)|-x|--x|->|-->)\s*([+-]?)(\S+?)\s*:\s*(.+)$/);
    if (simpleMsgMatch) {
      let from = simpleMsgMatch[1], arrow = simpleMsgMatch[2], activationMark = simpleMsgMatch[3], to = simpleMsgMatch[4], label = normalizeBrTags(simpleMsgMatch[5].trim());
      ensureActor(diagram, actorIds, from), ensureActor(diagram, actorIds, to);
      let lineStyle = arrow.startsWith("--") ? "dashed" : "solid", arrowHead = arrow.includes(">>") || arrow.includes("x") ? "filled" : "open", msg = { from, to, label, lineStyle, arrowHead };
      activationMark === "+" && (msg.activate = true), activationMark === "-" && (msg.deactivate = true), diagram.messages.push(msg);
      continue;
    }
  }
  return diagram;
}
function ensureActor(diagram, actorIds, id) {
  actorIds.has(id) || (actorIds.add(id), diagram.actors.push({ id, label: id, type: "participant" }));
}
function renderSequenceAscii(text2, config, colorMode, theme) {
  let lines2 = text2.split(`
`).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("%%")), diagram = parseSequenceDiagram(lines2);
  if (diagram.actors.length === 0) return "";
  let useAscii = config.useAscii, H = useAscii ? "-" : "\u2500", V = useAscii ? "|" : "\u2502", TL = useAscii ? "+" : "\u250C", TR = useAscii ? "+" : "\u2510", BL = useAscii ? "+" : "\u2514", BR = useAscii ? "+" : "\u2518", JT = useAscii ? "+" : "\u252C", JB = useAscii ? "+" : "\u2534", JL = useAscii ? "+" : "\u251C", JR = useAscii ? "+" : "\u2524", actorIdx = /* @__PURE__ */ new Map();
  diagram.actors.forEach((a, i) => actorIdx.set(a.id, i));
  let boxPad = 1, halfBox = diagram.actors.map((a) => maxLineWidth(a.label) + 2 * boxPad + 2).map((w) => Math.ceil(w / 2)), actorBoxHeights = diagram.actors.map((a) => lineCount(a.label) + 2), actorBoxH = Math.max(...actorBoxHeights, 3), adjMaxWidth = new Array(Math.max(diagram.actors.length - 1, 0)).fill(0);
  for (let msg of diagram.messages) {
    let fi = actorIdx.get(msg.from), ti = actorIdx.get(msg.to);
    if (fi === ti) continue;
    let lo = Math.min(fi, ti), hi = Math.max(fi, ti), needed = maxLineWidth(msg.label) + 4, numGaps = hi - lo, perGap = Math.ceil(needed / numGaps);
    for (let g = lo; g < hi; g++) adjMaxWidth[g] = Math.max(adjMaxWidth[g], perGap);
  }
  let llX = [halfBox[0]];
  for (let i = 1; i < diagram.actors.length; i++) {
    let gap = Math.max(halfBox[i - 1] + halfBox[i] + 2, adjMaxWidth[i - 1] + 2, 10);
    llX[i] = llX[i - 1] + gap;
  }
  let msgArrowY = [], msgLabelY = [], blockStartY = /* @__PURE__ */ new Map(), blockEndY = /* @__PURE__ */ new Map(), divYMap = /* @__PURE__ */ new Map(), notePositions = [], curY = actorBoxH;
  for (let m = 0; m < diagram.messages.length; m++) {
    for (let b = 0; b < diagram.blocks.length; b++) diagram.blocks[b].startIndex === m && (curY += 2, blockStartY.set(b, curY - 1));
    for (let b = 0; b < diagram.blocks.length; b++) for (let d = 0; d < diagram.blocks[b].dividers.length; d++) diagram.blocks[b].dividers[d].index === m && (curY += 1, divYMap.set(`${b}:${d}`, curY), curY += 1);
    curY += 1;
    let msg = diagram.messages[m], isSelf = msg.from === msg.to, msgLineCount = lineCount(msg.label);
    isSelf ? (msgLabelY[m] = curY + 1, msgArrowY[m] = curY, curY += 2 + msgLineCount) : (msgLabelY[m] = curY, msgArrowY[m] = curY + msgLineCount, curY += msgLineCount + 1);
    for (let n = 0; n < diagram.notes.length; n++) if (diagram.notes[n].afterIndex === m) {
      curY += 1;
      let note = diagram.notes[n], nLines = splitLines(note.text), nWidth = Math.max(...nLines.map((l) => l.length)) + 4, nHeight = nLines.length + 2, aIdx = actorIdx.get(note.actorIds[0]) ?? 0, nx;
      if (note.position === "left") nx = llX[aIdx] - nWidth - 1;
      else if (note.position === "right") nx = llX[aIdx] + 2;
      else if (note.actorIds.length >= 2) {
        let aIdx2 = actorIdx.get(note.actorIds[1]) ?? aIdx;
        nx = Math.floor((llX[aIdx] + llX[aIdx2]) / 2) - Math.floor(nWidth / 2);
      } else nx = llX[aIdx] - Math.floor(nWidth / 2);
      nx = Math.max(0, nx), notePositions.push({ x: nx, y: curY, width: nWidth, height: nHeight, lines: nLines }), curY += nHeight;
    }
    for (let b = 0; b < diagram.blocks.length; b++) diagram.blocks[b].endIndex === m && (curY += 1, blockEndY.set(b, curY), curY += 1);
  }
  curY += 1;
  let footerY = curY, totalH = footerY + actorBoxH, lastLL = llX[llX.length - 1] ?? 0, lastHalf = halfBox[halfBox.length - 1] ?? 0, totalW = lastLL + lastHalf + 2;
  for (let m = 0; m < diagram.messages.length; m++) {
    let msg = diagram.messages[m];
    if (msg.from === msg.to) {
      let fi = actorIdx.get(msg.from), selfRight = llX[fi] + 6 + 2 + msg.label.length;
      totalW = Math.max(totalW, selfRight + 1);
    }
  }
  for (let np of notePositions) totalW = Math.max(totalW, np.x + np.width + 1);
  let canvas = mkCanvas(totalW, totalH - 1), rc = mkRoleCanvas(totalW, totalH - 1);
  function setC(x, y, ch, role) {
    x >= 0 && x < canvas.length && y >= 0 && y < (canvas[0]?.length ?? 0) && (canvas[x][y] = ch, setRole(rc, x, y, role));
  }
  function drawActorBox(cx, topY, label) {
    let lines22 = splitLines(label), maxW = maxLineWidth(label), w = maxW + 2 * boxPad + 2, h2 = lines22.length + 2, left = cx - Math.floor(w / 2);
    setC(left, topY, TL, "border");
    for (let x = 1; x < w - 1; x++) setC(left + x, topY, H, "border");
    setC(left + w - 1, topY, TR, "border");
    for (let i = 0; i < lines22.length; i++) {
      let row = topY + 1 + i;
      setC(left, row, V, "border"), setC(left + w - 1, row, V, "border");
      let line = lines22[i], ls = left + 1 + boxPad + Math.floor((maxW - line.length) / 2);
      for (let j = 0; j < line.length; j++) setC(ls + j, row, line[j], "text");
    }
    let bottomY = topY + h2 - 1;
    setC(left, bottomY, BL, "border");
    for (let x = 1; x < w - 1; x++) setC(left + x, bottomY, H, "border");
    setC(left + w - 1, bottomY, BR, "border");
  }
  for (let i = 0; i < diagram.actors.length; i++) {
    let x = llX[i];
    for (let y = actorBoxH; y <= footerY; y++) setC(x, y, V, "line");
  }
  for (let i = 0; i < diagram.actors.length; i++) {
    let actor = diagram.actors[i];
    drawActorBox(llX[i], 0, actor.label), drawActorBox(llX[i], footerY, actor.label), useAscii || (setC(llX[i], actorBoxH - 1, JT, "junction"), setC(llX[i], footerY, JB, "junction"));
  }
  for (let m = 0; m < diagram.messages.length; m++) {
    let msg = diagram.messages[m], fi = actorIdx.get(msg.from), ti = actorIdx.get(msg.to), fromX = llX[fi], toX = llX[ti], isSelf = fi === ti, isDashed = msg.lineStyle === "dashed", isFilled = msg.arrowHead === "filled", lineChar = isDashed ? useAscii ? "." : "\u254C" : H;
    if (isSelf) {
      let y0 = msgArrowY[m], loopW = Math.max(4, 4);
      setC(fromX, y0, JL, "junction");
      for (let x = fromX + 1; x < fromX + loopW; x++) setC(x, y0, lineChar, "line");
      setC(fromX + loopW, y0, useAscii ? "+" : "\u2510", "corner"), setC(fromX + loopW, y0 + 1, V, "line");
      let labelX = fromX + loopW + 2;
      for (let i = 0; i < msg.label.length; i++) labelX + i < totalW && setC(labelX + i, y0 + 1, msg.label[i], "text");
      let arrowChar = isFilled ? useAscii ? "<" : "\u25C0" : useAscii ? "<" : "\u25C1";
      setC(fromX, y0 + 2, arrowChar, "arrow");
      for (let x = fromX + 1; x < fromX + loopW; x++) setC(x, y0 + 2, lineChar, "line");
      setC(fromX + loopW, y0 + 2, useAscii ? "+" : "\u2518", "corner");
    } else {
      let labelY = msgLabelY[m], arrowY = msgArrowY[m], leftToRight = fromX < toX, midX = Math.floor((fromX + toX) / 2), msgLines = splitLines(msg.label);
      for (let lineIdx = 0; lineIdx < msgLines.length; lineIdx++) {
        let line = msgLines[lineIdx], labelStart = midX - Math.floor(line.length / 2), y = labelY + lineIdx;
        for (let i = 0; i < line.length; i++) {
          let lx = labelStart + i;
          lx >= 0 && lx < totalW && setC(lx, y, line[i], "text");
        }
      }
      if (leftToRight) {
        for (let x = fromX + 1; x < toX; x++) setC(x, arrowY, lineChar, "line");
        setC(toX, arrowY, isFilled ? useAscii ? ">" : "\u25B6" : useAscii ? ">" : "\u25B7", "arrow");
      } else {
        for (let x = toX + 1; x < fromX; x++) setC(x, arrowY, lineChar, "line");
        setC(toX, arrowY, isFilled ? useAscii ? "<" : "\u25C0" : useAscii ? "<" : "\u25C1", "arrow");
      }
    }
  }
  for (let b = 0; b < diagram.blocks.length; b++) {
    let block = diagram.blocks[b], topY = blockStartY.get(b), botY = blockEndY.get(b);
    if (topY === void 0 || botY === void 0) continue;
    let minLX = totalW, maxLX = 0;
    for (let m = block.startIndex; m <= block.endIndex && !(m >= diagram.messages.length); m++) {
      let msg = diagram.messages[m], f = actorIdx.get(msg.from) ?? 0, t = actorIdx.get(msg.to) ?? 0;
      minLX = Math.min(minLX, llX[Math.min(f, t)]), maxLX = Math.max(maxLX, llX[Math.max(f, t)]);
    }
    let bLeft = Math.max(0, minLX - 4), bRight = Math.min(totalW - 1, maxLX + 4);
    setC(bLeft, topY, TL, "border");
    for (let x = bLeft + 1; x < bRight; x++) setC(x, topY, H, "border");
    setC(bRight, topY, TR, "border");
    let hdrLabel = block.label ? `${block.type} [${block.label}]` : block.type, hdrLines = splitLines(hdrLabel);
    for (let lineIdx = 0; lineIdx < hdrLines.length && topY + lineIdx < botY; lineIdx++) {
      let line = hdrLines[lineIdx];
      for (let i = 0; i < line.length && bLeft + 1 + i < bRight; i++) setC(bLeft + 1 + i, topY + lineIdx, line[i], "text");
    }
    setC(bLeft, botY, BL, "border");
    for (let x = bLeft + 1; x < bRight; x++) setC(x, botY, H, "border");
    setC(bRight, botY, BR, "border");
    for (let y = topY + 1; y < botY; y++) setC(bLeft, y, V, "border"), setC(bRight, y, V, "border");
    for (let d = 0; d < block.dividers.length; d++) {
      let dY = divYMap.get(`${b}:${d}`);
      if (dY === void 0) continue;
      let dashChar = isDashedH();
      setC(bLeft, dY, JL, "junction");
      for (let x = bLeft + 1; x < bRight; x++) setC(x, dY, dashChar, "line");
      setC(bRight, dY, JR, "junction");
      let dLabel = block.dividers[d].label;
      if (dLabel) {
        let dStr = `[${dLabel}]`;
        for (let i = 0; i < dStr.length && bLeft + 1 + i < bRight; i++) setC(bLeft + 1 + i, dY, dStr[i], "text");
      }
    }
  }
  for (let np of notePositions) {
    increaseSize(canvas, np.x + np.width, np.y + np.height), increaseRoleCanvasSize(rc, np.x + np.width, np.y + np.height), setC(np.x, np.y, TL, "border");
    for (let x = 1; x < np.width - 1; x++) setC(np.x + x, np.y, H, "border");
    setC(np.x + np.width - 1, np.y, TR, "border");
    for (let l = 0; l < np.lines.length; l++) {
      let ly = np.y + 1 + l;
      setC(np.x, ly, V, "border"), setC(np.x + np.width - 1, ly, V, "border");
      for (let i = 0; i < np.lines[l].length; i++) setC(np.x + 2 + i, ly, np.lines[l][i], "text");
    }
    let by = np.y + np.height - 1;
    setC(np.x, by, BL, "border");
    for (let x = 1; x < np.width - 1; x++) setC(np.x + x, by, H, "border");
    setC(np.x + np.width - 1, by, BR, "border");
  }
  return canvasToString(canvas, { roleCanvas: rc, colorMode, theme });
  function isDashedH() {
    return useAscii ? "-" : "\u254C";
  }
}
function parseClassDiagram(lines2) {
  let diagram = { classes: [], relationships: [], namespaces: [] }, classMap = /* @__PURE__ */ new Map(), currentNamespace = null, currentClass = null, braceDepth = 0;
  for (let i = 1; i < lines2.length; i++) {
    let line = lines2[i];
    if (currentClass && braceDepth > 0) {
      if (line === "}") {
        braceDepth--, braceDepth === 0 && (currentClass = null);
        continue;
      }
      let annotMatch = line.match(/^<<(\w+)>>$/);
      if (annotMatch) {
        currentClass.annotation = annotMatch[1];
        continue;
      }
      let member = parseMember(line);
      member && (member.isMethod ? currentClass.methods.push(member.member) : currentClass.attributes.push(member.member));
      continue;
    }
    let nsMatch = line.match(/^namespace\s+(\S+)\s*\{$/);
    if (nsMatch) {
      currentNamespace = { name: nsMatch[1], classIds: [] };
      continue;
    }
    if (line === "}" && currentNamespace) {
      diagram.namespaces.push(currentNamespace), currentNamespace = null;
      continue;
    }
    let classBlockMatch = line.match(/^class\s+(\S+?)(?:\s*~(\w+)~)?\s*\{$/);
    if (classBlockMatch) {
      let id = classBlockMatch[1], generic = classBlockMatch[2], cls = ensureClass(classMap, id);
      generic && (cls.label = `${id}<${generic}>`), currentClass = cls, braceDepth = 1, currentNamespace && currentNamespace.classIds.push(id);
      continue;
    }
    let classOnlyMatch = line.match(/^class\s+(\S+?)(?:\s*~(\w+)~)?\s*$/);
    if (classOnlyMatch) {
      let id = classOnlyMatch[1], generic = classOnlyMatch[2], cls = ensureClass(classMap, id);
      generic && (cls.label = `${id}<${generic}>`), currentNamespace && currentNamespace.classIds.push(id);
      continue;
    }
    let inlineAnnotMatch = line.match(/^class\s+(\S+?)\s*\{\s*<<(\w+)>>\s*\}$/);
    if (inlineAnnotMatch) {
      let cls = ensureClass(classMap, inlineAnnotMatch[1]);
      cls.annotation = inlineAnnotMatch[2];
      continue;
    }
    let inlineAttrMatch = line.match(/^(\S+?)\s*:\s*(.+)$/);
    if (inlineAttrMatch) {
      let rest = inlineAttrMatch[2];
      if (!rest.match(/<\|--|--|\*--|o--|-->|\.\.>|\.\.\|>/)) {
        let cls = ensureClass(classMap, inlineAttrMatch[1]), member = parseMember(rest);
        member && (member.isMethod ? cls.methods.push(member.member) : cls.attributes.push(member.member));
        continue;
      }
    }
    let rel = parseRelationship(line);
    if (rel) {
      ensureClass(classMap, rel.from), ensureClass(classMap, rel.to), diagram.relationships.push(rel);
      continue;
    }
  }
  return diagram.classes = [...classMap.values()], diagram;
}
function ensureClass(classMap, id) {
  let cls = classMap.get(id);
  return cls || (cls = { id, label: id, attributes: [], methods: [] }, classMap.set(id, cls)), cls;
}
function parseMember(line) {
  let trimmed = line.trim().replace(/;$/, "");
  if (!trimmed) return null;
  let visibility = "", rest = trimmed;
  /^[+\-#~]/.test(rest) && (visibility = rest[0], rest = rest.slice(1).trim());
  let methodMatch = rest.match(/^(.+?)\(([^)]*)\)(?:\s*(.+))?$/);
  if (methodMatch) {
    let name2 = methodMatch[1].trim(), params = methodMatch[2]?.trim() || void 0, type2 = methodMatch[3]?.trim(), isStatic2 = name2.endsWith("$") || rest.includes("$"), isAbstract2 = name2.endsWith("*") || rest.includes("*");
    return { member: { visibility, name: name2.replace(/[$*]$/, ""), type: type2 || void 0, isStatic: isStatic2, isAbstract: isAbstract2, isMethod: true, params }, isMethod: true };
  }
  let parts = rest.split(/\s+/), name, type;
  parts.length >= 2 ? (type = parts[0], name = parts.slice(1).join(" ")) : name = parts[0] ?? rest;
  let isStatic = name.endsWith("$"), isAbstract = name.endsWith("*");
  return { member: { visibility, name: name.replace(/[$*]$/, ""), type: type || void 0, isStatic, isAbstract, isMethod: false }, isMethod: false };
}
function parseRelationship(line) {
  let match = line.match(/^(\S+?)\s+(?:"([^"]*?)"\s+)?(<\|--|<\|\.\.|\*--|o--|-->|--\*|--o|--\|>|\.\.>|\.\.\|>|<--|<\.\.?|--)\s+(?:"([^"]*?)"\s+)?(\S+?)(?:\s*:\s*(.+))?$/);
  if (!match) return null;
  let from = match[1], rawFromCardinality = match[2], fromCardinality = rawFromCardinality ? normalizeBrTags(rawFromCardinality) : void 0, arrow = match[3].trim(), rawToCardinality = match[4], toCardinality = rawToCardinality ? normalizeBrTags(rawToCardinality) : void 0, to = match[5], rawLabel = match[6]?.trim(), label = rawLabel ? normalizeBrTags(rawLabel) : void 0, parsed = parseArrow(arrow);
  return parsed ? { from, to, type: parsed.type, markerAt: parsed.markerAt, label, fromCardinality, toCardinality } : null;
}
function parseArrow(arrow) {
  switch (arrow.trim()) {
    case "<|--":
      return { type: "inheritance", markerAt: "from" };
    case "--|>":
      return { type: "inheritance", markerAt: "to" };
    case "<|..":
      return { type: "realization", markerAt: "from" };
    case "..|>":
      return { type: "realization", markerAt: "to" };
    case "*--":
      return { type: "composition", markerAt: "from" };
    case "--*":
      return { type: "composition", markerAt: "to" };
    case "o--":
      return { type: "aggregation", markerAt: "from" };
    case "--o":
      return { type: "aggregation", markerAt: "to" };
    case "-->":
      return { type: "association", markerAt: "to" };
    case "<--":
      return { type: "association", markerAt: "from" };
    case "..>":
      return { type: "dependency", markerAt: "to" };
    case "<..":
      return { type: "dependency", markerAt: "from" };
    case "--":
      return { type: "association", markerAt: "to" };
    default:
      return null;
  }
}
function classifyBoxChar(ch) {
  return /^[┌┐└┘├┤┬┴┼│─╭╮╰╯+\-|]$/.test(ch) ? "border" : "text";
}
function formatMember(m) {
  let vis = m.visibility || "", type = m.type ? `: ${m.type}` : "";
  return `${vis}${m.name}${type}`;
}
function buildClassSections(cls) {
  let header = [];
  cls.annotation && header.push(`<<${cls.annotation}>>`);
  let nameLines = splitLines(cls.label);
  header.push(...nameLines);
  let attrs = cls.attributes.map(formatMember), methods = cls.methods.map(formatMember);
  return attrs.length === 0 && methods.length === 0 ? [header] : methods.length === 0 ? [header, attrs] : [header, attrs, methods];
}
function getRelMarker(type, markerAt) {
  return { type, markerAt, dashed: type === "dependency" || type === "realization" };
}
function getMarkerShape(type, useAscii, direction) {
  switch (type) {
    case "inheritance":
    case "realization":
      return direction === "down" ? useAscii ? "^" : "\u25B3" : direction === "up" ? useAscii ? "v" : "\u25BD" : direction === "left" ? useAscii ? ">" : "\u25C1" : useAscii ? "<" : "\u25B7";
    case "composition":
      return useAscii ? "*" : "\u25C6";
    case "aggregation":
      return useAscii ? "o" : "\u25C7";
    case "association":
    case "dependency":
      return direction === "down" ? useAscii ? "v" : "\u25BC" : direction === "up" ? useAscii ? "^" : "\u25B2" : direction === "left" ? useAscii ? "<" : "\u25C0" : useAscii ? ">" : "\u25B6";
  }
}
function renderClassAscii(text2, config, colorMode, theme) {
  let lines2 = text2.split(`
`).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("%%")), diagram = parseClassDiagram(lines2);
  if (diagram.classes.length === 0) return "";
  let useAscii = config.useAscii, hGap = 4, vGap = 3, classSections = /* @__PURE__ */ new Map(), classBoxW = /* @__PURE__ */ new Map(), classBoxH = /* @__PURE__ */ new Map();
  for (let cls of diagram.classes) {
    let sections = buildClassSections(cls);
    classSections.set(cls.id, sections);
    let maxTextW = 0;
    for (let section of sections) for (let line of section) maxTextW = Math.max(maxTextW, line.length);
    let boxW = maxTextW + 4, totalLines = 0;
    for (let section of sections) totalLines += Math.max(section.length, 1);
    let boxH = totalLines + (sections.length - 1) + 2;
    classBoxW.set(cls.id, boxW), classBoxH.set(cls.id, boxH);
  }
  let classById = /* @__PURE__ */ new Map();
  for (let cls of diagram.classes) classById.set(cls.id, cls);
  let parents = /* @__PURE__ */ new Map(), children = /* @__PURE__ */ new Map();
  for (let rel of diagram.relationships) {
    let isHierarchical = rel.type === "inheritance" || rel.type === "realization", parentId = isHierarchical && rel.markerAt === "to" ? rel.to : rel.from, childId = isHierarchical && rel.markerAt === "to" ? rel.from : rel.to;
    parents.has(childId) || parents.set(childId, /* @__PURE__ */ new Set()), parents.get(childId).add(parentId), children.has(parentId) || children.set(parentId, /* @__PURE__ */ new Set()), children.get(parentId).add(childId);
  }
  let level = /* @__PURE__ */ new Map(), queue = diagram.classes.filter((c) => !parents.has(c.id) || parents.get(c.id).size === 0).map((c) => c.id);
  for (let id of queue) level.set(id, 0);
  let levelCap = diagram.classes.length - 1, qi = 0;
  for (; qi < queue.length; ) {
    let id = queue[qi++], childSet = children.get(id);
    if (childSet) for (let childId of childSet) {
      let newLevel = (level.get(id) ?? 0) + 1;
      newLevel > levelCap || (!level.has(childId) || level.get(childId) < newLevel) && (level.set(childId, newLevel), queue.push(childId));
    }
  }
  for (let cls of diagram.classes) level.has(cls.id) || level.set(cls.id, 0);
  let maxLevel = Math.max(...level.values(), 0), levelGroups = Array.from({ length: maxLevel + 1 }, () => []);
  for (let cls of diagram.classes) levelGroups[level.get(cls.id)].push(cls.id);
  let placed = /* @__PURE__ */ new Map(), currentY = 0;
  for (let lv = 0; lv <= maxLevel; lv++) {
    let group = levelGroups[lv];
    if (group.length === 0) continue;
    let currentX = 0, maxH = 0;
    for (let id of group) {
      let cls = classById.get(id), w = classBoxW.get(id), h2 = classBoxH.get(id);
      placed.set(id, { cls, sections: classSections.get(id), x: currentX, y: currentY, width: w, height: h2 }), currentX += w + hGap, maxH = Math.max(maxH, h2);
    }
    currentY += maxH + vGap;
  }
  let totalW = 0, totalH = 0;
  for (let p of placed.values()) totalW = Math.max(totalW, p.x + p.width), totalH = Math.max(totalH, p.y + p.height);
  totalW += 4, totalH += 2;
  let canvas = mkCanvas(totalW - 1, totalH - 1), rc = mkRoleCanvas(totalW - 1, totalH - 1);
  function setC(x, y, ch, role) {
    x >= 0 && x < canvas.length && y >= 0 && y < (canvas[0]?.length ?? 0) && (canvas[x][y] = ch, setRole(rc, x, y, role));
  }
  for (let p of placed.values()) {
    let boxCanvas = drawMultiBox(p.sections, useAscii);
    for (let bx = 0; bx < boxCanvas.length; bx++) for (let by = 0; by < boxCanvas[0].length; by++) {
      let ch = boxCanvas[bx][by];
      if (ch !== " ") {
        let cx = p.x + bx, cy = p.y + by;
        cx < totalW && cy < totalH && setC(cx, cy, ch, classifyBoxChar(ch));
      }
    }
  }
  let boxOccupancy = [];
  for (let p of placed.values()) boxOccupancy.push({ x1: p.x, x2: p.x + p.width - 1, y1: p.y, y2: p.y + p.height - 1 });
  function isInsideBox(x, y, excludeIds) {
    for (let [id, p] of placed.entries()) if (!excludeIds?.has(id) && x >= p.x && x <= p.x + p.width - 1 && y >= p.y && y <= p.y + p.height - 1) return true;
    return false;
  }
  function findClearColumn(startX, y1, y2, excludeIds) {
    let clear = true;
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) if (isInsideBox(startX, y, excludeIds)) {
      clear = false;
      break;
    }
    if (clear) return startX;
    for (let offset = 1; offset < totalW + 10; offset++) {
      let rightX = startX + offset;
      clear = true;
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) if (isInsideBox(rightX, y, excludeIds)) {
        clear = false;
        break;
      }
      if (clear) return rightX;
      let leftX = startX - offset;
      if (leftX >= 0) {
        clear = true;
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) if (isInsideBox(leftX, y, excludeIds)) {
          clear = false;
          break;
        }
        if (clear) return leftX;
      }
    }
    return totalW + 2;
  }
  let H = useAscii ? "-" : "\u2500", V = useAscii ? "|" : "\u2502", dashH = useAscii ? "." : "\u254C", dashV = useAscii ? ":" : "\u250A";
  for (let rel of diagram.relationships) {
    let fromP = placed.get(rel.from), toP = placed.get(rel.to);
    if (!fromP || !toP) continue;
    let marker = getRelMarker(rel.type, rel.markerAt), lineH = marker.dashed ? dashH : H, lineV = marker.dashed ? dashV : V, excludeIds = /* @__PURE__ */ new Set([rel.from, rel.to]), fromCX = fromP.x + Math.floor(fromP.width / 2), fromBY = fromP.y + fromP.height - 1, toCX = toP.x + Math.floor(toP.width / 2), toTY = toP.y;
    if (fromBY < toTY) {
      let routeX = findClearColumn(fromCX, fromBY + 1, toTY - 1, excludeIds), needsDetour = routeX !== fromCX;
      if (routeX >= totalW && increaseSize(canvas, routeX + 2, totalH), needsDetour) {
        let exitY = fromBY + 1, entryY = toTY - 1, lx1 = Math.min(fromCX, routeX), rx1 = Math.max(fromCX, routeX);
        for (let x = lx1; x <= rx1; x++) setC(x, exitY, lineH, "line");
        !useAscii && exitY < (canvas[0]?.length ?? 0) && (fromCX < routeX ? (setC(fromCX, exitY, "\u2514", "corner"), setC(routeX, exitY, "\u2510", "corner")) : (setC(fromCX, exitY, "\u2518", "corner"), setC(routeX, exitY, "\u250C", "corner")));
        for (let y = exitY + 1; y <= entryY; y++) setC(routeX, y, lineV, "line");
        if (routeX !== toCX) {
          let lx2 = Math.min(routeX, toCX), rx2 = Math.max(routeX, toCX);
          for (let x = lx2; x <= rx2; x++) setC(x, entryY, lineH, "line");
          !useAscii && entryY < (canvas[0]?.length ?? 0) && (routeX < toCX ? (setC(routeX, entryY, "\u2514", "corner"), setC(toCX, entryY, "\u2510", "corner")) : (setC(routeX, entryY, "\u2518", "corner"), setC(toCX, entryY, "\u250C", "corner")));
        }
        if (marker.markerAt === "to") {
          let markerChar = getMarkerShape(marker.type, useAscii, "down");
          setC(toCX, entryY, markerChar, "arrow");
        }
        if (marker.markerAt === "from") {
          let markerChar = getMarkerShape(marker.type, useAscii, "down");
          setC(fromCX, fromBY + 1, markerChar, "arrow");
        }
      } else {
        let midY = fromBY + Math.floor((toTY - fromBY) / 2);
        for (let y = fromBY + 1; y <= midY; y++) setC(fromCX, y, lineV, "line");
        if (fromCX !== toCX && midY < (canvas[0]?.length ?? 0)) {
          let lx = Math.min(fromCX, toCX), rx = Math.max(fromCX, toCX);
          for (let x = lx; x <= rx; x++) setC(x, midY, lineH, "line");
          useAscii || (setC(fromCX, midY, fromCX < toCX ? "\u2514" : "\u2518", "corner"), setC(toCX, midY, fromCX < toCX ? "\u2510" : "\u250C", "corner"));
        }
        for (let y = midY + 1; y < toTY; y++) setC(toCX, y, lineV, "line");
        marker.markerAt === "to" && setC(toCX, toTY - 1, getMarkerShape(marker.type, useAscii, "down"), "arrow"), marker.markerAt === "from" && setC(fromCX, fromBY + 1, getMarkerShape(marker.type, useAscii, "down"), "arrow");
      }
    } else if (toP.y + toP.height - 1 < fromP.y) {
      let fromTY = fromP.y, toBY = toP.y + toP.height - 1, midY = toBY + Math.floor((fromTY - toBY) / 2);
      for (let y = fromTY - 1; y >= midY; y--) setC(fromCX, y, lineV, "line");
      if (fromCX !== toCX) {
        let lx = Math.min(fromCX, toCX), rx = Math.max(fromCX, toCX);
        for (let x = lx; x <= rx; x++) setC(x, midY, lineH, "line");
        !useAscii && midY >= 0 && midY < totalH && (setC(fromCX, midY, fromCX < toCX ? "\u250C" : "\u2510", "corner"), setC(toCX, midY, fromCX < toCX ? "\u2518" : "\u2514", "corner"));
      }
      for (let y = midY - 1; y > toBY; y--) setC(toCX, y, lineV, "line");
      if (marker.markerAt === "from") {
        let markerChar = getMarkerShape(marker.type, useAscii, "up"), my = fromTY - 1;
        for (let i = 0; i < markerChar.length; i++) setC(fromCX - Math.floor(markerChar.length / 2) + i, my, markerChar[i], "arrow");
      }
      if (marker.markerAt === "to") {
        let markerDir = marker.type === "inheritance" || marker.type === "realization" ? "down" : "up", markerChar = getMarkerShape(marker.type, useAscii, markerDir), my = toBY + 1;
        for (let i = 0; i < markerChar.length; i++) setC(toCX - Math.floor(markerChar.length / 2) + i, my, markerChar[i], "arrow");
      }
    } else {
      let detourY = Math.max(fromBY, toP.y + toP.height - 1) + 2;
      increaseSize(canvas, totalW, detourY + 1), increaseRoleCanvasSize(rc, totalW, detourY + 1);
      for (let y = fromBY + 1; y <= detourY; y++) setC(fromCX, y, lineV, "line");
      let lx = Math.min(fromCX, toCX), rx = Math.max(fromCX, toCX);
      for (let x = lx; x <= rx; x++) setC(x, detourY, lineH, "line");
      for (let y = detourY - 1; y >= toP.y + toP.height; y--) setC(toCX, y, lineV, "line");
      if (marker.markerAt === "from") {
        let markerChar = getMarkerShape(marker.type, useAscii, "down"), my = fromBY + 1;
        for (let i = 0; i < markerChar.length; i++) setC(fromCX - Math.floor(markerChar.length / 2) + i, my, markerChar[i], "arrow");
      }
      if (marker.markerAt === "to") {
        let markerChar = getMarkerShape(marker.type, useAscii, "up"), my = toP.y + toP.height;
        for (let i = 0; i < markerChar.length; i++) setC(toCX - Math.floor(markerChar.length / 2) + i, my, markerChar[i], "arrow");
      }
    }
    if (rel.label) {
      let lines22 = splitLines(rel.label), maxLabelWidth = Math.max(...lines22.map((l) => l.length)) + 2, baseMidY, idealMidX;
      if (fromBY < toTY) baseMidY = Math.floor((fromBY + 1 + toTY - 1) / 2), idealMidX = Math.floor((fromCX + toCX) / 2);
      else if (toP.y + toP.height - 1 < fromP.y) {
        let toBY = toP.y + toP.height - 1;
        baseMidY = Math.floor((toBY + 1 + fromP.y - 1) / 2), idealMidX = Math.floor((fromCX + toCX) / 2);
      } else baseMidY = Math.max(fromBY, toP.y + toP.height - 1) + 2, idealMidX = Math.floor((fromCX + toCX) / 2);
      let labelY = baseMidY, halfHeight = Math.floor(lines22.length / 2), labelInBox = false;
      for (let i = 0; i < lines22.length; i++) {
        let y = labelY - halfHeight + i, idealLabelStart = idealMidX - Math.floor(maxLabelWidth / 2), labelStart = Math.max(0, idealLabelStart);
        for (let x = labelStart; x < labelStart + maxLabelWidth; x++) if (isInsideBox(x, y, excludeIds)) {
          labelInBox = true;
          break;
        }
        if (labelInBox) break;
      }
      if (labelInBox) {
        let gapTop = fromBY + 1, gapBottom = toTY - 1;
        for (let y = gapTop; y <= gapBottom; y++) {
          let clearRow = true, idealLabelStart = idealMidX - Math.floor(maxLabelWidth / 2), labelStart = Math.max(0, idealLabelStart);
          for (let x = labelStart; x < labelStart + maxLabelWidth; x++) if (isInsideBox(x, y, excludeIds)) {
            clearRow = false;
            break;
          }
          if (clearRow) {
            labelY = y;
            break;
          }
        }
      }
      let startY = labelY - halfHeight;
      for (let lineIdx = 0; lineIdx < lines22.length; lineIdx++) {
        let paddedLine = ` ${lines22[lineIdx]} `, idealLabelStart = idealMidX - Math.floor(paddedLine.length / 2), labelStart = Math.max(0, idealLabelStart), y = startY + lineIdx, labelEnd = labelStart + paddedLine.length;
        labelEnd > 0 && y >= 0 && (increaseSize(canvas, Math.max(labelEnd, 1), Math.max(y + 1, 1)), increaseRoleCanvasSize(rc, Math.max(labelEnd, 1), Math.max(y + 1, 1)));
        for (let i = 0; i < paddedLine.length; i++) {
          let lx = labelStart + i;
          lx >= 0 && y >= 0 && setC(lx, y, paddedLine[i], "text");
        }
      }
    }
  }
  return canvasToString(canvas, { roleCanvas: rc, colorMode, theme });
}
function parseErDiagram(lines2) {
  let diagram = { entities: [], relationships: [] }, entityMap = /* @__PURE__ */ new Map(), currentEntity = null;
  for (let i = 1; i < lines2.length; i++) {
    let line = lines2[i];
    if (currentEntity) {
      if (line === "}") {
        currentEntity = null;
        continue;
      }
      let attr = parseAttribute(line);
      attr && currentEntity.attributes.push(attr);
      continue;
    }
    let entityBlockMatch = line.match(/^(\S+)\s*\{$/);
    if (entityBlockMatch) {
      let id = entityBlockMatch[1];
      currentEntity = ensureEntity(entityMap, id);
      continue;
    }
    let rel = parseRelationshipLine(line);
    if (rel) {
      ensureEntity(entityMap, rel.entity1), ensureEntity(entityMap, rel.entity2), diagram.relationships.push(rel);
      continue;
    }
  }
  return diagram.entities = [...entityMap.values()], diagram;
}
function ensureEntity(entityMap, id) {
  let entity = entityMap.get(id);
  return entity || (entity = { id, label: id, attributes: [] }, entityMap.set(id, entity)), entity;
}
function parseAttribute(line) {
  let match = line.match(/^(\S+)\s+(\S+)(?:\s+(.+))?$/);
  if (!match) return null;
  let type = match[1], name = match[2], rest = match[3]?.trim() ?? "", keys = [], comment, commentMatch = rest.match(/"([^"]*)"/);
  commentMatch && (comment = normalizeBrTags(commentMatch[1]));
  let restWithoutComment = rest.replace(/"[^"]*"/, "").trim();
  for (let part of restWithoutComment.split(/\s+/)) {
    let upper = part.toUpperCase();
    (upper === "PK" || upper === "FK" || upper === "UK") && keys.push(upper);
  }
  return { type, name, keys, comment };
}
function parseRelationshipLine(line) {
  let match = line.match(/^(\S+)\s+([|o}{]+(?:--|\.\.)[|o}{]+)\s+(\S+)\s*:\s*(.+)$/);
  if (!match) return null;
  let entity1 = match[1], cardinalityStr = match[2], entity2 = match[3], rawLabel = match[4].trim().replace(/^["']|["']$/g, ""), label = normalizeBrTags(rawLabel), lineMatch = cardinalityStr.match(/^([|o}{]+)(--|\.\.?)([|o}{]+)$/);
  if (!lineMatch) return null;
  let leftStr = lineMatch[1], lineStyle = lineMatch[2], rightStr = lineMatch[3], cardinality1 = parseCardinality(leftStr), cardinality2 = parseCardinality(rightStr), identifying = lineStyle === "--";
  return !cardinality1 || !cardinality2 ? null : { entity1, entity2, cardinality1, cardinality2, label, identifying };
}
function parseCardinality(str) {
  let sorted = str.split("").sort().join("");
  return sorted === "||" ? "one" : sorted === "o|" ? "zero-one" : sorted === "|}" || sorted === "{|" ? "many" : sorted === "{o" || sorted === "o{" ? "zero-many" : null;
}
function classifyBoxChar2(ch) {
  return /^[┌┐└┘├┤┬┴┼│─╭╮╰╯+\-|]$/.test(ch) ? "border" : "text";
}
function formatAttribute(attr) {
  return `${attr.keys.length > 0 ? attr.keys.join(",") + " " : "   "}${attr.type} ${attr.name}`;
}
function buildEntitySections(entity) {
  let header = splitLines(entity.label), attrs = entity.attributes.map(formatAttribute);
  return attrs.length === 0 ? [header] : [header, attrs];
}
function getCrowsFootChars(card, useAscii, isRight = false) {
  if (useAscii) switch (card) {
    case "one":
      return "|";
    case "zero-one":
      return "o|";
    case "many":
      return isRight ? "<" : ">";
    case "zero-many":
      return isRight ? "o<" : ">o";
  }
  else switch (card) {
    case "one":
      return "\u2502";
    case "zero-one":
      return "\u25CB\u2502";
    case "many":
      return isRight ? "\u255F" : "\u2562";
    case "zero-many":
      return isRight ? "\u25CB\u255F" : "\u2562\u25CB";
  }
}
function findConnectedComponents(diagram) {
  let visited = /* @__PURE__ */ new Set(), components = [], neighbors = /* @__PURE__ */ new Map();
  for (let ent of diagram.entities) neighbors.set(ent.id, /* @__PURE__ */ new Set());
  for (let rel of diagram.relationships) neighbors.get(rel.entity1)?.add(rel.entity2), neighbors.get(rel.entity2)?.add(rel.entity1);
  function dfs(startId, component) {
    let stack = [startId];
    for (; stack.length > 0; ) {
      let nodeId = stack.pop();
      if (!visited.has(nodeId)) {
        visited.add(nodeId), component.add(nodeId);
        for (let neighbor of neighbors.get(nodeId) ?? []) visited.has(neighbor) || stack.push(neighbor);
      }
    }
  }
  for (let ent of diagram.entities) if (!visited.has(ent.id)) {
    let component = /* @__PURE__ */ new Set();
    dfs(ent.id, component), component.size > 0 && components.push(component);
  }
  return components;
}
function renderErAscii(text2, config, colorMode, theme) {
  let lines2 = text2.split(`
`).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("%%")), diagram = parseErDiagram(lines2);
  if (diagram.entities.length === 0) return "";
  let useAscii = config.useAscii, hGap = 6, vGap = 4, componentGap = 6, entitySections = /* @__PURE__ */ new Map(), entityBoxW = /* @__PURE__ */ new Map(), entityBoxH = /* @__PURE__ */ new Map(), entityById = /* @__PURE__ */ new Map();
  for (let ent of diagram.entities) {
    entityById.set(ent.id, ent);
    let sections = buildEntitySections(ent);
    entitySections.set(ent.id, sections);
    let maxTextW = 0;
    for (let section of sections) for (let line of section) maxTextW = Math.max(maxTextW, line.length);
    let boxW = maxTextW + 4, totalLines = 0;
    for (let section of sections) totalLines += Math.max(section.length, 1);
    let boxH = totalLines + (sections.length - 1) + 2;
    entityBoxW.set(ent.id, boxW), entityBoxH.set(ent.id, boxH);
  }
  let components = findConnectedComponents(diagram), placed = /* @__PURE__ */ new Map(), currentY = 0;
  for (let component of components) {
    let componentEntities = diagram.entities.filter((e) => component.has(e.id)), maxPerRow = Math.max(2, Math.ceil(Math.sqrt(componentEntities.length))), currentX = 0, maxRowH = 0, colCount = 0, componentStartY = currentY;
    for (let ent of componentEntities) {
      let w = entityBoxW.get(ent.id), h2 = entityBoxH.get(ent.id);
      colCount >= maxPerRow && (currentY += maxRowH + vGap, currentX = 0, maxRowH = 0, colCount = 0), placed.set(ent.id, { entity: ent, sections: entitySections.get(ent.id), x: currentX, y: currentY, width: w, height: h2 }), currentX += w + hGap, maxRowH = Math.max(maxRowH, h2), colCount++;
    }
    currentY += maxRowH + componentGap;
  }
  let totalW = 0, totalH = 0;
  for (let p of placed.values()) totalW = Math.max(totalW, p.x + p.width), totalH = Math.max(totalH, p.y + p.height);
  totalW += 4, totalH += 2;
  let canvas = mkCanvas(totalW - 1, totalH - 1), rc = mkRoleCanvas(totalW - 1, totalH - 1);
  function setC(x, y, ch, role) {
    x >= 0 && x < canvas.length && y >= 0 && y < (canvas[0]?.length ?? 0) && (canvas[x][y] = ch, setRole(rc, x, y, role));
  }
  for (let p of placed.values()) {
    let boxCanvas = drawMultiBox(p.sections, useAscii);
    for (let bx = 0; bx < boxCanvas.length; bx++) for (let by = 0; by < boxCanvas[0].length; by++) {
      let ch = boxCanvas[bx][by];
      if (ch !== " ") {
        let cx = p.x + bx, cy = p.y + by;
        cx < totalW && cy < totalH && setC(cx, cy, ch, classifyBoxChar2(ch));
      }
    }
  }
  let H = useAscii ? "-" : "\u2500", V = useAscii ? "|" : "\u2502", dashH = useAscii ? "." : "\u254C", dashV = useAscii ? ":" : "\u250A";
  for (let rel of diagram.relationships) {
    let e1 = placed.get(rel.entity1), e2 = placed.get(rel.entity2);
    if (!e1 || !e2) continue;
    let lineH = rel.identifying ? H : dashH, lineV = rel.identifying ? V : dashV, e1CX = e1.x + Math.floor(e1.width / 2), e1CY = e1.y + Math.floor(e1.height / 2), e2CX = e2.x + Math.floor(e2.width / 2), e2CY = e2.y + Math.floor(e2.height / 2);
    if (Math.abs(e1CY - e2CY) < Math.max(e1.height, e2.height)) {
      let [left, right] = e1CX < e2CX ? [e1, e2] : [e2, e1], [leftCard, rightCard] = e1CX < e2CX ? [rel.cardinality1, rel.cardinality2] : [rel.cardinality2, rel.cardinality1], startX = left.x + left.width, endX = right.x - 1, lineY = left.y + Math.floor(left.height / 2);
      for (let x = startX; x <= endX; x++) setC(x, lineY, lineH, "line");
      let leftChars = getCrowsFootChars(leftCard, useAscii, false);
      for (let i = 0; i < leftChars.length; i++) setC(startX + i, lineY, leftChars[i], "arrow");
      let rightChars = getCrowsFootChars(rightCard, useAscii, true);
      for (let i = 0; i < rightChars.length; i++) setC(endX - rightChars.length + 1 + i, lineY, rightChars[i], "arrow");
      if (rel.label) {
        let lines22 = splitLines(rel.label), gapMid = Math.floor((startX + endX) / 2);
        for (let lineIdx = 0; lineIdx < lines22.length; lineIdx++) {
          let line = lines22[lineIdx], labelStart = Math.max(startX, gapMid - Math.floor(line.length / 2)), labelY = lineY + 1 + lineIdx;
          increaseSize(canvas, Math.max(labelStart + line.length, 1), Math.max(labelY + 1, 1)), increaseRoleCanvasSize(rc, Math.max(labelStart + line.length, 1), Math.max(labelY + 1, 1));
          for (let i = 0; i < line.length; i++) {
            let lx = labelStart + i;
            lx >= startX && lx <= endX && setC(lx, labelY, line[i], "text");
          }
        }
      }
    } else {
      let [upper, lower] = e1CY < e2CY ? [e1, e2] : [e2, e1], [upperCard, lowerCard] = e1CY < e2CY ? [rel.cardinality1, rel.cardinality2] : [rel.cardinality2, rel.cardinality1], startY = upper.y + upper.height, endY = lower.y - 1, lineX = upper.x + Math.floor(upper.width / 2);
      for (let y = startY; y <= endY; y++) setC(lineX, y, lineV, "line");
      let lowerCX = lower.x + Math.floor(lower.width / 2);
      if (lineX !== lowerCX) {
        let midY = Math.floor((startY + endY) / 2), lx = Math.min(lineX, lowerCX), rx = Math.max(lineX, lowerCX);
        for (let x = lx; x <= rx; x++) setC(x, midY, lineH, "line");
        for (let y = midY + 1; y <= endY; y++) setC(lowerCX, y, lineV, "line");
      }
      let upperChars = getCrowsFootChars(upperCard, useAscii, false);
      for (let i = 0; i < upperChars.length; i++) setC(lineX - Math.floor(upperChars.length / 2) + i, startY, upperChars[i], "arrow");
      let targetX = lineX !== lowerCX ? lowerCX : lineX, lowerChars = getCrowsFootChars(lowerCard, useAscii, true);
      for (let i = 0; i < lowerChars.length; i++) setC(targetX - Math.floor(lowerChars.length / 2) + i, endY, lowerChars[i], "arrow");
      if (rel.label) {
        let lines22 = splitLines(rel.label), startLabelY = Math.floor((startY + endY) / 2) - Math.floor((lines22.length - 1) / 2);
        for (let lineIdx = 0; lineIdx < lines22.length; lineIdx++) {
          let line = lines22[lineIdx], labelX = lineX + 2, y = startLabelY + lineIdx;
          if (y >= 0) for (let i = 0; i < line.length; i++) {
            let lx = labelX + i;
            lx >= 0 && (increaseSize(canvas, lx + 1, y + 1), increaseRoleCanvasSize(rc, lx + 1, y + 1), setC(lx, y, line[i], "text"));
          }
        }
      }
    }
  }
  return canvasToString(canvas, { roleCanvas: rc, colorMode, theme });
}
function parseXYChart(lines2) {
  let xAxis = {}, yAxis = {}, series = [], title, horizontal = false;
  for (let line of lines2) {
    if (/^xychart(-beta)?\b/i.test(line)) {
      /\bhorizontal\b/i.test(line) && (horizontal = true);
      continue;
    }
    let titleMatch = line.match(/^title\s+"([^"]+)"/);
    if (titleMatch) {
      title = titleMatch[1];
      continue;
    }
    let xCatMatch = line.match(/^x-axis\s+(?:"([^"]*)"\s*)?\[([^\]]+)\]/);
    if (xCatMatch) {
      xCatMatch[1] && (xAxis.title = xCatMatch[1]), xAxis.categories = xCatMatch[2].split(",").map((s) => s.trim());
      continue;
    }
    let xRangeMatch = line.match(/^x-axis\s+(?:"([^"]*)"\s+)?(-?\d+(?:\.\d+)?)\s*-->\s*(-?\d+(?:\.\d+)?)/);
    if (xRangeMatch) {
      xRangeMatch[1] && (xAxis.title = xRangeMatch[1]), xAxis.range = { min: parseFloat(xRangeMatch[2]), max: parseFloat(xRangeMatch[3]) };
      continue;
    }
    let yRangeMatch = line.match(/^y-axis\s+(?:"([^"]*)"\s+)?(-?\d+(?:\.\d+)?)\s*-->\s*(-?\d+(?:\.\d+)?)/);
    if (yRangeMatch) {
      yRangeMatch[1] && (yAxis.title = yRangeMatch[1]), yAxis.range = { min: parseFloat(yRangeMatch[2]), max: parseFloat(yRangeMatch[3]) };
      continue;
    }
    let yTitleOnly = line.match(/^y-axis\s+"([^"]+)"\s*$/);
    if (yTitleOnly) {
      yAxis.title = yTitleOnly[1];
      continue;
    }
    let barMatch = line.match(/^bar\s+\[([^\]]+)\]/);
    if (barMatch) {
      series.push({ type: "bar", data: parseNumericArray(barMatch[1]) });
      continue;
    }
    let lineMatch = line.match(/^line\s+\[([^\]]+)\]/);
    if (lineMatch) {
      series.push({ type: "line", data: parseNumericArray(lineMatch[1]) });
      continue;
    }
  }
  if (!yAxis.range && series.length > 0) {
    let allValues = series.flatMap((s) => s.data), min = Math.min(...allValues), max = Math.max(...allValues), span = max - min || 1;
    min = min - span * 0.1, max = max + span * 0.1, min > 0 && min < span * 0.5 && (min = 0), yAxis.range = { min, max };
  }
  return yAxis.range || (yAxis.range = { min: 0, max: 100 }), { title, horizontal, xAxis, yAxis, series };
}
function parseNumericArray(str) {
  return str.split(",").map((s) => parseFloat(s.trim()));
}
var CHART_ACCENT_FALLBACK = "#3b82f6";
function hexToHsl(hex) {
  let h2 = hex.replace("#", ""), ri = parseInt(h2.substring(0, 2), 16) / 255, gi = parseInt(h2.substring(2, 4), 16) / 255, bi = parseInt(h2.substring(4, 6), 16) / 255, max = Math.max(ri, gi, bi), min = Math.min(ri, gi, bi), l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  let d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min), hue;
  return max === ri ? hue = ((gi - bi) / d + (gi < bi ? 6 : 0)) / 6 : max === gi ? hue = ((bi - ri) / d + 2) / 6 : hue = ((ri - gi) / d + 4) / 6, [hue * 360, s * 100, l * 100];
}
function hslToHex(h2, s, l) {
  let si = s / 100, li = l / 100, c = (1 - Math.abs(2 * li - 1)) * si, x = c * (1 - Math.abs(h2 / 60 % 2 - 1)), m = li - c / 2, r, g, b;
  h2 < 60 ? (r = c, g = x, b = 0) : h2 < 120 ? (r = x, g = c, b = 0) : h2 < 180 ? (r = 0, g = c, b = x) : h2 < 240 ? (r = 0, g = x, b = c) : h2 < 300 ? (r = x, g = 0, b = c) : (r = c, g = 0, b = x);
  let toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function isValidHex(color) {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}
function isDarkBackground(bgHex) {
  return hexToHsl(bgHex)[2] < 50;
}
function getSeriesColor(index, accentColor, bgColor) {
  if (index === 0) return accentColor;
  let safeAccent = isValidHex(accentColor) ? accentColor : CHART_ACCENT_FALLBACK, safeBg = bgColor && isValidHex(bgColor) ? bgColor : void 0, [h2, s] = hexToHsl(safeAccent), chartS = Math.max(55, Math.min(85, s)), tier = Math.ceil(index / 2), oddIndex = index % 2 === 1, dark = safeBg && isDarkBackground(safeBg) ? !oddIndex : oddIndex, l = dark ? Math.max(25, 48 - tier * 13) : Math.min(78, 55 + tier * 11), hShift = (dark ? -8 : 12) * tier, newH = ((h2 + hShift) % 360 + 360) % 360;
  return hslToHex(newH, chartS, l);
}
var PLOT_WIDTH = 60;
var PLOT_HEIGHT = 20;
var UNI = { hLine: "\u2500", vLine: "\u2502", origin: "\u253C", yTick: "\u2524", xTick: "\u252C", bar: "\u2588", grid: "\xB7", cornerTL: "\u256D", cornerTR: "\u256E", cornerBL: "\u2570", cornerBR: "\u256F" };
var ASC = { hLine: "-", vLine: "|", origin: "+", yTick: "+", xTick: "+", bar: "#", grid: ".", cornerTL: "+", cornerTR: "+", cornerBL: "+", cornerBR: "+" };
function getSeriesColors(total, theme) {
  let accent = theme.accent ?? CHART_ACCENT_FALLBACK;
  return total <= 1 ? [accent] : Array.from({ length: total }, (_, i) => getSeriesColor(i, accent, theme.bg));
}
function roleToHex(role, theme) {
  switch (role) {
    case "text":
      return theme.fg;
    case "border":
      return theme.border;
    case "line":
      return theme.line;
    case "arrow":
      return theme.arrow;
    case "corner":
      return theme.corner ?? theme.line;
    case "junction":
      return theme.junction ?? theme.border;
    default:
      return theme.fg;
  }
}
function renderXYChartAscii(text2, config, colorMode, theme) {
  let lines2 = text2.split(`
`).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("%%")), chart = parseXYChart(lines2), ch = config.useAscii ? ASC : UNI;
  return chart.horizontal ? renderHorizontal(chart, ch, colorMode, theme) : renderVertical(chart, ch, colorMode, theme);
}
function renderVertical(chart, ch, colorMode, theme) {
  let dataCount = getDataCount(chart);
  if (dataCount === 0) return "";
  let yRange = chart.yAxis.range, yTicks = niceTickValues(yRange.min, yRange.max), yLabels = yTicks.map((v) => formatTickValue(v)), yGutter = Math.max(...yLabels.map((l) => l.length)) + 1, plotW = Math.max(PLOT_WIDTH, dataCount * 6), plotH = PLOT_HEIGHT, bandW = Math.floor(plotW / dataCount), catLabels = getCategoryLabels(chart, dataCount), hasTitle = !!chart.title, hasXTitle = !!chart.xAxis.title, hasLegend = chart.series.length > 1, titleRow = hasTitle ? 0 : -1, plotTop = (hasTitle ? 2 : 0) + (hasLegend ? 1 : 0), plotLeft = yGutter + 1, totalW = plotLeft + bandW * dataCount + 2, xAxisRow = plotTop + plotH, xLabelRow = xAxisRow + 1, xTitleRow = hasXTitle ? xLabelRow + 1 : -1, totalH = xLabelRow + 1 + (hasXTitle ? 1 : 0) + 0, canvas = createCanvas(totalW, totalH), roles = createRoleCanvas(totalW, totalH), hexColors = createHexCanvas(totalW, totalH), seriesColors = getSeriesColors(chart.series.length, theme), valueToRow = (v) => {
    let t = (v - yRange.min) / (yRange.max - yRange.min || 1);
    return Math.round(t * (plotH - 1));
  }, bandCenter = (i) => plotLeft + Math.floor(bandW * (i + 0.5));
  hasTitle && titleRow >= 0 && writeText(canvas, roles, titleRow, Math.floor(totalW / 2 - chart.title.length / 2), chart.title, "text"), hasLegend && drawLegend(canvas, roles, hexColors, chart, hasTitle ? 1 : 0, totalW, ch, seriesColors);
  for (let row = 0; row < plotH; row++) {
    let displayRow = plotTop + (plotH - 1 - row);
    set(canvas, roles, displayRow, plotLeft - 1, ch.vLine, "border");
  }
  set(canvas, roles, xAxisRow, plotLeft - 1, ch.origin, "border");
  for (let tick of yTicks) {
    let row = valueToRow(tick);
    if (row < 0 || row >= plotH) continue;
    let displayRow = plotTop + (plotH - 1 - row), label = formatTickValue(tick);
    set(canvas, roles, displayRow, plotLeft - 1, row === 0 ? ch.origin : ch.yTick, "border");
    let labelStart = yGutter - label.length;
    writeText(canvas, roles, displayRow, Math.max(0, labelStart), label, "text");
  }
  for (let c = plotLeft; c < plotLeft + bandW * dataCount; c++) set(canvas, roles, xAxisRow, c, ch.hLine, "border");
  for (let i = 0; i < dataCount; i++) {
    let cx = bandCenter(i);
    set(canvas, roles, xAxisRow, cx, ch.xTick, "border");
    let label = catLabels[i], labelStart = cx - Math.floor(label.length / 2);
    writeText(canvas, roles, xLabelRow, Math.max(0, labelStart), label, "text");
  }
  if (hasXTitle && xTitleRow >= 0) {
    let title = chart.xAxis.title;
    writeText(canvas, roles, xTitleRow, Math.floor(totalW / 2 - title.length / 2), title, "text");
  }
  for (let tick of yTicks) {
    let row = valueToRow(tick);
    if (row < 0 || row >= plotH) continue;
    let displayRow = plotTop + (plotH - 1 - row);
    for (let c = plotLeft; c < plotLeft + bandW * dataCount; c++) get(canvas, displayRow, c) === " " && set(canvas, roles, displayRow, c, ch.grid, "line");
  }
  let barEntries = [];
  for (let si = 0; si < chart.series.length; si++) chart.series[si].type === "bar" && barEntries.push({ data: chart.series[si].data, globalIdx: si });
  if (barEntries.length > 0) {
    let barCount = barEntries.length, usable = Math.max(1, bandW - 2), singleBarW = Math.max(1, Math.min(Math.floor(usable / barCount), 8)), groupW = singleBarW * barCount + (barCount - 1), baseRow = valueToRow(Math.max(0, yRange.min));
    for (let bIdx = 0; bIdx < barEntries.length; bIdx++) {
      let entry = barEntries[bIdx], hexColor = seriesColors[entry.globalIdx];
      for (let i = 0; i < entry.data.length; i++) {
        let bx = bandCenter(i) - Math.floor(groupW / 2) + bIdx * (singleBarW + 1), valRow = valueToRow(entry.data[i]), fromRow = Math.min(baseRow, valRow), toRow = Math.max(baseRow, valRow);
        for (let row = fromRow; row <= toRow; row++) {
          let displayRow = plotTop + (plotH - 1 - row);
          for (let c = bx; c < bx + singleBarW; c++) set(canvas, roles, displayRow, c, ch.bar, "arrow", hexColors, hexColor);
        }
      }
    }
  }
  let lineEntries = [];
  for (let si = 0; si < chart.series.length; si++) chart.series[si].type === "line" && lineEntries.push({ data: chart.series[si].data, globalIdx: si });
  for (let entry of lineEntries) {
    if (entry.data.length === 0) continue;
    let hexColor = seriesColors[entry.globalIdx];
    drawStaircaseLine(canvas, roles, entry.data, bandCenter, valueToRow, plotTop, plotH, plotLeft, bandW * dataCount, ch, hexColors, hexColor);
  }
  return canvasToString2(canvas, roles, hexColors, colorMode, theme);
}
function renderHorizontal(chart, ch, colorMode, theme) {
  let dataCount = getDataCount(chart);
  if (dataCount === 0) return "";
  let yRange = chart.yAxis.range, valueTicks = niceTickValues(yRange.min, yRange.max), catLabels = getCategoryLabels(chart, dataCount), catGutter = Math.max(...catLabels.map((l) => l.length)) + 1, plotW = Math.max(PLOT_WIDTH, 40), bandH = Math.max(2, Math.floor(PLOT_HEIGHT / dataCount)), plotH = bandH * dataCount, hasTitle = !!chart.title, hasYTitle = !!chart.yAxis.title, hasLegend = chart.series.length > 1, plotTop = (hasTitle ? 2 : 0) + (hasLegend ? 1 : 0), plotLeft = catGutter + 1, totalW = plotLeft + plotW + 2, totalH = plotTop + plotH + 2 + (hasYTitle ? 1 : 0), xAxisRow = plotTop + plotH, canvas = createCanvas(totalW, totalH), roles = createRoleCanvas(totalW, totalH), hexColors = createHexCanvas(totalW, totalH), seriesColors = getSeriesColors(chart.series.length, theme), valueToCol = (v) => {
    let t = (v - yRange.min) / (yRange.max - yRange.min || 1);
    return plotLeft + Math.round(t * (plotW - 1));
  }, bandMid = (i) => plotTop + Math.floor(bandH * (i + 0.5));
  hasTitle && writeText(canvas, roles, 0, Math.floor(totalW / 2 - chart.title.length / 2), chart.title, "text"), hasLegend && drawLegend(canvas, roles, hexColors, chart, hasTitle ? 1 : 0, totalW, ch, seriesColors);
  for (let r = plotTop; r < plotTop + plotH; r++) set(canvas, roles, r, plotLeft - 1, ch.vLine, "border");
  set(canvas, roles, xAxisRow, plotLeft - 1, ch.origin, "border");
  for (let i = 0; i < dataCount; i++) {
    let my = bandMid(i), label = catLabels[i], labelStart = catGutter - label.length;
    writeText(canvas, roles, my, Math.max(0, labelStart), label, "text");
  }
  for (let c = plotLeft; c < plotLeft + plotW; c++) set(canvas, roles, xAxisRow, c, ch.hLine, "border");
  for (let tick of valueTicks) {
    let cx = valueToCol(tick);
    if (cx < plotLeft || cx >= plotLeft + plotW) continue;
    set(canvas, roles, xAxisRow, cx, ch.xTick, "border");
    let label = formatTickValue(tick);
    writeText(canvas, roles, xAxisRow + 1, cx - Math.floor(label.length / 2), label, "text");
  }
  if (hasYTitle) {
    let title = chart.yAxis.title;
    writeText(canvas, roles, totalH - 1, Math.floor(totalW / 2 - title.length / 2), title, "text");
  }
  for (let tick of valueTicks) {
    let cx = valueToCol(tick);
    if (!(cx < plotLeft || cx >= plotLeft + plotW)) for (let r = plotTop; r < plotTop + plotH; r++) get(canvas, r, cx) === " " && set(canvas, roles, r, cx, ch.grid, "line");
  }
  let barEntries = [];
  for (let si = 0; si < chart.series.length; si++) chart.series[si].type === "bar" && barEntries.push({ data: chart.series[si].data, globalIdx: si });
  if (barEntries.length > 0) {
    let barCount = barEntries.length, singleBarH = 1, groupH = singleBarH * barCount + (barCount - 1), baseCol = valueToCol(Math.max(0, yRange.min));
    for (let bIdx = 0; bIdx < barEntries.length; bIdx++) {
      let entry = barEntries[bIdx], hexColor = seriesColors[entry.globalIdx];
      for (let i = 0; i < entry.data.length; i++) {
        let by = bandMid(i) - Math.floor(groupH / 2) + bIdx * (singleBarH + 1), valCol = valueToCol(entry.data[i]), fromCol = Math.min(baseCol, valCol), toCol = Math.max(baseCol, valCol);
        for (let r = by; r < by + singleBarH; r++) for (let c = fromCol; c <= toCol; c++) set(canvas, roles, r, c, ch.bar, "arrow", hexColors, hexColor);
      }
    }
  }
  let lineEntries = [];
  for (let si = 0; si < chart.series.length; si++) chart.series[si].type === "line" && lineEntries.push({ data: chart.series[si].data, globalIdx: si });
  for (let entry of lineEntries) {
    if (entry.data.length === 0) continue;
    let hexColor = seriesColors[entry.globalIdx];
    drawHorizontalStaircaseLine(canvas, roles, entry.data, bandMid, valueToCol, plotTop, plotH, plotLeft, plotW, ch, hexColors, hexColor);
  }
  return canvasToString2(canvas, roles, hexColors, colorMode, theme);
}
function drawStaircaseLine(canvas, roles, data, bandCenter, valueToRow, plotTop, plotH, plotLeft, plotTotalW, ch, hexCanvas, hexColor) {
  if (data.length === 0) return;
  let points = data.map((v, i) => ({ col: bandCenter(i), row: valueToRow(v) })), drawAt = (col, row, char) => {
    let displayRow = plotTop + (plotH - 1 - row);
    displayRow >= 0 && col >= plotLeft && col < plotLeft + plotTotalW && set(canvas, roles, displayRow, col, char, "arrow", hexCanvas, hexColor);
  };
  if (points.length === 1) {
    drawAt(points[0].col, points[0].row, ch.hLine);
    return;
  }
  for (let i = 0; i < points.length - 1; i++) {
    let p1 = points[i], p2 = points[i + 1];
    if (p1.row === p2.row) {
      for (let c = p1.col; c <= p2.col; c++) drawAt(c, p1.row, ch.hLine);
      continue;
    }
    let midCol = Math.round((p1.col + p2.col) / 2), goingUp = p2.row > p1.row;
    for (let c = p1.col; c < midCol; c++) drawAt(c, p1.row, ch.hLine);
    goingUp ? drawAt(midCol, p1.row, ch.cornerBR) : drawAt(midCol, p1.row, ch.cornerTR);
    let minRow = Math.min(p1.row, p2.row), maxRow = Math.max(p1.row, p2.row);
    for (let row = minRow + 1; row < maxRow; row++) drawAt(midCol, row, ch.vLine);
    goingUp ? drawAt(midCol, p2.row, ch.cornerTL) : drawAt(midCol, p2.row, ch.cornerBL);
    for (let c = midCol + 1; c <= p2.col; c++) drawAt(c, p2.row, ch.hLine);
    if (i === 0) {
      let leadStart = Math.max(plotLeft, p1.col - Math.floor((p2.col - p1.col) / 4));
      for (let c = leadStart; c < p1.col; c++) drawAt(c, p1.row, ch.hLine);
    }
    if (i === points.length - 2) {
      let trailEnd = Math.min(plotLeft + plotTotalW - 1, p2.col + Math.floor((p2.col - p1.col) / 4));
      for (let c = p2.col + 1; c <= trailEnd; c++) drawAt(c, p2.row, ch.hLine);
    }
  }
}
function drawHorizontalStaircaseLine(canvas, roles, data, bandMid, valueToCol, plotTop, plotH, plotLeft, plotW, ch, hexCanvas, hexColor) {
  if (data.length === 0) return;
  let points = data.map((v, i) => ({ row: bandMid(i), col: valueToCol(v) })), drawAt = (row, col, char) => {
    row >= plotTop && row < plotTop + plotH && col >= plotLeft && col < plotLeft + plotW && set(canvas, roles, row, col, char, "arrow", hexCanvas, hexColor);
  };
  if (points.length === 1) {
    drawAt(points[0].row, points[0].col, ch.vLine);
    return;
  }
  for (let i = 0; i < points.length - 1; i++) {
    let p1 = points[i], p2 = points[i + 1];
    if (p1.col === p2.col) {
      for (let r = p1.row; r <= p2.row; r++) drawAt(r, p1.col, ch.vLine);
      continue;
    }
    let midRow = Math.round((p1.row + p2.row) / 2), goingRight = p2.col > p1.col;
    for (let r = p1.row; r < midRow; r++) drawAt(r, p1.col, ch.vLine);
    goingRight ? drawAt(midRow, p1.col, ch.cornerBL) : drawAt(midRow, p1.col, ch.cornerBR);
    let minCol = Math.min(p1.col, p2.col), maxCol = Math.max(p1.col, p2.col);
    for (let c = minCol + 1; c < maxCol; c++) drawAt(midRow, c, ch.hLine);
    goingRight ? drawAt(midRow, p2.col, ch.cornerTR) : drawAt(midRow, p2.col, ch.cornerTL);
    for (let r = midRow + 1; r <= p2.row; r++) drawAt(r, p2.col, ch.vLine);
  }
}
function drawLegend(canvas, roles, hexCanvas, chart, row, totalW, ch, seriesColors) {
  let items = [], barIdx = 0, lineIdx = 0;
  for (let si = 0; si < chart.series.length; si++) chart.series[si].type === "bar" ? (items.push({ symbol: ch.bar, label: `Bar ${barIdx + 1}`, globalIdx: si }), barIdx++) : (items.push({ symbol: ch.hLine, label: `Line ${lineIdx + 1}`, globalIdx: si }), lineIdx++);
  let totalLen = 0;
  for (let i = 0; i < items.length; i++) i > 0 && (totalLen += 2), totalLen += 2 + items[i].label.length;
  let col = Math.max(0, Math.floor(totalW / 2 - totalLen / 2));
  for (let i = 0; i < items.length; i++) {
    i > 0 && (col += 2);
    let item = items[i];
    set(canvas, roles, row, col, item.symbol, "arrow", hexCanvas, seriesColors[item.globalIdx]), col += 1, col += 1, writeText(canvas, roles, row, col, item.label, "text"), col += item.label.length;
  }
}
function createCanvas(width2, height) {
  return Array.from({ length: width2 }, () => Array.from({ length: height }, () => " "));
}
function createRoleCanvas(width2, height) {
  return Array.from({ length: width2 }, () => Array.from({ length: height }).fill(null));
}
function createHexCanvas(width2, height) {
  return Array.from({ length: width2 }, () => Array.from({ length: height }).fill(null));
}
function set(canvas, roles, row, col, char, role, hexCanvas, hex) {
  col >= 0 && col < canvas.length && row >= 0 && row < canvas[0].length && (canvas[col][row] = char, roles[col][row] = role, hexCanvas && hex && (hexCanvas[col][row] = hex));
}
function get(canvas, row, col) {
  return col >= 0 && col < canvas.length && row >= 0 && row < canvas[0].length ? canvas[col][row] : " ";
}
function writeText(canvas, roles, row, startCol, text2, role) {
  for (let i = 0; i < text2.length; i++) set(canvas, roles, row, startCol + i, text2[i], role);
}
function canvasToString2(canvas, roles, hexCanvas, colorMode, theme) {
  if (canvas.length === 0) return "";
  let height = canvas[0].length, width2 = canvas.length, lines2 = [];
  for (let row = 0; row < height; row++) {
    let chars = [], rowRoles = [], rowHex = [];
    for (let col = 0; col < width2; col++) chars.push(canvas[col][row]), rowRoles.push(roles[col][row]), rowHex.push(hexCanvas[col][row]);
    let end = chars.length - 1;
    for (; end >= 0 && chars[end] === " "; ) end--;
    end < 0 ? lines2.push("") : lines2.push(colorizeRow(chars.slice(0, end + 1), rowRoles.slice(0, end + 1), rowHex.slice(0, end + 1), theme, colorMode));
  }
  for (; lines2.length > 0 && lines2[lines2.length - 1] === ""; ) lines2.pop();
  return lines2.join(`
`);
}
function colorizeRow(chars, roles, hexOverrides, theme, mode) {
  if (mode === "none") return chars.join("");
  let result = "", currentColor = null, buffer = "";
  for (let i = 0; i < chars.length; i++) {
    let char = chars[i];
    if (char === " ") {
      buffer.length > 0 && (result += currentColor ? colorizeText(buffer, currentColor, mode) : buffer, buffer = "", currentColor = null), result += " ";
      continue;
    }
    let hexOvr = hexOverrides[i] ?? null, roleVal = roles[i] ?? null, color = hexOvr ?? (roleVal ? roleToHex(roleVal, theme) : null);
    color === currentColor ? buffer += char : (buffer.length > 0 && (result += currentColor ? colorizeText(buffer, currentColor, mode) : buffer), buffer = char, currentColor = color);
  }
  return buffer.length > 0 && (result += currentColor ? colorizeText(buffer, currentColor, mode) : buffer), result;
}
function getDataCount(chart) {
  if (chart.xAxis.categories) return chart.xAxis.categories.length;
  for (let s of chart.series) if (s.data.length > 0) return s.data.length;
  return 0;
}
function getCategoryLabels(chart, count) {
  if (chart.xAxis.categories) return chart.xAxis.categories;
  if (chart.xAxis.range) {
    let { min, max } = chart.xAxis.range, step = count > 1 ? (max - min) / (count - 1) : 0;
    return Array.from({ length: count }, (_, i) => formatTickValue(min + step * i));
  }
  return Array.from({ length: count }, (_, i) => String(i + 1));
}
function niceTickValues(min, max) {
  let range = max - min;
  if (range <= 0) return [min];
  let rawInterval = range / 6, magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval))), residual = rawInterval / magnitude, niceInterval;
  residual <= 1.5 ? niceInterval = magnitude : residual <= 3 ? niceInterval = 2 * magnitude : residual <= 7 ? niceInterval = 5 * magnitude : niceInterval = 10 * magnitude;
  let start = Math.ceil(min / niceInterval) * niceInterval, ticks = [];
  for (let v = start; v <= max + niceInterval * 1e-3; v += niceInterval) ticks.push(Math.round(v * 1e10) / 1e10);
  return ticks;
}
function formatTickValue(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(Math.abs(v) < 10 ? 1 : 0);
}
var setChartSize = (width2, height) => {
  PLOT_WIDTH = width2, PLOT_HEIGHT = height;
};
function detectDiagramType(text2) {
  let firstLine = text2.trim().split(`
`)[0]?.trim().toLowerCase() ?? "";
  return /^xychart(-beta)?\b/.test(firstLine) ? "xychart" : /^sequencediagram\s*$/.test(firstLine) ? "sequence" : /^classdiagram\s*$/.test(firstLine) ? "class" : /^erdiagram\s*$/.test(firstLine) ? "er" : "flowchart";
}
function renderMermaidASCII(text2, options = {}) {
  let config = { useAscii: options.useAscii ?? false, paddingX: options.paddingX ?? 5, paddingY: options.paddingY ?? 5, boxBorderPadding: options.boxBorderPadding ?? 1, graphDirection: "TD" }, colorMode = options.colorMode === "auto" || options.colorMode === void 0 ? detectColorMode() : options.colorMode, theme = { ...DEFAULT_ASCII_THEME, ...options.theme };
  switch (detectDiagramType(text2)) {
    case "xychart":
      return renderXYChartAscii(text2, config, colorMode, theme);
    case "sequence":
      return renderSequenceAscii(text2, config, colorMode, theme);
    case "class":
      return renderClassAscii(text2, config, colorMode, theme);
    case "er":
      return renderErAscii(text2, config, colorMode, theme);
    default: {
      let parsed = parseMermaid(text2);
      parsed.direction === "LR" || parsed.direction === "RL" ? config.graphDirection = "LR" : config.graphDirection = "TD";
      let graph = convertToAsciiGraph(parsed, config);
      return createMapping(graph), drawGraph(graph), parsed.direction === "BT" && (flipCanvasVertically(graph.canvas), flipRoleCanvasVertically(graph.roleCanvas)), canvasToString(graph.canvas, { roleCanvas: graph.roleCanvas, colorMode, theme });
    }
  }
}
var renderMermaidAscii = renderMermaidASCII;

// ../hooks/mermaid.tsx
var MAX_LINES = 80;
var PAD = "\uFDD0";
var textCache = /* @__PURE__ */ new Map();
var chartSize = (columns2, source2 = "") => {
  const labels = (/^\s*x-axis\b[^[\n]*\[([^\]\n]*)\]/m.exec(source2)?.[1] ?? "").split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
  const fit = labels.length * (Math.max(...labels.map((l) => l.length)) + 2);
  const width2 = Math.max(24, Math.min(60, Math.max(Math.floor(columns2 / 6), fit), columns2 - 12));
  return { width: width2, height: Math.max(8, Math.min(20, Math.round(width2 * 0.3))) };
};
var padWide = (source2) => /^[\x00-\x7F]*$/.test(source2) ? source2 : graphemes(source2).map((g) => g.length === 1 && width(g) === 2 ? g + PAD : g).join("");
var unquoteCategories = (source2) => source2.replace(/^(\s*x-axis\b[^[\n]*\[)([^\]\n]*)\]/m, (_, head, items) => `${head}${items.replace(/"([^"]*)"/g, (_q, s) => s.replaceAll(",", " "))}]`);
var labelBars = (art2, source2) => {
  const series = source2.match(/^\s*(bar|line)\b.*$/gm) ?? [];
  const values = /^\s*bar\b[^[\n]*\[([^\]\n]*)\]/m.exec(source2)?.[1]?.split(",").map((v) => v.trim());
  if (series.length !== 1 || !values || /^\s*xychart(-beta)?\s+horizontal/m.test(source2)) return art2;
  const grid = art2.split("\n").map((l) => [...l]);
  const axis = grid.findLastIndex((row) => row.includes("\u252C"));
  const ticks = grid[axis]?.flatMap((ch, x) => ch === "\u252C" ? [x] : []) ?? [];
  if (ticks.length !== values.length) return art2;
  ticks.forEach((x, k) => {
    const top = grid.findIndex((row2) => row2[x] === "\u2588");
    const y = top === -1 ? axis - 1 : top - 1;
    const text2 = [...values[k]];
    const from = x - Math.floor((text2.length - 1) / 2);
    const row = grid[y];
    if (!row || y < 0) return;
    while (row.length < from + text2.length) row.push(" ");
    if (!text2.every((_, i) => /[ ·]/.test(row[from + i] ?? " "))) return;
    text2.forEach((ch, i) => row[from + i] = ch);
  });
  return grid.map((row) => row.join("").trimEnd()).join("\n");
};
var SIDEWAYS = /^(\s*(?:flowchart|graph)[ \t]+)(LR|RL)\b/;
var INLINE_TAG = /<\/?(?:b|i|u|s|em|strong|del|code|small|sub|sup|span|mark)\b[^<>\n]*>/gi;
var mermaidText = (source2, ascii, columns2) => {
  source2 = source2.replace(INLINE_TAG, "");
  if (source2.length > 8e3 || source2.split("\n").length > MAX_LINES) return null;
  const art2 = draw(source2, ascii, columns2);
  const fits = (a) => a.split("\n").every((l) => width(l) <= columns2 - 2);
  if (art2 === null || fits(art2) || !SIDEWAYS.test(source2)) return art2;
  return draw(source2.replace(SIDEWAYS, "$1TD"), ascii, columns2) ?? art2;
};
var evenTicks = (art2) => {
  const rows = art2.split("\n").flatMap((line, i) => /^\s*-?[\d.,]+[kMG%]?\s*[┤┼+|]/.test(line) ? [i] : []);
  return rows.slice(2).every((row, i) => row - rows[i + 1] === rows[1] - rows[0]);
};
var draw = (source2, ascii, columns2) => {
  const isChart = /^\s*xychart/.test(source2);
  const padded = padWide(source2);
  const size = chartSize(columns2, isChart ? padded : "");
  const key = `${ascii}:${isChart ? size.width : 0}:${source2}`;
  return remember(textCache, key, () => {
    try {
      const render = () => renderMermaidAscii(unquoteCategories(padded.replace(/^(\s*%%[^\n]*\n)+/, "")).replace(/(-->|-\.->|==>|---|-\.-|===)[ \t]+\|/g, "$1|"), { useAscii: ascii, colorMode: "none", paddingX: 3, paddingY: 1 }).replace(/[ \t]+$/gm, "").trimEnd().replace(/▶/g, "\u25BA").replace(/◀/g, "\u25C4");
      let art2 = "";
      for (const height of isChart ? [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8].map((d) => size.height + d).filter((h2) => h2 >= 6) : [0]) {
        if (isChart) setChartSize(size.width, height);
        art2 = render();
        if (!isChart || evenTicks(art2)) break;
      }
      if (isChart && !evenTicks(art2)) {
        setChartSize(size.width, size.height);
        art2 = render();
      }
      return (isChart ? labelBars(art2, padded) : art2.split("\n").filter((l) => !/^[\s│|]*$/.test(l)).join("\n")).replaceAll(PAD, "");
    } catch {
      return null;
    }
  });
};
var LINE = /[─-╿◇]/;
var ARROW = /[►◄▲▼]/;
var paint = (art2, style2) => {
  const t = style2.theme;
  const grid = art2.split("\n").map(cells);
  const cell = (r, c) => grid[r]?.[c] ?? "";
  const color = grid.map((row) => row.map(() => void 0));
  const palette = [.../* @__PURE__ */ new Set([t.link, t.number, t.heading, t.emphasis, t.path, t.codeFlag, t.accent])].filter((c) => c !== void 0);
  const next = (i) => palette[i % palette.length];
  const labels = /* @__PURE__ */ new Map();
  const rects = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
      if (!/[┌╭(]/.test(cell(r, c))) continue;
      let c2 = c + 1;
      while (/[─┬┴┼▲▼]/.test(cell(r, c2))) c2++;
      if (!/[┐╮)]/.test(cell(r, c2)) || c2 === c + 1) continue;
      let r2 = r + 1;
      while (/[│├┤┼►◄]/.test(cell(r2, c))) r2++;
      if (!/[└╰(]/.test(cell(r2, c)) || !/[┘╯)]/.test(cell(r2, c2))) continue;
      rects.push({ r, c, r2, c2 });
    }
  }
  const inside = (a, b) => a !== b && b.r > a.r && b.r2 < a.r2 && b.c > a.c && b.c2 < a.c2;
  for (const box of rects.filter((a) => !rects.some((b) => inside(a, b)))) {
    const { r, c, r2, c2 } = box;
    const label = grid.slice(r + 1, r2).map((row) => row.slice(c + 1, c2).join("")).join(" ").trim();
    if (!labels.has(label)) labels.set(label, next(labels.size));
    const hue = labels.get(label);
    for (let y = r; y <= r2; y++) for (let x = c; x <= c2; x++) if (cell(y, x).trim()) color[y][x] = hue;
  }
  const bars = [...new Set(grid.flatMap((row) => row.flatMap((ch, c) => ch === "\u2588" && row[c - 1] !== "\u2588" ? [c] : [])))].sort((a, b) => a - b);
  const ticks = grid.findLast((row) => row.includes("\u252C"))?.filter((ch) => ch === "\u252C").length ?? 0;
  const tops = bars.map((x) => grid.findIndex((row) => row[x] === "\u2588"));
  const single = bars.length > 1 && bars.length <= ticks;
  const barColor = (i) => single ? tops[i] === Math.min(...tops) ? t.emphasis ?? t.accent : t.quote : next(i);
  grid.forEach(
    (row, r) => row.forEach((ch, c) => {
      if (color[r][c] !== void 0) return;
      if (ch === "\u2588") {
        let start = c;
        while (row[start - 1] === "\u2588") start--;
        color[r][c] = barColor(bars.indexOf(start));
      } else if (ch === "\xB7") color[r][c] = t.rule;
      else if (ARROW.test(ch)) color[r][c] = t.accent;
      else if (LINE.test(ch)) color[r][c] = t.diagram;
      else if (/^\d+[┤┼]/.test(row.slice(c).join(""))) color[r][c] = t.number;
      else color[r][c] = t.diagramText;
    })
  );
  return color;
};
var painted = /* @__PURE__ */ new WeakMap();
var boxArt = ({ Box, Text }, style2, art2, key, marks = []) => {
  const cache = painted.get(style2.theme) ?? /* @__PURE__ */ new Map();
  painted.set(style2.theme, cache);
  const colors = remember(cache, art2, () => paint(art2, style2));
  return /* @__PURE__ */ h(Box, { key, flexDirection: "column", paddingLeft: 2 }, art2.split("\n").map((line, i) => {
    const chars = cells(line);
    const marked = chars.map(() => void 0);
    for (const [phrase, mark] of marks)
      for (let c = 0; c + phrase.length <= chars.length; c++)
        if (phrase.every((ch, k) => chars[c + k] === ch)) for (let k = 0; k < phrase.length; k++) marked[c + k] = mark;
    const parts = [];
    let at = 0;
    while (at < chars.length) {
      const hue = colors[i]?.[at];
      const mark = marked[at];
      let end = at + 1;
      while (end < chars.length && colors[i]?.[end] === hue && marked[end] === mark) end++;
      parts.push(/* @__PURE__ */ h(Text, { key: `t${parts.length}`, color: hue, ...mark }, chars.slice(at, end).join("")));
      at = end;
    }
    return /* @__PURE__ */ h(Text, { key: `${key}.${i}` }, parts.length ? parts : " ");
  }));
};

// ../hooks/presets.ts
var PRESETS = {
  "catppuccin-mocha": {
    accent: "#cba6f7",
    heading: "#f9e2af",
    tableHeader: "#f9e2af",
    strong: "#ffffff",
    emphasis: "#f5c2e7",
    inlineCode: "#89dceb",
    codeText: "#cdd6f4",
    codeCommand: "#89b4fa",
    codeFlag: "#f38ba8",
    codeString: "#a6e3a1",
    codeComment: "#6c7086",
    link: "#89b4fa",
    path: "#89dceb",
    number: "#a6e3a1",
    quote: "#9399b2",
    rule: "#45475a",
    tableRule: "#585b70",
    bullet: "#cba6f7",
    diagram: "#89b4fa",
    diagramText: "#cdd6f4"
  },
  "catppuccin-latte": {
    accent: "#8839ef",
    heading: "#df8e1d",
    tableHeader: "#df8e1d",
    strong: "#11111b",
    emphasis: "#ea76cb",
    inlineCode: "#04a5e5",
    codeText: "#4c4f69",
    codeCommand: "#1e66f5",
    codeFlag: "#d20f39",
    codeString: "#40a02b",
    codeComment: "#9ca0b0",
    link: "#1e66f5",
    path: "#209fb5",
    number: "#40a02b",
    quote: "#6c6f85",
    rule: "#bcc0cc",
    tableRule: "#acb0be",
    bullet: "#8839ef",
    diagram: "#1e66f5",
    diagramText: "#4c4f69"
  },
  dracula: {
    accent: "#bd93f9",
    heading: "#bd93f9",
    tableHeader: "#f1fa8c",
    strong: "#f8f8f2",
    emphasis: "#ff79c6",
    inlineCode: "#8be9fd",
    codeText: "#f8f8f2",
    codeCommand: "#50fa7b",
    codeFlag: "#ff79c6",
    codeString: "#f1fa8c",
    codeComment: "#6272a4",
    link: "#8be9fd",
    path: "#ffb86c",
    number: "#bd93f9",
    quote: "#6272a4",
    rule: "#44475a",
    tableRule: "#6272a4",
    bullet: "#ff79c6",
    diagram: "#bd93f9",
    diagramText: "#f8f8f2"
  },
  nord: {
    accent: "#88c0d0",
    heading: "#88c0d0",
    tableHeader: "#ebcb8b",
    strong: "#eceff4",
    emphasis: "#b48ead",
    inlineCode: "#8fbcbb",
    codeText: "#d8dee9",
    codeCommand: "#88c0d0",
    codeFlag: "#81a1c1",
    codeString: "#a3be8c",
    codeComment: "#4c566a",
    link: "#88c0d0",
    path: "#8fbcbb",
    number: "#b48ead",
    quote: "#81a1c1",
    rule: "#3b4252",
    tableRule: "#4c566a",
    bullet: "#88c0d0",
    diagram: "#81a1c1",
    diagramText: "#d8dee9"
  },
  "tokyo-night": {
    accent: "#bb9af7",
    heading: "#7dcfff",
    tableHeader: "#e0af68",
    strong: "#c0caf5",
    emphasis: "#f7768e",
    inlineCode: "#7dcfff",
    codeText: "#a9b1d6",
    codeCommand: "#7aa2f7",
    codeFlag: "#bb9af7",
    codeString: "#9ece6a",
    codeComment: "#565f89",
    link: "#73daca",
    path: "#2ac3de",
    number: "#ff9e64",
    quote: "#9aa5ce",
    rule: "#414868",
    tableRule: "#565f89",
    bullet: "#bb9af7",
    diagram: "#7aa2f7",
    diagramText: "#c0caf5"
  },
  "gruvbox-dark": {
    accent: "#d3869b",
    heading: "#fabd2f",
    tableHeader: "#fabd2f",
    strong: "#fbf1c7",
    emphasis: "#d3869b",
    inlineCode: "#8ec07c",
    codeText: "#ebdbb2",
    codeCommand: "#83a598",
    codeFlag: "#fe8019",
    codeString: "#b8bb26",
    codeComment: "#928374",
    link: "#83a598",
    path: "#8ec07c",
    number: "#d3869b",
    quote: "#a89984",
    rule: "#3c3836",
    tableRule: "#504945",
    bullet: "#fe8019",
    diagram: "#83a598",
    diagramText: "#ebdbb2"
  },
  "gruvbox-light": {
    accent: "#8f3f71",
    heading: "#b57614",
    tableHeader: "#b57614",
    strong: "#282828",
    emphasis: "#8f3f71",
    inlineCode: "#427b58",
    codeText: "#3c3836",
    codeCommand: "#076678",
    codeFlag: "#af3a03",
    codeString: "#79740e",
    codeComment: "#928374",
    link: "#076678",
    path: "#427b58",
    number: "#8f3f71",
    quote: "#7c6f64",
    rule: "#ebdbb2",
    tableRule: "#a89984",
    bullet: "#af3a03",
    diagram: "#076678",
    diagramText: "#3c3836"
  },
  "rose-pine": {
    accent: "#c4a7e7",
    heading: "#c4a7e7",
    tableHeader: "#f6c177",
    strong: "#e0def4",
    emphasis: "#ebbcba",
    inlineCode: "#9ccfd8",
    codeText: "#e0def4",
    codeCommand: "#9ccfd8",
    codeFlag: "#eb6f92",
    codeString: "#f6c177",
    codeComment: "#6e6a86",
    link: "#c4a7e7",
    path: "#9ccfd8",
    number: "#ebbcba",
    quote: "#908caa",
    rule: "#26233a",
    tableRule: "#6e6a86",
    bullet: "#eb6f92",
    diagram: "#c4a7e7",
    diagramText: "#e0def4"
  },
  "rose-pine-dawn": {
    accent: "#907aa9",
    heading: "#907aa9",
    tableHeader: "#ea9d34",
    strong: "#464261",
    emphasis: "#d7827e",
    inlineCode: "#56949f",
    codeText: "#464261",
    codeCommand: "#56949f",
    codeFlag: "#b4637a",
    codeString: "#ea9d34",
    codeComment: "#9893a5",
    link: "#907aa9",
    path: "#286983",
    number: "#d7827e",
    quote: "#797593",
    rule: "#f2e9e1",
    tableRule: "#9893a5",
    bullet: "#b4637a",
    diagram: "#907aa9",
    diagramText: "#464261"
  },
  everforest: {
    accent: "#a7c080",
    heading: "#e69875",
    tableHeader: "#dbbc7f",
    strong: "#d3c6aa",
    emphasis: "#d699b6",
    inlineCode: "#83c092",
    codeText: "#d3c6aa",
    codeCommand: "#7fbbb3",
    codeFlag: "#e67e80",
    codeString: "#a7c080",
    codeComment: "#859289",
    link: "#7fbbb3",
    path: "#83c092",
    number: "#d699b6",
    quote: "#9da9a0",
    rule: "#475258",
    tableRule: "#7a8478",
    bullet: "#e69875",
    diagram: "#7fbbb3",
    diagramText: "#d3c6aa"
  },
  "github-dark": {
    accent: "#d2a8ff",
    heading: "#79c0ff",
    tableHeader: "#ffa657",
    strong: "#e6edf3",
    emphasis: "#d2a8ff",
    inlineCode: "#79c0ff",
    codeText: "#e6edf3",
    codeCommand: "#d2a8ff",
    codeFlag: "#ff7b72",
    codeString: "#a5d6ff",
    codeComment: "#7d8590",
    link: "#58a6ff",
    path: "#7ee787",
    number: "#79c0ff",
    quote: "#7d8590",
    rule: "#30363d",
    tableRule: "#8b949e",
    bullet: "#ff7b72",
    diagram: "#58a6ff",
    diagramText: "#e6edf3"
  },
  "github-light": {
    accent: "#8250df",
    heading: "#0550ae",
    tableHeader: "#953800",
    strong: "#1f2328",
    emphasis: "#8250df",
    inlineCode: "#0550ae",
    codeText: "#1f2328",
    codeCommand: "#8250df",
    codeFlag: "#cf222e",
    codeString: "#0a3069",
    codeComment: "#6e7781",
    link: "#0969da",
    path: "#116329",
    number: "#0550ae",
    quote: "#656d76",
    rule: "#d0d7de",
    tableRule: "#6e7781",
    bullet: "#cf222e",
    diagram: "#0969da",
    diagramText: "#1f2328"
  },
  "one-dark": {
    accent: "#c678dd",
    heading: "#e06c75",
    tableHeader: "#e5c07b",
    strong: "#d19a66",
    emphasis: "#c678dd",
    inlineCode: "#56b6c2",
    codeText: "#abb2bf",
    codeCommand: "#61afef",
    codeFlag: "#e06c75",
    codeString: "#98c379",
    codeComment: "#5c6370",
    link: "#61afef",
    path: "#56b6c2",
    number: "#d19a66",
    quote: "#828997",
    rule: "#3a3f4b",
    tableRule: "#5c6370",
    bullet: "#c678dd",
    diagram: "#61afef",
    diagramText: "#abb2bf"
  },
  "solarized-dark": {
    accent: "#6c71c4",
    heading: "#b58900",
    tableHeader: "#b58900",
    strong: "#eee8d5",
    emphasis: "#d33682",
    inlineCode: "#2aa198",
    codeText: "#93a1a1",
    codeCommand: "#268bd2",
    codeFlag: "#cb4b16",
    codeString: "#859900",
    codeComment: "#586e75",
    link: "#268bd2",
    path: "#2aa198",
    number: "#859900",
    quote: "#657b83",
    rule: "#073642",
    tableRule: "#586e75",
    bullet: "#6c71c4",
    diagram: "#268bd2",
    diagramText: "#93a1a1"
  },
  "solarized-light": {
    accent: "#6c71c4",
    heading: "#b58900",
    tableHeader: "#b58900",
    strong: "#073642",
    emphasis: "#d33682",
    inlineCode: "#2aa198",
    codeText: "#586e75",
    codeCommand: "#268bd2",
    codeFlag: "#cb4b16",
    codeString: "#859900",
    codeComment: "#93a1a1",
    link: "#268bd2",
    path: "#2aa198",
    number: "#859900",
    quote: "#839496",
    rule: "#eee8d5",
    tableRule: "#93a1a1",
    bullet: "#6c71c4",
    diagram: "#268bd2",
    diagramText: "#586e75"
  },
  mono: {}
};
var PRESET_NAMES = Object.keys(PRESETS);

// ../hooks/theme.ts
var TOKENS = [
  "accent",
  "heading",
  "strong",
  "emphasis",
  "inlineCode",
  "codeText",
  "codeCommand",
  "codeFlag",
  "codeString",
  "codeComment",
  "link",
  "path",
  "number",
  "quote",
  "rule",
  "tableHeader",
  "tableRule",
  "bullet",
  "diagram",
  "diagramText"
];
var COLOR = /^(#[0-9a-f]{3}|#[0-9a-f]{6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|ansi256\(\d{1,3}\)|(black|red|green|yellow|blue|magenta|cyan|white|gray|grey)(Bright)?)$/i;
var isColor = (value) => typeof value === "string" && COLOR.test(value.trim());
var pick = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
var RANDOM_THEMES = PRESET_NAMES.filter((t) => !/latte|light|dawn/.test(t) && t !== "mono");
var resolveStyle = (options) => {
  const base = PRESETS[String(options.theme)] ?? PRESETS["catppuccin-mocha"];
  const fromFields = Object.fromEntries(
    TOKENS.filter((k) => isColor(options[`${k}Color`])).map((k) => [k, String(options[`${k}Color`]).trim()])
  );
  const rtl = pick(options.rtl, ["auto", "off", ...Object.keys(TERMINALS)], "auto");
  return {
    theme: { ...base, ...fromFields },
    headingStyle: pick(options.headingStyle, ["bold", "underline", "uppercase", "banner"], "banner"),
    tableStyle: pick(options.tableStyle, ["box", "rules", "grid", "minimal"], "box"),
    taskStyle: pick(options.taskStyle, ["checks", "ticks", "box", "progress"], "checks"),
    promptStyle: pick(options.promptStyle, ["bubble", "bar", "chevron", "off"], "bubble"),
    clock: pick(options.clock, ["off", "24h", "12h"], "off"),
    toolStyle: pick(options.toolStyle, ["chat", "tree-dim", "tree-bold", "classic"], "chat"),
    toolOutput: pick(options.toolOutput, ["full", "quiet"], "full"),
    highlightNumbers: options.highlightNumbers !== false,
    highlightPaths: options.highlightPaths !== false,
    mermaid: options.mermaid !== false,
    mermaidAscii: options.mermaidAscii === true,
    copyButtons: options.copyButtons !== false,
    htmlCopy: null,
    diagramHints: options.diagramHints !== false && options.mermaid !== false,
    rtl,
    reorder: rtl !== "auto" && rtl !== "off",
    shape: rtl === "auto" || rtl === "off" ? "visual" : TERMINALS[rtl],
    latex: options.latex === true,
    cwd: "",
    home: ""
  };
};

// codex-fence.mjs
globalThis.h = (type, props, ...children) => ({ type, props: props ?? {}, children });
globalThis.Fragment = "Fragment";
var el = { Box: "Box", Text: "Text", Button: "Button", Link: "Link" };
var configTheme = () => {
  try {
    const toml = readFileSync(join(process.env.CODEX_HOME || join(homedir(), ".codex"), "config.toml"), "utf8");
    return toml.match(/^theme\s*=\s*"prismantis-([\w-]+)"/m)?.[1];
  } catch {
    return void 0;
  }
};
var geminiTheme = () => {
  try {
    return JSON.parse(readFileSync(join(homedir(), ".gemini", "settings.json"), "utf8")).ui?.theme?.match(/^prismantis-([\w-]+)/)?.[1];
  } catch {
    return void 0;
  }
};
var sgr = (p) => {
  const codes = [];
  if (p.bold) codes.push(1);
  if (p.dimColor || p.dim) codes.push(2);
  if (p.italic) codes.push(3);
  if (p.underline) codes.push(4);
  const hex = /^#([0-9a-f]{6})$/i.exec(p.color ?? "");
  if (hex) codes.push(38, 2, ...[0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)));
  return codes;
};
var text = (node, inherited = []) => {
  if (node === null || node === void 0 || node === false) return "";
  if (Array.isArray(node)) return node.map((n) => text(n, inherited)).join("");
  if (typeof node !== "object") return `\x1B[0;${inherited.join(";")}m${node}`;
  return text(node.children, [...inherited, ...sgr(node.props)]);
};
var lines = (node) => {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(lines);
  if (node.type === "Box") return lines(node.children);
  if (node.type === "Text") return [`${text(node)}\x1B[0m`];
  return [];
};
var lang = process.argv[2];
var source = readFileSync(0, "utf8").replace(/\n$/, "");
var columns = Number(process.env.COLUMNS) || 100;
var style = resolveStyle({ theme: process.env.PRISMANTIS_THEME || (process.argv[3] === "gemini" ? geminiTheme() : configTheme()) || "catppuccin-mocha" });
var art = lang === "mermaid" ? mermaidText(source, false, columns) : null;
var drawn = lang === "figure" ? drawFigure(el, style, { kind: "code", lang, lines: source.split("\n") }, columns, "f")?.element : art && boxArt(el, style, art, "m");
if (!drawn) process.exit(1);
process.stdout.write(`${lines(drawn).join("\n")}
`);
