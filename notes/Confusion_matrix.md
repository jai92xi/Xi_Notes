## Confusion Matrix

A **confusion matrix** is an **N×N grid used to evaluate the performance of a classification model** by comparing the actual labels with the predicted labels.

For **binary classification**, it is a **2×2 matrix** containing:

- **True Positive (TP)** — Actual positive, predicted positive.
- **True Negative (TN)** — Actual negative, predicted negative.
- **False Positive (FP)** — Actual negative, predicted positive.
- **False Negative (FN)** — Actual positive, predicted negative.

From these, we can derive several metrics:

1. **Accuracy** — How many predictions are correct overall?
2. **Precision** — Out of predicted positives, how many are actually positive?
3. **Recall (Sensitivity / TPR)** — Out of actual positives, how many were predicted positive?
4. **F1 Score** — Harmonic mean of precision and recall.
   **F1 Score** = `2 × (Precision × Recall) / (Precision + Recall)`
5. **Specificity (TNR)** — Out of actual negatives, how many were correctly identified?
6. **Balanced Accuracy** — Average of sensitivity and specificity.
   **Balanced Accuracy** = `(Sensitivity + Specificity) / 2`
7. **False Positive Rate (FPR)** — Out of actual negatives, how many are incorrectly predicted positive?
8. **False Negative Rate (FNR)** — Out of actual positives, how many are incorrectly predicted negative?
9. **ROC-AUC** — How well the model separates positive and negative cases across different thresholds.  
   *(X-axis = FPR, Y-axis = TPR/Recall.)*
10. **PR-AUC** — How well the model identifies positive cases across different thresholds, balancing precision and recall.

## Metric Examples

| Metric | Example Scenario | Why? |
|---|---|---|
| **Accuracy** | Cat vs Dog | Classes are balanced; overall correctness matters |
| **Precision** | Spam detection | False positives are costly |
| **Recall** | Cancer detection | False negatives are costly |
| **Specificity** | Medical screening | Want to correctly identify negatives |
| **F1 Score** | Fraud detection | Need a balance between precision and recall |
| **ROC-AUC** | Disease prediction | Evaluate performance across different thresholds |
| **PR-AUC** | Fraud detection with 1% fraud | Useful for highly imbalanced data |
| **FPR** | Intrusion detection | Want to minimize false alarms |
| **FNR** | Defect detection | Missing a defect is costly |
