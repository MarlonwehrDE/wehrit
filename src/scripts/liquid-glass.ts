import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const supportsHover = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
).matches;

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

function initCursorTracking() {
  if (!supportsHover) return;

  const interactiveElements: Set<HTMLElement> = new Set();
  let rafId = 0;
  let mouseX = 0;
  let mouseY = 0;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          interactiveElements.add(el);
        } else {
          interactiveElements.delete(el);
          el.style.setProperty("--light-opacity", "0");
        }
      });
    },
    { threshold: 0 }
  );

  document
    .querySelectorAll<HTMLElement>(".glass-interactive")
    .forEach((el) => observer.observe(el));

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      interactiveElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const x = ((mouseX - rect.left) / rect.width) * 100;
        const y = ((mouseY - rect.top) / rect.height) * 100;
        const isInside =
          mouseX >= rect.left &&
          mouseX <= rect.right &&
          mouseY >= rect.top &&
          mouseY <= rect.bottom;

        el.style.setProperty("--x", `${x}%`);
        el.style.setProperty("--y", `${y}%`);
        el.style.setProperty("--light-opacity", isInside ? "1" : "0");

        if (isInside) {
          el.style.setProperty("--specular-x", `${x}%`);
        }
      });
      rafId = 0;
    });
  });
}

function initMagneticHover() {
  if (!supportsHover || prefersReducedMotion) return;

  document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic || "0.12");

    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (e.clientX - centerX) * strength;
      const dy = (e.clientY - centerY) * strength;

      gsap.to(el, {
        x: dx,
        y: dy,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    el.addEventListener("mouseleave", () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.4)",
        overwrite: "auto",
      });
    });
  });
}

function initScrollReveal() {
  if (prefersReducedMotion) {
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      el.classList.add("revealed");
    });
    return;
  }

  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    const hasStagger = el.hasAttribute("data-reveal-stagger");

    if (hasStagger) {
      Array.from(el.children).forEach((child, i) => {
        (child as HTMLElement).style.setProperty("--reveal-index", String(i));
      });
    }

    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => el.classList.add("revealed"),
    });
  });
}

function initRipple() {
  document.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-ripple]"
    );
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple-circle";
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    target.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });
}

function initTiltCards() {
  if (!supportsHover || prefersReducedMotion) return;

  document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
    const maxTilt = parseFloat(el.dataset.tilt || "8");
    const wrap = el.closest<HTMLElement>(".glass-tilt-wrap") || el;

    wrap.addEventListener("mousemove", (e) => {
      const rect = wrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(el, {
        rotateY: x * maxTilt,
        rotateX: -y * maxTilt,
        y: -3,
        scale: 1.02,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });

      const specX = 50 - x * 40;
      el.style.setProperty("--specular-x", `${specX}%`);

      const tiltDist = Math.sqrt(x * x + y * y);
      const fresnelBoost = 1 + tiltDist * 0.8;
      el.style.setProperty(
        "--glass-fresnel-opacity",
        `${0.1 * fresnelBoost}`
      );
    });

    wrap.addEventListener("mouseleave", () => {
      gsap.to(el, {
        rotateY: 0,
        rotateX: 0,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
        overwrite: "auto",
      });

      el.style.setProperty("--specular-x", "50%");
      el.style.removeProperty("--glass-fresnel-opacity");
    });
  });
}

function initMeshParallax() {
  if (prefersReducedMotion) return;

  document.querySelectorAll<HTMLElement>(".mesh-layer").forEach((el, i) => {
    const speed = 0.15 + i * 0.1;

    ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        gsap.set(el, {
          y: self.progress * 100 * speed - 50 * speed,
        });
      },
    });
  });
}

function init() {
  initCursorTracking();
  initMagneticHover();
  initScrollReveal();
  initRipple();
  initTiltCards();
  initMeshParallax();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
