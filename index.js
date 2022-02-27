/**
@typedef {{
	self?: Set<Atom>;
	baryons?: {
		[ prop: PropertyKey ]: ObserverMap;
	}
}} ObserverMap
*/

/**
@typedef {{
	current: any;
	eqFn?: (a: any, b: any) => boolean;
	fn?: (current: any) => any;

	observing?: Set<Atom>;
	observedBy?: ObserverMap;
}} Atom
*/

/**
@typedef {{
	atom: Atom;
	keys: PropertyKey[];
}} Baryon
*/

/**@type{Atom[]}*/
let Queue = [];
let TickQueued = false;
/**@type{[ (Atom | Baryon), (result: any) => void, (error: any) => void ][]}*/
let Callbacks = [];

const badMoves = {
		set: () => { throw new Error("Can't directly set a value wrapped in an Atom. Set a value by calling it as a function."); },

		construct: () => { throw new Error("Can't use new with a value wrapped in an Atom."); },

		setPrototypeOf: () => { throw new Error("Can't override Atom prototype directly, prototype must be set on the contained object, and then the Atom set to that."); },

		preventExtensions: () => { throw new Error("Can't call preventExtensions on Atom directly, instead call it on the contained value, and then set the Atom to that."); }
};

export const Atom = function (/**@type any*/ value, /**@type any*/ eqFn, /**@type any*/ init) {

	/**@type Atom*/
	const atom = {};

	const wrapper = (/**@type any*/ value) =>
		(value === undefined)
			? getAtom(atom)
			: setAtom(atom, value);

	/**@type ProxyHandler<(value: any) => void>*/
	const AtomHandler = { // Ah yes, the comedian...
		get: (target, prop) => {
			if (prop === 'call' || prop === 'apply')
				return target[prop];

			if (prop === 'bind')
				return true;

			return Baryon(atom, [ prop ]);
		},

		has: ({}, prop) => Reflect.has(getAtom(atom), prop),

		deleteProperty: () => true,

		defineProperty: ({}, prop, attrs) => {

			return true;
		},
		getOwnPropertyDescriptor: ({}, prop) => Reflect.getOwnPropertyDescriptor(getAtom(atom), prop),

		ownKeys: () => Reflect.ownKeys(getAtom(atom)),

		getPrototypeOf: () => Atom.prototype,

		isExtensible: () => Reflect.isExtensible(getAtom(atom)),

		...badMoves
	};

	return new Proxy(wrapper, AtomHandler);
};

const getBaryon = (/**@type Baryon*/ baryon) => {
	const keys = baryon.keys;
	let val = baryon.atom.current;
	for (let i = 0, len = keys.length; i !== len; i++) {
		val = val[keys[i]];
		if (val == null || (typeof val !== 'object'))
			return undefined;
	}

	return val;
};

const Baryon = function (/**@type Atom*/ atom, /**@type PropertyKey[]*/ keys) {

	/**@type Baryon*/
	const baryon = { atom, keys };

	const wrapper = (/**@type any*/ ...args) => {
		const value = getBaryon(baryon);

		if (args.length && (value === undefined))
			throw new Error("Attempted to call or set a property which does not exist.");

		const keys = baryon.keys;
		/**@type any*/
		let obs = baryon.atom.observedBy;
		if (obs === undefined)
			obs = baryon.atom.observedBy = {};
		let last = obs;

		if (typeof value === 'function' || (args.length === 0)) {
			for (let i = 0, len = keys.length; i !== len; i++) {
				obs = obs.baryons;
				if (obs === undefined)
					obs = last.baryons = {};
				last = obs;
				obs = obs[keys[i]];
				if (obs === undefined)
					obs = last[keys[i]] = {};
				last = obs;
			}

			obs = obs.self;
			if (obs.self === undefined)
				obs = last.self = new Set();

			obs.add();

			if (typeof value === 'function')
				return value(...args);

			return value;
		}

		// From here we shouldn't have to worry about undef,
		// because otherwise it would hit the above check.
		let val = baryon.atom.current;
		let notified = false;

		let i = 0;
		for (let len = keys.length - 1; i !== len; i++) {
			if (!notified && obs.self !== undefined && obs.self.size)
				notified = true, notify(obs);

			obs = obs.baryons[keys[i]];
			val = val[keys[i]];
		}

		obs = obs.baryons[keys[i]];
		if (!notified && obs.self !== undefined && obs.self.size)
			notify(obs);

		val[keys[i]] = args[0];

		return callback(baryon);
	};

	/**@type ProxyHandler<(...args: any[]) => any>*/
	const BaryonHandler = {
		get: ({}, prop) => {
			return Baryon(baryon.atom, [ ...baryon.keys, prop ]);
		},

		has: (target, prop) => Reflect.has(target(), prop),

		deleteProperty: () => true,

		defineProperty: () => true,

		getOwnPropertyDescriptor: (target, prop) => Reflect.getOwnPropertyDescriptor(target(), prop),

		ownKeys: (target) => Reflect.ownKeys(target()),

		getPrototypeOf: () => Atom.prototype,

		isExtensible: (target) => Reflect.isExtensible(target()),

		...badMoves
	};

	return new Proxy(wrapper, BaryonHandler);
};

/**@returns{any}*/
const getAtom = (/**@type Atom*/ atom) => {

};

const setAtom = (/**@type Atom*/ atom, /**@type any*/ value) => {

};

/**@returns{void}*/
const notify = (/**@type any*/ obs) => {
};
