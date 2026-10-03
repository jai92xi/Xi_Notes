> #### What is KV Cache?
> **KV Cache stores the Key (K) and Value (V) tensors of previous tokens so they don't have to be recomputed during autoregressive generation.**
> For every token, a Transformer produces Q, K, V. The current token's **Q** attends to the K/V of previous tokens.

---

#### **Why is KV Cache needed?**
Without caching, the growing prefix is processed repeatedly:
```
Step 1: [A]       → B
Step 2: [A B]     → C
Step 3: [A B C]   → D
```
So K/V for `A`, `B`, etc. are repeatedly recomputed.

**With KV Cache:**
```
Step 1: A → K₁,V₁ → cache
Step 2: B → K₂,V₂ → Q₂ attends to K₁,K₂
Step 3: C → K₃,V₃ → Q₃ attends to K₁,K₂,K₃
```
**Compute K/V once → store → reuse.**

---

#### **Why can we reuse K/V?**
Because during inference:
- Model weights don't change.
- Previous tokens don't change.
- Therefore their K/V representations don't change.

---

#### Why don't we cache Q?
At each decoding step, we need the new token's Q to determine what information it should retrieve from previous tokens. The previous tokens' Q values have already served their purpose

---

#### Does KV Cache eliminate attention?
**No.** The new Q still attends to all cached K/V:

---
This memory requirement can become a major bottleneck for long-context or high-concurrency inference. 
Techniques such as GQA/MQA, KV-cache quantization, and systems such as PagedAttention help reduce or manage that memory cost.
- **GQA/MQA:** reduce the number of K/V heads → smaller cache.
- **KV quantization:** use fewer bits → smaller cache.
- **PagedAttention:** manages KV-cache memory more efficiently.

---
