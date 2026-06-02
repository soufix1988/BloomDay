import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { useBloomState } from "@/hooks/useBloomState";
import { KEYS, type Transaction } from "@/data/schemas";
import { dayKey, fromDayKey, prettyDate } from "@/lib/date";
import { uid } from "@/lib/id";
import { toolBySlug } from "@/data/tools";
import ToolHeader from "@/components/common/ToolHeader";
import { PopCard, SoftCard } from "@/components/common/Card";

const CATEGORIES = ["Food", "Shopping", "Bills", "Beauty", "Transport", "Fun", "Health", "Other"];
const PALETTE = ["#f43f7e", "#a855f7", "#22c55e", "#f59e0b", "#38bdf8", "#ef4444", "#ec4899", "#8b5cf6"];

export default function BudgetTracker() {
  const tool = toolBySlug("budget")!;
  const [txns, setTxns] = useBloomState<Transaction[]>(KEYS.budget, []);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [note, setNote] = useState("");

  const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const byCategory = CATEGORIES.map((c, i) => ({
    name: c,
    value: txns.filter((t) => t.type === "expense" && t.category === c).reduce((s, t) => s + t.amount, 0),
    color: PALETTE[i % PALETTE.length],
  })).filter((d) => d.value > 0);

  const add = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setTxns((prev) => [
      { id: uid(), type, amount: amt, category, note: note.trim(), date: dayKey() },
      ...prev,
    ]);
    setAmount("");
    setNote("");
  };

  const remove = (id: string) => setTxns((prev) => prev.filter((t) => t.id !== id));

  return (
    <div>
      <ToolHeader tool={tool} />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <SoftCard className="!p-4 text-center">
          <p className="text-xs font-bold uppercase text-muted-foreground">Income</p>
          <p className="text-2xl font-black text-[#22c55e]">${income.toFixed(0)}</p>
        </SoftCard>
        <SoftCard className="!p-4 text-center">
          <p className="text-xs font-bold uppercase text-muted-foreground">Spent</p>
          <p className="text-2xl font-black text-hot">${expense.toFixed(0)}</p>
        </SoftCard>
        <PopCard className="!p-4 text-center">
          <p className="text-xs font-bold uppercase text-muted-foreground">Balance</p>
          <p className="text-2xl font-black text-foreground">${balance.toFixed(0)}</p>
        </PopCard>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
        <PopCard>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-2xl py-2 text-sm font-bold capitalize transition ${
                  type === t ? "bg-gradient-pink text-primary-foreground shadow-soft" : "bg-secondary/50 text-secondary-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="number" inputMode="decimal" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="mb-3 w-full rounded-2xl border-2 border-secondary bg-blush/40 px-4 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mb-3 w-full rounded-2xl border-2 border-secondary bg-blush/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Note (optional)"
            className="mb-3 w-full rounded-2xl border-2 border-secondary bg-blush/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={add} className="w-full rounded-2xl bg-gradient-pink py-3 font-bold text-primary-foreground shadow-soft hover:scale-[1.02] transition">
            Add transaction
          </button>
        </PopCard>

        <SoftCard>
          <p className="mb-2 text-sm font-bold text-secondary-foreground">Spending by category</p>
          {byCategory.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No expenses yet 💸</p>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {byCategory.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toFixed(0)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </SoftCard>
      </div>

      <SoftCard className="mt-5">
        <p className="mb-3 text-sm font-bold text-secondary-foreground">Recent transactions</p>
        {txns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {txns.slice(0, 12).map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-blush/40 px-3 py-2">
                <span className={`grid size-9 place-items-center rounded-xl ${t.type === "income" ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-hot/20 text-hot"}`}>
                  {t.type === "income" ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{t.category}{t.note ? ` · ${t.note}` : ""}</p>
                  <p className="text-[11px] text-muted-foreground">{prettyDate(fromDayKey(t.date))}</p>
                </div>
                <span className={`font-black ${t.type === "income" ? "text-[#22c55e]" : "text-hot"}`}>
                  {t.type === "income" ? "+" : "-"}${t.amount.toFixed(0)}
                </span>
                <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SoftCard>
    </div>
  );
}
