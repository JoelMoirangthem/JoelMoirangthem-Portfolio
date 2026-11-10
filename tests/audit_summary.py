"""Group audit findings by (page, section, kind, element) and list where they occur."""
import collections
import json
import os

r = json.load(open(os.path.join(os.path.dirname(__file__), "shots", "audit", "report.json"), encoding="utf-8"))
agg = collections.defaultdict(lambda: {"vps": set(), "ex": None})
for vp, pages in r.items():
    for page, items in pages.items():
        if "errors" in page:
            if items:
                print("ERRORS", vp, page, items[:2])
            continue
        pg = "room" if page.startswith("room:") else page
        for i in items:
            el = i.get("el", "") if i["kind"] in ("overflow-x", "text-clip-x", "clip-y", "small-target") else ""
            k = (pg, i.get("section", ""), i["kind"], el)
            agg[k]["vps"].add(vp)
            agg[k]["ex"] = agg[k]["ex"] or i
order = lambda s: int(s.split("x")[0])
for k, v in sorted(agg.items(), key=lambda kv: (kv[0][2], kv[0][0], -len(kv[1]["vps"]))):
    vps = sorted(v["vps"], key=order)
    where = ",".join(vps) if len(vps) < 8 else "(%d viewports)" % len(vps)
    print(f"{k[2]:<26} {k[0]:<6} {k[1]:<7} {k[3][:46]:<46} {where}")
    ex = {a: b for a, b in v["ex"].items() if a not in ("kind", "el", "section")}
    print("      ", json.dumps(ex)[:180])
