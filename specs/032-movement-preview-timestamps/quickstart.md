# Quickstart: Movement Preview Timestamp Consistency

## Automated Validation

Run:

```bash
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Spot Check

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000`.
3. Enter the office and observe employee NPCs near the office computer.
4. Confirm Employee Insight and Knowledge update with the same employee movement state and do not remain stuck in walking after movement should settle.

Manual validation is optional for this regression-focused task unless automated tests expose a rendering or gameplay issue.
