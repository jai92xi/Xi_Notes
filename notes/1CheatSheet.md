#### <mark>**OVERFITTING**</mark>
* Model **memorizes the training data excessively** - including **noise** - it **performs well on training data** but **poorly on new/unseen data**.
* solution: More training data, Data Augmentation; reduce model complexity (reduce layers/neurons); Early Stopping; Dropout, L1/L2 regularization, Batch Normalization; cross validation.

----
#### <mark>**EARLY STOPPING:**</mark>
* A **regularization** technique - that prevents **overfitting** - by **stopping training** when **validation performance stops improving**.
---
#### <mark>**FORWARD PROPAGATION VS BACKWARD PROPAGATION**</mark>
1. **Forward Propagation**  - makes **predictions**.
2. **Backward Propagation** - learns from **prediction error** and **updates model weights**.
---
#### <mark>**VANISHING GRADIENT**</mark>
* **Vanishing Gradient**: During **backpropagation**, gradients become **extremely small** toward **earlier layers**, causing **very small weight updates** and **slow learning**.
* Methods: ReLU, Leaky ReLU; Batch/Layer Normalization; Residual Connection (ResNet); He/Xavier weight initialization.
---
#### <mark>**CONFUSION MATRIX**</mark>
* **Confusion Matrix**: An **N×N grid** used to **evaluate a classification model** by comparing **actual labels** vs **predicted labels**.
* **Metrics:** Accuracy, Precision, Recall, F1-Score, Specificity, ROC-AUC, PR-AUC, Balanced Accuracy, FPR, FNR
---
#### <mark>**DIFFERENT EMBEDDING MODELS FOR QUERY AND VECTOR**</mark>
* Use the **same embedding model** for both queries and documents - (a) can have different dimensions - so dimension-mismatch error. (b) same dimension but different vector coordinates - irrelevant chunks.
* or use a **pair of encoders explicitly trained to produce embeddings in the same shared space**, such as **DPR**
---
#### <mark>**POSITIONAL ENCODING**</mark>
* **RNN** : processes **tokens sequentially** → order is naturally captured.
**Transformer**: processes **all tokens in parallel** → self-attention alone **doesn't know token order**. >> “Dog🐶 bites man” ≠ “Man bites dog🐶” same
- **Absolute PE:** Encodes the **exact position** of each token. `A = 5, B = 15` → may struggle with **positions beyond the trained context length**.
- **Relative PE (RPE):** Encodes the **relative distance/position** between tokens. `B is +10 from A` → relative position is **explicitly used in attention**.
- **RoPE:** Encodes position by **rotating Q and K** according to their positions, so their **interaction captures relative position**.
---
#### <mark>**HALLUCINATION**</mark>
Hallucination happens when the **retrieved context doesn't contain enough relevant information**, causing the model to **generate unsupported information** instead. So, use methods to **prevent invention and improve retrieval quality**. 
| Prevent Invention | Improve Query | Improve Retrieval | Improve Context | Verify Answer |
|---|---|---|---|---|
| Grounding prompt | Query rewriting | Chunking | Remove irrelevant chunks | Claim verification |
| Abstention | Query decomposition | Parent-child retrieval | Remove duplicate chunks | Citation/evidence verification |
| "Don't guess" | HyDE | Hybrid search | Context compression | Groundedness check |
|  |  | Reranker | Conflict resolution | Retry / regenerate / abstain |
|  |  | MMR |  |  |
----
#### <mark>**RAG EVALUATION**</mark>
* **Retrieval**  :  Recall@K, Precision@K, Hit Rate@K, MRR, nDCG@K, MAP@K, Retrieval Latency
* **Context** 	 : 	Context Recall [Ragas], Context Precision [Ragas], Redundancy/Diversity
* **Generation** : 	Faithfulness [Ragas], Answer Relevance [Ragas], Answer Correctness [Ragas], Answer Completeness, Citation Correctness, Citation Completeness
* **System** 	   : 	End-to-End Latency, Cost, Token Usage, Failure Rate, Throughput, Availability, User Satisfaction

---
#### <mark>**🧠 KV CACHE**</mark>
**Stores:** Past **Key & Value (K/V)** tensors.
- ⚡ **Benefit:** Avoids recomputation → **faster LLM inference**.
- 💾 **Trade-off:** Uses extra **GPU memory**, grows with context length.
- 🎯 **Used in:** Autoregressive **generation/decoding**.
- ⚠️ **Bottleneck:** Long contexts → large KV cache → high VRAM usage.

###### <mark>**OPTIMIZATIONS**</mark>
 - **GQA/MQA** → Fewer **K/V heads** → 📉 smaller cache.
- **KV Quantization** → Fewer **bits per K/V** → 📉 lower memory.
- **PagedAttention** → Efficiently **manages KV-cache memory** → less fragmentation.

---
