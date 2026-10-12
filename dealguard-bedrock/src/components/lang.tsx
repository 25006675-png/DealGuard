"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toLang, tr } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

type Translate = (text: string, vars?: Record<string, string | number>) => string;

// Outside a provider (the landing page) everything stays in English.
const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void; t: Translate }>({
  lang: "en",
  setLang: () => {},
  t: (text, vars) => tr("en", text, vars),
});

export const useLang = () => useContext(LangContext);

const LANG_KEY = "dealguard.lang";

// The language is a per-device preference; storage can be unavailable, so fall back quietly.
function loadLang(): Lang {
  try {
    return toLang(window.localStorage.getItem(LANG_KEY));
  } catch {
    return "en";
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang);

  const setLang = useCallback((next: Lang) => {
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      // storage unavailable: the choice still applies to this session
    }
    setLangState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: ((text, vars) => tr(lang, text, vars)) as Translate }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
