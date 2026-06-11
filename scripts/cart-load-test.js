/**
 * Cart endpoint load test
 * --------------------------------------------------------------
 * Sends a controlled number of PUT requests to the cart endpoint to
 * observe how the API behaves under concurrent load, so weak spots
 * can be found and fixed.
 *
 * This is a measured load test, NOT a flood:
 *   - CONCURRENCY caps how many requests are in flight at once.
 *   - It records status codes + latency so you get real data.
 *   - It ABORTS early if the error rate climbs, so you don't take
 *     your own API down while testing.
 *
 * Usage (PowerShell):
 *   $env:TOKEN="<your-bearer-token>"; node scripts/cart-load-test.js
 *
 * Requires Node 18+ (built-in fetch).
 */

// ----- Config (tweak these) -----------------------------------
const BASE_URL = "https://backend.afhome.ph/api"
const CART_ID = 104
const TOTAL = 2000 // total requests to send
const CONCURRENCY = 5 // how many in flight at once (keep low first)
const QUANTITY = 2 // realistic value; bump only to test validation
const ABORT_ERROR_RATE = 0.5 // stop if >50% of completed requests fail
// --------------------------------------------------------------

const TOKEN = `Bearer 2694|ti3GYLD46J2SRibugxCJ3M1UUxHB8Rutck4iVo6gc35ab282`
if (!TOKEN) {
  console.error("Missing TOKEN env var. Set it before running:")
  console.error(
    '  $env:TOKEN="<your-bearer-token>"; node scripts/cart-load-test.js'
  )
  process.exit(1)
}

const url = `${BASE_URL}/cart/${CART_ID}`
const latencies = []
const statusCounts = {}
let completed = 0
let failures = 0
let aborted = false

async function sendOne(i) {
  const start = performance.now()
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ quantity: QUANTITY }),
    })
    const ms = performance.now() - start
    latencies.push(ms)
    statusCounts[res.status] = (statusCounts[res.status] || 0) + 1
    if (!res.ok) failures++
  } catch (err) {
    latencies.push(performance.now() - start)
    statusCounts["network_error"] = (statusCounts["network_error"] || 0) + 1
    failures++
  } finally {
    completed++
  }
}

// Simple concurrency pool: a fixed number of workers pull from a counter.
async function run() {
  console.log(`Load test → PUT ${url}`)
  console.log(
    `Total: ${TOTAL}, Concurrency: ${CONCURRENCY}, Quantity: ${QUANTITY}\n`
  )

  let next = 0
  const wallStart = performance.now()

  async function worker() {
    while (!aborted) {
      const i = next++
      if (i >= TOTAL) return
      await sendOne(i)

      // Safety brake: bail out if too many requests are failing.
      if (completed >= 10 && failures / completed > ABORT_ERROR_RATE) {
        aborted = true
        console.warn(
          `\n⚠️  Aborting early: error rate ${((failures / completed) * 100).toFixed(0)}% ` +
            `(${failures}/${completed}). The endpoint is struggling — that's your signal to fix it.`
        )
        return
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  const wallMs = performance.now() - wallStart

  report(wallMs)
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

function report(wallMs) {
  const sorted = [...latencies].sort((a, b) => a - b)
  console.log("\n──────── Results ────────")
  console.log(
    `Requests sent:   ${completed}${aborted ? " (aborted early)" : ""}`
  )
  console.log(
    `Failures:        ${failures} (${((failures / completed) * 100 || 0).toFixed(1)}%)`
  )
  console.log(`Total time:      ${(wallMs / 1000).toFixed(2)}s`)
  console.log(
    `Throughput:      ${(completed / (wallMs / 1000)).toFixed(1)} req/s`
  )
  console.log(`Latency min:     ${sorted[0]?.toFixed(0)} ms`)
  console.log(`Latency p50:     ${percentile(sorted, 50).toFixed(0)} ms`)
  console.log(`Latency p95:     ${percentile(sorted, 95).toFixed(0)} ms`)
  console.log(`Latency max:     ${sorted[sorted.length - 1]?.toFixed(0)} ms`)
  console.log(`Status codes:    ${JSON.stringify(statusCounts)}`)
  console.log("─────────────────────────")
}

run()
