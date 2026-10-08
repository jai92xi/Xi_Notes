> **L1 and L2** are **regularization techniques** used to reduce **overfitting**
> by adding a penalty on the model's weights to the loss function.

The key difference is **how they penalize the weights**.

#### <mark>L1 Regularization — Lasso</mark>
L1 adds the **sum of the absolute values** of the weights to the loss:

$$
Loss = Original\ Loss + \lambda \sum |w_i|
$$

Because of the nature of the **L1 penalty**, it can push less important weights **exactly to zero**. 
This produces a **sparse model** and effectively performs **feature selection**.

#### <mark>L2 Regularization — Ridge</mark>
L2 adds the **sum of squared weights** to the loss:

$$
Loss = Original\ Loss + \lambda \sum w_i^2
$$

L2 penalizes **large weights more strongly** and shrinks weights toward zero without typically making them exactly zero. This often produces **smoother and more stable models**.

### When to use which?
- For **high-dimensional datasets** with **many irrelevant features**, consider **L1**, because it can **automatically eliminate features**.
- If **most features are useful** but the **model is overfitting**, prefer **L2**.
- If **both behaviors** are required, use **Elastic Net**, which combines **L1 and L2**.
