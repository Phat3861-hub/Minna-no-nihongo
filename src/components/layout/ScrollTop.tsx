"use client";

import { useEffect, useState } from "react";
import { IconUp } from "../icons";

/** Nút nổi “lên đầu trang”, hiện khi đã cuộn xuống */
export default function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      className={"to-top" + (show ? "" : " hide")}
      aria-label="Cuộn lên đầu trang"
      tabIndex={show ? 0 : -1}
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
    >
      <IconUp />
    </button>
  );
}
