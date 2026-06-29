import { Clock, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../core/i18n/I18nProvider";
import type { CourseCard } from "../../core/catalog/types";
import { durationHours, formatKzt } from "../../core/catalog/format";
import { categoryVisual, Cover } from "../../ui/Cover";
import { RatingStars } from "../../ui/RatingStars";

/**
 * One catalog course tile (the designer's `.course-card`). Used both in the
 * "Рекомендуем" h-scroll and the "Все курсы" grid. Tapping opens the detail.
 * `free` shows the preview badge when the course has a free-preview lesson.
 */
export function CourseCardView({
  course,
  free = false,
}: {
  course: CourseCard;
  free?: boolean;
}) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const { gradient, Icon } = categoryVisual(course.category.slug);

  return (
    <button
      type="button"
      className="course-card"
      onClick={() => navigate(`/course/${course.slug}`)}
    >
      <Cover gradient={gradient} Icon={Icon} className="course-card__cover">
        {free && (
          <span className="course-card__badge">
            <Play className="icon-sm" style={{ width: 11, height: 11 }} />
            {t("course.preview")}
          </span>
        )}
      </Cover>
      <div className="course-card__body">
        <div className="course-card__title">{course.title}</div>
        <div className="course-card__meta">
          <Clock className="icon-sm" style={{ width: 13, height: 13 }} />
          {t("course.hoursLevel", {
            hours: durationHours(course.durationMinutes),
            level: t(`level.${course.level}`),
          })}
        </div>
        <div className="course-card__foot">
          <RatingStars
            value={course.ratingAvg}
            score={course.ratingAvg.toLocaleString(locale === "en" ? "en" : "ru-RU", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          />
          <span className="course-card__price">
            {formatKzt(course.priceCents)}
          </span>
        </div>
      </div>
    </button>
  );
}
