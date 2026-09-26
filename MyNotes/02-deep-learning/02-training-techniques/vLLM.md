
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

Would you like to explore vLLM configuration parameters (such as gpu_memory_utilization or max_num_seqs) that can be tuned to prevent these peak-hour OOMs and queuing issues?

