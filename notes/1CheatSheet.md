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
