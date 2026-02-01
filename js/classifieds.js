// Sistema de gestión de clasificados con Firebase
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Sistema de clasificados con Firebase iniciado');
    
    // Elementos del DOM
    const addClassifiedBtn = document.getElementById('addClassifiedBtn');
    const classifiedFormContainer = document.getElementById('classifiedFormContainer');
    const classifiedForm = document.getElementById('classifiedForm');
    const cancelFormBtn = document.getElementById('cancelFormBtn');
    const classifiedsGrid = document.getElementById('classifiedsGrid');
    const authStatus = document.getElementById('authStatus');
    const classifiedsControls = document.getElementById('classifiedsControls');
    const userInfo = document.getElementById('userInfo');
    
    // Estado
    let isEditing = false;
    let currentEditingId = null;
    let currentUser = null;
    
    // Inicializar
    initClassifieds();
    
    async function initClassifieds() {
        console.log('Inicializando sistema de clasificados...');
        
        // Configurar event listeners
        setupEventListeners();
        
        // Escuchar cambios en autenticación
        window.addEventListener('authChange', (e) => {
            console.log('🔔 Evento authChange recibido en clasificados');
            currentUser = e.detail?.user || null;
            updateUI();
            loadClassifieds();
        });
        
        // Cargar inicialmente
        await updateUI();
        await loadClassifieds();
    }
    
    // Configurar event listeners
    function setupEventListeners() {
        console.log('Configurando event listeners de clasificados...');
        
        // BOTÓN "PUBLICAR NUEVO ARTÍCULO"
        if (addClassifiedBtn) {
            console.log('✅ Botón addClassifiedBtn encontrado');
            addClassifiedBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🎯 ¡BOTÓN "Publicar Nuevo Artículo" CLICKEADO!');
                handleAddClassifiedClick();
            });
        } else {
            console.error('❌ ERROR: addClassifiedBtn NO encontrado!');
        }
        
        // BOTÓN "CANCELAR"
        if (cancelFormBtn) {
            cancelFormBtn.addEventListener('click', function(e) {
                e.preventDefault();
                hideForm();
                resetForm();
            });
        }
        
        // FORMULARIO
        if (classifiedForm) {
            classifiedForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                console.log('📝 Formulario de clasificado enviado');
                await saveClassified();
            });
        }
    }
    
    // Manejar clic en "Publicar Nuevo Artículo"
    function handleAddClassifiedClick() {
        console.log('🔄 Manejando clic en Publicar Nuevo Artículo...');
        console.log('Usuario actual:', currentUser);
        
        // 1. Verificar si el usuario está autenticado
        if (!currentUser) {
            console.log('❌ Usuario no autenticado');
            alert('🔒 Debes iniciar sesión para publicar clasificados.\n\nHaz clic en "Iniciar Sesión" en la esquina superior derecha.');
            return;
        }
        
        // 2. Verificar si el usuario está suscrito
        if (!currentUser.isSubscribed) {
            console.log('⚠️ Usuario no suscrito');
            alert('📢 Debes suscribirte para publicar clasificados.\n\nVe a la sección "Suscribirse" y completa el formulario.');
            
            // Desplazar a la sección de suscripción
            const suscribirseSection = document.getElementById('suscribirse');
            if (suscribirseSection) {
                suscribirseSection.scrollIntoView({ behavior: 'smooth' });
            }
            return;
        }
        
        // 3. Mostrar el formulario
        console.log('✅ Usuario válido, mostrando formulario...');
        showForm();
    }
    
    // Mostrar formulario
    function showForm(classified = null) {
        console.log('📄 Mostrando formulario de clasificado...');
        
        if (!classifiedFormContainer) {
            console.error('❌ ERROR: classifiedFormContainer no encontrado');
            return;
        }
        
        // Mostrar el contenedor del formulario
        classifiedFormContainer.style.display = 'block';
        
        // Desplazar a la vista del formulario
        classifiedFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        if (classified) {
            // Modo edición
            isEditing = true;
            currentEditingId = classified.id;
            console.log('✏️ Modo edición para clasificado ID:', classified.id);
            
            document.getElementById('classifiedTitle').value = classified.titulo;
            document.getElementById('classifiedCategory').value = classified.categoria;
            document.getElementById('classifiedDescription').value = classified.descripcion;
            document.getElementById('classifiedPrice').value = classified.precio || '';
            document.getElementById('classifiedImage').value = classified.imagen_url || '';
            
            // Cambiar título
            classifiedFormContainer.querySelector('h3').textContent = 'Editar Clasificado';
        } else {
            // Modo creación
            console.log('🆕 Modo creación de nuevo clasificado');
            resetForm();
        }
    }
    
    // Ocultar formulario
    function hideForm() {
        if (classifiedFormContainer) {
            classifiedFormContainer.style.display = 'none';
        }
    }
    
    // Reiniciar formulario
    function resetForm() {
        isEditing = false;
        currentEditingId = null;
        
        if (classifiedForm) {
            classifiedForm.reset();
        }
        
        if (classifiedFormContainer) {
            classifiedFormContainer.querySelector('h3').textContent = 'Publicar Nuevo Clasificado';
        }
    }
    
    // Guardar clasificado
    async function saveClassified() {
        console.log('💾 Guardando clasificado...');
        
        // Obtener datos del formulario
        const titulo = document.getElementById('classifiedTitle').value.trim();
        const categoria = document.getElementById('classifiedCategory').value;
        const descripcion = document.getElementById('classifiedDescription').value.trim();
        const precio = document.getElementById('classifiedPrice').value;
        const imagen_url = document.getElementById('classifiedImage').value.trim();
        
        // Validaciones
        if (!titulo) {
            alert('❌ El título es obligatorio');
            return;
        }
        
        if (!categoria) {
            alert('❌ La categoría es obligatoria');
            return;
        }
        
        if (!descripcion) {
            alert('❌ La descripción es obligatoria');
            return;
        }
        
        // Verificar usuario
        if (!currentUser) {
            alert('❌ Sesión expirada. Vuelve a iniciar sesión.');
            return;
        }
        
        if (!currentUser.isSubscribed) {
            alert('❌ Debes estar suscrito para publicar clasificados.');
            return;
        }
        
        try {
            const classifiedData = {
                titulo,
                categoria,
                descripcion,
                precio: precio ? parseFloat(precio) : null,
                imagen_url: imagen_url || null,
                usuario_id: currentUser.id,
                nombre_usuario: currentUser.name,
                email_usuario: currentUser.email,
                activo: true,
                fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (isEditing && currentEditingId) {
                // EDITAR clasificado existente
                // Verificar que el usuario es el dueño
                const doc = await window.firebaseDB.collection('clasificados')
                    .doc(currentEditingId)
                    .get();
                
                if (!doc.exists) {
                    alert('❌ Clasificado no encontrado');
                    return;
                }
                
                if (doc.data().usuario_id !== currentUser.id) {
                    alert('❌ No tienes permiso para editar este clasificado');
                    return;
                }
                
                await window.firebaseDB.collection('clasificados')
                    .doc(currentEditingId)
                    .update(classifiedData);
                
                console.log('✅ Clasificado actualizado exitosamente');
                alert('✅ Clasificado actualizado exitosamente');
                
            } else {
                // CREAR nuevo clasificado
                classifiedData.fecha_creacion = firebase.firestore.FieldValue.serverTimestamp();
                
                await window.firebaseDB.collection('clasificados')
                    .add(classifiedData);
                
                console.log('✅ Clasificado creado exitosamente');
                alert('✅ Clasificado publicado exitosamente');
            }
            
            // Actualizar la vista
            await loadClassifieds();
            hideForm();
            resetForm();
            
        } catch (error) {
            console.error('Error en saveClassified:', error);
            alert('❌ Error al guardar el clasificado: ' + error.message);
        }
    }
    
    // Cargar clasificados desde Firestore
    async function loadClassifieds() {
        console.log('🔄 Cargando clasificados desde Firestore...');
        
        if (!classifiedsGrid) {
            console.error('❌ ERROR: classifiedsGrid no encontrado');
            return;
        }
        
        if (!window.firebaseDB) {
            console.error('❌ Firestore no disponible');
            return;
        }
        
        try {
            let query = window.firebaseDB.collection('clasificados')
                .orderBy('fecha_creacion', 'desc');
            
            // Si el usuario no está suscrito, solo mostrar sus propios clasificados
            if (currentUser && !currentUser.isSubscribed) {
                query = query.where('usuario_id', '==', currentUser.id);
            }
            
            const snapshot = await query.get();
            
            if (snapshot.empty) {
                showNoClassifiedsMessage();
                return;
            }
            
            const clasificados = [];
            snapshot.forEach(doc => {
                clasificados.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📋 ${clasificados.length} clasificados cargados`);
            renderClassifiedsGrid(clasificados);
            
        } catch (error) {
            console.error('Error en loadClassifieds:', error);
            showNoClassifiedsMessage();
        }
    }
    
    // Mostrar mensaje cuando no hay clasificados
    function showNoClassifiedsMessage() {
        if (!classifiedsGrid) return;
        
        let message = '';
        
        if (currentUser) {
            if (currentUser.isSubscribed) {
                message = '📭 Aún no hay clasificados publicados. ¡Sé el primero!';
            } else {
                message = '📭 No tienes clasificados publicados aún. ¡Suscríbete para comenzar!';
            }
        } else {
            message = '📭 No hay clasificados publicados. ¡Regístrate y suscríbete para comenzar!';
        }
        
        classifiedsGrid.innerHTML = `
            <div class="no-classifieds">
                <p>${message}</p>
            </div>
        `;
    }
    
    // Renderizar grid de clasificados
    function renderClassifiedsGrid(clasificadosList) {
        if (!classifiedsGrid) return;
        
        // Generar HTML para los clasificados
        let html = '';
        
        clasificadosList.forEach(clasificado => {
            const fecha = clasificado.fecha_creacion?.toDate 
                ? clasificado.fecha_creacion.toDate().toLocaleDateString('es-ES')
                : 'Fecha no disponible';
            
            const canEdit = currentUser && 
                           currentUser.isSubscribed && 
                           currentUser.id === clasificado.usuario_id;
            
            html += `
                <div class="classified-item" data-id="${clasificado.id}">
                    <div class="classified-image">
                        ${clasificado.imagen_url ? 
                            `<img src="${clasificado.imagen_url}" alt="${clasificado.titulo}" loading="lazy" 
                                  style="width:100%; height:100%; object-fit:cover;">` : 
                            `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#666;">
                                <i class="fas fa-image fa-3x"></i>
                                <p style="margin-top:10px; font-size:14px;">Sin imagen</p>
                            </div>`
                        }
                    </div>
                    <div class="classified-details">
                        <h4 class="classified-title">${clasificado.titulo}</h4>
                        <span class="classified-category">${getCategoryLabel(clasificado.categoria)}</span>
                        <p class="classified-description">${clasificado.descripcion}</p>
                        
                        ${clasificado.precio ? `
                            <p class="classified-price">$${parseFloat(clasificado.precio).toFixed(2)}</p>
                        ` : ''}
                        
                        <div class="classified-meta">
                            <small><i class="fas fa-user"></i> ${clasificado.nombre_usuario || 'Anónimo'}</small><br>
                            <small><i class="far fa-calendar"></i> ${fecha}</small>
                        </div>
                        
                        ${canEdit ? `
                            <div class="classified-actions">
                                <button class="classified-action-btn edit" onclick="editClassified('${clasificado.id}')">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                <button class="classified-action-btn delete" onclick="deleteClassified('${clasificado.id}')">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        classifiedsGrid.innerHTML = html;
    }
    
    // Obtener etiqueta legible para categoría
    function getCategoryLabel(categoria) {
        const labels = {
            'vehiculos': '🚗 Vehículos',
            'inmuebles': '🏠 Inmuebles',
            'empleos': '💼 Empleos',
            'servicios': '🔧 Servicios',
            'productos': '📦 Productos'
        };
        return labels[categoria] || categoria;
    }
    
    // Actualizar UI
    async function updateUI() {
        console.log('🎨 Actualizando UI de clasificados...');
        
        if (currentUser) {
            // Usuario autenticado
            if (authStatus) {
                authStatus.innerHTML = `
                    <p>👋 Hola, <strong>${currentUser.name}</strong>!</p>
                    ${!currentUser.isSubscribed ? 
                        '<p class="subscription-notice">⚠️ <a href="#suscribirse">Suscríbete</a> para publicar clasificados.</p>' : 
                        '<p class="subscription-notice">✅ ¡Tienes acceso para publicar clasificados!</p>'
                    }
                `;
            }
            
            // Mostrar controles si está suscrito
            if (classifiedsControls) {
                classifiedsControls.style.display = currentUser.isSubscribed ? 'flex' : 'none';
            }
            
            if (userInfo) {
                userInfo.innerHTML = `
                    <div style="font-size:14px;">
                        <strong>${currentUser.name}</strong><br>
                        <span style="color:${currentUser.isSubscribed ? 'green' : 'orange'};">
                            ${currentUser.isSubscribed ? '✅ Suscrito' : '❌ No suscrito'}
                        </span>
                    </div>
                `;
            }
        } else {
            // Usuario no autenticado
            if (authStatus) {
                authStatus.innerHTML = `
                    <p>🔒 Debes <a href="#" id="loginLinkClassifieds">iniciar sesión</a> para publicar clasificados.</p>
                `;
                
                // Agregar event listener al enlace de login
                setTimeout(() => {
                    const loginLink = document.getElementById('loginLinkClassifieds');
                    if (loginLink) {
                        loginLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            if (typeof openAuthModal === 'function') {
                                openAuthModal('login');
                            }
                        });
                    }
                }, 100);
            }
            
            if (classifiedsControls) {
                classifiedsControls.style.display = 'none';
            }
        }
    }
    
    // Editar clasificado (función global)
    window.editClassified = async function(id) {
        console.log('✏️ Editando clasificado:', id);
        
        try {
            const doc = await window.firebaseDB.collection('clasificados')
                .doc(id)
                .get();
            
            if (!doc.exists) {
                alert('❌ Clasificado no encontrado');
                return;
            }
            
            const clasificado = {
                id: doc.id,
                ...doc.data()
            };
            
            // Verificar que el usuario es el dueño
            if (currentUser && currentUser.id === clasificado.usuario_id) {
                showForm(clasificado);
            } else {
                alert('❌ No tienes permiso para editar este clasificado');
            }
        } catch (error) {
            console.error('Error en editClassified:', error);
            alert('❌ Error al cargar el clasificado');
        }
    };
    
    // Eliminar clasificado (función global)
    window.deleteClassified = async function(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este clasificado?')) {
            return;
        }
        
        console.log('🗑️ Eliminando clasificado:', id);
        
        try {
            // Verificar que el usuario es el dueño
            const doc = await window.firebaseDB.collection('clasificados')
                .doc(id)
                .get();
            
            if (!doc.exists) {
                alert('❌ Clasificado no encontrado');
                return;
            }
            
            if (!currentUser || currentUser.id !== doc.data().usuario_id) {
                alert('❌ No tienes permiso para eliminar este clasificado');
                return;
            }
            
            // Eliminar clasificado
            await window.firebaseDB.collection('clasificados')
                .doc(id)
                .delete();
            
            console.log('✅ Clasificado eliminado exitosamente');
            alert('🗑️ Clasificado eliminado exitosamente');
            
            // Recargar clasificados
            await loadClassifieds();
            
        } catch (error) {
            console.error('Error en deleteClassified:', error);
            alert('❌ Error al eliminar el clasificado');
        }
    };
    
    console.log('✅ Sistema de clasificados con Firebase listo');
});