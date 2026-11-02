import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addMonths,
  buildSchedule,
  computeLoanState,
  fillTemplate,
  installmentStatus,
  normalizePhone,
  portfolioAtRisk,
  summarizeSchedule,
  type LoanTerms,
  type PenaltyRules,
} from '../src/lib/engine/loan.ts';

const noPenalty: PenaltyRules = { lateFeeType: 'none', lateFeeValue: 0, graceDays: 0 };

const flatMonthly: LoanTerms = {
  principal: 1_000_000,
  interestRate: 10,
  ratePeriod: 'month',
  interestMethod: 'flat',
  frequency: 'monthly',
  installments: 3,
  startDate: '2026-01-31',
};

test('addMonths clamps to month end', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2028-01-31', 1), '2028-02-29');
  assert.equal(addMonths('2026-01-31', 2), '2026-03-31');
  assert.equal(addMonths('2026-11-15', 2), '2027-01-15');
});

test('flat monthly schedule: 10%/month on 1,000,000 over 3 months', () => {
  const s = buildSchedule(flatMonthly);
  assert.equal(s.length, 3);
  const sum = summarizeSchedule(s);
  assert.equal(sum.totalPrincipal, 1_000_000);
  assert.equal(sum.totalInterest, 300_000);
  assert.equal(sum.totalRepayable, 1_300_000);
  assert.deepEqual(s.map((i) => i.dueDate), ['2026-02-28', '2026-03-31', '2026-04-30']);
  // rounding remainder lands on the last installment
  assert.equal(s[0].principal, 333_333);
  assert.equal(s[2].principal, 333_334);
});

test('flat "per loan" rate charges interest once', () => {
  const s = buildSchedule({ ...flatMonthly, ratePeriod: 'loan', installments: 4, frequency: 'weekly', startDate: '2026-03-02' });
  assert.equal(summarizeSchedule(s).totalInterest, 100_000);
  assert.equal(s[0].dueDate, '2026-03-09');
  assert.equal(s[3].dueDate, '2026-03-30');
});

test('weekly flat at monthly rate prices by duration', () => {
  const s = buildSchedule({ ...flatMonthly, frequency: 'weekly', installments: 8 });
  // 8 weeks = 56 days = 1.8667 months -> 186,667
  assert.equal(summarizeSchedule(s).totalInterest, 186_667);
});

test('reducing balance schedule amortises to zero with equal payments', () => {
  const s = buildSchedule({ ...flatMonthly, interestMethod: 'reducing', installments: 12, interestRate: 5 });
  const sum = summarizeSchedule(s);
  assert.equal(sum.totalPrincipal, 1_000_000);
  // Annuity payment for 5%/month, 12 months ≈ 112,825
  assert.ok(Math.abs(s[0].amount - 112_825) <= 1, `first payment ${s[0].amount}`);
  assert.ok(s[0].interest === 50_000);
  assert.ok(s[11].interest < s[0].interest);
  assert.ok(sum.totalInterest > 350_000 && sum.totalInterest < 355_000, `interest ${sum.totalInterest}`);
});

test('reducing with zero rate is just principal', () => {
  const s = buildSchedule({ ...flatMonthly, interestMethod: 'reducing', interestRate: 0 });
  assert.equal(summarizeSchedule(s).totalInterest, 0);
});

test('rejects invalid terms', () => {
  assert.throws(() => buildSchedule({ ...flatMonthly, principal: 0 }));
  assert.throws(() => buildSchedule({ ...flatMonthly, interestMethod: 'reducing', ratePeriod: 'loan' }));
});

test('payments allocate oldest installment first, interest before principal', () => {
  const s = buildSchedule(flatMonthly);
  const st = computeLoanState(s, [{ id: 'p1', amount: 500_000, date: '2026-02-20' }], noPenalty, '2026-02-20');
  assert.equal(st.amountPaid, 500_000);
  assert.equal(st.balance, 800_000);
  // inst 1 in full (100,000 interest + 333,333 principal), then 66,667 towards inst 2 interest
  assert.equal(st.allocations.p1.interest, 166_667);
  assert.equal(st.allocations.p1.principal, 333_333);
  assert.equal(st.schedule[0].paidDate, '2026-02-20');
  assert.equal(st.nextDueDate, '2026-03-31');
  assert.equal(st.isOverdue, false);
});

test('overdue with late fee after grace period', () => {
  const s = buildSchedule(flatMonthly);
  const rules: PenaltyRules = { lateFeeType: 'percent', lateFeeValue: 5, graceDays: 3 };
  // inst 1 due 2026-02-28 (amount 433,333). Within grace on 2026-03-03: no fee yet.
  let st = computeLoanState(s, [], rules, '2026-03-03');
  assert.equal(st.totalPenalty, 0);
  assert.equal(st.daysOverdue, 3);
  assert.equal(st.isOverdue, false);
  // Fee charged the day after grace ends.
  st = computeLoanState(s, [], rules, '2026-03-04');
  assert.equal(st.totalPenalty, Math.round(433_333 * 0.05));
  assert.equal(st.isOverdue, true);
  assert.equal(st.arrears, 433_333 + 21_667);
  assert.equal(installmentStatus(st.schedule[0], '2026-03-04'), 'overdue');
});

test('paying before grace ends avoids the late fee; late fee is paid first', () => {
  const s = buildSchedule(flatMonthly);
  const rules: PenaltyRules = { lateFeeType: 'fixed', lateFeeValue: 10_000, graceDays: 0 };
  const onTime = computeLoanState(s, [{ id: 'a', amount: 433_333, date: '2026-02-28' }], rules, '2026-03-10');
  assert.equal(onTime.totalPenalty, 0);
  const late = computeLoanState(s, [{ id: 'a', amount: 20_000, date: '2026-03-05' }], rules, '2026-03-05');
  assert.equal(late.totalPenalty, 10_000);
  assert.equal(late.allocations.a.penalty, 10_000);
  assert.equal(late.allocations.a.interest, 10_000);
});

test('fully paid loan closes and stops accruing', () => {
  const s = buildSchedule(flatMonthly);
  const rules: PenaltyRules = { lateFeeType: 'percent', lateFeeValue: 5, graceDays: 0 };
  const st = computeLoanState(s, [{ id: 'x', amount: 1_300_000, date: '2026-02-01' }], rules, '2027-01-01');
  assert.equal(st.isClosed, true);
  assert.equal(st.balance, 0);
  assert.equal(st.totalPenalty, 0);
  assert.equal(st.nextDueDate, null);
});

test('reversal = replay without the payment', () => {
  const s = buildSchedule(flatMonthly);
  const pays = [{ id: '1', amount: 433_333, date: '2026-02-28' }, { id: '2', amount: 433_333, date: '2026-03-31' }];
  const before = computeLoanState(s, pays, noPenalty, '2026-04-01');
  const after = computeLoanState(s, pays.filter((p) => p.id !== '2'), noPenalty, '2026-04-01');
  assert.equal(before.balance + 433_333, after.balance);
  assert.equal(after.daysOverdue, 1);
});

test('portfolio at risk', () => {
  const par = portfolioAtRisk([
    { status: 'active', principalOutstanding: 600, daysOverdue: 0 },
    { status: 'overdue', principalOutstanding: 400, daysOverdue: 45 },
    { status: 'closed', principalOutstanding: 999, daysOverdue: 99 },
  ]);
  assert.equal(par, 0.4);
});

test('phone normalisation and templates', () => {
  assert.equal(normalizePhone('0712 345 678'), '255712345678');
  assert.equal(normalizePhone('+255712345678'), '255712345678');
  assert.equal(normalizePhone('712345678'), '255712345678');
  assert.equal(fillTemplate('Habari {name}, lipa {amount}', { name: 'Asha', amount: '5,000' }), 'Habari Asha, lipa 5,000');
});
