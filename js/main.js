// Funcionalidades generales con Supabase
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Aplicación Noticias Hoy iniciada');
    
    // Menu toggle para móviles
    const menuToggle = document.getElementById('menuToggle');
    const navList = document.getElementById('navList');
    
    menuToggle.addEventListener('click', () => {
        navList.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        if (icon.classList.contains('fa-bars')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    // Cerrar menú al hacer clic en un enlace (en móviles)
    document.querySelectorAll('.nav-list a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navList.classList.remove('active');
                menuToggle.querySelector('i').classList.add('fa-bars');
                menuToggle.querySelector('i').classList.remove('fa-times');
            }
        });
    });
    
        // Sistema de suscripción con Firebase
    const subscriptionForm = document.getElementById('subscriptionForm');
    
    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('=== PROCESANDO SUSCRIPCIÓN ===');
            
            const nombre = document.getElementById('subName').value.trim();
            const email = document.getElementById('subEmail').value.trim();
            const password = document.getElementById('subPassword').value;
            
            // Validaciones
            if (!nombre || !email || !password) {
                alert('❌ Por favor, completa todos los campos.');
                return;
            }
            
            if (password.length < 6) {
                alert('❌ La contraseña debe tener al menos 6 caracteres.');
                return;
            }
            
            try {
                // 1. Crear usuario en Firebase Auth
                const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
                console.log('Usuario creado en Auth:', userCredential.user.uid);
                
                // 2. Actualizar perfil con nombre
                await userCredential.user.updateProfile({
                    displayName: nombre
                });
                
                // 3. Crear documento en Firestore como SUSCRITO
                await window.firebaseDB.collection('usuarios').doc(userCredential.user.uid).set({
                    nombre: nombre,
                    email: email,
                    es_suscrito: true, // ¡IMPORTANTE: true porque se está suscribiendo!
                    es_admin: false,
                    fecha_registro: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // 4. Iniciar sesión automáticamente
                await window.firebaseAuth.signInWithEmailAndPassword(email, password);
                
                // 5. Mostrar mensaje de éxito
                alert(`✅ ¡Felicidades ${nombre}!\n\nTu suscripción ha sido activada exitosamente.\nAhora puedes publicar clasificados.`);
                
                // 6. Limpiar formulario
                subscriptionForm.reset();
                
                // 7. Redirigir a clasificados
                setTimeout(() => {
                    const clasificadosSection = document.getElementById('clasificados');
                    if (clasificadosSection) {
                        clasificadosSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    
                    // 8. Recargar página para actualizar todo
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                }, 2000);
                
            } catch (error) {
                console.error('Error en suscripción:', error);
                
                // Si el usuario ya existe, actualizar suscripción
                if (error.code === 'auth/email-already-in-use') {
                    try {
                        // Intentar iniciar sesión
                        const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
                        
                        // Actualizar a suscrito en Firestore
                        await window.firebaseDB.collection('usuarios')
                            .doc(userCredential.user.uid)
                            .update({
                                es_suscrito: true,
                                nombre: nombre
                            });
                        
                        alert(`✅ ¡Bienvenido de nuevo ${nombre}!\n\nTu suscripción ha sido activada.`);
                        
                        // Recargar página
                        setTimeout(() => {
                            location.reload();
                        }, 1500);
                        
                    } catch (loginError) {
                        alert('❌ Error: Este email ya está registrado. Usa otro email o recupera tu contraseña.');
                    }
                } else {
                    alert('❌ Error al procesar la suscripción: ' + error.message);
                }
            }
        });
    }
    
    // Efecto de scroll suave para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#') return;
            
            e.preventDefault();
            const targetElement = document.querySelector(href);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Actualizar año actual en el footer
    const currentYear = new Date().getFullYear();
    const yearElements = document.querySelectorAll('.current-year');
    
    yearElements.forEach(element => {
        element.textContent = currentYear;
    });
    
    // Efecto de carga para imágenes
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        if (img.complete) return;
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
    });
    
    // Agregar estilos adicionales
    const style = document.createElement('style');
    style.textContent = `
        .news-detail-modal {
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .news-detail-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .news-detail-category {
            background-color: var(--primary-color);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .news-detail-featured {
            background-color: var(--accent-color);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .news-detail-title {
            font-size: 2rem;
            margin-bottom: 15px;
            color: var(--dark-color);
        }
        
        .news-detail-meta {
            display: flex;
            gap: 20px;
            margin-bottom: 25px;
            color: var(--gray-medium);
            font-size: 0.9rem;
        }
        
        .news-detail-meta i {
            margin-right: 5px;
        }
        
        .news-detail-image {
            width: 100%;
            height: 400px;
            margin-bottom: 25px;
            border-radius: var(--border-radius);
            overflow: hidden;
        }
        
        .news-detail-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .news-detail-excerpt {
            font-size: 1.2rem;
            font-weight: 500;
            margin-bottom: 25px;
            color: var(--dark-color);
            line-height: 1.6;
        }
        
        .news-detail-full {
            font-size: 1rem;
            line-height: 1.8;
            color: var(--gray-dark);
            margin-bottom: 25px;
        }
        
        .news-detail-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
            margin-top: 25px;
            padding-top: 25px;
            border-top: 1px solid var(--gray-light);
        }
        
        .news-tag {
            background-color: var(--gray-light);
            color: var(--gray-dark);
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85rem;
        }
        
        .news-featured-badge {
            position: absolute;
            top: 15px;
            right: 15px;
            background-color: var(--accent-color);
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .news-view-link {
            color: var(--dark-color);
            transition: var(--transition);
        }
        
        .news-view-link:hover {
            color: var(--primary-color);
        }
        
        .detailed-stats {
            background-color: white;
            padding: 20px;
            border-radius: var(--border-radius);
            margin-top: 20px;
            box-shadow: var(--shadow);
        }
        
        .detailed-stats h4 {
            margin-top: 20px;
            margin-bottom: 10px;
            color: var(--primary-color);
        }
        
        /* Estilos para clasificados */
        .classified-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .no-classifieds {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px;
            background-color: white;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            font-size: 1.1rem;
            color: var(--gray-dark);
        }
        
        .classified-item {
            background-color: white;
            border-radius: var(--border-radius);
            overflow: hidden;
            box-shadow: var(--shadow);
            transition: var(--transition);
            display: flex;
            flex-direction: column;
        }
        
        .classified-item:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-hover);
        }
        
        .classified-image {
            height: 180px;
            background-color: var(--gray-light);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .classified-details {
            padding: 20px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }
        
        .classified-title {
            font-size: 1.2rem;
            margin-bottom: 10px;
            color: var(--dark-color);
        }
        
        .classified-category {
            display: inline-block;
            background-color: var(--gray-light);
            color: var(--gray-dark);
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            margin-bottom: 10px;
            align-self: flex-start;
        }
        
        .classified-description {
            color: var(--gray-dark);
            margin-bottom: 15px;
            font-size: 0.95rem;
            flex-grow: 1;
        }
        
        .classified-price {
            font-weight: 700;
            color: var(--primary-color);
            font-size: 1.2rem;
            margin-bottom: 15px;
        }
        
        .classified-meta {
            margin-top: 10px;
            font-size: 0.85rem;
            color: var(--gray-medium);
        }
        
        .classified-meta i {
            margin-right: 5px;
        }
        
        .classified-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid var(--gray-light);
        }
        
        .classified-action-btn {
            padding: 8px 15px;
            border-radius: var(--border-radius);
            font-size: 0.9rem;
            cursor: pointer;
            border: none;
            transition: var(--transition);
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .classified-action-btn.edit {
            background-color: var(--accent-color);
            color: white;
        }
        
        .classified-action-btn.delete {
            background-color: #e74c3c;
            color: white;
        }
        
        .classified-action-btn:hover {
            opacity: 0.9;
            transform: translateY(-2px);
        }
        
        /* Notificaciones */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 500px;
            animation: slideIn 0.3s ease;
        }
        
        .notification.success {
            background-color: #26a269;
        }
        
        .notification.error {
            background-color: #e74c3c;
        }
        
        .notification.info {
            background-color: #1a5fb4;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            margin-left: 15px;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Aplicación completamente configurada con Supabase');
});