Recall@20 = 95% 🤩🤩🤩
Answer Accuracy = 62% 🤯🤯🤯
WAIT… WHAT WENT WRONG?! 😳🔥
My RAG retrieved the right information… but Accuracy ? 👀

You’re running a RAG assistant over 40,000 internal HR policy documents using GPT-4o. Each query retrieves the top 20 chunks (~500 tokens each, so ~10K tokens of context) from Azure AI Search and passes them to the model in retrieval-score order. Offline evaluation shows the correct chunk appears somewhere in the top 20 for 95% of queries (recall@20 = 95%), yet answer accuracy is only 62%. Looking at the failures, the correct chunk usually sits at positions 8 to 14 in the prompt, and the model often answers from a tangential chunk near the top, or says the information isn’t available. Token cost per query is also high.

# High Retrieval Recall, Low Answer Accuracy: Where Is RAG Failing?

## First, let's break down the question 🤔

- **Recall@20 = 95%**
- **Answer Accuracy = 62%**

## How can recall be 95% while answer accuracy is only 62%? 🤯

Let's take a simple scenario of evaluating **1,000 HR questions**.

### 1. Recall@20 = 95%

| Retrieval Outcome | Number of Queries |
|---|---:|
| Correct chunk appears in the top 20 | 950 |
| Correct chunk is missing from the top 20 | 50 |
| **Total queries** | **1,000** |

Recall@20 is calculated as:

`Recall@20 = (950 / 1,000) × 100 = 95%`

This means that for 950 questions, the correct information exists somewhere in the retrieved top 20 chunks.

But here's the catch! 👀

Those 950 questions are **not guaranteed to be answered correctly**. Retrieving the right chunk doesn't necessarily mean the generator will find it, understand it, and use it correctly.

The 50 questions where the correct chunk is missing will generally be harder to answer reliably using the retrieved context. However, some could still be answered correctly using other available information or the model's existing knowledge.

### 2. Now, let's look at answer accuracy 🎯

Out of those 950 questions where the correct chunk was retrieved, let's say:

- **620 questions:** The generator finds the relevant chunk and produces the correct answer.
- **330 questions:** The generator fails to use the correct chunk and produces an incorrect answer or says the information isn't available.
- **50 questions:** The correct chunk was never retrieved, and the generator fails to answer correctly.

Let's put it all together:

| Retrieval and Generation Outcome | Number of Queries |
|---|---:|
| Correct chunk retrieved + correct answer generated | 620 |
| Correct chunk retrieved + incorrect answer generated | 330 |
| Correct chunk missing + incorrect answer generated | 50 |
| **Total queries** | **1,000** |

Therefore:

`Answer Accuracy = (620 / 1,000) × 100 = 62%`

### 3. But why did those 330 questions fail? 🤯

Remember, the correct chunk was already retrieved! The problem is that GPT-4o didn't reliably use it.

For example, consider this question:

**Question:** How many weeks of parental leave are available to an eligible employee?

Azure AI Search retrieves 20 chunks, each containing approximately 500 tokens.

| Chunk Position | Retrieved Content |
|---|---|
| #1 | Maternity benefits — mentions 12 weeks |
| #2 | Sick leave policy |
| #3 | General employee benefits |
| #4 | Adoption leave policy |
| #5 | Employee eligibility rules |
| #6 | Leave application procedure |
| #7 | Benefits for contract employees |
| #8 | Maternity leave exceptions |
| #9 | General parental benefits |
| **#10** | **Correct parental leave policy — specifies 16 weeks** |
| #11–#20 | Other related HR policies |

The correct chunk is present at position #10, but GPT-4o focuses on the higher-ranked maternity benefits chunk and answers **12 weeks instead of 16 weeks**.

This is where the 330 failures can come from:

- The correct chunk is ranked #8–#14 and receives less attention than higher-ranked chunks.
- A tangential chunk discusses a similar policy but applies to a different employee category.
- The model overlooks a qualification, exception, or effective date.
- The model says the information isn't available, even though the correct chunk is in the context.

### 4. So, what's the actual problem? 💡

**Retrieval succeeded, but generation failed.**

- **Recall@20** tells us whether the correct chunk was retrieved.
- **Answer accuracy** tells us whether the final answer was correct.

These are two different metrics measuring two different stages of the RAG pipeline.

### 5. What should we do next? 🚀

Instead of blindly increasing the number of retrieved chunks, we should:

1. **Rerank the retrieved chunks:** Move the most relevant policy chunk from position #10 to position #1.
2. **Reduce unnecessary context:** Pass only the top 3–5 highly relevant chunks instead of all 20, provided evaluation confirms that important evidence isn't lost.
3. **Improve prompt instructions:** Tell GPT-4o to prioritize directly relevant policy evidence, distinguish employee categories, and respect exceptions and effective dates.
4. **Evaluate answer quality:** Measure accuracy before and after these changes, while tracking recall and token usage.

The goal is to make the model use the right evidence more reliably while reducing token costs.
