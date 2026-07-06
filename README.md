# Miadio | Ambient Space

Miadio 是一款基于生成式 AI 与极简主义设计哲学的全域感知环境音播放器与播客空间。它结合了动态生成视觉、AI 虚拟主持，以及实时智能翻译字幕功能，旨在提供沉浸、纯粹、无干扰的视听体验。

## 🌟 核心特性 (Core Features)

- **生成式视觉与环境音 (Generative Visuals & Ambient Audio)**：提供多种动态视觉风格（极光、星系云海、融流幻体等），随音频频谱实时变幻。
- **AI 智能主持 (AI Host)**：基于上下文与情感自动生成串场与介绍。
- **智能字幕与实时翻译 (Smart Subtitles & Translation)**：实时捕获音频，调用大语言模型进行精准的英汉双语转译与字幕显示。

## 🎨 设计哲学 (Design Philosophy: Meta-Sensory)

本项目严格遵循 **Meta-Sensory 全域感知设计哲学**，追求“极简通透、层级有序、感知至上”。
- 剔除了无效装饰（如冗余的毛玻璃噪点纹理）。
- 强调通透的悬浮阴影（`shadow-sensory`）与克制的暗黑系色调调优（纯黑底色与沉浸式 UI）。
- 交互干预最小化，所有界面反馈追求即时、柔和、直白，无需用户思考。

## 🚀 阶段性改进更新 (Phased Improvements)

### Phase 4: 在场感升维与声学混响重构 (Current)
- **✨ 新增：电台级动态混响与 Ducking 闪避机制** 
  - 引入了 `DynamicsCompressorNode` 重构全局音频拓扑，实现 AI DJ 发言时的平滑音量闪避（Ducking），精准模拟真实电台主持切入时的声场互动。音乐不骤停而是自然隐淡，发言结束平滑回升，彻底消除“旁白割裂感”，赋予 Miadio 真实的在场生命力。
- **🧠 进阶：AI 主持心智与拟真优化 (Intimate Companion)**
  - 全面更新了后端模型 (Gemini & OpenAI Compatible) 的 Prompt 设定，确立了“克制应景的诗意”的主持基调。
  - 调整 Gemini TTS 发音人为 `Aoede`，更契合深邃的环境陪伴氛围。
- **🎨 视觉：重构环形频谱与抗崩溃引擎**
  - 修复了“环域频谱 (Neon Spectrum)”在特定 WebKit 环境下一遇播放即导致 Canvas 渲染引擎崩溃退出的严重 Bug（由 `roundRect` 边界突变与线性渐变溢出引起）。
  - 将该频谱从线性柱状图完全重构为真正的**动态环形频谱 (Radial Ring Spectrum)**，赋予更强烈的视觉张力，并为所有衍生视效增加了 `IndexSizeError` 边界安全防护，确保环境视效的极致顺滑与稳定。
- **🔧 修复：合成音轨进度同步机制**
  - 修复了合成白噪音与氛围音轨播放时的虚拟进度时间线（Time Tick）问题，使视觉交互更加完整一致。

### Phase 3: 智能化延伸与视觉纯粹化
- **✨ 新增：智能字幕（双语翻译）功能** 
  - 深度集成 Web Audio API 捕获音频，结合后端 Gemini 的多模态理解能力实现音频到文字的转写及中文翻译。
  - 实现双语智能解析，并以极简 Overlay 的形式悬浮于 UI 底部，平滑进入且不干扰整体视觉。
- **🔧 修复：大体积音频负载问题 (Payload Too Large)**
  - 后端 Node.js (Express) 增加了 `50mb` 的 JSON 与 URL-encoded Payload 请求体限制，彻底解决转写音频切片过大导致的 `PayloadTooLargeError` 异常，保障字幕与音频流稳定运行。
- **💅 优化：UI 深度对标 Meta-Sensory 顶级规范**
  - 全面剔除早期繁杂的噪点纹理及过度装饰。
  - 环境背景从 `#050508` 收敛至绝对纯黑 `bg-black`，最大化提升黑暗环境下的沉浸感与视觉边界消融。
  - 优化浮层与卡片透明度，调整为极简高级的 `bg-[#111111]/60` 与定制 `shadow-sensory`。
  - 重新梳理排版层级，次要文案颜色下调至 `text-zinc-400`，字号收敛，突出核心信息，降低用户的认知负荷。

### Phase 2: AI Host 引入与环境视效
- 引入后端 `/api/host/generate` 与 `/api/host/mood` 接口，结合大语言模型打造智能虚拟主持。
- 支持基于天气与时间的环境情感同步，让音乐播放器具备生命力。
- 完善 Visualizer Canvas 动效库，实现波形、粒子、几何等 10+ 种高品质音频响应特效。

### Phase 1: 基础架构建立
- 搭建 React + Vite + Tailwind CSS 现代化前端基座。
- 引入 Web Audio API 实现本地音频的高效解析。
- 构建极简卡片式播放器布局框架。

## 🛠 技术栈 (Tech Stack)

- **Frontend:** React 18, Tailwind CSS, Lucide Icons, Web Audio API
- **Backend:** Node.js, Express
- **AI Integration:** Google GenAI SDK
- **Build Tool:** Vite, esbuild

## 📦 本地运行 (Local Development)

1. 安装依赖
   ```bash
   npm install
   ```
2. 环境变量配置
   在根目录创建 `.env` 文件，加入所需的 API Key：
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
3. 启动全栈开发服务器
   ```bash
   npm run dev
   ```
