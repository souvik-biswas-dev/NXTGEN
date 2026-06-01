import { db } from './index';
import { users, usersProfiles, properties, projects, platformData, cityCentroids } from './schema';
import { hashPassword } from '@/lib/password';
import { platformDataSeed, cityCentroidsSeed } from './seedData';

// Deterministic demo IDs so re-seeding is idempotent.
const OWNER = '00000000-0000-0000-0000-000000000001';
const BROKER = '00000000-0000-0000-0000-000000000002';
const ADMIN = '00000000-0000-0000-0000-000000000003';
const DEMO_PASSWORD = 'Password123!';

async function seedUsers() {
  const pw = await hashPassword(DEMO_PASSWORD);
  await db
    .insert(users)
    .values([
      { id: OWNER, email: 'owner1@example.com', phone: '+919876543210', passwordHash: pw, emailVerified: true },
      { id: BROKER, email: 'broker1@example.com', phone: '+919876543211', passwordHash: pw, emailVerified: true },
      { id: ADMIN, email: 'admin@nxtgenproperties.com', passwordHash: pw, emailVerified: true },
    ])
    .onConflictDoNothing();
  await db
    .insert(usersProfiles)
    .values([
      { userId: OWNER, email: 'owner1@example.com', phone: '+919876543210', name: 'John Doe', role: 'owner' },
      { userId: BROKER, email: 'broker1@example.com', phone: '+919876543211', name: 'Stella French', role: 'broker', verifiedBroker: true },
      { userId: ADMIN, email: 'admin@nxtgenproperties.com', name: 'Platform Admin', role: 'admin' },
    ])
    .onConflictDoNothing();
}

async function seedPlatformData() {
  for (const [key, data] of Object.entries(platformDataSeed)) {
    await db
      .insert(platformData)
      .values({ key, data })
      .onConflictDoUpdate({ target: platformData.key, set: { data, updatedAt: new Date() } });
  }
  await db.insert(cityCentroids).values(cityCentroidsSeed).onConflictDoNothing();
}

async function seedProjects() {
  await db
    .insert(projects)
    .values([
      {
        id: 'b0000000-0000-0000-0000-000000000001',
        name: 'DLF The Camellias', developer: 'DLF Ltd', location: 'Golf Course Road, Gurgaon',
        city: 'Gurgaon', locality: 'Golf Course Road',
        description: 'Ultra-luxury high-rise with 360° golf-course views, private lift lobbies and concierge service.',
        priceMin: 80000000, priceMax: 250000000, launchDate: 'Feb 2026', possessionDate: 'Dec 2027',
        reraId: 'HRERA-GGM-12345-2023',
        coverImage: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
        gallery: ['https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800'],
        floorPlans: [{ name: '4 BHK', area: 4500, price: 80000000 }, { name: 'Penthouse', area: 9000, price: 250000000 }],
        amenities: ['Private Pool', 'Home Theater', 'Concierge', 'Sky Deck', 'Gym'],
        totalUnits: 250, availableUnits: 40, towerCount: 3, featured: true, verified: true,
      },
      {
        id: 'b0000000-0000-0000-0000-000000000002',
        name: 'Godrej Reserve', developer: 'Godrej Properties', location: 'Chandivali, Mumbai',
        city: 'Mumbai', locality: 'Chandivali',
        description: 'Forest-inspired 3 & 4 BHK residences across 8 acres of landscaped greens.',
        priceMin: 25000000, priceMax: 60000000, launchDate: 'March 2026', possessionDate: 'Jun 2028',
        reraId: 'MAHARERA-P51800000987',
        coverImage: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
        gallery: ['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800'],
        floorPlans: [{ name: '3 BHK', area: 1450, price: 25000000 }, { name: '4 BHK', area: 2150, price: 60000000 }],
        amenities: ['Swimming Pool', 'Gym', 'Clubhouse', 'Garden', 'Yoga Deck'],
        totalUnits: 420, availableUnits: 180, towerCount: 4, featured: true, verified: true,
      },
    ])
    .onConflictDoNothing();
}

type P = typeof properties.$inferInsert;
const demoProperties: P[] = [
  { id: 'a0000000-0000-0000-0000-000000000001', title: 'Luxury 4 BHK Apartment in Sector 150', description: 'Stunning 4 BHK with modern amenities and breathtaking views.', price: 25000000, maintenance: 15000, deposit: 500000, type: 'buy', category: 'residential', bhk: '4BHK', furnishing: 'semi-furnished', areaSqft: 2500, carpetArea: 2100, superBuiltUp: 2800, photos: ['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800'], locality: 'Sector 150', city: 'Noida', address: 'Block A, Sector 150, Noida', floor: '15', totalFloors: '25', facing: 'east', possession: 'ready', ageYears: 1, amenities: ['Swimming Pool', 'Gym', 'Clubhouse', 'Power Backup'], brokerId: BROKER, verified: true, featured: true, bedrooms: 4, bathrooms: 4, kitchens: 1, parkings: 2 },
  { id: 'a0000000-0000-0000-0000-000000000002', title: 'Spacious 3 BHK Flat for Rent in Gurgaon', description: 'Fully furnished 3 BHK near IT parks and metro.', price: 45000, maintenance: 5000, deposit: 135000, type: 'rent', category: 'residential', bhk: '3BHK', furnishing: 'furnished', areaSqft: 1800, carpetArea: 1500, superBuiltUp: 2000, photos: ['https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800'], locality: 'DLF Phase 3', city: 'Gurgaon', address: 'Tower B, DLF Phase 3, Gurgaon', floor: '8', totalFloors: '20', facing: 'north', possession: 'ready', ageYears: 3, amenities: ['Swimming Pool', 'Gym', 'Power Backup', 'Covered Parking'], ownerId: OWNER, verified: true, featured: true, bedrooms: 3, bathrooms: 3, kitchens: 1, parkings: 1 },
  { id: 'a0000000-0000-0000-0000-000000000003', title: 'Premium 2 BHK Apartment in Whitefield', description: 'Modern 2 BHK in a premium gated community.', price: 8500000, maintenance: 4500, type: 'buy', category: 'residential', bhk: '2BHK', furnishing: 'semi-furnished', areaSqft: 1200, carpetArea: 1000, superBuiltUp: 1350, photos: ['https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=800'], locality: 'Whitefield', city: 'Bangalore', address: 'ITPL Main Road, Whitefield, Bangalore', floor: '12', totalFloors: '18', facing: 'south-east', possession: 'ready', ageYears: 2, amenities: ['Swimming Pool', 'Gym', 'Clubhouse'], brokerId: BROKER, verified: true, featured: false, bedrooms: 2, bathrooms: 2, kitchens: 1, parkings: 1 },
  { id: 'a0000000-0000-0000-0000-000000000004', title: 'Elegant 5 BHK Villa in Jubilee Hills', description: 'Luxurious independent villa with private garden and pool.', price: 75000000, maintenance: 25000, type: 'buy', category: 'residential', bhk: '5+BHK', furnishing: 'furnished', areaSqft: 5500, carpetArea: 5000, superBuiltUp: 6000, photos: ['https://images.pexels.com/photos/53610/large-home-residential-house-architecture-53610.jpeg?auto=compress&cs=tinysrgb&w=800'], locality: 'Jubilee Hills', city: 'Hyderabad', address: 'Road No. 10, Jubilee Hills, Hyderabad', floor: 'G+2', totalFloors: '3', facing: 'west', possession: 'ready', ageYears: 1, amenities: ['Private Pool', 'Home Theater', 'Gym', 'Garden', 'Smart Home'], ownerId: OWNER, verified: true, featured: true, bedrooms: 5, bathrooms: 6, kitchens: 2, parkings: 4 },
  { id: 'a0000000-0000-0000-0000-000000000005', title: 'Cozy 1 BHK for Rent in Andheri', description: 'Well-maintained 1 BHK near metro, ideal for professionals.', price: 25000, maintenance: 3000, deposit: 75000, type: 'rent', category: 'residential', bhk: '1BHK', furnishing: 'furnished', areaSqft: 650, carpetArea: 550, superBuiltUp: 750, photos: ['https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800'], locality: 'Andheri West', city: 'Mumbai', address: 'DN Nagar, Andheri West, Mumbai', floor: '5', totalFloors: '12', facing: 'north-east', possession: 'ready', ageYears: 5, amenities: ['Gym', 'Power Backup', 'Lift'], ownerId: OWNER, verified: true, featured: false, bedrooms: 1, bathrooms: 1, kitchens: 1, parkings: 0 },
  { id: 'a0000000-0000-0000-0000-000000000006', title: 'New Launch 3 BHK in Powai', description: 'Brand new 3 BHK at pre-launch prices with flexible plans.', price: 32000000, maintenance: 8000, type: 'buy', category: 'residential', bhk: '3BHK', furnishing: 'unfurnished', areaSqft: 1650, carpetArea: 1400, superBuiltUp: 1850, photos: ['https://images.pexels.com/photos/3797991/pexels-photo-3797991.jpeg?auto=compress&cs=tinysrgb&w=800'], locality: 'Powai', city: 'Mumbai', address: 'Hiranandani Gardens, Powai, Mumbai', floor: '22', totalFloors: '45', facing: 'south', possession: 'under-construction', amenities: ['Swimming Pool', 'Gym', 'Clubhouse', 'Sky Deck', 'EV Charging'], brokerId: BROKER, verified: true, featured: true, bedrooms: 3, bathrooms: 3, kitchens: 1, parkings: 2 },
  { id: 'a0000000-0000-0000-0000-000000000007', title: 'Commercial Office Space in Connaught Place', description: 'Prime commercial office in the heart of Delhi.', price: 150000, maintenance: 20000, deposit: 450000, type: 'rent', category: 'commercial', bhk: '3BHK', furnishing: 'semi-furnished', areaSqft: 2000, carpetArea: 1800, superBuiltUp: 2200, photos: ['https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?auto=compress&cs=tinysrgb&w=800'], locality: 'Connaught Place', city: 'Delhi', address: 'Block M, Connaught Place, New Delhi', floor: '4', totalFloors: '8', facing: 'north', possession: 'ready', ageYears: 10, amenities: ['Conference Room', 'Cafeteria', 'Power Backup', 'Lift'], brokerId: BROKER, verified: true, featured: false, bedrooms: 0, bathrooms: 2, kitchens: 1, parkings: 2 },
  { id: 'a0000000-0000-0000-0000-000000000008', title: 'Studio Apartment in Koramangala', description: 'Trendy studio with modern interiors for singles.', price: 18000, maintenance: 2000, deposit: 54000, type: 'rent', category: 'residential', bhk: '1RK', furnishing: 'furnished', areaSqft: 450, carpetArea: 400, superBuiltUp: 500, photos: ['https://images.pexels.com/photos/1428348/pexels-photo-1428348.jpeg?auto=compress&cs=tinysrgb&w=800'], locality: 'Koramangala', city: 'Bangalore', address: '5th Block, Koramangala, Bangalore', floor: '3', totalFloors: '6', facing: 'east', possession: 'ready', ageYears: 2, amenities: ['Power Backup', 'Lift', 'Water Purifier'], ownerId: OWNER, verified: true, featured: false, bedrooms: 1, bathrooms: 1, kitchens: 1, parkings: 0 },
  { id: 'a0000000-0000-0000-0000-000000000009', title: 'Premium 2 BHK in Greater Noida', description: 'Affordable 2 BHK with great connectivity.', price: 4500000, maintenance: 3000, type: 'buy', category: 'residential', bhk: '2BHK', furnishing: 'unfurnished', areaSqft: 1050, carpetArea: 900, superBuiltUp: 1200, photos: ['https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=800'], locality: 'Sector 1', city: 'Greater Noida', address: 'Alpha 1, Greater Noida', floor: '7', totalFloors: '14', facing: 'north-west', possession: 'ready', ageYears: 4, amenities: ['Swimming Pool', 'Gym', 'Power Backup', 'Clubhouse'], brokerId: BROKER, verified: true, featured: false, bedrooms: 2, bathrooms: 2, kitchens: 1, parkings: 1 },
  { id: 'a0000000-0000-0000-0000-000000000010', title: 'Luxury Penthouse in Bandra', description: 'Exclusive penthouse with sea views, private terrace and infinity pool.', price: 200000000, maintenance: 75000, type: 'buy', category: 'residential', bhk: '5+BHK', furnishing: 'furnished', areaSqft: 8000, carpetArea: 7500, superBuiltUp: 9000, photos: ['https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=800'], locality: 'Bandra West', city: 'Mumbai', address: 'Carter Road, Bandra West, Mumbai', floor: '35', totalFloors: '35', facing: 'west', possession: 'ready', ageYears: 0, amenities: ['Private Pool', 'Home Theater', 'Private Lift', 'Smart Home', 'Concierge'], ownerId: OWNER, verified: true, featured: true, bedrooms: 6, bathrooms: 7, kitchens: 2, parkings: 6 },
];

async function seedProperties() {
  await db.insert(properties).values(demoProperties).onConflictDoNothing();
}

async function main() {
  console.log('🌱 Seeding…');
  await seedUsers();
  await seedPlatformData();
  await seedProjects();
  await seedProperties();
  console.log('✅ Seed complete.');
  console.log(`   Demo logins (password: ${DEMO_PASSWORD}):`);
  console.log('   • owner1@example.com (owner)');
  console.log('   • broker1@example.com (broker, verified)');
  console.log('   • admin@nxtgenproperties.com (admin)');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
