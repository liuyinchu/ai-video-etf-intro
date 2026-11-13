# V2 成片核查记录

完成日期：2026-11-14（Asia/Shanghai）。

- 成片 735.509 秒，1920×1080、30 fps、22065 帧。H.264 视频，AAC 双声道，20 个内嵌章节。
- 15 个独立 ETF 段落，共 623.23 秒，占全片 84.7%。每只均有总回报、仅价格和回撤三条轨迹。
- 45 条轨迹独立读取原 SVG 坐标轴标定；起点、期末、年化和最大回撤与元数据交叉核验通过。15 个源 SVG 文件哈希保持一致。
- 188 条字幕与 TTS 的逐词文本一致、无重叠；时间轴连续；所有语音均位于对应场景之内。
- 检查全部 20 个场景的关键帧与产品增长阶段图；另从最终 MP4 每个场景抽帧，复核 VOO、QQQM、SGOV、TLT、GLD、510300 的实际编码画面。
- 完整视频帧与音轨解码成功，未报告解码错误。
- 成片实际综合响度 -16.03 LUFS，真峰值 -1.48 dBTP；人声下的音乐相对 V1 平均下降 5.31 dB。
- TypeScript 编译检查、项目自有源码 whitespace 检查通过。
- V1 视频 SHA-256 与制作 V2 前完全一致。原始文稿与附件、两个只读参考工程保持原样。

成片 SHA-256：

128c9aa949e7620676a14ca5d597f652ab3093e64070e2bfc37f3a9c03f44aa2

音频检查采用完整解码、响度、峰值、逐词时间戳与分轨能量校验。详细机器记录在 out/validation.json、out/chart-validation.json、out/audio-comparison.json、out/video-probe.json、out/final-audio-report.json 和 out/manifest.json。
