/**
 * Knowledge Base Seeder for Sprint 18: RAG.
 * Ingests foundational football tactical guides, IFAB regulations, historical lore, and scouting models.
 */

const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { ingestDocument } = require("../services/rag.service");
const KnowledgeDocument = require("../models/knowledgeDocument.model");
const KnowledgeChunk = require("../models/knowledgeChunk.model");
const logger = require("../config/logger");

const SEED_DOCUMENTS = [
  {
    title: "Tactical Breakdown: The 3-2-4-1 Box Midfield and Half-Space Overloads",
    category: "tactics",
    source: "Tactical Intelligence Dossier",
    author: "Tactical Lab",
    tags: ["tactics", "box midfield", "3-2-4-1", "half spaces", "pep guardiola", "build-up", "inverting fullbacks"],
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
    title: "Gegenpressing Mechanics: Triggers, Space Compression, and Counter-Attacking",
    category: "tactics",
    source: "Coaching Manuals",
    author: "High-Performance Coaching",
    tags: ["tactics", "gegenpressing", "pressing", "klopp", "rangnick", "transitions", "ppda"],
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
    title: "IFAB Laws of the Game: VAR Protocols and Red Card / Penalty Interventions",
    category: "rules",
    source: "IFAB Rulebook & Professional Referee Board",
    author: "Officiating Standards Committee",
    tags: ["rules", "var", "referee", "ifab", "penalties", "red cards", "offside"],
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
    title: "Financial Fair Play (FFP) & Premier League PSR Regulations Explained",
    category: "rules",
    source: "UEFA & Premier League Governance Guidelines",
    author: "Sports Law & Finance Group",
    tags: ["rules", "ffp", "psr", "finances", "transfers", "amortization", "uefa"],
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
    title: "Historical Epic: The 2005 UEFA Champions League Final - Miracle of Istanbul",
    category: "history",
    source: "UEFA Champions League Historical Archives",
    author: "Football Archives",
    tags: ["history", "champions league", "istanbul", "liverpool", "ac milan", "comeback", "gerrard"],
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
    title: "Modern Scouting Metrics: Deciphering xG, xA, Field Tilt, and Progressive Passes",
    category: "scouting",
    source: "Advanced Analytics Intelligence",
    author: "Scouting Department",
    tags: ["scouting", "analytics", "xg", "xa", "field tilt", "data scouting", "recruitment"],
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

    logger.info(`[Knowledge Seeder] Starting ingestion of ${SEED_DOCUMENTS.length} seed documents...`);

    for (const doc of SEED_DOCUMENTS) {
      // Check if document already exists by title
      const existing = await KnowledgeDocument.findOne({ title: doc.title });
      if (existing) {
        // Check if chunks have embeddings and exist in KnowledgeChunk collection
        const chunkCount = await KnowledgeChunk.countDocuments({ documentId: existing._id });
        const hasEmbeddings = existing.chunks?.[0]?.embedding?.length > 0;

        if (chunkCount === 0 || !hasEmbeddings) {
          logger.info(`[Knowledge Seeder] Re-indexing '${doc.title}' with embeddings...`);
          await KnowledgeDocument.findByIdAndDelete(existing._id);
          await KnowledgeChunk.deleteMany({ documentId: existing._id });
          await ingestDocument(doc, { chunkSize: 550, chunkOverlap: 100 });
          logger.info(`[Knowledge Seeder] Re-ingested with embeddings: "${doc.title}"`);
        } else {
          logger.info(`[Knowledge Seeder] Document '${doc.title}' already exists with embeddings. Skipping.`);
        }
        continue;
      }

      await ingestDocument(doc, { chunkSize: 550, chunkOverlap: 100 });
      logger.info(`[Knowledge Seeder] Ingested: "${doc.title}"`);
    }

    logger.info("[Knowledge Seeder] Knowledge base seeding completed successfully.");
  } catch (error) {
    logger.error(`[Knowledge Seeder] Failed to seed knowledge base: ${error.message}`, error);
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
};
