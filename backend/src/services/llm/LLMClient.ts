import https from 'https'

export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
  /**
   * 可选：覆盖默认模型名称，例如 deepseek-chat / deepseek-reasoner
   */
  model?: string
}

export interface LLMClient {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>
}

/**
 * DeepSeek 客户端实现，作为默认的 LLM 实现。
 * 通过环境变量配置：
 * - DEEPSEEK_API_KEY: 必填，DeepSeek API Key
 * - DEEPSEEK_API_BASE: 选填，自定义网关地址，默认 https://api.deepseek.com
 * - DEEPSEEK_MODEL:  选填，模型名称，默认 deepseek-chat
 */
export class DeepseekClient implements LLMClient {
  private readonly apiKey: string | undefined
  private readonly baseUrl: string
  private readonly model: string

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY
    this.baseUrl = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com'
    // 默认模型名称，可被 chat(options.model) 覆盖
    this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

    if (!this.apiKey) {
      // 不抛错，允许在未配置时优雅降级，由上层检测并给出提示
      console.warn('[LLM] DEEPSEEK_API_KEY 未配置，大模型提示功能将不可用')
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY 未配置')
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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    }

    return new Promise<string>((resolve, reject) => {
      const req = https.request(
        {
          method: 'POST',
          protocol: url.protocol,
          hostname: url.hostname,
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
              return reject(new Error(`DeepSeek API error: ${res.statusCode} - ${data}`))
            }

            try {
              const json = JSON.parse(data)
              const content: string | undefined =
                json?.choices?.[0]?.message?.content || json?.choices?.[0]?.delta?.content

              if (!content) {
                return reject(new Error('DeepSeek 响应中没有内容'))
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
 * 简单的单例工厂，后续如果要扩展到多模型，只需要在这里做分发即可。
 */
export class LLMClientFactory {
  private static instance: LLMClient | null = null

  static getClient(): LLMClient {
    if (!this.instance) {
      this.instance = new DeepseekClient()
    }
    return this.instance
  }
}
