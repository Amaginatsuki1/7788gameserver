import Link from "next/link";
import { AddressBlock } from "@/components/address-block";
import { ModExplorer } from "@/components/mod-explorer";
import { StatusBadge } from "@/components/status-badge";
import type { ModInfo } from "@/lib/server-data";

type SpecItem = {
  label: string;
  value: string;
};

type FeatureItem = {
  code: string;
  title: string;
  body: string;
};

type GameDetailPageProps = {
  worldLabel: string;
  titleLines: string[];
  description: string;
  joinHref: string;
  statusLabel: string;
  specs: SpecItem[];
  address: string;
  profileLabel: string;
  profileTitle: string;
  profileDescription: string;
  features: FeatureItem[];
  mods: ModInfo[];
  modTitleLines: string[];
  modDescription: string;
  closingLabel: string;
  closingTitle: string;
  closingBody: string;
};

export function GameDetailPage({
  worldLabel,
  titleLines,
  description,
  joinHref,
  statusLabel,
  specs,
  address,
  profileLabel,
  profileTitle,
  profileDescription,
  features,
  mods,
  modTitleLines,
  modDescription,
  closingLabel,
  closingTitle,
  closingBody,
}: GameDetailPageProps) {
  return (
    <>
      <section className="sub-hero page-shell">
        <div className="sub-hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot seafoam" />
            {worldLabel}
          </div>
          <h1>
            {titleLines.map((line, index) => (
              <span key={line}>
                {line}
                {index < titleLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>
          <p>{description}</p>
          <div className="button-row">
            <Link className="button button-primary" href={joinHref}>
              查看进服教程 <span aria-hidden>↗</span>
            </Link>
            <Link className="button button-secondary" href="/status">
              查看运行状态
            </Link>
          </div>
        </div>

        <div className="spec-card elevated-card">
          <div className="spec-card-head">
            <span className="mono-label">SERVER SPECIFICATION</span>
            <StatusBadge tone="online">{statusLabel}</StatusBadge>
          </div>
          <dl className="spec-list">
            {specs.map((spec) => (
              <div key={spec.label}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
          <AddressBlock address={address} />
        </div>
      </section>

      <section className="section page-shell">
        <div className="section-heading split-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              {profileLabel}
            </div>
            <h2>{profileTitle}</h2>
          </div>
          <p>{profileDescription}</p>
        </div>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <article
              className={`feature-card${index === 0 ? " featured" : ""}`}
              key={feature.code}
            >
              <span className="feature-code">{feature.code}</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-deep mod-scroll-section">
        <ModExplorer
          mods={mods}
          titleLines={modTitleLines}
          description={modDescription}
        />
      </section>

      <section className="section page-shell">
        <div className="notice-panel">
          <div>
            <span className="mono-label">{closingLabel}</span>
            <h2>{closingTitle}</h2>
          </div>
          <p>{closingBody}</p>
          <Link className="text-link" href={joinHref}>
            继续阅读进服教程 <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
