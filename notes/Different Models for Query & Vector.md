#### Different **embedding models** can learn different **vector spaces** and may produce vectors with different **dimensionalities**.

- **Different dimensionality:** If the query and document vectors have different dimensions, **cosine similarity** or **dot product** cannot be computed directly. The vector database will typically reject the query with a **dimension-mismatch error**.

- **Same dimensionality:** Even if two models produce vectors of the same size, their **vector coordinates don't have the same semantic meaning**. Therefore, comparing a query embedding from one model with a document embedding from another is generally **not meaningful** and can result in **poor retrieval**.

- **Hence:** Use the **same embedding model** for both queries and documents, or use a **pair of encoders explicitly trained to produce embeddings in the same shared space**, such as **DPR**.

### How to handle zero-downtime re-indexing when switching models:
https://qdrant.tech/documentation/tutorials-operations/embedding-model-migration/?utm_source=chatgpt.com
