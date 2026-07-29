const bcrypt = require('bcrypt');
async function run() {
    console.log('Admin:', await bcrypt.compare('admin123', '$2b$10$tZ26UovmY/u7yN/uTk15WeO3Y4C3T.1K9C6bS/B7O.pB8oYyOM7Z2'));
    console.log('Caja:', await bcrypt.compare('caja123', '$2b$10$UoE00K9a56A3n.X7SRE5E.x7T/x23E5S2/S6V62pL4lT.8c/D/6h.'));
    console.log('Admin123 hashed:', await bcrypt.hash('admin123', 10));
}
run();
