"use client";

import { useState } from "react";
import { Segmented, Switch } from "@/components/ui";
import { GROUP_LABEL } from "@/lib/verbs";
import type { Verb, VerbFormKey } from "@/lib/types";

const COLS: [VerbFormKey, string, number][] = [
  ["te", "Thể て", 14],
  ["nai", "Thể ない", 17],
  ["dict", "Thể từ điển", 18],
  ["ta", "Thể た", 19],
];

export default function VerbTable({ verbs }: { verbs: Verb[] }) {
  const [g, setG] = useState<"0" | "1" | "2" | "3">("0");
  const [mask, setMask] = useState(false);
  const [rev, setRev] = useState<Set<string>>(new Set());
  const list = verbs.filter((v) => g === "0" || v.group === +g);
  const count = (n: number) => verbs.filter((v) => v.group === n).length;

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 10 }}>
        <Segmented
          label="Lọc theo nhóm"
          value={g}
          onChange={(v) => setG(v)}
          options={[
            ["0", `Tất cả (${verbs.length})`],
            ["1", `Nhóm I (${count(1)})`],
            ["2", `Nhóm II (${count(2)})`],
            ["3", `Nhóm III (${count(3)})`],
          ]}
        />
        <div style={{ minWidth: 200 }}>
          <Switch
            checked={mask}
            onChange={(v) => {
              setMask(v);
              setRev(new Set());
            }}
          >
            Che các thể để tự kiểm tra
          </Switch>
        </div>
      </div>
      <div className="table-wrap">
        <table className="vt">
          <thead>
            <tr>
              <th>Thể ます</th>
              <th>Nghĩa</th>
              <th>Nhóm</th>
              {COLS.map(([k, n, l]) => (
                <th key={k}>
                  {n} <span style={{ textTransform: "none", fontWeight: 500 }}>· B{l}</span>
                </th>
              ))}
              <th>Bài</th>
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={`${v.lesson}:${v.masu}`}>
                <td className="jp">
                  {v.masu}
                  {v.kanji && <span className="muted small"> {v.kanji}</span>}
                  {v.exception && <span className="exc">⚠ {v.exception}</span>}
                </td>
                <td style={{ whiteSpace: "normal", minWidth: 140 }}>{v.vi}</td>
                <td>
                  <span className={`grp g${v.group}`}>{GROUP_LABEL[v.group]}</span>
                </td>
                {COLS.map(([k]) => {
                  const id = `${v.lesson}:${v.masu}:${k}`;
                  const hidden = mask && !rev.has(id);
                  return (
                    <td
                      key={k}
                      className={"jp" + (hidden ? " masked" : "")}
                      onClick={hidden ? () => setRev((r) => new Set(r).add(id)) : undefined}
                      role={hidden ? "button" : undefined}
                      tabIndex={hidden ? 0 : undefined}
                      onKeyDown={
                        hidden
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setRev((r) => new Set(r).add(id));
                              }
                            }
                          : undefined
                      }
                      aria-label={hidden ? "Bấm để hiện" : undefined}
                    >
                      {v.forms[k]}
                    </td>
                  );
                })}
                <td>{v.lesson}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
