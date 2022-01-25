const seeder = require('mongoose-seed');
const path = require('path');
const config = require('config');
const bcrypt = require('bcrypt');

seeder.connect(config.DATABASE_URL, () => {
  seeder.loadModels([
    path.join(__dirname, '../models/UserModel'),
  ]);
  seeder.clearModels(['User'], async () => {
    const data = [
      {
        model: 'User',
        documents: [
          {
            status: 'active',
            avatar: null,
            user_name: 'kolithaperera',
            role: 'admin',
            first_name: 'Kolitha',
            last_name: 'Perera',
            email: 'd.kolitha.perera@gmail.com',
            password: await bcrypt.hash('superadmin@123', 2),
            password_reset_request_time: null,
            password_reset_token: null,
          },
          {
            status: 'active',
            avatar: null,
            user_name: 'SuperAdmin',
            role: 'admin',
            first_name: 'Northern',
            last_name: 'Garage',
            email: 'admin@gmail.com',
            password: await bcrypt.hash('sktkmh2b', 2),
            password_reset_request_time: null,
            password_reset_token: null,
          }
        ],
      },
    ];
    seeder.populateModels(data, () => {
      seeder.disconnect();
    });
  });
});
