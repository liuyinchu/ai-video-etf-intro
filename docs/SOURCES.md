# 资料与制作来源

内容主来源：用户提供的《ETF：从原理到配置的入门指南》，以及同目录 attachments 中的 SVG。原稿标注核验日期为 2026-11-14。正片按用户后续意见缩减为原理、收益、类型和风险。

## 官方补充核对

- [SEC / Investor.gov：ETF 结构、交易、净值与折溢价](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24)
- [Invesco：QQQM / Nasdaq-100](https://www.invesco.com/us/en/financial-products/etfs/invesco-nasdaq-100-etf.html)
- [Schwab：SCHD 的股息质量与财务指标筛选](https://www.schwabassetmanagement.com/products/schd)
- [iShares：TLT 持有 20 年以上美国国债](https://www.ishares.com/us/products/239454/ishares-20-year-treasury-bond-etf)
- [State Street：GLD 实物黄金敞口](https://www.ssga.com/us/en/individual/etfs/spdr-gold-shares-gld)

其余代表产品的发行人链接保留在原文参考资料中。正片以稳定的资产范围与机制描述为主，具体资料随产品公告变化。

## 数值

正片唯一真实历史横向图表为 2022 年不同 ETF 的总回报比较，取自 `attachments/etf-guide-2022.svg` 内的 `dc:description` JSON。数值不由视觉代码手填，自动校验要求与附件完全相等。原始来源为 Yahoo Finance 复权收盘价，忽略个人税费与汇兑成本；这是近似总回报，不等同于发行人的官方净值回报。

其余图形均是标明的结构示意或假设算例。金额算例忽略税费；久期算例是一阶近似，未计利息、凸性、信用利差与持仓调整。

## 声音

- [Breeze 官方开发文档](https://docs.breezeblue.ai/)：API 需要 `BREEZE_API_KEY` 等有效认证。远端任务环境没有可用密钥，使用已获授权的 Edge 后备方案。
- [edge-tts 上游](https://github.com/rany2/edge-tts)：Microsoft Edge 语音协议和时间戳结构。
- `scripts/edge-token.mjs` 是上游当前请求令牌实现的 JavaScript 移植；上游参考文本保存在 `docs/edge-tts-drm-reference.py`，仅供读取，不作为 Python 程序执行。许可见 `docs/edge-tts-LICENSE`。
- 配音角色：`zh-CN-YunxiNeural`，没有克隆或模仿任何特定真人。

## 只读参考工程

- `/Users/yangshuyun/workspace/dev/ai-video/ai-video-1108-opus`：深色科技视觉、节拍转场与程序电音合成器。合成脚本复制到当前项目后重新设置段落、时间轴和随机种子；参考工程保持只读。
- `/Users/yangshuyun/workspace/dev/ai-video/ai-video-1029-opus`：大字号动态排版、图形解释和配音时间轴思路；保持只读。
- 本机挂载路径与用户授权的 `/Volumes/yangshuyun/workspace/dev/ai-video/...` 对应。

视觉源码、旁白文稿和时间轴在当前远端仓库中创作与编辑；所有输出均保存在当前仓库。
