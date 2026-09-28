# Early Stopping

**Early stopping** is a **regularization technique** used to **reduce overfitting** during model training.

## Example

| Epoch | Train Loss | Val Loss | Status |
|------:|-----------:|---------:|:-------|
| 1 | 0.80 | 0.75 | 📈 Improving |
| 2 | 0.60 | 0.55 | 📈 Improving |
| 3 | 0.45 | **0.40** | ⭐ Best |
| 4 | 0.35 | 0.43 | ⚠️ No improvement |
| 5 | 0.28 | 0.47 | ⚠️ No improvement |
| 6 | 0.22 | 0.52 | 🛑 Stop |

### What is happening?

In the above example:

- **Training loss keeps decreasing** ✅
- **Validation loss starts increasing** ❌
- This indicates that the model may be **overfitting**.

Therefore, **early stopping stops training when validation performance stops improving**.

This helps to:

- 🛡️ **Reduce overfitting**
- ⏱️ **Save training time and computation**
- ⭐ **Keep the model weights from the best validation performance**

---

## Sample Code

```python
early_stop = callbacks.EarlyStopping(
    monitor="val_loss",              # Which metric to watch? → validation loss
    patience=5,                      # How many epochs to wait without improvement?
    min_delta=1e-4,                  # Minimum change required to count as improvement
    mode="min",                      # min for loss, max for accuracy
    restore_best_weights=True,       # Restore weights from epoch with best monitored value
)

model.fit(
    x_train,
    y_train,
    validation_data=(x_val, y_val),
    epochs=200,
    batch_size=64,
    callbacks=[early_stop]           # ← Early stopping
)
````

### `restore_best_weights=True`

In the example above, **Epoch 3** has the lowest validation loss:

> **Epoch 3 → Validation Loss = 0.40 ⭐**

Therefore, when training stops, the model's weights are restored to the weights from **Epoch 3** rather than keeping the weights from the final epoch.

---

# Early Stopping + Other Regularization Techniques

Early stopping can be combined with other regularization techniques:

| Technique | Purpose |
| --- | --- |
| **Dropout** | Randomly removes neurons during training to reduce dependency on specific neurons |
| **Weight Decay / L2 Regularization** | Penalizes large weights to control model complexity |
| **Data Augmentation** | Creates varied training examples to improve generalization |
| **Early Stopping** | Stops training when validation performance stops improving |

### Key Takeaway

> **Early stopping prevents unnecessary training once the model stops improving on validation data, helping reduce overfitting while also saving computation.**
