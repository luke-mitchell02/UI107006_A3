const { test } = require('node:test');
const assert = require('node:assert');
const { verifyPrescription } = require('./algorithm');
const { scenarios } = require('./sampleData');

const [scenarioA, scenarioB, scenarioC, scenarioD, scenarioE] = scenarios;

test('Scenario A: Active patient, no issues -> APPROVED', () => {
    const result = verifyPrescription(scenarioA);
    assert.strictEqual(result.outcome, 'APPROVED');
    assert.deepStrictEqual(result.triggeredRules, []);
});

test('Scenario B: Allergic to Penicillin -> REJECTED, R2 triggered', () => {
    const result = verifyPrescription(scenarioB);
    assert.strictEqual(result.outcome, 'REJECTED');
    assert.ok(result.triggeredRules.includes('R2'));
});

test('Scenario C: Medium drug interaction -> FLAGGED FOR REVIEW, R4 triggered', () => {
    const result = verifyPrescription(scenarioC);
    assert.strictEqual(result.outcome, 'FLAGGED FOR REVIEW');
    assert.ok(result.triggeredRules.includes('R4'));
});

test('Scenario D: High interaction, overdue review & age > 80 -> REJECTED, R3 / R5 / R6 all triggered', () => {
    const result = verifyPrescription(scenarioD);
    assert.strictEqual(result.outcome, 'REJECTED');
    assert.ok(result.triggeredRules.includes('R3'));
    assert.ok(result.triggeredRules.includes('R5'));
    assert.ok(result.triggeredRules.includes('R6'));
});

test('Scenario E: Transferred patient -> REJECTED, R1 triggered', () => {
    const result = verifyPrescription(scenarioE);
    assert.strictEqual(result.outcome, 'REJECTED');
    assert.ok(result.triggeredRules.includes('R1'));
});