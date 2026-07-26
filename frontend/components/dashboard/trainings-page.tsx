"use client"

import { useState, useEffect } from "react"
import { Training, trainingsApi } from "@/lib/api"
import { Loader2, BookOpen, Calendar, MapPin, Users, Award, ClipboardList } from "lucide-react"

export function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    Promise.all([
      trainingsApi.list(),
      trainingsApi.stats().catch(() => null),
    ]).then(([listRes, statsRes]) => {
      setTrainings(listRes.results || [])
      setStats(statsRes)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const total = trainings.length
  const upcoming = trainings.filter(t => new Date(t.training_date) >= new Date()).length
  const totalCapacity = trainings.reduce((acc, t) => acc + (t.max_participants || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-[#1e3a5f]" />
        <h1 className="text-2xl font-bold text-[#0a1628]">Formations</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#e8f4fc] bg-card/95 p-4 dark:border-border dark:bg-card/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">Total Formations</p>
              <p className="text-2xl font-bold text-[#0a1628]">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e8f4fc] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">A venir</p>
              <p className="text-2xl font-bold text-[#0a1628]">{upcoming}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e8f4fc] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">Capacite totale</p>
              <p className="text-2xl font-bold text-[#0a1628]">{totalCapacity}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e8f4fc] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">Avec lieu défini</p>
              <p className="text-2xl font-bold text-[#0a1628]">{trainings.filter(t => t.location).length}</p>
            </div>
          </div>
        </div>
      </div>

      {trainings.length === 0 ? (
        <div className="rounded-xl border border-[#c5ddf5] bg-card/95 p-8 text-center dark:border-border dark:bg-card/95">
          <BookOpen className="w-12 h-12 text-[#5a7a9a] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#0a1628] mb-2">Aucune formation planifiée</h3>
          <p className="text-sm text-[#5a7a9a] mb-4">
            Planifiez des formations pour renforcer les capacités des producteurs. Le lieu et le formateur seront affichés ici.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-[#5a7a9a]">
            <MapPin className="w-4 h-4" />
            <span>Localisation et fiche de présence intégrées</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainings.map(training => (
            <div key={training.id} className="rounded-xl border border-[#e8f4fc] bg-card/95 p-5 dark:border-border dark:bg-card/95">
              <h3 className="font-semibold text-[#0a1628]">{training.title}</h3>
              <p className="text-sm text-[#5a7a9a] mt-1">{training.subject}</p>

              {training.location && (
                <div className="mt-3 flex items-center gap-2 text-sm text-[#1e3a5f]">
                  <MapPin className="w-4 h-4" />
                  <span>{training.location}</span>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-sm text-[#5a7a9a]">
                <Calendar className="w-4 h-4" />
                <span>{new Date(training.training_date).toLocaleDateString()}</span>
              </div>

              {training.trainer_name && (
                <div className="mt-2 flex items-center gap-2 text-sm text-[#5a7a9a]">
                  <ClipboardList className="w-4 h-4" />
                  <span>{training.trainer_name}</span>
                </div>
              )}

              {training.max_participants && (
                <div className="mt-2 flex items-center gap-2 text-sm text-[#5a7a9a]">
                  <Users className="w-4 h-4" />
                  <span>{training.max_participants} participants max</span>
                </div>
              )}

              {training.evaluation_criteria && Object.keys(training.evaluation_criteria).length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#e8f4fc]">
                  <div className="flex items-center gap-2 text-sm text-[#5a7a9a]">
                    <Award className="w-4 h-4" />
                    <span>{Object.keys(training.evaluation_criteria).length} critère(s) d'évaluation</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
