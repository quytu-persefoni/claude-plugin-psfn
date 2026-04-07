## Steps

  1. **Checkout the PR branch** using `gh pr checkout <number>`.
  2. **Gather PR metadata** using `gh pr view <number> --json title,body,additions,deletions,changedFiles,commits,files,labels,author,baseRefName,headRefName`.
  3. **Get the full diff** using `gh pr diff <number>`.
  4. **Explore referenced types, utilities, and surrounding code** to understand the context of the changes. Don't review the diff in isolation — read the source files and types involved to verify correctness.
  5. **Write a structured review** with the following sections:

  ## Review Format

  ```
  ## PR Review: <title>

  **Author:** <author> | **Files changed:** <count> | **+<additions> / -<deletions>**

  ### Overall Assessment: <Looks good | Needs changes | Needs discussion>

  ### Positives
  - What the PR does well (type safety, patterns, clean removal, etc.)

  ### Issues / Questions
  - Numbered list of issues, ordered by severity
  - Reference specific files and line numbers
  - Distinguish blocking issues from minor nits
  - Ask clarifying questions where intent is unclear

  ### Not blocking, but worth noting
  - Observations that don't require changes but are worth awareness

  ### Verdict
  **Approve / Approve with minor comments / Request changes** with a brief rationale.
  ```

  ## Review Checklist

  When reviewing, check for:
  - **Type safety**: Are types correct? Are there unsafe casts, `any` usage, or missing types?
  - **Dead code**: Is old code fully removed? Are there leftover imports or unused exports?
  - **Consistency**: Do new files follow existing patterns in the codebase (naming, structure, exports)?
  - **Edge cases**: Are null/undefined cases handled? Are there potential runtime errors?
  - **Test coverage**: Are tests updated to cover the changes? Are mocks realistic?
  - **API correctness**: Do endpoint URLs, request/response shapes match expectations?
  - **Breaking changes**: Could this break existing consumers or downstream code?
  - **Security**: Any injection risks, exposed secrets, or auth issues?

  Be specific and constructive. Reference file paths and line numbers. Don't nitpick formatting or style unless it impacts readability.
