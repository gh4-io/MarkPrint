<objective>
Perform a comprehensive codebase analysis combining both high-level structural overview and detailed component examination. This analysis will serve as documentation to help team members understand the project architecture, key patterns, and how different parts interact.

The end goal is to create a reference document that answers: "How is this codebase organized?" and "How do the major components work together?"
</objective>

<context>
This is the SSP Document Publishing Pipeline project focused on automating SOP workflows.

Key areas to understand:
- Project type: Document automation pipeline (Markdown → XML → PDF → Web)
- Primary tools: Pandoc, Python, Node.js, Docker
- Purpose: SOP management and publishing for aviation maintenance operations

Read @CLAUDE.md to understand project conventions and standards.
</context>

<analysis_requirements>
Perform analysis in two phases:

**Phase 1: Structural Overview (Quick)**
- Directory structure and organization patterns
- Key entry points and main modules
- Technology stack and dependencies
- Configuration patterns
- Documentation structure

**Phase 2: Component Deep-Dive (Detailed)**
For each major component identified:
- Purpose and responsibilities
- Key files and their roles
- Data flow and interactions with other components
- Notable patterns or design decisions
- Dependencies and integration points

Thoroughly analyze both the high-level architecture and specific implementation details. Consider multiple perspectives: developer onboarding, maintenance workflows, and extension points.
</analysis_requirements>

<data_sources>
Examine the following systematically:
- Root directory structure
- Configuration files (package.json, requirements.txt, Dockerfile, etc.)
- Main script/entry point files
- Documentation files (README.md, docs/, etc.)
- Source code organization (src/, lib/, scripts/, etc.)
- Build and deployment configurations
</data_sources>

<process>
1. **Discovery phase**: Use Glob to map directory structure and identify key files
2. **Configuration analysis**: Read config files to understand dependencies and setup
3. **Component identification**: Identify major functional components/modules
4. **Flow analysis**: Trace how data/documents flow through the pipeline
5. **Pattern recognition**: Identify architectural patterns, conventions, coding standards
6. **Documentation synthesis**: Compile findings into structured markdown report
</process>

<output_format>
Create a single comprehensive markdown document with this structure:

```markdown
# Codebase Analysis: [Project Name]

## Executive Summary
[2-3 paragraph overview of the codebase]

## Project Structure
[Directory tree with explanations]

## Technology Stack
[Dependencies, frameworks, tools]

## Architecture Overview
[High-level architecture diagram in text/mermaid]
[Key architectural patterns]

## Major Components

### Component 1: [Name]
- **Purpose**: [What it does]
- **Key Files**: [List with brief descriptions]
- **Responsibilities**: [Main functions]
- **Integration**: [How it connects to other parts]

### Component 2: [Name]
[Same structure]

## Data Flow
[How documents/data move through the system]

## Configuration & Environment
[Environment setup, config patterns]

## Notable Patterns & Conventions
[Coding standards, design patterns observed]

## Extension Points
[Where/how to add new features]

## Recommendations
[Observations about structure, potential improvements]
```

Save analysis to: `./analysis/codebase-structure-analysis.md`
</output_format>

<verification>
Before completing, verify:
- All major directories are documented
- Each significant component is explained
- Data flow is clearly traced
- Configuration requirements are identified
- Document is readable and well-organized
- Specific file references include paths (e.g., src/pipeline.py:45)
</verification>

<success_criteria>
- Complete directory structure mapped
- 3-7 major components identified and documented
- Clear data flow explanation
- Technology stack fully documented
- Actionable insights for developers
- Single markdown file created at ./analysis/codebase-structure-analysis.md
</success_criteria>
