Yes — if you mean a **Databricks `%md` cell**, use this format:

````
%md

# Production RAG: Solving Context Fragmentation

A production RAG system uses **Pinecone + `text-embedding-3-large` + GPT-4.1**. During evaluation, the correct document is usually retrieved, but users report that answers are often incomplete.

After inspecting the retrieved context, you find that the answer frequently requires information spread across **three different chunks**. The retriever successfully finds the correct chunks individually, but they are ranked far apart. Since the system only sends the **top 3 chunks** to GPT-4.1, some required information is excluded.

This is a classic **context fragmentation** problem.

Even though `text-embedding-3-large` and Pinecone successfully identify relevant pieces, dense vector search may rank them poorly because each individual chunk captures only a partial semantic match to the user's query.

---

## 1. Quickest Fix: Add a Reranker

**Recommended first step:** introduce a cross-encoder reranker, such as:

- Cohere Rerank
- BGE Reranker
- Jina Reranker

### How it works

1. Increase Pinecone `top_k` from `3` to around `15–20`.
2. Pass the retrieved chunks and the user's query to the reranker.
3. Let the reranker evaluate the query against each candidate chunk.
4. Select the highest-ranked chunks.
5. Send the final context to GPT-4.1.

```text
User Query
    |
    v
Pinecone
top_k = 15–20
    |
    v
Reranker
    |
    v
Top relevant chunks
    |
    v
GPT-4.1
````

 ### Why it helps

 Dense embeddings are generally strong at **high-recall candidate retrieval**, but vector similarity alone is not always sufficient for precise ranking.

 A reranker performs a deeper query-to-document comparison and can promote chunks that are more directly relevant to the user's question.

---

 ## 2\. Context-Aware Fix: Parent-Child Retrieval

 The current architecture treats every chunk as an isolated unit.

 Instead, separate:

 - The text used for **retrieval**
- The text ultimately provided to **GPT-4.1**

 ### How it works

 Create larger **parent chunks**, for example:

 - Parent: `1,000–1,500` tokens
- Child: `200–300` tokens
- Child overlap: `30–50` tokens

 Store the child chunks in Pinecone with metadata such as:

```
{
  "document_id": "document_123",
  "parent_id": "document_123_section_4"
}
```

 When multiple retrieved child chunks belong to the same parent, reconstruct the parent context before sending it to GPT-4.1.

 ### Example

```
Parent
|
+-- Child A  <-- retrieved
+-- Child B
+-- Child C  <-- retrieved
+-- Child D
```

 Instead of sending only:

```
Child A
Child C
```

 the system can reconstruct:

```
Relevant Parent Context

Child A
Child B
Child C
Child D
```

 This preserves surrounding context and reduces fragmentation.

---

 ## 3\. Query Fix: Query Expansion / Decomposition

 Some questions contain multiple independent information needs.

 For example:

 > How did revenue change after the acquisition, and what impact did the acquisition have on operating costs?

 This can be decomposed into:

 1. What happened to revenue after the acquisition?
2. What was the acquisition?
3. What impact did the acquisition have on operating costs?

 Run the sub-queries independently against Pinecone:

```
Query 1 ----> Pinecone ----\
Query 2 ----> Pinecone -----+--> Deduplicate --> Reranker
Query 3 ----> Pinecone ----/
```

 The final candidate pool can then be passed through a reranker before constructing the GPT-4.1 context.

 ### Benefits

 - Better recall for multi-hop questions
- Each retrieval query focuses on one information need
- Sub-queries can be executed in parallel

 ### Trade-offs

 - Additional LLM latency
- Additional LLM cost
- More retrieval operations
- Requires deduplication

---

 ## 4\. Improve Chunking and Contextual Metadata

 Sometimes the problem is caused by chunks being too isolated or ambiguous.

 For example:

```
The company subsequently implemented this process
across all production environments.
```

 This chunk does not provide enough information about what "this process" means.

 Instead, enrich it with contextual information:

```
Document: Incident Response Policy
Section: Post-Incident Remediation
Topic: Production deployment controls

The company subsequently implemented this process
across all production environments.
```

 This additional context can improve the quality of the embedding and retrieval.

 Useful metadata includes:

 - Document title
- Section title
- Section hierarchy
- Entity names
- Topic
- Parent section
- Previous/next section context

---

 ## 5\. Consider HyDE for Difficult Queries

 **Hypothetical Document Embeddings (HyDE)** can help when the language used in the user's query differs significantly from the source documents.

 ### Flow

```
User Query
    |
    v
Generate hypothetical answer
    |
    v
Embed hypothetical answer
    |
    v
Pinecone Search
    |
    v
Relevant Documents
```

 The hypothetical answer can sometimes be semantically closer to the actual documents than the original user query.

 However, HyDE adds an additional LLM call, so it should be evaluated against simpler approaches such as reranking.

---

 # Recommended Production Architecture

 A robust architecture could look like:

```
                         User Query
                              |
                              v
                    Query Understanding
                              |
                              v
                     Query Expansion
                       /      |      \
                      /       |       \
                     v        v        v
                Pinecone  Pinecone  Pinecone
                     \        |        /
                      \       |       /
                       v      v      v
                      Candidate Pool
                            |
                            v
                         Reranker
                            |
                            v
                   Parent/Context Merge
                            |
                            v
                      Context Builder
                            |
                            v
                          GPT-4.1
                            |
                            v
                         Answer
```

 You do not necessarily need every component immediately.

---

 # Recommended Rollout Strategy

 ## Phase 1: Increase Retrieval Depth

 Change:

```
Pinecone top_k = 3
```

 to:

```
Pinecone top_k = 15–20
```

 Measure:

 - Recall@3
- Recall@20
- Answer completeness
- Latency
- Token usage

 If the required chunks appear in the top 20 but not the top 3, you have strong evidence that the primary problem is **ranking rather than retrieval recall**.

---

 ## Phase 2: Add a Reranker

 Use:

```
Pinecone top_k = 15–20
        |
        v
    Reranker
        |
        v
 Final context
        |
        v
     GPT-4.1
```

 This directly addresses the ranking problem without requiring a complete redesign.

---

 ## Phase 3: Add Parent-Child Retrieval

 If answers still require surrounding context:

```
Child chunks
     |
     v
 Pinecone
     |
     v
 parent_id
     |
     v
Context reconstruction
     |
     v
 GPT-4.1
```

 This is particularly useful for technical documentation, policies, manuals, and long structured documents.

---

 ## Phase 4: Add Query Decomposition

 For genuinely complex or multi-part questions:

```
Complex Query
      |
      v
Sub-query generation
      |
      v
Parallel retrieval
      |
      v
Deduplication
      |
      v
Reranking
      |
      v
Context assembly
      |
      v
GPT-4.1
```

 Use this selectively rather than for every query to control latency and cost.

---

 # Evaluation Metrics

 Do not evaluate only whether the **correct document** was retrieved.

 Measure the entire retrieval-to-generation pipeline.

 | Metric | Purpose |
| --- | --- |
| Recall@3 | Are required chunks in the current context? |
| Recall@20 | Can Pinecone find the required chunks? |
| MRR / NDCG | How well are relevant chunks ranked? |
| Context Recall | Does the context contain the required evidence? |
| Context Precision | How much retrieved context is actually relevant? |
| Answer Completeness | Does the answer cover all required facts? |
| Faithfulness | Is the answer supported by retrieved context? |
| Latency | How long does retrieval + reranking + generation take? |
| Token Usage | How much context is being sent to GPT-4.1? |

A particularly useful diagnostic is:

```
Recall@3
    vs.
Recall@20
```

 If:

```
Recall@20 = High
Recall@3  = Low
```

 then the evidence strongly suggests a **ranking/context-selection problem** rather than a fundamental retrieval problem.

---

 # Summary

 | Solution | Effort | Latency | Re-index Required | Main Benefit |
| --- | --- | --- | --- | --- |
| Increase `top_k` | Very Low | Low | No | Higher candidate recall |
| Reranker | Low | Low–Medium | No | Better ranking |
| Parent-Child Retrieval | Medium | Low–Medium | Usually Yes | Preserves context |
| Query Decomposition | Medium | Medium | No | Better multi-hop recall |
| Contextual Chunking | Medium | None at query time | Yes | Better chunk semantics |
| HyDE | Medium | Medium | No | Bridges vocabulary mismatch |

---

 # Recommended Starting Point

 Given that the **correct chunks are already being retrieved but ranked far apart**, the first production change should be:

```
Pinecone top_k = 15–20
          |
          v
      Reranker
          |
          v
  Context Selection
          |
          v
       GPT-4.1
```

 This directly targets the observed failure mode without requiring immediate re-indexing.

 If fragmentation remains, add **parent-child retrieval**. For complex multi-hop questions, add **query decomposition** selectively.

 > **Key principle:** Use vector search for high-recall candidate retrieval, then use reranking and context-aware assembly to construct the evidence that GPT-4.1 actually needs.

```

```
