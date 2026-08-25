"use client"

import { useEffect, useState } from "react"
import { Loader2, PackageCheck, RefreshCw, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { parcelsApi, type RegisterDelivery } from "@/lib/api"
import { toast } from "sonner"

export function DeliveriesPage() {
    const [deliveries, setDeliveries] = useState<RegisterDelivery[]>([])
    const [loading, setLoading] = useState(true)

    const loadDeliveries = async () => {
        setLoading(true)
        try {
            setDeliveries(await parcelsApi.registerDeliveries())
        } catch (error: any) {
            toast.error(error?.message || "Impossible de charger les livraisons")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadDeliveries() }, [])

    const total = deliveries.reduce((sum, delivery) => sum + Number(delivery.quantity || 0), 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Livraisons du registre</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Quantités explicitement livrées au groupe dans le registre réel.</p>
                </div>
                <Button variant="outline" onClick={loadDeliveries} disabled={loading} aria-label="Actualiser les livraisons">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Card><CardContent className="flex items-center gap-3 p-5"><Truck className="h-6 w-6 text-primary" /><div><p className="text-sm text-muted-foreground">Livraisons enregistrées</p><p className="text-2xl font-semibold">{loading ? "..." : deliveries.length}</p></div></CardContent></Card>
                <Card><CardContent className="flex items-center gap-3 p-5"><PackageCheck className="h-6 w-6 text-emerald-600" /><div><p className="text-sm text-muted-foreground">Quantité totale</p><p className="text-2xl font-semibold">{loading ? "..." : `${total.toFixed(3)} kg`}</p></div></CardContent></Card>
            </div>

            <Card><CardHeader><CardTitle>Relevés de livraison</CardTitle></CardHeader><CardContent>
                {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : deliveries.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">Aucune quantité livrée n&apos;est renseignée dans le fichier Excel.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Producteur</th><th className="p-3">Parcelle</th><th className="p-3">Culture</th><th className="p-3 text-right">Quantité</th></tr></thead><tbody>{deliveries.map((delivery) => <tr key={delivery.id} className="border-b"><td className="p-3"><div className="font-medium">{delivery.producer_name}</div><div className="text-xs text-muted-foreground">{delivery.producer_code}</div></td><td className="p-3">{delivery.parcel_code}</td><td className="p-3">{delivery.crop_slot}</td><td className="p-3 text-right font-medium">{Number(delivery.quantity).toFixed(3)} {delivery.unit}</td></tr>)}</tbody></table></div>}
            </CardContent></Card>
        </div>
    )
}
