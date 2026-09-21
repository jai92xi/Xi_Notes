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
