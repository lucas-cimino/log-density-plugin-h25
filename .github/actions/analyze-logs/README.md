# Analyze Java Logs in PR

This GitHub Action extracts log statements from Java files in a pull request and analyzes them using Ollama.

## Usage

```yaml
jobs:
  analyze-logs:
    runs-on: ubuntu-latest
    steps:
      - name: Analyze Java Logs
        uses: lucas-cimino/analyze-logs-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          model: "llama3.2:3b"
