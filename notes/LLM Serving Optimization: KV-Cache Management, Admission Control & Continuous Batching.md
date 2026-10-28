<mark>### LLM Serving Optimization: KV-Cache Management, Admission Control & Continuous Batching</mark>

<mark>### 1. Intro — Problem in Simple Terms</mark>

A **70B-parameter LLM** uses **4-bit quantization** to reduce model-weight memory. During peak traffic, concurrent requests and long sequences increase **KV-cache memory consumption**, causing **CUDA Out-of-Memory (OOM)** errors and high **p99 latency**, even when average latency is acceptable.

<mark>### 2. Issues and Targets</mark>

- **Issues:** Growing KV cache, GPU memory pressure, high p99 latency, and intermittent request failures.
- **Target:** Improve **serving stability**, reduce OOM errors, and maintain **high throughput** without unnecessarily restricting concurrency.

<mark>### 3. Methods</mark>

- <mark>KV-cache-aware admission control</mark>: Admit requests only when sufficient GPU memory is available; queue excess requests.
- <mark>Continuous batching</mark>: Add new requests as existing requests finish to improve **throughput** and GPU utilization.
- <mark>Paged KV-cache management</mark>: Allocate cache in blocks to reduce memory waste and **fragmentation**.
- <mark>Memory profiling and monitoring</mark>: Track KV-cache usage, concurrency, p99 latency, queue time, and CUDA OOM errors.
- <mark>Concurrency and token-limit tuning</mark>: Establish safe limits through realistic load testing while maintaining sufficient GPU memory headroom.

<mark>### 4. Before and After</mark>

**Before:**
- Too many requests compete for GPU memory during peak traffic.
- Long sequences increase **KV-cache consumption**.
- **CUDA OOM errors** occur, and **p99 latency** rises sharply.
- Requests fail or experience long delays.

**After:**
- **Admission control** prevents excessive memory consumption.
- Excess requests wait in a controlled queue.
- **Continuous batching** keeps the GPU productive as capacity becomes available.
- **Paged KV-cache management** reduces memory waste.
- Fewer OOM errors and more predictable latency while preserving throughput.

<mark>### 5. Takeaway</mark>
<mark>High concurrency + long sequences → Larger KV cache → GPU memory pressure → CUDA OOM + High p99 latency</mark>

- <mark>Admission control = Memory safety</mark>
- <mark>Continuous batching = Throughput efficiency</mark>
- <mark>Paged KV cache = Memory allocation efficiency</mark>
