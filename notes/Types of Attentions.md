# Types of Attention in Transformers

> 1. **Self-Attention** 🔄 — Tokens attend to other tokens in the same sequence.  
>    `"The animal didn't cross because **it** was tired"` → it can attend to animal
>
> 2. **Multi-Head Attention (MHA)** 🧠 — Multiple attention heads learn different relationships in parallel.  
>    `"The animal didn't cross because **it** was tired"` →  
>    Head 1 → **it** attends strongly to **animal** (coreference)  
>    Head 2 → **it** attends to **was tired** (grammatical relationship)  
>    Head 3 → **animal** attends to **cross** (semantic relationship)
>
> 3. **Causal / Masked Self-Attention** 🎯 — Tokens attend only to previous tokens; used in GPT/Llama.  
>    `"I love"` → next token prediction cannot see `"pizza"` if `"pizza"` comes later
>
> 4. **Cross-Attention** 🔀 — One sequence attends to another; used in encoder-decoder models.  
>    Decoder token `"chat"` attends to encoder tokens `"Bonjour tout le monde"`

---

> 5. **Multi-Query Attention (MQA)** 💾 — Multiple query heads share one K/V head; reduces KV-cache memory.  
>    32 Q heads → 1 shared K head + 1 shared V head
>
> 6. **Grouped-Query Attention (GQA)** 🧩 — Multiple query heads share groups of K/V heads; compromise between MHA and MQA.  
>    32 Q heads → 8 KV heads, with 4 Q heads per KV head

---

> 7. **Sparse Attention** 🕸️ — Each token attends only to selected tokens instead of all tokens; reduces computation for long sequences.  
>    Token 1000 attends to tokens {995, 996, 997, 1000} rather than all 1000
>
> 8. **Local/Window Attention** 🪟 — Each token attends only to nearby tokens.  
>    Token 50 attends to tokens 45–55
>
> 9. **Global Attention** 🌐 — Selected tokens can attend across the entire sequence.  
>    [CLS]/special token can attend to every token
