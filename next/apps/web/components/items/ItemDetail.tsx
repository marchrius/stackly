"use client";

import type { Item, Datum, Tag, Loan, Collection } from "@koillection/db";
import Link from "next/link";
import { Button, Badge } from "@koillection/ui";
import { Edit, Trash2, Box } from "lucide-react";
import { deleteItem } from "@/lib/actions/item.actions";

type ItemWithRelations = Item & {
  data: Datum[];
  tags: Tag[];
  loans: Loan[];
  collection: { id: string; title: string } | null;
};

export function ItemDetail({ item }: { item: ItemWithRelations }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {item.collection && (
              <Link href={`/collections/${item.collection.id}`} className="text-sm text-primary hover:underline">
                ← {item.collection.title}
              </Link>
            )}
            {item.quantity > 1 && <Badge variant="secondary">×{item.quantity}</Badge>}
            <Badge variant="outline">{item.visibility}</Badge>
            {item.tags.map((tag) => <Badge key={tag.id} variant="secondary">{tag.label}</Badge>)}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/items/${item.id}/edit`}><Edit className="mr-1 h-4 w-4" />Modifica</Link>
          </Button>
          <form action={deleteItem.bind(null, item.id)}>
            <Button variant="destructive" size="sm" type="submit"><Trash2 className="h-4 w-4" /></Button>
          </form>
        </div>
      </div>

      {/* Immagine */}
      {item.image && (
        <img src={`/uploads/${item.image}`} alt={item.name} className="max-h-72 rounded-lg object-contain border" />
      )}

      {/* Dati custom */}
      {item.data.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Dati</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {item.data.map((datum) => (
              <div key={datum.id} className="rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">{datum.label}</p>
                {datum.type === "image" && datum.image ? (
                  <img src={`/uploads/${datum.image}`} alt={datum.label ?? ""} className="max-h-40 rounded" />
                ) : datum.type === "checkbox" ? (
                  <span>{datum.value === "1" ? "✓ Sì" : "✗ No"}</span>
                ) : (
                  <p className="text-sm break-words">{datum.value ?? "—"}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prestiti attivi */}
      {item.loans.filter((l) => !l.returnedAt).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">In prestito a</h2>
          {item.loans.filter((l) => !l.returnedAt).map((loan) => (
            <p key={loan.id} className="text-sm">{loan.lentTo} — {new Date(loan.lentAt).toLocaleDateString()}</p>
          ))}
        </section>
      )}
    </div>
  );
}

