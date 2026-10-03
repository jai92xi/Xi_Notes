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
> 🧠 A model has **32 layers**, **32 query heads**, and uses **Grouped-Query Attention (GQA)** with **8 KV heads**. The **head dimension** is **128**, and the KV cache is stored in **FP16**. You serve a **batch of 4 sequences**, each with **8,192 tokens** in context.

> **KV Cache** = 2 × **layers** × **sequence length** × **batch** × **KV heads** × **head dimension** × **bytes**

> = 2 × **32** × **8192** × **4** × **8** × **128** × **2 bytes**
> **≈ 4 GB** 🚀

---
This memory requirement can become a major bottleneck for long-context or high-concurrency inference. 
Techniques such as **GQA/MQA, KV-cache quantization**, and **PagedAttention** help reduce or efficiently manage KV-cache memory.

- **GQA/MQA** → Reduce **K/V heads** → 📉 smaller cache.
  - **MQA** → All query heads share **one K/V head**.
  - **GQA** → Query heads are grouped, with each group sharing **one K/V head**.
  - _Example:_ **32 Query heads → 8 KV heads**.

- **KV Quantization** → Use fewer bits → 📉 smaller cache.
  - _FP16 = 2 bytes_ | _INT8 = 1 byte_ 💾

- **PagedAttention** → 🧩 Efficient **KV-cache memory management**.
  - Divides cache into fixed-size **blocks/pages**, allowing requests to use non-contiguous blocks.
  - `Request A → Block 1 → Block 4 → Block 7`
  - `Request B → Block 2`
  - `Request C → Block 3 → Block 5 → Block 6`
  - 🎯 **Key idea:** Allocate memory **on demand** → less fragmentation + better GPU utilization.

---
