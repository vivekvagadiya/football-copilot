/**
 * Utility for chunking text documents into manageable semantic segments for RAG pipelines.
 */

/**
 * Splits text into overlapping chunks while preserving sentence boundaries when possible.
 *
 * @param {string} text - Raw input text to split.
 * @param {Object} options - Chunking options.
 * @param {number} [options.chunkSize=600] - Target maximum characters per chunk.
 * @param {number} [options.chunkOverlap=120] - Number of characters to overlap between consecutive chunks.
 * @returns {Array<{ chunkIndex: number, content: string, tokenEstimate: number, keywords: string[] }>}
 */
function splitTextIntoChunks(text, options = {}) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const chunkSize = options.chunkSize || 600;
  const chunkOverlap = options.chunkOverlap || 120;

  const cleanedText = text.replace(/\r\n/g, "\n").trim();
  if (cleanedText.length <= chunkSize) {
    return [
      {
        chunkIndex: 0,
        content: cleanedText,
        tokenEstimate: estimateTokens(cleanedText),
        keywords: extractKeywords(cleanedText),
      },
    ];
  }

  // Split text by paragraph breaks first
  const paragraphs = cleanedText.split(/\n+/);
  const rawSegments = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // If single paragraph exceeds chunkSize, split by sentences
    if (trimmed.length > chunkSize) {
      const sentences = trimmed.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [trimmed];
      rawSegments.push(...sentences.map((s) => s.trim()).filter(Boolean));
    } else {
      rawSegments.push(trimmed);
    }
  }

  const chunks = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (let i = 0; i < rawSegments.length; i++) {
    const segment = rawSegments[i];

    if (!currentChunk) {
      currentChunk = segment;
    } else if (currentChunk.length + segment.length + 1 <= chunkSize) {
      currentChunk += " " + segment;
    } else {
      // Finalize current chunk
      chunks.push({
        chunkIndex,
        content: currentChunk.trim(),
        tokenEstimate: estimateTokens(currentChunk.trim()),
        keywords: extractKeywords(currentChunk.trim()),
      });
      chunkIndex++;

      // Create overlap from end of current chunk
      const overlapText = getOverlapText(currentChunk, chunkOverlap);
      currentChunk = overlapText ? `${overlapText} ${segment}` : segment;
    }
  }

  // Add final remaining chunk if present
  if (currentChunk.trim()) {
    chunks.push({
      chunkIndex,
      content: currentChunk.trim(),
      tokenEstimate: estimateTokens(currentChunk.trim()),
      keywords: extractKeywords(currentChunk.trim()),
    });
  }

  return chunks;
}

/**
 * Extracts the tail portion of text up to maxOverlap characters, ideally at word boundary.
 */
function getOverlapText(text, maxOverlap) {
  if (!text || maxOverlap <= 0) return "";
  if (text.length <= maxOverlap) return text;

  const slice = text.slice(-maxOverlap);
  const firstSpace = slice.indexOf(" ");
  return firstSpace !== -1 ? slice.slice(firstSpace + 1) : slice;
}

/**
 * Estimates token count based on standard ~4 characters per token heuristic.
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Basic keyword extractor to populate search tags and keywords for fast hybrid retrieval.
 */
function extractKeywords(text, topN = 10) {
  if (!text) return [];

  const stopWords = new Set([
    "the", "and", "is", "in", "to", "of", "a", "with", "for", "on", "as", "by", "that",
    "this", "an", "are", "from", "at", "be", "was", "have", "has", "or", "it", "its",
    "which", "their", "into", "more", "can", "will", "than", "about", "other", "also",
    "such", "when", "after", "they", "been", "team", "players", "game", "match"
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const frequency = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

module.exports = {
  splitTextIntoChunks,
  estimateTokens,
  extractKeywords,
};
