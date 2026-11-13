# ETF：把市场装进一份基金

约 5 分 58 秒的中文科普视频，1920×1080、30 fps，18 个动态图形场景、15 只代表产品、Edge 中文男声、87 条中文字幕、128 BPM 电音。

成片定位为认识 ETF 的原理、类型、收益和风险。按用户反馈，正片删去了组合配置、购买持有清单及独立的数据计算章节。结尾聚焦三个问题：买了什么，收益从哪来，承担哪些风险。

## 交付文件

- `out/ETF_原理类型收益与风险_1080p.mp4`：完整成片，H.264 / AAC。
- `out/ETF_封面.png`：1920×1080 横版封面。
- `out/ETF_科普字幕.srt`：中文字幕。
- `docs/旁白与分镜.md`：实际配音文稿和场景时间。
- `out/validation.json`、`out/audio-master-report.json`、`out/video-probe.json`：核查记录。
- `PUBLISH.md`：标题、简介和章节时间。仅准备文案，未向任何平台发布。

## 声音与画面

配音使用 Microsoft Edge TTS 的 `zh-CN-YunxiNeural`，语速 +5%、音高 −2 Hz。远端环境未发现 Breeze API 密钥，因而采用用户指定的后备方案。Node 客户端按 edge-tts 的语音协议请求音频与逐词时间戳，未安装或执行 Python，也未创建或修改虚拟环境。

电音以用户提供的 1108 工程的程序合成器为基础重新编排，使用底鼓、贝斯、锯齿波和弦、琶音、上升音和过渡冲击音。没有外部音乐采样。旁白播放期间自动降低配乐音量，输出母带目标为 −16 LUFS、−1.5 dBTP、48 kHz 立体声。

视觉采用连续的深蓝空间、资产篮子、轨道、粒子、点阵地球、拆分数值和动态图表。字幕、公式、图表标签和免责声明均由代码精确排版。

## 工作目录与运行环境

所有实现、语音生成、音频混合与视频渲染都在远端完成：

`yangshuyun@10.10.10.1:~/workspace/dev/ai-video/ai-video-1114-astra`

本机挂载路径为 `/Volumes/yangshuyun/workspace/dev/ai-video/ai-video-1114-astra`，可直接查看产物。

Node 使用远端已存在的 `/opt/homebrew/opt/node@24/bin/node`。Remotion 4.0.541 及其依赖从经授权只读的参考工程复制到当前仓库，未改动参考工程。使用远端已有的 Chromium headless shell。参考工程路径和来源见 `docs/SOURCES.md`。

```bash
./scripts/run.sh check
./scripts/run.sh audio
./scripts/run.sh stills
./scripts/run.sh render
./scripts/run.sh studio
```

音频按文稿内容缓存，文稿改变时只请求变动的场景。音频重建后需重新渲染视频。主入口是 `src/story.json`，时间轴由实际语音长度生成；所有场景切点对齐 128 BPM 小节网格，允许不足一帧的取整误差。

## 内容与资料

原稿及 SVG 附件保存在原目录，保持原样。2022 年柱状图直接读取 SVG 的数值元数据，期间为 2021-12-31 至 2022-12-30，采用美元复权收盘价近似分配再投资总回报。画面保留来源与口径脚注。

“100 → 110 + 3”“100 → 97 + 3”和久期算例均为明确标注的教学假设。产品描述说明持仓与风险，不给出推荐购买名单或配置比例。

本视频仅科普，不构成任何投资建议。历史表现不预示未来收益。
