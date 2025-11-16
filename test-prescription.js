const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const newPrescription = await prisma.prescription.create({
      data: {
        patientId: 3,
        rightEye: {
          type: 'Progressive',
          sph: '+1.50',
          cyl: '-0.75',
          axis: '90',
          add: '+2.00',
          pd: '62',
          bc: '8.4',
          remarks: 'For reading'
        },
        leftEye: {
          type: 'Progressive',
          sph: '+1.25',
          cyl: '-0.50',
          axis: '180',
          add: '+2.00',
          pd: '62',
          bc: '8.4',
          remarks: 'For reading'
        },
        notes: 'Patient prefers progressive lenses'
      }
    });
    console.log('✅ SUCCESS: Prescription created successfully');
    console.log(JSON.stringify(newPrescription, null, 2));
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
