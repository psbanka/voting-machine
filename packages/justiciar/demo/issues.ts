import type * as OpenAIChat from "openai/resources/chat/index"

import { aiData, OPENAI_MODEL, squirrel } from "./openai"

export const DEMO_DATA_CONCEPTS = [`A political issue, broken down in practical sociological terms`]
export const schemas = squirrel.add(`schemas`, aiData)
export const makeJsonSchemaSystemMessage = (
	schemaDescription: string,
): OpenAIChat.ChatCompletionSystemMessageParam => ({
	role: `system`,
	content: `Please provide a JSON schema for the following concept: "${schemaDescription}".`,
})
const schemasDemo = squirrel.add(`openai-schemas`, aiData)
async function inferDemoSchema(concept: string): Promise<string[]> {
	const completion = await schemasDemo.for(concept).get({
		model: OPENAI_MODEL,
		response_format: { type: `json_object` },
		messages: [makeJsonSchemaSystemMessage(concept)],
	})
	const content = completion.choices[0].message.content
	if (content === null) {
		throw new Error(`No content returned from OpenAI`)
	}
	const schema = JSON.parse(content)
	return schema
}
export const getDemoJsonSchema = squirrel.add(`json-schema`, inferDemoSchema)
