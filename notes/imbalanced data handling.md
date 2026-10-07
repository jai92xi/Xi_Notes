```
Handling Class Imbalance
│
├── 1. Fix the DATA
│   │
│   ├── Undersampling
│   │   └── Reduce samples from the majority class
│   │
│   ├── Oversampling
│   │   └── Increase samples from the minority class
│   │
│   ├── SMOTE
│   │   └── Generate synthetic minority-class samples
│   │
│   └── Data Augmentation
│       └── Create variations of minority-class data
│           (e.g., CNN/images: flip, rotate, crop)
│
├── 2. Fix the ALGORITHM / DECISION
│   │
│   ├── Class Weighting
│   │   └── Penalize minority-class mistakes more heavily
│   │
│   ├── Threshold Tuning
│   │   └── Increase/decrease the default threshold (0.5)
│   │       to control precision vs. recall
│   │
│   ├── Imbalance-Aware Ensembles
│   │   └── Use resampling + multiple models
│   │       (Balanced Random Forest, EasyEnsemble)
│   │
│   └── Outlier / Anomaly Detection
│       └── Treat the rare class as an unusual/anomalous event
│
└── 3. Fix the EVALUATION
    │
    ├── Recall
    │   └── How many actual minority cases were detected?
    │
    ├── Precision
    │   └── How many predicted minority cases were actually positive?
    │
    ├── F1-Score
    │   └── Balance between precision and recall
    │
    ├── PR-AUC
    │   └── Evaluate precision-recall performance across thresholds
    │
    └── Stratified K-Fold CV
        └── Keep class proportions similar in every fold
            for more reliable evaluation
```
