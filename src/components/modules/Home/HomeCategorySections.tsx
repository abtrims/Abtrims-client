"use client";

import { useQuery } from "@tanstack/react-query";
import { getHomepageCategorySections } from "@/services/homeCategorySection.services";
import ProductCard from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import SectionTitle from "@/components/shared/SectionTitle";

export default function HomeCategorySections() {
  const { data, isLoading } = useQuery({
    queryKey: ["homepage-category-sections"],
    queryFn: () => getHomepageCategorySections(),
    staleTime: 10 * 60 * 1000,
  });

  const sections = data?.data || [];

  if (isLoading) {
    return (
      <section className="py-10 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const visibleSections = sections.filter(
    (section) => section.products && section.products.length > 0,
  );

  if (visibleSections.length === 0) {
    return null;
  }

  return (
    <>
      {visibleSections.map((section) => (
        <section key={section.id} className="py-10">
          <div className="flex items-center justify-between gap-4 mb-6">
            <SectionTitle title={section.category.name} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {section.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
