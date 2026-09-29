> 🧠 **EARLY STOPPING**
> Early stopping is a **regularization technique** that **prevents overfitting** by stopping training when **validation performance stops improving**.

![Uploading image.png…]()

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
````

 ### ⚙️ Key Parameters

 | Parameter | Meaning |
| --- | --- |
| `monitor="val_loss"` | 👀 Monitor validation loss |
| `patience=5` | ⏳ Wait 5 epochs without improvement |
| `min_delta=1e-4` | 🔎 Minimum change considered an improvement |
| `mode="min"` | 📉 Lower value is better |
| `restore_best_weights=True` | ⭐ Restore weights from the best epoch |

> ⭐ **Important:** In the example, Epoch 3 has the lowest `val_loss (0.40)`, so `restore_best_weights=True` restores the **Epoch 3 weights**.

---

 ### 🧩 Can Be Combined With

 **Dropout** → Randomly removes neurons\
 **L2 / Weight Decay** → Penalizes large weights\
 **Data Augmentation** → Creates varied training examples\
 **Early Stopping** → Stops when validation performance worsens

 > 🎯 **Takeaway:**\
>  **Train → Monitor Validation → Detect Overfitting → Stop → Restore Best Weights**
