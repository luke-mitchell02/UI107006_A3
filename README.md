# UI107006 Assessment 3: Algorithm Design Task
# Highland Medical Centre - Prescription Verification System

---

## Contents

1. [Problem Statement](#problem-statement)
2. [Flowchart](#flowchart)
3. [Algorithm](#algorithm)
4. [Unit Test](#unit-test)
5. [Data Type Justifications](#data-type-justifications)
6. [Business Context Discussion](#business-context-discussion)
7. [Security Analysis](#security-analysis)
8. [How To Run](#how-to-run)

---

## Problem Statement

Highland Medical Centre currently handles prescription requests through a mix of phone calls, paper forms, and an outdated system. This has led to a 15% increase in prescription errors over the past year. The practice has no automated checks for things like drug interactions, patient allergies, or whether a patient is still registered. There is also no audit trail, which makes it difficult to demonstrate compliance during inspections.

The goal of this algorithm is to automatically verify prescription requests before they are approved. It takes in a prescription request along with the patient's details and applies a set of clinical safety rules. The output is a decision of APPROVED, FLAGGED FOR REVIEW, or REJECTED, along with a record of all of the rules that were triggered and a human readable explanation of the outcome. Patient safety is the priority and the system is designed to flag anything uncertain rather than approve it.

---

## Flowchart

![Flow Chart](Flow%20Chart.png)

---

## Algorithm

I know the assessment says to use pseudocode, but I am not a fan of writing pseudocode, I'd rather get extra practice and actually make something executable. So thats what I've done.

I am assuming this is fine, considering the document says 'You do not *need to* write executable code' which to me sounds like I can choose to write actual code or pseudocode.

### algorithm.js

```js
const ALLERGY_CROSS_REF = [
    { allergen: "Penicillin", medication: "Amoxicillin" },
];
const BAD_DRUG_COMBINATIONS = [
    { drugA: "Warfarin",    drugB: "Ibuprofen",             severity: "High"   },
    { drugA: "Metformin",   drugB: "Contrast Dye",          severity: "High"   },
    { drugA: "Simvastatin", drugB: "Erythromycin",          severity: "Medium" },
    { drugA: "Lisinopril",  drugB: "Potassium Supplements", severity: "Medium" },
];

function getAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);

    let age = today.getFullYear() - birthDate.getFullYear();
    // subtract 1 if the birthday hasn't happened yet this year
    const birthdayThisYear = today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

    return birthdayThisYear ? age : age - 1;
}

function monthsSince(date) {
    const today = new Date();
    const targetDate = new Date(date);
    const msPerMonth = 1000 * 60 * 60 * 24 * 30.44;
    return (today - targetDate) / msPerMonth;
}

function checkR1(scenario) {
    if (scenario.patient_status === "inactive" || scenario.patient_status === "transferred") {
        return "R1";
    }
    return null;
}

function checkR2(scenario) {
    const match = ALLERGY_CROSS_REF.find(entry => entry.medication === scenario.medication_name);
    if (match && scenario.known_allergies.includes(match.allergen)) {
        return "R2";
    }
    return null;
}

function checkR3(scenario) {
    const match = BAD_DRUG_COMBINATIONS.find(entry =>
        entry.severity === "High" &&
        ((entry.drugA === scenario.medication_name && scenario.current_medications.includes(entry.drugB)) ||
         (entry.drugB === scenario.medication_name && scenario.current_medications.includes(entry.drugA)))
    );
    return match ? "R3" : null;
}

function checkR4(scenario) {
    const match = BAD_DRUG_COMBINATIONS.find(entry =>
        entry.severity === "Medium" &&
        ((entry.drugA === scenario.medication_name && scenario.current_medications.includes(entry.drugB)) ||
         (entry.drugB === scenario.medication_name && scenario.current_medications.includes(entry.drugA)))
    );
    return match ? "R4" : null;
}

function checkR5(scenario) {
    if (scenario.is_repeat && (!scenario.last_review_date || monthsSince(scenario.last_review_date) > 6)) {
        return "R5";
    }
    return null;
}

function checkR6(scenario) {
    const age = getAge(scenario.date_of_birth);
    if (age < 16 || age > 80) {
        return "R6";
    }
    return null;
}

function resolveOutcome(triggeredRules) {
    const REJECTED = ['R1', 'R2', 'R3'];
    const FLAGGED = ['R4', 'R5', 'R6'];

    if (triggeredRules.some(rule => REJECTED.includes(rule))) {
        return 'REJECTED';
    } else if (triggeredRules.some(rule => FLAGGED.includes(rule))) {
        return 'FLAGGED FOR REVIEW';
    }
    return 'APPROVED';
}

function buildSummary(triggeredRules, scenario, outcome) {
    if (triggeredRules.length === 0) return 'Approved: no issues found.';

    const messages = triggeredRules.map(rule => {
        if (rule === 'R1') {
            return `The patients status is "${scenario.patient_status}" and is no longer registered at this practice`;
        }
        if (rule === 'R2') {
            const match = ALLERGY_CROSS_REF.find(e => e.medication === scenario.medication_name);
            return `The patient has a recorded allergy to ${match.allergen} and ${scenario.medication_name} is a ${match.allergen}-derivative`;
        }
        if (rule === 'R3') {
            const match = BAD_DRUG_COMBINATIONS.find(e =>
                e.severity === 'High' &&
                ((e.drugA === scenario.medication_name && scenario.current_medications.includes(e.drugB)) ||
                 (e.drugB === scenario.medication_name && scenario.current_medications.includes(e.drugA)))
            );
            const other = match.drugA === scenario.medication_name ? match.drugB : match.drugA;
            return `${scenario.medication_name} has a high-severity interaction with ${other} (currently prescribed)`;
        }
        if (rule === 'R4') {
            const match = BAD_DRUG_COMBINATIONS.find(e =>
                e.severity === 'Medium' &&
                ((e.drugA === scenario.medication_name && scenario.current_medications.includes(e.drugB)) ||
                 (e.drugB === scenario.medication_name && scenario.current_medications.includes(e.drugA)))
            );
            const other = match.drugA === scenario.medication_name ? match.drugB : match.drugA;
            return `${scenario.medication_name} has a medium-severity interaction with ${other}, this requires a pharmacist review`;
        }
        if (rule === 'R5') {
            const details = scenario.last_review_date
                ? `The last review was ${Math.floor(monthsSince(scenario.last_review_date))} months ago`
                : 'There are no reviews on record';
            return `Repeat prescriptions require a review within the last 6 months. ${details}`;
        }
        if (rule === 'R6') {
            const age = getAge(scenario.date_of_birth);
            const reason = age < 16 ? 'under 16' : 'over 80';
            return `patient is ${reason} (age ${age}), this requires a pharmacist review`;
        }
    });

    return `${messages.join('; ')}.`;
}

function verifyPrescription(scenario) {
    const rules = [checkR1(scenario), checkR2(scenario), checkR3(scenario), checkR4(scenario), checkR5(scenario), checkR6(scenario)];
    const triggeredRules = rules.filter(r => r !== null);
    const outcome = resolveOutcome(triggeredRules);
    const reason = buildSummary(triggeredRules, scenario, outcome);
    const log = {
        timestamp: new Date().toISOString(),
        submitted_by: scenario.submitted_by,
        outcome,
        triggeredRules,
        reason,
    };
    return { ...scenario, outcome, reason, log };
}

module.exports = { verifyPrescription };

if (require.main === module) {
    const { scenarios } = require('./sampleData');
    for (const scenario of scenarios) {
        console.log(verifyPrescription(scenario));
    }
}
```

---

## Unit Test

### test.js

```js
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
```

---

## Data Type Justifications

**date_of_birth, last_review_date, request_date**
- Data Type: String
- Format: "YYYY-MM-DD"

- Dates stored in this format can easily be converted into JS Date objects when needed for a calculation. They are also easy to read and write in ISO format.

**patient_status**
- Data Type: String / ENUM
- Possible Values: "active", "inactive", "transferred"

Using an string / enum is the most readable way to store a status, opposed to using booleans or integers mapped to a status.

**known_allergies and current_medications**
- Data Type: Array of Strings

A patient can have none, one, or multiple allergies and or medications at the same time, so an array is most fitting and covers all of these cases.

**is_repeat**
- Data Type: Bool (True / False)

Simply a yes or no. There is no in-between value like with `patient_status`, so a boolean is the most appropriate data type.

**outcome**
- Data Type: String / ENUM
- Possible Values: "APPROVED", "FLAGGED FOR REVIEW", "REJECTED"

A string is the easiest choice when it comes to providing a readable output, it also forces consistency and is easy to check when testing.

---

## Business Context Discussion

### Ethics

The algorithm makes decisions that could directly affect a patients health, so the consequences of getting anything wrong could potentially be life-threatening. The algorithm is designed to always favour caution and does not make assumptions. When a rule is triggered, the system flags a request for review, or straight up rejects it. This means some safe prescriptions may have false positives and get flagged unnecessarily, but for a high-risk scenario that is much more favourable than just approving a prescription that could be harmful to a patient.

The algorithm applies the same preset of rules to every patient without exception. 

This means there is no variation on the outcome, based on factors such as who submitted the request or which GP signed it off. This removes the possibility of bias, and keeps the process consistent and fair for all patients.

### Timeliness

The algorithm performs all rule checks in a single pass and produces a result immediately. This is much faster than a staff member manually checking drug interaction tables and patient records. 

Even though all rules are checked every time, each check only takes a few milliseconds to complete. 

If the reference data lookup was slow for some reason, the reception staff would be left waiting for a result before they could process the next request, which would backlog. This algorithm currently stores reference data in memory which avoids this problem entirely. Connecting to a database would not really add any noticeable latency, unless the database is configured incorrectly, or the connections are handled incorrectly.

### Quality

Each pass produces a complete output record that includes:

- The outcome
- The rules that were triggered (if any) 
- A human readable explanation of the decision
- The timestamp the request was handled by the system 

This provides the practice with an audit trail for each request that passes through the system which ensures compliance with regulations and legal requirements. 

---

## Security Analysis

### Risk 1: Audit Log Tampering

The system currently generates a complete output and adds a 'log' object containing necessary data which can be used for auditing.

However, if a staff member could modify or delete these audit logs then the practice has no trustworthy way to prove what decisions were made and when. This would be a big problem during regulatory inspections.

The algorithm reduces this risk by generating the audit log input automatically, rather than relying on human input.

In a full implementation, the audit log should be write-once, meaning only the system can create entries and no user can edit or delete them. Access to read the log should also be restricted to authorised staff such as practice managers and pharmacists.

### Risk 2: Reference Data Integrity

The algorithm depends entirely on the drug interaction list and allergy cross-reference being accurate. If this data is outdated, incomplete, or tampered with, the algorithm could miss a dangerous combination and approve a prescription it should have rejected. If a known interaction was accidentally removed from the list, a harmful drug combination could pass all checks with no warning.

To significantly reduce the risk of this, the reference data should only be editable by authorised clinical staff such as the practice pharmacists. Any changes should be logged with the identity of the person who made the changes and when they were made. The data should also be reviewed regularly to ensure its accurate and that it is still in line with medical guidelines.

---

## How To Run

**Run the algorithm against all sample scenarios:**
```
node algorithm.js
```

**Run the unit tests:**
```
node --test test.js
```