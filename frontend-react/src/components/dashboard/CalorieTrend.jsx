import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { getDailyMacros } from "../../api_integration";

const H = 280, L = 52, R = 14, T = 22, B = 32;
const MAX_DAYS = 366; // same limit as the backend

const OPTIONS = [
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "custom", label: "Last N days" },
];

const dayLabel = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export default function CalorieTrend({ goal }) {
  const [choice, setChoice] = useState("7");        // "7" | "30" | "custom"
  const [customDays, setCustomDays] = useState(14); // the N that was applied
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [draft, setDraft] = useState("14");         // text typed in the N box
  const [draftError, setDraftError] = useState("");

  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const boxRef = useRef(null);
  const [width, setWidth] = useState(0); // width of the chart area, measured
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const inputRef = useRef(null);
  const menuId = useId();

  const days = choice === "custom" ? customDays : Number(choice);
  const currentLabel = choice === "custom" ? `Last ${customDays} days` : `Last ${choice} days`;

  // Load the data whenever the range changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getDailyMacros({ days })
      .then((rows) => {
        if (!cancelled) {
          setTrend(rows.map(({ date, calories }) => ({ date, calories: Number(calories) || 0 })));
        }
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  // Measure the chart area so the chart uses all the space the card has.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Close the menu on an outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => { if (open && showCustom) inputRef.current?.focus(); }, [open, showCustom]);

  const toggle = () => {
    if (!open) {
      setShowCustom(choice === "custom");
      setDraft(String(customDays));
      setDraftError("");
    }
    setOpen((o) => !o);
  };

  const pick = (key) => {
    if (key === "custom") {
      setShowCustom(true); // keep the menu open so the user can type N
      return;
    }
    setChoice(key);
    setOpen(false);
    btnRef.current?.focus();
  };

  const applyCustom = (e) => {
    e.preventDefault();
    const n = Number(draft);
    if (draft.trim() === "" || !Number.isInteger(n) || n < 1 || n > MAX_DAYS) {
      setDraftError(`Enter a whole number from 1 to ${MAX_DAYS}.`);
      return;
    }
    setDraftError("");
    setCustomDays(n);
    setChoice("custom");
    setOpen(false);
    btnRef.current?.focus();
  };

  const onWrapKeyDown = (e) => {
    if (e.key === "Escape" && open) {
      setOpen(false);
      btnRef.current?.focus();
    }
  };

  const onOptionKeyDown = (e, key) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(key);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = [...e.currentTarget.parentElement.querySelectorAll('[role="option"]')];
      const i = items.indexOf(e.currentTarget);
      items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
    }
  };

  return (
    <section className="card trend">
      <div className="card__head">
        <h2>Calorie Trend</h2>

        <div className="dd" ref={wrapRef} onKeyDown={onWrapKeyDown}>
          <button
            ref={btnRef}
            type="button"
            className="dd__btn"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            aria-label={`Date range: ${currentLabel}`}
            onClick={toggle}
          >
            <span>{currentLabel}</span>
            <ChevronDown size={16} className={open ? "dd__chev dd__chev--up" : "dd__chev"} aria-hidden="true" />
          </button>

          {open && (
            <div className="dd__menu" id={menuId}>
              <ul role="listbox" aria-label="Date range">
                {OPTIONS.map(({ key, label }) => (
                  <li
                    key={key}
                    role="option"
                    tabIndex={0}
                    aria-selected={choice === key}
                    className={choice === key ? "dd__opt dd__opt--on" : "dd__opt"}
                    onClick={() => pick(key)}
                    onKeyDown={(e) => onOptionKeyDown(e, key)}
                  >
                    <span>{label}</span>
                    {choice === key && <Check size={16} aria-hidden="true" />}
                  </li>
                ))}
              </ul>

              {showCustom && (
                <form className="dd__custom" onSubmit={applyCustom}>
                  <label htmlFor={`${menuId}-n`}>Number of days</label>
                  <div className="dd__custom-row">
                    <input
                      id={`${menuId}-n`}
                      ref={inputRef}
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max={MAX_DAYS}
                      step="1"
                      value={draft}
                      aria-invalid={Boolean(draftError)}
                      onChange={(e) => { setDraft(e.target.value); setDraftError(""); }}
                    />
                    <button type="submit" className="dd__apply">Apply</button>
                  </div>
                  {draftError && <p className="dd__error" role="alert">{draftError}</p>}
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="trend__box" ref={boxRef}>
        {error && <p className="state state--error" role="alert">{error}</p>}
        {!trend && !error && <p className="empty">Loading calorie trend…</p>}
        {trend && <Chart trend={trend} goal={goal} days={days} width={width} dimmed={loading} />}
      </div>
    </section>
  );
}

function Chart({ trend, goal, days, width, dimmed }) {
  const n = trend.length;
  const max = Math.max(2000, goal * 1.1, ...trend.map((t) => t.calories));
  const ceil = Math.ceil(max / 500) * 500;
  const ticks = Array.from({ length: ceil / 500 + 1 }, (_, i) => i * 500);
  const y = (v) => T + (1 - v / ceil) * (H - T - B);
  const W = Math.max(320, width || 600);
  const slot = (W - L - R) / Math.max(n, 1);
  const bw = Math.min(slot * 0.64, 44); // keep bars from getting chunky when there are few days

  // Fit as many date labels as the width allows; the last bar (today) is always labelled.
  const maxLabels = Math.max(2, Math.floor((W - L - R) / 72));
  const step = Math.max(1, Math.ceil(n / maxLabels));
  const hasData = trend.some((t) => t.calories > 0);

  return (
    <div style={{ opacity: dimmed ? 0.5 : 1, transition: "opacity .15s" }}>
      <svg className="trend__svg" viewBox={`0 0 ${W} ${H}`} role="img"
           aria-label={`Daily calories for the last ${days} days against your goal`}>
        {ticks.map((t) => (
          <g key={t}>
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#62736b">{t.toLocaleString("en-US")}</text>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#eef1ef" />
          </g>
        ))}
        {trend.map((d, i) => (
          <g key={d.date}>
            <rect x={L + i * slot + (slot - bw) / 2} y={y(d.calories)} width={bw}
                  height={y(0) - y(d.calories)} rx={bw > 8 ? 2 : 0} fill="#7cc79a">
              <title>{`${dayLabel(d.date)}: ${d.calories.toLocaleString("en-US")} kcal`}</title>
            </rect>
            {(n - 1 - i) % step === 0 && (
              <text x={L + i * slot + slot / 2} y={H - 10} textAnchor="middle" fontSize="12" fill="#62736b">
                {dayLabel(d.date)}
              </text>
            )}
          </g>
        ))}
        <line x1={L} x2={W - R} y1={y(goal)} y2={y(goal)} stroke="#62736b" strokeDasharray="5 4" />
        <text x={W - R} y={y(goal) - 5} textAnchor="end" fontSize="11" fill="#62736b">
          Goal ({goal.toLocaleString("en-US")})
        </text>
      </svg>
      {!hasData && <p className="empty">No meals logged in this period.</p>}
    </div>
  );
}
