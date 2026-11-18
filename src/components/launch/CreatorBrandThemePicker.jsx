import { useState } from 'react'
import { Palette, Check, Sparkles, X, Sliders } from 'lucide-react'
import { CREATOR_THEMES, resolveCreatorTheme } from '../../utils/creatorTheme'
import { updateCoLaunchProject } from '../../services/opsApi'

export default function CreatorBrandThemePicker({
  project,
  currentTheme,
  onThemeSelect,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const activeTheme = currentTheme || resolveCreatorTheme(
    project?.brandColor || project?.colorTheme || project?.selectedConcept?.brandColor,
    project?.niche,
    project?.productName
  )

  const handleSelectTheme = async (theme) => {
    onThemeSelect?.(theme)
    setIsOpen(false)

    if (project?.id) {
      setIsSaving(true)
      try {
        await updateCoLaunchProject(project.id, {
          brandColor: theme.primaryHex,
          colorTheme: theme.id,
        })
        // Dispatch window event so other views stay in sync
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('forge_theme_changed', { detail: theme }))
        }
      } catch (err) {
        console.warn('[CreatorBrandThemePicker] Save theme notice:', err)
      } finally {
        setIsSaving(false)
      }
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#0C0C0E] hover:bg-[#111114] border border-[#2a2a30] text-xs font-semibold text-[#D4D4D8] shadow-2xs transition-all cursor-pointer active:scale-95"
        title="Creator Brand Palette (Decided by AI or Admin)"
      >
        <span
          className="w-3.5 h-3.5 rounded-full shadow-2xs border border-[#2a2a30]/80 shrink-0"
          style={{ backgroundColor: activeTheme.primaryHex }}
        />
        <span className="hidden sm:inline font-bold text-[#E4E4E7] text-[11px] truncate max-w-[100px]">
          {activeTheme.name}
        </span>
        <Palette className="w-3.5 h-3.5 text-[#71717A]" />
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#0C0C0E] rounded-2xl border border-[#2a2a30] shadow-2xl p-3 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1C1C20]">
              <div className="flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#A1A1AA]" />
                <span className="text-xs font-extrabold text-[#FAFAFA]">Brand Color & Theme</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
                AI / Admin
              </span>
            </div>

            <p className="text-[11px] text-[#A1A1AA] mb-2.5 leading-relaxed">
              Theme chosen for this creator's dashboard, ensuring crystal-clear readability and matching venture identity.
            </p>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5 scrollbar-thin">
              {CREATOR_THEMES.map((theme) => {
                const isSelected = activeTheme.id === theme.id || activeTheme.primaryHex.toLowerCase() === theme.primaryHex.toLowerCase()
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme)}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#111114] border-[#3a3a42] shadow-2xs'
                        : 'bg-[#0C0C0E] hover:bg-[#111114]/80 border-transparent hover:border-[#2a2a30]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-5 h-5 rounded-full border border-black/10 shrink-0 shadow-2xs flex items-center justify-center text-white"
                        style={{ backgroundColor: theme.primaryHex }}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#FAFAFA] truncate flex items-center gap-1.5">
                          <span>{theme.name}</span>
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold"
                            style={{
                              backgroundColor: theme.badgeBg,
                              color: theme.badgeText,
                              borderColor: theme.badgeBorder,
                            }}
                          >
                            {theme.primaryHex}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#A1A1AA] truncate">
                          {theme.subtitle}
                        </div>
                      </div>
                    </div>

                    {/* Preview Swatch Pill */}
                    <div
                      className="px-2 py-0.5 rounded text-[10px] font-bold border shrink-0"
                      style={{
                        backgroundColor: theme.bgCanvas,
                        color: theme.textHeading,
                        borderColor: theme.borderCard,
                      }}
                    >
                      Aa
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
