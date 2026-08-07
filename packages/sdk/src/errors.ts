/**
 * Error taxonomy for the Teachfluence SDK.
 *
 * Three distinct kinds, because callers handle them differently and collapsing
 * them into one `Error` forces every caller to parse messages:
 *
 *   - `TeachfluenceTransportError` — the request did not complete or did not
 *     come back as GraphQL. Retryable in principle.
 *   - `TeachfluenceOperationError` — the server rejected the operation itself
 *     (unknown persisted id, unauthorized, malformed). A bug in the caller or a
 *     version skew; retrying will not help.
 *   - `TeachfluenceUserError` — a business rule said no ("coupon expired",
 *     "seat unavailable"). Expected, and belongs in the UI, not in a log.
 *
 * That last distinction is the one worth being strict about. The platform
 * returns business failures as `userErrors` inside a 200 response, so an SDK
 * that threw on them would turn every "your coupon expired" into an exception,
 * and one that ignored them would silently drop the reason a purchase failed.
 */

/** One entry from a mutation's `userErrors`. */
export interface UserError {
  code: string;
  message: string;
  field?: string | null;
}

export class TeachfluenceOperationError extends Error {
  readonly errors: readonly unknown[];
  readonly operationId: string;

  constructor(
    message: string,
    init: { errors: readonly unknown[]; operationId: string },
  ) {
    super(message);
    this.name = 'TeachfluenceOperationError';
    this.errors = init.errors;
    this.operationId = init.operationId;
    Object.setPrototypeOf(this, TeachfluenceOperationError.prototype);
  }
}

export class TeachfluenceTransportError extends Error {
  readonly status?: number;

  constructor(message: string, init?: { cause?: unknown; status?: number }) {
    // `cause` goes through the Error constructor rather than being redeclared
    // as a field: ES2022 Error already owns that property, so a redeclaration
    // shadows the built-in and loses the runtime plumbing that makes `cause`
    // show up in a printed stack.
    super(message, { cause: init?.cause });
    this.name = 'TeachfluenceTransportError';
    this.status = init?.status;
    Object.setPrototypeOf(this, TeachfluenceTransportError.prototype);
  }
}

export class TeachfluenceUserError extends Error {
  readonly userErrors: readonly UserError[];

  constructor(userErrors: readonly UserError[]) {
    // Surface the first message so an uncaught one still reads sensibly in a
    // console, while the full list stays available for field-level display.
    super(userErrors[0]?.message ?? 'The request was rejected.');
    this.name = 'TeachfluenceUserError';
    this.userErrors = userErrors;
    Object.setPrototypeOf(this, TeachfluenceUserError.prototype);
  }

  /** The error for a given form field, if the server attributed one. */
  forField(field: string): UserError | undefined {
    return this.userErrors.find((error) => error.field === field);
  }
}

export function isUserError(error: unknown): error is TeachfluenceUserError {
  return error instanceof TeachfluenceUserError;
}
