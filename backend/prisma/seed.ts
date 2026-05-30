import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding database...");

  const doctorPassword = await bcrypt.hash("doctor123", 12);
  const patientPassword = await bcrypt.hash("patient123", 12);

  /* ─── Doctors ────────────────────────────────────────── */
  const doctorProfiles = [
    {
      email: "doctor1@gmail.com",
      name: "Dr. Maria Santos",
      specialization: "General Practitioner",
      bio: "10+ years of experience in family and internal medicine.",
      avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
    },
    {
      email: "doctor2@gmail.com",
      name: "Dr. Carlos Reyes",
      specialization: "Cardiologist",
      bio: "Specializes in heart disease prevention and management.",
      avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80",
    },
    {
      email: "doctor3@gmail.com",
      name: "Dr. Angela Lim",
      specialization: "Dermatologist",
      bio: "Expert in skin conditions, cosmetic dermatology, and dermatopathology.",
      avatarUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80",
    },
    {
      email: "doctor4@gmail.com",
      name: "Dr. Jose Garcia",
      specialization: "Neurologist",
      bio: "Focused on epilepsy, migraines, and neurodegenerative diseases.",
      avatarUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80",
    },
  ];

  const seededDoctorIds: string[] = [];

  for (const data of doctorProfiles) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        doctorProfile: {
          update: {
            name: data.name,
            specialization: data.specialization,
            bio: data.bio,
            avatarUrl: data.avatarUrl,
            isAvailable: true,
          },
        },
      },
      create: {
        email: data.email,
        password: doctorPassword,
        role: Role.DOCTOR,
        doctorProfile: {
          create: {
            name: data.name,
            specialization: data.specialization,
            bio: data.bio,
            avatarUrl: data.avatarUrl,
            isAvailable: true,
          },
        },
      },
    });
    const doctor = await prisma.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (doctor?.id) {
      seededDoctorIds.push(doctor.id);
    }
    console.log(`  ✅  Doctor: ${data.name} (${data.email})`);
  }

  /* ─── Patients ───────────────────────────────────────── */
  const patientProfiles = [
    {
      email: "patient1@gmail.com",
      firstName: "John",
      lastName: "Smith",
      dateOfBirth: new Date("1984-06-15"),
      gender: "Male",
      bloodType: "O+",
      height: 178,
      weight: 82,
      phone: "+1-555-0101",
      address: "123 Maple St, Springfield, IL",
      allergies: "Penicillin,Shellfish",
      medicalHistory: "Hypertension (Controlled),Type 2 Diabetes",
      emergencyContact: "Jane Smith",
      emergencyPhone: "+1-555-0102",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    },
    {
      email: "patient2@gmail.com",
      firstName: "Elena",
      lastName: "Rodriguez",
      dateOfBirth: new Date("1991-03-22"),
      gender: "Female",
      bloodType: "A+",
      height: 162,
      weight: 61,
      phone: "+1-555-0201",
      address: "456 Oak Ave, Portland, OR",
      allergies: "Aspirin",
      medicalHistory: "Seasonal Allergies,Mild Asthma",
      emergencyContact: "Carlos Rodriguez",
      emergencyPhone: "+1-555-0202",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    },
    {
      email: "patient3@gmail.com",
      firstName: "Samuel",
      lastName: "Chen",
      dateOfBirth: new Date("1968-11-08"),
      gender: "Male",
      bloodType: "B-",
      height: 175,
      weight: 90,
      phone: "+1-555-0301",
      address: "789 Pine Rd, Austin, TX",
      allergies: "Sulfa drugs",
      medicalHistory: "Hypercholesterolemia,GERD",
      emergencyContact: "Linda Chen",
      emergencyPhone: "+1-555-0302",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    },
    {
      email: "patient4@gmail.com",
      firstName: "Miriam",
      lastName: "Thompson",
      dateOfBirth: new Date("1959-09-30"),
      gender: "Female",
      bloodType: "AB+",
      height: 155,
      weight: 58,
      phone: "+1-555-0401",
      address: "321 Elm St, Denver, CO",
      allergies: "",
      medicalHistory: "Osteoarthritis,Hypothyroidism",
      emergencyContact: "David Thompson",
      emergencyPhone: "+1-555-0402",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    },
  ];

  const seededPatientIds: string[] = [];

  for (const data of patientProfiles) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        patientProfile: {
          update: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            avatarUrl: data.avatarUrl,
            bloodType: data.bloodType,
            height: data.height,
            weight: data.weight,
            allergies: data.allergies,
            medicalHistory: data.medicalHistory,
            emergencyContact: data.emergencyContact,
            emergencyPhone: data.emergencyPhone,
            address: data.address,
          },
        },
      },
      create: {
        email: data.email,
        password: patientPassword,
        role: Role.PATIENT,
        patientProfile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            avatarUrl: data.avatarUrl,
            bloodType: data.bloodType,
            height: data.height,
            weight: data.weight,
            allergies: data.allergies,
            medicalHistory: data.medicalHistory,
            emergencyContact: data.emergencyContact,
            emergencyPhone: data.emergencyPhone,
            address: data.address,
          },
        },
      },
    });
    const patient = await prisma.patient.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (patient?.id) {
      seededPatientIds.push(patient.id);
    }
    console.log(`  ✅  Patient: ${data.firstName} ${data.lastName} (${data.email})`);
  }

  /* ─── Past Consultations ─────────────────────────────── */
  const consultationTemplates = [
    {
      patientIdx: 0,
      doctorIdx: 0,
      agoDays: 3,
      reason: "Chest discomfort and shortness of breath",
      diagnosis: "Hypertension follow-up",
      notes: "BP 130/85 — within target. Continue current regimen. Advised to maintain low-sodium diet and regular exercise. Follow-up in 3 months.",
      prescriptions: [
        { medication: "Amlodipine 5mg", frequency: "OD", duration: "30 days" },
        { medication: "Metformin 500mg", frequency: "BID", duration: "30 days" },
      ],
    },
    {
      patientIdx: 0,
      doctorIdx: 1,
      agoDays: 14,
      reason: "Heart palpitations",
      diagnosis: "Cardiac evaluation",
      notes: "ECG shows normal sinus rhythm. Holter monitor placed for 24-hour observation. Patient advised to avoid caffeine and report any unusual symptoms.",
      prescriptions: [
        { medication: "Propranolol 10mg", frequency: "PRN", duration: "7 days" },
      ],
    },
    {
      patientIdx: 0,
      doctorIdx: 3,
      agoDays: 30,
      reason: "Frequent headaches",
      diagnosis: "Migraine assessment",
      notes: "Patient reports 3-4 migraine episodes per month. Started preventive therapy. Migraine diary recommended.",
      prescriptions: [
        { medication: "Sumatriptan 50mg", frequency: "PRN", duration: "10 tablets" },
      ],
    },
    {
      patientIdx: 1,
      doctorIdx: 0,
      agoDays: 5,
      reason: "Annual physical checkup",
      diagnosis: "General health screening",
      notes: "All vitals normal. BMI within healthy range. Recommended routine blood work and flu vaccination. Continue healthy lifestyle.",
      prescriptions: [
        { medication: "Cetirizine 10mg", frequency: "OD", duration: "30 days" },
      ],
    },
    {
      patientIdx: 1,
      doctorIdx: 2,
      agoDays: 20,
      reason: "Skin rash on arms",
      diagnosis: "Contact dermatitis",
      notes: "Red, itchy rash on forearms consistent with allergic contact dermatitis. Likely triggered by new laundry detergent. Prescribed topical treatment.",
      prescriptions: [
        { medication: "Hydrocortisone 1% cream", frequency: "BID", duration: "14 days" },
      ],
    },
    {
      patientIdx: 2,
      doctorIdx: 1,
      agoDays: 7,
      reason: "High cholesterol follow-up",
      diagnosis: "Lipid panel review",
      notes: "LDL down to 115 mg/dL from 145. Statin working well. Reinforced dietary changes — reduce saturated fats and increase fiber intake.",
      prescriptions: [
        { medication: "Atorvastatin 40mg", frequency: "OD", duration: "90 days" },
        { medication: "Omeprazole 20mg", frequency: "OD", duration: "30 days" },
      ],
    },
    {
      patientIdx: 2,
      doctorIdx: 3,
      agoDays: 25,
      reason: "Numbness in left hand",
      diagnosis: "Carpal tunnel syndrome",
      notes: "Positive Tinel's sign on left wrist. Recommended wrist splint at night and ergonomic workstation setup. Follow-up in 6 weeks.",
      prescriptions: [
        { medication: "Naproxen 500mg", frequency: "BID", duration: "14 days" },
      ],
    },
    {
      patientIdx: 3,
      doctorIdx: 0,
      agoDays: 4,
      reason: "Thyroid medication refill",
      diagnosis: "Thyroid management",
      notes: "TSH within range at 2.1 mIU/L. Renewed prescription. Continue annual monitoring.",
      prescriptions: [
        { medication: "Levothyroxine 50mcg", frequency: "OD", duration: "90 days" },
      ],
    },
    {
      patientIdx: 3,
      doctorIdx: 2,
      agoDays: 18,
      reason: "Dry, itchy skin",
      diagnosis: "Xerosis (dry skin)",
      notes: "Skin dry and flaking on lower legs. Likely exacerbated by winter weather. Recommended moisturizing regimen.",
      prescriptions: [
        { medication: "Urea 10% cream", frequency: "BID", duration: "30 days" },
      ],
    },
    {
      patientIdx: 3,
      doctorIdx: 1,
      agoDays: 35,
      reason: "Chest pain evaluation",
      diagnosis: "Costochondritis",
      notes: "Tenderness on palpation of costochondral joints. ECG normal. Reassured patient — not cardiac. NSAIDs and ice therapy recommended.",
      prescriptions: [
        { medication: "Ibuprofen 400mg", frequency: "TID", duration: "7 days" },
      ],
    },
  ];

  for (const t of consultationTemplates) {
    const patientId = seededPatientIds[t.patientIdx];
    const doctorId = seededDoctorIds[t.doctorIdx];
    const scheduledAt = new Date(Date.now() - t.agoDays * 24 * 60 * 60 * 1000);
    // Set to a reasonable appointment hour (10 AM)
    scheduledAt.setUTCHours(10, 0, 0, 0);

    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        patientId,
        scheduledAt,
        status: "COMPLETED",
        type: "Consultation",
        reason: t.reason,
        diagnosis: t.diagnosis,
        consultationNotes: t.notes,
        roomUrl: "https://meet.jit.si/curis-telehealth",
      },
    });

    for (const rx of t.prescriptions) {
      await prisma.prescription.create({
        data: {
          appointmentId: appointment.id,
          medication: rx.medication,
          frequency: rx.frequency,
          duration: rx.duration,
        },
      });
    }
  }
  console.log(`  ✅  ${consultationTemplates.length} past consultations created`);

  /* ─── Upcoming Appointments ──────────────────────────── */
  const upcomingAppointments = [
    { patientIdx: 0, doctorIdx: 0, daysAhead: 1, reason: "Blood pressure follow-up" },
    { patientIdx: 0, doctorIdx: 1, daysAhead: 3, reason: "Heart monitoring check" },
    { patientIdx: 1, doctorIdx: 0, daysAhead: 2, reason: "Lab results review" },
    { patientIdx: 1, doctorIdx: 2, daysAhead: 4, reason: "Skin check" },
    { patientIdx: 2, doctorIdx: 1, daysAhead: 1, reason: "Lipid panel follow-up" },
    { patientIdx: 2, doctorIdx: 3, daysAhead: 5, reason: "Numbness follow-up" },
    { patientIdx: 3, doctorIdx: 0, daysAhead: 2, reason: "Thyroid check" },
    { patientIdx: 3, doctorIdx: 2, daysAhead: 3, reason: "Skin re-evaluation" },
  ];

  for (const u of upcomingAppointments) {
    const patientId = seededPatientIds[u.patientIdx];
    const doctorId = seededDoctorIds[u.doctorIdx];
    const scheduledAt = new Date(Date.now() + u.daysAhead * 24 * 60 * 60 * 1000);
    scheduledAt.setUTCHours(10, 0, 0, 0);

    await prisma.appointment.create({
      data: {
        doctorId,
        patientId,
        scheduledAt,
        status: "UPCOMING",
        type: "Follow-up",
        reason: u.reason,
        roomUrl: "https://meet.jit.si/curis-telehealth",
      },
    });

    // Mark the slot as unavailable
    const startOfDay = new Date(scheduledAt);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const availability = await prisma.doctorAvailability.findUnique({
      where: {
        doctorId_date: { doctorId, date: startOfDay },
      },
    });
    if (availability) {
      const slots = availability.slotsJson as { time: string; available: boolean }[];
      const nextSlots = slots.map((s) =>
        s.time === "10:00" ? { ...s, available: false } : s,
      );
      await prisma.doctorAvailability.update({
        where: { doctorId_date: { doctorId, date: startOfDay } },
        data: { slotsJson: nextSlots },
      });
    }
  }
  console.log(`  ✅  ${upcomingAppointments.length} upcoming appointments created`);

  /* ─── Doctor Availability (next 7 days) ──────────────── */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buildSlots = () => {
    const slots: { time: string; available: boolean }[] = [];
    for (let hour = 8; hour < 12; hour++) {
      slots.push({ time: `${hour.toString().padStart(2, "0")}:00`, available: true });
    }
    for (let hour = 13; hour < 17; hour++) {
      slots.push({ time: `${hour.toString().padStart(2, "0")}:00`, available: true });
    }
    return slots;
  };

  const availabilityOps: ReturnType<typeof prisma.doctorAvailability.upsert>[] = [];
  for (const doctorId of seededDoctorIds) {
    for (let offset = 0; offset < 7; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      availabilityOps.push(
        prisma.doctorAvailability.upsert({
          where: { doctorId_date: { doctorId, date } },
          update: { slotsJson: buildSlots() },
          create: { doctorId, date, slotsJson: buildSlots() },
        }),
      );
    }
  }
  await Promise.all(availabilityOps);
  console.log("  ✅  Doctor availability seeded for 7 days");

  console.log("🎉  Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
