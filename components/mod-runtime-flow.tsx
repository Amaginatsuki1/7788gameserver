const runtimeSteps = [
  {
    index: "01",
    eyebrow: "DISCOVER",
    title: "发现 Boss",
    description: "服务器识别场上的 Boss，并为每只 Boss 建立独立记录。仅仅出现不会产生结算。",
  },
  {
    index: "02",
    eyebrow: "ENGAGE",
    title: "确认开战",
    description: "第一笔实际扣除生命值的伤害到达后，战斗计时和参与者统计正式开始。",
  },
  {
    index: "03",
    eyebrow: "MEASURE",
    title: "测量实际伤害",
    description: "直接命中与持续伤害分别采集，但都以服务器观察到的实际生命损失为准。",
  },
  {
    index: "04",
    eyebrow: "ATTRIBUTE",
    title: "归入对应账本",
    description: "能确认归属的伤害记入玩家与 Boss；无法确认来源的持续伤害仍计入团队总量，不猜测玩家。",
  },
  {
    index: "05",
    eyebrow: "OBSERVE",
    title: "跟随战斗状态",
    description: "系统持续观察换阶段、短暂消失、多人掉线、同时多 Boss 与再次召唤。",
  },
  {
    index: "06",
    eyebrow: "RESOLVE",
    title: "逐只判定结果",
    description: "每只 Boss 独立判断胜利、失败或离场；谁先结束，谁先生成自己的结果。",
  },
  {
    index: "07",
    eyebrow: "PROJECT",
    title: "按可见范围发布",
    description: "公共排名发给参战者；武器、弹幕和减益来源树只发给数据所属玩家。",
  },
  {
    index: "08",
    eyebrow: "PRESENT",
    title: "显示并等待下一次",
    description: "客户端生成结算与历史；同名 Boss 完全离场一次后，下一次召唤会得到新的独立编号。",
  },
];

const stateBranches = [
  {
    tone: "resume",
    label: "RESUME",
    title: "恢复同一场战斗",
    description: "换阶段或演出结束后继续原账本，不重复开始。",
  },
  {
    tone: "resolve",
    label: "RESOLVE",
    title: "发布单 Boss 结果",
    description: "击杀、失败或可靠的离场边界只会发布一次。",
  },
  {
    tone: "rearm",
    label: "REARM",
    title: "建立下一次记录",
    description: "Boss key 完整缺席一次后，下一次出现分配新的 occurrence。",
  },
  {
    tone: "cancel",
    label: "CANCEL",
    title: "清除未开战记录",
    description: "Boss 出现但从未造成有效交战时，不生成结果。",
  },
];

export function ModRuntimeFlow() {
  return (
    <div className="mod-runtime-flow">
      <div className="mod-runtime-toolbar">
        <div>
          <span>END-TO-END / PLAYER VIEW</span>
          <strong>一场战斗如何完成统计</strong>
        </div>
        <p>先看完整数据旅程，再在“实现方式”中钻取接口、约束与源码。</p>
      </div>

      <div className="mod-runtime-journey" aria-label="伤害追踪完整运行流程">
        <ol>
          {runtimeSteps.map((step) => (
            <li key={step.index}>
              <div className="mod-runtime-step-head">
                <span>{step.index}</span>
                <small>{step.eyebrow}</small>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mod-runtime-inputs">
        <div className="mod-runtime-inputs-copy">
          <span>DAMAGE INTAKE</span>
          <h3>两条伤害路径，汇入同一套账本</h3>
          <p>
            0.1.7 将持续伤害从“只能看到结果”扩展为可测量、可归因的数据通路，
            同时保留未知来源，避免为了填满排行而制造错误归属。
          </p>
        </div>
        <div className="mod-runtime-input-track" aria-label="直接伤害和持续伤害路径">
          <article data-path="direct">
            <span>PATH A / DIRECT</span>
            <strong>直接命中</strong>
            <p>记录这次命中实际扣掉的生命值，并关联发起命中的玩家。</p>
          </article>
          <i aria-hidden>+</i>
          <article data-path="dot">
            <span>PATH B / DAMAGE OVER TIME</span>
            <strong>持续伤害</strong>
            <p>读取一次 DoT 更新造成的实际生命损失，再按活动效果的权重拆分。</p>
          </article>
          <i aria-hidden>→</i>
          <article data-path="ledger">
            <span>AUTHORITATIVE LEDGER</span>
            <strong>Boss 独立账本</strong>
            <p>玩家归属、团队总量、Boss 本体伤害与未知来源保持精确总和。</p>
          </article>
        </div>
      </div>

      <div className="mod-runtime-states">
        <div className="mod-runtime-state-copy">
          <span>STATE CHANGES</span>
          <h3>状态会暂停、恢复，也会分叉</h3>
          <p>
            系统不会把“NPC 暂时不在场”等同于“Boss 已结束”。生命周期证据会决定继续等待、
            立即结算或关闭遭遇；已经发布的 Boss 不会被残留控制器重新打开。
          </p>
        </div>

        <div className="mod-runtime-state-map" aria-label="战斗状态变化">
          <div className="mod-runtime-state-track">
            <article>
              <span>01 / ARMED</span>
              <strong>等待有效伤害</strong>
              <p>已发现 Boss，尚未确认玩家真正开战。</p>
            </article>
            <i aria-hidden>→</i>
            <article>
              <span>02 / FIGHTING</span>
              <strong>持续战斗</strong>
              <p>接受伤害并更新每只 Boss 的独立账本。</p>
            </article>
            <i aria-hidden>→</i>
            <article>
              <span>03 / TRANSITIONING</span>
              <strong>等待边界证据</strong>
              <p>短暂无 NPC 时先保留上下文，而不是直接判定结果。</p>
            </article>
          </div>

          <div className="mod-runtime-branches">
            {stateBranches.map((branch) => (
              <article data-tone={branch.tone} key={branch.title}>
                <span>{branch.label}</span>
                <strong>{branch.title}</strong>
                <p>{branch.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="mod-runtime-rule">
        <span>核心规则</span>
        <p>
          服务端只发布能够从实际生命损失和生命周期信号证明的结果；
          客户端来源明细是面向本人展示的投影，不能反向修改公共排行。
        </p>
      </div>
    </div>
  );
}
