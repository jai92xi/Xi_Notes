> #### **Overfitting**
>
> **Overfitting** happens when a model **memorizes the training data too closely** — including its **noise** — so it performs **well on training data** but **poorly on unseen data**.

#### **Solutions to Resolve Overfitting**
```text
Overfitting
      │
      ├──► Training data is too small
      │      ├── Collect more training data
      │      └── Data augmentation
      │
      ├──► Model is too complex
      │      ├── Reduce layers
      │      └── Reduce neurons
      │
      ├──► Model is trained for too long
      │      └── Early stopping
      │
      ├──► Model is memorizing training data
      │      ├── Dropout
      │      ├── L1 / L2 regularization
      │      └── Batch Normalization
      │
      ├──► Model gives different results for different samples
      │      └── Ensemble methods
      │             └── Bagging → Random Forest
      │
      └──► Model may be overfitting
             └── Cross-validation
                    └── K-Fold
```

Solve this question: https://jai92xi.github.io/AIBrainBox/?id=Xi-00017
