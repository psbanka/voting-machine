let depth = 0;
const countMap = new Map<string, number>();
export function perf(key: string) {
	const performanceKey = key;
	const performanceKeyStart = `${performanceKey}:start`;
	const performanceKeyEnd = `${performanceKey}:end`;
	performance.mark(performanceKeyStart);
	countMap.set(performanceKey, (countMap.get(performanceKey) ?? 0) + 1);
	depth++;
	return () => {
		performance.mark(performanceKeyEnd);
		const metric = performance.measure(
			performanceKey,
			performanceKeyStart,
			performanceKeyEnd,
		);
		const count = countMap.get(performanceKey) ?? 0;
		console.log(" ".repeat(depth), count, metric.name, metric.duration);
		depth--;
	};
}
