> ### What is Tokenization?
> 
> Breaks text into smaller units (**words, subwords, characters**) and converts them into numerical **Token IDs** for LLM processing.

> **Tokenization Algorithms:**
> 1. **Encoder-only Transformer – BERT:** WordPiece
> 2. **Decoder-only Transformer – GPT:** Byte Pair Encoding (BPE)
> 3. **Encoder-Decoder Transformer – T5:** SentencePiece

----

> ### What are Embeddings?
>
> Convert text into **dense numerical vectors** capturing semantic meaning.

> **Embedding Models:**
> - **OpenAI                :** `text-embedding-3-small`, `text-embedding-3-large`
> - **Google                :** `text-embedding-004`
> - **Cohere                :** `embed-v4.0`
> - **BGE                   :** `BAAI/bge-large-en-v1.5`
> - **Sentence Transformers :** `all-MiniLM-L6-v2`
---
> **Vector Databases / Search Engines:** Azure AI Search, Pinecone, FAISS, Chroma, Weaviate, Milvus.
---
> **Similarity Metrics:**
> - **Cosine Similarity:** Measures angle between vectors → **Direction** (ignores magnitude).
> - **Euclidean Distance (L2):** Straight-line distance → **Direction + Magnitude**.
> - **Dot Product:** Measures alignment + vector magnitudes.
---
> ### Same embedding model for Document & Query Embeddings. If different:
>   - **Dimension Mismatch:** Different vector dimensions → Search errors.
>   - **Semantic Space Incompatibility:** Same dimensions do not guarantee compatible vectors → Poor retrieval.
>     
> - **Model Upgrade:** Regenerate existing document embeddings.
>
> **Use a pair of encoders** explicitly trained to produce embeddings in the same shared space, such as **DPR**

---
> ### Retrieval Methods
>
> **1. Sparse Search**
> - **Keyword-based retrieval:** BM25, TF-IDF.
> - Best for **exact matches**: Claim IDs, Policy Numbers.
>
> **2. Dense Search**
> - **Semantic retrieval:** Embeddings + Vector Similarity.
> - Metrics: **Cosine Similarity, Dot Product, L2**.
> - Models: `text-embedding-3-small`, `BAAI/bge-large-en-v1.5`.
>
> **3. Hybrid Search**
> - Combines **BM25 + Dense Vector Search**.
> - Captures **keyword + semantic relevance**.
> - Tools: **Azure AI Search, Elasticsearch, OpenSearch**.
---
> **RRF (Reciprocal Rank Fusion)**
> - Combines ranked results from multiple retrievers.
> - Uses **rank positions**, not raw relevance scores.
> - Formula: `RRF(d) = Σ 1 / (k + rank(d))` (`k = 60`).
---
> ### What is Reranking?
> - Reorders retrieved chunks by **query relevance**.
> - Most relevant chunks → Top ranks.

> ### Cross-Encoder
> - Input: **Query + Document Chunk** (together).
> - Output: **Relevance Score** per query–chunk pair.
> 
> - Models: `BAAI/bge-reranker-v2-m3`, `cross-encoder/ms-marco-MiniLM-L-6-v2`, `Cohere Rerank`.

> ### Why Not Rerank Entire Database?
> - Each chunk compared with user query - High **computational cost + latency**.

> ### Two-Stage Retrieval Pipeline
> 1. **Initial Retrieval:** BM25 / Dense / Hybrid Search → Top 20–100 candidates.
> 2. **Reranking:** Cross-Encoder → Top-N relevant chunks → LLM.

---
> ### Maximal Marginal Relevance (MMR)
> - Balances **Relevance + Diversity** during retrieval.
> - Selects chunks relevant to the query while avoiding redundant information.
> - Reduces **duplicate / overlapping context** in RAG.

---
