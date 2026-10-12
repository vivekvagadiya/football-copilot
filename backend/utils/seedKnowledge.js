/**
 * Knowledge Base Seeder for Sprint 18: RAG.
 * Ingests foundational football tactical guides, IFAB regulations, historical lore, and scouting models.
 */

const mongoose = require("mongoose");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const { ingestDocument } = require("../services/rag.service");
const KnowledgeDocument = require("../models/knowledgeDocument.model");
const KnowledgeChunk = require("../models/knowledgeChunk.model");
const logger = require("../config/logger");

const SEED_DOCUMENTS = [
  {
    title:
      "Tactical Breakdown: The 3-2-4-1 Box Midfield and Half-Space Overloads",
    category: "tactics",
    source: "Tactical Intelligence Dossier",
    author: "Tactical Lab",
    tags: [
      "tactics",
      "box midfield",
      "3-2-4-1",
      "half spaces",
      "pep guardiola",
      "build-up",
      "inverting fullbacks",
    ],
    rawContent: `The 3-2-4-1 formation has revolutionized modern positional play (Juego de Posición). Originally popularized in its modern iteration by Pep Guardiola during Manchester City's treble-winning campaign, the system shifts from a nominal 4-3-3 or 4-2-3-1 in defensive phases into a 3-2-4-1 in possession.

1. Build-up Structure:
In the first phase of build-up, one fullback (or a central defender like John Stones) inverts into the double pivot alongside the defensive midfielder (e.g., Rodri). This forms a stable 'rest defense' of three center-backs and two holding midfielders (a 3-2 base).

2. The Box Midfield Dynamic:
The two holding pivots sit directly behind two advanced number 8s/10s (attacking midfielders), creating a box or diamond shape in the center of the pitch. This numerical 4v3 or 4v2 superiority in central midfield overloads traditional 4-3-3 or 4-4-2 opponent midfields.

3. Exploiting the Half-Spaces:
By pinning opponent fullbacks wide with touchline wingers (isolating 1v1 matchups), large interior channels known as the 'half-spaces' open up between the opposition center-backs and fullbacks. The dual attacking midfielders occupy these pockets of space between the lines. When a center-back steps out to press them, the central striker runs into the vacated space behind.

4. Counter-Pressing and Rest Defense:
The 3-2 rest defense structure provides immediate numerical compactness when possession is lost. The proximity of the 5 defensive players (3 center-backs + 2 pivots) prevents transitions through the center of the pitch, forcing opponent clearances toward the sidelines.`,
  },
  {
    title:
      "Gegenpressing Mechanics: Triggers, Space Compression, and Counter-Attacking",
    category: "tactics",
    source: "Coaching Manuals",
    author: "High-Performance Coaching",
    tags: [
      "tactics",
      "gegenpressing",
      "pressing",
      "klopp",
      "rangnick",
      "transitions",
      "ppda",
    ],
    rawContent: `Gegenpressing (counter-pressing) is the tactical philosophy where a team, immediately after losing possession, aggressively hunts the ball in the transition phase rather than retreating into a defensive shape.

1. The Golden 5-to-8 Second Rule:
Research in football analytics demonstrates that teams winning the ball are at their most vulnerable during the first 5 to 8 seconds of recovery. Their players are expanding their shape to transition into attack, and the ball carrier usually has their head down focusing on controlling the ball.

2. Pressing Triggers:
Elite pressing units trigger immediate collective pressure upon specific stimuli:
- A heavy or inaccurate first touch by the receiver.
- A pass played backwards towards the goalkeeper or a weak-footed defender.
- A player receiving the ball facing their own goal (body orientation restricted).
- The ball traveling towards the touchline, where the boundary acts as an extra defender.

3. Variations of Counter-Pressing:
- Space-oriented (Arrigo Sacchi / Jürgen Klopp): Compacting the zone around the ball and suffocating all immediate passing outlets.
- Man-oriented (Marcelo Bielsa): Each nearby player locks onto the closest opponent.
- Passing-lane oriented (Pep Guardiola): Cutting off passing avenues using cover shadows while funneling play into designated press traps.

4. Analytical Measurement - PPDA:
Passes Allowed Per Defensive Action (PPDA) measures the intensity of a team's press. A lower PPDA (e.g. 7.5 - 9.5) indicates aggressive, high-frequency pressing in the attacking third.`,
  },
  {
    title:
      "IFAB Laws of the Game: VAR Protocols and Red Card / Penalty Interventions",
    category: "rules",
    source: "IFAB Rulebook & Professional Referee Board",
    author: "Officiating Standards Committee",
    tags: [
      "rules",
      "var",
      "referee",
      "ifab",
      "penalties",
      "red cards",
      "offside",
    ],
    rawContent: `The International Football Association Board (IFAB) governs the official Laws of the Game and the operational protocols for Video Assistant Referees (VAR).

1. Clear and Obvious Error Principle:
VAR operates under the standard of 'clear and obvious error' or 'serious missed incident'. The VAR does not re-referee the match; they only advise the on-field referee when an unmistakable error has occurred in four match-changing categories:
- Goal / No Goal decisions (fouls in build-up, offside, ball out of play, handball leading to goal).
- Penalty / No Penalty decisions.
- Direct Red Card incidents (serious foul play, violent conduct, biting, spitting, denying an obvious goal-scoring opportunity - DOGSO). Second yellow cards cannot be reviewed by VAR.
- Mistaken Identity (awarding a card to the incorrect player).

2. On-Field Review (OFR) vs VAR Check:
- Subjective decisions (intensity of a tackle, intentionality of handball, threshold of contact for a penalty) require an On-Field Review (OFR) at the pitchside monitor.
- Factual decisions (offside position, ball crossed line, foul occurred inside or outside the penalty box) can be decided directly by the VAR without pitchside monitor review.

3. Attacking Possession Phase (APP):
When reviewing a goal or penalty, the review is strictly limited to the Attacking Possession Phase (APP). The APP starts from the moment the attacking team gained uncontrolled or controlled possession that directly led up to the event without a defensive reset.`,
  },
  {
    title:
      "Financial Fair Play (FFP) & Premier League PSR Regulations Explained",
    category: "rules",
    source: "UEFA & Premier League Governance Guidelines",
    author: "Sports Law & Finance Group",
    tags: [
      "rules",
      "ffp",
      "psr",
      "finances",
      "transfers",
      "amortization",
      "uefa",
    ],
    rawContent: `Financial Fair Play (FFP) and the Premier League's Profitability and Sustainability Rules (PSR) regulate the financial sustainability of professional football clubs to prevent reckless spending.

1. Premier League PSR Thresholds:
Under Premier League PSR, clubs are permitted maximum allowable losses of £105 million over a rolling three-year evaluation cycle (or £35 million per season). For clubs that spent seasons in the EFL Championship during the period, the allowable limit is reduced.

2. Allowable Deductions:
Not all club expenditures count towards the £105m loss threshold. Deductible investments that promote long-term stability include:
- Infrastructure and stadium development.
- Youth academy investment.
- Women's football development.
- Community and charitable initiatives.

3. Transfer Player Amortization Rules:
When a club buys a player for £100m on a 5-year contract, the fee is capitalized on the balance sheet and amortized equally at £20m per year over 5 years. However, profit from selling an academy player (homegrown player with zero book value) is registered immediately as 100% pure accounting profit in that financial year. Recent UEFA and Premier League rules cap the contract amortization period at a maximum of 5 years regardless of contract length.`,
  },
  {
    title:
      "Historical Epic: The 2005 UEFA Champions League Final - Miracle of Istanbul",
    category: "history",
    source: "UEFA Champions League Historical Archives",
    author: "Football Archives",
    tags: [
      "history",
      "champions league",
      "istanbul",
      "liverpool",
      "ac milan",
      "comeback",
      "gerrard",
    ],
    rawContent: `On May 25, 2005, the Atatürk Olympic Stadium in Istanbul hosted the UEFA Champions League final between AC Milan and Liverpool FC, widely considered one of the greatest matches in sporting history.

1. First Half AC Milan Dominance:
Carlo Ancelotti's star-studded AC Milan (featuring Maldini, Nesta, Pirlo, Seedorf, Kaká, Shevchenko, and Crespo) dismantled Liverpool in the first 45 minutes. Paolo Maldini scored within the first minute, followed by a brace from Hernán Crespo orchestrated by Kaká's playmaking, giving Milan a commanding 3-0 halftime lead.

2. The Tactical Shift and 6-Minute Blitz:
Liverpool manager Rafael Benítez substituted Steve Finnan for Dietmar Hamann at halftime, switching from a 4-4-2 to a 3-4-2-1 / 3-5-2 system. This neutralized Kaká between the lines and liberated captain Steven Gerrard.
- 54th minute: Steven Gerrard scored a looping header into the far corner (3-1).
- 56th minute: Vladimír Šmicer struck a 25-yard low drive past Dida (3-2).
- 60th minute: Gerrard won a penalty after being fouled by Gattuso; Xabi Alonso scored on the rebound after his initial penalty was saved (3-3).

3. The Penalty Shootout and Jerzy Dudek:
After extra time containing legendary double-saves by Jerzy Dudek against Shevchenko, Liverpool won the penalty shootout 3-2, with Dudek utilizing Bruce Grobbelaar's 'spaghetti legs' routine to crown Liverpool European Champions for the 5th time.`,
  },
  {
    title:
      "Modern Scouting Metrics: Deciphering xG, xA, Field Tilt, and Progressive Passes",
    category: "scouting",
    source: "Advanced Analytics Intelligence",
    author: "Scouting Department",
    tags: [
      "scouting",
      "analytics",
      "xg",
      "xa",
      "field tilt",
      "data scouting",
      "recruitment",
    ],
    rawContent: `Modern football recruitment and scouting rely on combining eye-test video analysis with underlying predictive performance metrics.

1. Expected Goals (xG):
Expected Goals quantifies the statistical probability (0.00 to 1.00) of a shot resulting in a goal based on historical data. Key variables include shot distance, angle, body part (foot vs head), assist type (cross, through-ball), pressure from defenders, and goalkeeper positioning.

2. Expected Assists (xA):
xA measures the likelihood that a given pass will become a goal assist. It isolates the quality of a creative player's passing vision regardless of whether the finishing striker scores or misses the chance.

3. Field Tilt:
Field Tilt measures the share of possession a team has strictly in the attacking third of the pitch compared to their opponent: (Attacking third passes / Total attacking third passes in match) * 100. It measures real territorial dominance far more accurately than total possession percentages.

4. Progressive Passes and Carries:
A progressive pass is a completed forward pass that moves the ball towards the opponent's goal line by at least 10 meters (or into the penalty area). Progressive carries measure individual ball progression under pressure, identifying elite box-to-box midfielders and dynamic wingers.`,
  },
];

const NEW_SEED_DOCUMENTS = [
  {
    title:
      "Positional Play: Creating and Exploiting Numerical, Positional, and Qualitative Superiorities",
    category: "tactics",
    source: "Elite Coaching & Tactical Analysis",
    author: "Tactical Intelligence Unit",
    tags: [
      "tactics",
      "positional play",
      "numerical superiority",
      "positional superiority",
      "qualitative superiority",
      "juego de posicion",
      "overloads",
      "third man",
    ],
    rawContent: `Positional play (Juego de Posición) is a tactical framework based on deliberately occupying specific zones of the pitch to create advantages against the opponent. The objective is not simply to retain possession but to use positioning to manipulate defensive structures and create progression opportunities.

1. Numerical Superiority:

A numerical superiority occurs when a team creates more players than the opponent in a specific zone. For example, a 3v2 situation during build-up can allow the team in possession to bypass the first pressing line. Numerical advantages are often created by dropping midfielders, inverting fullbacks, or having a goalkeeper participate in circulation.

2. Positional Superiority:

A positional superiority occurs when a player occupies a strategically advantageous position relative to an opponent. A midfielder receiving between the opponent's midfield and defensive lines can have positional superiority even without a numerical advantage.

3. Qualitative Superiority:

Qualitative superiority occurs when an individual player has a favorable matchup against their direct opponent. A technically superior winger isolated against a slower fullback represents a qualitative advantage.

4. Third-Man Combinations:

A third-man combination involves three players where the first player passes to a second player, who then redirects the ball to a third player. This mechanism is particularly effective when the direct passing lane to the final receiver is blocked.

5. Manipulating the Defensive Block:

Teams use width, depth, player rotations, and positional occupation to force defenders into decisions. Moving one defender can create space for another player, allowing possession to become a mechanism for progressing toward goal rather than an end in itself.`,
  },

  {
    title:
      "High Pressing Structures: Man-Oriented, Zonal, and Hybrid Pressing Systems",
    category: "tactics",
    source: "High-Performance Football Coaching",
    author: "Pressing Analysis Department",
    tags: [
      "tactics",
      "pressing",
      "high press",
      "man-oriented",
      "zonal pressing",
      "hybrid pressing",
      "pressing traps",
      "defensive structure",
    ],
    rawContent: `High pressing is a defensive strategy in which a team attempts to regain possession close to the opponent's goal by applying coordinated pressure immediately after or during the opponent's build-up.

1. Man-Oriented Pressing:

In a man-oriented press, defenders prioritize tracking specific opponents rather than protecting fixed zones. The objective is to restrict passing options by staying close to potential receivers. The system can be highly aggressive but may expose space when a marker is dragged away from their defensive zone.

2. Zonal Pressing:

In zonal pressing, players primarily defend areas and passing lanes rather than following individual opponents. The team maintains structural compactness and attempts to force the opponent toward predictable areas.

3. Hybrid Pressing:

Modern teams frequently combine man-oriented and zonal principles. A player may initially protect a zone but jump aggressively to a specific opponent when a pressing trigger occurs.

4. Pressing Traps:

A pressing trap deliberately encourages the opponent to play into a predetermined area where multiple defenders can immediately apply pressure. Common traps involve directing possession toward the sideline, a weak-footed center-back, or an isolated fullback.

5. Rest Defense:

While pressing, teams must maintain sufficient defensive coverage behind the ball. Center-backs and defensive midfielders form a rest-defense structure that protects against direct counter-attacks if the press is bypassed.

6. Pressing Risk:

The effectiveness of a high press depends on coordination. If the first defender presses without support, the opponent can eliminate multiple defenders with one pass. Successful pressing therefore depends on distances, timing, cover, and collective movement rather than individual running intensity alone.`,
  },

  {
    title:
      "Build-Up Play: Playing Through, Around, and Over the Opposition Press",
    category: "tactics",
    source: "Modern Football Build-Up Manual",
    author: "Elite Build-Up Analysis Group",
    tags: [
      "build-up",
      "tactics",
      "possession",
      "press resistance",
      "playing through",
      "playing around",
      "playing over",
      "goalkeeper",
    ],
    rawContent: `Build-up play describes how a team progresses possession from the goalkeeper and defensive line toward midfield and the attacking third. Modern build-up systems use multiple methods depending on the opponent's pressing structure.

1. Playing Through:

Playing through the press means progressing the ball through central areas using midfielders, interior players, or forwards positioned between defensive lines. This approach requires players capable of receiving under pressure and quickly turning or combining.

2. Playing Around:

Teams can bypass pressure by moving the ball toward the flanks. Fullbacks and wingers provide width while midfielders create supporting angles behind or inside them.

3. Playing Over:

When the opponent commits significant numbers to the press, a goalkeeper or center-back may play a longer pass over the pressing line toward a forward or wide player. The objective is to exploit the space created behind the press.

4. Goalkeeper as an Extra Player:

Modern goalkeepers frequently participate in build-up by providing an additional passing option behind the first pressing line. This can create numerical superiority against a two-player forward press.

5. Body Orientation:

Receiving players should ideally position their body so they can see both the ball and the next area of play. Open body orientation allows faster progression and reduces the number of touches required.

6. Press Resistance:

Press resistance refers to a player's ability to retain or progress possession under pressure. It combines scanning, body positioning, technical control, decision-making, and awareness of surrounding opponents.`,
  },

  {
    title:
      "Expected Goals Deep Dive: Shot Quality, Model Limitations, and Interpretation",
    category: "scouting",
    source: "Football Analytics Methodology",
    author: "Performance Analytics Group",
    tags: [
      "analytics",
      "xg",
      "expected goals",
      "shot quality",
      "finishing",
      "chance creation",
      "football statistics",
    ],
    rawContent: `Expected Goals (xG) is a probabilistic metric that estimates the likelihood that a particular shot will result in a goal. It is designed to evaluate chance quality rather than simply counting shots.

1. What xG Represents:

Each shot receives a probability between 0 and 1. A shot with an xG value of 0.20 is interpreted by the model as having approximately a 20 percent historical probability of becoming a goal, given the characteristics considered by that model.

2. Variables Used by xG Models:

Depending on the provider, models can consider shot location, angle, body part, assist type, defensive pressure, goalkeeper position, previous actions, and whether the shot followed a set piece or open-play situation.

3. Team-Level Interpretation:

If a team produces 2.5 xG and the opponent produces 0.8 xG, the underlying chance quality was substantially in favor of the first team regardless of the final score.

4. Finishing Above or Below Expectation:

Comparing actual goals with xG can provide an indication of finishing performance. However, short-term differences can be heavily influenced by randomness and shot volume.

5. xG Is Not a Universal Number:

Different providers use different datasets, definitions, and modeling techniques. Therefore, xG values from separate providers should not automatically be treated as identical measurements.

6. Important Limitation:

xG describes the quality of chances according to the model. It does not directly measure tactical dominance, defensive organization, passing quality, or the probability of winning a specific match. It should therefore be interpreted alongside other metrics and contextual information.`,
  },

  {
    title: "Football Formation Guide: 4-3-3, 4-2-3-1, 3-5-2, and 4-4-2",
    category: "tactics",
    source: "Football Tactical Reference",
    author: "Formation Analysis Group",
    tags: [
      "formations",
      "4-3-3",
      "4-2-3-1",
      "3-5-2",
      "4-4-2",
      "tactics",
      "shape",
      "system",
    ],
    rawContent: `A football formation describes the team's nominal structural arrangement, but the actual tactical shape frequently changes depending on whether the team has possession, is defending, or is transitioning.

1. 4-3-3:

The 4-3-3 typically contains four defenders, three midfielders, and three forwards. It naturally provides width through wingers and can create strong central midfield triangles. Depending on the team's principles, a fullback may invert into midfield during possession.

2. 4-2-3-1:

The 4-2-3-1 uses two deeper midfielders behind an attacking midfielder and three attacking players. The double pivot can provide defensive protection while the number 10 operates between midfield and defensive lines.

3. 3-5-2:

The 3-5-2 uses three center-backs, wing-backs, and a central midfield three. It can create numerical superiority during build-up and provide two forwards against opposing center-backs.

4. 4-4-2:

The traditional 4-4-2 uses two banks of four with two forwards. It provides a relatively simple defensive structure and can create clear pressing references, while the two-forward line can threaten central defenders directly.

5. Formation Versus Tactical Shape:

A team listed as 4-3-3 may build in a 3-2-5, defend in a 4-1-4-1, and transition into a different structure after losing possession. Therefore, the starting formation alone does not fully describe a team's tactical identity.

6. Structural Trade-Offs:

Every formation creates strengths and weaknesses. Adding players centrally can improve control but reduce natural width. Using aggressive wing-backs can improve attacking width but potentially expose wide defensive spaces during transitions.`,
  },

  {
    title:
      "Transition Phases: Attacking Transition, Defensive Transition, and Counter-Attack Principles",
    category: "tactics",
    source: "Transition Football Analysis",
    author: "Game Model Research Unit",
    tags: [
      "transitions",
      "counter attack",
      "defensive transition",
      "attacking transition",
      "counter pressing",
      "game model",
    ],
    rawContent: `Football transitions are the moments when possession changes from one team to another. Because both teams are temporarily reorganizing their structures, transitions can create high-value attacking and defensive opportunities.

1. Attacking Transition:

An attacking transition begins immediately after winning possession. The team must decide whether to attack quickly while the opponent is disorganized or slow the game down and establish controlled possession.

2. Counter-Attack:

A counter-attack is a rapid attacking sequence following a turnover. It typically seeks to exploit open space before the opponent can recover their defensive structure.

3. Defensive Transition:

A defensive transition begins immediately after losing possession. Players must either counter-press, delay the opponent's attack, or retreat into an organized defensive block.

4. Counter-Pressing Decision:

Counter-pressing is most effective when the ball carrier has limited options, nearby teammates can close passing lanes, and the team has sufficient defensive cover behind the press.

5. First Defensive Objective:

If immediate ball recovery is impossible, the first objective is often to delay the attack and prevent a direct pass into dangerous central areas. This gives teammates time to recover.

6. Transition Balance:

Successful teams balance attacking ambition with protection against counter-attacks. The positioning of players behind the ball before possession is lost is therefore critical to transition defense.`,
  },

  {
    title:
      "Set-Piece Tactics: Corner Kicks, Free Kicks, and Defensive Organization",
    category: "tactics",
    source: "Set-Piece Coaching Framework",
    author: "Dead-Ball Analysis Department",
    tags: [
      "set pieces",
      "corners",
      "free kicks",
      "dead balls",
      "tactics",
      "aerial duels",
      "set piece defense",
    ],
    rawContent: `Set pieces are structured situations in which attacking and defending teams can prepare specific movements before the ball is delivered. They include corner kicks, direct and indirect free kicks, and other restart situations.

1. Corner Kick Structures:

Attacking teams can use near-post runs, far-post movements, blockers, short-corner combinations, or crowded central zones to manipulate defenders.

2. Zonal Defending:

In zonal corner defense, defenders are assigned areas rather than individual attackers. The system prioritizes protecting high-value spaces such as the near-post corridor and central six-yard area.

3. Man-Marking:

In man-oriented set-piece defense, defenders track designated opponents. This can provide strong control over dangerous aerial players but may create movement problems when attackers use screens and rotations.

4. Hybrid Defense:

Many teams combine zonal and man-marking principles. Key defenders may protect important zones while additional players track specific aerial threats.

5. Free-Kick Delivery:

Free kicks can be delivered directly toward goal or into attacking areas depending on distance and angle. Indirect free kicks require the ball to touch another player before a goal can be scored.

6. Second Balls:

Set-piece situations do not end with the first aerial duel. Teams must also prepare for second balls around the penalty area because the initial clearance may fall to an unmarked opponent.

7. Defensive Transition After Set Pieces:

Attacking teams must maintain sufficient defensive coverage behind the delivery to prevent an immediate counter-attack after the ball is cleared.`,
  },

  {
    title:
      "Football Match Analysis: Possession, Territory, Chances, and Game State",
    category: "analytics",
    source: "Match Performance Analysis Framework",
    author: "Football Data Intelligence Group",
    tags: [
      "match analysis",
      "analytics",
      "possession",
      "territory",
      "game state",
      "chance creation",
      "performance analysis",
    ],
    rawContent: `Football match analysis requires multiple dimensions because no single statistic fully represents team performance. Possession, territory, chance quality, game state, and defensive actions should be interpreted together.

1. Possession:

Possession measures the proportion of time or actions during which a team controls the ball. High possession does not automatically indicate superior attacking performance because possession can occur in low-value areas.

2. Territory:

Territorial control evaluates where a team spends time and performs actions on the pitch. A team can have less total possession but still spend significant time in advanced areas.

3. Chance Quality:

Shot volume should be evaluated alongside chance quality. A team producing ten low-probability shots may create less attacking threat than a team producing four high-quality chances.

4. Game State:

The scoreline strongly influences tactical behavior. A team leading late in a match may intentionally reduce attacking risk and concede possession, while a losing team may increase attacking numbers and defensive exposure.

5. Contextual Analysis:

Metrics should be interpreted according to opponent quality, venue, scoreline, red cards, substitutions, and tactical approach.

6. Performance Versus Result:

A team can perform well statistically and still lose a single match. Conversely, a team can win despite producing relatively poor underlying numbers. Match analysis therefore benefits from separating process quality from the final result.`,
  },

  {
    title:
      "Player Roles and Profiles: From Traditional Positions to Modern Hybrid Roles",
    category: "player_roles",
    source: "Modern Player Development Manual",
    author: "Technical Scouting Department",
    tags: [
      "player roles",
      "positions",
      "fullback",
      "winger",
      "midfielder",
      "striker",
      "inverted winger",
      "false nine",
      "regista",
    ],
    rawContent: `Modern football positions are increasingly defined by tactical responsibilities rather than fixed locations. A player can occupy different zones depending on the team's phase of play.

1. Ball-Playing Center-Back:

A ball-playing center-back is expected to contribute to progression through passing, carrying, and breaking the opponent's first pressing line.

2. Inverted Fullback:

An inverted fullback moves inside during possession rather than remaining close to the touchline. This can create an additional midfielder and improve central control.

3. Wing-Back:

Wing-backs operate as both defensive and attacking wide players, particularly in systems using three center-backs. Their role requires significant physical output and tactical awareness.

4. Inverted Winger:

An inverted winger generally starts wide but moves toward the center, often using their stronger foot to attack the inside channel or shoot.

5. Regista:

A regista is a deep-lying playmaker who orchestrates possession from a deeper position. The role emphasizes passing range, tempo control, and spatial awareness.

6. Box-to-Box Midfielder:

A box-to-box midfielder contributes in both defensive and attacking phases, covering significant areas of the pitch and supporting transitions.

7. False Nine:

A false nine starts from the central forward position but frequently drops into midfield or between defensive lines. This can create space for wingers or attacking midfielders to attack the defensive line.

8. Target Forward:

A target forward provides an outlet for direct play through aerial ability, physical strength, hold-up play, and the ability to bring teammates into attacks.

9. Role Versus Position:

Two players listed at the same position may have completely different tactical roles. Modern scouting should therefore evaluate what a player actually does within the team's game model rather than relying only on positional labels.`,
  },

  {
    title:
      "Football Transfer Strategy: Fees, Contracts, Loans, and Squad-Building Economics",
    category: "transfers",
    source: "Professional Football Transfer Analysis",
    author: "Football Finance Research Group",
    tags: [
      "transfers",
      "transfer fees",
      "contracts",
      "loans",
      "squad building",
      "football finance",
      "amortization",
    ],
    rawContent: `Football transfers involve sporting, contractual, and financial considerations. A transfer fee represents only one component of the overall cost of acquiring a player.

1. Transfer Fee:

A transfer fee is the amount agreed between the buying and selling clubs for the registration rights of a player. Additional clauses can include performance-related bonuses and other conditional payments.

2. Contract Length:

Contract duration affects both sporting planning and financial accounting. A longer contract can provide greater control over the player's future but may also create larger long-term wage commitments.

3. Player Wages:

Salary is a recurring squad cost and can significantly exceed the initial transfer fee over the full contract period.

4. Transfer Amortization:

For accounting purposes, a transfer fee that qualifies as a capitalized player registration cost is generally allocated across the player's contract period, subject to applicable accounting and competition regulations.

5. Loan Transfers:

A loan temporarily moves a player's registration or playing rights to another club under agreed conditions. Loans can include loan fees, salary-sharing arrangements, purchase options, or mandatory purchase clauses.

6. Free Transfers:

When a player's contract expires and no transfer fee is payable to the former club, the acquiring club may still incur significant costs through wages, signing bonuses, agent-related costs, and other contractual commitments.

7. Squad-Building Strategy:

Clubs must balance immediate sporting requirements with long-term financial sustainability. Recruitment decisions can consider player age, resale value, wages, tactical fit, injury history, development potential, and contract duration rather than transfer fee alone.`,
  },

  {
    title:
      "Football History: The Evolution from WM and 4-2-4 to Modern Positional Systems",
    category: "history",
    source: "Football Tactical History Archives",
    author: "Historical Tactics Research Group",
    tags: [
      "history",
      "football evolution",
      "WM formation",
      "4-2-4",
      "4-3-3",
      "tactical history",
      "formations",
    ],
    rawContent: `Modern football tactics are the result of continuous structural evolution. Changes in formations have often been driven by attempts to balance attacking numbers, defensive security, and control of midfield space.

1. The WM System:

The WM formation was associated with a 3-2-2-3 structural arrangement and became influential during the early development of organized tactical systems. It attempted to provide clearer defensive and attacking responsibilities.

2. Development of the 4-2-4:

The 4-2-4 became prominent in mid-20th-century football and provided four dedicated attacking players while maintaining two deeper midfielders.

3. Brazil and the 1958 World Cup:

Brazil's 1958 World Cup-winning side is frequently associated with the development of a more sophisticated 4-2-4 structure, with players such as Pelé and Garrincha providing exceptional attacking quality.

4. Emergence of 4-3-3:

The 4-3-3 provided stronger midfield presence while retaining three attacking players. It became an important foundation for later possession-based and pressing systems.

5. Tactical Flexibility:

Over time, coaches increasingly moved away from treating formations as rigid structures. Players began exchanging positions, fullbacks moved into midfield, and attacking midfielders occupied different channels.

6. Modern Positional Systems:

Contemporary systems can transform between multiple shapes during a single match. A team may defend in a 4-4-2, build in a 3-2-5, and attack in a 2-3-5 depending on the coach's principles and the opponent's structure.`,
  },
];

async function seedKnowledgeBase() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not set in environment.");
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
      logger.info("[Knowledge Seeder] Connected to MongoDB.");
    }

    const allDocuments = [...SEED_DOCUMENTS, ...(NEW_SEED_DOCUMENTS || [])];

    logger.info(
      `[Knowledge Seeder] Starting ingestion of ${allDocuments.length} seed documents...`,
    );

    for (const doc of allDocuments) {
      // Check if document already exists by title
      const existing = await KnowledgeDocument.findOne({ title: doc.title });
      if (existing) {
        // Check if chunks exist in KnowledgeChunk collection
        const chunkCount = await KnowledgeChunk.countDocuments({
          documentId: existing._id,
        });

        if (chunkCount === 0) {
          logger.info(`[Knowledge Seeder] Re-indexing '${doc.title}'...`);
          await KnowledgeDocument.findByIdAndDelete(existing._id);
          await KnowledgeChunk.deleteMany({ documentId: existing._id });
          await ingestDocument(doc, { chunkSize: 550, chunkOverlap: 100 });
          logger.info(`[Knowledge Seeder] Re-ingested: "${doc.title}"`);
        } else {
          logger.info(
            `[Knowledge Seeder] Document '${doc.title}' already exists with ${chunkCount} chunks. Skipping.`,
          );
        }
        continue;
      }

      await ingestDocument(doc, { chunkSize: 550, chunkOverlap: 100 });
      logger.info(`[Knowledge Seeder] Ingested: "${doc.title}"`);
    }

    logger.info(
      "[Knowledge Seeder] Knowledge base seeding completed successfully.",
    );
  } catch (error) {
    logger.error(
      `[Knowledge Seeder] Failed to seed knowledge base: ${error.message}`,
      error,
    );
    throw error;
  }
}

// Allow direct execution from CLI
if (require.main === module) {
  seedKnowledgeBase()
    .then(() => {
      console.log("Knowledge base seeded successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Knowledge base seeding failed:", err);
      process.exit(1);
    });
}

module.exports = {
  seedKnowledgeBase,
  SEED_DOCUMENTS,
  NEW_SEED_DOCUMENTS,
};
