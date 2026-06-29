import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  lead?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  trail?: ReactNode;
}

export function ListRow({ lead, title, sub, trail, ...rest }: Props) {
  return (
    <button className="list-row" {...rest}>
      {lead && <div className="list-row__lead">{lead}</div>}
      <div className="list-row__main">
        <div className="list-row__title">{title}</div>
        {sub && <div className="list-row__sub">{sub}</div>}
      </div>
      {trail && <div className="list-row__trail">{trail}</div>}
    </button>
  );
}
