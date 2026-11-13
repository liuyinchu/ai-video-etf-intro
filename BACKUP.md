# 完整工程备份与恢复

源码及原始三个提交保存在 main。完整工程（包括 Git 忽略的大文件、依赖、音频、视频、封面和原始素材）保存在 Release 的 ai-video-etf-intro-full-20261114.tar.gz。

原始源码 HEAD：256fb42c39cc3c6bd8111c3552f8b8c113fcc46c。

## 完整恢复

1. 从 Release full-backup-20261114-256fb42 下载 ai-video-etf-intro-full-20261114.tar.gz、SHA256SUMS、file-manifest.json 和 verification-report.json。
2. 校验压缩包 SHA-256：81a38d73aeb78a6733c861bfba71ecfa3b2d8c1ef4fc965068125df1afc2deb0。
3. 在空目录解压：tar -xzf ai-video-etf-intro-full-20261114.tar.gz。压缩包包含 .git，可恢复原始 Git 历史。
4. 运行 node .backup/inventory.mjs /path/to/ai-video-1114-astra 可生成文件哈希清单，与 Release 清单核对。

source-history.bundle 是额外的 Git 历史备份。GitHub 自动生成的 Source code ZIP/TAR 只含已跟踪源码，不含完整工程。

## 备份验证

快照分支 backup/full-20261114-256fb42 用 32 MiB 分块传输完整压缩包。Actions 会逐块核对 SHA-256、重组、解包校验全部源文件和符号链接、检查 Git 历史，然后上传 Release。所有 Release 附件还会重新下载并校验 SHA-256，只有全部通过才发布 Release。

源清单包含文件权限、时间与链接目标。跨平台校验忽略符号链接权限差异；macOS 扩展属性保存在压缩包内。

本视频仅科普，不构成任何投资建议。
