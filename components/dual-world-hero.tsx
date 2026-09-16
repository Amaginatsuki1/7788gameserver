"use client";

import { useEffect, useRef, type ReactNode } from "react";

type DualWorldHeroProps = {
  children: ReactNode;
};

export function DualWorldHero({ children }: DualWorldHeroProps) {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const easing = reduceMotion ? 1 : 0.12;
    let targetX = hero.clientWidth * 0.58;
    let targetY = hero.clientHeight * 0.52;
    let currentX = targetX;
    let currentY = targetY;
    let frameId = 0;
    let isVisible = false;
    let touchActive = false;

    const applyPosition = () => {
      hero.style.setProperty("--spotlight-x", `${currentX}px`);
      hero.style.setProperty("--spotlight-y", `${currentY}px`);
    };

    const animate = () => {
      currentX += (targetX - currentX) * easing;
      currentY += (targetY - currentY) * easing;
      applyPosition();

      const stillMoving =
        Math.abs(targetX - currentX) > 0.2 ||
        Math.abs(targetY - currentY) > 0.2;

      if (stillMoving) {
        frameId = window.requestAnimationFrame(animate);
      } else {
        currentX = targetX;
        currentY = targetY;
        applyPosition();
        frameId = 0;
      }
    };

    const wakeAnimation = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    const setTarget = (event: PointerEvent) => {
      const bounds = hero.getBoundingClientRect();
      targetX = event.clientX - bounds.left;
      targetY = event.clientY - bounds.top;

      if (!isVisible) {
        currentX = targetX;
        currentY = targetY;
        applyPosition();
        isVisible = true;
        hero.dataset.spotlight = "visible";
      }

      wakeAnimation();
    };

    const hideSpotlight = () => {
      isVisible = false;
      hero.dataset.spotlight = "hidden";
    };

    const handlePointerEnter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") {
        setTarget(event);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && !touchActive) {
        return;
      }

      setTarget(event);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        touchActive = true;
        setTarget(event);
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        touchActive = false;
        hideSpotlight();
      }
    };

    const handlePointerLeave = (event: PointerEvent) => {
      if (event.pointerType === "mouse") {
        hideSpotlight();
      }
    };

    const handleResize = () => {
      targetX = Math.min(targetX, hero.clientWidth);
      targetY = Math.min(targetY, hero.clientHeight);
      currentX = Math.min(currentX, hero.clientWidth);
      currentY = Math.min(currentY, hero.clientHeight);
      applyPosition();
    };

    applyPosition();
    hero.dataset.interactionReady = "true";
    hero.addEventListener("pointerenter", handlePointerEnter);
    hero.addEventListener("pointermove", handlePointerMove);
    hero.addEventListener("pointerdown", handlePointerDown);
    hero.addEventListener("pointerup", handlePointerUp);
    hero.addEventListener("pointercancel", handlePointerUp);
    hero.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", handleResize);

    return () => {
      hero.removeEventListener("pointerenter", handlePointerEnter);
      hero.removeEventListener("pointermove", handlePointerMove);
      hero.removeEventListener("pointerdown", handlePointerDown);
      hero.removeEventListener("pointerup", handlePointerUp);
      hero.removeEventListener("pointercancel", handlePointerUp);
      hero.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
      delete hero.dataset.interactionReady;
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <section
      className="hero hero-photo dual-world-hero"
      data-spotlight="hidden"
      ref={heroRef}
      aria-label="双世界互动场景：移动指针可从 Minecraft 揭示 Terraria"
    >
      <div className="dual-world-scene" aria-hidden="true">
        <img
          className="dual-world-image dual-world-base"
          src="/hero-minecraft-blue-hour.webp"
          alt=""
          draggable="false"
          fetchPriority="high"
          width={1983}
          height={793}
        />
        <div className="dual-world-reveal">
          <img
            className="dual-world-image"
            src="/hero-terraria-calamity-reveal.webp"
            alt=""
            draggable="false"
            fetchPriority="high"
            width={1983}
            height={793}
          />
        </div>
        <div className="dual-world-grade" />
      </div>
      {children}
    </section>
  );
}
