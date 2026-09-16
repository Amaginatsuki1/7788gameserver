/** Five sequential HTTP samples; cancellation also stops the remaining samples. */
export async function measureEndpoint(
  endpoint: string,
  signal: AbortSignal,
  baseUrl: string,
  sampleTimeoutMs = 4_000,
) {
  const samples: number[] = [];
  for (let index = 0; index < 5; index += 1) {
    signal.throwIfAborted();
    const url = new URL(endpoint, baseUrl);
    url.searchParams.set("probe", `${Date.now()}-${index}`);
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(abort, sampleTimeoutMs);
    const startedAt = performance.now();
    try {
      const response = await fetch(url, { cache: "no-store", mode: "cors", signal: controller.signal });
      if (!response.ok) throw new Error(`Probe returned ${response.status}`);
      await response.text();
      signal.throwIfAborted();
      samples.push(performance.now() - startedAt);
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
    }
  }
  samples.sort((a, b) => a - b);
  return Math.max(1, Math.round(samples[2]));
}
