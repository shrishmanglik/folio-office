import { useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';

export type CanvasThemeId = 'void' | 'paper' | 'contrast' | 'daltonic';

export interface CanvasThemeDef {
  id: CanvasThemeId;
  name: string;
  note: string;
  ground: string;
  surface: string;
  ink: string;
  accent: string;
  swatches: [string, string, string];
}

export const CANVAS_THEMES: readonly CanvasThemeDef[] = [
  {
    id: 'void',
    name: 'Obsidian Void',
    note: 'Deep carved slate, warm ivory type, and warm brass light',
    ground: '#0A0A0E',
    surface: '#12131A',
    ink: '#F5F2EB',
    accent: '#D4A853',
    swatches: ['#0A0A0E', '#F5F2EB', '#D4A853'],
  },
  {
    id: 'paper',
    name: 'Warm Archival Paper',
    note: 'Archival cream paper, espresso ink, and terracotta paprika accents',
    ground: '#FAF5EE',
    surface: '#F3ECE1',
    ink: '#1C1512',
    accent: '#C84B31',
    swatches: ['#FAF5EE', '#1C1512', '#C84B31'],
  },
  {
    id: 'contrast',
    name: 'Terminal High Contrast',
    note: 'Pure pitch black, crisp white, and cyber yellow with zero blur haze',
    ground: '#000000',
    surface: '#0A0A0A',
    ink: '#FFFFFF',
    accent: '#FFE600',
    swatches: ['#000000', '#FFFFFF', '#FFE600'],
  },
  {
    id: 'daltonic',
    name: 'Maritime Sapphire Colour-Safe',
    note: 'Deep ocean navy, ice-white text, and sky cyan plus vermilion',
    ground: '#06162E',
    surface: '#0D2242',
    ink: '#F0F6FC',
    accent: '#56B4E9',
    swatches: ['#06162E', '#56B4E9', '#D55E00'],
  },
] as const;

const STORAGE_KEY = 'agi-theme';

function resolveInitialTheme(): CanvasThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as CanvasThemeId | null;
    if (saved && CANVAS_THEMES.some((t) => t.id === saved)) {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'paper';
}

export default function CanvasThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<CanvasThemeId>(resolveInitialTheme);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.dataset.theme = activeTheme;
    try {
      localStorage.setItem(STORAGE_KEY, activeTheme);
    } catch {
      // ignore storage errors
    }
  }, [activeTheme]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const current = CANVAS_THEMES.find((t) => t.id === activeTheme) || CANVAS_THEMES[1];

  return (
    <div
      ref={wrapRef}
      className="ags-theme-switcher"
      data-slot="root"
      data-active-theme={activeTheme}
    >
      <button
        type="button"
        className="ags-theme-switcher__trigger"
        data-testid="canvas-theme-switcher"
        data-theme-trigger={activeTheme}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="ags-theme-panel"
        aria-label={`Theme: ${current.name}. Choose reading atmosphere`}
        title={`Reading atmosphere: ${current.name}`}
        style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
        onClick={() => setOpen((v) => !v)}
      >
        <Eye size={16} aria-hidden="true" />
      </button>
      {open && (
        <div
          id="ags-theme-panel"
          role="dialog"
          aria-label="Choose reading atmosphere"
          className="ags-theme-switcher__panel"
          data-slot="panel"
        >
          <div
            role="radiogroup"
            aria-label="Reading atmosphere"
            className="ags-theme-switcher__list"
          >
            {CANVAS_THEMES.map((t) => {
              const selected = t.id === activeTheme;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-theme-option={t.id}
                  className={`ags-theme-switcher__option${selected ? ' is-selected' : ''}`}
                  onClick={() => {
                    setActiveTheme(t.id);
                    setOpen(false);
                  }}
                >
                  <span className="ags-theme-switcher__swatches" aria-hidden="true">
                    {t.swatches.map((hex) => (
                      <i key={hex} style={{ background: hex }} />
                    ))}
                  </span>
                  <span className="ags-theme-switcher__meta">
                    <span className="ags-theme-switcher__option-name">{t.name}</span>
                    <span className="ags-theme-switcher__option-note">{t.note}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
