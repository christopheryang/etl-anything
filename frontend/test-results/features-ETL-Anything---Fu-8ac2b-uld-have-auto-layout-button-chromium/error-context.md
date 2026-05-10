# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: features.spec.ts >> ETL Anything - Full Feature Verification (F001-F021) >> F017 - Auto-Layout Button >> should have auto-layout button
- Location: e2e/features.spec.ts:252:9

# Error details

```
Error: locator.count: Error: "has" engine expects non-empty selector list
    at Object.matches (<anonymous>:5300:13)
    at <anonymous>:5246:21
    at SelectorEvaluatorImpl._cached (<anonymous>:5048:20)
    at SelectorEvaluatorImpl._callMatches (<anonymous>:5245:17)
    at SelectorEvaluatorImpl._matchesEngine (<anonymous>:5232:19)
    at <anonymous>:5130:19
    at SelectorEvaluatorImpl._cached (<anonymous>:5048:20)
    at SelectorEvaluatorImpl._matchesSimple (<anonymous>:5124:17)
    at <anonymous>:5191:20
    at SelectorEvaluatorImpl._cached (<anonymous>:5048:20)
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - heading "ETL Anything" [level=1] [ref=e5]
        - textbox [ref=e6]: Untitled Workflow
      - generic [ref=e7]:
        - generic [ref=e8]:
          - button "Zoom out" [ref=e9]:
            - img [ref=e10]
          - generic "Click to edit zoom level" [ref=e13]: 100%
          - button "Zoom in" [ref=e14]:
            - img [ref=e15]
          - button "Fit all nodes in view" [ref=e18]:
            - img [ref=e19]
        - button "Run Workflow" [ref=e24]:
          - img [ref=e25]
          - text: Run Workflow
        - button "Save" [ref=e27]:
          - img [ref=e28]
          - text: Save
        - button [ref=e32]:
          - img [ref=e33]
    - generic [ref=e34]:
      - generic [ref=e35]:
        - generic [ref=e37]:
          - generic:
            - img
        - img [ref=e38]
        - img "React Flow mini map" [ref=e41]
        - link "React Flow attribution" [ref=e43] [cursor=pointer]:
          - /url: https://reactflow.dev
          - text: React Flow
      - generic:
        - heading "Node Library" [level=3]
        - generic:
          - generic [ref=e45]:
            - img [ref=e46]
            - generic [ref=e49]:
              - generic [ref=e50]: Input Node
              - generic [ref=e51]: Data sources & uploads
          - generic [ref=e52]:
            - img [ref=e53]
            - generic [ref=e63]:
              - generic [ref=e64]: Reasoning Node
              - generic [ref=e65]: LLM processing
          - generic [ref=e66]:
            - img [ref=e67]
            - generic [ref=e70]:
              - generic [ref=e71]: Output Node
              - generic [ref=e72]: Export & save data
          - generic [ref=e73]:
            - img [ref=e74]
            - generic [ref=e78]:
              - generic [ref=e79]: Rule Node
              - generic [ref=e80]: Business logic
  - alert [ref=e81]
```