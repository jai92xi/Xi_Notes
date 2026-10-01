# Why do we need Positional Encoding in Transformers?
RNN: processes tokens sequentially → order is naturally captured.

Transformer: processes all tokens in parallel → self-attention alone doesn't know token order.

Example: “Dog bites man” ≠ “Man bites dog” 🐶💀

So, positional encoding provides token order + positional relationships.

Self-attention learns token relationships/context; positional encoding tells it where tokens are.

---

#### **Absolute Positional Encoding (APE)**
**Absolute Positional Encoding** represents the **exact position** of each token in the sequence.
Ex: Token A → Position 5

Token B → Position 20

A limitation is that models using absolute positional embeddings may have difficulty handling **positions beyond the context length** they were trained for, depending on the specific implementation.

---

#### **Relative Positional Encoding (RPE)**

**Relative Positional Encoding** focuses on the **distance or relative position between tokens**, rather than only their absolute positions.

Token A → Position 5

Token B → Position 20

Relative distance = 20 - 5 = 15

model learns: **Token B is 15 positions away from Token A.**

RPE incorporates this **relative-position information into the attention mechanism**.
```
Attention = QKᵀ + Relative Position Bias
```
---

#### **RoPE — Rotary Positional Embedding**
**RoPE (Rotary Positional Embedding)** incorporates positional information by **rotating the Query (Q) and Key (K) vectors according to their positions**.
Attention = Rotated(Q) × Rotated(K)ᵀ
where the **rotation applied to Q and K depends on their positions**.

Therefore, RoPE does not simply add a **relative-position bias** to the attention score. Instead, it **injects positional information directly into Q and K through rotations**.
