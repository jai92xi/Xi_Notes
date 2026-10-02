##### **OVERFITTING**
* Model **memorizes the training data excessively** - including **noise** - it **performs well on training data** but **poorly on new/unseen data**.
* solution: More training data, Data Augmentation; reduce model complexity (reduce layers/neurons); Early Stopping; Dropout, L1/L2 regularization, Batch Normalization; cross validation.

----
##### **EARLY STOPPING:**
* A **regularization** technique - that prevents **overfitting** - by **stopping training** when **validation performance stops improving**.
---
##### **FORWARD PROPAGATION VS BACKWARD PROPAGATION**
1. **Forward Propagation**  - makes **predictions**.
2. **Backward Propagation** - learns from **prediction error** and **updates model weights**.
---
##### **VANISHING GRADIENT**
* **Vanishing Gradient**: During **backpropagation**, gradients become **extremely small** toward **earlier layers**, causing **very small weight updates** and **slow learning**.
* Methods: ReLU, Leaky ReLU; Batch/Layer Normalization; Residual Connection (ResNet); He/Xavier weight initialization.
---
##### **CONFUSION MATRIX**
* **Confusion Matrix**: An **N×N grid** used to **evaluate a classification model** by comparing **actual labels** vs **predicted labels**.
* **Metrics:** Accuracy, Precision, Recall, F1-Score, Specificity, ROC-AUC, PR-AUC, Balanced Accuracy, FPR, FNR
---
##### **DIFFERENT EMBEDDING MODELS FOR QUERY AND VECTOR**
* Use the **same embedding model** for both queries and documents - (a) can have different dimensions - so dimension-mismatch error. (b) same dimension but different vector coordinates - irrelevant chunks.
* or use a **pair of encoders explicitly trained to produce embeddings in the same shared space**, such as **DPR**
---
##### **POSITIONAL ENCODING**
* **RNN** : processes **tokens sequentially** → order is naturally captured.
**Transformer**: processes **all tokens in parallel** → self-attention alone **doesn't know token order**. >> “Dog🐶 bites man” ≠ “Man bites dog🐶” same
- **Absolute PE:** Encodes the **exact position** of each token. `A = 5, B = 15` → may struggle with **positions beyond the trained context length**.
- **Relative PE (RPE):** Encodes the **relative distance/position** between tokens. `B is +10 from A` → relative position is **explicitly used in attention**.
- **RoPE:** Encodes position by **rotating Q and K** according to their positions, so their **interaction captures relative position**.
---
##### **HALLUCINATION**
Hallucination happens when the **retrieved context doesn't contain enough relevant information**, causing the model to **generate unsupported information** instead. So, use methods to **prevent invention and improve retrieval quality**. 
| Prevent Invention | Improve Query | Improve Retrieval | Improve Context | Base Knowledge |
|---|---|---|---|---|
| Grounding prompt | Query rewriting | Chunking | Remove irrelevant / duplicate chunks | Domain fine-tuning |
| Abstention | Query decomposition | Parent-child retrieval | Context compression | |
| Temperature control | HyDE | Hybrid search | Conflict resolution | |
| | | Reranker | | |
| | | MMR | | |
