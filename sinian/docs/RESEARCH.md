# 逝者模拟服务（Grief Tech / "Deadbot"）调研

> 目标市场已确定为北美。北美竞品、法规和进入策略见 **[NORTH_AMERICA.md](NORTH_AMERICA.md)**；本文是全球背景（含中国市场）。

调研日期：2026-10-10。产品状态变化很快，标注"未证实"的条目请在决策前再核实一次。

## 一、结论先说

1. **市场已经存在，但没有赢家。** 海外以"生前录制 + 问答回放"为主（HereAfter AI、StoryFile），国内以"照片/视频做数字人"为主（超级头脑、硅基智能等），淘宝上低至几元到几千元。没有一家同时做好了"同意、真实性、长期保存、心理安全"。
2. **最大的问题不是技术，是同意和平台寿命。** StoryFile 申请过破产保护；2wai 因为"让孕妇和去世母亲的数字人对话"的广告遭到大规模抨击；研究者指出行业对"平台关了之后数字人怎么办"没有标准。
3. **法规在收紧，方向一致：要同意、要标识、要可删除。** 中国网信办 2026 年 4 月发布《数字虚拟人信息服务管理办法（征求意见稿）》；欧盟 AI Act 第 50 条要求披露深度合成内容；加州 AB 1836 已生效；丹麦的肖像/声音权法案正在推进。
4. **心理学证据很薄。** 目前只有小样本、定性研究，没有对照试验证明这类产品能改善或加重"延长哀伤障碍"。所以产品必须把"不造成伤害"做成硬约束，而不是营销卖点。
5. **技术上，2026 年已经能在手机上全离线完成文字 + 声音克隆。** llama.rn 已内置可做声音克隆的 TTS（Chatterbox 多语言、Qwen3-TTS），在骁龙 8 Elite 上实测通过；会说话的视频头像在手机上实时运行仍不成熟。

**我们的差异化定位：** 全部在手机本地运行（不上传任何遗物）、家属一致同意才能启用、任何一位撤回即全部删除、永远标明"AI 模拟"、内置危机干预和使用时长保护、提供"告别"而不是诱导长期订阅。

## 二、主要产品

### 海外

| 产品 | 形态 | 数据来源 | 关键事实 |
| --- | --- | --- | --- |
| **HereAfter AI** | 语音问答"生命故事" | 本人生前录音访谈 | 回答都是本人真实录音，不生成新内容，最"保守"。有一篇来源称其 2026 年 8 月下线，其他 2026 年报道仍称在运营，**未证实**。 |
| **StoryFile** | 可对话的视频 | 本人生前录制的视频访谈 | 也是检索真实片段。报道称其曾申请 Chapter 11 破产保护，欠债约 450 万美元，说明了"平台寿命"风险。 |
| **You, Only Virtual (Versona)** | 文字/语音的"关系型"数字人 | 聊天记录、语音 | 主打还原"你们之间的关系"，生成新内容。 |
| **Eternos → Uare.ai** | 个人 AI 分身 | 本人生前训练 | 2025 年更名为 Uare.ai。 |
| **Project December** | 文字聊天 | 用户填写的描述和样例 | Jason Rohrer 基于 GPT-3 的艺术项目，"Jessica 模拟"报道后大量用户用它模拟逝者；按积分计时收费，约 5–10 美元。作者称本意并非模拟逝者。 |
| **Seance AI** | 文字"降灵"对话 | 用户描述 | 低门槛，生成式。 |
| **2wai** | 视频数字分身 | 本人或亲属 | 2025 年 11 月广告引发"利用悲伤牟利"的强烈批评；公司回应称只允许用户为**自己**建分身。 |

### 国内

| 产品/渠道 | 形态 | 关键事实 |
| --- | --- | --- |
| **超级头脑（南京，张泽伟）** | 视频通话式数字人 → 全息 | 称已"复活"上千人；分档定价，从数百到数千美元（2024 年报道）。 |
| **硅基智能（南京）** | App/平板上的"数字永生"数字人 | 称几秒视频即可生成基础形象，约 30 美元起（2024 年报道）。 |
| **电商平台个人卖家** | 让老照片"动起来"、合成说话视频 | 标价几元到数千元；2026 年清明有"花 10 元 AI 复活奶奶"的报道；殡葬机构把老照片动态化、"亲情电话亭"放进清明活动。 |

国内主要争议：擅自合成他人（含公众人物）影像、隐私泄露、对家属的二次心理伤害、"招魂还是招财"。专家建议服务前核实申请人与逝者的关系。

## 三、法规与伦理框架

### 中国
- **《数字虚拟人信息服务管理办法（征求意见稿）》**（国家网信办，2026-04-03 发布，意见截止 2026-05-06，本次调研**未查到正式版**）：
  - 未经特定自然人同意，不得提供足以识别其身份的数字虚拟人服务；
  - 使用敏感个人信息建模、生成形象，须取得**单独同意**；撤回同意后应删除个人信息并注销数字虚拟人；
  - 涉及死者个人信息时，近亲属可为自身合法正当利益行使权利，**死者生前另有安排的除外**；
  - 专家解读点名"任意复活逝者"是近年的争议焦点。
- **《民法典》第 994 条**：死者的姓名、肖像、名誉等受侵害的，其配偶、子女、父母有权请求承担责任；没有前述人员的，由其他近亲属请求。我们的同意顺序直接照此设计。
- **《个人信息保护法》第 49 条**：近亲属可对死者个人信息行使查阅、复制、更正、删除等权利，死者生前另有安排的除外。
- **《人工智能生成合成内容标识办法》**（2025-09-01 施行）：合成内容要有显式和隐式标识。我们在界面始终显示"AI 模拟"，并在合成音频文件中写入 AIGC 元数据。

### 海外
- **欧盟 AI Act 第 50(4) 条**：深度合成内容须披露其人工生成属性；但未规定逝者的肖像权，留给成员国法律。
- **丹麦深度伪造法案**：拟保护个人面容和声音至死后 50 年，并要求发布者证明同意，**尚未生效**。
- **加州 AB 1836**（2024 年第 258 章，2025-01-01 生效）：未经事先同意，不得在视听作品或录音中制作/传播已故人士的数字复制品；赔偿 1 万美元或实际损失。
- **剑桥大学 Leverhulme 中心（Hollanek & Nowaczyk-Basińska, 2024）** 的建议：生前就向"数据捐赠者"征求同意；年龄限制；"有意义的透明度"（始终让用户知道在和 AI 说话）；有尊严地"退役"数字人的方式；考虑按医疗器械监管。

## 四、心理学研究现状

- 证据以小样本定性研究为主：Neimeyer 2023 年 10 人研究中多数人觉得有帮助；53 名治疗师与丧亲者的研究中丧亲者普遍不信任、治疗师认为可作补充工具；2026 年 Frontiers 对广东 25 人的访谈结论是"安慰与风险来自同一个能力"。
- 科罗拉多大学的一项研究每次互动约 20 分钟，且回复经人工审核，没有长期随访、没有与哀伤治疗对照。
- 临床担忧：可能干扰健康的"持续联结"，导致延长哀伤障碍——**这是假设，尚无数据**。
- 2026 年 JMIR 的观点：griefbot 更适合作为心理治疗等传统哀伤支持的**辅助**，而不是替代。

**对产品的含义：** 默认每天 30 分钟上限；连续多天使用后提示联系亲友/哀伤辅导；检测到"想去陪你"之类的危机表达立刻跳出角色、给出热线；被问"你是真的吗"必须诚实回答；提供"告别与删除"。

## 五、技术可行性（手机端）

| 能力 | 2026 年可用方案 | 手机端成熟度 |
| --- | --- | --- |
| 对话大模型 | llama.cpp（React Native 封装 `llama.rn`）+ 1.7B–4B 指令模型 GGUF Q4 | ✅ 旗舰机流畅，中端机用 1.7B |
| 语音识别 | whisper.cpp（`whisper.rn`） | ✅ |
| 声音克隆 | `llama.rn` 内置 TTS：Chatterbox 多语言、Qwen3-TTS 0.6B，用 10–30 秒参考音频零样本克隆 | ✅ 官方在 Galaxy S25 Ultra（Hexagon/CPU）上测试通过；标注"实验性" |
| 备选 TTS | sherpa-onnx（Kokoro 等），Android 上旗舰约 20–40 秒生成 1 分钟音频 | ⚠️ 中端机慢 |
| 会说话的头像 | LivePortrait / EchoMimic / Hallo 等 | ❌ 手机实时尚不成熟；第二阶段做"预渲染短片"或可选自建服务器 |
| 记忆检索 | BM25（中文二元分词），后续可加向量 | ✅ 无需模型 |

## 来源

- [Rolling Stone — AI Chatbots Let People Keep Dead Loved Ones Alive](https://www.rollingstone.com/culture/culture-features/ai-chatbot-grief-death-1235585030/)
- [Medscape — AI 'Griefbots' Resurrect Dead Loved Ones](https://www.medscape.com/viewarticle/ai-griefbots-resurrect-dead-loved-ones-healthy-or-harmful-2025a1000y3t)
- [AI Weekly — Grief-AI market projected at $80B by 2034](https://aiweekly.co/alerts/grief-ai-market-projected-at-80b-by-2034-clinicians-wary)
- [Hospice News — AI Grief Bots Present 'New Complexities' (2026-04)](https://hospicenews.com/2026/04/09/ai-grief-bots-present-new-complexities-in-bereavement-care/)
- [ScienceDirect — Never say goodbye: assumptions of 'normal' grief](https://www.sciencedirect.com/science/article/pii/S2666659626000028)
- [The Nod Mag — The rise of GriefTech](https://thenodmag.com/content/grief-tech-artificial-intelligence-chatbots)
- [afterlife.ai — Griefbot](https://www.afterlife.ai/griefbot/) · [Deadbot](https://www.afterlife.ai/deadbot/)
- [Newsweek — How AI Is Bringing Dead Loved Ones Back](https://www.newsweek.com/how-ai-is-bringing-dead-loved-ones-back-and-changing-the-way-we-grieve-11823240)
- [CBS News — AI simulations of loved ones](https://www.cbsnews.com/news/ai-grief-bots-legacy-technology/)
- [MIT Technology Review — Deepfakes of your dead loved ones are a booming Chinese business](https://www.technologyreview.com/2024/05/07/1092116/deepfakes-dead-chinese-business-grief/)
- [NPR — Chinese companies offer to 'resurrect' deceased loved ones](https://www.npr.org/2024/07/18/nx-s1-5040583/china-ai-artificial-intelligence-dead-avatars)
- [Newsweek — China Using AI to Bring People Back From Dead](https://www.newsweek.com/china-using-ai-bring-back-dead-1928853)
- [CGTN — China's AI afterlife (2026-04)](https://news.cgtn.com/news/2026-04-24/China-s-AI-afterlife-Comfort-consent-and-controversy-1MBnv4PXSta/p.html)
- [Outlook Business — AI Is Bringing the Dead Back to Life](https://www.outlookbusiness.com/deeptech/ai-is-bringing-the-dead-back-to-life-and-china-cant-ignore-it-anymore)
- [Xinhua — Digital "resurrection" services stir debate](https://english.news.cn/20240405/b0e6dbd96c684a529a371129db0c1333/c.html) · [Chinese mourners turn to AI avatars](https://english.news.cn/20250406/653542deae774bc4a110f5592e50e7f1/c.html)
- [SCMP — Chinese AI firms help grieving families](https://www.scmp.com/video/china/3245770/chinese-ai-firms-help-grieving-families-digitally-resurrect-their-dead-loved-ones)
- [国家网信办 — 数字虚拟人信息服务管理办法（征求意见稿）](https://www.cac.gov.cn/2026-04/03/c_1776953007303913.htm) · [科技日报报道](https://www.stdaily.com/web/gdxw/2026-04/04/content_497895.html) · [安全内参 全文](https://www.secrss.com/articles/89091) · [澎湃 专家解读](https://www.thepaper.cn/newsDetail_forward_32893155) · [新华网](https://www.news.cn/tech/20260410/1dc300ce08d641ca8234a40c8958f4f9/c.html)
- [界面新闻 — AI 复活相关报道](https://www.jiemian.com/article/14191235.html) · [界面新闻](https://www.jiemian.com/article/10860019.html) · [华尔街见闻](https://wallstreetcn.com/articles/3710825) · [澎湃](https://www.thepaper.cn/newsDetail_forward_26626590)
- [2wai backlash — UNILAD](https://www.unilad.com/news/us-news/2wai-app-speak-to-dead-loved-one-calum-worthy-297238-20251115) · [2wai responds](https://www.unilad.com/technology/news/2wai-avatar-app-backlash-response-401002-20251117) · [The Modems](https://themodems.com/tech/2wai-controversial-ai-avatar-app-talk-deceased-relatives/)
- [Greenberg Traurig — EU AI Act transparency obligations (2026-06)](https://www.gtlaw.com/en/insights/2026/6/deepfakes-chatbots-ai-generated-text-european-commission-details-transparency-obligations-under-the-ai-act) · [Bird & Bird — draft deep fake guidelines](https://www.twobirds.com/en/insights/2026/uk/when-marketing-meets-genai-update--the-eu-ai-acts-draft-deep-fake-guidelines-and-what-they-mean-for) · [IPKat — postmortem personality rights](https://ipkitten.blogspot.com/2023/09/guest-post-deepfake-it-till-you-make-it.html)
- [PPC Land — Denmark deepfake bill](https://ppc.land/denmarks-deepfake-bill-makes-publishers-prove-consent-from-january-2027) · [AI Policy Desk — Denmark bill (2026-10-08)](https://aipolicydesk.com/blog/denmark-deepfake-bill-faces-voices-consent-2026)
- [California Senate analysis citing AB 1836 (Ch. 258, 2024)](https://spsf.senate.ca.gov/media/1923) · [Davis+Gilbert — California unauthorized AI replicas](https://www.dglaw.com/california-passes-new-legislation-prohibiting-unauthorized-ai-replicas/)
- [ScienceDaily — Cambridge: safeguards against unwanted 'hauntings'](https://www.sciencedaily.com/releases/2024/05/240508201408.htm) · [OECD.AI incident note](https://oecd.ai/en/incidents/2024-05-09-0bb8) · [arXiv — Post-Mortem Data Protection in GenAI Chatbots](https://arxiv.org/pdf/2509.07375)
- [JMIR 2026 — griefbots](https://www.jmir.org/2026/1/e111086) · [Frontiers in Digital Health 2026](https://www.frontiersin.org/journals/digital-health/articles/10.3389/fdgth.2026.1852514/full) · [Westword — CU study](https://www.westword.com/news/artificial-resurrection-cu-study-used-ai-to-chat-with-dead-loved-ones-to-surprising-results-40908719/) · [3 Quarks Daily](https://3quarksdaily.com/?p=251943)
- [SF Chronicle — The Jessica Simulation](https://www.sfchronicle.com/projects/2021/jessica-simulation-artificial-intelligence/) · [Decrypt — Rohrer on 'Eternal You'](https://decrypt.co/214163/ai-developer-refutes-eternal-you-documentary-calls-depiction-of-his-chatbot-misleading) · [IFLScience — Project December](https://www.iflscience.com/project-december-the-ai-chatbot-people-are-using-to-talk-to-the-dead-60493)
- [llama.rn README（TTS / 声音克隆 / 测试矩阵）](https://github.com/mybigday/llama.rn) · [VoxSherpa TTS（sherpa-onnx Android 性能）](https://github.com/CodeBySonu95/VoxSherpa-TTS)
