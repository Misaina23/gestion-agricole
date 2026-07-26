"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"

interface SearchResult {
  id: number
  name?: string
  code?: string
  type: string
}

export function GlobalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Record<string, SearchResult[]> | null>(null)
  const [open, setOpen] = useState(false)

  const { t } = useLanguage()

  const handleSearch = async (value: string) => {
    setQuery(value)
    if (value.length >= 2) {
      try {
        const res = await apiFetch<{ results: Record<string, SearchResult[]> }>(`/search/?q=${encodeURIComponent(value)}`)
        setResults(res.results)
        setOpen(true)
      } catch {
        setResults(null)
      }
    } else {
      setResults(null)
      setOpen(false)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      producer: t("producer"),
      parcel: t("parcels"),
      production: t("production"),
      inspection: t("inspections"),
      region: t("region"),
    }
    return labels[type] || type
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
        <input
          type="search"
          placeholder={t("quickSearch")}
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => query && results && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="pl-10 pr-10 py-2 w-64 rounded-lg border border-[#e8f4fc] bg-white text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setResults(null)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="w-4 h-4 text-[#5a7a9a]" />
          </button>
        )}
      </div>

      {open && results && (
        <div className="absolute top-full mt-2 w-80 bg-white rounded-lg border border-[#e8f4fc] shadow-lg z-50 max-h-96 overflow-y-auto">
          {Object.entries(results).map(([type, items]) =>
            items.length > 0 ? (
              <div key={type} className="p-2 border-b border-[#e8f4fc] last:border-0">
                <div className="text-xs font-semibold text-[#5a7a9a] mb-1">{getTypeLabel(type)}</div>
                {items.map(item => (
                  <div key={item.id} className="px-2 py-1 rounded hover:bg-[#f0f7ff] cursor-pointer text-sm">
                    {item.name || item.code}
                  </div>
                ))}
              </div>
            ) : null
          )}
          {Object.values(results).flat().length === 0 && (
            <div className="p-4 text-center text-sm text-[#5a7a9a]">{t("noResults")}</div>
          )}
        </div>
      )}
    </div>
  )
}