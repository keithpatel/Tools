"use client";

import { createStorageHook } from "./useStorage";

export const useDismissed = createStorageHook<string[]>("multitool-dismissed", []);
