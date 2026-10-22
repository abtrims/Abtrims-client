/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllCategories } from "@/services/category.services";
import CategoryCircleRow from "@/components/modules/Category/CategoryCircleRow";
import CategorySlider from "./CategorySlider";

export default function CategorySection() {
  const { data, isLoading } = useQuery({
    // Own key: this asks for every top-level category, not the default 10
    queryKey: ["categories", "home-top-level"],
    queryFn: () => getAllCategories({ limit: "200" }),
    staleTime: 10 * 60 * 1000, // cache for 10 minutes
  });

  // Only active top-level categories
  const categories =
    data?.data?.filter((c: any) => c.isActive !== false && !c.parentId) || [];

  if (!isLoading && categories.length === 0) return null;

  return (
    <section aria-label="Categories">
      {isLoading ? (
        <CategoryCircleRow categories={[]} isLoading />
      ) : (
        <CategorySlider categories={categories} />
      )}
    </section>
  );
}
