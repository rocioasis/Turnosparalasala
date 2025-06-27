class TurnoSystem {
    constructor() {
        this.turnos = JSON.parse(localStorage.getItem('turnos') || '[]');
        this.horariosDisponibles = [
            '08:00', '09:00', '10:00', '11:00', '12:00',
            '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
        ];
        this.chatbot = new Chatbot();
        this.initializeSystem();
    }

    initializeSystem() {
        this.setupEventListeners();
        this.initializeDatePicker();
        this.generateCalendar();
        this.setupVoiceRecognition();

        // Generate QR after a small delay to ensure all resources are loaded
        setTimeout(() => {
            this.generateQRCode();
        }, 1000);
    }

    generateQRCode() {
        const qrContainer = document.getElementById('qrCode');
        const currentUrl = encodeURIComponent(window.location.href);

        // Use QR Server API for reliable QR code generation
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${currentUrl}&color=00ffff&bgcolor=ffffff`;

        qrContainer.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                <img src="${qrImageUrl}" alt="Código QR" style="width: 150px; height: 150px; border-radius: 8px;" 
                     onerror="this.parentElement.innerHTML='<div style=\\'text-align: center;\\'><i class=\\'fas fa-qrcode\\' style=\\'font-size: 60px; color: #00ffff; margin-bottom: 10px;\\'></i><p style=\\'color: #333; margin: 10px 0;\\'>QR no disponible</p><a href=\\'${decodeURIComponent(currentUrl)}\\' style=\\'color: #00ffff; text-decoration: none; font-size: 12px; word-break: break-all;\\'>${decodeURIComponent(currentUrl)}</a></div>'">
                <p style="color: #333; margin: 10px 0 0 0; font-size: 12px; font-weight: bold;">Escanea para acceder</p>
            </div>
        `;
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('turnoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTurnoSubmission(e);
        });

        // Date change
        document.getElementById('fecha').addEventListener('change', (e) => {
            this.updateAvailableHours(e.target.value);
        });

        // Navigation
        document.getElementById('prevWeek').addEventListener('click', () => {
            this.changeWeek(-1);
        });

        document.getElementById('nextWeek').addEventListener('click', () => {
            this.changeWeek(1);
        });

        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Mobile menu
        document.querySelector('.hamburger').addEventListener('click', () => {
            document.querySelector('.nav-menu').classList.toggle('active');
        });
    }

    initializeDatePicker() {
        const dateInput = document.getElementById('fecha');
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

        dateInput.min = today.toISOString().split('T')[0];
        dateInput.max = nextMonth.toISOString().split('T')[0];
    }

    updateAvailableHours(selectedDate) {
        const horarioSelect = document.getElementById('horario');
        horarioSelect.innerHTML = '<option value="">Seleccionar horario</option>';

        this.horariosDisponibles.forEach(hora => {
            const isAvailable = this.isHorarioAvailable(selectedDate, hora);
            if (isAvailable) {
                const option = document.createElement('option');
                option.value = hora;
                option.textContent = hora;
                horarioSelect.appendChild(option);
            }
        });
    }

    isHorarioAvailable(fecha, hora) {
        return !this.turnos.some(turno =>
            turno.fecha === fecha && turno.hora === hora
        );
    }

    handleTurnoSubmission(e) {
        const formData = new FormData(e.target);
        const turnoData = {
            id: Date.now(),
            nombre: formData.get('nombre'),
            fecha: formData.get('fecha'),
            hora: formData.get('horario'),
            proposito: formData.get('proposito'),
            timestamp: new Date().toISOString(),
            status: 'confirmado'
        };

        // Validate
        if (!this.isHorarioAvailable(turnoData.fecha, turnoData.hora)) {
            this.showToast('El horario seleccionado ya no está disponible', 'error');
            return;
        }

        // Save turno
        this.turnos.push(turnoData);
        localStorage.setItem('turnos', JSON.stringify(this.turnos));

        // Show success
        this.showToast('¡Turno reservado exitosamente!', 'success');

        // Reset form
        e.target.reset();

        // Update calendar
        this.generateCalendar();

        // Simulate email notification
        this.simulateEmailNotification(turnoData);
    }

    simulateEmailNotification(turnoData) {
        console.log('📧 Enviando notificación por email...');
        console.log('Datos del turno:', turnoData);

        // In a real implementation, this would call an email service
        setTimeout(() => {
            this.showToast('Notificación enviada por email', 'info');
        }, 2000);
    }

    generateCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Generate calendar days
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + i);

            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = currentDate.getDate();

            const dateStr = currentDate.toISOString().split('T')[0];
            const turnos = this.turnos.filter(turno => turno.fecha === dateStr);

            if (turnos.length === 0) {
                dayElement.classList.add('disponible');
            } else if (turnos.length < this.horariosDisponibles.length) {
                dayElement.classList.add('ocupado');
            } else {
                dayElement.classList.add('ocupado');
            }

            // Add click handler
            dayElement.addEventListener('click', () => {
                this.showDayDetails(dateStr, turnos);
            });

            calendarGrid.appendChild(dayElement);
        }
    }

    showDayDetails(fecha, turnos) {
        const formattedDate = new Date(fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let message = `📅 ${formattedDate}\n\n`;

        if (turnos.length === 0) {
            message += '✅ Todos los horarios están disponibles';
        } else {
            message += '🔴 Horarios ocupados:\n';
            turnos.forEach(turno => {
                message += `• ${turno.hora} - ${turno.nombre}\n`;
            });

            const available = this.horariosDisponibles.filter(hora =>
                !turnos.some(turno => turno.hora === hora)
            );

            if (available.length > 0) {
                message += '\n✅ Horarios disponibles:\n';
                available.forEach(hora => {
                    message += `• ${hora}\n`;
                });
            }
        }

        alert(message);
    }

    changeWeek(direction) {
        // Implementation for changing week in calendar
        console.log('Changing week:', direction);
        this.generateCalendar();
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = toast.querySelector('i');

        toastMessage.textContent = message;

        // Change icon based on type
        switch (type) {
            case 'success':
                toastIcon.className = 'fas fa-check-circle';
                break;
            case 'error':
                toastIcon.className = 'fas fa-exclamation-circle';
                break;
            case 'info':
                toastIcon.className = 'fas fa-info-circle';
                break;
        }

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'es-ES';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.chatbot.handleVoiceInput(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showToast('Error en el reconocimiento de voz', 'error');
            };
        }
    }
}

class Chatbot {
    constructor() {
        this.isMinimized = false;
        this.isRecording = false;
        this.conversationContext = [];
        this.userProfile = {};

        this.responses = {
            greeting: [
                "¡Hola! 👋 Soy Noah, tu asistente virtual inteligente de la sala informática de EPET N° 1. Estoy aquí para hacer tu experiencia más fácil y eficiente. ¿En qué puedo ayudarte hoy?",
                "¡Bienvenido/a! 🤖 Me llamo Noah y conozco todo sobre nuestra sala informática. Puedo ayudarte con reservas, consultas técnicas, horarios y mucho más. ¿Qué necesitas?",
                "¡Hola! ✨ Soy Noah, tu asistente especializada en la gestión de turnos y consultas de EPET N° 1. ¿Vienes por primera vez o ya conoces nuestros servicios?"
            ],
            help: [
                "🚀 ¡Tengo muchas funciones útiles! Puedo ayudarte con:\n\n🔹 Reservar turnos de forma inteligente\n🔹 Consultar disponibilidad en tiempo real\n🔹 Explicarte las normas y equipamiento\n🔹 Sugerirte el mejor horario según tus necesidades\n🔹 Resolver problemas técnicos básicos\n🔹 Darte información sobre la ubicación\n🔹 Cancelar o modificar reservas\n\n¿Qué te gustaría hacer primero?",
                "💡 Estoy diseñado para ser tu compañero digital. Puedo:\n\n📅 Gestionar tu agenda de turnos\n🔍 Buscar horarios específicos\n📋 Explicarte cada norma en detalle\n🖥️ Informarte sobre el equipamiento disponible\n🎯 Personalizar recomendaciones según tu perfil\n\n¿En qué área necesitas más ayuda?"
            ],
            booking: [
                "📝 ¡Perfecto! Te voy a guiar paso a paso para reservar tu turno:\n\n1️⃣ Primero, dime tu nombre o curso\n2️⃣ ¿Qué fecha prefieres? (tengo disponibilidad hasta un mes)\n3️⃣ ¿Tienes preferencia de horario?\n4️⃣ ¿Para qué necesitas la sala?\n\n💡 Tip: Si me dices el tipo de trabajo, puedo sugerirte el mejor horario cuando hay menos gente.\n\n¿Empezamos? ¿Cuál es tu nombre o curso?",
                "🎯 Te ayudo a encontrar el turno perfecto. Antes de empezar:\n\n¿Es tu primera vez usando la sala? Si es así, te explico todo el proceso.\n¿Necesitas equipamiento especial?\n¿Prefieres trabajar en grupo o individual?\n\nEsta información me ayuda a recomendarte mejor. ¡Cuéntame más sobre lo que necesitas!"
            ],
            available: [
                "⏰ Nuestra sala funciona:\n🕐 Lunes a Viernes: 8:00 - 19:00\n🏫 Ubicación: EPET N° 1, Av. Perón 1117\n\n📊 Estado actual:\n✅ 40 equipos de última generación\n🔧 Mantenimiento: Domingos\n📈 Ocupación promedio: 65%\n\n¿Quieres que revise la disponibilidad para una fecha específica? ¿O prefieres que te muestre los horarios con menos ocupación?",
                "📅 Te muestro la disponibilidad inteligente:\n\n🌅 Mañanas (8:00-12:00): Ideal para clases\n🌞 Mediodía (12:00-14:00): Menos concurrido\n🌇 Tarde (14:00-19:00): Popular para proyectos\n\n💡 ¿Sabías que los martes y jueves son los días con más disponibilidad?\n\n¿Te interesa algún día en particular?"
            ],
            support: [
                "🆘 ¡No te preocupes! Tengo varias opciones para ayudarte:\n\n📞 Soporte inmediato: +54 3804 456-789\n📧 Email: soporte.epetn1@larioja.edu.ar\n📍 Presencial: EPET N° 1, Av. Perón 1117\n\n⚡ Mientras tanto, cuéntame el problema específico. Muchas veces puedo resolverlo al instante:\n• ¿No puedes completar la reserva?\n• ¿Problemas con el sistema?\n• ¿Necesitas cancelar un turno?\n\n¿Cuál es tu situación exacta?"
            ],
            equipment: [
                "💻 Nuestro equipamiento de última generación incluye:\n\n🖥️ 40 PCs con:\n• Procesadores Intel i7 / AMD Ryzen 7\n• 16GB RAM DDR4\n• SSD 512GB\n• Tarjetas gráficas dedicadas\n\n📱 Software disponible:\n• Suite Office completa\n• Programas de diseño (Photoshop, Illustrator)\n• IDEs de programación\n• Software de ingeniería\n\n🌐 Conectividad:\n• Internet fibra óptica 1GB\n• WiFi 6\n• Impresoras 3D disponibles\n\n¿Necesitas algo específico para tu proyecto?"
            ],
            location: [
                "📍 ¡Te ayudo con la ubicación!\n\n🏫 EPET N° 1\n📮 Av. Perón, 1117\n🌎 La Rioja, Argentina\n\n🚌 Cómo llegar:\n• Líneas de colectivo: 1, 5, 12\n• Estacionamiento disponible\n• Acceso para personas con discapacidad\n\n⏰ Horarios de acceso:\n• Lunes a Viernes: 7:30 - 19:30\n• La sala informática: 8:00 - 19:00\n\n¿Necesitas más información sobre cómo llegar?"
            ],
            rules: [
                "📋 Las normas están pensadas para que todos tengamos la mejor experiencia:\n\n⏰ **Puntualidad**: Máximo 10 min de tolerancia\n🆔 **Identificación**: Documento o credencial obligatoria\n🧼 **Higiene**: Alcohol en gel disponible (úsalo!)\n🔇 **Silencio**: Respetemos el ambiente de estudio\n💾 **Respaldo**: Guarda tu trabajo en USB/nube\n🚫 **Prohibido**: Comidas, software no autorizado, contenido inapropiado\n\n¿Tienes dudas sobre alguna norma en particular? ¡Puedo explicarte cualquiera en detalle!"
            ],
            cancel: [
                "🔄 ¡Claro! Te ayudo a cancelar o modificar tu reserva.\n\nPara encontrar tu turno, necesito:\n📅 Fecha de la reserva\n⏰ Horario reservado\n👤 Nombre o curso con el que reservaste\n\n💡 Recuerda: puedes cancelar hasta 2 horas antes sin penalización.\n\n¿Tienes estos datos a mano?"
            ]
        };

        this.keywords = {
            greeting: ['hola', 'buenos días', 'buenas tardes', 'saludos', 'hey', 'que tal', 'como estas'],
            help: ['ayuda', 'ayudar', 'asistencia', 'qué puedes hacer', 'opciones', 'funciones', 'que sabes'],
            booking: ['reservar', 'turno', 'reserva', 'solicitar', 'pedir', 'quiero', 'necesito'],
            available: ['horarios', 'disponible', 'libre', 'cuándo', 'hora', 'calendario', 'cuando'],
            support: ['soporte', 'contacto', 'problema', 'error', 'no funciona', 'ayuda tecnica', 'falla'],
            equipment: ['equipos', 'computadoras', 'pcs', 'software', 'programas', 'especificaciones', 'hardware'],
            location: ['ubicación', 'donde', 'dirección', 'como llegar', 'donde esta', 'direccion'],
            rules: ['normas', 'reglas', 'reglamento', 'que debo', 'puedo', 'permitido', 'prohibido'],
            cancel: ['cancelar', 'anular', 'modificar', 'cambiar', 'borrar', 'eliminar']
        };

        this.setupChatbot();
    }

    setupChatbot() {
        const chatbotToggle = document.getElementById('chatbotToggle');
        const chatbotContainer = document.getElementById('chatbotContainer');
        const sendBtn = document.getElementById('sendBtn');
        const voiceBtn = document.getElementById('voiceBtn');
        const chatInput = document.getElementById('chatInput');

        // Toggle chatbot
        chatbotToggle.addEventListener('click', () => {
            this.toggleChatbot();
        });

        // Send message
        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Voice input
        voiceBtn.addEventListener('click', () => {
            this.toggleVoiceRecording();
        });
    }

    toggleChatbot() {
        const chatbotContainer = document.getElementById('chatbotContainer');
        const chatbotBody = document.getElementById('chatbotBody');
        const chatbotToggle = document.getElementById('chatbotToggle');

        this.isMinimized = !this.isMinimized;

        if (this.isMinimized) {
            chatbotContainer.classList.add('minimized');
            chatbotBody.style.display = 'none';
            chatbotToggle.innerHTML = '<i class="fas fa-comment"></i>';
        } else {
            chatbotContainer.classList.remove('minimized');
            chatbotBody.style.display = 'flex';
            chatbotToggle.innerHTML = '<i class="fas fa-minus"></i>';
        }
    }

    sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();

        if (message) {
            this.addMessage(message, 'user');
            chatInput.value = '';

            // Simulate typing delay
            setTimeout(() => {
                const response = this.generateResponse(message);
                this.addMessage(response, 'bot');
            }, 1000);
        }
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;

        messageElement.appendChild(avatar);
        messageElement.appendChild(content);
        messagesContainer.appendChild(messageElement);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    generateResponse(input) {
        const normalizedInput = input.toLowerCase();

        // Store conversation context
        this.conversationContext.push({
            input: input,
            timestamp: new Date(),
            type: 'user'
        });

        // Advanced keyword matching with scoring
        let bestMatch = null;
        let bestScore = 0;

        for (const [category, keywords] of Object.entries(this.keywords)) {
            let score = 0;
            keywords.forEach(keyword => {
                if (normalizedInput.includes(keyword)) {
                    score += keyword.length; // Longer matches get higher scores
                }
            });

            if (score > bestScore) {
                bestScore = score;
                bestMatch = category;
            }
        }

        // Context-aware responses
        if (bestMatch) {
            const responses = this.responses[bestMatch];
            let selectedResponse = responses[Math.floor(Math.random() * responses.length)];

            // Add personalization based on previous interactions
            if (this.conversationContext.length > 2) {
                selectedResponse += "\n\n💬 ¿Hay algo más específico en lo que pueda ayudarte?";
            }

            return selectedResponse;
        }

        // Smart fallback responses based on input analysis
        if (normalizedInput.includes('gracias')) {
            return "¡De nada! 😊 Estoy aquí para ayudarte siempre que lo necesites. ¿Hay algo más en lo que pueda asistirte?";
        }

        if (normalizedInput.includes('tiempo') || normalizedInput.includes('duración')) {
            return "⏰ Los turnos son de 2 horas por defecto, pero puedes solicitar extensiones si hay disponibilidad. ¿Necesitas más tiempo para tu proyecto?";
        }

        if (normalizedInput.includes('grupo') || normalizedInput.includes('equipo')) {
            return "👥 ¡Perfecto para trabajo en grupo! Tenemos espacios colaborativos y puedes reservar múltiples equipos contiguos. ¿Cuántas personas son?";
        }

        if (normalizedInput.includes('urgente') || normalizedInput.includes('rápido')) {
            return "⚡ ¡Entiendo la urgencia! Déjame revisar qué horarios inmediatos tengo disponibles. ¿Para cuándo necesitas el turno?";
        }

        // Enhanced default response with suggestions
        return `🤔 Entiendo que necesitas información sobre "${input}". \n\n💡 Puedo ayudarte mejor si me dices específicamente:\n• ¿Quieres reservar un turno?\n• ¿Necesitas información sobre horarios?\n• ¿Tienes dudas sobre el equipamiento?\n• ¿Hay algún problema que resolver?\n\n¿Cuál de estas opciones se acerca más a lo que buscas?`;
    }

    toggleVoiceRecording() {
        const voiceBtn = document.getElementById('voiceBtn');
        const turnoSystem = window.turnoSystem;

        if (!turnoSystem.recognition) {
            this.addMessage('Lo siento, tu navegador no soporta reconocimiento de voz.', 'bot');
            return;
        }

        if (!this.isRecording) {
            this.isRecording = true;
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';

            turnoSystem.recognition.start();
            this.addMessage('🎤 Escuchando... Habla ahora', 'bot');
        } else {
            this.isRecording = false;
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';

            turnoSystem.recognition.stop();
        }
    }

    handleVoiceInput(transcript) {
        const voiceBtn = document.getElementById('voiceBtn');

        this.isRecording = false;
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';

        this.addMessage(transcript, 'user');

        setTimeout(() => {
            const response = this.generateResponse(transcript);
            this.addMessage(response, 'bot');
        }, 1000);
    }
}

// Utility functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function sendQuickMessage(message) {
    const chatInput = document.getElementById('chatInput');
    chatInput.value = message;
    window.turnoSystem.chatbot.sendMessage();
}

// Initialize system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.turnoSystem = new TurnoSystem();

    // Add smooth scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}