# IF Craft Corpus

A curated knowledge base for interactive fiction writing craft.

Source: <https://pvliesdonk.github.io/if-craft-corpus/> — CC-BY 4.0
Install: `pip install ifcraftcorpus`
MCP: `uvx ifcraftcorpus-mcp`

The IF Craft Corpus contains **59 curated documents** covering practical guidance
for writing interactive fiction. Each document distills craft knowledge into
actionable advice.

## Topic Clusters

| Cluster | Documents | Topics Covered |
|---|---|---|
| narrative-structure | 19 | Branching, pacing, scene structure, endings, heist patterns, time loops |
| craft-foundations | 10 | Quality standards, testing, workflow, collaboration |
| prose-and-language | 8 | Dialogue craft, character voice, exposition, subtext, POV |
| genre-conventions | 7 | Horror, mystery, romance, sci-fi, fantasy, tropes |
| world-and-setting | 5 | Worldbuilding, canon management, setting as character, naming patterns |
| audience-and-access | 3 | Accessibility, localization, audience targeting |
| emotional-design | 2 | Tension, atmosphere, emotional beats, conflict patterns |
| agent-design | 3 | AI writing prompts, agent memory, multi-agent patterns |
| game-design | 1 | Mechanics design patterns, player agency |
| scope-and-planning | 1 | Project scoping, length |

## Document Format

Each corpus document follows a consistent structure:

- **YAML Frontmatter** — title, summary, topics, cluster
- **Structured Markdown** — clear headings, practical examples, cross-references

## Usage

### With Python

```python
from ifcraftcorpus import Corpus

corpus = Corpus()

# Search for specific techniques
for r in corpus.search("dialogue subtext"):
    print(f"{r.source}: {r.content[:100]}...")

# Filter by cluster
for r in corpus.search("atmosphere", cluster="genre-conventions"):
    print(f"{r.title}")
```

### With MCP

```
claude mcp add ifcraft -- uvx ifcraftcorpus-mcp
```

Then ask naturally:
- "Search the IF craft corpus for pacing techniques"
- "Find guidance on writing horror atmosphere"
- "Look up dialogue subtext techniques"

The full corpus is available via the Python package or MCP server. The builder
SHALL install and query it during enrichment rather than vendoring 59 documents
inline.

## License

CC-BY 4.0 — see LICENSE file in this directory.
