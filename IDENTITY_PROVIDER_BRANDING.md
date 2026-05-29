# Identity Provider Branding

This policy file documents how social authentication controls are governed by GDS consumers. It is the companion document to `THEME_GOVERNANCE.md` and `COMPLIANCE_TOOLKIT.md` for identity surfaces.

## Required rules

- Consumers use `SocialAuthButtons` for social authentication UIs unless a canonical GDS primitive is added later.
- Provider IDs in code must be drawn from `compliance.identityProviderBranding.approvedProviders`.
- Provider control props and markup not listed as permitted by policy should be avoided unless the policy is updated and approved.
- Minimum tap target size is enforced through `compliance.identityProviderBranding.minTouchTargetPx`.
- Brand color authority is governed by `compliance.identityProviderBranding.colorAuthority` (default: `provider`).

## Canonical manifest fragment

```json
{
  "compliance": {
    "identityProviderBranding": {
      "approvedProviders": ["google", "apple", "github", "microsoft", "discord", "x", "email"],
      "forbiddenCustomizations": ["leftSection", "rightSection", "variant", "size"],
      "allowedVariants": ["solid", "outline", "neutral"],
      "colorAuthority": "provider",
      "minTouchTargetPx": 44,
      "policyDocument": "IDENTITY_PROVIDER_BRANDING.md"
    }
  }
}
```

## Operational behavior

- If unknown providers are found in `SocialAuthButtons`, `gds-compliance` returns an `identity.provider.unapproved-id` error.
- If forbidden customization props are used, `gds-compliance` returns an `identity.provider.forbidden-customization` error.
- If social login controls appear to be hand-built with Mantine `Button` and provider strings, `gds-compliance` emits a warning to move to policy-conformant primitives.

This document should be linked from adopters whose authentication surfaces are externally visible.
