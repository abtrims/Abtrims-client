"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Eye, Package } from "lucide-react";
import { getAllProducts } from "@/services/product.services";
import { IProduct } from "@/components/modules/Admin/Product/productColumns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import SectionTitle from "@/components/shared/SectionTitle";

const CARD_COUNT = 8;

const formatPrice = (value: number) =>
  `৳${Math.round(value).toLocaleString("en-US")}`;

// Horizontal card: image on the left, name, price and "View Details" on the right
function TopSellingCard({ product }: { product: IProduct }) {
  const href = `/products/${product.slug}`;
  const hasDiscount = product.regularPrice > product.sellPrice;

  return (
    <div className="group flex h-full items-center gap-3 rounded-xl border border-sky-200 bg-card p-3 transition-all hover:border-primary/50 hover:shadow-lg dark:border-slate-700">
      <Link
        href={href}
        className="relative aspect-square w-2/5 shrink-0 overflow-hidden rounded-lg bg-white"
      >
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 12vw, (min-width: 768px) 20vw, 40vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Link href={href}>
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors hover:text-primary">
            {product.name}
          </h3>
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-extrabold text-foreground">
            {formatPrice(product.sellPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.regularPrice)}
            </span>
          )}
        </div>

        <Link
          href={href}
          className="mt-1 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border-2 border-primary bg-transparent text-xs font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Eye className="h-4 w-4" />
          View Details
        </Link>
      </div>
    </div>
  );
}

export default function TopSellingProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ["products", "highlight", "TOP_SELLING"],
    queryFn: () =>
      getAllProducts({ highlight: "TOP_SELLING", limit: String(CARD_COUNT), view: "card" }),
    staleTime: 10 * 60 * 1000,
  });

  const products: IProduct[] = (data?.data || []).slice(0, CARD_COUNT);

  if (!isLoading && products.length === 0) return null;

  return (
    <section aria-label="Top selling products">
      <div className="mb-6 flex items-center justify-between gap-4">
        <SectionTitle title="Top Selling Products" />
        <Link
          href="/products?highlight=TOP_SELLING"
          className="hidden shrink-0 sm:block"
        >
          <Button
            variant="ghost"
            className="font-semibold text-primary hover:bg-primary/5"
          >
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* 4 per row on wide screens (2 rows of 4), 2 on tablets, 1 on phones */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: CARD_COUNT }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border p-3"
              >
                <Skeleton className="aspect-square w-2/5 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))
          : products.map((product) => (
              <TopSellingCard key={product.id} product={product} />
            ))}
      </div>
    </section>
  );
}
