### 💥 **Exploding Gradient**
> During **backpropagation**, gradients become **extremely large**, causing **huge weight updates** and unstable training.

- **Main Causes 🚨:** **High learning rate**, very deep networks, poor weight initialization, repeated multiplication of large derivatives.

- **Symptoms:** Loss suddenly becomes **very large** 📈, unstable, or turns into **Inf/NaN**; gradient norms become extremely large.

- **Main Fix:** **Gradient Clipping** ✂️ — limits the maximum gradient magnitude/norm.

- **Also:** **Reduce Learning Rate** 🔽 to make weight updates smaller.

- **Other Methods:** Batch/Layer Normalization; proper weight initialization; Residual Connections.

- **Key Difference:**
  - 🐢 **Vanishing Gradient** → gradients **too small** → slow/no learning.
  - 💥 **Exploding Gradient** → gradients **too large** → unstable training / NaN.

https://jai92xi.github.io/AIBrainBox/?id=XI-00029
https://jai92xi.github.io/AIBrainBox/?id=XI-00030
https://jai92xi.github.io/AIBrainBox/?id=XI-00016
