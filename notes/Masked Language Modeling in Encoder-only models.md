## 🧠 Masked Language Modeling (MLM) in BERT
**Input:** The policyholder filed a `[MASK]` claim after the accident.
**Expected prediction:** `motor`
**Question:** How does an encoder-only model like BERT predict `motor` for the missing word?

Encoder-only models such as BERT learn to predict original tokens at selected positions **using the surrounding context and the syntactic and semantic relationships learned during pretraining**.

### 🔍 How Does BERT Gain This Knowledge?
BERT uses **bidirectional self-attention**, allowing it to consider both left and right context when processing a sentence.

During pretraining, BERT uses **Masked Language Modeling (MLM)**, where approximately 15% of input token positions are selected for prediction:
- **80%** are replaced with `[MASK]`.
- **10%** are replaced with random tokens.
- **10%** are left unchanged.

### ⚙️ How Does BERT Learn to Predict the Missing Word?
The model predicts the original tokens at the selected positions. Its predictions are compared with the original tokens, and its parameters are updated to reduce prediction errors.
By repeating this process over large amounts of text, BERT learns statistical patterns, syntactic structures, and semantic relationships between words.

For example, BERT may learn associations between *motor*, *insurance*, *claim*, *vehicle*, and *accident* from its training data. When it processes the masked sentence, it uses the surrounding context to calculate probability scores for possible tokens. If `motor` receives the highest score, BERT predicts `motor`. ✅

### 🎯 Applications of Learned Representations
These learned contextual representations make BERT useful for downstream NLP tasks such as text classification, sentiment analysis, and question answering.
