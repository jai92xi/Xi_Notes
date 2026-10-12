# Handling Long Documents with BERT: Chunking and Prediction Aggregation

## 1. Problem Statement
- **Model:** `bert-base-uncased`
- **Contract length:** ~8,000 tokens
- **BERT input limit:** 512 tokens
- **Current F1 score:** 0.64
- **Latency:** 300 ms
- **Hardware:** Single GPU
- **Constraint:** No large-scale retraining

**Issue:** Truncating to the first 512 tokens misses risky clauses elsewhere in the contract.

## 2. Solution: Sliding Window + Score Aggregation

### Step 1: Chunking
- Window size: 512 tokens
- Stride: 384 tokens
- Overlap: 128 tokens
- Total: Approximately 21 windows per contract

Overlapping windows cover the entire document and reduce the risk of missing clauses at chunk boundaries.

### Step 2: Batched GPU Inference
- Process multiple windows in batches.
- Use FP16 inference if supported.
- Enable inference mode and dynamic padding.
- Optimize batch size for GPU memory and latency.

### Step 3: Prediction Aggregation

**Max Pooling**
```python
contract_risk = max(window_risk_scores)
```
- Detects a single highly risky clause.
- Simple and requires no additional training.
- May increase false positives.

**Mean Pooling**
```python
contract_risk = sum(window_risk_scores) / len(window_risk_scores)
```
- Reduces isolated false positives.
- May dilute critical risk scores.

**Attention Pooling**
- Assigns weights to important windows.
- Usually requires additional training on labeled data.

**Recommendation:** Start with max and mean pooling, then select the best method using validation data.

### Step 4: Final Prediction
Compare the aggregated risk score against a validation-tuned threshold:
- Above threshold: **High Risk**
- Below threshold: **Normal**

## 3. Latency Optimization
- Batch windows on the GPU.
- Use FP16 and dynamic padding.
- Minimize tokenization and data-transfer overhead.
- Benchmark end-to-end latency, including preprocessing and aggregation.
- Measure p50 and p95 latency to verify the **300 ms target**.

## 4. Alternatives

| Approach | Limitation |
|---|---|
| Extend BERT to 8,192 tokens | Requires position-embedding adaptation and fine-tuning; expensive full attention |
| First and last 256 tokens | Misses risky clauses in the middle |
| Longformer-base (4,096 tokens) | Cannot cover the full 8,000-token contract in one pass |
| Long-context LLMs (Phi-3-mini 128K, Llama 3.1 8B) | May exceed latency and cost budgets; useful for detailed legal reasoning |

## 5. Evaluation
Compare the baseline and pooling strategies using:
- F1 score, precision, and recall.
- High-risk false negatives and false positives.
- End-to-end latency and GPU memory.

Use contract-level train/validation/test splits to prevent data leakage. Actual F1 improvement and latency must be measured.

## 6. Interview Takeaway

**Use overlapping sliding windows with BERT and aggregate window-level risk scores.**

This approach covers the entire contract, reuses the existing model, avoids retraining from scratch, and supports efficient GPU inference. Start with max/mean pooling and validate performance against the 300 ms latency budget.
