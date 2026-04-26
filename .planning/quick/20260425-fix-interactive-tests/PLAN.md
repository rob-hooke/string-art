---
phase: quick
plan: fix-interactive-tests
type: execute
wave: 1
depends_on: []
files_modified: [package.json, .planning/phase1/plans/01-01-PLAN.md, .planning/STATE.md]
autonomous: true
requirements: []
---

<objective>
Fix interactive shell hang during test execution by ensuring all test commands use non-interactive flags.

Purpose: Prevent the agent from hanging when running tests in automated environments.
Output: Updated package.json and planning documents with non-interactive test commands.
</objective>

<execution_context>
@$HOME/.gemini/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@package.json
@.planning/phase1/plans/01-01-PLAN.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update package.json test scripts</name>
  <files>package.json</files>
  <action>
    - Change "test": "vitest" to "test": "vitest run" to ensure it defaults to non-interactive mode.
    - Add "test:watch": "vitest" for users who want the interactive mode.
  </action>
  <verify>
    <automated>grep -E "\"test\": \"vitest run\"" package.json && grep -E "\"test:watch\": \"vitest\"" package.json</automated>
  </verify>
  <done>package.json scripts are updated to default to non-interactive tests.</done>
</task>

<task type="auto">
  <name>Task 2: Update 01-01-PLAN.md verification commands</name>
  <files>.planning/phase1/plans/01-01-PLAN.md</files>
  <action>
    - Update all `<verify>` blocks that use `npm test` to ensure they are explicitly non-interactive if needed, or rely on the updated package.json.
    - Although the package.json update covers it, it's safer to use `npm test -- <file>` which will now call `vitest run <file>`.
    - I'll scan for any other interactive-prone commands.
  </action>
  <verify>
    <automated>grep "npm test" .planning/phase1/plans/01-01-PLAN.md</automated>
  </verify>
  <done>All verification commands in the plan are safe for non-interactive execution.</done>
</task>

<task type="auto">
  <name>Task 3: Update STATE.md with Quick Tasks table</name>
  <files>.planning/STATE.md</files>
  <action>
    - Add a "## Quick Tasks" section to STATE.md if it doesn't exist.
    - Add the "Fix interactive shell hang" task to the table, marked as complete (or to be completed).
  </action>
  <verify>
    <automated>grep "## Quick Tasks" .planning/STATE.md</automated>
  </verify>
  <done>STATE.md reflects the quick task execution.</done>
</task>

</tasks>

<success_criteria>
- `npm test` no longer hangs in the terminal.
- Planning documents use safe test commands.
- Quick task is documented in STATE.md.
</success_criteria>

<output>
After completion, create `.planning/quick/20260425-fix-interactive-tests/SUMMARY.md`
</output>
