<script lang="ts">
  let { date, variant = "orange" }: { date: Date; variant?: "orange" | "bone" } = $props();

  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("pt-BR", { month: "short" });
  const time = date.toLocaleTimeString("pt-BR", { hour: "numeric", minute: "2-digit" });
</script>

<div class="date-stub {variant}">
  <span class="weekday">{weekday}</span>
  <span class="day">{day}</span>
  <span class="month">{month}</span>
  <span class="time">{time}</span>
</div>

<style>
  .date-stub {
    width: 96px;
    color: var(--ink-base);
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .date-stub.orange {
    background: var(--orange);
  }
  .date-stub.bone {
    background: var(--bone);
  }
  .weekday {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .day {
    font-family: var(--font-display);
    font-size: 52px;
    font-weight: 900;
    line-height: 0.85;
  }
  .month {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .time {
    font-family: var(--font-mono);
    font-size: 10px;
    margin-top: 8px;
  }

  @media (max-width: 900px) {
    .date-stub {
      width: 76px;
    }
  }
</style>
