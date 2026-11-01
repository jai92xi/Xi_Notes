### What is Cross Validation Leakage and Approach to Avoid

#### 1. Cross-Validation (CV)?
Instead of **splitting the dataset just once** into training and testing sets. 
Cross validation **splits the data multiple times and evaluates the model repeatedly**.

#### 2. K-Fold Cross-Validation (cv = 5)
- Divide the dataset into **K equal parts** (folds).
- **Train** the model on **K-1** folds + **Test** on the **remaining** fold.
- **Repeat K times**, using **each fold once for testing**. Calculate the **average performance**.

#### 3. What is CV Leakage?
Cross Validation leakage happens **when information from the validation fold accidentally influences the training process**. 
As a result, the model may show better performance than it actually has on unseen data.

#### 4. Example
Scaling before splitting into folds: 
Entire dataset is scaled before cross-validation, the scaler calculates the mean and standard deviation using both training and validation data.
Therefore, validation data influences preprocessing, causing leakage.

### 5. Approach to Avoid CV Leakage
- Split data into folds first.
- Perform preprocessing (scaling, imputation, PCA, etc.) only using training folds.
- Apply the same learned transformations to the validation fold.
- Use an ML Pipeline to prevent leakage.

### 6. Sample Code

❌ Without preventing leakage (Incorrect)
```python
# Scale entire dataset before CV
scaler   = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Perform cross-validation
model    = LogisticRegression(max_iter=5000)

scores   = cross_val_score(model, X_scaled, y, cv=5)
print(scores.mean())
```

✅ Preventing leakage (Correct)
```python
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('model', LogisticRegression(max_iter=5000))
])

# Perform cross-validation
scores = cross_val_score(pipeline, X, y, cv=5)

print(scores.mean())
```
