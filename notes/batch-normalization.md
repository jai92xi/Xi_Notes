>  **Batch Normalization** (BatchNorm) is a technique used to **normalize the activations of a neural network** layer **during training**, making training faster and **more stable**.

Each layer's activations can end up on very different scales as training progresses. BatchNorm addresses this by normalizing activations across the current mini-batch using its mean and variance, and then applying learnable scale (γ) and shift (β) parameters.

Why apply γ and β after normalization?

BatchNorm normalizes for stability, while γ and β give the model the flexibility to undo or adjust that normalization when useful.

 ## 💻 Simple Keras Example
```
import tensorflow as tf
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Dense, BatchNormalization, ReLU

model = Sequential([
    Dense(32, input_shape=(10,)),
    BatchNormalization(),
    ReLU(),

    Dense(16),
    BatchNormalization(),
    ReLU(),

    Dense(1)
])
```
