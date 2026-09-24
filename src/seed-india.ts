import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const india = {
  name: 'India',
  states: {
    'Andhra Pradesh': [
      'Amaravati', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati',
      'Nellore', 'Kurnool', 'Rajahmundry', 'Kakinada', 'Kadapa',
      'Anantapur', 'Ongole',
    ],
    'Arunachal Pradesh': [
      'Itanagar', 'Naharlagun', 'Tawang', 'Pasighat', 'Ziro',
      'Bomdila', 'Tezu', 'Namsai',
    ],
    Assam: [
      'Guwahati', 'Dispur', 'Dibrugarh', 'Silchar', 'Jorhat',
      'Nagaon', 'Tinsukia', 'Tezpur', 'Sivasagar', 'Dhubri',
    ],
    Bihar: [
      'Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Purnia',
      'Darbhanga', 'Bihar Sharif', 'Ara', 'Begusarai', 'Katihar',
      'Munger', 'Chapra', 'Sasaram', 'Hajipur',
    ],
    Chhattisgarh: [
      'Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg',
      'Rajnandgaon', 'Raigarh', 'Jagdalpur', 'Ambikapur',
    ],
    Goa: [
      'Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda',
      'Calangute', 'Bicholim',
    ],
    Gujarat: [
      'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar',
      'Bhavnagar', 'Jamnagar', 'Junagadh', 'Anand', 'Bharuch',
      'Navsari', 'Morbi', 'Vapi', 'Mehsana',
    ],
    Haryana: [
      'Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Hisar',
      'Karnal', 'Rohtak', 'Sonipat', 'Panchkula', 'Yamunanagar',
      'Kurukshetra', 'Rewari',
    ],
    'Himachal Pradesh': [
      'Shimla', 'Dharamshala', 'Manali', 'Solan', 'Mandi',
      'Kullu', 'Baddi', 'Nahan', 'Chamba', 'Hamirpur',
    ],
    Jharkhand: [
      'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar',
      'Hazaribagh', 'Giridih', 'Ramgarh', 'Dumka', 'Chaibasa',
    ],
    Karnataka: [
      'Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Dharwad',
      'Belagavi', 'Kalaburagi', 'Davangere', 'Ballari', 'Shivamogga',
      'Tumakuru', 'Udupi', 'Hassan', 'Vijayapura',
    ],
    Kerala: [
      'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur',
      'Kannur', 'Alappuzha', 'Palakkad', 'Kottayam', 'Malappuram',
      'Kasaragod',
    ],
    'Madhya Pradesh': [
      'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain',
      'Sagar', 'Satna', 'Ratlam', 'Rewa', 'Dewas',
      'Burhanpur', 'Chhindwara', 'Morena', 'Khandwa',
    ],
    Maharashtra: [
      'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane',
      'Navi Mumbai', 'Aurangabad', 'Kolhapur', 'Solapur', 'Amravati',
      'Nanded', 'Sangli', 'Jalgaon', 'Akola', 'Latur',
      'Ahmednagar', 'Satara', 'Ratnagiri',
    ],
    Manipur: [
      'Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul',
    ],
    Meghalaya: [
      'Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Williamnagar', 'Baghmara',
    ],
    Mizoram: [
      'Aizawl', 'Lunglei', 'Champhai', 'Kolasib', 'Serchhip', 'Lawngtlai',
    ],
    Nagaland: [
      'Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Mon',
    ],
    Odisha: [
      'Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Puri',
      'Sambalpur', 'Balasore', 'Baripada', 'Jharsuguda', 'Angul',
      'Bargarh', 'Koraput',
    ],
    Punjab: [
      'Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala',
      'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Moga',
      'Firozpur', 'Batala',
    ],
    Rajasthan: [
      'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer',
      'Bikaner', 'Alwar', 'Bharatpur', 'Sikar', 'Sri Ganganagar',
      'Bhilwara', 'Chittorgarh', 'Jaisalmer', 'Pushkar',
    ],
    Sikkim: [
      'Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Ravangla',
    ],
    'Tamil Nadu': [
      'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
      'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Tirunelveli',
      'Thanjavur', 'Dindigul', 'Nagercoil', 'Kanchipuram', 'Ooty', 'Hosur',
    ],
    Telangana: [
      'Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam',
      'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet',
    ],
    Tripura: [
      'Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Ambassa',
    ],
    'Uttar Pradesh': [
      'Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj',
      'Ghaziabad', 'Noida', 'Meerut', 'Bareilly', 'Aligarh',
      'Moradabad', 'Gorakhpur', 'Mathura', 'Ayodhya', 'Jhansi',
      'Firozabad', 'Saharanpur', 'Muzaffarnagar',
    ],
    Uttarakhand: [
      'Dehradun', 'Haridwar', 'Rishikesh', 'Haldwani', 'Nainital',
      'Roorkee', 'Rudrapur', 'Almora', 'Mussoorie', 'Kashipur',
      'Pithoragarh', 'Srinagar',
    ],
    'West Bengal': [
      'Kolkata', 'Howrah', 'Siliguri', 'Durgapur', 'Asansol',
      'Kharagpur', 'Bardhaman', 'Malda', 'Berhampore', 'Haldia',
      'Darjeeling', 'Jalpaiguri', 'Raiganj',
    ],
  },
};

async function main() {
  console.log('Seeding India location data...');

  const country = await prisma.country.upsert({
    where: { name: india.name },
    update: {},
    create: { name: india.name },
  });

  console.log(`✓ Country: ${country.name}`);

  for (const [stateName, cities] of Object.entries(india.states)) {
    const existingState = await prisma.state.findUnique({
      where: { name_countryId: { name: stateName, countryId: country.countryId } },
    });

    if (!existingState) {
      const state = await prisma.state.create({
        data: {
          name: stateName,
          countryId: country.countryId,
          cities: {
            create: cities.map(name => ({ name })),
          },
        },
      });
      console.log(`✓ ${stateName}: ${cities.length} cities`);
    } else {
      const existingCities = await prisma.city.findMany({
        where: { stateId: existingState.stateId },
        select: { name: true },
      });
      const existingCityNames = new Set(existingCities.map(c => c.name));
      const newCities = cities.filter(c => !existingCityNames.has(c));

      if (newCities.length > 0) {
        await prisma.city.createMany({
          data: newCities.map(name => ({ name, stateId: existingState.stateId })),
          skipDuplicates: true,
        });
        console.log(`✓ ${stateName}: ${newCities.length} new cities (${existingCityNames.size} already exist)`);
      } else {
        console.log(`✓ ${stateName}: ${cities.length} cities (already seeded)`);
      }
    }
  }

  console.log('\nIndia location seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
