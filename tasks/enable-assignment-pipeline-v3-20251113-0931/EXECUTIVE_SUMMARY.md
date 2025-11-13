# 🎯 Assignment Pipeline V3 Enablement — EXECUTIVE SUMMARY

**Task**: `enable-assignment-pipeline-v3-20251113-0931`
**Owner**: @amankumarshrestha
**Status**: READY TO EXECUTE
**Risk**: Medium (Infrastructure already built; rollout is configuration-only)

---

## 🚀 What Is This?

Enable the **AssignmentCoordinator** (V3) to replace the legacy planner loop for table assignments. V3 uses:

- State machine with optimistic locking
- Distributed locks (no race conditions)
- Rate limiting (prevent thundering herd)
- Circuit breakers (graceful degradation)
- Comprehensive observability

**No code changes required** — V3 infrastructure is already implemented. This is a **configuration-only rollout**.

---

## 📋 Quick Decision Matrix

| Want to...                     | Use this config               |
| ------------------------------ | ----------------------------- |
| **Test locally**               | `ENABLED=true, SHADOW=false`  |
| **Validate in staging (safe)** | `ENABLED=false, SHADOW=true`  |
| **Go live in staging**         | `ENABLED=true, SHADOW=false`  |
| **Observe production traffic** | `ENABLED=false, SHADOW=true`  |
| **Enable in production**       | `ENABLED=true, SHADOW=false`  |
| **Rollback immediately**       | `ENABLED=false, SHADOW=false` |

---

## 🎬 Recommended Next Steps (Choose Your Path)

### Option 1: Start with Local Testing (Fastest)

**Time**: 30 minutes  
**Risk**: Zero (local only)

1. Open `.env.local`, add:
   ```bash
   FEATURE_ASSIGNMENT_PIPELINE_V3=true
   FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=false
   FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
   ```
2. Restart dev server: `pnpm run dev`
3. Create test booking
4. Check logs for `[assignment.coordinator]` and `[assignment.state_machine]`

**Guide**: `tasks/enable-assignment-pipeline-v3-20251113-0931/artifacts/QUICK_START_LOCAL.md`

---

### Option 2: Skip to Staging Shadow (Recommended)

**Time**: 24-48 hours observation  
**Risk**: Zero (shadow mode doesn't affect bookings)

1. Set staging env vars:
   ```bash
   FEATURE_ASSIGNMENT_PIPELINE_V3=false
   FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=true
   ```
2. Deploy to staging
3. Monitor `observability_events` for 24 hours
4. Compare shadow vs. legacy success rates

**Guide**: `tasks/enable-assignment-pipeline-v3-20251113-0931/artifacts/environment-config-guide.md` → Phase 2

---

### Option 3: Full Production Rollout (After Staging Validated)

**Time**: 5-7 days (gradual)  
**Risk**: Medium (production impact)

Follow the **5-phase rollout**:

1. ✅ Staging Shadow (24h)
2. ✅ Staging Full (48h)
3. ✅ Production Shadow (24-48h)
4. 🎯 Production Gradual (10% → 50% → 100% over 3-5 days)
5. 🧹 Legacy Cleanup (after 7 days stable)

**Guide**: `tasks/enable-assignment-pipeline-v3-20251113-0931/plan.md`

---

## 📊 How to Monitor

### Key Metrics Dashboard

**Query 1: State Transition Volume** (should match booking volume)

```sql
SELECT COUNT(*) as transitions, COUNT(DISTINCT booking_id) as bookings
FROM observability_events
WHERE source = 'assignment.state_machine'
  AND created_at > NOW() - INTERVAL '1 hour';
```

**Query 2: Booking Confirmation Rate** (target: ≥95%)

```sql
SELECT
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'confirmed') / COUNT(*), 2) as confirmation_rate
FROM bookings
WHERE created_at > NOW() - INTERVAL '24 hours';
```

**Query 3: Manual Review Queue** (target: <10%)

```sql
SELECT COUNT(*) as manual_review_count
FROM bookings
WHERE assignment_state = 'manual_review'
  AND created_at > NOW() - INTERVAL '24 hours';
```

**All queries**: `tasks/enable-assignment-pipeline-v3-20251113-0931/artifacts/environment-config-guide.md`

---

## ⚠️ Rollback Plan

**Emergency rollback** (immediate):

```bash
# Set in environment (Vercel/AWS/etc.)
FEATURE_ASSIGNMENT_PIPELINE_V3=false

# Redeploy/restart
# Legacy flow takes over instantly
```

**Recovery time**: <5 minutes (flag change + app restart)

---

## 📁 Task Documentation

All deliverables are in: `/tasks/enable-assignment-pipeline-v3-20251113-0931/`

| File                                    | Purpose                                                |
| --------------------------------------- | ------------------------------------------------------ |
| `research.md`                           | Requirements, constraints, architecture analysis (DoR) |
| `plan.md`                               | Rollout strategy, phases, success criteria, monitoring |
| `todo.md`                               | Step-by-step checklist for each phase                  |
| `verification.md`                       | QA checklists, sign-off templates, metrics validation  |
| `artifacts/environment-config-guide.md` | Copy-paste env configs per phase                       |
| `artifacts/QUICK_START_LOCAL.md`        | 3-step local enablement guide                          |

---

## ✅ Definition of Done (Full Rollout)

- [ ] V3 runs in production at 100% for 7 consecutive days
- [ ] Booking confirmation rate ≥95%
- [ ] Manual review queue <10% of bookings
- [ ] 0 P0/P1 incidents
- [ ] Observability events flowing correctly
- [ ] Team retrospective complete
- [ ] Legacy cleanup task created

---

## 🎯 Current Status

**Infrastructure**: ✅ Complete (AssignmentCoordinator fully implemented)  
**Feature Flags**: ✅ Wired (env schema, feature-flags.ts, integration in auto-assign.ts)  
**Observability**: ✅ Instrumented (state machine emits events)  
**Documentation**: ✅ Done (this task folder)

**Next Action**: Choose a rollout path (local test, staging shadow, or production) and follow the corresponding guide.

---

## 🤝 Who to Contact

**Questions**: Engineering Lead, QA Lead  
**Approvals**: Engineering Lead (staging), Product Owner (production)  
**Emergency**: On-Call Engineer (during production rollout)

---

## 📅 Timeline Estimate

| Phase                        | Duration      | Cumulative   |
| ---------------------------- | ------------- | ------------ |
| Local testing (optional)     | 1 hour        | 1 hour       |
| Staging shadow               | 24 hours      | 1 day        |
| Staging full                 | 48 hours      | 3 days       |
| Production shadow            | 24-48 hours   | 5 days       |
| Production 10%               | 24 hours      | 6 days       |
| Production 50%               | 24 hours      | 7 days       |
| Production 100%              | 7 days stable | 14 days      |
| **Total to production 100%** |               | **~2 weeks** |
| Legacy cleanup               | 1 week        | 3 weeks      |

**Fast-track**: Skip local, proceed directly to staging shadow → ~10-12 days to prod 100%

---

## 🔗 Quick Links

- [AGENTS.md](/AGENTS.md) — Project SDLC workflow
- [Assignment Architecture](/tasks/booking-architecture-20251112-2349/plan.md) — V3 design doc
- [Coordinator Implementation](/server/assignments/assignment-coordinator.ts)
- [Feature Flags](/server/feature-flags.ts)

---

**Ready to proceed?** Pick a path from "Recommended Next Steps" above and follow the linked guide! 🚀
