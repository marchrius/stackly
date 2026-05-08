import Link from "next/link";
import { Badge } from "@stackly/ui";
import { ExternalLink, Heart, Image, Layers, Package } from "lucide-react";
import { getUploadUrl } from "@stackly/lib";

interface PublicCollectionCardProps {
  href: string;
  title: string;
  image?: string | null;
  color?: string | null;
  meta?: string;
}

export function PublicCollectionCard({ href, title, image, color, meta }: PublicCollectionCardProps) {
  const uploadUrl = getUploadUrl(image);

  return (
    <Link href={href} className="group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <div className="relative flex aspect-[10/13] items-center justify-center overflow-hidden bg-muted">
        {uploadUrl ? (
          <img src={uploadUrl} alt={title} loading="lazy" className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105" />
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white"
            style={{ backgroundColor: color ? (color.startsWith("#") ? color : `#${color}`) : "#6366f1" }}
          >
            {title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate text-sm font-medium">{title}</p>
        {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
      </div>
    </Link>
  );
}

interface PublicItemCardProps {
  href: string;
  name: string;
  image?: string | null;
  quantity?: number;
}

export function PublicItemCard({ href, name, image, quantity }: PublicItemCardProps) {
  const uploadUrl = getUploadUrl(image);

  return (
    <Link href={href} className="group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <div className="relative flex aspect-[10/13] items-center justify-center overflow-hidden bg-muted">
        {uploadUrl ? (
          <img src={uploadUrl} alt={name} loading="lazy" className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105" />
        ) : (
          <Package className="h-9 w-9 text-muted-foreground opacity-50" />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <p className="truncate text-sm font-medium">{name}</p>
        {quantity && quantity > 1 ? <Badge variant="secondary">x{quantity}</Badge> : null}
      </div>
    </Link>
  );
}

interface PublicPhotoCardProps {
  title: string;
  image?: string | null;
}

export function PublicPhotoCard({ title, image }: PublicPhotoCardProps) {
  const uploadUrl = getUploadUrl(image);

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="relative flex aspect-[10/13] items-center justify-center overflow-hidden bg-muted">
        {uploadUrl ? (
          <img src={uploadUrl} alt={title} loading="lazy" className="max-h-full max-w-full object-contain" />
        ) : (
          <Image className="h-9 w-9 text-muted-foreground opacity-50" />
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{title}</p>
      </div>
    </div>
  );
}

interface PublicWishCardProps {
  name: string;
  image?: string | null;
  price?: string | null;
  currency?: string | null;
  url?: string | null;
}

export function PublicWishCard({ name, image, price, currency, url }: PublicWishCardProps) {
  const uploadUrl = getUploadUrl(image);
  const content = (
    <div className="group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <div className="relative flex aspect-[10/13] items-center justify-center overflow-hidden bg-muted">
        {uploadUrl ? (
          <img src={uploadUrl} alt={name} loading="lazy" className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105" />
        ) : (
          <Heart className="h-9 w-9 text-muted-foreground opacity-50" />
        )}
        {url ? (
          <span className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-foreground shadow-sm">
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate text-sm font-medium">{name}</p>
        {price ? <p className="text-xs text-muted-foreground">{[price, currency].filter(Boolean).join(" ")}</p> : null}
      </div>
    </div>
  );

  if (!url) return content;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      {content}
    </a>
  );
}

export function PublicGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-x-2.5 gap-y-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
      {children}
    </div>
  );
}

export function PublicCount({ icon, label }: { icon: "layers" | "items" | "photos" | "wishes"; label: string }) {
  const Icon = icon === "layers" ? Layers : icon === "items" ? Package : icon === "wishes" ? Heart : Image;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}
