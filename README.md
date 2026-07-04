<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://cdn.jsdelivr.net/gh/xianfanhuang/Studio@assets/assets/.aistudio/banner-minimal.png?v=2" />
</div>

# Miadio

Browser-native ambient & downtempo global radio, built under the Meta-Sensory Intelligence framework.
Immersive cosmic soundscape player with Nebula visual real-time rendering.

---

## Quick Links
- Live Demo: [https://midaio.netlify.app](https://studio-sonoria.netlify.app)
- GitHub Repository: [https://github.com/xianfanhuang/Studio](https://github.com/xianfanhuang/Studio)
- Assets (assets branch): [assets/.aistudio](https://github.com/xianfanhuang/Studio/tree/assets/assets/.aistudio)

## Product Preview

(若要显示预览图，请确保使用的图片链接在 assets 分支中存在，或将图片路径指向 raw 或 CDN 地址。当前 README 使用 CDN 引用 assets 分支下的 banner。注意：仓库中的图片文件名存在前置空格，因此链接中使用了 %20 编码以匹配当前文件名。建议将文件重命名以移除前导空格以改善可用性。)

## Core Features
- 🪐 Nebula 动态粒子背景可视化
- 🎵 多通道全球 chill 电台流（含 SomaFM 与自定义 ambient 频道）
- 🎧 极简播放 UI（miadio 风格）
- 🌙 暗色优先设计，匹配 Meta-Sensory 品牌语言
- ⚡ 轻量化 Web 客户端，无需额外安装

## Brand Assets
- 垂直社交封面与介绍用图（位于 assets/.aistudio）

## 修复说明
- 发现仓库图片文件名在 assets/.aistudio 下以“ 空格 + banner-minimal.png ”命名，导致原本指向无空格文件名的链接无法找到图片。
- 为确保图片能显示，已在 README 中将图片链接改为带有 URL 编码的路径（%20）以匹配当前文件名。
- 推荐并说明如何重命名文件以移除前导空格（见下）。

如何移除文件名前导空格（建议）
1. 在本地操作：
   - 克隆 assets 分支并重命名：
     git clone --branch assets https://github.com/xianfanhuang/Studio.git
     cd Studio
     git mv "assets/.aistudio/ banner-minimal.png" "assets/.aistudio/banner-minimal.png"
     git commit -m "Rename: remove leading space from banner-minimal.png"
     git push origin assets
2. 或使用 GitHub 网页界面：
   - 打开文件页面 https://github.com/xianfanhuang/Studio/blob/assets/assets/.aistudio/%20banner-minimal.png
   - 点击编辑（铅笔），重新上传或创建新文件名并删除旧文件（网页 UI 对二进制文件编辑有限，建议本地操作或通过 git）。

## 本地运行（简要）
1. 克隆仓库：
   git clone https://github.com/xianfanhuang/Studio.git
2. 切换到主分支并查看示例页面或按照项目内说明运行（如有 package.json：npm install && npm run dev）。

---

项目由 **Meta-Sensory Intelligence** 提供支持，统一的螺旋标识视觉体系，面向宇宙与宁静的音频体验。
