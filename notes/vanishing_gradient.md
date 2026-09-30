#### **VANISHING GRADIENT**

During **backpropagation**, gradients are repeatedly multiplied by **derivatives of activation functions**. If these derivatives are **small**, the gradient becomes **exponentially smaller** as it moves toward the **earlier layers**.

---

#### **SCENARIO:**

Consider a **deep neural network** that uses the **sigmoid activation function** in all hidden layers. The derivative of the **sigmoid function** has a maximum value of **0.25**.

During **backpropagation**, these derivatives contribute **multiplicatively** to the gradient. Since each sigmoid derivative is at most **0.25**, repeated multiplication across many layers can make the **gradient extremely small**.

As a result, the **earlier-layer weights** receive **very small updates**, causing those layers to **learn very slowly** or **effectively stop learning**.
---
#### **Solutions to Overcome the Vanishing Gradient Problem:**

```text
Vanishing Gradient
      │
      ├──► Better Activation Functions
      │      ├── ReLU
      │      └── Leaky ReLU
      │
      ├──► Proper Weight Initialization
      │      ├── He Initialization
      │      └── Xavier Initialization
      │
      ├──► Better Network Architecture
      │      └── Residual Connections (ResNet)
      │
      ├──► Normalization
      │      ├── Batch Normalization
      │      └── Layer Normalization
      │
      └──► For RNNs
             └── LSTM / GRU
```
