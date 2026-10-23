# VokiBot Developer Notes

## Project

- Spanish electoral emulator with historical and crafted scenarios
- A fixed viewport SPA
- Stack: Javascript/Mithril/Mdc/Webpack progressively migrating to Javascript/React/Mantine/Vite
- SDK: Bun

## Token economy

- **Default to the shortest answer that fully answers**
- Outlines over tables and prose; no preambles, no recap of what you just did, no re-explaining changes the diff already shows
- Lead with the outcome. No narration, no filler praise, 
- Use full diff to propose changes, not full code snippets.
- Agents just analyze code in plan mode and edits it in build mode.
- Agents propose build and test commands for the user to run; agents NEVER run them (not `bun run build`, not `bun test`)

## Controlled Workflow

1. **Task**: User asks a task
2. **Converge**: Agent asks the user one by one those aspects that are ambiguous in the task
3. **Propose**: Agent proposes code changes (few tens of lines), focused on a clear goal,
   presented as a full diff in chat (no file touched yet).
4. **Refine**: User reviews, asks refinements in chat
5. **Apply**: Agent edits the files as per the approved diff; User may apply them instead.
6. **Build/Test**: User compiles, tests, and provides feedback in chat. The agent does not compile or test (this is important)
7. **Iterate**: Repeat until User commits or discards the proposal by reverting uncommitted changes.

The User may `git add` an unaccepted proposal before asking for refinements
in order to have both diffs (full proposal and refinements)
or to roll back just the refinements.

**Proposal categories** (do not mix in one proposal):
1. Style (formatting, naming)
2. Code moved among files
3. Code moved within a file
4. Other refactors
5. Added functionality
6. Build system and dependencies

**Rules**:
- Do NOT execute git commands that change repo state (commit, push, add, etc.)
- Read-only git commands are allowed (status, log, diff, etc.)
- Do NOT modify untracked files
- May create new files, but only change initial content after User adds them to the stage
- Produce small, focused proposals
- Split large changes into multiple small changesets,
  planning a sequence where each step keeps the codebase working.
  This requires strategic thinking:
  break the task into incremental steps
  (each must compile; all tests must pass except the new test during TDD RED phase).
- Before entering to build mode and edit/create files, the user wants to see a full diff of it

## TDD (Test-Driven Development)

When using TDD (Beck/Fowler methodology):
1. **Red**: Write a single failing test.
   Only a failing assertion counts as RED --
   compilation errors, runtime crashes, or build failures do not qualify as RED.
   The proposal must compile,
   and only the new test may fail;
   existing tests must still pass.
2. **Green**: Write the minimal implementation to make the test pass. Do not add extra behavior.
3. **Refactor**: Clean up code while keeping tests passing.

**When to use**: TDD applies to platform-independent code (e.g., business logic, data models, utilities). UI code does not use TDD yet.

Notice: The RED is not just writing the test. A RED may also change production code in those cases:

- Failing Stub: The RED for the first test of a new SUT (class, method...) often requires a stub that implements the interface but still fails by an assertion failure, and not failing by a missing import, class, method...
- Demotion: If we over implemented in the previous Green or Refactor, we can still make room for a new test to increase coverage by demoting the implementation if that does not make the previous tests to fail. This is better done previously to the RED as refactor but often is done as afterthouht when we see a planned test is not failing.

**Test writing conventions**:
- Avoid multiple asserts in a single test
- When asserting multiple parts of a structure, build a helper that dumps the structure as a big string and assert it against the expected string, so the runner shows a multiline diff where the differences are easy to spot
- When testing multiple cases with the same logic, create a separate test method for each case; extract common code to a helper method with discriminant features as parameters
- Asserting large structures often became fragile. Concentrate inside a helper the setup of the irrelevant parts of the structure, and parametrize the relevant ones, to make updating those irrelevant parts easier. Do not expose parameters before they are needed.
- For setup objects, encapsulate common setup in a helper with parameters for what varies between cases; this makes each test case show only what differs
- Name the tests to include those parts: sut, case and optionally expectation, like in `summary with many errors display one each line`
- For literals, choose content that when shown in assertions, help to make faster diagnoses. Instead of naming two test objects 'a' and 'b', name them "previous", "wrongname"
- For aggregations consider testing 0, 1, N cases. Depending on the case, 0 or 1 first may make simpler fail the tests in order.

**Rules**:
- Do not change existing behavior during RED phase: for a bug, the test fails
  against the current code as-is; for new functionality, the stub compiles but
  gives a wrong result
- Implement only what is needed to pass the test, no more
- Each step must compile.
  RED proposals have only the new test failing by design;
  existing tests must still pass.
  GREEN and refactored steps must pass all tests.

**Workflow**: Agent proposes RED code
(test + deliberately wrong implementation that compiles but the new test fails).
User reviews the RED --
runs the test and verifies the failure message is informative,
may adjust the test.
After approval, Agent adds the GREEN fix.
The User commits RED and GREEN together in a single commit for the step
(test and its minimal implementation are one topic).
REDs are never committed alone because they would break CI/CD.

### Long refactorings workflow (Duppe, Fill, Rely, Cleanup)

To keep larger refactors in small steps with stable commits,
Agent should split the code change proposals in committable stages following the methodology explained here.
Most refactors replace an old artifact (file, class, method, attribute, data source...) with a new one.
This methodology requires having different interface entry points for queries (getters) and updates (setters) of the state;
whenever any artifact mixes them, Agent should spot the case to the user and ask how to proceed.

The stages are:

1. Duppe (Duplicate):
Create the new artifact (file, class, method, attribute, data source)
that will hold the target code, without removing the existing one.
Both old and new coexist.

2. Fill (Keep in sync):
Ensure the new artifact mirrors the state of the old one by
updating the new artifact whenever the old one is modified (double setting)
This step can be split by each state update strategically thinking what needs to be done first.

3. Rely (Switch to new):
Once the new artifact faithfully represents the old one,
switch to using it in the code.
Replace remaining uses of the old artifact with use of the new one (replace getters).
This step can also be split by each state query.

4. Cleanup:
Remove the original artifact and any remaining state-setting code.

Since all the steps are stable, we could stop an ongoing refactor and focus on TDD some missing stuff in the new artifact.


## Style

- Prefer early exits
- Apply extract method to sectioning comments
- IDs and comments in English (regardless of prompt language)
- Avoid "conversational comments": code comments that make sense only in this conversation, common in tutorials but awful in committed code
- Comments should help maintenance, not explain what you changed
- Names should provide meaning and purpose, names should suffice to avoid comments most of the time
- Meaningful names use to be long, avoid including empty significants (Manager, Object...)
- Meaningful names use to be long, avoid repeating implied context, ie, `agentName` attribute in an `Agent` class.

## Exception Handling

- Avoid catch-all exception handling to avoid masking bugs
- Scope try blocks to the specific statements expected to throw
- Expect the specific exception types you want to handle
- Catching an exception deserves at least a log
- If you don't know how to handle, let it raise

## Code Reuse

- Always consider extracting functions for repeated code
- Consider reuse existing functions before adding new ones
- Domain-independent code should be extracted into cohesive modules,
  to be able to reuse it in other projects or other parts of this project

## Translation Files

- Currently only `es.yaml` exists. Target languages: an (aragonese), `and` (andaluh, hijacked ISO code), ar (arabic), ca, es (reference), eu, gl, pt
- `<isoCode>.yaml` - format: `id->text`, agents do not edit them directly.
- Agents do not propose Andalusian, it is automatically transliterated from Spanish by the user, eventually, once strings are stable.
- Agents propose new strings by writing a temporary `proposal.yaml`
  at the project root, with entries `id->lang->text`.
- User reviews and applies `proposal.yaml` with `yaml-translations distribute ...`
- For multiline strings, use yaml block scalars
- Avoid YAML quotes if not needed
- Use interpolation `%{varname}`; YAML keeps the named placeholders
  and each language may reorder them.
- Translations live in src/i18n/

## Version control

- According to previous rules, agents should not commit, rebase or merge, but they could suggest humans commands for the human to execute or to solve conflicts by editing files.
- Commit messages use a limited set of gitmoji: 📝 doc, 🐛 fix, ♻️ refactor, 🎨 style, ✅ tests, 🔧 ci, ✨ feature, 🚸 ux, 💄 visual, ⚡️ performance, 🏳 giveup, 🌐 translations
- First word after the gitmoji should be context if needed (class, file, context of a wide change...)
- Commits are granular: you should be able to clearly identify in the diff what the change is
- Commits are topic: separate documentation, code style, refactorings and features or fixes. Each code style/refactor/fix/doc, in a different commit.
- Branches are short and merged with rebase so the merged history is a linear branch. Mergers are responsible to adapt their branch commits to already merged changes before merge.
- Agents should warn humans whenever uncomitted changes are about to accommulate so that a granular commit is becoming hard to make.

## Roadmap

- `TODO.md` is the roadmap
- Entries use `[ ]`/`[x]` checkboxes
- Subitems are opened as we get closer to an item
- Items are reordered as paths get clarified or changed
- Agents update `TODO.md` applying the same protocol used for code files (diff, review, apply)

## Architecture

### Domain concepts

- District: Geographic area in which votes are counted and seats allocated independently of the votes cast in other districts
    - Constituency: Group of people that elects a given set of seats (not necessarily 
- Seats: Whatever we are assigning proportionally to votes within a constituency
- Census: How many people has the option to vote
- Abstention: People in censos that has not casted their vote.
- Vote: Choice casted by a person to select a political outcome democratically
- Non-candidature options: Electoral options that do not choses a candidature, includes blank, invalid and abstention
- Non-cadidature votes: Casted votes not assigned to a candidature, includes blank, invalid
- Invalid: A casted vote not following electoral rules: Alien objects included, multiple ballots of different parties, defaced ballots...
- Blank: a vote casted with no content in the envelope or with no option selected.
- Allocation method: system used to assign seats to representatives
- D'Hondt method: Greater quotiens allocation method.
- Hamilton method: Lesser proportinal error allocation method.
- Threshold: Minimal result to get representation.
- Electoral threshold: A hardcoded threshold set by law previous to the allocation
- Allocation threshold: The minimal price to get a seat due to the allocation method
- Price: how many votes costs to take a seat
- Exact allocation price: a price for which the exact number of seats are allocated.
    - In D'Hondt that is a range of prices from the last selected quotient until not reaching the first excluded quotient.

### Code structure

If we need to split code in directories,
prefer directories per domain topics to directories by kind of artifact,
keeping all the artifacts related to the same topic together.

TODO: Fill this when the stack migration is finish

## Decissions

- Version lock files (`bun.lock`) are not committed




