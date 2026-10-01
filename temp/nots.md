You monitor validation accuracy for early stopping, and training loss is still decreasing. Validation accuracy has plateaued but validation loss has started rising. What is the most likely explanation?
A. The model is becoming overconfident on its wrong predictions, so loss rises while accuracy stays flat.
B. The validation set has been corrupted by data leakage.
C. Accuracy is a lagging indicator and will always start rising again.
D. The learning rate is too low, so the loss surface isn't being explored.


The correct answer is A. The model is becoming overconfident on its wrong predictions, so loss rises while accuracy stays flat.
Why this happens:
• Accuracy vs. Loss: Accuracy only measures whether a prediction is right or wrong based on a hard threshold (e.g., if a probability is above or below 0.5). Loss (like cross-entropy), however, measures the exact confidence of those predictions.
• Overconfidence in Mistakes: As a model overfits, it starts memorising details. For the validation examples it gets right, it stays right. But for the validation examples it gets wrong, the model begins predicting those incorrect classes with increasingly massive confidence (e.g., predicting a wrong class with 99% certainty instead of 51%).
• The Result: Because the predictions don't change sides of the decision boundary, the accuracy plateaus. However, because the penalty for highly confident wrong answers grows exponentially in cross-entropy loss, the validation loss shoots upward.


----------------- NEXT - Different Models for Query & Vector -------------------------
Different **embedding models** can learn different **vector spaces** and may produce vectors with different **dimensionalities**.

- **Different dimensionality:** If the query and document vectors have different dimensions, **cosine similarity** or **dot product** cannot be computed directly. The vector database will typically reject the query with a **dimension-mismatch error**.

- **Same dimensionality:** Even if two models produce vectors of the same size, their **vector coordinates don't have the same semantic meaning**. Therefore, comparing a query embedding from one model with a document embedding from another is generally **not meaningful** and can result in **poor retrieval**.

- **Hence:** Use the **same embedding model** for both queries and documents, or use a **pair of encoders explicitly trained to produce embeddings in the same shared space**, such as **DPR**.

--------------------------------------------
