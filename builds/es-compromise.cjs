(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.esCompromise = factory());
})(this, (function () { 'use strict';

  const methods$o = {
    one: {},
    two: {},
    three: {},
    four: {},
  };

  const model$6 = {
    one: {},
    two: {},
    three: {},
  };
  const compute$7 = {};
  const hooks = [];

  var tmpWrld = { methods: methods$o, model: model$6, compute: compute$7, hooks };

  const fns$4 = {
    /** add metadata to term objects */
    compute: function (input, options) {
      const { world } = this;
      const compute = world.compute;
      // do one method
      if (typeof input === 'string' && Object.hasOwn(compute, input)) {
        compute[input](this, options);
      }
      // allow a list of methods
      else if (Array.isArray(input)) {
        input.forEach(name => {
          if (Object.hasOwn(world.compute, name)) {
            compute[name](this, options);
          } else {
            console.warn('no compute:', input); // eslint-disable-line
          }
        });
      }
      // allow a custom compute function
      else if (typeof input === 'function') {
        input(this, options);
      } else {
        console.warn('no compute:', input); // eslint-disable-line
      }
      return this
    },
  };

  // wrappers for loops in javascript arrays

  // call the callback with a one-match view
  const wrap$3 = (view, cb) => (ptr, i) => cb(view.update([ptr]), i);

  const forEach = function (cb) {
    this.fullPointer.forEach(wrap$3(this, cb));
    return this
  };

  const map = function (cb, empty) {
    const run = wrap$3(this, cb);
    const res = this.fullPointer.map((ptr, i) => {
      const out = run(ptr, i);
      // if we returned nothing, return a view
      if (out === undefined) {
        return this.none()
      }
      return out
    });
    if (res.length === 0) {
      return empty || this.update([])
    }
    // return an array of values, or View objects?
    // user can return either from their callback
    if (res[0] !== undefined) {
      // array of strings
      if (typeof res[0] === 'string') {
        return res
      }
      // array of objects
      if (typeof res[0] === 'object' && (res[0] === null || !res[0].isView)) {
        return res
      }
    }
    // return a View object
    let all = [];
    res.forEach(ptr => {
      all = all.concat(ptr.fullPointer);
    });
    return this.toView(all)
  };

  const filter = function (cb) {
    return this.update(this.fullPointer.filter(wrap$3(this, cb)))
  };

  const find$6 = function (cb) {
    const found = this.fullPointer.find(wrap$3(this, cb));
    if (found === undefined) {
      return this.update([])
    }
    return this.update([found])
  };

  const some$1 = function (cb) {
    return this.fullPointer.some(wrap$3(this, cb))
  };

  const random = function (n = 1) {
    let ptrs = this.fullPointer;
    let r = Math.floor(Math.random() * ptrs.length);
    //prevent it from going over the end
    if (r + n > this.length) {
      r = this.length - n;
      r = r < 0 ? 0 : r;
    }
    ptrs = ptrs.slice(r, r + n);
    return this.update(ptrs)
  };
  var loops = { forEach, map, filter, find: find$6, some: some$1, random };

  // small helpers shared by the View class and its methods

  // the pointer, or one per sentence for a full document
  const rawPointer = view => view.pointer || view.docs.map((_d, n) => [n]);

  // tag new terms, if the tagger is loaded
  const retag = function (view, computes) {
    view.compute([...computes, 'freeze', 'lexicon']);
    if (view.world.compute.preTagger) {
      view.compute('preTagger');
    }
    view.compute('unfreeze');
    return view
  };

  const utils = {
    /** */
    termList: function () {
      return this.methods.one.termList(this.docs)
    },
    /** return individual terms*/
    terms: function (n) {
      const m = this.match('.');
      // this is a bit faster than .match('.') 
      // let ptrs = []
      // this.docs.forEach((terms) => {
      //   terms.forEach((term) => {
      //     let [y, x] = term.index || []
      //     ptrs.push([y, x, x + 1])
      //   })
      // })
      // let m = this.update(ptrs)
      return typeof n === 'number' ? m.eq(n) : m
    },

    /** */
    groups: function (group) {
      if (group || group === 0) {
        return this.update(this._groups[group] || [])
      }
      // return an object of Views
      const res = {};
      Object.keys(this._groups).forEach(k => {
        res[k] = this.update(this._groups[k]);
      });
      // this._groups = null
      return res
    },
    /** */
    eq: function (n) {
      const ptr = rawPointer(this);
      if (ptr[n]) {
        return this.update([ptr[n]])
      }
      return this.none()
    },
    /** */
    first: function () {
      return this.eq(0)
    },
    /** */
    last: function () {
      const n = this.fullPointer.length - 1;
      return this.eq(n)
    },

    /** grab term[0] for every match */
    firstTerms: function () {
      return this.match('^.')
    },

    /** grab the last term for every match  */
    lastTerms: function () {
      return this.match('.$')
    },

    /** */
    slice: function (min, max) {
      return this.update(rawPointer(this).slice(min, max))
    },

    /** return a view of the entire document */
    all: function () {
      return this.update().toView()
    },
    /**  */
    fullSentences: function () {
      const ptrs = this.fullPointer.map(a => [a[0]]); //lazy!
      return this.update(ptrs).toView()
    },
    /** return a view of no parts of the document */
    none: function () {
      return this.update([])
    },

    /** are these two views looking at the same words? */
    isDoc: function (b) {
      if (!b || !b.isView) {
        return false
      }
      const aPtr = this.fullPointer;
      const bPtr = b.fullPointer;
      if (aPtr.length !== bPtr.length) {
        return false
      }
      // ensure [n, start, end] are all the same
      return aPtr.every((ptr, i) => bPtr[i] && ptr[0] === bPtr[i][0] && ptr[1] === bPtr[i][1] && ptr[2] === bPtr[i][2])
    },

    /** how many seperate terms does the document have? */
    wordCount: function () {
      return this.docs.reduce((count, terms) => {
        count += terms.filter(t => t.text !== '').length;
        return count
      }, 0)
    },

    // is the pointer the full sentence?
    isFull: function () {
      const ptrs = this.pointer;
      if (!ptrs) {
        return true
      }
      // must start at beginning
      if (ptrs.length === 0 || ptrs[0][0] !== 0) {
        return false
      }
      let wantTerms = 0;
      let haveTerms = 0;
      this.document.forEach(terms => wantTerms += terms.length);
      this.docs.forEach(terms => haveTerms += terms.length);
      return wantTerms === haveTerms
      // for (let i = 0; i < ptrs.length; i += 1) {
      //   let [n, start, end] = ptrs[i]
      //   // it's not the start
      //   if (n !== i || start !== 0) {
      //     return false
      //   }
      //   // it's too short
      //   if (document[n].length > end) {
      //     return false
      //   }
      // }
      // return true
    },

    // return the nth elem of a doc
    getNth: function (n) {
      if (typeof n === 'number') {
        return this.eq(n)
      } else if (typeof n === 'string') {
        return this.if(n)
      }
      return this
    }

  };
  utils.group = utils.groups;
  utils.fullSentence = utils.fullSentences;
  utils.sentence = utils.fullSentences;
  utils.lastTerm = utils.lastTerms;
  utils.firstTerm = utils.firstTerms;

  const methods$n = { ...utils, ...fns$4, ...loops };

  // aliases
  methods$n.get = methods$n.eq;

  class View {
    constructor(document, pointer, groups = {}) {
      // invisible props
      const props = [
        ['document', document],
        ['world', tmpWrld],
        ['_groups', groups],
        ['_cache', null],
      ];
      props.forEach(a => {
        Object.defineProperty(this, a[0], {
          value: a[1],
          writable: true,
        });
      });
      this.ptrs = pointer;
    }
    /* getters:  */
    get docs() {
      let docs = this.document;
      if (this.ptrs) {
        docs = tmpWrld.methods.one.getDoc(this.ptrs, this.document);
      }
      return docs
    }
    get pointer() {
      return this.ptrs
    }
    get methods() {
      return this.world.methods
    }
    get model() {
      return this.world.model
    }
    get hooks() {
      return this.world.hooks
    }
    get isView() {
      return true //this comes in handy sometimes
    }
    // is the view not-empty?
    get found() {
      return this.docs.length > 0
    }
    // how many matches we have
    get length() {
      return this.docs.length
    }
    // return a more-hackable pointer
    get fullPointer() {
      const { docs, ptrs, document } = this;
      // compute a proper pointer, from docs
      const pointers = ptrs || docs.map((_d, n) => [n]);
      // do we need to repair it, first?
      return pointers.map(a => {
        // eslint-disable-next-line prefer-const
        let [n, start, end, id, endId] = a;
        start ||= 0;
        end ||= (document[n] || []).length;
        //add frozen id, for good-measure
        if (document[n]?.[start]) {
          id ||= document[n][start].id;
          if (document[n][end - 1]) {
            endId ||= document[n][end - 1].id;
          }
        }
        return [n, start, end, id, endId]
      })
    }
    // create a new View, from this one
    update(pointer) {
      const m = new View(this.document, pointer);
      // send the cache down, too?
      if (this._cache && pointer?.length > 0) {
        // only keep cache if it's a full-sentence
        const cache = [];
        pointer.forEach((ptr, i) => {
          const [n, start, end] = ptr;
          if (ptr.length === 1) {
            cache[i] = this._cache[n];
          } else if (start === 0 && this.document[n].length === end) {
            cache[i] = this._cache[n];
          }
        });
        if (cache.length > 0) {
          m._cache = cache;
        }
      }
      m.world = this.world;
      return m
    }
    // create a new View, from this one
    toView(pointer) {
      return new View(this.document, pointer || this.pointer)
    }
    fromText(input) {
      const { methods } = this;
      //assume ./01-tokenize is installed
      const document = methods.one.tokenize.fromString(input, this.world);
      const doc = new View(document);
      doc.world = this.world;
      return retag(doc, ['normal'])
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0); //node 17: structuredClone(document);
      document = document.map(terms => {
        return terms.map(term => {
          term = { ...term };
          term.tags = new Set(term.tags);
          return term
        })
      });
      // clone only sub-document ?
      const m = this.update(this.pointer);
      m.document = document;
      m._cache = this._cache; //clone this too?
      return m
    }
  }
  Object.assign(View.prototype, methods$n);
  // subclasses set their own name on their prototype
  View.prototype.viewType = 'View';

  var version$1 = '14.20.0';

  const isObject$2 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  const isUnsafeKey = key => key === '__proto__' || key === 'constructor' || key === 'prototype';

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$2(plugin)) {
      for (const key in plugin) {
        // prevent prototype pollution
        if (isUnsafeKey(key)) {
          continue
        }
        if (isObject$2(plugin[key])) {
          if (!model[key]) {
            model[key] = {};
          }
          mergeDeep(model[key], plugin[key]); //recursion
        } else if (Array.isArray(plugin[key]) && Array.isArray(model[key])) {
          // a list, like model.one.contractions, is added to - not replaced
          model[key] = model[key].concat(plugin[key]);
        } else {
          model[key] = plugin[key];
        }
      }
    }
    return model
  }
  // const merged = mergeDeep({ a: 1 }, { b: { c: { d: { e: 12345 } } } })
  // console.dir(merged, { depth: 5 })

  // vroom
  function mergeQuick(model, plugin) {
    for (const key in plugin) {
      if (isUnsafeKey(key)) continue
      model[key] ||= {};
      Object.assign(model[key], plugin[key]);
    }
    return model
  }

  // verb forms, then adjective forms
  const irregularForms = [
    ['pastTense', 'Past'],
    ['presentTense', 'Present'],
    ['gerund', 'Gerund'],
    ['comparative', 'Comparative'],
    ['superlative', 'Superlative'],
  ];

  const addIrregulars = function (model, conj) {
    const m = model.two.models || {};
    Object.keys(conj).forEach(k => {
      irregularForms.forEach(([prop, name]) => {
        const form = conj[k][prop];
        if (!form) {
          return
        }
        if (m['to' + name]) {
          m['to' + name].ex[k] = form;
        }
        if (m['from' + name]) {
          m['from' + name].ex[form] = k;
        }
      });
    });
  };

  const extend = function (plugin, world, View, nlp) {
    // support array of plugins
    if (Array.isArray(plugin)) {
      plugin.forEach(p => extend(p, world, View, nlp));
      return
    }
    const { methods, model, compute, hooks } = world;
    if (plugin.methods) {
      mergeQuick(methods, plugin.methods);
    }
    if (plugin.model) {
      mergeDeep(model, plugin.model);
    }
    if (plugin.irregulars) {
      addIrregulars(model, plugin.irregulars);
    }
    // shallow-merge compute
    if (plugin.compute) {
      Object.assign(compute, plugin.compute);
    }
    // append new hooks
    if (hooks) {
      world.hooks = hooks.concat(plugin.hooks || []);
    }
    // Notify plugins when replacement creates new terms.
    if (plugin.onReplace) {
      methods.one.onReplace = (methods.one.onReplace || []).concat(plugin.onReplace);
    }
    // assign new class methods
    if (plugin.api) {
      plugin.api(View);
    }
    if (plugin.lib) {
      Object.keys(plugin.lib).forEach(k => (nlp[k] = plugin.lib[k]));
    }
    if (plugin.tags) {
      nlp.addTags(plugin.tags);
    }
    if (plugin.words) {
      nlp.addWords(plugin.words);
    }
    if (plugin.frozen) {
      nlp.addWords(plugin.frozen, true);
    }
    if (plugin.mutate) {
      plugin.mutate(world, nlp);
    }
  };

  // Shared CLI colors and styles. Plain text when NO_COLOR is set, as the convention asks
  const off = typeof process !== 'undefined' && Object.hasOwn(process.env || {}, 'NO_COLOR');
  const color = code => s => (off ? s : '\x1b[' + code + 'm' + s + '\x1b[0m');

  const green = color(32);
  const red = color(31);
  const blue = color(34);
  const cyan = color(36);
  const yellow = color(33);
  // used by name, from the tagset colors
  const magenta = color(35);
  const dim = color(2);
  const i$1 = color(3);
  const b = color(1);
  const ul = color(4);
  const grey = color(90);

  var cli = /*#__PURE__*/Object.freeze({
    __proto__: null,
    b: b,
    blue: blue,
    cyan: cyan,
    dim: dim,
    green: green,
    grey: grey,
    i: i$1,
    magenta: magenta,
    red: red,
    ul: ul,
    yellow: yellow
  });

  const env = globalThis.process?.env ?? globalThis.env ?? {};
  const debug$2 = { tags: Boolean(env.DEBUG_TAGS) };

  // Capture only the requested terms, and only while tracing.
  const before$3 = term => {
    if (debug$2.tags && (!debug$2.word || debug$2.word === (term.normal || term.text || term.implicit || '').toLowerCase())) {
      return [...term.tags]
    }
    return null
  };

  // Show actual changes, including conflict removals.
  const log = (term, previous, reason = '') => {
    if (!previous) {
      return
    }
    const added = [...term.tags].filter(tag => !previous.includes(tag));
    const removed = previous.filter(tag => !term.tags.has(tag));
    if (!added.length && !removed.length) {
      return
    }
    const text = term.text || term.implicit || '';
    const index = term.index?.join(':') || '?';
    const prefix = debug$2.prefix || '   ';
    if (debug$2.rule !== reason) {
      const headingPrefix = debug$2.prefix ? prefix.replace('│  ', '│ ') : '  ';
      console.log(`${headingPrefix}${dim((reason || 'tag change') + ':')}`); // eslint-disable-line no-console
      debug$2.rule = reason;
    }
    const print = (tags, sign, color) => {
      if (!tags.length) {
        return
      }
      const word = color(`'${text}'`);
      const changes = tags.map(tag => color(`#${tag}`)).join(' ');
      console.log(`${prefix}${color(sign)} ${word} ${dim(index.padEnd(9))} ${changes}`); // eslint-disable-line no-console
    };
    print(removed, '−', red);
    print(added, '+', green);
  };

  debug$2.before = before$3;
  debug$2.log = log;

  // Install only while verbose matching is enabled; restore the original hot path.
  const matchDebug = (world, options) => {
    const one = world.methods.one;
    const match = one.match;
    const parse = one.parseMatch;
    const sources = new WeakMap();
    const word = options.word?.toLowerCase();
    const includesWord = terms =>
      !word || terms.some(term => (term.normal || term.text || term.implicit || '').toLowerCase() === word);

    const parseLogged = function (...args) {
      const regs = parse.apply(this, args);
      sources.set(regs, String(args[0]));
      return regs
    };
    const matchLogged = function (docs, todo, cache) {
      const result = match.call(this, docs, todo, cache);
      const pattern = todo.match || sources.get(todo.regs) || '[parsed pattern]';
      if (options.pattern !== undefined && pattern !== options.pattern) {
        return result
      }
      if (word && !docs.some(includesWord)) {
        return result
      }
      const matches = result.ptrs
        .map(([n, start, end]) => docs[n].slice(start, end))
        .filter(includesWord);
      if (word && result.ptrs.length && !matches.length) {
        return result
      }
      debug$2.rule = undefined;
      const status = result.ptrs.length ? green('✓') : red('✗');
      const spans = matches.map(terms => {
        const text = terms.map(term => term.text || term.implicit).join(' ');
        return `${green("'" + text + "'")} ${dim(terms[0]?.index?.join(':') || '?')}`
      }).join(', ');
      const rule = pattern.length > 80 ? pattern.slice(0, 79) + '…' : pattern;
      const words = spans ? spans + '  ' : ' ---         ';
      console.log(`${debug$2.prefix || '   '}${status} ${words}${dim(i$1(rule))}`); // eslint-disable-line no-console
      return result
    };
    one.parseMatch = parseLogged;
    one.match = matchLogged;
    return () => {
      // Do not overwrite a plugin's replacement installed during tracing.
      if (one.parseMatch === parseLogged) {
        one.parseMatch = parse;
      }
      if (one.match === matchLogged) {
        one.match = match;
      }
    }
  };

  const colorSpec = doc => {
    return doc.docs
      .map((terms, index) => {
        const plain = terms.map(t => t.pre + t.text + t.post).join('').trim();
        const text = dim("'" + plain + "'");
        const spec = doc.update([[index]]).out('spec');
        return text + grey(i$1(spec.slice(plain.length)))
      })
      .join('\n')
  };

  // Trace the actual pipeline once, including the initial tokenized document.
  const hooksDebug = headings => (doc, hooks) => {
    const width = Math.max('tokenize'.length, ...hooks.map(hook => hook.length));
    const snapshot = (hook, nested = false) => {
      const output = colorSpec(doc);
      output.split('\n').forEach((line, index, lines) => {
        if (nested) {
          const branch = index === lines.length - 1 ? ' ╰─' : '│ ';
          console.log(`  ${dim(branch)} ${line}`); // eslint-disable-line no-console
          return
        }
        const label = (index === 0 ? hook : '').padEnd(width);
        console.log(`  ${dim(label)}  ${line}`); // eslint-disable-line no-console
      });
    };
    snapshot('tokenize');
    hooks.forEach(hook => {
      const nested = headings;
      const prefix = debug$2.prefix;
      const rule = debug$2.rule;
      debug$2.rule = undefined;
      if (nested) {
        console.log(`  ${blue(b(ul(hook + ':')))}`); // eslint-disable-line no-console
        debug$2.prefix = dim('   │  ');
      }
      // Restore the log prefix even when a plugin hook throws.
      try {
        doc.compute(hook);
        snapshot(hook, nested);
      } finally {
        debug$2.prefix = prefix;
        debug$2.rule = rule;
      }
    });
  };

  let restoreMatch;

  /** log the decision-making to console */
  const verbose = function (set = true, options = {}) {
    restoreMatch?.();
    restoreMatch = undefined;
    if (set === 'match' || set === true) {
      restoreMatch = matchDebug(this._world, options);
    }
    debug$2.hooks = set === 'hooks' || set === true ? hooksDebug(set === true) : undefined;
    debug$2.word = options.word?.toLowerCase();
    debug$2.contractions = set === 'contractions' || set === true;
    debug$2.rule = undefined;
    debug$2.tags = set === 'tagger' || set === true;
    debug$2.spec = set === 'spec' || set === true;
    return this
  };

  // a plain object - not an array, null, or class instance
  const isObject$1 = val => Object.prototype.toString.call(val) === '[object Object]';

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (Array.isArray(term.tags)) {
          term.tags = new Set(term.tags);
        }
        return term
      })
    })
  };

  // interpret an array-of-arrays
  const preTokenized = function (arr) {
    return arr.map((a) => {
      return a.map(str => {
        return {
          text: str,
          normal: str,//cleanup
          pre: '',
          post: ' ',
          tags: new Set()
        }
      })
    })
  };

  const inputs = function (input, View, world) {
    const { methods } = world;
    const doc = new View([]);
    doc.world = world;
    // support a number
    if (typeof input === 'number') {
      input = String(input);
    }
    // return empty doc
    if (!input) {
      return doc
    }
    // parse a string
    if (typeof input === 'string') {
      const document = methods.one.tokenize.fromString(input, world);
      return new View(document)
    }
    // handle compromise View
    if (isObject$1(input) && input.isView) {
      return new View(input.document, input.ptrs)
    }
    // handle json input
    if (Array.isArray(input)) {
      // pre-tokenized array-of-arrays 
      if (Array.isArray(input[0])) {
        const document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      const document = fromJson(input);
      return new View(document)
    }
    return doc
  };

  const world = { ...tmpWrld };
  // the steps to run before (or without) the tagger
  const preTag = ['alias', 'normal', 'machine', 'contractions'];

  const nlp = function nlp(input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    const doc = inputs(input, View, world);
    if (input) {
      if (debug$2.hooks) {
        debug$2.hooks(doc, world.hooks);
      } else {
        doc.compute(world.hooks);
      }
    }
    return doc
  };
  Object.defineProperty(nlp, '_world', {
    value: world,
    writable: true,
  });

  /** don't run the POS-tagger */
  nlp.tokenize = function (input, lex) {
    const { compute } = this._world;
    // add user-given words to lexicon
    if (lex) {
      nlp.addWords(lex);
    }
    // run the tokenizer
    const doc = inputs(input, View, world);
    // give contractions a shot, at least
    if (debug$2.hooks) {
      debug$2.hooks(doc, compute.contractions ? preTag : []);
    } else if (compute.contractions) {
      doc.compute(preTag); //run it if we've got it
    }
    return doc
  };

  /** extend compromise functionality */
  nlp.plugin = function (plugin) {
    extend(plugin, this._world, View, this);
    return this
  };
  nlp.extend = nlp.plugin;

  /** reach-into compromise internals */
  nlp.world = function () {
    return this._world
  };
  nlp.model = function () {
    return this._world.model
  };
  nlp.methods = function () {
    return this._world.methods
  };
  nlp.hooks = function () {
    return this._world.hooks
  };

  // log the decision-making to console
  nlp.verbose = verbose;
  // current library release version
  nlp.version = version$1;

  const createCache = function (document) {
    const cache = document.map(terms => {
      const items = new Set();
      terms.forEach(term => {
        // add words
        if (term.normal !== '') {
          items.add(term.normal);
        }
        // cache switch-status - '%Noun|Verb%'
        if (term.switch) {
          items.add(`%${term.switch}%`);
        }
        // cache implicit words, too
        if (term.implicit) {
          items.add(term.implicit);
        }
        if (term.machine) {
          items.add(term.machine);
        }
        if (term.root) {
          items.add(term.root);
        }
        // cache slashes words, etc
        if (term.alias) {
          term.alias.forEach(str => items.add(str));
        }
        term.tags.forEach(tag => {
          items.add('#' + tag);
        });
      });
      return items
    });
    return cache
  };

  var methods$m = {
    one: {
      cacheDoc: createCache,
    },
  };

  const methods$l = {
    /** */
    cache: function () {
      this._cache = this.methods.one.cacheDoc(this.document);
      return this
    },
    /** */
    uncache: function () {
      this._cache = null;
      return this
    },
  };
  const addAPI$3 = function (View) {
    Object.assign(View.prototype, methods$l);
  };

  var compute$6 = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$3 = {
    api: addAPI$3,
    compute: compute$6,
    methods: methods$m,
  };

  // visit every term of a nested document: fn(term, terms, t, n)
  const eachTerm = (docs, fn) => {
    for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      for (let t = 0; t < terms.length; t += 1) {
        fn(terms[t], terms, t, n);
      }
    }
  };

  // uppercase the first letter - todo: support unicode?
  const titleCase$2 = str => str.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase());

  // change the text of every term
  const mapText = function (view, fn) {
    view.termList().forEach(t => {
      t.text = fn(t.text);
    });
    return view
  };

  var caseFns = {
    /** */
    toLowerCase: function () {
      return mapText(this, str => str.toLowerCase())
    },
    /** */
    toUpperCase: function () {
      return mapText(this, str => str.toUpperCase())
    },
    /** */
    toTitleCase: function () {
      return mapText(this, titleCase$2)
    },
    /** */
    toCamelCase: function () {
      eachTerm(this.docs, (t, terms, i) => {
        if (i !== 0) {
          t.text = titleCase$2(t.text);
        }
        if (i !== terms.length - 1) {
          t.post = '';
        }
      });
      return this
    },
  };

  // case logic for the first character of a word
  const isTitleCase = str => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase = str => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = str => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // give a new word the case of the one it replaced: 'Danes' -> 'Dane', 'DANES' -> 'DANE'
  const matchCase$1 = (original, str) => {
    if (original.length > 1 && original === original.toUpperCase() && original !== original.toLowerCase()) {
      return str.toUpperCase()
    }
    return /^\p{Lu}/u.test(original) ? toTitleCase(str) : str
  };

  // Heal the edges of a sentence, when its first or last words change.
  // Shared by insert and remove, and by the noun and verb conversions.

  // a capital of its own, not the sentence's - 'Spencer', 'NASA', 'I', or 'Plan B'
  const ownsCapital = function (term) {
    if (term.tags.has('ProperNoun') || term.tags.has('Acronym')) {
      return true
    }
    return term.text.length === 1 || !isTitleCase(term.text)
  };

  // the first word of a sentence lends its capital to a new first word
  const passCapital = function (from, to, drop) {
    if (!/^\p{Lu}/u.test(from.text)) {
      return
    }
    to.text = toTitleCase(to.text);
    if (drop && !ownsCapital(from)) {
      from.text = toLowerCase(from.text);
    }
  };

  // quotes, brackets and newlines open a phrase, so they stay in front of it
  const passOpening = function (from, to) {
    to.pre = from.pre + to.pre;
    from.pre = '';
  };

  // a bare hyphen joins two words - 'well-fed'
  const isJoiner = post => /^[-–]$/.test(post);

  // "dogs' bowls" - with no opening quote before it, an apostrophe belongs to its word
  const isPossessive = function (terms, i) {
    if (!/^['’]/.test(terms[i].post)) {
      return false
    }
    return !terms.slice(0, i + 1).some(term => /['‘]/.test(term.pre))
  };

  // periods, commas, closing quotes and brackets end a phrase, so they stay behind it
  const passClosing = function (terms, i, to) {
    const from = terms[i];
    // nothing to move, or it is part of the word
    if (!from.post || isJoiner(from.post) || isPossessive(terms, i)) {
      return false
    }
    let post = from.post;
    // the new words may bring their own ending - 'loudly!'
    if (/[.?!…]/.test(to.post)) {
      post = post.replace(/^[.?!…]+/, '');
    }
    to.post = to.post.trimEnd() + post;
    from.post = ' ';
    return true
  };

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    if (parent) {
      parent.splice(index, 0, ...child);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    const lastTerm = terms.at(-1);
    if (lastTerm && !hasSpace.test(lastTerm.post) && !hasDash.test(lastTerm.post)) {
      lastTerm.post += ' ';
    }
  };

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document, agree) {
    const [n, start, end] = ptr;
    // introduce spaces appropriately
    if (start === 0) {
      // at start - need space in insert
      endSpace(needle);
    } else if (end === document[n].length) {
      // at end - need space in home
      endSpace(needle);
    } else {
      // in middle - need space in home and insert
      endSpace(needle);
      endSpace([home[ptr[1]]]);
    }
    if (agree) {
      // '"dogs' -> '"the dogs'
      passOpening(home[start], needle[0]);
      // 'Dogs' -> 'The dogs'
      if (start === 0) {
        passCapital(home[start], needle[0], true);
      }
    }
    spliceArr(home, start, needle);
  };

  const cleanAppend = function (home, ptr, needle, document, agree) {
    const [n, , end] = ptr;
    const total = (document[n] || []).length;
    // 'bark.' -> 'bark loudly.'
    const moved = agree && home[end - 1] && passClosing(home, end - 1, needle.at(-1));
    if (!moved && end < total) {
      // in the middle - add trailing space on self
      endSpace(needle);
    } else if (!moved) {
      // at the end - add a space to predecessor
      endSpace(home);
      // is there another sentence after?
      if (document[n + 1]) {
        needle.at(-1).post += ' ';
      }
    }
    spliceArr(home, ptr[2], needle);
    // set new endId
    ptr[4] = needle.at(-1).id;
  };

  /*
  unique & ordered term ids, based on time & term index

  Base 36 (numbers+ascii)
    3 digit 4,600
    2 digit 1,200
    1 digit 36

    TTT|NNN|II|R

  TTT -> 46 terms since load
  NNN -> 46 thousand sentences (>1 inf-jest)
  II  -> 1,200 words in a sentence (nuts)
  R   -> 1-36 random number 

  novels: 
    avg 80,000 words
      15 words per sentence
    5,000 sentences

  Infinite Jest:
    36,247 sentences
    https://en.wikipedia.org/wiki/List_of_longest_novels

  collisions are more-likely after
      46 seconds have passed,
    and 
      after 46-thousand sentences

  */
  let index$1 = 0;

  const pad3 = str => str.padStart(3, '0');

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    index$1 += 1;

    //don't overflow index
    index$1 = index$1 > 46655 ? 0 : index$1;
    //don't overflow sentences
    n = n > 46655 ? 0 : n;
    // //don't overflow terms
    i = i > 1294 ? 0 : i;

    // 3 digits for time
    let id = pad3(index$1.toString(36));
    // 3 digit  for sentence index (46k)
    id += pad3(n.toString(36));

    // 1 digit for term index (36)
    id += i.toString(36).padStart(2, '0');

    // 1 digit random number
    const r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we changing part of a contraction? expand it first
  const expandContraction = function (m) {
    if (m.has('@hasContraction') && m.contractions) {
      m.grow('@hasContraction').contractions().expand();
    }
  };

  // set new ids for each terms
  const addIds$2 = function (terms) {
    terms = terms.map(term => {
      term.id = toId(term);
      return term
    });
    return terms
  };

  const getTerms = function (input, world) {
    const { methods } = world;
    // create our terms from a string
    if (typeof input === 'string') {
      return methods.one.tokenize.fromString(input, world)[0] //assume one sentence
    }
    //allow a view object
    if (typeof input === 'object' && input.isView) {
      return input.clone().docs[0] || [] //assume one sentence
    }
    //allow an array of terms, too
    if (Array.isArray(input)) {
      return Array.isArray(input[0]) ? input[0] : input
    }
    return []
  };

  // {agree: false} skips moving any capitals or punctuation
  const insert = function (input, view, prepend, opts = {}) {
    const agree = opts.agree !== false;
    const { document, world } = view;
    view.uncache();
    // insert words at end of each doc
    const ptrs = view.fullPointer;
    const selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      const ptr = m.fullPointer[0];
      const [n] = ptr;
      // add-in the words
      const home = document[n];
      let terms = getTerms(input, world);
      // are we inserting nothing?
      if (terms.length === 0) {
        return
      }
      terms = addIds$2(terms);
      if (prepend) {
        expandContraction(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document, agree);
      } else {
        expandContraction(view.update([ptr]).lastTerm());
        cleanAppend(home, ptr, terms, document, agree);
      }
      // harden the pointer
      if (document[n]?.[ptr[1]]) {
        ptr[3] = document[n][ptr[1]].id;
      }
      // change self backwards by len
      selfPtrs[i] = ptr;
      // extend the pointer
      ptr[2] += terms.length;
      ptrs[i] = ptr;
    });
    const doc = view.toView(ptrs);
    // shift our self pointer, if necessary
    view.ptrs = selfPtrs;
    // try to tag them, too
    return retag(doc, ['id', 'index'])
  };

  const fns$3 = {
    insertAfter: function (input, opts) {
      return insert(input, this, false, opts)
    },
    insertBefore: function (input, opts) {
      return insert(input, this, true, opts)
    },
  };
  fns$3.append = fns$3.insertAfter;
  fns$3.prepend = fns$3.insertBefore;
  fns$3.insert = fns$3.insertAfter;

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$2 = {};

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn, keep) {
    const ptrs = [];
    main.forEach((m, i) => {
      const out = m.replaceWith(fn(m, i), keep);
      ptrs.push(...out.fullPointer);
    });
    // a full document needs no new pointer
    if (main.ptrs) {
      main.ptrs = ptrs;
    }
    return main
  };

  // support 'foo $0' replacements, using this match's own groups
  const subDollarSign = function (input, main, [n, start, end]) {
    const groups = main._groups;
    return input.replace(dollarStub, a => {
      const name = a.replace(/\$/, '');
      const ptrs = Object.hasOwn(groups, name) ? groups[name] : [];
      const found = ptrs.find(ptr => ptr[0] === n && ptr[1] >= start && ptr[2] <= end);
      if (found) {
        // any end-punctuation will be moved over from the original
        return main.update([found]).text({ keepEndPunct: false })
      }
      return a
    })
  };

  // remember each match, before we change it
  const getOriginal = function (terms) {
    const last = terms.at(-1);
    return {
      pre: terms[0].pre,
      post: last.post,
      isTitleCase: isTitleCase(terms[0].text),
      text: terms[0].text,
      isPossessive: last.tags.has('Possessive'),
      tags: terms.map(term => Array.from(term.tags)),
    }
  };

  // keep any punctuation, and "John's"
  const restoreOriginal = function (terms, original, keep) {
    const last = terms.at(-1);
    if (keep.possessives && original.isPossessive && !last.tags.has('Possessive')) {
      last.text += "'s";
      last.normal += "'s";
      last.tags.add('Possessive');
    }
    // try to keep some pre-punctuation
    if (original.pre) {
      terms[0].pre = original.pre;
    }
    // try to keep any post-punctuation
    if (original.post) {
      // the punctuation may have moved here without its spaces - ' - '
      const post = last.post.trim();
      if (!post || post === original.post.trim()) {
        last.post = original.post;
      }
    }
  };

  fns$2.replaceWith = function (input, keep = {}) {
    // support keep-all option
    if (keep === true) {
      keep = {
        tags: true,
        case: true,
        possessives: true,
      };
    }
    const main = this;
    this.uncache();
    if (!main.found) {
      return main
    }
    if (typeof input === 'function') {
      return replaceByFn(main, input, keep)
    }
    // each match has its own '$0' text
    if (typeof input === 'string' && input.includes('$') && Object.keys(main._groups).length > 0) {
      const strs = main.fullPointer.map(ptr => subDollarSign(input, main, ptr));
      return replaceByFn(main, (_m, i) => strs[i], keep)
    }
    const originals = main.docs.map(getOriginal);
    // Preserve old Term identities for plugins before insertion/deletion changes the view.
    const replacements =
      this.world.methods.one.onReplace &&
      this.fullPointer.map(([n, start, end]) => ({
        sentence: this.document[n],
        before: new Set(this.document[n]),
        oldTerms: this.document[n].slice(start, end),
      }));
    const original = this.update(this.fullPointer);
    // slide this in
    if (typeof input === 'string') {
      input = this.fromText(input).compute('id');
    }
    // {agree: false} swaps the words, and nothing else
    const agree = keep.agree !== false;
    main.insertAfter(input, { agree });
    // New terms follow each old match; stop at an existing term to separate nearby matches.
    if (replacements) {
      replacements.forEach(group => {
        const start = group.sentence.indexOf(group.oldTerms.at(-1)) + 1;
        group.newTerms = [];
        for (let i = start; i < group.sentence.length && !group.before.has(group.sentence[i]); i += 1) {
          group.newTerms.push(group.sentence[i]);
        }
      });
    }
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      const more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    // (we restore the start of the phrase ourselves, below)
    // the new words take the sentence's capital, unless {case: false}
    // (we restore the punctuation ourselves, below)
    main.delete(original, { agree, start: keep.case !== false, end: false }); //science.

    // main now points at only the new terms
    if (agree) {
      main.docs.forEach((terms, i) => restoreOriginal(terms, originals[i], keep));
    }

    // what should we return?
    const m = retag(main.toView(), ['index']);
    // replace any old tags
    if (keep.tags) {
      m.forEach((match, i) => {
        match.terms().forEach((term, k) => term.tagSafe(originals[i].tags[k]));
      });
    }
    // try to co-erce case, too
    if (keep.case) {
      m.docs.forEach((terms, i) => {
        const transformCase = originals[i].isTitleCase ? toTitleCase : toLowerCase;
        // 'DOGS' -> 'CATS'
        terms[0].text = matchCase$1(originals[i].text, transformCase(terms[0].text));
      });
    }
    // Transfer plugin metadata after replacement text, punctuation, and case are finalized.
    if (m.world.methods.one.onReplace) {
      replacements.forEach(({ oldTerms, newTerms }) => {
        m.world.methods.one.onReplace.forEach(fn => fn({ oldTerms, newTerms, document: m.document }));
      });
    }
    return m
  };

  fns$2.replace = function (match, input, keep) {
    if (match && input === undefined) {
      return this.replaceWith(match, keep)
    }
    const m = this.match(match);
    if (!m.found) {
      return this
    }
    this.soften();
    return m.replaceWith(input, keep)
  };

  // Remove only the first qualifying run, matching String.replace without /g.
  const removeRunBefore = (str, run, following) => {
    let i = 0;
    while (i < str.length) {
      if (!run.includes(str[i])) {
        i++;
        continue
      }
      const start = i;
      while (i < str.length && run.includes(str[i])) i++;
      if (i < str.length && following.includes(str[i])) {
        return str.slice(0, start) + str.slice(i)
      }
    }
    return str
  };

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    const last = terms.length - 1;
    const from = terms[last];
    const to = terms[last - len];
    if (to && from) {
      to.post += from.post; //this isn't perfect.
      to.post = removeRunBefore(to.post, ' ', '.?!,;:"”)]');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = removeRunBefore(to.post, ',;:', '.?!');
    }
  };

  const pairs$3 = { '(': ')', '[': ']', '"': '"', '“': '”', '‘': '’' };

  // a quote or bracket that opens and closes on the removed words leaves with them - '(loudly)'
  const dropPairs = function (terms, start, end) {
    const first = terms[start];
    const last = terms[end - 1];
    Object.keys(pairs$3).forEach(open => {
      if (first.pre.includes(open) && last.post.includes(pairs$3[open])) {
        first.pre = first.pre.replace(open, '');
        last.post = last.post.replace(pairs$3[open], '');
      }
    });
  };

  // the word before us becomes the end of the phrase - 'bark loudly, and' -> 'bark, and'
  const repairEnd = function (terms, start, end) {
    const prev = terms[start - 1];
    const post = terms[end - 1].post;
    // is there anything to keep, and room to keep it?
    if (prev && /\S/.test(post) && !/\S/.test(prev.post)) {
      prev.post = post;
    }
  };

  // the words after us become the start of the phrase
  const repairStart = function (terms, start, end) {
    const next = terms[end];
    if (!next) {
      return
    }
    // '"the dogs' -> '"dogs'
    passOpening(terms[start], next);
    // 'The dogs' -> 'Dogs'
    if (start === 0) {
      passCapital(terms[start], next);
    }
  };

  // remove terms from document json
  const pluckOut = function (document, nots, opts = {}) {
    nots.forEach(ptr => {
      const [n, start, end] = ptr;
      const len = end - start;
      if (!document[n]) {
        return // weird!
      }
      if (opts.agree !== false) {
        dropPairs(document[n], start, end);
        if (end === document[n].length && end > 1) {
          repairPunct(document[n], len);
        } else if (opts.end !== false) {
          repairEnd(document[n], start, end);
        }
        if (opts.start !== false) {
          repairStart(document[n], start, end);
        }
      }
      document[n].splice(start, len); // replaces len terms at index start
    });
    // remove any now-empty sentences
    // (foreach + splice = 'mutable filter')
    for (let i = document.length - 1; i >= 0; i -= 1) {
      if (document[i].length === 0) {
        document.splice(i, 1);
        // remove any trailing whitespace before our removed sentence
        if (i === document.length && document[i - 1]) {
          const terms = document[i - 1];
          const lastTerm = terms.at(-1);
          if (lastTerm) {
            lastTerm.post = lastTerm.post.trimEnd();
          }
        }
        // repair any downstream indexes
        // for (let k = i; k < document.length; k += 1) {
        //   document[k].forEach(term => term.index[0] -= 1)
        // }
      }
    }
    return document
  };

  // which sentences will have no terms left?
  const getEmptied = function (gonePtrs, document) {
    return Object.keys(gonePtrs).map(Number).filter(n => {
      const count = gonePtrs[n].reduce((sum, no) => sum + no[2] - no[1], 0);
      return document[n] && count >= document[n].length
    })
  };

  // gonePtrs must run from last-to-first, in each sentence
  const fixPointers$1 = function (ptrs, gonePtrs, emptied) {
    ptrs = ptrs.map(ptr => {
      const [n] = ptr;
      const gone = gonePtrs[n] || [];
      gone.forEach(no => {
        const len = no[2] - no[1];
        // does it effect our pointer?
        if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
          ptr[2] -= len;
        } else if (ptr[1] >= no[2]) {
          // terms before our pointer are gone
          ptr[1] -= len;
          ptr[2] -= len;
        }
      });
      // sentences before our pointer are gone
      ptr[0] -= emptied.filter(k => k < n).length;
      // remove old hard-pointers
      ptr[3] = null;
      ptr[4] = null;
      return ptr
    });
    // remove any now-empty pointers
    return ptrs.filter(ptr => ptr[2] - ptr[1] > 0)
  };

  const methods$k = {
    // {agree: false} skips moving any capitals or punctuation
    remove: function (reg, opts) {
      const { indexN } = this.methods.one.pointer;
      // allow .remove({agree: false})
      if (reg && Object.hasOwn(reg, 'agree')) {
        opts = reg;
        reg = undefined;
      }
      this.uncache();
      // two modes:
      //  - a. remove self, from full parent
      let self = this.all();
      let not = this;
      //  - b. remove a match, from self
      if (reg) {
        self = this;
        not = this.match(reg);
      }
      const isFull = !self.ptrs;
      // is it part of a contraction?
      expandContraction(not);

      let ptrs = self.fullPointer;
      const nots = not.fullPointer.reverse();
      const gonePtrs = indexN(nots);
      const emptied = getEmptied(gonePtrs, this.document);
      // remove them from the actual document)
      const document = pluckOut(this.document, nots, opts);
      // repair our pointers
      ptrs = fixPointers$1(ptrs, gonePtrs, emptied);
      // clean up our original inputs
      self.ptrs = ptrs;
      self.document = document;
      self.compute('index');
      // if we started zoomed-out, try to end zoomed-out
      if (isFull) {
        self.ptrs = undefined;
      }
      if (!reg) {
        this.ptrs = [];
        return self.none()
      }
      const res = self.toView(ptrs); //return new document
      return res
    },
  };

  // aliases
  methods$k.delete = methods$k.remove;

  // set or append the pre/post of the first/last term of each match
  const setSide = function (view, side, str, concat) {
    view.docs.forEach(terms => {
      const term = side === 'pre' ? terms[0] : terms.at(-1);
      if (concat === true) {
        term[side] += str;
      } else {
        term[side] = str;
      }
    });
    return view
  };

  // put these characters around each match
  const wrap$2 = function (view, start, end) {
    view.docs.forEach(terms => {
      terms[0].pre = start + terms[0].pre;
      const last = terms.at(-1);
      last.post = end + last.post;
    });
    return view
  };

  const methods$j = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      return setSide(this, 'pre', str, concat)
    },

    /** add this punctuation or whitespace after each match: */
    post: function (str, concat) {
      if (str === undefined) {
        const last = this.docs.at(-1);
        return last.at(-1).post
      }
      return setSide(this, 'post', str, concat)
    },

    /** remove whitespace from start/end */
    trim: function () {
      if (!this.found) {
        return this
      }
      const docs = this.docs;
      const start = docs[0][0];
      start.pre = start.pre.trimStart();
      const last = docs.at(-1);
      const end = last.at(-1);
      end.post = end.post.trimEnd();
      return this
    },

    /** connect words with hyphen, and remove whitespace */
    hyphenate: function () {
      //remove whitespace
      eachTerm(this.docs, (t, terms, i) => {
        if (i !== 0) {
          t.pre = '';
        }
        if (terms[i + 1]) {
          t.post = '-';
        }
      });
      return this
    },

    /** remove hyphens between words, and set whitespace */
    dehyphenate: function () {
      const hasHyphen = /[-–—]/;
      //remove whitespace
      eachTerm(this.docs, t => {
        if (hasHyphen.test(t.post)) {
          t.post = ' ';
        }
      });
      return this
    },

    /** add quotations around these matches */
    toQuotations: function (start, end) {
      return wrap$2(this, start || '"', end || '"')
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      return wrap$2(this, start || '(', end || ')')
    },
  };

  // aliases
  methods$j.deHyphenate = methods$j.dehyphenate;
  methods$j.toQuotation = methods$j.toQuotations;

  /** alphabetical order */
  const alpha = (a, b) => {
    if (a.normal < b.normal) {
      return -1
    }
    if (a.normal > b.normal) {
      return 1
    }
    return 0
  };

  /** count the # of characters of each match - longest first */
  const length = (a, b) => b.normal.trim().length - a.normal.trim().length;

  /** count the # of terms in each match - most first */
  const wordCount$1 = (a, b) => b.words - a.words;

  /** document order - sentence, then start, then end of each match */
  const sequential = (a, b) => a.pointer[0] - b.pointer[0] || a.pointer[1] - b.pointer[1] || a.pointer[2] - b.pointer[2];

  /** sort by # of duplicates in the document*/
  const byFreq = function (arr) {
    const counts = Object.create(null);
    arr.forEach(o => {
      counts[o.normal] ??= 0;
      counts[o.normal] += 1;
    });
    // sort by freq - most first
    arr.sort((a, b) => counts[b.normal] - counts[a.normal]);
    return arr
  };

  var methods$i = { alpha, length, wordCount: wordCount$1, sequential, byFreq };

  // aliases
  const seqNames = new Set(['index', 'sequence', 'seq', 'sequential', 'chron', 'chronological']);
  const freqNames = new Set(['freq', 'frequency', 'topk', 'repeats']);
  const alphaNames = new Set(['alpha', 'alphabetical']);

  // support function as parameter
  const customSort = function (view, fn) {
    let ptrs = view.fullPointer;
    ptrs = ptrs.sort((a, b) => {
      a = view.update([a]);
      b = view.update([b]);
      return fn(a, b)
    });
    view.ptrs = ptrs; //mutate original
    return view
  };

  /** re-arrange the order of the matches (in place) */
  const sort = function (input) {
    const { docs } = this;
    this.uncache();
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input ||= 'alpha';
    const ptrs = rawPointer(this);
    let arr = docs.map((terms, n) => {
      return {
        index: n,
        words: terms.length,
        normal: terms.map(t => t.machine || t.normal || '').join(' '),
        pointer: ptrs[n],
      }
    });
    // 'chronological' sorting
    if (seqNames.has(input)) {
      input = 'sequential';
    }
    // alphabetical sorting
    if (alphaNames.has(input)) {
      input = 'alpha';
    }
    // sort by frequency
    if (freqNames.has(input)) {
      arr = methods$i.byFreq(arr);
      return this.update(arr.map(o => o.pointer))
    }
    // apply sort method on each phrase
    if (typeof methods$i[input] === 'function') {
      arr = arr.sort(methods$i[input]);
      return this.update(arr.map(o => o.pointer))
    }
    return this
  };

  /** reverse the order of the matches, but not the words or index */
  const reverse$1 = function () {
    const ptrs = [].concat(rawPointer(this)).reverse();
    if (this._cache) {
      this._cache = this._cache.reverse();
    }
    return this.update(ptrs)
  };

  /** remove any duplicate matches */
  const unique = function () {
    const already = new Set();
    const res = this.filter(m => {
      const txt = m.text('machine');
      if (already.has(txt)) {
        return false
      }
      already.add(txt);
      return true
    });
    // this.ptrs = res.ptrs //mutate original?
    return res//.compute('index')
  };

  var sort$1 = { unique, reverse: reverse$1, sort };

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      const end = homeDocs.at(-1);
      const last = end.at(-1);
      if (!/ /.test(last.post)) {
        last.post += ' ';
      }
    }
    homeDocs = homeDocs.concat(inputDocs);
    return homeDocs
  };

  const combineViews = function (home, input) {
    // is it a view from the same document?
    if (home.document === input.document) {
      const ptrs = home.fullPointer.concat(input.fullPointer);
      return home.toView(ptrs).compute('index')
    }
    // update n of new pointer, to end of our pointer
    const ptrs = input.fullPointer;
    ptrs.forEach(a => {
      a[0] += home.document.length;
    });
    home.document = combineDocs(home.document, input.docs);
    return home.all()
  };

  var concat = {
    // add string as new match/sentence
    concat: function (input) {
      // parse and splice-in new terms
      if (typeof input === 'string') {
        const more = this.fromText(input);
        // easy concat
        if (!this.found || !this.ptrs) {
          this.document = this.document.concat(more.document);
        } else {
          // if we are in the middle, this is actually a splice operation
          const ptrs = this.fullPointer;
          const at = ptrs.at(-1)[0];
          this.document.splice(at, 0, ...more.document);
        }
        // put the docs
        return this.all().compute('index')
      }
      // plop some view objects together
      if (typeof input === 'object' && input.isView) {
        return combineViews(this, input)
      }
      // assume it's an array of terms
      if (Array.isArray(input)) {
        const docs = combineDocs(this.document, input);
        this.document = docs;
        return this.all()
      }
      return this
    },
  };

  // add indexes to pointers
  const harden = function () {
    this.ptrs = this.fullPointer;
    return this
  };
  // remove indexes from pointers
  const soften = function () {
    let ptr = this.ptrs;
    if (!ptr || ptr.length === 0) {
      return this
    }
    ptr = ptr.map(a => a.slice(0, 3));
    this.ptrs = ptr;
    return this
  };
  var harden$1 = { harden, soften };

  const methods$h = { ...caseFns, ...fns$3, ...fns$2, ...methods$k, ...methods$j, ...sort$1, ...concat, ...harden$1 };

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$h);
  };

  const compute$5 = {
    id: function (view) {
      eachTerm(view.docs, term => {
        term.id ||= toId(term);
      });
    }
  };

  var change = {
    api: addAPI$2,
    compute: compute$5,
  };

  // one 'word:out words' per line - decoded once into { [key]: word, out: [...] }
  const parse$4 = (str, key) =>
    str
      .trim()
      .split('\n')
      .map(s => {
        const [k, out] = s.trim().split(':');
        return { [key]: k, out: out.split(' ') }
      });

  var contractions$2 = [
    // that's and let's are decided here, before any tagging
    // (step 1 of the 's decision - the list is in 2-two/contraction-two/compute/index.js)
    // simple mappings
    ...parse$4(
      `
@:at
arent:are not
alot:a lot
brb:be right back
cannot:can not
dun:do not
can't:can not
shan't:should not
won't:will not
that's:that is
what's:what is
let's:let us
dunno:do not know
gonna:going to
gotta:have got to
gimme:give me
outta:out of
tryna:trying to
gtg:got to go
im:i am
imma:I will
imo:in my opinion
irl:in real life
ive:i have
rn:right now
tbh:to be honest
wanna:want to
c'mere:come here
c'mon:come on
shoulda:should have
coulda:could have
woulda:would have
musta:must have
tis:it is
twas:it was
y'know:you know
ne'er:never
o'er:over
  `,
      'word'
    ),
    // contraction-part mappings
    ...parse$4(
      `
ll:will
ve:have
re:are
m:am
  `,
      'after'
    ),
    // french contractions - t'aime
    ...parse$4(
      `
c:ce
m:me
n:ne
qu:que
s:se
t:tu
  `,
      'before'
    ),
    // missing apostrophes, apostrophe-d
    ...parse$4(
      `
shouldnt:should not
couldnt:could not
wouldnt:would not
hasnt:has not
wasnt:was not
isnt:is not
cant:can not
dont:do not
wont:will not
howd:how did
whatd:what did
whend:when did
whered:where did
  `,
      'word'
    ),
  ];

  // one entry per line, in a template string
  const toList = str => str.trim().split('\n').map(s => s.trim());

  // ['a', 'b'] → { a: true, b: true }
  const toHash = list => Object.fromEntries(list.map(s => [s, true]));

  // number suffixes that are not units
  // s=1990s, e=18e french/spanish ordinal, er=french 1er, ère/ème=french 2ème
  var numberSuffixes = toHash(toList(`
st
nd
rd
th
am
pm
max
°
s
e
er
ère
ème
`));

  var model$5 = {
    one: {
      contractions: contractions$2,
      numberSuffixes
    }
  };

  // Log decisions before splicing replaces the original term.
  const contractionDebug = (term, expansion) => {
    if (!debug$2.contractions || (debug$2.word && debug$2.word !== (term.normal || term.text).toLowerCase())) {
      return
    }
    debug$2.rule = undefined;
    const result = expansion ? '[' + expansion.map(word => yellow(`'${word}'`)).join(', ') + ']' : 'possessive (kept)';
    console.log(`${debug$2.prefix || '   '}${yellow(JSON.stringify(term.text))} →  ${result}`); // eslint-disable-line no-console
  };

  // put n new words where 1 word was
  const insertContraction = function (document, point, words) {
    const [n, w] = point;
    if (!words || words.length === 0) {
      return
    }
    words = words.map((word, i) => {
      word.implicit = word.text;
      word.machine = word.text;
      word.pre = '';
      word.post = '';
      word.text = '';
      word.normal = '';
      word.index = [n, w + i];
      return word
    });
    if (words[0]) {
      // move whitespace over
      words[0].pre = document[n][w].pre;
      words[words.length - 1].post = document[n][w].post;
      // add the text/normal to the first term
      words[0].text = document[n][w].text;
      words[0].normal = document[n][w].normal; // move tags too?
    }
    // do the splice
    document[n].splice(w, 1, ...words);
  };

  const hasContraction$1 = /'/;
  //look for a past-tense verb
  // const hasPastTense = (terms, i) => {
  //   let after = terms.slice(i + 1, i + 3)
  //   return after.some(t => t.tags.has('PastTense'))
  // }
  // he'd walked -> had
  // how'd -> did
  // he'd go -> would

  const alwaysDid = new Set([
    'what',
    'how',
    'when',
    'where',
    'why',
  ]);

  // after-words
  const useWould = new Set([
    'be',
    'go',
    'start',
    'think',
    'need',
  ]);

  const useHad = new Set([
    'been',
    'gone'
  ]);
  // they'd gone
  // they'd go


  // he'd been
  //    he had been
  //    he would been

  const _apostropheD = function (terms, i) {
    const before = terms[i].normal.split(hasContraction$1)[0];

    // what'd, how'd
    if (alwaysDid.has(before)) {
      return [before, 'did']
    }
    if (terms[i + 1]) {
      // they'd gone
      if (useHad.has(terms[i + 1].normal)) {
        return [before, 'had']
      }
      // they'd go
      if (useWould.has(terms[i + 1].normal)) {
        return [before, 'would']
      }
    }
    return null
    //   if (hasPastTense(terms, i) === true) {
    //     return [before, 'had']
    //   }
    //   // had/would/did
    //   return [before, 'would']
  };

  //ain't -> are/is not
  const apostropheT = function (terms, i) {
    if (terms[i].normal === "ain't" || terms[i].normal === 'aint') {
      return null //do this in ./two/
    }
    const before = terms[i].normal.replace(/n't/, '');
    return [before, 'not']
  };

  const twoApostrophes = /^(.+)'(t|d|ll)'ve$/;

  // wouldn't've -> would not have,  i'd've -> i would have
  const doubled = function (terms, i) {
    const m = terms[i].normal.match(twoApostrophes);
    if (m === null) {
      return null
    }
    const head = m[1];
    if (m[2] === 'd') {
      return [head, 'would', 'have']
    }
    if (m[2] === 'll') {
      return [head, 'will', 'have']
    }
    // n't've - but can't've, won't've
    if (head === 'can') {
      return ['can', 'not', 'have']
    }
    if (head === 'won') {
      return ['will', 'not', 'have']
    }
    return [head.replace(/n$/, ''), 'not', 'have']
  };

  const hasContraction = /'/;
  const isFeminine = /(e|é|aison|sion|tion)$/;
  const isMasculine = /(age|isme|acle|ege|oire)$/;
  // l' words that end in e, but take le - accents are already stripped
  const masculineE = new Set(['homme', 'arbre', 'espace', 'exemple', 'ordre', 'ange', 'etre', 'ete', 'empire', 'oncle', 'angle', 'article', 'orchestre', 'insecte', 'episode']);
  // l' words that take la, without ending in e
  const feminineEnd = /(eau|tion|sion)$/;
  // the word after the apostrophe
  const getAfter = (terms, i) => terms[i].normal.split(hasContraction)[1];

  // l'amour, l'homme, l'eau
  const preL = (terms, i) => {
    // le/la
    const after = getAfter(terms, i);
    // quick french gender disambig (rough)
    if (after && ((after.endsWith('e') && !masculineE.has(after)) || feminineEnd.test(after))) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    const after = getAfter(terms, i);
    // quick guess for noun-agreement (rough)
    if (after && isFeminine.test(after) && !isMasculine.test(after)) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => ['je', getAfter(terms, i)];

  var french = {
    preJ,
    preL,
    preD,
  };

  const isRange = /^([0-9.]{1,4}[a-z]{0,2}) ?[-–—] ?([0-9]{1,4}[a-z]{0,2})$/i;
  const timeRange = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-–—] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i;
  const phoneNum = /^[0-9]{3}-[0-9]{4}$/;

  const numberRange = function (terms, i) {
    const term = terms[i];
    let parts = term.text.match(isRange);
    if (parts !== null) {
      // 123-1234 is a phone number, not a number-range
      if (term.tags.has('PhoneNumber') || phoneNum.test(term.text)) {
        return null
      }
      return [parts[1], 'to', parts[2]]
    } else {
      parts = term.text.match(timeRange);
      if (parts !== null) {
        return [parts[1], 'to', parts[4]]
      }
    }
    return null
  };

  const numUnit = /^([+-]?[0-9][.,0-9]*)([a-z°²³µ/]+)$/; //(must be lowercase)

  const numberUnit = function (terms, i, world) {
    const notUnit = world.model.one.numberSuffixes || {};
    const term = terms[i];
    const parts = term.text.match(numUnit);
    if (parts !== null) {
      // is it a recognized unit, like 'km'?
      const unit = parts[2].toLowerCase().trim();
      // don't split '3rd'
      if (Object.hasOwn(notUnit, unit)) {
        return null
      }
      return [parts[1], unit] //split it
    }
    return null
  };

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // poor-mans reindexing of this sentence only
  const reIndex = function (terms) {
    terms.forEach((t, i) => {
      if (t.index) {
        t.index[1] = i;
      }
    });
  };

  const byEnd = {
    // ain't
    t: apostropheT,
    // how'd
    d: _apostropheD,
  };

  const byStart = {
    // j'aime
    j: french.preJ,
    // l'amour
    l: french.preL,
    // d'amerique
    d: french.preD,
  };

  // pull-apart known contractions from model
  const knownOnes = function (list, term, before, after) {
    for (let i = 0; i < list.length; i += 1) {
      const o = list[i];
      // look for word-word match (cannot-> [can, not])
      if (o.word === term.normal) {
        return o.out
      }
      // look for after-match ('re -> [_, are])
      else if (after !== null && after === o.after) {
        return [before].concat(o.out)
      }
      // look for before-match (l' -> [le, _])
      else if (before !== null && before === o.before && after && after.length > 2) {
        return o.out.concat(after)
        // return [o.out, after] //typeof o.out === 'string' ? [o.out, after] : o.out(terms, i)
      }
    }
    return null
  };

  // turn the words into terms, and put them where the contraction was
  const expand$1 = function (words, view, document, n, i) {
    contractionDebug(document[n][i], words);
    const doc = view.fromText(words.join(' '));
    doc.compute(['id', 'alias']);
    words = doc.docs[0];
    insertContraction(document, [n, i], words);
    return words
  };

  // there's is usually [there, is]
  // but can be 'there has' for 'there has (..) been'
  const thereHas = function (terms, i) {
    for (let k = i + 1; k < 5; k += 1) {
      if (!terms[k]) {
        break
      }
      if (terms[k].normal === 'been') {
        return ['there', 'has']
      }
    }
    return ['there', 'is']
  };

  //really easy ones
  const contractions$1 = view => {
    const { world, document } = view;
    const { model, methods } = world;
    const list = model.one.contractions || [];
    // let units = new Set(model.one.units || [])
    // each sentence
    document.forEach((terms, n) => {
      const len = terms.length;
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        // already expanded - this runs on the whole document, and must be re-runnable
        if (terms[i].implicit) {
          continue
        }
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal)) {
          const res = terms[i].normal.split(byApostrophe);
          before = res[0];
          after = res[1];
        }
        // wouldn't've, then any known-ones, like 'dunno'
        let words = doubled(terms, i) || knownOnes(list, terms[i], before, after);
        // ['foo', 's']
        if (!words && Object.hasOwn(byEnd, after)) {
          words = byEnd[after](terms, i, world);
        }
        // ['j', 'aime']
        if (!words && Object.hasOwn(byStart, before)) {
          words = byStart[before](terms, i);
        }
        // 'there is' vs 'there has'
        if (before === 'there' && after === 's') {
          words = thereHas(terms, i);
        }
        // actually insert the new terms
        if (words) {
          expand$1(words, view, document, n, i);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange(terms, i);
          if (words) {
            words = expand$1(words, view, document, n, i);
            methods.one.setTag(words, 'NumberRange', world); //add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit(terms, i, world);
        if (words) {
          words = expand$1(words, view, document, n, i);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
        }
      }
      // new terms shift the indexes of any terms after them
      if (terms.length !== len) {
        reIndex(terms);
      }
    });
  };

  var compute$4 = { contractions: contractions$1 };

  const plugin$1 = {
    model: model$5,
    compute: compute$4,
    hooks: ['contractions'],
  };

  const freeze$1 = function (view) {
    const world = view.world;
    const { model, methods } = view.world;
    const setTag = methods.one.setTag;
    const { frozenLex } = model.one;
    const multi = model.one._multiCache || {};

    eachTerm(view.docs, (t, terms, i) => {
      // basic lexicon lookup
      const word = t.machine || t.normal;

      // test a multi-word
      if (multi[word] !== undefined && terms[i + 1]) {
        const end = i + multi[word] - 1;
        for (let k = end; k > i; k -= 1) {
          const words = terms.slice(i, k + 1);
          const str = words.map(term => term.machine || term.normal).join(' ');
          // lookup frozen lexicon
          if (Object.hasOwn(frozenLex, str)) {
            setTag(words, frozenLex[str], world, false, '1-frozen-multi-lexicon');
            words.forEach(term => (term.frozen = true));
          }
        }
      }
      // test single word
      if (frozenLex[word] !== undefined && Object.hasOwn(frozenLex, word)) {
        setTag([t], frozenLex[word], world, false, '1-freeze-lexicon');
        t.frozen = true;
      }
    });
  };

  const unfreeze = function (view) {
    eachTerm(view.docs, term => {
      delete term.frozen;
    });
    return view
  };
  var compute$3 = { frozen: freeze$1, freeze: freeze$1, unfreeze };

  var freeze = {
    // add .compute('freeze')
    compute: compute$3,

    mutate: world => {
      const methods = world.methods.one;
      // add @isFrozen method
      methods.termMethods.isFrozen = term => term.frozen === true;
      // `.debug('frozen')` is the tags view, which marks frozen terms
      methods.debug.freeze = view => methods.debug.tags(view);
      methods.debug.frozen = methods.debug.freeze;
    },

    api: function (View) {
      // set all terms to reject any desctructive tags
      View.prototype.freeze = function () {
        eachTerm(this.docs, term => {
          term.frozen = true;
        });
        return this
      };
      // reset all terms to allow  any desctructive tags
      View.prototype.unfreeze = function () {
        this.compute('unfreeze');
      };
      // return all frozen terms
      View.prototype.isFrozen = function () {
        return this.match('@isFrozen+')
      };
    },
    // run it in init
    hooks: ['freeze'],
  };

  // scan-ahead to match multiple-word terms - 'jack rabbit'
  const multiWord = function (terms, start_i, world) {
    const { model, methods } = world;
    const setTag = methods.one.setTag;
    const multi = model.one._multiCache || {};
    const { lexicon } = model.one || {};
    const t = terms[start_i];
    const word = t.machine || t.normal;

    // found a word to scan-ahead on
    if (multi[word] !== undefined && terms[start_i + 1]) {
      const end = start_i + multi[word] - 1;
      for (let i = end; i > start_i; i -= 1) {
        const words = terms.slice(start_i, i + 1);
        if (words.length <= 1) {
          return false
        }
        const str = words.map(term => term.machine || term.normal).join(' ');
        // lookup regular lexicon
        if (Object.hasOwn(lexicon, str)) {
          const tag = lexicon[str];
          // 'is off-white' is not the phrasal verb 'is off'.
          if (tag && tag.includes('PhrasalVerb') && words[words.length - 1].post === '-') {
            continue
          }
          setTag(words, tag, world, false, '1-multi-lexicon');
          // special case for phrasal-verbs - 2nd word is a #Particle
          if (tag && tag.length === 2 && (tag[0] === 'PhrasalVerb' || tag[1] === 'PhrasalVerb')) {
            setTag([words[1]], 'Particle', world, false, '1-phrasal-particle');
          }
          return true
        }
      }
      return false
    }
    return null
  };

  const prefix$2 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
  // anti|non|extra|inter|intra|over
  const allowPrefix = new Set(['Verb', 'Infinitive', 'PastTense', 'Gerund', 'PresentTense', 'Adjective', 'Participle']);

  // tag any words in our lexicon
  const checkLexicon = function (terms, i, world) {
    const { model, methods } = world;
    // const fastTag = methods.one.fastTag
    const setTag = methods.one.setTag;
    const { lexicon } = model.one;

    // basic lexicon lookup
    const t = terms[i];
    const word = t.machine || t.normal;
    // normal lexicon lookup
    if (lexicon[word] !== undefined && Object.hasOwn(lexicon, word)) {
      setTag([t], lexicon[word], world, false, '1-lexicon');
      return true
    }
    // '#gojetsgo' can be in the lexicon with its hash
    if (t.machine && Object.hasOwn(lexicon, t.normal)) {
      setTag([t], lexicon[t.normal], world, false, '1-lexicon-normal');
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      const found = t.alias.find(str => Object.hasOwn(lexicon, str));
      if (found) {
        setTag([t], lexicon[found], world, false, '1-lexicon-alias');
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$2.test(word)) {
      const stem = word.replace(prefix$2, '');
      if (Object.hasOwn(lexicon, stem) && stem.length > 3) {
        // only allow prefixes for verbs/adjectives
        if (allowPrefix.has(lexicon[stem])) {
          // console.log('->', word, stem, lexicon[stem])
          setTag([t], lexicon[stem], world, false, '1-lexicon-prefix');
          return true
        }
      }
    }
    return null
  };

  // tag any words in our lexicon - even if it hasn't been filled-up yet
  // rest of pre-tagger is in ./two/preTagger
  const lexicon$4 = function (view) {
    const world = view.world;
    // loop through our terms
    eachTerm(view.docs, (term, terms, i) => {
      if (term.tags.size === 0) {
        let found = null;
        found ||= multiWord(terms, i, world);
        // lookup known words
        found ||= checkLexicon(terms, i, world);
      }
    });
  };

  var compute$2 = {
    lexicon: lexicon$4,
  };

  // derive clever things from our lexicon key-value pairs
  const expand = function (words) {
    // const { methods, model } = world
    const lex = {};
    // console.log('start:', Object.keys(lex).length)
    const _multi = {};
    // go through each word in this key-value obj:
    Object.keys(words).forEach(word => {
      const tag = words[word];
      // normalize lexicon a little bit
      word = word.toLowerCase().trim();
      word = word.replace(/'s\b/, '');
      // cache multi-word terms
      const split = word.split(/ /);
      if (split.length > 1) {
        // prefer longer ones
        if (_multi[split[0]] === undefined || split.length > _multi[split[0]]) {
          _multi[split[0]] = split.length;
        }
      }
      lex[word] ||= tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };

  var methods$g = {
    one: {
      expandLexicon: expand,
    }
  };

  /** insert new words/phrases into the lexicon */
  const addWords$1 = function (words, isFrozen = false) {
    const world = this.world();
    const { methods, model } = world;
    if (!words) {
      return
    }
    // normalize tag vals
    Object.entries(words).forEach(([k, v]) => {
      if (typeof v === 'string' && v.startsWith('#')) {
        words[k] = v.replace(/^#/, '');
      }
    });
    // these words go into a seperate lexicon
    if (isFrozen === true) {
      const { lex, _multi } = methods.one.expandLexicon(words, world);
      Object.assign(model.one._multiCache, _multi);
      Object.assign(model.one.frozenLex, lex);
      return
    }
    // add some words to our lexicon
    if (methods.two.expandLexicon) {
      // do fancy ./two version
      const { lex, _multi } = methods.two.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    }
    // do basic ./one version
    const { lex, _multi } = methods.one.expandLexicon(words, world);
    Object.assign(model.one.lexicon, lex);
    Object.assign(model.one._multiCache, _multi);
  };

  var lib$5 = { addWords: addWords$1 };

  const model$4 = {
    one: {
      lexicon: {}, //setup blank lexicon
      _multiCache: {},
      frozenLex: {}, //2nd lexicon
    },
  };

  var lexicon$3 = {
    model: model$4,
    methods: methods$g,
    compute: compute$2,
    lib: lib$5,
    hooks: ['lexicon'],
  };

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto Búrigo.

  const tokenize$1 = function (phrase, world) {
    const { methods, model } = world;
    const terms = methods.one.tokenize.splitTerms(phrase, model).map(t => methods.one.tokenize.splitWhitespace(t, model));
    return terms.map(term => term.text.toLowerCase())
  };

  // turn an array or object into a compressed aho-corasick structure
  const buildTrie = function (phrases, world) {

    // const tokenize=methods.one.
    const goNext = [{}];
    const endAs = [null];
    const failTo = [0];

    const xs = [];
    let n = 0;
    phrases.forEach(function (phrase) {
      let curr = 0;
      // let wordsB = phrase.split(/ /g).filter(w => w)
      const words = tokenize$1(phrase, world);
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (goNext[curr] && Object.hasOwn(goNext[curr], word)) {
          curr = goNext[curr][word];
        } else {
          n++;
          goNext[curr][word] = n;
          goNext[n] = {};
          curr = n;
          endAs[n] = null;
        }
      }
      endAs[curr] = [words.length];
    });
    // f(s) = 0 for all states of depth 1 (the ones from which the 0 state can transition to)
    for (const word in goNext[0]) {
      n = goNext[0][word];
      failTo[n] = 0;
      xs.push(n);
    }

    while (xs.length > 0) {
      const r = xs.shift();
      // for each symbol a such that g(r, a) = s
      const keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        const word = keys[i];
        const s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !Object.hasOwn(goNext[n], word)) {
          n = failTo[n];
        }
        if (Object.hasOwn(goNext, n)) {
          const fs = goNext[n][word];
          failTo[s] = fs;
          if (endAs[fs]) {
            endAs[s] ||= [];
            endAs[s] = endAs[s].concat(endAs[fs]);
          }
        } else {
          failTo[s] = 0;
        }
      }
    }
    return { goNext, endAs, failTo }
  };

  // console.log(buildTrie(['smart and cool', 'smart and nice']))

  // follow our trie structure
  const scanWords = function (terms, trie, opts) {
    let n = 0;
    const results = [];
    for (let i = 0; i < terms.length; i++) {
      const word = terms[i][opts.form] || terms[i].normal;
      // main match-logic loop:
      while (n > 0 && (trie.goNext[n] === undefined || !Object.hasOwn(trie.goNext[n], word))) {
        n = trie.failTo[n] || 0; // (usually back to 0)
      }
      // did we fail?
      if (!Object.hasOwn(trie.goNext[n], word)) {
        continue
      }
      n = trie.goNext[n][word];
      if (trie.endAs[n]) {
        const arr = trie.endAs[n];
        for (let o = 0; o < arr.length; o++) {
          const len = arr[o];
          const term = terms[i - len + 1];
          const [no, start] = term.index;
          results.push([no, start, start + len, term.id]);
        }
      }
    }
    return results
  };

  const cacheMiss = function (words, cache) {
    for (let i = 0; i < words.length; i += 1) {
      if (cache.has(words[i])) {
        return false
      }
    }
    return true
  };

  const scan$1 = function (view, trie, opts) {
    let results = [];
    opts.form ||= 'normal';
    const docs = view.docs;
    if (!trie.goNext || !trie.goNext[0]) {
      console.error('Compromise invalid lookup trie');//eslint-disable-line
      return view.none()
    }
    const firstWords = Object.keys(trie.goNext[0]);
    // do each phrase
    for (let i = 0; i < docs.length; i++) {
      // can we skip the phrase, all together?
      if (view._cache && view._cache[i] && cacheMiss(firstWords, view._cache[i]) === true) {
        continue
      }
      const terms = docs[i];
      const found = scanWords(terms, trie, opts);
      if (found.length > 0) {
        results = results.concat(found);
      }
    }
    return view.update(results)
  };

  function api$e (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      const trie = isObject$1(input) ? input : buildTrie(input, this.world);
      let res = scan$1(this, trie, opts);
      res = res.settle();
      return res
    };
  }

  // chop-off tail of redundant vals at end of array
  const truncate = (list, val) => {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (list[i] !== val) {
        list = list.slice(0, i + 1);
        return list
      }
    }
    return list
  };

  // prune trie a bit
  const compress = function (trie) {
    trie.goNext = trie.goNext.map(o => {
      if (Object.keys(o).length === 0) {
        return undefined
      }
      return o
    });
    // chop-off tail of undefined vals in goNext array
    trie.goNext = truncate(trie.goNext, undefined);
    // chop-off tail of zeros in failTo array
    trie.failTo = truncate(trie.failTo, 0);
    // chop-off tail of nulls in endAs array
    trie.endAs = truncate(trie.endAs, null);
    return trie
  };

  /** pre-compile a list of matches to lookup */
  const lib$4 = {
    /** turn an array or object into a compressed trie*/
    buildTrie: function (input) {
      const trie = buildTrie(input, this.world());
      return compress(trie)
    }
  };
  // add alias
  lib$4.compile = lib$4.buildTrie;

  var lookup$1 = {
    api: api$e,
    lib: lib$4
  };

  const relPointer = function (ptrs, parent) {
    if (!parent) {
      return ptrs
    }
    ptrs.forEach(ptr => {
      const n = ptr[0];
      if (parent[n]) {
        ptr[0] = parent[n][0]; //n
        ptr[1] += parent[n][1]; //start
        ptr[2] += parent[n][1]; //end
      }
    });
    return ptrs
  };

  // make match-result relative to whole document
  const fixPointers = function (res, parent) {
    let { ptrs } = res;
    const { byGroup } = res;
    ptrs = relPointer(ptrs, parent);
    Object.keys(byGroup).forEach(k => {
      byGroup[k] = relPointer(byGroup[k], parent);
    });
    return { ptrs, byGroup }
  };

  // turn any matchable input intp a list of matches
  const parseRegs = function (regs, opts, world) {
    const one = world.methods.one;
    if (typeof regs === 'number') {
      regs = String(regs);
    }
    // support param as string
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, world);
      regs = one.parseMatch(regs, opts, world);
    }
    return regs
  };

  // did they pass-in a compromise object?
  const isView = val => val && isObject$1(val) && val.isView === true;

  const isNet = val => val && isObject$1(val) && val.isNet === true;

  // sweep options when only finding, not tagging
  const noTag = { tagger: false };

  // parse the match-syntax, then run it over the docs
  const doMatch = (view, regs, group, opts, justOne) => {
    regs = parseRegs(regs, opts, view.world);
    return view.methods.one.match(view.docs, { regs, group, justOne }, view._cache)
  };

  // turn match results into a view
  const asView = (view, res) => {
    const { ptrs, byGroup } = fixPointers(res, view.fullPointer);
    const out = view.toView(ptrs);
    out._groups = byGroup;
    return out
  };

  const match$1 = function (regs, group, opts) {
    // support param as view object
    if (isView(regs)) {
      return this.intersection(regs)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, noTag).view.settle()
    }
    return asView(this, doMatch(this, regs, group, opts))
  };

  const matchOne = function (regs, group, opts) {
    // support at view as a param
    if (isView(regs)) {
      return this.intersection(regs).eq(0)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false, matchOne: true }).view
    }
    return asView(this, doMatch(this, regs, group, opts, true))
  };

  const has$2 = function (regs, group, opts) {
    // support view as input
    if (isView(regs)) {
      return this.intersection(regs).fullPointer.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, noTag).view.found
    }
    return doMatch(this, regs, group, opts, true).ptrs.length > 0
  };

  // keep only the matches that do (or don't) contain this match
  const ifBy = want => function (regs, group, opts) {
    // support view as input
    if (isView(regs)) {
      return this.filter(m => m.intersection(regs).found === want)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      const m = this.sweep(regs, noTag).view.settle();
      return this.filter(v => v.intersection(m).found === want)
    }
    // otherwise parse the match string
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    const cache = this._cache || [];
    const view = this.filter((m, i) => {
      return (this.methods.one.match(m.docs, todo, cache[i]).ptrs.length > 0) === want
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$2 = { matchOne, match: match$1, has: has$2, if: ifBy(true), ifNo: ifBy(false) };

  // the words before (or after) each match, in its sentence
  const lookaround = function (view, isAfter, regs, group, opts) {
    const { indexN } = view.methods.one.pointer;
    const { document } = view;
    const dir = isAfter ? -1 : 1;
    const ptrs = [];
    const byN = indexN(view.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest (or latest) match in the sentence
      const [n, start, end] = byN[k].sort((a, b) => (a[1] > b[1] ? dir : -dir))[0];
      if (isAfter) {
        if (end < document[n].length) {
          ptrs.push([n, end, document[n].length]);
        }
      } else if (start > 0) {
        ptrs.push([n, 0, start]);
      }
    });
    const words = view.toView(ptrs);
    if (!regs) {
      return words
    }
    return words.match(regs, group, opts)
  };

  // extend each match left (or right), while the terms beside it match
  const growSide = function (view, isRight, regs, group, opts) {
    if (typeof regs === 'string') {
      regs = view.world.methods.one.parseMatch(regs, opts, view.world);
    }
    // ensure matches are beside us
    if (isRight) {
      regs[0].start = true;
    } else {
      regs[regs.length - 1].end = true;
    }
    const ptrs = view.fullPointer;
    view.forEach((m, n) => {
      const more = isRight ? m.after(regs, group) : m.before(regs, group);
      if (more.found) {
        const terms = more.terms();
        if (isRight) {
          ptrs[n][2] += terms.length;
          ptrs[n][4] = null; //remove end-id
        } else {
          ptrs[n][1] -= terms.length;
          ptrs[n][3] = terms.docs[0][0].id;
        }
      }
    });
    return view.update(ptrs)
  };

  // bind a direction to a method
  const side = (fn, flag) => function (regs, group, opts) {
    return fn(this, flag, regs, group, opts)
  };

  const grow = function (regs, group, opts) {
    return this.growRight(regs, group, opts).growLeft(regs, group, opts)
  };

  var lookaround$1 = {
    before: side(lookaround, false),
    after: side(lookaround, true),
    growLeft: side(growSide, false),
    growRight: side(growSide, true),
    grow,
  };

  // do the pointers intersect?
  const doesOverlap = function (a, b) {
    if (a[0] !== b[0]) {
      return false
    }
    const [, startA, endA] = a;
    const [, startB, endB] = b;
    // [a,a,a,-,-,-,]
    // [-,-,b,b,b,-,]
    if (startA <= startB && endA > startB) {
      return true
    }
    // [-,-,-,a,a,-,]
    // [-,-,b,b,b,-,]
    if (startB <= startA && endB > startA) {
      return true
    }
    return false
  };

  // get widest min/max
  const getExtent = function (ptrs) {
    let min = ptrs[0][1];
    let max = ptrs[0][2];
    ptrs.forEach(ptr => {
      if (ptr[1] < min) {
        min = ptr[1];
      }
      if (ptr[2] > max) {
        max = ptr[2];
      }
    });
    return [ptrs[0][0], min, max]
  };

  // collect pointers by sentence number
  const indexN = function (ptrs) {
    const byN = {};
    ptrs.forEach(ref => {
      byN[ref[0]] ||= [];
      byN[ref[0]].push(ref);
    });
    return byN
  };

  // remove exact duplicates
  const uniquePtrs = function (arr) {
    const obj = {};
    for (let i = 0; i < arr.length; i += 1) {
      obj[arr[i].join(',')] = arr[i];
    }
    return Object.values(obj)
  };

  // turn a match-string, array, or view into a view
  const getDoc$1 = (reg, view, group) => {
    if (typeof reg === 'string' || Array.isArray(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    // support pre-parsed reg object
    return reg
  };

  // a before b
  // console.log(doesOverlap([0, 0, 4], [0, 2, 5]))
  // // b before a
  // console.log(doesOverlap([0, 3, 4], [0, 1, 5]))
  // // disjoint
  // console.log(doesOverlap([0, 0, 3], [0, 4, 5]))
  // neighbours
  // console.log(doesOverlap([0, 1, 3], [0, 3, 5]))
  // console.log(doesOverlap([0, 3, 5], [0, 1, 3]))

  // console.log(
  //   getExtent([
  //     [0, 3, 4],
  //     [0, 4, 5],
  //     [0, 1, 2],
  //   ])
  // )

  const combine = function (left, right) {
    return [left[0], left[1], right[2]]
  };

  const addIds$1 = function (ptr, view) {
    const [n, start, end] = ptr;
    if (view.document[n]?.[start]) {
      ptr[3] ||= view.document[n][start].id;
      if (view.document[n][end - 1]) {
        ptr[4] ||= view.document[n][end - 1].id;
      }
    }
    return ptr
  };

  // split each match, then collect the pieces into pointers
  const split = function (view, m, group, collect) {
    const { splitAll } = view.methods.one.pointer;
    const splits = getDoc$1(m, view, group).fullPointer;
    const all = splitAll(view.fullPointer, splits);
    const res = collect(all).filter(p => p).map(p => addIds$1(p, view));
    return view.update(res)
  };

  const methods$f = {};
  // [before], [match], [after]
  methods$f.splitOn = function (m, group) {
    return split(this, m, group, all => all.flatMap(o => [o.passthrough, o.before, o.match, o.after]))
  };

  // [before], [match after]
  methods$f.splitBefore = function (m, group) {
    return split(this, m, group, all => {
      // repair matches to favor [match, after]
      // - instead of [before, match]
      for (let i = 0; i < all.length; i += 1) {
        // move a before to a preceding after
        if (!all[i].after && all[i + 1]?.before) {
          // ensure it's from the same original sentence
          if (all[i].match && all[i].match[0] === all[i + 1].before[0]) {
            all[i].after = all[i + 1].before;
            delete all[i + 1].before;
          }
        }
      }
      return all.flatMap(o => {
        // a, [x, b]
        if (o.match && o.after) {
          return [o.passthrough, o.before, combine(o.match, o.after)]
        }
        // a, [x], b
        return [o.passthrough, o.before, o.match]
      })
    })
  };

  // [before match], [after]
  methods$f.splitAfter = function (m, group) {
    return split(this, m, group, all => all.flatMap(o => {
      if (o.before && o.match) {
        return [o.passthrough, combine(o.before, o.match), o.after]
      }
      return [o.passthrough, o.before, o.match, o.after]
    }))
  };
  methods$f.split = methods$f.splitAfter;

  // check if two pointers are perfectly consecutive
  const isNeighbour = function (ptrL, ptrR) {
    // validate
    if (!ptrL || !ptrR) {
      return false
    }
    // same sentence
    if (ptrL[0] !== ptrR[0]) {
      return false
    }
    // ensure R starts where L ends
    return ptrL[2] === ptrR[1]
  };

  // join two neighbouring words, if they both match
  const mergeIf = function (doc, lMatch, rMatch) {
    const world = doc.world;
    const parseMatch = world.methods.one.parseMatch;
    lMatch ||= '.$'; //defaults
    rMatch ||= '^.';
    const leftMatch = parseMatch(lMatch, {}, world);
    const rightMatch = parseMatch(rMatch, {}, world);
    // ensure end-requirement to left-match, start-requiremnts to right match
    leftMatch[leftMatch.length - 1].end = true;
    rightMatch[0].start = true;
    // let's get going.
    const ptrs = doc.fullPointer;
    const res = [ptrs[0]];
    for (let i = 1; i < ptrs.length; i += 1) {
      const ptrL = res[res.length - 1];
      const ptrR = ptrs[i];
      const left = doc.update([ptrL]);
      const right = doc.update([ptrR]);
      // should we marge left+right?
      if (isNeighbour(ptrL, ptrR) && left.has(leftMatch) && right.has(rightMatch)) {
        // merge right ptr into existing result
        res[res.length - 1] = [ptrL[0], ptrL[1], ptrR[2], ptrL[3], ptrR[4]];
      } else {
        res.push(ptrR);
      }
    }
    // return new pointers
    return doc.update(res)
  };

  const methods$e = {
    //  merge only if conditions are met
    joinIf: function (lMatch, rMatch) {
      return mergeIf(this, lMatch, rMatch)
    },
    // merge all neighbouring matches
    join: function () {
      return mergeIf(this)
    },
  };

  const methods$d = { ...match$2, ...lookaround$1, ...methods$f, ...methods$e };
  // aliases
  methods$d.lookBehind = methods$d.before;
  methods$d.lookBefore = methods$d.before;

  methods$d.lookAhead = methods$d.after;
  methods$d.lookAfter = methods$d.after;

  methods$d.notIf = methods$d.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$d);
  };

  // Split parenthesized match blocks without retrying long rejected prefixes or
  // bodies. Preserve the original grammar, including its greedy capture header.
  const prefix$1 = new Set('!~[^');
  const suffix$1 = new Set('?]+*$~{},0123456789');
  const whitespace$2 = /\s/;

  const splitGroups = str => {
    if (!str.includes('(') || !str.includes(')')) return [str]
    const length = str.length;
    const afterSuffix = new Uint32Array(length + 1);
    const bodyEnd = new Uint32Array(length);
    const captureEnd = new Uint32Array(length);
    afterSuffix[length] = length;
    let close = -1;
    let capture = 0;
    for (let i = length - 1; i >= 0; i--) {
      afterSuffix[i] = suffix$1.has(str[i]) ? afterSuffix[i + 1] : i;
      if (str[i] === ')') close = i;
      if (str[i] === '(' && close >= i + 3 && str[close - 1] !== '\\') {
        const end = afterSuffix[close + 1];
        if (end === length || whitespace$2.test(str[end])) bodyEnd[i] = end;
      }
      // The optional <...> header cannot cross another '<', and prefers the
      // rightmost '>' which is followed by a valid parenthesized block.
      if (str[i] === '<') {
        captureEnd[i] = capture;
        capture = 0;
      } else if (str[i] === '>' && !capture) {
        // the block may be negative - [<name>!(a|b)]
        capture = bodyEnd[str[i + 1] === '!' ? i + 2 : i + 1] || 0;
      }
    }
    const parts = [];
    let previous = 0;
    let i = 0;
    while (i < length) {
      const start = i;
      while (i < length && prefix$1.has(str[i])) i++;
      const end = str[i] === '<' ? captureEnd[i] : bodyEnd[i];
      if (end) {
        parts.push(str.slice(previous, start), str.slice(start, end));
        // The old delimiter consumes one following whitespace character.
        i = end < length ? end + 1 : end;
        previous = i;
      } else if (i === start) {
        i++;
      }
    }
    parts.push(str.slice(previous));
    return parts
  };

  // Split out /regex/ tokens - 'foo /yes/' and not 'foo/no/bar' - in linear time.
  // Has the grammar of this pattern, which rescans the line for each rejected opener:
  // (?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?=\s|$)
  const prefix = new Set('![^');
  const suffix = new Set('?]+*$~');
  const newline = new Set('\n\r  '); // what '.' can't cross
  const whitespace$1 = /\s/;

  const splitRegs = str => {
    if (!str.includes('/')) {
      return [str]
    }
    const length = str.length;
    const afterSuffix = new Uint32Array(length + 1);
    const ends = new Uint32Array(length); // a token's end, by its opening '/' or '<'
    afterSuffix[length] = length;
    let close = 0; // the nearest valid closing, for a body starting at i+1
    let capture = 0; // the rightmost valid '>' wins, and it can't cross another '<'
    for (let i = length - 1; i >= 0; i--) {
      if (str[i] === '/') {
        ends[i] = close;
      }
      afterSuffix[i] = suffix.has(str[i]) ? afterSuffix[i + 1] : i;
      if (newline.has(str[i])) {
        close = 0;
      }
      if (str[i + 1] === '/' && str[i] !== '/' && str[i] !== '\\') {
        const end = afterSuffix[i + 2];
        if (end === length || whitespace$1.test(str[end])) {
          close = end;
        }
      }
      if (str[i] === '<') {
        ends[i] = capture;
        capture = 0;
      } else if (str[i] === '>' && !capture && str[i + 1] === '/') {
        capture = ends[i + 1];
      }
    }
    const parts = [];
    let previous = 0;
    // -1 stands in for the '^' start
    for (let i = -1; i < length; i++) {
      if (i === -1 || whitespace$1.test(str[i])) {
        let start = i + 1;
        while (prefix.has(str[start])) {
          start++;
        }
        const end = ends[start];
        if (end) {
          parts.push(str.slice(previous, Math.max(i, 0)), str.slice(i + 1, end));
          // the whitespace after this token can also open the next one
          previous = end + 1;
          i = end - 1;
        }
      }
    }
    parts.push(str.slice(previous));
    return parts
  };

  // any whitespace separates terms, the same as the tokenizer
  const byWord = /\s+/;

  const isBlock = str => {
    return /^[![^]*(<[^<]*>)?!?\(/.test(str) && /\)[?\]+*$~{},0-9]*$/.test(str)
  };
  const isReg = str => {
    return /^[![^]*(<[^<]*>)?\//.test(str) && /\/[?\]+*$~]*$/.test(str)
  };
  const never = () => false;

  const cleanUp = function (arr) {
    arr = arr.map(str => str.trim());
    arr = arr.filter(str => str);
    return arr
  };

  const parseBlocks = function (txt, opts = {}) {
    // {noRegex} - slashes are plain characters
    const isRegex = opts.noRegex ? never : isReg;
    // parse by /regex/ first
    const arr = opts.noRegex ? [txt] : splitRegs(txt);
    let res = [];
    // parse by (blocks), next
    arr.forEach(str => {
      if (isRegex(str)) {
        res.push(str);
        return
      }
      res = res.concat(splitGroups(str));
    });
    res = cleanUp(res);
    // split by spaces, now - but not inside (blocks) or /regexes/
    const final = res.flatMap(str => {
      if (isBlock(str) || isRegex(str)) {
        return str
      }
      return str.split(byWord)
    });
    return cleanUp(final)
  };

  const hasMinMax = /\{([0-9]+)?(, *[0-9]*)?\}/;
  const andSign = /&&/;
  // const hasDash = /\p{Letter}[-–—]\p{Letter}/u
  const captureName = /^<\s*([^\s>]+)\s*>/;
  /* break-down a match expression into this:
  {
    word:'',
    tag:'',
    regex:'',

    start:false,
    end:false,
    negative:false,
    anything:false,
    greedy:false,
    optional:false,

    named:'',
    choices:[],
  }
  */
  const titleCase$1 = str => str.charAt(0).toUpperCase() + str.substring(1);
  const end = (str) => str.charAt(str.length - 1);
  const start = (str) => str.charAt(0);
  const stripStart = (str) => str.substring(1);
  const stripEnd = (str) => str.substring(0, str.length - 1);

  const stripBoth = function (str) {
    str = stripStart(str);
    str = stripEnd(str);
    return str
  };
  // is the token wrapped in these chars, like (foo)
  const wrapped = (str, a, b = a) => start(str) === a && end(str) === b;
  //
  const parseToken = function (w, opts, aliases) {
    const obj = {};
    //collect any flags (do it twice)
    for (let i = 0; i < 2; i += 1) {
      //end-flag
      if (end(w) === '$') {
        obj.end = true;
        w = stripEnd(w);
      }
      //front-flag
      if (start(w) === '^') {
        obj.start = true;
        w = stripStart(w);
      }
      if (end(w) === '?') {
        obj.optional = true;
        w = stripEnd(w);
      }
      //capture group (this one can span multiple-terms)
      if (start(w) === '[' || end(w) === ']') {
        obj.group = null;
        if (start(w) === '[') {
          obj.groupStart = true;
        }
        if (end(w) === ']') {
          obj.groupEnd = true;
        }
        w = w.replace(/^\[/, '');
        w = w.replace(/\]$/, '');
        // Use capture group name
        if (start(w) === '<') {
          const res = captureName.exec(w);
          if (!res) {
            throw new SyntaxError('Invalid named capture: expected [<name> ...]')
          }
          if (res.length >= 2) {
            obj.group = res[1];
            w = w.replace(res[0], '');
          }
        }
      }
      //back-flags
      if (end(w) === '+' && !w.endsWith('\\+')) {
        obj.greedy = true;
        w = stripEnd(w);
      }
      // 'foo*' is zero or more
      if (w !== '*' && end(w) === '*' && !w.endsWith('\\*')) {
        obj.greedy = true;
        obj.optional = true;
        w = stripEnd(w);
      }
      if (start(w) === '!') {
        obj.negative = true;
        // obj.optional = true
        w = stripStart(w);
      }
      //soft-match
      if (wrapped(w, '~') && w.length > 2) {
        w = stripBoth(w);
        obj.fuzzy = true;
        obj.min = opts.fuzzy ?? 0.85;
        if (!/\(/.test(w)) {
          obj.word = w;
          return obj
        }
      }

      //regex - {noRegex} leaves it as a plain word, to avoid redos from user-input
      if (wrapped(w, '/') && w.length > 2 && !opts.noRegex) {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }

      // support foo{1,9}
      if (hasMinMax.test(w)) {
        w = w.replace(hasMinMax, (_a, b, c) => {
          if (c === undefined) {
            // '{3}'	Exactly three times
            obj.min = Number(b);
            obj.max = Number(b);
          } else {
            c = c.replace(/, */, '');
            if (b === undefined) {
              // '{,9}' implied zero min
              obj.min = 0;
              obj.max = Number(c);
            } else {
              // '{2,4}' Two to four times
              obj.min = Number(b);
              // '{3,}' Three or more times
              obj.max = Number(c || 999);
            }
          }
          // use same method as '+'
          obj.greedy = true;
          // 0 as min means the same as '?'
          if (!obj.min) {
            obj.optional = true;
          }
          return ''
        });
      }

      //wrapped-flags
      if (wrapped(w, '(', ')')) {
        // support (one && two)
        if (andSign.test(w)) {
          obj.choices = w.split(andSign);
          obj.operator = 'and';
        } else {
          obj.choices = w.split('|');
          obj.operator = 'or';
        }
        //remove '(' and ')'
        obj.choices[0] = stripStart(obj.choices[0]);
        const last = obj.choices.length - 1;
        obj.choices[last] = stripEnd(obj.choices[last]);
        // clean up the results
        obj.choices = obj.choices.map(s => s.trim());
        obj.choices = obj.choices.filter(s => s);
        //recursion alert!
        obj.choices = obj.choices.map(str => {
          return str.split(/\s+/).map(s => parseToken(s, opts, aliases))
        });
        w = '';
      }

      //root/sense overloaded
      if (wrapped(w, '{', '}')) {
        w = stripBoth(w);
        // obj.sense = w
        obj.root = w;
        if (/\//.test(w)) {
          const split = obj.root.split(/\//);
          obj.root = split[0];
          obj.pos = split[1];
          if (obj.pos === 'adj') {
            obj.pos = 'Adjective';
          }
          // titlecase
          obj.pos = obj.pos.charAt(0).toUpperCase() + obj.pos.substr(1).toLowerCase();
          // add sense-number too
          if (split[2] !== undefined) {
            obj.sense = split[2];
          }
        }
        return obj
      }
      //chunks
      if (wrapped(w, '<', '>')) {
        w = stripBoth(w);
        obj.chunk = titleCase$1(w);
        obj.greedy = true;
        return obj
      }
      if (wrapped(w, '%')) {
        w = stripBoth(w);
        obj.switch = w;
        return obj
      }
    }
    //do the actual token content
    if (start(w) === '#') {
      const name = stripStart(w);
      obj.tag = aliases?.[name];
      if (!obj.tag) {
        obj.tag = titleCase$1(name);
        obj.tag = aliases?.[obj.tag] || obj.tag;
      }
      return obj
    }
    //dynamic function on a term object
    if (start(w) === '@') {
      obj.method = stripStart(w);
      return obj
    }
    if (w === '.') {
      obj.anything = true;
      return obj
    }
    //support alone-astrix
    if (w === '*') {
      obj.anything = true;
      obj.greedy = true;
      obj.optional = true;
      return obj
    }
    if (w) {
      //somehow handle encoded-chars?
      w = w.replace('\\*', '*');
      w = w.replace('\\.', '.');
      w = w.replace('\\+', '+');
      w = w.replace('\\/', '/');
      if (opts.caseSensitive) {
        obj.use = 'text';
      } else {
        w = w.toLowerCase();
      }
      obj.word = w;
    }
    return obj
  };

  // Text recognition, rather than full email/URL validation. Share these rules with
  // the tagger so hyphens in recognized addresses survive tokenization.
  const email = /^[\w.!#$%&'*+/=?^`{|}~-]+@(?:[\w-]+\.)+[a-z]{2,}$/i;
  const explicitUrl = /^(?:https?:(?:\/\/)?|www\.)(?:[a-z0-9-]+\.)+[a-z]{2,}(?::[0-9]+)?(?:[/?#]\S*)?$/i;
  const bareUrl = /^(?:[a-z0-9-]+\.)+(?:com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)(?::[0-9]+)?(?:[/?#]\S*)?$/i;

  const isWebToken = function (str) {
    if (!str.includes('.')) {
      return false
    }
    let start = 0;
    let end = str.length;
    while (start < end && /[\s("'“‘<]/.test(str[start])) start++;
    while (end > start && /[\s).,!?:;"'”’>]/.test(str[end - 1])) end--;
    const text = str.slice(start, end);
    return email.test(text) || explicitUrl.test(text) || bareUrl.test(text)
  };

  const hasHyphen$1 = function (str, model) {
    const parts = str.split(/[-–—]/);
    if (parts.length <= 1) {
      return false
    }
    if (isWebToken(str)) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    // l-theanine, x-ray
    if (parts[0].length === 1 && /[a-z]/i.test(parts[0])) {
      return false
    }
    //dont split 're-do'
    if (Object.hasOwn(prefixes, parts[0])) {
      return false
    }
    //dont split 'flower-like'
    parts[1] = parts[1].trim().replace(/[.?!]$/, '');
    if (Object.hasOwn(suffixes, parts[1])) {
      return false
    }
    //letter-number 'aug-20'
    const reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
    if (reg.test(str)) {
      return true
    }
    //number-letter '20-aug'
    const reg2 = /^[('"]?([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+[)'"]?$)/i;
    if (reg2.test(str)) {
      return true
    }
    return false
  };

  const splitHyphens$1 = function (word) {
    const arr = [];
    //support multiple-hyphenated-terms
    const hyphens = word.split(/[-–—]/);
    let whichDash = '-';
    const found = word.match(/[-–—]/);
    if (found && found[0]) {
      whichDash = found;
    }
    for (let o = 0; o < hyphens.length; o++) {
      if (o === hyphens.length - 1) {
        arr.push(hyphens[o]);
      } else {
        arr.push(hyphens[o] + whichDash);
      }
    }
    return arr
  };

  // match 're-do' -> ['re','do']
  // split them the same way the tokenizer does - 'x-ray' stays one word
  const splitHyphens = function (regs, world) {
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      const reg = regs[i];
      if (reg.word && hasHyphen$1(reg.word, world.model)) {
        let words = reg.word.split(/[-–—]/g);
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          const obj = { ...reg };
          obj.word = w;
          regs.splice(i, 0, obj);
        });
      }
    }
    return regs
  };

  // add all inflections of this verb/noun/adjective
  const inflect = function (token, world, kind, fallback) {
    const { all } = world.methods.two.transform[kind] || {};
    if (!all) {
      return fallback
    }
    return all(token.root, world.model)
  };

  // explicitly-set POS - '{sweet/adjective}'
  const byPos = { Verb: 'verb', Noun: 'noun', Adjective: 'adjective' };

  // turn '{walk}' into 'walking', 'walked', etc
  const inflectRoot = function (regs, world) {
    // do we have compromise/two?
    regs = regs.map(token => {
      // a reg to convert '{foo}'
      if (token.root) {
        // check if compromise/two is loaded
        if (world.methods.two && world.methods.two.transform) {
          let choices = [];
          if (token.pos) {
            if (Object.hasOwn(byPos, token.pos)) {
              const kind = byPos[token.pos];
              choices = inflect(token, world, kind, kind === 'verb' ? [] : [token.root]);
            }
          } else {
            // do verb/noun/adj by default
            choices = [
              ...inflect(token, world, 'verb', []),
              ...inflect(token, world, 'noun', [token.root]),
              ...inflect(token, world, 'adjective', [token.root]),
            ];
          }
          choices = choices.filter(str => str);
          if (choices.length > 0) {
            token.operator = 'or';
            token.fastOr = new Set(choices);
          }
        } else {
          // if no compromise/two, drop down into 'machine' lookup
          token.machine = token.root;
          delete token.id;
          delete token.root;
        }
      }
      return token
    });

    return regs
  };

  // name any [unnamed] capture-groups with a number
  const nameGroups = function (regs) {
    let index = 0;
    let inGroup = null;
    //'fill in' capture groups between start-end
    for (let i = 0; i < regs.length; i++) {
      const token = regs[i];
      if (token.groupStart === true) {
        inGroup = token.group;
        if (inGroup === null) {
          inGroup = String(index);
          index += 1;
        }
      }
      if (inGroup !== null) {
        token.group = inGroup;
      }
      if (token.groupEnd === true) {
        inGroup = null;
      }
    }
    return regs
  };

  // optimize an 'or' lookup, when the (a|b|c) list is simple or multi-word
  const doFastOrMode = function (tokens) {
    return tokens.map(token => {
      if (token.choices !== undefined) {
        // make sure it's an OR
        if (token.operator !== 'or') {
          return token
        }
        if (token.fuzzy === true) {
          return token
        }
        // are they all straight-up words? then optimize them.
        const shouldPack = token.choices.every(block => {
          if (block.length !== 1) {
            return false
          }
          const reg = block[0];
          // ~fuzzy~ words need more care
          if (reg.fuzzy === true) {
            return false
          }
          // ^ and $ get lost in fastOr
          if (reg.start || reg.end) {
            return false
          }
          if (reg.word !== undefined && reg.negative !== true && reg.optional !== true && reg.method !== true) {
            return true //reg is simple-enough
          }
          return false
        });
        if (shouldPack === true) {
          token.fastOr = new Set();
          token.choices.forEach(block => {
            token.fastOr.add(block[0].word);
          });
          delete token.choices;
        }
      }
      return token
    })
  };

  // support ~(a|b|c)~
  const fuzzyOr = function (regs) {
    return regs.map(reg => {
      if (reg.fuzzy && reg.choices) {
        // pass fuzzy-data to each OR choice
        reg.choices.forEach(r => {
          if (r.length === 1 && r[0].word) {
            r[0].fuzzy = true;
            r[0].min = reg.min;
          }
        });
      }
      return reg
    })
  };

  const postProcess = function (regs) {
    // ensure all capture groups names are filled between start and end
    regs = nameGroups(regs);
    // convert 'choices' format to 'fastOr' format
    regs = doFastOrMode(regs);
    // support ~(foo|bar)~
    regs = fuzzyOr(regs);
    return regs
  };

  /** parse a match-syntax string into json */
  const syntax = function (input, opts, world) {
    // fail-fast
    if (input === null || input === undefined || input === '') {
      return []
    }
    opts ||= {};
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks(input, opts);
    //turn them into objects
    tokens = tokens.map(str => parseToken(str, opts, world.model.one.tagAliases));
    // '~re-do~'
    tokens = splitHyphens(tokens, world);
    // '{walk}'
    tokens = inflectRoot(tokens, world);
    //clean up anything weird
    tokens = postProcess(tokens);
    // console.log(tokens)
    return tokens
  };

  const anyIntersection = function (setA, setB) {
    for (const elem of setB) {
      if (setA.has(elem)) {
        return true
      }
    }
    return false
  };
  // check words/tags against our cache
  const failFast = function (regs, cache) {
    for (let i = 0; i < regs.length; i += 1) {
      const reg = regs[i];
      if (reg.optional === true || reg.negative === true || reg.fuzzy === true) {
        continue
      }
      // is the word missing from the cache?
      if (reg.word !== undefined && !cache.has(reg.word)) {
        return true
      }
      // is the tag missing?
      if (reg.tag !== undefined && !cache.has('#' + reg.tag)) {
        return true
      }
      // are all of the fast-or words missing?
      if (reg.fastOr !== undefined && !anyIntersection(reg.fastOr, cache)) {
        return true
      }
    }
    return false
  };

  // fuzzy-match (damerau-levenshtein)
  // Based on  tad-lispy /node-damerau-levenshtein
  // https://github.com/tad-lispy/node-damerau-levenshtein/blob/master/index.js
  // count steps (insertions, deletions, substitutions, or transpositions)
  const editDistance = function (strA, strB) {
    const aLength = strA.length,
      bLength = strB.length;
    // fail-fast
    if (aLength === 0) {
      return bLength
    }
    if (bLength === 0) {
      return aLength
    }
    // If the limit is not defined it will be calculate from this and that args.
    const limit = (bLength > aLength ? bLength : aLength) + 1;
    if (Math.abs(aLength - bLength) > (limit || 100)) {
      return limit || 100
    }
    // init the array
    const matrix = [];
    for (let i = 0; i < limit; i++) {
      matrix[i] = [i];
      matrix[i].length = limit;
    }
    for (let i = 0; i < limit; i++) {
      matrix[0][i] = i;
    }
    // Calculate matrix.
    let j, a_index, b_index, cost, min, t;
    for (let i = 1; i <= aLength; ++i) {
      a_index = strA[i - 1];
      for (j = 1; j <= bLength; ++j) {
        // Check the jagged distance total so far
        if (i === j && matrix[i][j] > 4) {
          return aLength
        }
        b_index = strB[j - 1];
        cost = a_index === b_index ? 0 : 1; // Step 5
        // Calculate the minimum (much faster than Math.min(...)).
        min = matrix[i - 1][j] + 1; // Deletion.
        if ((t = matrix[i][j - 1] + 1) < min) min = t; // Insertion.
        if ((t = matrix[i - 1][j - 1] + cost) < min) min = t; // Substitution.
        // Update matrix.
        const shouldUpdate =
          i > 1 && j > 1 && a_index === strB[j - 2] && strA[i - 2] === b_index && (t = matrix[i - 2][j - 2] + cost) < min;
        if (shouldUpdate) {
          matrix[i][j] = t;
        } else {
          matrix[i][j] = min;
        }
      }
    }
    // return number of steps
    return matrix[aLength][bLength]
  };
  // score similarity by from 0-1 (steps/length)
  const fuzzyMatch = function (strA, strB, minLength = 3) {
    if (strA === strB) {
      return 1
    }
    //don't even bother on tiny strings
    if (strA.length < minLength || strB.length < minLength) {
      return 0
    }
    const steps = editDistance(strA, strB);
    const length = Math.max(strA.length, strB.length);
    const relative = length === 0 ? 0 : steps / length;
    const similarity = 1 - relative;
    return similarity
  };

  // these methods are called with '@hasComma' in the match syntax
  // various unicode quotation-mark formats
  const startQuote =
    /([\u0022\uFF02\u0027\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F])/;

  const endQuote = /([\u0022\uFF02\u0027\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4])/;

  const hasHyphen = /^[-–—]$/;
  const hasDash$2 = / [-–—]{1,3} /;

  /** search the term's 'post' punctuation  */
  const hasPost = (term, punct) => term.post.indexOf(punct) !== -1;
  /** search the term's 'pre' punctuation  */
  // const hasPre = (term, punct) => term.pre.indexOf(punct) !== -1

  const methods$c = {
    /** does it have a quotation symbol?  */
    hasQuote: term => startQuote.test(term.pre) || endQuote.test(term.post),
    /** does it have a comma?  */
    hasComma: term => hasPost(term, ','),
    /** does it end in a period? */
    hasPeriod: term => hasPost(term, '.') === true && hasPost(term, '...') === false,
    /** does it end in an exclamation */
    hasExclamation: term => hasPost(term, '!'),
    /** does it end with a question mark? */
    hasQuestionMark: term => hasPost(term, '?') || hasPost(term, '¿'),
    /** is there a ... at the end? */
    hasEllipses: term => hasPost(term, '..') || hasPost(term, '…'),
    /** is there a semicolon after term word? */
    hasSemicolon: term => hasPost(term, ';'),
    /** is there a colon after term word? */
    hasColon: term => hasPost(term, ':'),
    /** is there a slash '/' in term word? */
    hasSlash: term => /\//.test(term.text),
    /** a hyphen connects two words like-term */
    hasHyphen: term => hasHyphen.test(term.post) || hasHyphen.test(term.pre),
    /** a dash separates words - like that */
    hasDash: term => hasDash$2.test(term.post) || hasDash$2.test(term.pre),
    /** is it multiple words combinded */
    hasContraction: term => Boolean(term.implicit),
    /** is it an acronym */
    isAcronym: term => term.tags.has('Acronym'),
    /** does it have any tags */
    isKnown: term => term.tags.size > 0,
    /** uppercase first letter, then a lowercase - also 'Tis */
    isTitleCase: term => /^['\u2019]?\p{Lu}[a-z'\u00C0-\u00FF]/u.test(term.text),
    /** uppercase all letters */
    isUpperCase: term => /^\p{Lu}+$/u.test(term.text),
  };
  // aliases
  methods$c.hasQuotation = methods$c.hasQuote;

  //declare it up here
  let wrapMatch = function () { };
  /** ignore optional/greedy logic, straight-up term match*/
  const doesMatch$1 = function (term, reg, index, length) {
    // support '.'
    if (reg.anything === true) {
      return true
    }
    // support '^' (in parentheses)
    if (reg.start === true && index !== 0) {
      return false
    }
    // support '$' (in parentheses)
    if (reg.end === true && index !== length - 1) {
      return false
    }
    // match an id
    if (reg.id !== undefined && reg.id === term.id) {
      return true
    }
    //support a text match
    if (reg.word !== undefined) {
      // check case-sensitivity, etc
      if (reg.use) {
        return reg.word === term[reg.use]
      }
      //match contractions, machine-form
      if (term.machine !== null && term.machine === reg.word) {
        return true
      }
      // support ~ fuzzy match
      if (reg.fuzzy === true) {
        if (reg.word === term.root) {
          return true
        }
        const score = fuzzyMatch(reg.word, term.normal);
        if (score >= reg.min) {
          return true
        }
      }
      // match slashes and things
      if (term.alias && term.alias.some(str => str === reg.word)) {
        return true
      }
      //match either .normal or .text
      return reg.word === term.text || reg.word === term.normal
    }
    //support #Tag
    if (reg.tag !== undefined) {
      return term.tags.has(reg.tag)
    }
    //support @method
    if (reg.method !== undefined) {
      if (typeof methods$c[reg.method] === 'function' && methods$c[reg.method](term) === true) {
        return true
      }
      return false
    }
    //support whitespace/punctuation
    if (reg.pre !== undefined) {
      return term.pre && term.pre.includes(reg.pre)
    }
    if (reg.post !== undefined) {
      return term.post && term.post.includes(reg.post)
    }
    //support /reg/
    if (reg.regex !== undefined) {
      let str = term.normal;
      if (reg.use) {
        str = term[reg.use];
      }
      if (reg.regex.global || reg.regex.sticky) {
        const lastIndex = reg.regex.lastIndex;
        try {
          reg.regex.lastIndex = 0;
          return reg.regex.test(str)
        } finally {
          reg.regex.lastIndex = lastIndex;
        }
      }
      return reg.regex.test(str)
    }
    //support <chunk>
    if (reg.chunk !== undefined) {
      return term.chunk === reg.chunk
    }
    //support %Noun|Verb%
    if (reg.switch !== undefined) {
      return term.switch === reg.switch
    }
    //support {machine}
    if (reg.machine !== undefined) {
      return term.normal === reg.machine || term.machine === reg.machine || term.root === reg.machine
    }
    //support {word/sense}
    if (reg.sense !== undefined) {
      return term.sense === reg.sense
    }
    // support optimized (one|two)
    if (reg.fastOr !== undefined) {
      // {work/verb} must be a verb
      if (reg.pos && !term.tags.has(reg.pos)) {
        return null
      }
      const str = term.root || term.implicit || term.machine || term.normal;
      return reg.fastOr.has(str) || reg.fastOr.has(term.text)
    }
    //support slower (one|two)
    // each choice is a list of tokens - this term can only test the first one
    if (reg.choices !== undefined) {
      // try to support && operator
      if (reg.operator === 'and') {
        // must match them all
        return reg.choices.every(r => wrapMatch(term, r[0], index, length))
      }
      // or must match one
      return reg.choices.some(r => wrapMatch(term, r[0], index, length))
    }
    return false
  };
  // wrap result for !negative match logic
  wrapMatch = function (t, reg, index, length) {
    const result = doesMatch$1(t, reg, index, length);
    if (reg.negative === true) {
      return !result
    }
    return result
  };

  const getGroup$1 = function (state, term_index) {
    // Most attempts fail without capturing anything.
    if (!state.groups) {
      state.groups = {};
    }
    if (state.groups[state.inGroup]) {
      return state.groups[state.inGroup]
    }
    state.groups[state.inGroup] = {
      start: term_index,
      length: 0,
    };
    return state.groups[state.inGroup]
  };

  // add any terms used since startAt, to the current capture
  const logGroup = function (state, startAt) {
    if (state.hasGroup === true && state.t > startAt) {
      getGroup$1(state, startAt).length += state.t - startAt;
    }
  };

  // test the reg against the term at array-index t
  const matchAt = (state, reg, t) => wrapMatch(state.terms[t], reg, state.start_i + t, state.phrase_length);

  // anchors should not apply to repeated terms
  const noAnchors = reg => ({ ...reg, start: false, end: false });

  // how many terms a match must have - optional and negative regs don't count
  const getMinLength = regs => regs.filter(reg => reg.optional !== true && reg.negative !== true).length;

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    const reg = noAnchors(state.regs[state.r]);
    const start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      // the number of terms we've matched, if we stop here
      const count = state.t - start + 1;
      //stop for next-reg match - unless we're still under our min
      if (endReg && matchAt(state, endReg, state.t)) {
        if (reg.min === undefined || count >= reg.min) {
          return state.t
        }
      }
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (matchAt(state, reg, state.t) === false) {
        // is it too short?
        if (reg.min !== undefined && count < reg.min) {
          return null
        }
        return state.t
      }
    }
    // we ran out of terms - did we reach our min?
    if (reg.min !== undefined && state.t - start + 1 < reg.min) {
      return null
    }
    return state.t
  };

  const greedyTo = function (state, nextReg) {
    let t = state.t;
    //if there's no next one, just go off the end!
    if (!nextReg) {
      return state.terms.length
    }
    //otherwise, we're looking for the next one
    for (; t < state.terms.length; t += 1) {
      if (matchAt(state, nextReg, t) === true) {
        // console.log(`greedyTo ${state.terms[t].normal}`)
        return t
      }
    }
    //guess it doesn't exist, then.
    return null
  };

  const isEndGreedy = function (reg, state) {
    if (reg.end === true && reg.greedy === true) {
      if (state.start_i + state.t < state.phrase_length - 1) {
        const tmpReg = { ...reg, end: false };
        if (matchAt(state, tmpReg, state.t) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  //support 'unspecific greedy' .* properly
  // its logic is 'greedy until', where it's looking for the next token
  // '.+ foo' means we check for 'foo', indefinetly
  const doAstrix = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    const skipto = greedyTo(state, regs[state.r + 1]);
    //maybe we couldn't find it
    if (skipto === null || skipto === state.offset) {
      return null
    }
    // ensure it's long enough
    if (reg.min !== undefined && skipto - state.t < reg.min) {
      return null
    }
    // reduce it back, if it's too long
    if (reg.max !== undefined && skipto - state.t > reg.max) {
      state.t = state.t + reg.max;
      return true
    }
    // set the group result
    if (state.hasGroup === true) {
      const g = getGroup$1(state, state.t);
      // accumulate onto any tokens already captured before the wildcard,
      // so '[one .* after]' keeps its leading (and trailing) tokens
      g.length += skipto - state.t;
    }
    state.t = skipto;
    // log(`✓ |greedy|`)
    return true
  };

  // try to match a list of tokens, starting at state.t + skipN
  // returns the number of terms it consumed, or 0 for no-match
  const tryChoice = function (state, regs, skipN) {
    let len = 0;
    for (let w = 0; w < regs.length; w += 1) {
      const cr = regs[w];
      const t = state.t + skipN + len;
      if (state.terms[t] === undefined) {
        return 0
      }
      if (matchAt(state, cr, t) !== true) {
        return 0
      }
      len += 1;
      // this can be greedy - '(foo+ bar)'
      if (cr.greedy === true) {
        // like getGreedy, anchors should not apply to the repeated terms
        const gr = noAnchors(cr);
        for (let i = t + 1; i < state.terms.length; i += 1) {
          if (matchAt(state, gr, i) !== true) {
            break
          }
          len += 1;
        }
      }
    }
    return len
  };

  // match the first choice that works - '(a b|c)'
  const tryChoices = function (state, skipN) {
    const block = state.regs[state.r];
    for (let c = 0; c < block.choices.length; c += 1) {
      const regs = block.choices[c];
      if (!Array.isArray(regs)) {
        return 0
      }
      const len = tryChoice(state, regs, skipN);
      if (len > 0) {
        return len
      }
    }
    return 0
  };

  const tryAndBlock = function (state, skipN) {
    let longest = 0;
    // all blocks must match, and we return the greediest match
    const reg = state.regs[state.r];
    const allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      const allWords = block.every((cr, w_index) => {
        const tryTerm = state.t + skipN + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return matchAt(state, cr, tryTerm)
      });
      if (allWords === true && block.length > longest) {
        longest = block.length;
      }
      return allWords
    });
    if (allDidMatch === true) {
      return longest
    }
    return 0
  };

  // match a block, and keep going if it's greedy - '(a b|c)+', '(a && b){2,3}'
  const repeatBlock = function (state, tryBlock) {
    const reg = state.regs[state.r];
    let skipN = tryBlock(state, 0);
    if (skipN === 0 || reg.greedy !== true) {
      return skipN
    }
    const next = state.regs[state.r + 1];
    let count = 1;
    while (count !== reg.max) {
      const t = state.t + skipN;
      const term = state.terms[t];
      const hasMin = reg.min === undefined || count >= reg.min;
      // stop for the next token, like 'foo+ bar'
      if (!term || (next && hasMin && matchAt(state, next, t))) {
        break
      }
      const more = tryBlock(state, skipN);
      if (more === 0) {
        break
      }
      skipN += more;
      count += 1;
    }
    // 'foo{2,3}' was too short
    if (reg.min !== undefined && count < reg.min) {
      return 0
    }
    return skipN
  };

  const doOrBlock$1 = state => repeatBlock(state, tryChoices);
  const doAndBlock$1 = state => repeatBlock(state, tryAndBlock);

  // 'foo? foo' matches are tricky.
  // should this optional token leave its term for the next one?
  const leaveForNext = function (state) {
    const next = state.regs[state.r + 1];
    if (!next || !matchAt(state, next, state.t)) {
      return false
    }
    // but does the next reg match the next term??
    // only skip if it doesn't
    const nextTerm = state.terms[state.t + 1];
    return !nextTerm || !matchAt(state, next, state.t + 1)
  };

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = matchAt(state, reg, t);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = matchAt(state, nextReg, t);
        if (found) {
          break
        }
      }
      skip += 1;
      // is it max-length now?
      if (reg.max !== undefined && skip === reg.max) {
        break
      }
    }
    // '!foo* after' can match nothing, and leave this term for the next token
    if (skip === 0) {
      return reg.optional === true //dead, otherwise
    }
    // did we satisfy min for !foo{min,max}
    if (reg.min && reg.min > skip) {
      return false//dead
    }
    state.t += skip;
    // state.r += 1
    return true
  };

  // a negative block didn't find its terms - that's good news
  const negativeBlock = function (state) {
    const reg = state.regs[state.r];
    const startAt = state.t;
    let alive = true;
    if (reg.greedy === true) {
      // '!(a|b)+' keeps going - anchors should not apply to the repeated terms
      alive = negGreedy(state, noAnchors({ ...reg, negative: false }), state.regs[state.r + 1]);
    } else if (!reg.optional) {
      // but a '!(a b)?' can pass-through without consuming anything
      state.t += 1;
    }
    logGroup(state, startAt);
    return alive
  };

  // shared logic for '(a|b)' or-blocks and '(a && b)' and-blocks
  const makeBlock = tryBlock => function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const skipNum = tryBlock(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic - but '!(a|b)*' can match nothing
      if (reg.negative === true) {
        return reg.optional === true && reg.greedy === true
      }
      // '(a|b)? a' - go on to the next token, without using this term
      if (reg.optional === true && leaveForNext(state)) {
        return true
      }
      // tuck in as named-group
      if (state.hasGroup === true) {
        const g = getGroup$1(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        const end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      return true
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      return negativeBlock(state)
    }
    if (!reg.optional) {
      return null //die
    }
    return true
  };

  // '(a|b)' - match any choice on the term
  var doOrBlock = makeBlock(doOrBlock$1);

  // '(foo && #Noun)' - require all matches on the term
  var doAndBlock = makeBlock(doAndBlock$1);

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const startAt = state.t;

    // match *anything* but this term
    const tmpReg = { ...reg };
    tmpReg.negative = false; // try removing it

    // found it? if so, we die here
    const found = matchAt(state, tmpReg, state.t);
    if (found) {
      // but '!foo*' can match nothing - '!foo?' stays a lookahead
      return reg.optional === true && reg.greedy === true
    }
    // negative greedy - !foo+  - super hard!
    if (reg.greedy) {
      // like getGreedy, anchors should not apply to the repeated terms
      const alive = negGreedy(state, noAnchors(tmpReg), regs[state.r + 1]);
      logGroup(state, startAt);
      return alive
    }
    // should we skip the term too?
    if (reg.optional) {
      // "before after" - "before !foo? after"
      // does the next reg match the this term?
      const nextReg = regs[state.r + 1];
      if (nextReg) {
        const fNext = matchAt(state, nextReg, state.t);
        if (fNext) {
          return true // leave the term, and any capture, to the next reg
        }
        if (nextReg.optional && regs[state.r + 2]) {
          // ugh. ok,
          // support "!foo? extra? need"
          // but don't scan ahead more than that.
          const fNext2 = matchAt(state, regs[state.r + 2], state.t);
          if (fNext2) {
            return true
          }
        }
      }
    }
    state.t += 1;
    logGroup(state, startAt);
    return true
  };

  // keep 'foo+' or 'foo*' going..
  const greedyMatch = function (state) {
    const { regs, phrase_length } = state;
    const reg = regs[state.r];
    // foo{2,4} min-lengths are enforced inside getGreedy
    state.t = getGreedy(state, regs[state.r + 1]);
    if (state.t === null) {
      return null //greedy was too short
    }
    // 'foo+$' - if also an end-anchor, ensure we really reached the end
    if (reg.end === true && state.start_i + state.t !== phrase_length) {
      return null //greedy didn't reach the end
    }
    return true
  };

  // for: ['we', 'have']
  // a match for "we have" should work as normal
  // but matching "we've" should skip over implict terms
  const contractionSkip = function (state) {
    const term = state.terms[state.t];
    const reg = state.regs[state.r];
    // did we match the first part of a contraction?
    if (!term.implicit || !state.terms[state.t + 1]?.implicit) {
      return
    }
    // we matched "we've", or @hasContraction - skip over all of its hidden words, [we, have]
    if (reg.word === term.normal || reg.method === 'hasContraction') {
      let next = state.terms[state.t + 1];
      // a hidden word has no text of its own - the next contraction starts at a word that does
      while (next && next.implicit && next.text === '') {
        state.t += 1;
        next = state.terms[state.t + 1];
      }
    }
  };

  // '[foo]' should also be logged as a group
  const setGroup = function (state, startAt) {
    const reg = state.regs[state.r];
    // Get or create capture group
    const g = getGroup$1(state, startAt);
    // Update group - add greedy or increment length
    if (state.t - state.offset > 1 && reg.greedy) {
      g.length += state.t - startAt;
    } else {
      g.length++;
    }
  };

  // when a reg matches a term
  const simpleMatch = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const term = state.terms[state.t];
    const startAt = state.t;
    // if it's a negative optional match... :0
    if (reg.optional && regs[state.r + 1] && reg.negative) {
      return true
    }
    // okay, it was a match, but if it's optional too,
    // go on to the next token, without using this term
    if (reg.optional && leaveForNext(state)) {
      return true
    }
    // Contraction skip:
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      contractionSkip(state);
    }
    //advance to the next term!
    state.t += 1;
    //check any ending '$' flags
    //if this isn't the last term, refuse the match
    if (reg.end === true && state.t !== state.terms.length && reg.greedy !== true) {
      return null //die
    }
    // keep 'foo+' going...
    if (reg.greedy === true) {
      const alive = greedyMatch(state);
      if (!alive) {
        return null
      }
    }
    // log '[foo]' as a group
    if (state.hasGroup === true) {
      setGroup(state, startAt);
    }
    return true
  };

  // i formally apologize for how complicated this is.

  // choose how to consume this reg: a step function, null to die, or undefined to skip it
  const pickStep = function (reg, state) {
    // support 'unspecific greedy' .* properly
    if (reg.anything === true && reg.greedy === true) {
      return doAstrix
    }
    // slow-OR - multi-word OR (a|b|foo bar)
    if (reg.choices !== undefined && reg.operator === 'or') {
      return doOrBlock
    }
    // slow-AND - multi-word AND (#Noun && foo) blocks
    if (reg.choices !== undefined && reg.operator === 'and') {
      return doAndBlock
    }
    // support '.' as any-single
    if (reg.anything === true) {
      // '!.' negative anything should insta-fail
      if (reg.negative) {
        return null
      }
      return simpleMatch
    }
    // support 'foo*$' until the end
    if (isEndGreedy(reg, state) === true) {
      return simpleMatch
    }
    // ok, it doesn't match - but maybe it wasn't *supposed* to?
    if (reg.negative) {
      // we want *anything* but this term
      return doNegative
    }
    // ok, finally test the term-reg
    if (matchAt(state, reg, state.t) === true) {
      return simpleMatch
    }
    //ok who cares, keep going
    if (reg.optional === true) {
      return undefined
    }
    // finally, we die
    return null
  };

  /**
   * try a sequence of match tokens ('regs')
   * on a sequence of terms,
   * starting at this certain term.
   */
  const tryHere = function (terms, regs, start_i, phrase_length, offset = 0) {
    // console.log(`\n\n:start: '${terms[0].text}':`)
    if (offset >= terms.length || regs.length === 0) {
      return null
    }
    // Use the original terms with a cursor instead of copying the remaining
    // sentence at every starting position. origin maps array indices to match
    // pointers; offset marks the beginning of this attempt within the array.
    const origin = start_i - offset;
    const state = {
      t: offset,
      offset: offset,
      terms: terms,
      r: 0,
      regs: regs,
      groups: null,
      start_i: origin,
      phrase_length: phrase_length,
      inGroup: null,
    };

    // we must satisfy every token in 'regs'
    // if we get to the end, we have a match.
    for (; state.r < regs.length; state.r += 1) {
      const reg = regs[state.r];
      // Check if this reg has a named capture group
      state.hasGroup = Boolean(reg.group);
      // Reuse previous capture group if same
      state.inGroup = state.hasGroup ? reg.group : null;
      //have we run-out of terms?
      if (!state.terms[state.t]) {
        //are all remaining regs optional or negative?
        const alive = regs.slice(state.r).some(remain => !remain.optional);
        if (alive === false) {
          break //done!
        }
        return null // die
      }
      const step = pickStep(reg, state);
      if (step === null) {
        return null
      }
      if (step && !step(state)) {
        return null
      }
    }
    //return our results, as pointers
    const pntr = [null, start_i, state.t + origin];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    const groups = {};
    if (state.groups) {
      Object.keys(state.groups).forEach(k => {
        const o = state.groups[k];
        const start = origin + o.start;
        groups[k] = [null, start, start + o.length];
      });
    }
    return { pointer: pntr, groups: groups }
  };

  // support returning a subset of a match
  // like 'foo [bar] baz' -> bar
  const getGroup = function (res, group) {
    const ptrs = [];
    const byGroup = {};
    if (typeof group === 'number') {
      group = String(group);
    }
    if (group) {
      res.forEach(r => {
        if (r.groups[group]) {
          ptrs.push(r.groups[group]);
        }
      });
    } else {
      res.forEach(r => {
        ptrs.push(r.pointer);
        Object.entries(r.groups).forEach(([k, ptr]) => {
          byGroup[k] ||= [];
          byGroup[k].push(ptr);
        });
      });
    }
    return { ptrs, byGroup }
  };

  // drop any results that contain this match
  const notIf = function (results, not, docs) {
    return results.filter(res => {
      const [n, start, end] = res.pointer;
      const terms = docs[n].slice(start, end);
      return !terms.some((_t, i) => tryHere(terms, not, i, terms.length, i) !== null)
    })
  };

  // Compiled sweeps cache this check; editable public patterns are rechecked.
  const isFixed = regs => regs.every(reg => !reg.optional && !reg.greedy &&
    !reg.negative && !reg.choices && !reg.anything &&
    (reg.word !== undefined || reg.tag !== undefined || reg.switch !== undefined || reg.fastOr !== undefined));

  const fromFixed = (terms, regs, start, length, offset = 0) => {
    if (offset + regs.length > terms.length) {
      return null
    }
    for (let r = 0; r < regs.length; r += 1) {
      const term = terms[offset + r];
      // A literal contraction can consume more than one term.
      if (term.implicit) {
        return tryHere(terms, regs, start, length, offset)
      }
      if (wrapMatch(term, regs[r], start + r, length) !== true) {
        return null
      }
    }
    // Failed attempts never need capture state.
    const groups = {};
    for (let r = 0; r < regs.length; r += 1) {
      const name = regs[r].group;
      if (name) {
        if (!groups[name]) {
          groups[name] = [null, start + r, start + r];
        }
        groups[name][2] += 1;
      }
    }
    return { pointer: [null, start, start + regs.length], groups }
  };

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n, attempt) {
    let res = attempt(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$1 = function (docs, todo, cache) {
    cache ||= [];
    const { regs, group, justOne, checkFirst } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }
    const attempt = (todo.fixed ?? isFixed(regs)) ? fromFixed : tryHere;

    // Compiled rules carry this value; public parsed patterns can still be edited
    // by callers, so calculate their minimum without caching on the token array.
    let minLength = todo.minLength;
    if (minLength === undefined) {
      minLength = getMinLength(regs);
    }
    docs: for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        const foundStart = handleStart(terms, regs, n, attempt);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        // ensure it's long-enough
        if (terms.length - i < minLength) {
          break
        }
        // Compiled sweep rules can reject a start before allocating match state.
        if (checkFirst && !wrapMatch(terms[i], regs[0], i, terms.length)) {
          continue
        }
        let res = attempt(terms, regs, i, terms.length, i);
        // did we find a result?
        if (res) {
          // res = addSentence(res, index[0])
          res = addSentence(res, n);
          results.push(res);
          // should we stop here?
          if (justOne === true) {
            break docs
          }
          // skip ahead, over these results
          const end = res.pointer[2];
          if (Math.abs(end - 1) > i) {
            i = Math.abs(end - 1);
          }
        }
      }
    }
    // ensure any end-results ($) match until the last term
    if (regs[regs.length - 1].end === true) {
      results = results.filter(res => {
        const n = res.pointer[0];
        return docs[n].length === res.pointer[2]
      });
    }
    if (todo.notIf) {
      results = notIf(results, todo.notIf, docs);
    }
    // grab the requested group
    results = getGroup(results, group);
    // add ids to pointers
    results.ptrs.forEach(ptr => {
      const [n, start, end] = ptr;
      ptr[3] = docs[n][start].id;//start-id
      ptr[4] = docs[n][end - 1].id;//end-id
    });
    return results
  };

  const methods$b = {
    one: {
      termMethods: methods$c,
      parseMatch: syntax,
      match: runMatch$1,
    },
  };

  var lib$3 = {
    /** pre-parse any match statements */
    parseMatch: function (str, opts) {
      const world = this.world();
      const killUnicode = world.methods.one.killUnicode;
      if (killUnicode) {
        str = killUnicode(str, world);
      }
      return world.methods.one.parseMatch(str, opts, world)
    }
  };

  var match = {
    api: matchAPI,
    methods: methods$b,
    lib: lib$3,
  };

  const isClass = /^\../;
  const isId = /^#./;

  const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
  const escapeXml = str => str.replace(/[&<>"']/g, c => escapes[c]);

  // interpret .class, #id, tagName
  const toTag = function (k) {
    let start = '';
    let end = '</span>';
    k = escapeXml(k);
    if (isClass.test(k)) {
      start = `<span class="${k.replace(/^\./, '')}"`;
    } else if (isId.test(k)) {
      start = `<span id="${k.replace(/^#/, '')}"`;
    } else {
      start = `<${k}`;
      end = `</${k}>`;
    }
    start += '>';
    return { start, end }
  };

  const getIndex = function (doc, obj) {
    const starts = {};
    const ends = {};
    Object.keys(obj).forEach(k => {
      let res = obj[k];
      const tag = toTag(k);
      if (typeof res === 'string') {
        res = doc.match(res);
      }
      res.docs.forEach(terms => {
        // don't highlight implicit terms
        if (terms.every(t => t.implicit)) {
          return
        }
        const a = terms[0].id;
        starts[a] ||= [];
        starts[a].push(tag.start);
        const b = terms.at(-1).id;
        ends[b] ||= [];
        ends[b].push(tag.end);
      });
    });
    return { starts, ends }
  };

  const html = function (obj) {
    // index ids to highlight
    const { starts, ends } = getIndex(this, obj);
    // create the text output
    let out = '';
    eachTerm(this.docs, t => {
      // do a span tag
      if (Object.hasOwn(starts, t.id)) {
        out += starts[t.id].join('');
      }
      out += t.pre || '';
      out += t.text || '';
      if (Object.hasOwn(ends, t.id)) {
        out += ends[t.id].join('');
      }
      out += t.post || '';
    });
    return out
  };
  var html$1 = { html };

  // Walk the trailing punctuation run once, rather than retrying at every offset.
  const endPunctuation = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]/;
  const trimEnd = str => {
    let end = str.length;
    while (end > 0 && endPunctuation.test(str[end - 1])) end--;
    return str.slice(0, end)
  };
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4\]]/;
  const isHyphen = /^[-–—]$/;
  const hasSpace = / /;

  // the original text of these terms, with any outer whitespace removed
  const rawText = terms => terms.reduce((str, t) => str + t.pre + t.text + t.post, '').trim();

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach((t, i) => {
      let pre = t.pre || '';
      let post = t.post || '';
      if (opts.punctuation === 'some') {
        pre = pre.replace(/[,،]/g, '');
        pre = pre.replace(trimStart, '');
        // replace a hyphen with a space
        if (isHyphen.test(post)) {
          post = ' ';
        }
        post = post.replace(punctToKill, '');
        // cleanup exclamations
        post = post.replace(/\?!+/, '?');
        post = post.replace(/!+/, '!');
        post = post.replace(/\?+/, '?');
        // kill elipses
        post = post.replace(/[,،…]|\.{2,}/g, '');
        // kill abbreviation periods
        if (t.tags.has('Abbreviation')) {
          post = post.replace(/\./, '');
        }
      }
      if (opts.whitespace === 'some') {
        pre = pre.replace(/\s/, ''); //remove pre-whitespace
        post = post.replace(/\s+/, ' '); //replace post-whitespace with a space
      }
      if (!opts.keepPunct) {
        pre = pre.replace(trimStart, '');
        if (post === '-') {
          post = ' ';
        } else {
          post = trimEnd(post);
        }
      }
      // grab the correct word format
      let word = t[opts.form || 'text'] || t.normal || '';
      if (opts.form === 'implicit') {
        word = t.implicit || t.text;
      }
      if (opts.form === 'root' && t.implicit) {
        word = t.root || t.implicit || t.normal;
      }
      // add an implicit space, for contractions - but not after the last word
      if ((opts.form === 'machine' || opts.form === 'implicit' || opts.form === 'root') && t.implicit && i < terms.length - 1) {
        if (!post || !hasSpace.test(post)) {
          post += ' ';
        }
      }
      txt += pre + word + post;
    });
    if (keepSpace === false) {
      txt = txt.trim();
    }
    if (opts.lowerCase === true) {
      txt = txt.toLowerCase();
    }
    return txt
  };

  const textFromDoc = function (docs, opts) {
    let text = '';
    if (!docs || !docs[0] || !docs[0][0]) {
      return text
    }
    for (let i = 0; i < docs.length; i += 1) {
      // middle
      text += textFromTerms(docs[i], opts, true);
    }
    if (!opts.keepSpace) {
      text = text.trim();
    }
    if (opts.keepEndPunct === false) {
      // don't remove ':)' etc
      if (!docs[0][0].tags.has('Emoticon')) {
        text = text.replace(trimStart, '');
      }
      // remove ending periods
      const last = docs.at(-1);
      if (!last.at(-1).tags.has('Emoticon')) {
        text = trimEnd(text);
        // removing a spaced dash leaves its space behind
        if (!opts.keepSpace) {
          text = text.trimEnd();
        }
      }
      // kill end quotations
      if (text.endsWith(`'`) && !text.endsWith(`s'`)) {
        text = text.replace(/'/, '');
      }
    }
    if (opts.cleanWhitespace === true) {
      text = text.trim();
    }
    return text
  };

  const some = {
    whitespace: 'some',
    punctuation: 'some',
    unicode: 'some',
  };
  const fmts = {
    text: {
      form: 'text',
    },
    normal: {
      ...some,
      case: 'some',
      form: 'normal',
    },
    machine: {
      ...some,
      keepSpace: false,
      case: 'none',
      form: 'machine',
    },
    root: {
      ...some,
      keepSpace: false,
      case: 'some',
      form: 'root',
    },
    implicit: {
      form: 'implicit',
    }
  };
  fmts.clean = fmts.normal;
  fmts.reduced = fmts.root;

  /* eslint-disable no-bitwise, no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  const k = [];
  let i = 0;
  for (; i < 64; i++) {
    k[i] = 0 | (Math.sin((i + 1) % Math.PI) * 4294967296);
  }

  const md5 = function (s) {
    let b,
      c,
      d,
      j = decodeURI(encodeURI(s)) + '\x80',
      a = j.length;

    const h = [(b = 0x67452301), (c = 0xefcdab89), ~b, ~c],
      words = [];

    s = (--a / 4 + 2) | 15;

    words[--s] = a * 8;

    for (; ~a; ) {
      words[a >> 2] |= j.charCodeAt(a) << (8 * a--);
    }

    for (i = j = 0; i < s; i += 16) {
      a = h;

      for (
        ;
        j < 64;
        a = [
          (d = a[3]),
          b +
            (((d =
              a[0] +
              [(b & c) | (~b & d), (d & b) | (~d & c), b ^ c ^ d, c ^ (b | ~d)][(a = j >> 4)] +
              k[j] +
              ~~words[i | ([j, 5 * j + 1, 3 * j + 5, 7 * j][a] & 15)]) <<
              (a = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * a + (j++ % 4)])) |
              (d >>> -a)),
          b,
          c,
        ]
      ) {
        b = a[1] | 0;
        c = a[2];
      }
      for (j = 4; j; ) h[--j] += a[j];
    }

    for (s = ''; j < 32; ) {
      s += ((h[j >> 3] >> ((1 ^ j++) * 4)) & 15).toString(16);
    }

    return s
  };
  // console.log(md5('food-safety'))

  const defaults$3 = {
    text: true,
    terms: true,
  };

  const opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  // text in this format, keeping punctuation
  const punct = (terms, fmt) => textFromTerms(terms, { ...fmt, keepPunct: true }, false);

  const fns$1 = {
    text: terms => punct(terms),
    normal: terms => punct(terms, fmts.normal),
    implicit: terms => punct(terms, fmts.implicit),

    machine: terms => textFromTerms(terms, opts, false),
    root: terms => textFromTerms(terms, { ...opts, form: 'root' }, false),

    hash: terms => md5(punct(terms)),

    offset: terms => {
      const len = fns$1.text(terms).length;
      // the text keeps leading punctuation but trims whitespace, so start where the text starts
      const raw = terms[0].pre + terms[0].text;
      const lead = terms[0].pre.length - (raw.length - raw.trimStart().length);
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start - lead,
        length: len,
      }
    },
    terms: terms => {
      return terms.map(t => ({ ...t, tags: [...t.tags] }))
    },
    confidence: (_terms, view, i) => view.eq(i).confidence(),
    syllables: (_terms, view, i) => view.eq(i).syllables(),
    sentence: (_terms, view, i) => view.eq(i).fullSentence().text(),
    dirty: terms => terms.some(t => t.dirty === true),
  };
  fns$1.sentences = fns$1.sentence;
  fns$1.clean = fns$1.normal;
  fns$1.reduced = fns$1.root;

  const toJSON = function (view, option) {
    option ||= {};
    if (typeof option === 'string') {
      option = {};
    }
    option = { ...defaults$3, ...option };
    // run any necessary upfront steps
    if (option.offset) {
      view.compute('offset');
    }
    return view.docs.map((terms, i) => {
      const res = {};
      Object.keys(option).forEach(k => {
        if (option[k] && fns$1[k]) {
          res[k] = fns$1[k](terms, view, i);
        }
      });
      return res
    })
  };

  const methods$a = {
    /** return data */
    json: function (n) {
      const res = toJSON(this, n);
      if (typeof n === 'number') {
        return res[n]
      }
      return res
    },
  };
  methods$a.data = methods$a.json;

  // Output the requested format, or the default tags view
  const debug$1 = function (fmt) {
    const debugMethods = this.methods.one.debug || {};
    if (!fmt || !Object.hasOwn(debugMethods, fmt)) {
      fmt = 'tags';
    }
    debugMethods[fmt](this);
    return this
  };

  const toText$1 = function (term) {
    const pre = term.pre || '';
    const post = term.post || '';
    return pre + term.text + post
  };

  const findStarts = function (doc, obj) {
    const starts = {};
    Object.keys(obj).forEach(reg => {
      const m = doc.match(reg);
      m.fullPointer.forEach(a => {
        starts[a[3]] = { fn: obj[reg], end: a[2] };
      });
    });
    return starts
  };

  const wrap$1 = function (doc, obj) {
    // index ids to highlight
    const starts = findStarts(doc, obj);
    let text = '';
    doc.docs.forEach((terms, n) => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
        // do a span tag
        if (Object.hasOwn(starts, t.id)) {
          const { fn, end } = starts[t.id];
          const m = doc.update([[n, i, end]]);
          text += terms[i].pre || '';
          text += fn(m);
          i = end - 1;
          text += terms[i].post || '';
        } else {
          text += toText$1(t);
        }
      }
    });
    return text
  };

  // the 'spec' output format - a clean sentence + an ordered list of top-level tags
  // designed to round-trip between compromise and LLMs (see docs/spec-format.md)

  // roots that describe a token's shape, not its part-of-speech - never picked over a real POS
  const attributeTags = new Set(['Hyphenated', 'Prefix', 'SlashedTerm']);

  // walk a tag up to its top-level (root) ancestor
  const rootOf = function (tag, tagSet) {
    const entry = tagSet[tag];
    if (!entry || !entry.parents || entry.parents.length === 0) {
      return tag
    }
    for (let i = 0; i < entry.parents.length; i += 1) {
      const p = entry.parents[i];
      if (tagSet[p] && (!tagSet[p].parents || tagSet[p].parents.length === 0)) {
        return p
      }
    }
    return entry.parents.at(-1)
  };

  // reduce a term's tag-set to a single top-level tag (or '-' when untagged)
  const slotForTerm = function (term, tagSet) {
    const tags = Array.from(term.tags || []);
    if (tags.length === 0) {
      return '-'
    }
    const primary = tags.find(t => !attributeTags.has(rootOf(t, tagSet))) || tags[0];
    return rootOf(primary, tagSet)
  };

  const makeAliases = function (tagSet, registered) {
    const aliases = Object.create(null);
    for (const tag in tagSet) {
      const entry = tagSet[tag];
      // A leading null explicitly keeps the canonical name.
      const preferred = entry.aliases === undefined ? entry.alias : entry.aliases[0];
      if (preferred && registered[preferred] === tag) {
        aliases[tag] = preferred;
      }
    }
    return aliases
  };

  // one line per sentence: '<text> {Tag,Tag,…}'
  const toSpec = function (doc, world) {
    const tagSet = world.model.one.tagSet;
    const aliases = makeAliases(tagSet, world.model.one.tagAliases);
    return doc.docs.map(terms => {
      const text = rawText(terms);
      const tags = terms.map(t => {
        const tag = slotForTerm(t, tagSet);
        return aliases[tag] || tag
      }).join(',');
      return `${text} {${tags}}`
    }).join('\n')
  };

  // sort by frequency
  const topk = function (arr) {
    const counts = new Map();
    arr.forEach(word => {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });
    const res = Array.from(counts, ([normal, count]) => ({ normal, count }));
    return res.sort((a, b) => b.count - a.count)
  };

  // named output formats
  const outputs = {
    // text formats
    text: view => view.text(),
    normal: view => view.text('normal'),
    root: view => view.text('root'),
    machine: view => view.text('machine'),
    hash: view => md5(view.text()),
    // tagged-sentence format for LLMs (see docs/spec-format.md)
    spec: view => toSpec(view, view.world),
    // json data formats
    json: view => view.json(),
    offset: view => {
      view.compute('offset');
      return view.json({ offset: true })
    },
    array: view => view.docs.map(rawText).filter(str => str),
    // return terms sorted by frequency
    freq: view => topk(view.json({ normal: true }).map(o => o.normal)),
    // some handy ad-hoc outputs
    terms: view => view.docs.flatMap(terms => terms.map(t => t.text).filter(Boolean)),
    tags: view => {
      return view.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
    },
    'best-tag': view => {
      view.compute('tagRank');
      return view.docs
        .map(ts => {
          return ts.map(t => (t.tagRank?.[0] ? `#${t.tagRank[0]}` : '')).join(' ')
        })
        .join('\n')
    },
    debug: view => view.debug(), //allow
  };
  // aliases
  outputs.reduced = outputs.machine;
  outputs.md5 = outputs.hash;
  outputs.offsets = outputs.offset;
  outputs.frequency = outputs.freq;
  outputs.topk = outputs.freq;

  /** some named output formats */
  const out = function (method) {
    // support custom outputs
    if (isObject$1(method)) {
      return wrap$1(this, method)
    }
    if (Object.hasOwn(outputs, method)) {
      return outputs[method](this)
    }
    return this.text()
  };

  const methods$9 = {
    /** */
    debug: debug$1,
    /** */
    out,
    /** */
    wrap: function (obj) {
      return wrap$1(this, obj)
    },
  };

  // a dash between two words, like '2025-05-11 - they'
  const spacedDash = /^\s+[-—]\s+$/;

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && Object.hasOwn(fmts, fmt)) {
        opts = { ...fmts[fmt] };
      } else if (fmt && isObject$1(fmt)) {
        opts = { ...fmt }; //todo: fixme
      }
      // is it a full document?
      if (opts.keepSpace === undefined && !this.isFull()) {
        //
        opts.keepSpace = false;
      }
      if (opts.keepEndPunct === undefined && this.pointer) {
        const ptr = this.pointer[0];
        const lastTerm = this.docs.at(-1)?.at(-1);
        if (ptr?.[1] || spacedDash.test(lastTerm?.post)) {
          opts.keepEndPunct = false;
        } else {
          opts.keepEndPunct = true;
        }
      }
      // set defaults
      if (opts.keepPunct === undefined) {
        opts.keepPunct = true;
      }
      if (opts.keepSpace === undefined) {
        opts.keepSpace = true;
      }
      return textFromDoc(this.docs, opts)
    },
  };

  const methods$8 = { ...methods$9, ...text, ...methods$a, ...html$1 };

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$8);
  };

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!Object.hasOwn(model.one.tagSet, tag)) {
          return tag
        }
        // an unknown color should not break the output
        const paint = cli[model.one.tagSet[tag].color] || blue;
        return paint(tag)
      });
    }
    return tags.join(', ')
  };

  // browser consoles get a collapsible table per sentence
  const showClient = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      const out = m.docs[0].map(t => {
        const text = t.implicit ? '[' + t.implicit + ']' : t.text || '-';
        return { text, tags: '[' + Array.from(t.tags).join(', ') + ']' }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };

  const showTags = function (view) {
    if (typeof window !== 'undefined' && window.document) {
      showClient(view);
      return
    }
    const { docs, model } = view;
    if (docs.length === 0) {
      console.log(blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(blue('\n  ╭─────────'));
      terms.forEach(t => {
        const tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = yellow(text);
        let word = "'" + text + "'";
        if (t.frozen === true) {
          word += ' ❄️';
        }
        if (t.reference) {
          const str = view.update([t.reference]).text('normal');
          word += ` - ${dim(i$1('[' + str + ']'))}`;
        }
        word = word.padEnd(18);
        const str = blue('  │ ') + i$1(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const colors$1 = { Noun: blue, Verb: green, Adjective: yellow, Pivot: red };

  const showChunks = view => {
    console.log('');
    view.docs.forEach(terms => {
      const out = terms.map(term => {
        const text = term.implicit || term.normal;
        if (Object.hasOwn(colors$1, term.chunk)) {
          return colors$1[term.chunk](text)
        }
        return text
      });
      console.log(out.join(' '), '\n');
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  // each match on its own line: green, inside its grey sentence, aligned at the middle column
  const width = 55;
  const half = 27;
  const dots = '…';

  // drop words from the outer edge until the side fits, leaving room for an ellipsis
  const fit = (arr, max, fromStart) => {
    let cut = false;
    const size = () => (fromStart ? arr.join('').trimStart() : arr.join('').trimEnd()).length + (cut ? 2 : 0);
    while (arr.length > 0 && size() > max) {
      if (fromStart) {
        arr.shift();
      } else {
        arr.pop();
      }
      cut = true;
    }
    return cut
  };

  // the padded context before the match, the match, and the context after it
  const parts$1 = (terms, start, end) => {
    const arrs = [[], [], []]; // before, match, after
    terms.forEach((t, i) => {
      const str = (t.pre + t.text + t.post).replace(/\s+/g, ' ');
      const arr = arrs[(i >= start ? 1 : 0) + (i >= end ? 1 : 0)];
      // blank terms fold into the word before them
      if (str.trim() === '' && arr.length > 0) {
        arr[arr.length - 1] = (arr.at(-1) + str).replace(/\s+/g, ' ');
      } else {
        arr.push(str);
      }
    });
    const [before, match, after] = arrs;
    const left = (fit(before, half, true) ? dots + ' ' : '') + before.join('').trimStart();
    let mid = match.join('');
    const cutR = fit(after, width - half - mid.length, false);
    const right = after.join('').trimEnd() + (cutR ? ' ' + dots : '');
    if (right === '') {
      mid = mid.trimEnd();
    }
    return [' '.repeat(Math.max(0, half - left.length)) + left, mid, right]
  };

  const showHighlight = function (view) {
    const client = typeof window !== 'undefined' && window.document;
    view.fullPointer.forEach(([n, s, e]) => {
      const [left, mid, right] = parts$1(view.document[n], s, e);
      if (client) {
        console.log('%c' + left + '%c' + mid + '%c' + right, 'color:grey', 'color:green', 'color:grey');
      } else {
        console.log(grey(left) + green(mid) + (right ? grey(right) : ''));
      }
    });
  };

  const debug = {
    tags: showTags,
    chunks: showChunks,
    highlight: showHighlight,
  };

  const lastBrace = /\{(?=[^{]*$)/; // split on the last { only
  const comment = /\}[ \t]*#(.*)$/s; // an optional '# comment' after the last {tags} block


  // parse the spec output
  const parseLine = function (line = '') {
    let [text, tags] = line.split(lastBrace); // eslint-disable-line prefer-const
    if (tags === undefined) {
      const note = text.match(/\s#(.*)$/s)?.[1] || '';
      // no {tags} block on this line
      return { text: text.replace(/\s#.*$/s, '').trim(), tags: null, comment: note.trim() }
    }
    const note = (tags.match(comment)?.[1] || '').trim();
    tags = tags.replace(comment, '}'); // drop the comment - only ever one, always last
    tags = tags.split(',').map(tag => tag.trim());
    const lastTag = tags[tags.length - 1];
    tags[tags.length - 1] = lastTag.replace(/\}$/, '');
    tags = tags.map(tag => tag.split('|').map(t => t.trim()));
    if (tags.length === 1 && tags[0].length === 1 && tags[0][0] === '') {
      tags = []; // empty '{}'; retain empty slots in nonempty lists
    }
    return { text: text.trim(), tags, comment: note }
  };

  // parse a whole spec into [{ line, text, tags, comment }], skipping blank and comment lines
  const parseSpec = function (spec = '') {
    const list = [];
    spec.split('\n').forEach((str, i) => {
      if (str.trim() && !/^\s*#/.test(str)) {
        list.push({ line: i + 1, ...parseLine(str) });
      }
    });
    return list
  };

  // make a match syntax looping through the arrays of tags
  const toMatchString = function (tags, aliases) {
    // Slots accept tags and '.', never match-syntax quantifiers or groups.
    if (tags.some(slot => slot.some(tag => tag !== '.' && !/^!?#?[a-z][a-z0-9]*$/i.test(tag)))) {
      return null
    }
    return tags.map(arr => {
      arr = arr.map(str => {
        if (str === '.') {
          return '.'
        }
        const negative = str.startsWith('!');
        const tag = str.replace(/^!?#?/, '');
        const prefix = negative ? '!#' : '#';
        return prefix + (aliases[tag] || tag)
      });
      if (arr.length > 1) {
        return `(${arr.join(' && ')})`
      }
      return arr[0]
    }).join(' ')
  };

  // Apply only positive constraints; negatives remain assertions.
  const applyTags = (doc, slots, aliases) => {
    const terms = doc.terms();
    // Tokenization can supply structural tags; literal slots replace them.
    doc.docs.flat().forEach(term => term.tags.clear());
    slots?.forEach((slot, i) => {
      const tags = slot.filter(tag => tag !== '.' && !tag.startsWith('!')).map(tag => {
        tag = tag.replace(/^#/, '');
        return aliases[tag] || tag
      });
      terms.eq(i).tag(tags, 'fromSpec');
    });
  };

  // Diagnostics describe the original parse, before the returned View is mutated.
  const specFailures = (doc, slots, aliases) => {
    const terms = doc.docs.flat();
    const patterns = slots.map(slot => toMatchString([slot], aliases));
    const pattern = toMatchString(slots, aliases);
    if (terms.length === slots.length && pattern !== null && doc.has(pattern)) {
      return [] // valid
    }
    const failures = [];
    if (terms.length !== slots.length) {
      failures.push({
        code: 'length', expected: slots.length, actual: terms.length,
        message: `expected ${slots.length} terms, got ${terms.length}`,
      });
    }
    doc.compute('tagRank');
    slots.forEach((slot, i) => {
      const term = terms[i];
      const actual = term ? Array.from(term.tags) : [];
      const detail = { term: i + 1, word: term?.implicit || term?.text || '', expected: slot, actual };
      if (patterns[i] === null) {
        failures.push({ ...detail, code: 'syntax', message: `term ${i + 1}: invalid slot ${slot.join('|')}` });
        return
      }
      if (!term) {
        return // covered by the length error
      }
      const problems = [];
      slot.forEach(value => {
        if (value === '.') {
          return
        }
        const negative = value.startsWith('!');
        const tag = value.replace(/^!?#?/, '');
        const present = term.tags.has(aliases[tag] || tag);
        if (negative && present) {
          problems.push(`unexpected #${tag}`);
        } else if (!negative && !present) {
          problems.push(`missing #${tag}`);
        }
      });
      if (problems.length > 0) {
        const best = term.tagRank?.[0] || actual.at(-1) || 'Untagged';
        failures.push({
          ...detail, code: 'tags',
          message: `term ${i + 1} '${detail.word}': #${best}, ${problems.join(', ')}`,
        });
      }
    });
    if (failures.length === 0) {
      failures.push({ code: 'match', message: 'tags align, but the sentence pattern did not match' });
    }
    return failures
  };

  const logSpec = (doc, slots, failures, aliases) => {
    const terms = doc.docs.flat();
    const wrong = new Set(failures.filter(failure => failure.term).map(failure => failure.term - 1));
    const invalid = new Set(failures.filter(failure => failure.code === 'syntax').map(failure => failure.term - 1));
    const unmatched = failures.some(failure => failure.code === 'match');
    let visible = 0;
    terms.forEach((term, i) => {
      if (term.text) {
        visible = i;
      }
      // Implicit terms share their visible contraction or number-range token.
      if (wrong.has(i) || i >= slots.length || unmatched) {
        wrong.add(visible);
      }
    });
    const text = terms.map((term, i) => {
      const word = wrong.has(i) && term.text ? red(term.text) : term.text;
      return term.pre + word + term.post
    }).join('').trim();
    const tags = slots.map((slot, i) => {
      const term = terms[i];
      if (!term || invalid.has(i) || unmatched) {
        return red(slot.join('|'))
      }
      return slot.map(value => {
        if (value === '.') {
          return value
        }
        const negative = value.startsWith('!');
        const tag = value.replace(/^!?#?/, '');
        const present = term.tags.has(aliases[tag] || tag);
        return present === negative ? red(value) : value
      }).join('|')
    }).join(',');
    const block = slots.length === 0 ? red('{}') : `{${tags}}`;
    return `${text} ${block}`
  };

  // one ✓ or ✗ line per spec line, for verbose mode
  const logLine = (text, tags, detail) => {
    const block = tags === null ? '' : ` {${tags.map(slot => slot.join('|')).join(',')}}`;
    if (detail) {
      return `${red('✗')} ${text}${dim(block)} - ${red(detail)}`
    }
    return `${green('✓')} ${green(dim(text))}${dim(block)}`
  };

  const fromSpec = function (spec, { tags: tagMode = 'ignore', failures: failureMode = 'ignore', verbose = false } = {}) {
    if (!['ignore', 'use'].includes(tagMode) || !['ignore', 'throw', 'retain', 'log'].includes(failureMode)) {
      throw new Error('Invalid fromSpec options')
    }
    const aliases = this.world().model.one.tagAliases;
    const result = this('');
    result.failures = [];
    parseSpec(spec).forEach(({ line, text, tags }) => {
      const doc = tagMode === 'use' ? this.tokenize(text) : this(text);
      let failures = [];
      if (tags !== null && (tagMode === 'use' || failureMode !== 'ignore')) {
        const count = doc.docs.reduce((sum, terms) => sum + terms.length, 0);
        const pattern = toMatchString(tags, aliases);
        // Assigning slots is unsafe when the shape or syntax is invalid.
        const canApply = count === tags.length && pattern !== null;
        if (tagMode === 'use' && !canApply && failureMode !== 'log') {
          const invalid = specFailures(doc, tags, aliases);
          throw new Error(`${text} - ${invalid.map(failure => failure.message).join('; ')}`)
        }
        if (tagMode === 'use') {
          applyTags(doc, canApply ? tags : null, aliases);
        }
        if (failureMode !== 'ignore') {
          failures = specFailures(doc, tags, aliases)
            .map(failure => ({ line, text, ...failure }));
          result.failures.push(...failures);
        }
      } else if (tagMode === 'use') {
        applyTags(doc, null, aliases);
      }
      const detail = failures.map(failure => failure.message).join('; ');
      if (failureMode === 'log' && failures.length > 0) {
        console.error(logSpec(doc, tags, failures, aliases)); //eslint-disable-line no-console
      } else if (verbose || debug$2.spec) {
        console.log(logLine(text, tags, detail)); //eslint-disable-line no-console
      }
      if (failures.length > 0 && failureMode === 'throw') {
        throw new Error(`${text} - ${detail}`)
      }
      if (failureMode === 'retain' && tags !== null && failures.length === 0) {
        return
      }
      // Preserve the parsed terms and assigned tags, without running hooks twice.
      if (doc.found) {
        const previous = result.document.at(-1)?.at(-1);
        if (previous) {
          previous.post += '\n';
        }
        result.document.push(...doc.docs);
      }
    });
    return result
  };

  // Keep the legacy logging and throwing arguments on the compatibility wrapper.
  const testSpec = function (spec, verbose = true, throwError = false) {
    const result = this.fromSpec(spec, { tags: 'ignore', failures: 'retain', verbose });
    if (throwError && result.failures.length > 0) {
      const failure = result.failures[0];
      throw new Error(`${failure.text} - ${failure.message}`)
    }
    return result
  };

  var output = {
    lib: {
      fromSpec,
      testSpec,
    },
    api: addAPI$1,
    methods: {
      one: {
        hash: md5,
        debug,
        parseSpec,
      },
    },
  };

  // split a pointer, by match pointer
  const pivotBy = function (full, m) {
    const [n, start] = full;
    const mStart = m[1];
    const mEnd = m[2];
    const res = {};
    // is there space before the match?
    if (start < mStart) {
      const end = mStart < full[2] ? mStart : full[2]; // find closest end-point
      res.before = [n, start, end]; //before segment
    }
    res.match = m;
    // is there space after the match?
    if (full[2] > mEnd) {
      res.after = [n, mEnd, full[2]]; //after segment
    }
    return res
  };

  const doesMatch = function (full, m) {
    return full[1] <= m[1] && m[2] <= full[2]
  };

  const splitAll = function (full, m) {
    const byN = indexN(m);
    const res = [];
    full.forEach(ptr => {
      const [n] = ptr;
      let matches = byN[n] || [];
      matches = matches.filter(p => doesMatch(ptr, p));
      if (matches.length === 0) {
        res.push({ passthrough: ptr });
        return
      }
      // ensure matches are in-order
      matches = matches.sort((a, b) => a[1] - b[1]);
      // start splitting our left-to-right
      let carry = ptr;
      matches.forEach((p, i) => {
        const found = pivotBy(carry, p);
        // last one
        if (!matches[i + 1]) {
          res.push(found);
        } else {
          res.push({ before: found.before, match: found.match });
          if (found.after) {
            carry = found.after;
          }
        }
      });
    });
    return res
  };

  const max$1 = 20;

  // sweep-around looking for our start term uuid
  const blindSweep = function (id, doc, n) {
    for (let i = 0; i < max$1; i += 1) {
      // look up a sentence, then down one
      for (const k of [n - i, n + i]) {
        if (doc[k]) {
          const index = doc[k].findIndex(term => term.id === id);
          if (index !== -1) {
            return [k, index]
          }
        }
      }
    }
    return null
  };

  const repairEnding = function (ptr, document) {
    const [n, start, , , endId] = ptr;
    const terms = document[n];
    // look for end-id
    const newEnd = terms.findIndex(t => t.id === endId);
    if (newEnd === -1) {
      // if end-term wasn't found, so go all the way to the end
      ptr[2] = document[n].length;
      ptr[4] = terms.length > 0 ? terms[terms.length - 1].id : null;
    } else {
      ptr[2] = newEnd + 1; // repair ending pointer, which is exclusive
    }
    return document[n].slice(start, ptr[2])
  };

  /** return a subset of the document, from a pointer */
  const getDoc = function (ptrs, document) {
    let doc = [];
    ptrs.forEach((ptr, i) => {
      if (!ptr) {
        return
      }
      // eslint-disable-next-line prefer-const
      let [n, start, end, id, endId] = ptr;
      let terms = document[n] || [];
      if (start === undefined) {
        start = 0;
      }
      if (end === undefined) {
        end = terms.length;
      }
      if (id && (!terms[start] || terms[start].id !== id)) {
        // console.log('  repairing pointer...')
        const wild = blindSweep(id, document, n);
        if (wild !== null) {
          const len = end - start;
          terms = document[wild[0]].slice(wild[1], wild[1] + len);
          // actually change the pointer
          const startId = terms[0] ? terms[0].id : null;
          // the ending may have moved too, if its term still exists
          endId = document[wild[0]].some(term => term.id === endId) ? endId : undefined;
          ptr = [wild[0], wild[1], wild[1] + len, startId, endId];
          ptrs[i] = ptr;
        } else {
          // our start-term was deleted (replaced?) - trust the index, and adopt the term now there
          terms = terms.slice(start, end);
          ptr[3] = terms[0] ? terms[0].id : null;
        }
      } else {
        terms = terms.slice(start, end);
      }
      if (terms.length === 0) {
        return
      }
      if (start === end) {
        return
      }
      // test end-id, if it exists
      if (endId && terms[terms.length - 1].id !== endId) {
        terms = repairEnding(ptr, document);
      }
      // otherwise, looks good!
      doc.push(terms);
    });
    doc = doc.filter(a => a.length > 0);
    return doc
  };

  // flat list of terms from nested document
  const termList = docs => docs.flat();

  var methods$7 = {
    one: {
      termList,
      getDoc,
      pointer: {
        indexN,
        splitAll,
      }
    },
  };

  // a union is a + b, minus duplicates
  const getUnion = function (a, b) {
    const both = a.concat(b);
    const byN = indexN(both);
    let res = [];
    both.forEach(ptr => {
      const [n] = ptr;
      if (byN[n].length === 1) {
        // we're alone on this sentence, so we're good
        res.push(ptr);
        return
      }
      // there may be overlaps
      const hmm = byN[n].filter(m => doesOverlap(ptr, m));
      hmm.push(ptr);
      const range = getExtent(hmm);
      res.push(range);
    });
    res = uniquePtrs(res);
    return res
  };

  // two disjoint
  // console.log(getUnion([[1, 3, 4]], [[0, 1, 2]]))
  // two disjoint
  // console.log(getUnion([[0, 3, 4]], [[0, 1, 2]]))
  // overlap-plus
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 6]]))
  // overlap
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 3]]))
  // neighbours
  // console.log(getUnion([[0, 1, 3]], [[0, 3, 5]]))

  const subtract = function (refs, not) {
    const res = [];
    const found = splitAll(refs, not);
    found.forEach(o => {
      if (o.passthrough) {
        res.push(o.passthrough);
      }
      if (o.before) {
        res.push(o.before);
      }
      if (o.after) {
        res.push(o.after);
      }
    });
    return res
  };

  // console.log(subtract([[0, 0, 2]], [[0, 0, 1]]))
  // console.log(subtract([[0, 0, 2]], [[0, 1, 2]]))

  // [a,a,a,a,-,-,]
  // [-,-,b,b,b,-,]
  // [-,-,x,x,-,-,]
  const intersection = function (a, b) {
    // find the latest-start
    const start = a[1] < b[1] ? b[1] : a[1];
    // find the earliest-end
    const end = a[2] > b[2] ? b[2] : a[2];
    // does it form a valid pointer?
    if (start < end) {
      return [a[0], start, end]
    }
    return null
  };

  const getIntersection = function (a, b) {
    const byN = indexN(b);
    const res = [];
    a.forEach(ptr => {
      let hmm = byN[ptr[0]] || [];
      hmm = hmm.filter(p => doesOverlap(ptr, p));
      // no sentence-pairs, so no intersection
      if (hmm.length === 0) {
        return
      }
      hmm.forEach(h => {
        const overlap = intersection(ptr, h);
        if (overlap) {
          res.push(overlap);
        }
      });
    });
    return res
  };

  // console.log(getIntersection([[0, 1, 3]], [[0, 2, 4]]))

  // 'harden' our json pointers, again
  const addIds = function (ptrs, docs) {
    return ptrs.map(ptr => {
      const [n, start] = ptr;
      if (docs[n] && docs[n][start]) {
        ptr[3] = docs[n][start].id;
      }
      return ptr
    })
  };

  // a new view from the pointers
  const toView = (view, ptrs) => view.toView(addIds(ptrs, view.document));

  // combine our pointers with another view's
  const setOp = fn => function (m) {
    m = getDoc$1(m, this);
    return toView(this, fn(this.fullPointer, m.fullPointer))
  };

  const methods$6 = {};

  // all parts, minus duplicates
  methods$6.union = setOp(getUnion);
  methods$6.and = methods$6.union;

  // only parts they both have
  methods$6.intersection = setOp(getIntersection);

  // only parts of a that b does not have
  methods$6.not = setOp(subtract);
  methods$6.difference = methods$6.not;

  // get opposite of a match
  methods$6.complement = function () {
    return toView(this, subtract(this.all().fullPointer, this.fullPointer))
  };

  // remove overlaps
  methods$6.settle = function () {
    let ptrs = this.fullPointer;
    ptrs.forEach(ptr => {
      ptrs = getUnion(ptrs, [ptr]);
    });
    ptrs = addIds(ptrs, this.document);
    return this.update(ptrs)
  };

  const addAPI = function (View) {
    // add set/intersection/union
    Object.assign(View.prototype, methods$6);
  };

  var pointers = {
    methods: methods$7,
    api: addAPI,
  };

  var lib$2 = {
    // compile a list of matches into a match-net
    buildNet: function (matches) {
      const methods = this.methods();
      const net = methods.one.buildNet(matches, this.world());
      net.isNet = true;
      return net
    }
  };

  const api$d = function (View) {

    /** speedy match a sequence of matches */
    View.prototype.sweep = function (net, opts = {}) {
      const { world, docs } = this;
      const { methods } = world;
      let found = methods.one.bulkMatch(docs, net, this.methods, opts);

      // apply any changes
      if (opts.tagger !== false) {
        methods.one.bulkTagger(found, docs, this.world);
      }
      // fix the pointers
      // collect all found results into a View
      found = found.map(o => {
        const ptr = o.pointer;
        const term = docs[ptr[0]][ptr[1]];
        const len = ptr[2] - ptr[1];
        if (term.index) {
          o.pointer = [
            term.index[0],
            term.index[1],
            term.index[1] + len
          ];
        }
        return o
      });
      const ptrs = found.map(o => o.pointer);
      // cleanup results a bit
      found = found.map(obj => {
        obj.view = this.update([obj.pointer]);
        delete obj.regs;
        delete obj.needs;
        delete obj.pointer;
        delete obj._expanded;
        return obj
      });
      return {
        view: this.update(ptrs),
        found
      }
    };

  };

  const sets = new WeakMap();
  const empty = new Set();

  // Normalization replaces these arrays when plugins rebuild the tag graph.
  const getTagSet = (tags) => {
    if (!tags || tags.length === 0) {
      return empty
    }
    let set = sets.get(tags);
    if (!set) {
      set = new Set(tags);
      sets.set(tags, set);
    }
    return set
  };

  // strip the '#', then follow any alias
  const resolveTag = (tag, aliases) => {
    tag = tag.replace(/^#/, '');
    return aliases?.[tag] || tag
  };

  // Resolve actions and index hints once, alongside the match expression.
  const resolveAliases = (rule, aliases) => {
    const tag = value => {
      if (Array.isArray(value)) {
        return value.map(tag)
      }
      if (typeof value !== 'string') {
        return value
      }
      return value.trim().split(/ +/).map(name => resolveTag(name, aliases)).join(' ')
    };
    const hook = value => {
      if (typeof value === 'string' && value.startsWith('#')) {
        return '#' + tag(value)
      }
      return value
    };
    if (rule.tag !== undefined) {
      rule.tag = tag(rule.tag);
    }
    if (rule.unTag !== undefined) {
      rule.unTag = tag(rule.unTag);
    }
    if (rule.hook !== undefined) {
      rule.hook = hook(rule.hook);
    }
    if (rule.ifNo !== undefined) {
      rule.ifNo = [rule.ifNo].flat().map(hook);
    }
  };

  // Only precheck required, single-term tokens without special matching steps.
  const canCheck = reg => Boolean(reg && !reg.optional && !reg.negative && !reg.greedy &&
    !reg.choices && !reg.anything && !reg.regex && !reg.method);

  const getBoundary = (reg, boundary) => {
    if (!canCheck(reg) || !reg[boundary]) {
      return null
    }
    return reg
  };

  // extract the clear needs for an individual match token
  const getTokenNeeds = function (reg) {
    // negatives can't be cached
    if (reg.optional === true || reg.negative === true) {
      return null
    }
    if (reg.tag) {
      return '#' + reg.tag
    }
    if (reg.word) {
      return reg.word
    }
    if (reg.switch) {
      return `%${reg.switch}%`
    }
    return null
  };

  // Only allow hooks that every successful match must contain. In particular,
  // a word inside an optional or negative AND block is not a required hook.
  const hasRequiredHook = function (regs, hook) {
    return regs.some(reg => {
      if (reg.optional || reg.negative) {
        return false
      }
      if (getTokenNeeds(reg) === hook) {
        return true
      }
      return reg.operator === 'and' && reg.choices &&
        reg.choices.some(side => hasRequiredHook(side, hook))
    })
  };

  const getNeeds = function (regs) {
    const needs = [];
    regs.forEach(reg => {
      needs.push(getTokenNeeds(reg));
      // support AND (foo && tag) - but an optional or negative block requires nothing
      if (reg.operator === 'and' && reg.choices && !reg.optional && !reg.negative) {
        reg.choices.forEach(oneSide => {
          oneSide.forEach(r => {
            needs.push(getTokenNeeds(r));
          });
        });
      }
    });
    return needs.filter(str => str)
  };

  const getWants = function (regs) {
    const wants = [];
    let count = 0;
    regs.forEach(reg => {
      if (reg.operator === 'or' && !reg.optional && !reg.negative) {
        // add fast-or terms
        if (reg.fastOr) {
          Array.from(reg.fastOr).forEach(w => {
            wants.push(w);
          });
        }
        // add slow-or
        if (reg.choices) {
          reg.choices.forEach(rs => {
            rs.forEach(r => {
              const n = getTokenNeeds(r);
              if (n) {
                wants.push(n);
              }
            });
          });
        }
        count += 1;
      }
    });
    return { wants, count }
  };

  const parse$3 = function (matches, world) {
    const parseMatch = world.methods.one.parseMatch;
    matches.forEach(obj => {
      resolveAliases(obj, world.model.one.tagAliases);
      obj.regs = parseMatch(obj.match, {}, world);
      obj.fixed = isFixed(obj.regs);
      obj.checkFirst = canCheck(obj.regs[0]);
      obj.startTerm = getBoundary(obj.regs[0], 'start');
      obj.endTerm = getBoundary(obj.regs[obj.regs.length - 1], 'end');
      if (obj.notIf) {
        obj.notIf = parseMatch(obj.notIf, {}, world);
      }
      // cache any requirements up-front 
      obj.needs = getNeeds(obj.regs);
      if (obj.hook !== undefined) {
        if (typeof obj.hook !== 'string' || !obj.needs.includes(obj.hook) || !hasRequiredHook(obj.regs, obj.hook)) {
          throw new Error(`Invalid hook "${obj.hook}" for match "${obj.match}": use a required word, #Tag, or %Switch%.`)
        }
      }
      const { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
      // The matcher excludes negative tokens from its own minimum. Cache that
      // separately rather than changing the sweep's existing length filter.
      obj.minLength = getMinLength(obj.regs);
    });
    return matches
  };

  // Choose one necessary hook per rule. A missing required hook guarantees that
  // the rule cannot match, so broader hooks need not enqueue it as well.
  const buildIndex = function (matches, hooks, hookOrder) {
    const index = Object.create(null);
    const seen = new Set();
    const lastRank = Object.keys(hooks).length;
    matches.forEach((rule, order) => {
      if (seen.has(rule)) {
        return
      }
      seen.add(rule);
      let anchor = null;
      let rank = lastRank;
      for (let i = 0; i < rule.needs.length; i += 1) {
        const key = rule.needs[i];
        // Prefer the hook shared by the fewest rules in this network.
        if (anchor === null || hooks[key].length < hooks[anchor].length) {
          anchor = key;
        }
        rank = Math.min(rank, hookOrder[key]);
      }
      // Explicit hooks have already been checked against required match tokens.
      if (rule.hook !== undefined) {
        anchor = rule.hook;
      }
      // Historically, any earlier matching alternative could determine where
      // this rule ran. Retain that ordering even when using a required anchor.
      const earlier = [...new Set(rule.wants)]
        .filter(key => hookOrder[key] < rank)
        .sort((a, b) => hookOrder[a] - hookOrder[b]);
      const keys = anchor === null ? [...new Set(rule.wants)] : [anchor];
      // The bucket already proves its anchor; check each remaining need once.
      const needs = [...new Set(rule.needs)].filter(key => key !== anchor);
      const entry = { rule, order, rank, earlier, needs, single: keys.length === 1 };
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        index[key] ||= [];
        index[key].push(entry);
      }
    });
    return index
  };

  // do some indexing on the list of matches
  const buildNet = function (matches, world) {
    // turn match-syntax into json
    matches = parse$3(matches, world);

    // collect by wants and needs
    const hooks = {};
    matches.forEach(obj => {
      // add needs, then wants
      obj.needs.concat(obj.wants).forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
    });
    // Record enumeration order, including numeric keys, so input-driven lookup
    // can preserve the order in which tag actions have always been applied.
    const hookOrder = Object.create(null);
    Object.keys(hooks).forEach((k, i) => {
      hookOrder[k] = i;
      // remove duplicates
      const already = new Set();
      hooks[k] = hooks[k].filter(obj => {
        if (already.has(obj)) {
          return false
        }
        already.add(obj);
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    const always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      hookOrder,
      index: buildIndex(matches, hooks, hookOrder),
      always
    }
  };

  // Reject impossible candidates before allocating and sorting their entries.
  const canMatch = (obj, haves, terms, needs = obj.needs) => {
    const termCount = terms.length;
    if (!(termCount >= obj.minWords)) {
      return false
    }
    for (let j = 0; j < needs.length; j += 1) {
      if (!haves.has(needs[j])) {
        return false
      }
    }
    if (obj.ifNo !== undefined) {
      for (let j = 0; j < obj.ifNo.length; j += 1) {
        if (haves.has(obj.ifNo[j])) {
          return false
        }
      }
    }
    if (obj.wants.length > 0) {
      let count = 0;
      for (let j = 0; j < obj.wants.length; j += 1) {
        if (haves.has(obj.wants[j])) {
          count += 1;
          if (count >= obj.minWant) {
            break
          }
        }
      }
      if (!(count >= obj.minWant)) {
        return false
      }
    }
    // Required anchors must match the sentence boundary, not just occur in it.
    if (termCount && obj.startTerm && !wrapMatch(terms[0], obj.startTerm, 0, termCount)) {
      return false
    }
    if (termCount && obj.endTerm && !wrapMatch(terms[termCount - 1], obj.endTerm, termCount - 1, termCount)) {
      return false
    }
    return true
  };

  // Required anchors narrow the candidate list. Sort surviving entries by their
  // original first matching hook, then their position within that hook's bucket.
  const getIndexed = function (set, index, hookOrder, terms) {
    const found = [];
    const seen = new Set();
    set.forEach(key => {
      const bucket = index[key];
      if (!Array.isArray(bucket)) {
        return
      }
      for (let i = 0; i < bucket.length; i += 1) {
        const entry = bucket[i];
        // Single-bucket entries cannot be encountered twice. Older nets fall back.
        if (entry.single !== true) {
          if (seen.has(entry)) {
            continue
          }
          seen.add(entry);
        }
        if (!canMatch(entry.rule, set, terms, entry.needs)) {
          continue
        }
        let rank = entry.rank;
        for (let j = 0; j < entry.earlier.length; j += 1) {
          const earlier = entry.earlier[j];
          if (set.has(earlier)) {
            rank = hookOrder[earlier];
            break
          }
        }
        if (rank === entry.rank) {
          found.push(entry);
        } else {
          found.push({ rule: entry.rule, rank, order: entry.order });
        }
      }
    });
    found.sort((a, b) => a.rank - b.rank || a.order - b.order);
    return found.map(entry => entry.rule)
  };

  // for each cached-sentence, find a list of possible matches
  const getHooks = function (docCaches, net, document) {
    const { hooks, index, always } = net;
    let { hookOrder } = net;
    // Older compiled nets may not include the precomputed hook order.
    if (!hookOrder) {
      hookOrder = Object.create(null);
      Object.keys(hooks).forEach((k, i) => { hookOrder[k] = i; });
    }
    const lists = docCaches.map((set, n) => {
      if (index) {
        return getIndexed(set, index, hookOrder, document[n])
      }
      const keys = [];
      set.forEach(k => {
        if (typeof hookOrder[k] === 'number') {
          keys.push(k);
        }
      });
      keys.sort((a, b) => hookOrder[a] - hookOrder[b]);
      // Append each rule once, without concatenating and then filtering buckets.
      const maybe = [];
      const already = new Set();
      for (let i = 0; i < keys.length; i += 1) {
        const bucket = hooks[keys[i]];
        for (let j = 0; j < bucket.length; j += 1) {
          const m = bucket[j];
          if (!already.has(m)) {
            already.add(m);
            if (canMatch(m, set, document[n])) {
              maybe.push(m);
            }
          }
        }
      }
      return maybe
    });
    // Apply the same exclusions to unindexed rules, preserving their final position.
    lists.forEach((list, n) => {
      for (let i = 0; i < always.length; i += 1) {
        if (canMatch(always[i], docCaches[n], document[n])) {
          list.push(always[i]);
        }
      }
    });
    return lists
  };

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, methods, opts) {
    const results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      const sentence = [document[n]];
      for (let i = 0; i < maybeList[n].length; i += 1) {
        const m = maybeList[n][i];
        // ok, actually do the work.
        const res = methods.one.match(sentence, m);
        // found something.
        if (res.ptrs.length > 0) {
          res.ptrs.forEach(ptr => {
            ptr[0] = n; // fix the sentence pointer
            // check ifNo
            // if (m.ifNo !== undefined) {
            //   let terms = document[n].slice(ptr[1], ptr[2])
            //   for (let k = 0; k < m.ifNo.length; k += 1) {
            //     const no = m.ifNo[k]
            //     // quick-check cache
            //     if (docCache[n].has(no)) {
            //       if (no.startsWith('#')) {
            //         let tag = no.replace(/^#/, '')
            //         if (terms.find(t => t.tags.has(tag))) {
            //           console.log('+' + tag)
            //           return
            //         }
            //       } else if (terms.find(t => t.normal === no || t.tags.has(no))) {
            //         console.log('+' + no)
            //         return
            //       }
            //     }
            //   }
            // }
            results.push({ ...m, pointer: ptr });
          });
          //ok cool, can we stop early?
          if (opts.matchOne === true) {
            return [results[0]]
          }
        }
      }
    }
    return results
  };

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    const docCache = methods.one.cacheDoc(document);
    // filter candidates before sorting them into execution order
    const maybeList = getHooks(docCache, net, document);

    // now actually run the matches
    const results = runMatch(maybeList, document, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };

  // quick check if this tag will require any untagging
  const canBe$1 = function (term, tag, tagSet) {
    if (!Object.hasOwn(tagSet, tag)) {
      return true // everything can be an unknown tag
    }
    const conflicts = getTagSet(tagSet[tag].not);
    if (conflicts.size === 0) {
      return true
    }
    for (const existing of term.tags) {
      if (conflicts.has(existing)) {
        return false
      }
    }
    return true
  };

  // is this tag consistent with the tags they already have?
  const canBe = (terms, tag, model) => terms.every(term => canBe$1(term, tag, model.one.tagSet));

  const tagger$2 = function (list, document, world) {
    const { model, methods } = world;
    const { getDoc, setTag, unTag } = methods.one;
    const looksPlural = methods.two.looksPlural;
    if (list.length === 0) {
      return list
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk && !todo.unTag) {
        return
      }
      const reason = todo.reason || todo.match;
      const terms = getDoc([todo.pointer], document)[0];
      let validated;
      // handle 'safe' tag
      if (todo.safe === true) {
        // check for conflicting tags
        if (canBe(terms, todo.tag, model) === false) {
          return
        }
        // dont tag half of a hyphenated word
        if (terms[terms.length - 1].post === '-') {
          return
        }
        // Only an exact single tag was checked by canBe; arrays and shorthand
        // still need their individual checks in setTag.
        if (typeof todo.tag === 'string' && Object.hasOwn(model.one.tagSet, todo.tag)) {
          validated = model.one.tagSet[todo.tag];
        }
      }
      if (todo.tag !== undefined) {
        setTag(terms, todo.tag, world, todo.safe, `[post] '${reason}'`, validated);
        // quick and dirty plural tagger 😕
        if (todo.tag === 'Noun' && looksPlural) {
          const term = terms[terms.length - 1];
          if (looksPlural(term.text)) {
            setTag([term], 'Plural', world, todo.safe, 'quick-plural');
          } else {
            setTag([term], 'Singular', world, todo.safe, 'quick-singular');
          }
        }
        // allow freezing this match, too
        if (todo.freeze === true) {
          terms.forEach(term => (term.frozen = true));
        }
      }
      if (todo.unTag !== undefined) {
        unTag(terms, todo.unTag, model.one.tagSet, reason);
      }
      // allow setting chunks, too
      if (todo.chunk) {
        terms.forEach(t => (t.chunk = todo.chunk));
      }
    })
  };

  var methods$5 = {
    buildNet,
    bulkMatch: sweep$1,
    bulkTagger: tagger$2
  };

  var sweep = {
    lib: lib$2,
    api: api$d,
    methods: {
      one: methods$5,
    }
  };

  const isMulti = / /;

  const addChunk = function (term, tag) {
    if (tag === 'Noun' || tag === 'Verb') {
      term.chunk = tag;
    }
  };

  // eslint-disable-next-line max-params
  const tagTerm = function (term, tag, tagSet, isSafe, validated, reason) {
    // does it already have this tag?
    if (term.tags.has(tag)) {
      return null
    }
    // allow this shorthand in multiple-tag strings
    if (tag === '.') {
      return null
    }
    // don't overwrite any tags, if term is frozen
    if (term.frozen === true) {
      isSafe = true;
    }
    const previous = debug$2.tags ? debug$2.before(term) : null;
    // for known tags, do logical dependencies first
    const known = tagSet[tag];
    if (known) {
      // first, we remove any conflicting tags
      if (known !== validated && known.not && known.not.length > 0) {
        const conflicts = getTagSet(known.not);
        for (const existing of term.tags) {
          if (conflicts.has(existing)) {
            // Safe and frozen terms cannot lose conflicting tags.
            if (isSafe === true) {
              return null
            }
            term.tags.delete(existing);
          }
        }
      }
      // add parent tags
      if (known.parents && known.parents.length > 0) {
        for (let o = 0; o < known.parents.length; o += 1) {
          term.tags.add(known.parents[o]);
          addChunk(term, known.parents[o]);
        }
      }
    }
    // finally, add our tag
    term.tags.add(tag);
    // now it's dirty?
    term.dirty = true;
    // add a chunk too, if it's easy
    addChunk(term, tag);
    if (previous) {
      debug$2.log(term, previous, reason);
    }
    return true
  };

  // support '#Noun . #Adjective' syntax
  // eslint-disable-next-line max-params
  const multiTag = function (terms, tagString, tagSet, aliases, isSafe, reason) {
    const tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      const tag = tags[i];
      if (tag) {
        tagTerm(term, resolveTag(tag, aliases), tagSet, isSafe, undefined, reason);
      }
    });
  };

  // add a tag to all these terms
  // Whole-match validation is separate from per-term safety.
  // eslint-disable-next-line max-params
  const setTag = function (terms, tag, world = {}, isSafe, reason, validated) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    if (Array.isArray(tag)) {
      tag.forEach(tg => setTag(terms, tg, world, isSafe, reason));
      return
    }
    if (typeof tag !== 'string') {
      console.warn(`compromise: Invalid tag '${tag}'`); // eslint-disable-line
      return
    }
    tag = tag.trim();
    // support '#Noun . #Adjective' syntax
    if (isMulti.test(tag)) {
      multiTag(terms, tag, tagSet, world.model.one.tagAliases, isSafe, reason);
      return
    }
    tag = resolveTag(tag, world.model.one.tagAliases);
    for (let i = 0; i < terms.length; i += 1) {
      tagTerm(terms[i], tag, tagSet, isSafe, validated, reason);
    }
  };

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet, reason = 'untag') {
    tag = tag.trim().replace(/^#/, '');
    const children = getTagSet(tagSet[tag]?.children);
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      // don't untag anything if term is frozen
      if (term.frozen === true) {
        continue
      }
      const previous = debug$2.tags ? debug$2.before(term) : null;
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        if (previous) {
          debug$2.log(term, previous, reason);
        }
        continue
      }
      // removing #Verb should also remove #PastTense
      if (children.size > 0) {
        for (const existing of term.tags) {
          if (children.has(existing)) {
            term.tags.delete(existing);
          }
        }
      }
      term.tags.delete(tag);
      if (previous) {
        debug$2.log(term, previous, reason);
      }
    }
  };

  const validate$1 = function (node) {
    node.children = node.children || [];
    node._cache = node._cache || {};
    node.props = node.props || {};
    node._cache.parents = node._cache.parents || [];
    return node
  };

  // Iterative DFS keeps deep inputs safe and distinguishes shared nodes from cycles.
  const checkCycles = roots => {
    const states = new Map();
    const stack = roots.map(node => [node, false]);
    for (; stack.length > 0;) {
      const [node, done] = stack.pop();
      if (done) {
        states.set(node, 2);
      } else if (states.get(node) === 1) {
        throw new Error('[Grad] - cyclic input')
      } else if (!states.has(node)) {
        states.set(node, 1);
        stack.push([node, true]);
        for (const child of node.children || []) {
          stack.push([child, false]);
        }
      }
    }
    return states.keys()
  };

  // turn parent-index rows into nested json
  const fromArray = function (rows) {
    const index = new Map();
    // addTags allocates these rows for this graph, so initialize them in place.
    rows.forEach(node => {
      validate$1(node);
      index.set(node.id, node);
    });
    const root = validate$1({});
    rows.forEach(node => {
      if (node.parent) {
        if (index.has(node.parent)) {
          const parent = index.get(node.parent);
          delete node.parent; //no-longer needed
          parent.children.push(node);
        } else {
          console.warn(`[Graph] - missing node '${node.parent}'`); // eslint-disable-line no-console
        }
        return
      }
      // no parent, add it to root
      root.children.push(node);
    });
    checkCycles(rows);
    return root
  };

  // [a, a1, b, b1]
  // Visitor-only callers can skip collecting nodes.
  const byDepth = (root, fn, collect = true) => {
    const list = collect ? [] : null;
    const queue = [root];
    for (; queue.length > 0;) {
      // get first
      const node = queue.pop();
      if (collect) {
        list.push(node);
      }
      // add kids to queue
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i -= 1) {
          const child = node.children[i];
          if (fn) {
            fn(node, child);
          }
          queue.push(child);
        }
      }
    }
    return list
  };

  // Fresh graph nodes already have empty caches; fill ancestors in root-to-parent order.
  const cacheParents = root => {
    byDepth(root, (parent, child) => {
      if (parent.id) {
        child._cache.parents = parent._cache.parents.concat([parent.id]);
      }
    }, false);
  };

  // addTags supplies only exclusions, additional parents, and these scalar flags.
  const inherit = (props, parent) => {
    if (parent.not) {
      props.not = new Set([...props.not, ...parent.not]);
    }
    if (Array.isArray(parent.also) && (props.also === undefined || Array.isArray(props.also))) {
      props.also = parent.also.concat(props.also || []);
    } else if (props.also === undefined) {
      props.also = parent.also;
    }
    if (props.is === undefined) {
      props.is = parent.is;
    }
    if (props.novel === undefined) {
      props.novel = parent.novel;
    }
    return props
  };

  const fillDown = root => {
    byDepth(root, (parent, child) => {
      child.props = inherit(child.props, parent.props);
    }, false);
  };

  const toArray$1 = function (json) {
    // The tag formatter only reads these graph-owned nodes.
    const nodes = byDepth(json);
    // should we show the root?
    const root = nodes[0];
    if (root && !root.id && Object.keys(root.props).length === 0) {
      nodes.shift();
    }
    return nodes
  };

  // The tag-inheritance subset of grad-school;
  // https://github.com/spencermountain/grad-school

  class Graph {
    constructor(json) {
      Object.defineProperty(this, 'json', {
        enumerable: false,
        value: json,
        writable: true,
      });
    }
    cache() {
      cacheParents(this.json);
      return this
    }
    fillDown() {
      fillDown(this.json);
      return this
    }
    // the graph's nodes, parents first
    toArray() {
      // fillDown changes properties, so the cached graph relationships still hold.
      return toArray$1(this.json)
    }
  }

  const graph = rows => new Graph(fromArray(rows));

  // i just made these up
  const colors = {
    Noun: 'blue',
    Verb: 'green',
    Negative: 'green',
    Date: 'red',
    Value: 'red',
    Adjective: 'magenta',
    Connector: 'cyan',
    Determiner: 'cyan',
    Hyphenated: 'cyan',
    Adverb: 'cyan',
  };

  const getColor = function (node) {
    if (Object.hasOwn(colors, node.id)) {
      return colors[node.id]
    }
    if (Object.hasOwn(colors, node.is)) {
      return colors[node.is]
    }
    const found = node._cache.parents.find(c => colors[c]);
    return colors[found]
  };

  // convert tags to our final format
  const fmt = function (nodes) {
    const res = {};
    const each = fn => Object.keys(res).forEach(fn);
    nodes.forEach(node => {
      const { not, also, is, novel } = node.props;
      let parents = node._cache.parents;
      if (also) {
        parents = parents.concat(also);
      }
      res[node.id] = {
        is,
        not,
        novel,
        also,
        parents,
        children: [],
        color: getColor(node),
        // Retain the preferred output name for legacy model consumers.
        alias: node.aliases === undefined ? node.alias : node.aliases[0],
        aliases: node.aliases,
      };
    });
    // `also` is another inheritance edge. Resolve its ancestors before building
    // reverse edges, so removing any parent also removes all dependent tags.
    const resolved = new Set();
    const resolving = new Set();
    const resolveParents = function (tag) {
      if (resolved.has(tag)) {
        return res[tag].parents
      }
      if (resolving.has(tag)) {
        throw new Error(`compromise: cyclic tag inheritance at '${tag}'`)
      }
      resolving.add(tag);
      const parents = new Set();
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          resolveParents(parent).forEach(ancestor => parents.add(ancestor));
        }
        parents.add(parent);
      });
      res[tag].parents = Array.from(parents);
      resolving.delete(tag);
      resolved.add(tag);
      return res[tag].parents
    };
    each(resolveParents);
    each(tag => {
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          res[parent].children.push(tag);
        }
      });
    });

    // Inherit exclusions through every parent, then exclude all descendants of
    // each conflicting tag. Read a snapshot to keep this independent of order.
    const exclusions = {};
    each(tag => { exclusions[tag] = res[tag].not; });
    each(k => {
      const nots = new Set(exclusions[k]);
      res[k].parents.forEach(parent => {
        for (const not of exclusions[parent] || []) {
          nots.add(not);
        }
      });
      Array.from(nots).forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
      getTagSet(res[k].not);
      getTagSet(res[k].children);
      // Keep accepting custom definitions, but flag impossible combinations once
      // per tag, after both inheritance and reciprocal exclusions are resolved.
      const conflicts = [k, ...res[k].parents].filter(tag => nots.has(tag));
      if (conflicts.length > 0) {
        const names = conflicts.map(tag => `#${tag}`).join(', ');
        console.warn(`compromise: contradictory tag '#${k}' requires and excludes: ${names}`); // eslint-disable-line no-console
      }
    });
    return res
  };

  // Compile once per registration. Real tag names always take precedence.
  const compileAliases = (tags, normalize) => {
    const aliases = Object.create(null);
    Object.keys(tags).forEach(tag => { aliases[tag] = tag; });
    Object.keys(tags).forEach(tag => {
      const entry = tags[tag];
      const names = entry.aliases === undefined ? [entry.alias] : [entry.aliases].flat();
      names.forEach(name => {
        if (name === null || name === undefined) {
          return
        }
        if (typeof name !== 'string' || !/^[\p{L}_][\p{L}\p{M}\p{N}_-]*$/u.test(name)) {
          throw new Error(`compromise: invalid alias for '#${tag}'`)
        }
        // Match strings undergo Unicode normalization before parsing.
        const spellings = normalize ? [name, normalize(name)] : [name];
        spellings.forEach(spelling => {
          if (Object.hasOwn(tags, spelling)) {
            if (spelling !== name && spelling !== tag) {
              throw new Error(`compromise: tag alias '${name}' normalizes to '#${spelling}'`)
            }
            return
          }
          if (aliases[spelling] && aliases[spelling] !== tag) {
            throw new Error(`compromise: duplicate tag alias '${spelling}'`)
          }
          aliases[spelling] = tag;
        });
      });
    });
    return aliases
  };

  const toArr = function (input) {
    if (!input) {
      return []
    }
    if (typeof input === 'string') {
      return [input]
    }
    return input.slice()
  };

  const addImplied = function (tags) {
    const aliases = compileAliases(tags);
    const resolve = tag => aliases[tag] || tag;
    // add an implicit entry for any tag we reference
    const ensure = tag => {
      if (!Object.hasOwn(tags, tag)) {
        tags[tag] = {};
      }
    };
    Object.keys(tags).forEach(k => {
      const o = tags[k];
      // support deprecated fmts
      if (o.isA) {
        o.is = o.isA;
      }
      if (o.notA) {
        o.not = o.notA;
      }
      if (typeof o.is === 'string') {
        o.is = resolve(o.is);
      }
      if (o.also) {
        o.also = toArr(o.also).map(resolve);
      }
      if (o.not) {
        o.not = toArr(o.not).map(resolve);
      }
      // add any implicit 'is' tags
      if (o.is && typeof o.is === 'string') {
        ensure(o.is);
      }
      // Additional parents need entries too, including parents introduced by plugins.
      toArr(o.also).forEach(ensure);
      // add any implicit 'not' tags
      toArr(o.not).forEach(ensure);
    });
    return tags
  };


  const validate = function (tags, already) {
    // Reciprocal links must reach previously registered tags too. Copy entries
    // before normalization so the existing compiled model remains untouched.
    tags = Object.fromEntries(Object.keys({ ...already, ...tags }).map(tag => [tag, { ...already[tag], ...tags[tag] }]));
    tags = addImplied(tags);

    // property validation
    Object.keys(tags).forEach(k => {
      const o = tags[k];
      if (o.aliases !== undefined) {
        o.aliases = toArr(o.aliases);
      }
      o.children = toArr(o.children);
      o.not = toArr(o.not);
      if (o.also) {
        o.also = toArr(o.also);
      }
    });
    // not links are bi-directional
    // add any incoming not tags
    Object.keys(tags).forEach(k => {
      const nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not && !tags[no].not.includes(k)) {
          tags[no].not.push(k);
        }
      });
    });
    return tags
  };

  // 'fill-down' parent logic inference
  const compute$1 = function (allTags) {
    // setup graph-lib format
    const flatList = Object.keys(allTags).map(k => {
      const o = allTags[k];
      const props = { not: new Set(o.not), also: o.also, is: o.is, novel: o.novel };
      return { id: k, parent: o.is, props, children: [], alias: o.alias, aliases: o.aliases?.slice() }
    });
    const graph$1 = graph(flatList).cache().fillDown();
    return graph$1.toArray()
  };

  const fromUser = function (tags) {
    Object.entries(tags).forEach(([k, v]) => {
      tags[k] = { ...v, novel: true };
    });
    return tags
  };

  const addTags$1 = function (tags, already) {
    // Normalization owns its definitions, including when callers reuse a tagset.
    tags = Object.fromEntries(Object.entries(tags).map(([tag, definition]) => [tag, { ...definition }]));
    // are these tags internal ones, or user-generated?
    if (Object.keys(already).length > 0) {
      tags = fromUser(tags);
    }
    tags = validate(tags, already);

    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$1(tags);
    // convert it to our final format
    const res = fmt(nodes);
    return res
  };

  var methods$4 = {
    one: {
      setTag,
      unTag,
      addTags: addTags$1,
      canBe: canBe$1,
    },
  };

  // shared guards - returns the terms to change, or null
  const prep = function (view, input) {
    if (!view.found || !input) {
      return null
    }
    const terms = view.termList();
    if (terms.length === 0) {
      return null
    }
    return terms
  };

  const fns = {
    /** add a given tag, to all these terms */
    tag: function (input, reason = '', isSafe) {
      const terms = prep(this, input);
      if (terms) {
        this.methods.one.setTag(terms, input, this.world, isSafe, reason);
        this.uncache();
      }
      return this
    },

    /** add a given tag, only if it is consistent */
    tagSafe: function (input, reason = '') {
      return this.tag(input, reason, true)
    },

    /** remove a given tag from all these terms */
    unTag: function (input, reason) {
      const terms = prep(this, input);
      if (terms) {
        const { methods, model } = this;
        const { tagSet, tagAliases } = model.one;
        const list = Array.isArray(input) ? input : [input];
        list.forEach(tag => methods.one.unTag(terms, resolveTag(tag.trim(), tagAliases), tagSet, reason));
        this.uncache();
      }
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      const { tagSet, tagAliases } = this.model.one;
      tag = resolveTag(tag, tagAliases);
      const canBe = this.methods.one.canBe;
      const nope = [];
      eachTerm(this.document, (term, terms, i, n) => {
        if (!canBe(term, tag, tagSet)) {
          nope.push([n, i, i + 1]);
        }
      });
      const noDoc = this.update(nope);
      return this.difference(noDoc)
    },
  };

  const tagAPI = function (View) {
    Object.assign(View.prototype, fns);
  };

  // wire-up more pos-tags to our model
  const addTags = function (tags) {
    const world = this.world();
    const { model, methods } = world;
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    const res = fn(tags, tagSet);
    const aliases = compileAliases(res, name => methods.one.killUnicode(name, world));
    model.one.tagSet = res;
    model.one.tagAliases = aliases;
    return this
  };

  var lib$1 = { addTags };

  const boringTags = new Set(['Auxiliary', 'Possessive']);

  const sortByKids = function (tags, tagSet) {
    tags = tags.sort((a, b) => {
      // (unknown tags are interesting)
      if (boringTags.has(a) || !Object.hasOwn(tagSet, b)) {
        return 1
      }
      if (boringTags.has(b) || !Object.hasOwn(tagSet, a)) {
        return -1
      }
      let kids = tagSet[a].children || [];
      const aKids = kids.length;
      kids = tagSet[b].children || [];
      const bKids = kids.length;
      return aKids - bKids
    });
    return tags
  };

  const tagRank = function (view) {
    const { document, world } = view;
    const tagSet = world.model.one.tagSet;
    eachTerm(document, term => {
      const tags = Array.from(term.tags);
      term.tagRank = sortByKids(tags, tagSet);
    });
  };

  var tag = {
    model: {
      one: { tagSet: {}, tagAliases: Object.create(null) }
    },
    compute: {
      tagRank
    },
    methods: methods$4,
    api: tagAPI,
    lib: lib$1
  };

  // Scan punctuation runs once. Searching for an unanchored run followed by
  // whitespace repeatedly rescans long runs that have no following whitespace.
  const stops = new Set('.!?\u203D\u2E18\u203C\u2047\u2048\u2049\u0964\u0965\u061F\u06D4\u0589\u1362\u1367\u104B\u17D4\u3002');
  const cjkStops = new Set('。！？｡');
  const openers$1 = new Set('「『（【〔《〈“');
  const closers = new Set('」』）】〕》〉”');
  const whitespace = /\s/;
  const splitsOnly = /^[.!?‽⸘‼\u2047-\u2049।॥؟۔։።፧။។。]+\s$/;
  const splitsOnlyCjk = /^(?:[.!?‽⸘‼\u2047-\u2049।॥؟۔։።፧။។。！？｡]+\s|[。！？｡]+[」』）】〕》〉”]*)$/;
  const newLine = /((?:\r?\n|\r)+)/;

  const basicSplit = function (text) {
    const all = [];
    const isCjk = /[。！？｡]/.test(text);
    const activeStops = isCjk ? new Set([...stops, ...cjkStops]) : stops;
    for (const line of text.split(newLine)) {
      let start = 0;
      const arr = [];
      const emit = (from, end) => {
        arr.push(line.slice(start, from), line.slice(from, end));
        start = end;
      };
      let i = 0;
      while (i < line.length) {
        if (!activeStops.has(line[i])) {
          i++;
          continue
        }
        const runStart = i;
        while (i < line.length && activeStops.has(line[i])) i++;
        if (i < line.length && whitespace.test(line[i])) {
          emit(runStart, i + 1);
          i++;
          continue
        }
        if (!isCjk) continue
        // A CJK stop ends a sentence without whitespace. Following closing quotes
        // only end it when followed by whitespace, another opener, or end of text.
        let j = runStart;
        while (j < i) {
          if (!cjkStops.has(line[j])) {
            j++;
            continue
          }
          const from = j;
          while (j < i && cjkStops.has(line[j])) j++;
          let end = j;
          while (end < line.length && closers.has(line[end])) end++;
          if (end === j || end === line.length || whitespace.test(line[end]) || openers$1.has(line[end])) {
            emit(from, end);
            if (end > i) i = end;
          }
        }
      }
      arr.push(line.slice(start));
      // Preserve the existing merge behavior, including punctuation-only pieces.
      for (let k = 0; k < arr.length; k++) {
        const next = arr[k + 1];
        if (next && (isCjk ? splitsOnlyCjk : splitsOnly).test(next)) {
          arr[k] += next;
          arr[k + 1] = '';
        }
        if (arr[k]) all.push(arr[k]);
      }
    }
    return all
  };

  // a letter, number, or symbol/emoji in any script - otherwise it's only punctuation
  const hasLetter$2 = /[\p{L}\p{N}\p{So}]/u;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    const chunks = [];
    let lead = ''; // whitespace+punctuation, before the first chunk
    for (let i = 0; i < splits.length; i++) {
      const s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (!hasSomething$1.test(s) || !hasLetter$2.test(s)) {
        //add it to the last one
        if (chunks[chunks.length - 1]) {
          chunks[chunks.length - 1] += s;
          continue
        } else if (splits[i + 1]) {
          //add it to the next one
          lead += s;
          continue
        }
      }
      //else, only whitespace, no terms, no sentence
      chunks.push(lead + s);
      lead = '';
    }
    return chunks
  };

  const hasLetter$1 = /\p{L}/u;

  const hasNewline = function (c) {
    return Boolean(/\n$/.test(c))
  };

  //loop through these chunks, and join the non-sentence chunks back together..
  // (only check the end of the joined text - re-reading it for every chunk is quadratic)
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    const sentences = [];
    let sentence = '';
    let tail = '';
    let foundLetter = false;
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      sentence += c;
      tail = (tail + c).slice(-64);
      foundLetter ||= hasLetter$1.test(c);
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && !isSentence(tail, abbrevs, foundLetter) && !hasNewline(c)) {
        continue
      }
      //this chunk is a proper sentence..
      if (sentence.length > 0) {
        sentences.push(sentence);
      }
      sentence = '';
      tail = '';
      foundLetter = false;
    }
    return sentences
  };

  // merge embedded quotes into 1 sentence
  // like - 'he said "no!" and left.'
  const MAX_QUOTE = 280; // ¯\_(ツ)_/¯
  const MAX_AHEAD = 5;

  // each opening quote, and the marks that may close it
  // (some marks open a quote in one language, and close it in another)
  // a third mark means 'not an opener, when that one is around'
  // don't support single-quotes for multi-sentences
  const pairs$2 = [
    ['\u0022', '\u0022'], // straight
    ['\uFF02', '\uFF02'], // wide
    ['\u201C', '\u201D', '\u201E'], // english (but it closes a german one)
    ['\u201F', '\u201D'], // reversed
    ['\u201E', '\u201D\u201C'], // polish, german
    ['\u2E42', '\u201D'], // low-reversed
    ['\u201A', '\u2019\u2018'], // low-single, german
    ['\u00AB', '\u00BB'], // french
    ['\u00BB', '\u00AB'], // german
    ['\u2039', '\u203A'], // single
    ['\u203A', '\u2039'], // single, reversed
    ['\u2035', '\u2032'], // prime
    ['\u2036', '\u2033'], // double-prime
    ['\u2037', '\u2034'], // triple-prime
    ['\u301D', '\u301E'], // prime
    ['\u301F', '\u301E'], // low-prime
    ['\u300C', '\u300D'], // corner
    ['\u300E', '\u300F'], // white-corner
  ];

  const count$1 = function (str, chars) {
    let n = 0;
    for (const c of str) {
      if (chars.includes(c)) {
        n += 1;
      }
    }
    return n
  };

  // is there a quotation here, that hasn't closed yet?
  const isOpen = function (str) {
    return pairs$2.some(([open, close, unless]) => {
      const n = count$1(str, open);
      if (n === 0 || (unless && str.includes(unless))) {
        return false
      }
      // the same mark opens and closes
      if (open === close) {
        return n % 2 === 1
      }
      return n > count$1(str, close)
    })
  };

  // allow micro-sentences when inside a quotation, like:
  // the doc said "no sir. i will not beg" and walked away.
  const quoteMerge = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      let str = splits[i];
      if (isOpen(str)) {
        // look ahead for the sentence that closes it
        let toAdd = '';
        for (let n = i + 1; n < splits.length && n - i <= MAX_AHEAD; n += 1) {
          toAdd += splits[n];
          //make sure it's not too-long
          if (toAdd.length >= MAX_QUOTE) {
            break
          }
          if (!isOpen(str + toAdd)) {
            // merge them all
            str += toAdd;
            i = n;
            break
          }
        }
      }
      arr.push(str);
    }
    return arr
  };

  const MAX_LEN = 250;// ¯\_(ツ)_/¯

  // support unicode variants?
  // https://stackoverflow.com/questions/13535172/list-of-all-unicodes-open-close-brackets
  const hasOpen$2 = /[(\uFF08]/g;
  const hasClosed$2 = /[)\uFF09]/g;
  const mergeParens = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      const m = split.match(hasOpen$2);
      if (m !== null && m.length === 1) {
        // look at next sentence, for closing parenthesis
        if (splits[i + 1] && splits[i + 1].length < MAX_LEN) {
          const m2 = splits[i + 1].match(hasClosed$2);
          if (m2 !== null && m.length === 1 && !hasOpen$2.test(splits[i + 1])) {
            // merge in 2nd sentence
            splits[i] += splits[i + 1];
            arr.push(splits[i]);
            splits[i + 1] = '';
            i += 1;
            continue
          }
        }
      }
      arr.push(splits[i]);
    }
    return arr
  };

  //(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
  // Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
  //regs-
  const hasSomething = /\S/;
  const startWhitespace = /^\s+/;

  const splitSentences = function (text, world) {
    text ||= '';
    text = String(text);
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || !hasSomething.test(text)) {
      return []
    }
    // First do a greedy-split..
    const splits = basicSplit(text);
    // Filter-out the crap ones
    let sentences = notEmpty(splits);
    //detection of non-sentence chunks:
    sentences = smartMerge(sentences, world);
    // allow 'he said "no sir." and left.'
    sentences = quoteMerge(sentences);
    // allow 'i thought (no way!) and left.'
    sentences = mergeParens(sentences);
    //if we never got a sentence, return the given text
    if (sentences.length === 0) {
      return [text]
    }
    //move whitespace to the ends of sentences, when possible
    //['hello',' world'] -> ['hello ','world']
    for (let i = 1; i < sentences.length; i += 1) {
      const ws = sentences[i].match(startWhitespace);
      if (ws !== null) {
        sentences[i - 1] += ws[0];
        sentences[i] = sentences[i].replace(startWhitespace, '');
      }
    }
    return sentences
  };

  // combine '2 - 5' like '2-5' is
  // 2-4: 2, 4
  const combineRanges = function (arr) {
    const startRange = /^[0-9]{1,4}(:[0-9][0-9])?([a-z]{1,2})? ?[-–—] ?$/;
    const endRange = /^[0-9]{1,4}([a-z]{1,2})? ?$/;
    for (let i = 0; i < arr.length - 1; i += 1) {
      if (arr[i + 1] && startRange.test(arr[i]) && endRange.test(arr[i + 1])) {
        arr[i] = arr[i] + arr[i + 1];
        arr[i + 1] = null;
      }
    }
    return arr
  };

  const isSlash = /\p{L} ?\/ ?\p{L}+$/u;

  // 'he / she' should be one word
  const combineSlashes = function (arr) {
    for (let i = 1; i < arr.length - 1; i++) {
      if (isSlash.test(arr[i])) {
        arr[i - 1] += arr[i] + arr[i + 1];
        arr[i] = null;
        arr[i + 1] = null;
      }
    }
    return arr
  };

  const wordlike = /\S/;
  const isBoundary = /^[!?.]+$/;
  const naiiveSplit = /(\S+)/;

  const notWord = new Set(toList(`
.
?
!
:
;
-
–
—
--
...
(
)
[
]
"
'
\`
«
»
*
•
`));

  //turn a string into an array of strings (naiive for now, lumped later)
  const splitWords = function (str, model) {
    let result = [];
    let arr = [];
    //start with a naiive split
    str ||= '';
    if (typeof str === 'number') {
      str = String(str);
    }
    if (Array.isArray(str)) {
      return str
    }
    const words = str.split(naiiveSplit);
    for (let i = 0; i < words.length; i++) {
      //split 'one-two'
      if (hasHyphen$1(words[i], model)) {
        arr = arr.concat(splitHyphens$1(words[i]));
        continue
      }
      arr.push(words[i]);
    }
    //greedy merge whitespace+arr to the right
    let carry = '';
    for (let i = 0; i < arr.length; i++) {
      const word = arr[i];
      //if it's more than a whitespace
      if (wordlike.test(word) && !notWord.has(word) && !isBoundary.test(word)) {
        //put whitespace on end of previous term, if possible
        if (result.length > 0) {
          result[result.length - 1] += carry;
          result.push(word);
        } else {
          //otherwise, but whitespace before
          result.push(carry + word);
        }
        carry = '';
      } else {
        carry += word;
      }
    }
    //handle last one
    if (carry) {
      if (result.length === 0) {
        result[0] = '';
      }
      result[result.length - 1] += carry; //put it on the end
    }
    // combine 'one / two'
    result = combineSlashes(result);
    result = combineRanges(result);
    // remove empty results
    result = result.filter(s => s);
    return result
  };

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation

  //we have slightly different rules for start/end - like #hashtags.
  const isLetter = /\p{Letter}/u;
  const isMark = /\p{Mark}/u;
  const isNumber = /[\p{Number}\p{Currency_Symbol}]/u;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const chillin = /[sn]['’]$/;
  // a leading apostrophe that stands for letters - 'tis, 'em, 'cause
  const elision = /^['’](tis|twas|em|cause|til|bout|round)\b/i;
  const isFullNumber = /^[(+\-]?\d+(th|st|nd|rd)?[)+\-]?$/;
  const openers = { ')': '(', ']': '[', '}': '{' };

  // does this closing bracket close one inside the word, like 'foo(bar)'
  const closesInside = function (chars, start, end) {
    const close = chars[end - 1];
    let depth = 0;
    for (let i = start; i < end - 1; i += 1) {
      if (chars[i] === openers[close]) {
        depth += 1;
      } else if (chars[i] === close) {
        depth -= 1;
      }
    }
    return depth > 0
  };

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    const { prePunctuation, postPunctuation, emoticons } = model.one;
    const original = str;
    const trimmed = str.trim();
    let pre = '';
    let post = '';
    const chars = Array.from(str);
    let start = 0;
    let end = chars.length;

    // punctuation-only words, like '<3'
    if (Object.hasOwn(emoticons, trimmed)) {
      return { str: trimmed, pre, post: ' ' } //not great
    }

    // Locate the first retained code point without shifting the array.
    while (start < end) {
      const c = chars[start];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        break//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-' || c === '(') && isFullNumber.test(trimmed)) {
        break//done
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // keep an elided apostrophe - 'tis
      if ((c === "'" || c === '’') && elision.test(chars.slice(start).join(''))) {
        break//keep it
      }
      // punctuation
      start++;
    }

    // Locate the last retained code point.
    while (end > start) {
      const c = chars[end - 1];
      // keep any declared chars
      if (postPunctuation[c] === true) {
        break//keep it
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // Keep marks attached to letters, but not variation selectors after symbols.
      if (isMark.test(c)) {
        let base = end - 2;
        while (base >= start && isMark.test(chars[base])) {
          base--;
        }
        if (base >= start && isLetter.test(chars[base])) {
          break
        }
        end = base + 1;
        continue
      }
      // F.B.I.
      if (c === '.' && hasAcronym.test(original)) {
        break//keep it
      }
      //  keep s-apostrophe - "flanders'" or "chillin'"
      if (c === "'" && chillin.test(original)) {
        break//keep it
      }
      // keep '+' or ')' only for a number like (800) or 500+
      if ((c === '+' || c === ')') && isFullNumber.test(trimmed)) {
        break//done
      }
      if (Object.hasOwn(openers, c) && closesInside(chars, start, end)) {
        break//keep it
      }
      // punctuation
      end--;
    }
    pre = chars.slice(0, start).join('');
    post = chars.slice(end).join('');
    str = chars.slice(start, end).join('');
    //we went too far..
    if (str === '') {
      // do a very mild parse, and hope for the best.
      let last = original.length;
      while (last > 0 && original[last - 1] === ' ') last--;
      post = original.slice(last);
      str = original.slice(0, last);
      pre = '';
    }
    return { str, pre, post }
  };

  const parseTerm$1 = (txt, model) => {
    // cleanup any punctuation as whitespace
    const { str, pre, post } = normalizePunctuation(txt, model);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };

  // 'Björk' to 'Bjork'.
  const killUnicode = function (str, world) {
    const unicode = world.model.one.unicode || {};
    str ||= '';
    const chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };

  // Inspect the trailing run once, including when punctuation occurs internally.
  const trimPunctuation = (str, punctuation) => {
    let end = str.length;
    while (end > 0 && punctuation.test(str[end - 1])) end--;
    return str.slice(0, end)
  };

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str ||= '';
    str = str.toLowerCase();
    str = str.trim();
    const original = str;
    //punctuation
    str = trimPunctuation(str, /[,;.!?]/);
    //coerce Unicode ellipses
    str = str.replaceAll('…', '...');
    //en-dash
    str = str.replaceAll('–', '-');
    //strip leading & trailing grammatical punctuation
    if (!/^[:;]/.test(str)) {
      str = trimPunctuation(str, /[",.!:;?)]/);
      str = str.replace(/^['’"(]+/g, '');
    }
    // remove zero-width characters
    str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
    //do this again..
    str = str.trim();
    //oh shucks,
    if (str === '') {
      str = original;
    }
    //no-commas in numbers
    str = str.replace(/([0-9]),([0-9])/g, '$1$2');
    return str
  };

  // do acronyms need to be ASCII?  ... kind of?
  const acronyms = [
    /^([A-Z]\.)+[A-Z]?,?$/, //like N.D.A
    /^([a-z]\.)+[a-z]\.?$/, //like c.e.o
    /^[A-Z]\.,?$/, //like 'F.'
    /^[A-Z]{2,}('s|,)?$/, //like NDA
  ];

  const isAcronym$2 = str => acronyms.some(re => re.test(str));

  const doAcronym = function (str) {
    if (isAcronym$2(str)) {
      str = str.replace(/\./g, '');
    }
    return str
  };

  const normalize = function (term, world) {
    const killUnicode = world.methods.one.killUnicode;
    // console.log(world.methods.one)
    let str = term.text || '';
    str = clean(str);
    //(very) rough ASCII transliteration -  bjŏrk -> bjork
    str = killUnicode(str, world);
    str = doAcronym(str);
    term.normal = str;
  };

  // turn a string input into a 'document' json format
  const parse$2 = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input ||= '';
    // split into sentences
    const sentences = splitSentences(input, world);
    // split into word objects
    input = sentences.map((txt) => {
      let terms = splitTerms(txt, model);
      // split into [pre-text-post]
      terms = terms.map(t => splitWhitespace(t, model));
      // add normalized term format, always
      terms.forEach((t) => {
        normalize(t, world);
      });
      return terms
    });
    return input
  };

  const isAcronym$1 = /[ .][A-Z]\.? *$/i; //asci - 'n.s.a.'
  const hasEllipse = /(?:\u2026|\.{2}) *$/; // '...'
  const hasLetter = /\p{L}/u;
  const hasPeriod = /\. *$/;
  const leadInit = /^\p{Lu}\. $/u; // "W. Kensington"
  // an initial in any alphabet - 'А. С. Пушкин'
  const isInitial = /[ .]\p{Lu}\. *$/u;

  /** does this look like a sentence? - str can be the end of it, if foundLetter is given */
  const isSentence = function (str, abbrevs, foundLetter = hasLetter.test(str)) {
    // must have a letter
    if (foundLetter === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$1.test(str) || isInitial.test(str)) {
      return false
    }
    // check for leading initial - "W. Kensington"
    if (str.length === 3 && leadInit.test(str)) {
      return false
    }
    //check for '...'
    if (hasEllipse.test(str)) {
      return false
    }
    const txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    const words = txt.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.' (and not mr?)
    if (Object.hasOwn(abbrevs, lastWord) && hasPeriod.test(str)) {
      return false
    }
    // //check for jeopardy!
    // if (blacklist.hasOwnProperty(lastWord)) {
    //   return false
    // }
    return true
  };

  var methods$3 = {
    one: {
      killUnicode,
      tokenize: {
        splitSentences,
        isSentence,
        splitTerms: splitWords,
        splitWhitespace: parseTerm$1,
        fromString: parse$2,
      },
    },
  };

  const aliases$1 = {
    '&': 'and',
    '@': 'at',
    '%': 'percent',
    'plz': 'please',
    'bein': 'being',
  };

  // prob=probably, pron=pronunciation, gal=gallon, fig=figure, lat/lng=latitude/longitude,
  // vol=volume, fm (not am), def=definition, plz=please, ea=each, sec=second, pref=preface,
  // pl=plural, pp=pages, qt=quarter, fr=french, nee=given name at birth, ss=ship or sections,
  // ver=version, fem/masc, eng=engineering/english, adj/vb/rb/inf=grammar, situ/vivo/vitro=in situ..
  // wr=world record
  var misc$3 = toList(`
approx
apt
bc
cyn
eg
esp
est
etc
ex
exp
prob
pron
gal
min
pseud
fig
jd
lat
lng
vol
fm
def
misc
plz
ea
ps
sec
pt
pref
pl
pp
qt
fr
sq
nee
ss
tel
temp
vet
ver
fem
masc
eng
adj
vb
rb
inf
situ
vivo
vitro
wr
`);

  // (not miss, misses)
  var honorifics$1 = toList(`
adj
adm
adv
asst
atty
bldg
brig
capt
cmdr
comdr
cpl
det
dr
esq
gen
gov
hon
jr
llb
lt
maj
messrs
mlle
mme
mr
mrs
ms
mstr
phd
prof
pvt
rep
reps
res
rev
sen
sens
sfc
sgt
sir
sr
supt
surg
`);

  var months = toList(`
jan
feb
mar
apr
jun
jul
aug
sep
sept
oct
nov
dec
`);

  var nouns$3 = toList(`
ad
al
arc
ba
bl
ca
cca
col
corp
ft
fy
ie
lit
ma
md
pd
tce
`);

  var organizations = toList(`
dept
univ
assn
bros
inc
ltd
co
`);

  // streets, then states/provinces (not ct)
  var places = toList(`
rd
st
dist
mt
ave
blvd
cl
cres
hwy
ariz
cal
calif
colo
conn
fla
fl
ga
ida
ia
kan
kans
minn
neb
nebr
okla
penna
penn
pa
dak
tenn
tex
ut
vt
va
wis
wisc
wy
wyo
usafa
alta
ont
que
sask
`);

  // units that are abbreviations too (not ft, gb, pa - ambiguous)
  // dm=decimeter, hr/hrs=hour, dg/cg/mg/µg=grams, lb=pound, oz=ounce, hz=hertz,
  // mps=meters per second, kmph=kilometers per hour, kb/mb/tb/yb=bytes, lx=lux, lm=lumen
  var units = toList(`
dl
ml
gal
qt
pt
tbl
tsp
tbsp
km
dm
cm
mm
mi
td
hr
hrs
kg
hg
dg
cg
mg
µg
lb
oz
sq ft
hz
mps
mph
kmph
kb
mb
tb
lx
lm
fl oz
yb
`);

  // add our abbreviation list to our lexicon
  const list$1 = [
    [misc$3],
    [units, 'Unit'],
    [nouns$3, 'Noun'],
    [honorifics$1, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  const abbreviations$1 = {};
  // add them to a future lexicon
  const lexicon$2 = {};

  list$1.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations$1[w] = true;
      // future-lexicon
      lexicon$2[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$2[w] = [lexicon$2[w], a[1]];
      }
    });
  });

  // dashed prefixes that are not independent words
  //  'mid-century', 'pre-history', 'out-lived', 'ex-wife'
  // (not counter, mid, non, over, post, semi, super, ultra, under, whole)
  var prefixes = toHash(toList(`
anti
bi
co
contra
de
extra
infra
inter
intra
macro
micro
mis
mono
multi
peri
pre
pro
proto
pseudo
re
sub
supra
trans
tri
un
out
ex
`));

  // dashed suffixes that are not independent words
  //  'flower-like', 'president-elect'  (not fold)
  var suffixes$1 = toHash(toList(`
like
ish
less
able
elect
type
designate
`));

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E
  const compact$1 = {
    '!': '¡',
    '?': '¿Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÀÁÂÃÄÅàáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ÈÉÊËèéêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗễ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'ÌÍÎÏ',
    i: 'ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇіїi̇',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ÑñŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÒÓÔÕÖØðòóôõöøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'ÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  const unicode$1 = {};
  Object.keys(compact$1).forEach(function (k) {
    compact$1[k].split('').forEach(function (s) {
      unicode$1[s] = k;
    });
  });
  // fullwidth ascii - 'Ｈｅｌｌｏ ２０２４' to 'Hello 2024'
  for (let i = 0x21; i <= 0x7E; i += 1) {
    unicode$1[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
  }

  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7Bpunctuation%7D

  // zero-width chars
  const zeroWidth = '\u200B\u200C\u200D\uFEFF';

  // punctuation to keep at start of word - #hastag, @atmention, underscore
  // (not +4, -4, .4)
  const prePunctuation = toHash(('#@_°' + zeroWidth).split(''));

  // punctuation to keep at end of word - 88%, underscore, degrees/italian ordinal
  const postPunctuation = toHash(('%_°' + zeroWidth).split(''));

  const emoticons = toHash('<3 </3 <\\3 :^P :^p :^O :^3'.split(' '));

  var model$3 = {
    one: {
      aliases: aliases$1,
      abbreviations: abbreviations$1,
      prefixes,
      suffixes: suffixes$1,
      prePunctuation,
      postPunctuation,
      lexicon: lexicon$2, //give this one forward
      unicode: unicode$1,
      emoticons
    },
  };

  const hasSlash$1 = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    const str = term.normal || term.text || term.machine;
    const aliases = world.model.one.aliases;
    // lookup known aliases like '&'
    if (Object.hasOwn(aliases, str)) {
      term.alias ||= [];
      term.alias.push(aliases[str]);
    }
    // support slashes as aliases
    if (hasSlash$1.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      const arr = str.split(hasSlash$1);
      // don't split urls and things
      if (arr.length <= 3) {
        arr.forEach(word => {
          word = word.trim();
          if (word !== '') {
            term.alias ||= [];
            term.alias.push(word);
          }
        });
      }
    }
    // aliases for apostrophe-s
    // if (hasApostrophe.test(str)) {
    //   let main = str.replace(hasApostrophe, '').trim()
    //   term.alias = term.alias || []
    //   term.alias.push(main)
    // }
    return term
  };

  const hasDash$1 = /^\p{Letter}+-\p{Letter}+$/u;
  // 'machine' is a normalized form that looses human-readability
  const doMachine = function (term) {
    let str = term.implicit || term.normal || term.text;
    // remove apostrophes
    str = str.replace(/['’]s$/, '');
    str = str.replace(/s['’]$/, 's');
    //lookin'->looking (make it easier for conjugation)
    str = str.replace(/([aeiou][ktrp])in'$/, '$1ing');
    //turn re-enactment to reenactment
    if (hasDash$1.test(str)) {
      str = str.replace(/-/g, '');
    }
    //#tags, @mentions
    str = str.replace(/^[#@]/, '');
    if (str !== term.normal) {
      term.machine = str;
    }
  };

  // sort words by frequency
  const freq = function (view) {
    const docs = view.docs;
    const counts = Object.create(null);
    eachTerm(docs, term => {
      const word = term.machine || term.normal;
      counts[word] ??= 0;
      counts[word] += 1;
    });
    // add counts on each term
    eachTerm(docs, term => {
      term.freq = counts[term.machine || term.normal];
    });
  };

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    //start from the actual-top
    eachTerm(view.document, term => {
      term.offset = {
        index: index,
        start: elapsed + term.pre.length,
        length: term.text.length,
      };
      elapsed += term.pre.length + term.text.length + term.post.length;
      index += 1;
    });
  };

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    eachTerm(view.document, (term, terms, t, n) => {
      term.index = [n, t];
    });
  };

  const wordCount = function (view) {
    let n = 0;
    eachTerm(view.docs, term => {
      //skip implicit words
      if (term.normal !== '') {
        n += 1;
        term.wordCount = n;
      }
    });
  };

  // cheat-method for a quick loop
  const termLoop = (view, fn) => eachTerm(view.docs, term => fn(term, view.world));

  const methods$2 = {
    alias: (view) => termLoop(view, addAliases),
    machine: (view) => termLoop(view, doMachine),
    normal: (view) => termLoop(view, normalize),
    freq,
    offset,
    index,
    wordCount,
  };

  var tokenize = {
    compute: methods$2,
    methods: methods$3,
    model: model$3,
    hooks: ['alias', 'machine', 'index', 'id'],
  };

  // const plugin = function (world) {
  //   let { methods, model, parsers } = world
  //   Object.assign({}, methods, _methods)
  //   Object.assign(model, _model)
  //   methods.one.tokenize.fromString = tokenize
  //   parsers.push('normal')
  //   parsers.push('alias')
  //   parsers.push('machine')
  //   // extend View class
  //   // addMethods(View)
  // }
  // export default plugin

  // lookup last word in the type-ahead prefixes
  const typeahead$1 = function (view) {
    const prefixes = view.model.one.typeahead;
    const docs = view.docs;
    if (docs.length === 0 || Object.keys(prefixes).length === 0) {
      return
    }
    const lastTerm = docs.at(-1)?.at(-1);
    // if we've already put whitespace, end.
    if (!lastTerm || lastTerm.post) {
      return
    }
    // if we found something
    if (Object.hasOwn(prefixes, lastTerm.normal)) {
      const found = prefixes[lastTerm.normal];
      // add full-word as an implicit result
      lastTerm.implicit = found;
      lastTerm.machine = found;
      lastTerm.typeahead = true;
      // tag it, as our assumed term
      if (view.compute.preTagger) {
        view.last().unTag('*').compute(['lexicon', 'preTagger']);
      }
    }
  };

  var compute = { typeahead: typeahead$1 };

  // assume any discovered prefixes
  const autoFill = function () {
    const docs = this.docs;
    if (docs.length === 0) {
      return this
    }
    const term = docs.at(-1)?.at(-1);
    if (term?.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api$c = function (View) {
    View.prototype.autoFill = autoFill;
  };

  // generate all the possible prefixes up-front
  const getPrefixes = function (arr, opts, world) {
    let index = {};
    const collisions = [];
    const existing = world.prefixes || {};
    arr.forEach((str) => {
      str = str.toLowerCase().trim();
      let max = str.length;
      if (opts.max && max > opts.max) {
        max = opts.max;
      }
      for (let size = opts.min; size < max; size += 1) {
        const prefix = str.substring(0, size);
        // ensure prefix is not a word
        if (opts.safe && Object.hasOwn(world.model.one.lexicon, prefix)) {
          continue
        }
        // does it already exist?
        if (Object.hasOwn(existing, prefix)) {
          collisions.push(prefix);
          continue
        }
        if (Object.hasOwn(index, prefix)) {
          collisions.push(prefix);
          continue
        }
        index[prefix] = str;
      }
    });
    // merge with existing prefixes
    index = { ...existing, ...index };
    // remove ambiguous-prefixes
    collisions.forEach((str) => {
      delete index[str];
    });
    return index
  };

  const defaults$2 = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    const model = this.model();
    opts = { ...defaults$2, ...opts };
    if (isObject$1(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    const prefixes = getPrefixes(words, opts, this.world());
    // manually combine these with any existing prefixes
    Object.keys(prefixes).forEach(str => {
      // explode any overlaps
      if (Object.hasOwn(model.one.typeahead, str)) {
        delete model.one.typeahead[str];
        return
      }
      model.one.typeahead[str] = prefixes[str];
    });
    return this
  };

  var lib = {
    typeahead: prepare
  };

  const model$2 = {
    one: {
      typeahead: {} //set a blank key-val
    }
  };
  var typeahead = {
    model: model$2,
    api: api$c,
    lib,
    compute,
    hooks: ['typeahead']
  };

  // order here matters
  nlp.extend(change); //0kb
  nlp.extend(output); //0kb
  nlp.extend(match); //10kb
  nlp.extend(pointers); //2kb
  nlp.extend(tag); //2kb
  nlp.plugin(plugin$1); //~6kb
  nlp.extend(tokenize); //7kb
  nlp.extend(freeze); //
  nlp.plugin(cache$3); //~1kb
  nlp.extend(lookup$1); //7kb
  nlp.extend(typeahead); //1kb
  nlp.extend(lexicon$3); //1kb
  nlp.extend(sweep); //1kb

  const getWords = function (net) {
    return Object.keys(net.hooks).filter(w => !w.startsWith('#') && !w.startsWith('%'))
  };

  const maybeMatch = function (doc, net) {
    // must have *atleast* one of these words
    const words = getWords(net);
    if (words.length === 0) {
      return doc
    }
    if (!doc._cache) {
      doc.cache();
    }
    const cache = doc._cache;
    // return sentences that have one of our needed words
    return doc.filter((_m, i) => {
      return words.some(str => cache[i].has(str))
    })
  };

  // tokenize first, then only tag sentences required
  const lazy = function (input, reg) {
    let net = reg;
    if (typeof reg === 'string') {
      net = this.buildNet([{ match: reg }]);
    }
    const doc = this.tokenize(input);
    const m = maybeMatch(doc, net);
    if (m.found) {
      m.compute(['index', 'tagger']);
      return m.match(reg)
    }
    return doc.none()
  };

  var lazy$1 = {
    lib: {
      lazy,
    },
  };

  // Preferred alias identifiers holding canonical tag names.
  // NN is the umbrella noun tag; Sing is specifically singular.
  const NN = 'Noun';
  const Sing = 'Singular';
  const Plur = 'Plural';
  const Prop = 'ProperNoun';
  const Pron = 'Pronoun';

  const Adj = 'Adjective';
  const Comp = 'Comparative';
  const Adv = 'Adverb';
  const Det = 'Determiner';

  const Vb = 'Verb';
  const Inf = 'Infinitive';
  const Past = 'PastTense';
  const Ger = 'Gerund';
  const Pres = 'PresentTense';
  const Fut = 'FutureTense';

  const Cop = 'Copula';
  const Phrasal = 'PhrasalVerb';
  const Conj = 'Conjunction';
  const Prep = 'Preposition';
  const Expr = 'Expression';
  const QW = 'QuestionWord';

  const Pers = 'Person';
  const Place = 'Place';
  const Org = 'Organization';
  const First = 'FirstName';
  const Last = 'LastName';
  const MaleName = 'MaleName';
  const FemaleName = 'FemaleName';
  const Uncountable = 'Uncountable';
  const SportsTeam = 'SportsTeam';
  const Country = 'Country';
  const City = 'City';
  const Region = 'Region';

  const Val = 'Value';
  const Card = 'Cardinal';
  const Ord = 'Ordinal';
  const TxtNum = 'TextValue';
  const Numeric = 'NumericValue';
  const RomanNumeral = 'RomanNumeral';
  const Frac = 'Fraction';

  const Date = 'Date';
  const WeekDay = 'WeekDay';
  const Year = 'Year';
  const FinancialQuarter = 'FinancialQuarter';
  const Season = 'Season';
  const Time = 'Time';
  const Timezone = 'Timezone';

  const Connector = 'Connector';
  const Abbr = 'Abbreviation';
  const Acronym = 'Acronym';
  const HashTag = 'HashTag';
  const AtMention = 'AtMention';

  const Emoji = 'Emoji';
  const Emoticon = 'Emoticon';
  const SlashedTerm = 'SlashedTerm';
  const Email = 'Email';
  const PhoneNumber = 'PhoneNumber';
  const Url = 'Url';

  const entity = [Pers, Place, Org];

  var nouns$2 = {
    Noun: {
      aliases: [null, 'NN'],
      not: [Vb, Adj, Adv, Val, Det],
    },
    Singular: {
      aliases: [null, 'Sing', 'SG', 'NN1'],
      is: NN,
      not: [Plur, Uncountable],
    },
    // 'Canada'
    ProperNoun: {
      aliases: ['Prop', 'NNP', 'PROPN', 'NP0'],
      is: NN,
    },
    Person: {
      aliases: [null, 'Pers'],
      is: Sing,
      also: [Prop],
      not: [Place, Org, Date],
    },
    FirstName: {
      aliases: [null, 'First'],
      is: Pers,
    },
    MaleName: {
      is: First,
      not: [FemaleName, Last],
    },
    FemaleName: {
      is: First,
      not: [MaleName, Last],
    },
    LastName: {
      aliases: [null, 'Last'],
      is: Pers,
      not: [First],
    },
    // 'dr.'
    Honorific: {
      aliases: ['Hon'],
      is: Pers,
      not: [First, Last, Val],
    },
    Place: {
      is: Sing,
      not: [Pers, Org],
    },
    Country: {
      is: Place,
      also: [Prop],
      not: [City],
    },
    City: {
      is: Place,
      also: [Prop],
      not: [Country],
    },
    // 'california'
    Region: {
      is: Place,
      also: [Prop],
    },
    Address: {
      aliases: ['Addr'],
      // is: 'Place',
    },
    Organization: {
      aliases: ['Org'],
      is: Prop,
      not: [Pers, Place],
    },
    SportsTeam: {
      aliases: [null, 'Team'],
      is: Org,
    },
    School: {
      is: Org,
    },
    Company: {
      is: Org,
    },
    Plural: {
      aliases: [null, 'Plur', 'NNS', 'PL', 'NN2'],
      is: NN,
      not: [Sing, Uncountable],
    },
    // 'gravity'
    Uncountable: {
      is: NN,
    },
    // 'it'
    Pronoun: {
      aliases: [null, 'Pron', 'PRP', 'PRON'],
      is: NN,
      not: entity,
    },
    // 'swimmer'
    Actor: {
      is: NN,
      not: [Place, Org],
    },
    // walking
    Activity: {
      is: NN,
      not: [Pers, Place],
    },
    // kilometres
    Unit: {
      is: NN,
      not: entity,
    },
    // canadian
    Demonym: {
      aliases: [null, 'Dem'],
      is: NN,
      also: [Prop],
      not: entity,
    },
    // [spencer's] hat
    Possessive: {
      aliases: ['Poss'],
      is: NN,
    },
    // 'yourself'
    Reflexive: {
      aliases: [null, 'Refl'],
      is: Pron,
    },
  };

  var verbs$2 = {
    Verb: {
      aliases: ['Vb', 'V', 'VB'],
      not: [NN, Adj, Adv, Val, Expr],
    },
    // 'he [walks]'
    PresentTense: {
      aliases: ['Pres', 'PRS'],
      is: Vb,
      not: [Past, Fut],
    },
    // 'will [walk]'
    Infinitive: {
      aliases: ['Inf', 'VVI'],
      is: Pres,
      not: [Ger],
    },
    // '[walk] now!'
    Imperative: {
      aliases: ['Imp'],
      is: Vb,
      not: [Past, Ger, Cop],
    },
    // walking
    Gerund: {
      aliases: ['Ger', 'VBG'],
      is: Pres,
      not: [Cop],
    },
    // walked
    PastTense: {
      aliases: ['Past', 'VBD', 'PST'],
      is: Vb,
      not: [Pres, Ger, Fut],
    },
    // will walk
    FutureTense: {
      aliases: ['Fut'],
      is: Vb,
      not: [Pres, Past],
    },
    // is/was
    Copula: {
      aliases: [null, 'Cop'],
      is: Vb,
    },
    // '[could] walk'
    Modal: {
      aliases: [null, 'Mod', 'MD'],
      is: Vb,
      not: [Inf],
    },
    // 'awaken'
    Participle: {
      aliases: [null, 'VBN'],
      is: Past,
    },
    // '[will have had] walked'
    Auxiliary: {
      aliases: ['Aux'],
      is: Vb,
      not: [Past, Pres, Ger, Conj],
    },
    // 'walk out'
    PhrasalVerb: {
      aliases: ['Phrasal', 'PhrV'],
      is: Vb,
    },
    // 'walk [out]'
    Particle: {
      aliases: [null, 'RP'],
      is: Phrasal,
      not: [Past, Pres, Cop, Ger],
    },
    // 'walked by'
    Passive: {
      aliases: [null, 'Pass'],
      is: Vb,
    },
  };

  // Written format is independent of quantity types such as Fraction or Money.
  var values$1 = {
    Value: {
      aliases: ['Val', 'Num'],
      not: [Vb, Adj, Adv],
    },
    Ordinal: {
      aliases: [null, 'Ord'],
      is: Val,
      not: [Card],
    },
    Cardinal: {
      aliases: [null, 'Card', 'CD'],
      is: Val,
      not: [Ord],
    },
    Fraction: {
      aliases: [null, 'Frac'],
      is: Val,
      not: [NN],
    },
    Multiple: {
      aliases: [null, 'Mult'],
      is: TxtNum,
    },
    RomanNumeral: {
      aliases: [null, 'RomNum'],
      is: Card,
    },
    TextValue: {
      aliases: [null, 'TxtNum'],
      is: Val,
      not: [Numeric, RomanNumeral],
    },
    NumericValue: {
      aliases: ['Numeric'],
      is: Val,
      not: [RomanNumeral],
    },
    Money: {
      is: Card,
    },
    Percent: {
      aliases: [null, 'Perc', 'Pct'],
      is: Val,
    },
  };

  // Calendar/clock components are distinct. Holiday and Duration describe spans
  // that can overlap components or one another (for example, 'Christmas Day').
  // Each exclusion pair is declared once; the tag compiler supplies reciprocity.
  var dates$2 = {
    Date: {
      not: [Vb, Adv, Adj],
    },
    Month: {
      is: Date,
      also: [NN],
      not: [WeekDay, Year, FinancialQuarter, Season, Time, Timezone],
    },
    WeekDay: {
      is: Date,
      also: [NN],
      not: [Year, FinancialQuarter, Season, Time, Timezone],
    },
    Year: {
      is: Date,
      not: [RomanNumeral, FinancialQuarter, Season, Time, Timezone],
    },
    FinancialQuarter: {
      is: Date,
      aliases: [null, 'Quarter'],
      not: [Frac, Season, Time, Timezone],
    },
    // 'easter'
    Holiday: {
      is: Date,
      also: [NN],
    },
    // 'summer'
    Season: {
      is: Date,
      not: [Time, Timezone],
    },
    Timezone: {
      is: Date,
      aliases: [null, 'Tz'],
      also: [NN],
      not: [Prop],
    },
    Time: {
      is: Date,
      not: [AtMention, Timezone],
    },
    // 'months'
    Duration: {
      aliases: [null, 'Dur'],
      is: Date,
      also: [NN],
    },
  };

  const anything = [NN, Vb, Adj, Adv, Val, QW];

  var misc$2 = {
    Adjective: {
      aliases: ['Adj', 'JJ', 'ADJ', 'AJ0'],
      not: [NN, Vb, Adv, Val],
    },
    Comparable: {
      is: Adj,
    },
    Comparative: {
      aliases: [null, 'Comp', 'JJR', 'AJC'],
      is: Adj,
    },
    Superlative: {
      aliases: [null, 'Sup', 'JJS', 'AJS'],
      is: Adj,
      not: [Comp],
    },
    NumberRange: {
      aliases: [null, 'NumRange'],
    },
    Adverb: {
      aliases: ['Adv', 'RB', 'ADV'],
      not: [NN, Vb, Adj, Val],
    },

    Determiner: {
      aliases: ['Det', 'DT', 'DET'],
      not: [NN, Vb, Adj, Adv, QW, Conj], //allow 'a' to be a Determiner/Value
    },
    Connector: {
      not: [NN, Vb, Adj, Adv, QW, Det],
    },
    Conjunction: {
      aliases: ['Conj', 'CC'],
      is: Connector,
      not: anything.concat([Prep]),
    },
    Preposition: {
      aliases: ['Prep', 'IN', 'ADP'],
      is: Connector,
      not: [NN, Vb, Adj, Adv, QW, Det, Conj],
    },
    QuestionWord: {
      aliases: [null, 'QW'],
      not: [Det],
    },
    Currency: {
      is: NN,
    },
    Expression: {
      aliases: ['Expr'],
      not: [NN, Adj, Vb, Adv],
    },
    Abbreviation: {
      aliases: ['Abbr'],
    },
    Url: {
      aliases: [null, 'URL'],
      not: [HashTag, Vb, Adj, Val, SlashedTerm, Email, PhoneNumber, AtMention, Emoji, Emoticon],
    },
    PhoneNumber: {
      not: [HashTag, Vb, Adj, Val, AtMention, Emoji, Emoticon],
    },
    HashTag: {},
    AtMention: {
      is: NN,
      not: [HashTag, Emoji, Emoticon],
    },
    Emoji: {
      not: [HashTag, Vb, Adj, Val, Emoticon],
    },
    Emoticon: {
      not: [HashTag, Vb, Adj, Val, SlashedTerm],
    },
    SlashedTerm: {
      not: [Emoticon, Url, Val]
    },
    Email: {
      not: [HashTag, Vb, Adj, Val, PhoneNumber, AtMention, Emoji, Emoticon],
    },
    Acronym: {
      not: [RomanNumeral, Pron, Date],
    },
    Negative: {
      aliases: [null, 'Neg'],
      not: [NN, Adj, Val, Expr],
    },
    Condition: {
      is: Connector,
      aliases: [null, 'Cond'],
      not: [Vb, Adj, NN, Val],
    },
    // existential 'there'
    There: {
      aliases: [null, 'EX'],
      not: [Vb, Adj, NN, Val, Conj, Prep],
    },
    // 'co-wrote'
    Prefix: {
      not: [Abbr, Acronym, Prop],
    },
    // hard-nosed, bone-headed
    Hyphenated: {},
  };

  const allTags = { ...nouns$2, ...verbs$2, ...values$1, ...dates$2, ...misc$2 };

  // Some finders retain the caller's document; others use the selected view's.
  const select = (View, find, originalDocument = false) => function (n) {
    const matches = typeof find === 'string' ? this.match(find) : find(this);
    const selected = matches.getNth(n);
    return new View(originalDocument ? this.document : selected.document, selected.pointer)
  };

  // name the View subclass, and have .update() return it, sharing the match cache
  const keepClass = (Cls, name) => {
    Cls.prototype.viewType = name;
    Cls.prototype.update = function (pointer) {
      const m = new this.constructor(this.document, pointer);
      m._cache = this._cache;
      m.world = this.world;
      return m
    };
  };

  // the json of each match, plus a parsed form under one key
  const jsonWith = (view, n, key, fn) => {
    const opts = typeof n === 'object' ? n : {};
    return view.getNth(n).map(p => {
      const json = p.toView().json(opts)[0];
      json[key] = fn(p);
      return json
    }, [])
  };

  const find$5 = function (doc) {
    let m = doc.splitAfter('@hasComma');
    m = m.match('#Hon+? #Pers+');
    // Spencer's King - but keep 'John Smith's' together
    const poss = m.match('#Poss+').notIf('(his|her)'); //her majesty ...
    m = m.splitAfter(poss);
    return m
  };

  const parse$1 = function (m) {
    const res = {};
    res.firstName = m.match('#First+');
    res.lastName = m.match('#Last+');
    res.honorific = m.match('#Hon+');

    const last = res.lastName;
    const first = res.firstName;
    if (!first.found || !last.found) {
      // let p = m.clone()
      // assume 'Mr Springer', or 'Vice President Springer' is a last-name
      if (!first.found && !last.found && m.has('^#Hon #Hon? .$')) {
        res.lastName = m.match('.$');
        return res
      }
    }
    return res
  };

  // gendered pronouns
  const she = '(she|her|hers)';

  /*
    Important notice - 
    this method makes many assumptions about gender-identity, in-order to assign grammatical gender.
    it should not be used for any other purposes, other than resolving pronouns in english
  */
  const m$4 = 'male';
  const f$2 = 'female';

  // known gendered honorifics
  const honorifics = {
    mr: m$4,
    mrs: f$2,
    miss: f$2,
    madam: f$2,

    // british stuff
    king: m$4,
    queen: f$2,
    duke: m$4,
    duchess: f$2,
    baron: m$4,
    baroness: f$2,
    count: m$4,
    countess: f$2,
    prince: m$4,
    princess: f$2,
    sire: m$4,
    dame: f$2,
    lady: f$2,

    ayatullah: m$4, //i think?

    congressman: m$4,
    congresswoman: f$2,
    'first lady': f$2,

    // marked as non-binary
    mx: null,
  };

  const predictGender = function (parsed, person) {
    const { firstName, honorific } = parsed;
    // use first-name as signal-signal
    if (firstName.has('#FemaleName')) {
      return f$2
    }
    if (firstName.has('#MaleName')) {
      return m$4
    }
    // use honorics as gender-signal
    if (honorific.found) {
      let hon = honorific.text('normal');
      hon = hon.replace(/\./g, ''); //clean it up a bit
      if (Object.hasOwn(honorifics, hon)) {
        return honorifics[hon]
      }
      // her excelency
      if (/^her /.test(hon)) {
        return f$2
      }
      if (/^his /.test(hon)) {
        return m$4
      }
    }
    // offer used-pronouns as a signal
    const after = person.after();
    if (!after.has('#Pers') && after.has('#Pron')) {
      const pro = after.match('#Pron');
      // manual use of gender-neutral
      if (pro.has('(they|their)')) {
        return null
      }
      const hasMasc = pro.has('(he|his)');
      const hasFem = pro.has(she);
      if (hasMasc && !hasFem) {
        return m$4
      }
      if (hasFem && !hasMasc) {
        return f$2
      }
    }
    return null
  };

  const addMethod = function (View) {
    /**
     *
     */
    class People extends View {
      parse(n) {
        return this.getNth(n).map(parse$1, [])
      }
      json(n) {
        return jsonWith(this, n, 'person', p => {
          // read the names from a copy, without its possessive - "Biden's" → 'biden'
          const tmp = p.clone();
          tmp.possessives().strip();
          const parsed = parse$1(tmp);
          return {
            firstName: parsed.firstName.text('normal'),
            lastName: parsed.lastName.text('normal'),
            honorific: parsed.honorific.text('normal'),
            presumed_gender: predictGender(parsed, p),
          }
        })
      }
      // used for co-reference resolution only
      presumedMale() {
        return this.filter(m => {
          return m.has('(#MaleName|mr|mister|sr|jr|king|pope|prince|sir)')//todo configure these in .world
        })
      }
      presumedFemale() {
        return this.filter(m => {
          return m.has('(#FemaleName|mrs|miss|queen|princess|madam)')
        })
      }
    }
    keepClass(People, 'People');

    View.prototype.people = select(People, find$5, true);
  };

  const find$4 = function (doc) {
    let m = doc.match('(#Place|#Address)+');

    // split all commas except for 'paris, france'
    let splits = m.match('@hasComma');
    splits = splits.filter(c => {
      // split 'europe, china'
      if (c.has('(asia|africa|europe|america)$')) {
        return true
      }
      // don't split 'paris, france'
      if (c.has('(#City|#Region|#Prop)$') && c.after('^(#Country|#Region)').found) {
        return false
      }
      return true
    });
    m = m.splitAfter(splits);
    return m
  };

  //combine them with .topics() method
  const find$3 = function (n) {
    // builds without the chunker have no .clauses()
    const r = this.clauses ? this.clauses() : this;
    // Find entities and acronyms without duplicating acronyms inside entities.
    let m = r.people();
    m = m.concat(r.places());
    m = m.concat(r.organizations());
    m = m.concat(r.match('#Acronym').ifNo(m));
    m = m.not('(someone|man|woman|mother|brother|sister|father)');
    //return them to normal ordering
    m = m.sort('seq');
    // m = m.unique()
    m = m.getNth(n);
    return m
  };

  const api$b = function (View) {
    View.prototype.topics = find$3;
  };

  const api$a = function (View) {
    addMethod(View);

    View.prototype.places = function (n) {
      const m = find$4(this);
      return m.getNth(n)
    };
    View.prototype.organizations = function (n) {
      const m = this.match('#Org+');
      return m.getNth(n)
    };
    api$b(View);
  };
  var topics = { api: api$a };

  // key order is the order they are redacted in
  const defaults$1 = {
    people: true,
    places: true,
    organizations: true,
    emails: true,
    money: true,
    percentages: true,
    fractions: true,
    phoneNumbers: true,
    atMentions: true,
    acronyms: true,
    urls: true,
    // off by default
    properNouns: false,
    dates: false,
    numbers: false,
    pronouns: false,
  };

  // remove these specific tags when redacting, which may leak information
  const hideTags = {
    people: [MaleName, FemaleName, First, Last],
    places: [City, 'State', Country, Region],
    organizations: [SportsTeam, 'Company', 'School'],
  };
  hideTags.pronouns = [...hideTags.people, ...hideTags.places, ...hideTags.organizations];

  // replace text with blockStr but keep tags
  const redactMatch = function (m, blockStr, keep = true) {
    m = m.notIf('#Redacted');
    m.replaceWith(blockStr, keep);
    m.tag('Redacted');
    return m
  };

  const redact = function (opts = {}, blockStr = '██████████', keep = true) {
    opts = { ...defaults$1, ...opts };
    // each key is also the View method that finds them
    Object.keys(defaults$1).forEach(k => {
      // skip finders that this build or language does not have
      if (opts[k] !== false && this[k]) {
        const m = redactMatch(this[k](), blockStr, keep);
        if (hideTags[k]) {
          m.unTag(hideTags[k]);
        }
      }
    });
    return this
  };

  const plugin = {
    model: {
      one: {
        tagSet: {
          Redacted: true
        }
      }
    },
    api: function (View) {
      View.prototype.redact = redact;
    }
  };

  // remove a regex match from the text of each term
  const stripper = reg => view => {
    eachTerm(view.docs, term => {
      term.text = term.text.replace(reg, '');
      term.normal = term.normal.replace(reg, '');
    });
    return view
  };

  const strip$4 = stripper(/\./g);

  const api$9 = function (View) {

    class Acronyms extends View {
      strip() {
        return strip$4(this)
      }
      addPeriods() {
        strip$4(this);
        eachTerm(this.docs, term => {
          // Reuse the sentence period so strip() still preserves punctuation.
          const ending = term.post.startsWith('.') ? '' : '.';
          term.text = term.text.split('').join('.') + ending;
          term.normal = term.normal.split('').join('.') + ending;
        });
        return this
      }
    }
    Acronyms.prototype.viewType = 'Acronyms';

    View.prototype.acronyms = select(Acronyms, '#Acronym');
  };

  // select spans wrapped by paired punctuation held in term.pre / term.post
  const findPairs = (hasOpen, findEnd) => doc => {
    const ptrs = [];
    doc.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        const term = terms[i];
        if (term.pre && hasOpen.test(term.pre)) {
          const end = findEnd(terms, i);
          if (end !== null) {
            const [n, start] = terms[i].index;
            // i and end are relative to this view, but start is not
            ptrs.push([n, start, start + end - i + 1, terms[i].id]);
            i = end;
          }
        }
      }
    });
    return doc.update(ptrs)
  };

  // remove the opening and closing punctuation from each span
  const stripPairs = (hasOpen, hasClosed) => m => {
    m.docs.forEach(terms => {
      terms[0].pre = terms[0].pre.replace(hasOpen, '');
      const last = terms[terms.length - 1];
      last.post = last.post.replace(hasClosed, '');
    });
    return m
  };

  const hasOpen$1 = /\(/;
  const hasClosed$1 = /\)/;

  const findEnd$1 = function (terms, i) {
    for (; i < terms.length; i += 1) {
      if (terms[i].post && hasClosed$1.test(terms[i].post)) {
        return i
      }
    }
    return null
  };

  const find$2 = findPairs(hasOpen$1, findEnd$1);
  const strip$3 = stripPairs(hasOpen$1, hasClosed$1);

  const api$8 = function (View) {
    class Parentheses extends View {
      strip() {
        return strip$3(this)
      }
    }
    Parentheses.prototype.viewType = 'Parentheses';

    View.prototype.parentheses = select(Parentheses, find$2);
  };

  const stripS = stripper(/['’]s$/);
  const leadApostrophe = /^['’]/;

  // spencer's, spencer’s - and the flanders', whose apostrophe is in .post
  const strip$2 = function (view) {
    stripS(view);
    eachTerm(view.docs, t => {
      if (t.text.endsWith('s') && leadApostrophe.test(t.post)) {
        t.post = t.post.replace(leadApostrophe, '');
      }
    });
    return view
  };

  // #Possessive is decided upstream, in steps - the list is in 2-two/contraction-two/compute/index.js
  const find$1 = function (doc) {
    let m = doc.match('#Poss+');
    // expand it to include 'john smith's'
    if (m.has('#Pers')) {
      m = m.growLeft('#Pers+');
    }
    if (m.has('#Place')) {
      m = m.growLeft('#Place+');
    }
    if (m.has('#Org')) {
      m = m.growLeft('#Org+');
    }
    return m
  };


  const api$7 = function (View) {

    class Possessives extends View {
      strip() {
        return strip$2(this)
      }
    }
    Possessives.prototype.viewType = 'Possessives';

    View.prototype.possessives = select(Possessives, find$1);
  };

  /* eslint-disable regexp/no-dupe-characters-character-class */

  const pairs$1 = {
    '\u0022': '\u0022', // 'StraightDoubleQuotes'
    '\uFF02': '\uFF02', // 'StraightDoubleQuotesWide'
    '\u0027': '\u0027', // 'StraightSingleQuotes'
    '\u201C': '\u201D', // 'CommaDoubleQuotes'
    '\u2018': '\u2019', // 'CommaSingleQuotes'
    '\u201F': '\u201D', // 'CurlyDoubleQuotesReversed'
    '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
    '\u201E': '\u201D', // 'LowCurlyDoubleQuotes'
    '\u2E42': '\u201D', // 'LowCurlyDoubleQuotesReversed'
    '\u201A': '\u2019', // 'LowCurlySingleQuotes'
    '\u00AB': '\u00BB', // 'AngleDoubleQuotes' «, »
    '\u2039': '\u203A', // 'AngleSingleQuotes'
    // Prime 'non quotation'
    '\u2035': '\u2032', // 'PrimeSingleQuotes'
    '\u2036': '\u2033', // 'PrimeDoubleQuotes'
    '\u2037': '\u2034', // 'PrimeTripleQuotes'
    // Prime 'quotation' variation
    '\u301D': '\u301E', // 'PrimeDoubleQuotes'
    '\u0060': '\u00B4', // 'PrimeSingleQuotes'
    '\u301F': '\u301E', // 'LowPrimeDoubleQuotesReversed'
  };

  const hasOpen = RegExp('[' + Object.keys(pairs$1).join('') + ']');
  const hasClosed = RegExp('[' + Object.values(pairs$1).join('') + ']');

  const findEnd = function (terms, i) {
    const have = terms[i].pre.match(hasOpen)[0] || '';
    if (!have || !pairs$1[have]) {
      return null
    }
    const want = pairs$1[have];
    for (; i < terms.length; i += 1) {
      if (terms[i].post && terms[i].post.match(want)) {
        return i
      }
    }
    return null
  };

  const find = findPairs(hasOpen, findEnd);
  const strip$1 = stripPairs(hasOpen, hasClosed);

  const api$6 = function (View) {

    class Quotations extends View {
      text(fmt) {
        if (!fmt || fmt === 'text') {
          return super.text({ keepEndPunct: true })
        }
        if (typeof fmt === 'object') {
          return super.text({ keepEndPunct: true, ...fmt })
        }
        return super.text(fmt)
      }
      strip() {
        strip$1(this);
      }
    }
    Quotations.prototype.viewType = 'Quotations';

    View.prototype.quotations = select(Quotations, find);
  };

  /** return anything tagged as a phone number */
  const phoneNumbers = function (n) {
    let m = this.splitAfter('@hasComma');
    m = m.match('#PhoneNumber+');
    m = m.getNth(n);
    return m
  };

  /** return anything tagged as an address */
  const addresses = function (n) {
    let m = this.match('#Address+');
    m = m.getNth(n);
    return m
  };

  // setup easy helper methods
  const selections = [
    ['hyphenated', '@hasHyphen .'],
    ['hashTags', '#HashTag'],
    ['emails', '#Email'],
    ['emoji', '#Emoji'],
    ['emoticons', '#Emoticon'],
    ['atMentions', '#AtMention'],
    ['urls', '#Url'],
    // ['pronouns', '#Pronoun'],
    ['conjunctions', '#Conj'],
    ['prepositions', '#Prep'],
    ['abbreviations', '#Abbr'],
    ['honorifics', '#Hon'],
  ];

  // aliases
  const aliases = [
    ['emojis', 'emoji'],
    ['atmentions', 'atMentions'],
  ];

  const addMethods = function (View) {
    // add a list of new helper methods
    selections.forEach(a => {
      View.prototype[a[0]] = function (n) {
        const m = this.match(a[1]);
        return typeof n === 'number' ? m.get(n) : m
      };
    });
    View.prototype.phoneNumbers = phoneNumbers;
    View.prototype.addresses = addresses;
    // add aliases
    aliases.forEach(a => {
      View.prototype[a[0]] = View.prototype[a[1]];
    });
  };

  const hasSlash = /\//;

  const api$5 = function (View) {

    class Slashes extends View {
      split() {
        return this.map((m) => {
          const str = m.text();
          const arr = str.split(hasSlash);
          m = m.replaceWith(arr.join(' '));
          return m.growRight('(' + arr.join('|') + ')+')
        })
      }
    }
    Slashes.prototype.viewType = 'Slashes';

    View.prototype.slashes = select(Slashes, '#SlashedTerm');
  };

  var misc$1 = {
    api: function (View) {
      api$9(View);
      api$8(View);
      api$7(View);
      api$6(View);
      addMethods(View);
      api$5(View);
    }
  };

  // a comma, but not a clause break
  const notClause = [
    '@hasComma @hasComma', //fun, cool...
    '(#City && @hasComma) #Country', //'toronto, canada'
    '(#WeekDay && @hasComma) #Date', //'tuesday, march 2nd'
    '(#Date+ && @hasComma) #Val', //'july 6, 1992'
    '(#Adj && @hasComma) #Adj', //nice, pretty
  ];

  const byComma = function (doc, rules) {
    const skip = notClause.concat(rules.notClause || []);
    let commas = doc.match('@hasComma');
    // remove any non-clause uses
    commas = commas.filter(m => {
      // don't split the first word
      if (m.growLeft('.').wordCount() === 1) {
        return false
      }
      // don't split the last word
      if (m.growRight('. .').wordCount() === 1) {
        return false
      }
      const more = m.grow('.'); // grow by 1 word in either direction
      return !skip.some(str => more.has(str))
    });
    return doc.splitAfter(commas)
  };

  // should we split-out a clause (in brackets)?
  const splitParentheses = function (doc) {
    // from the misc plugin
    if (!doc.parentheses) {
      return doc
    }
    let matches = doc.parentheses();
    matches = matches.filter(m => {
      return m.wordCount() >= 3 && m.has('#Verb') && m.has('#NN')
    });
    return doc.splitOn(matches)
  };

  // split-out a long quotion, but not 'inline quotes'.
  const splitQuotes = function (doc) {
    // from the misc plugin
    if (!doc.quotations) {
      return doc
    }
    let matches = doc.quotations();
    matches = matches.filter(m => {
      return m.wordCount() >= 3 && m.has('#Verb') && m.has('#NN')
    });
    return doc.splitOn(matches)
  };

  const clauses$2 = function (n) {
    let found = this;
    // word-rules, like 'but' and 'until', are in the model
    const rules = this.model.three?.clauses || {};

    found = splitParentheses(found);
    found = splitQuotes(found);

    found = byComma(found, rules);

    found = found.splitAfter('(@hasEllipses|@hasSemicolon|@hasDash|@hasColon)');

    // each language's own rules
    const { splitAfter = [], splitBefore = [], splitBeforeGroup = [] } = rules;
    splitAfter.forEach(str => {
      found = found.splitAfter(str);
    });
    splitBefore.forEach(str => {
      found = found.splitBefore(str);
    });
    splitBeforeGroup.forEach(str => {
      const m = found.match(str, 0);
      if (m.found) {
        found = found.splitBefore(m);
      }
    });

    // // misc clause partitions
    // found = found.splitBefore('as well as .')
    // found = found.splitBefore('such as .')
    // found = found.splitBefore('in addition to .')

    // // semicolons, dashes
    // found = found.splitAfter('@hasSemicolon')
    // found = found.splitAfter('@hasDash')

    // //
    // found = found.splitBefore('which (were|are|will)')

    // // he said [...]
    // found = found.splitAfter('#Noun (said|say|says)')

    // passive voice verb - '.. which was robbed is empty'
    // let passive = found.match('#Noun (which|that) (was|is) #Adverb? #PastTense #Adverb?')
    // if (passive.found) {
    //   found = found.splitAfter(passive)
    // }
    // //which the boy robbed
    // passive = found.match('#Noun (which|that) the? #Noun+ #Adverb? #PastTense #Adverb?')
    // if (passive.found) {
    //   found = found.splitAfter(passive)
    // }
    // does there appear to have relative/subordinate clause still?
    // let tooLong = found.filter(d => d.wordCount() > 5 && d.match('#Verb+').length >= 2)
    // if (tooLong.found) {
    //   // and after the ..
    //   found = found.splitBefore('#Conjunction #Preposition')

    //   // let m = tooLong.splitAfter('#Noun .* #Verb .* #Noun+')
    //   // found = found.splitOn(m.eq(0))
    // }
    if (typeof n === 'number') {
      found = found.get(n);
    }
    return found
  };

  const api$4 = function (View) {
    View.prototype.clauses = clauses$2;
  };

  // .clauses() with only its punctuation rules - a language adds its own model.three.clauses
  var clauses$1 = { api: api$4 };

  // a leading '-', or the real minus-sign, or one after a symbol - '$-5'
  const minus = /^\s*[-−]|\P{L}[-−]$/u;
  const signs = /[-−]/g;
  // any currency symbol - '$', '€', '₽'
  const currency = /\p{Sc}/u;

  // a decimal-comma, unless the language's model says otherwise.
  // `ordinal` is regex-source for the ending of a numeric ordinal - '[ºª°]'
  // `loose` reads a lone decimal-mark before three digits as thousands - '7,938'
  // `percent` and `currencies` are the words that follow a number - 'per cento', 'euro'
  const defaults = { decimal: ',', group: '.', ordinal: '', loose: false, percent: [], currencies: [] };

  // the mark that groups thousands can't also be the decimal
  const groupMark = function (group, decimal) {
    if (group !== decimal) {
      return group
    }
    return decimal === '.' ? ',' : '.'
  };

  // '1234567' → '1.234.567'
  const addGroups = function (int, mark) {
    const out = [];
    for (let end = int.length; end > 0; end -= 3) {
      out.unshift(int.slice(Math.max(end - 3, 0), end));
    }
    return out.join(mark)
  };

  // floating-point noise - 0.1 + 0.2. a whole number is already exact,
  // and rounding it to 15 digits would corrupt a 16-digit one
  const tidy$2 = num => (Number.isInteger(num) ? num : Number(num.toPrecision(15)));

  // compile each ordinal-ending once
  const cache$2 = {};
  const isOrdinal = function (suffix, src) {
    if (!src || !suffix) {
      return false
    }
    cache$2[src] = cache$2[src] || new RegExp('^(?:' + src + ')$', 'iu');
    return cache$2[src].test(suffix)
  };

  // digits, and any mark that sits between two of them - '1.234,56', '1 000', "1'000"
  const body = /^[0-9](?:[0-9]|[.,'’\s](?=[0-9]))*/;
  const count = (str, char) => str.split(char).length - 1;

  // which mark is the decimal, and which one groups the thousands?
  // two different marks, or a repeated one, say so themselves - '1.234,56', '1.234.567'
  // a lone '.' or ',' is the only real guess, and the locale makes it
  const findMarks = function (str, locale) {
    const dots = count(str, '.');
    const commas = count(str, ',');
    // a space or an apostrophe is only ever a thousands-group
    const soft = str.match(/[ ']/);
    let decimal = null;
    let group = soft ? soft[0] : null;
    if (dots && commas) {
      // the last one is the decimal
      decimal = str.lastIndexOf(',') > str.lastIndexOf('.') ? ',' : '.';
      group = decimal === ',' ? '.' : ',';
      if (soft) {
        return null
      }
    } else if (dots + commas > 1) {
      group = dots ? '.' : ',';
      if (soft) {
        return null
      }
    } else if (dots + commas === 1) {
      const mark = dots ? '.' : ',';
      const isGroup = /^[1-9][0-9]{0,2}[.,][0-9]{3}$/.test(str);
      const isDecimal = mark === locale.decimal && !(locale.loose && isGroup);
      if (soft || isDecimal || !isGroup) {
        decimal = mark; // '3,5', and '3.5' anywhere
      } else {
        group = mark; // '1.000' where the decimal is a comma
      }
    }
    return { decimal, group }
  };

  // '1.234,56' → 1234.56, or null for something that isn't one number - '1.2.3'
  const toNumber = function (str, marks) {
    let int = str;
    let fraction = '';
    if (marks.decimal) {
      const parts = str.split(marks.decimal);
      if (parts.length !== 2) {
        return null
      }
      int = parts[0];
      fraction = parts[1];
    }
    // thousands come in threes
    if (marks.group) {
      const groups = int.split(marks.group);
      if (groups[0].length > 3 || groups.slice(1).some(s => s.length !== 3)) {
        return null
      }
      int = groups.join('');
    }
    if (!/^[0-9]+$/.test(int) || !/^[0-9]*$/.test(fraction)) {
      return null
    }
    return Number(fraction ? int + '.' + fraction : int)
  };

  /**
   * pull-apart a number written in digits - '-5', '1.234,56 €', '3,5%', '2ª'
   * `pre` is any punctuation that the tokenizer left in front of it - '(-'
   * `locale` is model.two.europeanNumbers
   */
  const read = function (str, pre = '', locale = defaults) {
    const res = {
      num: null,
      prefix: '',
      suffix: '',
      hasComma: false,
      decimal: null,
      group: null,
      ordinal: null,
      currency: null,
      isPercent: false,
      isFraction: false,
    };
    str = String(str).trim();
    const begin = str.search(/[0-9]/);
    if (begin === -1) {
      return res
    }
    let prefix = str.slice(0, begin);
    const raw = str.slice(begin).match(body)[0];
    let suffix = str.slice(begin + raw.length);
    // every kind of space, and both kinds of apostrophe
    let digits = raw.replace(/\s/g, ' ').replace(/’/g, "'");
    // a decimal with nothing in front of it - '.5', ',5'
    const lead = prefix.slice(-1);
    if ((lead === '.' || lead === ',') && /^[0-9]+$/.test(digits)) {
      digits = '0' + lead + digits;
      prefix = prefix.slice(0, -1);
    }
    const marks = findMarks(digits, locale);
    let num = marks ? toNumber(digits, marks) : null;
    if (num === null) {
      return res
    }
    // a fraction - '1/2'
    const frac = suffix.match(/^\/([0-9]+)$/);
    if (frac && Number(frac[1]) !== 0) {
      num /= Number(frac[1]);
      suffix = '';
      res.isFraction = true;
    }
    // the sign may be hiding in the punctuation - '(-5)'
    // .. on either side of the currency - '-$5', '$-5' - but not 'covid-19'
    if (minus.test(prefix) || /[-−]$/.test(pre)) {
      num *= -1;
    }
    // a numeric ordinal - '2ª', '5-го', '3e'
    if (isOrdinal(suffix, locale.ordinal)) {
      res.ordinal = suffix;
      suffix = '';
    }
    res.num = num;
    res.prefix = prefix.replace(signs, '');
    res.suffix = suffix;
    res.decimal = marks.decimal;
    res.group = marks.group;
    res.hasComma = marks.group !== null;
    // remember which space it was - a non-breaking one is put back as one
    if (marks.group === ' ') {
      res.group = raw.match(/\s/)[0];
    }
    const money = [res.prefix, suffix].find(s => currency.test(s));
    res.currency = money ? money.trim() : null;
    res.isPercent = /^\s*[%％]/.test(suffix);
    return res
  };

  /**
   * write a number in digits - 1234.5 → '1.234,5'
   * `how` is the result of read(), so a number goes back the way it was found.
   * thousands are only grouped when `how.hasComma` is set
   */
  const write$1 = function (num, how = {}, locale = defaults) {
    if (typeof num !== 'number' || !isFinite(num)) {
      return ''
    }
    num = tidy$2(num);
    let str = String(Math.abs(num));
    // leave '1e+21' alone
    if (/^[0-9]+(?:\.[0-9]+)?$/.test(str)) {
      let decimal = how.decimal || locale.decimal;
      // '7,938' was grouped with a comma, so its decimal is a period
      if (!how.decimal && how.group === decimal) {
        decimal = groupMark(decimal, decimal);
      }
      const parts = str.split('.');
      let int = parts[0];
      const fraction = parts[1];
      if (how.hasComma) {
        int = addGroups(int, groupMark(how.group || locale.group, decimal));
      }
      str = fraction ? int + decimal + fraction : int;
    }
    // the sign goes ahead of any currency - '-$5'
    const sign = num < 0 ? '-' : '';
    return sign + (how.prefix || '') + str + (how.suffix || '')
  };

  const sign = '[-+−]?';
  // '1.234.567,89', or '1234,5' - either mark, the reader sorts-out which is which
  const digits = "(?:[0-9]{1,3}(?:[.,'’][0-9]{3})+(?:[.,][0-9]+)?|[0-9]+(?:[.,][0-9]+)?)";
  // 'R$', 'US$', '€'
  const symbol$1 = '(?:[a-z]{1,2})?\\p{Sc}';

  const cardinal$1 = ['Cardinal', 'NumericValue'];
  const percent$1 = ['Percent', 'Cardinal', 'NumericValue'];
  const money = ['Money', 'Value'];

  // build them once per language
  const cache$1 = new WeakMap();

  /**
   * tagging rules for numbers written in digits, as [regex, tags, example].
   * test them on the term's text, not its 'normal' - which has lost its commas
   */
  const regexes = function (locale = defaults) {
    if (cache$1.has(locale)) {
      return cache$1.get(locale)
    }
    const reg = str => new RegExp('^' + str + '$', 'iu');
    const out = [
      [reg(sign + symbol$1 + ' ?' + sign + digits + '(?:[kmb]|bn)?\\+?'), money, '€5,30'],
      [reg(sign + digits + ' ?' + symbol$1 + '\\+?'), money, '5,30€'],
      [reg(sign + digits + '\\+?'), cardinal$1, '1.234,56'],
      [reg(sign + '[.,][0-9]+\\+?'), cardinal$1, ',5'],
      [reg(sign + digits + ' ?[%％]\\+?'), percent$1, '3,5%'],
      [reg(sign + '[.,][0-9]+[%％]'), percent$1, ',5%'],
    ];
    // '2ª', '5-го', '3e'
    if (locale.ordinal) {
      out.push([reg('[0-9]+(?:' + locale.ordinal + ')'), ['Ordinal', 'NumericValue'], 'ordinal']);
    }
    cache$1.set(locale, out);
    return out
  };

  const reason$1 = 'european-number';
  // '€', '₽', 'R$', 'US$'
  const symbol = /^[a-z]{0,2}\p{Sc}$/iu;
  // only in capitals - 'EUR 5', not 'eur'
  const codes = /^(?:EUR|USD|GBP|CHF|JPY|CAD|AUD|BRL|MXN|RUB|CNY)$/;
  const percent = /^[%％]$/;

  const isValue = term => term.tags.has('Value');
  // nothing but a space between this word and the next - not '5, euro'
  const touches = term => /^\s*$/.test(term.post);

  // do these words come next? - 'per cento'
  const hasPhrase = function (terms, i, words) {
    return words.every((w, o) => terms[i + o] && terms[i + o].normal === w && (o === words.length - 1 || touches(terms[i + o])))
  };

  /**
   * a number takes its meaning from the word beside it - '5,30 €', '50 per cento', 'mille euro'.
   * the number is tagged #Money or #Percent, and the word beside it #Currency or #Unit.
   * the words come from the model - { percent: ['per cento'], currencies: ['euro'] }
   */
  const tagNeighbours = function (terms, view) {
    const { world, model, methods } = view;
    const { setTag, unTag } = methods.one;
    const locale = model.two.europeanNumbers;
    const phrases = (locale.percent || []).map(str => str.split(' '));
    const words = new Set(locale.currencies || []);
    const isCurrency = term => term.tags.has('Currency') || symbol.test(term.text) || words.has(term.normal);
    const isCode = term => symbol.test(term.text) || codes.test(term.text);

    for (let i = 0; i < terms.length; i += 1) {
      if (!isValue(terms[i]) || terms[i].tags.has('Ordinal')) {
        continue
      }
      // the whole number - '1 000', 'trois cent'
      let end = i;
      while (terms[end + 1] && isValue(terms[end + 1]) && touches(terms[end])) {
        end += 1;
      }
      const run = terms.slice(i, end + 1);
      const next = touches(terms[end]) ? terms[end + 1] : null;
      const before = terms[i - 1];
      const phrase = next ? phrases.find(a => hasPhrase(terms, end + 1, a)) : null;
      if (phrase) {
        // 'cento' is not a second number
        const unit = terms.slice(end + 1, end + 1 + phrase.length);
        unTag(unit, 'Value', model.one.tagSet);
        setTag(unit, 'Unit', world, false, reason$1);
        setTag(run, 'Percent', world, false, reason$1);
        end += phrase.length;
      } else if (next && percent.test(next.text)) {
        setTag(run, 'Percent', world, false, reason$1);
        setTag([next], 'Unit', world, false, reason$1);
      } else if (next && (isCurrency(next) || codes.test(next.text))) {
        setTag(run, 'Money', world, false, reason$1);
        setTag([next], 'Currency', world, false, reason$1);
      } else if (before && isCode(before) && touches(before)) {
        // only a symbol goes in front - '€ 5,30', 'CHF 12'
        setTag(run, 'Money', world, false, reason$1);
        setTag([before], 'Currency', world, false, reason$1);
      }
      i = end;
    }
  };

  const reason = 'european-number';
  // leave these to the language's own tagger - '12.05.2020', '15.30', '555-1234'
  // .. and a german ordinal keeps its period outside of the term - '3.'
  const skip = ['Date', 'PhoneNumber', 'NumberRange', 'Ordinal'];

  // tag numbers written in digits, from their raw text - '1.234,56', '3,5%', '5,30€'
  const tagNumbers$1 = function (view) {
    const { world, model, methods } = view;
    const regs = regexes(model.two.europeanNumbers);
    const setTag = methods.one.setTag;
    view.docs.forEach(terms => {
      terms.forEach(term => {
        if (!/[0-9]/.test(term.text) || skip.some(tag => term.tags.has(tag))) {
          return
        }
        const found = regs.find(a => a[0].test(term.text));
        if (found) {
          setTag([term], found[1], world, false, reason);
        }
      });
      // '5,30 €', '50 per cento'
      tagNeighbours(terms, view);
    });
  };

  /**
   * numbers written in digits, with a decimal-comma - '1.234,56', '3,5%', '5,30 €'
   * shared across many languages
   * tags them, and adds a reader and writer:
   *   const { read, write } = doc.methods.two.europeanNumbers
   *   const locale = doc.model.two.europeanNumbers
   *   read('1.234,56', term.pre, locale).num // 1234.56
   *   write(1234.56, { hasComma: true }, locale) // '1.234,56'
   * a language sets its own marks in model.two.europeanNumbers - { group: ' ', ordinal: 'er?' }
   * and its own words - { percent: ['per cento'], currencies: ['euro'] } - for '50 per cento', 'mille euro'
   */
  var europeanNumbers = {
    model: { two: { europeanNumbers: { ...defaults, percent: [], currencies: [] } } },
    methods: { two: { europeanNumbers: { read, write: write$1, regexes } } },
    compute: { europeanNumbers: tagNumbers$1 },
    hooks: ['europeanNumbers'],
  };

  // Generated by scripts/pack/index.js; see data/README.md for source files.
  var properNouns = {
    "ProperNoun": "true¦aIbDc8dalhousHe7f5gosford,h4kirby,landsdowne,m2nis,r1s0wembF;herwood,paldiB;iel,othwe1;cgi0ercedes,issy;ll;intBudsB;airview,lorence,ra0;mpt9nco;lmo,uro;a1h0;arlt6es5risti;rl0talina;et4i0;ng;arb3e0;et1nt0rke0;ley;on;ie;bid,jax",
    "Organization": "true¦0:4Q;1:3Z;a3Vb3Dc2Md2Fe2Af25g1Yh1Ri1Nj1Lk1Jl1Gm13n0Ro0Op0Equ0Dr04sStIuDvAw4xiaomi,y2;amaha,mca,ou2wca;gov,tube;a5e3iki2orld trade organization;leaRpedia;lls fargo,st2;field,inghouse;l2rner bros;greens,l street journal,m1C;an halPerizon,isa,o2;dafone,l2;kswagNvo;b5kip,n3ps,s2;a today,ps;esco,i2;lever,ted nations;er,s; mobile,aco beTd bQe8gi fridays,he 4im hortons,mz,o2witter;shiba,y2;ota,s r us;b3carpen3Mdaily ma1holli0s2who;mashing pumpkins,uprem0;ea2lack eyed peas,yrds;ch boys,tl0;l3n3Us2xas instruments;co,la m1F;efonica,us;aCcBe8iemens,mirnoff,np,o6p5quare0Dt2ubaru;a2eer02;rbuc2to1;ks;eci2Cice gir5;ny,undgard2;en;a3x pisto2;ls;g1Wrs;hool1Sientology;feway,insburys,lesforce,msung;adiohead,b9e5o2yanair;man empire,yal 2;b2dutch she5;ank;a4d 2max,vlon;bu2c2Bhot chili peppers,lobster;ll;ders digest,l madrid;c,s;antas,iznos;a9bs,e6fizer,hilip5i4r2;emier 2udential;leagTo1;nk floyd,zza hut; morrCs;psi3tro2ugeot;bras,china,nas;!co;lantir,n2ypal; 3asonic,da2Q;ld navy,pec,range juli3xf2;am;us;aAb9e8fl,h7i6o2sa,vid5wa;k4minat3tre dame,vart2;is;ing1F;ia;ke,ntendo,ssan,vV;l,s;c,stle,tflix,wsweek;a,c;ndos,s3t2;o,west;a,car,daq;aDeAi7lb,o4tv,y2;spa2;ce;b1nsanto,ody blu0t2;ley cr2or0T;ue;c3t2;as,subisM;helin,rosoft;dica3rcedes benz,talli2;ca;id,re;cs milk,ttel,zda;a presse,e2g,ittle caesars; oreal,novo,x2;is,mark,us;atv,fc,kk,lm,m2odak;art;iffy lube,oy division,pmorgan2sa;! chase;bm,hop,k4n2tv;g,te2;l,rpol;ea;a7e6i4o2sbc,yundai;me dep2nda;ot;tac2zbollah;hi;althYwlett pack1V;lliburton,sbro;eneral 6hq,ithub,l5mb,o2reen day,ucci;ldman sachs,o2;dye2gle;ar;axo smith kline,encoZ;electric,m2;otors;a5bi,c barcelo4da,edex,i3leetwood mac,o2rito lay;rd,xcon;at,fa,restone;na;cebook,nnie mae;bay,sa,u5x2;ecutiveYxon2; m2m2;ob1;!rosceptics;aimler,e6isney,o5u2;nkin donu3pont,ran dur2;an;ts;j,w jon0;a,f lepp17ll,peche mode,r spiegel,stiny's chi2;ld;aObc,entrMhIiGloudflaFnn,o4r2;aigsli8eedence clearwater reviv2ossra1;al;cAinba9l7m3n2ors,stco;ferenceJgressionI;ca4merce3p2;aq; bo0Y;st;dplVg2;ate;se;a c2o chanT;ola;re;a,sco2tigroup;! systems;ev3i2;ck fil a,na daily;r2y;on;al2; committee;d3pital o2rls jr;ne;bury,ill2;ac;aFbc,eCfAl6mw,ni,o2p,rexiteeV;ei4mbardiJston 2;glo2pizza;be;ng;o3ue c2;roW;ckbuster video,omingda2;le; g2g2;oodriM;cht3e ge0rkshire hathaw2;ay;el;cardi,idu,nana republ4s2xt6y6;f,kin robbi2;ns;ic;bYcUdidTerosmith,iSlLmFnheuser busEol,ppleBr7s5u4v3y2;er;is,on;di,todesk;hland o1sociated F;il;b4g3m2;co;os;ys; compu2be0;te2;rs;ch;c,d,erican4t2;!r2;ak; ex2;pre2;ss; 6catel3ta2;ir;! lu2;ce2;nt;jazeera,qae2;da;g,rbnb;as;/dc,ademy of scienc0er,tivision2;! blizz2;ard;es;ba",
    "City": "true¦0:75;1:62;2:6H;3:6K;4:5T;5:5M;a6Ab55c4Kd4Ae46f3Yg3Jh3Bi33j2Yk2Gl24m1Nn1Do1Ap0Xq0Vr0Ps06tSuRvMwExiCyAz6;a8h6ibo,urich;a6e6ongsh0;ng3J;greb,nzibar;ang2e6okohama,unfu;katerin3Jrev0;a6n0R;m5n;arsCeBi7roclCu6;h0xi,zhou;c8n6;d6nipeg,terth4;hoek,sor;hita,klow;l65xford;aw;a9e7i6ladivostok,olgograd;en3lnius;nice,r6;o3sailles;lencia,ncouver,r3ughn;lan bator,rumqi,trecht;aGbilisi,eFheEiCoAr8u6;lsa,nis,r6;in,ku;i6ondh64;este,poli;kyo,msk,ronto,ulo6;n,uT;an6jua3l2Vmisoara,ra3;jin,shui; hague,ssaloniki;gucigalpa,hr0l aviv;briz,i7llinn,mpere,ng6rtu,shk2T;ier,sh0;an,chu1n0pei,yu0;aFeEh9kopje,oweto,t8u6;ra6zhou;baya,t;aten is57ockholm,rasbourg,uttgart;an9e7i6;jiazhua1llo1mla,y0;f52n6;ya1zh5;ghai,tou;attle,oul,v46;cramento,int DlCn6o paulo,pporo,rajevo; 8aa,t6;a 6o domingo;a3fe,m1O;antonio,diego,francisco,j6pedro,salvador;o6u0;se;em,t lake city,z27;louis,peters26;aAe9i7o6;me,stov,t5B;ga,o6yadh;! de janeiro;cife,ims,nnes,ykjavik;bat,ip4leigh,nchi,walpindi;ingdao,u6;ez2ito;aGeFhEiDoAr8u7yong6;ya1;ebla,ya1;a6etoria;gue,to;rt6zn0; 6land,o;au prince,elizabeth,said;ls5raeus,tts28;iladelphia,nom penh,oenix;ki1tah tikva;dua,lerZnaji,ris,t6;na,ras;ak46dessa,msk,r7s6ttawa;aka,lo;an,dos;a8ew6ingbo,ovosibirsk,yc; 6castle;delhi,orleans,taipei;g9irobi,n6ples,shv35tchez,v0;ch7ji1t6;es,o1;a1o1;a7o6p4;ya;no,saki;aFeDiAo7u6;mbai,nich,scat;gadishu,nt7s6;cow,ul;evideo,pellier,real;ami,l7nsk,s6;kolc,sissauga;an,waukee;cca,d6lbourne,mphis,ndoza,ssi3;an,ellin,i3;cau,drBkassar,lAn9r6shhad;aca7ib6rakesh,se2N;or;ibo,y;aus,chGdalay,ila;mo;id;aEeBi9o7u6vUy2;anNcknow,dhia3;n6s angeles;d2g beach;brev2Dege,ma6nz,sb2verpool;!ssol; mans,i6;c6pzig;ester; p7g6hore,n0Es vegas,usanne;os;az,lata;aJharHiDlaipeCoArakow,u8y6;iv,o6;to;ala lump4n6;mi1sh0;hima,lkata,pavog4si6wlo2;ce;da;ev,n7r6;kuk,ov;gst2sha6;sa;k6toum;iv;bIdu3llakurichi,mpala,n7ohsiu1ra6unas,waguchi;chi,j;d6o,p4;ahar,y;a8e7i6ohannesW;lin,n0;ddah,rusalem;ip4k6;arta;bad0mphal,nBrkutVs8taYz6;mir,tapala6;pa;fah0l7tanb6;ul;am30i2I;che2d6;ianap2Nore;aBe8o6yder2X; chi mi6ms,nolulu;nh;f7lsin6rakli2;ki;ei;ifa,lifax,mDn6rbin,va3;g9nover,oi;aGdanFenEhDiQlasgCoAraz,u6;a6jrat;dal7ng6yaquil;zhou;ajara,upe;ld coast,then6;burg;ow;ent;eva,oa;sk;lw8n6za;dhi6gtok;nagar;ay;aisal2Aes,o9r7ukuya6;ma;ankfu6esno;rt;rt6sh0; wor7ale6;za;th;d6indhov5l paso,ss5;in6mont2;bur6;gh;aCe9haka,isp4o8resd5u6;b6esseldorf,nkirk,rb0shanbe;ai,lin;ha,nggu0rtmund;hradTl7nv6troit;er;hi;donghJe7kar,l6mascus,r es salaam,ugavpiZ;i0lV;gu,je2;aKebu,hBleve0Wo6raiova,uritiba;lo8n7penhag5r6;doba,k;akLst0W;gVm6;bo;aCen9i7ongqi1ristchur6;ch;ang m8ca6ttago1;go;g7n6;ai;du,zho1;ng6ttogram;ch9sha,zhou;gliari,iAlga9mayenKn7pe town,r6tanP;acDdiff;berra,c6;un;ry;ro;aXeOhLirmingham,oKrAu6;chareUdapeUenos air8r6s0tu0;g6sa;as;es;aAis7usse6;ls;ba7t6;ol;ne;sil9tisla8zzav6;il6;le;va;ia;gota,st2;op7ubaneshw6;ar;al;iDlAng9r6;g5l6n;in;en;aluru,hazi;fa7grade,o horizon6;te;st;ji1rut;ghdad,kGnAot9r8s7yan n4;ur;el,rah;celo3i,ranquilla;ou;du1g7ja lu6;ka;alo7k6;ok;re;ng;ers6u;field;a06b03ccra,ddis ababa,gartala,hmedYizawl,lTmQnIqaba,rFsCt8uck6;la6;nd;he8l6;an6;ta;ns;h6unci2;dod,gab6;at;li6;ngt2;on;a9c6kaPtwerp;hora7o3;na;ge;h8p6;ol6;is;eim;aravati,m0s6;terd6;am; 8buquerq7eppo,giers,ma6;ty;ue;basrah al qadim6mawsil al jadid6;ah;ab6;ad;la;ba;ra;idj0u dha6;bi;an;lbo7rh6;us;rg",
    "Place": "true¦0:4Y;1:50;2:4A;3:4H;4:3O;5:30;6:4Q;a4Mb3Oc31d2Oe2Ef2Cg22h1Qi1Mjapa2Sk1Il19m0Xn0Po0Lp0Br07sVtPuNvLw9y7;a7ork,yz;kutsk,ngtze;aFeEhitDiBo7upatki,ycombe;king,o7;d7l1I;b3Xs7;i4tock;c0UllowbroEn7;c2Ygh2;by,church;ed0ntw3Os2A;ke8r40t7;erf1f1; is0If43;auxhall,irgin is0Lost7;ok;laanbaatar,pto7xb3M;n,wn;aBeotihuacan,h9ive4Go8ruro,sarskoe selo,u7;lum,zigoot;nto,rquay,tt2S;am3e 7orn3N;bronx,hamptons;hiti,j mahal,u1V;aHcotts bluff,eFfo,hEoCpringBt9u7yd2O;dbury,ez,n7;der05set3K;aff1ock2Vr7;atf1oud;hill,w5;ho,uth7; 1Qam27wold;erbroKopping1G;a7ine;f30t0;int lawrence riv6khalin;ayleigh,ed9i7oc26;chmond,o gran4ver7;bend,fr0Esi4; sea,cliffe,hill;aDeAhx,i7ompeii,utn2;c8ne7tcairn; 2Wc0M;kering,t0;k,lh2mbr8n7rth;n1Pzance;oke;cif3Gpahanaumokuakea,r7;k7then0;si4w5;ak9ld t2Jr8x7;f1ley;ange county,f1inoco;mZw5;eAile,o7;r7tt2V;th7wich; 10am1H;gev,uschwanstein,w7; eng8a7h2markKport;rk;land;aAco,e8i7uc;dt26ll17;adow7kong;lands;chu picchu,gadan,iBlAn9ple8r7;kh2; 1Kw5;hattan,sf2J;ibu,t0vern;dstone,n st7;!re7;et;aBeAgw,hr,i7owlSynd06;n7ttle italy;coln memori7dley;al;asi4w3;kefr9mbeth,n7;ca2Mg7sing;f1ley,t0;ont;azan kremlin,e9itchen6o8rasnoyar7ul;sk;re0Xsrae;ns0Ks1X;ax,lf1n8ps7;wiP;d7glew5verness;ian2Aochina;aFeDi8kg,nd,ov7unti2J;d,enweep;gh8llc7;reN;bury,l7;and7;!s;r7yw5;ef1tf1;libu26mp8r7stings;f1lem,row;stead,t0;aFodavari,r7uelph;avenCe7imsW;at Aen7; 8f1Iwi7;ch;acr3valley;britain,lak3;hur7;st;ng3y village;airhavKinancial7ra; district;aCgliBnf19ppiAu9ver8x7;et6f1;glad3t0;rope,st0;ng;nt0;rls1Ms7;t 7;e7si4;nd;aEeCfw,igBo9ryd8u7xb;mfri3nstable,rh2tt0;en;nca1ArcMv6w7;nt0C;by;nh2r7vonport;ry;nuAr7;l8t7;f1moor;ingt0;be;aNdg,eLgk,hElDo7royd0;l8m7rnwall;pt0;c9lingw5osse7;um;ood;he0U;earwat6t;aBel9i7uuk;chen itza,mney rock,n7ricahua;atT;m0Zt7;enh2;mor7rlottetQth2;ro;dar 7ntervilB;grove;ldBmAr7versh2;lis8rizo pla7;in;le;bNpbellf1;weT;a01eQingley,kk,lackOoNr7uckX;aIiCo7;ckt0ok7wns cany0;lyn,s7;i4to7;ne;de;dge8gh7;am,t0;n8t7;own;or7;th;ceb8m7;lPpt0;rid7;ge;ardwalk,lt0;bu7pool,waA;rn;aconsfFdf1lCrAverly9x7;hi7;ll; hills;wi7;ck; air,l7;ingh2;am;ie7;ld;ltimore,rnsl8tters7;ea;ey;bMct0driadic,frica,ginKlHmericas,nBrcAs9tl8ylePzor3;es;!antA;hcroft,ia; de triomphe,t8;adyr,caAdov6tarct7;ic7; oce7;an;st6;er;be8dersh7hambra,list0;ot;rt0;cou7;rt;bot9i7;ngd0;on;sf1;ord",
    "Region": "true¦0:2J;1:2G;2:2P;3:2A;a2Nb2Ac1Wd1Res1Qf1Og1Jh1Fi1Aj16k11l0Ym0Nn07o05pYqUrRsJtEuBverAw6y4zacatecas;akut0ork3u4;cat1kon;a5est 4isconsin,yoming;bengal,virgin0;rwick3shington4;! dc;acruz,mont;dmurt0t4;ah,tar4; 2Ka0X;a6e5laxcala,ripura,u4;scaDva;langa2nnessee,xas;basco,m4smOtar24;aulipas,il nadu;a8elangor,i6o5taf11u4ylhet;ffXrrey,s19;me1Bnora,uth V;ber0c4kkim,naloa;hu1ily;n5rawak,skatchew1xo4;ny; luis potosi,ta catari2;a4hode i9;j4ngpur;asth1shahi;inghai,u4;e4intana roo;bec,en4retaro;sl0E;a8e4unjab;i,n5r4;ak,nambuco;ang,nsylv4;an0;hang,ra4;!na;axaca,disha,h4klahoma,ntar4reg7ss0Ax0F;io;aIeBo6u4;evo le4navut;on;r4tt15va scot0;f6mandy,th4; 4ampton3;caroli2dakota;olk;braska,vada,w4; 6foundland4;! and labrad4;or;brunswick,hamp3jers5mexiTyork4;! state;ey;galPyarit;aAeghalaya,i6o4;nta2r4;dov0elos;ch6dlanDn5ss4zoram;issippi,ouri;as geraPnesota;ig1oac1;dhy12harashtra,ine,lacca,ni5r4ssachusetts;anhao,i el,ylG;p4toba;ur;anca3e4incoln3ouisI;e4iR;ds;a6e5h4omi;aka06ul2;dah,lant1ntucky,rala;bardino,lmyk0nsas,r4;achay,el0nataka;alis6har4iangxi;kh4;and;co;daho,llino7n4owa;d5gush4;et0;ia2;is;a6ert5i4un1;dalFm0D;ford3;mp3rya2waii;ansu,eorg0lou7oa,u4;an4izhou,jarat;ajuato,gdo4;ng;cester3;lori4uji1;da;sex;ageUe7o5uran4;go;rs4;et;lawaMrby3;aFeaEh9o4rimea,umbr0;ahui7l6nnectic5rsi4ventry;ca;ut;ima,orado;la;e5hattisgarh,i4uvash0;apRhuahua;chn5rke4;ss0;ya;ra;lGm4;bridge3peche;a9ihar,r8u4;ck4ryat0;ingham3;shi4;re;emen,itish columb0;h0ja cal8lk7s4v7;hkorto4que;st1;an;ar0;iforn0;ia;dygHguascalientes,lBndhr9r5ss4;am;izo2kans5un4;achal 7;as;na;a 4;pradesh;a6ber5t4;ai;ta;ba5s4;ka;ma;ea",
    "FemaleName": "true¦0:I4;1:I8;2:HG;3:HY;4:HH;5:HL;6:IL;7:IP;8:G8;9:IH;A:G1;B:GZ;C:HQ;D:IE;E:AF;F:HU;G:H1;aFSbEOcCVdC4eARfA9g9Kh92i8Sj7Pk6Rl5Cm3Sn39o36p2Uqu2Tr22s11t0Bu09vZwSxi30yOzH;aLeIineb,oHsof4;e3Df4la,ra;h2iKlIna,ynH;ab,ep;da,ma;da,h2iHra;nab;aJeIing,olACu0vH;et8onCT;le0sen4;el,gmur,n,s89;aMendD6hiCNiH;lJnH;if3TniHo0;e,f3S;helmi0lHma;a,ow;ka0nB;aNeKiHusa5;ck7JkIl8oleAviH;anEenI4;ky,toriAT;da,lma,rHs0;a,nHonica;a,ice;leHnesG9;nHLrH;i1y;g9rHs7;su5te;aXeThQiMoKrHu5y2;acI4iHudy;c4na,sH;hEta;nHr0F;iEya;aJffany,nHs7;a,gtiH;ng;!nEUra;aIeHomasi0;a,lma,o7Pres1;l4ndolwethu;gan,o7NrIssH;!a,ie;eHi,ri6;sa,za;bOlMmKnIrHs7tia0wa0;a7Gyn;iHya;a,ka,s7;arEe2iHm6Nra;!ka;a,iH;a,t7;at7it7;a0Bcarlett,e07hViSkye,neza0oQri,tNuIyH;bil,lvi1;ha,niAsIzH;an39et8ie,y;anHi6;!a,e,nH;aCe;aIeH;fan3l4Wphan5U;cH6r5;fi9KnHphi1;d2ia,ja,ya;er2lv4mon1nIobhan,tH;a,i;dy;aMeIirHo0y5;a,lCU;ba,e0i5lJrH;iHr60yl;!dan;ia,lD7;imaa,ki2nJrIu0w0yH;la,na;i,le9on,ron,yn;aIda,ia,nHon;a,on;!ya;lJrIvH;da,inj;e0ife;en1i0ma;anvi,bLd57har,iBkKlJmInd2rHs7vannaC;aCi0;ant7i2;lCYma,ome;ineh,u2;in1ri0;a03eYhWiToHuthCW;bRcQl7XnPsJwIxH;anAEie,y;an,e0;aIeHie,lD;ann6ll1marCQtA;!lHnn1;iHyn;e,nH;a,dE;da,i,na;hel5Rio;bin,erAyn;a,cIkHmas,nEta,ya;ki,o;h8Bki;ea,iannon,oH;da,n1F;an0bIemEgi0i0nHta,y0;a7Oee;a,eH;cHkaC;a,ca;chIe,i0mo0nHquel,y0;di,ia;ael,elHiB;!e,le;een3ia0;aOeNhKia,oIrH;iscil3Audence;lHrt4;i0ly;iloIoebe,ylH;is,lis;me0;ggy,nelope,r5t2;ige,m0Nn59o5rvati,tIulH;a,et8in1;ricHt4F;a,e,ia;ctav4deIfCCksa0lHphCCumou;a,ga,iv4;l4t8;aTeRiLoIurHy5;!ay,ul;a,eIor,rHur;aCeFma;ll1mi;aLcJharika,kIlaHna,s7ta;!y;a,iDBki;hoGk9HolH;a,e4G;!mh;hir,lHna,rissa;!a,lBD;dLima,nKomi6rges,tH;aHhal3;lHs7;i1ya;cy,et8;e9iECya;a08ckenz3e00iMoJuriel,yH;a,rH;a,iMna,tG;i2llB2nH;a,iH;ca,ka,que;a,cSdori,kaRlMmi,nKrHtzi;aIiH;am;!nB;dy,eHh,n3;nhGrva;aKdJe0ica,lH;iHy;cent,e;red;!gros;!e5;ae5hH;ae5el3T;agan,gNi,lKrH;edith,iIon,yH;em,l;em,ssa;an3iHlisa;nHsBY;a,da;!an,han;b07cADd05e,g03ha,i02ja,l00nZrLsoumeh,tKuIvis,xB0yHz3;bell,ra,soun;d6rH;a,eF;h82ild1t3;a,cTgPiKjor3l7Gn3s7tJwa,yH;!aHbeth,ja9lou;m,nB0;a,ha,in1;!aJbel,eIja,lDna,sHtza;!a,ol,sa;!l1A;!h,m,nH;!a,e,n1;arJeIie,oHr3Yueri8;!t;!ry;et3Wi36;el4Li6Zy;dy,on,ue5;ak,en,iHlory;a,ka,nB;a,re,s3te;daHg3;!len1;alDd3elHge,ison,on0;ei9in1yn;el,le;a0Me0BiWoQuLyH;d4la,nH;!a,dIe2KnHsey;!a,e2J;a,sey;ann,cJel0Ois1lIna,pHz;e,iA;a,u;iHy;a2Oe,ja,l2JnB;is,l1QrItt1HuH;el5is1;aJeIi6na,rH;a9Vi6;lei,n1tA;!in1;aTbb95dSepa,lNnKsJvIzH;!a,beth,et8z3;!ia;a,et8;!a,dH;a,sHy;ay,ey,i,y;a,iJja,lH;iHy;a9Qe;!aH;!nE;ia,ya;!nH;!a,ne;aPda,e0iNjYla,nMoKsJtHx8Ry5;iHt3;c4t4;edi,lC6;la,nHra;a,ie,o2;a,or1;a,gh,laH;!ni;!h,nH;a,d2e,n5K;cOdon0iNkes7mija,na,rMtJurIvHxmi,y5;ern1in4;a,e4Zie,yn;as7iIoH;nya,ya;fa,s7;a,is9R;a,la;ey,ie,y;a01eWhaViNlea,oMrJyH;lHra;a,ee,ie;istHy67;a,en,iHy1E;!e,n55;nul,ri,urtney;aNerMley,mJrHzzy;a,stH;en,in;!berlH;eHi,y;e,y;a,stF;!na,ra;dij1w5;el7LiKlJnIrH;a,i,ri;d2na,za;ey,i,lB6s3y;ra,s7;cey,diatou,ede,iSlQmPrNss6EtKviAyH;!e,lH;a,eH;e,igh;!a68eIhHi4LlDri0y;ar83er83ie,leFrAVy;!lyn89ri0;a,en,iHl5Poli0yn;!ma,nEssa;a5il1;eigh,i,lH;e,ie;a,tl6F;a0AeZiWoOuH;anMdLlHst7U;es,iH;a88eHssa;!n9tH;!a,te;ith,y;a,iA;!anNcelDdMelGhan7HleLni,sIva0yH;a,ce;eHie;fHlDph7K;a,in1;en,n1;i6y;!a,e,n3X;lHng;!ian,lH;!ian;anNle0nKrJsH;ica,sH;!e,ica;i,ri;!a,elGifer,nH;a,et8iHy;!e,fer;a,eJiInH;a,eIiH;e,n1;!t8;cMda,mi,nIque27sminEvie2y9zH;min6;a6eIiH;ce,e,n1s;!lHssa,t0A;e,le;inIk68lDquelH;in1yn;da,ta;da,lPmOnNo0rMsIvaHwo0;!na;aIiHla,obel;do2;belHdo2;!a,e,l34;ati,en1i0ma;di2es,grid;a9elBoge9;a,e9ia0o0se;aQeNiIoHyacinth;da,ll3rtense;lImaH;ri;aIdHlaI;a,egard;ry;ather,iIlHnrietArmi9ster;en2Rga,mi;di;biba,iley,lNnMrJsnItHwa,yley;ice,t3;aa;iHmony,ri4Z;etH;!te;aCnaC;a,ey,l3;a01eViQlOoNrKunJwH;enHyneth;!dolD;ay,el;acieIetHiselB;a,chF;!la;ld1Aogoosh;adys,enHor4ynis;a,da,na;aKgi,lIna,ov85selHta;a,e,le;da,liH;an;!n0;mLnJorgIrH;ald5Ki,m3Btrud6;et8i4U;a,eHna;sis,vieve;ma;bHle,rnet,yG;iIrielH;a,l1;!ja;aTeQiPlorOoz4rH;anJeIiH;da,eB;da,ja;!cH;esIiHoise;n1sca;!ca;a,enc4;en,o0;lIn0rnH;anB;ec4ic4;nArKtHy6;emIiHma,oumaA;ha,ma,n;eh;ah,iBrah,za0;crin,d0Qevi,ileFk0Ol07mXnid,rUsOtNuMvHwa;aKelIiH;!e,ta;inEyn;!a;!ngel4O;geni1nice;hel,ien9ta;mLperanKtH;eIhHrel5;er;l2Zr6;za;a,eralB;iHma,ne4Eyn;cHka,n;a,ka;aPeOiLmH;aIeHie,y;li9;!li9nuH;elG;lHn1;e6iHy;a,e,ja;ly,rald;!nue5;aWeUiNlMma,no2oKsJvH;a,iH;na,ra;a,ie;iHuiH;se;a,en,ie,y;a0c4da,e,f,nMsJzaH;!betHveA;e,h;aHe,ka;!beH;th;!a,or;anor,nH;!a,i;!in1na;ate1Pta;vi;eIiHna,wi0;e,th;l,n;aYeMiLjeneKoH;lores,minique,n39rHtt3;a,eFis,la,othHthy;ea,y;ba;an09naCon9ya;anQbPde,eOiMlJmetr4nHsiree;a,iH;ce,se;a,iIla,orHphi9;es,is;a,lah;dHrdH;re;!dee,na;!b2EoraCraC;a,d2nH;!a,e;hl4i0lal,mNnLphn1rIvi1VyH;le,na;a,by,cIia,lH;a,en1;ey,ie;a,et8iH;!ca,el19ka;arHia;is;a0Qe0Mh04i02lUoJristIynH;di,th4;al,i0;lPnMrIurH;tn1C;aJd2IiHn2Iri9;!nH;a,e,n1;!l3;cepcion,n3sH;tanHuelo;ce,za;eHleF;en,t8;aJeoIotH;ilde;!pat2;ir6rJudH;et8iH;a,ne;a,e,iH;ce,sY;a2er2ndH;i,y;aQeNloe,rH;isJyH;stH;al;sy,tH;a1Men,iHy;an1e,n1;lseIrH;!i6yl;a,y;nMrH;isKlImH;ai9;a,eHot8;n1t8;!sa;d2elGtH;al,elG;cIlH;es8i41;el4ilH;e,ia,y;itlYlXmilWndVrMsKtHy5;aIeIhHri0;er1DleFrDy;ri0;a32sH;a31ie;a,iOlLmeJolIrH;ie,ol;!e,in1yn;lHn;!a,la;a,eIie,otHy;a,ta;ne,y;na,ssa;ace,ice;a,e,l1;isAl3;in,yn;arb0Je02iZlXoUrH;andi6eRiJoIyH;an0nn;nwDoke;an3BdgMgiLtH;ney,tH;!aInH;ey,i,y;ny;d,t8;etH;!t6;an0e,nH;da,na;bbi6glarInH;iAn3;ka;ancHythe;a,he;anca,lja0nH;iAtH;ou;aVcUlinBniArPssOtJulaCvH;!erlH;ey,y;hJsy,tH;e,iHy6;e,na;!anH;ie,y;!ie;nItHyl;ha,ie;adIiH;ce;et8i9;ca,ky;!triH;ce,z;a2o2ra;a2Sb2Md23g1Zi1Qj5l16m0Xn09oi,r04sVtUuOvNwa,yHz2;aKes7gJlIn,seH;!l;in;un;!nH;a,na;a,i2J;drLguJrIsteH;ja;el4;stH;in1;a,ey,y;aahua,he0;hIiya,ja,miAtrH;id;aLlHton;eIi6yH;!n;e,iHy;gh;!nH;ti;iJleIo7piA;ta;en,n1t8;aHelG;!n1J;a01dje5eZgViTjRnKtoHya;inet8nH;el5ia;te;!aKeIiHmJ;e,ka;!mHtt6;ar3;!belIliHmU;sa;!l1;a,eliH;ca;ka,sHta;a,sa;elHie;a,iH;a,ca,n1qH;ue;!tH;a,te;!bImHstasiMya;ar4;el;aLberKeliJiHy;e,l4naH;!ta;a,ja;!ly;hGiIl4nB;da;a,ra;le;aWba,ePiMlKthJyH;a,c4sH;a,on,sa;ea;iHyson;e,son;a,cIn1sHza;a,e,ha,on,sa;e,ia,ja;c4is7jaKksaKna,sJxH;aHia;!nd2;ia,saH;nd2;ra;ia;i0nIyH;ah,na;a,is,naC;la;c7da,leFmNnLsH;haClH;inHyY;g,n;!h;a,o,slH;ey;ee;en;at7g3nIusH;ti0;es;ie;aWdiTelMrH;eJiH;anMenH;a,e,ne;an0;na;!aLeKiIyH;nn;a,n1;a,e;!ne;!iH;de;e,lDsH;on;yn;!lH;i9yn;ne;aKbIiHrL;!e,gaK;ey,i6y;!e;gaH;il;dKliyJradhIs7;ha;ya;ah;a,ya",
    "FirstName": "true¦aTblair,cQdOfrancoZgabMhinaLilya,jHkClBm6ni4quinn,re3s0;h0umit,yd;ay,e0iloh;a,lby;g9ne;co,ko0;!s;a1el0ina,org6;!okuhF;ds,naia,r1tt0xiB;i,y;ion,lo;ashawn,eif,uca;a3e1ir0rM;an;lsFn0rry;dall,yat5;i,sD;a0essIie,ude;i1m0;ie,mG;me;ta;rie0y;le;arcy,ev0;an,on;as1h0;arl8eyenne;ey,sidy;drien,kira,l4nd1ubr0vi;ey;i,r0;a,e0;a,y;ex2f1o0;is;ie;ei,is",
    "LastName": "true¦0:96;1:8Q;2:90;3:8Y;4:8R;5:8I;6:8G;7:8L;8:6N;9:6D;a8Sb7Oc6Nd62e5Wf5Jg4Xh4Fi4Cj45k3Ml37m2Cn23o1Vp1Hquispe,r0Ys0At02vWwMxLyDzA;hAimmerm4L;aAou,u;ng,o;aEeun71iBoAun;koyama,shida;!lA;diAmaz;rim,z;maAng;da,g3Omoto,sAza9;a9hita;iao,u;aFeDiBoAright,u;jcik,lff,ng;lAmm0nkl0sniews9;ki8Hliams25s3;bAiss,lt0;b,er,st0;age,gn0lBtA;anabe,s3;k0sh,tA;ers,on;aCesel6RiAogt;dal,llalAss0valdi;ba,obos;lBn dArgas;en b4Gijk,yk;enzuela,verde;aGeix18hDi1j7oCrBsui,urA;c1n0;an,emblay,ynis9;lstoy,m5rr2th;atch0ill,oA;mArlacius;ps3s3;kah7Anaka,te,var2;aSchNeMhKiImGoEtBuAvoboda,zabo;bot5lliv1zu9;aBeAoica;ele,in1Pphe8vens1H;l7rm0;sa,to,uA;ng,sa;itAyth;!h;lva,mmo8nArbu;at6clair,gh;aAehu,imizu;la,rma;gu6infeld,oh,pulveda,rrano;evi4iltz,miBneid0roed0uAwarz;bert,lz;dBtA;!t,z;!t;h7ito,ka3AlDnAr5sa9to,unders;dBtAz;ana,e,os;b3Kers;as,o;aPeMiJoDuByA;a4oo,u;bio,iz,sA;so,u;bEcha,drigu2gers,jas,mDosevelt,sCtBux,wA;e,li4;ari,h;enb3Bsi;ano,ero;erts0Ni6Z;beiro,cBes,vAzzo;as,e6;ci,hards0K;ag1es,iBut0yA;es,nolds;s,t0;dBmAv4K;os;ic,u;aLeIhGiDoCrAut7;asad,ifti,ochazA;ka;p23rti58well;cBero,nA;as,to;asso,hl0;aAillips;k,m,n4P;a6PeteWna,rAters04;eAic,ki8;i6ra,tz;h66k,rk0tA;el,te6L;bGconnor,g1RlDneill,rBsborne,we8zA;demir,turk;ellana,tAwell;ega,iz;iAs3;vAynyk;ei6;aIrien;aFeEiDoAun2ym1;rBvAwak;ak,otn4I;odahl,ris;cholsNemi,kol5x3;ils3mec;gy,kaAray1sh,varro;jiAmu6shiA;ma;aXcUePiOoFuByeA;rs;lCnBrAssolini;ati,pTray;oz,te3R;d0l0;h1lHnGore,rBsAzart;er,s;aDeCiBrisAt3;!on;!n0C;au,i6no,tti;!l2;roe,tgomery;ina,l0;crachi,ll0;hmeti,iDjia,lBnd2rci0ssiAyer1J;!er;nAo;yk;er,j0;cartBlA;aughl7e1;hy;drigal,eda,i0jerus,kela,mani,nFrCtByA;er,r;ei,ic,su11th5C;iAqu2roqu7ti8;ani,c,nA;!o;cini,n;aNeIiFoDuByA;!nch;k5nAo;d,gu;mbarAp2vr5we;di;!nAu,yanage;coln,dA;b11holm,strom;feChm0Fitn0kaBn7rAwis;oy;!j;bvAvA;re;ine,mmy,ng,u,voie,ws3;aNeMh1iKlIoFrDuBvar1woA;k,n;ce6marA;!a;aAem0ishna,yeziu;m0sniqi,us2F;bay3Rch,vaAwals9;cAl;!ic,s;e7uiveA;rt;eff0kAl5mu6;uchi;ll0nnedy;hn,llDmins9ne,pBstrati,to,ur,yA;a,s0;l1oA;or;oe;aEenDha4oBuA;ng,r5;hnsAn2u4;on,t3;ki8nings;cAnsse8;ks3obs;glesias,keda,l07noTonBshikAto,vanou;awa;escu;aJeIiHjaltal7oCuA;!aAb0gh2ynh;m1ng;a4dz5fCjgaard,k,lBpIrAwe,xha;ak,vat;m2t;er,fm2WmA;ann;ggi8tchcock;ikkila,mingway,nde3Rrre6ss;dz5gen,qGrFsDuCwByA;ashi,es;ki8;gen,ng;ani,hiA;moto;di4p0ris,t;ue;aNeorgMheorghe,iLjonKoFrDuAw3;errAo,zm1;a,eA;ro;ayli4eene,g5iffithAub0;!s;ldCm2nBodA;e,m1;calv2zal2;bAs02;erg;aj,i;bs3l,ordaH;ieva;gnGlDmaCndhi,o,rAshi,uthi0;cAdn0za;ia;ge;eaBlA;agh0i,o;no;e,on;aLerIiFjeldsted,lEoCrBuA;chs,ent2jita,ll0;eem1iedm1;ntaArt7urni0wl0;na;emi4or2;sBtzgeraA;ld;ch0h0;nand2rA;arAei6;a,i;b0rrell;dDinsCsAva8;cobar,pAtrada;inoza,osiJ;te7;er,is3warA;ds;aQeJiHjurhuGoEriscoll,uBvorA;ak;arte,boBmitru,nn,rAtta;and,ic;is;g1he0DtA;to;us;aAcki1Wssanayake,x3;s,z; CbnaBlAmir,rvishi,vi,w1;gado,ic;th;bo0groot,jo4lBsilAvri2;va;a cruz,e3uA;ca;hl,mcevs9nBtta,viA;ds3es,s;iels,kula;ki;a03eYhLiobKlarkJoCrAunningham;awford,ivAuz;elli;hen,lEntDoCrAsta,x;byn,reA;a,ia;ke,p0;i,reras;em1li8;ns;!e;anu;aGeEiu,oAu4we;i,ng,p6uBwAy;!dB;dAng;huD;!n,onAu4;!g;kDnCpm1ttBudhA;ry;erjee,o0O;!d,g;ma,raboA;rty;bDlZng5rA;eghetBnA;a,y;ti;an,otari;cer2lder3mpbeFrCstAvadiX;iAro;llo;doBr,t0uAvalho;so;so,zo;ll;a00eOhLiKlJoHrEuCyA;rFtyA;qi;chan1rA;ke;iem,oAyant;oks,wA;ne;nFruya,su,uchaAyko,z5;rd;anco,ondal;ancLdMshwas;aZoAuiy1;umAwmA;ik;ckJethovIgu,ktGnnOrA;gCisBnascoA;ni;ha;er,mA;anA;!n;asA;hi;en;er,hA;am;b5ch,hKiley,kk0ldw7nFrBshAt2u0;ir;bCnBtlAua;ett;es,i0;ieSosa;dAik;a6yoA;padhyA;ay;ra;k,ng;ic;bbYcosXdVgSkhtTlPnJrFsl1tDyA;aBd7;in;la;chis3kiA;ns3;aCmstro4sl1;an;ng;ujo,ya;dBsaA;ri;eBrA;ews;rs3;on;meiBv2;es;da;arwBuilA;ar;al;ams,l0;er;ta;as",
    "MaleName": "true¦0:GJ;1:FD;2:DD;3:G3;4:D0;5:G9;6:CJ;7:F5;8:EB;9:BL;A:FZ;B:FR;aEQbDMcC9dB5eACf9Lg8Lh7Wi7Kj6Ik63l5Dm40n3Mo3Dp2Zqu2Xr22s1Bt0Pu0Mv0AwRxavi2yHzC;aCor0;cChid,karia,nAC;!hDkC;!ary;!ar72ery;aIevgenBBoEuC;en,rFBsCval;if,uf;nCsef,ussef;aCg;s,tC;an,h0;nCrosDNss08;is,nC;!ick;aPeNiDoCyatt;jciech,lfgang,odrFutR;lFnC;f8IsC;lCt1;ow;bGey,frEhelm,lC;ard,iCy;am,e,s;ed5iC;d,ed;e9ur;i,ndell,rn2sC;!l8t1;lDyC;l1ne;lDtC;!er;ace,y;aKernCXiFladDoC;jtech,lodymyr;!iC;mir,sCY;cFha0ktor,nceDrgil,vC;a0ek;!nC;t,zo;!e4Mtor;lCnce,sily;!entC;in94;lCm6Qri,sm0;riCysses;ch,k;aVeQhMiKoFrDurki,yC;!l2rone,s1;avis,eCist0oy,um0;ntCFvor,y;bFdAImCny;!asDmC;aso,ie,y;!z;ias,y;mCt6;!my,othy;adEeoDiago,omC;!as;!dor8N;!de6;dFrC;ence,rC;ance,eCy;ll,nce;!dy;dgh,ha,iCnn2req,tsuki;chi,ka;aXcotVeShOiLlobod0oKpenc2tEurDvenA0yCzym1;ed,lvest2;aj,esh;anFeDuC;!a9;fan15phE6vCwa9;e6Xie;!islaCl8;v,w;lom1rBuleymane;dDgmund,lCm1yabonga;as,vio;!dhartha,n8;aEeClomo;lCrm0;d1t1;hid,ne,qu1Hun,wn,yne;aDbastiDUkou,lim,pp,rgCth,ymour;e1Bio;m6n;!tC;!ie,y;eed,lFmEnCqib,toshi,ul;dCjay,tino;eep,ro;!iAHkelo,mBQu4;!vatore;aZeUhett,iRoGuDyC;an,ou;b8WdDf6pe9ssC;!elDX;ol00y;an,bLcco,dJel,geIh0lHmGnEry,sDyC;!ce;ario,coe,s;!aCnBG;ld,n;an,eo;a72f;lio,r;e38g2n8olfo,riC;go;bB9eCZ;cCl8;ardo,c7Th4WkCo;!ey,ie,y;cFece,gDid,ubByCza;ansh,n05;gie,iC;nald,s;ep;chid,fa4hHin2jesh,lGmFndEoHpha4sDul,wiri,yC;an,mond;had,m6;alD9olph;iro,on;f,ph;ul;e90inC;cy,t1;aNeKhilIiErCyoF;akash,eC;m,st1;eDoC;tr;rre,tC;er,ro;!ipClip;!p6I;dro,rcy,tC;ar,e98rC;!o7;blo,draig,olo,scal,tri5RulCv86;!ie,o;ctavio,i2lHmGndrej,rFsDtCumAwB;is,to;ama,cAkAm0vCwald;aldo;i,vR;ar,er;aDeksandr,ivC;er,i2;f,v;atNeLguyBiFoC;aDel,l0rC;be9m0;h,m;cFels,g4ilo,kDlC;es,s;!hil,las,olaC;!i,y;hCkColas;olas;al,d,il,ls1vC;ille;e,hanC;!a4i4;aXeUiLoGuDyC;les,r1;hamDrad,staC;fa,pha;ed,mG;dibo,e,hamEises,ntDritz,sCussa;es,he;e,y;ad,ed,mC;ad,ed;cFgu4hai,kElDnato,tchC;!ell;house,o7t1;aere,eBPhail,olaj;ah,hDkC;!ey,y;aDeC;al,l;el,l;hDlv3rC;le,rill,v4M;di,met;ay0c00gn6hWjd,ksim,lTmadZnSrKsXtDuric7OxC;imilB6well;eHhEias,tCus,yas;!eo,hCia7;ew,ias;eDiC;as,eu,s;us,w;j,o;cHiGkFlEquis,shall,tCv3;iCy;!m,n;in,on;el,o7us;ano,o7us;!elCin,o7us;!l5o;fred,ish,ny,u4;acDcoCik;lm;hy;amDdi,esh,mC;oud;adCmad;ou;aulCiej;ay;aXePiNloyd,oJuDyC;le,nd1;cFdEiDkCth2uk;a7e;gi,s,z;ovic,vig,wig;!as,iC;ano,en;g0nnie,renEuCvro,well;!iC;e,s;!zo;am,n6oC;n4r;a9Kevi,land,nHoFst2thaEvC;eCi;nte;bo;nCpold;!a7Sel,id;!nC;a9y;mEnd1rDszlo,urenCwr6C;ce,t;ry,s;ar,be9ont;aMeHhalGiEla6onrad,rCu5Jyle;istCzysztof;i0oph2;er0ngsl8p,rC;il9Vk;ed,id;en0iFnCrmit,v4R;!dDnCt1;eth,y;rick;r,th;cp2mErDspAuC;ri;im,l;al,il;a03eXiVoFuC;an,lCst3;en,iC;an,en,o,us;aQeOhKnIrGsDzC;ef;eDhCiah,ue;!ua;!f,ph;dCge;i,on;!aCny;h,s,th6E;anDnC;!ath6Cie,n6U;!nC;!es;!l,sCy;ph;o,qu3;an,mC;!i,m6N;d,ffFns,rCs6;ald,emDmaine,oCry;me,nimo;iah,y;!ery,rC;ey,y;cKdBkImHrEsDvi2yC;dBs1;on,p2;ed,oDrCvis;ett,od;d,s5W;al,es5Ris1;a,e,oCub;b,v;ob,ques;aRbLgKke4Xlija,onut,rIsEtCv0;ai,suC;ki;aDha0iah,maCsac;el,il;ac,iaC;h,s;a,vinCw3;!g;nacio,or;ai,rahC;im;aReLoIuC;be9gGmFsC;eyDsC;a3e3;in,n;berto;h,o;m2raDsse3wC;ard,ie;c45tio;ath,ctor,iGnDrC;be9man07;drik,rC;iCy2I;!k,que;n0Ptor;bJlImza,nHo,rEsDyC;ato,dB;an,s0;lDold,r2DuCv8;hito,ki,to;an,ey;k,s;!im;ib;a07eZiUlenToQrMuCyorgy;iHnFsC;!taC;f,vC;!e,o;nAtC;er,h2;do,lC;herDlC;auCerP;me;aEegCov2;!g,orC;!io,y;dy,ham;dfr8nzalo,rDttfC;ried;an,d45;!n;acoFlDno,oCuseppe;rgi5vanni;be6Aes,lC;es;mo;oFrC;aDhard,rCt;it,y;ld,rd5;ffErgC;!e7iCy;!os;!r8;bElBrCv3;eCland,r4Dth,y;th;e,ri4;aXeSiQlOorrest,rCyodor;aHedFiC;edDtC;s,z;rich;!d40eri10riC;ck,k;nCs2;cEkC;ie,lC;in,yn;esLisC;!co,zek;etch2oC;ri0yd;d4lConn;ip;deriFliEng,rC;dinaCg6nando;nd5;pe,x;co;bCdi,hd;iEriC;ce,zC;io;an,en,o;benez2dYfrXit0lSmLnIo3rEsteb0th0ugenDvCzra;an,erett,geny;!e;iDnCrol,v3w3;est5ie,st;cCk;!h,k;och,riCzo;co,qC;ue;aHerGiDmC;aGett;lCrh0;!iC;ano,o,s;s1y;nu4;be9d1iEliDm2t1viCwood;n,s;ot2As;!as,jah,ot,sC;ha;a3en;!dGgAmFoDua2PwC;a2Oin;arC;do;oZuZ;ie;a04eTiOmitrNoFrag0uEwDylC;an,l0;ayne,ight;ane,dl8nc0st3;minFnDri0ugCvydGyle;!lF;!ald,nCov0;ell,ie,y;go,iDykC;as;cCk;!k;i,y;armuFetDll1mitri7neCon,rk;sh;er,mAriC;ch;id;andLepak,j0lbe9metri6nIon,rGsEvDwCxt2;ayne,ey;en,in;hawn,moC;nd;ek,riC;ck;is,nC;is,y;rt;re;an,le,mKnIrEvC;e,iC;!d;en,iEnell,rCyl;eCin,yl;l3Zn;n,o,us;!iCny;el,lo;iCon;an,en,on;a0He0Eh04iar0lSoKrFuDyrC;il,us;rtC;!is;aFistC;iaDobC;al;no;ig;dy,lInErC;ey,neliCy;s,us;nEor,rDstaC;nt3;ad;or;by,e,in,l3t1;aHeEiCyde;fCnt,ve;ford,t1;menDt6;us;s,t;rFuDyC;!t1;dCs;e,io;enC;ce;aHeGrisC;!toC;phCs;!eC;!r;st2t;d,rCs;b4leC;s,y;el;cDdrCsA;ic;il;lHmFrC;ey,lDroCy;ll;!o7t1;er1iC;lo;!eb,v3;a06eWilVjorn,laUoSrEuCyr1;ddy,rtKst2;er;aKeFiEuDyC;an,ce,on;ce,no;an,ce;nDtC;!t;dDtC;!on;an,on;dFnC;dDisC;lav;en,on;!foLl8y;bby,gd0rCyd;is;ine,ke;al,lK;nIrC;at,nEtC;!raC;m,nd;aDhaCie;rd;rd5;!iDjam3nCs1;ie,y;to;kaMlazs,nHrC;n8rDtC;!holomew;eCy;tt;ey;dCeD;ar,iC;le;ar1Hb18d11fonso,gust3hm0Xi0Ul07m05nRrGsaFugustEveDyCziz;a0kh0;ry;o,us;hi;ata,chiKiJjun,mHnEon,tCy0;em,hCie,ur5;ur;aDoC;!ld;ud,v;aCin;an,nd5;!el,ki;baCe;ld;aMdHgel5tCwA;hoFoC;iDnC;!i5y;ne;ny;er7rCy;eDzC;ej;!as,i,j,s,w;!s;s,tolC;iCy;!y;ar,iCmAos;ne,r,t;aVbSdBeJfHiGl00onFphonsEt1vC;aPin;on;e,o;so,zo;!sR;!onYrC;ed;c,jaHksFssaHxC;!andC;er,rC;e,os,u;andCei;ar,er,r;ndC;ro;en;eDrecC;ht;rt5;dd3in,n,sC;taC;ir;dDmA;ar;an,en;ad,eC;d,t;in;so;aGi,olErDvC;ik;ian5;f5ph;!o;mCn;!a;dGeFraDuC;!bakr;hCm;am;!l;allEel,oulaye,ulC;!lDrahm0;an;ah;av,on",
    "Person": "true¦0:1Q;a21b1Tc1Hd1Ae14f11g0Zh0Ni0Mj0Jk0Gl0Dm07n04o03pYrOsItCusain bolt,v9w4xzibit,y1;anni,oko on2uji,v1;an,es;en,o;a3ednesday adams,i2o1;lfram,ode;ll ferrell,z khalifa;lt disney,r1;hol,ren;a2i1oltaire;n diesel,rginia wo12;lentino rossi,n gogh;a4h3i2ripp,u1yra banks;lXpac shakur;mba03pper gore;eresa may,or;kashi,t1ylor;um,yana;a4carlett johanss0h3i2lobodan milosevic,noop dogg,ocrates,pider1uperman,wami; man,man;egfried,nbad;akespeare,erlock holmes,ia labeouf;ddam hussain,nt1;a claus,ig8;a9e5i4o2u1za;mi,paul;bin hood,d stew12nald1thko;inho,o;hanna,ngo starr,valdo;ese witherspo0i1mbrandt;ll2nh1;old;ey,y;chmaninoff,ffi,iIshid,y romano;a4e3i2lato,o1uff daddy;cahontas,e;lar,per;le,rX;lmer,ris hilt0;leg,prah winfrey,ra;a2e1iles crane,ostradamus; yo,l5ttie,wmL;pole0s;a5e4i2o1ubarek;by,liere,net,rrissey;randa ju1tt romney;ly;rlin,ssia9;cklemore,rkov,s0ta hari,ya angelou;ady gaga,e1iberace,u;bron james,ch wale1e;sa;anye west,e2iefer suther1obe bryant;land;ats,sha;a2effers0fk,k rowling,rr tolki1;en;ck the ripper,waharlal nehru,y z;liSnez;a7e6i4u1;lk hog2mphrey1saZ;! bog03;an;l1tler;de;dwig,nry 3;ile selassFlle ber4m3rrison1;! 1;ford;id,mond;ry;ast0iannis,o1;odwNtye;ergus0lorence nightingale,r1;an1ederic chopL;s,z;ff5m2nya,ustaTzeki1;el;eril lagasse,i1;le zatop1nem;ek;ie;a5e3i1rake;ck w1ego maradoB;olf;g1mi lovaLnzel washingt0;as;l1nGrth vadO;ai lKt0;a7h4lint0o1thulhu;n1olio;an,fuci1;us;aucIop2ristian baKy1;na;in;millo,ptain beefhe4r1;dinal wols2s0;on;ey;art;a6e3hatt,ing crosby,oFro1;ck,n1;te;ck,nazir bhut2rtil,yon1;ce;to;nksy,rack ob1;ama;l 6r3shton kutch2vril lavig9yn ra1;nd;er;chimed2istot1;le;es;capo3go2paci1;no;re;ne"
  };

  // generated in ./lib/lexicon
  var lexData = {
    "Conjunction": "true¦:e4in,o3s0u,y;a1e0;cnotne,up;m,rtneim;!dnauc,moc,nis,rep;!uq0;!nua,rop",
    "Determiner": "true¦a8c7e4lAmuchAning2otrDpocAsuEt1un0variB;!aDos;ant8odB;un0ún;a,o;l,s0;a8e,os,t0;a7e,os;ada,ualquier;lg3mb2quel0;!l0;a3os;as,os;un0ún;a0o0;!s",
    "Preposition": "true¦:aFe2n0otpecxe,rop,sart;e,is,oc0úges;! odreuca A;d2r1tna0;!idem,rud;bos,t9;! 0s6;a6etn4o2r1s0;etna,ámeda;asep a,odeder1;dal 0jab2rtn2;la;al0e9;ed;crec,mic0reuf;ne;! 2ic1r0ts1;ap,t3;ah;etne2ot0;cepser 0nuj;noc;rf",
    "Pronoun": "true¦cuEdonde,eBleDm9n4quien,s3t2ustedFv1yo,é0;l,ste;oso5u3;e,i,uy9ú;e,uy8í;os1u0;estr6;!o0;tr0;as,os;e,í0;!a2o2;ll0sto;a0o0;!s;al0yo;!es",
    "Adverb": "true¦:!1:#$%&()*+-./<:ne,ce,is,ed,se,rt,na,ni,re,oc,at,pm;a1KeM%ac,lam,nKoA-ya,s4y3zev alIá1í0;ha,l1sa,uqa;l0z4;la;oh,um;a#pa,e4o3á0éups&;m1)a,z0;iuq;!aj,&a;jel,#m4;cnot#5t*;cop8d6g5hcum,ira)n. le4jaba,l3msim%a,)#d,sulc+,t0;*0(upus3;t0uc;! ol1;<eje0ós; rZ;eul,la;a%am&,rob0; a;! a .Vm/;/,eib,ua,éi0úa;bm/,$r;dr/,hco*,r<e%,tn0;a0Sem0;aTeHl3núm.,r0;alu1oi-t0;*,sO;citrCpN;a0icáf;col,er,ic9mro8n5pic+rp,r3t2u0;darg,gi,*,su,t0;ca,ibah,#ve;#madnBot;e0utan;#g,til;i1oi0;cida),saco;f,giro;f,n;ep(,i1#(,r0;ap;fo,+;l6t0;n1-0;uf;/7e0;i0rapa,u$rf;c0d#p&O;er,ifH;b0<%;a1%0;op;boXr&i0ton;snF;ciUdQenátlum%,h$PiMlos,rIsi$VtAu9v0;eun,i0;s5t0;a1$ps3i+f0;&;cifingZl1)si+m0;da;er;e0ulcL;c2rgoM;gitP+tn4;aidem6c4e2la,n1(up0;us;el,ujn1;l<0rcn0;.;aDe0i9;f-p,rid;+;a2eg1u0;ges,p;il;lc,r;l<a,po8ra0ve8;($n,tiroy0;am;)6;am0ipár,nufo4;e)1ixor0;pa;xe;fí$p1lbúp,móno$,nú,pít,rótsih,sáb,tcá0;rp;(;l&0tsab;!a;*;/;birra,c-c,didem *rg3eníl3ic#u$sn.3r0y,ívadot;e0oha;iuq0uf;%; #",
    "Ordinal": "true¦:!1:#:misé;a#nQo0;dnugesNmi4nevon6re2t1vatco0;!m6;niuq4rauc1xes4;cret0mirpK;! o#giv,om3;cédHsé3t0;pés0és;!om0;iced;g7lim4nGtne0;c2gni0;nArd9t0uq;co,p7;!i2ud,x6;!ort6s0;e0od;rt;a0i7otco;n3rd2u0x1;cniuq,tp0;es;auc;on;!nu,oud;! o#gi0;rt,v;ollim",
    "Cardinal": "true¦:atnPeGlim,nDo9s0zL;e7i6o0értiBódiB;d,tnei0;c0niL;e2o1s0;eLiPod;hQrtP;tNvL;es,ésiB;no5rt;cnic1hco8nu1r0tneJ;ec,tauc0;!i0;tn7;eFó0;lli0;b,m;c5t0veun1;eis0n2;!i0;c1tn0;iev;eid;e3n0od,rotac;i0o;uq;e1ie0;rt;h4r3s2t2ucn1v0;on;ic;es;auc;co",
    "Unit": "true¦bLceIeGfahrenheitMgEhertz,jouleMkAl9m6p4terHy2z1°0µs;c,f,n;b,e1;b,o0;ttD;e0ulgadaH;rcent,tB;e1il0³;il1laE;g8tB;itA;elvinBil1m0;!/h,s;o0ó6;!b7gr1s;ig2r0;amo6;b,x0;ab3;lsius,ntí0;met0;ro1;yte0;!s",
    "Month": "true¦:erb5lirba,o0;i2re1tsoga,y0zr0;am;ne,rbef;l0n0;uj;mei0utco;cid,tpes,von",
    "WeekDay": "true¦domingo,juev1lun1m0sábado,viern1;art0iércol0;es",
    "Copula": "true¦eAfu5s0érE;e2i1o0;is,mPn,y;do,endo;a0d,rJáis;!mMn,s;e1i0ér8;!mKsC;!r0;a0on;is,n,s;rHs0;!t0;a9emEoy,uv2á0éG;!b0is,n,s;amC;e,i0o;e3mAs2é0;r0sem9;am8em8;te5;r0se8;a7e7on;ba6do,m4r0;em3á2é1ía0;!is,m2n,s;!is;!n,s;os;a0es;!is,n,s",
    "Auxiliary": "true¦h0;a3e2ub0;e,i0o;eron,mAste8;!m9;!b2n,s,y0;a0á2;!m6n,s;er,r1é0ía2;is;em3á2é1ía0;!is,m2n,s;!is;!n,s;os",
    "Modal": "true¦:aCe6n5o4s0és;aBe5i1om0;aAe1;a9é0;b7dBlos,re4;b9d5l4r2;a6e0;b4d3l2r0;ei0;uq;eus;eup;as,ed;ír0;d1eb0;ed;op",
    "Infinitive": "true¦:!1:#$%&()*+-./<=>?@[]^_`~:er,ni,ne,ed,oc,xe,ro,la,ac,us,et,pa,re,na,os,uq,ba,om,id,me,uc,ar;0:MQ;1:MT;2:KN;3:L3;4:MR;5:M7;6:LM;7:MI;8:KV;9:M2;A:M3;B:ML;C:K1;D:L9;E:K8;F:H9;G:MM;H:IG;on],rItimov;a4De2BiKíI;#Io;!f,n?;!b22c1Wd1Hg16l10m0Vn0Sp0Qr0FtYuNvKñIügF;eIurg;r,t;ivJ=I;h,s;!#HOn0;birtJEgPh,lM$ms6rJtitsI;bCeI3nK.;!tsI;bo,&,nI;i,(2;cJfI^;!a,$;nD);esJ$tI;s6);!n0o3rB;aWeUimS%QrNsJ`I;=p5s6;evKiI;sI)AM;a,bCeHPnDrB;!#,$;apJevI`;da,#,^,nD;!#,mD;m8pEPsI;!e3n0;da,eK7^,o,rBsI;aA>A;pIrr1;#,m0;bIl;!&,m0;ap,bQdup,eNfCgen1i@MoKruItun;[,cI;#,n0o,sIM;lIm;f,(;da,$;fJgIh9T@5;^,$,.;#FE^,nDo3rKUsIG;a2`I;!%,sL;l`9murrI;/7i;ab,evJifI=BZu2;&2;!e3n0rKN;eg,iJ*d,.I;!a,#F5n0;d5rI);^,pI;eGSmDo,.,);aLepKlubmaz,oJpI;m`IR.;[,m1;#,);f,sI;!e4M;eRiPnMrIur;eI.2;mJvI;^,n0;e,.;iIu;f,rI;f7ts5;lfHUrI);e,^2;le,rAX;aTeRiOnLuI;al<,caJlI;a,e;!s;apG#,icsLuI;fIh;!^,nD;cJl0sIv6;#EC;&,$8X;m,pIrga;!mi,s1);.JvIña;e,$;^,rB;&Mrap9uI;dIl;a0YeJnDorI;p2t7;d,r,s;!~K7e3lE%b;eEIiIm`C.;cLhKrcsI;eI$,.;!d,#;o3);#,rB;a1Hb1Dc0Rd0De0Cg0Aj/,l08m07nZoYpmorA5rVsTtQvIza3ñat;!aO#NloKoI;hc,ll,mI;!#,n0o3;sJvI;!eFE%8;[,#,^;!p,ta;ce3#;emI=v;!oI;cHQrp11s;!oI;c,t;e@,rI;ab,(I;!#,?;d,r9O;/MopI;!#,mKoJrIQsI.,);^,op;!rp;i,(8;!bo,eJnIs?;am,(;d,r3I;al,/,(;av,ep5oI;!d,mISs;/o3(I=_;!a,#,se;l,rc,sop,vo3;ecTnJop,rI;a,ep,];eJoI;c9ps95;cMfLpKrpJtIv2;!a,e3%,);!a2mGD*s;&,sC;&,o;%,sI;aI&,>A;!rt;!ca,e3n0orIrI1.,);p,t5;a01eK%vDJoJrI;eje,ot;c,n7C;dWj9MlUmTnRp*t4rKtJ@I;alf4ir4;e<,noH*ma,sa[2;aMc,eLfo,oK*[,uI;csId4f4;bo,o;lf,vaf;m,p;c,lc9pI;!a9Wm0;amIeIJ;a,rB;eEH*da;aI[t4Gleb_;t*f,ve3;aIebo8>l0R;p,rga8;fsitas,h9OlpIn2y;!m0;aKeI*s[;bId;!_;c,s;c2rtI;!a,n0s6);bI1cFQdELeDOfDNgCQhcCJiBBjB1l9Nm93n7C(7p73r53s4Et1Uu1Kv17)16y14zNñI;aKeI?,uH;pmG8sI;^,%;b,d,g4pmoHrtI;%8);a0Ue0RiN+2nLoK*JuI;-4rc;f2m+;b9g,ll?,rts1;aIem0ogr4W;c+,ifa,l2va;!~4c*Gdnufo3lXmVnRrLtIvaC;aJeI>rag,onpih,*ma,uab;fo3rBWt$s;f4motua,pmis,rc]1vi3;aMeKitas,oIr/a,t-ic;g/-,+v8_m,<v,rr/a,tI;in],ua;tIvlup;c~-,u-;ilimaf,lug5;aKema,m&7oJ=I;d],t~fn0;l0mFrc$s,t$s;g2Hmuh,rg;an6iIon(e,*finu;$m,tpo,xE;aQiJoIs1`atsbo;bmis,pon];bKga,r/9tJ@DZvI;ic,];=f,u2;aIis%s;snoJtI;n0se8;ps5;cU#,gel,iSm*RnNrKtiJuIvir;div^7siv,tH;g6p-,v5;ap,eJtI;%c8uen;bil,%g;a8Bep,if,oI;icIsrB;aIutits7;n,r;f,n;cIr/E;i7?,=m0;oIsif;f,l;b-4pJrI;!&4;_,oA;c,gl&a,hc5lJ%ma,rI;[,fs6t;%,pI;a,_5s1;aIo<;ls?,rbCs4;d7>;aSeOiL+s,oKrI;esI`;bo,#9Zn0;n3Js1;hcFrJtI@9va2;ca7Ll`,nA4];&,p;lIn;e,lI;!eIn0;rb?;cIl,rgDY;!?,);cQdaPgiN+veE3nLtI;at,cJeprBiI%H;[h,s;aACefe,ulf;/a,iI;s7tn0;ca<,r2XtI;*ma,s/a;rg;ave,&a;a1Wc1Te1Mi14l0Xn09o06p04rZsMuI;biAceKf5hc,lc5pIrfs6;mIs6;a,i,(;je;aSbo,eOiLnDoKuI;gIja2sa;!&,s6;cDEpDE;lDDps1@n0vI;a,#I;!t4;!finEl],rJtI;!a,&,n0o3;!p,raI;!rF6;b,gIl<,p,rF5v1;!lE;aLeKoI;[,c0Kfn0hGpI;!a,eAKmD?,sBW);bil,cAH+,ps1s5K;cs1<;aIec12irc4o34;c,da,r;b2ciAd,lJnCXrIv;b,f,r1;ip,pG;a02eLip,oJuI;!ge3j2Y<;c8m69rI;dema,fA7<;c#HiX+WmMrf4sLtJvI;#,l?,$2;!$,sI;o,.;!a,e68o<;aPeNiLoKrJuI;a,cod,gF;ef,ota;c,f;c,lI=pG;a,pm`;lpIrc7;mD.;dnuf,lI;!g5;!c,s1;*2;c4PlJp9rbeIuga,vel;@;&a,p3Z;aMoLuI;cJm,pes,sI;#,nD;af,if6o;c9s;f,sI);!a,#;bYcVdTeSgRliPmNpMrLsK@,vI;eI$;!l;ecen,iv,>Aop1;f,g,ri;-1ice3;aAiIov;!lDB;bIcaf,m;ah2&,isop;a,^;fa;a5VeIua;!m,r24;!ap-B4#,ilJ$,=IsC.5);je,);ef,?;ah;c4jNlpm0pMrJ@Iv;ap_,ite;cJpI;a,rCM;&,n0;seBJ;bo,.;aJeI^;fA8n74t1yo3;d5j,pmi,tn0;!b5UcLd,#,g4le8PmKp_,rIs1tAP;abs1dih,tI;!#,lEn(47;!#F;a,s5;a01eWiUlRnNoM<l0rJuI;!-,[,c02h5;eI`28;ps6vI;lEn0;ca,p2rg4;aKeI;pIt;!#,m6Ls6;c8rt;ob_JupI;!mi,);#,s1;ce3+,p,rf,@sBvI;!a,#,orpmi,=pC;b,cZfLpKrIv~ta;/7gIpG;#,$,o3;!?;n0o3;!b2cLma,pKrI;ra,tI;a,#;!#7GsaA;!~f;a1Db13cul12d11e0Mfic8g0Ji0Dnoh,o05pm0r00tRuI;atsPcOdNgMj74mrum,p8JsLtI;cJiAnIp-,*t,.;eva;af,urtse2;#<,%c,ualc;esa,if6Zua7;!am,rB;!o3;#,$;alodi,ePibFlif9MnNsI;aLe`es,iJ]BLuI;li,rf;g5$mI;da,.;c,rF;eI(%2;!c6O;monorc,nB;aLeJoI.C;b,ha;!b,c28s,tI;a,%8;ga,ma8n;!bOc1da,ep_,frBga,ir/1jem,lMmKnJpIsesa,v1;ave,r(7;gi,im9N;!a4eI;d,mn0;av,l,pI;mi,);al8Worr0;g,mMpJtIv;!#,se;!sI);a,#,nI.;aAi,(;!da;a8TeJimI>s,ol;!e,$;+,t$2Q;bilARc4dTgRlPmu4nNpJtIvesrB;i5+,%;m/,oKsJuI;c5s;e8o3;!(;eIic7luv,oG;g2v;eIot;ca8;aGiI;+,rf5;iInop,];l,snI;(2B;al,%g4;!ov7;ePiNmJoI;!c2inE;eKon,uI;lsItsoH;&,iv;ms1s;lIv;!-,i@e;lI@;ec;!cKlc6OpI;!eIi@e,m0s6;d,r47s;%,sam%8;aOeAiMl`LmaHrKs~,uI;coIhc,rga;!e3s1;az,itG.u;!s6;citIs6@e;>,rap;c9rIt;!ta;a15e0Zg0Wi0AoRrLuI;a,cJt*pIy4P;mi;av;-4eKoI;da,tI;!#,n7C;bJtI;+,$;ih,og;[,dZiI*2Ms,t1z~;cMsJtseI)lf2;g,`;-o,#pJir<,%m6olI*ts6uf;ce;!mi;aQcMiLnJ]o3pec1*po3uloI;s,ve7U;as,eIuf;m,vbC;aAda,sop;a2eI;fJlIps7;es,(;n0rB;lIr,t9;#I;!r0;!>[,rB;b02c00d*ZeYfXgVlSmKpo,sesa,tJurFviI;da;ap,s1;!aNiLl`,oK=Iuli;g,tI;!&,);d,n1;le,rcI;$,s6;cItn0)2;!%;cJpiI;cs6;&,$;aIi*;mi,pm0;a,#,n0;p,r;bC(;oIsaf;c,ic~,rtap;m0ob5;isJupI;mi,o3;a2&,n0;cMdLi+,ll2nKrI;d,f,tI;%,se;ev4;-n6Tn0*;!am+;fo3g,lJrg4sI;!bC;+,p;aXeViQlPoOrKsaJuI;f,hGrFs34;isut4lp,p;aKef4ifJofI;!e3RnDs53;!a2n0;!+,s1;d,t2;-,if,(;m,>Lr,tIxor<;igel,lu,$,sI;al,eI;!bCs1;!#,s1;fs3QrI@;!c;!f6lKm,rIs+b_;goIr1t;rp2;c3Xf7l;a0Sb0Oc0Ne0If0Hg0Gi08l02oZpXrWsiUuI;bScPd],gOmL>,piKtI;~gn0iIor,sop;p-2t;nEt9;e,iI*f2uH;sIt9;!^;a0#,>3Q;ep9iJ+c,$v,rI;ic;rtEtF;at4ma1;a,gI;el;ahc,ub;_7CoI;ca,s;c,iv,<JrIsn0v;!%,tn0;rtG;aLes,iIorr1U;mJpIrb,@E;!ec;uh;c,f,h,tI;!&,se;ab,cOfNgMmisa,pLtJ@I;i>,+;nIs1um;ev;a,&,m0(5;iv;a,rBs1;av,so;#F;$,um-;cn-,d]2gn0NhLp4StJvI;!#,in,s1;>Iut;ms1;!>;ic5zem;aKmJoI;d2p;as4/;h,t4;b_,c24g5j,tJugi,ñI;es;nu<,s$8;aPeLif,oJ*f,uI;b6p_;lIm,%,rF;a8fa;d,lKnEps1rap_,snoHtI@;(,r0sI;ef;a,f5;bIc4iv,l5ta;!aA#;bm-0Oc07d01fZgYlTmSn]its/,pRrOsMuLvJxifI;sa;bo,#Ii+,%,s1;[;g,q9;/seI>;>;aJc,fI;%,s5;r5Vv;ic$3mil,(,se,);e3(4;aLiJpI;ma;cnIfa,xua;(2;!p;elivi3ole;as1nI;(8;~ri,em2iMnLoJuI;p5t9;!tsI;`;ec7;l,sbC;aX#pViSnMoKrJuI;b+b,s4;em0ov6;gIr,sa;en;a$f2eKunI;a,eIo3;!d,r;cil,diJiIlis,=f6se3top,ulf7;cn0;ve;dJfenI$2po3raHuj4;eb;$,=ps1;a,sI;&,o%m;s,v;!r46;aNeL>KorbJrEuI;c9d,l;as1;g4lp,m;!f,ps?,rt9sIvor<8;&,(;ps1r*b_;a0Ae04iZlXnWoSrLsJujIzuj;!n0;~,eirF;ra;aLeIoto,up;bJtsI;op;+;cIl2I;!#I%,s1;!b?;ha,+KrI;!d,&,rI;/7o3;^,t-;ev,olo3;(,uI;mo3v6;d%m,lLrKtI;im,sI;-,ev7$;[,ri;!bo,s1;c,lMnKp8rIvan;!f,gIp,t4;a,n0;!eI;d,r;a,&,l,p;c,d7pKrIv;fCtI;!se;!a,o3;at9nuiA;b0Dc0Ad07jn-,l03ms01nYpWrQsOtK@I;as,nIolb8sahc;alb;aKlJ>lp2oI*s;[s,ciYg;ov;b,g2hc,p;aI&,+f;p,rf~ap;alc,cMoLrJtsI;~;aHeug;ca;[s,l0;!#,o3;log,oI;rt9;aJilIofelO;a,&;lp,s;iIuh;hc;cJep,pI;_;/;-;aprJi,l],nIor,rabN;a[r30od5;ap;a<AnIub;alIorb;ab;mob;!a0Ke0Ii07l05nVoTrLuI;aJd,+s,m,nIs,ya;a5*t9s1;c5rf1;aMoI;bJcIg4;a,#,n0s6;!a,sI;>A;t2ugI;!aIs5;!v+s;m(Ip,r;a,$;aOeKirb,oJuI;f,$;ha,s;mJrIvs1;em,ra;#,%,(I;#,%;!mJrI;ga;!&,(;aI?;ps5s;cPlMmit7uKvI;lo,nI;e,(;c8qI;il;avJoI;sn0;!$;iCulI;e,^;.;psI=h,@;oh;f4lsaAn,rgI;a8&;a1Me1Ki08l07n02oUrPsLuIzillB;dJhcE;am;-,e;am,eKiJuI;b,fo;d,fn0;p,rf5;aJecIoha;!a;bJmI;!#,%,s1;a,_8;bmOfNhc,l0rMt2vI;eJiuInDo3;qe;!r;!#;r1t;%,?,.;es1;aJiIor;rb;b,m,rIt9;ra,t8;!s1;-5ov,`7;bu,d0OfXlQnOp,r[f,tI;alp,ca3irc,%tLsI;am,emJonI;ga6o3;od;ua;rp;rIum0;of;bNc,pI;a,#,iKmDuI);d,s;i,(;rt,tlI;um;up;aAiI;c03dZlXnVpit,rSsOtI;~,c5nKon,rJsI;/,uj;ec,of;aJeI;di;s,`;aNlKnJ=v6;^;/7;af;aJcIev,olg,up;as;lc;aIgis,ot,u;lp;-,pmI;a,eGis;e,ilKoI;cIm;!&;?;ap,ep9uI;rc;se;rt;~=,[,eL$JujI;da,rB;!vi5;#;d,rp;f1hc,p,s,topI;ih;lMrLs,tI;aIs1;!~I;tn0;ta;<;aUirr1lSmut,oNrJ`7;$;ecaGuI;trB;ep;);lg4rI;!pI;!a,m0;(;%;is;&;cJ+,rI;g,t;a,#,sonI;em;]",
    "Noun": "true¦:!1:#$%&()*+-./<=>?@[]^_`~:re,et,se,ne,am,ro,im,la,ir,na,er,ci,ra,rc,ni,id,ps,rp,en,op,es,ac;0:32;1:3O;a2Ge1Q+18n0VoWrOs2;aGel4o2élg1;<2tad;hc,p;a2beum;cBeAg,i#t(,jecnoc,mi.,n7#6s,t3ut2vi15ñ`;cel1A-;em,i2s-c;b),p2;~,soh;bil,n*;~,edr0i2u19;f2m#t;!*`;di,#c;@ar,ov;<5da2;céd,m= saz#uf,n3p%,r2;o2Qt&;ed)oc,)j;hc,lbúp/,n3rbáf,t2;cá],síd37í>;cét,ó>;at8e2*e,oñ`;bew,cnác,d6jum,l4sál,t3v2;-,ád0;cár0ipúj,%&m,t_ yr=h,á>;l2mmih;at,icn0;.tnNíl;+,%&ib;<VdOgMiJjabart,lHm-p,nFrBs8t6v4z#um+,ír,ñ2;a2eBin;!b,d,mat;alc%,it2;ejda,iso[@,luc,&c1om;ce[o],i2;bah,du#,m,sópo],xé;a05ep,o2;!p2;/,%;bme*,e3i[2;us;dan#v1fím(,j2l+b0?d;asap,uga;adaduic,i2#i0Z;cev,/,m0rge19v;e2lor=sU;meg,uv;<c#je,=2;d?cev,l2s#vi.,usu;as;a2euj,*a;m,p;a4n2;a2$?n,of,um;b,moc;c4elpme,g3i+,l,rg,sap$.,t2zeb~&;aZiv1lu%r,n$a,soc,up@;oCíh;ifingis,#m;dói0Uf4hc,p,r ot#up,t2;nálta4róp,sónga@,uéc(=f,á2ílo^;mu^,rdR;áTícap2; o.éco;aCe2or;d)9g6iug+,m2rt;axe,i4od3r0u2;lS%r;ba;gér,>;!(i,i3r2;(,iv;);!s2;ed;l2mtab,p,to;c,p;cIdu0iHmiGnCr8s,t5u4v2ñS;anr0i2;r,t%f;n(,t-;e3i[2&mucod,)p,s-c;oh;gev,m;bmu,d4^3g2otil,ulp;$1;*,uf;$0;~,e4*#t,os01u2;bi2;rt;dr0s=;.;cn$_,lif,)t@e;ov;lbOtn2;aAe2;i5n_o,r4t3u2yub-tnN;f,p;ap;eg;d,lc,pr4v2;iv/b8r2;is;`;<DdCf1iBjubAma,n8r6t2ug,vel;i3&%]6ov,s2;e,?;<l2siv;os;*Huats2;/;od,#2;bog;@;c#m5dut%,=v;n(4uya;+,rbaf;a3itsubm2or;oc;c,s;beu],<05dLgK-a?uq(,lIm)f,.DrAs9t8vit3í)2;$,y(;a3ce[2;#p;g3i<1n#t2;+;^;lTob;~,_%;beiuq,^3t%2uc;um;*;!b5l,m4&,pm0r3tn2znRñR;ev;!bm5;`,#h;ah;cz2lJ;em;/tEr0;a3#2;uc;cIgFhDjabC+sBn9pSr6t3zl0;~;n3r2;_;up;ap,*,o2t6;pm2;$;!r2;oj;&;me;!c2;af;ell,u2;j,rd2;(;éd;ncBt2;cát,sí6ám4é3í2;>;!ivos nóinu,t7;arg,$,)f1;?;d3ügn2;il;at2;%;ét;]",
    "Adjective": "true¦!1:#$%&()*+-./<=>?@[]^_`~:er,en,es,ro,il,lo,ri,ti,an,al,le,or,st,ci,vo,te,re,ra,do,mo,no,ar;0:MU;1:NT;2:NF;3:LW;4:NM;5:NO;6:MW;7:L6;8:KN;9:NQ;A:LU;B:MZ;C:NA;D:MJ;E:LE;F:NE;G:L5;H:G8;I:NB;aK1bITcFZdEMeCVfBZgBBhAQi8Rj8Ikur1l7Um6En5To5Gp3Uqu3Sr2Ss1Et0Ku0FvVweb,xeUySzQáOíLóKúJ;l+mGnEFt(;pAMs7;be3gn7nJ;fi_,tJ;eg3i_;>1g(,l2NrJs3Vto0ur7vi1;abe4i1;aJur1;_LQpoB6]goza0;#_,uJ;caB4gosla?;nófobo,róDM;aUePiLáKíJ;tr7vi1;li1nda);ejFXguDkinFlGYolHrLsJtAu1?4zcJ0;iJuA;b/,go1;tuAulH;cto9XlMnezoGUrKsp#KJtJ;eLEus2;-4TdJsát(,t35;ad#5e4;lu1oz;cPgOlN`,q48*MsJ;.),cJto;oJón;!nNI;ab/,op98;liso/IFón;abBVo;u0ío;bG5lt]KPmbrío,nLrK@LZzbeJ;co,ko;b7Tug4C;iJíD1;f<me,v#sA;a0Ae02he,iZoVrOuLárta3éKíJ;mi1pDD;cni8rmLN;cuI9nI6rJ;bJco,í=DA;io,ulH;aKemCAiJoHIun8;)buMC=e;bajMXcMdicMCnKsJvieB;e3lúLW;qu(o,sJ;grKElúLUm08vM3;io,t9;/77n2rLscKtJ;.,ona8;a0o;^,e3;bK#0ll,n2&J;id7lD;eHOio;atrAba0mpPn7DrJs.6utEó*8;cMmóCBrJ;eKiJáqu7;b/,to8S;`,s8T;#Jio;!a;<ArKF;iwVng33rJuL2í0;as8dío,t83;a0Me0Di07oYuKíIQóJúp#;li1rBP;ave4bUcSdReQfi>JFje2mPpKrc43sJt(;odicho,+tu2;#K[J;_,s9;!^L6fKiJOvJ;is9;iBQluo;#6o;co,l2?;-D;%9iJulH;n2o;.JcampeEd%~&lLBmaKMu6U;pi0t9Z;bO>.NlKmJn<5r1viéI6;brío,e3;aJemne,it0Po;!rJ;!ieF;!%,i=a;#KrJ;ehuGVio;a0b6;amDgNlMmKnJr6;ce3ieJRóBI;i2LpJ;/4áHU;vADíc7;nificaHRuiDW;cQdPguOmiMnLpt$trEArKvJxuCñe3;e3(EM;b6e0io,]0;c(l5eg.Dsa2;cJd%nu1áL6;on0BáCB;nda,&;iHuGT;o4[toDPunda*DE;b6crRgrCRjElPmOnKrJ;^,]ce0;!gKju-i0o,tJ;afeJPiagJNo;*HuJ;i`lHín7;a48oa0;iJtGR?;`,tGY;o,í/F;a0EeSiRoMuKápid5íJ;gi1;a0bJ^,ma0rCs5;io,&;b9WcMd6jLmKn8q1JsaJt9C;^,*0;-Go;a,ibl-8o4;ie3ke3ocó;c5oja0;a01cXdWfUgSlR_2nPpLsponsDKtK?lu>onJ;~6;iC3rógH2;/2rJ;%KoJ;duG2;.DY<;aJomb]da;c$tIB`;aC0igiosG/0;ioJul3C;!nC;iK2/J;ct9jo,xi?;on1uFT;e59honcho,iLo/KtJíp&8;-g2N(D6<;ct9to;$K1o;c6lJ;!eJi=a;nFs;dL),ncKquíd7&,sJ;o,tFZ;he3io;icA;eJie2ímET;bequDchua,*1;a0Se0Ji0Hl0Eo03rNuLáAVéKíJó=u_,úblER;ca3o;ndu),tr7;d93#8lc3n+agu1rJto;iETo,p9PulH;acG1eViSoLáctIAóJ;diFsJximBV;pe3;bCKcedC2duF7fNg$A1lijo,mLn2pKsp#-1@F7vJ;$iC1in99;$BiGuls9;eJiscuo,ot9;d6tJ7;a0%IXuJ;nd5so;e2mJn1Y;aEN#JigG7;!a4os;cKdecGXmatu3r73sJvi5;$J8id$FYo,to,un2;o)mbi0urs9;bSdRlOpu0BrMsJtoHV;iKtJ;#iGR[3;b9Z+v5;>0tJ;u2Vát(;a8iK?*HíJ;c1VfaFga_,tDZ;c1Un4T;#os5*1;la1[;aKeJ;beyo,n5;`,ye3;cu1gm7nJ;na1o,t9;cu7GdunAClPnO<,queñNrLsJ;imGPqJ;ue3;la1m-FXpJson.%,t$e>B6ua0vI0;etuo,/jo;a4o4ín;tá91úl55;iJu1;g&Br46;cífi8ga0lRmpHCrKtJuHD;#0r6óGZ;aM>AdLejo,iH4+J;cuJsa0;l~I;o,us8;gJ/);uaJ;yo;aJ%F8me3;cJ+0;ieF;bRcPfiEVmnCIpMrKsc66toDGvJ;i0oid7ípa3;.,deHYiJto^xo;e65ginCun1;a8#aEFoKrFP+mG1uJ;%2lH;r3Cs8H;>Jhava1ul2;de60ta0;eBlL[3sJtuBv6;cJo/2;e0u3;icuo,onF;aYeTiSoMuJíEMómada4;c/JevG),m#os6B;aJó7L;^,rI;b8KcNmbE9rKtJva2;ab8Jo;cKmaJo%@,ueF;lIn1;<GF;i?,tur0;pEt&geHD;cMfas2gKoJrv6Xto,ut3;gr-a4Zy<qG3;aDTrJ;a,o4uz8;%a*Gio;cGVpoliCItMvKzJ;a[0i;aJie3;l,r3;.,o,urC;a0He0Bi06oVuOáxNédi8íMóLúJ;l+plJsi8;e4o;r8Lv(;nJse3;im5;^,#2la2nMsJtuo;cKicJulmán;.IóEF;ul~;dKiJ;>pC;a0iA;deSlRnMrJzo;aKe0iJmEo,u0;b5Fs8;^,l;ocMtKóJ;ga_,to0;aJevidFJés;`,ñD;&_;da?,%2;rnGs2;lLsKxtJ;e8(9Lo;mGógi0;-DitJ;~%;dMjE1nLrJt&politEJxicEJzqF1;id9BoJ;!vAO;<ItAu1;iJo;a,evAo;cYdXeEIgVlSnQrOsNtKuJyDV;*BD;eJuD6;mát42rJ;iA`;cuEZiva;aga2i`4rJí2N;oquí,ón;cheFdBVifiD8so,uJ;eEVfacC1;aKig0)rquín,o,tJv2HéBK;r18és;!yo;nJ&;o,éC9;eBWu3;ab3edBP;a02eYiRlQoNuKáct7íJúEV;m53qui1;sK@DLxemburJ;guD;iATo;buF4cJmb~1nge?;.IoJ;!mBT;a0e0<E;bNgMmLnKs2tJ;#a*5ua0;^,eAgF0;p6ít&f%;e3ue3;-D#Jio,[4;.,+0;cLgKja0n2oF6tJ;]1ón;.Io,í1U;he3t9;cLdrEnKrgGs>?,tJxo;#Cin5o;ceolad6Pu1;io,*móDN;aOeNoLuJóv$%;dJguetEnto4s2v$(;i4Sí7B;rJv$;da0;m#,ró4Z;cobKponJ;%a,és;eo,i0;be3d1GguCl19mp13nOrLsKt.iJzqui#d5;-73;abeDOom<fo,]elí,óCI;aJla1N[dH;c3DnJ;io,í;a0Vc0Rd0He0Ff0Bg09h08i07ju=06m02na2o00quie2sWtLus16vJút(;as9#Já5R;so77;eKrJ;au@DDuBé3Xí3G;lQnPrJ;!ceN%EHiMmed6nKuJv$t9;rba0;aJo4;!cDYs;`,<;pt9;cDKs5;ec3VigBL;atKeJospe5L;ct8Mgu3nsa2r2;isfJuAT;echo;cuo,^3p<J;tu0;aLeKunJ;^,osuprBR;dia2nBrB;cuDJdu3;ifiCLo;>Ant#rum3C;abiD3u99;$uo,l%J]2;a,%;aLeK]rJun58;&jo;liz,*BG;me,nt(;quí3Psp#0AxpJ;#2)AB;eQiLoJu=*Cíg$a4;e7P)3nJ;%6;f#$c77g0o,sJviduC;cKtJ;in2;rJuAD;e2iD5;bi1fJpe5Zs4Rt#D4;$Bi8W;i4OoJruHul2ó_1;)3mpKnJrpAH;cluBexo,t&CV;/2r$2V;cabUdJl@9Wni49p&p6W;ecuTv27;~,eNoMrKuJío;ls9&;eJop6;s9v4D;rtD4sib/;*A;eNiKusJ;t[4;mJr6;itJ;ad5;gíJso;+_;eAón7;aZeUiSoLuKáb(,íbCTúJ;me1n94;e8go`@,m6Q]caCOér3I;>cu1lNmLnKrJ;izoAZr26;^,%2;ogQóJ;fo0)Fni_;aJgazán;ndD;d2Fndú,rsu2sJ;p-o0Dtór7K;br7chi9ClMrLt#oJ;^xo,gJ;én7;b6T_B;a1e0;bLlóKmbrJr2;e,iH;f(o,ge0;ituClCF;a01eYiXlVoUrNuJé3E;aK#rJipuzcoa0;e3(l4M;po,rdián,@m.J;@8;aLecoKiJose3ueB;eg5s;!la93rX;nKsJto,ve4;iHo;!aJde4;di0;^,r1;aJobAút7;b3u8;g6Wta0;nJográfAIr75=9;#Jui0étAH;.IoB;di6XlJrzo,scEucho;lLoJés;!rJ;&6Z;~1eF;a0Ae07i01lXoVrQuMác(,éKísJ;icB0;rJ+1;r7t(;#BInKtJ;ur5;c4EdameJ%2;ntC;aKecu3XisEug5RíJ;a,o4?);ncKtJudulH;#0;%A2is8Fo,és;lclór9XrJ;mAni1;aKexi?,oJ;jo,*1;co,mJ;$8íge3;b]^s,c+>Ndedig0eMjo,lLnJrme;aJo;l,n>#o4;ipi0ósofo;lI&;as,os;cKd#AliJm$in5o,&z;`,z;un1;lLmJríng7s>2Gv<3V;iJosG;li~;),s5;br6conóm5Qd18f16g15jecu74l0Zm0Yn0Tp0Qqu0Nrrón7s01t00u&peGvid80xJ;!acta,cX$2haWiVpTtJó98;ePin2rJ;aLem5ovKíJ;nse8;#7F;ct9nj#Kt#rJ;%t[;a4os;nKrJ;i83n2Q;di1s5;#J[B;ime8Lto;guo,=2V;us2;elJ[t9;$@,so;#0rus8ér7;bel2cZ$YlWpPqui?,tJ;aNel~,on6r1OuKánd~,úJ;pi1;dKpJ;$1;ioB;b/,^unid$se4n8tC;aNeLi*KlénJur6;di1;tuA;cJso;iCíf09;>Cr51ñolJ;!a4%;a?,ovJ;a8e0;>A;aM/KoJue2;cDl~;róJ;f(o;ndina?,s1W;iKíJ;?8;lib64`,v.6T;icKóJ;ni_;úr7;a0cMdLemiFf#_,oK[ve6RtJ;e3usia=a;ja1rme4;oc85ó7V;-t9Fima;ba]8Bis9;eJéctr5Y;ctJg49va1;<LróJ;f(o,nJ;ic1F;!.;eo,ipc6oí=a;ec0Sicaz,íJ;me3;it9;a0Ue01iNoLruBuJéb(;lJr5;ce,zE;b/,)8Umin3XrmiJ;^,lE;e74fUgTminu2oce5Lp)S[ct1EsNur0vKáJ;fa0;#Ji0;sJ+1;as,o4;cMj85pJ+ntG;#BonibKu%tJ;!o;/4;apa>7Q[2;ma1;itA`;#11uJíc22;n2so12; _da,b(,c08f05l03n01pZrYsJ?2;aVcRdiQemplPhon5NiOnu1o14pKtru43vaJ;li1;iLrJ;e3RovJ;is2;aN#2;#2;ea1;cha1;.LonKuiJ;da1;o78tH;zo;fo79p#>J;bi1;ech5;<+vJ[d83;as,o;so,+J;cu7E;gJicJ;ad79;$s9iniJ;+J;va;a0iduo;(;da;nDñi0;a1Qe1Hh19i15l13oYrQuLáKé/b[,óJ;_1nca?,rn7;li1ntab3;aMba0#1ltLrJ=od6ánt67;si,vJ;(0Ko;o,urC;d3rta;-69ePiLoata,uJí3T;^,eJ;l,n2;ol),=J;a66iJ;-J`;a,o4;>4Hs6C;l0Km0EnWoVque2rLsJ;a8tJ;#a;a5ZdRea0int6nu1pP[Kso,tJuñD;a4e3To4és;ctLspoJ;ndiJ;$6Z;a,oJ;!r;<AulHór7;$2;a1(/4Q;rde6O;cZdu2GeYfWj68_v6Ko5WsOtLvJ;eJulB;rBxo;$2iJ;guo,nJ;e4Vu5;aO#v6QiMpLtJult9;-6LitucJ*29;ionA;icuo;d#J=3S;ab/;bi1nguJ;ín7;<JuB;me;xo;i$zu1[2;~3F#30pKunJún;%,i=a;lKo=eJ;la0;eJi4R;j5t5;e1SoJ;mbiJniA*1;a0`;aJo2Más2Q;nd%30r5;clóp7eLlKm~rErcunv17vJ;(I;ia1;go,ntíf2LrtG;aOecMiKoJur3;),&;f5BlJ`;$5lE;he0oJ;!s)va8;rJto;&,t#;lPnLrJ;cJebrA]1;-G;s9trJ;.IoeKíJ;fuFpe2;u&p7;%@,tíbe3ulJ;~;bezEduc03l02mZnWpSrNsLtJu2;.Jól41;án;e3tJ;ell3Fo;act#ís1Oc3RnMoK&ñe3tJ;ag0Rujo;!lJ;ing6;í?3;aKit.J*0uchi0;!i0;cJz;%;-7c#í3Ji0o,sa1tJ;-@,oJ;nDr;boKpeJ;&,si0ón;ya0;cár7i24_,?;ifol6o;a0Ie09i02l-ZoVrOuLáKíJúl12;fi1pe1;rba3sQva3;$Kfo,rJ;^,guDlE;!a4o4;a?,eOiKuJ;jo,s0Eto;llLtJ;a0ánJ;icG;-@;tEve;goLhem6mKni2ol3ArJsn6to,vi0;goñE]cho;bo;ta0;cK^,quJ;e>0;a4o4uz8;eMlbLnaKrJz~3;ma0;*a;aí0;)rruBnJ;veJ;ni1;a2lQnMoc6rJ;b#11ebKlJ;inD;#;eKig0éJ;?);dic0VfaJ;ct9;ga,);b(P(NjGldMrK=Jyo;~1o;a2bu1cel0W&Jí27;co4;ío;~J;ín;on6;b3Gc35d2We2Uf2Qg2Mje2Kl20m1Mn0Xp0Rqu7r07s02tWuPvLzuKé[5ñeJ;jo;caLlI;aL$J;tuJ;[3;n2F&;dO=&húnNtJ;oKóJ;c1Sg]fo,`m5;g%t2ImJp&pul0M;ot9;ga3;az;eMlánLrJ;acJevi1oz;+?;+8;n2o,rJ;>ope2Jr35;%MiKtu2íJ;nc&0;duo,lv%tJr6;]1;i0<;aZbYca0duo,$WgSio,mRqueológicQrNtJábiF;eLifiKí=J;ic5;>C;sa0;ep$Ki%2XoJ;ce3;+1;os;$6;eKiJ;?;li0nJ;+0;is8;co;ór7;gKm7uJ;ca0;onD;aKuJóc*fo4;%2;iLrJ;$J;@;sa1;a03cho,d00eZfiXgWhid3iUtMuCáLóJ;maJni_;);)F;eNiJ;aér7c1KguGsubJ;ma0S;a4o4;eo;cK*J;<I;%9;ma1sóJ;t&po;evi0)sajEos2;b6t*E;ón;jo,xo;.uz,i0<J;]0;ho;e0Ulfabe2rJ;-ja1quJ;isJ;ta;aSbiM#iK<Jpli5;fo;cJnd6;-5;dieMeKgJ;uo;ntA;.;=3;&;bL^,rJ;go,(lJ;a,$2o;/;a01bZcaYdXeSfonRgOoNpi0tMucKócJ;to0;inóJ;ge0;a4#0o4;ca1;eb]KonqJ;ui0;ica;si0;gMj-dLmJnt0W;-Ján;a4%;*0;[;ea0;li0;-Di0;és;^,`;d[J`;za1;iLrJu^4;adeJio,ícola4ó`_;>1;ta1;ga0icKoJ;rtu06;io05;`;&b6;io;ecQiNjMmini=]+vLul2vJ;#B;so;a4o;un2;cKn@J;la1;ionC;ua1;ampaSep2iaFoOtLuKér*J;_;miQ;iv5uC;.I;!%;gJ]zoM;ed9;go;to;na1;neTo*gSrumQsOuJ;ndKrJ;*1;-J;@4;!s;olut5ur1;a,o;ad9;<;$;ga1;^",
    "City": "true¦alexandria,constanta,genève,h6i̇zmir,kobe,londres,m5n4p2qui3rosario,s0;a0ydney;lvador,ntiago;erth,or0uebla;to;ew york city,is;edellín,oscou;amil0ous0;ton",
    "Country": "true¦:!1:#$%&()*+./<=>?@[]^_`~:am,na,ni,ar, a,la,ab,ro, y ,ir,al,et,ne,re,da,ap,ci,ur, s,in,at;a0Le0Fi0Bk&i,l04m02nToMrHs6tiawuk,u4y2zenút,á1í0ú?p;l#,tiah;@$c,ma$p;aug0tic $]t2;&[,^u;)vut,ruan,taun0ásib-04;av;a7e4o0éd<gnU;<2ce^r#,d0j*_esí[;*rS`u_0;eb&á_ot&ime,o@tse;![;l1ta0ve`.)bóts/cD;rime b&a24ts24;aw,lehcyes;mahM%1r0vidl#;omoc,udnoh;@$rg_<.=>]v8pilif;a3egín,o@2ssu,u0;pag%s,s led 0;aXn1V;uce,v)s le;csagad#,tac;c5d`u o%er,g3n1rgen=nom,saf(%krub,t0;osel,pige;*íl,/#0; $s;*ot.@di%rt,noc led(]0ot,rubmexul;l1Utárcom0K;anóm,ixém;emey,i6á1ínQó0ú?mU;bag,mo)sApaj;dus,mo,ri,t0yi*?za;si0ub;jazak,k1n0ugG;agfa,emkrO;[,ebzu,iy~;=sn=hceil,ér0;*;an0odg%k1E;/us,teiv;a3e&2i1)hsr#0;_<1;fr# ed 1Bsa5;si;g1i+tauce 0pen,t>i+ +mit;ae%N;e>s,ut+p;dn^Vt1u<#,yif,énu0;rb;*i0ubiy;rik;]l4d?v ob8l3picnírp.émot oAr2t+n led(1u0;b*miz,qibmazom;e+c;iovi'd =oc,p0;ihc;eb;buc,c0Qd0Me0Jg0IiCk$l /s,lAn5om4r+d$,su,t3ug&acKyobm2zius,í0ñ[T;cul(tn3poite,rgnuh,uqr0;ut;ac;iduas(ibaZlT;as;a2i1oel &?0utuf d$_il)w;is;hc,t>gVvogez?h-a`s6;]0hg,ust5y2;%mod0Prfaort>c0P;#=a0euze>v,og$;ug;bZcXdnTlOn9r5s2uqavFv0;adlOil0;ob;<Heno1^0;!+leI;d%,r]m;agl2e0is,tM;bCg0;`;ub;a7e4o0;dec# 2l1t0;el,se;op;ed08;k,mBv0;ol0;se;b5d+j,m3rcu,t/u2ut1zn0;~;il;#;e1r0^;ib;);a2eg1ogn0;om;ra;mos,rt0ti;sua;<0i;i1n0si;if;~,zaK;aorc,e0$rf;rg,us;i3m1r0;es;a0olI;g,z;l,m0;an;eu+n,not;%ug0rt/e;!(veun(úp0;[;a$rg,$1ubr* y(ugit0;$;gu,l0^;ez(veun,ri;ehc8i0r#a%d;#6gléb,%mod,r0; 3ema fo_=~s2f0;ád0;us; d=`u;~s0;oc;aj;(]l0;búp0;er",
    "Place": "true¦ams,bcn,den,fco,i0jfk,lax,ord,phl,syd;cn,st",
    "Region": "true¦:a0dnalsi drawde ecnirp,erihskroy htron,rimhsak;dirolf,inigriv,natnom,yhdam",
    "FemaleName": "true¦:aFeBi9koorb,l5m4n3ol2sunev,telracs,y0;bur,dna0stQtrebY;rb,s;eusn5f;evar,ref;ossolb,utat;a1ezah,i0raep;ag,rva;r0tsyG;oc;nayangirm,r0tsirL;amukaynak,dua;c2d1i0leirbag,nims1us;brab,loj,xid;aj;arg,nerolf;dIeHiGjed,lEmDn5r2si1t0y9;ive,narkadn8sirt;!la;a1im,rei0;c,s;c,mas;a7e6i1od0;!al;!er,l2m,r1tsi0;rc;am;atac,u0;ap;gomi,leh,res;la;iw,ra0ue;hc;d2rotciv;l,rdna;avmayirp,i,leme,n0;il",
    "MaleName": "true¦!1:#$:an,ar;a05b03cYdVeRfr#k,gQhMiKjHkDl#ce,m9n8pol,r5s3tom2vaughn,wa1y0;i,ousouf,uuma;de,rrQ;as,oh$u;al6o0;nny,uJ;#Ne1o0;#,cky;x,za;athy,iRomaS;a1in0onte;ik;ck,lachai,r0sDx;co,k;a2en1ir0;by,ollos;dall,t;na7them;a1ess0ie,ordJ;!e;ck,y;chika,nu0;k,nnguK;$0ina1yd$;ris1u0;ta;on;ene,r#t;$2d1lmo,rgi,ym0;en;dy;l,nest;a1e0iego,rew;#,j4nver;llas,ne;h0level#d,ole;$l2risti1u0;ck;#;es,ie;e0ob;nedict,shoi;b1j#i,lfredo,putsi0ustin;aq;dullo,ulfazl",
    "FirstName": "true¦nelly",
    "LastName": "true¦:gnaw,nNortsac,rMsajLv9yrrep,z0;e0oñum;dnanre6hcnas,lazn5m5n4pol,r2u0;g0qzF;irdHnimod;a0ep,imar,reitug;us,vE;emij,itr8;og;f,h;e6o0;damm4l3n1rt0stenzuk;ep,imid;a0ojmes,rims;sah,vi;iahhim,vap,zB;am;j0yi3;e1liss0;av;r5ske0;la;or;etsof,olyat;e3iwrad,oss0;lr1nahoj,re0;dna;ak;s0yugn;n2r0;al,ed0;ep,na;ah,e0;j,tsirhc",
    "Person": "true¦c0jaime,ora,rush limbaugh,sung,tiger woods,virgin mary;arson palmer,ruz"
  };

  /* eslint-disable no-empty */
  const BASE = 36;
  const seq = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const cache = seq.split('').reduce(function (h, c, i) {
    h[c] = i;
    return h
  }, {});

  // 0, 1, 2, ..., A, B, C, ..., 00, 01, ... AA, AB, AC, ..., AAA, AAB, ...
  const toAlphaCode = function (n) {
    if (seq[n] !== undefined) {
      return seq[n]
    }
    let places = 1;
    let range = BASE;
    let s = '';
    for (; n >= range; n -= range, places++, range *= BASE) {}
    for (; places > 0; places--) {
      const d = n % BASE;
      s = String.fromCharCode((d < 10 ? 48 : 55) + d) + s;
      n = (n - d) / BASE;
    }
    return s
  };

  const fromAlphaCode = function (s) {
    if (cache[s] !== undefined) {
      return cache[s]
    }
    let n = 0;
    let places = 1;
    let range = BASE;
    let pow = 1;
    for (; places < s.length; n += range, places++, range *= BASE) {}
    for (let i = s.length - 1; i >= 0; i--, pow *= BASE) {
      let d = s.charCodeAt(i) - 48;
      if (d > 10) {
        d -= 7;
      }
      n += d * pow;
    }
    return n
  };

  var encoding = {
    toAlphaCode,
    fromAlphaCode
  };

  const symbols$1 = function (t) {
    const reSymbol = /^([0-9A-Z]+):([0-9A-Z]+)$/;
    for (let i = 0; i < t.nodes.length; i++) {
      if (!t.nodes[i].includes(':')) {
        break
      }
      const m = reSymbol.exec(t.nodes[i]);
      if (!m || m[0].length !== t.nodes[i].length || encoding.fromAlphaCode(m[1]) !== i) {
        throw new SyntaxError('Invalid efrt packed data: symbol definition')
      }
      t.syms.push(encoding.fromAlphaCode(m[2]));
    }
    t.symCount = t.syms.length;
    t.nodes = t.nodes.slice(t.symCount);
    if (t.nodes.length === 0 || t.syms.some((index) => !Number.isSafeInteger(index) || index >= t.nodes.length)) {
      throw new SyntaxError('Invalid efrt packed data: symbol target')
    }
  };

  const unescapeLabel = function (text) {
    return text.replace(/\\([\s\S]|$)/g, (match, char) => {
      if (char === '\\') {
        return '\\'
      }
      if (char >= 'a' && char <= 'j') {
        return String(char.charCodeAt(0) - 97)
      }
      throw new SyntaxError('Invalid efrt packed data: label escape')
    })
  };

  const dictionary = function (trie) {
    if (!trie.nodes[0].startsWith('!1:')) {
      return
    }
    const header = trie.nodes.shift().split(':');
    const tokens = Array.from(header[1]);
    const fragments = (header[2] || '').split(',');
    if (header.length !== 3 || tokens.length === 0 || tokens.length !== fragments.length ||
      new Set(tokens).size !== tokens.length || trie.nodes.length === 0 ||
      tokens.some((token) => token.length !== 1 || token.charCodeAt(0) < 33 ||
        token.charCodeAt(0) > 126 || /[A-Za-z0-9,;!:|]/.test(token) ||
        (trie.versioned && token === '\\')) ||
      fragments.some((text) => !text || /[A-Z0-9,;!:|¦]/.test(text))) {
      throw new SyntaxError('Invalid efrt packed data: fragment dictionary')
    }
    trie.dictionary = Object.create(null);
    for (let i = 0; i < tokens.length; i++) {
      trie.dictionary[tokens[i]] = trie.versioned ? unescapeLabel(fragments[i]) : fragments[i];
    }
  };

  // References are either absolute (symbol) or relative (1 - based)
  const indexFromRef = function (trie, ref, index) {
    const dnode = encoding.fromAlphaCode(ref);
    const target = dnode < trie.symCount ? trie.syms[dnode] : index + dnode + 1 - trie.symCount;
    // The encoder emits nodes in topological order. Every edge must point
    // forward, which also rules out cycles before expansion starts.
    if (!Number.isSafeInteger(target) || target <= index || target >= trie.nodes.length) {
      throw new SyntaxError('Invalid efrt packed data: node reference')
    }
    return target
  };

  const parseNodes = function (trie) {
    return trie.nodes.map((node, index) => {
      if (node === '' && trie.nodes.length !== 1) {
        throw new SyntaxError('Invalid efrt packed data: empty node')
      }
      const terminal = node[0] === '!';
      const body = terminal ? node.slice(1) : node;
      const edges = [];
      // Match only at the current offset. Searching later positions would
      // repeatedly rescan a long malformed fragment before rejecting it.
      const token = /([^A-Z0-9,;!:|¦]+)([A-Z0-9]+|,|$)/y;
      for (let offset = 0; offset < body.length; offset = token.lastIndex) {
        const match = token.exec(body);
        if (!match || match.index !== offset || (match[2] === ',' && token.lastIndex === body.length)) {
          throw new SyntaxError('Invalid efrt packed data: node syntax')
        }
        const ref = match[2];
        const label = trie.versioned ? unescapeLabel(match[1]) : match[1];
        const text = trie.dictionary ? Array.from(label,
          (char) => trie.dictionary[char] || char).join('') : label;
        edges.push({
          text,
          target: ref === '' || ref === ',' ? -1 : indexFromRef(trie, ref, index)
        });
      }
      return { terminal, edges }
    })
  };

  const toArray = function (trie) {
    const nodes = parseNodes(trie);
    const all = [];
    const stack = [{ index: 0, pref: '', edge: -1 }];
    for (; stack.length > 0;) {
      const frame = stack[stack.length - 1];
      const node = nodes[frame.index];
      if (frame.edge === -1) {
        if (node.terminal) {
          all.push(frame.pref);
        }
        frame.edge = 0;
      }
      if (frame.edge === node.edges.length) {
        stack.pop();
        continue
      }
      const edge = node.edges[frame.edge++];
      const word = frame.pref + edge.text;
      if (edge.target === -1) {
        all.push(word);
      } else {
        stack.push({ index: edge.target, pref: word, edge: -1 });
      }
    }
    return all
  };

  //PackedTrie - Trie traversal of the Trie packed-string representation.
  const unpack$1 = function (str, versioned = false) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0,
      versioned
    };
    dictionary(trie);
    //process symbols, if they have them
    if (str.match(':')) {
      symbols$1(trie);
    }
    return toArray(trie)
  };

  const unpack = function (str) {
    if (str === '' || str === null || str === undefined) {
      return {}
    }
    if (typeof str !== 'string') {
      throw new TypeError('efrt unpack expects a string')
    }
    //turn the weird string into a key-value object again
    const obj = str.split('|').reduce((h, s) => {
      const arr = s.split('¦');
      if (arr.length !== 2 || Object.prototype.hasOwnProperty.call(h, arr[0])) {
        throw new SyntaxError('Invalid efrt packed data: category separator or duplicate category')
      }
      h[arr[0]] = arr[1];
      return h
    }, Object.create(null));
    const all = {};
    Object.keys(obj).forEach(function (cat) {
      let data = obj[cat];
      const versioned = data.startsWith('!2;');
      if (versioned) {
        data = data.slice(3);
        if (!data || data === ':') {
          throw new SyntaxError('Invalid efrt packed data: missing versioned trie')
        }
      }
      const reversed = data[0] === ':';
      const arr = unpack$1(reversed ? data.slice(1) : data, versioned);
      //special case, for botched-boolean
      if (cat === 'true') {
        cat = true;
      }
      for (let i = 0; i < arr.length; i++) {
        const k = reversed ? Array.from(arr[i]).reverse().join('') : arr[i];
        if (Object.prototype.hasOwnProperty.call(all, k)) {
          if (Array.isArray(all[k]) === false) {
            if (all[k] !== cat) {
              all[k] = [all[k], cat];
            }
          } else if (!all[k].includes(cat)) {
            all[k].push(cat);
          }
        } else {
          Object.defineProperty(all, k, {
            value: cat,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
    });
    return all
  };

  /*! spencermountain/suffix-thumb 6.1.0 MIT */
  // the four parts of a model, in the order they are packed
  const sections = ['fwd', 'both', 'rev', 'ex'];

  // characters with a meaning in the packed format - words containing these cannot be learned
  const reserved = /[~|:,{}0-9]/;

  const decodeVal = function (key, str) {
    const m = str.match(/^[0-9]+/);
    const n = m ? Number(m[0]) : 0;
    const tail = m ? str.slice(m[0].length) : str;
    return key.slice(0, key.length - n) + tail
  };

  // apply a model to one word:
  //   1. whole-word exceptions
  //   2. the longest suffix with a rule (a rule may match the entire word)
  //   3. the '' rule, if any, as a fallback (a plain append)
  //   4. otherwise, the word is returned unchanged
  const convert = function (str = '', model = {}) {
    if (typeof model === 'string') {
      throw new Error('suffix-thumb: convert expects a model - uncompress() a packed string first')
    }
    const { ex = {}, fwd = {}, both = {} } = model;
    if (Object.hasOwn(ex, str)) {
      return ex[str]
    }
    // longest suffix first - the stem is only cut once a rule matches
    for (let i = 0; i <= str.length; i += 1) {
      const suff = str.slice(i);
      if (Object.hasOwn(fwd, suff)) {
        return str.slice(0, i) + fwd[suff]
      }
      if (Object.hasOwn(both, suff)) {
        return str.slice(0, i) + both[suff]
      }
    }
    return str
  };

  const flipObj = function (obj = {}) {
    return Object.fromEntries(Object.entries(obj).map(([key, val]) => [val, key]))
  };

  // swap the direction of a model
  const reverse = function (model = {}) {
    return {
      reversed: !model.reversed,
      // these two work both ways
      both: flipObj(model.both),
      ex: flipObj(model.ex),
      // and the one-way rules trade places
      fwd: model.rev || {},
      rev: model.fwd || {},
    }
  };

  const invalid = function () {
    throw new Error('suffix-thumb: invalid packed model')
  };

  // suffix-trie → list of keys
  const unpackKeys = function (str, suff = '', out = []) {
    let i = 0;
    do {
      let chain = '';
      while (i < str.length && str[i] !== ',' && str[i] !== '{') {
        chain += str[i];
        i += 1;
      }
      if (reserved.test(chain)) {
        invalid();
      }
      if (str[i] === '{') {
        // find the matching brace
        let depth = 1;
        let j = i + 1;
        while (depth > 0 && j < str.length) {
          if (str[j] === '{') {
            depth += 1;
          } else if (str[j] === '}') {
            depth -= 1;
          }
          j += 1;
        }
        if (depth !== 0 || (j < str.length && str[j] !== ',')) {
          invalid();
        }
        unpackKeys(str.slice(i + 1, j - 1), chain + suff, out);
        i = j;
      } else {
        out.push(chain + suff);
      }
      i += 1; // step over the comma
    } while (i <= str.length)
    return out
  };

  const unpackSection = function (str = '') {
    const obj = Object.create(null);
    if (!str) {
      return { ...obj }
    }
    str.split('|').forEach(group => {
      const i = group.indexOf(':');
      const val = group.slice(0, i);
      const count = val.match(/^[0-9]+/);
      if (i < 0 || !count || reserved.test(val.slice(count[0].length))) {
        invalid();
      }
      unpackKeys(group.slice(i + 1)).forEach(k => {
        if (Number(count[0]) > k.length) {
          invalid();
        }
        obj[k] = decodeVal(k, val);
      });
    });
    return { ...obj }
  };

  // one string → model
  const uncompress = function (str = '') {
    if (typeof str !== 'string' || str[0] === '{') {
      throw new Error('suffix-thumb: uncompress expects a packed string. Models made before v6 must be learned again.')
    }
    const parts = str.split('~');
    // Preserve the empty/default input shorthand for an empty model.
    if (str !== '' && parts.length !== sections.length) {
      invalid();
    }
    const model = {};
    sections.forEach((s, i) => {
      model[s] = unpackSection(parts[i]);
    });
    return model
  };

  // generated in ./lib/models
  var model$1 = {
    "nouns": {
      "plurals": "0es:n,fin,rin,r,ráter,l,d,s,ori,j,h|1es:lord|2ises:ís|2ases:ás|2oses:ós|2as:tum~0s:a,o,e,é,i,c,t,r{e{ell,rill,ail,iv,ov,t{as,ás,t,o,in},emi,ff,más,ó,g,ak,ok,z,p},ou,eu,sca,onso,nio},u,g,p,n{fa,r,so,fo,to,i},ú{r,mb,mp,n,l,m},b,d{n,le,r,ra,ai},k,w,m,oy,ay,sey,í{squ,nd,f,rr,br},l{mai,tai,l,oo,ppe},ah,sch,ech,á,ó,f|3itas:iíta|2ones:ón|4ánones:anon|2enes:én|4ígenes:igen|4ágenes:agen|5írgenes:irgen|5árgenes:argen|5órdenes:orden|4ímenes:imen|6egímenes:égimen|4úmenes:umen|4ámenes:amen|5érmenes:ermen|5ólmenes:olmen|4ómenes:omen|4óvenes:oven|5íquenes:iquen|2anes:án|2ines:ín|4ítines:itin|2unes:ún|1ces:z|1ares:eá|5acteres:ácter|0es:bort,agot,imut,aís,lub,ey,voy,m{bu,ma,te,he},x,ú,í|1es:bcomité|4ijoles:íjol|2eses:és|2uses:ús|1ies:y|1is:rry|6amsters:ámster|4aters:áter|4asars:ásar|7slogans:eslogan|4orums:órum|0er:ied|2a:lum|5anta:ántum|5sdalgo:odalgo|6s-museo:-museo|1i:eu~2um:uantas|2:es{n{ilio,ie,tre,ye,a{pl,óg,k,j},cri},r{o,a,e,i,u,ú},l{e,a,i,o,u,ú,í},d{da,ta,ba,li,di,u,e,ú},s{ie,gu,ga,ma,i,o,val,as},rcaj,loj,aori,h{oac,wic,tc,s}}|1:es{n{pe,ne,oci,ei,zi},c{l,go,la,gua,n,au,i{ár,sp,d,rt,pl,él,íl,f,b},r},r{wa,íte,éne,pe,ai,ñi,pu},l{le,rtza,ai,sfi,hi,érbo,pro,do},aud,sed,pos,i{p,er,ur,c,g,ol},matí}|3z:dices{en,r}|4ás:mpases|4ís:ises{n,mb}|4ós:oses{idi,ad}~0es:d,vid,s{me,re,bu,a},n{a{cl,fl,p,c},fi,o{d,i,n,cl,r},ge},rail,a,b,ch,inch,c|0s:e{cin,marin,en,c{ro,ápi,du,a},l{o,tro,a,va,e,de},er},star|1es:lord"
    },
    "adjectives": {
      "f": "0a:r,l,n,z|5a:ísimo{pt,ct,n}|5ia:rísimo|1a:úbito,e|5ológica:cólogo|2ana:án|2ina:ín~1a:o|1ísima:iejo|2ona:ón|1illa:paso|1ica:britano,mago|5ofílica:drófilo|6artarica:ártaro|5osofica:ósofo|4íaca:giaco|1ita:oreno|7ófita:ofítico|2esa:és|7ultiplaza:últiplo|3a:bito~1:a{r{ime,rce,o{d,t,s,ñ}},uen,ñol,ial,uz}|1o:a{odor,n{ari{m,s},to,cro,fo},es{il,ru,r,p,i,b},fob,omb}|1ísimo:mena,octa,brupta|3án:ana{em,lm,rdi,tal}|3ín:ina{ar,lorqu}|3ón:tona{e,u}|2ísimo:umaria|7ólogo:usicológica|1e:onota~1illa:pino"
    },
    "presentTense": {
      "first": "2o:r{berra,gua,cua,e,etende,i}|5uerzo:orcer|2go:ner,alir|3jo:ger,gir|4iero:erer|5ierto:erter|4ito:etir|4imo:emir|3zco:cir|4igo:ecir|3zo:rcir|4ido:edir|3o:guir|5igo:eguir|3ero:irir|4ibo:ebir|3uyo:üir|2igo:ír|3ío:eír~2o:r{a,venda,redi,treve}|3zco:cer|5uelco:olcar|4ijo:egir|5quepo:caber|5iento:r{enti,enta{as,l,c,ev}}|5uento:contar|5uesto:ostar|5iesto:festar|5isto:estir|5ierto:r{erti,erta{p,c}}|5uelto:soltar|4ieto:apretar|4uebo:probar|4íbo:ohibir|6uestro:ostrar|6uentro:ontrar|5ierro:errar|5iebro:uebrar|6iembro:embrar|4iero:erir|4üero:gorar|4uero:orir|2igo:aer|2go:enir,aler|4iego:egar{n,fr,pl,c}|3go:acer{f,h}|5uelgo:olgar|3zo:cer{n,r}|5ienzo:enzar|5üenzo:onzar|5uerzo:orzar|4iezo:pezar|4uezo:cocer|4ízo:aizar|3úo:uar|5iendo:r{enda,ende{c,t,ef}}|5indo:endir|5uerdo:order,cordar|5ierdo:erder|4uedo:oder,rodar|5ueldo:oldar|5uermo:ormir|4ieso:esar{nf,v}|5ienso:epensar|4úso:husar|3ío:iar{u,f,r,nv,sv,vac,roc,pl,sp,xp,s}|2yo:uir|4uelo:r{ole,ola{v,s}}|6iemblo:emblar|5ueblo:poblar|5íslo:aislar|1o:ver|4iño:eñir|4ueño:oñar|5ierno:ernir,obernar|4ueno:sonar|4úno:aunar,eunir|5uelvo:olver|5iervo:hervir|5irvo:ervir|4uevo:over,enovar|4ievo:nevar|4é:aber|4e:haber~3cir:uzco|2ger:jo{rote,emer,co}|2gir:jo{i{ir,er,x,fl},r,ru,n}|1ar:o{fij,orj,t{rien,trevis,uis,apar,i{im,vom,am,ip},ecu},rrib,cuestr,surr,mendig,anz,d{n{a,bri,ho,nu},que,ere,salu},aviv}|1er:o{omp,met,eb,orb,barr,corr,nd,ed,tem,com,epel,ose,ove,tañ,ro}|1ir:o{ump,scup,t{sis,xis,par,mi,dimi,ba,cu},ib,ub,r{uf,ur,ub,ab,ud},d{pan,cin,un,i{iv,ec,nc,s},ña,va,ua,cu,lu,lau},rim,exim,sum,ull,umpl,upl,ruñ,efin,viv}|3etir:ito{rr,p}|3ebir:ncibo|3rir:uiero|4erir:equiero|3ír:oigo|3ecir:digo|3eguir:sigo|2er:ngo{po,te}|1uir:ingo|2ir:salgo|5orcer:tuerzo|2cir:arzo|3edir:pido|3emir:gimo|2eír:nrío|3üir:guyo~2voy:ir|2oy:ser,dar,estar|5ienso:pensar|2o:r{uni,lati,e{le,cre,vend,ard,cos,lam,tej},funda,suma,posta}|4iero:querer|5yerro:errar|4ido:medir|3ego:jugar|5iento:entar{s,t}|4huelo:oler|4uego:rogar|4ielo:helar|3ío:r{reí{,f},alia}|4iego:regar|4uelo:soler|5ierto:verter",
      "second": "1s:r{a{berr,gu,cu,vend},etende}|4ieres:erer|5iertes:erter|2es:ir|5istes:estir|4iges:egir|4ides:edir|3eres:irir|4ienes:enir|4ibes:ebir|3uyes:üir~1s:r|5uelcas:olcar|5uestas:ostar|5iestas:festar|5ientas:entar{as,l,c,ev}|5uentas:contar|5iertas:ertar{p,c}|5ueltas:soltar|4ietas:apretar|6uestras:ostrar|6uentras:ontrar|5ierras:errar|5iebras:uebrar|6iembras:embrar|4üeras:gorar|4iegas:egar{n,fr,pl,c}|5uelgas:olgar|5ienzas:enzar|5üenzas:onzar|4iezas:pezar|5uerzas:orzar|4ízas:aizar|3úas:uar|4uevas:enovar|4ievas:nevar|5iendas:endar|5uerdas:cordar|4uedas:rodar|5ueldas:oldar|4iesas:esar{nf,v}|5iensas:epensar|4úsas:husar|3ías:iar{u,f,nv,sv,r,vac,roc,pl,sp,xp,s}|4uelas:olar{v,s}|6iemblas:emblar|5ueblas:poblar|5íslas:aislar|4ueñas:oñar|5iernas:obernar|4uenas:sonar|4únas:aunar|3s:haber|4uebas:probar|4íbes:ohibir|5ientes:entir|5iertes:ertir|4ites:etir|4ueces:cocer|5uerces:orcer|4ices:ecir|4ienes:ener|5iernes:ernir|4únes:eunir|4ieres:erir|4ueres:orir|4imes:emir|5uermes:ormir|5iendes:ender{c,t,ef}|5indes:endir|4uedes:oder|2es:redir,guir|5ierdes:erder|5uerdes:order|2yes:ír,uir|3íes:eír|5igues:eguir|5uelves:olver|5irves:ervir|5ierves:hervir|4ueves:over|4iñes:eñir|4ueles:oler|2és:prever~1r:s{cuestra,cha,e{et,on,arr,orr,eg,emerg,og,d{en,on,e,r},omp,el,val}}|2ir:es{ib,ub,t,mit,uc,arc,n,r,rim,xim,um,g,d,cind,p,iv,uñ,l}|4ebir:ncibes|5estir:vistes|5enir:vienes|4rir:uieres|5erir:equieres|4egir:iges{rr,el}|4edir:ides{p,m}|4üir:guyes~2vas:ir|3eres:ser|4iges:regir|5iensas:pensar|4ieres:querer|5yerras:errar|3egas:jugar|5ientas:entar{s,t}|4hueles:oler|4uegas:rogar|4ielas:helar|4iegas:regar|2ás:estar|5iertes:verter|1s:postar|3ías:aliar",
      "third": "1:r{,a{berr,gu,cu,vend},etende}|4iere:erer|5ierte:erter|5iste:estir|4ime:emir|4ige:egir|4ide:edir|2e:guir|3ere:irir|4iene:enir|4ibe:ebir|3uye:üir~5uelca:olcar|5uesta:ostar|5iesta:festar|5ienta:entar{as,l,c,ev}|5uenta:contar|5ierta:ertar{p,c}|5uelta:soltar|4ieta:apretar|6uestra:ostrar|6uentra:ontrar|5ierra:errar|5iebra:uebrar|6iembra:embrar|4üera:gorar|4iega:egar{n,fr,pl,c}|5uelga:olgar|5ienza:enzar|5üenza:onzar|4ieza:pezar|5uerza:orzar|4íza:aizar|3úa:uar|4ueva:enovar|4ieva:nevar|5ienda:endar|5uerda:cordar|4ueda:rodar|5uelda:oldar|4iesa:esar{nf,v}|5iensa:epensar|4úsa:husar|3ía:iar{u,f,nv,sv,r,vac,roc,pl,sp,xp,s}|4uela:olar{v,s}|6iembla:emblar|5uebla:poblar|5ísla:aislar|4ueña:oñar|5ierna:obernar|4uena:sonar|4úna:aunar|3:haber|4ueba:probar|2e:ir,redir|4íbe:ohibir|5iente:entir|5ierte:ertir|4ite:etir|4uece:cocer|5uerce:orcer|4ice:ecir|4iene:ener|5ierne:ernir|4úne:eunir|5uerme:ormir|5iende:ender{c,t,ef}|5inde:endir|4uede:oder|5ierde:erder|5uerde:order|2ye:ír,uir|4iere:erir|4uere:orir|3íe:eír|5igue:eguir|5uelve:olver|5irve:ervir|5ierve:hervir|4ueve:over|4iñe:eñir|4uele:oler|2é:prever~0r:a,cuestra,cha,e{eb,ab,rb,et,c,on,em,om,am,eg,emerg,og,d{en,on,e,r},arr,orr,omp,ev,añ,a,el,val,e,s,o,j}|3ebir:ncibe|1ir:e{mit,uc,arc,cind}|4estir:viste|4enir:viene|3emir:gime|3egir:ige{rr,el}|3edir:ide{p,m}|3üir:guye|3rir:uiere|4erir:equiere~2va:ir|3es:ser|4ige:regir|5iensa:pensar|4iere:querer|5yerra:errar|3ega:jugar|5ienta:entar{s,t}|4huele:oler|4uega:rogar|4iela:helar|4iega:regar|2á:estar|1:ver,postar|5ierte:verter|3ía:aliar",
      "firstPlural": "~1mos:r|4emos:haber~~2vamos:ir|2omos:ser",
      "secondPlural": "1s:r~2áis:ar|2éis:er|2ís:ir~1r:eís,oís~2vais:ir|2ois:ser|1is:dar,ver",
      "thirdPlural": "1n:r{a{berr,gu,cu,vend},etende}|4ieren:erer|5ierten:erter|2en:ir|5isten:estir|4igen:egir|4iden:edir|3eren:irir|4ienen:enir|4iben:ebir|3uyen:üir~1n:r|5uelcan:olcar|5uestan:ostar|5iestan:festar|5ientan:entar{as,l,c,ev}|5uentan:contar|5iertan:ertar{p,c}|5ueltan:soltar|4ietan:apretar|6uestran:ostrar|6uentran:ontrar|5ierran:errar|5iebran:uebrar|6iembran:embrar|4üeran:gorar|4iegan:egar{n,fr,pl,c}|5uelgan:olgar|5ienzan:enzar|5üenzan:onzar|4iezan:pezar|5uerzan:orzar|4ízan:aizar|3úan:uar|4uevan:enovar|4ievan:nevar|5iendan:endar|5uerdan:cordar|4uedan:rodar|5ueldan:oldar|4iesan:esar{nf,v}|5iensan:epensar|4úsan:husar|3ían:iar{u,f,nv,sv,r,vac,roc,pl,sp,xp,s}|4uelan:olar{v,s}|6iemblan:emblar|5ueblan:poblar|5íslan:aislar|4ueñan:oñar|5iernan:obernar|4uenan:sonar|4únan:aunar|3n:haber|4ueban:probar|4íben:ohibir|5ienten:entir|5ierten:ertir|4iten:etir|4uecen:cocer|5uercen:orcer|4icen:ecir|4ienen:ener|5iernen:ernir|4únen:eunir|4imen:emir|5uermen:ormir|5ienden:ender{c,t,ef}|5inden:endir|4ueden:oder|2en:redir,guir|5ierden:erder|5uerden:order|2yen:ír,uir|4ieren:erir|4ueren:orir|3íen:eír|5iguen:eguir|5uelven:olver|5irven:ervir|5ierven:hervir|4ueven:over|4iñen:eñir|4uelen:oler|2én:prever~1r:n{cuestra,cha,e{et,on,eg,emerg,og,d{en,on,e,r},arr,orr,omp,el,val}}|2ir:en{ib,ub,t,mit,uc,arc,n,rim,xim,um,g,d,cind,r,p,iv,uñ,l}|4ebir:nciben|5estir:visten|5enir:vienen|4egir:igen{rr,el}|4edir:iden{p,m}|4üir:guyen|4rir:uieren|5erir:equieren~2van:ir|2on:ser|4igen:regir|5iensan:pensar|4ieren:querer|5yerran:errar|3egan:jugar|5ientan:entar{s,t}|4huelen:oler|4uegan:rogar|4ielan:helar|4iegan:regar|2án:estar|5ierten:verter|1n:postar|3ían:aliar"
    },
    "pastTense": {
      "first": "1:r|2í:er|3fui:ser~2é:ar|3qué:car|2ué:gar|3cé:zar|3üé:guar|2í:ir,oser|4use:oner|4ise:erer|4uve:ener|3je:cir|2je:raer|4ije:ecir|4ice:acer{f,h}|4ine:enir|4ude:oder|4upe:aber|2e:guiar|4ube:haber~1er:í{eb,met,c,em,om,teg,og,ced,nd,rd,rr,p,cre,le,v,añ,ol,val,a}|1ir:urrí,rví,iví|0r:eí,oí~2fui:ir|2uve:andar,estar|2i:dar,ver",
      "second": "2iste:er|3fuiste:ser|4udiste:oder~1ste:r|4ubiste:haber|4iciste:acer{f,h}|4usiste:oner|4isiste:erer|2iste:oser|4uviste:ener|3jiste:cir|2jiste:aer|4ijiste:ecir|4upiste:aber|4iniste:enir|2íste:eer,caer~4er:ste{i{eb,met,c,v,em,om,teg,og,ced,nd,rd,rr,p,añ,ol,val},creí}|3r:ste{rvi,ivi,urri,reí}|6oder:pudiste~2fuiste:ir|2uviste:andar,estar|2iste:dar",
      "third": "1ó:r|3fue:ser|2ió:oser|2ó:ñer,ñir,llir|2yó:ír|3ió:eír~2ó:ar|2ió:er|5intió:entir|5irtió:ertir|4itió:etir|5istió:estir|4idió:edir|5urmió:ormir|4igió:egir|1ó:guir|5iguió:eguir|4irió:erir|4urió:orir|5irvió:ervir|2yó:uir,eer,caer|4iñó:eñir|4uso:oner|4iso:erer|4uvo:ener|3jo:cir|2jo:aer|4ijo:ecir|4izo:acer{f,h}|2o:iar{cr,gu}|4ino:enir|4udo:oder|4upo:aber|4ubo:haber~1r:ió{ib,ub,t{r,mi,sis,a},cid,ud,ad,im,um,g{iri,xi,fli,r,n},ufr,urr,br,iv,n,sal,pl}|1ar:ió{c{un,va,pre,vor,o,i,u},od,tud,u,f,ar,p,nv,liv}|2er:ió{noc,rr,omp}|2eír:rió|1ir:ulló,uñó|1er:tañó~2fue:ir|2uvo:andar,estar|2yó:oír|2io:dar,ver|3io:reír",
      "firstPlural": "2imos:er|3fuimos:ser|4udimos:oder~1mos:r|4ubimos:haber|4icimos:acer{f,h}|4usimos:oner|4isimos:erer|2imos:oser|4uvimos:ener|3jimos:cir|2jimos:aer|4ijimos:ecir|4upimos:aber|4inimos:enir|2ímos:eer,caer~4er:mos{i{eb,met,c,v,em,om,teg,og,ced,nd,rd,rr,p,añ,ol,val},creí}|3r:mos{rvi,ivi,urri,reí}|6oder:pudimos~2fuimos:ir|2uvimos:andar,estar|2imos:dar",
      "secondPlural": "2isteis:er|3fuisteis:ser|4udisteis:oder~1steis:r|4ubisteis:haber|4icisteis:acer{f,h}|4usisteis:oner|4isisteis:erer|2isteis:oser|4uvisteis:ener|3jisteis:cir|2jisteis:aer|4ijisteis:ecir|4upisteis:aber|4inisteis:enir|2ísteis:eer,caer~6er:steis{i{eb,met,c,v,em,om,teg,og,ced,nd,rd,rr,p,añ,ol,val},creí}|5r:steis{rvi,ivi,urri,reí}|8oder:pudisteis~2fuisteis:ir|2uvisteis:andar,estar|2isteis:dar",
      "thirdPlural": "3fueron:ser|2ieron:oser|0on:ñer|1eron:ir|3ieron:eír~0on:r|2ieron:er|4ubieron:haber|5intieron:entir|5irtieron:ertir|4itieron:etir|5istieron:estir|4icieron:acer{f,h}|4usieron:oner|4isieron:erer|4uvieron:ener|5irvieron:ervir|5urmieron:ormir|4igieron:egir|4idieron:edir|4udieron:oder|4irieron:erir|4urieron:orir|4upieron:aber|4inieron:enir|1eron:guir|5iguieron:eguir|3jeron:cir|2jeron:aer|4ijeron:ecir|2yeron:r{í,ui,ee,cae}|2eron:ñir,llir|4iñeron:eñir~4r:ieron{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|5eír:rieron|5er:rrieron|2:añeron~2fueron:ir|2uvieron:andar,estar|2ieron:dar"
    },
    "imperfectTense": {
      "first": "2ía:er|1a:ír~1ba:r|2ía:ir~2er:ía{b,met,c,adec,bedec,on,ten,tem,om,am,teg,emerg,og,d{ce,en,on,o,r},rr,omp,e,cre,v,añ,o,a,ol,val,el,s,j}|2ir:ía{ceb,ib,ub,c{de,trade,u,ar},urr,rv,iv}|1r:reía~1ba:ir|3era:ser|2ía:querer,verter,rendir|1a:oír|1ía:ver",
      "second": "2ías:er|1as:ír~1bas:r|2ías:ir~3er:ías{b,met,c,adec,bedec,on,ten,tem,om,am,teg,emerg,og,d{ce,en,on,o,r},rr,omp,e,cre,v,añ,o,a,ol,val,el,s,j}|3ir:ías{ceb,ib,ub,c{de,trade,u,ar},urr,rv,iv}|2r:reías~1bas:ir|3eras:ser|2ías:querer,verter,rendir|1as:oír|1ías:ver",
      "third": "2ía:er|1a:ír~1ba:r|2ía:ir~2er:ía{b,met,c,adec,bedec,on,ten,tem,om,am,teg,emerg,og,d{ce,en,on,o,r},rr,omp,e,cre,v,añ,o,a,ol,val,el,s,j}|2ir:ía{ceb,ib,ub,c{de,trade,u,ar},urr,rv,iv}|1r:reía~1ba:ir|3era:ser|2ía:querer,verter,rendir|1a:oír|1ía:ver",
      "firstPlural": "1amos:r|2íamos:er~2ábamos:ar|2íamos:ir~5er:íamos{b,met,c,adec,bedec,on,ten,tem,om,am,teg,emerg,og,d{ce,en,on,o,r},rr,omp,e,cre,v,añ,o,a,ol,val,el,s,j}|5ir:íamos{ceb,ib,ub,c{de,trade,u,ar},urr,rv,iv}|4r:reíamos~2íbamos:ir|3éramos:ser|2íamos:querer,verter,rendir|1amos:oír|1íamos:ver",
      "secondPlural": "2íais:er|1ais:ír~1bais:r|2íais:ir~4er:íais{b,met,c,adec,bedec,on,ten,tem,om,am,teg,emerg,og,d{ce,en,on,o,r},rr,omp,e,cre,v,añ,o,a,ol,val,el,s,j}|4ir:íais{ceb,ib,ub,c{de,trade,u,ar},urr,rv,iv}|3r:reíais~1bais:ir|3erais:ser|2íais:querer,verter,rendir|1ais:oír|1íais:ver",
      "thirdPlural": "2ían:er|1an:ír~1ban:r|2ían:ir~3er:ían{b,met,c,adec,bedec,on,ten,tem,om,am,teg,emerg,og,d{ce,en,on,o,r},rr,omp,e,cre,v,añ,o,a,ol,val,el,s,j}|3ir:ían{ceb,ib,ub,c{de,trade,u,ar},urr,rv,iv}|2r:reían~1ban:ir|3eran:ser|2ían:querer,verter,rendir|1an:oír|1ían:ver"
    },
    "futureTense": {
      "first": "2dré:enir,alir|2iré:ír~0é:r|3ré:acer{f,h}|2dré:ner,aler|2ré:er{od,er,ab}~1:aré{nf,ch}|3ír:iré{e,o}|3ir:dré{ven,sal}~4iré:decir",
      "second": "2drás:enir,alir|2irás:ír~0ás:r|3rás:acer{f,h}|2drás:ner,aler|2rás:er{od,er,ab}~2:arás{nf,ch}|4ír:irás{e,o}|4ir:drás{ven,sal}~4irás:decir",
      "third": "2drá:enir,alir|2irá:ír~0á:r|3rá:acer{f,h}|2drá:ner,aler|2rá:er{od,er,ab}~1:ará{nf,ch}|3ír:irá{e,o}|3ir:drá{ven,sal}~4irá:decir",
      "firstPlural": "2dremos:enir,alir|2iremos:ír~0emos:r|3remos:acer{f,h}|2dremos:ner,aler|2remos:er{od,er,ab}~4:aremos{nf,ch}|6ír:iremos{e,o}|6ir:dremos{ven,sal}~4iremos:decir",
      "secondPlural": "2dréis:enir,alir|2iréis:ír~0éis:r|3réis:acer{f,h}|2dréis:ner,aler|2réis:er{od,er,ab}~3:aréis{nf,ch}|5ír:iréis{e,o}|5ir:dréis{ven,sal}~4iréis:decir",
      "thirdPlural": "2drán:enir,alir|2irán:ír~0án:r|3rán:acer{f,h}|2drán:ner,aler|2rán:er{od,er,ab}~2:arán{nf,ch}|4ír:irán{e,o}|4ir:drán{ven,sal}~4irán:decir"
    },
    "conditional": {
      "first": "2dría:enir,alir|2iría:ír~0ía:r|3ría:acer{f,h}|2dría:ner,aler|2ría:er{od,er,ab}~2:aría{nf,ch}|4ír:iría{e,o}|4ir:dría{ven,sal}~4iría:decir",
      "second": "2drías:enir,alir|2irías:ír~0ías:r|3rías:acer{f,h}|2drías:ner,aler|2rías:er{od,er,ab}~3:arías{nf,ch}|5ír:irías{e,o}|5ir:drías{ven,sal}~4irías:decir",
      "third": "2dría:enir,alir|2iría:ír~0ía:r|3ría:acer{f,h}|2dría:ner,aler|2ría:er{od,er,ab}~2:aría{nf,ch}|4ír:iría{e,o}|4ir:dría{ven,sal}~4iría:decir",
      "firstPlural": "2dríamos:enir,alir|2iríamos:ír~0íamos:r|3ríamos:acer{f,h}|2dríamos:ner,aler|2ríamos:er{od,er,ab}~5:aríamos{nf,ch}|7ír:iríamos{e,o}|7ir:dríamos{ven,sal}~4iríamos:decir",
      "secondPlural": "2dríais:enir,alir|2iríais:ír~0íais:r|3ríais:acer{f,h}|2dríais:ner,aler|2ríais:er{od,er,ab}~4:aríais{nf,ch}|6ír:iríais{e,o}|6ir:dríais{ven,sal}~4iríais:decir",
      "thirdPlural": "2drían:enir,alir|2irían:ír~0ían:r|3rían:acer{f,h}|2drían:ner,aler|2rían:er{od,er,ab}~3:arían{nf,ch}|5ír:irían{e,o}|5ir:drían{ven,sal}~4irían:decir"
    },
    "subjunctive": {
      "first": "2a:er|2ga:ner,ler|3ja:ger|4iera:erer|2e:cuar|3era:irir|3zca:cir|4iga:ecir|2iga:ír~2a:ir,trever|3zca:cer|2ya:uir|3ya:haber|3a:guir|3ga:acer{f,h}|2ga:enir,alir|5iga:eguir|2iga:aer|4ita:etir|5ienta:entir|5ista:estir|5ierta:ertir|5uerma:ormir|4ueda:oder|5ienda:ender{c,t,ef}|4ida:edir|5ierda:erder|4iera:erir|4uera:orir|3ja:gir|4ija:egir|4iña:eñir|5uelva:olver|5irva:ervir|5ierva:hervir|4ueva:over|4epa:aber|5quepa:caber|1a:ver|4uela:oler|3ía:eír|4íba:ohibir|3za:cer{r,n}|5uerza:orcer|2e:ar|2ue:gar|5uelgue:olgar|4iegue:egar{n,c}|4uegue:ogar|3que:car|5ueste:ostar|5iente:lentar|5uente:contar|5ierte:ertar|4iete:apretar|6uestre:ostrar|6uentre:ontrar|5ierre:errar|4üere:gorar|5iebre:uebrar|3ce:zar|4iece:pezar|5uerce:orzar|5ience:enzar|5uerde:cordar|5iende:endar|4ueve:ovar|4ieve:nevar|4ueñe:oñar|3íe:iar{r,u,ac,f,nv}|5ierne:ernar|4uene:sonar|4uele:olar{v,s}|5iense:ensar|4úse:husar|4iese:esar{v,f}|3úe:uar|4uebe:probar|3üe:guar~3cir:uzca|2er:ga{ten,on,val}|3ecir:diga|3ír:oiga|1ir:a{mit,sist,cid,urr}|1er:a{et,om,em,ed,nd,rr,añ,p,e,s,eb}|3rir:uiera|4erir:equiera|2gir:ija{ir,fl,x}|2ger:eja,oja~5iente:sentar|5yerre:errar|4huela:oler|2é:estar,dar|4iele:helar|4iegue:regar|1a:ser|2vaya:ir|3egue:jugar|4iera:querer",
      "second": "2as:er|2gas:ner,ler|3jas:ger|4ieras:erer|2es:cuar|3eras:irir|3zcas:cir|4igas:ecir|2igas:ír~2as:ir,trever|3zcas:cer|2yas:uir|3yas:haber|3as:guir|3gas:acer{f,h}|2gas:enir,alir|5igas:eguir|2igas:aer|4itas:etir|5ientas:entir|5istas:estir|5iertas:ertir|5uermas:ormir|4uedas:oder|5iendas:ender{c,t,ef}|4idas:edir|5ierdas:erder|4ieras:erir|4ueras:orir|3jas:gir|4ijas:egir|4iñas:eñir|5uelvas:olver|5irvas:ervir|5iervas:hervir|4uevas:over|4epas:aber|5quepas:caber|1as:ver|4uelas:oler|3ías:eír|4íbas:ohibir|3zas:cer{r,n}|5uerzas:orcer|2es:ar|2ues:gar|5uelgues:olgar|4iegues:egar{n,c}|4uegues:ogar|3ques:car|5uestes:ostar|5ientes:lentar|5uentes:contar|5iertes:ertar|4ietes:apretar|6uestres:ostrar|6uentres:ontrar|5ierres:errar|4üeres:gorar|5iebres:uebrar|3ces:zar|4ieces:pezar|5uerces:orzar|5iences:enzar|5uerdes:cordar|5iendes:endar|4ueves:ovar|4ieves:nevar|4ueñes:oñar|3íes:iar{r,u,ac,f,nv}|5iernes:ernar|4uenes:sonar|4ueles:olar{v,s}|5ienses:ensar|4úses:husar|4ieses:esar{v,f}|3úes:uar|4uebes:probar|3ües:guar~4cir:uzcas|3er:gas{ten,on,val}|4ecir:digas|4ír:oigas|2ir:as{mit,sist,cid,urr}|2er:as{et,om,em,ed,nd,rr,añ,p,e,s,eb}|4rir:uieras|5erir:equieras|3gir:ijas{ir,fl,x}|3ger:jas{e,o}~5ientes:sentar|5yerres:errar|4huelas:oler|2és:estar|4ieles:helar|4iegues:regar|1as:ser|2vayas:ir|3egues:jugar|4ieras:querer",
      "third": "2a:er|2ga:ner,ler|3ja:ger|4iera:erer|2e:cuar|3era:irir|3zca:cir|4iga:ecir|2iga:ír~2a:ir,trever|3zca:cer|2ya:uir|3ya:haber|3a:guir|3ga:acer{f,h}|2ga:enir,alir|5iga:eguir|2iga:aer|4ita:etir|5ienta:entir|5ista:estir|5ierta:ertir|5uerma:ormir|4ueda:oder|5ienda:ender{c,t,ef}|4ida:edir|5ierda:erder|4iera:erir|4uera:orir|3ja:gir|4ija:egir|4iña:eñir|5uelva:olver|5irva:ervir|5ierva:hervir|4ueva:over|4epa:aber|5quepa:caber|1a:ver|4uela:oler|3ía:eír|4íba:ohibir|3za:cer{r,n}|5uerza:orcer|2e:ar|2ue:gar|5uelgue:olgar|4iegue:egar{n,c}|4uegue:ogar|3que:car|5ueste:ostar|5iente:lentar|5uente:contar|5ierte:ertar|4iete:apretar|6uestre:ostrar|6uentre:ontrar|5ierre:errar|4üere:gorar|5iebre:uebrar|3ce:zar|4iece:pezar|5uerce:orzar|5ience:enzar|5uerde:cordar|5iende:endar|4ueve:ovar|4ieve:nevar|4ueñe:oñar|3íe:iar{r,u,ac,f,nv}|5ierne:ernar|4uene:sonar|4uele:olar{v,s}|5iense:ensar|4úse:husar|4iese:esar{v,f}|3úe:uar|4uebe:probar|3üe:guar~3cir:uzca|2er:ga{ten,on,val}|3ecir:diga|3ír:oiga|1ir:a{mit,sist,cid,urr}|1er:a{et,om,em,ed,nd,rr,añ,p,e,s,eb}|3rir:uiera|4erir:equiera|2gir:ija{ir,fl,x}|2ger:eja,oja~5iente:sentar|5yerre:errar|4huela:oler|2é:estar,dar|4iele:helar|4iegue:regar|1a:ser|2vaya:ir|3egue:jugar|4iera:querer",
      "firstPlural": "2gamos:ner,alir|3jamos:ger|2amos:ir|3zcamos:cir|4igamos:ecir|2igamos:ír~2amos:er|3zcamos:cer|2yamos:uir|3yamos:haber|3amos:guir|3gamos:acer{f,h}|2gamos:enir,aler|5igamos:eguir|2igamos:aer|4itamos:etir|5intamos:entir|5istamos:estir|5irtamos:ertir|5urmamos:ormir|4idamos:edir|4iramos:erir|4uramos:orir|3jamos:gir|4ijamos:egir|4iñamos:eñir|5irvamos:ervir|4epamos:aber|5quepamos:caber|1amos:prever|3iamos:eír|3zamos:cer{r,n}|2emos:ar|2uemos:gar|3quemos:car|3cemos:zar|3üemos:guar~6cir:uzcamos|5er:ngamos{te,o}|6ecir:digamos|6ír:oigamos|5ir:salgamos|4ir:amos{t,mit,sist,um,im,cid,ad,ud,r{f,qui{d,n},b,ur},uñ,iv,l,b,n}|4er:amos{et,ol,eb}|5gir:ijamos{ir,fl,x}|5ger:jamos{e,o}~1amos:ver,ser|2vayamos:ir",
      "secondPlural": "2gáis:ner,alir|3jáis:ger|2éis:opezar|2áis:ir|3zcáis:cir|4igáis:ecir|2igáis:ír~2áis:er|3zcáis:cer|2yáis:uir|3yáis:haber|3áis:guir|3gáis:acer{f,h}|2gáis:enir,aler|5igáis:eguir|2igáis:aer|4itáis:etir|5intáis:entir|5istáis:estir|5irtáis:ertir|5urmáis:ormir|4idáis:edir|4iráis:erir|4uráis:orir|3jáis:gir|4ijáis:egir|4iñáis:eñir|5irváis:ervir|4epáis:aber|5quepáis:caber|1áis:prever|3iáis:eír|3záis:cer{r,n}|2éis:ar|2uéis:gar|3quéis:car|3céis:zar|3üéis:guar~5cir:uzcáis|4er:ngáis{te,o}|5ecir:digáis|5ír:oigáis|4ir:salgáis|3ir:áis{t,mit,sist,um,im,cid,ad,ud,r{f,qui{d,n},b,ur},uñ,iv,l,b,n}|3er:áis{et,ol,eb}|4gir:ijáis{ir,fl,x}|4ger:jáis{e,o}~2eis:dar|1áis:ver,ser|2vayáis:ir",
      "thirdPlural": "2an:er|2gan:ner,ler|3jan:ger|4ieran:erer|2en:cuar|3eran:irir|3zcan:cir|4igan:ecir|2igan:ír~2an:ir,trever|3zcan:cer|2yan:uir|3yan:haber|3an:guir|3gan:acer{f,h}|2gan:enir,alir|5igan:eguir|2igan:aer|4itan:etir|5ientan:entir|5istan:estir|5iertan:ertir|5uerman:ormir|4uedan:oder|5iendan:ender{c,t,ef}|4idan:edir|5ierdan:erder|4ieran:erir|4ueran:orir|3jan:gir|4ijan:egir|4iñan:eñir|5uelvan:olver|5irvan:ervir|5iervan:hervir|4uevan:over|4epan:aber|5quepan:caber|1an:ver|4uelan:oler|3ían:eír|4íban:ohibir|3zan:cer{r,n}|5uerzan:orcer|2en:ar|2uen:gar|5uelguen:olgar|4ieguen:egar{n,c}|4ueguen:ogar|3quen:car|5uesten:ostar|5ienten:lentar|5uenten:contar|5ierten:ertar|4ieten:apretar|6uestren:ostrar|6uentren:ontrar|5ierren:errar|4üeren:gorar|5iebren:uebrar|3cen:zar|4iecen:pezar|5uercen:orzar|5iencen:enzar|5uerden:cordar|5ienden:endar|4ueven:ovar|4ieven:nevar|4ueñen:oñar|3íen:iar{r,u,ac,f,nv}|5iernen:ernar|4uenen:sonar|4uelen:olar{v,s}|5iensen:ensar|4úsen:husar|4iesen:esar{v,f}|3úen:uar|4ueben:probar|3üen:guar~4cir:uzcan|3er:gan{ten,on,val}|4ecir:digan|4ír:oigan|2ir:an{mit,sist,cid,urr}|2er:an{et,om,em,ed,nd,rr,añ,p,e,s,eb}|4rir:uieran|5erir:equieran|3gir:ijan{ir,fl,x}|3ger:jan{e,o}~5ienten:sentar|5yerren:errar|4huelan:oler|2én:estar|4ielen:helar|4ieguen:regar|1an:ser|2vayan:ir|3eguen:jugar|4ieran:querer"
    },
    "imperfectSubjunctive": {
      "first": "3fuera:ser|2iera:oser|0a:ñer|1era:ir|3iera:eír~0a:r|2iera:er|4ubiera:haber|5intiera:entir|5irtiera:ertir|4itiera:etir|5istiera:estir|4iciera:acer{f,h}|4usiera:oner|4isiera:erer|4uviera:ener|5irviera:ervir|5urmiera:ormir|4igiera:egir|4idiera:edir|4udiera:oder|4iriera:erir|4uriera:orir|4upiera:aber|4iniera:enir|1era:guir|5iguiera:eguir|3jera:cir|2jera:aer|4ijera:ecir|2yera:r{í,ui,ee,cae}|2era:ñir,llir|4iñera:eñir~3r:iera{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|4eír:riera|4er:rriera|1:añera~2fuera:ir|2uviera:andar,estar|2iera:dar",
      "second": "3fueras:ser|2ieras:oser|0as:ñer|1eras:ir|3ieras:eír~0as:r|2ieras:er|4ubieras:haber|5intieras:entir|5irtieras:ertir|4itieras:etir|5istieras:estir|4icieras:acer{f,h}|4usieras:oner|4isieras:erer|4uvieras:ener|5irvieras:ervir|5urmieras:ormir|4igieras:egir|4idieras:edir|4udieras:oder|4irieras:erir|4urieras:orir|4upieras:aber|4inieras:enir|1eras:guir|5iguieras:eguir|3jeras:cir|2jeras:aer|4ijeras:ecir|2yeras:r{í,ui,ee,cae}|2eras:ñir,llir|4iñeras:eñir~4r:ieras{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|5eír:rieras|5er:rrieras|2:añeras~2fueras:ir|2uvieras:andar,estar|2ieras:dar",
      "third": "3fuera:ser|2iera:oser|0a:ñer|1era:ir|3iera:eír~0a:r|2iera:er|4ubiera:haber|5intiera:entir|5irtiera:ertir|4itiera:etir|5istiera:estir|4iciera:acer{f,h}|4usiera:oner|4isiera:erer|4uviera:ener|5irviera:ervir|5urmiera:ormir|4igiera:egir|4idiera:edir|4udiera:oder|4iriera:erir|4uriera:orir|4upiera:aber|4iniera:enir|1era:guir|5iguiera:eguir|3jera:cir|2jera:aer|4ijera:ecir|2yera:r{í,ui,ee,cae}|2era:ñir,llir|4iñera:eñir~3r:iera{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|4eír:riera|4er:rriera|1:añera~2fuera:ir|2uviera:andar,estar|2iera:dar",
      "firstPlural": "1éramos:r|3fuéramos:ser|2iéramos:oser|2éramos:ñer|3iéramos:eír~2áramos:ar|2iéramos:er|4ubiéramos:haber|5intiéramos:entir|5irtiéramos:ertir|4itiéramos:etir|5istiéramos:estir|4iciéramos:acer{f,h}|4usiéramos:oner|4isiéramos:erer|4uviéramos:ener|5irviéramos:ervir|5urmiéramos:ormir|4igiéramos:egir|4idiéramos:edir|4udiéramos:oder|4iriéramos:erir|4uriéramos:orir|4upiéramos:aber|4iniéramos:enir|1éramos:guir|5iguiéramos:eguir|3jéramos:cir|2jéramos:aer|4ijéramos:ecir|2yéramos:r{í,ui,ee,cae}|2éramos:ñir,llir|4iñéramos:eñir~6r:iéramos{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|7eír:riéramos|7er:rriéramos|6er:añéramos~2fuéramos:ir|2uviéramos:andar,estar|2iéramos:dar",
      "secondPlural": "3fuerais:ser|2ierais:oser|0ais:ñer|1erais:ir|3ierais:eír~0ais:r|2ierais:er|4ubierais:haber|5intierais:entir|5irtierais:ertir|4itierais:etir|5istierais:estir|4icierais:acer{f,h}|4usierais:oner|4isierais:erer|4uvierais:ener|5irvierais:ervir|5urmierais:ormir|4igierais:egir|4idierais:edir|4udierais:oder|4irierais:erir|4urierais:orir|4upierais:aber|4inierais:enir|1erais:guir|5iguierais:eguir|3jerais:cir|2jerais:aer|4ijerais:ecir|2yerais:r{í,ui,ee,cae}|2erais:ñir,llir|4iñerais:eñir~5r:ierais{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|6eír:rierais|6er:rrierais|3:añerais~2fuerais:ir|2uvierais:andar,estar|2ierais:dar",
      "thirdPlural": "3fueran:ser|2ieran:oser|0an:ñer|1eran:ir|3ieran:eír~0an:r|2ieran:er|4ubieran:haber|5intieran:entir|5irtieran:ertir|4itieran:etir|5istieran:estir|4icieran:acer{f,h}|4usieran:oner|4isieran:erer|4uvieran:ener|5irvieran:ervir|5urmieran:ormir|4igieran:egir|4idieran:edir|4udieran:oder|4irieran:erir|4urieran:orir|4upieran:aber|4inieran:enir|1eran:guir|5iguieran:eguir|3jeran:cir|2jeran:aer|4ijeran:ecir|2yeran:r{í,ui,ee,cae}|2eran:ñir,llir|4iñeran:eñir~4r:ieran{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|5eír:rieran|5er:rrieran|2:añeran~2fueran:ir|2uvieran:andar,estar|2ieran:dar"
    },
    "imperative": {
      "first": "~~~",
      "second": "1:r,cuar,guar|4én:ener|4iere:erer|2ve:ir|2e:cir~4ice:ecir|5uerce:orcer|2ye:ír,uir|2e:ir{t,d,r,ñ,m,v,g,l,gu,b,n}|4ite:etir|5iente:entir|5iste:estir|5ierte:ertir|4uede:oder|5iende:ender{t,c,ef}|4ide:edir|5ierde:erder|4iere:erir|4uere:orir|4iñe:eñir|5uerme:ormir|5uelve:olver|5irve:ervir|5ierve:hervir|4ueve:over|4ige:egir|4uele:oler|5igue:eguir|3íe:eír|4íbe:ohibir|4e:haber|4iega:negar|4uega:ogar|5uelga:olgar|5uesta:ostar|5ienta:lentar|5uenta:contar|5ierta:ertar|4ieta:apretar|5ierra:errar|6uestra:ostrar|6uentra:ontrar|4üera:gorar|5iebra:uebrar|4ieza:pezar|5uerza:orzar|5ienza:enzar|4ueva:ovar|4ieva:nevar|4ueña:oñar|5uerda:cordar|5ienda:endar|3ía:iar{u,r,f,ac,nv}|5ierna:ernar|4uena:sonar|4uela:volar|5iensa:ensar|4úsa:husar|4iesa:esar{v,f}|3úa:uar|4ueba:probar|4ón:oner|4én:enir|3z:acer{h,f}|2é:ever|2:alir~0r:e{,et,ed,nd,arr,orr,añ,em,om,og,eg,al,ab,eb},a|1ir:e{uc,mit,sist,cid,ig{ir,fl,x}}|2ener:tén~2:tener,poner,venir|4huele:oler|4i:decir|2á:estar|4iela:helar|1:ver|4iega:regar|4iere:querer|5ienta:sentar|2é:ser|5yerra:errar|3ega:jugar",
      "secondPlural": "~1d:r~~",
      "firstPlural": "~~~",
      "third": "2a:er|2ga:ner,ler|4iera:erer|3ja:ger|2e:cuar|3zca:cir|4iga:ecir|2iga:ír~2a:ir|3zca:cer|2ya:uir|3ya:haber|4epa:aber|5quepa:caber|4ita:etir|5ienta:entir|5ista:estir|5ierta:ertir|4ueda:oder|5ienda:ender{t,c,ef}|4ida:edir|5ierda:erder|4iera:erir|4uera:orir|4iña:eñir|5uerma:ormir|5uelva:olver|5irva:ervir|5ierva:hervir|4ueva:over|3a:guir|2ga:enir,alir|3ga:acer{h,f}|5iga:eguir|2iga:aer|1a:ver|3ja:gir|4ija:egir|4uela:oler|3ía:eír|4íba:ohibir|3za:cer{r,n}|5uerza:orcer|2e:ar|2ue:gar|4iegue:negar|4uegue:ogar|5uelgue:olgar|3que:car|5ueste:ostar|5iente:lentar|5uente:contar|5ierte:ertar|4iete:apretar|5ierre:errar|6uestre:ostrar|6uentre:ontrar|4üere:gorar|5iebre:uebrar|3ce:zar|4iece:pezar|5uerce:orzar|5ience:enzar|4ueve:ovar|4ieve:nevar|4ueñe:oñar|5uerde:cordar|5iende:endar|3íe:iar{u,r,f,ac,nv}|5ierne:ernar|4uene:sonar|4uele:volar|5iense:ensar|4úse:husar|4iese:esar{v,f}|3úe:uar|4uebe:probar|3üe:guar~3cir:uzca|1er:a{p,et,ed,nd,rr,añ,em,om,e,s,eb}|1ir:a{mit,sist,cid,urr}|2er:ga{ten,on,val}|3ecir:diga|3ír:oiga|2gir:ija{ir,fl,x}|2ger:oja,eja~4huela:oler|2é:estar,dar|4iele:helar|4iegue:regar|4iera:querer|5iente:sentar|1a:ser|5yerre:errar|2vaya:ir|3egue:jugar",
      "thirdPlural": "2an:er|2gan:ner,ler|4ieran:erer|3jan:ger|2en:cuar|3zcan:cir|4igan:ecir|2igan:ír~2an:ir|3zcan:cer|2yan:uir|3yan:haber|4epan:aber|5quepan:caber|4itan:etir|5ientan:entir|5istan:estir|5iertan:ertir|4uedan:oder|5iendan:ender{t,c,ef}|4idan:edir|5ierdan:erder|4ieran:erir|4ueran:orir|4iñan:eñir|5uerman:ormir|5uelvan:olver|5irvan:ervir|5iervan:hervir|4uevan:over|3an:guir|2gan:enir,alir|3gan:acer{h,f}|5igan:eguir|2igan:aer|1an:ver|3jan:gir|4ijan:egir|4uelan:oler|3ían:eír|4íban:ohibir|3zan:cer{r,n}|5uerzan:orcer|2en:ar|2uen:gar|4ieguen:negar|4ueguen:ogar|5uelguen:olgar|3quen:car|5uesten:ostar|5ienten:lentar|5uenten:contar|5ierten:ertar|4ieten:apretar|5ierren:errar|6uestren:ostrar|6uentren:ontrar|4üeren:gorar|5iebren:uebrar|3cen:zar|4iecen:pezar|5uercen:orzar|5iencen:enzar|4ueven:ovar|4ieven:nevar|4ueñen:oñar|5uerden:cordar|5ienden:endar|3íen:iar{u,r,f,ac,nv}|5iernen:ernar|4uenen:sonar|4uelen:volar|5iensen:ensar|4úsen:husar|4iesen:esar{v,f}|3úen:uar|4ueben:probar|3üen:guar~4cir:uzcan|2er:an{p,et,ed,nd,rr,añ,em,om,e,s,eb}|2ir:an{mit,sist,cid,urr}|3er:gan{ten,on,val}|4ecir:digan|4ír:oigan|3gir:ijan{ir,fl,x}|3ger:jan{o,e}~4huelan:oler|2én:estar|4ielen:helar|4ieguen:regar|4ieran:querer|5ienten:sentar|1an:ser|5yerren:errar|2vayan:ir|3eguen:jugar"
    },
    "gerunds": {
      "gerunds": "2yendo:oer|1ndo:ñer|1endo:ir|4ibiendo:ebir|3uyendo:üir|3iendo:eír~1ndo:r|2iendo:er|4iniendo:enir|5istiendo:estir|5irtiendo:ertir|4itiendo:etir|5intiendo:entir|4iciendo:ecir|1endo:ir{gu,qu,red}|5iguiendo:eguir|5indiendo:endir|4udiendo:poder|4idiendo:edir|4igiendo:egir|5urmiendo:ormir|5irviendo:ervir|4iriendo:erir|4uriendo:orir|5udriendo:odrir|2yendo:r{í,ui,ee,ae}|4iñendo:eñir|2endo:llir~4r:iendo{ib,ub,mb,un,fin,rn,t{,sis,xis,mi},uc,unc,arc,d{un,an,cin,u,a,ci,vi,si},g{i{ir,er,fl,x},n,ur,umer,u},l{sa,p,bo,u},im,um,iv,r{ur,qui{d,n},uf,b,t},as,p}|7ebir:ncibiendo|5er:endo{i{ert,et,er,rr,omp},roy}|5eír:riendo|6üir:guyendo~2yendo:ir"
    },
    "perfecto": {
      "perfecto": "2ido:er|0ado:t~1do:r,ndecir|2ído:eer,aer|4to:mper|4uesto:oner|2isto:prever|5uelto:olver|3to:ribir|3ito:freír|4uerto:orir|3ierto:brir|4echo:acer{f,h}|4icho:ecir~3:mitado|3er:ido{eb,ab,met,c,s,em,om,teg,og,d{ce,n,o,r},rr,ten,ev,ov,añ,ol,val}|2r:do{uci,urri,nreí}~2ido:querer|1do:reír|2isto:ver"
    }
  };

  // uncompress them
  Object.keys(model$1).forEach(k => {
    Object.keys(model$1[k]).forEach(form => {
      model$1[k][form] = uncompress(model$1[k][form]);
    });
  });

  const { gerunds } = model$1;
  // =-=-
  const m$3 = {
    fromGerund: reverse(gerunds.gerunds),
    toGerund: gerunds.gerunds,
  };

  const fromGerund = function (str) {
    return convert(str, m$3.fromGerund)
  };
  const toGerund$1 = function (str) {
    // 'acostarse' conjugates as 'acostar'
    str = str.replace(/([aeií]r)se$/, '$1');
    return convert(str, m$3.toGerund)
  };

  const { perfecto } = model$1;

  // =-=-
  const m$2 = {
    fromPerfecto: reverse(perfecto.perfecto),
    toPerfecto: perfecto.perfecto,
  };

  const fromPerfecto = function (str) {
    return convert(str, m$2.fromPerfecto)
  };
  const toPerfecto$1 = function (str) {
    // 'acostarse' conjugates as 'acostar'
    str = str.replace(/([aeií]r)se$/, '$1');
    return convert(str, m$2.toPerfecto)
  };

  // generate all reflexive forms of this verb
  const toReflexive$1 = function (str) {
    return {
      first: str + 'me',
      firstPlural: str + 'nos',
      second: str + 'te',
      secondPlural: str + 'os',
      third: str + 'se',
      thirdPlural: str + 'se'
    }
  };

  const stripReflexive$3 = function (str) {
    str = str.replace(/(me|nos|te|os|se)$/, ''); // 🤞
    return str
  };

  const { presentTense: presentTense$1, pastTense: pastTense$1, imperfectTense: imperfectTense$1, futureTense: futureTense$1, conditional: conditional$1, subjunctive: subjunctive$1, imperfectSubjunctive, imperative: imperative$1 } = model$1;

  // the pronoun is not part of the conjugation - 'acostarse' conjugates as 'acostar'
  const plain$1 = (str) => str.replace(/([aeií]r)se$/, '$1');

  const doEach = function (str, m) {
    str = plain$1(str);
    return {
      first: convert(str, m.first),
      second: convert(str, m.second),
      third: convert(str, m.third),
      firstPlural: convert(str, m.firstPlural),
      secondPlural: convert(str, m.secondPlural),
      thirdPlural: convert(str, m.thirdPlural)
    }
  };

  const toPresent$1 = (str) => doEach(str, presentTense$1);
  const toPast$1 = (str) => doEach(str, pastTense$1);
  const toImperfect$1 = (str) => doEach(str, imperfectTense$1);
  const toFuture$1 = (str) => doEach(str, futureTense$1);
  const toSubjunctive$1 = (str) => doEach(str, subjunctive$1);
  // 'si pudiera...' (-ra series)
  const toImperfectSubjunctive$1 = (str) => doEach(str, imperfectSubjunctive);
  // 'si pudiese...' - the -se series is a regular respelling of the -ra one
  const toImperfectSubjunctiveSe$1 = (str) => {
    const obj = toImperfectSubjunctive$1(str);
    return {
      first: obj.first ? obj.first.replace(/ra$/, 'se') : obj.first,
      second: obj.second ? obj.second.replace(/ras$/, 'ses') : obj.second,
      third: obj.third ? obj.third.replace(/ra$/, 'se') : obj.third,
      firstPlural: obj.firstPlural ? obj.firstPlural.replace(/ramos$/, 'semos') : obj.firstPlural,
      secondPlural: obj.secondPlural ? obj.secondPlural.replace(/rais$/, 'seis') : obj.secondPlural,
      thirdPlural: obj.thirdPlural ? obj.thirdPlural.replace(/ran$/, 'sen') : obj.thirdPlural,
    }
  };
  const toConditional$1 = (str) => doEach(str, conditional$1);
  // the short 'tú' commands, and the verbs built on them - 'pon', 'supón', 'ten', 'mantén', 'haz', 'sal', 'di', 'ven'
  const shortCommand = /(p[oó]n|t[eé]n|v[eé]n|haz|sal|satisfaz)$/;
  // .. a longer verb takes an accent, to keep its stress - 'convén', 'detén', 'compón' - but 'rehaz', 'sobresal'
  const compounds = /^(.+)(venir|tener|poner|hacer|salir)$/;
  const shortForms = { venir: 'vén', tener: 'tén', poner: 'pón', hacer: 'haz', salir: 'sal' };
  const ownCommand = { ir: 've', ser: 'sé', haber: 'he', decir: 'di' };

  const toImperative$1 = (str) => {
    const obj = doEach(str, imperative$1);
    str = plain$1(str);
    // the model is only sure of the verbs it has seen - the rest follow from the other tenses:
    // 'tú' is the third-person present - 'habla'
    const compound = str.match(compounds);
    if (ownCommand.hasOwnProperty(str)) {
      obj.second = ownCommand[str];
    } else if (compound) {
      // 'intervenir' is 'intervén', as 'venir' is 'ven'
      obj.second = compound[1] + shortForms[compound[2]];
    } else if (!shortCommand.test(obj.second || '')) {
      obj.second = toPresent$1(str).third || obj.second;
    }
    // 'usted' and 'ustedes' are the subjunctive - 'hable', 'hablen'
    const subj = toSubjunctive$1(str);
    obj.third = subj.third || obj.third;
    obj.thirdPlural = subj.thirdPlural || obj.thirdPlural;
    // 'vosotros' is the infinitive, with a 'd' - 'hablad'
    obj.secondPlural = /r$/.test(str) ? str.replace(/r$/, 'd') : obj.secondPlural;
    // imperative has no first-person
    // because ...you can't tell yourself to do something.
    obj.first = '';
    obj.firstPlural = '';
    return obj
  };

  // an array of every inflection, for '{inf}' syntax
  const all$2 = function (str) {
    let res = [str]
      .concat(
        Object.values(toPresent$1(str)),
        Object.values(toPast$1(str)),
        Object.values(toImperfect$1(str)),
        Object.values(toFuture$1(str)),
        Object.values(toConditional$1(str)),
        Object.values(toImperative$1(str)),
        Object.values(toSubjunctive$1(str)),
        Object.values(toImperfectSubjunctive$1(str)),
        Object.values(toImperfectSubjunctiveSe$1(str)),
        Object.values(toReflexive$1(str)), //infinitive reflexive - 'quemarme'
        toGerund$1(str),
        toPerfecto$1(str)
      )
      .filter((s) => s);
    res = new Set(res);
    return Array.from(res)
  };

  const { presentTense, pastTense, imperfectTense, futureTense, conditional, subjunctive, imperative } = model$1;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse(m[k]);
      return h
    }, {})
  };

  // suffix-thumb v6 applies its closest rule to any input, so a word the model
  // never saw still comes back changed - only accept a root that conjugates
  // back into the word we started with
  const safe = (str, rev, fwd) => {
    const out = convert(str, rev);
    return convert(out, fwd) === str ? out : str
  };

  const presentRev = revAll(presentTense);
  const pastRev = revAll(pastTense);
  const imperfectRev = revAll(imperfectTense);
  const futureRev = revAll(futureTense);
  const conditionalRev = revAll(conditional);
  const subjunctRev = revAll(subjunctive);
  const imperativeRev = revAll(imperative);

  //relajarse -> relajar
  const stripReflexive$2 = function (str) {
    str = str.replace(/arse$/, 'ar');
    str = str.replace(/arte$/, 'ir');
    str = str.replace(/arme$/, 'ar');

    str = str.replace(/irse$/, 'ir');
    str = str.replace(/irte$/, 'ir');

    str = str.replace(/erse$/, 'er');
    str = str.replace(/ose$/, 'o');
    return str
  };

  const fromPresent = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, presentRev.first, presentTense.first),
      'SecondPerson': (s) => safe(s, presentRev.second, presentTense.second),
      'ThirdPerson': (s) => safe(s, presentRev.third, presentTense.third),
      'FirstPersonPlural': (s) => safe(s, presentRev.firstPlural, presentTense.firstPlural),
      'SecondPersonPlural': (s) => safe(s, presentRev.secondPlural, presentTense.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, presentRev.thirdPlural, presentTense.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromPast = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, pastRev.first, pastTense.first),
      'SecondPerson': (s) => safe(s, pastRev.second, pastTense.second),
      'ThirdPerson': (s) => safe(s, pastRev.third, pastTense.third),
      'FirstPersonPlural': (s) => safe(s, pastRev.firstPlural, pastTense.firstPlural),
      'SecondPersonPlural': (s) => safe(s, pastRev.secondPlural, pastTense.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, pastRev.thirdPlural, pastTense.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromImperfect = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, imperfectRev.first, imperfectTense.first),
      'SecondPerson': (s) => safe(s, imperfectRev.second, imperfectTense.second),
      'ThirdPerson': (s) => safe(s, imperfectRev.third, imperfectTense.third),
      'FirstPersonPlural': (s) => safe(s, imperfectRev.firstPlural, imperfectTense.firstPlural),
      'SecondPersonPlural': (s) => safe(s, imperfectRev.secondPlural, imperfectTense.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, imperfectRev.thirdPlural, imperfectTense.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    // person-ambiguous forms ('hablaba' is 1st or 3rd) - try third-person
    return safe(str, imperfectRev.third, imperfectTense.third)
  };

  const fromFuture = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, futureRev.first, futureTense.first),
      'SecondPerson': (s) => safe(s, futureRev.second, futureTense.second),
      'ThirdPerson': (s) => safe(s, futureRev.third, futureTense.third),
      'FirstPersonPlural': (s) => safe(s, futureRev.firstPlural, futureTense.firstPlural),
      'SecondPersonPlural': (s) => safe(s, futureRev.secondPlural, futureTense.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, futureRev.thirdPlural, futureTense.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromConditional = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, conditionalRev.first, conditional.first),
      'SecondPerson': (s) => safe(s, conditionalRev.second, conditional.second),
      'ThirdPerson': (s) => safe(s, conditionalRev.third, conditional.third),
      'FirstPersonPlural': (s) => safe(s, conditionalRev.firstPlural, conditional.firstPlural),
      'SecondPersonPlural': (s) => safe(s, conditionalRev.secondPlural, conditional.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, conditionalRev.thirdPlural, conditional.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromSubjunctive$1 = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, subjunctRev.first, subjunctive.first),
      'SecondPerson': (s) => safe(s, subjunctRev.second, subjunctive.second),
      'ThirdPerson': (s) => safe(s, subjunctRev.third, subjunctive.third),
      'FirstPersonPlural': (s) => safe(s, subjunctRev.firstPlural, subjunctive.firstPlural),
      'SecondPersonPlural': (s) => safe(s, subjunctRev.secondPlural, subjunctive.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, subjunctRev.thirdPlural, subjunctive.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return str
  };

  const fromImperative = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, imperativeRev.first, imperative.first),
      'SecondPerson': (s) => safe(s, imperativeRev.second, imperative.second),
      'ThirdPerson': (s) => safe(s, imperativeRev.third, imperative.third),
      'FirstPersonPlural': (s) => safe(s, imperativeRev.firstPlural, imperative.firstPlural),
      'SecondPersonPlural': (s) => safe(s, imperativeRev.secondPlural, imperative.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, imperativeRev.thirdPlural, imperative.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return str
  };

  // rule-based noun inflection - spanish plurals are regular, but their written accents move around

  // [singular, plural]
  const pairs = [
    // the stress moves over a syllable
    ['carácter', 'caracteres'],
    ['régimen', 'regímenes'],
    ['espécimen', 'especímenes'],
    // loanwords
    ['club', 'clubes'],
    ['film', 'filmes'],
    ['álbum', 'álbumes'],
    ['jersey', 'jerséis'],
    ['espray', 'espráis'],
    ['gay', 'gais'],
    ['lord', 'lores'],
    ['fan', 'fans'],
    ['sándwich', 'sándwiches'],
    ['hipérbaton', 'hipérbatos'],
    // consonant + s
    ['vals', 'valses'],
    ['reloj', 'relojes'],
    ['boj', 'bojes'],
    ['carcaj', 'carcajes']
  ];
  const irregular$1 = { toPlural: {}, fromPlural: {} };
  pairs.forEach((a) => {
    irregular$1.toPlural[a[0]] = a[1];
    irregular$1.fromPlural[a[1]] = a[0];
  });

  // stressed '-í' and '-ú' take '-es', but not these - 'menús', 'esquís'
  const plainS = new Set(['menú', 'champú', 'tutú', 'vermú', 'interviú', 'ragú', 'canesú', 'esquí', 'popurrí', 'pirulí', 'gachí']);

  const strip = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
  const mark = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
  const hasAccent = /[áéíóú]/;
  const noAccent$1 = (str) => str.replace(/[áéíóú]/g, (c) => strip[c]);
  const setChar = (str, i, c) => str.slice(0, i) + c + str.slice(i + 1);

  // where the vowel of each syllable is - 'le|ón' is two, 'dios' is one
  const nuclei = function (str) {
    const out = [];
    let weak = -1;
    let found = false;
    for (let i = 0; i <= str.length; i += 1) {
      const c = str[i] || '';
      if (/[aeoáéíóú]/.test(c)) {
        out.push(i);
        found = true;
      } else if (/[iuü]/.test(c)) {
        weak = i;
      } else {
        // a diphthong of weak vowels - 'ruin'
        if (!found && weak !== -1) {
          out.push(weak);
        }
        weak = -1;
        found = false;
      }
    }
    return out
  };

  // a singular word, by its stress - 'país', 'mes', 'dios' - but not 'lunes'
  const isOxytone = function (str) {
    const arr = nuclei(str);
    return arr.length < 2 || hasAccent.test(str[arr[arr.length - 1]])
  };

  // move the written accent, before adding '-es' - 'canción' -> 'cancion', 'joven' -> 'jóven'
  const toStem = function (str) {
    const arr = nuclei(str);
    const last = arr[arr.length - 1];
    if (hasAccent.test(str[last])) {
      // a hiatus keeps it - 'país' -> 'países'
      if (/[aeo]h?[íú]$/.test(str.slice(0, last + 1))) {
        return str
      }
      return setChar(str, last, strip[str[last]])
    }
    // 'examen' -> 'exámenes'
    if (str.endsWith('n') && arr.length > 1 && !hasAccent.test(str)) {
      const i = arr[arr.length - 2];
      return setChar(str, i, mark[str[i]] || str[i])
    }
    return str
  };

  // .. and put it back, after removing '-es' - 'cancion' -> 'canción', 'jóven' -> 'joven'
  const fromStem = function (str) {
    const arr = nuclei(str);
    const last = arr[arr.length - 1];
    if (!/[ns]$/.test(str) || hasAccent.test(str[last])) {
      return str
    }
    if (hasAccent.test(str)) {
      return noAccent$1(str)
    }
    return arr.length > 1 ? setChar(str, last, mark[str[last]] || str[last]) : str
  };

  // singular nouns that end in an unstressed '-s'
  const same = new Set(
    ('vals,lunes,martes,miércoles,jueves,viernes,virus,campus,cactus,estatus,bonus,ómnibus,atlas,caries,iris,pelvis,brindis,tenis,' +
      'gratis,bíceps,tríceps,paraguas,cumpleaños,lavaplatos,abrelatas,sacacorchos,rascacielos,paracaídas,parabrisas,sacapuntas,' +
      'salvavidas,guardaespaldas,tocadiscos,portaaviones,pararrayos,lavavajillas,rompecabezas,saltamontes,ciempiés,traspiés').split(',')
  );
  // .. or in a stressed one - 'inglés', 'país', 'autobús' - but 'cafés', 'esquís', 'menús' are plurals
  const stressed =
    /([aeiou]nés|ñés|glés|galés|rancés|océs|gués|ndés|obés|vés|siamés|marqués|rtés|ontés|terés|trés|prés|grés|ayés|compás|[dm]emás|jamás|trás|quizás|país|anís|diós|[oei]bús|jesús)$/;

  // 'crisis', 'tórax', 'lunes', 'mes' are not plurals
  const isSingular = function (str) {
    if (!str.endsWith('s') || same.has(str) || stressed.test(str) || /([aeiouáéíóúp]sis|[^f]itis)$/.test(str)) {
      return true
    }
    // 'gas', 'dios', 'tos' - but 'pies'
    return nuclei(str).length < 2 && /[aeiou]s$/.test(str) && !/[aeiou]es$/.test(str)
  };

  // is this a noun, or an adjective, in the given lexicon?
  const isWord$1 = (str, lex) => Boolean(lex) && lex.hasOwnProperty(str) && /Noun|Adjective/.test(lex[str]);

  // feminine nouns that begin with a stressed 'a' take the masculine article - 'el agua', 'las aguas'
  const takesEl = (str) => /^(h?á.*a|ave|hambre)$/.test(str) || (/^h?a.*a$/.test(str) && nuclei(str).length === 2);

  const { plurals } = model$1.nouns;
  const pRev = reverse(plurals);

  // irregulars -> invariables -> spelling rules -> model -> '-s'
  const toPlural$1 = (str) => {
    if (irregular$1.toPlural.hasOwnProperty(str)) {
      return irregular$1.toPlural[str]
    }
    // 'casa' -> 'casas', 'café' -> 'cafés'
    if (/[aeiouáéó]$/.test(str)) {
      return str + 's'
    }
    // 'rubí' -> 'rubíes', 'menú' -> 'menús'
    if (/[íú]$/.test(str)) {
      return str + (plainS.has(str) ? 's' : 'es')
    }
    // 'luz' -> 'luces'
    if (str.endsWith('z')) {
      return str.slice(0, -1) + 'ces'
    }
    if (/[sx]$/.test(str)) {
      // 'lunes', 'crisis', 'tórax', 'bíceps' never change - but 'mes' -> 'meses', 'inglés' -> 'ingleses'
      return isOxytone(str) && !/[^aeiouáéíóú]s$/.test(str) ? toStem(str) + 'es' : str
    }
    // 'papel' -> 'papeles', 'canción' -> 'canciones', 'joven' -> 'jóvenes'
    if (/[aeiouáéíóú]([lrndj]|ch)$/.test(str)) {
      return toStem(str) + 'es'
    }
    // 'ferry' -> 'ferris'
    if (/[^aeiouáéíóú]y$/.test(str)) {
      return str.slice(0, -1) + 'is'
    }
    // a loanword - 'cómic' -> 'cómics', 'récord' -> 'récords' - or 'rey' -> 'reyes'
    const res = convert(str, plurals);
    if (res === str + 's' || res === str + 'es') {
      return res
    }
    return str + (str.endsWith('y') ? 'es' : 's')
  };

  // does this '-es' plural have a singular in '-e'? - 'clases' -> 'clase', but 'meses' -> 'mes'
  const isE = function (str, e, cons, lex) {
    // 'canciones', 'ciudades', 'reyes', 'faxes'
    if (/(iones|[dt]ades|tudes|[yx]es)$/.test(str)) {
      return false
    }
    // is only one of them a word that we know?
    if (isWord$1(e, lex) !== isWord$1(cons, lex)) {
      return isWord$1(e, lex)
    }
    // has the model seen it? - 'cines', 'índices' - or 'luces', 'sándwiches'
    const res = convert(str, pRev);
    if (res === e) {
      return true
    }
    if (noAccent$1(res) === noAccent$1(cons)) {
      return false
    }
    // 'viajes', 'coches'
    return /[jh]e$/.test(e)
  };

  // irregulars -> invariables -> spelling rules -> known words -> model -> consonant
  // 'lex' is an optional lexicon, to look for the singular in
  const fromPlural = (str, lex) => {
    if (irregular$1.fromPlural.hasOwnProperty(str)) {
      return irregular$1.fromPlural[str]
    }
    if (isSingular(str)) {
      return str
    }
    const stem = str.slice(0, -2);
    // 'rubíes' -> 'rubí'
    if (/[íú]es$/.test(str)) {
      return stem
    }
    // 'casas' -> 'casa', 'cafés' -> 'café', 'cómics' -> 'cómic' - and 'héroes', 'bosques', 'padres', 'jefes'
    const e = str.slice(0, -1);
    if (!str.endsWith('es') || !/([aeiouáéíóú][lrndsjyxc]|[cs]h)$/.test(stem)) {
      return e
    }
    // 'luces' -> 'luz', 'canciones' -> 'canción', 'jóvenes' -> 'joven', 'árboles' -> 'árbol'
    const cons = stem.endsWith('c') ? stem.slice(0, -1) + 'z' : fromStem(stem);
    return isE(str, e, cons, lex) ? e : cons
  };

  const all$1 = function (str) {
    const plur = toPlural$1(str);
    if (str === plur) {
      return [str]
    }
    return [str, plur]
  };

  const toMasculine = function (str) {
    const arr = [
      ['ieta', 'ieto'],
      ['erra', 'erro'],
      ['rica', 'rico'],
      ['esta', 'esto'],
      ['ueña', 'ueño'],
      ['lera', 'lero'],
      ['rata', 'rato'],
      ['uida', 'uido'],
      ['anda', 'ando'],
      ['uela', 'uelo'],
      ['desa', 'dés'],
      ['adas', 'ados'],
      ['oras', 'ores'],
      ['chas', 'chones'],
      ['amas', 'amones'],
      ['ica', 'ico'],
      ['iza', 'izo'],
      ['ona', 'ón'],
      ['ada', 'ado'],
      ['ora', 'or'],
      ['oga', 'ogo'],
      ['era', 'ero'],
      ['ana', 'ano'],
      ['iva', 'ivo'],
      ['ica', 'ico'],
      ['ina', 'ino'],
      ['ita', 'ito'],
      ['cia', 'ción'],
      ['ia', 'io'],
      ['ea', 'eo'],
      ['a', 'o'],
      ['as', 'os'],
    ];
    for (let i = 0; i < arr.length; i += 1) {
      const [suff, repl] = arr[i];
      if (str.endsWith(suff)) {
        str = str.substr(0, str.length - suff.length);
        str += repl;
        return str
      }
    }
    return str
  };

  // the model only knows adjectives with four forms - so the rules choose which ones those are
  const fRev = reverse(model$1.adjectives.f);

  // shortened forms - [female, plural]
  const irregular = {
    buen: ['buena', 'buenos'],
    primer: ['primera', 'primeros'],
    tercer: ['tercera', 'terceros']
  };
  // consonant endings that add an '-a' - 'trabajador', 'alemán', 'inglés', 'español'
  const gendered = /(or|[óáí]n|és|^español|^andaluz)$/;
  // .. but not these ones - 'mejor', 'superior', 'marrón', 'cortés'
  const common = /(^(mejor|peor|mayor|menor)|[eu]rior|color|^marrón|afín|cortés)$/;
  // '-a' adjectives that have no '-o' form - 'optimista', 'agrícola', 'belga'
  const commonA = /^(persa|maya|celta|rosa|lila|malva|violeta)$|([ií]sta|ícola|icida|crata|polita|elita|ócrita|[ip]ota|belga|azteca|nómada|indígena|naranja)$/;
  // .. but these ones do - 'lista', 'prevista'
  const notCommon = /^(lista|mixta|(impre|pre|pro)?vista)$/;

  // 'rojo' -> 'roja', 'inglés' -> 'inglesa', but 'grande' -> 'grande'
  const toFemale = (str) => {
    if (irregular.hasOwnProperty(str)) {
      return irregular[str][0]
    }
    if (str.endsWith('o')) {
      return str.slice(0, -1) + 'a'
    }
    if (gendered.test(str) && !common.test(str)) {
      return str.slice(0, -2) + noAccent$1(str.slice(-2)) + 'a'
    }
    return str
  };
  // the same spelling rules as the nouns - 'feliz' -> 'felices', 'joven' -> 'jóvenes'
  const toPlural = (str) => (irregular.hasOwnProperty(str) ? irregular[str][1] : toPlural$1(str));
  const toFemalePlural = (str) => toPlural$1(toFemale(str));

  // 'alemana' -> 'alemán', 'habladora' -> 'hablador'
  const toConsonant = function (str) {
    const stem = str.slice(0, -1);
    if (/([aoi]n|es)$/.test(stem)) {
      return stem.slice(0, -2) + mark[stem.slice(-2, -1)] + stem.slice(-1)
    }
    return stem
  };

  // 'roja' -> 'rojo', 'inglesa' -> 'inglés', but 'optimista' -> 'optimista'
  // 'lex' is an optional lexicon, to look for the adjective in
  const fromFemale = (str, lex) => {
    if (!str.endsWith('a')) {
      return str
    }
    const o = str.slice(0, -1) + 'o';
    const cons = toConsonant(str);
    if (isWord$1(o, lex)) {
      return o
    }
    // 'habladora' -> 'hablador'
    if (isWord$1(cons, lex) || /([aei]d|[ts])ora$/.test(str)) {
      return cons
    }
    if (commonA.test(str) && !notCommon.test(str)) {
      return str
    }
    // 'alemana' -> 'alemán', but 'cubana' -> 'cubano' - the model has seen these
    return convert(str, fRev) === cons && gendered.test(cons) ? cons : o
  };
  const toSingular = (str, lex) => fromPlural(str, lex);
  const fromFemalePlural = (str, lex) => (str.endsWith('as') ? fromFemale(str.slice(0, -1), lex) : fromPlural(str, lex));

  const all = function (str) {
    const arr = [str, toFemale(str), toPlural(str), toFemalePlural(str)];
    return Array.from(new Set(arr))
  };

  var adjective = {
    all,
    toFemale,
    toPlural,
    toFemalePlural,
    fromFemale,
    toSingular,
    fromFemalePlural
  };

  // find a conjugated verb in the conjugation table of its infinitive.
  //
  // the reverse-models (fromPresent, fromPast..) each guess at an infinitive,
  // and they need to be told the tense + person, which we often do not know.
  // so try them all, and only keep an infinitive that conjugates back into our word.
  //
  // (this file is the same in each of the *-compromise libraries - the list of tenses is not)

  const persons$4 = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural'];

  // tenses is a list of { name, to(infinitive), from(word, person) }
  // opts.extra(word) may give more infinitives to try
  const makeLookup = function (tenses, opts = {}) {
    // what an infinitive looks like - 'hablar', 'parlare', 'sprechen'
    const shape = opts.shape || /./;
    const pick = (only) => (only ? tenses.filter((o) => only.includes(o.name)) : tenses);

    // every form of this verb, by tense, and then person
    const table = function (inf, only) {
      const res = {};
      pick(only).forEach((o) => {
        res[o.name] = o.to(inf) || {};
      });
      return res
    };

    // where is this word, in the conjugations of this infinitive?
    const findHits = function (str, inf, only) {
      const forms = table(inf, only);
      const hits = [];
      Object.keys(forms).forEach((tense) => {
        persons$4.forEach((person) => {
          if (forms[tense][person] === str) {
            hits.push({ tense, person });
          }
        });
      });
      return hits
    };

    // every infinitive that has this word as one of its forms
    const candidates = function (str, only) {
      // the word itself may be one - 'wir gehen'
      let roots = shape.test(str) ? [str] : [];
      // any irregular verbs, that the models do not reverse
      if (opts.extra) {
        roots = roots.concat(opts.extra(str) || []);
      }
      pick(only).forEach((o) => {
        persons$4.forEach((person) => {
          // 'rad fahren' -> 'fahren'
          const inf = (o.from(str, person) || '').split(' ').pop();
          if (inf && inf !== str && shape.test(inf)) {
            roots.push(inf);
          }
        });
      });
      roots = roots.filter((s, i) => roots.indexOf(s) === i);
      const found = [];
      roots.forEach((root) => {
        const hits = findHits(str, root, only);
        if (hits.length > 0) {
          found.push({ root, hits });
        }
      });
      return found
    };

    // the best of them - or null
    // - isVerb(infinitive) says if this is a verb that we know. these are preferred.
    // - known: only accept a verb that we know
    // - tenses: only look in these tenses
    const lookup = function (str, options = {}) {
      const isVerb = options.isVerb || (() => false);
      let found = candidates(str, options.tenses);
      found = found.map((o, i) => ({ o, i, known: isVerb(o.root) }));
      if (options.known) {
        found = found.filter((a) => a.known);
      }
      // prefer a real verb - 'pude' is 'poder', not 'pudir'
      found.sort((a, b) => {
        const diff = Number(b.known) - Number(a.known);
        if (diff !== 0) {
          return diff
        }
        // then the shortest - 'sagte' is 'sagen', not 'sagten'
        return a.o.root.length - b.o.root.length || a.i - b.i
      });
      return found.length > 0 ? found[0].o : null
    };

    return { table, findHits, candidates, lookup }
  };

  // the reverse-models take a tag for the person
  const tags$1 = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };
  // the models learned some verbs in their reflexive form - 'llovió' -> 'lloverse'
  const wrap = (fn) => (str, person) => (fn(str, tags$1[person]) || '').replace(/([aeií]r)se$/, '$1');

  // the indicative tenses
  const tenses$3 = [
    { name: 'present', to: toPresent$1, from: wrap(fromPresent) },
    { name: 'past', to: toPast$1, from: wrap(fromPast) },
    { name: 'imperfect', to: toImperfect$1, from: wrap(fromImperfect) },
    { name: 'future', to: toFuture$1, from: wrap(fromFuture) },
    { name: 'conditional', to: toConditional$1, from: wrap(fromConditional) },
  ];

  const { table, findHits, candidates, lookup } = makeLookup(tenses$3, { shape: /[aeií]r$/ });

  var methods$1 = {
    verb: {
      fromGerund,
      fromPresent,
      fromPast,
      fromImperfect,
      fromFuture,
      fromConditional,
      fromSubjunctive: fromSubjunctive$1,
      fromImperative,
      toPresent: toPresent$1,
      toPast: toPast$1,
      toImperfect: toImperfect$1,
      toFuture: toFuture$1,
      toConditional: toConditional$1,
      toGerund: toGerund$1,
      toSubjunctive: toSubjunctive$1,
      toImperfectSubjunctive: toImperfectSubjunctive$1,
      toImperfectSubjunctiveSe: toImperfectSubjunctiveSe$1,
      toImperative: toImperative$1,
      fromPerfecto,
      toPerfecto: toPerfecto$1,
      toReflexive: toReflexive$1,
      stripReflexive: stripReflexive$3,
      table,
      findHits,
      candidates,
      lookup,
      all: all$2
    },
    noun: {
      toPlural: toPlural$1,
      fromPlural,
      toSingular: fromPlural,
      toMasculine,
      takesEl,
      all: all$1
    },
    adjective
  };

  // hand-curated entries that win over everything else in the lexicon.
  // spanish marks question-words with an accent - 'qué es' vs 'creo que es'
  const lex = {
    // reflexive/impersonal clitic - 'se habla español'
    se: 'Pronoun',
    // 'yo sé' (saber) + imperative of ser
    'sé': ['Verb', 'PresentTense', 'FirstPerson'],

    // unaccented forms are conjunctions/relativizers
    que: 'Conjunction',
    como: 'Conjunction',
    donde: 'Pronoun',
    cuando: 'Conjunction',
    // accented forms are question-words
    'qué': 'QuestionWord',
    'cómo': 'QuestionWord',
    'dónde': 'QuestionWord',
    'cuándo': 'QuestionWord',
    'quién': 'QuestionWord',
    'quiénes': 'QuestionWord',
    'cuál': 'QuestionWord',
    'cuáles': 'QuestionWord',
    'cuánto': 'QuestionWord',
    'cuánta': 'QuestionWord',
    'cuántos': 'QuestionWord',
    'cuántas': 'QuestionWord',
    'por qué': 'QuestionWord',

    lo: 'Pronoun',
    algo: 'Pronoun',

    si: 'Condition',
    'sí': 'Adverb', // yes

    // impersonal 'there is/are' - present of haber
    hay: ['Verb', 'PresentTense'],

    no: 'Negative',
    nunca: 'Negative', //never

    // imperfect of ser
    era: ['Copula', 'Imperfect'],
    eras: ['Copula', 'Imperfect'],
    'éramos': ['Copula', 'Imperfect'],
    erais: ['Copula', 'Imperfect'],
    eran: ['Copula', 'Imperfect'],

    irse: ['Reflexive', 'Infinitive']
  };

  // possessive determiners - 'mi casa', not pronouns ('la mía')
  const possDet = [
    'mi', // singular  my (masculine and feminine)
    'mis', // plural my (masculine and feminine)
    'tu', // singular  your (informal singular, masculine and feminine)
    'tus', // plural your (informal singular, masculine and feminine)
    'su', // singular" his/her/its/your (formal singular, masculine and feminine)
    'sus', // plural  his/her/its/your/their (masculine and feminine)
    'nuestro', // singular masculine our
    'nuestra', // singular feminine  our
    'nuestros', // plural masculine  our
    'nuestras', // plural feminine   our
    'vuestro', // singular masculine your (informal plural)
    'vuestra', // singular feminine  your (informal plural)
    'vuestros', // plural masculine  your (informal plural)
    'vuestras' // plural feminine     your (informal plural)
  ];
  possDet.forEach((str) => {
    lex[str] = ['Determiner', 'Possessive'];
  });

  // possessive pronouns - 'la casa es mía'
  const possPro = [
    'mío', 'mía', 'míos', 'mías',
    'tuyo', 'tuya', 'tuyos', 'tuyas',
    'suyo', 'suya', 'suyos', 'suyas',
  ];
  possPro.forEach((str) => {
    lex[str] = ['Pronoun', 'Possessive'];
  });

  const {
    toPresent,
    toPast,
    toImperfect,
    toFuture,
    toConditional,
    toGerund,
    toPerfecto,
    toImperative,
    toSubjunctive,
    toImperfectSubjunctive,
    toImperfectSubjunctiveSe,
    toReflexive
  } = methods$1.verb;
  const lexicon$1 = {};
  const infinitives = [];

  const tagMap = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural'
  };

  const addWords = function (obj, tag, lex) {
    // when two persons share a form ('hablaba' is 1st + 3rd person),
    // don't pick one - just tag the tense
    const counts = {};
    Object.keys(obj).forEach((k) => {
      counts[obj[k]] = (counts[obj[k]] || 0) + 1;
    });
    Object.keys(obj).forEach((k) => {
      const w = obj[k];
      if (!w || lex[w]) {
        return
      }
      if (counts[w] > 1) {
        lex[w] = [tag];
      } else {
        lex[w] = [tag, tagMap[k]];
      }
    });
  };

  // attach the reflexive clitic to affirmative imperatives - 'lávate', 'lávese'
  const toImperativeReflexive = function (obj) {
    const out = {};
    if (obj.second) {
      out.second = obj.second + 'te';
    }
    if (obj.third) {
      out.third = obj.third + 'se';
    }
    if (obj.firstPlural) {
      out.firstPlural = obj.firstPlural + 'nos';
    }
    if (obj.thirdPlural) {
      out.thirdPlural = obj.thirdPlural + 'se';
    }
    return out
  };

  Object.keys(lexData).forEach((tag) => {
    const wordsObj = unpack(lexData[tag]);
    Object.keys(wordsObj).forEach((w) => {
      lexicon$1[w] = tag;

      // add conjugations for our verbs
      if (tag === 'Infinitive') {
        // add present tense
        let obj = toPresent(w);
        addWords(obj, 'PresentTense', lexicon$1);
        // add past tense
        obj = toPast(w);
        addWords(obj, 'PastTense', lexicon$1);
        // add imperfect
        obj = toImperfect(w);
        addWords(obj, 'Imperfect', lexicon$1);
        // add future tense
        obj = toFuture(w);
        addWords(obj, 'FutureTense', lexicon$1);
        // add conditional
        obj = toConditional(w);
        addWords(obj, 'Conditional', lexicon$1);
        // add gerund
        let str = toGerund(w);
        lexicon$1[str] = lexicon$1[str] || 'Gerund';
        // add perfecto
        str = toPerfecto(w);
        lexicon$1[str] = lexicon$1[str] || 'Perfecto';
        // add reflexive infinitive forms
        obj = toReflexive(w);
        addWords(obj, 'Reflexive', lexicon$1);
        // the moods come after every verb has its tenses
        infinitives.push(w);
      }
      if (tag === 'Adjective') {
        const { toFemale, toPlural, toFemalePlural } = methods$1.adjective;
        const f = toFemale(w);
        // 'rojos' - or 'grandes', for both genders
        const p = toPlural(w);
        lexicon$1[p] = lexicon$1[p] || ['Adjective', 'PluralAdjective'];
        if (f !== w) {
          lexicon$1[f] = lexicon$1[f] || ['Adjective', 'FemaleAdjective', 'SingularAdjective'];
          const fs = toFemalePlural(w);
          lexicon$1[fs] = lexicon$1[fs] || ['Adjective', 'FemaleAdjective', 'PluralAdjective'];
        }
      }
      if (tag === 'Cardinal') {
        lexicon$1[w] = ['Cardinal', 'TextValue'];
      }
      if (tag === 'Ordinal') {
        lexicon$1[w] = ['Ordinal', 'TextValue'];
      }
    });
  });

  // a tense wins over a mood - 'sienten' is the present of 'sentir', before it is a command of 'sentar'
  infinitives.forEach((w) => {
    // add imperative
    let obj = toImperative(w);
    addWords(obj, 'Imperative', lexicon$1);
    // add reflexive for some imperative forms
    obj = toImperativeReflexive(obj);
    addWords(obj, 'Reflexive', lexicon$1);
    // add toSubjunctive
    obj = toSubjunctive(w);
    addWords(obj, 'Subjunctive', lexicon$1);
    // imperfect subjunctive - 'si pudiera', 'si pudiese'
    obj = toImperfectSubjunctive(w);
    addWords(obj, 'Subjunctive', lexicon$1);
    obj = toImperfectSubjunctiveSe(w);
    addWords(obj, 'Subjunctive', lexicon$1);
  });

  // hand-curated entries always win
  Object.assign(lexicon$1, lex);
  // console.log(lexicon['ganado'])

  // names of people and places, shared by every language - our own words win
  Object.keys(properNouns).forEach(tag => {
    Object.keys(unpack(properNouns[tag])).forEach(w => {
      lexicon$1[w] = lexicon$1[w] || tag;
    });
  });

  const verbForm = function (term) {
    const want = [
      'FirstPerson',
      'SecondPerson',
      'ThirdPerson',
      'FirstPersonPlural',
      'SecondPersonPlural',
      'ThirdPersonPlural'
    ];
    return want.find((tag) => term.tags.has(tag))
  };

  //relajarse -> relajar
  const stripReflexive$1 = function (str) {
    str = str.replace(/se$/, '');
    str = str.replace(/te$/, '');
    str = str.replace(/me$/, '');
    return str
  };

  const persons$3 = {
    FirstPerson: 'first',
    SecondPerson: 'second',
    ThirdPerson: 'third',
    FirstPersonPlural: 'firstPlural',
    SecondPersonPlural: 'secondPlural',
    ThirdPersonPlural: 'thirdPlural',
  };

  // 'haber' is our auxiliary verb - the tagger gives it no tense
  let haber = null;
  const isHaber = function (str, verb) {
    if (haber === null) {
      haber = new Set(verb.all('haber'));
      haber.add('hay');
    }
    return haber.has(str)
  };

  // the subjunctive is often person-ambiguous ('hable' is 1st or 3rd)
  // so try each person, and keep an infinitive that conjugates back to our word
  const fromSubjunctive = function (str, form, verb) {
    const order = [form].concat(Object.keys(persons$3)).filter((s) => s);
    for (let i = 0; i < order.length; i += 1) {
      const inf = verb.fromSubjunctive(str, order[i]);
      if (inf && inf !== str && verb.toSubjunctive(inf)[persons$3[order[i]]] === str) {
        return inf
      }
    }
    return verb.fromPresent(str, form)
  };

  // most-specific first - an #Imperfect is also a #PastTense
  const tenses$2 = [
    ['Imperfect', 'fromImperfect'],
    ['PresentTense', 'fromPresent'],
    ['PastTense', 'fromPast'],
    ['FutureTense', 'fromFuture'],
    ['Conditional', 'fromConditional'],
  ];

  // the tagger's tense + person are often a guess, and so is the infinitive we get from them.
  // if it does not conjugate back into our word, look for a known verb that does
  const checkRoot = function (str, guess, world) {
    const verb = world.methods.two.transform.verb;
    // the models learned some verbs in their reflexive form - 'llovió' -> 'lloverse'
    guess = (guess || '').replace(/([aeií]r)se$/, '$1');
    const lexicon = world.model.one.lexicon;
    const isVerb = (inf) => lexicon.hasOwnProperty(inf) && [].concat(lexicon[inf]).includes('Infinitive');
    const isOk = Boolean(guess) && guess !== str && verb.findHits(str, guess).length > 0;
    if (isOk && isVerb(guess)) {
      return guess
    }
    // a verb that we know beats one that we do not - 'queremos' is 'querer', not the future of 'quer'
    const found = verb.lookup(str, { isVerb, known: true });
    return found ? found.root : guess
  };

  // the infinitive of a command with pronouns attached - the tagger has left its stem in 'machine'
  // 'levántate' is 'levanta' + 'te', and 'siéntese' is 'siente' + 'se'
  const fromCommand = function (term, world, word) {
    const verb = world.methods.two.transform.verb;
    const lexicon = world.model.one.lexicon;
    const isVerb = (inf) => lexicon.hasOwnProperty(inf) && [].concat(lexicon[inf]).includes('Infinitive');
    const stem = word || term.machine;
    // the 'tú' command is the present-tense - 'levanta'
    const present = verb.candidates(stem, ['present']).filter((o) => isVerb(o.root) && o.hits.some((h) => h.person === 'third' || h.person === 'firstPlural'));
    // the 'usted' command is the subjunctive - 'levante'
    let formal = null;
    // .. and so is every negative one - 'no hables', 'no habléis'
    const tags = ['ThirdPerson', 'ThirdPersonPlural', 'SecondPerson', 'SecondPersonPlural', 'FirstPersonPlural'];
    for (let i = 0; i < tags.length && !formal; i += 1) {
      const inf = (verb.fromSubjunctive(stem, tags[i]) || '').replace(/([aeií]r)se$/, '$1');
      if (inf && isVerb(inf) && verb.toSubjunctive(inf)[persons$3[tags[i]]] === stem) {
        formal = inf;
      }
    }
    // '-se' is only for 'usted' - 'siéntese' is 'sentar', but 'siéntete' is 'sentir'
    const isFormal = word ? present.length === 0 : /se$/.test(term.normal);
    const informal = present.length > 0 ? present[0].root : null;
    return isFormal ? formal || informal : informal || formal
  };

  const sitWords = new Set(['en', 'a', 'al', 'junto', 'aquí', 'allí', 'ahí', 'cerca', 'delante', 'detrás']);

  const root = function (view) {
    const { verb, noun, adjective } = view.world.methods.two.transform;
    const lexicon = view.world.model.one.lexicon;
    view.docs.forEach((terms) => {
      terms.forEach((term) => {
        // 'machine' may hold a clitic-stripped stem - 'dámelo' → 'da'
        let str = term.implicit || term.machine || term.normal || term.text;

        if (term.tags.has('Verb')) {
          // copulas are a closed set - ser + estar
          if (term.tags.has('Copula')) {
            term.root = /^est/.test(str) ? 'estar' : 'ser';
            return
          }
          // get infinitive form of the verb
          if (term.tags.has('Reflexive')) {
            term.root = stripReflexive$1(str);
            return
          }
          if (isHaber(str, verb)) {
            term.root = 'haber';
            return
          }
          const form = verbForm(term);
          // 'levántate', 'siéntese' - a command, with its pronouns attached
          const imp = term.machine && term.tags.has('Imperative') ? fromCommand(term, view.world) : null;
          if (imp) {
            term.root = imp;
          } else if (term.tags.has('Subjunctive')) {
            term.root = fromSubjunctive(str, form, verb);
          } else if (term.tags.has('Gerund')) {
            term.root = verb.fromGerund(str, form);
          } else if (term.tags.has('Perfecto')) {
            term.root = verb.fromPerfecto(str, form);
          } else {
            // an indicative tense - 'hablo', 'habló', 'hablaba', 'hablará', 'hablaría'
            const from = tenses$2.find((o) => term.tags.has(o[0]));
            if (!from && term.tags.has('Imperative')) {
              // 'no hables' is a subjunctive, and 'habla' a present-tense
              term.root = fromCommand(term, view.world, str) || verb.fromImperative(str, form);
            } else {
              // .. or a guess
              term.root = checkRoot(str, verb[(from || tenses$2[1])[1]](str, form), view.world);
            }
          }
        }

        // 'me siento mal' is 'sentir', but 'me siento en la silla' is 'sentar'
        if (term.tags.has('Verb') && term.normal === 'siento') {
          const next = terms[terms.indexOf(term) + 1];
          term.root = next && sitWords.has(next.normal) ? 'sentar' : 'sentir';
        }

        // nouns -> singular masculine form
        if (term.tags.has('Noun')) {
          if (term.tags.has('Plural')) {
            str = noun.toSingular(str, lexicon);
          }
          if (term.tags.has('FemaleNoun')) ;
          term.root = str;
        }

        // nouns -> singular masculine form
        if (term.tags.has('Adjective')) {
          if (term.tags.has('PluralAdjective')) {
            if (term.tags.has('FemaleAdjective')) {
              str = adjective.fromFemalePlural(str, lexicon);
            } else {
              str = adjective.toSingular(str, lexicon);
            }
          }
          if (term.tags.has('FemaleAdjective')) {
            str = adjective.fromFemale(str, lexicon);
          }
          term.root = str;
        }
      });
    });
    return view
  };

  var lexicon = {
    words: lexicon$1,
    compute: { root: root },
    methods: {
      two: {
        transform: methods$1
      }
    },
  };

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E


  // á	Alt + 0225
  // é	Alt + 0233
  // í	Alt + 0237
  // ó	Alt + 024
  // ú	Alt + 0250
  // ü	Alt + 0252
  // ñ	Alt + 0241
  // ¿	Alt + 0191
  // ¡	Alt + 0161

  const compact = {
    '?': 'Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÃÅãåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'þƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    i: 'ĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇії',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÕØðõøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'µŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰμυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  const unicode = {};
  Object.keys(compact).forEach(function (k) {
    compact[k].split('').forEach(function (s) {
      unicode[s] = k;
    });
  });

  var contractions = [
    { word: 'al', out: ['a', 'el'] },
    { word: 'del', out: ['de', 'el'] },
  ];

  // words that end in a period, but don't end a sentence - 'Dr.'
  // (these replace the english abbreviations, which collide with real words here)
  const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]));

  var abbreviations = toObj(`
  sr sra srta sres sras dr dra drs dras dña ud uds vd vds
  lic licda ing arq prof profa gral cnel tte cap pdte excmo excma ilmo ilma mons sto sta fr
  av avda cía hnos depto dpto atte vs univ ed eds
  pág págs núm art vol fig tab apdo ej p.ej tel tfno teléf aprox máx mín doc etc
  ee uu ee.uu
  kg km cm mm ml min
  lun mié jue vie sáb
  ene feb abr jun jul ago sept oct nov dic
`);

  var tokenizer = {
    mutate: (world) => {
      world.model.one.unicode = unicode;

      world.model.one.contractions = contractions;

      // our own abbreviations, for the sentence-parser
      world.model.one.abbreviations = { ...abbreviations };

      // 'que' -> 'quebec'
      delete world.model.one.lexicon.que;
    }
  };

  const hasApostrophe = /['‘’‛‵′`´]/;

  // normal regexes
  const doRegs = function (str, regs) {
    for (let i = 0; i < regs.length; i += 1) {
      if (regs[i][0].test(str) === true) {
        return regs[i]
      }
    }
    return null
  };

  const checkRegex = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    const { regexText, regexNormal, regexNumbers } = world.model.two;
    const normal = term.machine || term.normal;
    let text = term.text;
    // keep dangling apostrophe?
    if (hasApostrophe.test(term.post) && !hasApostrophe.test(term.pre)) {
      text += term.post.trim();
    }
    let arr = doRegs(text, regexText) || doRegs(normal, regexNormal);
    // hide a bunch of number regexes behind this one
    if (!arr && /[0-9]/.test(normal)) {
      arr = doRegs(normal, regexNumbers);
    }
    if (arr) {
      setTag([term], arr[1], world, false, `1-regex- '${arr[2] || arr[0]}'`);
      term.confidence = 0.6;
      return true
    }
    return null
  };

  const titleCase = /^\p{Lu}[\p{Ll}'’]/u;
  const hasNumber = /[0-9]/;
  const notProper = ['Date', 'Month', 'WeekDay', 'Unit', 'Expression'];

  const tagTitleCase = function (terms, index, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[index];
    const str = term.text || '';
    // titlecase and not first word of sentence
    if (index !== 0 && titleCase.test(str) === true && hasNumber.test(str) === false) {
      // skip Dates and stuff
      if (notProper.find((tag) => term.tags.has(tag))) {
        return
      }
      // first word in a quotation?
      if (/["']$/.test(term.pre)) {
        return
      }
      if (term.normal === 'the') {
        return
      }
      setTag([term], ['ProperNoun', 'Noun'], world, false, '2-titlecase');
    }
  };

  const min = 1400;
  const max = 2100;

  const dateWords = new Set(['pendant', 'dans', 'avant', 'apres', 'pour', 'en']);

  const seemsGood = function (term) {
    if (!term) {
      return false
    }
    if (dateWords.has(term.normal)) {
      return true
    }
    if (term.tags.has('Date') || term.tags.has('Month') || term.tags.has('WeekDay')) {
      return true
    }
    return false
  };

  const seemsOkay = function (term) {
    if (!term) {
      return false
    }
    if (term.tags.has('Ordinal')) {
      return true
    }
    return false
  };

  // recognize '1993' as a year
  const tagYear = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('NumericValue') && term.tags.has('Cardinal') && term.normal.length === 4) {
      const num = Number(term.normal);
      // number between 1400 and 2100
      if (num && !isNaN(num)) {
        if (num > min && num < max) {
          if (seemsGood(terms[i - 1]) || seemsGood(terms[i + 1])) {
            setTag([term], 'Year', world, false, '1-tagYear');
            return true
          }
          // or is it really-close to a year?
          if (num > 1950 && num < 2025) {
            if (seemsOkay(terms[i - 1]) || seemsOkay(terms[i + 1])) {
              setTag([term], 'Year', world, false, '1-tagYear-close');
              return true
            }
          }
        }
      }
    }
    return null
  };

  const oneLetterAcronym = /^[A-ZÄÖÜ]('s|,)?$/;
  const isUpperCase = /^[A-Z-ÄÖÜ]+$/;
  const periodAcronym = /([A-ZÄÖÜ]\.)+[A-ZÄÖÜ]?,?$/;
  const noPeriodAcronym = /[A-ZÄÖÜ]{2,}('s|,)?$/;
  const lowerCaseAcronym = /([a-zäöü]\.)+[a-zäöü]\.?$/;



  const oneLetterWord = {
    I: true,
    A: true,
  };
  // just uppercase acronyms, no periods - 'UNOCHA'
  const isNoPeriodAcronym = function (term, model) {
    const str = term.text;
    // ensure it's all upper-case
    if (isUpperCase.test(str) === false) {
      return false
    }
    // long capitalized words are not usually either
    if (str.length > 5) {
      return false
    }
    // 'I' is not a acronym
    if (oneLetterWord.hasOwnProperty(str)) {
      return false
    }
    // known-words, like 'PIZZA' is not an acronym.
    if (model.one.lexicon.hasOwnProperty(term.normal)) {
      return false
    }
    //like N.D.A
    if (periodAcronym.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym.test(str) === true) {
      return true
    }
    return false
  };

  const isAcronym = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    //these are not acronyms
    if (term.tags.has('RomanNumeral') || term.tags.has('Acronym')) {
      return null
    }
    //non-period ones are harder
    if (isNoPeriodAcronym(term, world.model)) {
      term.tags.clear();
      setTag([term], ['Acronym', 'Noun'], world, false, '3-no-period-acronym');
      return true
    }
    // one-letter acronyms
    if (!oneLetterWord.hasOwnProperty(term.text) && oneLetterAcronym.test(term.text)) {
      term.tags.clear();
      setTag([term], ['Acronym', 'Noun'], world, false, '3-one-letter-acronym');
      return true
    }
    //if it's a very-short organization?
    if (term.tags.has('Organization') && term.text.length <= 3) {
      setTag([term], 'Acronym', world, false, '3-org-acronym');
      return true
    }
    // upper-case org, like UNESCO
    if (term.tags.has('Organization') && isUpperCase.test(term.text) && term.text.length <= 6) {
      setTag([term], 'Acronym', world, false, '3-titlecase-acronym');
      return true
    }
    return null
  };

  // spanish attaches object/reflexive pronouns to the end of infinitives,
  // gerunds and affirmative imperatives - 'quemarme', 'diciéndoselo', 'dámelo'.
  // attaching them usually adds a written accent to preserve stress,
  // so we de-accent the stem before checking it.

  // indirect-object clitics can stack before a direct-object one - 'me lo'
  const indirect = ['me', 'te', 'se', 'nos', 'os', 'le', 'les'];
  const direct = ['lo', 'los', 'la', 'las', 'le', 'les'];
  let endings = [];
  indirect.forEach(a => {
    direct.forEach(b => {
      endings.push(a + b);
    });
  });
  endings = endings.concat(indirect, direct);
  // longest-first, so 'melo' is tried before 'lo'
  endings.sort((a, b) => b.length - a.length);

  const accents = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
  const deAccent = (str) => str.replace(/[áéíóú]/g, (c) => accents[c]);

  const isGerund = /(ando|iendo|yendo)$/;
  const isInfinitive$5 = /(ar|er|ir)$/;

  const verbish = ['Imperative', 'PresentTense', 'Infinitive', 'Verb', 'Copula', 'Subjunctive'];
  const isVerb = function (entry) {
    if (!entry) {
      return false
    }
    const tags = typeof entry === 'string' ? [entry] : entry;
    return tags.some(t => verbish.includes(t))
  };

  const tryStem = function (stem, ending, lexicon) {
    const plain = deAccent(stem);
    // 'levantándose', 'diciéndomelo'
    if (isGerund.test(plain)) {
      return { tags: ['Gerund'], stem: plain }
    }
    // 'quemarme', 'mezclarlo' - verify against the lexicon,
    // or accept a long-enough infinitive shape ('bloguearlo')
    if (isInfinitive$5.test(plain)) {
      if (isVerb(lexicon[plain]) || plain.length >= 5) {
        return { tags: ['Infinitive'], stem: plain }
      }
      return null
    }
    // affirmative imperative - 'dámelo' → 'da', 'hazme' → 'haz'
    if (isVerb(lexicon[plain])) {
      return { tags: ['Imperative', 'SecondPerson'], stem: plain }
    }
    // 'vámonos' → 'vamos' (the final -s is dropped before 'nos')
    if (ending.startsWith('nos') && isVerb(lexicon[plain + 's'])) {
      return { tags: ['Imperative', 'FirstPersonPlural'], stem: plain + 's' }
    }
    return null
  };

  const checkEnclitic = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const lexicon = world.model.one.lexicon;
    const term = terms[i];
    if (term.tags.size > 0) {
      return null
    }
    const str = term.machine || term.normal;
    for (let k = 0; k < endings.length; k += 1) {
      const e = endings[k];
      if (str.length - e.length >= 2 && str.endsWith(e)) {
        const stem = str.slice(0, str.length - e.length);
        const found = tryStem(stem, e, lexicon);
        if (found !== null) {
          // let the root-computation see through the clitics
          term.machine = found.stem;
          setTag([term], found.tags, world, false, '2-enclitic');
          term.confidence = 0.8;
          return true
        }
      }
    }
    return null
  };

  // const isTitleCase = function (str) {
  //   return /^[A-ZÄÖÜ][a-z'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
  // }

  // const hasNoVerb = function (terms) {
  //   return !terms.find(t => t.tags.has('#Verb'))
  // }

  const fallback = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.size === 0) {
      setTag([term], 'Noun', world, false, '2-fallback');
    }
  };

  //sweep-through all suffixes
  const suffixLoop = function (str = '', suffixes = []) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i > 1; i -= 1) {
      const suffix = str.substr(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
        const tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  // decide tag from the ending of the word
  const suffixCheck = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const suffixes = world.model.two.suffixPatterns;
    const term = terms[i];
    if (term.tags.size === 0) {
      let tag = suffixLoop(term.normal, suffixes);
      if (tag !== null) {
        setTag([term], tag, world, false, '2-suffix');
        term.confidence = 0.7;
        return true
      }
      // try implicit form of word, too
      if (term.implicit) {
        tag = suffixLoop(term.implicit, suffixes);
        if (tag !== null) {
          setTag([term], tag, world, false, '2-implicit-suffix');
          term.confidence = 0.7;
          return true
        }
      }
    }
    return null
  };

  // deduce gender of a noun, but it's suffix
  const guessNounGender = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const guessGender = world.methods.two.guessGender;
    const term = terms[i];
    if (term.tags.has('Noun') && !term.tags.has('FemaleNoun') && !term.tags.has('MaleNoun') && !term.tags.has('Pronoun')) {
      const str = term.machine || term.normal;
      const found = guessGender(str);
      if (found) {
        const tag = found === 'm' ? 'MaleNoun' : 'FemaleNoun';
        setTag([term], tag, world, false, '3-guessGender');
      }
    }
  };

  // deduce plurality of a noun, by its suffix
  const guessPlural = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const looksPlural = world.methods.two.looksPlural;
    const term = terms[i];
    if (term.tags.has('Noun') && !term.tags.has('Singular') && !term.tags.has('Plural') && !term.tags.has('Pronoun')) {
      const str = term.machine || term.normal;
      if (looksPlural(str)) {
        setTag([term], 'Plural', world, false, '3-guessPlural');
      }
    }
  };

  // deduce plurality of an adjective, by its suffix
  const guessAdjPlural = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const looksPlural = world.methods.two.looksPlural;
    const term = terms[i];
    if (term.tags.has('Adjective') && !term.tags.has('SingularAdjective') && !term.tags.has('PluralAdjective')) {
      const str = term.machine || term.normal;
      if (looksPlural(str) === true) {
        setTag([term], 'PluralAdjective', world, false, '3-guessPlural');
      } else {
        setTag([term], 'SingularAdjective', world, false, '3-guessPlural');
      }
    }
  };

  // only -o/-a adjectives are gendered.
  // '-e' and consonant endings are common-gender ('grande', 'feliz', 'azul')
  const guessGender$1 = function (str) {
    if (str.endsWith('o') || str.endsWith('os')) {
      return 'm'
    }
    if (str.endsWith('a') || str.endsWith('as')) {
      return 'f'
    }
    return null
  };

  // deduce gender of an adjective, by its suffix
  const guessAdjGender = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('Adjective') && !term.tags.has('FemaleAdjective') && !term.tags.has('MaleAdjective')) {
      const str = term.machine || term.normal;
      const found = guessGender$1(str);
      if (found === 'f') {
        setTag([term], 'FemaleAdjective', world, false, '3-guessGender');
      } else if (found === 'm') {
        setTag([term], 'MaleAdjective', world, false, '3-guessGender');
      }
    }
  };

  let rules = [
    // present-tense
    ['o', ['FirstPerson', 'PresentTense']],
    ['as', ['SecondPerson', 'PresentTense']],
    ['a', ['ThirdPerson', 'PresentTense']],
    ['mos', ['FirstPersonPlural', 'PresentTense']],
    ['áis', ['SecondPersonPlural', 'PresentTense']],
    ['éis', ['SecondPersonPlural', 'PresentTense']],
    ['an', ['ThirdPersonPlural', 'PresentTense']],
    // past-tense
    ['é', ['FirstPerson', 'PastTense']],
    ['ste', ['SecondPerson', 'PastTense']],
    ['ó', ['ThirdPerson', 'PastTense']],
    ['mos', ['FirstPersonPlural', 'PastTense']],
    ['eis', ['SecondPersonPlural', 'PastTense']],
    ['on', ['ThirdPersonPlural', 'PastTense']],
    // imperfect - 'hablaba' is 1st or 3rd person, so no person tag
    ['aba', ['Imperfect']],
    ['abas', ['SecondPerson', 'Imperfect']],
    ['ábamos', ['FirstPersonPlural', 'Imperfect']],
    ['abais', ['SecondPersonPlural', 'Imperfect']],
    ['aban', ['ThirdPersonPlural', 'Imperfect']],
    ['ías', ['SecondPerson', 'Imperfect']],
    ['íamos', ['FirstPersonPlural', 'Imperfect']],
    ['íais', ['SecondPersonPlural', 'Imperfect']],
    ['ían', ['ThirdPersonPlural', 'Imperfect']],
    // future-tense
    ['ré', ['FirstPerson', 'FutureTense']],
    ['rás', ['SecondPerson', 'FutureTense']],
    ['rá', ['ThirdPerson', 'FutureTense']],
    ['remos', ['FirstPersonPlural', 'FutureTense']],
    ['réis', ['SecondPersonPlural', 'FutureTense']],
    ['rán', ['ThirdPersonPlural', 'FutureTense']],
    // conditional-tense
    ['ría', ['FirstPerson', 'Conditional']],
    ['rías', ['SecondPerson', 'Conditional']],
    // ['ría', ['ThirdPerson','Conditional']], //(same)
    ['ríamos', ['FirstPersonPlural', 'Conditional']],
    ['ríais', ['SecondPersonPlural', 'Conditional']],
    ['rían', ['ThirdPersonPlural', 'Conditional']],
  ];
  // sort by suffix length
  rules = rules.sort((a, b) => {
    if (a[0].length > b[0].length) {
      return -1
    } else if (a[0].length < b[0].length) {
      return 1
    }
    return 0
  });

  const forms$1 = [
    'FirstPerson',
    'SecondPerson',
    'ThirdPerson',
    'FirstPersonPlural',
    'SecondPersonPlural',
    'ThirdPersonPlural',
    'PresentTense',
    'PastTense',
    'Imperfect',
    'FutureTense',
    'Conditional'
  ];

  //relajarse -> relajar
  const stripReflexive = function (str) {
    str = str.replace(/se$/, '');
    str = str.replace(/te$/, '');
    str = str.replace(/me$/, '');
    return str
  };

  // deduce gender of an adjective, but it's suffix
  const guessVerbForm = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('Verb')) {
      // skip non-finite forms and moods - 'comprado' ends in -o but is not first-person
      if (
        term.tags.has('Infinitive') ||
        term.tags.has('Auxiliary') ||
        term.tags.has('Negative') ||
        term.tags.has('Gerund') ||
        term.tags.has('Perfecto') ||
        term.tags.has('Participle') ||
        term.tags.has('Imperative') ||
        term.tags.has('Subjunctive') ||
        term.tags.has('Copula')
      ) {
        return
      }
      // do we already have both?
      if (forms$1.filter(tag => term.tags.has(tag)).length >= 2) {
        return
      }
      let str = term.machine || term.normal;

      //relajarse -> relajar
      str = stripReflexive(str);
      for (let k = 0; k < rules.length; k += 1) {
        const [suff, tag] = rules[k];
        if (str.endsWith(suff)) {
          setTag([term], tag, world, true, '3-guessForm');
          break
        }
      }
    }
  };

  // auxiliary forms we don't have conjugations of
  const isAux = new Set([
    //  imperfect subjunctive of 'poder'
    'pudiera',
    'pudieras',
    'pudiera',
    'pudiéramos',
    'pudierais',
    'pudieran',
    'pudiese',
    'pudieses',
    'pudiese',
    'pudiésemos',
    'pudieseis',
    'pudiesen',
    // Ser (to be)
    // First set (-ara/-ase endings):
    'fuera',
    'fueras',
    'fuera',
    'fuéramos',
    'fuerais',
    'fueran',
    // Second set (-iera/-iese endings):
    'fuese',
    'fueses',
    'fuese',
    'fuésemos',
    'fueseis',
    'fuesen',

    // Haber (to have, when used as an auxiliary)
    // First set (-ara/-ase endings):
    'hubiera',
    'hubieras',
    'hubiera',
    'hubiéramos',
    'hubierais',
    'hubieran',

    // Second set (-iera/-iese endings):
    'hubiese',
    'hubieses',
    'hubiese',
    'hubiésemos',
    'hubieseis',
    'hubiesen',

    // Estar (to be, in the context of state / condition)
    // First set (-ara/-ase endings):
    'estuviera',
    'estuvieras',
    'estuviera',
    'estuviéramos',
    'estuvierais',
    'estuvieran',
    // Second set (-iera/-iese endings):
    'estuviese',
    'estuvieses',
    'estuviese',
    'estuviésemos',
    'estuvieseis',
    'estuviesen',

    'estado',
    'estando',
    'estar',
    'ha',
    'habéis',
    'haber',
    'había',
    'habíais',
    'habíamos',
    'habían',
    'habías',
    'habrá',
    'habrán',
    'habrás',
    'habré',
    'habréis',
    'habremos',
    'habría',
    'habríais',
    'habríamos',
    'habrían',
    'habrías',
    'han',
    'has',
    'haya',
    'hayáis',
    'hayan',
    'hayas',
    'he',
    'hemos',
    'hube',
    'hubiera',
    'hubierais',
    'hubiéramos',
    'hubieran',
    'hubieras',
    'hubiere',
    'hubiereis',
    'hubiéremos',
    'hubieren',
    'hubieres',
    'hubieron',
    'hubiese',
    'hubieseis',
    'hubiesen',
    'hubieses',
    'hubimos',
    'hubiste',
    'hubisteis',
    'hubo',

    // Tener (to have, in the context of possession', 'obligation)
    // First set (-ara/-ase endings):
    'tuviera',
    'tuvieras',
    'tuviera',
    'tuviéramos',
    'tuvierais',
    'tuvieran',
    // Second set (-iera/-iese endings):
    'tuviese',
    'tuvieses',
    'tuviese',
    'tuviésemos',
    'tuvieseis',
    'tuviesen',

    // Hacer (to do, to make)
    // First set (-ara/-ase endings):
    'hiciera',
    'hiciese',
    'hicieras',
    'hicieses',
    'hiciera',
    'hiciese',
    'hiciéramos',
    'hiciésemos',
    'hicierais',
    'hicieseis',
    'hicieran',
    'hiciesen',

    // Venir (to come)
    // First set (-ara/-ase endings):
    'viniera',
    'vinieras',
    'viniera',
    'viniéramos',
    'vinierais',
    'vinieran',
    // Second set (-iera/-iese endings):
    'viniese',
    'vinieses',
    'viniese',
    'viniésemos',
    'vinieseis',
    'viniesen'
  ]);

  const tagAuxVerb = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    // only when an actual verb follows - 'fuera de la ciudad' is not an auxiliary
    if (isAux.has(term.normal) && term.tags.has('Verb') && terms[i + 1] && terms[i + 1].tags.has('Verb')) {
      setTag([term], 'Auxiliary', world, false, '3-auxiliary');
    }
  };

  // '¡Corre más rápido!' - a sentence-initial verb in an exclamation is a command.
  // tú/usted commands share their form with the present-tense, so they need this context to disambiguate
  const checkImperative = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (i !== 0 || !term.pre.includes('¡')) {
      return
    }
    if (
      term.tags.has('PresentTense') &&
      (term.tags.has('SecondPerson') || term.tags.has('ThirdPerson'))
    ) {
      setTag([term], 'Imperative', world, false, '3-exclamation-imperative');
    }
  };

  // 'yo como' - 'como' is usually a conjunction, 'vivo' an adjective, 'trabajo' a noun
  // but 'yo' and 'tú' are only ever the subject of a verb,
  // so a first-person form of a known verb, after 'yo', is that verb.
  const subjects$2 = {
    yo: ['FirstPerson', 'first'],
    tú: ['SecondPerson', 'second'],
  };

  // words that sit between a subject and its verb - 'yo no lo como'
  const fillers$2 = new Set([
    'no', 'nunca', 'ya', 'también', 'tampoco', 'siempre', 'casi', 'solo', 'sólo',
    'me', 'te', 'se', 'lo', 'la', 'le', 'los', 'las', 'les', 'nos', 'os',
  ]);

  const tenses$1 = { present: 'PresentTense', past: 'PastTense', imperfect: 'Imperfect', future: 'FutureTense' };

  const isInfinitive$4 = function (str, lexicon) {
    if (!lexicon.hasOwnProperty(str)) {
      return false
    }
    const tags = lexicon[str];
    return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
  };

  const subjectVerb = function (terms, i, world) {
    const found = subjects$2[terms[i].normal];
    if (!found) {
      return
    }
    let n = i + 1;
    while (terms[n] && fillers$2.has(terms[n].normal)) {
      n += 1;
    }
    const term = terms[n];
    if (!term || term.tags.has('Verb')) {
      return
    }
    const [tag, form] = found;
    const verb = world.methods.two.transform.verb;
    const lexicon = world.model.one.lexicon;
    // it has to be a known verb, that conjugates back to this word
    const res = verb.lookup(term.normal, { isVerb: (inf) => isInfinitive$4(inf, lexicon), known: true, tenses: Object.keys(tenses$1) });
    const hit = res ? res.hits.find((o) => o.person === form) : null;
    if (hit) {
      world.methods.one.setTag([term], ['Verb', tenses$1[hit.tense], tag], world, false, '3-subject-verb');
    }
  };

  // 'quiero que vengas' - 'vengas' is the subjunctive of 'venir', but also the present-tense of 'vengar'
  // after a verb of wanting, hoping or doubting, '.. que' takes the subjunctive.
  const triggers = [
    'querer', 'esperar', 'desear', 'necesitar', 'pedir', 'preferir', 'dudar', 'temer', 'sugerir', 'recomendar',
    'exigir', 'permitir', 'prohibir', 'rogar', 'mandar', 'ordenar', 'aconsejar', 'insistir', 'gustar', 'importar',
    'molestar', 'alegrar',
  ];
  // 'para que sepas', 'ojalá que llueva'
  const before$2 = new Set(['para', 'sin', 'ojalá', 'aunque']);
  // 'es importante que estudies'
  const impersonal = new Set(['importante', 'necesario', 'posible', 'imposible', 'mejor', 'probable', 'bueno', 'malo']);

  // words that sit between 'que' and its verb - 'que ella no lo haga'
  const fillers$1 = new Set([
    'yo', 'tú', 'él', 'ella', 'usted', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas', 'ustedes',
    'no', 'nunca', 'ya', 'también', 'me', 'te', 'se', 'lo', 'la', 'le', 'los', 'las', 'les', 'nos', 'os',
  ]);

  const persons$2 = [
    ['ThirdPerson', 'third'],
    ['FirstPerson', 'first'],
    ['SecondPerson', 'second'],
    ['FirstPersonPlural', 'firstPlural'],
    ['SecondPersonPlural', 'secondPlural'],
    ['ThirdPersonPlural', 'thirdPlural'],
  ];

  const isInfinitive$3 = function (str, lexicon) {
    if (!lexicon.hasOwnProperty(str)) {
      return false
    }
    const tags = lexicon[str];
    return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
  };

  // every conjugation of our trigger verbs
  let forms = null;
  const isTrigger = function (str, verb) {
    if (forms === null) {
      forms = new Set();
      triggers.forEach((inf) => verb.all(inf).forEach((w) => forms.add(w)));
    }
    return forms.has(str)
  };

  // does this 'que' follow something that wants a subjunctive?
  const hasTrigger = function (terms, i, verb) {
    const prev = terms[i - 1];
    if (!prev) {
      return false
    }
    if (before$2.has(prev.normal) || impersonal.has(prev.normal)) {
      return true
    }
    // 'quiero que', 'te pido a ti que'
    for (let k = i - 1; k >= 0 && k >= i - 4; k -= 1) {
      if (isTrigger(terms[k].normal, verb)) {
        return true
      }
    }
    return false
  };

  const checkSubjunctive = function (terms, i, world) {
    if (terms[i].normal !== 'que') {
      return
    }
    let n = i + 1;
    while (terms[n] && fillers$1.has(terms[n].normal)) {
      n += 1;
    }
    const term = terms[n];
    if (!term || !term.tags.has('Verb') || term.tags.has('Subjunctive') || term.tags.has('Infinitive')) {
      return
    }
    const verb = world.methods.two.transform.verb;
    if (!hasTrigger(terms, i, verb)) {
      return
    }
    const lexicon = world.model.one.lexicon;
    const str = term.normal;
    // prefer the person it already has
    const order = persons$2.filter((a) => term.tags.has(a[0])).concat(persons$2.filter((a) => !term.tags.has(a[0])));
    for (let k = 0; k < order.length; k += 1) {
      const [tag, form] = order[k];
      const inf = verb.fromSubjunctive(str, tag);
      if (inf && inf !== str && isInfinitive$3(inf, lexicon) && verb.toSubjunctive(inf)[form] === str) {
        const { setTag, unTag } = world.methods.one;
        const old = ['PresentTense', 'Imperative'].concat(persons$2.map((a) => a[0]));
        old.forEach((t) => unTag([term], t, world.model.one.tagSet));
        setTag([term], ['Verb', 'Subjunctive', tag], world, false, '3-que-subjunctive');
        return
      }
    }
  };

  // 'como' is nearly always a conjunction - 'tan alto como su padre', 'como siempre'
  // but it is also 'I eat' - 'como pan', 'no como carne', 'como y bebo'
  // a comparison needs a clause to hang from, so when 'como' leads a sentence that has
  // no other verb, it is the verb.

  // words that may come before the verb - 'hoy no lo como'
  const before$1 = new Set([
    'no', 'nunca', 'ya', 'también', 'tampoco', 'siempre', 'casi', 'solo', 'sólo', 'hoy', 'ahora', 'aquí',
    'normalmente', 'generalmente', 'mañana', 'luego', 'después', 'entonces', 'y', 'pero',
    'me', 'te', 'se', 'lo', 'la', 'le', 'los', 'las', 'les', 'nos', 'os',
  ]);
  // 'como siempre', 'como tú', 'como si nada', 'como resultado'
  const notAfter = new Set([
    'siempre', 'nunca', 'antes', 'si', 'que', 'yo', 'tú', 'él', 'ella', 'usted', 'nosotros', 'nosotras', 'vosotros',
    'ellos', 'ellas', 'ustedes', 'mucho', 'máximo', 'mínimo', 'resultado', 'consecuencia', 'ejemplo', 'respuesta',
    'parte', 'regla', 'norma', 'tal', 'era', 'es', 'ayer', 'hoy', 'mañana', 'entonces', 'nadie', 'todos', 'todo',
    'cualquier', 'cualquiera', 'quien', 'cuando', 'para', 'por', 'de', 'prueba', 'muestra',
  ]);
  const pronouns = new Set(['me', 'te', 'se', 'lo', 'la', 'le', 'los', 'las', 'les', 'nos', 'os']);
  // verb-forms that can not hold-up a clause on their own
  const nonFinite$1 = ['Infinitive', 'Gerund', 'Perfecto', 'Participle'];

  const isFinite$3 = (term) => term.tags.has('Verb') && !nonFinite$1.some((tag) => term.tags.has(tag));

  const como = function (terms, i, world) {
    const term = terms[i];
    if (term.normal !== 'como' || term.tags.has('Verb')) {
      return
    }
    const setVerb = (reason) => {
      term.tags.clear();
      world.methods.one.setTag([term], ['Verb', 'PresentTense', 'FirstPerson'], world, false, reason);
    };
    const prev = terms[i - 1];
    const next = terms[i + 1];
    // 'como y bebo', 'bebo y como'
    const isFirst = (t) => Boolean(t) && t.tags.has('Verb') && t.tags.has('FirstPerson');
    if (next && (next.normal === 'y' || next.normal === 'o') && isFirst(terms[i + 2])) {
      setVerb('3-como-y-verb');
      return
    }
    if (prev && (prev.normal === 'y' || prev.normal === 'o') && isFirst(terms[i - 2]) && !terms[i - 2].tags.has('Copula')) {
      setVerb('3-verb-y-como');
      return
    }
    // 'me lo como todo' - an object-pronoun is right before its verb
    if (prev && pronouns.has(prev.normal)) {
      setVerb('3-clitic-como');
      return
    }
    // nothing before it, but words like 'no', 'hoy'
    if (!terms.slice(0, i).every((t) => before$1.has(t.normal))) {
      return
    }
    // .. and no other verb for it to lean on
    if (terms.some((t, k) => k !== i && isFinite$3(t))) {
      return
    }
    if (!next) {
      // 'nunca como'
      if (i > 0) {
        setVerb('3-neg-como');
      }
      return
    }
    // 'no como mucho'
    const isNegated = prev && ['no', 'nunca', 'tampoco', 'casi'].includes(prev.normal);
    if (next.normal === 'mucho' && isNegated) {
      setVerb('3-como-mucho');
      return
    }
    if (notAfter.has(next.normal) || next.tags.has('Pronoun') || next.tags.has('Conjunction')) {
      return
    }
    setVerb('3-como-verb');
  };

  // many verb-forms are also a noun or an adjective - 'vino', 'juego', 'trabajo', 'camino', 'vivo'
  // and the lexicon gives them to the noun.
  // so look for one of these, in a place where a verb goes.

  // each subject, and the person of its verb - 'yo vino' is not a verb
  const subjects$1 = {
    yo: 'first',
    tú: 'second',
    él: 'third',
    ella: 'third',
    usted: 'third',
    nosotros: 'firstPlural',
    nosotras: 'firstPlural',
    vosotros: 'secondPlural',
    vosotras: 'secondPlural',
    ellos: 'thirdPlural',
    ellas: 'thirdPlural',
    ustedes: 'thirdPlural',
  };
  // words that are followed by a verb - 'no [vino]', 'se [cierra]', 'dice que [vino]'
  const before = new Set(['no', 'nunca', 'ya', 'también', 'tampoco', 'siempre', 'me', 'te', 'se', 'nos', 'os', 'le', 'les', 'que', 'si', 'cuando', 'porque', 'donde', 'quien']);
  // .. these ones begin a clause, and a noun can follow them too
  const clauseWords = new Set(['que', 'si', 'cuando', 'porque', 'donde', 'quien']);
  // 'qué vino [tan] bueno'
  const degrees = new Set(['tan', 'más', 'muy', 'menos']);
  const reflexives$1 = new Set(['me', 'te', 'se', 'nos', 'os']);
  const joins$1 = new Set(['y', 'o', 'pero']);
  // 'vino [mañana]'
  const dates$1 = new Set(['mañana', 'ayer', 'hoy', 'tarde', 'temprano', 'anoche', 'ahora']);
  // 'trabajo [de] noche' - but 'trabajo de equipo' is a noun-phrase
  const deWords = new Set(['día', 'noche', 'tarde', 'mañana', 'nuevo', 'prisa', 'vez', 'pie']);
  const tenses = { present: 'PresentTense', past: 'PastTense', imperfect: 'Imperfect', future: 'FutureTense' };
  const persons$1 = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };
  const nonFinite = ['Infinitive', 'Gerund', 'Perfecto', 'Participle'];

  const isInfinitive$2 = function (str, lexicon) {
    const tags = lexicon.hasOwnProperty(str) ? lexicon[str] : null;
    return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
  };
  const isFiniteTag = (term) => term.tags.has('Verb') && !nonFinite.some((tag) => term.tags.has(tag));
  // a verb-form after 'la' or 'mi' will become a noun - 'pago la [cuenta]'
  const isFinite$2 = function (term, i, terms) {
    const prev = terms[i - 1];
    return isFiniteTag(term) && !(prev && prev.tags.has('Determiner'))
  };
  const isNoun$1 = (term) => Boolean(term) && term.tags.has('Noun') && !term.tags.has('Pronoun');
  // something that a verb can lead into - 'juego [al] fútbol', 'cierra [la] puerta', 'vivo [aquí]'
  const isObject = function (term) {
    if (!term) {
      return false
    }
    const tags = term.tags;
    return tags.has('Determiner') || tags.has('Preposition') || tags.has('Adverb') || tags.has('Value') || dates$1.has(term.normal)
  };

  const homographVerbs = function (terms, world) {
    const lexicon = world.model.one.lexicon;
    const verb = world.methods.two.transform.verb;
    const isVerb = (inf) => isInfinitive$2(inf, lexicon);
    const lookup = function (term, i) {
      const tags = term.tags;
      // 'me [visto]' is 'vestir' - a participle needs its auxiliary before it
      const prev = terms[i - 1];
      const isReflexive = tags.has('Perfecto') && Boolean(prev) && reflexives$1.has(prev.normal);
      if (!isReflexive && (tags.has('Verb') || !(tags.has('Noun') || tags.has('Adjective')))) {
        return null
      }
      if (tags.has('Pronoun') || term.implicit !== undefined) {
        return null
      }
      // a name, or a place - 'en Vino Tinto'
      if (term.normal.length < 3 || (i > 0 && /^\p{Lu}/u.test(term.text || ''))) {
        return null
      }
      return verb.lookup(term.normal, { isVerb, known: true, tenses: Object.keys(tenses) })
    };
    const tag = function (term, hit, reason) {
      term.tags.clear();
      world.methods.one.setTag([term], ['Verb', tenses[hit.tense], persons$1[hit.person]], world, false, reason);
    };
    // is there a verb already, in this part of the sentence? - 'trabajo de día | y estudio de noche'
    const hasVerb = function (i) {
      const isEdge = (t) => joins$1.has(t.normal) || /[,;:]/.test(t.post);
      let start = i;
      while (start > 0 && !isEdge(terms[start - 1])) {
        start -= 1;
      }
      let end = i;
      while (end < terms.length - 1 && !isEdge(terms[end]) && !joins$1.has(terms[end + 1].normal)) {
        end += 1;
      }
      return terms.slice(start, end + 1).some(isFinite$2)
    };
    let person = null;
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      const prev = terms[i - 1];
      const next = terms[i + 1];
      const found = lookup(term, i);
      if (!found) {
        continue
      }
      // one more verb, for the same subject - 'trabajo de día y [estudio] de noche'
      if (person !== null && prev && joins$1.has(prev.normal)) {
        const same = found.hits.find((o) => o.person === person);
        if (same) {
          tag(term, same, '3-homograph-verb-and');
        }
        continue
      }
      let hit = null;
      if (prev && subjects$1.hasOwnProperty(prev.normal)) {
        // 'ella cierra la puerta'
        hit = found.hits.find((o) => o.person === subjects$1[prev.normal]);
      } else if (prev && before.has(prev.normal)) {
        // 'no vino', 'dice que vino mañana' - but 'más alto que bajo', 'dice que nada importa'
        // .. and 'donde vivo, nieva mucho'
        const isEnd = prev.normal !== 'que' && (!next || /,/.test(term.post));
        const isLoose = clauseWords.has(prev.normal) && !isObject(next) && !isEnd;
        // an exclamation, with no clause before it - 'que vino tan bueno!'
        const isExclaim = i === 1 && prev.normal === 'que' && next && degrees.has(next.normal);
        hit = isLoose || isExclaim ? null : found.hits[0];
      } else if (hasVerb(i)) ; else if (!prev) {
        // 'Juego al fútbol.', 'Vino mañana.'
        const after = terms[i + 2];
        const isOf = next && next.normal === 'de' && !(after && (deWords.has(after.normal) || after.tags.has('Infinitive')));
        hit = isObject(next) && !isOf ? found.hits[0] : null;
      } else if (isNoun$1(prev) && isObject(next)) {
        // 'mi madre cocina la cena'
        hit = found.hits.find((o) => o.person === 'third' || o.person === 'thirdPlural');
      }
      if (hit) {
        tag(term, hit, '3-homograph-verb');
        person = hit.person;
      }
    }
  };

  // a negative command is the subjunctive - 'no vengas', 'no te vayas', 'no lo toques'
  // some of these are also the present-tense of another verb:
  // 'vengas' is 'venir' here, and not 'tú vengas' from 'vengar'

  // object-pronouns go between 'no' and the verb
  const clitics$2 = new Set(['me', 'te', 'se', 'lo', 'la', 'le', 'los', 'las', 'les', 'nos', 'os']);
  // the persons that can be told what to do
  const persons = [
    ['SecondPerson', 'second'],
    ['ThirdPerson', 'third'],
    ['SecondPersonPlural', 'secondPlural'],
    ['ThirdPersonPlural', 'thirdPlural'],
    ['FirstPersonPlural', 'firstPlural'],
  ];
  // their subjunctive is more likely than the present-tense of the verb it looks like:
  // 'vengas' (vengar), 'sientas' (sentar), 'creas' (crear), 'mientas' (mentar)
  const preferred = new Set(['venir', 'sentir', 'creer', 'mentir']);
  const old = ['PresentTense', 'Subjunctive', 'FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'];

  const isInfinitive$1 = function (str, lexicon) {
    const tags = lexicon.hasOwnProperty(str) ? lexicon[str] : null;
    return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
  };

  const negativeCommand = function (terms, world) {
    if (!terms[0] || terms[0].normal !== 'no') {
      return
    }
    let n = 1;
    while (terms[n] && clitics$2.has(terms[n].normal)) {
      n += 1;
    }
    const term = terms[n];
    if (!term || !term.tags.has('Verb') || term.tags.has('Imperative') || term.tags.has('Infinitive')) {
      return
    }
    // a statement has its subject - 'no vengas tú', but 'no viene nadie'
    const isSubjunctive = term.tags.has('Subjunctive');
    if (!isSubjunctive && !term.tags.has('PresentTense')) {
      return
    }
    const verb = world.methods.two.transform.verb;
    const lexicon = world.model.one.lexicon;
    const str = term.normal;
    for (let k = 0; k < persons.length; k += 1) {
      const [tag, form] = persons[k];
      const inf = (verb.fromSubjunctive(str, tag) || '').replace(/([aeií]r)se$/, '$1');
      // it has to be the subjunctive of a verb that we know
      if (inf && inf !== str && isInfinitive$1(inf, lexicon) && verb.toSubjunctive(inf)[form] === str) {
        // 'no paras de hablar' is the present of 'parar' - only these verbs win over a present-tense
        if (!isSubjunctive && !preferred.has(inf)) {
          continue
        }
        const { setTag, unTag } = world.methods.one;
        old.forEach((t) => unTag([term], t, world.model.one.tagSet));
        setTag([term], ['Verb', 'Imperative', tag], world, false, '3-negative-command');
        return
      }
    }
  };

  // our list of names has few accents - 'María' is found as 'maria'
  // (and without this, the '-ría' suffix makes it a conditional verb)
  const names = ['FemaleName', 'MaleName', 'FirstName', 'LastName'];
  const plain = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };

  const accentName = function (terms, i, world) {
    const term = terms[i];
    const text = term.text || '';
    if (term.tags.size > 0 || !/^\p{Lu}\p{Ll}/u.test(text) || !/[áéíóú]/.test(term.normal)) {
      return null
    }
    const str = term.normal.replace(/[áéíóú]/g, (c) => plain[c]);
    const lexicon = world.model.one.lexicon;
    const tags = lexicon.hasOwnProperty(str) ? [].concat(lexicon[str]) : [];
    if (tags.some((tag) => names.includes(tag))) {
      world.methods.one.setTag([term], tags, world, false, '2-accent-name');
      return true
    }
    return null
  };

  // 1st pass

  // these methods don't care about word-neighbours
  const firstPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      //  is it titlecased?
      const found = tagTitleCase(terms, i, world);
      // try look-like rules
      found || checkRegex(terms, i, world);
      // turn '1993' into a year
      tagYear(terms, i, world);
    }
  };
  const secondPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      let found = isAcronym(terms, i, world);
      found = found || accentName(terms, i, world);
      found = found || checkEnclitic(terms, i, world);
      found = found || suffixCheck(terms, i, world);
      // found = found || neighbours(terms, i, world)
      found || fallback(terms, i, world);
    }
  };

  const thirdPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      guessNounGender(terms, i, world);
      guessPlural(terms, i, world);
      guessAdjPlural(terms, i, world);
      guessAdjGender(terms, i, world);
      tagAuxVerb(terms, i, world);
      guessVerbForm(terms, i, world);
      checkImperative(terms, i, world);
    }
  };

  // these methods look at the words before them
  const fourthPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      subjectVerb(terms, i, world);
      checkSubjunctive(terms, i, world);
      como(terms, i, world);
    }
  };

  const tagger$1 = function (view) {
    const world = view.world;
    view.docs.forEach((terms) => {
      firstPass(terms, world);
      secondPass(terms, world);
      thirdPass(terms, world);
      fourthPass(terms, world);
      homographVerbs(terms, world);
      negativeCommand(terms, world);
    });
    return view
  };

  var regexNormal = [
    //web tags
    [/^[\w.]+@[\w.]+\.[a-z]{2,3}$/, 'Email'],
    [/^(https?:\/\/|www\.)+\w+\.[a-z]{2,3}/, 'Url', 'http..'],
    [/^[a-z0-9./].+\.(com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)/, 'Url', '.com'],

    // timezones
    [/^[PMCE]ST$/, 'Timezone', 'EST'],

    //names
    [/^ma?c'.*/, 'LastName', "mc'neil"],
    [/^o'[drlkn].*/, 'LastName', "o'connor"],
    [/^ma?cd[aeiou]/, 'LastName', 'mcdonald'],

    //slang things
    [/^(lol)+[sz]$/, 'Expression', 'lol'],
    [/^wo{2,}a*h?$/, 'Expression', 'wooah'],
    [/^(hee?){2,}h?$/, 'Expression', 'hehe'],
    [/^(un|de|re)\\-[a-z\u00C0-\u00FF]{2}/, 'Verb', 'un-vite'],

    // m/h
    [/^(m|k|cm|km)\/(s|h|hr)$/, 'Unit', '5 k/m'],
    // μg/g
    [/^(ug|ng|mg)\/(l|m3|ft3)$/, 'Unit', 'ug/L'],
  ];

  var regexNumbers = [

    [/^@1?[0-9](am|pm)$/i, 'Time', '3pm'],
    [/^@1?[0-9]:[0-9]{2}(am|pm)?$/i, 'Time', '3:30pm'],
    [/^'[0-9]{2}$/, 'Year'],
    // times
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])$/, 'Time', '3:12:31'],
    [/^[012]?[0-9](:[0-5][0-9])?(:[0-5][0-9])? ?(am|pm)$/i, 'Time', '1:12pm'],
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])? ?(am|pm)?$/i, 'Time', '1:12:31pm'], //can remove?

    // iso-dates
    [/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/i, 'Date', 'iso-date'],
    [/^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,4}$/, 'Date', 'iso-dash'],
    [/^[0-9]{1,4}\/[0-9]{1,2}\/[0-9]{1,4}$/, 'Date', 'iso-slash'],
    [/^[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,4}$/, 'Date', 'iso-dot'],
    [/^[0-9]{1,4}-[a-z]{2,9}-[0-9]{1,4}$/i, 'Date', '12-dec-2019'],

    // timezones
    [/^utc ?[+-]?[0-9]+$/, 'Timezone', 'utc-9'],
    [/^(gmt|utc)[+-][0-9]{1,2}$/i, 'Timezone', 'gmt-3'],

    //phone numbers
    [/^[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '421-0029'],
    [/^(\+?[0-9][ -])?[0-9]{3}[ -]?[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '1-800-'],


    //money
    //like $5.30
    [
      /^[-+]?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6][-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?([kmb]|bn)?\+?$/,
      ['Money', 'Value'],
      '$5.30',
    ],
    //like 5.30$
    [
      /^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]\+?$/,
      ['Money', 'Value'],
      '5.30£',
    ],
    //like
    [/^[-+]?[$£]?[0-9]([0-9,.])+(usd|eur|jpy|gbp|cad|aud|chf|cny|hkd|nzd|kr|rub)$/i, ['Money', 'Value'], '$400usd'],

    //numbers
    // 50 | -50 | 3.23  | 5,999.0  | 10+
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?\+?$/, ['Cardinal', 'NumericValue'], '5,999'],
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|r?th|°)$/, ['Ordinal', 'NumericValue'], '53rd'],
    // .73th
    [/^\.[0-9]+\+?$/, ['Cardinal', 'NumericValue'], '.73th'],
    //percent
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?%\+?$/, ['Percent', 'Cardinal', 'NumericValue'], '-4%'],
    [/^\.[0-9]+%$/, ['Percent', 'Cardinal', 'NumericValue'], '.3%'],
    //fraction
    [/^[0-9]{1,4}\/[0-9]{1,4}(st|nd|rd|th)?s?$/, ['Fraction', 'NumericValue'], '2/3rds'],
    //range
    [/^[0-9.]{1,3}[a-z]{0,2}[-–—][0-9]{1,3}[a-z]{0,2}$/, ['Value', 'NumberRange'], '3-4'],
    //time-range
    [/^[0-9]{1,2}(:[0-9][0-9])?(am|pm)? ?[-–—] ?[0-9]{1,2}(:[0-9][0-9])?(am|pm)$/, ['Time', 'NumberRange'], '3-4pm'],
    //with unit
    [/^[0-9.]+([a-z]{1,4})$/, 'Value', '9km'],
  ];

  var regexText = [
    // #coolguy
    [/^#[a-z0-9_\u00C0-\u00FF]{2,}$/i, 'HashTag'],

    // @spencermountain
    [/^@\w{2,}$/, 'AtMention'],

    // period-ones acronyms - f.b.i.
    [/^([A-ZÄÖÜ]\.){2}[A-ZÄÖÜ]?/i, ['Acronym', 'Noun'], 'F.B.I'], //ascii-only

    // ending-apostrophes
    [/.{3}[lkmnp]in['‘’‛‵′`´]$/, 'Gerund', "chillin'"],
    [/.{4}s['‘’‛‵′`´]$/, 'Possessive', "flanders'"],
  ];

  const rb = 'Adverb';
  const nn = 'Noun';
  const vb = 'Verb';
  const jj = 'Adjective';
  const cond = 'Conditional';
  const fut = 'FutureTense';
  // const inf = 'Infinitive'
  const g = 'Gerund';
  const ref = 'Reflexive';
  const imp = 'Imperfect';
  const pl = ['Noun', 'Plural'];

  var suffixPatterns = [
    null,
    {
      // one-letter suffixes
      'ó': vb,
    },
    {
      // two-letter suffixes
      al: jj,
      ño: jj,
      // no: jj,
      // do: vb,
      // ar: vb,
      // an: vb, - too greedy - 'pan', 'plan', 'capitán'
      'ió': vb,
      // en: vb, - too greedy - 'examen', 'imagen', 'orden'
      ir: vb,
      er: vb,
      'tó': vb,
    },
    {
      // three-letter suffixes
      ico: jj,
      // ica: jj,
      ble: jj,
      nal: jj,
      ial: jj,
      oso: jj,
      iso: jj,
      ito: jj,
      ita: jj,
      izo: jj,
      cto: jj,
      ana: jj,
      eos: jj,
      // ado: vb,
      // ndo: first, - 'ando'/'endo' gerund rules cover this
      // ada: vb, - 'llegada', 'mirada' are nouns
      ron: vb,
      // ido: vb,
      aba: imp,
      tar: vb,
      gar: vb,
      nar: vb,
      'ían': imp,
      rar: vb,
      // ría: cond, - 'librería', 'categoría' - see aría/ería/iría below
      aré: fut,
      iré: fut,
      eré: fut,
      rás: fut,
      ará: fut,
      ado: vb,
      pto: jj,
      osa: jj,
      tos: pl,

      // ida: vb,
    },
    {
      // four-letter suffixes
      itas: jj,
      itos: jj,
      icos: jj,
      icas: jj,
      tico: jj,
      fica: jj,
      gica: jj,
      mica: jj,
      nica: jj,
      lica: jj,
      tica: jj,
      able: jj,
      tivo: jj,
      sivo: jj,
      esco: jj,
      iaco: jj,
      íaco: jj,
      áceo: jj,
      áneo: jj,
      icio: jj,
      culo: jj,
      aria: jj,
      bles: jj,
      tiva: jj,
      ante: jj,
      ente: jj,
      ánea: jj,
      siva: jj,
      ular: jj,
      osas: jj,
      ales: jj,
      iles: jj,
      anos: jj,
      osos: jj,
      'ción': nn,
      idad: nn,
      ento: nn,
      ncia: nn,
      'sión': nn,
      ando: g,
      endo: g,
      // ados: vb,
      aron: vb,
      adas: vb,
      // tado: first, - 'cantado' is a participle, not first-person
      // amos: cond, - '-amos' is present/preterite, never conditional
      // rías: cond, - 'librerías' - see arías/erías/irías below
      // rían: cond,
      abas: imp,
      aban: imp,
      'íais': imp,
      'aría': cond,
      // ería: cond, - 'librería', 'panadería' - too many -ería nouns
      'iría': cond,
      'dría': cond, // podría, tendría
      'bría': cond, // habría, sabría
      réis: fut,
      arán: fut,
      // refexive verbs
      arse: ref,
      arte: ref,
      arme: ref,
      irse: ref,
      irte: ref,
      erse: ref,
      dose: ref,
      ario: jj,
      orio: jj,
      iano: jj,
      dero: jj,
      fero: jj,
      jero: jj,
      lero: jj,
      nero: jj,
      tero: jj,
      ares: pl, // lugares, hogares
      ores: pl, // profesores, flores
      rios: jj,
      ivos: jj,
    },
    { // five-letter suffixes
      'ación': nn,
      mente: rb,
      ísimo: jj,
      icano: jj,
      ntino: jj,
      tivas: jj,
      andés: jj,
      adora: jj,
      antes: jj,
      iendo: g,
      yendo: g,
      ieron: vb,
      remos: fut,
      iente: jj,
      entes: jj,
      'íamos': imp,
      'arías': cond,
      // erías: cond, - 'librerías'
      'irías': cond,
      'drías': cond,
      'brías': cond,
      'arían': cond,
      'erían': cond,
      'irían': cond,
      'drían': cond,
      'brían': cond,
    },
    {
      // six-letter suffixes
      ística: jj,
      ciones: nn,
      'ábamos': imp,
      'ríamos': cond,
    },
    {
      // seven-letter suffixes
      aciones: nn
    }
  ];

  var model = {
    regexNormal,
    regexNumbers,
    regexText,
    suffixPatterns
  };

  const m$1 = 'm';
  const f$1 = 'f';

  // learned in ./learn/wikicorpus
  var suffixes = [
    {},
    {
      o: m$1,
      e: m$1, //this one is only 75% correct
      s: m$1,
      l: m$1,
      a: f$1
    },
    {
      os: m$1,
      to: m$1,
      io: m$1,
      or: m$1,
      do: m$1,
      ro: m$1,
      no: m$1,
      mo: m$1,
      lo: m$1,
      te: m$1,
      co: m$1,
      go: m$1,
      so: m$1,
      je: m$1,
      as: f$1,
      ia: f$1,
      ra: f$1,
      'ía': f$1,
      ta: f$1,
      da: f$1,
      na: f$1,
      la: f$1,
      ca: f$1,
      za: f$1,
      sa: f$1
    },
    {
      tos: m$1,
      dos: m$1,
      ios: m$1,
      ado: m$1,
      ros: m$1,
      nos: m$1,
      los: m$1,
      rio: m$1,
      les: m$1,
      ero: m$1,
      cos: m$1,
      ras: f$1,
      ias: f$1,
      tas: f$1,
      las: f$1,
      nas: f$1,
      ura: f$1,
      das: f$1,
      'ría': f$1,
      ada: f$1,
      era: f$1,
      'ías': f$1,
      ica: f$1,
      ina: f$1
    },
    {
      ento: m$1,
      ores: m$1,
      ador: m$1,
      ismo: m$1,
      ados: m$1,
      'ción': f$1,
      idad: f$1,
      'sión': f$1,
      tura: f$1
    },
    {
      entos: m$1,
      'ación': f$1,
      encia: f$1,
      lidad: f$1,
      'cción': f$1,
      dades: f$1,
      ncias: f$1,
      'ición': f$1
    },
    {
      miento: m$1,
      adores: m$1,
      ciones: f$1,
      'tación': f$1,
      'ración': f$1,
      'cación': f$1
    },
    {
      amiento: m$1,
      aciones: f$1,
      'ización': f$1
    }
  ];

  // some common exceptions to our rules (limited)
  const m = new Set([
    'nombre', 'año', 'tiempo', 'grupo', 'sistema',
    'and', 'sur', 'tipo', 'álbum', 'nivel',
    'origen', 'poder', 'cuerpo', 'hecho',
    'campo', 'papel', 'carácter',
    'tamaño', 'aire', 'problema', 'metal',
    'idioma', 'corazón', 'video', 'pie',
    'latín', 'obispo', 'single', 'príncipe',
    'catalán', 'deseo', 'alemán',
    'filósofo', 'huevo', 'tubo', 'géographique',
    'cráneo', 'reflejo', 'vértice', 'timbre',
    'día', 'mapa', 'planeta', 'sofá', 'clima',
    'tema', 'drama', 'programa', 'poema', 'tranvía',
  ]);

  const f = new Set([
    'ciudad', 'parte', 'forma', 'vez', 'serie',
    'the', 'región', 'muerte', 'agua',
    'capital', 'final', 'línea', 'área',
    'orden', 'edad', 'madre', 'mujer',
    'superficie', 'especie', 'luz', 'voz',
    'hija', 'lengua', 'imagen',
    'fecha', 'sede', 'sociedad', 'noche',
    'gente', 'calle', 'ley', 'clase',
    'mano', 'foto', 'moto', 'flor', 'radio',
    'sal', 'piel', 'miel', 'nube', 'sangre', 'tos',
  ]);
  var genders = { f, m };

  //sweep-through all suffixes
  const bySuffix = function (str) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i > 0; i -= 1) {
      const suffix = str.substr(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
        const tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  const guessGender = function (str) {
    if (genders.f.has(str)) {
      return 'f'
    }
    if (genders.m.has(str)) {
      return 'm'
    }
    return bySuffix(str)
  };

  // roughly, split a document by comma or semicolon
  const splitOn = function (terms, i) {
    const isNum = /^[0-9]+$/;
    const term = terms[i];
    // early on, these may not be dates yet:
    if (!term) {
      return false
    }
    const maybeDate = new Set(['may', 'april', 'august', 'jan']);
    // veggies, like figs
    if (term.normal === 'like' || maybeDate.has(term.normal)) {
      return false
    }
    // toronto, canada  - tuesday, march
    if (term.tags.has('Place') || term.tags.has('Date')) {
      return false
    }
    if (terms[i - 1]) {
      const lastTerm = terms[i - 1];
      // thursday, june
      if (lastTerm.tags.has('Date') || maybeDate.has(lastTerm.normal)) {
        return false
      }
      // pretty, nice, and fun
      if (lastTerm.tags.has('Adjective') || term.tags.has('Adjective')) {
        return false
      }
    }
    // don't split numbers, yet
    const str = term.normal;
    if (str.length === 1 || str.length === 2 || str.length === 4) {
      if (isNum.test(str)) {
        return false
      }
    }
    return true
  };

  // kind-of a dirty sentence chunker
  const quickSplit = function (document) {
    const splitHere = /[,:;]/;
    const arr = [];
    document.forEach(terms => {
      let start = 0;
      terms.forEach((term, i) => {
        // does it have a comma/semicolon ?
        if (splitHere.test(term.post) && splitOn(terms, i + 1)) {
          arr.push(terms.slice(start, i + 1));
          start = i + 1;
        }
      });
      if (start < terms.length) {
        arr.push(terms.slice(start, terms.length));
      }
    });
    return arr
  };

  // 'gatos', 'cafés' - but not 'lunes', 'crisis', 'país', 'paraguas'
  const looksPlural = function (str) {
    // not long enough to be plural - 'gas', 'mes', 'res', 'tos'
    if (!str || str.length <= 3) {
      return false
    }
    return !isSingular(str)
  };

  var methods = {
    two: {
      quickSplit,
      looksPlural,
      guessGender: guessGender,
    }
  };

  var preTagger = {
    compute: {
      preTagger: tagger$1
    },
    model: {
      two: model
    },
    methods,
    hooks: ['preTagger']
  };

  var matches = [
    // east berlin
    { match: '[este] #Place', group: 0, tag: 'Adjective', reason: 'este-place' },
    // ('treinta y dos' and 'menos cinco' are done in ./numbers.js)
    // 3 pintas de cerveza
    { match: '#Value [#PresentTense] de #Noun', group: 0, tag: 'Plural', reason: '3-pintas' },

    // adjective-noun
    { match: '#Determiner [#Adjective]$', group: 0, tag: 'Noun', reason: 'det-adj' },
    // la tarde
    { match: '#Determiner [#Adverb]$', group: 0, tag: 'Noun', reason: 'det-adv' },
    // el final de
    { match: '#Determiner [#Adjective] (de|del)', group: 0, tag: 'Noun', reason: 'det-adj' },

    // homographs - 'él vino a casa' (he came home)
    { match: '#Pronoun [vino] (a|de|en|con)', group: 0, tag: ['Verb', 'PastTense', 'ThirdPerson'], reason: 'el-vino' },
    // (articles before a verb-form are done in ./article-clitic.js)
    // 'gran parte de', 'forma parte de'
    { match: '(gran|mayor|buena|toda|esa|esta) [parte]', group: 0, tag: 'Noun', reason: 'gran-parte' },

    // no exageres
    { match: 'no [(#Noun && !#Pronoun)]', group: 0, tag: 'Verb', reason: 'no-noun' },

    // moods
    // 'espero que tengas' - a command-form after 'que' is subjunctive
    { match: 'que [#Imperative]', group: 0, tag: 'Subjunctive', reason: 'que-subjunctive' },
    // 'ojalá llueva mañana'
    { match: '(ojalá|quizás|quizá) [#Imperative]', group: 0, tag: 'Subjunctive', reason: 'ojalá-subjunctive' },
    // 'no hables tan alto' - a negative command borrows the subjunctive form
    { match: '^no [#Subjunctive]', group: 0, tag: 'Imperative', reason: 'negative-imperative' },

    // auxiliary verbs
    { match: '[#Modal] #Verb', group: 0, tag: 'Auxiliary', reason: 'modal-verb' },
    // alcanzar + infinitive (to manage to do)
    // comenzar + infinitive (to begin doing)
    // resultar + infinitive (to end up doing)
    {
      match: '[(alcanzar|comenzar|resultar)] #Infinitive',
      group: 0,
      tag: 'Auxiliary',
      reason: 'alcanzar-inf'
    },
    // haber de + infinitive (to have to do)
    // parar de + infinitive (to stop doing)
    { match: '[{haber/verb} de] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'haber-de-inf' },
    { match: '[{parar/verb} de] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'haber-de-inf' },
    // seguir + gerund (to keep on doing, to continue to do)
    { match: '[{seguir/verb}] #Gerund', group: 0, tag: 'Auxiliary', reason: 'seguir-gerund' },
    // be walking
    { match: '[{estar/verb}] #Gerund', group: 0, tag: 'Auxiliary', reason: 'estar-gerund' },
    // andar + present participle (to go about done)
    { match: '[{andar/verb}] #Verb', group: 0, tag: 'Auxiliary', reason: 'andar-verb' },
    // acabar (present tense) de + past participle (to have recently done)
    { match: '[{acabar/verb}] #Verb de', group: 0, tag: 'Auxiliary', reason: 'acabar-verb-de' },
    // echar a + infinitive (to begin doing)
    { match: '[{echar/verb}] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'echar-inf' },
    // quedar en + infinitive (to arrange to do )
    { match: '[{quedar/verb} en] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'quedar-en-inf' },
    // poder  "to be able to"
    { match: '[{poder/verb}] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'poder-inf' },
    // 'se venden casas' - the thing that is sold, not 'tú casas'
    { match: 'se #ThirdPersonPlural [(#SecondPerson && /s$/)]', group: 0, tag: 'Plural', reason: 'se-venden-casas' },
    // any missing estar
    { match: '[#Copula] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'copula-inf' },
  ];

  // la / los / las are articles, and are also object-pronouns - 'las compras' is 'the purchases', and 'you buy them'
  // so when the next word is a verb-form, choose between them:
  //  1. can it follow this article at all? - 'los tengo', 'la veo', 'la tienen' can not
  //  2. is it a real verb-form? - 'la calle', 'los bailes' are only a subjunctive, and want a 'no' or a 'que'
  //     and 'la tiene', 'los vendes' are '-er' verbs, that do not look like a noun
  //  3. what is around it? - 'ella la cuenta' and 'la paga Juan', but 'en la cuenta' and 'la cuenta es alta'
  // .. while un / una / unos / unas, and mi / tu / su, are never pronouns - and 'el' is one only by a typo ('el tiene')

  // is it a plural?
  const articles = { el: false, un: false, una: false, unos: true, unas: true, la: false, los: true, las: true };
  const clitics$1 = new Set(['la', 'los', 'las', 'lo']);
  // feminine nouns in '-o'
  const femaleO = new Set(['mano', 'foto', 'moto', 'radio', 'modelo']);
  // words that an object-pronoun follows - 'no la veo', 'ella la cuenta', 'se la doy'
  const verbBefore = new Set('no,nunca,tampoco,me,te,se,nos,os,le,les'.split(',').concat(Object.keys(subjects$1)));
  // .. or a noun - 'si la cuenta es alta', but 'si la compra'
  const clauseBefore = new Set('que,si,cuando,porque,donde,quien,como,ya,también,siempre,aquí,ahora,hoy'.split(','));
  const joins = new Set(['y', 'o', 'pero', 'ni']);

  const getStr = (term) => term.implicit || term.normal;
  const has$1 = (term, tag) => Boolean(term) && term.tags.has(tag);
  const hasPunct = (term) => /[,;:.!?]/.test(term.post || '');
  const isFinite$1 = (term) => has$1(term, 'Verb') && !['Infinitive', 'Gerund', 'Perfecto'].some((tag) => has$1(term, tag));
  const isAdverb = (term) => has$1(term, 'Adverb') || has$1(term, 'Negative');

  const tagArticles = function (view) {
    const world = view.world;
    const setTag = world.methods.one.setTag;
    const { noun, verb } = world.methods.two.transform;
    const lexicon = world.model.one.lexicon;
    const isVerb = (inf) => lexicon.hasOwnProperty(inf) && [].concat(lexicon[inf]).includes('Infinitive');
    // a noun that we know - 'la parte', 'las partes'
    const isKnown = (str) => [str, noun.fromPlural(str)].some((s) => genders.f.has(s) || genders.m.has(s) || lexicon[s] === 'Noun');

    view.docs.forEach((terms) => {
      // does a verb begin here? - '[es] alta', '[la paga] Juan', '[ya no] van'
      const verbAt = function (n) {
        while (isAdverb(terms[n])) {
          n += 1;
        }
        const term = terms[n];
        if (term && (clitics$1.has(getStr(term)) || verbBefore.has(getStr(term)))) {
          return isFinite$1(terms[n + 1])
        }
        return isFinite$1(term)
      };
      let choose = null;
      // what do the words after it say?
      const lookAfter = function (i) {
        const next = terms[i + 1];
        if (!next || hasPunct(terms[i])) {
          return null
        }
        // 'la intenta comprar'
        if (has$1(next, 'Infinitive') || has$1(next, 'Gerund')) {
          return 'Verb'
        }
        // 'la cuenta es alta', 'la toma de la ciudad', 'las cocinas modernas'
        if (verbAt(i + 1) || getStr(next) === 'de' || has$1(next, 'Adjective')) {
          return 'Noun'
        }
        // 'la compra y la vende', but 'las casas y el gato'
        if (joins.has(getStr(next)) && terms[i + 2]) {
          const str = getStr(terms[i + 2]);
          if (articles.hasOwnProperty(str) && has$1(terms[i + 3], 'Verb')) {
            return choose(i + 2)
          }
          return verbAt(i + 2) ? 'Verb' : 'Noun'
        }
        // 'la limpia cada día', 'la paga Juan', 'la canta muy bien'
        const isAfter = ['Adverb', 'Determiner', 'Value', 'ProperNoun', 'Pronoun', 'Date'].some((tag) => has$1(next, tag));
        return isAfter ? 'Verb' : null
      };
      // is the verb-form after this article a noun, or a verb?
      choose = function (i) {
        const art = getStr(terms[i]);
        const term = terms[i + 1];
        const str = term.normal;
        const prev = terms[i - 1];
        const before = prev && !hasPunct(prev) ? getStr(prev) : '';
        // 'el baile', 'un viaje', 'del hecho' - but 'el' may be 'él', before its own verb-form - 'el tiene'
        const isEl = art === 'el';
        if (!clitics$1.has(art) && !(isEl && has$1(term, 'ThirdPerson'))) {
          return 'Noun'
        }
        // 'la mujer', 'los vestidos', 'los cuadernos' - and 'en la cuenta', 'pago la cuenta'
        const isObject = before && (has$1(prev, 'Preposition') || has$1(prev, 'Verb'));
        if (!isFinite$1(term) || (/[^m]os$/.test(str) && art !== 'la') || isObject) {
          return 'Noun'
        }
        // 'los tengo', 'la veo', 'la vi', 'la tienen', 'la tienes', 'los tenemos' - but 'la caries'
        const agrees = art === 'la' ? !/[oéíón]$/.test(str) && (!str.endsWith('s') || noun.fromPlural(str) === str) : isEl || /[sx]$/.test(str);
        if (!agrees || has$1(term, 'FirstPersonPlural')) {
          return 'Verb'
        }
        // 'la calle', 'los bailes' are only a subjunctive - 'no la calle', 'que la calle', but 'que la calle es larga'
        const isPresent = has$1(term, 'PresentTense');
        if (has$1(term, 'Subjunctive') || has$1(term, 'Imperative') || (!isPresent && !has$1(term, 'PastTense') && !has$1(term, 'FutureTense') && !has$1(term, 'Conditional'))) {
          const isClause = verbBefore.has(before) || (clauseBefore.has(before) && lookAfter(i + 1) !== 'Noun');
          return isClause ? 'Verb' : 'Noun'
        }
        // 'la tenía', 'la tiene', 'los vendes' - but 'la parte', 'las luces'
        if (!isPresent || (/es?$/.test(str) && !isKnown(str))) {
          return 'Verb'
        }
        // 'ella la cuenta', 'María la visita', 'mi madre la cocina'
        if (!isEl && (verbBefore.has(before) || (before && has$1(prev, 'Noun') && !has$1(prev, 'Date')))) {
          return 'Verb'
        }
        // 'si la cuenta es alta', but 'dice que la compra'
        return lookAfter(i + 1) || (clauseBefore.has(before) ? 'Verb' : 'Noun')
      };

      for (let i = 0; i < terms.length - 1; i += 1) {
        const art = getStr(terms[i]);
        const term = terms[i + 1];
        const str = term.normal;
        // 'mi cuenta', 'sus viajes' - but 'tu compras' is a typo
        const isPossessive = has$1(terms[i], 'Possessive') && has$1(terms[i], 'Determiner') && !(art === 'tu' && has$1(term, 'SecondPerson'));
        if (!clitics$1.has(art) && !articles.hasOwnProperty(art) && !isPossessive) {
          continue
        }
        const isPlural = isPossessive ? art.endsWith('s') : articles[art];
        const isClitic = clitics$1.has(art) && (terms[i].tags.has('Determiner') || art === 'lo');
        // 'la ha visto', 'los puede ver'
        if (isClitic && (has$1(term, 'Auxiliary') || (has$1(term, 'Modal') && isFinite$1(term)))) {
          terms[i].tags.clear();
          setTag([terms[i]], 'Pronoun', world, false, 'clitic-aux');
          continue
        }
        if (has$1(term, 'Pronoun') || has$1(term, 'Copula') || has$1(term, 'Auxiliary') || /\p{Lu}/u.test(term.text) || !(isClitic || terms[i].tags.has('Determiner'))) {
          continue
        }
        if (has$1(term, 'Verb')) {
          // 'el puede' is 'él puede' - but 'el suelo'
          if (art === 'lo' || (has$1(term, 'Modal') && has$1(term, 'ThirdPerson'))) {
            continue
          }
          if (choose(i) === 'Noun') {
            term.tags.clear();
            setTag([term], 'Noun', world, false, 'article-noun');
          } else {
            if (isClitic) {
              terms[i].tags.clear();
              setTag([terms[i]], 'Pronoun', world, false, 'clitic-verb');
            }
            continue
          }
        } else if (isClitic && (has$1(term, 'Noun') || (has$1(term, 'Adjective') && art !== 'lo'))) {
          // a word in the lexicon, that can not follow this article - 'la trabajo', 'los camino', 'lo cuento', 'la presto'
          const agrees = art === 'la' ? !str.endsWith('o') || femaleO.has(str) : art !== 'lo' && /[sx]$/.test(str);
          const found = agrees || str.length < 3 ? null : verb.lookup(str, { isVerb, known: true, tenses: Object.keys(tenses) });
          if (found) {
            const hit = found.hits[0];
            terms[i].tags.clear();
            setTag([terms[i]], 'Pronoun', world, false, 'clitic-verb');
            term.tags.clear();
            setTag([term], ['Verb', tenses[hit.tense], persons$1[hit.person]], world, false, 'clitic-verb');
            continue
          }
        }
        if (!has$1(term, 'Noun') || art === 'lo') {
          continue
        }
        // 'las flores', 'la rosa' are not names
        if (has$1(term, 'ProperNoun')) {
          term.tags.clear();
          setTag([term], 'Noun', world, false, 'article-noun');
        }
        // 'los lunes', 'las crisis' - but 'el paraguas'
        if (isPlural && /[sx]$/.test(str)) {
          setTag([term], 'Plural', world, false, 'plural-article');
        } else if (!isPlural && has$1(term, 'Plural')) {
          setTag([term], 'Singular', world, false, 'singular-article');
        }
      }
    });
  };

  // the lexicon gives 'limpia', 'duras', 'alegres' to a verb, and 'cara', 'rojas', 'china' to a name
  // but after 'ser' or 'estar', a form of an adjective that we know is that adjective - 'es limpia', 'son rojas'
  const copulaAdjective = function (view) {
    const world = view.world;
    const setTag = world.methods.one.setTag;
    const lexicon = world.model.one.lexicon;
    const { fromFemale, fromFemalePlural, toSingular } = world.methods.two.transform.adjective;
    const isAdj = (str) => lexicon[str] === 'Adjective';
    view.docs.forEach((terms) => {
      for (let i = 1; i < terms.length; i += 1) {
        const term = terms[i];
        const tags = term.tags;
        if (!terms[i - 1].tags.has('Copula') || /\p{Lu}/u.test(term.text) || !(tags.has('Verb') || tags.has('ProperNoun'))) {
          continue
        }
        const str = term.normal;
        const isPlural = str.endsWith('s');
        let isFemale = false;
        let found = isAdj(str);
        if (!found && /as?$/.test(str)) {
          isFemale = isAdj(isPlural ? fromFemalePlural(str, lexicon) : fromFemale(str, lexicon));
          found = isFemale;
        }
        if (found || (isPlural && isAdj(toSingular(str, lexicon)))) {
          tags.clear();
          const out = ['Adjective', isPlural ? 'PluralAdjective' : 'SingularAdjective'];
          if (isFemale || /os?$/.test(str)) {
            out.push(isFemale ? 'FemaleAdjective' : 'MaleAdjective');
          }
          setTag([term], out, world, false, 'copula-adjective');
        }
      }
    });
  };

  // number-words that are known by their neighbours
  //  - 'un' and 'una' are articles, and are a number only inside of one - 'un millón', 'ciento un',
  //    'treinta y una' - or before a unit - 'un euro', 'un km', 'un por ciento'
  //  - 'y' joins a ten to a one - 'treinta y dos' - but 'tres y cuatro' are two numbers
  const tens = /^(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)$/;
  const ones = /^(un[oa]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)$/;
  const isOne = /^una?$/;
  const isBig$1 = /^[mb]ill[oó]n(es)?$/;
  // 'ciento un', 'mil una'
  const beforeOne = /ient[oa]s?$|^cien$|^mil$|ll[oó]n(es)?$/;
  // 'tres cuartos'
  const parts = /^(medios|tercios|cuartos|quintos|sextos|séptimos|octavos|novenos|décimos|centésimos|milésimos)$/;
  const isHalf = /^medi[oa]$/;

  const cardinal = ['Cardinal', 'TextValue'];
  const fraction = ['Fraction', 'TextValue'];
  const has = (term, tag) => Boolean(term) && term.tags.has(tag);
  const isText = term => has(term, 'TextValue') && has(term, 'Cardinal');

  const tagNumbers = function (view) {
    const world = view.world;
    const setTag = world.methods.one.setTag;
    // 'euros', 'pesos'
    const money = new Set(world.model.two.europeanNumbers.currencies);
    const isCurrency = term => has(term, 'Currency') || (Boolean(term) && money.has(term.normal));
    view.docs.forEach(terms => {
      // are these two words side-by-side?
      const joins = i => Boolean(terms[i] && terms[i + 1]) && !/\S/.test(terms[i].post + terms[i + 1].pre);
      // start again - an article, noun or adjective is now a number
      const tag = function (i, tags, reason) {
        if (terms[i].frozen !== true) {
          terms[i].tags.clear();
          setTag([terms[i]], tags, world, false, reason);
        }
      };
      // tag the whole number, before this word
      const tagBefore = function (i, str, reason) {
        for (let n = i - 1; n >= 0 && joins(n) && has(terms[n], 'Value'); n -= 1) {
          setTag([terms[n]], str, world, false, reason);
        }
      };
      const str = i => (terms[i] ? terms[i].normal : '');
      // does a number begin here?
      const isNumber = i => has(terms[i], 'Value') || (isOne.test(str(i)) && joins(i) && isBig$1.test(str(i + 1)));
      for (let i = 0; i < terms.length; i += 1) {
        const term = terms[i];
        const w = term.normal;
        const before = joins(i - 1);
        const after = joins(i);
        if (isOne.test(w)) {
          // 'un millón', 'un euro', 'un por ciento'
          let found = after && (isBig$1.test(str(i + 1)) || isCurrency(terms[i + 1]) || has(terms[i + 1], 'Unit'));
          found = found || (after && joins(i + 1) && str(i + 1) === 'por' && str(i + 2) === 'ciento');
          // 'un medio', 'un tercio' - but 'un medio de transporte'
          const isMeans = str(i + 1) === 'medio' && joins(i + 1) && str(i + 2) === 'de';
          if (after && /^(medio|tercio)$/.test(str(i + 1)) && !isMeans) {
            found = true;
            tag(i + 1, fraction, 'un-tercio');
          }
          // 'ciento un', 'treinta y una'
          found = found || (before && has(terms[i - 1], 'TextValue') && (beforeOne.test(str(i - 1)) || str(i - 1) === 'y'));
          if (found) {
            tag(i, cardinal, 'un-number');
          }
        } else if (w === 'y') {
          if (before && after && isText(terms[i - 1])) {
            if (tens.test(str(i - 1)) && ones.test(str(i + 1))) {
              tag(i, 'TextValue', 'treinta-y-dos');
            } else if (isHalf.test(str(i + 1))) {
              // 'dos y medio'
              tag(i, 'TextValue', 'dos-y-medio');
              tag(i + 1, fraction, 'dos-y-medio');
            }
          }
        } else if (w === 'menos') {
          // 'menos cinco', but 'tres menos dos'
          if (after && isNumber(i + 1) && !has(terms[i + 1], 'Ordinal') && !has(terms[i - 1], 'Value')) {
            tag(i, 'TextValue', 'menos-cinco');
          }
        } else if (w === 'coma') {
          // 'tres coma cinco'
          if (before && after && isText(terms[i - 1]) && isText(terms[i + 1])) {
            tag(i, 'TextValue', 'tres-coma-cinco');
          }
        } else if (w === 'por' && after && /^cien(to)?$/.test(str(i + 1)) && before && has(terms[i - 1], 'Value')) {
          // 'cinco por ciento'
          tagBefore(i, 'Percent', 'por-ciento');
          tag(i, 'Unit', 'por-ciento');
          tag(i + 1, 'Unit', 'por-ciento');
          i += 1;
        } else if (isCurrency(term) && before && has(terms[i - 1], 'Value')) {
          // 'un euro'
          tagBefore(i, 'Money', 'value-currency');
          setTag([term], 'Currency', world, false, 'value-currency');
        } else if (parts.test(w)) {
          if (before && isText(terms[i - 1])) {
            tag(i, fraction, 'tres-cuartos');
          }
        } else if (isHalf.test(w) && !has(term, 'Fraction')) {
          // 'medio millón', 'medio litro', or the word by itself
          if (terms.length === 1 || (after && (isBig$1.test(str(i + 1)) || has(terms[i + 1], 'Unit')))) {
            tag(i, fraction, 'medio');
          }
        }
      }
    });
  };

  let net = null;

  // rules like 'la-cura' flip a verb into a noun, after the preTagger's
  // gender-pass already ran - so give those new nouns a gender here
  const nounGender = function (view) {
    const world = view.world;
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        guessNounGender(terms, i, world);
      }
    });
  };

  const postTagger$1 = function (view) {
    const { world } = view;
    const { methods } = world;
    // 'la cuenta' or 'la cuenta ella'
    tagArticles(view);
    // 'es limpia'
    copulaAdjective(view);
    // 'un millón', 'treinta y dos'
    tagNumbers(view);
    // rebuild this only lazily
    net = net || methods.one.buildNet(matches, world);
    // perform these matches on a comma-seperated document
    const document = methods.two.quickSplit(view.document);
    const ptrs = document.map(terms => {
      const t = terms[0];
      return [t.index[0], t.index[1], t.index[1] + terms.length]
    });
    const m = view.update(ptrs);
    m.cache();
    m.sweep(net);
    view.uncache();
    nounGender(view);
    // view.cache()
    return view
  };

  // the whole tagging process, for re-tagging text after a change
  const tagger = view => view.compute(['freeze', 'lexicon', 'preTagger', 'europeanNumbers', 'postTagger', 'unfreeze']);

  var postTagger = {
    compute: {
      postTagger: postTagger$1,
      tagger
    },
    hooks: ['postTagger']
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var nouns$1 = {
    Noun: {
      aliases: [null, 'Sustantivo'],
    },
    Singular: {
      not: ['Plural'],
    },
    ProperNoun: {
      aliases: [null, 'NombrePropio'],
    },
    Person: {
      aliases: [null, 'Persona'],
    },
    FirstName: {
      aliases: [null, 'Nombre'],
    },
    MaleName: {
      aliases: [null, 'NombreMasculino'],
    },
    FemaleName: {
      aliases: [null, 'NombreFemenino'],
    },
    LastName: {
      aliases: [null, 'Apellido'],
    },
    Honorific: {
      aliases: [null, 'Título'],
      is: 'Noun',
    },
    Place: {
      aliases: [null, 'Lugar'],
    },
    Country: {
      aliases: [null, 'País'],
    },
    City: {
      aliases: [null, 'Ciudad'],
    },
    Region: {
      aliases: [null, 'Región'],
    },
    Address: {
      aliases: [null, 'Dirección'],
    },
    Organization: {
      aliases: [null, 'Organización'],
    },
    SportsTeam: {
      aliases: [null, 'Equipo'],
    },
    School: {
      aliases: [null, 'Escuela'],
    },
    Company: {
      aliases: [null, 'Empresa'],
    },
    Plural: {
      not: ['Singular'],
    },
    Uncountable: {
      aliases: [null, 'Incontable'],
    },
    Pronoun: {
      aliases: [null, 'Pronombre'],
    },
    Actor: {
      not: ['Person', 'Place', 'Organization'],
    },
    Activity: {
      aliases: [null, 'Actividad'],
    },
    Unit: {
      aliases: [null, 'Unidad'],
    },
    Demonym: {
      aliases: [null, 'Gentilicio'],
    },
    Possessive: {
      aliases: [null, 'Posesivo'],
      is: undefined,
    },
    FemaleNoun: {
      aliases: [null, 'SustantivoFemenino'],
      is: 'Noun',
      not: ['MaleNoun'],
    },
    MaleNoun: {
      aliases: [null, 'SustantivoMasculino'],
      is: 'Noun',
      not: ['FemaleNoun'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var verbs$1 = {
    Verb: {
      aliases: [null, 'Verbo'],
    },
    PresentTense: {
      aliases: [null, 'Presente'],
      not: ['PastTense'],
    },
    Infinitive: {
      aliases: [null, 'Infinitivo'],
      is: 'Verb',
      not: ['PresentTense', 'PastTense', 'FutureTense', 'Gerund'],
    },
    Gerund: {
      aliases: [null, 'Gerundio'],
      is: 'Verb',
      not: ['PresentTense', 'PastTense', 'FutureTense', 'Copula'],
    },
    PastTense: {
      aliases: [null, 'Pasado'],
    },
    Imperfect: {
      aliases: [null, 'Imperfecto'],
      is: 'PastTense',
      not: ['Conditional'],
    },
    FutureTense: {
      aliases: [null, 'Futuro'],
      not: ['PresentTense', 'Gerund', 'PastTense'],
    },
    Copula: {
      aliases: [null, 'Cópula'],
    },
    Negative: {
      aliases: [null, 'Negación'],
      not: undefined,
    },
    Modal: {
    },
    PerfectTense: {
      aliases: [null, 'PretéritoPerfecto'],
      is: 'Verb',
      not: ['Gerund'],
    },
    Pluperfect: {
      aliases: [null, 'Pluscuamperfecto'],
      is: 'Verb',
    },
    Participle: {
      aliases: [null, 'Participio'],
    },
    PhrasalVerb: {
    },
    Particle: {
    },
    Auxiliary: {
      aliases: [null, 'Auxiliar'],
    },
    Conditional: {
      aliases: [null, 'Condicional'],
      is: 'Verb',
      not: ['Infinitive', 'Imperative'],
    },
    Reflexive: {
      aliases: [null, 'Reflexivo'],
      is: 'Verb',
    },
    Perfecto: {
      is: 'Verb',
    },
    Imperative: {
      aliases: [null, 'Imperativo'],
      not: ['Subjunctive'],
    },
    Subjunctive: {
      aliases: [null, 'Subjuntivo'],
      is: 'Verb',
      not: ['Imperative'],
    },
    FirstPerson: {
      aliases: [null, 'PrimeraPersona'],
      is: 'Verb',
      not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
    },
    SecondPerson: {
      aliases: [null, 'SegundaPersona'],
      is: 'Verb',
      not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
    },
    ThirdPerson: {
      aliases: [null, 'TerceraPersona'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
    },
    FirstPersonPlural: {
      aliases: [null, 'PrimeraPersonaPlural'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural'],
    },
    SecondPersonPlural: {
      aliases: [null, 'SegundaPersonaPlural'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural'],
    },
    ThirdPersonPlural: {
      aliases: [null, 'TerceraPersonaPlural'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var values = {
    Value: {
      aliases: [null, 'Número'],
    },
    Ordinal: {
    },
    Cardinal: {
    },
    Fraction: {
      aliases: [null, 'Fracción'],
    },
    Multiple: {
      aliases: [null, 'Múltiplo'],
      is: 'Value',
    },
    RomanNumeral: {
      aliases: [null, 'NúmeroRomano'],
      not: ['TextValue'],
    },
    TextValue: {
      aliases: [null, 'Numeral'],
      not: ['NumericValue'],
    },
    NumericValue: {
      aliases: [null, 'Numérico'],
      not: ['TextValue'],
    },
    Money: {
      aliases: [null, 'Dinero'],
    },
    Percent: {
      aliases: [null, 'Porcentaje'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var dates = {
    Date: {
      aliases: [null, 'Fecha'],
    },
    Month: {
      aliases: [null, 'Mes'],
      is: 'Singular',
      also: ['Date'],
      not: ['Year', 'WeekDay', 'Time'],
    },
    WeekDay: {
      aliases: [null, 'DíaDeLaSemana'],
      is: 'Noun',
      also: ['Date'],
      not: undefined,
    },
    Year: {
      aliases: [null, 'Año'],
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      aliases: [null, 'Trimestre'],
      not: 'Fraction',
    },
    Holiday: {
      aliases: [null, 'Festivo'],
    },
    Season: {
      aliases: [null, 'Estación'],
      not: undefined,
    },
    Timezone: {
      aliases: [null, 'ZonaHoraria'],
      is: 'Noun',
      also: ['Date'],
    },
    Time: {
      aliases: [null, 'Hora'],
      not: ['AtMention'],
    },
    Duration: {
      aliases: [null, 'Duración'],
      is: 'Noun',
      also: ['Date'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var misc = {
    Adjective: {
      aliases: [null, 'Adjetivo'],
    },
    FemaleAdjective: {
      aliases: [null, 'AdjetivoFemenino'],
      is: 'Adjective',
      not: ['MaleAdjective'],
    },
    MaleAdjective: {
      aliases: [null, 'AdjetivoMasculino'],
      is: 'Adjective',
      not: ['FemaleAdjective'],
    },
    PluralAdjective: {
      aliases: [null, 'AdjetivoPlural'],
      is: 'Adjective',
      not: ['SingularAdjective'],
    },
    SingularAdjective: {
      aliases: [null, 'AdjetivoSingular'],
      is: 'Adjective',
      not: ['PluralAdjective'],
    },
    Comparable: {
    },
    Comparative: {
      aliases: [null, 'Comparativo'],
    },
    Superlative: {
      aliases: [null, 'Superlativo'],
    },
    NumberRange: {
      aliases: [null, 'RangoNumérico'],
    },
    Adverb: {
      aliases: [null, 'Adverbio'],
    },
    Determiner: {
      aliases: [null, 'Determinante', 'Artículo'],
    },
    Conjunction: {
      aliases: [null, 'Conjunción'],
      is: undefined,
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'],
    },
    Preposition: {
      aliases: [null, 'Preposición'],
      is: undefined,
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
    },
    QuestionWord: {
      aliases: [null, 'Interrogativo'],
    },
    Currency: {
      aliases: [null, 'Moneda'],
    },
    Expression: {
      aliases: [null, 'Interjección'],
    },
    Abbreviation: {
      aliases: [null, 'Abreviatura'],
    },
    Url: {
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    PhoneNumber: {
      aliases: [null, 'Teléfono'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    HashTag: {
    },
    AtMention: {
      aliases: [null, 'Mención'],
      not: ['HashTag', 'Email'],
    },
    Emoji: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Emoticon: {
      aliases: [null, 'Emoticono'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Email: {
      aliases: [null, 'Correo'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Acronym: {
      aliases: [null, 'Acrónimo'],
      not: ['Plural', 'RomanNumeral'],
    },
    Condition: {
      aliases: [null, 'Condición'],
      is: undefined,
    },
  };

  const ours = Object.assign({}, nouns$1, verbs$1, values, dates, misc);

  // start from the shared tagset, then apply our own tags and changes
  const tags = { ...allTags };

  Object.keys(ours).forEach(tag => {
    const en = tags[tag];
    if (!en) {
      tags[tag] = ours[tag];
      return
    }
    // our aliases lead, so the first one stays the preferred name - then the english ones, like #NN
    const aliases = (ours[tag].aliases || [null]).concat((en.aliases || []).filter(str => str));
    tags[tag] = { ...en, ...ours[tag], aliases };
  });

  var tagset = {
    tags
  };

  // [number, cardinal, ordinal]
  var data = {
    ones: [
      [1, 'uno', 'primero'],
      [2, 'dos', 'segundo'],
      [3, 'tres', 'tercero'],
      [4, 'cuatro', 'cuarto'],
      [5, 'cinco', 'quinto'],
      [6, 'seis', 'sexto'],
      [7, 'siete', 'séptimo'],
      [8, 'ocho', 'octavo'],
      [9, 'nueve', 'noveno'],
      [10, 'diez', 'décimo'],
      [11, 'once', 'undécimo'],
      [12, 'doce', 'duodécimo'],
      [13, 'trece', 'decimotercero'],
      [14, 'catorce', 'decimocuarto'],
      [15, 'quince', 'decimoquinto'],
      [16, 'dieciséis', 'decimosexto'],
      [17, 'diecisiete', 'decimoséptimo'],
      [18, 'dieciocho', 'decimoctavo'],
      [19, 'diecinueve', 'decimonoveno'],
      [20, 'veinte', 'vigésimo'],
      [21, 'veintiuno'],
      [22, 'veintidós'],
      [23, 'veintitrés'],
      [24, 'veinticuatro'],
      [25, 'veinticinco'],
      [26, 'veintiséis'],
      [27, 'veintisiete'],
      [28, 'veintiocho'],
      [29, 'veintinueve'],
    ],
    tens: [
      [30, 'treinta', 'trigésimo'],
      [40, 'cuarenta', 'cuadragésimo'],
      [50, 'cincuenta', 'quincuagésimo'],
      [60, 'sesenta', 'sexagésimo'],
      [70, 'setenta', 'septuagésimo'],
      [80, 'ochenta', 'octogésimo'],
      [90, 'noventa', 'nonagésimo'],
    ],
    hundreds: [
      [100, 'ciento', 'centésimo'],
      [200, 'doscientos', 'ducentésimo'],
      [300, 'trescientos', 'tricentésimo'],
      [400, 'cuatrocientos', 'cuadringentésimo'],
      [500, 'quinientos', 'quingentésimo'],
      [600, 'seiscientos', 'sexcentésimo'],
      [700, 'setecientos', 'septingentésimo'],
      [800, 'ochocientos', 'octingentésimo'],
      [900, 'novecientos', 'noningentésimo'],
    ],
    // [number, singular, plural, ordinal] - a 'billón' is a million millions
    multiples: [
      [1e12, 'billón', 'billones', 'billonésimo'],
      [1e6, 'millón', 'millones', 'millonésimo'],
      [1e3, 'mil', 'mil', 'milésimo'],
    ],
  };

  // 'dieciséis' is often written 'dieciseis'
  const noAccent = str => str.normalize('NFD').replace(/\p{M}/gu, '');

  // number-words, and their values
  const cardinals$1 = { cero: 0, cien: 100, un: 1, una: 1, veintiún: 21, veintiuna: 21 };
  const ordinals$1 = { sétimo: 7, decimoprimero: 11, decimosegundo: 12 };
  const multiples = {};
  // the bottom of a fraction - 'tres cuartos'
  const fractions = { medio: 2, media: 2, medios: 2, tercio: 3, tercios: 3, centésimos: 100, milésimos: 1000 };

  const list = [...data.ones, ...data.tens, ...data.hundreds];
  list.forEach(a => {
    const [num, card, ord] = a;
    cardinals$1[card] = num;
    if (ord) {
      ordinals$1[ord] = num;
    }
    // 'doscientas'
    if (num > 100) {
      cardinals$1[card.replace(/os$/, 'as')] = num;
    }
    // 'quintos'
    if (num > 3 && num <= 10) {
      fractions[ord + 's'] = num;
    }
  });
  data.multiples.forEach(a => {
    const [num, single, plural, ord] = a;
    multiples[single] = num;
    multiples[plural] = num;
    ordinals$1[ord] = num;
  })
  ;[cardinals$1, ordinals$1, multiples].forEach(obj => {
    Object.keys(obj).forEach(k => {
      obj[noAccent(k)] = obj[k];
    });
  });

  // 'primera' or 'primer' -> 1
  const getOrdinal = function (w) {
    const str = [w, w.replace(/a$/, 'o'), w + 'o'].find(s => ordinals$1.hasOwnProperty(s));
    return str === undefined ? undefined : ordinals$1[str]
  };

  // the words that are a number, wherever they are - 'un', 'una' and 'medio' are tagged by their neighbours
  const words = {};
  Object.keys(cardinals$1).forEach(k => {
    words[k] = ['Cardinal', 'TextValue'];
  });
  Object.keys(multiples).forEach(k => {
    words[k] = ['Cardinal', 'TextValue'];
  });
  Object.keys(ordinals$1).forEach(k => {
    words[k] = ['Ordinal', 'TextValue'];
    words[k.replace(/o$/, 'a')] = ['Ordinal', 'TextValue'];
  });
  words.primer = words.primero;
  words.tercer = words.primero;
  delete words.un;
  delete words.una;

  const isDigit = term => /[0-9]/.test(term.text);
  // is there anything between these two words? - 'tres, cuatro'
  const isBroken = (a, b) => /\S/.test(a.post + b.pre);
  // 'mil', and anything larger
  const getMult = term => (term && multiples.hasOwnProperty(term.normal) ? multiples[term.normal] : 0);

  // digits, and the words that multiply them - '1 000', '2,5 millones', '3 mil millones'
  const readDigits = function (terms, i, res) {
    let end = i + 1;
    const joins = () => terms[end] && !isBroken(terms[end - 1], terms[end]);
    if (/^[0-9]{1,3}$/.test(terms[i].text)) {
      while (joins() && /^[0-9]{3}$/.test(terms[end].text)) {
        end += 1;
      }
    }
    res.digits = [i, end];
    res.mult = 1;
    if (/^[-+−]?[0-9][0-9.,]*$/.test(terms[end - 1].text)) {
      if (joins() && getMult(terms[end]) === 1000) {
        res.mult = 1000;
        end += 1;
      }
      if (joins() && getMult(terms[end]) > 1000) {
        res.mult *= getMult(terms[end]);
        end += 1;
      }
    }
    res.end = end;
    return res
  };

  // read the one number that begins at this term, and say where it ends
  // - each new word must fit beside the ones before it, so 'dos tres' is two numbers
  const readNumber = function (terms, start) {
    const res = { start, end: start + 1, num: null, neg: false };
    let i = start;
    if (terms[i].normal === 'menos' && terms[i + 1] && !isBroken(terms[i], terms[i + 1])) {
      res.neg = true;
      i += 1;
    }
    if (isDigit(terms[i])) {
      return readDigits(terms, i, res)
    }
    const isOrd = terms[i].tags.has('Ordinal');
    let total = 0; // the millions
    let section = 0; // the thousands
    let group = 0; // the hundreds, tens and ones
    // the next word must be smaller than this - 'ciento' leaves room for 'veinte', and then for nothing
    let room = 1000;
    let lastBig = Infinity;
    let usedMil = false;
    let afterY = false;
    let any = false;
    let int = null; // the whole part, before a 'coma'
    let zeros = '';
    let over = 1;
    let extra = 0;
    for (; i < terms.length; i += 1) {
      const term = terms[i];
      const w = term.normal;
      const next = terms[i + 1];
      const joins = Boolean(next) && !isBroken(term, next);
      if ((i > start && isBroken(terms[i - 1], term)) || isDigit(term)) {
        break
      }
      if (term.tags.has('Fraction') && fractions.hasOwnProperty(w)) {
        if (isOrd || int !== null) {
          break
        }
        // 'medio millón'
        if (!any) {
          group = 1 / fractions[w];
          room = 0;
          any = true;
          continue
        }
        // 'dos y medio', or 'tres cuartos'
        if (afterY) {
          extra = 1 / fractions[w];
        } else {
          over = fractions[w];
        }
        i += 1;
        break
      }
      if (w === 'y') {
        if (!any || isOrd || int !== null || !joins) {
          break
        }
        const v = cardinals$1[next.normal];
        const isHalf = next.tags.has('Fraction') && fractions[next.normal] === 2;
        if (isHalf || (room === 10 && v > 0 && v < 10 && !isDigit(next))) {
          afterY = true;
          continue
        }
        break
      }
      // 'tres coma cinco'
      if (w === 'coma') {
        if (!any || isOrd || int !== null || !joins || !cardinals$1.hasOwnProperty(next.normal)) {
          break
        }
        int = total + section + group;
        total = 0;
        section = 0;
        group = 0;
        room = 1000;
        continue
      }
      if (isOrd !== term.tags.has('Ordinal')) {
        break
      }
      const mult = isOrd ? 0 : getMult(term);
      if (mult) {
        // 'mil mil', 'dos millones tres millones'
        if (int !== null || (mult === 1000 ? usedMil : mult >= lastBig)) {
          break
        }
        if (mult === 1000) {
          section = (group || 1) * 1000;
        } else {
          total += (section + group || 1) * mult;
          section = 0;
          lastBig = mult;
        }
        usedMil = mult === 1000;
        group = 0;
        room = 1000;
        any = true;
        continue
      }
      const v = isOrd ? getOrdinal(w) : cardinals$1[w];
      if (v === undefined) {
        break
      }
      // 'tres coma cero cinco'
      if (v === 0 && int !== null && room === 1000) {
        zeros += '0';
        continue
      }
      // 'milésimo primero'
      if (v >= 1000 && !any) {
        total = v;
        any = true;
        continue
      }
      // 'dos tres', 'cero uno', and 'treinta uno' - but 'treinta y uno', and 'vigésimo primero'
      if (v >= room || (v === 0 && any) || (room === 10 && !afterY && !isOrd)) {
        break
      }
      room = 0;
      if (v >= 100) {
        room = 100;
      } else if (v >= 30 || (isOrd && v % 10 === 0)) {
        room = 10;
      }
      group += v;
      afterY = false;
      any = true;
    }
    if (!any) {
      // an unknown word is its own number - and a loose 'y' is nothing
      return /^(y|coma|menos)$/.test(terms[start].normal) ? null : res
    }
    let num = total + section + group;
    if (int !== null) {
      num = Number(int + '.' + zeros + group);
    }
    num = (num / over) + extra;
    res.num = res.neg ? num * -1 : num;
    res.end = i;
    return res
  };

  // split these terms into each of their numbers
  const scan = function (terms) {
    const out = [];
    let i = 0;
    while (i < terms.length) {
      const res = readNumber(terms, i);
      if (res) {
        out.push(res);
      }
      i = res ? res.end : i + 1;
    }
    return out
  };

  // find each number - 'dos mil tres' is one, and 'dos tres', 'dos, tres' and 'cuarenta y 3' are two
  const findNumbers = function (view) {
    const ptrs = [];
    view.match('#Value+').fullPointer.forEach(ptr => {
      const [n, start, end] = ptr;
      scan(view.document[n].slice(start, end)).forEach(res => {
        ptrs.push([n, start + res.start, start + res.end]);
      });
    });
    return view.update(ptrs)
  };

  // floating-point noise - 0.1 + 0.2 - but a whole number is already exact
  const tidy$1 = num => (Number.isInteger(num) ? num : Number(num.toPrecision(15)));

  // read digits with the shared european-numbers plugin - '1.234,56', '-5', '3,5%'
  const fromNumber = function (terms, m) {
    const { read } = m.methods.two.europeanNumbers;
    const locale = m.model.two.europeanNumbers;
    const pre = terms[0].pre;
    // thousands may be split-up by a space - '1 000'
    const res = read(terms.map(t => t.text).join(' '), pre, locale);
    if (res.num !== null || terms.length === 1) {
      return res
    }
    return read(terms[0].text, pre, locale)
  };

  const parseNumber = function (m) {
    const terms = m.docs[0];
    const found = scan(terms)[0] || { num: null };
    let res = { num: found.num, prefix: '', suffix: '', hasComma: false };
    // any digits come first - '2,5 millones'
    if (found.digits) {
      res = fromNumber(terms.slice(found.digits[0], found.digits[1]), m);
      if (res.num !== null) {
        // '2,5 millones' is 2.5 * 1,000,000
        res.num = tidy$1(res.num * found.mult) * (found.neg ? -1 : 1);
      }
    }
    return {
      hasComma: res.hasComma,
      prefix: res.prefix,
      num: res.num,
      suffix: res.suffix,
      // how the digits were written
      decimal: res.decimal,
      group: res.group,
      // '.º', 'ª' or 'er'
      ordinal: res.ordinal || null,
      isText: m.has('#TextValue'),
      isOrdinal: m.has('#Ordinal'),
      isFraction: m.has('#Fraction'),
      isMoney: m.has('#Money'),
    }
  };

  // words for each part of a number
  const cardinals = {};
  const ordinals = {}
  ;[...data.ones, ...data.tens, ...data.hundreds].forEach(a => {
    cardinals[a[0]] = a[1];
    ordinals[a[0]] = a[2];
  });
  const bigs = data.multiples.filter(a => a[0] > 1000);

  // 1-999 - 'ciento veintiuno'
  // `one` is how a last 'uno' ends - 'uno', 'una' or 'un'
  const toGroup = function (num, fem, one) {
    const words = [];
    const h = Math.floor(num / 100) * 100;
    let rest = num % 100;
    if (h) {
      const w = num === 100 ? 'cien' : cardinals[h];
      // 'doscientas'
      words.push(fem && h > 100 ? w.replace(/os$/, 'as') : w);
    }
    // 'treinta y dos'
    if (rest > 30 && rest % 10) {
      words.push(cardinals[rest - (rest % 10)], 'y');
      rest = rest % 10;
    }
    if (rest === 21 && one === '') {
      words.push('veintiún');
    } else if (rest) {
      words.push(rest % 20 === 1 ? cardinals[rest].replace(/o$/, one) : cardinals[rest]);
    }
    return words
  };

  // under a million - 'veintiún mil doscientos'
  const toThousands = function (num, fem, one) {
    const mil = Math.floor(num / 1000);
    let words = [];
    if (mil > 1) {
      words = toGroup(mil, fem, '');
    }
    if (mil) {
      words.push('mil');
    }
    return words.concat(toGroup(num % 1000, fem, one))
  };

  // write a whole number as words - `opts.isFemale` is 'una', and `opts.short` is 'un', before a noun
  const toText = function (num, opts = {}) {
    if (!Number.isSafeInteger(num)) {
      return null
    }
    if (num === 0) {
      return ['cero']
    }
    let words = num < 0 ? ['menos'] : [];
    let rest = Math.abs(num);
    bigs.forEach(a => {
      const [size, single, plural] = a;
      const count = Math.floor(rest / size);
      rest -= count * size;
      // 'un millón', 'dos millones'
      if (count === 1) {
        words.push('un', single);
      } else if (count) {
        words = words.concat(toThousands(count, false, ''), plural);
      }
    });
    let one = opts.short ? '' : 'o';
    one = opts.isFemale ? 'a' : one;
    return words.concat(toThousands(rest, opts.isFemale, one))
  };

  // 'centésimo vigésimo primero' - up to 1999, and 'millonésimo'
  const toTextOrdinal = function (num, opts = {}) {
    let words = [];
    let rest = num;
    const big = data.multiples.find(a => a[0] === num);
    if (big) {
      words.push(big[3]);
    } else if (!Number.isInteger(num) || num < 1 || num >= 2000) {
      return null
    } else {
      if (rest > 1000) {
        words.push('milésimo');
        rest -= 1000;
      }
      const parts = [rest - (rest % 100), rest % 100];
      if (parts[1] > 20) {
        parts.push(parts[1] % 10);
        parts[1] -= parts[2];
      }
      words = words.concat(parts.filter(n => n).map(n => ordinals[n]));
    }
    if (opts.isFemale) {
      return words.map(w => w.replace(/o$/, 'a'))
    }
    // 'primer día', 'tercer piso'
    if (opts.short) {
      const last = words.length - 1;
      words[last] = words[last].replace(/(primer|tercer)o$/, '$1');
    }
    return words
  };

  const { write } = europeanNumbers.methods.two.europeanNumbers;

  // returns null when a number can't be written this way
  const formatNumber = function (parsed, fmt) {
    const num = parsed.num;
    if (fmt === 'TextOrdinal' || fmt === 'TextCardinal') {
      const words = fmt === 'TextOrdinal' ? toTextOrdinal(num, parsed) : toText(num, parsed);
      return words ? words.join(' ') : null
    }
    // numeric formats
    if (fmt === 'Ordinal') {
      if (!Number.isInteger(num) || num < 1) {
        return null
      }
      const old = parsed.ordinal || '';
      let end = parsed.isFemale ? 'ª' : 'º';
      // '1er' and '3er' - but '11º'
      if (end === 'º' && parsed.short && /(^|[^1])[13]$/.test(String(num))) {
        end = 'er';
      }
      // '1.º' keeps its period
      return String(num) + (old[0] === '.' ? '.' : '') + end
    }
    // digits go back the way they were found - '1.234,5', '5,3€'
    return write(num, parsed)
  };

  // the words for a symbol that is written on a number - '50%', '5€', '$5'
  // [singular, plural, tag, isFemale]
  const symbols = {
    '%': ['por ciento', 'por ciento', 'Unit'],
    '€': ['euro', 'euros', 'Currency'],
    $: ['dólar', 'dólares', 'Currency'],
    '£': ['libra', 'libras', 'Currency', true],
    '¥': ['yen', 'yenes', 'Currency'],
  };

  // 'euros' -> '€' - to find a unit that is already written out
  const fromWord = {};
  Object.keys(symbols).forEach(k => {
    const [single, plural] = symbols[k];
    fromWord[single] = k;
    fromWord[plural] = k;
  });

  // a unit that can stand as its own word - 'km', 'kg', 'm²'
  const isWord = /^\p{L}+[²³]?$/u;

  // 'cinco euros', but 'un euro'
  const unitWords = function (key, num) {
    const [single, plural] = symbols[key];
    return Math.abs(num) === 1 ? single : plural
  };

  // floating-point noise - 0.1 + 0.2 - but a whole number is already exact
  const tidy = num => (Number.isInteger(num) ? num : Number(num.toPrecision(15)));

  const hasDash = /[-−–]$/;
  // 'una', 'veintiuna', 'doscientas'
  const femCardinal = /^(veinti)?una$|ientas$/;
  const isBig = /^[mb]ill[oó]n(es)?$/;
  const isNoun = term => term.tags.has('Noun') && !term.tags.has('Pronoun');

  // the word after these ones, if nothing is in the way
  const getNext = function (terms, end) {
    const next = terms[end];
    return next && next.text && !/\S/.test(terms[end - 1].post + next.pre) ? next : null
  };

  // parse a number, and remember how it was written - so that it can be written back the same way
  const parse = function (val) {
    const obj = parseNumber(val);
    const terms = val.docs[0];
    // the gender of 'primera', '1ª' or 'doscientas'
    obj.isFemale = /ª/.test(obj.ordinal || '') || terms.some(t => {
      return t.tags.has('Ordinal') ? t.tags.has('TextValue') && /a$/.test(t.normal) : femCardinal.test(t.normal)
    });
    // 'primer', 'tercer' or '1er'
    obj.short = /er$/.test(obj.ordinal || '') || terms.some(t => t.tags.has('Ordinal') && /er$/.test(t.normal));
    // the tokenizer keeps the sign of '-5%' apart from the term, as punctuation
    obj.hasDash = !obj.isText && obj.num < 0 && hasDash.test(terms[0].pre);
    return obj
  };

  // return the nth elem of a doc
  const getNth$3 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // turn a number, or a string like 'doce' or '12', into a number (or null)
  const toNum = function (view, n) {
    if (typeof n === 'number') {
      return Number.isFinite(n) ? n : null
    }
    if (typeof n !== 'string' || !n.trim()) {
      return null
    }
    const str = n.trim();
    // plain digits, like '12' or '-2.5'
    if (/^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)$/.test(str)) {
      return Number(str)
    }
    // a written-out number, like 'doce' or 'un millón'
    const m = view.fromText(str).compute(['index', 'postTagger']).numbers();
    if (m.length !== 1 || m.text('normal') !== m.all().text('normal')) {
      return null
    }
    const num = parseNumber(m.eq(0)).num;
    return typeof num === 'number' && Number.isFinite(num) ? num : null
  };

  // tags that describe the form of a number - these are set again for each new number
  const formTags = new Set(['Value', 'TextValue', 'NumericValue', 'Cardinal', 'Ordinal', 'Fraction', 'Determiner']);

  // find the symbol or unit of a number, and the terms that it is written in.
  // - it may be attached - '50%', '€5', '5km' - or be the next word - '5 €', 'cincuenta por ciento'
  const findUnit = function (val, obj, end) {
    const [n, start] = val.fullPointer[0];
    const terms = val.document[n];
    const last = terms[end - 1];
    const next = getNext(terms, end);
    // a sign is not a symbol - '+5%', '10+'
    const lead = /^\+/.test(obj.prefix) ? '+' : '';
    const trail = /\+$/.test(obj.suffix) ? '+' : '';
    const prefix = obj.prefix.slice(lead.length).toLowerCase();
    const suffix = obj.suffix.slice(0, obj.suffix.length - trail.length).toLowerCase();
    if (!obj.isText && (prefix || suffix)) {
      // '5km' is a contraction of two terms - '5km' and an empty 'km'
      const silent = terms[end];
      const isSplit = Boolean(silent && silent.text === '' && silent.implicit && last.implicit);
      const unit = { attached: true, isSplit, lead, trail, view: isSplit ? val.update([[n, start, end + 1]]) : val };
      // the symbol, in its original case - '5 Kg'
      unit.prefix = lead + obj.prefix.slice(lead.length);
      unit.suffix = obj.suffix;
      if (prefix && suffix) {
        return unit
      }
      if (symbols.hasOwnProperty(prefix || suffix)) {
        unit.key = prefix || suffix;
      } else if (suffix && isWord.test(suffix)) {
        unit.word = unit.suffix.slice(0, suffix.length);
        unit.tag = isSplit ? Array.from(silent.tags) : [];
      }
      return unit
    }
    if (!next) {
      return null
    }
    const unit = { attached: false, view: val.update([[n, start, end + 1]]) };
    // '5 €'
    if (symbols.hasOwnProperty(next.normal)) {
      unit.key = next.normal;
      return unit
    }
    // 'cinco por ciento'
    const after = terms[end + 1];
    if (next.normal === 'por' && next.tags.has('Unit') && after && after.tags.has('Unit')) {
      unit.key = '%';
      unit.isWord = true;
      unit.view = val.update([[n, start, end + 2]]);
      return unit
    }
    // 'cinco euros'
    if (fromWord.hasOwnProperty(next.normal)) {
      unit.key = fromWord[next.normal];
      unit.isWord = true;
      return unit
    }
    return null
  };

  // choose the new text for a number, and for its symbol or unit.
  // a symbol is never left stuck to a word - '50%' is 'cincuenta por ciento', and not 'cincuenta%'
  // - returns null if this number can't be written like that
  const getPlan = function (val, obj, fmt, toSymbol) {
    const [n, start, stop] = val.fullPointer[0];
    const terms = val.document[n];
    // 'un millón de euros' - this 'de' belongs to the number
    const de = getNext(terms, stop);
    const hasDe = Boolean(de) && de.normal === 'de' && isBig.test(terms[stop - 1].normal) && Boolean(getNext(terms, stop + 1));
    const end = hasDe ? stop + 1 : stop;
    const isCardinal = fmt === 'TextCardinal' || fmt === 'Cardinal';
    const unit = isCardinal ? findUnit(val, obj, end) : null;
    // the word that this number counts - 'veintiún gatos', 'doscientas casas', 'primer día'
    const next = getNext(terms, end);
    const noun = next && isNoun(next) ? next : null;
    const how = Object.assign({}, obj, { prefix: '', suffix: '' });
    // (the gender of a plural is not well known)
    const single = noun && !noun.tags.has('Plural') ? noun : null;
    how.isFemale = obj.isFemale || Boolean(single && single.tags.has('FemaleNoun'));
    how.short = isCardinal ? Boolean(noun) : obj.short || Boolean(single);
    const plan = { view: val.update([[n, start, end]]), unitTerms: 0, unitTag: null, inPlace: false };
    // 'un millón de casas'
    const withDe = str => (str && noun && isBig.test(str.split(' ').pop()) ? str + ' de' : str);
    if (!unit) {
      plan.str = formatNumber(fmt === 'Cardinal' ? obj : how, fmt);
      plan.numTerms = (plan.str || '').split(' ').length;
      // '+5' is '+cinco'
      if (fmt === 'TextCardinal' && plan.str) {
        plan.str = (/^\+/.test(obj.prefix) ? '+' : '') + withDe(plan.str);
      }
      return plan
    }
    if (fmt === 'Cardinal') {
      plan.str = formatNumber(obj, fmt);
      if (unit.attached) {
        // '5km' -> '6km' - keep both halves of the contraction
        plan.inPlace = unit.isSplit;
        plan.num = formatNumber(how, fmt);
        plan.str = (obj.num < 0 ? '-' : '') + unit.prefix + plan.num.replace(/^-/, '') + unit.suffix;
      } else if (toSymbol && unit.isWord && unit.key === '%') {
        // 'cincuenta por ciento' -> '50 %'
        plan.view = unit.view;
        plan.str = plan.str + ' %';
        plan.unitTerms = 1;
        plan.unitTag = 'Unit';
      }
      plan.numTerms = 1;
      return plan
    }
    // written-out
    let words = null;
    if (unit.key) {
      words = unitWords(unit.key, obj.num);
      plan.unitTag = symbols[unit.key][2];
      // 'un euro' and 'una libra', but 'uno por ciento'
      how.short = unit.key !== '%';
      how.isFemale = Boolean(symbols[unit.key][3]);
    } else if (unit.word) {
      words = unit.word;
      plan.unitTag = unit.tag;
      how.short = true;
    }
    let num = formatNumber(how, fmt);
    // '#5' or '10+' have no words
    if (!words || !num) {
      return null
    }
    plan.numTerms = num.split(' ').length;
    // 'un millón de euros'
    if (unit.key !== '%' && isBig.test(num.split(' ').pop())) {
      num += ' de';
    }
    plan.view = unit.view;
    plan.str = (unit.lead || '') + num + ' ' + words + (unit.trail || '');
    plan.unitTerms = words.split(' ').length;
    return plan
  };

  // swap-in the new form of this number, and tag it as the tagger would have.
  // - the terms made by .replaceWith() are tagged without their neighbours - so the 'un' of
  // 'un gato' is a Determiner, and '.numbers()' can't find it again.
  // returns the new number, without its unit
  const replace = function (val, obj, fmt, toSymbol) {
    const plan = getPlan(val, obj, fmt, toSymbol);
    if (!plan || !plan.str) {
      return val
    }
    const first = val.docs[0][0];
    // the sign is written by the number, now
    if (obj.hasDash) {
      first.pre = first.pre.replace(hasDash, '');
    }
    // re-write the first half of '5km', beside its silent 'km'
    if (plan.inPlace) {
      first.text = plan.str;
      first.normal = plan.str.toLowerCase();
      first.implicit = plan.num;
      first.machine = plan.num;
      return val
    }
    // remember any tags about the role of the number - #Money, #Percent, #Date
    const keep = Array.from(first.tags).filter(tag => !formTags.has(tag));
    let m = plan.view;
    m.replaceWith(plan.str);
    const [n, start, end] = m.fullPointer[0];
    // split the number from its unit
    if (plan.unitTerms > 0) {
      const unit = m.update([[n, end - plan.unitTerms, end]]);
      unit.unTag('Value');
      unit.tag(plan.unitTag);
    }
    m = m.update([[n, start, start + plan.numTerms]]);
    const isText = fmt === 'TextCardinal' || fmt === 'TextOrdinal';
    const isOrdinal = fmt === 'Ordinal' || fmt === 'TextOrdinal';
    m.unTag('Determiner');
    m.tag(isText ? 'TextValue' : 'NumericValue');
    m.tag(isOrdinal ? 'Ordinal' : 'Cardinal');
    if (keep.length > 0) {
      m.tag(keep);
    }
    return m
  };

  // run a change on each number, and keep this view pointing at the new terms
  // - .replaceWith() only repairs the one-match view that it is called on. Without this,
  // the view that the user holds keeps the ids of the deleted terms, and core 'repairs'
  // each of its matches by stretching it out to the end of the sentence.
  // returns the same view, so that every link of a chain stays in sync
  const mutate = function (view, fn) {
    const res = view.map(val => fn(val) || val);
    view.ptrs = res.fullPointer;
    view.uncache();
    return view
  };

  const api$3 = function (View) {
    /**   */
    class Numbers extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Numbers';
      }
      parse(n) {
        return getNth$3(this, n).map(parseNumber, [])
      }
      get(n) {
        return getNth$3(this, n).map(parseNumber, []).map(o => o.num)
      }
      json(n) {
        // a number selects the nth match, anything else is json options
        const opts = typeof n === 'number' ? undefined : n;
        const doc = getNth$3(this, n);
        return doc.map(p => {
          const json = p.toView().json(opts)[0];
          const parsed = parseNumber(p);
          json.number = {
            prefix: parsed.prefix,
            num: parsed.num,
            suffix: parsed.suffix,
            hasComma: parsed.hasComma,
          };
          return json
        }, [])
      }
      /** any known measurement unit, for the number */
      units() {
        return this.growRight('#Unit+').match('#Unit+$')
      }
      /** return only ordinal numbers */
      isOrdinal() {
        return this.if('#Ordinal')
      }
      /** return only cardinal numbers*/
      isCardinal() {
        return this.if('#Cardinal')
      }

      /** convert to numeric form like '8' or '8º' */
      toNumber() {
        return mutate(this, val => {
          // leave 'tres cuartos' alone
          if (!val.has('#TextValue') || val.has('#Fraction')) {
            return val
          }
          const obj = parse(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          // 'cincuenta por ciento' becomes '50 %'
          return replace(val, obj, fmt, true)
        })
      }
      /** convert to text form like 'ocho' or 'octavo' */
      toText() {
        return mutate(this, val => {
          if (val.has('#TextValue')) {
            return val
          }
          const obj = parse(val);
          // there are no words for '3,5' or '1/2'
          if (!Number.isInteger(obj.num)) {
            return val
          }
          const fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          return replace(val, obj, fmt)
        })
      }
      /** convert ordinal to cardinal form, like 'ocho', or '8' */
      toCardinal() {
        return mutate(this, val => {
          if (!val.has('#Ordinal')) {
            return val
          }
          const obj = parse(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          return replace(val, obj, fmt)
        })
      }
      /** convert cardinal to ordinal form, like 'octavo', or '8º' */
      toOrdinal() {
        return mutate(this, val => {
          if (val.has('#Ordinal')) {
            return val
          }
          const obj = parse(val);
          // there is no ordinal for '1,5', 'tres cuartos' or '-5'
          if (!Number.isInteger(obj.num) || obj.num < 1) {
            return val
          }
          // ... or for an amount - '50%', '5€', '5km', 'cinco euros'
          if (obj.prefix || obj.suffix || val.has('(#Percent|#Money)')) {
            return val
          }
          const fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          return replace(val, obj, fmt)
        })
      }

      /** return only numbers that are == n */
      isEqual(n) {
        return this.filter(val => parseNumber(val).num === n)
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter(val => parseNumber(val).num > n)
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter(val => parseNumber(val).num < n)
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter(val => {
          const num = parseNumber(val).num;
          return num > min && num < max
        })
      }
      /** set these number to n */
      set(n) {
        if (n === undefined) {
          return this // don't bother
        }
        n = toNum(this, n);
        if (n === null) {
          return this // not a number
        }
        return mutate(this, val => {
          const obj = parse(val);
          obj.num = n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (val.has('#TextValue')) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          return replace(val, obj, fmt)
        })
      }
      add(n) {
        n = toNum(this, n);
        if (!n) {
          return this // don't bother
        }
        return mutate(this, val => {
          const obj = parse(val);
          if (obj.num === null) {
            return val
          }
          // avoid float noise - 0.1 + 0.2
          obj.num = tidy(obj.num + n);
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          return replace(val, obj, fmt)
        })
      }
      /** decrease each number by n*/
      subtract(n) {
        n = toNum(this, n);
        if (!n) {
          return this // don't bother
        }
        return this.add(n * -1)
      }
      /** increase each number by 1 */
      increment() {
        return this.add(1)
      }
      /** decrease each number by 1 */
      decrement() {
        return this.add(-1)
      }
      // overloaded - keep Numbers class
      update(pointer) {
        const m = new Numbers(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }
    // aliases
    Numbers.prototype.isBetween = Numbers.prototype.between;
    Numbers.prototype.minus = Numbers.prototype.subtract;
    Numbers.prototype.plus = Numbers.prototype.add;
    Numbers.prototype.equals = Numbers.prototype.isEqual;

    View.prototype.numbers = function (n) {
      let m = findNumbers(this);
      m = getNth$3(m, n);
      return new Numbers(this.document, m.pointer)
    };
    // alias
    View.prototype.values = View.prototype.numbers;
  };

  var numbers = {
    api: api$3,
    // 'doscientas', 'veintiún', 'primera', 'tercer'
    words,
    // the shared european-numbers plugin reads '1.234,56' - these are our ordinals: '2ª', '3er', '1.º'
    // .. and the currencies that follow a number - '1.500 pesos'
    model: {
      two: {
        europeanNumbers: {
          ordinal: '\\.?(?:[ºª°]|er)',
          currencies: ['euro', 'euros', 'peso', 'pesos', 'dólar', 'dólares', 'dolar', 'dolares', 'libra', 'libras'],
        },
      },
    },
  };

  const getNth$2 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // each determiner, and its plural
  const toPluralArt = {
    el: 'los',
    la: 'las',
    un: 'unos',
    una: 'unas',
    mi: 'mis',
    tu: 'tus',
    su: 'sus',
    nuestro: 'nuestros',
    nuestra: 'nuestras',
    vuestro: 'vuestros',
    vuestra: 'vuestras',
    este: 'estos',
    esta: 'estas',
    ese: 'esos',
    esa: 'esas',
    aquel: 'aquellos',
    aquella: 'aquellas'
  };
  const toSingularArt = {};
  Object.keys(toPluralArt).forEach((k) => {
    toSingularArt[toPluralArt[k]] = k;
  });
  // 'el agua' is feminine - 'las aguas'
  const female = { el: 'las', un: 'unas', las: 'el', unas: 'un' };

  // flip 'los' → 'el', etc
  const swapArticle = function (m, mapping, isEl) {
    // 'del gato' ↔ 'de los gatos', 'al agua' ↔ 'a las aguas'
    const isPlural = mapping === toPluralArt;
    const prep = m.before(isPlural ? '(de|a) el$' : '(de|a) (los|las)$');
    if (prep.found) {
      const str = prep.text('normal');
      const p = str.startsWith('a') ? 'a' : 'de';
      if (isPlural) {
        prep.replaceWith(p + (isEl ? ' las' : ' los'));
      } else if (isEl || str.endsWith('los')) {
        prep.replaceWith(p === 'a' ? 'al' : 'del');
      } else {
        prep.replaceWith(p + ' la');
      }
      return
    }
    const art = m.before(`(${Object.keys(mapping).join('|')})$`);
    if (art.found) {
      const w = art.text('normal');
      if (mapping.hasOwnProperty(w)) {
        art.replaceWith(isEl && female.hasOwnProperty(w) ? female[w] : mapping[w]);
      }
    }
  };

  const api$2 = function (View) {
    class Nouns extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Nouns';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.noun;
        const lexicon = this.model.one.lexicon;
        return getNth$2(this, n).map(m => {
          const str = m.text('normal');
          if (m.has('#Plural')) {
            return {
              singular: methods.fromPlural(str, lexicon),
              plural: str
            }
          }
          return {
            singular: str,
            plural: methods.toPlural(str)
          }
        }, [])
      }
      isPlural(n) {
        return getNth$2(this, n).if('#Plural')
      }
      toPlural(n) {
        const methods = this.methods.two.transform.noun;
        getNth$2(this, n).ifNo('(#Plural|#Pronoun)').forEach(m => {
          const str = m.text('normal');
          m.replaceWith(methods.toPlural(str));
          m.tag('Plural', 'toPlural');
          // flip article, too
          swapArticle(m, toPluralArt, methods.takesEl(str));
        });
        return this
      }
      toSingular(n) {
        const methods = this.methods.two.transform.noun;
        const lexicon = this.model.one.lexicon;
        getNth$2(this, n).if('#Plural').ifNo('#Pronoun').forEach(m => {
          const singular = methods.fromPlural(m.text('normal'), lexicon);
          m.replaceWith(singular);
          m.tag('Singular', 'toSingular');
          // flip article, too
          swapArticle(m, toSingularArt, methods.takesEl(singular));
        });
        return this
      }
    }

    View.prototype.nouns = function (n) {
      let m = this.match('#Noun');
      m = getNth$2(m, n);
      return new Nouns(this.document, m.pointer)
    };
  };

  var nouns = {
    api: api$2,
  };

  const getNth$1 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot$2 = function (m, methods) {
    const str = m.text('normal');
    const lexicon = m.model.one.lexicon;
    const isPlural = m.has('#PluralAdjective');
    const isFemale = m.has('#FemaleAdjective');
    if (isPlural && isFemale) {
      return methods.fromFemalePlural(str, lexicon)
    } else if (isFemale) {
      return methods.fromFemale(str, lexicon)
    } else if (isPlural) {
      return methods.toSingular(str, lexicon)
    }
    return str
  };

  const api$1 = function (View) {
    class Adjectives extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Adjectives';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.adjective;
        return getNth$1(this, n).map(m => {
          const str = getRoot$2(m, methods);
          return {
            male: str,
            female: methods.toFemale(str),
            plural: methods.toPlural(str),
            femalePlural: methods.toFemalePlural(str),
          }
        }, [])
      }
    }

    View.prototype.adjectives = function (n) {
      let m = this.match('#Adjective');
      m = getNth$1(m, n);
      return new Adjectives(this.document, m.pointer)
    };
  };

  var adjectives = {
    api: api$1,
  };

  // re-conjugate a verb-phrase into another tense, in-place
  // 'yo hablo' -> 'yo hablé' -> 'yo hablaré'
  //
  // only the finite verb is changed - 'quiero ir' -> 'quise ir'
  // and its grammatical person is kept - 'hablamos' -> 'hablaremos'
  // spanish drops its subject pronouns, so the person is read from the verb itself

  const personTags = {
    FirstPerson: 'first',
    SecondPerson: 'second',
    ThirdPerson: 'third',
    FirstPersonPlural: 'firstPlural',
    SecondPersonPlural: 'secondPlural',
    ThirdPersonPlural: 'thirdPlural',
  };
  const toPersonTag = Object.keys(personTags).reduce((h, k) => {
    h[personTags[k]] = k;
    return h
  }, {});

  const tenseTags = {
    present: 'PresentTense',
    past: 'PastTense',
    imperfect: 'Imperfect',
    future: 'FutureTense',
    conditional: 'Conditional',
  };

  const subjects = {
    yo: 'first',
    tú: 'second',
    él: 'third',
    ella: 'third',
    usted: 'third',
    nosotros: 'firstPlural',
    nosotras: 'firstPlural',
    vosotros: 'secondPlural',
    vosotras: 'secondPlural',
    ellos: 'thirdPlural',
    ellas: 'thirdPlural',
    ustedes: 'thirdPlural',
  };

  // object-pronouns sit between the subject and its verb - 'yo no lo sé'
  const clitics = new Set(['me', 'te', 'se', 'lo', 'la', 'le', 'los', 'las', 'les', 'nos', 'os']);
  // other words allowed between a subject and its verb - 'yo nunca hablaba'
  const fillers = new Set(['no', 'nunca', 'ya', 'también', 'tampoco', 'siempre', 'casi', 'solo', 'sólo', 'aún', 'todavía']);

  // the preterites of 'ser' and 'ir' are identical - 'fui feliz' vs 'fui a casa'
  const serOrIr = new Set(['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron']);
  const afterIr = new Set(['a', 'al', 'hacia', 'hasta', 'para', 'allí', 'allá', 'ahí']);

  // verb-forms that are not an indicative tense
  const skipTags = ['Infinitive', 'Gerund', 'Perfecto', 'Participle', 'Imperative', 'Subjunctive'];

  const reflexives = new Set(['me', 'te', 'se', 'nos', 'os']);

  const getRoot$1 = function (term, next, prev) {
    const str = term.normal;
    if (serOrIr.has(str) && next && (afterIr.has(next.normal) || next.tags.has('Infinitive'))) {
      return 'ir'
    }
    // 'se fue', 'me fui' - 'irse' is to leave
    if (serOrIr.has(str) && prev && reflexives.has(prev.normal)) {
      return 'ir'
    }
    return term.root
  };

  const isInfinitive = function (str, lexicon) {
    const tags = lexicon.hasOwnProperty(str) ? lexicon[str] : null;
    return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
  };

  // which tense + person is this word?
  const parseTerm = function (term, next, methods, lexicon, prev) {
    const str = term.normal;
    if (!term.tags.has('Verb') || clitics.has(str) || skipTags.some((tag) => term.tags.has(tag))) {
      return null
    }
    const root = getRoot$1(term, next, prev);
    if (!root) {
      return null
    }
    // the existential 'hay un gato'
    if (str === 'hay') {
      return { root, hits: [{ tense: 'present', person: 'third' }] }
    }
    // find the word in its own conjugation table
    // no root was found for this one
    // the tagger gives some verbs no tense, and so no root - 'sabe', 'pude'
    if (root === str) {
      return methods.lookup(str, { isVerb: (inf) => isInfinitive(inf, lexicon) })
    }
    const hits = methods.findHits(str, root);
    if (hits.length > 0) {
      return { root, hits }
    }
    // otherwise, trust the tagger
    // most-specific first - an #Imperfect is also a #PastTense
    const tense = ['imperfect', 'conditional', 'future', 'past', 'present'].find((k) => term.tags.has(tenseTags[k]));
    if (!tense) {
      return null
    }
    const tag = Object.keys(personTags).find((k) => term.tags.has(k));
    const found = tag ? [personTags[tag]] : ['first', 'third'];
    return { root, hits: found.map((person) => ({ tense, person })) }
  };

  // look backwards for a subject-pronoun - 'yo no lo [sé]'
  const getSubject = function (terms, i) {
    for (let k = i - 1; k >= 0; k -= 1) {
      const str = terms[k].normal;
      if (subjects.hasOwnProperty(str)) {
        return subjects[str]
      }
      if (!clitics.has(str) && !fillers.has(str)) {
        return null
      }
    }
    return null
  };

  // 'hablaba' is both first and third person
  const choosePerson = function (hits, term, terms, i) {
    const found = hits.map((o) => o.person).filter((p, k, arr) => arr.indexOf(p) === k);
    if (found.length === 1) {
      return found[0]
    }
    const tag = Object.keys(personTags).find((k) => term.tags.has(k));
    if (tag && found.includes(personTags[tag])) {
      return personTags[tag]
    }
    const subj = getSubject(terms, i);
    if (subj && found.includes(subj)) {
      return subj
    }
    return found.includes('third') ? 'third' : found[0]
  };

  // 'Hablo' -> 'Hablé'
  const matchCase = function (str, term) {
    const orig = term.text || '';
    if (orig.length > 1 && orig === orig.toUpperCase() && orig !== orig.toLowerCase()) {
      return str.toUpperCase()
    }
    if (orig && orig[0] !== orig[0].toLowerCase()) {
      return str[0].toUpperCase() + str.slice(1)
    }
    return str
  };

  // 'comido', and also 'estado' - which the tagger calls a copula
  const isParticiple = function (term, methods) {
    if (term.tags.has('Perfecto') || term.tags.has('Participle')) {
      return true
    }
    return Boolean(term.root) && term.root !== term.normal && methods.toPerfecto(term.root) === term.normal
  };

  // returns the (possibly shorter) pointer of the new verb-phrase
  const convertOne = function (vb, want, methods, lexicon) {
    const ptr = vb.fullPointer[0];
    if (!ptr) {
      return null
    }
    vb.compute('root');
    const [n, start, end] = ptr;
    const same = [n, start, end];
    const terms = vb.document[n];
    // the first conjugated verb in the phrase is the finite one
    let index = null;
    let parsed = null;
    for (let i = start; i < end; i += 1) {
      parsed = parseTerm(terms[i], terms[i + 1], methods, lexicon, terms[i - 1]);
      if (parsed) {
        index = i;
        break
      }
    }
    if (!parsed) {
      return same
    }
    const term = terms[index];
    const tenses = parsed.hits.map((o) => o.tense);
    // the conditional is a mood, not a tense - 'hablaría'
    if (tenses.every((t) => t === 'conditional')) {
      return same
    }
    const person = choosePerson(parsed.hits, term, terms, index);
    let root = parsed.root;
    let len = 1;
    const next = terms[index + 1];
    const isPerfect = root === 'haber' && Boolean(next) && index + 1 < end && isParticiple(next, methods);
    if (isPerfect) {
      // 'he comido' and 'había comido' are already in the past
      if (want === 'past') {
        return same
      }
      // 'habré comido' is already in the future
      if (want === 'future' && tenses.includes('future')) {
        return same
      }
      // collapse it to a simple tense - 'he comido' -> 'como'
      root = next.root;
      len = 2;
    } else if (tenses.includes(want) || (want === 'past' && tenses.includes('imperfect'))) {
      // already there
      return same
    }
    let str = methods.table(root, [want])[want][person];
    // existential - 'había un gato' -> 'hay un gato'
    if (root === 'haber' && want === 'present' && person === 'third' && !isPerfect) {
      str = 'hay';
    }
    if (!str) {
      return same
    }
    str = matchCase(str, term);
    const m = vb.update([[n, index, index + len]]);
    m.replaceWith(str);
    // the new word may not be in our lexicon
    vb.update([[n, index, index + 1]]).tag(['Verb', tenseTags[want], toPersonTag[person]], 'to-' + want);
    return [n, start, end - (len - 1)]
  };

  // a verb-phrase can hold two clauses - 'la mujer que [canta es] mi tía', 'donde [vivo, nieva]'
  // so give each conjugated verb a phrase of its own
  const convertEach = function (vb, want, methods, lexicon) {
    const ptr = vb.fullPointer[0];
    if (!ptr) {
      return null
    }
    vb.compute('root');
    const [n, start, end] = ptr;
    const terms = vb.document[n];
    const found = [];
    for (let i = start; i < end; i += 1) {
      if (parseTerm(terms[i], terms[i + 1], methods, lexicon, terms[i - 1])) {
        found.push(i);
      }
    }
    if (found.length < 2) {
      return convertOne(vb, want, methods, lexicon)
    }
    // last one first, so that the indexes before it stay true
    let shrink = 0;
    for (let k = found.length - 1; k >= 0; k -= 1) {
      const from = k === 0 ? start : found[k];
      const to = k === found.length - 1 ? end : found[k + 1];
      const res = convertOne(vb.update([[n, from, to]]), want, methods, lexicon);
      shrink += res ? to - res[2] : 0;
    }
    return [n, start, end - shrink]
  };

  const convertTo = function (view, want) {
    const methods = view.methods.two.transform.verb;
    // replacing a word orphans the pointer that held it, so rebuild them as we go
    const lexicon = view.model.one.lexicon;
    const ptrs = [];
    view.forEach((vb) => {
      const ptr = convertEach(vb, want, methods, lexicon);
      if (ptr) {
        ptrs.push(ptr);
      }
    });
    return view.update(ptrs)
  };

  const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot = function (m) {
    m.compute('root');
    const str = m.text('root');
    return str
  };

  const api = function (View) {
    class Verbs extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Verbs';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.verb;
        const { toPresent, toPast, toFuture, toConditional, toGerund, toPerfecto, toImperative, toSubjunctive } = methods;
        return getNth(this, n).map(m => {
          const str = getRoot(m);
          return {
            presentTense: toPresent(str),
            pastTense: toPast(str),
            futureTense: toFuture(str),
            conditional: toConditional(str),
            gerund: toGerund(str),
            perfecto: toPerfecto(str),
            imperative: toImperative(str),
            subjunctive: toSubjunctive(str),
          }
        }, [])
      }
      /** 'hablo' -> 'hablé' (pretérito) */
      toPastTense(n) {
        return convertTo(getNth(this, n), 'past')
      }
      /** 'hablé' -> 'hablo' */
      toPresentTense(n) {
        return convertTo(getNth(this, n), 'present')
      }
      /** 'hablo' -> 'hablaré' */
      toFutureTense(n) {
        return convertTo(getNth(this, n), 'future')
      }
      // overloaded - keep Verb class
      update(pointer) {
        const m = new Verbs(this.document, pointer);
        m._cache = this._cache;
        return m
      }
    }

    View.prototype.verbs = function (n) {
      let m = this.match('#Verb+');
      m = getNth(m, n);
      return new Verbs(this.document, m.pointer)
    };
  };

  var verbs = {
    api,
  };

  var version = '0.3.2';

  // spanish word-rules for .clauses() - the method itself comes from compromise/shared
  const clauses = {
    // a comma, but not a clause break
    notClause: [
      '@hasComma (y|e|o|u) .', // grande, y fuerte
    ],
    // split a clause after these
    splitAfter: [
      '^#Pron (dijo|dice)', // él dijo
    ],
    // split a clause before these
    splitBefore: [
      '(dijo|dice) #Prop$',
      '. . si .{4}', // ... si fuera así
      'y mientras',
      'mientras que',
      'ahora que',
      'desde que',
      'hasta que',
      'aunque',
      '(incluso|aun) (si|cuando)',
      'como si',
      '(cuyo|cuya|cuyos|cuyas)', // whose
    ],
    // split a clause before the [captured] word
    splitBeforeGroup: [
      '#Verb .* [pero] .* #Verb', // es bueno pero es ..
      'si .{2,9} [entonces] .', // si es esto entonces aquello
    ],
  };

  var clauseRules = {
    model: { three: { clauses } },
  };

  nlp.plugin(tokenizer);
  nlp.plugin(tagset);
  nlp.plugin(lexicon);
  nlp.plugin(preTagger);
  // tags '1.234,56' and '5,30€' from their raw text
  nlp.plugin(europeanNumbers);
  nlp.plugin(postTagger);
  nlp.plugin(nouns);
  nlp.plugin(adjectives);
  nlp.plugin(verbs);
  nlp.plugin(numbers);

  // language-neutral plugins, shared with compromise
  nlp.plugin(lazy$1); // nlp.lazy() - only tags the sentences that may match
  nlp.plugin(misc$1); // .parentheses(), .quotations(), .acronyms(), .emails() ...
  nlp.plugin(clauses$1); // .clauses() - split on punctuation, and our rules below
  nlp.plugin(clauseRules);
  nlp.plugin(topics); // .people(), .places(), .organizations(), .topics()
  nlp.plugin(plugin); // .redact()


  const es = function (txt, lex) {
    return nlp(txt, lex)
  };

  // copy constructor methods over
  Object.keys(nlp).forEach(k => {
    if (nlp.hasOwnProperty(k)) {
      es[k] = nlp[k];
    }
  });

  // this one is hidden
  Object.defineProperty(es, '_world', {
    value: nlp._world,
    writable: true,
  });

  /** log the decision-making to console */
  es.verbose = function (set) {
    const env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  es.version = version;

  return es;

}));
