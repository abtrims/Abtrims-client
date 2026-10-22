"use server";

import { httpClient } from "@/lib/axios/httpClient";
import { ISiteSetting } from "@/types/siteSetting.types";

export const getSiteSettings = async () => {
  try {
    return await httpClient.get<ISiteSetting>("/site-settings");
  } catch (error: any) {
    console.error("Failed to fetch site settings:", error);
    return { data: undefined } as any;
  }
};

export const updateSiteSettings = async (formData: FormData) => {
  try {
    return await httpClient.patch<ISiteSetting>("/site-settings", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to update site settings",
    );
  }
};
