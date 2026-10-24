### <mark>Speculative Decoding</mark>

> Checking multiple tokens in parallel takes almost the same GPU time as generating just one token.

**Llama 3.1 80B** generates text **one token at a time**. For every new token, it must repeatedly access its large set of **model weights** from GPU memory and perform computations. This makes generation <mark>**memory-bandwidth-bound**</mark>, meaning the GPU spends much of its time moving data rather than computing. As a result, generating text token by token can be slow.

**What if we use the Llama 3.1 80B model to review tokens instead of generating every token itself?** We can use a smaller, faster model, such as **Llama 3.1 8B**, to generate several token guesses, while the larger 80B model <mark>**verifies them together**</mark> and corrects any incorrect guesses.

This is the idea behind <mark>**speculative decoding**</mark>. The smaller model makes quick predictions, and the larger model checks multiple tokens in parallel. If the guesses are correct, <mark>**multiple tokens can be accepted in a single step**</mark>, dramatically speeding up generation while preserving the output quality of the larger model.

https://jai92xi.github.io/AIBrainBox/?id=XI-00044
