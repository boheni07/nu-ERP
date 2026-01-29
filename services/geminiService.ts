
import { GoogleGenAI } from "@google/genai";
import { Customer, Project, Contract, Payment } from "../types";

export const getAIBriefing = async (data: {
  customers: Customer[];
  projects: Project[];
  contracts: Contract[];
  payments: Payment[];
}) => {
  // Use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    // Upgraded model to gemini-3-pro-preview for better complex task performance
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });
    // Use response.text property directly (not a method)
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 브리핑을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};
