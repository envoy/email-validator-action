# Email Validator Action

This action validates the email address of the git committer against a list of allowed
domains.

## Inputs

### `allowed-domains`

**Required** The list of allowed email domains, comma-separated.

## Outputs

### `emails`

The emails found in the commits

## Example usage

```yaml
uses: envoy/email-validator-action@v1
with:
  allowed-domains: "envoy.com,signwithenvoy.com,envoy.co"
```
