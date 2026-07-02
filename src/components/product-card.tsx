import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import type { Product } from "@/lib/products.functions";

function discount(p: Product): number | null {
  if (!p.original_price || p.original_price <= p.price) return null;
  return Math.round((1 - p.price / p.original_price) * 100);
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const d = discount(product);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
    >
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/60 hover:shadow-[0_10px_40px_-15px_oklch(0.72_0.2_45/0.35)] transition"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">brak zdjęcia</div>
        )}
        {d !== null && (
          <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-bold px-2.5 py-1 rounded-full">
            -{d}%
          </span>
        )}
        {product.quality && (
          <span className="absolute top-3 right-3 bg-background/80 backdrop-blur text-foreground text-xs font-semibold px-2.5 py-1 rounded-full border border-border">
            {product.quality}
          </span>
        )}
        {product.is_verified && (
          <span
            title="Zweryfikowany przez USFinds"
            className="absolute bottom-3 left-3 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow"
          >
            <BadgeCheck className="w-3 h-3" /> Verified
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition inline-flex items-center gap-1.5">
          <span className="line-clamp-2">{product.name}</span>
          {product.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold">{Number(product.price).toFixed(2)} zł</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {Number(product.original_price).toFixed(2)} zł
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-muted-foreground capitalize">
          {product.category}
          {product.batch ? ` • ${product.batch}` : ""}
        </div>
      </div>
    </Link>
    </motion.div>
  );
}