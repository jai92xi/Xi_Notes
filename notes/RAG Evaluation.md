```
RAG EVALUATION
│
├── RETRIEVAL
│   ├── Recall@K
│   │   ├── Top-5 = [C10, C30, C40, C50, C20]
│   │   ├── Relevant = [C10, C20]
│   │   └── Recall@5 = 2/2 = 100%
│   │
│   ├── Precision@K
│   │   ├── Top-5 = [C10, C30, C40, C50, C20]
│   │   ├── Relevant retrieved = 2
│   │   └── Precision@5 = 2/5 = 40%
│   │
│   ├── Hit Rate@K
│   │   ├── Top-5 contains C10
│   │   └── Hit Rate@5 = 1 (hit)
│   │
│   ├── MRR
│   │   ├── First relevant chunk = C10 at rank 1
│   │   └── MRR = 1/1 = 1.0
│   │
│   ├── nDCG@K
│   │   ├── Highly relevant chunk should be rank 1
│   │   ├── Retrieved at a lower rank
│   │   └── nDCG decreases
│   │
│   ├── MAP@K
│   │   ├── Relevant chunks occur at ranks 1 and 5
│   │   ├── Precision@1 = 1/1 = 1.0
│   │   ├── Precision@5 = 2/5 = 0.4
│   │   └── AP@5 = (1.0 + 0.4) / 2 = 0.70
│   │
│   └── Retrieval Latency
│       ├── Query sent to Qdrant
│       ├── Qdrant returns results
│       └── Retrieval time = 35 ms
│
├── CONTEXT
│   ├── Context Recall [Ragas]
│   │   ├── Required information = "20 days leave"
│   │   ├── Retrieved context contains this information
│   │   └── Context Recall = High
│   │
│   ├── Context Precision [Ragas]
│   │   ├── Retrieved chunks = 5
│   │   ├── Useful chunks = 2
│   │   └── Most retrieved context is irrelevant → Low
│   │
│   └── Context Redundancy/Diversity
│       ├── 5 chunks retrieved
│       ├── 3 chunks repeat the same information
│       └── High redundancy / Low diversity
│
├── GENERATION
│   ├── Faithfulness [Ragas]
│   │   ├── Context = "Employees get 20 days"
│   │   ├── Answer = "Employees get 20 days"
│   │   └── Answer is supported by context → Faithful
│   │
│   ├── Answer Relevance [Ragas]
│   │   ├── Question = "How many days of leave?"
│   │   ├── Answer = "Employees get 20 days."
│   │   └── Directly answers the question → Relevant
│   │
│   ├── Answer Correctness [Ragas]
│   │   ├── Expected = "20 days"
│   │   ├── Generated = "20 days"
│   │   └── Answer is correct
│   │
│   ├── Answer Completeness
│   │   ├── Expected = "20 days + request 7 days ahead"
│   │   ├── Generated = "20 days"
│   │   └── Missing required information → Incomplete
│   │
│   ├── Citation Correctness
│   │   ├── Answer cites C10
│   │   ├── C10 supports "20 days"
│   │   └── Citation is correct
│   │
│   └── Citation Completeness
│       ├── Answer contains 2 factual claims
│       ├── Only 1 claim has a citation
│       └── Citation coverage is incomplete
│
└── SYSTEM
    ├── End-to-End Latency
    │   ├── Retrieval = 35 ms
    │   ├── LLM generation = 1.7 sec
    │   └── Total = ~1.8 sec
    │
    ├── Cost
    │   ├── Embedding + retrieval + LLM
    │   └── Cost per query = $0.003
    │
    ├── Token Usage
    │   ├── Input/context = 2,000 tokens
    │   └── Output = 150 tokens
    │
    ├── Failure Rate
    │   ├── Total queries = 1,000
    │   ├── Failed queries = 10
    │   └── Failure Rate = 10/1000 = 1%
    │
    ├── Throughput
    │   ├── Concurrent requests processed
    │   └── Throughput = 50 queries/sec
    │
    ├── Availability
    │   ├── Total service time
    │   ├── Downtime
    │   └── Availability = 99.9%
    │
    └── User Satisfaction
        ├── Users surveyed = 100
        ├── Positive ratings = 90
        └── Satisfaction = 90%
```
