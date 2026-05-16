"use client";

import confetti from "canvas-confetti";

export function celebrate(intensity: "small" | "medium" | "big" = "medium") {
  const count = intensity === "small" ? 60 : intensity === "big" ? 250 : 130;
  const defaults = {
    spread: 70,
    ticks: 80,
    gravity: 0.9,
    decay: 0.94,
    startVelocity: 35,
    colors: ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#fbbf24"],
  };
  confetti({ ...defaults, particleCount: count, origin: { x: 0.2, y: 0.7 } });
  confetti({ ...defaults, particleCount: count, origin: { x: 0.8, y: 0.7 } });
  if (intensity === "big") {
    setTimeout(() => {
      confetti({ ...defaults, particleCount: 200, origin: { x: 0.5, y: 0.4 }, scalar: 1.3 });
    }, 250);
  }
}

export function levelUpBurst() {
  const end = Date.now() + 1500;
  const colors = ["#fbbf24", "#f59e0b", "#ec4899", "#8b5cf6"];
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
