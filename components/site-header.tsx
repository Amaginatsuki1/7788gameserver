import Link from "next/link";

const nav = [
  ["/terraria", "Terraria"],
  ["/minecraft", "Minecraft"],
  ["/status", "状态"],
  ["/updates", "更新"],
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner page-shell">
        <Link className="brand" href="/" aria-label="7788 游戏服务器首页">
          <span className="brand-mark">77<span>88</span></span>
          <span className="brand-copy">GAME<br />SERVERS</span>
        </Link>
        <nav className="site-nav" aria-label="主导航">
          {nav.map(([href, label]) => (
            <Link href={href} key={href}>{label}</Link>
          ))}
        </nav>
        <Link
          className="header-status"
          href="/status"
          aria-label="查看服务器状态"
        >
          <span className="live-dot" />
          <span>服务状态</span>
        </Link>
      </div>
    </header>
  );
}
