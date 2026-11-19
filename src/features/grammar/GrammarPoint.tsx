import type { GrammarPoint as GP } from "@/lib/types";

export default function GrammarPoint({ p, i }: { p: GP; i: number }) {
  return (
    <article className="gp" id={`diem-${i + 1}`} style={{ scrollMarginTop: 80 }}>
      <div className="gp-n">{i + 1}</div>
      <div>
        <h3 className="gp-t">{p.pattern}</h3>
        <p className="gp-m">{p.meaning}</p>
        <ul className="gp-d">
          {p.explanations.map((x, j) => (
            <li key={j}>{x}</li>
          ))}
        </ul>
        <ul className="gp-ex">
          {p.examples.map((x, j) => (
            <li key={j}>
              <span className="w">{x.jp}</span>
              <span className="m">{x.vi}</span>
            </li>
          ))}
        </ul>
        {p.note && (
          <p className="gp-note">
            <b>Lưu ý.</b> {p.note}
          </p>
        )}
      </div>
    </article>
  );
}
