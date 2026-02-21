# duckwolf.cn - 广告易货库存管理系统 (Advertising Barter Inventory Management System)

## 项目概述
`duckwolf.cn` 是一个专门为“广告易货”业务设计的库存与资源管理平台。广告易货是指通过媒体资源（如地铁广告、电梯广告）交换实物商品，并将这些商品通过特定渠道变现的商业模式。

该系统集成了 Gemini AI 能力，提供智能定价、风险评估、实时市场调研和财务模拟功能，帮助决策者优化库存周转率和投资回报率 (ROI)。

## 核心功能模块

### 1. 库存管理 (Inventory Management)
- **管理对象**: 通过易货获得的实物商品。
- **关键属性**: 品牌、类别、市场零售价、实际成本（广告抵扣额）、当前库存量、在线最低价、产品链接。
- **状态追踪**: 充足、低库存、缺货、停产。

### 2. 媒体资源管理 (Media Resource Management)
- **管理对象**: 可用于交换或配合销售的广告资源。
- **资源类型**: 户外媒体（地铁、楼宇、机场）、数字媒体等。
- **关键属性**: 刊例价、折扣率、合同有效期、资源估值。

### 3. 销售渠道管理 (Sales Channel Management)
- **管理对象**: 商品变现的平台。
- **渠道类型**: 线上（1688、得物、闲鱼）、线下、特殊渠道。
- **关键属性**: 佣金率、适用类目、渠道优势、联系人。

### 4. 智能定价与方案 (Pricing & Strategy)
- **定价计划**: 将“商品 + 媒体 + 渠道”组合成具体的销售方案。
- **ROI 预测**: 基于 AI 模拟预测销售回报。

## AI 增强能力 (可作为 WebMCP 工具接口)

该系统通过 `geminiService.ts` 暴露了以下智能接口，非常适合集成到 WebMCP 中：

| 工具名称 | 功能描述 | 输入参数 |
| :--- | :--- | :--- |
| `analyzePricing` | **智能定价分析**：分析商品成本与市场价，给出定价建议和理由。 | `InventoryItem` |
| `assessRisk` | **业务风险评估**：根据总库存、媒体估值和渠道数评估流动性风险。 | `inventoryTotalValue`, `mediaExposure`, `channelCount` |
| `researchProductInfo` | **实时市场调研**：利用 Google Search 联网搜索产品的全网售价、竞品及市场热度。 | `InventoryItem` |
| `optimizePricingStrategy` | **定价策略优化**：针对特定渠道和媒体配合，计算最佳售价和预计 ROI。 | `InventoryItem`, `MediaResource`, `SalesChannel` |
| `runFinancialSimulation` | **财务模拟分析**：对预定的销售活动进行财务测算和战略契合度评估。 | `InventoryItem`, `MediaResource`, `SalesChannel`, `inputs` |

## 技术栈
- **前端**: React 19, TypeScript, Tailwind CSS
- **图表**: Recharts
- **图标**: Lucide React
- **AI**: Google Gemini API (@google/genai)
- **构建工具**: Vite

## 数据模型 (Types)
系统定义了完善的 TypeScript 接口，包括 `InventoryItem`, `MediaResource`, `SalesChannel`, `PricingPlan` 等，确保了数据的结构化和 AI 处理的准确性。
