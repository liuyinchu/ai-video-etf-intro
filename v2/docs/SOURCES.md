# V2 来源说明

主体内容及历史图源于用户提供的《ETF：从原理到配置的入门指南》及其 attachments 文件夹。原文和附件保持原样。

15 只产品逐只呈现：VOO、VTI、VT、VXUS、QQQ、QQQM、SCHD、BND、SGOV、VGSH、VGIT、TLT、GLD、EWJ、510300。原稿的详细发行人来源列表仍在原稿尾部。

结构、分配与风险描述的官方补充核对入口：

- [SEC：ETF 结构与净值](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24)
- [iShares：SGOV 的 0—3 个月国库券范围及月度分配](https://www.ishares.com/us/products/314116/ishares-0-3-month-treasury-bond-etf)
- [iShares：EWJ 日本股票及分配安排](https://www.ishares.com/us/products/239665/ishares-msci-japan-etf)
- [iShares：TLT 长期国债](https://www.ishares.com/us/products/239454/ishares-20-year-treasury-bond-etf)
- [Schwab：SCHD 的股息质量与财务筛选](https://www.schwabassetmanagement.com/products/schd)
- [Invesco：QQQM 纳斯达克 100](https://www.invesco.com/us/en/financial-products/etfs/invesco-nasdaq-100-etf.html)
- [State Street：GLD 实物黄金信托](https://www.ssga.com/us/en/individual/etfs/spdr-gold-shares-gld)

V2 没有引入即时价格、费用变化预测或未来收益预测。统计数字统一来自原附件中截至 2026-10-30 的样本。每只基金实际起点、币种、各项统计量和源文件哈希保存在 src/charts.json。

渲染图形用代码重绘，独立通过原图坐标轴刻度反算并核对三条曲线；未以图像生成工具猜测或补画数据。源图中的坐标轴标签有四舍五入，因此标定采用端部刻度并交叉校验元数据，保留 SGOV 的细小回撤精度。

声音协议、LGPLv3 许可与参考工程来源沿用 V1 的 docs/SOURCES.md。配乐以用户参考工程的合成器为基础，在 V2 中重新编排与混音。没有第三方音乐采样。
