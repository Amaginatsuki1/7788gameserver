"use client";

import { useState, type ReactNode } from "react";

const SOURCE_REVISION = "b258635e4f6b2146deec98b2fc7df4f70d0e3577";
const SOURCE_ROOT =
  `https://github.com/Amaginatsuki1/Daybreak-DamageTracker/blob/${SOURCE_REVISION}/`;

type AreaId =
  | "input"
  | "dot"
  | "catalog"
  | "state"
  | "ledger"
  | "boundary"
  | "delivery";

type CodeReference = {
  label: string;
  file: string;
  symbol: string;
  lines: string;
  lineStart: number;
  href: string;
  code: string;
};

type ApiReference = {
  source: string;
  label: string;
  note: string;
  href: string;
};

type ArchitectureArea = {
  id: AreaId;
  index: string;
  eyebrow: string;
  title: string;
  summary: string;
  execution: Array<{ label: string; detail: string }>;
  responsibilities: string[];
  invariants: string[];
  edgeCases: string[];
  references: ApiReference[];
  code: CodeReference[];
};

type ArchitectureNode = {
  id: string;
  area: AreaId;
  index: string;
  title: string;
  note: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ConnectionKind = "event" | "control" | "identity" | "private";

type ArchitectureConnection = {
  id: string;
  from: string;
  to: string;
  d: string;
  kind: ConnectionKind;
};

const officialDocs = {
  modSystem: "https://docs.tmodloader.net/docs/stable/class_mod_system.html",
  globalNpc: "https://docs.tmodloader.net/docs/stable/class_global_n_p_c.html",
  modPlayer: "https://docs.tmodloader.net/docs/stable/class_mod_player.html",
  npc: "https://docs.tmodloader.net/docs/stable/class_n_p_c.html",
  modBuff: "https://docs.tmodloader.net/docs/stable/class_mod_buff.html",
  modPacket: "https://docs.tmodloader.net/docs/stable/class_mod_packet.html",
  mod: "https://docs.tmodloader.net/docs/stable/class_mod.html",
  netcode: "https://github.com/tModLoader/tModLoader/wiki/Intermediate-netcode",
  bossChecklist: "https://github.com/JavidPack/BossChecklist",
  exampleMod: "https://github.com/tModLoader/tModLoader/tree/1.4.4/ExampleMod",
};

const areas: ArchitectureArea[] = [
  {
    id: "input",
    index: "01",
    eyebrow: "CAPTURE / ATTRIBUTION PLANE",
    title: "采集与归因层",
    summary:
      "直接伤害采用双平面采集：服务端在 StrikeNPC detour 中记录实际扣血，客户端通过公开命中钩子构造武器、弹幕、Buff 与坐骑来源树。公共总量与私有维度只在接收者结果投影阶段对账。持续伤害由下一层独立处理。",
    execution: [
      {
        label: "网络命中关联",
        detail: "NetworkHitCache 将服务端收到的命中上下文与 playerIndex 建立短生命周期关联。",
      },
      {
        label: "目标快照",
        detail: "在调用原始 StrikeNPC 前保存 NpcType、RootNpcType 与敌对资格，避免实体死亡后槽位状态改变。",
      },
      {
        label: "权威扣血入账",
        detail: "执行 orig 后仅使用返回的 actualDamage 写入 EncounterSession，拒绝客户端预测值。",
      },
      {
        label: "客户端来源捕获",
        detail: "ModPlayer 与 GlobalProjectile 组合出 DamageRootKey / DamageLeafKey 私有来源树。",
      },
    ],
    responsibilities: [
      "分离服务端权威总量与客户端私有维度，避免为来源统计扩大服务端信任面。",
      "使用 NPC spawn serial 区分 Main.npc 槽位复用后的不同实体实例。",
      "把物品、父弹幕、Buff、坐骑和无法追溯的弹幕统一映射为稳定来源键。",
    ],
    invariants: [
      "公开总伤害只由服务端实际扣血形成；客户端来源不能反向修改公共排行。",
      "来源树只存在于伤害拥有者客户端；网络结果不携带其他玩家的来源维度。",
      "damage <= 0、友好 NPC、城镇 NPC、假人和 critter 不进入统计域。",
    ],
    edgeCases: [
      "换阶段期间结果包与首次命中的到达顺序不确定，来源先写入 SuspendedSources，待会话包序确认归属。",
      "StrikeNPC 属于 detour 集成点，升级 tModLoader 时需要复核方法签名及与其他 detour 的链式兼容性。",
    ],
    references: [
      {
        source: "tModLoader API",
        label: "NPC.StrikeNPC / HitInfo",
        note: "最终伤害计算与 NPC 扣血入口。",
        href: officialDocs.npc,
      },
      {
        source: "tModLoader API",
        label: "ModPlayer.OnHitNPCWithItem / Proj",
        note: "命中方客户端的来源采集钩子。",
        href: officialDocs.modPlayer,
      },
      {
        source: "tModLoader API",
        label: "GlobalNPC.OnSpawn / OnKill",
        note: "服务端 NPC 实例生命周期信号。",
        href: officialDocs.globalNpc,
      },
    ],
    code: [
      {
        label: "权威实际扣血",
        file: "Common/Systems/DamageCaptureSystem.cs",
        symbol: "HookStrikeNpc",
        lines: "L97–L108",
        lineStart: 97,
        href: `${SOURCE_ROOT}Common/Systems/DamageCaptureSystem.cs#L97-L108`,
        code: `bool attributedNetworkHit = TryConsumeNetworkHit(self, hit, fromNet, out int playerIndex);
TargetSnapshot target = default;

if (attributedNetworkHit)
    target = EncounterSystem.PrepareTarget(self);

int result = orig(self, hit, fromNet, noPlayerInteraction);

if (attributedNetworkHit)
    EncounterSystem.RecordPlayerDamage(playerIndex, target, Math.Max(0, result));

return result;`,
      },
      {
        label: "客户端来源树",
        file: "Common/Players/PrivateDamagePlayer.cs",
        symbol: "OnHitNPCWithProj",
        lines: "L45–L59",
        lineStart: 45,
        href: `${SOURCE_ROOT}Common/Players/PrivateDamagePlayer.cs#L45-L59`,
        code: `public override void OnHitNPCWithProj(Projectile proj, NPC target, NPC.HitInfo hit, int damageDone)
{
    if (Main.dedServ || Player.whoAmI != Main.myPlayer || damageDone <= 0 || !TargetClassifier.IsEligibleHostile(target))
        return;

    SourceTrackingGlobalProjectile source = proj.GetGlobalProjectile<SourceTrackingGlobalProjectile>();
    DamageRootKey root = source.HasSource
        ? source.RootSource
        : new DamageRootKey(DamageRootKind.ProjectileFallback, proj.type);

    ClientRuntime.RecordPrivateDamage(
        target,
        root,
        new DamageLeafKey(DamageLeafKind.Projectile, proj.type),
        damageDone);
}`,
      },
    ],
  },
  {
    id: "dot",
    index: "02",
    eyebrow: "DOT CAPTURE / LEASED ATTRIBUTION",
    title: "持续伤害计量与归因",
    summary:
      "0.1.7 在服务器端 detour `NPC.UpdateNPC_BuffApplyDOTs`，以调用前后的 root-life delta 作为唯一计量值。可识别的原版减益通过 duration-segment lease 保留施加者身份；多个活动效果按 vanilla lifeRegen 权重分摊同一批实际扣血，未知或模组 DoT 作为 unattributed remainder 进入团队总量。",
    execution: [
      {
        label: "捕获施加窗口",
        detail: "ProcessHitAgainstNPC、Projectile.StatusNPC 与 NPC.AddBuff detour 组合出玩家、根来源、旧时长和新时长。",
      },
      {
        label: "登记增量租约",
        detail: "仅把 refresh 新增的 duration tail 绑定给当前施加者；previousTime=0 时清除因净化或槽位替换留下的旧片段。",
      },
      {
        label: "测量权威生命差",
        detail: "UpdateNPC_BuffApplyDOTs 前后读取 realLife root，包含致死 tick，拒绝根据 tooltip 或理论 DPS 推算。",
      },
      {
        label: "确定性权重分配",
        detail: "按活动减益与附着弹幕的 vanilla regen weight 分配 actualDamage，使用 cycle skipping 与 bounded tail 保证精确总和和有界复杂度。",
      },
      {
        label: "投影本人来源",
        detail: "拥有者有效时发送 owner-only DoT atom；无所有者部分仅增加服务端团队/本体账本。",
      },
    ],
    responsibilities: [
      "将实际生命损失与持续伤害来源分离建模：measurement 不依赖 attribution 成功。",
      "以 buff duration segment 表达 refresh 所有权，避免覆盖旧持续时间、提前净化和 player-slot reuse 导致所有权漂移。",
      "把 Bone Javelin、Tentacle Spike、Blood Butcherer、Daybreak、Stardust Cell 等堆叠效果绑定到仍存活的 projectile instance。",
      "对 Soul Drain 等特殊效果使用明确权重和 root-NPC 约束，而非通用猜测。",
    ],
    invariants: [
      "所有分配 share 之和严格等于本次 `lifeBefore - lifeAfter`；没有可识别 claim 时全量记为 unattributed。",
      "服务端公开统计不接受客户端上报的 DoT 伤害数值；客户端只补充本人可见的 source tree。",
      "租约只覆盖当前施加新增的时间区间；disconnect、reconnect 或 player index 复用不能继承旧效果。",
      "不支持的 mod DoT 仍计入团队和 Boss body 总量，但不会伪造玩家或来源。",
    ],
    edgeCases: [
      "直接由模组代码修改 `npc.life` 且绕过 vanilla DoT updater 的伤害不存在统一拦截点。",
      "多个效果同时扣血时只能按 vanilla lifeRegen 权重进行确定性分摊，无法从单次聚合生命差恢复引擎未暴露的逐效果真实顺序。",
      "致死 DoT tick 会在 NPC inactive 后才到达客户端；实现依赖同一 NPC object 的 per-entity registry，槽位复用会创建新 registry。",
    ],
    references: [
      {
        source: "tModLoader API",
        label: "NPC.AddBuff / buffTime",
        note: "减益施加、重应用和以 tick 表示的持续时间语义。",
        href: officialDocs.npc,
      },
      {
        source: "tModLoader API",
        label: "ModBuff.ReApply",
        note: "模组 Buff 重应用可覆盖 vanilla 时长更新，因此租约必须读取调用后的实际 buffTime。",
        href: officialDocs.modBuff,
      },
      {
        source: "tModLoader API",
        label: "GlobalNPC.InstancePerEntity",
        note: "每个 NPC 实例保存租约片段和分配器 credit。",
        href: officialDocs.globalNpc,
      },
    ],
    code: [
      {
        label: "实际 DoT 扣血",
        file: "Common/Systems/DotDamageSystem.cs",
        symbol: "HookUpdateNpcBuffApplyDots",
        lines: "L197–L245",
        lineStart: 197,
        href: `${SOURCE_ROOT}Common/Systems/DotDamageSystem.cs#L197-L245`,
        code: `long now = (long)Main.GameUpdateCount;
DotTrackingGlobalNpc tracking = self.GetGlobalNPC<DotTrackingGlobalNpc>();
List<ActiveDotEffect> effects = CaptureActiveEffects(self, tracking, now);
TargetSnapshot target = EncounterSystem.PrepareTarget(self);
NPC lifeTarget = ResolveLifeTarget(self);
int lifeBefore = Math.Max(0, lifeTarget.life);

orig(self);

int actualDamage = Math.Clamp(lifeBefore - Math.Max(0, lifeTarget.life), 0, lifeBefore);
if (actualDamage <= 0 || !target.Eligible)
    return;

AddUnattributedRegenRemainder(effects, self.lifeRegen);
if (effects.Count == 0)
{
    EncounterSystem.RecordDotDamage(null, target, actualDamage);
    return;
}

List<WeightedDamageShare<DotDamageClaimKey>> shares = tracking.DamageAllocator.Allocate(
    actualDamage,
    effects.Select(effect => new WeightedDamageClaim<DotDamageClaimKey>(
        effect.ClaimKey,
        effect.Weight)).ToList());`,
      },
      {
        label: "时长增量租约",
        file: "Common/Systems/DotDamageAttributionPolicy.cs",
        symbol: "GetExtensionWindow",
        lines: "L20–L39",
        lineStart: 20,
        href: `${SOURCE_ROOT}Common/Systems/DotDamageAttributionPolicy.cs#L20-L39`,
        code: `public static DotLeaseWindow? GetExtensionWindow(
    long now,
    int previousTime,
    int currentTime)
{
    previousTime = Math.Max(0, previousTime);
    currentTime = Math.Max(0, currentTime);
    if (currentTime <= previousTime)
        return null;

    long start = previousTime > 0 ? now + previousTime : now;
    long end = now + currentTime;
    return end > start ? new DotLeaseWindow(start, end) : null;
}

public static bool ShouldResetLeaseSegments(int previousTime)
    => previousTime <= 0;`,
      },
      {
        label: "大权重有界分配",
        file: "Common/Systems/DotDamageAttributionPolicy.cs",
        symbol: "WeightedDamageAccumulator.Allocate",
        lines: "L86–L127",
        lineStart: 86,
        href: `${SOURCE_ROOT}Common/Systems/DotDamageAttributionPolicy.cs#L86-L127`,
        code: `long weightGcd = active
    .Select(claim => (long)claim.Weight)
    .Aggregate(GreatestCommonDivisor);
long normalizedTotalWeight = totalWeight / weightGcd;
if (normalizedTotalWeight > 0 && normalizedTotalWeight <= remainingDamage)
{
    long cycles = remainingDamage / normalizedTotalWeight;
    foreach (WeightedDamageClaim<T> claim in active)
    {
        long cycleDamage = cycles * (claim.Weight / weightGcd);
        allocated[claim.Id] = (int)Math.Min(int.MaxValue, cycleDamage);
    }
    remainingDamage -= (int)(cycles * normalizedTotalWeight);
}

if (remainingDamage <= MaximumExactTail)
{
    for (int point = 0; point < remainingDamage; point++)
    {
        foreach (WeightedDamageClaim<T> claim in active)
            _credits[claim.Id] += claim.Weight / (decimal)totalWeight;
        // Highest accumulated credit receives this exact damage point.
    }
}
else
{
    AllocateBoundedTail(remainingDamage, active, totalWeight, allocated);
}`,
      },
    ],
  },
  {
    id: "catalog",
    index: "03",
    eyebrow: "SEMANTIC ADAPTER / BOSS DOMAIN",
    title: "Boss 语义适配层",
    summary:
      "BossCatalog 将运行时 NPC 集合投影为稳定的 BossDescriptor。适配优先级为类型化覆盖、Boss Checklist 目录条目、运行时覆盖，最后回退到 npc.boss；下游状态机不直接依赖具体模组的 NPC 类型布局。",
    execution: [
      {
        label: "枚举活动实体",
        detail: "遍历 Main.ActiveNPCs，以 NPC type 与当前阶段筛选潜在战斗参与者。",
      },
      {
        label: "解析语义来源",
        detail: "按 typed adapter、catalog、runtime override、vanilla flag 的优先级解析。",
      },
      {
        label: "规范化描述符",
        detail: "输出 Key、EncounterGroupKey、Body/KeepAlive/Final NPC type sets 与显示信息。",
      },
      {
        label: "阶段合并",
        detail: "相同 BossKey 的后续形态只补充生命周期角色，保留开场 portrait 与逻辑身份。",
      },
    ],
    responsibilities: [
      "充当 Anti-Corruption Layer，把外部模组的 Boss 表达转换为内部领域模型。",
      "区分 body、keep-alive、final 与 excluded body，避免把召唤物或演出实体当作本体。",
      "使用 EncounterGroupKey 表达多阶段、车轮战和共享生命周期边界。",
    ],
    invariants: [
      "BossDescriptor.Key 在一次会话内稳定且唯一；显示名称不是身份主键。",
      "已由类型化适配器管理的 NPC 不再进入 npc.boss 回退，防止重复描述。",
      "运行时覆盖可以补强目录条目，但不能生成空 key 且无 trigger 的不可达配置。",
    ],
    edgeCases: [
      "部分模组 Boss 不设置 npc.boss，必须依赖 Boss Checklist 或明确覆盖。",
      "热重载或开场形态已经转换时，body form 仍允许作为 arm point，keep-alive-only form 不允许。",
    ],
    references: [
      {
        source: "Mature project",
        label: "Boss Checklist repository / API",
        note: "Boss progression catalog 与 Mod.Call 集成的事实来源。",
        href: officialDocs.bossChecklist,
      },
      {
        source: "tModLoader API",
        label: "GlobalNPC class",
        note: "跨原版与模组 NPC 的统一扩展入口。",
        href: officialDocs.globalNpc,
      },
    ],
    code: [
      {
        label: "活动 Boss 扫描",
        file: "Common/Bosses/BossCatalog.cs",
        symbol: "ScanActiveBosses",
        lines: "L145–L165",
        lineStart: 145,
        href: `${SOURCE_ROOT}Common/Bosses/BossCatalog.cs#L145-L165`,
        code: `public static List<BossDescriptor> ScanActiveBosses()
{
    Dictionary<string, BossDescriptor> found = new(StringComparer.Ordinal);

    foreach (NPC npc in Main.ActiveNPCs)
    {
        bool matchedCatalog = false;
        bool matchedOverride = false;
        List<RuntimeOverride> armOverrides = _overrides
            .Where(runtime => runtime.TriggerNpcTypes.Contains(npc.type) ||
                              runtime.BodyNpcTypes.Contains(npc.type))
            .ToList();
        bool managedByTypedAdapter = _overrides.Any(runtime =>
            (runtime.TriggerNpcTypes.Count > 0 || runtime.BodyNpcTypes.Count > 0) &&
            runtime.ManagesNpcType(npc.type));

        if (!managedByTypedAdapter && EntriesByNpcType.TryGetValue(npc.type, out List<CatalogEntry>? entries))
        {
            matchedCatalog = true;
            foreach (CatalogEntry entry in entries)
                found.TryAdd(entry.Key, BuildCatalogDescriptor(entry, npc.type));
        }
}`,
      },
      {
        label: "原版回退描述",
        file: "Common/Bosses/BossCatalog.cs",
        symbol: "ScanActiveBosses / npc.boss fallback",
        lines: "L180–L195",
        lineStart: 180,
        href: `${SOURCE_ROOT}Common/Bosses/BossCatalog.cs#L180-L195`,
        code: `if (npc.boss && !matchedCatalog && !matchedOverride && !managedByTypedAdapter)
{
    string key = $"npc:{npc.type}";
    found.TryAdd(key, new BossDescriptor
    {
        Key = key,
        EncounterGroupKey = key,
        DisplayNameLocalizationKey = Lang.GetNPCName(npc.type).Key,
        DisplayNameNpcType = npc.type,
        DisplayName = npc.FullName,
        PortraitNpcType = npc.type,
        BodyNpcTypes = [npc.type],
        KeepAliveNpcTypes = [npc.type],
        FinalNpcTypes = npc.type == NPCID.MoonLordCore ? [NPCID.MoonLordCore] : [],
        FinishOnBodyDeathWhenNoParticipants = true
    });
}`,
      },
    ],
  },
  {
    id: "state",
    index: "04",
    eyebrow: "AUTHORITATIVE COORDINATOR / FSM",
    title: "遭遇协调器与状态机",
    summary:
      "EncounterSystem 是服务端单写者协调器，在 PostUpdateWorld 中扫描 Boss、刷新连接代际、观察参与者、发布已决 Boss，并推进 Idle / Armed / Fighting / Transitioning 有限状态机。0.1.7 额外维护 ResolvedBossKeysUntilAbsent：结果发布后必须先观察到该 key 完整缺席，才允许再次 arm 新 occurrence。",
    execution: [
      {
        label: "Idle → Armed",
        detail: "发现可识别 Boss 后创建 EncounterSession，但尚未确认玩家造成有效伤害。",
      },
      {
        label: "Armed → Fighting",
        detail: "第一笔服务端有效伤害设置 StartTick，并把会话提升为 Fighting。",
      },
      {
        label: "Fighting → Transitioning",
        detail: "participant window 为空时启动过场宽限计时并通知客户端暂停来源归属。",
      },
      {
        label: "Transitioning → Fighting / Close",
        detail: "相关实体恢复则继续原会话；证据满足策略边界则发布结果并关闭。",
      },
    ],
    responsibilities: [
      "集中所有会话状态写入，维持服务端 authoritative state machine。",
      "在同一 Tick 内先 reconcile active bosses，再观察参与者和发布 resolved queue。",
      "处理 unrelated encounter handoff：旧会话完成或取消后，才 arm 新会话。",
    ],
    invariants: [
      "多人客户端不会执行 PostUpdateWorld 协调逻辑；服务器是状态唯一写者。",
      "Armed 会话没有有效伤害时可无结果取消，避免仅看见 Boss 就制造历史记录。",
      "一个 session 可包含多个 SessionBoss，但每个 SessionBoss 可独立变为 resolved。",
      "已发布 Boss key 在完整缺席扫描前保持 held，防止死亡残体或控制器制造重复结果。",
    ],
    edgeCases: [
      "NPC-free transition 先等待 TransitionSyncGraceTicks，再允许通用 despawn fallback 裁决。",
      "同 Tick 的最终击杀、玩家死亡与实体清理会竞争，状态机只收集事实，不在协调器内硬编码优先级。",
    ],
    references: [
      {
        source: "tModLoader API",
        label: "ModSystem.PostUpdateWorld",
        note: "仅在单人或服务端执行的世界更新钩子。",
        href: officialDocs.modSystem,
      },
      {
        source: "tModLoader guide",
        label: "Intermediate netcode",
        note: "服务端决定非确定性状态并同步客户端的网络模型。",
        href: officialDocs.netcode,
      },
    ],
    code: [
      {
        label: "世界 Tick 协调",
        file: "Common/Systems/EncounterSystem.cs",
        symbol: "PostUpdateWorld",
        lines: "L65–L92",
        lineStart: 65,
        href: `${SOURCE_ROOT}Common/Systems/EncounterSystem.cs#L65-L92`,
        code: `public override void PostUpdateWorld()
{
    if (Main.netMode == NetmodeID.MultiplayerClient)
        return;

    PlayerConnectionRegistry.Update();
    List<BossDescriptor> activeBosses = BossCatalog.ScanActiveBosses();

    if (_ignoreBossesUntilClear)
    {
        if (activeBosses.Count == 0)
            _ignoreBossesUntilClear = false;
        return;
    }

    ReconcileActiveBosses(activeBosses);
    if (_session is null)
        return;

    EngagementObservation engagement = _session.ObserveEngagedPlayers();
    bool participantActive = _session.RefreshParticipantWindow();
    PublishResolvedBosses();
    if (_session.AllBossesResolved)
    {
        CloseResolvedSession();
        return;
    }
}`,
      },
      {
        label: "无关战斗切换",
        file: "Common/Systems/EncounterSystem.cs",
        symbol: "ReconcileActiveBosses",
        lines: "L243–L285",
        lineStart: 243,
        href: `${SOURCE_ROOT}Common/Systems/EncounterSystem.cs#L243-L285`,
        code: `EncounterPolicy.ReleaseAbsentResolvedBossKeys(
    ResolvedBossKeysUntilAbsent,
    activeBosses.Select(descriptor => descriptor.Key));
activeBosses.RemoveAll(descriptor => ResolvedBossKeysUntilAbsent.Contains(descriptor.Key));

bool currentParticipantActive = _session.HasActiveParticipantNpc();
bool relatedBossActive = activeBosses.Any(_session.IsRelated);
if (EncounterPolicy.ShouldStartNewEncounter(
        hasAnyActiveBoss: true,
        currentParticipantActive,
        relatedBossActive))
{
    if (_session.State == EncounterState.Armed)
    {
        CancelArmedEncounter();
    }
    else
    {
        _session.ObserveEngagedPlayers();
        _session.RefreshParticipantWindow();
        EncounterOutcome outcome = ResolveInactiveBoundary(
            foreignEncounterStarted: true,
            genericFallbackExpired: false) ?? EncounterOutcome.Escaped;
        Finish(outcome);
    }

    Arm(activeBosses);
    return;
}`,
      },
    ],
  },
  {
    id: "ledger",
    index: "05",
    eyebrow: "AGGREGATE ROOT / IDENTITY MODEL",
    title: "分层账本与身份模型",
    summary:
      "EncounterSession 是会话聚合根，内部同时维护 connection ledger、logical player、team aggregate 与 per-Boss SessionBoss。伤害必须先通过唯一 Boss 归因，再写入相互可校验的多层聚合；同一 Boss key 的每次有效重入获得递增 occurrence，成为结果、历史和 HUD 的复合身份。",
    execution: [
      {
        label: "连接代际键",
        detail: "EncounterPlayerKey = (player slot, generation)，阻止槽位复用串接私有数据。",
      },
      {
        label: "逻辑身份解析",
        detail: "仅在同名候选唯一且旧连接已失效时合并重连；任何歧义都创建新逻辑身份。",
      },
      {
        label: "唯一 Boss 归因",
        detail: "TargetSnapshot 必须只命中一个未决 SessionBoss 的 associated type set。",
      },
      {
        label: "多层饱和累加",
        detail: "同步更新 connection、logical、team、boss、body 与 unattributed ledger。",
      },
      {
        label: "实例序号分配",
        detail: "Boss key 再次 arm 时递增 BossOccurrence；客户端以 encounterId + occurrence + bossKey 去重。",
      },
    ],
    responsibilities: [
      "以 EncounterSession 维持会话级一致性，以 SessionBoss 提供独立结算单元。",
      "通过 LogicalDamage 生成公开排行，通过 ConnectionDamage 生成接收者私有总量。",
      "对不唯一的 Boss 归因保留为 unattributed，不把不确定数据强塞入某个 Boss。",
    ],
    invariants: [
      "TeamDamage 等于被会话接收的服务端伤害总和；per-Boss totals 只包含唯一归因伤害。",
      "同名不是充分身份凭据；活跃同名连接或多个断线候选均禁止自动合并。",
      "私有投影始终以精确 EncounterPlayerKey 查找，不能使用显示名回退。",
      "BossOccurrence 在同一 EncounterSession 内单调递增，已发布 occurrence 不可重开。",
    ],
    edgeCases: [
      "Main.player 槽位重用时 generation 必须递增，否则历史连接会获得新玩家的私有结果。",
      "多个 Boss 共享相同 associated NPC type 时归因不唯一，该笔伤害只保留在会话总量。",
    ],
    references: [
      {
        source: "tModLoader guide",
        label: "Intermediate netcode / whoAmI",
        note: "解释客户端索引在 packet flow 中的语义与转发边界。",
        href: officialDocs.netcode,
      },
      {
        source: "tModLoader API",
        label: "Mod.HandlePacket",
        note: "whoAmI 仅可靠标识当前到达服务端的数据发送者。",
        href: officialDocs.mod,
      },
    ],
    code: [
      {
        label: "多层账本写入",
        file: "Common/Systems/EncounterSession.cs",
        symbol: "RecordPlayerDamage",
        lines: "L337–L359",
        lineStart: 337,
        href: `${SOURCE_ROOT}Common/Systems/EncounterSession.cs#L337-L359`,
        code: `connection.Damage = SaturatingAdd(connection.Damage, damage);
connection.Logical.Damage = SaturatingAdd(connection.Logical.Damage, damage);
TeamDamage = SaturatingAdd(TeamDamage, damage);
SessionBoss? attributedBoss = FindUniqueAssociatedBoss(target);
if (attributedBoss is not null)
{
    attributedBoss.StartTick = attributedBoss.StartTick == 0
        ? (long)Main.GameUpdateCount
        : attributedBoss.StartTick;
    attributedBoss.TeamDamage = SaturatingAdd(attributedBoss.TeamDamage, damage);
    attributedBoss.LogicalDamage.TryGetValue(connection.Logical.Id, out long logicalDamage);
    attributedBoss.LogicalDamage[connection.Logical.Id] = SaturatingAdd(logicalDamage, damage);
    attributedBoss.ConnectionDamage.TryGetValue(key, out long connectionDamage);
    attributedBoss.ConnectionDamage[key] = SaturatingAdd(connectionDamage, damage);
    if (IsBossBodyFor(attributedBoss, target))
    {
        attributedBoss.BodyDamage = SaturatingAdd(attributedBoss.BodyDamage, damage);
        BossBodyDamage = SaturatingAdd(BossBodyDamage, damage);
    }
}`,
      },
      {
        label: "连接代际注册",
        file: "Common/Systems/PlayerConnectionRegistry.cs",
        symbol: "Update / GetCurrent",
        lines: "L16–L45",
        lineStart: 16,
        href: `${SOURCE_ROOT}Common/Systems/PlayerConnectionRegistry.cs#L16-L45`,
        code: `public static void Update()
{
    for (int i = 0; i < Main.maxPlayers; i++)
    {
        bool active = Main.player[i].active;
        if (active && !_wasActive[i])
            _generation[i] = _generation[i] == int.MaxValue ? 1 : _generation[i] + 1;
        _wasActive[i] = active;
    }
}

public static bool IsCurrent(EncounterPlayerKey key)
    => key.PlayerIndex >= 0 &&
       key.PlayerIndex < Main.maxPlayers &&
       Main.player[key.PlayerIndex].active &&
       GetCurrent(key.PlayerIndex).Generation == key.Generation;`,
      },
    ],
  },
  {
    id: "boundary",
    index: "06",
    eyebrow: "BOUNDARY ARBITRATION / OUTCOME POLICY",
    title: "生命周期裁决策略",
    summary:
      "EncounterPolicy 是纯裁决层：协调器提供事实快照，策略按确定性优先级返回 Victory / Defeat / Escaped 或 null。0.1.7 把上一权威扫描存在、随后未触发 OnKill 的 participant disappearance 纳入边界事实；普通 Boss 可据此结束，显式 NPC-free 过场与 gauntlet 通过 descriptor 继续等待。",
    execution: [
      {
        label: "收集边界事实",
        detail: "聚合 final kill、downed flag、participant window、party wipe、foreign encounter 与 fallback timeout。",
      },
      {
        label: "单 Boss 裁决",
        detail: "每个未决 SessionBoss 独立运行 ResolveUnresolvedBoss，综合 final kill、downed、non-kill disappearance 与 sibling boundary。",
      },
      {
        label: "会话边界裁决",
        detail: "无活动参与实体时运行 ResolveInactiveBoundary，null 表示证据不足并继续等待。",
      },
      {
        label: "排入已决队列",
        detail: "Outcome 固化后进入 DrainResolvedResults；ResultPublished 防止重复发布。",
      },
    ],
    responsibilities: [
      "把证据排序从状态推进代码中抽离，使边界判断可做无游戏运行时依赖的逻辑测试。",
      "区分 explicit final kill、provisional last participant kill 与 generic fallback。",
      "允许同一 EncounterSession 内的 Boss 以不同时间和不同 Outcome 完成。",
      "由 descriptor 控制哪些战斗允许 disappearance boundary，避免把脚本化无 NPC 阶段误判为逃离。",
    ],
    invariants: [
      "HasVictorySignal 是最高优先级，避免最后一击与团灭同 Tick 时误判 Defeat。",
      "证据不足返回 null，调用方必须保持 Transitioning，不能默认 Escaped。",
      "ResultPublished 从 false 到 true 单调变化，同一 SessionBoss 最多生成一次公开结果。",
    ],
    edgeCases: [
      "特殊 Boss 的 downed flag、最终形态和无 NPC 演出需要 descriptor override，不能只依赖 npc.active。",
      "ContinueAfterPartyWipe 允许复活后重新进入 Fighting；普通战斗则按策略结算 Defeat。",
      "未触发 OnKill 的消失是可观测边界，但只有 FinishOnBodyDeathWhenNoParticipants 等配置允许时才直接裁决。",
    ],
    references: [
      {
        source: "tModLoader API",
        label: "GlobalNPC.OnKill",
        note: "服务端死亡钩子与 boss defeated flag 时序说明。",
        href: officialDocs.globalNpc,
      },
      {
        source: "tModLoader API",
        label: "ModSystem.PostUpdateWorld",
        note: "边界事实在世界更新节奏中被统一采样。",
        href: officialDocs.modSystem,
      },
    ],
    code: [
      {
        label: "会话边界裁决",
        file: "Common/Systems/EncounterPolicy.cs",
        symbol: "ResolveInactiveBoundary",
        lines: "L70–L91",
        lineStart: 70,
        href: `${SOURCE_ROOT}Common/Systems/EncounterPolicy.cs#L70-L91`,
        code: `// A final kill/downed signal wins a same-tick race with player death.
if (facts.HasVictorySignal)
    return EncounterOutcome.Victory;

if (facts.HasNoActivePlayers)
    return facts.PartyWipeObserved ? EncounterOutcome.Defeat : EncounterOutcome.Escaped;

if (facts.PartyWipeObserved && !facts.ContinueAfterPartyWipe)
    return EncounterOutcome.Defeat;

if (facts.ForeignEncounterStarted)
    return facts.PartyWipeObserved ? EncounterOutcome.Defeat : EncounterOutcome.Escaped;

if (!facts.PartyWipeObserved && !facts.LastHadLivingEngagedPlayer)
    return EncounterOutcome.Escaped;

if (facts.GenericFallbackExpired)
    return facts.PartyWipeObserved ? EncounterOutcome.Defeat : EncounterOutcome.Escaped;

return null;`,
      },
      {
        label: "独立结果出队",
        file: "Common/Systems/EncounterSession.cs",
        symbol: "DrainResolvedResults",
        lines: "L420–L454",
        lineStart: 420,
        href: `${SOURCE_ROOT}Common/Systems/EncounterSession.cs#L420-L454`,
        code: `List<SessionBoss> resolved = _bosses.Values
    .Where(value => value.Outcome != EncounterOutcome.Unknown && !value.ResultPublished)
    .ToList();
bool encounterComplete = AllBossesResolved;
List<PublicResultSnapshot> results = [];
for (int index = 0; index < resolved.Count; index++)
{
    SessionBoss boss = resolved[index];
    boss.ResultPublished = true;
    long startTick = boss.StartTick > 0
        ? boss.StartTick
        : StartTick > 0 ? StartTick : ArmedTick;
    results.Add(new PublicResultSnapshot
    {
        EncounterId = EncounterId,
        BossOccurrence = boss.Occurrence,
        EncounterComplete = encounterComplete && index == resolved.Count - 1,
        Outcome = boss.Outcome,
        DurationTicks = Math.Max(0, endTick - startTick),
        TeamDamage = boss.TeamDamage,
        BossBodyDamage = boss.BodyDamage,
        UnattributedDamage = boss.UnattributedDamage,
        Bosses = [CreatePresentation(boss)],
        Players = _logicalPlayers
            .Where(value => boss.LogicalDamage.ContainsKey(value.Id))
            .OrderByDescending(value => boss.LogicalDamage[value.Id])
            .Select(value => new PlayerResultRow
            {
                PlayerName = value.Name,
                Damage = boss.LogicalDamage[value.Id]
            }).ToList(),
        RecipientDamage = new Dictionary<EncounterPlayerKey, long>(boss.ConnectionDamage)
    });
}
return results;`,
      },
    ],
  },
  {
    id: "delivery",
    index: "07",
    eyebrow: "PROJECTION / TRANSPORT / CLIENT PRIVATE STATE",
    title: "结果投影与网络交付",
    summary:
      "已决 SessionBoss 被投影为 PublicResultSnapshot wire format v6：公开部分包含 Boss occurrence、Outcome、时长与逻辑玩家排行；RecipientDamage 只在服务端内存中作为投递索引。私有来源在命中时只接受唯一 Boss 匹配，歧义 atom 直接丢弃，防止同场 Boss 结束后被错误迁移。",
    execution: [
      {
        label: "公开结果投影",
        detail: "从 per-Boss ledger 构造稳定 DTO，并按 logical damage 降序生成公开排行。",
      },
      {
        label: "接收者过滤",
        detail: "按配置选择所有人或贡献者，并以当前 EncounterPlayerKey 查找 ownDamage。",
      },
      {
        label: "定向 ModPacket",
        detail: "服务端对每个在线 slot 调用 SendResult(result, toClient, ownDamage)，不广播私有聚合。",
      },
      {
        label: "客户端校准与持久化",
        detail: "SourceTreeSnapshot.Reconcile(localTotal) 后，以 EncounterId + BossOccurrence + BossKey 写入有容量上限的本地历史与 HUD。",
      },
    ],
    responsibilities: [
      "将领域账本转换为网络 DTO，隔离服务端内部集合和客户端展示模型。",
      "实施 recipient-scoped disclosure：公开排行共享，本人来源与本人总量只对当前连接可见。",
      "控制 packet 时机与体积，只在状态变更/结果产生时同步，而不是每 Tick 广播。",
    ],
    invariants: [
      "服务端发送的 ownDamage 与当前连接代际严格匹配；同名和旧 slot 均不能获得私有结果。",
      "客户端来源树总量必须 Reconcile 到服务端 ownDamage，差额以不可用/未归因维度表达。",
      "历史容量限制在 1–10 场；客户端偏好不会改变服务端结果或其他玩家视图。",
      "同场多 Boss 的 private source match 在命中时冻结；Ambiguous 不会在某只 Boss 结算后重新归属。",
    ],
    edgeCases: [
      "结果到达时若 encounterId 不匹配，客户端不得把当前来源树附到旧战斗。",
      "断线玩家重新请求历史时，服务端重新按当前精确连接计算可投递项，不回放旧连接私有来源。",
      "公开结果使用 wire format v6；服务端和客户端必须运行相同模组版本。",
    ],
    references: [
      {
        source: "tModLoader API",
        label: "ModPacket.Send(toClient, ignoreClient)",
        note: "服务端定向发送或排除指定客户端的传输契约。",
        href: officialDocs.modPacket,
      },
      {
        source: "tModLoader guide",
        label: "Intermediate netcode / packet flows",
        note: "FIFO 读写、包体控制与 server → client 同步模式。",
        href: officialDocs.netcode,
      },
      {
        source: "Official sample",
        label: "tModLoader ExampleMod",
        note: "ModPacket 与服务端状态同步的官方示例项目。",
        href: officialDocs.exampleMod,
      },
    ],
    code: [
      {
        label: "按连接定向投递",
        file: "Common/Networking/DamageNetwork.cs",
        symbol: "SendResultToConfiguredRecipients",
        lines: "L297–L311",
        lineStart: 297,
        href: `${SOURCE_ROOT}Common/Networking/DamageNetwork.cs#L297-L311`,
        code: `PlayerConnectionRegistry.Update();
for (int i = 0; i < Main.maxPlayers; i++)
{
    if (!Main.player[i].active)
        continue;

    EncounterPlayerKey recipient = PlayerConnectionRegistry.GetCurrent(i);
    long? ownDamage = FindOwnDamage(result, recipient);
    if (ServerConfigService.Current.Recipients == ResultRecipients.Contributors &&
        !ownDamage.HasValue)
        continue;

    SendResult(result, i, ownDamage ?? 0);
}`,
      },
      {
        label: "客户端来源校准",
        file: "Client/ClientRuntime.cs",
        symbol: "OnPublicResult",
        lines: "L222–L248",
        lineStart: 222,
        href: `${SOURCE_ROOT}Client/ClientRuntime.cs#L222-L248`,
        code: `bool matchesCurrent = _encounterPrepared &&
    (ActiveEncounterId == 0 || ActiveEncounterId == result.EncounterId);
BossPresentation? boss = result.Bosses.FirstOrDefault();
SourceTreeSnapshot privateTree = matchesCurrent && localTotal.HasValue && boss is not null
    ? ExtractSourcesForBoss(boss).Reconcile(localTotal.Value)
    : SourceTreeSnapshot.Unavailable(localTotal);

ClientHistoryEntry entry = new()
{
    Public = result,
    PrivateSources = privateTree
};
ClientResultHistory.Add(entry, HistoryCapacity);

if (boss is not null)
    ActiveBosses.RemoveAll(value => value.Key.Equals(boss.Key, StringComparison.Ordinal));`,
      },
      {
        label: "命中时冻结 Boss 归属",
        file: "Common/Systems/PrivateSourceAttributionPolicy.cs",
        symbol: "Resolve",
        lines: "L14–L26",
        lineStart: 14,
        href: `${SOURCE_ROOT}Common/Systems/PrivateSourceAttributionPolicy.cs#L14-L26`,
        code: `public static PrivateSourceMatch Resolve(IEnumerable<string> matchingBossKeys)
{
    string[] matches = matchingBossKeys
        .Where(key => !string.IsNullOrWhiteSpace(key))
        .Distinct(StringComparer.Ordinal)
        .Take(2)
        .ToArray();
    return matches.Length switch
    {
        0 => new PrivateSourceMatch(PrivateSourceMatchKind.Pending, string.Empty),
        1 => new PrivateSourceMatch(PrivateSourceMatchKind.Unique, matches[0]),
        _ => new PrivateSourceMatch(PrivateSourceMatchKind.Ambiguous, string.Empty)
    };
}`,
      },
    ],
  },
];

const architectureNodes: ArchitectureNode[] = [
  { id: "hit-cache", area: "input", index: "C1", title: "NetworkHitCache", note: "wire hit → playerIndex", x: 28, y: 66, width: 188, height: 70 },
  { id: "strike", area: "input", index: "C2", title: "StrikeNPC detour", note: "actual health loss", x: 234, y: 66, width: 188, height: 70 },
  { id: "npc-life", area: "input", index: "C3", title: "GlobalNPC lifecycle", note: "spawn serial / kill", x: 440, y: 66, width: 196, height: 70 },
  { id: "provenance", area: "input", index: "C4", title: "Projectile provenance", note: "root source propagation", x: 654, y: 66, width: 202, height: 70 },
  { id: "private-hooks", area: "input", index: "C5", title: "ModPlayer hit hooks", note: "private source plane", x: 874, y: 66, width: 202, height: 70 },

  { id: "dot-apply", area: "dot", index: "D1", title: "Application context", note: "player / root / duration", x: 28, y: 164, width: 188, height: 70 },
  { id: "dot-lease", area: "dot", index: "D2", title: "Duration leases", note: "increment-only ownership", x: 234, y: 164, width: 188, height: 70 },
  { id: "dot-life", area: "dot", index: "D3", title: "DoT life delta", note: "authoritative root loss", x: 440, y: 164, width: 196, height: 70 },
  { id: "dot-allocate", area: "dot", index: "D4", title: "Weighted allocator", note: "exact total / bounded tail", x: 654, y: 164, width: 202, height: 70 },
  { id: "dot-private", area: "dot", index: "D5", title: "Owner-only atom", note: "debuff source projection", x: 874, y: 164, width: 202, height: 70 },

  { id: "catalog-scan", area: "catalog", index: "S1", title: "BossCatalog scan", note: "active NPC enumeration", x: 28, y: 330, width: 188, height: 76 },
  { id: "descriptor", area: "catalog", index: "S2", title: "BossDescriptor", note: "group / body / final", x: 234, y: 330, width: 188, height: 76 },
  { id: "coordinator", area: "state", index: "S3", title: "EncounterSystem", note: "authoritative coordinator", x: 462, y: 322, width: 202, height: 92 },
  { id: "fsm", area: "state", index: "S4", title: "Encounter FSM", note: "Armed / Fighting / Transitioning", x: 682, y: 322, width: 250, height: 92 },
  { id: "policy", area: "boundary", index: "S5", title: "EncounterPolicy", note: "boundary arbitration", x: 972, y: 330, width: 236, height: 76 },

  { id: "identity", area: "ledger", index: "A1", title: "Connection identity", note: "slot + generation", x: 28, y: 496, width: 188, height: 78 },
  { id: "session", area: "ledger", index: "A2", title: "EncounterSession", note: "aggregate root", x: 234, y: 496, width: 188, height: 78 },
  { id: "attribution", area: "ledger", index: "A3", title: "Unique attribution", note: "target → one boss", x: 440, y: 496, width: 188, height: 78 },
  { id: "boss-ledger", area: "ledger", index: "A4", title: "SessionBoss ledger", note: "occurrence / player / body", x: 646, y: 488, width: 224, height: 94 },
  { id: "result-queue", area: "boundary", index: "A5", title: "Resolved result queue", note: "monotonic publish", x: 908, y: 496, width: 236, height: 78 },

  { id: "projection", area: "delivery", index: "N1", title: "PublicResultSnapshot", note: "wire format v6", x: 138, y: 666, width: 220, height: 82 },
  { id: "recipient", area: "delivery", index: "N2", title: "Recipient filter", note: "exact ownDamage", x: 390, y: 666, width: 202, height: 82 },
  { id: "packet", area: "delivery", index: "N3", title: "ModPacket transport", note: "server → toClient", x: 624, y: 666, width: 202, height: 82 },
  { id: "reconcile", area: "delivery", index: "N4", title: "Private reconciliation", note: "frozen boss key / own total", x: 858, y: 658, width: 218, height: 98 },
  { id: "history", area: "delivery", index: "N5", title: "History / HUD", note: "occurrence-aware key", x: 1108, y: 666, width: 144, height: 82 },
];

const architectureConnections: ArchitectureConnection[] = [
  { id: "hit-strike", from: "hit-cache", to: "strike", d: "M216 101 H234", kind: "event" },
  { id: "life-catalog", from: "npc-life", to: "catalog-scan", d: "M538 136 V280 H122 V330", kind: "event" },
  { id: "provenance-private", from: "provenance", to: "private-hooks", d: "M856 101 H874", kind: "private" },
  { id: "dot-apply-lease", from: "dot-apply", to: "dot-lease", d: "M216 199 H234", kind: "identity" },
  { id: "dot-lease-life", from: "dot-lease", to: "dot-life", d: "M422 199 H440", kind: "event" },
  { id: "dot-life-allocate", from: "dot-life", to: "dot-allocate", d: "M636 199 H654", kind: "event" },
  { id: "dot-allocate-private", from: "dot-allocate", to: "dot-private", d: "M856 199 H874", kind: "private" },
  { id: "catalog-descriptor", from: "catalog-scan", to: "descriptor", d: "M216 368 H234", kind: "control" },
  { id: "descriptor-coordinator", from: "descriptor", to: "coordinator", d: "M422 368 H462", kind: "control" },
  { id: "coordinator-fsm", from: "coordinator", to: "fsm", d: "M664 368 H682", kind: "control" },
  { id: "fsm-policy", from: "fsm", to: "policy", d: "M932 368 H972", kind: "control" },
  { id: "coordinator-session", from: "coordinator", to: "session", d: "M563 414 V458 H328 V496", kind: "control" },
  { id: "identity-session", from: "identity", to: "session", d: "M216 535 H234", kind: "identity" },
  { id: "strike-attribution", from: "strike", to: "attribution", d: "M328 136 V280 H534 V496", kind: "event" },
  { id: "dot-attribution", from: "dot-allocate", to: "attribution", d: "M755 234 V280 H534 V496", kind: "event" },
  { id: "session-attribution", from: "session", to: "attribution", d: "M422 535 H440", kind: "control" },
  { id: "attribution-ledger", from: "attribution", to: "boss-ledger", d: "M628 535 H646", kind: "event" },
  { id: "policy-result", from: "policy", to: "result-queue", d: "M1090 406 V456 H1026 V496", kind: "control" },
  { id: "ledger-result", from: "boss-ledger", to: "result-queue", d: "M870 535 H908", kind: "control" },
  { id: "result-projection", from: "result-queue", to: "projection", d: "M1026 574 V620 H248 V666", kind: "control" },
  { id: "projection-recipient", from: "projection", to: "recipient", d: "M358 707 H390", kind: "control" },
  { id: "identity-recipient", from: "identity", to: "recipient", d: "M122 574 V620 H491 V666", kind: "identity" },
  { id: "recipient-packet", from: "recipient", to: "packet", d: "M592 707 H624", kind: "private" },
  { id: "packet-reconcile", from: "packet", to: "reconcile", d: "M826 707 H858", kind: "private" },
  { id: "private-reconcile", from: "private-hooks", to: "reconcile", d: "M975 136 V636 H967 V658", kind: "private" },
  { id: "dot-private-reconcile", from: "dot-private", to: "reconcile", d: "M975 234 V636 H967 V658", kind: "private" },
  { id: "reconcile-history", from: "reconcile", to: "history", d: "M1076 707 H1108", kind: "private" },
];

const nodeById = new Map(architectureNodes.map((node) => [node.id, node]));

const csharpKeywords = new Set([
  "abstract", "as", "base", "bool", "break", "byte", "case", "catch", "char",
  "class", "const", "continue", "decimal", "default", "delegate", "do", "double",
  "else", "enum", "event", "explicit", "extern", "false", "finally", "fixed",
  "float", "for", "foreach", "if", "implicit", "in", "int", "interface", "internal",
  "is", "lock", "long", "namespace", "new", "null", "object", "operator", "out",
  "override", "params", "private", "protected", "public", "readonly", "record", "ref",
  "return", "sbyte", "sealed", "short", "sizeof", "stackalloc", "static", "string",
  "struct", "switch", "this", "throw", "true", "try", "typeof", "uint", "ulong",
  "unchecked", "unsafe", "ushort", "using", "virtual", "void", "volatile", "while",
]);

function highlightCSharpLine(line: string): ReactNode[] {
  const tokenPattern = /(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])'|\b\d+(?:\.\d+)?(?:[fFdDmMlLuU]+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b)/g;
  const output: ReactNode[] = [];
  let cursor = 0;

  for (const match of line.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    if (index > cursor)
      output.push(line.slice(cursor, index));

    const token = match[0];
    let className = "";
    if (token.startsWith("//"))
      className = "syntax-comment";
    else if (token.startsWith('"') || token.startsWith("'"))
      className = "syntax-string";
    else if (/^\d/.test(token))
      className = "syntax-number";
    else if (csharpKeywords.has(token))
      className = "syntax-keyword";
    else if (/^\s*\(/.test(line.slice(index + token.length)))
      className = "syntax-function";
    else if (/^[A-Z]/.test(token))
      className = "syntax-type";

    output.push(className ? <span className={className} key={`${index}-${token}`}>{token}</span> : token);
    cursor = index + token.length;

    if (token.startsWith("//"))
      break;
  }

  if (cursor < line.length)
    output.push(line.slice(cursor));
  return output.length > 0 ? output : [" "];
}

function SystemNode({
  node,
  active,
  onSelect,
}: {
  node: ArchitectureNode;
  active: boolean;
  onSelect: (id: AreaId) => void;
}) {
  return (
    <g
      className="mod-architecture-node"
      data-active={active ? "true" : "false"}
      role="button"
      tabIndex={0}
      aria-label={`查看${areas.find((area) => area.id === node.area)?.title ?? node.title}`}
      aria-pressed={active}
      onClick={() => onSelect(node.area)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(node.area);
        }
      }}
    >
      <title>{`${node.title}：${node.note}`}</title>
      <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="10" />
      <text className="mod-architecture-node-index" x={node.x + 14} y={node.y + 20}>
        {node.index}
      </text>
      <text className="mod-architecture-node-title" x={node.x + 14} y={node.y + 43}>
        {node.title}
      </text>
      <text className="mod-architecture-node-note" x={node.x + 14} y={node.y + 60}>
        {node.note}
      </text>
    </g>
  );
}

function TechnicalList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mod-architecture-technical-block">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

export function ModArchitectureExplorer() {
  const [activeAreaId, setActiveAreaId] = useState<AreaId>("state");
  const activeArea = areas.find((area) => area.id === activeAreaId) ?? areas[0];

  function selectArea(id: AreaId) {
    setActiveAreaId(id);
  }

  return (
    <div className="mod-architecture-explorer">
      <div className="mod-architecture-toolbar">
        <div>
          <span>SYSTEM MAP / 0.1.7 / SERVER AUTHORITATIVE</span>
          <strong>战斗统计系统 · 可钻取架构总览</strong>
        </div>
        <p>选择任一模块，查看职责、状态转换、系统不变量、边界条件与对应实现</p>
      </div>

      <div className="mod-architecture-map" tabIndex={0} aria-label="可横向滚动的系统架构总览">
        <svg
          viewBox="0 0 1280 800"
          role="img"
          aria-labelledby="mod-architecture-title mod-architecture-description"
        >
          <title id="mod-architecture-title">Daybreak DamageTracker 0.1.7 系统架构</title>
          <desc id="mod-architecture-description">
            四条泳道展示直接伤害与持续伤害采集、Boss 语义适配、会话协调、分层账本、边界裁决、结果投影、网络交付和客户端私有数据的完整关系。
          </desc>
          <defs>
            <marker id="mod-architecture-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>

          {[
            ["CAPTURE / DIRECT HIT + DAMAGE OVER TIME", 24, 246],
            ["SEMANTIC ADAPTATION / COORDINATION", 288, 150],
            ["AGGREGATION / RESOLUTION", 456, 150],
            ["NETWORK PROJECTION / CLIENT PRIVATE STATE", 624, 150],
          ].map(([label, y, height]) => (
            <g key={String(label)}>
              <rect className="mod-architecture-lane" x="12" y={Number(y)} width="1256" height={Number(height)} rx="14" />
              <text className="mod-architecture-lane-label" x="28" y={Number(y) + 24}>{label}</text>
            </g>
          ))}

          <g className="mod-architecture-connections" aria-hidden="true">
            {architectureConnections.map((connection) => {
              const from = nodeById.get(connection.from);
              const to = nodeById.get(connection.to);
              const connected = from?.area === activeAreaId || to?.area === activeAreaId;
              return (
                <path
                  key={connection.id}
                  d={connection.d}
                  data-active={connected ? "true" : "false"}
                  data-kind={connection.kind}
                  markerEnd="url(#mod-architecture-arrow)"
                />
              );
            })}
          </g>

          {architectureNodes.map((node) => (
            <SystemNode
              key={node.id}
              node={node}
              active={node.area === activeAreaId}
              onSelect={selectArea}
            />
          ))}
        </svg>
      </div>

      <div className="mod-architecture-legend" aria-label="连线图例">
        <span data-kind="event">事件 / 数据流</span>
        <span data-kind="control">协调 / 状态推进</span>
        <span data-kind="identity">身份关联</span>
        <span data-kind="private">接收者私有数据</span>
      </div>

      <div className="mod-architecture-area-tabs" aria-label="系统区域">
        {areas.map((area) => (
          <button
            key={area.id}
            type="button"
            aria-pressed={area.id === activeAreaId}
            onClick={() => selectArea(area.id)}
          >
            <span>{area.index}</span>
            {area.title}
          </button>
        ))}
      </div>

      <section className="mod-architecture-detail" aria-live="polite">
        <div className="mod-architecture-detail-copy">
          <div className="mod-architecture-detail-heading">
            <span>{activeArea.index}</span>
            <div>
              <small>{activeArea.eyebrow}</small>
              <h3>{activeArea.title}</h3>
            </div>
          </div>
          <p>{activeArea.summary}</p>

          <div className="mod-architecture-subheading">
            <span>EXECUTION PATH</span>
            <h4>执行路径</h4>
          </div>
          <ol className="mod-architecture-execution" aria-label={`${activeArea.title}执行路径`}>
            {activeArea.execution.map((step, index) => (
              <li key={step.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{step.label}</strong>
                  <p>{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mod-architecture-technical-grid">
            <TechnicalList title="职责边界" items={activeArea.responsibilities} />
            <TechnicalList title="系统不变量" items={activeArea.invariants} />
            <TechnicalList title="边界条件 / 失效模式" items={activeArea.edgeCases} />
          </div>

          <div className="mod-architecture-reference-list">
            <div className="mod-architecture-subheading">
              <span>API / PROJECT REFERENCES</span>
              <h4>接口与实现依据</h4>
            </div>
            {activeArea.references.map((reference) => (
              <a key={reference.href + reference.label} href={reference.href} target="_blank" rel="noreferrer">
                <span>{reference.source}</span>
                <strong>{reference.label}</strong>
                <p>{reference.note}</p>
                <i aria-hidden>↗</i>
              </a>
            ))}
          </div>
        </div>

        <div className="mod-architecture-code">
          <div className="mod-architecture-code-intro">
            <span>PINNED SOURCE / 0.1.7 RELEASE</span>
            <p>以下片段固定到公开 main 的 0.1.7 发布提交（当前最新公开源码），并按当前技术域完整展开。</p>
          </div>
          <div className="mod-architecture-code-tabs" aria-label="源码位置">
            {activeArea.code.map((reference, index) => (
              <a
                key={reference.symbol}
                href={`#source-${activeArea.id}-${index}`}
              >
                {reference.label}
              </a>
            ))}
          </div>
          <div className="mod-architecture-code-stack">
            {activeArea.code.map((reference, referenceIndex) => (
              <article
                className="mod-architecture-code-block"
                id={`source-${activeArea.id}-${referenceIndex}`}
                key={`${reference.file}-${reference.symbol}`}
              >
                <div className="mod-architecture-code-heading">
                  <div>
                    <span>{reference.file}</span>
                    <strong>{reference.symbol}</strong>
                  </div>
                  <span>{reference.lines}</span>
                </div>
                <div className="mod-architecture-code-scroll" aria-label={`${reference.symbol} C# 源码`}>
                  <ol start={reference.lineStart}>
                    {reference.code.split("\n").map((line, index) => (
                      <li key={`${reference.symbol}-${index}`}>
                        <code>{highlightCSharpLine(line)}</code>
                      </li>
                    ))}
                  </ol>
                </div>
                <a href={reference.href} target="_blank" rel="noreferrer">
                  在 GitHub 查看对应源码 <span aria-hidden>↗</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
