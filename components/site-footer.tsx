import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-grid">
        <div>
          <Link className="brand footer-brand" href="/">
            <span className="brand-mark">77<span>88</span></span>
            <span className="brand-copy">GAME<br />SERVERS</span>
          </Link>
          <p>给朋友们的玩法入口、进服说明与服务器状态。</p>
        </div>
        <div className="footer-links">
          <Link href="/terraria">Terraria</Link>
          <Link href="/minecraft">Minecraft</Link>
          <Link href="/status">状态</Link>
          <Link href="/updates">更新记录</Link>
        </div>
        <div className="footer-meta">
          <span>7788oio.icu</span>
          <span>Private game servers · China</span>
          <span>Hero artwork · Generated for 7788</span>
          <span>© 2026 7788</span>
        </div>
      </div>
    </footer>
  );
}
