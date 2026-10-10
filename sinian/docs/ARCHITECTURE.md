# 技术架构

原则：**遗物不离开手机。** 所有解析、建模、推理都在本机完成；唯一的网络请求是首次下载开源模型文件。

```
┌──────────────────────────── 手机 (React Native / Expo) ────────────────────────────┐
│                                                                                   │
│  家人同意 ──► evaluateConsent()  ──(active?)──►  导入资料                           │
│   (consent.ts)                                    │                               │
│                                                   ├─ 聊天记录 ─► importers ─► persona.ts (说话风格)
│                                                   │                       └─► memory.ts  (BM25 回忆库)
│                                                   ├─ 回忆文字 ──────────────► memory.ts
│                                                   ├─ 声音样本 (WAV+原文) ───► voice.ts  (零样本克隆)
│                                                   └─ 照片 ────────────────► 对话页头像
│                                                                                   │
│  对话 ──► ConversationEngine.respond()                                            │
│            1. accessFor()      同意是否仍有效、这位家人是否签过字                       │
│            2. detectCrisis()   危机 → 跳出角色、给热线（不经过模型）                     │
│            3. 每日时长上限                                                          │
│            4. memory.search()  检索相关回忆                                          │
│            5. buildPrompt()    人设 + 风格 + 真实例句 + 回忆 + 规则                      │
│            6. LocalLlm         llama.rn 本地推理                                     │
│            7. checkOutput()    钱/遗产/密码、"我还活着"、医疗指令 → 重写或兜底             │
│            8. 诚实性           被问"是你吗"时强制说明是 AI                               │
│            9. VoiceClone       可选：用克隆声音朗读（WAV 内写入 AIGC 标识）               │
│                                                                                   │
│  撤回同意 / 删除 ──► deletionPlan() ──► 删除原始文件、模型、回忆库                       │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## 代码结构

```
sinian/
├── core/                 纯 TypeScript，无原生依赖，可单元测试
│   ├── src/consent.ts    同意规则（本人意愿 > 第一顺序近亲属全体 > 第二顺序全体）
│   ├── src/importers/    微信 txt / WhatsApp 导出解析
│   ├── src/persona.ts    从本人消息中提取口头禅、语气词、表情、平均长度、真实问答例句
│   ├── src/memory.ts     BM25 检索（中文二元分词 + 英文单词）
│   ├── src/safety.ts     危机检测、输出规则、AI 披露、使用时长
│   ├── src/prompt.ts     系统提示词组装，超预算时先丢回忆、再丢例句，永不丢规则
│   ├── src/engine.ts     对话引擎，串起以上所有步骤
│   └── src/deletion.ts   撤回某种模态时需要删除哪些资产
└── app/                  Expo (React Native) 应用
    ├── src/native/llm.ts     llama.rn 对话模型
    ├── src/native/voice.ts   llama.rn TTS + createSpeaker 声音克隆
    ├── src/native/stt.ts     whisper.rn 语音转文字
    ├── src/native/wav.ts     WAV 编解码（带 AIGC 元数据）
    ├── src/state/vault.ts    本地存储、资产登记、删除
    └── src/screens/          家人同意 / 导入资料 / 对话 / 设置
```

## 推荐模型

所有模型都是开源权重，用户在"设置"里填写下载地址（建议使用 Hugging Face 或其国内镜像上的官方仓库）。文件名默认是 `chat.gguf`、`tts-backbone.gguf`、`tts-codec.gguf`、`whisper.bin`，可在 `app/src/native/models.ts` 修改。

| 用途 | 推荐 | 体积 (约) | 说明 |
| --- | --- | --- | --- |
| 对话 | Qwen3 4B Instruct, Q4_K_M GGUF | 2.5 GB | 旗舰机（8GB+ 内存）。中端机换 1.7B（约 1.1 GB）。中文表现好。 |
| 声音克隆 | Chatterbox multilingual 或 Qwen3-TTS 0.6B（backbone + codec GGUF） | 1–2 GB | llama.rn 测试矩阵中两者在 Android CPU / Hexagon 与 Metal 上均通过。中文优先试 Qwen3-TTS。 |
| 语音识别 | whisper small 或 large-v3-turbo (q5) ggml | 0.2–0.6 GB | 中文用 turbo 更准。 |

手机要求：iOS 16+/A16 以上，或 Android 骁龙 8 Gen 2 及以上、8GB 内存。llama.rn 的 Android OpenCL 后端在 `app.json` 中已开启。

## 存储与隐私

- 所有资料在 App 私有目录 `Documents/vault/`，iOS 受 Data Protection 保护，Android 受文件级加密保护。
- 死亡证明只保存 SHA-256 指纹，原文件读取后立即删除。
- 聊天导出文件、声音、照片都登记在 `vault.assets`，撤回同意时 `deletionPlan()` 精确找到并删除。
- 合成音频在 WAV 的 LIST/INFO 块写入 `AIGC` 标识，满足隐式标识要求；对话页常驻"AI 模拟"标签，满足显式标识要求。
- **待办**：用 SQLCipher 存储 vault，密钥放 `expo-secure-store`（Keychain/Keystore），并支持 Face ID 解锁。

## 开发

```sh
cd sinian/core && npm install && npm test        # 核心逻辑测试（无需手机）
cd ../app && npm install
npx expo prebuild                               # llama.rn / whisper.rn 是原生模块，不能用 Expo Go
npx expo run:android   # 或 run:ios
```

## 路线图

| 阶段 | 内容 |
| --- | --- |
| **1（本仓库）** | 同意流程、聊天记录导入、风格学习、回忆检索、本地对话、声音克隆朗读、安全层、删除 |
| 2 | 语音输入（whisper.rn 已接好）；家属各自手机签署（邀请链接 + 设备签名，取代当面签署）；生前"数字遗嘱"录制模式（本人亲自授权与录制，最理想的数据来源） |
| 3 | 会动的头像：先做"预渲染"——用开源说话头像模型在可选的家庭自建服务器上把回复渲染成短视频，渲染后服务器立即删除；等手机端实时模型成熟再迁回本机 |
| 4 | 可选 LoRA 微调：在家庭自己的电脑上用聊天记录微调小模型，提高口吻相似度；产物登记为 `text-adapter` 资产，同样受撤回约束 |

## 刻意不做的事

- 不提供云端托管版本、不做订阅制（避免"不续费就再失去一次"）。
- 不允许导出可冒充本人的音频/视频，不提供"打电话给别人"之类的功能（防诈骗）。
- 不为公众人物或非亲属建模。
- 不对未成年人开放（第二阶段可考虑在监护人陪同下的模式）。
