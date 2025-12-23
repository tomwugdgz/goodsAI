
import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem, AIAnalysisResult, MediaResource, SalesChannel } from "../types";

const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';

const getAIClient = () => {
    if (!apiKey) {
        console.warn("API_KEY is not set.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzePricing = async (item: InventoryItem): Promise<AIAnalysisResult> => {
    const ai = getAIClient();
    if (!ai) {
        return {
            recommendation: "未配置 API Key",
            reasoning: ["请配置有效的 Gemini API Key 以获取真实分析。"],
            suggestedPriceRange: { min: item.marketPrice * 0.8, max: item.marketPrice * 0.95 }
        };
    }

    const prompt = `
    分析以下通过广告易货获得的库存商品的定价策略：
    产品名称: ${item.name}
    品牌: ${item.brand}
    类别: ${item.category}
    市场零售价: ¥${item.marketPrice}
    实际成本 (广告抵扣): ¥${item.costPrice}
    当前库存: ${item.quantity}

    请提供定价建议，以在保持品牌价值的同时最大化流动性。
    请务必使用中文回答。
    返回 JSON 格式。
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendation: { type: Type.STRING },
                        reasoning: { 
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        suggestedPriceRange: {
                            type: Type.OBJECT,
                            properties: {
                                min: { type: Type.NUMBER },
                                max: { type: Type.NUMBER }
                            }
                        },
                        riskScore: { type: Type.NUMBER, description: "风险评分 0-100" }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("AI 无响应");
        return JSON.parse(text) as AIAnalysisResult;

    } catch (error) {
        console.error("Gemini Pricing Analysis Error:", error);
        return {
            recommendation: "分析出错",
            reasoning: ["无法连接到 AI 服务。"],
            riskScore: 0
        };
    }
};

export const assessRisk = async (inventoryTotalValue: number, mediaExposure: number, channelCount: number): Promise<AIAnalysisResult> => {
    const ai = getAIClient();
    if (!ai) return { recommendation: "无 API Key", reasoning: [], riskScore: 0 };

    const prompt = `
    针对以下指标执行广告易货业务风险评估：
    总库存价值: ¥${inventoryTotalValue}
    媒体资源估值: ¥${mediaExposure}
    活跃销售渠道: ${channelCount}

    识别潜在的流动性风险和渠道依赖风险。
    请务必使用中文回答。
    `;

    try {
         const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendation: { type: Type.STRING },
                        reasoning: { 
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        riskScore: { type: Type.NUMBER }
                    }
                }
            }
        });
        const text = response.text;
        if(!text) throw new Error("空响应");
        return JSON.parse(text) as AIAnalysisResult;
    } catch (error) {
         console.error("Gemini Risk Assessment Error:", error);
         return { recommendation: "评估出错", reasoning: [], riskScore: 50 };
    }
};

export interface ProductResearchResult {
    summary: string;
    marketAnalysis: string[];
    competitorAnalysis: string;
    suggestedPositioning: string;
    sources: { title: string; uri: string }[];
}

export const researchProductInfo = async (item: InventoryItem): Promise<ProductResearchResult> => {
    const ai = getAIClient();
    if (!ai) throw new Error("API Key Missing");

    const prompt = `
    你是一名专业的产品市场调研专家。请通过网络搜索调研以下产品：
    产品名称: ${item.name}
    品牌: ${item.brand}
    类别: ${item.category}

    请执行以下任务：
    1. 查找该产品在主流电商平台（如京东、天猫、拼多多）的当前实际售价和用户评价。
    2. 分析竞品情况及其价格点。
    3. 评价该产品在当前市场的热度和生命周期阶段。
    4. 给出针对易货渠道的定位建议。

    请务必使用中文回答。
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text || "未能生成分析文本。";
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .filter((chunk: any) => chunk.web)
            .map((chunk: any) => ({
                title: chunk.web.title || "参考链接",
                uri: chunk.web.uri
            }));

        // Structuring the unstructured text into segments for UI
        const segments = text.split('\n\n');

        return {
            summary: segments[0] || text,
            marketAnalysis: segments.slice(1, 3),
            competitorAnalysis: segments[3] || "见概要分析",
            suggestedPositioning: segments[4] || "建议根据市场波动调整",
            sources
        };

    } catch (error) {
        console.error("Product Research Error:", error);
        throw error;
    }
};

export const optimizePricingStrategy = async (
    item: InventoryItem,
    media: MediaResource,
    channel: SalesChannel
): Promise<any> => {
    const ai = getAIClient();
    if (!ai) {
        return {
            suggestedPrice: item.marketPrice * 0.6,
            predictedROI: 20,
            reasoning: "AI Key缺失。根据市场价60%估算。"
        };
    }

    const prompt = `
    你是一名广告易货定价专家。
    目标：确定最佳销售价格（渠道出价），以快速清理库存并最大化ROI。
    
    上下文：
    - 产品: ${item.name} (${item.category}, 品牌: ${item.brand})
    - 市场零售价: ¥${item.marketPrice}
    - 我们的沉没成本: ¥${item.costPrice}
    - 销售渠道: ${channel.name} (佣金率: ${(channel.commissionRate * 100).toFixed(0)}%)
    - 配合媒体: ${media.name} (${media.rate})

    任务：
    1. 建议一个具体的最佳售价。
    2. 计算预计 ROI。
    3. 提供一句话的战略理由。
    
    请务必使用中文回答。
    返回 JSON 格式。
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestedPrice: { type: Type.NUMBER },
                        predictedROI: { type: Type.NUMBER },
                        reasoning: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        return { suggestedPrice: item.marketPrice * 0.7, predictedROI: 15, reasoning: "分析异常，建议参考历史定价。" };
    }
};

export const runFinancialSimulation = async (
    inventory: InventoryItem,
    media: MediaResource,
    channel: SalesChannel,
    inputs: { sellPrice: number; quantity: number; mediaCost: number }
): Promise<any> => {
    const ai = getAIClient();
    if (!ai) return { recommendation: "无 API 密钥", reasoning: ["请检查设置"], riskScore: 50, strategicFitScore: 50 };

    const prompt = `
    针对以下销售活动执行财务测算和战略分析。
    
    商品: ${inventory.name} (成本: ¥${inventory.costPrice})
    媒体: ${media.name} (刊例: ${media.rate})
    渠道: ${channel.name} (佣金: ${channel.commissionRate * 100}%)
    
    测算参数:
    - 预定售价: ¥${inputs.sellPrice}
    - 目标销量: ${inputs.quantity}
    - 媒体固定投入: ¥${inputs.mediaCost}
    
    请分析此组合的战略契合度，并提供改进建议。
    请务必使用中文回答。
    返回 JSON。
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendation: { type: Type.STRING },
                        reasoning: { type: Type.ARRAY, items: { type: Type.STRING } },
                        riskScore: { type: Type.NUMBER },
                        strategicFitScore: { type: Type.NUMBER }
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        return { recommendation: "模拟分析失败", reasoning: ["网络超时"], riskScore: 50, strategicFitScore: 50 };
    }
};
