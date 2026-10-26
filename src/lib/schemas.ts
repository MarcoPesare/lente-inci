import { z } from "zod";
import { CATEGORIES } from "./categorize";

export const ProductBody = z.object({
  gtin: z.string().regex(/^\d{8}$|^\d{12,14}$/, "Il codice a barre deve avere 8, 12, 13 o 14 cifre").nullable().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Serve il nome").max(160),
  brand: z.string().trim().max(80).default(""),
  category: z.enum(CATEGORIES).default("Altro"),
  mode: z.enum(["rinse", "leave"]).default("rinse"),
  inci: z.string().trim().max(8000).nullable().optional(),
  source: z.string().trim().max(200).default(""),
});
