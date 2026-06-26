/**
 * Commitlint — enforces Conventional Commits on every commit message.
 *
 * Format:  <type>(optional scope): <subject>
 * Example: feat(cart): add voucher validation
 *          fix(chat): keep poller in sync on long threads
 *
 * Rules inherited from @commitlint/config-conventional already enforce the
 * team's best practices: lower-case type, a non-empty subject, NO trailing
 * period, and a header ≤ 100 chars. (Imperative mood can't be linted — that's
 * on us.) The explicit type-enum below documents the allowed types.
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // a new feature
        "fix", // a bug fix
        "refactor", // code change that neither fixes a bug nor adds a feature
        "docs", // documentation only
        "style", // formatting / white-space, no logic change
        "test", // adding or updating tests
        "chore", // build tooling, deps, config
        "build", // build system or external dependencies
        "ci", // CI configuration
        "perf", // performance improvement
        "revert", // reverts a previous commit
      ],
    ],
  },
}
