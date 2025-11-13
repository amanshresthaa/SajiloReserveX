# Enable Assignment Pipeline V3

**Task ID**: `enable-assignment-pipeline-v3-20251113-0931`  
**Created**: 2025-11-13 09:31 UTC  
**Owner**: @amankumarshrestha  
**Status**: 📋 READY TO EXECUTE

---

## 📖 What's in This Task Folder?

This task contains everything you need to enable the **Assignment Pipeline V3** (state machine-based table assignment) following the AGENTS.md SDLC workflow.

### Core Documents (Read in Order)

1. **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** ⭐ **START HERE**
   - Quick decision matrix
   - Recommended rollout paths
   - Timeline estimates
   - Key metrics at a glance

2. **[research.md](./research.md)** — Phase 1: Requirements & Analysis (DoR)
   - Existing V3 implementation analysis
   - Feature flag architecture
   - Constraints, risks, and mitigation strategies
   - Recommended rollout direction with rationale

3. **[plan.md](./plan.md)** — Phase 2: Design & Planning
   - Detailed rollout strategy (shadow → full → production)
   - Success criteria and exit gates per phase
   - Monitoring dashboards and alerts
   - Rollback procedures and kill switch

4. **[todo.md](./todo.md)** — Phase 3: Implementation Checklist
   - Step-by-step instructions for each rollout phase
   - Configuration checklists
   - Testing procedures
   - Edge case validation

5. **[verification.md](./verification.md)** — Phase 4: Verification & Validation (DoD)
   - QA checklists per phase
   - Sign-off templates
   - Performance budget tracking
   - Known issues log

### Quick-Start Guides (artifacts/)

- **[QUICK_START_LOCAL.md](./artifacts/QUICK_START_LOCAL.md)** 🚀
  - 3-step local testing guide (30 minutes)
  - Troubleshooting tips
  - Verification checklist

- **[environment-config-guide.md](./artifacts/environment-config-guide.md)**
  - Copy-paste env configs for each environment
  - Phase-by-phase deployment instructions
  - Rollback procedures
  - Observability dashboard setup

- **[observability-queries.sql](./artifacts/observability-queries.sql)** 📊
  - 15+ SQL queries for monitoring
  - Alert query templates
  - Health check one-liner
  - Dashboard panel recommendations

---

## 🎯 Quick Start (Choose Your Path)

### Path 1: Just Want to Enable V3 Locally?

👉 Read: **[artifacts/QUICK_START_LOCAL.md](./artifacts/QUICK_START_LOCAL.md)**  
⏱️ Time: 30 minutes  
🎯 Goal: Test V3 on your local machine

---

### Path 2: Ready to Roll Out to Staging/Production?

👉 Read: **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** first  
Then follow: **[plan.md](./plan.md)** → **[todo.md](./todo.md)** → **[verification.md](./verification.md)**  
⏱️ Time: 10-14 days (full production rollout)  
🎯 Goal: Production at 100% with legacy cleanup

---

### Path 3: Need Monitoring/Observability Setup?

👉 Use: **[artifacts/observability-queries.sql](./artifacts/observability-queries.sql)**  
⏱️ Time: 1-2 hours (dashboard setup)  
🎯 Goal: Real-time monitoring during rollout

---

## 📋 Task Status Checklist

### Phase 0: Planning & Documentation ✅

- [x] Research completed (DoR met)
- [x] Plan created with rollout strategy
- [x] Todo checklist detailed per phase
- [x] Verification criteria defined (DoD)
- [x] Environment configs documented
- [x] Observability queries prepared
- [x] Quick-start guides created

### Phase 1-6: Execution (To Be Completed)

- [ ] Local testing (optional)
- [ ] Staging shadow mode (24h)
- [ ] Staging full enablement (48h)
- [ ] Production shadow mode (24-48h)
- [ ] Production gradual rollout (10% → 50% → 100%)
- [ ] 7 days stable monitoring
- [ ] Legacy cleanup task created

**Current Phase**: 📋 **READY TO EXECUTE**

---

## 🔑 Key Information

### Feature Flags (3 Total)

| Flag                                          | Purpose          | Values                                |
| --------------------------------------------- | ---------------- | ------------------------------------- |
| `FEATURE_ASSIGNMENT_PIPELINE_V3`              | Main kill switch | `true` = enabled, `false` = disabled  |
| `FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW`       | Shadow mode      | `true` = shadow, `false` = production |
| `FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL` | Rate limit       | `3` (recommended start)               |

### Rollout Phases Summary

1. **Staging Shadow** (24h) — `ENABLED=false, SHADOW=true`
2. **Staging Full** (48h) — `ENABLED=true, SHADOW=false`
3. **Prod Shadow** (24-48h) — `ENABLED=false, SHADOW=true`
4. **Prod 10%** (24h) — `ENABLED=true, SHADOW=false`
5. **Prod 50%** (24h) — `ENABLED=true, SHADOW=false`
6. **Prod 100%** (7 days) — `ENABLED=true, SHADOW=false`

### Success Criteria (All Phases)

- ✅ Booking confirmation rate ≥ 95%
- ✅ Manual review queue < 10%
- ✅ 0 P0/P1 incidents
- ✅ Observability events flowing
- ✅ No circuit breaker opens (or quick recovery)

### Emergency Rollback

```bash
# Set in environment
FEATURE_ASSIGNMENT_PIPELINE_V3=false

# Restart app
# Legacy flow takes over instantly (<5 min recovery)
```

---

## 📊 Key Metrics to Monitor

| Metric             | Query                     | Target                 |
| ------------------ | ------------------------- | ---------------------- |
| Confirmation Rate  | See queries.sql #4        | ≥95%                   |
| Manual Review Rate | See queries.sql #5        | <10%                   |
| State Transitions  | See queries.sql #2        | Matches booking volume |
| Error Rate         | See queries.sql #6        | <1%                    |
| Stuck Bookings     | See queries.sql (Alert 4) | 0                      |

**One-query health check**: See `observability-queries.sql` → "Quick Health Check"

---

## 🏗️ Architecture Overview

### Current State (Legacy)

```
Booking → quoteTablesForBooking() → Loop (retry) → Confirm
```

### New State (V3)

```
Booking → AssignmentCoordinator.processBooking()
  ├─ Acquire lock
  ├─ State transitions (created → ... → confirmed)
  ├─ SmartAssignmentEngine (strategies)
  ├─ Circuit breaker + rate limiter
  └─ Observability events
```

**Key Benefits**:

- 🔒 Distributed locks (no race conditions)
- 📊 State machine (auditable transitions)
- 🚦 Rate limiting (prevent thundering herd)
- 🔌 Circuit breakers (graceful degradation)
- 📈 Rich observability (assignment.state_machine events)

---

## 🔗 Related Documentation

- **AGENTS.md** — Project SDLC workflow
- **Assignment Architecture Plan** — `/tasks/booking-architecture-20251112-2349/plan.md`
- **Coordinator Implementation** — `/server/assignments/assignment-coordinator.ts`
- **Feature Flags Module** — `/server/feature-flags.ts`
- **State Machine (Client)** — `/src/contexts/booking-state-machine.tsx`
- **State Machine (Server)** — `/server/assignments/state-machine.ts`

---

## 👥 Stakeholders

| Role             | Person/Team        | Responsibility        |
| ---------------- | ------------------ | --------------------- |
| Owner            | @amankumarshrestha | Overall execution     |
| Reviewers        | @maintainers       | Code/config review    |
| QA Lead          | TBD                | Phase sign-offs       |
| Engineering Lead | TBD                | Staging approval      |
| Product Owner    | TBD                | Production approval   |
| On-Call Engineer | TBD                | Production monitoring |

---

## 📅 Timeline (Estimated)

| Milestone               | Target Date | Status     |
| ----------------------- | ----------- | ---------- |
| Task planning complete  | 2025-11-13  | ✅ Done    |
| Staging shadow start    | TBD         | ⏳ Pending |
| Staging full complete   | TBD         | ⏳ Pending |
| Production shadow start | TBD         | ⏳ Pending |
| Production 100%         | TBD         | ⏳ Pending |
| Legacy cleanup          | TBD         | ⏳ Pending |

**Estimated duration**: 10-14 days to prod 100% (if starting from staging shadow)

---

## ❓ FAQ

### Q: Do I need to write any code?

**A**: No! V3 infrastructure is already built. This is a **configuration-only rollout**.

### Q: What if something goes wrong?

**A**: Set `FEATURE_ASSIGNMENT_PIPELINE_V3=false` and restart. Recovery time <5 minutes.

### Q: Can I test locally first?

**A**: Yes! See [artifacts/QUICK_START_LOCAL.md](./artifacts/QUICK_START_LOCAL.md)

### Q: How long does the full rollout take?

**A**: ~10-14 days to reach production 100% (including observation periods)

### Q: What happens to the legacy code?

**A**: It stays intact during rollout (for safety). After 7 days stable at 100%, we create a separate cleanup task.

### Q: Who approves each phase?

**A**: See `verification.md` sign-off sections. Typically: QA Lead (staging), Product Owner (production).

---

## 🚀 Ready to Start?

1. **Read**: [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)
2. **Choose**: Your rollout path (local test, staging, or production)
3. **Follow**: The corresponding guide (quick-start or full plan)
4. **Monitor**: Use observability queries from `artifacts/`
5. **Verify**: Complete verification checklists
6. **Sign-off**: Get approvals per phase

**Questions?** Review the plan.md or ask in #engineering

---

**Last Updated**: 2025-11-13 09:31 UTC  
**AGENTS.md Version**: 5.2  
**Task Version**: 1.0
