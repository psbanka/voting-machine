export function need<T>(value: T): Exclude<T, undefined> {
	if (value === undefined) {
		throw new Error(`Missing needed value`)
	}
	return value as Exclude<T, undefined>
}

export function ok<T>(value: T): value is Exclude<T, Error> {
	return !(value instanceof Error)
}
