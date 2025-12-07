<objective>
Perform comprehensive analysis of the MarkPrint codebase across architecture, feature gaps, extensibility, and optimization opportunities, then implement the highest-priority improvements identified.

This analysis will inform strategic development decisions and immediately deliver value through implementation of critical features or improvements. The end goal is to strengthen MarkPrint's foundation while adding key capabilities that users need most.
</objective>

<context>
MarkPrint is a VS Code extension that converts Markdown to PDF/HTML/PNG/JPEG using Puppeteer, markdown-it, and a template system. It supports:
- Multiple output formats
- Custom templates and layouts
- Syntax highlighting
- PlantUML and Mermaid diagrams
- Build modes (auto/manual/hybrid)

Read @.claude/CLAUDE.md for project conventions and workflow preferences.

Key files to examine:
- @package.json - dependencies, commands, configuration schema
- @extension.js - main activation and command handlers
- @src/templateRegistry.js - template loading and management
- @src/layoutLoader.js - layout profile handling
- @src/pathResolver.js - path resolution logic
- @src/schemaValidator.js - JSON schema validation
- @src/stylesheetResolver.js - CSS handling
- @templates/ - existing template definitions
- @.plan/ - project planning docs and implementation roadmaps
</context>

<analysis_phase>
Thoroughly analyze the codebase across four dimensions:

1. **Architecture & Structure**
   - Module organization and separation of concerns
   - Dependency management and coupling
   - Design patterns used (or missing)
   - Code reusability and DRY principles
   - Error handling patterns
   - Extension points and hooks

2. **Feature Gaps & Extensibility**
   - Missing features that would add significant value
   - Template system capabilities and limitations
   - Multi-engine support readiness (Puppeteer, Playwright, WeasyPrint, etc.)
   - Pipeline profile system completeness
   - User workflow pain points
   - Plugin or extension opportunities

3. **Optimization Opportunities**
   - Performance bottlenecks in rendering pipeline
   - Resource usage (memory, CPU during conversion)
   - File I/O efficiency
   - Caching opportunities
   - Bundle size and startup time
   - Async/await usage and parallelization

4. **Code Quality & Maintainability**
   - Technical debt hot spots
   - Testing coverage and quality
   - Documentation completeness
   - Configuration complexity
   - Debugging capabilities
   - Upgrade/migration paths

For each dimension, identify:
- Current state assessment
- Critical issues or gaps
- High-impact improvement opportunities
- Implementation complexity (low/medium/high)
- User value impact (low/medium/high)
</analysis_phase>

<prioritization>
After analysis, create a priority matrix ranking improvements by:
1. **User impact** - How much value does this add for users?
2. **Implementation effort** - How complex is this to build?
3. **Strategic alignment** - Does this enable future features?
4. **Risk** - How likely is this to introduce issues?

Identify the top 3-5 improvements with the best impact/effort ratio that should be implemented immediately.
</prioritization>

<implementation_phase>
Based on your analysis and prioritization, implement the highest-priority improvements. This may include:

- New features that fill critical gaps
- Architectural refactoring that unblocks extensibility
- Performance optimizations with measurable impact
- Developer experience improvements (debugging, error messages, etc.)
- Template system enhancements
- Multi-engine support groundwork

For each implementation:
1. Explain WHY this was prioritized (connect to analysis findings)
2. Show the BEFORE state (current limitations)
3. Implement the AFTER state (new capability)
4. Provide usage examples or test cases
5. Update relevant documentation

Go beyond the basics - if implementing a feature, make it fully-featured and production-ready. Consider edge cases, error handling, and user experience.
</implementation_phase>

<output>
Create a comprehensive analysis document:
- `./analysis-report.md` - Full analysis with findings, prioritization matrix, and recommendations

Implement code changes as needed:
- Modify existing files with improvements
- Create new modules if beneficial for separation of concerns
- Update configuration schema in package.json if adding new settings
- Add or update tests for new functionality

Update documentation:
- Update README.md if user-facing features changed
- Add inline comments for complex logic
- Update relevant files in ./docs/ if behavior changed
</output>

<requirements>
- Be thorough in analysis - examine actual code, don't make assumptions
- Prioritize based on evidence from the codebase, not speculation
- Implementations must be complete and production-ready
- Maintain backward compatibility unless breaking changes are justified
- Follow existing code style and patterns
- Include error handling and validation in new code
- Write clear commit-worthy code that could be merged immediately
</requirements>

<constraints>
- Do NOT break existing functionality - test mentally before implementing
- Do NOT introduce new dependencies without strong justification (explain WHY in analysis)
- Respect the existing architecture unless refactoring is a top priority
- Keep the extension lightweight - avoid bloat
- Preserve configuration backward compatibility where possible
</constraints>

<success_criteria>
Analysis complete when:
- All four dimensions thoroughly examined with specific findings
- Priority matrix created with clear rankings
- Top 3-5 improvements identified with justification

Implementation complete when:
- Prioritized improvements are fully implemented
- Code is production-ready with error handling
- Documentation updated to reflect changes
- Analysis report saved to ./analysis-report.md
- All changes explained with connection to analysis findings

Before declaring complete, verify:
- Existing tests still pass (or updated appropriately)
- New functionality works as intended
- No regressions introduced
- Documentation is current
</success_criteria>

<meta_instructions>
This is a complex, high-value task requiring deep analysis and thoughtful implementation. Take time to:
- Thoroughly explore the codebase before making conclusions
- Consider multiple approaches and trade-offs
- Explain your reasoning for prioritization decisions
- Implement with care and attention to quality

Use parallel tool calling when examining multiple independent files or gathering information from different sources simultaneously.

After receiving tool results, reflect on findings before proceeding to ensure you're building an accurate picture of the codebase state.
</meta_instructions>
