// Configuración de Firebase - REEMPLAZA CON TUS DATOS
const firebaseConfig = {
  apiKey: "AIzaSyAmAiojYec0tD0guJnEgv2QkqBtJDPN32g",
  authDomain: "noticias-54c26.firebaseapp.com",
  projectId: "noticias-54c26",
  storageBucket: "noticias-54c26.firebasestorage.app",
  messagingSenderId: "734879267904",
  appId: "1:734879267904:web:d0dcd233e82686f551f3a5"
};

// Inicializar Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Inicializar servicios
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage ? firebase.storage() : null;

// Exportar
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseStorage = storage;

console.log('✅ Firebase configurado correctamente');
console.log('Proyecto:', firebaseConfig.projectId);

// Crear usuario admin por defecto si no existe
async function createDefaultAdmin() {
  try {
    // Verificar si ya existe admin@noticiashoy.com
    const methods = await auth.fetchSignInMethodsForEmail('admin@noticiashoy.com');
    
    if (methods.length === 0) {
      // Crear usuario en Authentication
      const userCredential = await auth.createUserWithEmailAndPassword(
        'admin@noticiashoy.com',
        'admin123'
      );
      
      // Crear documento en Firestore
      await db.collection('usuarios').doc(userCredential.user.uid).set({
        nombre: 'Administrador',
        email: 'admin@noticiashoy.com',
        es_suscrito: true,
        es_admin: true,
        fecha_registro: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Usuario administrador creado');
    }
  } catch (error) {
    console.log('Usuario admin ya existe o error:', error.message);
  }
}

// Ejecutar después de inicializar
setTimeout(createDefaultAdmin, 2000);