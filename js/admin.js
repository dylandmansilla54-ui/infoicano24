// Sistema de administración de noticias con Firebase
document.addEventListener('DOMContentLoaded', function() {
    console.log('📰 Sistema de administración con Firebase iniciado');
    
    // Elementos del DOM
    const adminControls = document.getElementById('adminControls');
    const adminInfo = document.getElementById('adminInfo');
    const addNewsBtn = document.getElementById('addNewsBtn');
    const newsFormContainer = document.getElementById('newsFormContainer');
    const newsForm = document.getElementById('newsForm');
    const cancelNewsBtn = document.getElementById('cancelNewsBtn');
    const deleteNewsBtn = document.getElementById('deleteNewsBtn');
    const newsSubmitBtn = document.getElementById('newsSubmitBtn');
    const newsGrid = document.getElementById('newsGrid');
    const excerptCount = document.getElementById('excerptCount');
    const newsExcerpt = document.getElementById('newsExcerpt');
    const adminPanel = document.getElementById('adminPanel');
    const adminStats = document.getElementById('adminStats');
    
    // Estado
    let isEditingNews = false;
    let currentEditingNewsId = null;
    let isAdmin = false;
    let currentUser = null;
    
    // Inicializar
    checkAdminStatus();
    loadNews();
    setupEventListeners();
    
    // Configurar event listeners
    function setupEventListeners() {
        console.log('Configurando event listeners de administración...');
        
        // Botón "Nueva Noticia"
        if (addNewsBtn) {
            addNewsBtn.addEventListener('click', () => {
                console.log('Botón Nueva Noticia clickeado');
                showNewsForm();
            });
        }
        
        // Botón "Cancelar"
        if (cancelNewsBtn) {
            cancelNewsBtn.addEventListener('click', () => {
                hideNewsForm();
                resetNewsForm();
            });
        }
        
        // Botón "Eliminar Noticia"
        if (deleteNewsBtn) {
            deleteNewsBtn.addEventListener('click', async () => {
                if (currentEditingNewsId) {
                    if (confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
                        await deleteNews(currentEditingNewsId);
                    }
                }
            });
        }
        
        // Formulario de noticia
        if (newsForm) {
            newsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('Formulario de noticia enviado');
                await saveNews();
            });
        }
        
        // Contador de caracteres
        if (newsExcerpt) {
            newsExcerpt.addEventListener('input', () => {
                if (excerptCount) {
                    excerptCount.textContent = newsExcerpt.value.length;
                }
            });
        }
        
        // Escuchar cambios en autenticación
        window.addEventListener('authChange', (e) => {
            console.log('Evento authChange en admin.js');
            currentUser = e.detail?.user || null;
            checkAdminStatus();
            loadNews();
        });
        
        // Cargar usuario actual
        setTimeout(() => {
            loadCurrentUser();
        }, 1000);
    }
    
    // Cargar usuario actual
    async function loadCurrentUser() {
        if (window.firebaseAuth) {
            const user = window.firebaseAuth.currentUser;
            if (user) {
                await checkAdminStatus();
            }
        }
    }
    
    // Verificar si el usuario es administrador
    async function checkAdminStatus() {
        console.log('Verificando estado de administrador...');
        
        if (!currentUser) {
            console.log('No hay usuario actual');
            isAdmin = false;
            updateAdminUI();
            return;
        }
        
        if (currentUser.isAdmin) {
            isAdmin = true;
            console.log('✅ Usuario es administrador:', currentUser.name);
            updateAdminUI();
        } else {
            isAdmin = false;
            console.log('❌ Usuario NO es administrador');
            updateAdminUI();
        }
    }
    
    // Actualizar UI de administración
    function updateAdminUI() {
        if (isAdmin) {
            if (adminControls) {
                adminControls.style.display = 'flex';
                adminInfo.textContent = `Modo Administrador: ${currentUser?.name || 'Admin'}`;
            }
            if (adminPanel) {
                adminPanel.style.display = 'block';
                loadAdminStats();
            }
        } else {
            if (adminControls) {
                adminControls.style.display = 'none';
            }
            if (adminPanel) {
                adminPanel.style.display = 'none';
            }
        }
    }
    
    // Cargar noticias desde Firestore
    async function loadNews() {
        console.log('Cargando noticias desde Firestore...');
        
        if (!window.firebaseDB) {
            console.error('Firestore no disponible');
            return;
        }
        
        try {
            const snapshot = await window.firebaseDB.collection('noticias')
                .orderBy('fecha_creacion', 'desc')
                .get();
            
            if (snapshot.empty) {
                console.log('No hay noticias, cargando ejemplos...');
                await loadSampleNews();
                return;
            }
            
            const noticias = [];
            snapshot.forEach(doc => {
                noticias.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📰 ${noticias.length} noticias cargadas`);
            renderNewsGrid(noticias);
            
        } catch (error) {
            console.error('Error cargando noticias:', error);
        }
    }
    
    // Cargar noticias de ejemplo
    async function loadSampleNews() {
        console.log('Cargando noticias de ejemplo...');
        
        const sampleNews = [
            {
                titulo: 'Avances en inteligencia artificial revolucionan la medicina',
                categoria: 'tecnologia',
                resumen: 'Nuevos algoritmos de IA permiten diagnósticos más precisos y tratamientos personalizados para enfermedades complejas.',
                contenido: 'Investigadores de varias universidades han desarrollado algoritmos de inteligencia artificial capaces de analizar imágenes médicas con una precisión del 98%, superando incluso a especialistas humanos en algunos casos. Esta tecnología promete reducir los tiempos de diagnóstico y mejorar la precisión de los tratamientos.',
                imagen_url: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
                autor: 'Carlos Méndez',
                etiquetas: ['tecnologia', 'salud', 'innovación'],
                es_destacada: true,
                vistas: 1250,
                creado_por: 'admin@noticiashoy.com'
            },
            {
                titulo: 'País alcanza récord en generación de energía renovable',
                categoria: 'medio-ambiente',
                resumen: 'Las fuentes renovables proporcionaron el 45% de la electricidad nacional el mes pasado, marcando un hito histórico.',
                contenido: 'Según el último informe del Ministerio de Energía, la generación de energía a partir de fuentes renovables alcanzó un máximo histórico del 45% durante el mes pasado. Este logro se debe principalmente a la expansión de parques eólicos y solares en el norte del país.',
                imagen_url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
                autor: 'Ana López',
                etiquetas: ['medio ambiente', 'energía', 'sostenibilidad'],
                es_destacada: false,
                vistas: 890,
                creado_por: 'admin@noticiashoy.com'
            }
        ];
        
        try {
            const batch = window.firebaseDB.batch();
            
            sampleNews.forEach((noticia, index) => {
                const docRef = window.firebaseDB.collection('noticias').doc();
                batch.set(docRef, {
                    ...noticia,
                    fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
                    fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            await batch.commit();
            console.log('✅ Noticias de ejemplo creadas');
            await loadNews();
            
        } catch (error) {
            console.error('Error creando noticias de ejemplo:', error);
        }
    }
    
    // Renderizar grid de noticias
    function renderNewsGrid(noticiasList) {
        if (!newsGrid) {
            console.error('Elemento newsGrid no encontrado');
            return;
        }
        
        // Separar noticias destacadas
        const featuredNews = noticiasList.filter(noticia => noticia.es_destacada);
        const regularNews = noticiasList.filter(noticia => !noticia.es_destacada);
        
        let html = '';
        
        // Noticia destacada (solo una)
        if (featuredNews.length > 0) {
            const featured = featuredNews[0];
            html += createNewsCard(featured, true);
        }
        
        // Noticias regulares
        regularNews.forEach(noticia => {
            html += createNewsCard(noticia, false);
        });
        
        newsGrid.innerHTML = html;
        
        // Agregar eventos a los botones de administración
        if (isAdmin) {
            document.querySelectorAll('.news-admin-btn.edit').forEach(btn => {
                btn.addEventListener('click', function() {
                    const newsId = this.closest('.news-card').dataset.id;
                    console.log('Editando noticia:', newsId);
                    editNews(newsId);
                });
            });
            
            document.querySelectorAll('.news-admin-btn.delete').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const newsId = this.closest('.news-card').dataset.id;
                    console.log('Eliminando noticia:', newsId);
                    
                    if (confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
                        await deleteNews(newsId);
                    }
                });
            });
        }
    }
    
    // Crear tarjeta de noticia
    function createNewsCard(noticia, isFeatured) {
        const date = noticia.fecha_creacion?.toDate 
            ? noticia.fecha_creacion.toDate().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            : 'Fecha no disponible';
        
        const categoryLabels = {
            'tecnologia': 'Tecnología',
            'medio-ambiente': 'Medio Ambiente',
            'economia': 'Economía',
            'politica': 'Política',
            'deportes': 'Deportes',
            'cultura': 'Cultura',
            'salud': 'Salud',
            'internacional': 'Internacional'
        };
        
        const categoryLabel = categoryLabels[noticia.categoria] || noticia.categoria;
        
        return `
            <article class="news-card ${isFeatured ? 'featured' : ''}" data-id="${noticia.id}">
                <div class="news-image">
                    <img src="${noticia.imagen_url}" alt="${noticia.titulo}" loading="lazy">
                    <span class="news-category">${categoryLabel}</span>
                    ${isFeatured ? '<span class="news-featured-badge"><i class="fas fa-star"></i> Destacada</span>' : ''}
                </div>
                <div class="news-content">
                    <h3>${noticia.titulo}</h3>
                    <p class="news-excerpt">${noticia.resumen}</p>
                    <div class="news-meta">
                        <span class="news-date"><i class="far fa-calendar"></i> ${date}</span>
                        <span class="news-author"><i class="far fa-user"></i> ${noticia.autor}</span>
                        <span class="news-views"><i class="far fa-eye"></i> ${noticia.vistas || 0} vistas</span>
                    </div>
                    
                    ${isAdmin ? `
                        <div class="news-admin-actions">
                            <button class="news-admin-btn edit">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="news-admin-btn delete">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    ` : ''}
                </div>
            </article>
        `;
    }
    
    // Mostrar formulario de noticias
    function showNewsForm(noticia = null) {
        console.log('Mostrando formulario de noticias...');
        
        if (!newsFormContainer) {
            console.error('Elemento newsFormContainer no encontrado');
            return;
        }
        
        newsFormContainer.style.display = 'block';
        newsFormContainer.scrollIntoView({ behavior: 'smooth' });
        
        if (noticia) {
            // Modo edición
            isEditingNews = true;
            currentEditingNewsId = noticia.id;
            console.log('Modo edición para noticia ID:', noticia.id);
            
            document.getElementById('newsTitle').value = noticia.titulo;
            document.getElementById('newsCategory').value = noticia.categoria;
            document.getElementById('newsExcerpt').value = noticia.resumen;
            document.getElementById('newsContent').value = noticia.contenido;
            document.getElementById('newsImage').value = noticia.imagen_url || '';
            document.getElementById('newsAuthor').value = noticia.autor;
            document.getElementById('newsTags').value = noticia.etiquetas ? noticia.etiquetas.join(', ') : '';
            document.getElementById('newsFeatured').checked = noticia.es_destacada || false;
            
            // Actualizar contador de caracteres
            if (excerptCount) {
                excerptCount.textContent = noticia.resumen.length;
            }
            
            // Cambiar texto del botón
            if (newsSubmitBtn) {
                newsSubmitBtn.textContent = 'Actualizar Noticia';
            }
            if (deleteNewsBtn) {
                deleteNewsBtn.style.display = 'inline-block';
            }
        } else {
            // Modo creación
            console.log('Modo creación de nueva noticia');
            resetNewsForm();
        }
    }
    
    // Ocultar formulario
    function hideNewsForm() {
        if (newsFormContainer) {
            newsFormContainer.style.display = 'none';
        }
    }
    
    // Reiniciar formulario
    function resetNewsForm() {
        isEditingNews = false;
        currentEditingNewsId = null;
        
        if (newsForm) {
            newsForm.reset();
        }
        
        if (excerptCount) {
            excerptCount.textContent = '0';
        }
        
        if (newsSubmitBtn) {
            newsSubmitBtn.textContent = 'Publicar Noticia';
        }
        
        if (deleteNewsBtn) {
            deleteNewsBtn.style.display = 'none';
        }
    }
    
    // Guardar noticia
    async function saveNews() {
        if (!isAdmin) {
            alert('❌ Solo los administradores pueden gestionar noticias.');
            return;
        }
        
        const titulo = document.getElementById('newsTitle').value.trim();
        const categoria = document.getElementById('newsCategory').value;
        const resumen = document.getElementById('newsExcerpt').value.trim();
        const contenido = document.getElementById('newsContent').value.trim();
        const imagen_url = document.getElementById('newsImage').value.trim();
        const autor = document.getElementById('newsAuthor').value.trim();
        const tags = document.getElementById('newsTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const es_destacada = document.getElementById('newsFeatured').checked;
        
        // Validaciones
        if (!titulo || !categoria || !resumen || !contenido || !imagen_url || !autor) {
            alert('❌ Por favor, completa todos los campos obligatorios.');
            return;
        }
        
        if (resumen.length > 200) {
            alert('❌ El resumen no debe exceder los 200 caracteres.');
            return;
        }
        
        try {
            const noticiaData = {
                titulo,
                categoria,
                resumen,
                contenido,
                imagen_url,
                autor,
                etiquetas: tags,
                es_destacada,
                fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp(),
                creado_por: currentUser?.email || 'admin'
            };
            
            // Si se marca como destacada, quitar el destacado de otras noticias
            if (es_destacada) {
                const snapshot = await window.firebaseDB.collection('noticias')
                    .where('es_destacada', '==', true)
                    .get();
                
                const batch = window.firebaseDB.batch();
                snapshot.forEach(doc => {
                    batch.update(doc.ref, { es_destacada: false });
                });
                
                if (!snapshot.empty) {
                    await batch.commit();
                }
            }
            
            if (isEditingNews && currentEditingNewsId) {
                // Actualizar noticia existente
                await window.firebaseDB.collection('noticias')
                    .doc(currentEditingNewsId)
                    .update(noticiaData);
                
                console.log('✅ Noticia actualizada exitosamente');
                alert('✅ Noticia actualizada exitosamente.');
                
            } else {
                // Crear nueva noticia
                noticiaData.fecha_creacion = firebase.firestore.FieldValue.serverTimestamp();
                noticiaData.vistas = 0;
                
                await window.firebaseDB.collection('noticias')
                    .add(noticiaData);
                
                console.log('✅ Noticia creada exitosamente');
                alert('✅ Noticia publicada exitosamente.');
            }
            
            // Actualizar interfaz
            await loadNews();
            hideNewsForm();
            resetNewsForm();
            
        } catch (error) {
            console.error('Error en saveNews:', error);
            alert('❌ Error al guardar la noticia: ' + error.message);
        }
    }
    
    // Editar noticia
    async function editNews(noticiaId) {
        console.log('Editando noticia con ID:', noticiaId);
        
        try {
            const doc = await window.firebaseDB.collection('noticias')
                .doc(noticiaId)
                .get();
            
            if (doc.exists) {
                const noticia = {
                    id: doc.id,
                    ...doc.data()
                };
                showNewsForm(noticia);
            } else {
                alert('❌ Noticia no encontrada');
            }
        } catch (error) {
            console.error('Error en editNews:', error);
            alert('❌ Error al cargar la noticia');
        }
    }
    
    // Eliminar noticia
    async function deleteNews(noticiaId) {
        if (!isAdmin) {
            alert('❌ Solo los administradores pueden eliminar noticias.');
            return;
        }
        
        console.log('Eliminando noticia con ID:', noticiaId);
        
        try {
            await window.firebaseDB.collection('noticias')
                .doc(noticiaId)
                .delete();
            
            console.log('✅ Noticia eliminada exitosamente');
            alert('✅ Noticia eliminada exitosamente.');
            
            // Actualizar interfaz
            await loadNews();
            
            // Si estábamos editando esta noticia, cerrar el formulario
            if (currentEditingNewsId === noticiaId) {
                hideNewsForm();
                resetNewsForm();
            }
            
        } catch (error) {
            console.error('Error en deleteNews:', error);
            alert('❌ Error al eliminar la noticia');
        }
    }
    
    // Cargar estadísticas de administración
    async function loadAdminStats() {
        if (!adminStats) return;
        
        try {
            // Contar noticias
            const noticiasSnapshot = await window.firebaseDB.collection('noticias').get();
            const totalNoticias = noticiasSnapshot.size;
            
            // Contar noticias destacadas
            let noticiasDestacadas = 0;
            let totalVistas = 0;
            noticiasSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.es_destacada) noticiasDestacadas++;
                totalVistas += data.vistas || 0;
            });
            
            // Contar usuarios
            const usuariosSnapshot = await window.firebaseDB.collection('usuarios').get();
            const totalUsuarios = usuariosSnapshot.size;
            
            // Contar usuarios suscritos
            let usuariosSuscritos = 0;
            usuariosSnapshot.forEach(doc => {
                if (doc.data().es_suscrito) usuariosSuscritos++;
            });
            
            // Contar clasificados
            const clasificadosSnapshot = await window.firebaseDB.collection('clasificados').get();
            const totalClasificados = clasificadosSnapshot.size;
            
            adminStats.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${totalNoticias}</div>
                    <div class="stat-label">Noticias Publicadas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${noticiasDestacadas}</div>
                    <div class="stat-label">Noticias Destacadas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalUsuarios}</div>
                    <div class="stat-label">Usuarios Registrados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${usuariosSuscritos}</div>
                    <div class="stat-label">Usuarios Suscritos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalClasificados}</div>
                    <div class="stat-label">Clasificados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalVistas}</div>
                    <div class="stat-label">Total de Vistas</div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }
});

// Test: Forzar visibilidad de controles de administración (eliminar después de probar)
setTimeout(() => {
    console.log('TEST: Forzando visibilidad de controles admin');
    const testControls = document.getElementById('adminControls');
    if (testControls) {
        testControls.style.display = 'flex';
        document.getElementById('adminInfo').textContent = 'TEST: Modo Administrador';
    }
}, 1000);