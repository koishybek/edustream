import { useNavigate, useParams } from "react-router-dom";
import { useCourse } from "../../core/catalog/catalog.api";
import { useI18n } from "../../core/i18n/I18nProvider";
import { AppBar } from "../../ui/AppBar";
import { Spinner } from "../../ui/Spinner";

/**
 * Placeholder course-detail screen. The catalog data layer is wired (so the
 * title resolves), but the full detail UI — module accordion, reviews, sticky
 * buy CTA — is built by the next agent (Mobile 2/4).
 */
export default function CourseScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { data: course, isLoading } = useCourse(slug);

  return (
    <div className="screen">
      <div className="screen__top">
        <AppBar
          title={course?.title ?? t("appName")}
          onBack={() => navigate(-1)}
        />
      </div>
      <div className="screen__scroll">
        {isLoading ? (
          <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
            <Spinner />
          </div>
        ) : (
          <div className="pad" style={{ paddingTop: 16 }}>
            <div className="t-title">{course?.title}</div>
            <div className="t-caption" style={{ marginTop: 8 }}>
              {course?.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
