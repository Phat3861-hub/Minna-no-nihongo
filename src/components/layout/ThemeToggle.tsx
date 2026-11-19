"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "../icons";

/** Đổi giao diện sáng / tối. Lựa chọn lưu ở localStorage "mnn.theme". */
export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
    const obs = new MutationObserver(() => setDark(document.documentElement.dataset.theme === "dark"));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const toggle = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("mnn.theme", JSON.stringify(next));
    } catch {
      /* bỏ qua */
    }
  };

  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}>
      {dark ? <IconSun /> : <IconMoon />}
    </button>
  );
}

/**
 * Đoạn script chạy trước khi trang hiển thị: đặt giao diện sáng/tối (tránh nháy màu),
 * đồng bộ khi đổi giao diện ở khung khác (chia đôi màn hình),
 * và đánh dấu "embedded" khi trang đang nằm trong khung chia đôi.
 */
export const themeScript = `(function(){var d=document.documentElement;function a(){try{var t=JSON.parse(localStorage.getItem("mnn.theme")||"null");if(t!=="light"&&t!=="dark")t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.dataset.theme=t}catch(e){d.dataset.theme="light"}}a();window.addEventListener("storage",function(e){if(e.key==="mnn.theme")a()});try{if(window.self!==window.top)d.classList.add("embedded")}catch(e){d.classList.add("embedded")}})();`;
