<script lang="ts">
  let {
    date,
    variant = "ochre",
    numeralSize = 36,
  }: { date: Date; variant?: "ochre" | "sage"; numeralSize?: number } = $props();

  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("pt-BR", { month: "short" });
  const time = date.toLocaleTimeString("pt-BR", { hour: "numeric", minute: "2-digit" });
</script>

<div class="date-stub {variant}">
  <span class="weekday">{weekday}</span>
  <span class="day" style="font-size: {numeralSize}px">{day}</span>
  <span class="month">{month}</span>
  <span class="time">{time}</span>
</div>

<style>
  .date-stub {
    width: 96px;
    color: var(--ground);
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .date-stub.ochre {
    background: var(--ochre);
  }
  .date-stub.sage {
    background: var(--sage);
  }
  .weekday {
    font-family: var(--m-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .day {
    font-family: var(--m-display);
    line-height: 1;
  }
  .month {
    font-family: var(--m-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .time {
    font-family: var(--m-mono);
    font-size: 11px;
    font-weight: 700;
    margin-top: 6px;
  }

  @media (max-width: 900px) {
    .date-stub {
      width: 76px;
    }
  }
</style>
