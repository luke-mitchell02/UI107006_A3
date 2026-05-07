const ALLERGY_CROSS_REF = [
    { allergen: "Penicillin", medication: "Amoxicillin" },
];
const BAD_DRUG_COMBINATIONS = [
    { drugA: "Warfarin",    drugB: "Ibuprofen",               severity: "High"   },
    { drugA: "Metformin",   drugB: "Contrast Dye",            severity: "High"   },
    { drugA: "Simvastatin", drugB: "Erythromycin",            severity: "Medium" },
    { drugA: "Lisinopril",  drugB: "Potassium Supplements",   severity: "Medium" },
];


function getAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);

    let age = today.getFullYear() - birthDate.getFullYear();
    // subtract 1 if the birthday hasn't happened yet this year
    const birthdayThisYear = today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

    return birthdayThisYear ? age : age - 1
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
