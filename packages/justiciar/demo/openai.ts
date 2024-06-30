import OpenAI from "openai"
import type * as OpenAICore from "openai/core"
import type * as OpenAIChat from "openai/resources/chat/index"
import type OpenAIResources from "openai/resources/index"
import { Squirrel } from "varmint"

export const OPENAI_MODEL: OpenAIChat.ChatModel = `gpt-4o`

let openAiClient: OpenAI
export const aiData = (async (
	body: OpenAIResources.ChatCompletionCreateParams,
	options?: OpenAICore.RequestOptions,
) => {
	if (!openAiClient) {
		openAiClient = new OpenAI({
			apiKey: import.meta.env.VITE_OPENAI_API_KEY,
			dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
		})
	}
	return openAiClient.chat.completions.create(
		{
			...body,
			stream: false,
		},
		options,
	)
}) as typeof openAiClient.chat.completions.create
export const squirrel = new Squirrel(
	process.env.CI ? `read` : process.env.NODE_ENV === `production` ? `off` : `read-write`,
)
