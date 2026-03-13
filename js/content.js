/*
 * POM Tutorials - Session Content Configuration
 *
 * Edit THIS file to add/update sessions, swap PDFs, or change problems.
 * You never need to touch the HTML files.
 *
 * Session fields:
 *   number      - Session number (1-5)
 *   topic       - Short topic title shown on cards
 *   status      - "available" | "coming-soon"
 *   summary     - 2-3 sentence description for the session card
 *   slides      - Path to the slide deck PDF (relative to repo root)
 *   recipe      - Path to the recipe/cheat-sheet PDF (optional)
 *   reviewSheet - Path to the review sheet PDF
 *   solutions   - Path to the solutions PDF
 *   concepts    - Array of { title, icon, body } key concept cards
 *   diagrams    - Array of { title, svg } inline SVG diagrams
 *   problems    - Array of problem objects with inline solutions
 *   readings    - Array of { label, url } for further reading links
 */

const SESSIONS = [
  {
    number: 1,
    topic: "Process Improvement",
    status: "available",
    summary: "Learn to identify bottlenecks, calculate capacity and utilization, and evaluate process improvement alternatives. Covers process flow diagrams, direct labor costs, yield-loss analysis, and Little's Law through hands-on manufacturing scenarios.",
    slides: "assets/session1/POM Tutorial 1.pdf",
    recipe: "assets/session1/Recipe 1_Process Improvement.pdf",
    reviewSheet: "assets/session1/Review Sheet 1.pdf",
    solutions: "assets/session1/Review Sheet 1_Solutions.pdf",

    concepts: [
      {
        title: "Bottleneck",
        icon: "\u26d3",
        body: "The resource with the <strong>lowest capacity</strong> (or highest utilization when flows differ). The bottleneck determines the maximum throughput of the entire system. Improving non-bottleneck resources does not increase output."
      },
      {
        title: "Capacity",
        icon: "\u2699",
        body: "Capacity = 1 / (processing time per unit). It tells you how many units a resource can handle per unit of time. Always convert to the same time base before comparing."
      },
      {
        title: "Utilization",
        icon: "\ud83d\udcca",
        body: "Utilization = Input Rate / Capacity. A value of 1.0 (100%) means the resource is fully busy. The bottleneck has the highest utilization. Values above 1.0 are unsustainable."
      },
      {
        title: "Flow Time vs. Throughput",
        icon: "\u23f1",
        body: "<strong>Throughput</strong> = units produced per time period (set by the bottleneck). <strong>Flow time</strong> = total time a unit spends in the system. Little's Law connects them: <em>Inventory = Throughput &times; Flow Time</em>."
      },
      {
        title: "Direct Labor Cost",
        icon: "\ud83d\udcb0",
        body: "Direct Labor Cost per unit = (Number of workers &times; Wage rate) / Flow rate. Adding workers increases the numerator but may also increase the denominator if they relieve the bottleneck."
      },
      {
        title: "Little's Law",
        icon: "\ud83d\udcdd",
        body: "<em>L = &lambda; &times; W</em> &mdash; Average inventory (L) equals throughput (&lambda;) times average flow time (W). Powerful for deducing any one quantity when you know the other two."
      }
    ],

    diagrams: [
      {
        title: "Instant Dolls Co. \u2014 Process Flow",
        svg: '<svg viewBox="0 0 700 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:700px;height:auto"><defs><marker id="ah1" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#003346"/></marker></defs><rect x="10" y="25" width="140" height="50" rx="8" fill="#e0f2fe" stroke="#003346" stroke-width="1.5"/><text x="80" y="45" text-anchor="middle" font-size="11" font-weight="700" fill="#003346">Worker 1</text><text x="80" y="62" text-anchor="middle" font-size="10" fill="#374151">Activity 1 (8 min)</text><line x1="155" y1="50" x2="195" y2="50" stroke="#003346" stroke-width="1.5" marker-end="url(#ah1)"/><rect x="200" y="25" width="180" height="50" rx="8" fill="#fef3c7" stroke="#b45309" stroke-width="1.5"/><text x="290" y="45" text-anchor="middle" font-size="11" font-weight="700" fill="#92400e">Worker 2 (BOTTLENECK)</text><text x="290" y="62" text-anchor="middle" font-size="10" fill="#374151">Act. 2+3 (22 min)</text><line x1="385" y1="50" x2="425" y2="50" stroke="#003346" stroke-width="1.5" marker-end="url(#ah1)"/><rect x="430" y="25" width="160" height="50" rx="8" fill="#e0f2fe" stroke="#003346" stroke-width="1.5"/><text x="510" y="45" text-anchor="middle" font-size="11" font-weight="700" fill="#003346">Worker 3</text><text x="510" y="62" text-anchor="middle" font-size="10" fill="#374151">Act. 4+5 (10 min)</text><line x1="595" y1="50" x2="635" y2="50" stroke="#003346" stroke-width="1.5" marker-end="url(#ah1)"/><text x="665" y="54" text-anchor="middle" font-size="11" fill="#003346">Out</text></svg>'
      },
      {
        title: "Sugar Plant \u2014 Process Flow with Yields",
        svg: '<svg viewBox="0 0 750 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:750px;height:auto"><defs><marker id="ah2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#003346"/></marker></defs><rect x="10" y="20" width="160" height="60" rx="10" fill="#e0f2fe" stroke="#003346" stroke-width="1.5"/><text x="90" y="42" text-anchor="middle" font-size="11" font-weight="700" fill="#003346">Purification</text><text x="90" y="58" text-anchor="middle" font-size="9.5" fill="#374151">100 T/hr | Yield 90%</text><line x1="175" y1="50" x2="220" y2="50" stroke="#003346" stroke-width="1.5" marker-end="url(#ah2)"/><rect x="225" y="20" width="160" height="60" rx="10" fill="#fef3c7" stroke="#b45309" stroke-width="1.5"/><text x="305" y="42" text-anchor="middle" font-size="11" font-weight="700" fill="#92400e">Superheating</text><text x="305" y="58" text-anchor="middle" font-size="9.5" fill="#374151">80 T/hr | Yield 80%</text><line x1="390" y1="50" x2="435" y2="50" stroke="#003346" stroke-width="1.5" marker-end="url(#ah2)"/><rect x="440" y="20" width="160" height="60" rx="10" fill="#e0f2fe" stroke="#003346" stroke-width="1.5"/><text x="520" y="42" text-anchor="middle" font-size="11" font-weight="700" fill="#003346">Crystallization</text><text x="520" y="58" text-anchor="middle" font-size="9.5" fill="#374151">70 T/hr | Yield 80%</text><line x1="605" y1="50" x2="650" y2="50" stroke="#003346" stroke-width="1.5" marker-end="url(#ah2)"/><text x="700" y="54" text-anchor="middle" font-size="10" font-weight="600" fill="#166534">Sugar</text><line x1="90" y1="82" x2="90" y2="110" stroke="#dc2626" stroke-width="1" stroke-dasharray="4,3"/><text x="90" y="125" text-anchor="middle" font-size="9" fill="#dc2626">10% waste</text><line x1="305" y1="82" x2="305" y2="110" stroke="#dc2626" stroke-width="1" stroke-dasharray="4,3"/><text x="305" y="125" text-anchor="middle" font-size="9" fill="#dc2626">20% waste</text><line x1="520" y1="82" x2="520" y2="110" stroke="#dc2626" stroke-width="1" stroke-dasharray="4,3"/><text x="520" y="125" text-anchor="middle" font-size="9" fill="#dc2626">20% waste</text><text x="90" y="150" text-anchor="middle" font-size="8.5" fill="#6b7280">50\u219245 T</text><text x="305" y="150" text-anchor="middle" font-size="8.5" fill="#6b7280">45\u219236 T</text><text x="520" y="150" text-anchor="middle" font-size="8.5" fill="#6b7280">36\u219228.8 T</text></svg>'
      }
    ],

    problems: [
      {
        title: "Instant Dolls Co.",
        difficulty: "*",
        parts: [
          {
            question: "What is the bottleneck of the process?",
            solution: "<strong>Worker 2</strong> is the bottleneck.<br><br><strong>Step 1:</strong> Compute processing time per worker:<br>&bull; W1: Activity 1 = <strong>8 min</strong><br>&bull; W2: Activities 2+3 = 10 + 12 = <strong>22 min</strong><br>&bull; W3: Activities 4+5 = 7 + 3 = <strong>10 min</strong><br><br><strong>Step 2:</strong> Compute capacity of each worker:<br>&bull; W1: 1/8 units/min = <strong>7.5 units/hr</strong><br>&bull; W2: 1/22 units/min = <strong>2.73 units/hr</strong><br>&bull; W3: 1/10 units/min = <strong>6 units/hr</strong><br><br><strong>Step 3:</strong> The resource with the <em>lowest capacity</em> is the bottleneck &rarr; <strong>W2 at 2.73 units/hr</strong>."
          },
          {
            question: "How much time will it take to produce 250 units? (empty system start)",
            solution: "<strong>Answer: 5,518 minutes</strong><br><br><strong>Key insight:</strong> The first unit must pass through ALL workers sequentially. After that, the system settles into a steady rhythm set by the bottleneck.<br><br><strong>First unit:</strong> 8 + 22 + 10 = <strong>40 min</strong> (flow time)<br><strong>Remaining 249 units:</strong> Each exits every 22 min (the bottleneck cycle time)<br><br><strong>Total = 40 + 22 &times; 249 = 40 + 5,478 = 5,518 min</strong><br><br><em>If the system were already running (not empty):</em> 250 &times; 22 = 5,500 min."
          },
          {
            question: "What is the utilization of Worker 3 at full capacity?",
            solution: "<strong>Answer: 45.5% (10/22)</strong><br><br>When the bottleneck operates at 100%, the system flow rate = 1/22 units/min.<br><br>Utilization of W3 = Flow rate / Capacity of W3<br>= (1/22) / (1/10)<br>= 10/22<br>= <strong>0.455 or 45.5%</strong><br><br><em>W3 is idle more than half the time because it works much faster than the bottleneck feeds it.</em>"
          },
          {
            question: "What is the average labor utilization? (no empty system effects)",
            solution: "<strong>Answer: 60%</strong><br><br><strong>Method 1 (individual utilizations):</strong><br>&bull; W1: (1/22) / (1/8) = 8/22 = 0.364<br>&bull; W2: (1/22) / (1/22) = 1.000<br>&bull; W3: (1/22) / (1/10) = 10/22 = 0.455<br><br>Average = (0.364 + 1.000 + 0.455) / 3 = <strong>0.606 &asymp; 60%</strong><br><br><strong>Method 2 (labor content formula):</strong><br>Labor content = 8 + 22 + 10 = 40 min<br>Total idle time = (22\u22128) + (22\u221222) + (22\u221210) = 14 + 0 + 12 = 26 min<br>Avg utilization = 40 / (40 + 26) = 40/66 = <strong>0.606</strong>"
          },
          {
            question: "What are the direct labor costs per doll? ($15/hr wage)",
            solution: "<strong>Answer: $16.50 per doll</strong><br><br>Direct labor cost = Total wages per hour / Flow rate per hour<br><br>Total wages = 3 workers &times; $15/hr = $45/hr<br>Flow rate = 60/22 = 2.727 dolls/hr<br><br>Cost per doll = $45 / 2.727 = <strong>$16.50</strong>"
          },
          {
            question: "Alternative I: Where would you assign a new hire?",
            solution: "<strong>Answer: Assign the new worker to W2 (the bottleneck)</strong><br><br>To increase throughput, you must always relieve the bottleneck first. W2 processes activities 2 and 3 (22 min total). With a helper, they can split the work:<br><br>Each worker at station 2: 22/2 = <strong>11 min</strong><br><br>New bottleneck: W2 station at 11 min (still the bottleneck, but now faster).<br>New flow rate: 1/11 units/min = <strong>5.45 units/hr</strong>."
          },
          {
            question: "What is the direct labor cost per doll with the new worker (Alt. I)?",
            solution: "<strong>Answer: $11.00 per doll</strong><br><br>Total wages = 4 workers &times; $15/hr = $60/hr<br>Flow rate = 60/11 = 5.45 dolls/hr<br><br>Cost per doll = $60 / 5.45 = <strong>$11.00</strong><br><br><em>Even though we added a worker (more cost), the throughput nearly doubled, so the per-unit cost actually dropped from $16.50 to $11.00!</em>"
          },
          {
            question: "What are the direct labor costs under Alternative II? (re-assign Act. 2 to W1)",
            solution: "<strong>Answer: $13.50 per doll</strong><br><br>New assignment:<br>&bull; W1: Activities 1+2 = 8 + 10 = <strong>18 min</strong><br>&bull; W2: Activity 3 = <strong>12 min</strong><br>&bull; W3: Activities 4+5 = <strong>10 min</strong><br><br>New bottleneck: W1 at 18 min<br>Flow rate = 60/18 = 3.33 dolls/hr<br><br>Cost per doll = (3 &times; $15) / 3.33 = <strong>$13.50</strong><br><br><em>Alt. II is better than the original ($16.50) but worse than Alt. I ($11.00), though Alt. II doesn't require hiring.</em>"
          }
        ]
      },
      {
        title: "Ceramics Production",
        difficulty: "**",
        parts: [
          {
            question: "What is the utilization of Stage 2 if input is 5 units/hr?",
            solution: "<strong>Answer: 40%</strong><br><br><strong>Step 1:</strong> Convert all rates to units/hr:<br>&bull; Stage 1 capacity: 60/5 = 12 units/hr<br>&bull; Stage 2 capacity: 60/6 = 10 units/hr<br>&bull; Stage 3 capacity: 60/4 = 15 units/hr<br><br><strong>Step 2:</strong> Track flows through the process:<br>Input to Stage 1 = 5 units/hr<br>20% defective &rarr; go to rework<br>80% good &rarr; reach Stage 2<br><br>Input to Stage 2 = 5 &times; 0.8 = <strong>4 units/hr</strong><br><br><strong>Step 3:</strong> Utilization = Input / Capacity = 4/10 = <strong>0.40 (40%)</strong>"
          },
          {
            question: "Where is the bottleneck (highest utilization at any sustainable rate)?",
            solution: "<strong>Answer: Stage 1 is the bottleneck (41.67%)</strong><br><br>Check all four resources at 5 units/hr input:<br><br>&bull; <strong>Stage 1:</strong> 5/12 = 0.4167 (41.67%)<br>&bull; <strong>Stage 2:</strong> 4/10 = 0.40 (40%)<br>&bull; <strong>Stage 3:</strong> Input = 4 &times; 0.9 = 3.6 &rarr; 3.6/15 = 0.24 (24%)<br><br>&bull; <strong>Rework operator</strong> (tricky \u2014 three different flows):<br>&nbsp;&nbsp;From Stage 1: 5&times;0.2 / 4 per hr = 0.25<br>&nbsp;&nbsp;From Stage 2: 4&times;0.1 / 6 per hr = 0.067<br>&nbsp;&nbsp;From Stage 3: 3.6&times;0.1 / 12 per hr = 0.03<br>&nbsp;&nbsp;Total rework utilization = 0.25 + 0.067 + 0.03 = <strong>0.347 (34.7%)</strong><br><br>Stage 1 has the highest utilization &rarr; <strong>bottleneck</strong>."
          },
          {
            question: "Max process capacity after training (defect rates: 10%, 5%, 5%)?",
            solution: "<strong>Answer: 11.11 units/hr</strong><br><br>With improved quality, more units flow downstream. Check if bottleneck shifts:<br><br>At 5 units/hr: Stage 2 now receives 5 &times; 0.9 = 4.5 &rarr; utilization = 4.5/10 = <strong>45%</strong> (now higher than Stage 1's 41.67%!)<br><br>The <strong>bottleneck shifts to Stage 2</strong> after training.<br><br>To find max capacity, set Stage 2 to 100%:<br>&lambda;<sub>2,max</sub> = 10 units/hr<br><br>Since &lambda;<sub>2</sub> = &lambda;<sub>1</sub> &times; 0.9:<br>&lambda;<sub>1,max</sub> = 10 / 0.9 = <strong>11.11 units/hr</strong><br><br><em>Key insight: Improving quality at Stage 1 shifted the bottleneck downstream! The rework station, which was never a bottleneck, becomes even less utilized.</em>"
          }
        ]
      },
      {
        title: "A Sweet Job (Sugar Plant)",
        difficulty: "**",
        parts: [
          {
            question: "Utilization of each stage and bottleneck at 50 T/hr input?",
            solution: "<strong>Answer: Superheating is the bottleneck (56.25%)</strong><br><br>Track flows through the process:<table style='margin:.75rem 0;border-collapse:collapse;font-size:.85rem;width:100%'><tr style='background:#f3f4f6'><th style='padding:.4rem .6rem;text-align:left;border:1px solid #e5e7eb'>Stage</th><th style='padding:.4rem .6rem;border:1px solid #e5e7eb'>Input</th><th style='padding:.4rem .6rem;border:1px solid #e5e7eb'>Output</th><th style='padding:.4rem .6rem;border:1px solid #e5e7eb'>Capacity</th><th style='padding:.4rem .6rem;border:1px solid #e5e7eb'>Utilization</th></tr><tr><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'>Purification</td><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'>50</td><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'>45 (90%)</td><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'>100</td><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'>50%</td></tr><tr style='background:#fef3c7'><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'><strong>Superheating</strong></td><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'>45</td><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'>36 (80%)</td><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'>80</td><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'><strong>56.25%</strong></td></tr><tr><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'>Crystallization</td><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'>36</td><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'>28.8 (80%)</td><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'>70</td><td style='padding:.4rem .6rem;border:1px solid #e5e7eb'>51.43%</td></tr></table><strong>Plant capacity</strong> (bottleneck at 100%): Input to superheating = 80 T/hr &rarr; output = 64 &rarr; crystallization output = 64 &times; 0.8 = <strong>51.2 T/hr</strong>"
          },
          {
            question: "New capacity with Technology A (8 T/hr re-processing)?",
            solution: "<strong>Answer: 40 T/hr crystallized sugar</strong><br><br>Technology A converts crystallization waste directly to finished sugar.<br><br>The re-processing stage becomes the <strong>new bottleneck</strong> (utilization = 7.2/8 = 90% at current rates).<br><br>At 100% utilization of re-processing:<br>Re-processing needs 8 T/hr input = 20% of crystallization input<br>&rarr; Crystallization input = 8/0.2 = 40 T/hr<br>&rarr; Crystallization good output = 40 &times; 0.8 = 32 T/hr<br>&rarr; Total output = 32 + 8 = <strong>40 T/hr</strong><br><br><strong>Minimum re-processing capacity to keep Superheating as bottleneck:</strong><br>At 50 T/hr input, waste to re-processing = 7.2 T/hr<br>Superheating utilization = 56.25%<br>Need: 7.2 / capacity = 0.5625 &rarr; capacity = <strong>12.8 T/hr</strong>"
          },
          {
            question: "New capacity with Technology B re-processing loop (20 T/hr)?",
            solution: "<strong>Answer: 56 T/hr crystallized sugar</strong><br><br>Technology B recycles waste back to crystallization, creating a <strong>feedback loop</strong>.<br><br><strong>Key equation:</strong> Let X = input from superheating, Y = input from re-processing.<br>Y = 0.2 &times; (X + Y) &nbsp;&nbsp;(20% of total crystallization input becomes waste)<br>Y = 0.2X + 0.2Y<br>0.8Y = 0.2X<br><strong>Y = X/4</strong><br><br>Total crystallization input = X + Y = X + X/4 = <strong>1.25X</strong><br><br>At 50 T/hr system input: X = 36, so crystallization input = 45 T/hr &rarr; utilization = 45/70 = <strong>64.3%</strong><br>Crystallization is now the bottleneck!<br><br>At 100%: crystallization input = 70 T/hr = 1.25X &rarr; X = 56 T/hr from superheating<br>Good output = 70 &times; 0.8 = <strong>56 T/hr</strong><br>Re-processing input = 70 &times; 0.2 = 14 T/hr (within 20 T/hr capacity &check;)"
          }
        ]
      },
      {
        title: "Sport Obermeyer",
        difficulty: "*",
        parts: [
          {
            question: "Compare throughput and flow time between Mexico (40 workers) and China (20 workers)",
            solution: "<strong>Answer: (c) Same throughput, Mexico has longer flow time</strong><br><br>Apply <strong>Little's Law: L = &lambda; &times; W</strong><br><br>&bull; <strong>Throughput (&lambda;)</strong>: Both factories have the same capacity &rarr; same throughput.<br><br>&bull; <strong>Inventory (L)</strong>: With transfer lot size = 1, each worker holds one parka at a time.<br>&nbsp;&nbsp;Mexico: L = 40 parkas in progress<br>&nbsp;&nbsp;China: L = 20 parkas in progress<br><br>&bull; <strong>Flow time (W) = L / &lambda;</strong>:<br>&nbsp;&nbsp;Mexico: W = 40/&lambda;<br>&nbsp;&nbsp;China: W = 20/&lambda;<br>&nbsp;&nbsp;Mexico flow time is <strong>2&times; longer</strong> than China's.<br><br><em>Why? More specialized workers means more handoffs and more WIP. Same throughput, but each parka spends longer in the system.</em>"
          }
        ]
      }
    ],

    readings: [
      { label: "Recipe 1: Process Improvement (PDF)", url: "assets/session1/Recipe 1_Process Improvement.pdf" },
      { label: "Further reading - placeholder link 1", url: "#" },
      { label: "Further reading - placeholder link 2", url: "#" }
    ]
  },
  {
    number: 2,
    topic: "Managing Variability",
    status: "coming-soon",
    summary: "Explore how variability in processing times, arrival rates, and demand affects system performance. Covers queuing models and strategies for buffering against uncertainty.",
    slides: null, recipe: null, reviewSheet: null, solutions: null,
    concepts: [], diagrams: [], problems: [],
    readings: [
      { label: "Further reading - placeholder link 1", url: "#" },
      { label: "Further reading - placeholder link 2", url: "#" }
    ]
  },
  {
    number: 3,
    topic: "Managing Risks (Newsvendor I)",
    status: "coming-soon",
    summary: "Introduction to the Newsvendor model for single-period inventory decisions under demand uncertainty. Covers critical ratio, over-ordering vs. under-ordering trade-offs.",
    slides: null, recipe: null, reviewSheet: null, solutions: null,
    concepts: [], diagrams: [], problems: [],
    readings: [
      { label: "Further reading - placeholder link 1", url: "#" },
      { label: "Further reading - placeholder link 2", url: "#" }
    ]
  },
  {
    number: 4,
    topic: "Managing Risks (Newsvendor II)",
    status: "coming-soon",
    summary: "Advanced applications of the Newsvendor framework including multi-product scenarios, risk pooling, and the value of information in supply chain decisions.",
    slides: null, recipe: null, reviewSheet: null, solutions: null,
    concepts: [], diagrams: [], problems: [],
    readings: [
      { label: "Further reading - placeholder link 1", url: "#" },
      { label: "Further reading - placeholder link 2", url: "#" }
    ]
  },
  {
    number: 5,
    topic: "TBD",
    status: "coming-soon",
    summary: "Topic to be announced. Check back for updates.",
    slides: null, recipe: null, reviewSheet: null, solutions: null,
    concepts: [], diagrams: [], problems: [],
    readings: [
      { label: "Further reading - placeholder link 1", url: "#" },
      { label: "Further reading - placeholder link 2", url: "#" }
    ]
  }
];
