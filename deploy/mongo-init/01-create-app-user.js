// Se ejecuta SOLO la primera vez que arranca Mongo con el volumen vacío.
// Crea un usuario de aplicación (sin permisos de admin) con acceso únicamente a la base del backend.
// Se crea en la base "admin" porque tu código conecta con ?authSource=admin.
const user = process.env.MONGO_APP_USER;
const pwd = process.env.MONGO_APP_PASSWORD;
const dbName = process.env.MONGODB_DB_NAME;

db.getSiblingDB("admin").createUser({
  user: user,
  pwd: pwd,
  roles: [{ role: "readWrite", db: dbName }],
});
print("Usuario de aplicacion '" + user + "' creado con readWrite sobre '" + dbName + "'");
