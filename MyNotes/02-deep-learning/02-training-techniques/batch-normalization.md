# 🧠 Batch Normalization

## 🔹 What does Normalization mean?

Before talking about **Batch Normalization**, let's first understand what **Normalization** does.

👉 **Normalization** basically means bringing values that are on very different scales into a more comparable range.

### 📌 Example

Suppose we have two features:

- 👤 **Age:** `0 – 120`
- 💰 **Salary:** `10,000 – 10,00,000`

These two features are on very different scales.

If we directly use them, the larger-scale feature can have a **disproportionate influence** during the learning process.

So, **Normalization** transforms these values into a more comparable scale, which helps the model learn more effectively.

---

## 🧠 How does this relate to Neural Networks?

A **Neural Network** has many layers, and the output of one layer becomes the input to the next layer.

```text
Input
  ↓
Layer 1
  ↓
Layer 2
  ↓
Layer 3
  ↓
Output
````

 Suppose **Layer 1** produces activations like:

```
[2, 5, 100, 200, 50]
```

 These values have quite different scales.

 As training happens, the values produced by the layers can also keep changing as the weights are updated.

 This is where **Batch Normalization** becomes useful. ⚙️

---

 ## 🔄 What does Batch Normalization do?

 **Batch Normalization (BatchNorm)** helps normalize the **intermediate activations** of a neural network so that they remain more stable and consistent during training.

 For example:

 ### ❌ Before Batch Normalization

```
[2, 5, 100, 200, 50]
```

 ⬇️ **Batch Normalization**

 ### ✅ After Batch Normalization

```
[-0.8, -0.5, 0.2, 1.1, 0.3]
```

---

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

 __

 # ⚡ Quick Revision Points

 - 📏 **Normalization** → Brings values to a comparable scale.
- 🎯 **Feature normalization** → Applied to input features.
- 🧠 **BatchNorm** → Applied to intermediate activations.
- 🚀 **BatchNorm** can make training faster and more stable.