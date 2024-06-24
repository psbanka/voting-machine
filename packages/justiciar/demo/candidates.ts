import { OPENAI_MODEL, squirrel, aiData } from "./openai";
import type * as OpenAIChat from "openai/resources/chat/index";

export const DEMO_DATA_CONCEPTS = [
	"A political issue, broken down in practical sociological terms",
];
export const schemas = squirrel.add("schemas", aiData);
export const makeJsonSchemaSystemMessage = (
	schemaDescription: string,
): OpenAIChat.ChatCompletionSystemMessageParam => ({
	role: "system",
	content: `Please provide a JSON schema for the following concept: "${schemaDescription}".`,
});
const schemasDemo = squirrel.add("openai-schemas", aiData);
async function inferDemoSchema(concept: string): Promise<string[]> {
	const completion = await schemasDemo.for(concept).get({
		model: OPENAI_MODEL,
		response_format: { type: "json_object" },
		messages: [makeJsonSchemaSystemMessage(concept)],
	});
	const content = completion.choices[0].message.content;
	if (content === null) {
		throw new Error("No content returned from OpenAI");
	}
	const schema = JSON.parse(content);
	return schema;
}
export const getDemoJsonSchema = squirrel.add("json-schema", inferDemoSchema);

// const aiTopicsDemo = squirrel.add("ai-issues", aiComplete);
// export async function getDemoTopics(): Promise<Topic[]> {
// 	return Promise.all(
// 		Array.from({ length: 3 }).map(async (name) => {
// 			const description = (
// 				await aiTopicsDemo.for(`${name}-description`).get({
// 					model: OPENAI_MODEL,
// 					stream: true,
// 					messages: [
// 						{
// 							role: "system",
// 							content: `In a concise sentence, please provide an overview of the following topic: "${name}".`,
// 						},
// 					],
// 				})
// 			).message.content;
// 			return {
// 				name,
// 				key: rng.next().toString().slice(2, 8),
// 				description,
// 			};
// 		}),
// 	);
// }
