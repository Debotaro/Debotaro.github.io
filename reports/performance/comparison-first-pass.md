# Measured mobile lab comparison

Lighthouse 12.8.2. Medians of three cold navigations per page, on the same machine and settings. These are local laboratory results, not field Core Web Vitals or measured INP.

| Page | Performance /100 | LCP, seconds | TBT, ms | CLS | Transfer, KiB | Transfer change |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| portfolio | 88 → 94 | 3.76 → 3.00 | 0 → 0 | 0.0027 → 0.0011 | 2,585 → 413 | −84.0% |
| nova | 79 → 79 | 5.40 → 5.40 | 0 → 0 | 0.0000 → 0.0000 | 759 → 759 | +0.0% |
| atlas | 66 → 84 | 5.41 → 3.46 | 0 → 0 | 0.0017 → 0.0017 | 880 → 515 | −41.5% |
| relay | 84 → 84 | 3.46 → 3.45 | 0 → 0 | 0.0655 → 0.0655 | 463 → 464 | +0.1% |
| nila | 67 → 67 | 5.25 → 5.25 | 0 → 0 | 0.0003 → 0.0003 | 847 → 847 | +0.0% |
| aura | 92 → 84 | 3.28 → 4.28 | 53 → 12 | 0.0018 → 0.0013 | 617 → 632 | +2.5% |
| vanta | 96 → 94 | 2.62 → 2.83 | 0 → 0 | 0.0115 → 0.0115 | 573 → 588 | +2.7% |
| rasa | 81 → 95 | 4.73 → 2.77 | 149 → 0 | 0.0016 → 0.0013 | 1,882 → 602 | −68.0% |

Before → after. Transfer counts resources requested during the lab navigation, including browser-selected lazy-image prefetches. It is not the entire page or repository size. See README.md for changes, environment, ranges, reproducibility and limits.
