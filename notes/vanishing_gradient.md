#### **VANISHING GRADIENT**

* **[When]**: Issue occurs during **training** while performing **backpropagation**.
* **[Impact]**: **Earlier layers** receive **extremely small weight updates**, so they **learn very slowly** or may effectively **stop learning**.
* **[Why]**: During **backpropagation**, gradients are repeatedly multiplied by **derivatives of activation functions**. If these derivatives are **small**, the gradient becomes **exponentially smaller** as it moves toward the **earlier layers**.

**VANISHING GRADIENT SCENARIO**
Consider a **deep neural network** that uses the **sigmoid activation function** in all hidden layers. The derivative of the **sigmoid function** has a maximum value of **0.25**.
During **backpropagation**, these derivatives contribute **multiplicatively** to the gradient.
Since each sigmoid derivative is at most **0.25**, repeated multiplication across many layers can make the **gradient extremely small**.
As a result, the **earlier-layer weights** receive **very small updates**, causing those layers to **learn very slowly** or **effectively stop learning**.


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
