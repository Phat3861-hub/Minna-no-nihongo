"use client";

import Link from "next/link";
import { useDoneSet } from "@/lib/progress";

type F = { href: string; icon: string; title: string; desc: string; isNew?: boolean; progress?: { kind: "vocab" | "kanji" | "exercise"; total: number; unit: string } };

function Card({ f }: { f: F }) {
  const { done } = useDoneSet(f.progress?.kind ?? "vocab");
  const n = f.progress ? Math.min(done.size, f.progress.total) : 0;
  return (
    <Link href={f.href} className={"feature" + (f.isNew ? " new" : "")}>
      <span className="fi">{f.icon}</span>
      <h3>
        {f.title} {f.isNew && <span className="badge-new">MỚI</span>}
      </h3>
      <p>{f.desc}</p>
      {f.progress && (
        <div className="prog">
          {n}/{f.progress.total} {f.progress.unit}
          <div className="progress">
            <i style={{ width: `${(n / f.progress.total) * 100}%` }} />
          </div>
        </div>
      )}
    </Link>
  );
}

export default function FeatureGrid({ items }: { items: F[] }) {
  return (
    <div className="feature-grid">
      {items.map((f) => (
        <Card key={f.href} f={f} />
      ))}
    </div>
  );
}
