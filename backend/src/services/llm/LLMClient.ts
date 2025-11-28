import https from 'https'
import http from 'http'

export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
  /**
   * 可选：覆盖默认模型名称
   */
  model?: string
}

/**
 * 用户自定义的 LLM 配置（从前端传入）
 */
export interface UserLlmConfig {
  provider?: 'deepseek' | 'qwen' | 'openai' | 'custom'
  model?: string
  apiKey?: string
  customBaseUrl?: string
  customModel?: string
}

/**
 * 预置的提供商配置
 */
const PROVIDER_CONFIGS: Record<string, { baseUrl: string; defaultModel: string }> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-turbo',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
}

export interface LLMClient {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>
}

/**
 * 通用 OpenAI 兼容客户端，支持 DeepSeek、通义千问、OpenAI 等
 */
export class OpenAICompatibleClient implements LLMClient {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly model: string
  private readonly providerName: string

  constructor(config: {
    apiKey: string
    baseUrl: string
    model: string
    providerName?: string
  }) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl.replace(/\/+$/, '') // 移除末尾斜杠
    this.model = config.model
    this.providerName = config.providerName || 'LLM'
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error(`${this.providerName} API Key 未配置`)
    }

    const payload = {
      model: options?.model || this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 512,
      stream: false,
    }

    const body = JSON.stringify(payload)
    const url = new URL('/chat/completions', this.baseUrl)
    const isHttps = url.protocol === 'https:'

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    }

    return new Promise<string>((resolve, reject) => {
      const httpModule = isHttps ? https : http
      const req = httpModule.request(
        {
          method: 'POST',
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          headers,
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 400) {
              return reject(new Error(`${this.providerName} API error: ${res.statusCode} - ${data}`))
            }

            try {
              const json = JSON.parse(data)
              const content: string | undefined =
                json?.choices?.[0]?.message?.content || json?.choices?.[0]?.delta?.content

              if (!content) {
                return reject(new Error(`${this.providerName} 响应中没有内容`))
              }

              resolve(content)
            } catch (err) {
              reject(err)
            }
          })
        },
      )

      req.on('error', (err) => {
        reject(err)
      })

      req.write(body)
      req.end()
    })
  }
}

/**
 * LLM 客户端工厂，支持根据用户配置创建对应的客户端
 */
export class LLMClientFactory {
  // 默认客户端（使用环境变量配置）
  private static defaultInstance: LLMClient | null = null

  /**
   * 获取默认客户端（使用服务器环境变量配置）
   */
  static getClient(): LLMClient {
    if (!this.defaultInstance) {
      const apiKey = process.env.DEEPSEEK_API_KEY
      const baseUrl = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com'
      const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

      if (!apiKey) {
        console.warn('[LLM] DEEPSEEK_API_KEY 未配置，大模型提示功能将不可用')
      }

      this.defaultInstance = new OpenAICompatibleClient({
        apiKey: apiKey || '',
        baseUrl,
        model,
        providerName: 'DeepSeek',
      })
    }
    return this.defaultInstance
  }

  /**
   * 根据用户配置创建客户端
   * 如果用户提供了自己的 API Key，则使用用户配置；否则回退到默认配置
   */
  static getClientWithUserConfig(userConfig?: UserLlmConfig): LLMClient {
    // 如果用户没有提供 API Key，使用默认客户端
    if (!userConfig?.apiKey) {
      return this.getClient()
    }

    const provider = userConfig.provider || 'deepseek'
    let baseUrl: string
    let model: string
    let providerName: string

    if (provider === 'custom') {
      // 自定义提供商
      if (!userConfig.customBaseUrl) {
        throw new Error('自定义提供商需要填写 API 地址')
      }
      baseUrl = userConfig.customBaseUrl
      model = userConfig.customModel || userConfig.model || 'gpt-3.5-turbo'
      providerName = '自定义'
    } else {
      // 预置提供商
      const config = PROVIDER_CONFIGS[provider]
      if (!config) {
        throw new Error(`未知的提供商: ${provider}`)
      }
      baseUrl = config.baseUrl
      model = userConfig.model || config.defaultModel
      providerName = provider.charAt(0).toUpperCase() + provider.slice(1)
    }

    return new OpenAICompatibleClient({
      apiKey: userConfig.apiKey,
      baseUrl,
      model,
      providerName,
    })
  }
}
