# LocalMeter Score

Hardware performance only. Model intelligence/quality is never folded into this score.

## Dimensions (measured only)

| Dimension | Weight | Source |
| --- | --- | --- |
| Speed | 35 | generation tokens/s |
| Memory efficiency | 25 | peak system memory / total RAM |
| Energy efficiency | 20 | tokens/s/W when package power is measured |
| Thermal stability | 10 | peak temperature / pressure when measured |
| Swap penalty | 10 | peak swap used |

If a dimension cannot be measured, its weight is redistributed among measured dimensions. Missing dimensions show `N/A` and do not invent values.

## Letter grades

| Grade | Meaning |
| --- | --- |
| S | Excellent |
| A | Recommended |
| B | Good |
| C | Tight |
| D | CPU / offload |
| F | Not recommended |

Speed reference (generation t/s, Apple Silicon class): S ≥ 60, A ≥ 40, B ≥ 25, C ≥ 12, D ≥ 5, else F.

Memory: peak / total. S ≤ 50%, A ≤ 70%, B ≤ 85%, C ≤ 95%, D ≤ 100% with swap ≈ 0, F if heavy swap.

Energy (t/s/W): S ≥ 3, A ≥ 2, B ≥ 1.2, C ≥ 0.6, D ≥ 0.3, else F.

Swap: S if 0, A < 0.25 GB, B < 1 GB, C < 2 GB, D < 4 GB, else F.

Numeric score is the weighted average of dimension scores mapped S=100 … F=20.

Raw measurements are always shown next to grades.

Quality metadata from CanIRun (use cases, params) is labelled separately and never derived from speed.
