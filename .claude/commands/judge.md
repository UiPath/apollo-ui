# judge

Critically evaluate a statement by generating opposing viewpoints, researching evidence, and providing an informed judgment.

## Usage

```
/judge <statement>
```

## Examples

```
/judge Variable 'object' has never been directly used, we always use 'object.prop', so we can simplify it as 'objectProp'
/judge This component should be a class component instead of functional component
/judge We should use Redux for all state management in this application
```

## Description

This command performs critical analysis by:

- Generating 1-3 opposing viewpoints that challenge the original statement
- Researching relevant code, documentation, and best practices
- Evaluating evidence to determine which viewpoint is most accurate
- Tagging findings as [fact] or [opinion] for clarity

## Implementation

When this command is run:

### Step 1: Parse Statement

Extract and understand the core claim being made.

### Step 2: Generate Opposing Viewpoints

Create 1-3 alternative perspectives that:

- Directly contradict the statement
- Partially agree with important caveats
- Present alternative interpretations or context-dependent exceptions

### Step 3: Research Phase

Use available tools to gather evidence:

- Read relevant code files to verify claims
- Search codebase for usage patterns
- Check documentation and type definitions
- Web search for industry best practices
- Analyze similar patterns in the project

### Step 4: Evaluation and Reporting

Present findings in the following format:

```
## Original Statement
[The statement being evaluated]

## Opposing Viewpoints
1. [First alternative perspective]
2. [Second alternative perspective]
3. [Third alternative perspective, if applicable]

## Research Findings
[fact] [Objective findings from code/documentation]
[fact] [Verifiable data points]
[opinion] [Subjective interpretations]
[opinion] [Best practice recommendations]

## Conclusion
[opinion] [Final judgment on which viewpoint is most accurate and why]
```

## Key Features

- **Critical Thinking**: Never accepts statements at face value
- **Evidence-Based**: Grounds conclusions in actual code and documentation
- **Transparent**: Clearly distinguishes facts from opinions
- **Balanced**: Considers multiple perspectives before judging
- **Actionable**: Provides clear recommendation with rationale

## Notes

- This command embodies the "Critical Thinking and Verification" principle
- It will push back against incorrect assumptions
- It prioritizes correctness over agreement
- It provides reasoned analysis rather than simple validation
