/**
 * A lossless number.
 */
export class Rational {
	protected fractionalValues = new Map<bigint, bigint>()

	public constructor(numerator?: bigint, denominator = 1n) {
		if (numerator && denominator) {
			this.add(numerator, denominator)
		}
	}

	public add(that: Rational): Rational
	public add(numerator: bigint, denominator: bigint): Rational
	public add(p0: Rational | bigint, p1 = 1n): this {
		let numerator: bigint
		let denominator = p1
		if (p0 instanceof Rational) {
			;[numerator, denominator] = p0.simplify()
		} else {
			numerator = p0
		}
		let newNumerator = numerator
		const oldNumerator = this.fractionalValues.get(denominator)
		if (oldNumerator) {
			newNumerator = oldNumerator + numerator
		}
		this.fractionalValues.set(denominator, newNumerator)
		return this
	}

	public sub(that: Rational): Rational
	public sub(numerator: bigint, denominator: bigint): Rational
	public sub(p0: Rational | bigint, p1 = 1n): this {
		let numerator: bigint
		let denominator = p1
		if (p0 instanceof Rational) {
			;[numerator, denominator] = p0.simplify()
		} else {
			numerator = p0
		}
		let newNumerator = -numerator
		const oldNumerator = this.fractionalValues.get(denominator)
		if (oldNumerator) {
			newNumerator = oldNumerator - numerator
		}
		this.fractionalValues.set(denominator, newNumerator)
		return this
	}

	public div(that: Rational): Rational
	public div(otherNumerator: bigint, otherDenominator: bigint): Rational
	public div(p0: Rational | bigint, p1 = 1n): this {
		let otherNumerator: bigint
		let otherDenominator = p1
		if (p0 instanceof Rational) {
			;[otherNumerator, otherDenominator] = p0.simplify()
		} else {
			otherNumerator = p0
		}
		const previousEntries = [...this.entries()]
		this.fractionalValues.clear()
		for (const [denominator, numerator] of previousEntries) {
			this.fractionalValues.set(denominator * otherNumerator, numerator * otherDenominator)
		}
		return this
	}

	public mul(that: Rational): Rational
	public mul(otherNumerator: bigint, otherDenominator: bigint): Rational
	public mul(p0: Rational | bigint, p1 = 1n): this {
		let otherNumerator: bigint
		let otherDenominator = p1
		if (p0 instanceof Rational) {
			;[otherNumerator, otherDenominator] = p0.consolidate()
		} else {
			otherNumerator = p0
		}
		const previousEntries = [...this.entries()]
		this.fractionalValues.clear()
		for (const [denominator, numerator] of previousEntries) {
			this.fractionalValues.set(denominator * otherDenominator, numerator * otherNumerator)
		}
		return this
	}

	public entries(): IterableIterator<[bigint, bigint]> {
		return this.fractionalValues.entries()
	}

	public consolidate(): [numerator: bigint, denominator: bigint] {
		let commonFactors = new PrimeFactors()
		for (const entry of this.entries()) {
			for (const member of entry) {
				if (member !== 0n && member !== 1n) {
					commonFactors = commonFactors.and(member)
				}
			}
		}
		const condensedDenominator = commonFactors.compute()
		let condensedNumerator = 0n
		for (const [denominator, numerator] of this.fractionalValues.entries()) {
			condensedNumerator += (numerator * condensedDenominator) / denominator
		}
		if (condensedDenominator < 0n) {
			return [-condensedNumerator, -condensedDenominator]
		}
		return [condensedNumerator, condensedDenominator]
	}

	public simplify(): [numerator: bigint, denominator: bigint] {
		const [numerator, denominator] = this.consolidate()
		if (numerator === 0n) return [0n, 1n]
		const commonFactors = new PrimeFactors(denominator).and(numerator)
		const condensedDenominator = commonFactors.compute()
		return [condensedDenominator / denominator, condensedDenominator / numerator]
	}

	public isGreaterThan(that: Rational): boolean {
		const a = this.simplify()
		const b = that.simplify()
		return a[0] * b[1] > a[1] * b[0]
	}
}

export class PrimeFactors {
	private factors: Map<bigint, bigint>
	public constructor(n?: bigint) {
		this.factors = new Map<bigint, bigint>()
		if (n) {
			getPrimeFactors(n, this.factors)
		}
	}
	public and(n: bigint): this {
		const newFactors = getPrimeFactors(n)
		for (const [newFactor, newCount] of newFactors) {
			const existingFactorCount = this.factors.get(newFactor)
			if (!existingFactorCount || existingFactorCount < newCount) {
				this.factors.set(newFactor, newCount)
			}
		}
		return this
	}
	public compute(): bigint {
		let result = 1n
		for (const [factor, count] of this.factors) {
			result *= factor ** count
		}
		return result
	}
}

export function getPrimeFactors(
	n: bigint,
	factors = new Map<bigint, bigint>(),
): Map<bigint, bigint> {
	let i = 2n
	while (i <= n) {
		if (n % i === 0n) {
			const currentCount = factors.get(i) ?? 0n
			factors.set(i, currentCount + 1n)
			getPrimeFactors(n / i, factors)
			break
		}
		i += 1n
	}
	if (factors.size === 0) {
		factors.set(n, 1n)
	}
	return factors
}
