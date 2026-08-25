// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronRight, ChevronLeft, Plus, User, Map, Sprout, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { buildApiUrl } from "@/lib/api-config";

const API_URL = buildApiUrl("");

type Step = "producer" | "parcel" | "production";

const STEP_META: Record<Step, { label: string; icon: any }> = {
  producer: { label: "Producteur", icon: User },
  parcel: { label: "Parcelle", icon: Map },
  production: { label: "Production", icon: Sprout },
};

export default function EntryWizard() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("producer");
  const [submitting, setSubmitting] = useState(false);
  const [producerId, setProducerId] = useState<number | null>(null);
  const [parcelId, setParcelId] = useState<number | null>(null);

  const [producer, setProducer] = useState({
    name: "",
    phone: "",
    gender: "",
    cin: "",
    region: "23",
    commune: "1",
  });
  const [parcel, setParcel] = useState({
    code: "",
    area: "",
    vanilla_plants: "",
    variety: "",
    soil_type: "",
    irrigation: false,
    latitude: "",
    longitude: "",
  });
  const [production, setProduction] = useState({
    harvest_date: "",
    weight_green: "",
    weight_prepared: "",
    pods_count: "",
    pods_grade_a: "",
    pods_grade_b: "",
    pods_grade_c: "",
    pods_rejected: "",
    quality_grade: "",
    sale_price: "",
  });

  const goNext = () => {
    if (step === "producer") setStep("parcel");
    else if (step === "parcel") setStep("production");
  };
  const goBack = () => {
    if (step === "parcel") setStep("producer");
    else if (step === "production") setStep("parcel");
  };

  const submitProducer = async () => {
    setSubmitting(true);
    try {
      const nameParts = producer.name.trim().split(/\s+/);
      const lastName = nameParts.shift() || "";
      const res = await fetch(buildApiUrl('/producers/'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_tokens") ? JSON.parse(localStorage.getItem("auth_tokens")!).access : ""}`,
        },
        body: JSON.stringify({
          last_name: lastName,
          first_name: nameParts.join(" ") || null,
          phone: producer.phone || null,
          region: Number(producer.region) || 23,
          commune: Number(producer.commune) || 1,
          status: "active",
        }),
      });
      if (!res.ok) {
        let msg = 'Échec de création producteur'
        try {
          const body = await res.json()
          msg = body.detail || body.error || JSON.stringify(body)
        } catch {
          // ignore
        }
        console.error('Producer create failed', res.status, msg)
        toast.error(msg)
        return
      }
      const createdProducer = await res.json();
      setProducerId(createdProducer.id);
      toast.success("Producteur créé");
      goNext();
    } catch (e) {
      console.error('Producer create exception', e)
      toast.error("Erreur lors de la création du producteur")
    } finally {
      setSubmitting(false);
    }
  };

  const submitParcel = async () => {
    if (!producerId) {
      toast.error("Créez d'abord le producteur")
      return
    }
    setSubmitting(true);
    try {
      const res = await fetch(buildApiUrl('/parcels/'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_tokens") ? JSON.parse(localStorage.getItem("auth_tokens")!).access : ""}`,
        },
        body: JSON.stringify({
          code: parcel.code,
          area: Number(parcel.area),
          vanilla_plants: Number(parcel.vanilla_plants) || 0,
          variety: parcel.variety ? Number(parcel.variety) : null,
          soil_type: parcel.soil_type || null,
          irrigation: parcel.irrigation,
          latitude: parcel.latitude ? Number(parcel.latitude) : null,
          longitude: parcel.longitude ? Number(parcel.longitude) : null,
          producer: producerId,
          status: "active",
        }),
      });
      if (!res.ok) throw new Error("Échec de création parcelle");
      const createdParcel = await res.json();
      setParcelId(createdParcel.id);
      toast.success("Parcelle créée");
      goNext();
    } catch (e) {
      toast.error("Erreur lors de la création de la parcelle");
    } finally {
      setSubmitting(false);
    }
  };

  const submitProduction = async () => {
    if (!parcelId) {
      toast.error("Créez d'abord la parcelle")
      return
    }
    setSubmitting(true);
    try {
      const seasonResponse = await fetch(buildApiUrl('/seasons/current/'), {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_tokens") ? JSON.parse(localStorage.getItem("auth_tokens")!).access : ""}` },
      });
      if (!seasonResponse.ok) throw new Error("Aucune saison courante configurée");
      const season = await seasonResponse.json();
      const res = await fetch(buildApiUrl('/productions/'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_tokens") ? JSON.parse(localStorage.getItem("auth_tokens")!).access : ""}`,
        },
        body: JSON.stringify({
          code: `PROD-${Date.now()}`,
          parcel: parcelId,
          season: season.id,
          harvest_date: production.harvest_date,
          weight_green: Number(production.weight_green) || 0,
          weight_prepared: production.weight_prepared ? Number(production.weight_prepared) : null,
          pods_count: Number(production.pods_count) || 0,
          pods_grade_a: Number(production.pods_grade_a) || 0,
          pods_grade_b: Number(production.pods_grade_b) || 0,
          pods_grade_c: Number(production.pods_grade_c) || 0,
          pods_rejected: Number(production.pods_rejected) || 0,
          quality_grade: production.quality_grade ? Number(production.quality_grade) : null,
          sale_price: production.sale_price ? Number(production.sale_price) : null,
          status: "harvested",
        }),
      });
      if (!res.ok) throw new Error("Échec de création production");
      toast.success("Production enregistrée");
      setStep("producer");
      setProducerId(null);
      setParcelId(null);
      setProducer({ name: "", phone: "", gender: "", cin: "", region: "23", commune: "1" });
      setParcel({ code: "", area: "", vanilla_plants: "", variety: "", soil_type: "", irrigation: false, latitude: "", longitude: "" });
      setProduction({
        harvest_date: "",
        weight_green: "",
        weight_prepared: "",
        pods_count: "",
        pods_grade_a: "",
        pods_grade_b: "",
        pods_grade_c: "",
        pods_rejected: "",
        quality_grade: "",
        sale_price: "",
      });
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement de la production");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (step === "producer") submitProducer();
    else if (step === "parcel") submitParcel();
    else if (step === "production") submitProduction();
  };

  const currentStepIndex = ["producer", "parcel", "production"].indexOf(step);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0a1628]">Nouvelle saisie</h1>
        <p className="text-sm text-[#5a7a9a] mt-1">Producteur → Parcelle → Production</p>
      </div>

      <div className="mb-6 flex items-center justify-between rounded-full bg-white/70 p-1.5 border border-[#e8f4fc]">
        {(["producer", "parcel", "production"] as Step[]).map((s, idx) => {
          const Icon = STEP_META[s].icon;
          const active = idx === currentStepIndex;
          const done = idx < currentStepIndex;
          return (
            <div key={s} className="flex items-center gap-2 flex-1 justify-center">
              <div
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                  active ? "border-[#4a90c2] bg-[#4a90c2] text-white" : done ? "border-emerald-500 bg-emerald-500 text-white" : "border-[#e8f4fc] bg-white text-[#5a7a9a]",
                ].join(" ")}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={["text-xs font-medium", active ? "text-[#0a1628]" : "text-[#5a7a9a]"]}>{STEP_META[s].label}</span>
              {idx < 2 && <ChevronRight className="h-4 w-4 text-[#5a7a9a]/60 mx-1" />}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#e8f4fc] bg-white shadow-sm">
        <div className="border-b border-[#e8f4fc] px-6 py-4">
          <h2 className="text-base font-semibold text-[#0a1628]">Étape {currentStepIndex + 1} : {STEP_META[step].label}</h2>
          <p className="text-xs text-[#5a7a9a] mt-1">Renseignez les informations ci-dessous.</p>
        </div>
        <div className="px-6 py-5">
          {step === "producer" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-[#5a7a9a]">Nom complet *</label>
                <Input value={producer.name} onChange={(e) => setProducer({ ...producer, name: e.target.value })} placeholder="Ex: RAKOTO Jean" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Téléphone</label>
                <Input value={producer.phone} onChange={(e) => setProducer({ ...producer, phone: e.target.value })} placeholder="Ex: +261 34 000 000" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Genre</label>
                <Input value={producer.gender} onChange={(e) => setProducer({ ...producer, gender: e.target.value })} placeholder="M / F" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">CIN</label>
                <Input value={producer.cin} onChange={(e) => setProducer({ ...producer, cin: e.target.value })} placeholder="Ex: 123456789012" />
              </div>
            </div>
          )}

          {step === "parcel" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Code parcelle *</label>
                <Input value={parcel.code} onChange={(e) => setParcel({ ...parcel, code: e.target.value })} placeholder="Ex: PAR-001" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Superficie (ha) *</label>
                <Input value={parcel.area} onChange={(e) => setParcel({ ...parcel, area: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Nb pieds vanille</label>
                <Input value={parcel.vanilla_plants} onChange={(e) => setParcel({ ...parcel, vanilla_plants: e.target.value })} placeholder="Ex: 800" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Variété</label>
                <Input value={parcel.variety} onChange={(e) => setParcel({ ...parcel, variety: e.target.value })} placeholder="Ex: 1" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Type de sol</label>
                <Input value={parcel.soil_type} onChange={(e) => setParcel({ ...parcel, soil_type: e.target.value })} placeholder="volcanic / loamy / sandy / clay" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Latitude</label>
                <Input value={parcel.latitude} onChange={(e) => setParcel({ ...parcel, latitude: e.target.value })} placeholder="-18.8792" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Longitude</label>
                <Input value={parcel.longitude} onChange={(e) => setParcel({ ...parcel, longitude: e.target.value })} placeholder="47.5079" />
              </div>
            </div>
          )}

          {step === "production" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Date de récolte *</label>
                <Input type="date" value={production.harvest_date} onChange={(e) => setProduction({ ...production, harvest_date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Poids vert (kg)</label>
                <Input value={production.weight_green} onChange={(e) => setProduction({ ...production, weight_green: e.target.value })} placeholder="Ex: 120" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Poids préparé (kg)</label>
                <Input value={production.weight_prepared} onChange={(e) => setProduction({ ...production, weight_prepared: e.target.value })} placeholder="Ex: 45" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Nombre de gousses</label>
                <Input value={production.pods_count} onChange={(e) => setProduction({ ...production, pods_count: e.target.value })} placeholder="Ex: 300" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Gousses Grade A</label>
                <Input value={production.pods_grade_a} onChange={(e) => setProduction({ ...production, pods_grade_a: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Gousses Grade B</label>
                <Input value={production.pods_grade_b} onChange={(e) => setProduction({ ...production, pods_grade_b: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Gousses Grade C</label>
                <Input value={production.pods_grade_c} onChange={(e) => setProduction({ ...production, pods_grade_c: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Gousses rejetées</label>
                <Input value={production.pods_rejected} onChange={(e) => setProduction({ ...production, pods_rejected: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Grade qualité</label>
                <Input value={production.quality_grade} onChange={(e) => setProduction({ ...production, quality_grade: e.target.value })} placeholder="Ex: 1" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5a7a9a]">Prix de vente (€)</label>
                <Input value={production.sale_price} onChange={(e) => setProduction({ ...production, sale_price: e.target.value })} placeholder="Ex: 250000" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={goBack} disabled={step === "producer" || submitting} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Retour
        </Button>
        <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {step === "production" ? "Enregistrer la production" : "Étape suivante"}
        </Button>
      </div>
    </div>
  );
}
