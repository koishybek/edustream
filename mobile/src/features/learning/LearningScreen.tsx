import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../core/i18n/I18nProvider";
import { AppBar } from "../../ui/AppBar";
import { BottomNav } from "../../ui/BottomNav";
import { Button } from "../../ui/Button";
import { EmptyState } from "../../ui/EmptyState";

/** Phase 1.5: empty state. Real enrollments + progress land in Phase 3. */
export default function LearningScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <div className="screen">
      <div className="screen__top">
        <AppBar title={t("learning.title")} large />
      </div>
      <div
        className="screen__scroll"
        style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}
      >
        <EmptyState
          icon={<BookOpen className="icon-lg" />}
          title={t("learning.emptyTitle")}
          text={t("learning.emptyText")}
          action={
            <Button
              variant="primary"
              small
              style={{ marginTop: 12 }}
              onClick={() => navigate("/")}
            >
              {t("learning.toCatalog")}
            </Button>
          }
        />
      </div>
      <BottomNav />
    </div>
  );
}
