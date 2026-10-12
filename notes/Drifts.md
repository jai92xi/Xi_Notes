## <mark> 5 Important Types of Drift in ML </mark>

> ### <mark>1. Data Drift (Feature Drift)</mark>
> The input data changes.
> 
> **Example:** Earlier, most customers were aged 25–35. Now, most customers are aged 50–60.
> 
> **What changed?** Customer age distribution.

> ### <mark>2. Concept Drift</mark>
> The relationship between inputs and the outcome changes.
>
> **Example:** Earlier, customers who visited a store five times usually purchased a phone. Now, they visit five times just to compare prices and rarely buy.
>
> **What changed?** Customer behavior.

> ### <mark>3. Label Drift (Prior Probability Shift)</mark>
> The overall proportion of outcomes changes.
>
> **Example:** Earlier, 30% of customers purchased a phone. Now, only 10% purchase because of an economic slowdown.
>
> **What changed?** The purchase rate.

> ### <mark>4. Prediction Drift (Score Drift)</mark>
> The model's predictions change over time.
>
> **Example:** Earlier, the model predicted purchase probabilities mostly around 60%. Now, most predictions are around 90%.
>
> **What changed?** The distribution of model scores. This is a warning sign, not proof of a particular underlying drift.

> ### <mark>5. Model Performance Drift</mark>
> The model's predictive performance deteriorates over time.
>
> **Example:** Earlier, the model's accuracy was 90%. Now, it is 70% when evaluated against actual outcomes.
>
> **What changed?** Model performance.


### Easy Way to Remember

| Type | Ask Yourself |
|---|---|
| Data drift | Did the input data change? |
| Concept drift | Did the relationship between input and outcome change? |
| Label drift | Did the proportion of positive/negative outcomes change? |
| Prediction drift | Did the model's predicted scores change? |
| Performance drift | Did the model become less effective? |

## Interview Tip

Data drift can happen without concept drift, and prediction drift does not necessarily mean model performance has degraded. To confirm performance or concept drift, you generally need actual outcome labels.



Test: https://jai92xi.github.io/AIBrainBox/?id=Xi-00040
