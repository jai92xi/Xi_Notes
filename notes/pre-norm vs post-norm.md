# Transformer Block: Pre-Norm vs Post-Norm vs Sandwich-Norm

A typical **Transformer block** contains two main sublayers:

- **Self-attention:** Determines which other tokens are relevant to each token.
- **Feed-forward network (FFN):** Further transforms each token's representation.

It also uses **Layer Normalization (LN)** and **residual connections** to help the network train effectively.

## 1. Pre-Norm (Normalization Before Each Sublayer)

**Pre-Norm:** Apply <mark>**Layer Normalization (LN) before**</mark> each sublayer.

$$
h=x+\operatorname{Attn}(\operatorname{LN}(x))
$$

$$
Y=h+\operatorname{FFN}(\operatorname{LN}(h))
$$

## 2. Post-Norm (Normalization After Each Sublayer)

**Post-Norm:** Apply <mark>**Layer Normalization (LN) after**</mark> each sublayer and residual connection.

$$
h=\operatorname{LN}(x+\operatorname{Attn}(x))
$$

$$
Y=\operatorname{LN}(h+\operatorname{FFN}(h))
$$

## 3. Sandwich-Norm (Normalization Before and After Each Sublayer)

**Sandwich-Norm:** Apply <mark>**Layer Normalization (LN) both before and after**</mark> each sublayer.

$$
h=x+\operatorname{LN}(\operatorname{Attn}(\operatorname{LN}(x)))
$$

$$
Y=h+\operatorname{LN}(\operatorname{FFN}(\operatorname{LN}(h)))
$$

## Key Takeaway

- **Pre-Norm:** <mark>Normalize before</mark> each sublayer.
- **Post-Norm:** <mark>Normalize after</mark> each sublayer and residual addition.
- **Sandwich-Norm:** <mark>Normalize before and after</mark> each sublayer.