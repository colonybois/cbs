const HEADER_GAP = 12;

export function stickyHeaderOffset() {
  const header = document.querySelector("header");
  return (header?.getBoundingClientRect().height ?? 72) + HEADER_GAP;
}

export function smoothScrollToId(id: string) {
  const element = document.getElementById(id);
  if (!element) return false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = Math.max(
    0,
    element.getBoundingClientRect().top + window.scrollY - stickyHeaderOffset(),
  );
  window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
  if (window.location.hash !== `#${id}`) {
    history.replaceState(null, "", `#${id}`);
  }
  return true;
}

export function smoothScrollToTop() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  if (window.location.hash) history.replaceState(null, "", window.location.pathname);
}
