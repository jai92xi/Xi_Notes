#### **OVERFITTING**
* Model **memorizes the training data excessively** - including **noise** - it **performs well on training data** but **poorly on new/unseen data**.
* solution: More training data, Data Augmentation; reduce model complexity (reduce layers/neurons); Early Stopping; Dropout, L1/L2 regularization, Batch Normalization; cross validation.

----
* **Early Stopping**: A **regularization** technique - that prevents **overfitting** - by **stopping training** when **validation performance stops improving**.
---
#### **FORWARD PROPAGATION VS BACKWARD PROPAGATION**
1. **Forward Propagation**  - makes **predictions**.
2. **Backward Propagation** - learns from **prediction error** and **updates model weights**.
---
#### **VANISHING GRADIENT**
* **Vanishing Gradient**: During **backpropagation**, gradients become **extremely small** toward **earlier layers**, causing **very small weight updates** and **slow learning**.
* Methods: ReLU, Leaky ReLU; Batch/Layer Normalization; Residual Connection (ResNet); He/Xavier weight initialization.
---
#### **CONFUSION MATRIX**
* **Confusion Matrix**: An **N×N grid** used to **evaluate a classification model** by comparing **actual labels** vs **predicted labels**.
* **Metrics:** Accuracy, Precision, Recall, F1-Score, Specificity, ROC-AUC, PR-AUC, Balanced Accuracy, FPR, FNR
---
