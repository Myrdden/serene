/** Shorthand for function types */
export type func <T = any> = (...args: any[]) => T;

export type Sealed <T = any> = {
	readonly [ prop in keyof T ]: Sealed<T[prop]>;
};

export type AtomEqualityFunction <T = any> = (
	0 | 1 | 2 | 3
	| ((prev: T, next: T) => boolean)
);

type MappedAtom <T> = T extends (Array<infer V> | ReadonlyArray<infer V>)
? <M> (fn: ((bound: V) => M)) => ReadonlyAtom<M[]>
: T extends Map<infer K, infer V>
	? <M> (fn: ((bound: V) => M)) => ReadonlyAtom<Map<K, M>>
	: T extends Set<infer V>
		? <M> (fn: ((bound: V) => M)) => ReadonlyAtom<Set<M>>
		: T extends Iterable<infer V>
			? <M> (fn: ((bound: V) => M)) => ReadonlyAtom<Iterable<M>>
			: <M> (fn: ((bound: T) => M)) => ReadonlyAtom<M>;

type AtomSetter <T> = (T | Promise<T> | ((prev: T) => (T | Promise<T>)));

export type Atom <T> = T extends func
? (T extends (current?: infer R) => infer R ? ReadonlyAtom<R> : never)
: Extract<keyof T, ('call' | 'bind' | 'apply')> extends never ? ({
		/** Call this to retrieve the Atom's value reactively */
		(): Sealed<T>;
		/** Call this to set the Atom's value, and update anything observing it */
		(value: AtomSetter<T>): Promise<Sealed<T>>;
		readonly call: {
			(thisArg: any): Sealed<T>;
			(thisArg: any, value: AtomSetter<T>): Promise<Sealed<T>>;
		},
		readonly apply: {
			(thisArg: any): Sealed<T>;
		},
		readonly bind: <B> (fn: ((bound: T) => B)) => ReadonlyAtom<B>;
		readonly map: MappedAtom<T>;
	} & (T extends object
	? {
		readonly [ prop in keyof T ]: T[prop] extends func ? T[prop] : Atom<T[prop]>;
	} : unknown)
) : never;

type ReadonlyAtom <T> = {
	/** Call this to retrieve the Atom's value reactively */
	(): Sealed<T>;
	readonly call: (thisArg: any) => Sealed<T>;
	readonly apply: (thisArg: any) => Sealed<T>;
	readonly bind: <B> (fn: ((bound: T) => B)) => ReadonlyAtom<B>;
	readonly map: MappedAtom<T>;
} & (T extends object
	? {
		readonly [ prop in keyof T ]: T[prop] extends func ? T[prop] : ReadonlyAtom<T[prop]>;
	} : unknown
);

/** Test */
export const Atom: {
	new <T> (value: T, eqFn?: AtomEqualityFunction<T>, init?: T): Atom<T>;

	/**
	 * Constructs atom
	 * @param value - Yeet
	 */
	<T extends func> (value: T, eqFn?: AtomEqualityFunction<T>, init?: ReturnType<T>): Atom<T>;

	/**
	 * Constructs atommm
	 *
	 */
	<T> (value: (T | Promise<T>), eqFn?: AtomEqualityFunction<T>): Atom<T>;
};

export const Effect: () => void;

export const Root: () => void;

export const omit: <T> (fn: func<T>) => T;
