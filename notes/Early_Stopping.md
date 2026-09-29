> 🧠 **EARLY STOPPING**
>
> Early stopping is a **regularization technique** that **prevents overfitting** by stopping training when **validation performance stops improving**.

<img src="../images/early_stopping1.png" alt="Early Stopping" width="60%">

---

### 🧪 Keras

```python
early_stop = callbacks.EarlyStopping(
    monitor="val_loss",
    patience=5,
    min_delta=1e-4,
    mode="min",
    restore_best_weights=True
)

model.fit(
    x_train, y_train,
    validation_data=(x_val, y_val),
    epochs=200,
    batch_size=64,
    callbacks=[early_stop]
)
