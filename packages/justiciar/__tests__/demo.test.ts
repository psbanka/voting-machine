import { describe, test } from "vitest"

import { DEMO_DATA_CONCEPTS, getDemoJsonSchema } from "../demo/candidates"

describe(`demo schemas`, () => {
	test(`generation`, async () => {
		await Promise.all(
			DEMO_DATA_CONCEPTS.map(async (concept) =>
				getDemoJsonSchema.for(`${concept}.schema`).get(concept),
			),
		)
	}, 60000)
})
