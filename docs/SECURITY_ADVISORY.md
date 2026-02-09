# Security Advisory - NPM Audit Vulnerabilities

**Last Updated**: 2026-02-07  
**Status**: Partially Resolved

## Summary

After running `npm audit fix`, the project has **12 vulnerabilities** (4 moderate, 8 high).

- ✅ **Fixed**: 2 vulnerabilities (hono, lodash) - resolved via `npm audit fix`
- ⚠️ **Remaining**: 12 vulnerabilities requiring further attention

## Vulnerability Breakdown

### High Severity (8 vulnerabilities)

#### 1. bigint-buffer Buffer Overflow (GHSA-3gc7-fjrx-p6mg)

**Affected Packages**:
- `bigint-buffer` (direct)
- `@solana/buffer-layout-utils` (depends on bigint-buffer)
- `@solana/spl-token` (depends on @solana/buffer-layout-utils)
- All Circle BridgeKit Solana packages (depend on @solana/spl-token):
  - `@circle-fin/adapter-solana`
  - `@circle-fin/adapter-solana-kit`
  - `@circle-fin/adapter-circle-wallets`
  - `@circle-fin/provider-cctp-v2`
  - `@circle-fin/bridge-kit`

**Status**: ❌ No fix available

**Root Cause**: Vulnerability in `bigint-buffer` package used by Solana dependencies.

**Impact**: 
- Affects Solana-related operations only
- Buffer overflow vulnerability in `toBigIntLE()` function
- Circle BridgeKit packages depend on vulnerable Solana libraries

**Mitigation**:
1. **Wait for upstream fix**: Circle will need to update their dependencies when Solana community fixes bigint-buffer
2. **Production workaround**: If deploying to production:
   - Limit exposure to untrusted Solana transaction data
   - Implement additional input validation for Solana operations
   - Monitor Circle's package updates for security patches
3. **Alternative**: Consider using EVM-only features until Solana vulnerability is resolved

**Action Required**: 
- Monitor Circle BridgeKit releases for updated dependencies
- Track: https://github.com/advisories/GHSA-3gc7-fjrx-p6mg

### Moderate Severity (4 vulnerabilities)

#### 2. esbuild Development Server Vulnerability (GHSA-67mh-4wv8-2f99)

**Affected Packages**:
- `esbuild` (≤0.24.2)
- `vite` (0.11.0 - 6.1.6)
- `vite-node` (≤2.2.0-beta.2)
- `vitest` (various ranges)

**Status**: ⚠️ Fix available with breaking changes

**Root Cause**: esbuild development server accepts requests from any website

**Impact**:
- **Development only** - does not affect production builds
- Websites can send requests to dev server and read responses
- Only exploitable when running `npm run dev`

**Fix Available**: `npm audit fix --force`
- Would install `vite@7.3.1` (breaking change from v5 to v7)
- Requires code updates for compatibility

**Mitigation**:
1. **Development**: Use firewall rules to restrict dev server access
2. **Production**: Not applicable - production builds (`npm run build`) are not affected
3. **Network**: Run dev server on localhost only (default behavior)

**Action Required**:
- **Option A**: Accept development-only risk with network restrictions
- **Option B**: Upgrade to Vite v7 (requires testing and potential code changes)

**Recommendation**: Accept risk for now since:
- Only affects development environment
- Dev server runs on localhost by default
- Production builds are unaffected
- Vite v7 upgrade should be planned separately

## Fixed Vulnerabilities (2)

✅ **hono** - Multiple vulnerabilities (XSS, Cache-Control, Arbitrary Key Read)
- Fixed via `npm audit fix`

✅ **lodash** - Prototype Pollution (GHSA-xxjr-mmjv-4gpg)
- Fixed via `npm audit fix`

## Current Security Posture

### Production Impact: LOW
- The 8 high-severity Solana vulnerabilities are in Circle's dependencies
- The 4 moderate-severity esbuild/vite issues only affect development
- Production builds (`npm run build`) are not affected by esbuild vulnerability
- Main risk is in Solana-specific operations if using untrusted input

### Development Impact: MODERATE
- esbuild vulnerability could allow local network attacks during development
- Mitigation: Ensure dev server only accessible on localhost

## Recommendations

### Immediate Actions
1. ✅ **Completed**: Run `npm audit fix` - Fixed 2 vulnerabilities
2. ✅ **Completed**: Document remaining vulnerabilities
3. 📋 **Recommended**: Add security notes to Circle BridgeKit documentation

### Short-term Actions (1-2 weeks)
1. Monitor Circle BridgeKit package updates
2. Re-run `npm audit` weekly to check for fixes
3. Consider limiting Solana feature usage in production until resolved

### Long-term Actions (1-3 months)
1. Plan Vite v7 upgrade to resolve esbuild vulnerability
2. Evaluate alternatives to Circle BridgeKit if vulnerabilities persist
3. Implement additional security testing for Solana operations

## How to Check for Updates

```bash
# Check current vulnerabilities
npm audit

# Check for package updates
npm outdated

# Check Circle packages specifically
npm outdated | grep @circle-fin
```

## Contact

For questions about these vulnerabilities:
- Circle BridgeKit issues: https://github.com/circlefin
- Solana issues: https://github.com/solana-labs
- Vite issues: https://github.com/vitejs/vite

## References

- [GHSA-3gc7-fjrx-p6mg](https://github.com/advisories/GHSA-3gc7-fjrx-p6mg) - bigint-buffer Buffer Overflow
- [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) - esbuild Development Server
- [Circle BridgeKit Documentation](./CIRCLE_BRIDGEKIT.md)
