import { useEffect, useState } from "react";
import { useI18n } from "../../core/i18n/I18nProvider";
import type { Level } from "../../core/auth/types";
import type {
  Category,
  CourseFilters,
  CourseSort,
} from "../../core/catalog/types";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { Sheet } from "../../ui/Sheet";

const LEVELS: Level[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

/** Duration buckets in minutes (matches the prototype's «До 6 ч / 6–10 ч / 10+ ч»). */
const DURATIONS: { key: string; minDuration?: number; maxDuration?: number }[] = [
  { key: "lt6", maxDuration: 360 },
  { key: "6to10", minDuration: 360, maxDuration: 600 },
  { key: "gt10", minDuration: 600 },
];

/** Price buckets in cents (KZT). */
const PRICES: { key: string; minPrice?: number; maxPrice?: number }[] = [
  { key: "lt30", maxPrice: 3_000_000 },
  { key: "30to45", minPrice: 3_000_000, maxPrice: 4_500_000 },
  { key: "gt45", minPrice: 4_500_000 },
];

const SORTS: CourseSort[] = ["popular", "rating", "newest"];

/** Filters that the sheet edits (search stays on the home search field). */
export type SheetFilters = Pick<
  CourseFilters,
  | "categoryId"
  | "level"
  | "minPrice"
  | "maxPrice"
  | "minDuration"
  | "maxDuration"
  | "sort"
>;

const EMPTY: SheetFilters = { sort: "popular" };

export function FiltersSheet({
  open,
  onClose,
  categories,
  value,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  value: SheetFilters;
  onApply: (next: SheetFilters) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<SheetFilters>(value);

  // Re-seed the draft from the live filters whenever the sheet opens.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const durationKey = DURATIONS.find(
    (d) =>
      d.minDuration === draft.minDuration && d.maxDuration === draft.maxDuration,
  )?.key;
  const priceKey = PRICES.find(
    (p) => p.minPrice === draft.minPrice && p.maxPrice === draft.maxPrice,
  )?.key;

  function patch(p: Partial<SheetFilters>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("filters.title")}
      footer={
        <div style={{ display: "flex", gap: 12 }}>
          <Button
            variant="ghost"
            style={{ flex: 1 }}
            onClick={() => setDraft(EMPTY)}
          >
            {t("filters.reset")}
          </Button>
          <Button
            variant="primary"
            style={{ flex: 1.6 }}
            onClick={() => onApply(draft)}
          >
            {t("filters.apply")}
          </Button>
        </div>
      }
    >
      <div className="group-label" style={{ padding: "8px 0" }}>
        {t("filters.category")}
      </div>
      <div className="chip-wrap">
        {categories.map((c) => (
          <Chip
            key={c.id}
            active={draft.categoryId === c.id}
            onClick={() =>
              patch({
                categoryId: draft.categoryId === c.id ? undefined : c.id,
              })
            }
          >
            {c.name}
          </Chip>
        ))}
      </div>

      <div className="group-label" style={{ padding: "18px 0 8px" }}>
        {t("filters.level")}
      </div>
      <div className="chip-wrap">
        {LEVELS.map((lvl) => (
          <Chip
            key={lvl}
            active={draft.level === lvl}
            onClick={() =>
              patch({ level: draft.level === lvl ? undefined : lvl })
            }
          >
            {t(`level.${lvl}`)}
          </Chip>
        ))}
      </div>

      <div className="group-label" style={{ padding: "18px 0 8px" }}>
        {t("filters.duration")}
      </div>
      <div className="chip-wrap">
        {DURATIONS.map((d) => (
          <Chip
            key={d.key}
            active={durationKey === d.key}
            onClick={() =>
              patch(
                durationKey === d.key
                  ? { minDuration: undefined, maxDuration: undefined }
                  : { minDuration: d.minDuration, maxDuration: d.maxDuration },
              )
            }
          >
            {t(`filters.dur.${d.key}`)}
          </Chip>
        ))}
      </div>

      <div className="group-label" style={{ padding: "18px 0 8px" }}>
        {t("filters.price")}
      </div>
      <div className="chip-wrap">
        {PRICES.map((p) => (
          <Chip
            key={p.key}
            active={priceKey === p.key}
            onClick={() =>
              patch(
                priceKey === p.key
                  ? { minPrice: undefined, maxPrice: undefined }
                  : { minPrice: p.minPrice, maxPrice: p.maxPrice },
              )
            }
          >
            {t(`filters.price.${p.key}`)}
          </Chip>
        ))}
      </div>

      <div className="group-label" style={{ padding: "18px 0 8px" }}>
        {t("filters.sort")}
      </div>
      <div>
        {SORTS.map((s) => {
          const on = (draft.sort ?? "popular") === s;
          return (
            <button
              key={s}
              type="button"
              className="list-row"
              onClick={() => patch({ sort: s })}
            >
              <div className="list-row__main">
                <div className="list-row__title">{t(`filters.sort.${s}`)}</div>
              </div>
              <div className={`radio-dot${on ? " on" : ""}`} />
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
