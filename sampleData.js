const scenarioA = {
  patient_id: "HC-10234",
  patient_name: "Jane Murray",
  date_of_birth: "1981-02-14",      // age 45
  patient_status: "active",
  medication_name: "Amoxicillin",
  dosage: "500mg three times daily",
  prescribing_gp: "Dr. Stewart",
  is_repeat: false,
  last_review_date: null,
  current_medications: [],
  known_allergies: [],
  request_date: "2026-05-06",
  submitted_by: "reception_user_1",
  expected_outcome: "APPROVED",
};

const scenarioB = {
  patient_id: "HC-20891",
  patient_name: "Robert Innes",
  date_of_birth: "1963-08-22",      // age 62
  patient_status: "active",
  medication_name: "Amoxicillin",
  dosage: "250mg twice daily",
  prescribing_gp: "Dr. MacLeod",
  is_repeat: false,
  last_review_date: null,
  current_medications: ["Metformin"],
  known_allergies: ["Penicillin"],
  request_date: "2026-05-06",
  submitted_by: "reception_user_1",
  expected_outcome: "REJECTED",     // R2 - Amoxicillin is a Penicillin-derivative, cross-referenced against Penicillin allergy
};

const scenarioC = {
  patient_id: "HC-15567",
  patient_name: "Mary Campbell",
  date_of_birth: "1954-11-30",      // age 71
  patient_status: "active",
  medication_name: "Simvastatin",
  dosage: "40mg once daily",
  prescribing_gp: "Dr. Grant",
  is_repeat: false,
  last_review_date: "2026-01-10",
  current_medications: ["Erythromycin", "Lisinopril"],
  known_allergies: [],
  request_date: "2026-05-06",
  submitted_by: "reception_user_2",
  expected_outcome: "FLAGGED FOR REVIEW",  // R4 - Simvastatin + Erythromycin is a medium-severity interaction
};

const scenarioD = {
  patient_id: "HC-30102",
  patient_name: "Angus Fraser",
  date_of_birth: "1943-09-05",      // age 82
  patient_status: "active",
  medication_name: "Ibuprofen",
  dosage: "400mg three times daily",
  prescribing_gp: "Dr. Robertson",
  is_repeat: true,
  last_review_date: "2025-03-06",   // 14 months ago
  current_medications: ["Warfarin"],
  known_allergies: [],
  request_date: "2026-05-06",
  submitted_by: "reception_user_1",
  expected_outcome: "REJECTED",     // R3 (Ibuprofen + Warfarin is high-severity) + R5 (overdue review) + R6 (age over 80)
};

const scenarioE = {
  patient_id: "HC-08913",
  patient_name: "Fiona MacDonald",
  date_of_birth: "1992-04-17",      // age 34
  patient_status: "transferred",
  medication_name: "Omeprazole",
  dosage: "20mg once daily",
  prescribing_gp: "Dr. MacKenzie",
  is_repeat: false,
  last_review_date: null,
  current_medications: [],
  known_allergies: [],
  request_date: "2026-05-06",
  submitted_by: "reception_user_3",
  expected_outcome: "REJECTED",     // R1 - patient status is "transferred"
};

module.exports = {
  scenarios: [scenarioA, scenarioB, scenarioC, scenarioD, scenarioE],
};