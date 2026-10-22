"use server";

import { httpClient } from "@/lib/axios/httpClient";
import { IGtmSetting, IPublicGtmSetting } from "@/types/gtmSetting.types";

// Public: the container to load, or null when GTM is off
export const getPublicGtmSettings = async () => {
  try {
    const res = await httpClient.get<IPublicGtmSetting | null>("/gtm-settings/public");
    return res.data ?? null;
  } catch {
    // Tracking must never break the page
    return null;
  }
};

export const getGtmSettings = async () => {
  try {
    const res = await httpClient.get<IGtmSetting>("/gtm-settings");
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Failed to fetch GTM settings");
  }
};

export const updateGtmSettings = async (payload: {
  isEnabled?: boolean;
  containerId?: string;
  scriptDomain?: string;
}) => {
  try {
    const res = await httpClient.patch<IGtmSetting>("/gtm-settings", payload);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Failed to update GTM settings");
  }
};
