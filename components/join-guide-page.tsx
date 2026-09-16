import Link from "next/link";
import { AddressBlock } from "@/components/address-block";

export type GuideStep = {
  number: string;
  title: string;
  body: string;
  note: string;
  visualLabel: string;
  visualTitle: string;
  visualPath: string[];
  image?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  images?: {
    src: string;
    alt: string;
    caption?: string;
    compact?: boolean;
    emphasis?: boolean;
    emphasisLabel?: string;
    width?: number;
    height?: number;
  }[];
  action?: {
    label: string;
    href: string;
  };
  inputTip?: {
    lead: string;
    detail: string;
  };
};

export type GuideHelpItem = {
  label: string;
  title: string;
  body: string;
};

type JoinGuidePageProps = {
  gameName: string;
  gameHref: string;
  eyebrow: string;
  eyebrowTone: "orange" | "seafoam";
  titleLines: string[];
  intro: string;
  address: string;
  checklist: string[];
  steps: GuideStep[];
  helpItems: GuideHelpItem[];
};

export function JoinGuidePage({
  gameName,
  gameHref,
  eyebrow,
  eyebrowTone,
  titleLines,
  intro,
  address,
  checklist,
  steps,
  helpItems,
}: JoinGuidePageProps) {
  return (
    <>
      <section className="article-hero guide-hero page-shell">
        <div className="breadcrumbs">
          <Link href={gameHref}>{gameName}</Link>
          <span>/</span>
          <span>进服教程</span>
        </div>
        <div className="article-hero-grid">
          <div>
            <div className="eyebrow">
              <span className={`eyebrow-dot ${eyebrowTone}`} />
              {eyebrow}
            </div>
            <h1>
              {titleLines.map((line, index) => (
                <span key={line}>
                  {line}
                  {index < titleLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </h1>
          </div>
          <div className="article-intro">
            <p>{intro}</p>
            <AddressBlock address={address} />
          </div>
        </div>
      </section>

      <section className="guide-layout page-shell">
        <aside className="guide-aside">
          <span className="mono-label">YOUR ROUTE</span>
          <h2>按顺序完成</h2>
          <nav className="guide-jump-nav" aria-label="教程步骤">
            {steps.map((step) => (
              <a href={`#guide-step-${step.number}`} key={step.number}>
                <span>{step.number}</span>
                <strong>{step.title}</strong>
              </a>
            ))}
          </nav>

          <div className="guide-aside-checklist">
            <span className="mono-label">BEFORE YOU START</span>
            <ul>
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <Link href="/status">查看服务器状态 →</Link>
        </aside>

        <div className="guide-steps">
          {steps.map((step, index) => {
            const images =
              step.images ??
              (step.image
                ? [{ ...step.image, caption: step.visualLabel }]
                : []);
            const actionOpensNewTab =
              step.action?.href.startsWith("http://") ||
              step.action?.href.startsWith("https://");

            return (
              <article
                className="guide-step"
                id={`guide-step-${step.number}`}
                key={step.number}
              >
                <div className="guide-number">{step.number}</div>

                <div className="guide-step-copy">
                  <span className="mono-label">
                    STEP {step.number} / {String(steps.length).padStart(2, "0")}
                  </span>
                  <h2>{step.title}</h2>
                  <p>{step.body}</p>
                  {step.action ? (
                    <a
                      className="guide-step-action"
                      href={step.action.href}
                      rel={actionOpensNewTab ? "noreferrer" : undefined}
                      target={actionOpensNewTab ? "_blank" : undefined}
                    >
                      {step.action.label}
                    </a>
                  ) : null}
                  <div className="guide-note">
                    <span>NOTE</span>
                    {step.note}
                  </div>
                  {step.inputTip ? (
                    <div className="guide-input-tip" role="note">
                      <span className="mono-label">INPUT / 输入提示</span>
                      <strong>
                        <span>{step.inputTip.lead}</span>
                        <span>{step.inputTip.detail}</span>
                      </strong>
                    </div>
                  ) : null}
                </div>

                <figure className="guide-step-visual">
                  {images.length > 0 ? (
                    <div
                      className={`guide-image-gallery${
                        images.length > 1 ? " guide-image-gallery-multiple" : ""
                      }`}
                    >
                      {images.map((image) => (
                        <div
                          className={`guide-image-card${
                            image.compact ? " guide-image-card-compact" : ""
                          }${
                            image.emphasis ? " guide-image-card-emphasis" : ""
                          }`}
                          key={image.src}
                        >
                          {image.emphasis ? (
                            <div className="guide-image-emphasis-copy">
                              <span className="mono-label">
                                {image.emphasisLabel ?? "IMPORTANT"}
                              </span>
                              {image.caption ? <strong>{image.caption}</strong> : null}
                            </div>
                          ) : null}
                          <img
                            src={image.src}
                            alt={image.alt}
                            width={image.width}
                            height={image.height}
                          />
                          {image.caption && !image.emphasis ? (
                            <span>{image.caption}</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="guide-visual-frame">
                      <div className="guide-visual-bar">
                        <span aria-hidden>
                          <i />
                          <i />
                          <i />
                        </span>
                        <strong>{step.visualLabel}</strong>
                      </div>
                      <div className="guide-visual-body">
                        <span className="mono-label">
                          VISUAL GUIDE / {String(index + 1).padStart(2, "0")}
                        </span>
                        <strong>{step.visualTitle}</strong>
                        <div className="guide-visual-path">
                          {step.visualPath.map((item, pathIndex) => (
                            <span key={item}>
                              <i>{String(pathIndex + 1).padStart(2, "0")}</i>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <figcaption>{step.visualLabel}</figcaption>
                </figure>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section page-shell">
        <div className="section-heading guide-help-heading">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            TROUBLESHOOTING
          </div>
          <h2>卡在哪一步，就从这里检查。</h2>
        </div>
        <div className="help-grid">
          {helpItems.map((item) => (
            <article key={item.label}>
              <span className="mono-label">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
