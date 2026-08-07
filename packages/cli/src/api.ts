
const API_BASE = process.env.TEACHFLUENCE_API_URL ?? 'https://api.teachfluence.com';

export async function graphql<T>(
  documentId: string,
  variables: Record<string, unknown>,
  secretKey: string,
  tolerateUserErrors = false,
): Promise<T> {
  const response = await fetch(`${API_BASE}/graphql`, {
    body: JSON.stringify({ documentId, variables }),
    headers: {
      'Content-Type': 'application/json',
      'X-Org-Api-Key': secretKey,
    },
    method: 'POST',
  });

  if (!response.ok) {
    // The BODY, not just the status. The server sends a crafted diagnosis here
    // — `NOT_PERSISTED` ("API key requests may only use published operations"),
    // `UNKNOWN_OPERATION` ("it may have been removed in a newer SDK release") —
    // and throwing the bare status discarded exactly the sentence that tells an
    // author what to do. A CLI one release ahead of the deployed API showed
    // only "HTTP 400" with the real answer sitting unread.
    throw new Error(await transportErrorMessage(response));
  }

  const body = (await response.json()) as {
    data?: Record<string, { userErrors?: { message: string }[] }>;
    errors?: { message: string }[];
  };

  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join('; '));
  }

  // Surface userErrors here rather than letting a caller forget: a deploy that
  // reports success while the server refused it is the worst possible outcome,
  // because CI goes green and the site silently does not change.
  //
  // `tolerateUserErrors` is for the ONE caller that renders a refusal better
  // than this can — the shadowing check, which has a list of the pages a claim
  // would take over and a `--force` to offer. Without the opt-out that branch
  // is unreachable: the throw here fires first and the author gets a bare
  // message with neither the list nor the flag that resolves it.
  const payload = Object.values(body.data ?? {})[0];

  if (!tolerateUserErrors && payload?.userErrors?.length) {
    throw new Error(payload.userErrors.map((error) => error.message).join('; '));
  }

  return body.data as T;
}

/**
 * Best-effort read of a non-2xx body.
 *
 * Falls back to the bare status rather than throwing: a proxy returning HTML,
 * or a truncated response, must not turn a useful failure into a confusing one
 * about JSON parsing.
 */
async function transportErrorMessage(response: Response): Promise<string> {
  const fallback = `API request failed with HTTP ${response.status}.`;

  try {
    const body = (await response.json()) as {
      errors?: { extensions?: { code?: unknown }; message?: unknown }[];
    };
    const detail = body.errors
      ?.map((error) => {
        const code = error.extensions?.code;

        return typeof code === 'string'
          ? `${String(error.message)} (${code})`
          : String(error.message);
      })
      .filter(Boolean)
      .join('; ');

    return detail ? `${fallback} ${detail}` : fallback;
  } catch {
    return fallback;
  }
}
