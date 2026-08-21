const seedDatabase = async () => {
  console.log('[Database Seed] Populating initial enterprise database...');

  const initialUsers = [
    { id: 'usr-student-1', name: 'Ananya Sharma', email: 'ananya@student.uom.edu', role: 'student' },
    { id: 'usr-auth-1', name: 'Dean Dr. P. Mehta', email: 'mehta@uom.edu', role: 'college_authority' },
    { id: 'usr-patrol-1', name: 'Captain R. Verma', email: 'verma@security.uom.edu', role: 'security_team' },
    { id: 'usr-admin-1', name: 'Super Administrator', email: 'admin@saferoute.org', role: 'super_admin' }
  ];

  const initialColleges = [
    {
      id: 'col-uom',
      name: 'University of Mumbai',
      shortName: 'UoM',
      city: 'Mumbai',
      state: 'Maharashtra',
      campuses: [
        { id: 'camp-uom-fort', name: 'Fort Campus', latitude: 18.9298, longitude: 72.8333, radius: 800 },
        { id: 'camp-uom-kalina', name: 'Kalina Campus', latitude: 19.0734, longitude: 72.8631, radius: 1200 }
      ]
    }
  ];

  console.log(`[Database Seed] Successfully seeded ${initialUsers.length} users and ${initialColleges.length} colleges.`);
};

seedDatabase();
