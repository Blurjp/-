# Kinsong · 本地运行的逝者对话 App（iOS 名：Kinsong: Family Voices）

**目标市场：美国、加拿大。** 用亲人留下的短信、聊天记录、声音和照片，在**手机本地**生成一个可以对话的 AI 模拟。
必须先取得家人一致同意，在北美还需要遗产执行人签署；任何一位撤回，所有资料和模型立即删除。
App 界面默认英文，可切换中文。

- 🇺🇸🇨🇦 **北美竞品、法规、进入策略：[docs/NORTH_AMERICA.md](docs/NORTH_AMERICA.md)**
- 🌏 全球背景调研（含中国市场）：[docs/RESEARCH.md](docs/RESEARCH.md)
- 🏗 技术架构、推荐模型、路线图：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 🧪 **发布到 TestFlight：[docs/TESTFLIGHT.md](docs/TESTFLIGHT.md)**（`cd app && npm run testflight`）

## 它会做什么

| | |
| --- | --- |
| **同意** | 本人生前意愿优先，本人拒绝则永远无法开启。否则需要所有配偶/伴侣、子女、父母签字；都不在世时由兄弟姐妹、祖父母、孙子女全部签字。**美国/加拿大**另需遗产执行人或管理人签署，并上传授权文件（只保存文件指纹）。声音和照片需要执行人另签书面生物特征授权（BIPA 式），否则只开文字对话。每人可分别勾选文字/声音/照片/视频，最终取交集。所有签字人须确认年满 18 岁。 |
| **导入** | iMessage（CSV）、安卓 SMS Backup & Restore（XML）、WhatsApp（自动识别美式/欧式日期）、Facebook Messenger / Instagram（JSON）、微信（TXT）。自动学习口头禅、表情、消息长度和真实问答例句；家人可补写具体回忆。 |
| **对话** | 本地大模型（llama.rn）加回忆检索；可用 10–30 秒录音零样本克隆声音朗读回复，生成的音频带 AIGC 标识。 |
| **安全** | 常驻"AI simulation"标签，开头和每 3 小时重新披露（纽约 GBL 第 47 条、加州 SB 243）。被问"真的是你吗"时必须诚实回答。检测到轻生或"想去陪你"的表达立即跳出角色，给出 988 / Crisis Text Line / 911。不谈钱款、遗产、密码、礼品卡、社安号，不给医疗建议。默认每天 30 分钟上限，连续 7 天使用会提醒联系亲友或哀伤辅导。随时可以"告别并删除"。 |

## 快速开始

```sh
cd core && npm install && npm test     # 44 个核心逻辑测试
cd ../app && npm install
npx expo prebuild && npx expo run:ios  # 原生模块，需要开发构建，不能用 Expo Go
```

首次打开后在 Settings 中下载模型（见[推荐模型](docs/ARCHITECTURE.md#推荐模型)），之后完全离线。

## 当前状态

第一阶段原型：核心逻辑有单元测试，App 通过 TypeScript 类型检查，**尚未在真机上运行**。法规部分**不是法律意见**，上线前请律师审阅 [NORTH_AMERICA.md 第七节](docs/NORTH_AMERICA.md#七需要律师回答的问题)的问题。
