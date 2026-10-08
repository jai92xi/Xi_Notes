### <mark>Bagging vs Boosting</mark>

#### <mark>Ensemble Learning</mark>
Combining multiple ML models to get **better and more accurate predictions**.

#### <mark>1. Bagging (Bootstrap Aggregation)</mark>
- Trains multiple models **independently and in parallel**.
- Each model gets a **different sample of the data**.
- Combines their predictions using:
  - **Voting** → Classification
  - **Averaging** → Regression
- **Main goal:** Reduce **variance** and **overfitting**.
- **Example:** Random Forest 🌳

---

#### <mark>2. Boosting</mark>
- Trains models **one after another (sequentially)**.
- Each new model focuses more on the **mistakes/errors** of the previous model.
- Combines all models to make a **strong final model**.
- **Main goal:** Reduce **bias** and improve accuracy.
- **Examples:** AdaBoost, Gradient Boosting, XGBoost, LightGBM.
