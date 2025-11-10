# Code Review Command

You are conducting a comprehensive code review using multiple specialized agents to ensure thorough analysis.

## Workflow

### Step 1: Ask User for Review Scope

Use the AskUserQuestion tool to ask the user to select the review scope:

```
Question: "What scope would you like to review?"
Options:
  1. "Changed files" - Review all currently modified files (both staged and unstaged)
  2. "Last commit" - Review changes in the most recent commit
  3. "Branch/PR" - Review all changes in the current branch compared to the baseline
```

### Step 2: Gather Changes Based on Scope

Based on the user's selection, gather the relevant changes:

- **Changed files**: Run both `git diff` (unstaged) and `git diff --staged` (staged) to get all modified files, plus `git status` to see untracked files
- **Last commit**: Run `git show HEAD` to get the last commit's changes
- **Branch/PR**:
  1. First find the baseline commit: `git merge-base HEAD origin/main`
  2. Then get the diff: `git diff <baseline-commit>...HEAD`

Create a clear summary of:

- Files changed (with line counts)
- Type of changes (new files, modifications, deletions)
- Affected areas (components, styles, configuration, etc.)
- Key changes overview (2-3 sentences)

### Step 3: Launch Parallel Reviews

Launch TWO agents in parallel using a single message with multiple Task tool calls:

**Agent 1: General Code Review Agent**

```
Prompt: "Review the following code changes for general best practices and code quality.

Review Scope: [insert scope]

Changes Summary:
[insert summary]

Please analyze:
1. Code quality and maintainability
2. Potential bugs or logic errors
3. Performance considerations
4. Security concerns
5. Documentation completeness
6. Test coverage adequacy
7. Adherence to project patterns

For each issue found:
- Severity: critical/major/minor
- File and line reference
- Description of the issue
- Suggested fix

Return your findings in a structured format."
```

**Agent 2: Tailwind/Shadcn Expert Review**

```
Subagent: tailwind-shadcn-expert

Prompt: "Review the following code changes specifically for Tailwind CSS and shadcn/ui best practices.

Review Scope: [insert scope]

Changes Summary:
[insert summary]

Please analyze:
1. Tailwind v4 CSS-first approach compliance
2. Proper use of @layer directives (theme, base, components, utilities)
3. Correct utility class usage and composition
4. Shadcn/ui component integration patterns
5. Accessibility (ARIA, semantic HTML, keyboard navigation)
6. Responsive design implementation
7. Theme token usage (Apollo Design System variables)
8. CSS specificity and cascade issues
9. Component variant patterns with CVA if applicable
10. Performance (unused utilities, bundle size)

For each issue found:
- Severity: critical/major/minor
- File and line reference
- Description of the issue
- Suggested fix with code example

Return your findings in a structured format."
```

### Step 4: Agent Permissions

Both agents have access to:

- Read tool (to read any file)
- Glob tool (to find files)
- Grep tool (to search code)
- Bash tool (for git commands, running tests)
- WebSearch tool (to verify best practices)
- Context7 MCP tools (to fetch up-to-date documentation)

### Step 5: Critical Analysis of Review Comments

After both agents complete their reviews:

1. **Collect all findings** from both agents
2. **Deduplicate** - If both agents found the same issue, merge into one
3. **Validate severity** - Think critically about each severity rating:
   - Is this truly critical/major/minor?
   - Does it actually need fixing or is it subjective?
4. **Categorize** issues by:
   - Must fix (blocks merge)
   - Should fix (technical debt)
   - Nice to have (optional improvements)
5. **Identify patterns** - Are there systemic issues that appear multiple times?

### Step 6: Generate Final Report

Create a comprehensive report with the following structure:

```markdown
# Code Review Report

## Summary

[Brief overview of the changes reviewed]

## Review Scope

- Scope: [changed files/last commit/branch]
- Files Changed: X
- Lines Added: +Y
- Lines Removed: -Z

## Critical Issues (Must Fix Before Merge)

[List critical issues with file:line references and fixes]

## Major Issues (Should Fix)

[List major issues with file:line references and fixes]

## Minor Issues (Optional Improvements)

[List minor issues with file:line references and fixes]

## Positive Findings

[Highlight good practices observed]

## Recommendations

1. [Specific actionable recommendations]
2. [Patterns to follow going forward]
3. [Documentation or test improvements needed]

## Next Steps

[Clear action items for the developer]
```

### Step 7: Offer to Apply Fixes

After presenting the report, ask the user:

```
"Would you like me to apply any of the suggested fixes automatically?
I can fix [list categories that can be auto-fixed, e.g., 'formatting issues', 'import organization', 'simple refactors']"
```

## Important Notes

- Be thorough but pragmatic - not every suggestion needs to block a merge
- Consider the context - a POC has different standards than production code
- Validate findings against official documentation when uncertain
- If agents disagree on severity, use your judgment to resolve
- Focus on actionable feedback with clear examples

## Example Usage

User: `/review`
Assistant: [Asks for scope selection]
User: [Selects "Last commit"]
Assistant: [Gathers changes, launches both agents in parallel, waits for results, analyzes findings, presents comprehensive report]
