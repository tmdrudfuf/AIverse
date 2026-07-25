import { describe, expect, it } from "vitest";
import {
  extractStructuredAnswerPayload,
  parseStructuredAnswers,
  validateAnswerObject,
} from "./structuredAnswers.js";

const questions = [
  { id: "Q1", question: "Which test covers timeout?", reason: "Need evidence." },
  { id: "Q2", question: "Which artifact is raw?", reason: "Need traceability." },
];

function answersWith(payload: string) {
  return [
    "# Implementer Answers",
    "",
    "## Answers",
    "",
    "- Q1: See tests.",
    "",
    "## Structured Answers",
    "",
    "```json",
    payload,
    "```",
  ].join("\n");
}

const validPayload = JSON.stringify({
  schemaVersion: 1,
  answers: [
    {
      questionId: "Q1",
      answer: "The timeout path is covered by orchestrateCommand.test.ts.",
      evidence: ["tools/agent-workflow/orchestrateCommand.test.ts"],
    },
    {
      questionId: "Q2",
      answer: "The raw Markdown artifact is the independent-review-result file.",
    },
  ],
}, null, 2);

describe("structured answer extraction", () => {
  it("extracts the designated answer JSON block", () => {
    const result = extractStructuredAnswerPayload(answersWith(validPayload));

    expect(result.status).toBe("valid");
    expect(result.blockCount).toBe(1);
    expect(result.payload).toContain('"schemaVersion": 1');
  });

  it("reports absent when no structured answer section exists", () => {
    const result = parseStructuredAnswers("# Implementer Answers\n\nNo JSON.", questions);

    expect(result.status).toBe("absent");
    expect(result.blockCount).toBe(0);
  });

  it("rejects malformed JSON", () => {
    const result = parseStructuredAnswers(answersWith("{ nope"), questions);

    expect(result.status).toBe("invalid");
    expect(result.diagnostics[0]).toContain("malformed");
  });
});

describe("structured answer validation", () => {
  it("normalizes valid Implementer answers", () => {
    const result = parseStructuredAnswers(answersWith(validPayload), questions);
    const validResult = result as unknown as { status: string; answers: { answers: Array<{ questionId: string; evidence?: string[] }> } };

    expect(validResult.status).toBe("valid");
    expect(validResult.answers.answers).toHaveLength(2);
    expect(validResult.answers.answers[0].evidence).toEqual(["tools/agent-workflow/orchestrateCommand.test.ts"]);
  });

  it("rejects unsupported schema versions", () => {
    const result = validateAnswerObject({ schemaVersion: 2, answers: [] }, questions);

    expect(result.status).toBe("unsupported");
  });

  it("rejects missing answers", () => {
    const result = validateAnswerObject({
      schemaVersion: 1,
      answers: [
        { questionId: "Q1", answer: "First answer." },
      ],
    }, questions);

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("Missing answer for questionId: Q2");
  });

  it("rejects duplicate answers", () => {
    const result = validateAnswerObject({
      schemaVersion: 1,
      answers: [
        { questionId: "Q1", answer: "First answer." },
        { questionId: "Q1", answer: "Duplicate answer." },
        { questionId: "Q2", answer: "Second answer." },
      ],
    }, questions);

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("Duplicate answer");
  });

  it("rejects unknown question IDs and extra answers", () => {
    const result = validateAnswerObject({
      schemaVersion: 1,
      answers: [
        { questionId: "Q1", answer: "First answer." },
        { questionId: "Q2", answer: "Second answer." },
        { questionId: "Q3", answer: "Unknown answer." },
      ],
    }, questions);

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("unknown questionId: Q3");
  });

  it("rejects empty answers", () => {
    const result = validateAnswerObject({
      schemaVersion: 1,
      answers: [
        { questionId: "Q1", answer: "" },
        { questionId: "Q2", answer: "Second answer." },
      ],
    }, questions);

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("missing answer");
  });
});
