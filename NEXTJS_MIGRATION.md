# Next.js 16 Migration Strategy

## Current State

The repository currently uses:
- **Build Tool**: Vite 5.0
- **Framework**: React 18.2 (SPA)
- **Runtime**: Node.js 20.19.6
- **Routing**: Client-side only (single page)

## Target State (Per Specification)

The Conversational Web3 Wallet Hub specification targets:
- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js 24 LTS
- **Routing**: Server and client components
- **API Routes**: Next.js API routes for backend

## Migration Approach

### Option 1: Phased Migration (Recommended)

Keep the current Vite setup functional while gradually building Next.js features alongside.

#### Phase 1: Parallel Development (Current)
- ✅ Keep existing Vite-based gaming wallet features
- ✅ Add conversational workflow scaffolds (can work with both)
- ✅ Create documentation for both architectures
- ⏳ Develop conversational features in a separate Next.js branch

#### Phase 2: Next.js Setup
1. Create Next.js 16 app in a subdirectory or branch:
   ```bash
   npx create-next-app@latest potentia-next --typescript --tailwind --app
   ```

2. Port shared code:
   - Move `lib/` directory (workflows, AI integration)
   - Keep `src/` for Vite components
   - Create `app/` directory for Next.js routes

3. Configure for coexistence:
   - Update package.json with separate scripts
   - Configure different ports (3000 for Next.js, 5173 for Vite)

#### Phase 3: Feature Parity
- Implement conversational UI in Next.js
- Create API routes for intent processing
- Set up PostgreSQL and Redis connections
- Integrate OpenAI API on server side

#### Phase 4: Gradual Cutover
- Run both apps in parallel
- Migrate users gradually
- Test extensively before full switch
- Maintain backward compatibility

### Option 2: Full Migration (Higher Risk)

Complete rewrite from Vite to Next.js.

**Pros:**
- Clean slate, no technical debt
- Full Next.js optimization
- Simpler deployment

**Cons:**
- Requires rewriting all components
- Higher risk of breaking existing features
- Longer development time
- Need to test everything again

### Option 3: Hybrid Approach (Most Flexible)

Use Next.js for new conversational features while keeping Vite for existing features.

**Architecture:**
```
potentia-ludi/
├── gaming-wallet/          # Vite app (existing)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── conversational-hub/     # Next.js app (new)
│   ├── app/
│   ├── package.json
│   └── next.config.js
└── shared/                 # Shared code
    ├── lib/
    └── types/
```

**Deployment:**
- Vite app: CDN (Vercel, Netlify)
- Next.js app: Vercel (with API routes)
- Cross-origin communication via API
- Shared authentication layer

## Recommended Path Forward

### Immediate (Current Sprint)
✅ **Complete scaffolding with current setup** (Done)
- Documentation (ARCHITECTURE.md, README.md, SETUP.md)
- Workflow placeholders (lib/workflows/)
- Database schemas (lib/db/)
- OpenAI integration scaffold (lib/ai/)

### Next Sprint
**Set up Next.js 16 in parallel:**

1. Create Next.js app:
   ```bash
   mkdir conversational-hub
   cd conversational-hub
   npx create-next-app@16 . --typescript --tailwind --app --src-dir --import-alias "@/*"
   ```

2. Move shared code to monorepo structure:
   ```bash
   mkdir -p packages/shared
   mv lib packages/shared/
   ```

3. Update package.json for workspace:
   ```json
   {
     "workspaces": [
       "gaming-wallet",
       "conversational-hub",
       "packages/*"
     ]
   }
   ```

4. Configure build tools:
   - Keep Vite config for gaming wallet
   - Add Next.js config for conversational hub
   - Set up shared TypeScript config

### Future Sprints
1. **Implement API Routes** (conversational-hub/app/api/)
   - `/api/intent` - Process natural language
   - `/api/execute` - Execute workflows
   - `/api/auth` - SIWE authentication

2. **Build Conversational UI**
   - Text input component
   - Streaming response display
   - Transaction confirmation dialogs
   - Voice input (stretch goal)

3. **Integration Testing**
   - Test both apps independently
   - Test shared library usage
   - Test authentication flow
   - Performance testing

4. **Deployment Strategy**
   - Deploy gaming wallet to existing URL
   - Deploy conversational hub to subdomain (chat.potentia-ludi.com)
   - Set up reverse proxy or routing
   - Configure CORS if needed

## Node.js Version Strategy

### Current: Node.js 20.19.6
- ✅ Stable and widely supported
- ✅ All dependencies compatible
- ✅ Good for current development

### Target: Node.js 24 LTS
- ⏳ Not yet released (expected April 2025)
- 🎯 Target for production deployment
- 📋 Plan upgrade when stable

### Recommendation
- Continue with Node.js 20.x for development
- Update CI/CD to Node.js 20.x
- Monitor Node.js 24 release schedule
- Plan upgrade window post-release
- Test thoroughly with Node.js 24 RC before switching

## Migration Checklist

### Pre-Migration
- [x] Document current architecture
- [x] Create workflow scaffolds that work with both
- [x] Set up database schemas
- [x] Plan migration strategy
- [ ] Create migration branch
- [ ] Set up testing environment

### During Migration
- [ ] Set up Next.js 16 project
- [ ] Move shared code to packages
- [ ] Implement API routes
- [ ] Port or create UI components
- [ ] Set up environment configuration
- [ ] Configure database connections
- [ ] Integrate external APIs

### Post-Migration
- [ ] Run full test suite
- [ ] Performance benchmarks
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation updates
- [ ] Team training
- [ ] Staged rollout plan

## Technical Considerations

### Server-Side Rendering (SSR)
Next.js enables SSR which provides:
- Better SEO (though less relevant for wallet apps)
- Faster initial page load
- Server-side data fetching
- API routes on same domain (no CORS)

### API Routes vs. Separate Backend
**Pros of Next.js API Routes:**
- Same codebase and deployment
- Shared TypeScript types
- Simplified development
- No CORS issues

**Cons:**
- Less separation of concerns
- Harder to scale backend independently
- Mixed frontend/backend logs

### Database Connections
Next.js API routes handle database connections:
```typescript
// app/api/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
```

### Environment Variables
Next.js has specific conventions:
- `NEXT_PUBLIC_*` for client-side
- No prefix for server-side only
- Automatic loading from `.env.local`

## Migration Timeline Estimate

### Conservative (Recommended)
- **Week 1-2**: Next.js setup and shared code restructuring
- **Week 3-4**: API routes implementation
- **Week 5-6**: UI development and integration
- **Week 7-8**: Testing and refinement
- **Week 9-10**: Deployment and monitoring

### Aggressive (Higher Risk)
- **Week 1**: Next.js setup
- **Week 2-3**: Feature implementation
- **Week 4**: Testing
- **Week 5**: Deployment

## Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading)
- [Vite to Next.js Migration](https://nextjs.org/docs/app/building-your-application/migrating)
- [Node.js Release Schedule](https://nodejs.org/en/about/previous-releases)

## Conclusion

**Recommended approach:** Hybrid architecture with phased migration
- Keep existing Vite app for gaming features
- Build new conversational features in Next.js
- Share common code via packages
- Migrate gradually based on user adoption

This approach minimizes risk while enabling rapid development of new features with the optimal tech stack.
