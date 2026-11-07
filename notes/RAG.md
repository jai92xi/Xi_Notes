> ### 1. What is Tokenization?
> 
> Breaks text into smaller units (**words, subwords, characters**) and converts them into numerical **Token IDs** for LLM processing.

> **Tokenization Algorithms:**
> 1. **Encoder-only Transformer – BERT:** WordPiece
> 2. **Decoder-only Transformer – GPT:** Byte Pair Encoding (BPE)
> 3. **Encoder-Decoder Transformer – T5:** SentencePiece

### 2. What are Embeddings?

Convert text into **dense numerical vectors** capturing semantic meaning.

- Similar meaning → Closer vectors.
- Used in **Semantic Search, Vector Search and RAG**.

**Embedding Models:**
- **OpenAI:** `text-embedding-3-small`, `text-embedding-3-large`
- **Google:** `text-embedding-004`
- **Cohere:** `embed-v4.0`
- **BGE:** `BAAI/bge-large-en-v1.5`
- **Sentence Transformers:** `all-MiniLM-L6-v2`

<mark>**Text → Dense Vectors → Semantic Similarity**</mark>

### 3. How are Embeddings used in RAG?

- **Ingestion:** Document → Chunking → Embedding → Vector Storage.
- **Retrieval:** Query → Query Embedding → Similarity Search → Top-K Chunks → LLM.

**Vector Databases / Search Engines:** Azure AI Search, Pinecone, FAISS, Chroma, Weaviate, Milvus.

**Similarity Metrics:** Cosine Similarity, Dot Product, Euclidean Distance (L2).

### 4. Why must Document & Query Embeddings be Compatible?

- **Dimension Mismatch:** Different vector dimensions → Search errors.
- **Semantic Space Incompatibility:** Same dimensions do not guarantee compatible vectors → Poor retrieval.
- **Solution:** Same embedding model and configuration for documents and queries.
- **Model Upgrade:** Regenerate existing document embeddings.

**Exception:** **DPR (Dense Passage Retrieval)** – separate Question Encoder and Passage Encoder trained in a shared vector space.

<mark>**Same dimensions ≠ Same semantic space.**</mark>
