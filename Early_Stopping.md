## Early Stopping

Early stopping is a **regularization technique** used to **reduce overfitting** during model training.

### Ex:

| Epoch | Train Loss | Val Loss | Status |
|---:|---:|---:|---|
| 1 | 0.80 | 0.75 | Improving |
| 2 | 0.60 | 0.55 | Improving |
| 3 | 0.45 | **0.40** | ⭐ **Best** |
| 4 | 0.35 | 0.43 | No improvement |
| 5 | 0.28 | 0.47 | No improvement |
| 6 | 0.22 | 0.52 | 🛑 **Stop*** |

In the above example: **Training loss keeps decreasing but Validation loss starts increasing ❌ → model may be overfitting.**

So, **Early stopping stops training when validation performance stops improving**. This helps **reduce overfitting** and **saves computation** as well.

### Sample Code

```python
early_stop = callbacks.EarlyStopping(
    monitor="val_loss",              # Which metric to watch? → validation loss
    patience=5,                      # How many epochs should I wait without improvement?
    min_delta=1e-4,                  # Minimum change required to count as improvement
    mode="min",                      # min for loss, whereas max for accuracy
    restore_best_weights=True,       # Restore weights from epoch with best monitored value
)

model.fit(
    x_train, y_train,
    validation_data=(x_val, y_val),
    epochs=200,
    batch_size=64,
    callbacks=[early_stop]
)
```
 **`restore_best_weights=True`** → ⭐ In the above example, **Epoch 3 weights** will be restored because Epoch 3 had the **lowest validation loss (0.40)**.

 ### Early Stopping + Other Regularization

 Early stopping can be combined with other regularization techniques:

 - **Dropout** → Randomly removes neurons during training.
- **Weight Decay / L2 Regularization** → Penalizes large weights.
- **Data Augmentation** → Creates varied training examples.
- **Early Stopping** → Limits training once validation performance stops improving.

 > **Key idea:** These techniques can be used **together** to improve **generalization** and **reduce overfitting**.
