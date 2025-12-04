// lib/ai/provider.ts
import { gateway } from 'ai';

// export interface ModelConfig {
//   modelId: string;
//   label?: string;
// }

// export interface ProviderConfig {
//   baseURL?: string;
//   apiKey?: string;
//   defaultModel?: string;
//   fallbackModels?: string[];
// }

// // Create the gateway provider
// function createGatewayProvider(config?: ProviderConfig) {
//   return createOpenAICompatible({
//     name: 'ai-gateway',
//     baseURL: config?.baseURL ?? process.env.AI_GATEWAY_BASE_URL ?? 'https://ai-gateway.vercel.sh/v1',
//     apiKey: config?.apiKey ?? (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN),
//     includeUsage: true,
//   });
// }

// // Default gateway instance
// export const gateway = createGatewayProvider();



export const gatewayProvider = gateway('anthropic/claude-4-5-sonnet',

)
