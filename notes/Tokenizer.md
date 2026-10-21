#### <mark>Tokenizer Vocabulary Size: Impact on Transformer Models</mark>

**Vocabulary size** affects **sequence length, attention computation, embedding parameters, GPU memory, and model performance**.

### 1. Vocabulary Too Large

Example: `Automobile_insurance_policy` → **1 token**

- **Fewer tokens** per sentence → shorter sequence.
- **Lower attention computation** and potentially faster inference.
- **Larger embedding table** → more parameters and GPU memory.
- Rare tokens may have insufficient training examples.

### 2. Vocabulary Too Small

Example: `Automobile_insurance_policy` → `Auto | mobile | insurance | policy` (**4 tokens**)

- **More tokens** per sentence → longer sequence.
- **Higher attention computation** and potentially slower inference.
- **Smaller embedding table** → fewer parameters and less memory.
- Reusable subwords improve vocabulary coverage.

### 3. Example: LLaMA Models

**LLaMA 2 7B**
- Vocabulary = **32K**
- Hidden size = **4,096**
- Embedding parameters = 32,000 × 4,096 ≈ **131 million**
- FP16 memory ≈ **262 MB** (decimal)

**LLaMA 3.1 8B**
- Vocabulary = **128K**
- Hidden size = **4,096**
- Embedding parameters = 128,000 × 4,096 ≈ **524 million**
- FP16 memory ≈ **1.05 GB** (decimal)

*Note: These calculations cover one embedding table.*

### 4. Key Points

- **Attention computation** scales approximately as **O(n² × d)**, where *n* is sequence length and *d* is hidden size.
- Larger vocabulary → **shorter sequences, larger embeddings**.
- Smaller vocabulary → **longer sequences, smaller embeddings**.
- The ideal vocabulary balances **computation, memory, language coverage, and model performance**.