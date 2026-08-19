"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const storageKey = "surya-theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const enabled = saved ? saved === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", enabled);
    setDark(enabled);
  }, []);

  const setTheme = (enabled: boolean) => {
    document.documentElement.classList.toggle("dark", enabled);
    localStorage.setItem(storageKey, enabled ? "dark" : "light");
    setDark(enabled);
  };

  return <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900" aria-label="Theme options"><button type="button" onClick={() => setTheme(false)} className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold ${!dark ? "bg-white text-[#1473e6] shadow-sm dark:bg-slate-700" : "text-slate-500 dark:text-slate-400"}`} aria-pressed={!dark} title="Light mode"><Sun size={14} />Light</button><button type="button" onClick={() => setTheme(true)} className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold ${dark ? "bg-slate-700 text-teal-300 shadow-sm" : "text-slate-500 dark:text-slate-400"}`} aria-pressed={dark} title="Dark mode"><Moon size={14} />Dark</button></div>;
}
