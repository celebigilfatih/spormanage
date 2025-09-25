import { seedNotifications } from './seed-notifications';

export async function seedAllData() {
  console.log('🌱 Starting comprehensive data seeding...');
  
  try {
    console.log('📊 Seeding basic data...');
    // For now, we'll call the seed functions directly
    // In production, these would be properly imported
    
    console.log('🔔 Seeding notifications...');
    await seedNotifications();
    
    console.log('✅ Data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during data seeding:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedAllData()
    .catch((error) => {
      console.error('Failed to seed data:', error);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}