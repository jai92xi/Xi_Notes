> <mark>**Vanishing gradient**</mark> is a training problem where gradients become extremely small during backpropagation,
> **causing early-layer weights to update very slowly or not at all**.

## Categories of Methods for Vanishing Gradient

 ### 1\. Activation Functions

 - **ReLU** — Maintains stronger gradients for positive inputs.
- **Leaky ReLU** — Allows a small gradient for negative inputs.

 ### 2\. Network Architecture

 - **Residual Connections (ResNet)** — Create shortcut paths that allow gradients to flow through deep layers.
- **LSTM/GRU** — Preserve gradients better across long sequences in recurrent networks.

 ### 3\. Weight Initialization

 - **Xavier Initialization** — Helps keep activation and gradient magnitudes stable.
- **He Initialization** — Designed for ReLU-based networks to maintain effective gradient flow.

 ### 4\. Normalization

 - **Batch Normalization** — Stabilizes layer activations and improves gradient propagation.

 ### 5\. Optimization Techniques

 - **Appropriate Learning Rate** — Helps prevent unstable or ineffective parameter updates.
- **Gradient Clipping** — Mainly controls **exploding gradients**, rather than directly solving vanishing gradients.
