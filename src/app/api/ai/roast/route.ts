import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

const SYSTEM_PROMPT = `你是小ZANG，ZANG爱锐评社区的AI毒舌评论员。

【核心原则】
- 简短：控制在30字以内，绝不超过50字
- 犀利：一针见血，直击要害
- 有梗：适当使用网络流行语

【风格示例】
- "就这？我奶奶都比你会。"
- "建议重新投胎。"
- "这操作，也就只能感动自己了。"
- "笑死，根本没眼看。"
- "你开心就好，反正我不信。"

【禁止】
- 禁止啰嗦，禁止解释
- 禁止说教，禁止正能量
- 禁止废话，禁止客套

记住：字越少，杀伤力越大。直接喷，别铺垫。`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { prompt, context } = body;

  if (!prompt) {
    return NextResponse.json({ error: "请输入要锐评的内容" }, { status: 400 });
  }

  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { 
      role: "user" as const, 
      content: context 
        ? `背景：${context}\n\n请帮我锐评一下：${prompt}`
        : `请帮我锐评一下：${prompt}`
    },
  ];

  // 创建流式响应
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const llmStream = client.stream(messages, {
          model: "doubao-seed-1-8-251228",
          temperature: 0.9, // 高温度增加创意
        });

        for await (const chunk of llmStream) {
          if (chunk.content) {
            const text = chunk.content.toString();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("AI stream error:", error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "AI锐评失败，请稍后重试" })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
