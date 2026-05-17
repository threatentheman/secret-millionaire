import { scheduleItems } from "@/lib/seed";

export function Schedule() {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-black text-champagne">Villa Schedule</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {scheduleItems.map((day) => (
          <article className="rounded-lg bg-black/35 p-4 gold-ring" key={day.day}>
            <h3 className="text-lg font-black text-gold">{day.day}</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/82">
              {day.items.map((item) => (
                <li className="flex gap-2" key={item}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
