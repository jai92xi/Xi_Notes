#### <mark>**OVERFITTING**</mark>
* Model **memorizes the training data excessively** - including **noise** - it **performs well on training data** but **poorly on new/unseen data**.
* solution: More training data, Data Augmentation; reduce model complexity (reduce layers/neurons); Early Stopping; Dropout, L1/L2 regularization, Batch Normalization; cross validation.

#### <mark>**High Recall (95%), Low Accuracy (65%) in RAG**</mark>

- **Problem:** Recall@20 = 95%, Answer Accuracy = 62%.
- **Root Cause:** The correct chunk is retrieved but ignored or misinterpreted by the LLM.

##### <mark>**Why Does It Happen?**</mark>
- **Lost in the Middle:** Relevant chunks are buried at positions 8–14.
- **Irrelevant Context:** Top-ranked chunks distract the model.
- **Missed Details:** Exceptions, eligibility rules, or dates are overlooked.
- **High Token Cost:** Too many chunks increase noise and cost.

##### <mark>**Solutions**</mark>
1. **Reranking:** Move the most relevant chunks to the top using a cross-encoder.
2. **Context Optimization:** Pass only the top 3–5 relevant chunks after evaluation.
3. **Prompt Engineering:** Prioritize direct evidence and policy exceptions.
4. **Hybrid Search:** Combine BM25 keyword search with vector search.
5. **Evaluation:** Track Recall@K, MRR/NDCG, answer accuracy, faithfulness, and token cost.

#### <mark>**RRF (Reciprocal Rank Fusion)**</mark>
- is **Rank-aggregation algorithm**.
- **Combines results from multiple retrievers** like BM25, Vector Search rankings.
- **Why?** Scores use different scales.
- Uses **ranks, not raw scores**.
- **Formula:** `RRF(d) = Σ 1 / (k + rank(d))` 🧮
- `k` is typically 60.

#### <mark>**EARLY STOPPING:**</mark>
* A **regularization** technique - that prevents **overfitting** - by **stopping training** when **validation performance stops improving**.

#### <mark>**FORWARD PROPAGATION VS BACKWARD PROPAGATION**</mark>
1. **Forward Propagation**  - makes **predictions**.
2. **Backward Propagation** - learns from **prediction error** and **updates model weights**.

#### <mark>🧠 Masked Language Modeling (MLM) in BERT</mark>
- BERT uses **bidirectional self-attention** to learn from both left and right context.
- During **pretraining**, MLM selects approximately **15% of tokens for prediction** (**80% `[MASK]`, 10% random, 10% unchanged**).
- BERT learns word relationships by predicting original tokens and minimizing prediction errors.
- At inference, it assigns probabilities to candidate tokens and predicts the highest-scoring token (e.g., The policyholder filed a `[MASK]` claim after the accident. >> `motor`).

#### <mark>**VANISHING GRADIENT**</mark>
* During **backpropagation**, gradients become **extremely small** toward **earlier layers**, causing **very small weight updates** and **slow learning**.
* Methods: ReLU, Leaky ReLU; Batch/Layer Normalization; Residual Connection (ResNet); He/Xavier weight initialization.

#### <mark>**EXPLODING GRADIENT**</mark>
* During **backpropagation**, gradients become **extremely large**, causing **huge weight updates**, **unstable training**, and sometimes **Inf/NaN loss**.
* Methods: **Gradient Clipping**; Reduce Learning Rate; Batch/Layer Normalization; Proper Weight Initialization; Residual Connection (ResNet).

#### <mark>**Types of Drift in Machine Learning**</mark>
| Type of Drift | Definition | Example | What Changed? |
|---|---|---|---|
| **Data Drift (Feature Drift)** | The distribution of input data changes over time. | Earlier, most customers were aged 25–35. Now, most are aged 50–60. | Customer age distribution |
| **Concept Drift** | The relationship between input features and the outcome changes. | Earlier, customers visiting a store five times usually purchased a phone. Now, they visit five times just to compare prices and rarely buy. | Customer behavior and the relationship between visits and purchases |
| **Label Drift (Prior Probability Shift)** | The overall proportion of outcome classes changes over time. | Earlier, 30% of customers purchased a phone. Now, only 10% purchase one due to an economic slowdown. | Purchase rate |
| **Prediction Drift (Score Drift)** | The distribution of model predictions or scores changes over time. | Earlier, predicted purchase probabilities were mostly around 60%. Now, most are around 90%. | Distribution of model scores |
| **Model Performance Drift** | The predictive performance of a model deteriorates over time. | Earlier, the model's accuracy was 90%. Now, it is 70% when evaluated against actual outcomes. | Model performance |


#### <mark>**CONFUSION MATRIX**</mark>
* **Confusion Matrix**: An **N×N grid** used to **evaluate a classification model** by comparing **actual labels** vs **predicted labels**.
* **Metrics:** Accuracy, Precision, Recall, F1-Score, Specificity, ROC-AUC, PR-AUC, Balanced Accuracy, FPR, FNR

#### <mark>**DIFFERENT EMBEDDING MODELS FOR QUERY AND VECTOR**</mark>
* Use the **same embedding model** for both queries and documents - (a) can have different dimensions - so dimension-mismatch error. (b) same dimension but different vector coordinates - irrelevant chunks.
* or use a **pair of encoders explicitly trained to produce embeddings in the same shared space**, such as **DPR**

#### <mark>**Handling Long Documents with BERT**</mark>
- **Problem:** BERT limit = 512 tokens; an 8,000-token contract may contain risky clauses anywhere; current F1 = 0.64.
- **Solution:** Sliding windows (512 size, 384 stride, 128 overlap) create ~21 chunks; process in GPU batches using FP16.
- **Aggregation:** Max pooling detects any risky clause; mean pooling reduces isolated false positives; threshold predicts **High Risk / Normal**.
- **Optimization:** Reuse fine-tuned BERT, benchmark end-to-end latency against 300 ms, and validate F1. Alternatives: Longformer or long-context LLMs.

#### <mark>**POSITIONAL ENCODING**</mark>
* **RNN** : processes **tokens sequentially** → order is naturally captured.
**Transformer**: processes **all tokens in parallel** → self-attention alone **doesn't know token order**. >> “Dog🐶 bites man” ≠ “Man bites dog🐶” same
- **Absolute PE:** Encodes the **exact position** of each token. `A = 5, B = 15` → may struggle with **positions beyond the trained context length**.
- **Relative PE (RPE):** Encodes the **relative distance/position** between tokens. `B is +10 from A` → relative position is **explicitly used in attention**.
- **RoPE:** Encodes position by **rotating Q and K** according to their positions, so their **interaction captures relative position**.

#### <mark>**HALLUCINATION**</mark>
Hallucination happens when the **retrieved context doesn't contain enough relevant information**, causing the model to **generate unsupported information** instead. So, use methods to **prevent invention and improve retrieval quality**. 
| Prevent Invention | Improve Query | Improve Retrieval | Improve Context | Verify Answer |
||||||
| Grounding prompt | Query rewriting | Chunking | Remove irrelevant chunks | Claim verification |
| Abstention | Query decomposition | Parent-child retrieval | Remove duplicate chunks | Citation/evidence verification |
| "Don't guess" | HyDE | Hybrid search | Context compression | Groundedness check |
|  |  | Reranker | Conflict resolution | Retry / regenerate / abstain |
|  |  | MMR |  |  |
-
#### <mark>**RAG EVALUATION**</mark>
* **Retrieval**  :  Recall@K, Precision@K, Hit Rate@K, MRR, nDCG@K, MAP@K, Retrieval Latency
* **Context** 	 : 	Context Recall [Ragas], Context Precision [Ragas], Redundancy/Diversity
* **Generation** : 	Faithfulness [Ragas], Answer Relevance [Ragas], Answer Correctness [Ragas], Answer Completeness, Citation Correctness, Citation Completeness
* **System** 	   : 	End-to-End Latency, Cost, Token Usage, Failure Rate, Throughput, Availability, User Satisfaction


#### <mark>**🧠 KV CACHE**</mark>
**Stores:** Past **Key & Value (K/V)** tensors.
- ⚡ **Benefit:** Avoids recomputation → **faster LLM inference**.
- 💾 **Trade-off:** Uses extra **GPU memory**, grows with context length.

#### <mark>**OPTIMIZATIONS**</mark>
- **GQA/MQA** → Fewer **K/V heads** → 📉 smaller cache.
- **KV Quantization** → Fewer **bits per K/V** → 📉 lower memory.
- **PagedAttention** → Efficiently **manages KV-cache memory** → less fragmentation.


#### <mark>**🧠 MMR - Maximal Marginal Relevance**</mark>
- retrieval **reranking** strategy 💡
- selects documents that are **relevant to the user query** 🌱 while also **being different from the chunks already selected** 𐦂𖨆𐀪𖠋
- reducing **redundant or duplicate** content.📉

#### <mark>**🥷 Types of Attention in Transformers**</mark>
> 1. **Self-Attention** 🔄                    — Tokens attend to other tokens in the same sequence.
> 2. **Multi-Head Attention (MHA)** 🧠       — Multiple attention heads learn different relationships in parallel.
> 3. **Causal / Masked Self-Attention** 🎯    — Tokens attend only to previous tokens.
> 4. **Cross-Attention** 🔀                  — One sequence attends to another sequence.

> 5. **Multi-Query Attention (MQA)** 💾      — Multiple Q heads share one K/V head.
> 6. **Grouped-Query Attention (GQA)** 🧩    — Groups of Q heads share K/V heads.

> 7. **Sparse Attention** 🕸️                 — Tokens attend only to selected tokens.
> 8. **Local/Window Attention** 🪟            — Tokens attend only to nearby tokens.
> 9. **Global Attention** 🌐                  — Selected tokens attend across the entire sequence.

#### <mark>**🥷 Batch Normalization**</mark>
> BatchNorm is a **technique used to <mark>normalize the activations</mark>** of a neural network layer **during training**, making training faster and more stable.

#### <mark>**🔥Handling Class Imbalance**</mark>
```
├── 1. Fix the DATA
│   ├── Undersampling
│   ├── Oversampling
│   ├── SMOTE
│   └── Data Augmentation
├── 2. Fix the ALGORITHM / DECISION
│   ├── Class Weighting
│   ├── Threshold Tuning
│   ├── Imbalance-Aware Ensembles
│   └── Outlier / Anomaly Detection
└── 3. Fix the EVALUATION
    ├── Recall
    ├── Precision
    ├── F1-Score
    ├── PR-AUC
    └── Stratified K-Fold CV
```


### <mark>**🐉 SMOTE — Synthetic Minority Over-sampling Technique**</mark>
> SMOTE is an **oversampling technique** used to **handle class imbalance** 
> by **creating new synthetic minority-class samples** instead of **simply duplicating existing ones**.

Minority sample → Find K nearest minority neighbors → Select one neighbor → Generate a synthetic sample between them



### <mark>🍉 Bagging vs Boosting </mark>
Bagging and boosting are **both ensemble learning techniques**, but they build models differently.

**What is Ensemble Method in ML?**
Ensemble learning means **combining multiple ML models** to get a better and more accurate prediction.

**Bagging:**
- Trains **multiple models independently and in parallel** on **different samples of the data**.
- **Combines their predictions**, usually by **majority voting for classification** or **averaging for regression**.
  
**Boosting:**
- **Trains models sequentially**, where **each new model focuses more on the errors made by previous models**.


### <mark>🫜 L1 L2 Regularization </mark>
> **L1 and L2** are **regularization techniques** used to **reduce overfitting**
> 
> by **adding a penalty** on the **model's weights** to the **loss function**.

- **L1 (Lasso):** Adds **absolute values of weights** to the loss.
  - Can make weights **exactly zero**.
  - Performs **feature selection**.

- **L2 (Ridge):** Adds **squared weights** to the loss.
  - Makes weights **small**, but usually not zero.
  - Produces **smoother and more stable models**

**When to use which?**
- **L1:** High-dimensional data with many irrelevant features → **eliminates features**
- **L2:** Most features are useful but model is overfitting → **shrinks weights**
- **Elastic Net:** Need **both L1 and L2** behavior


### <mark>🍋‍🟩Serving Llama-3.1-70B Using vLLM </mark>

The problem is **OOM (Out of Memory)** when serving a 70B model on **2 × A100 80GB GPUs** with 40 concurrent users and 4K-token contexts.

**Why Does It Fail?**
- FP16 weights require ~140GB, leaving insufficient memory for the KV cache and runtime overhead.

**Solution: 4-Bit Quantization**
- Use a compatible **AWQ/GPTQ checkpoint** to reduce weight memory to roughly 40GB.

**vLLM Configuration:**
- Set `--tensor-parallel-size 2` and `--gpu-memory-utilization 0.90` to distribute computation across both GPUs and manage memory usage.
