# <mark>**Interviewer: Where do Q, K, V come from in self-attention versus cross-attention?**</mark>

**My answer:**

1. **Self-attention:** Q, K, and V all come from the same input sequence.
2. **Cross-attention:** Q comes from the decoder, while K and V come from the encoder's output.

# <mark>**Interviewer: Explain why Q comes from the decoder and K, V come from the encoder.**</mark>

**Me:** Sure,

## <mark>**1. For Self-Attention**</mark>

The goal is to understand the sentence:

**"The policy covers flood damage."**

In self-attention, **every word looks at every other word** in the same sentence to understand its meaning in context.

For example, the word **"flood"** looks at words like **"covers"** and **"damage"** to understand its relationship with them.

Hence, **Q, K, and V come from the same input sequence** because all words need to exchange information with one another.

## <mark>**2. For Cross-Attention**</mark>

Let's translate **"How are you?"** into French.

First, the **encoder** understands the English sentence and generates **contextual representations** of the words.

Now, the **decoder** starts generating the French translation.

The decoder asks: **"What should I generate first?"**

The decoder generates a **Query (Q)** based on its current state because it needs information to decide what to generate next.

The encoder provides **Keys (K)**, which help the decoder identify the relevant parts of the English sentence, and **Values (V)**, which contain the information retrieved from those parts.

The decoder uses this information to generate:

**"Comment"**

Now, the decoder asks again: **"What should come next?"**

Its **Query (Q)** changes based on the current decoding state. The decoder again attends to the encoder's **Keys (K)** and **Values (V)** to obtain relevant information.

The decoder generates:

**"ça va ?"**

**Final output: "Comment ça va ?"**

Hence, **Q comes from the decoder** because it represents what the decoder needs at the current generation step, while **K and V come from the encoder** because they provide information about the original input sentence that the decoder needs to generate the translation.

## <mark>**Key Difference to Remember**</mark>

- **Self-attention:** Q, K, and V come from the same input sequence.
- **Cross-attention:** Q comes from the decoder, while K and V come from the encoder's output.

**Interview tip:** Q, K, and V are not the raw words themselves. They are **learned projections of hidden representations**.