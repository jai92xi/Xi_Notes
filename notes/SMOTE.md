### <mark>**SMOTE — Synthetic Minority Over-sampling Technique**</mark>
> SMOTE = Synthetic Minority Over-sampling Technique
> SMOTE is an **oversampling technique** used to **handle class imbalance** 
> by **creating new synthetic minority-class samples** instead of **simply duplicating existing ones**.

> SMOTE modifies the **training data before the model learns**. It creates new
> **synthetic minority-class samples** instead of creating exact duplicate records.

**Example:** Suppose we have two minority-class samples:
- A = `(2, 3)`
- B = `(4, 5)`
SMOTE can create a new synthetic sample between A and B: `(3, 4)`

#### <mark>**How SMOTE works**</mark>
For a minority-class sample:
1. Find its **K nearest neighbors** from the minority class.
2. **Randomly select one of the neighbors**.
3. Create a new synthetic sample **between the original sample and the selected neighbor**.
4. Repeat until the desired number of minority samples is created.

**In short:**
Minority sample → Find K nearest minority neighbors → Select one neighbor → Generate a synthetic sample between them
