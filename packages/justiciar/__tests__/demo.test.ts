import { describe, test } from "vitest";
import { DEMO_DATA_CONCEPTS, getDemoJsonSchema } from "../demo/candidates";

describe("demo schemas", () => {
	test("generation", async () => {
		const schemas = await Promise.all(
			DEMO_DATA_CONCEPTS.map(
				async (concept) => await getDemoJsonSchema.for(concept).get(concept),
			),
		);
	}, 60000);
});
