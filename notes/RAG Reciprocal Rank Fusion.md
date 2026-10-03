#### <mark>**RRF — Reciprocal Rank Fusion in RAG**</mark>
It is a **rank-aggregation algorithm** used in **RAG** to combine results from multiple retrievers, such as **BM25** and **dense vector search**.

#### **Why RRF?**
**BM25** and **vector search** produce scores on different scales: **BM25:** `10–200`; **Cosine similarity:** `0.70–0.95`. 
Therefore, their **raw scores cannot be directly compared**.

<mark> RRF ignores raw scores and uses only the **rank** of each document</mark>:

$$
RRF(d) = \sum_{r \in R} \frac{1}{k + rank_r(d)}
$$

where **`k`** is typically **60**.

### Example

Suppose a document ranks:
- **#2** in **BM25**
- **#5** in **Vector Search**

**RRF score** would be:

$$RRF(d) = \frac{1}{60 + 2} + \frac{1}{60 + 5} = \frac{1}{62} + \frac{1}{65} \approx 0.0315$$
