import { useMemo, useState } from "react";
import { AlertCircle, Bell, SearchX, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../core/auth/auth.store";
import {
  useCategories,
  useCourses,
} from "../../core/catalog/catalog.api";
import type { CourseFilters } from "../../core/catalog/types";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Avatar } from "../../ui/Avatar";
import { BottomNav } from "../../ui/BottomNav";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { EmptyState } from "../../ui/EmptyState";
import { SearchField } from "../../ui/SearchField";
import { useSnackbar } from "../../ui/Snackbar";
import { CourseCardView } from "./CourseCardView";
import { FiltersSheet, type SheetFilters } from "./FiltersSheet";

/** A loading tile that mirrors `.course-card` proportions (rail + grid). */
function SkeletonCard({ wide = false }: { wide?: boolean }) {
  return (
    <div
      className="skeleton-card"
      style={wide ? { width: 230, flex: "none" } : undefined}
    >
      <div className="skeleton" style={{ aspectRatio: "16 / 10", borderRadius: 0 }} />
      <div
        style={{
          padding: wide ? "12px 14px" : 12,
          display: "flex",
          flexDirection: "column",
          gap: wide ? 8 : 7,
        }}
      >
        <div className="skeleton" style={{ height: wide ? 14 : 12, width: "88%" }} />
        <div className="skeleton" style={{ height: wide ? 11 : 10, width: "55%" }} />
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { snack } = useSnackbar();

  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheet, setSheet] = useState<SheetFilters>({ sort: "popular" });

  const { data: categories, isLoading: catsLoading } = useCategories();

  const filters: CourseFilters = useMemo(
    () => ({
      ...sheet,
      search: search.trim() || undefined,
      pageSize: 12,
    }),
    [sheet, search],
  );

  const {
    data: courses,
    isLoading: coursesLoading,
    isError: coursesError,
    refetch: refetchCourses,
  } = useCourses(filters);

  // Top picks: the highest-rated courses, shown only on the unfiltered home.
  const { data: recommended } = useCourses({ sort: "rating", pageSize: 8 });
  const showRecommended =
    !search.trim() && !sheet.categoryId && !sheet.level && !sheet.minDuration;

  const hour = new Date().getHours();
  const greetKey =
    hour < 12 ? "home.morning" : hour < 18 ? "home.day" : "home.evening";
  const firstName = (user?.name ?? "").split(" ")[0];

  const activeCategoryId = sheet.categoryId;
  const list = courses?.data ?? [];
  const loading = coursesLoading && !courses;

  return (
    <div className="screen">
      <div className="screen__top">
        <div className="greet">
          <div className="greet__hi">
            <div className="t-caption">{t(greetKey)}</div>
            <div className="nm">{firstName} 👋</div>
          </div>
          <button
            className="appbar__btn"
            onClick={() => snack(t("profile.soon"))}
            aria-label={t("profile.notifications")}
          >
            <Bell className="icon" />
          </button>
          <span
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
            aria-label={t("nav.profile")}
            role="button"
          >
            <Avatar name={user?.name ?? "?"} />
          </span>
        </div>
        <div className="pad" style={{ paddingBottom: 6, display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <SearchField
              placeholder={t("home.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            onClick={() => setSheetOpen(true)}
            style={{ minHeight: 48, padding: "0 14px" }}
            aria-label={t("filters.title")}
          >
            <SlidersHorizontal className="icon-sm" />
          </Button>
        </div>
      </div>

      <div className="screen__scroll">
        {/* Category rail (single-select; mirrors the Filters category). */}
        {catsLoading ? (
          <div className="sk-rail">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton" />
            ))}
          </div>
        ) : (
          <div className="rail">
            <Chip
              active={!activeCategoryId}
              onClick={() => setSheet((s) => ({ ...s, categoryId: undefined }))}
            >
              {t("cat.all")}
            </Chip>
            {(categories ?? []).map((c) => (
              <Chip
                key={c.id}
                active={activeCategoryId === c.id}
                onClick={() =>
                  setSheet((s) => ({
                    ...s,
                    categoryId: s.categoryId === c.id ? undefined : c.id,
                  }))
                }
              >
                {c.name}
              </Chip>
            ))}
          </div>
        )}

        {loading ? (
          <>
            {showRecommended && (
              <>
                <div className="section-head">
                  <div className="skeleton" style={{ height: 18, width: 140 }} />
                </div>
                <div className="h-scroll">
                  <SkeletonCard wide />
                  <SkeletonCard wide />
                </div>
              </>
            )}
            <div className="section-head">
              <div className="skeleton" style={{ height: 18, width: 110 }} />
            </div>
            <div className="grid2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </>
        ) : (
          <>
            {showRecommended && (recommended?.data.length ?? 0) > 0 && (
              <>
                <div className="section-head">
                  <div className="t-section">{t("home.recommended")}</div>
                </div>
                <div className="h-scroll">
                  {recommended!.data.map((c) => (
                    <CourseCardView key={c.id} course={c} />
                  ))}
                </div>
              </>
            )}

            <div className="section-head">
              <div className="t-section">{t("home.allCourses")}</div>
              {courses && (
                <span className="t-caption" style={{ margin: 0 }}>
                  {t("home.courseCount", { count: courses.total })}
                </span>
              )}
            </div>

            {list.length === 0 ? (
              coursesError ? (
                <div style={{ padding: "8px 18px 0" }}>
                  <EmptyState
                    icon={<AlertCircle className="icon-lg" />}
                    title={t("error.title")}
                    text={t("errorGeneric")}
                    action={
                      <Button
                        variant="primary"
                        onClick={() => refetchCourses()}
                        style={{ marginTop: 8 }}
                      >
                        {t("error.retry")}
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div style={{ padding: "8px 18px 0" }}>
                  <EmptyState
                    icon={<SearchX className="icon-lg" />}
                    title={t("home.emptyTitle")}
                    text={t("home.emptyText")}
                  />
                </div>
              )
            ) : (
              <div className="grid2">
                {list.map((c) => (
                  <CourseCardView key={c.id} course={c} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <FiltersSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories ?? []}
        value={sheet}
        onApply={(next) => {
          setSheet(next);
          setSheetOpen(false);
        }}
      />

      <BottomNav />
    </div>
  );
}
