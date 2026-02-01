// Sistema de autenticación con Firebase
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Sistema de autenticación con Firebase iniciado');
    
    // Elementos del DOM
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const authModal = document.getElementById('authModal');
    const modalClose = document.getElementById('modalClose');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const authStatus = document.getElementById('authStatus');
    const authLink = document.getElementById('authLink');
    const classifiedsControls = document.getElementById('classifiedsControls');
    const userInfo = document.getElementById('userInfo');
    
    // Estado
    let currentUser = null;
    
    // Inicializar
    checkAuth();
    setupEventListeners();
    
    // Configurar event listeners
    function setupEventListeners() {
        console.log('Configurando event listeners...');
        
        // Botones de autenticación
        loginBtn.addEventListener('click', () => {
            openAuthModal('login');
        });
        
        signupBtn.addEventListener('click', () => {
            openAuthModal('register');
        });
        
        authLink?.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal('login');
        });
        
        // Cerrar modal
        modalClose.addEventListener('click', closeAuthModal);
        
        window.addEventListener('click', (e) => {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
        
        // Cambiar entre pestañas
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = tab.getAttribute('data-tab');
                switchAuthTab(tabType);
            });
        });
        
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthTab('register');
        });
        
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthTab('login');
        });
        
        // Formularios
        loginForm.addEventListener('submit', handleLogin);
        registerForm.addEventListener('submit', handleRegister);
        
        // Escuchar cambios en autenticación
        if (window.firebaseAuth) {
            window.firebaseAuth.onAuthStateChanged(async (user) => {
                if (user) {
                    await loadUserData(user.uid);
                } else {
                    currentUser = null;
                    updateAuthUI();
                    notifyAuthChange();
                }
            });
        }
    }
    
    // Verificar autenticación al cargar
    async function checkAuth() {
        console.log('Verificando autenticación...');
        
        if (!window.firebaseAuth) {
            console.error('Firebase Auth no está disponible');
            return;
        }
        
        const user = window.firebaseAuth.currentUser;
        
        if (user) {
            console.log('Usuario autenticado:', user.email);
            await loadUserData(user.uid);
        } else {
            console.log('No hay usuario autenticado');
            updateAuthUI();
        }
    }
    
    // Cargar datos del usuario desde Firestore
    async function loadUserData(userId) {
        console.log('Cargando datos del usuario:', userId);
        
        try {
            if (!window.firebaseDB) {
                console.error('Firestore no disponible');
                return;
            }
            
            const userDoc = await window.firebaseDB.collection('usuarios').doc(userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                currentUser = {
                    id: userId,
                    name: userData.nombre,
                    email: userData.email,
                    isSubscribed: userData.es_suscrito || false,
                    isAdmin: userData.es_admin || false
                };
                
                console.log('Datos del usuario cargados:', currentUser);
            } else {
                // Si no existe documento, crear uno básico
                const authUser = window.firebaseAuth.currentUser;
                if (authUser) {
                    await createUserInFirestore(authUser);
                    await loadUserData(userId); // Recargar
                }
            }
            
            updateAuthUI();
            notifyAuthChange();
            
        } catch (error) {
            console.error('Error cargando usuario:', error);
        }
    }
    
    // Crear usuario en Firestore
    async function createUserInFirestore(authUser) {
        console.log('Creando usuario en Firestore:', authUser.email);
        
        try {
            const userData = {
                nombre: authUser.displayName || authUser.email.split('@')[0],
                email: authUser.email,
                es_suscrito: false,
                es_admin: false,
                fecha_registro: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await window.firebaseDB.collection('usuarios').doc(authUser.uid).set(userData);
            console.log('Usuario creado en Firestore');
            
        } catch (error) {
            console.error('Error creando usuario en Firestore:', error);
        }
    }
    
    // Manejar login
    async function handleLogin(e) {
        e.preventDefault();
        console.log('Procesando login...');
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showNotification('Por favor, ingresa email y contraseña', 'error');
            return;
        }
        
        try {
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            console.log('Login exitoso:', userCredential.user.email);
            
            closeAuthModal();
            showNotification(`¡Bienvenido de nuevo!`, 'success');
            
            // Recargar datos del usuario
            await loadUserData(userCredential.user.uid);
            
        } catch (error) {
            console.error('Error en login:', error);
            showNotification(getFirebaseErrorMessage(error), 'error');
        }
    }
    
    // Manejar registro
    async function handleRegister(e) {
        e.preventDefault();
        console.log('Procesando registro...');
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Validaciones
        if (password !== confirmPassword) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        if (!name || !email) {
            showNotification('Por favor, completa todos los campos', 'error');
            return;
        }
        
        try {
            // 1. Crear usuario en Authentication
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            console.log('Usuario creado en Auth:', userCredential.user.uid);
            
            // 2. Actualizar perfil con nombre
            await userCredential.user.updateProfile({
                displayName: name
            });
            
            // 3. Crear documento en Firestore
            await window.firebaseDB.collection('usuarios').doc(userCredential.user.uid).set({
                nombre: name,
                email: email,
                es_suscrito: false,
                es_admin: false,
                fecha_registro: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Usuario creado en Firestore');
            
            // 4. Cargar datos del usuario
            await loadUserData(userCredential.user.uid);
            
            closeAuthModal();
            showNotification(`¡Cuenta creada exitosamente! Bienvenido, ${name}.`, 'success');
            
            // Limpiar formulario
            registerForm.reset();
            
        } catch (error) {
            console.error('Error en registro:', error);
            showNotification(getFirebaseErrorMessage(error), 'error');
        }
    }
    
    // Obtener mensaje de error amigable de Firebase
    function getFirebaseErrorMessage(error) {
        const errorMessages = {
            'auth/email-already-in-use': 'Este email ya está registrado',
            'auth/invalid-email': 'Email inválido',
            'auth/operation-not-allowed': 'El registro no está habilitado',
            'auth/weak-password': 'La contraseña es demasiado débil',
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
            'auth/network-request-failed': 'Error de red. Verifica tu conexión'
        };
        
        return errorMessages[error.code] || error.message || 'Error de autenticación';
    }
    
    // Cerrar sesión
    async function logout() {
        console.log('Cerrando sesión...');
        
        try {
            await window.firebaseAuth.signOut();
            currentUser = null;
            updateAuthUI();
            showNotification('Has cerrado sesión correctamente', 'info');
            notifyAuthChange();
            
            // Recargar página para limpiar estado
            setTimeout(() => {
                location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            showNotification('Error al cerrar sesión', 'error');
        }
    }
    
    // Funciones de UI
    function openAuthModal(tab = 'login') {
        authModal.classList.add('active');
        switchAuthTab(tab);
    }
    
    function closeAuthModal() {
        authModal.classList.remove('active');
        loginForm.reset();
        registerForm.reset();
    }
    
    function switchAuthTab(tabType) {
        authTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabType) {
                tab.classList.add('active');
            }
        });
        
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => {
            form.classList.remove('active');
            if (form.id === `${tabType}Form`) {
                form.classList.add('active');
            }
        });
    }
    
    function updateAuthUI() {
        console.log('Actualizando UI de autenticación...');
        
        if (currentUser) {
            // Usuario autenticado
            if (authStatus) {
                authStatus.innerHTML = `
                    <p>Bienvenido, <strong>${currentUser.name}</strong>! 
                    <a href="#" id="logoutLink">Cerrar sesión</a></p>
                `;
                
                // Agregar evento para cerrar sesión
                setTimeout(() => {
                    const logoutLink = document.getElementById('logoutLink');
                    if (logoutLink) {
                        logoutLink.addEventListener('click', async (e) => {
                            e.preventDefault();
                            await logout();
                        });
                    }
                }, 100);
            }
            
            // Mostrar controles de clasificados si está suscrito
            if (classifiedsControls) {
                classifiedsControls.style.display = currentUser.isSubscribed ? 'flex' : 'none';
            }
            
            if (userInfo) {
                userInfo.textContent = `Usuario: ${currentUser.name}`;
            }
            
            // Actualizar botones de usuario
            loginBtn.textContent = 'Mi Cuenta';
            loginBtn.onclick = () => {
                showNotification(`Logueado como: ${currentUser.name}`, 'info');
            };
            
            signupBtn.textContent = 'Cerrar Sesión';
            signupBtn.onclick = async () => {
                await logout();
            };
            
        } else {
            // Usuario no autenticado
            if (authStatus) {
                authStatus.innerHTML = `<p>Debes <a href="#" id="authLink">iniciar sesión</a> para publicar clasificados.</p>`;
            }
            
            if (classifiedsControls) {
                classifiedsControls.style.display = 'none';
            }
            
            // Restaurar botones originales
            loginBtn.textContent = 'Iniciar Sesión';
            loginBtn.onclick = () => openAuthModal('login');
            
            signupBtn.textContent = 'Registrarse';
            signupBtn.onclick = () => openAuthModal('register');
        }
    }
    
    // Notificar cambios en autenticación
    function notifyAuthChange() {
        const authChangeEvent = new CustomEvent('authChange', {
            detail: { user: currentUser }
        });
        window.dispatchEvent(authChangeEvent);
    }
    
    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background-color: ${type === 'success' ? '#26a269' : type === 'error' ? '#e74c3c' : '#1a5fb4'};
            color: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 500px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Botón para cerrar
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        });
        
        // Auto-eliminar
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
        
        // Agregar animaciones CSS si no existen
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    margin-left: 15px;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Inicializar
    console.log('✅ Sistema de autenticación listo');
});