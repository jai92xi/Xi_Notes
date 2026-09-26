
**Question 1**

You're serving a fine-tuned Llama-3-8B model for a customer support chatbot using vLLM on a single A100 (80GB). At launch, p50 latency was 200ms and p99 was 450ms. Three months later, with 5x more traffic, p50 is still 220ms but p99 has spiked to 4.5 seconds, and you're seeing intermittent CUDA out-of-memory errors during peak hours.

What is the most likely root cause?

1. The KV cache is getting fragmented/exhausted under high concurrent request load, causing request queuing and preemption
2. The model weights have degraded due to repeated quantization during inference
3. Data drift in user queries is causing longer generation sequences, saturating GPU compute
4. The tokenizer is leaking memory on each request due to improper garbage collection


The correct answer is Option 1 (The KV cache is getting fragmented/exhausted under high concurrent request load, causing request queuing and preemption).
Here is exactly why this happens in vLLM:
## Why Option 1 is the Root Cause

* Request Queuing Explains the p99 Spike: When traffic increased by 5x, the number of concurrent users peaked. When vLLM runs out of designated GPU memory for the KV cache to handle new tokens, it doesn't just crash immediately; it puts lower-priority or newer requests into a waiting queue or preempts (pauses/evicts) active requests. The p50 (median) latency stays stable because normal, un-queued requests process fast, but the unfortunate p99 requests sit in the queue or get paused, causing their latency to skyrocket to 4.5 seconds.
* Cache Exhaustion Causes OOMs: While vLLM's PagedAttention virtually eliminates internal memory fragmentation, it cannot prevent absolute memory exhaustion if concurrent demand completely outstrips the physical allocation. If the engine's memory margins are too tight, an unexpected surge in concurrent long-context requests will trigger a hard CUDA Out-of-Memory (OOM) error.

------------------------------
## Why the Other Options are Incorrect

* Option 2 is false: Model weights are static read-only files loaded into memory at startup. They do not "degrade" or repeatedly quantize themselves during live inference.
* Option 3 is unlikely: While data drift can cause longer sequences, a pure compute saturation would heavily drag down the median (p50) latency as well, not just the p99.
* Option 4 is a distraction: Modern tokenizers (like Hugging Face tokenizers used by vLLM) are written in Rust/C++ and are highly optimized. A slow memory leak over three months would cause the server to crash continuously after a few hours/days, rather than only exhibiting issues during "peak hours."

Correct — Option 1

**1. Key hint in the question**
p50 stayed flat (220ms) but p99 exploded (4.5s) *only after traffic increased 5x*, plus intermittent OOM at peak hours. If it were a compute-bound issue (option 3), p50 would also degrade, not just the tail.

**2. What is happening?**
vLLM allocates KV cache blocks per request to store attention keys/values for every generated token. Under low concurrency, there's plenty of headroom. As concurrent requests scale up, the KV cache pool gets exhausted — vLLM has to preempt (pause/evict) some in-flight requests to free blocks for new ones, then recompute or reschedule them later. This creates queuing delays for the unlucky requests stuck in the tail, while most requests still sail through fast (explaining stable p50, terrible p99).

**3. Example**
Say each request averages 500 output tokens, and KV cache per token costs ~0.5MB (for 8B model, 32 layers). At low concurrency (20 requests), that's manageable. At 5x traffic (100 concurrent requests), you might need ~25GB just for KV cache — if the pool is capped or fragmented, vLLM starts preempting requests, and some get stuck waiting 3-4 seconds while cache frees up.

**4. What is the issue?**
Without enough KV cache headroom or with poor memory management, vLLM's scheduler starts making trade-offs: swap requests to CPU, recompute from scratch, or queue them. This spikes tail latency and occasionally causes true OOM if PagedAttention block allocation and eviction aren't tuned for the new concurrency level.

**5. Solution**
Increase `gpu_memory_utilization`, tune `max_num_seqs` / `max_num_batched_tokens`, enable better preemption strategies (recompute vs swap), or scale horizontally (more replicas/GPUs) so no single instance hits the ceiling. Monitoring KV cache utilization becomes critical at higher scale.

**6. Why the other options are not appropriate**
- Option 2: Quantization doesn't happen "repeatedly" during inference — weights are fixed once loaded; this isn't a real degradation mechanism.
- Option 3: If compute were the bottleneck, p50 would also rise, not just p99. Longer sequences alone don't explain the specific OOM + tail-latency pattern.
- Option 4: Tokenizers are lightweight and stateless per request; they don't accumulate GPU memory leaks in this way.

---