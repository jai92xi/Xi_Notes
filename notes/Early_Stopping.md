> 🧠 **EARLY STOPPING**
>
> Early stopping is a **regularization technique** that **helps prevent overfitting** by stopping training when **validation performance stops improving**.

**Training loss** keeps **decreasing** 📉, but **validation loss** starts **increasing** 📈 (or stops improving) → the model is beginning to overfit → **stop training**.


```python
early_stop = callbacks.EarlyStopping(
    monitor              = "val_loss",  # monitor validation loss during training
    patience             = 5,          # wait 5 epochs for improvement before stopping
    min_delta            = 0.001,      # minimum change considered as an improvement
    mode                 = "min",      # lower validation loss is better
    restore_best_weights = True        # restore weights from the best epoch
)
```

https://jai92xi.github.io/AIBrainBox/?id=Xi-00015
