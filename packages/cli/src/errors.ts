/** The draft was activated, but the fresh public path could not be confirmed. */
export class PublishedButUnverifiedError extends Error {}

/**
 * A mistake in how the command was invoked, as opposed to a failure while
 * running it. `main` prints these bare — a user who typed the wrong flag needs
 * the usage line, not a stack trace prefixed with "Deploy failed".
 */
export class UsageError extends Error {}
