"use client";

import { createStorageHook } from "./useStorage";

export const useFavorites = createStorageHook<string[]>("multitool-favorites", []);
