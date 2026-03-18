# 前端素材需求表

## 开源网站建议（除了爱给网）
- **图片**：Pixabay (pixabay.com), Unsplash (unsplash.com), OpenGameArt (opengameart.org)
- **音效**：Freesound (freesound.org), OpenGameArt, Zapsplat (zapsplat.com, 有免费)
- **字体**：Google Fonts (fonts.google.com), DaFont (dafont.com)
- **粒子/特效**：Kenney Assets (kenney.nl), OpenGameArt

## 图片素材（从上述网站下载，放置在 assets/images/）

| 名称 | 描述 | 用途 | 建议关键词 | 开源搜索链接 |
|------|------|------|------------|---------------|
| bg_main.jpg | 主界面背景 | 云雾仙侠风格 | 仙侠背景、云雾、山水 | [Pixabay 搜索](https://pixabay.com/images/search/xianxia%20background/) |
| btn_upgrade.png | 升级按钮 | 蓝色渐变按钮 | 游戏按钮、蓝色UI | [OpenGameArt 搜索](https://opengameart.org/art-search?keys=button) |
| btn_answer.png | 答题按钮 | 绿色按钮 | 游戏按钮、绿色UI | 同上 |
| icon_math.png | 术数领域图标 | 数学符号 + 符咒 | 数学图标、符咒 | [Pixabay 数学](https://pixabay.com/images/search/math/) |
| icon_history.png | 修仙史领域图标 | 古书 + 仙人 | 历史图标、仙人 | [Pixabay 历史](https://pixabay.com/images/search/history/) |
| icon_science.png | 炼丹术领域图标 | 丹炉 + 药瓶 | 科学图标、炼丹 | [Pixabay 科学](https://pixabay.com/images/search/science/) |
| icon_literature.png | 仙文领域图标 | 毛笔 + 竹简 | 文学图标、书法 | [Pixabay 书法](https://pixabay.com/images/search/calligraphy/) |
| icon_art.png | 画符领域图标 | 画笔 + 符咒 | 艺术图标、符咒 | [Pixabay 艺术](https://pixabay.com/images/search/art/) |
| icon_sports.png | 武道领域图标 | 剑 + 武士 | 体育图标、武侠 | [Pixabay 武侠](https://pixabay.com/images/search/wuxia/) |
| item_talisman.png | 术数符咒道具 | 符咒图标 | 符咒、道具 | [OpenGameArt 符咒](https://opengameart.org/art-search?keys=talisman) |
| item_pill.png | 炼丹药剂道具 | 丹药图标 | 丹药、药瓶 | [Pixabay 药瓶](https://pixabay.com/images/search/pill/) |
| effect_upgrade.gif | 升级特效 | 粒子效果 | 升级特效、粒子 | [Kenney Assets](https://kenney.nl/assets?q=effects) |
| avatar_default.png | 默认玩家头像 | 仙人头像 | 仙人头像、卡通 | [OpenGameArt 头像](https://opengameart.org/art-search?keys=avatar) |

## 音效素材（放置在 assets/sounds/）

| 名称 | 描述 | 用途 | 建议关键词 | 开源搜索链接 |
|------|------|------|------------|---------------|
| bgm_main.mp3 | 主界面背景音乐 | 轻音乐循环 | 仙侠音乐、古风BGM | [Freesound 古风](https://freesound.org/search/?q=chinese+music) |
| sfx_upgrade.wav | 升级音效 | 短促提升音 | 升级音效、成功音 | [Freesound 升级](https://freesound.org/search/?q=level+up) |
| sfx_correct.wav | 答题正确音效 | 欢快音 | 正确音效、欢呼 | [Freesound 正确](https://freesound.org/search/?q=correct) |
| sfx_wrong.wav | 答题错误音效 | 低沉音 | 错误音效、失败 | [Freesound 错误](https://freesound.org/search/?q=wrong) |
| sfx_click.wav | 点击按钮音效 | 轻点击音 | 按钮音效、点击 | [Freesound 点击](https://freesound.org/search/?q=click) |

## 其他素材

- **字体**：仙侠风格字体（如“方正仙侠体”），从 [Google Fonts](https://fonts.google.com/) 或 [DaFont](https://www.dafont.com/) 下载。
- **粒子效果**：虚无侵袭的黑暗粒子，从 [Kenney Assets](https://kenney.nl/assets?q=particles) 下载。

## 下载提示
- 访问上述链接，搜索关键词下载免费素材。
- 放置在 `assets/images/` 和 `assets/sounds/`，格式PNG/MP3/WAV。
- 如果需要自动下载，编辑 `download_assets.ps1` 脚本，替换示例URL为实际下载链接，然后运行 `.\download_assets.ps1`。