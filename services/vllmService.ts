import { Customer, Project, Contract, Payment } from "../types";

export const getLocalAIBriefing = async (data: {
  customers: Customer[];
  projects: Project[];
  contracts: Contract[];
  payments: Payment[];
}) => {
  const baseURL = process.env.VLLM_BASE_URL || "http://114.110.129.64:30143/v1";
  const model = process.env.VLLM_MODEL || "nu-vLLM";

  const prompt = `
    Act as a senior financial advisor for nu-ERP. 
    Analyze the following business data and provide a concise, natural language briefing in Korean.
    Focus on:
    1. Financial Health (Revenue vs. Expenses)
    2. Collection Risk (Which customers have overdue payments?)
    3. Actionable Insights (What should management do next?)
    
    Data:
    Customers: ${JSON.stringify(data.customers.map(c => ({ name: c.name, id: c.id })))}
    Projects: ${JSON.stringify(data.projects.map(p => ({ name: p.name, budget: p.budget, start: p.startDate, end: p.endDate })))}
    Contracts: ${JSON.stringify(data.contracts.map(c => ({ name: c.name, amount: c.amount, balance: c.balance, status: c.status })))}
    Payments: ${JSON.stringify(data.payments.map(p => ({ item: p.item, amount: p.amount, status: p.status, scheduled: p.scheduledDate })))}
    
    Format the output using Markdown. Use professional yet friendly tone.
  `;

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: "당신은 nu-ERP의 전문 금융 어드바이저입니다." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`vLLM API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices[0].message.content || "브리핑을 생성할 수 없습니다.";
  } catch (error: any) {
    console.error("Local vLLM Error:", error);
    return "로컬 AI 브리핑을 생성하는 중 오류가 발생했습니다. 서버 상태를 확인해주세요.";
  }
};
