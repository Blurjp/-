# 北美市场调研：竞品、法规、产品与进入策略

调研日期：2026-10-10。本文**不是法律意见**，上线前每一条法规都要请美国/加拿大律师确认。标注"未证实"的内容来自单一或有利益关系的来源。

## 一、结论

1. **北美市场有空档。** 最早的玩家 HereAfter AI 据报道已在 2026 年 7 月贴出停服公告（消息来自竞品 afterlife.ai，**未证实**），StoryFile 走过破产保护，2wai 因广告翻车。现在没有一家主打"隐私优先、全本地、经过家属和遗产执行人核实同意"的产品。
2. **在美国，同意的关键人物是遗产执行人，不只是家人。** 加州、纽约、田纳西等州规定逝者声音和肖像的权利归遗产或继承人。纽约 2025-12-11 起，用已故表演者的数字复制品必须取得继承人同意。所以 App 的规则改成：家属一致同意 **+ 遗产执行人/管理人签署**（本人生前授权时可免）。
3. **声音和人脸是"生物特征"，风险最大。** 伊利诺伊 BIPA 要求采集声纹/人脸几何特征前取得**书面授权**，并允许个人起诉；2026 年已有针对声纹的集体诉讼。App 规定：遗产执行人签署书面生物特征授权之前，只能开文字对话。
4. **App 很可能属于"AI 陪伴聊天机器人"，受纽约和加州新法管辖。** 两地都要求：开头和每 3 小时提示"你在和 AI 说话"，检测到自杀/自伤意图时转介危机热线；加州还允许个人起诉，并有年度报告义务。这些已经写进代码。
5. **定位是"纪念/珍藏"，不是"治疗"。** 宣称能治疗哀伤就可能被当作医疗器械，也会招来 FTC 对虚假宣传的关注。营销里不说"让妈妈复活"。
6. **最强的增长点是"生前录制"。** 由本人在世时亲自授权和录制，法律上最干净（不需要遗产执行人），也正好接住 HereAfter 留下的用户。

## 二、北美竞品

| 产品 | 模式 | 现状 / 要点 |
| --- | --- | --- |
| **HereAfter AI** | 本人生前录音访谈，家人用语音问答回放 | 最后公开价格为每月 $3.99 / $5.99 / $7.99 三档。据报道 2026-07 停服公告、9 月底官网 404（来源为竞品，**未证实**）。 |
| **StoryFile** | 生前录制的可对话视频 | 2022 年创始人母亲在自己葬礼上"回答"宾客提问，成为标志性案例；曾申请 Chapter 11。 |
| **You, Only Virtual (YOV)** | 逝后用聊天记录生成"Versona" | 文字版免费，语音通话等功能付费；2022 年 StartEngine 众筹时尚无收入、候补名单 1 万人以上。 |
| **Eternos → Uare.ai** | 个人 AI 分身 | 2025 年更名。 |
| **Project December** | GPT 文字模拟 | 按积分计时，约 $5–10；作者称本意不是模拟逝者。 |
| **Seance AI** | 文字"降灵" | 低门槛生成式。 |
| **2wai** | 视频数字分身 | 2025-11 广告引发强烈批评，之后改口为只允许为自己建分身。 |
| 相邻：**Empathy** | 丧亲后的遗产与事务管理 | 融资 7200 万美元 C 轮（约 2025 年初）。可能成为渠道合作方。 |
| 相邻：**Pathpal** | 职场哀伤支持 | 2026-07 完成成长轮融资，扩展北美。 |

**空档：** 现有产品几乎都是云端订阅。我们的差异点：全部在手机本地运行；家属和遗产执行人都核实过同意；任何一人撤回就删除；一次性付费，不会出现"停止续费就再失去一次"。

## 三、法规（美国）

### 1. 逝者的声音与肖像权

| 法规 | 内容 | 对我们的影响 |
| --- | --- | --- |
| **加州民法 §3344.1 + AB 1836**（2025-01-01 生效） | 未经事先同意，不得在视听作品或录音中制作/传播已故人士声音或肖像的数字复制品；赔偿 $10,000 或实际损失 | 主要针对"已故名人"和商业作品，家庭私用可能不在范围内，但遗产同意的设计能降低风险 |
| **纽约民权法 §50-f**（2025-12-11 修订，S.8391/A.8882） | 在表达性视听作品中使用已故表演者的数字复制品，须取得继承人事先同意；赔偿 $2,000 或实际损失，外加利润和惩罚性赔偿 | 同上，再次说明"继承人同意"是行业方向 |
| **田纳西 ELVIS Act**（2024） | 把"声音"明确纳入个人肖像权保护，并覆盖 AI 声音克隆 | 声音克隆必须有授权 |
| **NO FAKES Act（联邦，2026 版）**：S.4591 / H.R.8915 | 2026-05-20 提出，参议院司法委员会 2026-06-18 一致通过；**尚未成为法律**。将设立联邦级的声音和肖像权，死后由遗产继承 | 一旦通过，"遗产执行人同意"就是全国性要求，我们已经提前满足 |

### 2. 生物特征隐私

- **伊利诺伊 BIPA**：采集声纹、面部几何特征前，须告知用途和保存期限，并取得本人或其**法定授权代表**的书面授权；可以个人起诉。2026 年配音演员对多家科技公司提起声纹集体诉讼。BIPA 如何适用于**逝者**没有判例。
- 德州 CUBI、华盛顿州也有生物特征法规（由州检察长执法）。
- **我们的做法：** 遗产执行人签署书面生物特征授权（写明用途、只在本机、撤回即销毁）之前，声音和照片功能不开启。模型只存在手机上、公司从不接触，这可能降低"私人实体采集/持有"的风险，但**需要律师确认**。

### 3. AI 陪伴聊天机器人法

| | 纽约 GBL 第 47 条（2025-11-05 生效） | 加州 SB 243（2026-01-01 生效） |
| --- | --- | --- |
| AI 披露 | 对话开始时，以及持续使用期间每 3 小时 | 可能让人误以为是真人时必须披露；对未成年人每 3 小时提醒并建议休息 |
| 危机处理 | 检测自杀/自伤表达，转介危机服务 | 必须有防止讨论自杀/自伤的协议，并转介危机服务；协议需公开 |
| 执法 | 州检察长，罚款用于自杀预防 | **个人可起诉**；另有年度报告义务（细节请核对法条） |
| **代码中的对应** | `disclosureEveryMinutes: 180` + 首轮披露；`detectCrisis()` 先于一切 | 同左；`SafetyStats.crisisReferrals` 只计次数，可用于年度报告；只对 18 岁以上开放 |

### 4. 其他

- **FTC**：2025 年向 Alphabet、Character.AI、Meta、OpenAI、Snap、xAI 等七家公司发出 6(b) 调查令，关注陪伴型聊天机器人对未成年人的影响。FTC 法第 5 条禁止欺骗性宣传，营销不得暗示"真的是 TA"。
- **医疗器械边界**：如果宣称能"治疗哀伤/延长哀伤障碍"，可能落入 FDA 监管。定位为纪念品，不做治疗宣称。
- **逝者的数字账户（RUFADAA，多数州采用）**：只有受托人才能访问逝者的线上账户。App 只导入**用户自己手机或账号**里的聊天记录（用户这一方的副本），不引导任何人登录逝者的账号。
- **未成年人**：COPPA，以及纽约和加州对未成年人的额外要求。App 只对 18 岁以上开放，签署时需确认年龄。应用商店选最高的成人年龄分级。
- **州隐私法（CCPA/CPRA 等）**：数据不上传、不出售，暴露面很小，但仍需隐私政策。

## 四、法规（加拿大）

- **联邦 AI 法缺位**：AIDA（C-27）在 2025-01 因国会休会失效。C-277（在线深度伪造监管，2026-05 提出的议员法案）**未通过**。
- **C-16**：把性深度伪造纳入非自愿私密影像罪；据二手来源 2026-06-18 获御准（请以司法部官方文件为准）。与本产品无直接关系，但说明执法在收紧。
- **肖像权**：在省一级。BC、曼尼托巴、萨省、纽芬兰的隐私法规定了冒用姓名/肖像的侵权责任；魁北克民法典保护肖像与隐私。死后能否继承各省不同，所以加拿大同样采用"家属一致 + 遗产执行人"的规则。
- **魁北克 Law 25**：生物特征数据库有额外的申报义务，上线魁北克前需确认。
- **危机热线**：加拿大 988 自杀危机热线 2023-11-30 上线，**可打电话也可发短信**，24/7。

## 五、这次已经改了的地方

| 改动 | 位置 |
| --- | --- |
| 管辖区规则：US/CA 要求遗产执行人签署（附遗嘱执行或遗产管理授权书指纹），本人生前授权时免除 | `core/src/consent.ts` |
| 无生物特征书面授权 → 自动降级为纯文字对话 | 同上 |
| 新增"同居伴侣"为第一顺序 | 同上 |
| 危机热线：美国 988（电话/短信）+ Crisis Text Line（发 HOME 到 741741）+ 911；加拿大 988 + 911；扩充英语危机表达 | `core/src/safety.ts` |
| 每 3 小时强制重新披露 AI 身份（纽约/加州） | `core/src/engine.ts` |
| 危机转介计数（只计次数，供加州 SB 243 年度报告） | 同上 + 设置页 |
| 英文人设提示词；英文口头禅提取（过滤功能词） | `core/src/prompt.ts`, `persona.ts` |
| 拦截"买礼品卡/Venmo/Zelle/社安号/账号"等诈骗话术 | `core/src/safety.ts` |
| 导入：iMessage CSV、安卓 SMS Backup & Restore XML、Facebook Messenger/Instagram JSON（修复乱码）、WhatsApp 自动识别美式日期 | `core/src/importers/` |
| App 默认英文（可切换中文），App 名 **Kinsong**（待商标检索） | `app/src/i18n.ts`, `app.json` |

## 六、进入策略（建议，待验证）

**定位：** "A private keepsake of their voice and words — built only with your family's consent, and it never leaves your phone."（为 TA 的声音和话语留一份私人珍藏，只在全家同意后创建，永远不离开你的手机。）

**两种模式：**
1. **Legacy（生前录制）**：本人在世时录制和授权。法律最干净、伦理争议最小，正好接住 HereAfter 的用户。适合在临终关怀、遗嘱规划阶段推荐。
2. **Remembrance（逝后创建）**：家属一致同意 + 遗产执行人签署。

**渠道：**
- 临终关怀机构的丧亲支持项目（Hospice News 2026 年报道显示他们正在研究这类工具，需要可信的工具）。
- 遗产规划律师和遗嘱执行人：遗产执行人签署流程本来就是他们的工作范围。
- 殡仪馆：StoryFile 已有先例。
- 遗产管理平台（如 Empathy）合作。

**定价假设：** 一次性买断（比如 $49–99）加可选的"生前录制套件"。不做订阅，因为订阅和"停费就失去 TA"的批评直接冲突。价格需要做用户访谈验证。

**营销红线：**
- 不用"复活""再和妈妈说话"这类说法，不用孕妇和逝者对话之类的煽情广告（2wai 的教训）。
- 不针对刚丧亲的人投放定向广告。
- 不做治疗宣称。

## 七、需要律师回答的问题

1. 家庭私用、非商业的逝者声音克隆，是否落入加州 §3344.1、纽约 §50-f 的范围？
2. 逝者的声纹/人脸是否属于 BIPA 下的"生物特征标识"？遗产执行人能否作为"法定授权代表"签署？
3. 模型只在用户手机上生成和运行、公司从不持有，是否改变 BIPA/CUBI 下"采集"主体的认定？
4. 本产品是否属于纽约 GBL 第 47 条、加州 SB 243 定义的"AI 陪伴"？年度报告具体报什么？
5. 加拿大各省（尤其魁北克）的死后肖像权与 Law 25 生物特征申报义务。

## 来源

- [afterlife.ai — HereAfter AI pricing](https://www.afterlife.ai/hereafter-ai-pricing) · [HereAfter AI shutting down（竞品来源，未证实）](https://www.afterlife.ai/hereafter-ai-shutting-down) · [Tekpon — HereAfter](https://tekpon.com/software/hereafter/reviews/)
- [You, Only Virtual](https://www.myyov.com/) · [YOV StartEngine](https://www.startengine.com/offering/yov) · [Newsweek 2026](https://www.newsweek.com/how-ai-is-bringing-dead-loved-ones-back-and-changing-the-way-we-grieve-11823240) · [ABC News](https://abcnews.com/Business/ai-advances-fuel-industry-preserve-loved-after-death/story?id=101297956)
- [Voicebot — StoryFile at funeral](https://voicebot.ai/2022/08/16/storyfile-ceo-brings-ai-version-of-his-mother-to-converse-with-guests-at-her-own-funeral/) · [PetaPixel](https://petapixel.com/2022/08/16/ai-tech-let-deceased-woman-talk-to-mourners-at-her-funeral/)
- [Empathy $72M Series C](https://www.calcalistech.com/ctechnews/article/42w333g67) · [Pathpal growth capital](https://www.benefitsandpensionsmonitor.com/benefits/wellbeing/grief-support-startup-lands-growth-capital-to-expand-across-north-america/393839)
- [2wai backlash — UNILAD](https://www.unilad.com/news/us-news/2wai-app-speak-to-dead-loved-one-calum-worthy-297238-20251115) · [2wai responds](https://www.unilad.com/technology/news/2wai-avatar-app-backlash-response-401002-20251117)
- [CA Senate analysis citing AB 1836](https://spsf.senate.ca.gov/media/1923) · [Davis+Gilbert — CA AI replicas](https://www.dglaw.com/california-passes-new-legislation-prohibiting-unauthorized-ai-replicas/)
- [Skadden — two new NY laws](https://skadden.com/insights/publications/2026/01/two-newly-enacted-new-york-laws-will-regulate) · [Mitchell Silberberg & Knupp](https://www.msk.com/newsroom-alerts-3114) · [Katten](https://katten.com/Files/2026_01_28_Kattwalk_Kattison_Avenue_Winter_2026_Issue_5/files/basic-html/page8.html) · [LaborPress](https://www.laborpress.org/gov-hochul-signs-union-backed-a-i-bills-at-sag-aftra-ny-office/)
- [Congress.gov — S.4591 NO FAKES Act of 2026](https://www.congress.gov/bill/119th-congress/senate-bill/4591) · [GovTrack](https://www.govtrack.us/congress/bills/119/s4591) · [Holland & Knight](https://www.hklaw.com/en/insights/publications/2026/06/senate-judiciary-committee-advances-legislation-to-protect-name) · [Manatt](https://www.manatt.com/insights/newsletters/client-alert/congress-reintroduces-the-no-fakes-act-what-s-new-in-the-2026-bill) · [Byte Back](https://www.bytebacklaw.com/2026/08/a-federal-shift-in-ai-and-the-right-of-publicity-no-fakes-act-advances-in-congress/)
- [Enzuzo — BIPA 2026 guide](https://www.enzuzo.com/blog/illinois-biometric-act-bipa) · [Sigma Law — voiceprint class actions](https://sigmalawgroup.com/blog/2026-08-22-bipa-voiceprint-ai/) · [Lewis Rice — AI transcription BIPA claims](https://www.lewisrice.com/publications/ai-transcription-tools-give-rise-to-bipa-claims)
- [NY Governor — AI companion safeguards in effect](https://www.governor.ny.gov/news/governor-hochul-pens-letter-ai-companion-companies-notifying-them-safeguard-requirements-are) · [MoFo — NY and CA AI companion laws](https://www.mofo.com/resources/insights/251120-new-york-and-california-enact-landmark-ai)
- [FPF — California SB 243](https://fpf.org/blog/understanding-the-new-wave-of-chatbot-legislation-california-sb-243-and-beyond/) · [Sen. Padilla — SB 243 signed](https://sd18.senate.ca.gov/news/first-nation-ai-chatbot-safeguards-signed-law) · [California Lawyers Association](https://calawyers.org/privacy-law/regulatory-focus-on-ai-companion-character-chatbots/)
- [Davis+Gilbert — FTC probes AI companions](https://www.dglaw.com/ftc-probes-ai-companion-chatbots-for-risks-to-minors/) · [Tech Policy Press — FTC 6(b)](https://www.techpolicy.press/ftc-opens-inquiry-into-ai-chatbots-and-their-impact-on-children/)
- [Shufti Pro — Canada deepfake laws 2026](https://shuftipro.com/blog/deepfake-laws-in-canada-what-businesses-need-to-know-in-2026/) · [Bill C-16](https://letsdatascience.com/news/canada-enacts-bill-c-16-criminalizing-sexual-deepfakes-893513ce) · [C-277 — openparliament](https://openparliament.ca/bills/45-1/C-277/) · [CTV — Alberta](https://www.ctvnews.ca/edmonton/article/alberta-to-change-legislation-allowing-lawsuits-over-sharing-deepfake-intimate-images/)
- [MHCC — 988 launches in Canada](https://mentalhealthcommission.ca/catalyst/988-launches-in-canada/) · [Global News — 988 first year](https://globalnews.ca/news/10891001/988-suicide-crisis-helpline-canada-calls-texts-in-first-year)
- [Hospice News — AI grief bots (2026-04)](https://hospicenews.com/2026/04/09/ai-grief-bots-present-new-complexities-in-bereavement-care/)
