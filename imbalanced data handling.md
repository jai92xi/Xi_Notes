fix the data (resampling/augmentation)
or
fix the algorithm (weighting/loss/thresholds)
or 
fix the evaluation (right metrics)

**Methods for handling imbalanced data:**

1. **Class weighting** (`scale_pos_weight`, `class_weight='balanced'`) — penalize misclassifying the minority class more heavily.
2. **Oversampling (SMOTE, random oversampling)** — synthetically create more minority-class samples.
3. **Undersampling** — randomly remove majority-class samples to balance ratios.
4. **Threshold tuning** — adjust the decision boundary instead of using default 0.5.
5. **Ensemble methods (Balanced Random Forest, EasyEnsemble)** — combine multiple resampled models.
6. **Anomaly/outlier detection framing** — treat rare class as an anomaly detection problem instead of classification.
7. **Focal loss** — down-weight easy majority-class examples during training (common in deep learning).
8. **Stratified k-fold cross-validation** — ensures each fold preserves class ratio during evaluation.
9. **Use PR-AUC/F1/recall instead of accuracy** — evaluate with metrics sensitive to minority class performance.
10. **Data augmentation** (CNNs, NLP) — generate variations of minority-class samples to increase representation.