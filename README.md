Given a flat package dependency tree manifest like:

```json
[
  {
    "name": "b",
    "version": "1.0.0",
    "range": "^1.0.0",
    "links": [
      {
        "name": "c",
        "version": "1.0.0",
        "range": "^1.0.0"
      }
    ]
  },
  {
    "name": "c",
    "version": "1.0.0",
    "links": []
  }
]
```

an updated package name like `'c'`,
an updated package version like `'1.0.1'`,
and a dependency tree manifest for the updated package like:

```json
{
  "name": "c",
  "version": "1.0.1",
  "links": []
}
```

update the original manifest to use the updated package where possible:

```json
[
  {
    "name": "b",
    "version": "1.0.0",
    "range": "^1.0.0",
    "links": [
      {
        "name": "c",
        "version": "1.0.1",
        "range": "^1.0.0"
      }
    ]
  },
  {
    "name": "c",
    "version": "1.0.1",
    "links": []
  }
]
```
