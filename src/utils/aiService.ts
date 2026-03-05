// AI服务工具类

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletion {
  choices: {
    message: {
      role: 'assistant';
      content: string;
    };
  }[];
}

class AIService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.KIMI_API_KEY!;
    this.baseURL = 'http://localhost:3000';
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      console.log('调用本地Kimi服务:', `${this.baseURL}/api/chat`);
      console.log('发送的消息:', messages);
      
      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages
        })
      });

      console.log('API响应状态:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API错误数据:', errorData);
        throw new Error(`API错误: ${errorData.error || errorData.message || '未知错误'}`);
      }

      const data: ChatCompletion = await response.json();
      console.log('API响应数据:', data);
      
      return data.choices?.[0]?.message?.content || '未收到回复';
    } catch (error) {
      console.error('AI服务调用失败:', error);
      throw error;
    }
  }

  // 生成IDC运维相关的系统提示
  getSystemPrompt(): string {
    return '你是一位资深的 IDC（互联网数据中心）运维专家助手。请用中文回答用户问题，提供专业、准确的运维建议。';
  }

  // 构建用户消息，包含系统状态
  buildUserMessage(userQuestion: string, systemStatus: {
    powerConsumption: string;
    averageTemperature: string;
    networkTraffic: string;
    criticalAlerts: string;
  }): string {
    return `当前系统状态：
- 总功耗: ${systemStatus.powerConsumption}
- 平均温度: ${systemStatus.averageTemperature}
- 网络流量: ${systemStatus.networkTraffic}
- 关键警报: ${systemStatus.criticalAlerts}

用户问题: ${userQuestion}`;
  }
}

export const aiService = new AIService();