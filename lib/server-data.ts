export type ModInfo = {
  id: string;
  name: string;
  description: string;
  image?: string;
  workshopUrl?: string;
};

const steamWorkshopMod = (
  id: string,
  name: string,
  description: string,
): ModInfo => ({
  id,
  name,
  description,
  image: `/mod-terraria-${id}.jpg`,
  workshopUrl: `https://steamcommunity.com/sharedfiles/filedetails/?id=${id}`,
});

export const terrariaMods: ModInfo[] = [
  steamWorkshopMod(
    "2599842771",
    "AlchemistNPC Lite",
    "加入出售药水、材料和常用物品的功能型 NPC，减少多人推进中的重复采集。",
  ),
  steamWorkshopMod(
    "2707400823",
    "Auto Reforge",
    "重做哥布林工匠的重铸界面，可以设定目标词缀并自动连续重铸。",
  ),
  steamWorkshopMod(
    "3686878542",
    "Beam Stops Spread",
    "通过可放置的信标限制腐化、猩红与神圣扩散，方便保护建筑区域。",
  ),
  steamWorkshopMod(
    "2669644269",
    "Boss Checklist",
    "按进度整理 Boss、事件和击败记录，并集中展示召唤方式与掉落信息。",
  ),
  steamWorkshopMod(
    "2816694149",
    "Boss Cursor",
    "Boss 离开屏幕时显示方向指示，减少战斗中丢失目标的情况。",
  ),
  steamWorkshopMod(
    "3423180893",
    "Damage Rank",
    "Boss 战结束后展示伤害排行榜，方便多人查看各自的输出表现。",
  ),
  steamWorkshopMod(
    "2825151264",
    "灾厄 Mod 汉化补丁",
    "为 Calamity Mod 提供简体中文翻译，覆盖主要内容、物品与界面文本。",
  ),
  steamWorkshopMod(
    "3241967932",
    "Calamity: Hunt of the Old God",
    "围绕古神主题加入新的终局首领战、装备与视听内容，扩展灾厄后期体验。",
  ),
  steamWorkshopMod(
    "2824688072",
    "Calamity Mod",
    "大型内容模组，加入新首领、生态群落、难度、职业、物品与扩展终局。",
  ),
  steamWorkshopMod(
    "2824688266",
    "Calamity Mod Music",
    "提供灾厄完整原声与音乐盒，为主要首领、区域和事件配套音乐。",
  ),
  steamWorkshopMod(
    "2563851005",
    "Which Mod Is This From? (WMITF)",
    "在物品、NPC 与方块提示中标注来源模组，方便识别整合包内容与排查配方来源。",
  ),
  steamWorkshopMod(
    "2800050107",
    "Chinese Localization",
    "修复 tModLoader 语言包不生效的问题，让启用的中文资源包正常加载。",
  ),
  steamWorkshopMod(
    "2836588773",
    "Colored Calamity Relics",
    "为灾厄首领遗物加入对应主题配色，让大师模式战利品更容易辨认。",
  ),
  steamWorkshopMod(
    "3244873353",
    "虹彩大师：Colored Relics",
    "为更多内容模组补充彩色首领遗物，统一收藏与展示效果。",
  ),
  steamWorkshopMod(
    "2864843929",
    "Consolaria",
    "将主机版与移动版的独占敌人、物品和首领内容带到 tModLoader。",
  ),
  steamWorkshopMod(
    "3162500097",
    "Consolaria 中文",
    "为 Consolaria 的主机版与移动版独占内容提供简体中文翻译。",
  ),
  steamWorkshopMod(
    "3478363753",
    "Daybreak",
    "为其他内容模组提供通用能力的前置类库，本身不会单独改变游戏玩法。",
  ),
  steamWorkshopMod(
    "2797518634",
    "Quality of Terraria",
    "提供建筑、物资、界面与多人联机相关的综合体验优化，并支持按需配置。",
  ),
  steamWorkshopMod(
    "3222493606",
    "Luminance",
    "为大型内容模组提供特效、界面和通用系统支持的前置类库。",
  ),
  steamWorkshopMod(
    "2563309347",
    "Magic Storage",
    "把分散箱子整合成可搜索、可扩展的中央存储与合成网络。",
  ),
  steamWorkshopMod(
    "3025497808",
    "Magic Storage Pinyin",
    "为 Magic Storage 增加拼音搜索，查找中文物品时不必切换输入法。",
  ),
  steamWorkshopMod(
    "2995193002",
    "Calamity: Wrath of the Gods",
    "加入 Noxus 与无名神祇等终局首领，以及高规格的战斗和视觉演出。",
  ),
  steamWorkshopMod(
    "2619954303",
    "Recipe Browser",
    "在游戏内搜索物品配方、材料用途和制作站，减少来回查阅资料。",
  ),
  steamWorkshopMod(
    "2908170107",
    "absoluteAquarian Utilities",
    "为多项功能模组提供文本输入、界面布局、提示修改等公共能力。",
  ),
  steamWorkshopMod(
    "3403460014",
    "SilkyUI",
    "提供可复用的界面组件、布局和滚动能力，作为其他模组的 UI 前置。",
  ),
  steamWorkshopMod(
    "2785100219",
    "Subworld Library",
    "为需要独立子世界的模组提供加载、切换和数据管理等通用能力。",
  ),
  steamWorkshopMod(
    "2687866031",
    "Census - Town NPC Checklist",
    "在住宅面板列出尚未入住的城镇 NPC、生成条件与完成状态，方便检查招募进度。",
  ),
  steamWorkshopMod(
    "2597324266",
    "Wing Slot Extra",
    "增加独立翅膀栏位，避免飞行装备长期占用普通饰品槽。",
  ),
];

export const minecraftMods: ModInfo[] = [
  {
    id: "create",
    name: "Create",
    description: "用齿轮、传动与动力网络搭建自动化产线和交通系统。",
  },
  {
    id: "farmers-delight",
    name: "Farmer's Delight",
    description: "扩展种植、烹饪与餐食系统，让农场和厨房成为聚落的一部分。",
  },
  {
    id: "twilight-forest",
    name: "The Twilight Forest",
    description: "加入独立探索维度、首领路线、迷宫与大量独特战利品。",
  },
  {
    id: "alexs-mobs",
    name: "Alex's Mobs",
    description: "为主世界与其他维度补充具有独特行为的新生物。",
  },
  {
    id: "waystones",
    name: "Waystones",
    description: "通过可发现和建造的传送石连接聚落、据点与探索区域。",
  },
  {
    id: "sophisticated-backpacks",
    name: "Sophisticated Backpacks",
    description: "提供可升级、可过滤并带有功能模块的随身储物系统。",
  },
  {
    id: "sophisticated-storage",
    name: "Sophisticated Storage",
    description: "扩展箱子和木桶容量，并加入过滤、压缩等仓储升级。",
  },
  {
    id: "supplementaries",
    name: "Supplementaries",
    description: "补充适合建筑、装饰和互动的原版风格方块与小功能。",
  },
  {
    id: "quark",
    name: "Quark",
    description: "以贴近原版的方式扩展建造、探索和日常操作体验。",
  },
  {
    id: "artifacts",
    name: "Artifacts",
    description: "在探索与战利品中加入具有独特能力的饰品和装备。",
  },
  {
    id: "yungs-better-dungeons",
    name: "YUNG's Better Dungeons",
    description: "重做地下城结构，让探索路线、规模和战斗更有层次。",
  },
  {
    id: "jade",
    name: "Jade",
    description: "查看准星指向方块和实体的信息，方便理解机器与存储状态。",
  },
];

export const resourceHistory = {
  cpu: [
    22, 18, 16, 25, 31, 28, 24, 20, 18, 29, 37, 41, 34, 30, 26, 33, 46, 39,
    31, 27, 24, 21, 19, 18,
  ],
  memory: [
    23, 23, 24, 24, 25, 25, 26, 26, 26, 27, 27, 28, 28, 28, 29, 30, 29, 29,
    28, 28, 27, 27, 27, 27,
  ],
};

export const gameRuntimeSnapshots = [
  {
    id: "terraria",
    eyebrow: "SERVICE / TERRARIA",
    title: "探索战斗服",
    players: 2,
    address: "tr.7788oio.icu:18035",
    version: "tML v2026.05.3.0",
    world: "Calamity-main",
    maxPlayers: 5,
    cpu: 11,
    memory: 15,
    processMemory: "2.4 GB",
    demoLatency: 42,
  },
  {
    id: "minecraft",
    eyebrow: "SERVICE / MINECRAFT",
    title: "Java 整合服",
    players: 1,
    address: "mc.7788oio.icu",
    version: "Forge 1.20.1",
    world: "7788-home",
    maxPlayers: 5,
    cpu: 7,
    memory: 9,
    processMemory: "1.4 GB",
    demoLatency: 58,
  },
] as const;
