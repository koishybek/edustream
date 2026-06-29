import { Star } from "lucide-react";

export function RatingStars({
  value,
  score,
  count,
}: {
  value: number;
  score?: string | number;
  count?: string | number;
}) {
  return (
    <div className="rating">
      <span className="stars">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`icon-sm${i <= Math.round(value) ? "" : " empty"}`}
          />
        ))}
      </span>
      {score != null && <span className="score">{score}</span>}
      {count != null && <span className="count">{count}</span>}
    </div>
  );
}
