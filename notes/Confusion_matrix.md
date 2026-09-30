## Confusion Matrix

A **confusion matrix** is an <mark>**N×N grid**</mark> used to <mark>evaluate the **performance of a classification model**</mark> by comparing the actual labels with the predicted labels.

For **binary classification**, it is a **2×2 matrix** containing:

- **True Positive (TP)** — Actual positive, predicted positive.
- **True Negative (TN)** — Actual negative, predicted negative.
- **False Positive (FP)** — Actual negative, predicted positive.
- **False Negative (FN)** — Actual positive, predicted negative.

From these, we can derive several metrics:

1. **Accuracy** — How many predictions are correct overall?  
   Example: Out of 10 predictions, 6 are correct → **60% accuracy**

2. **Precision** — Out of predicted positives, how many are actually positive?  
   Example: Model predicted 5 emails as spam, and 4 are actually spam → **80% precision**

3. **Recall (Sensitivity / TPR)** — Out of actual positives, how many were predicted positive?  
   Example: There are 10 customers who will default on a loan, and the model identifies 9 → **90% recall**

4. **F1 Score** — Harmonic mean of precision and recall.  
   Example: Precision = 80% and Recall = 90% → **F1 Score ≈ 84.2%**  
   **F1 Score** = `2 × (Precision × Recall) / (Precision + Recall)`

5. **Specificity (TNR)** — Out of actual negatives, how many were correctly identified?  
   Example: There are 10 customers who will not default, and the model correctly identifies 8 → **80% specificity**

6. **Balanced Accuracy** — Average of sensitivity and specificity.  
   Example: Sensitivity = 90% and Specificity = 80% → **85% balanced accuracy**  
   **Balanced Accuracy** = `(Sensitivity + Specificity) / 2`

7. **False Positive Rate (FPR)** — Out of actual negatives, how many are incorrectly predicted positive?  
   Example: Out of 10 customers who will not default, 2 are incorrectly predicted as defaulters → **20% FPR**

8. **False Negative Rate (FNR)** — Out of actual positives, how many are incorrectly predicted negative?  
   Example: Out of 10 customers who will default, 1 is incorrectly predicted as a non-defaulter → **10% FNR**

9. **ROC-AUC** — How well the model separates positive and negative cases across different thresholds?  
   Example: A model with **ROC-AUC = 0.90** generally separates positive and negative cases well.  
   **X-axis = FPR, Y-axis = TPR/Recall**

10. **PR-AUC** — How well the model identifies positive cases across different thresholds, balancing precision and recall?  
    Example: A model with **PR-AUC = 0.80** has good positive-class performance across different thresholds.

## Metric Examples

| Metric | Example Scenario | Why? / What happens if we get it wrong? |
|---|---|---|
| **Accuracy** | Cat vs Dog classification | Classes are reasonably balanced, and overall correctness matters. |
| **Precision** | Spam detection | **False positive:** A legitimate email is moved to the spam folder, so we may miss an important email or business opportunity. |
| **Recall** | Loan default prediction | **False negative:** A customer who will default is predicted as a safe borrower, which may result in financial loss. |
| **Specificity** | Loan approval | **False positive:** A customer who will not default is incorrectly flagged as a risky borrower, potentially causing a good customer to be rejected. |
| **F1 Score** | Fraud detection | Both false positives and false negatives matter: blocking legitimate transactions causes inconvenience, while missing fraud causes financial loss. |
| **ROC-AUC** | Loan default prediction | We want to understand how well the model separates defaulters from non-defaulters across different thresholds. |
| **PR-AUC** | Fraud detection with 1% fraud | The positive class is highly imbalanced, so we focus more on how well the model identifies actual fraud cases. |
| **FPR** | Intrusion detection | **False positive:** A normal network activity is flagged as an attack, creating unnecessary alerts and wasting the security team's time. |
| **FNR** | Defect detection | **False negative:** A defective product is classified as good and reaches the customer, potentially causing returns, complaints, or safety issues. |
