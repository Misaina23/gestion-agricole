"use client"

import { Truck } from "lucide-react"

export function DeliveriesPage() {
    return (
        <div className="flex min-h-[420px] items-center justify-center">
            <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#e8f4fc]">
                    <Truck className="h-7 w-7 text-[#1e3a5f]" />
                </div>
                <h1 className="text-2xl font-semibold text-foreground">Livraisons</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Le module Livraisons n&apos;est pas encore disponible dans l&apos;API.
                </p>
            </div>
        </div>
    )
}
