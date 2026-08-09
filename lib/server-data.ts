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
    "3776927292",
    "Daybreak DamageTracker",
    "自制 Boss 伤害统计模组。0.1.7 已公开，支持直接伤害与持续伤害、每只 Boss 独立结算、本人来源树和历史记录。",
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
  steamWorkshopMod(
    "3744518122",
    "复古葡萄啤酒 (Old Grape Beer)",
    "复刻灾厄 2.1 的葡萄啤酒增益，让弹药获得强追踪，并以暴击伤害、防御和移速为代价，支持 ImproveGame 无限增益。",
  ),
];

export const minecraftMods: ModInfo[] = [
  {
    id: "todo-content",
    name: "待办 01 · 内容方向",
    description: "待定。",
  },
  {
    id: "todo-loader",
    name: "待办 02 · 版本与加载器",
    description: "待定。",
  },
  {
    id: "todo-modpack",
    name: "待办 03 · 模组清单",
    description: "待定。",
  },
  {
    id: "todo-test",
    name: "待办 04 · 联机信息",
    description: "待定。",
  },
];
