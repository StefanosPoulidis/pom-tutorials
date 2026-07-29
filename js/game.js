/* The Newsvendor Challenge
 *
 * Eight ordering decisions with changing forecasts and unit economics.
 * Every choice is compared with the correct Q* on the same realized demand,
 * separating decision quality from the luck of the demand path.
 */

const NEWSVENDOR_SCENARIOS = Object.freeze([
  Object.freeze({
    name: "Regular weekday",
    shortName: "Weekday",
    story: "A normal day at the campus counter establishes your baseline.",
    meanDemand: 100,
    demandSd: 20,
    sellingPrice: 10,
    unitCost: 4,
    salvageValue: 1
  }),
  Object.freeze({
    name: "Rainy Monday",
    shortName: "Rainy Monday",
    story: "Foot traffic is expected to be lower, and the forecast is relatively tight.",
    meanDemand: 75,
    demandSd: 12,
    sellingPrice: 10,
    unitCost: 4,
    salvageValue: 1
  }),
  Object.freeze({
    name: "Club event",
    shortName: "Club event",
    story: "A large student event raises expected demand and makes attendance less predictable.",
    meanDemand: 130,
    demandSd: 24,
    sellingPrice: 10,
    unitCost: 4,
    salvageValue: 1
  }),
  Object.freeze({
    name: "Donation pickup",
    shortName: "Donation",
    story: "A charity will collect leftovers, raising their end-of-day salvage value.",
    meanDemand: 100,
    demandSd: 20,
    sellingPrice: 10,
    unitCost: 4,
    salvageValue: 3
  }),
  Object.freeze({
    name: "Premium pop-up",
    shortName: "Premium",
    story: "A premium recipe sells for more but also costs more to prepare.",
    meanDemand: 90,
    demandSd: 18,
    sellingPrice: 14,
    unitCost: 5,
    salvageValue: 2
  }),
  Object.freeze({
    name: "Supplier shortage",
    shortName: "Shortage",
    story: "Ingredients cost more and unsold pastries have no salvage value, making overordering unusually costly.",
    meanDemand: 110,
    demandSd: 20,
    sellingPrice: 10,
    unitCost: 6,
    salvageValue: 0
  }),
  Object.freeze({
    name: "Preorder signals",
    shortName: "Preorders",
    story: "Early reservations make demand much more predictable without changing its mean.",
    meanDemand: 100,
    demandSd: 8,
    sellingPrice: 10,
    unitCost: 4,
    salvageValue: 1
  }),
  Object.freeze({
    name: "Festival rush",
    shortName: "Festival",
    story: "Festival traffic raises expected demand and creates substantial uncertainty.",
    meanDemand: 120,
    demandSd: 35,
    sellingPrice: 10,
    unitCost: 4,
    salvageValue: 1
  })
]);

const NEWSVENDOR_GAME = Object.freeze({
  rounds: NEWSVENDOR_SCENARIOS.length,
  minimumOrder: 0,
  maximumOrder: 250
});

let newsvendorGameInitialized = false;
let newsvendorState = {
  round: 1,
  results: [],
  awaitingNextRound: false
};

function initNewsvendorGame() {
  if (newsvendorGameInitialized || !document.getElementById("start-game")) return;
  newsvendorGameInitialized = true;

  const slider = document.getElementById("order-slider");
  const input = document.getElementById("order-input");

  document.getElementById("start-game").addEventListener("click", startNewsvendorGame);
  document.getElementById("submit-order").addEventListener("click", submitNewsvendorOrder);
  document.getElementById("next-round").addEventListener("click", advanceNewsvendorRound);
  document.getElementById("play-again").addEventListener("click", startNewsvendorGame);

  slider.addEventListener("input", () => {
    input.value = slider.value;
    clearNewsvendorInputError();
  });

  input.addEventListener("input", () => {
    const quantity = Number(input.value);
    if (Number.isFinite(quantity)) {
      slider.value = Math.min(Number(slider.max), Math.max(Number(slider.min), quantity));
    }
    clearNewsvendorInputError();
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") submitNewsvendorOrder();
  });
}

function startNewsvendorGame() {
  newsvendorState = {
    round: 1,
    results: [],
    awaitingNextRound: false
  };

  document.getElementById("game-intro").hidden = true;
  document.getElementById("game-debrief").hidden = true;
  document.getElementById("game-play").hidden = false;
  document.getElementById("round-result").hidden = true;
  document.getElementById("history-body").innerHTML =
    '<tr class="history-empty"><td colspan="6">Your first result will appear here.</td></tr>';

  setNewsvendorControlsEnabled(true);
  setNewsvendorOrder(getCurrentNewsvendorScenario().meanDemand);
  clearNewsvendorInputError();
  renderNewsvendorRoundHeader();
  renderNewsvendorScore();
  announceNewsvendor("The challenge has started. Morning 1 of 8.");
  focusAndScrollTo(document.getElementById("round-title"));
}

function submitNewsvendorOrder() {
  if (newsvendorState.awaitingNextRound) return;

  const input = document.getElementById("order-input");
  const quantity = Number(input.value);

  if (
    input.value.trim() === "" ||
    !Number.isInteger(quantity) ||
    quantity < NEWSVENDOR_GAME.minimumOrder ||
    quantity > NEWSVENDOR_GAME.maximumOrder
  ) {
    const error = document.getElementById("order-error");
    error.textContent = `Enter a whole number from ${NEWSVENDOR_GAME.minimumOrder} to ${NEWSVENDOR_GAME.maximumOrder}.`;
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }

  const scenario = getCurrentNewsvendorScenario();
  const optimalOrder = calculateOptimalNewsvendorOrder(scenario);
  const demand = sampleNewsvendorDemand(scenario);
  const playerOutcome = calculateNewsvendorOutcome(quantity, demand, scenario);
  const optimalOutcome = calculateNewsvendorOutcome(optimalOrder, demand, scenario);
  const meanOutcome = calculateNewsvendorOutcome(scenario.meanDemand, demand, scenario);

  newsvendorState.results.push({
    round: newsvendorState.round,
    scenario,
    order: quantity,
    optimalOrder,
    demand,
    player: playerOutcome,
    optimal: optimalOutcome,
    mean: meanOutcome
  });
  newsvendorState.awaitingNextRound = true;

  setNewsvendorControlsEnabled(false);
  renderNewsvendorResult(newsvendorState.results.at(-1));
  renderNewsvendorHistory();
  renderNewsvendorScore();

  const outcomeDescription = playerOutcome.leftover > 0
    ? `${playerOutcome.leftover} leftover`
    : playerOutcome.lostSales > 0
      ? `${playerOutcome.lostSales} lost sales`
      : "an exact match";
  announceNewsvendor(
    `Morning ${newsvendorState.round} complete. Demand was ${demand}, producing ${outcomeDescription} and ${formatCurrency(playerOutcome.profit)} profit.`
  );
  document.getElementById("next-round").focus();
}

function advanceNewsvendorRound() {
  if (!newsvendorState.awaitingNextRound) return;

  if (newsvendorState.round === NEWSVENDOR_GAME.rounds) {
    showNewsvendorDebrief();
    return;
  }

  newsvendorState.round += 1;
  newsvendorState.awaitingNextRound = false;
  document.getElementById("round-result").hidden = true;
  setNewsvendorControlsEnabled(true);
  setNewsvendorOrder(getCurrentNewsvendorScenario().meanDemand);
  clearNewsvendorInputError();
  renderNewsvendorRoundHeader();
  announceNewsvendor(`Morning ${newsvendorState.round} of ${NEWSVENDOR_GAME.rounds}. Choose your order.`);
  focusAndScrollTo(document.getElementById("round-title"));
}

function calculateNewsvendorOutcome(order, demand, scenario) {
  const sales = Math.min(order, demand);
  const leftover = Math.max(order - demand, 0);
  const lostSales = Math.max(demand - order, 0);
  const profit =
    scenario.sellingPrice * sales +
    scenario.salvageValue * leftover -
    scenario.unitCost * order;

  return { sales, leftover, lostSales, profit };
}

function sampleNewsvendorDemand(scenario) {
  // Box-Muller transform for the Normal demand described in the scenario.
  let firstUniform = 0;
  let secondUniform = 0;
  while (firstUniform === 0) firstUniform = Math.random();
  while (secondUniform === 0) secondUniform = Math.random();
  const standardNormal =
    Math.sqrt(-2 * Math.log(firstUniform)) * Math.cos(2 * Math.PI * secondUniform);
  const demand = Math.round(
    scenario.meanDemand + scenario.demandSd * standardNormal
  );
  return Math.max(0, demand);
}

function getCurrentNewsvendorScenario() {
  return NEWSVENDOR_SCENARIOS[newsvendorState.round - 1];
}

function calculateNewsvendorCriticalRatio(scenario) {
  const underageCost = scenario.sellingPrice - scenario.unitCost;
  const overageCost = scenario.unitCost - scenario.salvageValue;
  return underageCost / (underageCost + overageCost);
}

function calculateOptimalNewsvendorOrder(scenario) {
  const ratio = calculateNewsvendorCriticalRatio(scenario);
  const zScore = inverseStandardNormal(ratio);
  return Math.max(0, Math.round(scenario.meanDemand + zScore * scenario.demandSd));
}

function inverseStandardNormal(probability) {
  // Peter J. Acklam's rational approximation, accurate well beyond the
  // precision needed for whole-unit order quantities.
  const lowerBoundary = 0.02425;
  const upperBoundary = 1 - lowerBoundary;
  const a = [
    -39.6968302866538, 220.946098424521, -275.928510446969,
    138.357751867269, -30.6647980661472, 2.50662827745924
  ];
  const b = [
    -54.4760987982241, 161.585836858041, -155.698979859887,
    66.8013118877197, -13.2806815528857
  ];
  const c = [
    -0.00778489400243029, -0.322396458041136, -2.40075827716184,
    -2.54973253934373, 4.37466414146497, 2.93816398269878
  ];
  const d = [
    0.00778469570904146, 0.32246712907004,
    2.445134137143, 3.75440866190742
  ];

  if (probability <= 0 || probability >= 1) {
    throw new RangeError("Probability must be between zero and one.");
  }

  if (probability < lowerBoundary) {
    const q = Math.sqrt(-2 * Math.log(probability));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  if (probability <= upperBoundary) {
    const q = probability - 0.5;
    const r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  const q = Math.sqrt(-2 * Math.log(1 - probability));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

function renderNewsvendorRoundHeader() {
  const round = newsvendorState.round;
  const scenario = getCurrentNewsvendorScenario();
  const sliderMinimum = Math.max(0, Math.floor(scenario.meanDemand - 3 * scenario.demandSd));
  const sliderMaximum = Math.min(
    NEWSVENDOR_GAME.maximumOrder,
    Math.ceil(scenario.meanDemand + 3 * scenario.demandSd)
  );
  const underageCost = scenario.sellingPrice - scenario.unitCost;
  const overageCost = scenario.unitCost - scenario.salvageValue;
  const criticalRatio = calculateNewsvendorCriticalRatio(scenario);

  document.getElementById("round-label").textContent =
    `Morning ${round} of ${NEWSVENDOR_GAME.rounds}`;
  document.getElementById("round-brief-label").textContent = `Morning ${round} brief`;
  document.getElementById("round-title").textContent = scenario.name;
  document.getElementById("round-story").textContent = scenario.story;
  document.getElementById("round-mean").textContent = scenario.meanDemand;
  document.getElementById("round-sd").textContent = scenario.demandSd;
  document.getElementById("round-price").textContent = formatCurrency(scenario.sellingPrice);
  document.getElementById("round-cost").textContent = formatCurrency(scenario.unitCost);
  document.getElementById("round-salvage").textContent = formatCurrency(scenario.salvageValue);

  const slider = document.getElementById("order-slider");
  slider.min = sliderMinimum;
  slider.max = sliderMaximum;
  slider.value = scenario.meanDemand;
  document.getElementById("range-min-label").textContent = sliderMinimum;
  document.getElementById("range-mean-label").textContent =
    `Forecast mean: ${scenario.meanDemand}`;
  document.getElementById("range-max-label").textContent = sliderMaximum;

  document.getElementById("hint-underage").innerHTML =
    `C<sub>u</sub> = r &minus; c = ${formatCurrency(underageCost)}`;
  document.getElementById("hint-overage").innerHTML =
    `C<sub>o</sub> = c &minus; s = ${formatCurrency(overageCost)}`;

  const direction = criticalRatio > 0.5
    ? "above"
    : criticalRatio < 0.5
      ? "below"
      : "at";
  document.getElementById("hint-guidance").innerHTML =
    `The critical ratio is <strong>${criticalRatio.toFixed(3)}</strong>. This puts Q* ${direction} mean demand. The standard deviation determines how far the target percentile sits from the mean.`;

  const progress = document.querySelector(".round-progress");
  progress.setAttribute("aria-valuenow", String(round));
  document.getElementById("round-progress-fill").style.width =
    `${(round / NEWSVENDOR_GAME.rounds) * 100}%`;
}

function renderNewsvendorResult(result) {
  const { order, demand, player, optimal, optimalOrder, scenario } = result;
  const visualMaximum = Math.max(160, order, demand);
  const underageCost = scenario.sellingPrice - scenario.unitCost;
  const overageCost = scenario.unitCost - scenario.salvageValue;

  document.getElementById("result-demand").textContent = demand;
  document.getElementById("result-order").textContent = order;
  document.getElementById("demand-bar-label").textContent = demand;
  document.getElementById("result-sales").textContent = player.sales;
  document.getElementById("result-leftover").textContent = player.leftover;
  document.getElementById("result-lost").textContent = player.lostSales;
  document.getElementById("result-profit").textContent = formatCurrency(player.profit);
  document.getElementById("order-bar").style.width = `${(order / visualMaximum) * 100}%`;
  document.getElementById("demand-bar").style.width = `${(demand / visualMaximum) * 100}%`;

  const diagnosis = document.getElementById("result-diagnosis");
  if (player.leftover > 0) {
    diagnosis.textContent =
      `Demand came in ${player.leftover} below your order. Each leftover recovers ${formatCurrency(scenario.salvageValue)}, but costs ${formatCurrency(overageCost)} relative to not ordering it.`;
  } else if (player.lostSales > 0) {
    diagnosis.textContent =
      `Demand exceeded your order by ${player.lostSales}. Each missed sale forfeits ${formatCurrency(underageCost)} relative to stocking and selling that unit.`;
  } else {
    diagnosis.textContent =
      "Your order matched demand exactly today. That is a good outcome, but one exact match does not reveal the best long-run policy.";
  }

  document.getElementById("profit-equation").textContent =
    `${formatCurrency(scenario.sellingPrice)} × ${player.sales} sales + ${formatCurrency(scenario.salvageValue)} × ${player.leftover} leftover − ${formatCurrency(scenario.unitCost)} × ${order} ordered = ${formatCurrency(player.profit)}`;

  const roundGap = player.profit - optimal.profit;
  document.getElementById("round-benchmark").innerHTML =
    `This morning&rsquo;s target was <strong>Q* = ${optimalOrder}</strong>. On the same demand, that policy earned <strong>${formatCurrency(optimal.profit)}</strong>${roundGap === 0 ? ", matching your profit." : roundGap > 0 ? `. Your choice earned ${formatCurrency(roundGap)} more on this realization.` : `. Your choice earned ${formatCurrency(Math.abs(roundGap))} less on this realization.`}`;

  const nextButton = document.getElementById("next-round");
  nextButton.innerHTML = newsvendorState.round === NEWSVENDOR_GAME.rounds
    ? 'See what your policy learned <span aria-hidden="true">&rarr;</span>'
    : 'Next morning <span aria-hidden="true">&rarr;</span>';

  document.getElementById("round-result").hidden = false;
}

function renderNewsvendorHistory() {
  const rows = newsvendorState.results.map(result => {
    let outcomeLabel = "Exact match";
    let outcomeClass = "exact";

    if (result.player.leftover > 0) {
      outcomeLabel = `${result.player.leftover} leftover`;
      outcomeClass = "leftover";
    } else if (result.player.lostSales > 0) {
      outcomeLabel = `${result.player.lostSales} lost`;
      outcomeClass = "stockout";
    }

    return `
      <tr>
        <td>${result.round}</td>
        <td>${result.scenario.shortName}</td>
        <td>${result.order}</td>
        <td>${result.demand}</td>
        <td><span class="outcome-pill ${outcomeClass}">${outcomeLabel}</span></td>
        <td>${formatCurrency(result.player.profit)}</td>
      </tr>`;
  }).join("");

  document.getElementById("history-body").innerHTML = rows;
}

function renderNewsvendorScore() {
  const playerTotal = sumNewsvendorProfit("player");
  const optimalTotal = sumNewsvendorProfit("optimal");
  const gap = playerTotal - optimalTotal;

  document.getElementById("total-profit").textContent = formatCurrency(playerTotal);
  document.getElementById("benchmark-gap").textContent =
    newsvendorState.results.length === 0 ? "—" : formatSignedCurrency(gap);
}

function showNewsvendorDebrief() {
  const playerTotal = sumNewsvendorProfit("player");
  const optimalTotal = sumNewsvendorProfit("optimal");
  const meanTotal = sumNewsvendorProfit("mean");
  const averageDistanceFromOptimal =
    newsvendorState.results.reduce(
      (sum, result) => sum + Math.abs(result.order - result.optimalOrder),
      0
    ) / newsvendorState.results.length;
  const materiallyBelow = newsvendorState.results.filter(
    result => result.order < result.optimalOrder - 3
  ).length;
  const materiallyAbove = newsvendorState.results.filter(
    result => result.order > result.optimalOrder + 3
  ).length;
  const benchmarkGap = playerTotal - optimalTotal;

  document.getElementById("final-player-profit").textContent = formatCurrency(playerTotal);
  document.getElementById("final-optimal-profit").textContent = formatCurrency(optimalTotal);
  document.getElementById("final-mean-profit").textContent = formatCurrency(meanTotal);
  document.getElementById("final-average-order").textContent =
    `Average distance from Q*: ${formatNumber(averageDistanceFromOptimal, 1)} units`;

  let policyReading;
  if (averageDistanceFromOptimal <= 4) {
    policyReading =
      `You tracked the changing targets closely: your choices averaged ${formatNumber(averageDistanceFromOptimal, 1)} units from Q*. You adjusted the policy rather than repeating one quantity.`;
  } else if (materiallyBelow > materiallyAbove) {
    policyReading =
      `Your choices averaged ${formatNumber(averageDistanceFromOptimal, 1)} units from Q* and were more often below than above the changing targets. Recheck how a high underage cost or salvage value pushes the target percentile upward.`;
  } else if (materiallyAbove > materiallyBelow) {
    policyReading =
      `Your choices averaged ${formatNumber(averageDistanceFromOptimal, 1)} units from Q* and were more often above than below the changing targets. Recheck how low salvage value raises the cost of carrying the buffer too far.`;
  } else {
    policyReading =
      `Your choices averaged ${formatNumber(averageDistanceFromOptimal, 1)} units from Q*. You moved around the targets in both directions; use the table below to separate forecast shifts from changes in the critical ratio.`;
  }

  let pathReading;
  if (benchmarkGap > 0) {
    pathReading =
      ` You out-earned the adaptive Q* policy by ${formatCurrency(benchmarkGap)} on this particular demand path. That can happen over eight rounds: each Q* is optimal in expectation, not guaranteed to win every realized morning.`;
  } else if (benchmarkGap < 0) {
    pathReading =
      ` On the same eight demands, the adaptive Q* policy earned ${formatCurrency(Math.abs(benchmarkGap))} more. Comparing both policies on the identical path keeps the benchmark fair.`;
  } else {
    pathReading =
      " Your total matched the Q* policy on this demand path. The policy remains an expected-profit result, not a promise about every short sequence.";
  }

  document.getElementById("policy-table-body").innerHTML =
    newsvendorState.results.map(result => `
      <tr>
        <td>${result.scenario.shortName}</td>
        <td>${result.scenario.meanDemand}</td>
        <td>${result.scenario.demandSd}</td>
        <td>${calculateNewsvendorCriticalRatio(result.scenario).toFixed(3)}</td>
        <td>${result.order}</td>
        <td>${result.optimalOrder}</td>
      </tr>`).join("");

  document.getElementById("debrief-summary").textContent = policyReading + pathReading;
  document.getElementById("game-play").hidden = true;
  document.getElementById("game-debrief").hidden = false;
  announceNewsvendor(
    `Challenge complete. Your total profit was ${formatCurrency(playerTotal)}. The Q star benchmark earned ${formatCurrency(optimalTotal)} on the same demands.`
  );
  focusAndScrollTo(document.getElementById("debrief-title"));
}

function sumNewsvendorProfit(policy) {
  return newsvendorState.results.reduce(
    (total, result) => total + result[policy].profit,
    0
  );
}

function setNewsvendorOrder(quantity) {
  document.getElementById("order-input").value = quantity;
  document.getElementById("order-slider").value = quantity;
}

function setNewsvendorControlsEnabled(enabled) {
  document.getElementById("order-input").disabled = !enabled;
  document.getElementById("order-slider").disabled = !enabled;
  document.getElementById("submit-order").disabled = !enabled;
}

function clearNewsvendorInputError() {
  const input = document.getElementById("order-input");
  input.removeAttribute("aria-invalid");
  document.getElementById("order-error").textContent = "";
}

function announceNewsvendor(message) {
  document.getElementById("game-live").textContent = "";
  window.setTimeout(() => {
    document.getElementById("game-live").textContent = message;
  }, 20);
}

function focusAndScrollTo(element) {
  element.setAttribute("tabindex", "-1");
  // Move focus after the triggering button has been hidden; otherwise some
  // browsers fall back to the first focusable element (the skip link).
  window.setTimeout(() => {
    element.focus({ preventScroll: true });
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}

function formatCurrency(value) {
  const rounded = Math.round(value);
  const absolute = Math.abs(rounded).toLocaleString("en-US");
  return rounded < 0 ? `−$${absolute}` : `$${absolute}`;
}

function formatSignedCurrency(value) {
  if (value === 0) return "$0";
  return value > 0
    ? `+$${Math.round(value).toLocaleString("en-US")}`
    : `−$${Math.abs(Math.round(value)).toLocaleString("en-US")}`;
}

function formatNumber(value, decimals) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
