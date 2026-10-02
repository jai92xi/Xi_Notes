**Hallucination** happens when the retrieved context doesn't have enough **relevant information**, so the model starts **inventing** the answer instead.

```
HALLUCINATION
     │
     │
     ├── Prevent Invention
     │   ├── **Grounding prompt**
     │   │   → "Answer only from retrieved context"
     │   ├── No guessing / no outside knowledge
     │   ├── **Abstention**
     │   │   → "I don't have enough information"
     │   └── **Lower temperature** / decoding control
     │        → reduces creative/free-form invention (blunt tool)
     │
     ├── Improve Query → Get the RIGHT information
     │   ├── **Query rewriting** → vague/poor query
     │   ├── **Query decomposition** → multiple questions
     │   └── **HyDE** → improve semantic retrieval
     │
     ├── Improve Retrieval → Get ENOUGH relevant information
     │   ├── **Chunking** → avoid missing context / excessive noise
     │   ├── **Parent-child retrieval** → retrieve relevant part + context
     │   ├── **Hybrid search** → semantic + exact keyword matching
     │   ├── **Reranker** → put most relevant chunks at the top
     │   └── **MMR** → avoid duplicate chunks in Top-K
     │
     ├── Improve Context → Give CLEAN evidence to LLM
     │   ├── Remove irrelevant / duplicate chunks
     │   ├── **Context compression** → keep relevant information
     │   └── **Resolve conflicting information** / prefer trusted source
     │
     ├── Improve Model's Base Knowledge
     │   └── **Domain fine-tuning**
     │        → aligns prior knowledge with domain, so model
     │          "fills gaps" correctly instead of guessing
     │
     └── Verify Answer → Is the answer GROUNDED?
         ├── **Groundedness / faithfulness check**
         │    → check claims against retrieved context
         ├── **Citation / evidence verification**
         ├── **Self-consistency check**
         │    → sample multiple generations, compare agreement
         │
         └── Not grounded?
              ├── Retry retrieval
              ├── Regenerate
              └── **Abstain** → "I don't have enough information"
```
