"use client";

import { useMemo, useState } from "react";
import type { ModInfo } from "@/lib/server-data";

type ModExplorerProps = {
  mods: ModInfo[];
  titleLines: string[];
  description: string;
};

export function ModExplorer({
  mods,
  titleLines,
  description,
}: ModExplorerProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const activeIndex = hoveredIndex ?? expandedIndex;
  const activeMod = useMemo(
    () => (activeIndex === null ? null : mods[activeIndex]),
    [activeIndex, mods],
  );
  const isPreviewExpanded =
    activeIndex !== null && activeIndex === expandedIndex;

  function toggleMod(index: number) {
    setExpandedIndex((current) => (current === index ? null : index));
  }

  return (
    <div className="page-shell mod-section">
      <div className="mod-section-copy">
        <div className="eyebrow eyebrow-light">
          <span className="eyebrow-dot seafoam" />
          SELECTED MODS
        </div>
        <h2>
          {titleLines.map((line, index) => (
            <span key={line}>
              {line}
              {index < titleLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </h2>
        <p>{description}</p>

        <div
          className={`mod-preview${activeMod ? " is-visible" : ""}${
            isPreviewExpanded ? " is-expanded" : ""
          }`}
        >
          {activeMod ? (
            <>
              <div className="mod-preview-media">
                {activeMod.image ? (
                  <img
                    key={activeMod.id}
                    src={activeMod.image}
                    alt={`${activeMod.name} 的创意工坊图标`}
                  />
                ) : (
                  <span aria-hidden>
                    {activeMod.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="mod-preview-heading">
                <span className="mono-label">
                  MOD {String(activeIndex! + 1).padStart(2, "0")}
                </span>
                <h3>{activeMod.name}</h3>
              </div>
              <div className="mod-preview-details">
                <div>
                  <p>{activeMod.description}</p>
                  {activeMod.workshopUrl ? (
                    <a
                      href={activeMod.workshopUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Steam 创意工坊 <span aria-hidden>↗</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div className="mod-preview-placeholder">
              <span className="mono-label">MOD PREVIEW</span>
              <p>将鼠标移到条目上查看内容，点击后展开详细介绍。</p>
            </div>
          )}
        </div>
      </div>

      <div
        className="mod-list"
        aria-label={`${titleLines.join("")}，共 ${mods.length} 项`}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {mods.map((mod, index) => {
          const isExpanded = expandedIndex === index;
          const isActive = activeIndex === index;
          const detailId = `mod-detail-${mod.id}`;

          return (
            <div
              className={`mod-row-shell${isActive ? " is-active" : ""}${
                isExpanded ? " is-expanded" : ""
              }`}
              key={mod.id}
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <button
                className="mod-row-button"
                type="button"
                aria-expanded={isExpanded}
                aria-controls={detailId}
                onClick={() => toggleMod(index)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
              >
                <span className="mod-row-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{mod.name}</strong>
                <span className="mod-row-cue" aria-hidden>
                  {isExpanded ? "×" : "+"}
                </span>
              </button>

              <div
                className="mod-inline-details"
                id={detailId}
                aria-hidden={!isExpanded}
              >
                <p>{mod.description}</p>
                {mod.workshopUrl ? (
                  <a
                    href={mod.workshopUrl}
                    target="_blank"
                    rel="noreferrer"
                    tabIndex={isExpanded ? 0 : -1}
                  >
                    Steam 创意工坊 <span aria-hidden>↗</span>
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
