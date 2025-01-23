import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosRequestConfig } from "axios";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const information = await req.json();
  console.log(information);
  const { birthDate, birthTime, birthPlace } = information;
  const data = JSON.stringify({
    messages: [
      {
        content: `You are a fortune-telling master.I will provide you with some basic information, and I would like you to use Chinese metaphysics to make some predictions based on it. Please output the prediction in JSON format.
          EXAMPLE JSON OUTPUT:
          {
            "fortuneYearScore": 0,
            "careerPersonality": "你拥有强烈的事业心和竞争意识，愿意不断追求更高的目标。面对变化时，能够迅速调整策略，适应新环境。过去一年，机遇与挑战并存。凭借进取心、灵活性和创新思维，有望取得进展，但需注意避免过度冒险，保持理性决策。",
            "annualFortune": "你的创新精神在2025年会得到充分发挥，适合在新技术、新项目或新市场中寻找突破口。如果能够结合自身的优势，可能会取得令人瞩目的成绩。2025年可能会有工作环境、职位或职责的变动，这种变动虽然带来压力，但也可能是事业上升的契机。",
            "monthlyFortune": {
              "January": {"score": 85, "fortune": "新的一年，机会与挑战并存。勇敢迎接工作和学业上的挑战，您会逐渐找到属于自己的节奏。每一步努力都将为您带来更大的收获，保持积极心态，一切都会好起来。"},
              ...
              "December": {"score": 70, "fortune": "新的一年，充满希望与可能。面对工作和学习中的考验，只要坚定信念、勇敢向前，您一定能找到适合自己的节奏。每一份付出都将化为未来的惊喜与成长，坚持乐观，迎接美好的明天！"}
            },
            "careerSignature": "靈籤求得第一枝
                                龍虎風雲際會時
                                一旦凌霄揚自樂
                                任君來往赴瑤池",
            "annualSummary": "2025年将是充满挑战与机遇的一年，通过调整心态、增强沟通和关注健康，您将能够顺利应对挑战，迎接未来的成功。开运物品如木质摆件、红色饰品和金色水晶，将帮助您提升运势，助您平衡五行，收获更多的好运。",
          }
          `,
        role: "system",
      },
      {
        content: `Hello, my birthday is on ${birthDate}, at ${birthTime}. I was born in ${birthPlace}.`,
        role: "user",
      },
    ],
    model: "deepseek-chat",
    frequency_penalty: 0,
    max_tokens: 2048,
    presence_penalty: 0,
    response_format: {
      type: "json_object",
    },
    stop: null,
    stream: true,
    stream_options: null,
    temperature: 1.5,
    top_p: 1,
    tools: null,
    tool_choice: "none",
    logprobs: false,
    top_logprobs: null,
  });

  const config: AxiosRequestConfig<string> = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.deepseek.com/chat/completions",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer sk-79511f013c6f4e29b485fae970338bf7",
    },
    data: data,
    responseType: "stream",
  };

  return axios(config)
    .then((response) => {
      // const content =
      //   response.data === "[DONE]"
      //     ? ""
      //     : response.data.choices[0].delta.content;
      const content = response.data;
      return new NextResponse(content, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Transfer-Encoding": "chunked",
        },
      });
    })
    .catch((error) => {
      return new NextResponse("end:" + error, {
        status: 500,
      });
    });
}
