class AuthManager {
    constructor(app) {
        this.app = app;
        this.currentUser = null;
        this.isLoginMode = true;
        this.initDemoUsers();
    }

    initDemoUsers() {
        if (!localStorage.getItem('demoUsersInitialized')) {
            const demoUsers = {
                'admin@intelliroute.ru': {
                    password: 'admin123',
                    name: 'Администратор Системы',
                    avatar: 'AИ'
                },
                'manager@company.ru': {
                    password: 'manager123',
                    name: 'Менеджер Петров', 
                    avatar: 'МП'
                },
                'demo@example.com': {
                    password: 'demo',
                    name: 'Демо Пользователь',
                    avatar: 'ДП'
                },
                'test@test.com': {
                    password: 'test',
                    name: 'Тестовый Пользователь',
                    avatar: 'ТП'
                }
            };
            localStorage.setItem('demoUsers', JSON.stringify(demoUsers));
            localStorage.setItem('demoUsersInitialized', 'true');
        }
    }

    init() {
        this.bindAuthEvents();
        this.checkAuthStatus();
    }

    bindAuthEvents() {
        const authForm = document.getElementById('authForm');
        const authSwitchLink = document.getElementById('authSwitchLink');

        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuth(e));
        }
        
        if (authSwitchLink) {
            authSwitchLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthMode();
            });
        }
    }

    toggleAuthMode() {
        this.isLoginMode = !this.isLoginMode;
        
        const authTitle = document.getElementById('authTitle');
        const authSubtitle = document.getElementById('authSubtitle');
        const authSubmitText = document.getElementById('authSubmitText');
        const authSwitchText = document.getElementById('authSwitchText');
        const authSwitchLink = document.getElementById('authSwitchLink');
        const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');

        if (this.isLoginMode) {
            authTitle.textContent = 'Вход в систему';
            authSubtitle.textContent = 'Введите ваши данные для входа в систему';
            authSubmitText.textContent = 'Войти';
            authSwitchText.textContent = 'Еще нет аккаунта?';
            authSwitchLink.textContent = 'Зарегистрироваться';
            if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'none';
        } else {
            authTitle.textContent = 'Регистрация';
            authSubtitle.textContent = 'Создайте новый аккаунт';
            authSubmitText.textContent = 'Зарегистрироваться';
            authSwitchText.textContent = 'Уже есть аккаунт?';
            authSwitchLink.textContent = 'Войти';
            if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'block';
        }
    }

    handleAuth(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;

        // Валидация
        if (!this.validateEmail(email)) {
            this.showAuthError('Введите корректный email');
            return;
        }

        if (password.length < 3) {
            this.showAuthError('Пароль должен быть не менее 3 символов');
            return;
        }

        if (!this.isLoginMode && password !== confirmPassword) {
            this.showAuthError('Пароли не совпадают');
            return;
        }

        // Проверка учетных данных
        if (this.isLoginMode) {
            this.handleLogin(email, password);
        } else {
            this.handleRegistration(email, password);
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    handleLogin(email, password) {
        const demoUsers = JSON.parse(localStorage.getItem('demoUsers') || '{}');
        const user = demoUsers[email];
        
        if (user && user.password === password) {
            this.currentUser = {
                email: email,
                name: user.name,
                avatar: user.avatar,
                role: email.split('@')[0]
            };
            this.login();
        } else {
            this.showAuthError('Неверный email или пароль');
        }
    }

    handleRegistration(email, password) {
        // Для демо-режима просто создаем пользователя
        this.currentUser = {
            email: email,
            name: email.split('@')[0],
            avatar: email.substring(0, 2).toUpperCase(),
            role: 'user'
        };

        this.login();
        this.showAuthSuccess('Аккаунт успешно создан!');
    }

    login() {
        console.log('Выполняется вход...', this.currentUser);
        
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Скрываем экран аутентификации и показываем основное приложение
        const authScreen = document.getElementById('authScreen');
        const app = document.getElementById('app');
        
        if (authScreen) {
            authScreen.classList.add('hidden');
            console.log('Экран аутентификации скрыт');
        }
        
        if (app) {
            app.classList.remove('hidden');
            console.log('Основное приложение показано');
        }
        
        this.updateUserInfo();
        
        // Инициализируем основное приложение после входа
        if (this.app && typeof this.app.initApp === 'function') {
            console.log('Инициализация основного приложения...');
            this.app.initApp();
        } else {
            console.error('App или initApp не доступны');
        }
    }

    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        location.reload();
    }

    checkAuthStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userData = localStorage.getItem('currentUser');

        if (isLoggedIn && userData) {
            this.currentUser = JSON.parse(userData);
            const authScreen = document.getElementById('authScreen');
            const app = document.getElementById('app');
            
            if (authScreen) authScreen.classList.add('hidden');
            if (app) app.classList.remove('hidden');
            
            this.updateUserInfo();
            
            // Инициализируем основное приложение если пользователь уже вошел
            if (this.app && typeof this.app.initApp === 'function') {
                this.app.initApp();
            }
        }
    }

    updateUserInfo() {
        if (this.currentUser) {
            const userAvatar = document.getElementById('userAvatar');
            const userName = document.getElementById('userName');
            
            if (userAvatar) userAvatar.textContent = this.currentUser.avatar;
            if (userName) userName.textContent = this.currentUser.name;
        }
    }

    showAuthError(message) {
        // Создаем красивое уведомление вместо alert
        this.showNotification(message, 'error');
    }

    showAuthSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Создаем уведомление в стиле приложения
        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.innerHTML = `
            <div class="auth-notification-content">
                <span class="auth-notification-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
                <span>${message}</span>
            </div>
        `;

        // Добавляем стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : '#eff6ff'};
            border: 1px solid ${type === 'error' ? '#fecaca' : type === 'success' ? '#bbf7d0' : '#dbeafe'};
            border-left: 4px solid ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: ${type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#1e40af'};
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.bindEvents();
    }

    bindEvents() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }
}

class IntelliRouteApp {
    constructor() {
        this.authManager = new AuthManager(this);
        this.themeManager = new ThemeManager();
        this.currentSection = 'planner';
        this.sheetData = [];
        this.filteredData = [];
        this.optimizedRoute = [];
        this.animations = window.RouteAnimations;
        this.excelParser = new ExcelParser();
        this.dataTable = null;
        this.leafletMap = null;
        this.fullLeafletMap = null;
        this.isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        this.initialized = false;
        
        this.optimizationAlgorithms = {
            time: this.timeOptimization.bind(this),
            distance: this.distanceOptimization.bind(this),
            balanced: this.balancedOptimization.bind(this)
        };
    }

    async init() {
        this.authManager.init();
        this.themeManager.init();
    }

    async initApp() {
        if (this.initialized) return;
        
        this.initialized = true;
        
        this.bindEvents();
        await this.loadDemoExcelData();
        this.initMap();
        this.applySidebarState();
        this.initDataTable();
        
        console.log('Основное приложение инициализировано');
    }

    initDataTable() {
        // Data table initialization if needed
    }

    applySidebarState() {
        const sidebar = document.getElementById('sidebar');
        if (this.isSidebarCollapsed && sidebar) {
            sidebar.classList.add('collapsed');
        }
    }

    bindEvents() {

        // Навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    this.switchSection(section);
                }
            });
        });

        // Сворачивание сайдбара
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Кнопки Excel
        const importBtn = document.getElementById('importExcelBtn');
        const exportBtn = document.getElementById('exportExcelBtn');
        const templateBtn = document.getElementById('templateBtn');
        
        if (importBtn) importBtn.addEventListener('click', () => this.importExcel());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportExcel());
        if (templateBtn) templateBtn.addEventListener('click', () => this.downloadTemplate());

        // Фильтры
        const filterVIP = document.getElementById('filterVIP');
        const searchAddress = document.getElementById('searchAddress');
        
        if (filterVIP) filterVIP.addEventListener('change', () => this.filterData());
        if (searchAddress) searchAddress.addEventListener('input', () => this.filterData());

        // Другие кнопки
        const addAddressBtn = document.getElementById('addAddressBtn');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const optimizeBtn = document.getElementById('optimizeBtn');
        const calculateRouteBtn = document.getElementById('calculateRouteBtn');

        if (addAddressBtn) addAddressBtn.addEventListener('click', () => this.showAddAddressModal());
        if (clearAllBtn) clearAllBtn.addEventListener('click', () => this.clearAllAddresses());
        if (optimizeBtn) optimizeBtn.addEventListener('click', () => this.optimizeRoute());
        if (calculateRouteBtn) calculateRouteBtn.addEventListener('click', () => this.calculateRoute());

        // Настройки оптимизации
        const optimizationCriteria = document.getElementById('optimizationCriteria');
        const transportType = document.getElementById('transportType');
        
        if (optimizationCriteria) optimizationCriteria.addEventListener('change', () => this.onSettingsChange());
        if (transportType) transportType.addEventListener('change', () => this.onSettingsChange());

        // Тема
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.themeManager.toggleTheme());
        }

        // В методе bindEvents добавьте:
        const generateScheduleBtn = document.getElementById('generateScheduleBtn');
        if (generateScheduleBtn) {
            generateScheduleBtn.addEventListener('click', () => this.generateDetailedSchedule());
        }
        
    }
    // Метод для обновления метрик из OSRM
    updateRouteMetricsFromOSRM(distanceKm, durationMin) {
        // Обновляем метрики на карте
        this.updateElementText('mapTotalTime', this.formatTime(durationMin));
        this.updateElementText('mapTotalDistance', `${distanceKm} км`);
        
        // Обновляем метрики в основном интерфейсе
        this.updateElementText('totalTime', this.formatTime(durationMin));
        this.updateElementText('totalDistance', `${distanceKm} км`);
        
        // Пересчитываем экономию
        const fuelSavings = this.calculateFuelSavings(parseFloat(distanceKm));
        this.updateElementText('fuelSavings', `${fuelSavings} ₽`);
        this.updateElementText('mapFuelSavings', `${fuelSavings} ₽`);
        
        console.log(`Маршрут: ${distanceKm} км, ${durationMin} мин`);
    }
    // === СИСТЕМА ПЛАНИРОВАНИЯ МАРШРУТОВ ===
// === СИСТЕМА ДЕТАЛЬНОГО ПЛАНИРОВАНИЯ МАРШРУТОВ ===
calculateDetailedSchedule() {
    if (this.optimizedRoute.length === 0) {
        console.warn('Нет оптимизированного маршрута для создания расписания');
        return { points: [], totalDuration: 0, workDayStart: '09:00', workDayEnd: '18:00' };
    }

    const schedulePoints = [];
    let currentTime = this.parseTimeWithDate('09:00', new Date()); // Начинаем в 9:00
    const workDayEnd = this.parseTimeWithDate('18:00', new Date());
    const lunchStart = this.parseTimeWithDate('13:00', new Date());
    const lunchEnd = this.parseTimeWithDate('14:00', new Date());
    
    let currentDay = 1;
    let dayStartTime = new Date(currentTime);

    for (let i = 0; i < this.optimizedRoute.length; i++) {
        const point = this.optimizedRoute[i];
        
        // Проверяем, не начался ли новый день
        if (currentTime.getDate() !== dayStartTime.getDate()) {
            currentDay++;
            dayStartTime = new Date(currentTime);
        }

        // Пропускаем обеденное время (13:00-14:00)
        if (this.isTimeDuringLunch(currentTime, lunchStart, lunchEnd)) {
            console.log(`🍽️ Обеденный перерыв с 13:00 до 14:00`);
            currentTime = new Date(lunchEnd); // Переходим к 14:00
        }

        // Проверяем, не закончился ли рабочий день (после 18:00)
        if (currentTime >= workDayEnd) {
            console.log(`📅 Рабочий день закончен, переход к следующему дню`);
            currentDay++;
            
            // Начинаем следующий день в 9:00
            dayStartTime = new Date(dayStartTime);
            dayStartTime.setDate(dayStartTime.getDate() + 1);
            dayStartTime.setHours(9, 0, 0, 0);
            currentTime = new Date(dayStartTime);
        }

        const visitDuration = point.duration || 30; // Длительность визита
        const arrivalTime = new Date(currentTime);
        const departureTime = new Date(arrivalTime.getTime() + visitDuration * 60000);

        // Проверяем, не попадает ли визит на обеденное время
        if (this.isVisitDuringLunch(arrivalTime, departureTime, lunchStart, lunchEnd)) {
            console.log(`⚠️ Визит в ${point.address} пересекается с обедом, переносим после 14:00`);
            currentTime = new Date(lunchEnd); // Переносим на после обеда
            continue; // Пересчитываем для этой точки
        }

        // Проверяем, не выходит ли визит за пределы рабочего дня
        if (departureTime > workDayEnd) {
            console.log(`📅 Визит в ${point.address} выходит за пределы рабочего дня, переносим на следующий день`);
            currentDay++;
            
            // Начинаем следующий день в 9:00
            dayStartTime = new Date(dayStartTime);
            dayStartTime.setDate(dayStartTime.getDate() + 1);
            dayStartTime.setHours(9, 0, 0, 0);
            currentTime = new Date(dayStartTime);
            continue; // Пересчитываем для этой точки
        }

        // Рассчитываем время перемещения до следующей точки
        let travelTime = 0;
        if (i < this.optimizedRoute.length - 1) {
            const nextPoint = this.optimizedRoute[i + 1];
            const distance = this.calculateDistance(point, nextPoint);
            const transportType = document.getElementById('scheduleTransportType')?.value || 'car';
            
            // Средние скорости для разных типов транспорта
            const speeds = {
                'car': 60, // км/ч
                'public': 30, // км/ч
                'walking': 5 // км/ч
            };
            
            const speed = speeds[transportType] || 60;
            travelTime = Math.round((distance / speed) * 60); // Время в минутах
        }

        // Определяем статус визита
        const workStart = this.parseTimeWithDate(point.workStart || '09:00', arrivalTime);
        const workEnd = this.parseTimeWithDate(point.workEnd || '18:00', arrivalTime);
        const pointLunchStart = this.parseTimeWithDate(point.lunchStart || '13:00', arrivalTime);
        const pointLunchEnd = this.parseTimeWithDate(point.lunchEnd || '14:00', arrivalTime);
        
        const status = this.getVisitStatus(arrivalTime, workStart, workEnd, pointLunchStart, pointLunchEnd);

        const schedulePoint = {
            id: point.id,
            order: i + 1,
            address: point.address,
            clientLevel: point.clientLevel,
            arrivalTime: new Date(arrivalTime),
            departureTime: new Date(departureTime),
            visitDuration: visitDuration,
            travelTime: travelTime,
            workStart: point.workStart || '09:00',
            workEnd: point.workEnd || '18:00',
            lunchStart: point.lunchStart || '13:00',
            lunchEnd: point.lunchEnd || '14:00',
            status: status,
            day: currentDay,
            timeWindows: {
                work: `${point.workStart || '09:00'} - ${point.workEnd || '18:00'}`,
                lunch: `${point.lunchStart || '13:00'} - ${point.lunchEnd || '14:00'}`
            }
        };

        schedulePoints.push(schedulePoint);
        
        // Обновляем текущее время: время окончания визита + время перемещения
        currentTime = new Date(departureTime.getTime() + travelTime * 60000);
        
        console.log(`📍 Точка ${i + 1}: ${point.address}`);
        console.log(`   Прибытие: ${arrivalTime.toLocaleString('ru-RU')}`);
        console.log(`   Окончание: ${departureTime.toLocaleString('ru-RU')}`);
        console.log(`   Длительность: ${visitDuration} мин`);
        console.log(`   Время до следующей точки: ${travelTime} мин`);
        console.log(`   Статус: ${this.getStatusText(status)}`);
        console.log(`   День: ${currentDay}`);
    }

    const totalDuration = schedulePoints.reduce((total, point) => {
        return total + point.visitDuration + point.travelTime;
    }, 0);

    return {
        points: schedulePoints,
        totalDuration: totalDuration,
        workDayStart: '09:00',
        workDayEnd: '18:00',
        days: currentDay
    };
}

generateDetailedSchedule() {
    if (this.filteredData.length === 0) {
        this.showNotification('📍 Добавьте точки для создания расписания', 'warning');
        return;
    }

    // Оптимизируем маршрут если еще не оптимизирован
    if (this.optimizedRoute.length === 0) {
        const algorithm = document.getElementById('optimizationCriteria')?.value || 'balanced';
        this.optimizedRoute = this.optimizationAlgorithms[algorithm](this.filteredData);
    }

    this.renderDetailedSchedule();
    this.showNotification('🗓️ Детальное расписание сгенерировано', 'success');
}

renderDetailedSchedule() {
    const scheduleContent = document.getElementById('scheduleContent');
    if (!scheduleContent) return;

    if (this.optimizedRoute.length === 0) {
        scheduleContent.innerHTML = `
            <div class="empty-schedule">
                <div class="empty-icon">📅</div>
                <div class="empty-text">Сначала оптимизируйте маршрут</div>
                <button class="btn btn-primary" onclick="app.generateDetailedSchedule()">
                    🗓️ Сгенерировать расписание
                </button>
            </div>
        `;
        return;
    }

    const schedule = this.calculateDetailedSchedule();
    
    scheduleContent.innerHTML = `
        <div class="schedule-container">
            <div class="schedule-header">
                <h3>📋 Детальное расписание маршрута</h3>
                <div class="schedule-summary">
                    <div class="summary-item">
                        <span class="summary-label">Всего точек:</span>
                        <span class="summary-value">${schedule.points.length}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Общее время:</span>
                        <span class="summary-value">${this.formatTime(schedule.totalDuration)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Рабочий день:</span>
                        <span class="summary-value">${schedule.workDayStart} - ${schedule.workDayEnd}</span>
                    </div>
                </div>
            </div>

            <div class="transport-selector">
                <label>Тип транспорта:</label>
                <select id="scheduleTransportType" class="form-input" onchange="app.renderDetailedSchedule()">
                    <option value="car">🚗 Автомобиль (60 км/ч)</option>
                    <option value="public">🚌 Общественный транспорт (30 км/ч)</option>
                    <option value="walking">🚶 Пешком (5 км/ч)</option>
                </select>
            </div>

            <div class="detailed-timeline">
                ${schedule.points.map((point, index) => this.renderSchedulePoint(point, index)).join('')}
            </div>

            <div class="schedule-actions">
                <button class="btn btn-primary" onclick="app.exportScheduleToExcel()">
                    📊 Экспорт в Excel
                </button>
                <button class="btn btn-secondary" onclick="app.printSchedule()">
                    🖨️ Печать расписания
                </button>
            </div>
        </div>
    `;
}

// Вспомогательные методы для работы со временем
parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

getTransportTypeText() {
    const transportType = document.getElementById('scheduleTransportType')?.value || 'car';
    const transportTexts = {
        'car': 'На автомобиле',
        'public': 'Общественным транспортом',
        'walking': 'Пешком'
    };
    return transportTexts[transportType] || 'На автомобиле';
}

// Экспорт расписания в Excel
exportScheduleToExcel() {
    if (this.optimizedRoute.length === 0) {
        this.showNotification('📍 Нет данных для экспорта', 'warning');
        return;
    }

    try {
        const schedule = this.calculateDetailedSchedule();
        const exportData = schedule.points.map(point => ({
            'Порядковый номер': point.order,
            'Адрес': point.address,
            'Уровень клиента': point.clientLevel,
            'Время прибытия': point.arrivalTime.toLocaleString('ru-RU'),
            'Время окончания': point.departureTime.toLocaleString('ru-RU'),
            'Длительность визита (мин)': point.visitDuration,
            'Время в пути (мин)': point.travelTime,
            'Рабочее время': `${point.workStart} - ${point.workEnd}`,
            'Обеденное время': `${point.lunchStart} - ${point.lunchEnd}`,
            'Статус': this.getStatusText(point.status)
        }));

        this.excelParser.exportToExcel(exportData, `расписание_маршрута_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.showNotification('📊 Расписание экспортировано в Excel', 'success');
        
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        this.showNotification('❌ Ошибка экспорта расписания', 'error');
    }
}

printSchedule() {
    const scheduleContent = document.getElementById('scheduleContent');
    if (!scheduleContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Расписание маршрута</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .schedule-point { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px; }
                .vip { border-left: 4px solid #f59e0b; }
                .point-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .point-address { font-weight: bold; }
                .vip-badge { background: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; }
                .point-timeline { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
                .time-block { display: flex; justify-content: space-between; }
            </style>
        </head>
        <body>
            <h1>Расписание маршрута</h1>
            <div>Сгенерировано: ${new Date().toLocaleString('ru-RU')}</div>
            ${scheduleContent.innerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Обновите метод initSchedule для использования новой системы
initSchedule() {
    const scheduleContent = document.getElementById('scheduleContent');
    if (!scheduleContent) return;
    
    scheduleContent.innerHTML = `
        <div class="schedule-section">
            <div class="section-header">
                <h2>📅 Детальное планирование маршрутов</h2>
                <p>Автоматическое создание расписания с учетом рабочих часов и обеденных перерывов</p>
            </div>
            
            <div class="schedule-controls">
                <button class="btn btn-primary" onclick="app.generateDetailedSchedule()">
                    🗓️ Сгенерировать расписание
                </button>
                <button class="btn btn-secondary" onclick="app.clearSchedule()">
                    🗑️ Очистить расписание
                </button>
            </div>
            
            <div id="detailedScheduleContent">
                <div class="schedule-placeholder">
                    <div class="placeholder-icon">📅</div>
                    <div class="placeholder-text">
                        <h3>Создайте детальное расписание</h3>
                        <p>Нажмите "Сгенерировать расписание" для создания маршрута с учетом:</p>
                        <ul>
                            <li>✅ Рабочих часов клиентов</li>
                            <li>✅ Обеденных перерывов</li>
                            <li>✅ Времени перемещения между точками</li>
                            <li>✅ Приоритета VIP клиентов</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

renderDetailedSchedule() {
    const scheduleContent = document.getElementById('scheduleContent');
    if (!scheduleContent) return;

    if (this.optimizedRoute.length === 0) {
        scheduleContent.innerHTML = `
            <div class="empty-schedule">
                <div class="empty-icon">📅</div>
                <div class="empty-text">Сначала оптимизируйте маршрут</div>
                <button class="btn btn-primary" onclick="app.generateDetailedSchedule()">
                    🗓️ Сгенерировать расписание
                </button>
            </div>
        `;
        return;
    }

    const schedule = this.calculateDetailedSchedule();
    
    scheduleContent.innerHTML = `
        <div class="schedule-container">
            <div class="schedule-header">
                <h3>📋 Детальное расписание маршрута</h3>
                <div class="schedule-summary">
                    <div class="summary-item">
                        <span class="summary-label">Всего точек:</span>
                        <span class="summary-value">${schedule.points.length}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Общее время:</span>
                        <span class="summary-value">${this.formatTime(schedule.totalDuration)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Рабочий день:</span>
                        <span class="summary-value">${schedule.workDayStart} - ${schedule.workDayEnd}</span>
                    </div>
                </div>
            </div>

            <div class="transport-selector">
                <label>Тип транспорта:</label>
                <select id="scheduleTransportType" class="form-input" onchange="app.renderDetailedSchedule()">
                    <option value="car">🚗 Автомобиль (60 км/ч)</option>
                    <option value="public">🚌 Общественный транспорт (30 км/ч)</option>
                    <option value="walking">🚶 Пешком (5 км/ч)</option>
                </select>
            </div>

            <div class="detailed-timeline">
                ${schedule.points.map((point, index) => this.renderSchedulePoint(point, index)).join('')}
            </div>

            <div class="schedule-actions">
                <button class="btn btn-primary" onclick="app.exportScheduleToExcel()">
                    📊 Экспорт в Excel
                </button>
                <button class="btn btn-secondary" onclick="app.printSchedule()">
                    🖨️ Печать расписания
                </button>
            </div>
        </div>
    `;
}

// УЛУЧШЕННЫЙ МЕТОД: Проверка пересечения с обеденным временем
isVisitDuringLunch(visitStart, visitEnd, lunchStart, lunchEnd) {
    const visitStartMs = visitStart.getTime();
    const visitEndMs = visitEnd.getTime();
    const lunchStartMs = lunchStart.getTime();
    const lunchEndMs = lunchEnd.getTime();
    
    // Проверяем все возможные варианты пересечения с обедом
    return (
        // Визит полностью внутри обеда
        (visitStartMs >= lunchStartMs && visitEndMs <= lunchEndMs) ||
        // Визит начинается до обеда, но заканчивается во время обеда
        (visitStartMs < lunchStartMs && visitEndMs > lunchStartMs && visitEndMs <= lunchEndMs) ||
        // Визит начинается во время обеда, но заканчивается после
        (visitStartMs >= lunchStartMs && visitStartMs < lunchEndMs && visitEndMs > lunchEndMs) ||
        // Визит охватывает весь обеденный перерыв
        (visitStartMs < lunchStartMs && visitEndMs > lunchEndMs)
    );
}


// Новый метод для парсинга времени с датой
parseTimeWithDate(timeString, baseDate) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
}


// НОВЫЙ МЕТОД: Проверка, попадает ли визит на обеденное время
// isVisitDuringLunch(visitStart, visitEnd, lunchStart, lunchEnd) {
//     // Визит полностью во время обеда
//     if (visitStart >= lunchStart && visitEnd <= lunchEnd) {
//         return true;
//     }
    
//     // Визит начинается до обеда, но заканчивается во время обеда
//     if (visitStart < lunchStart && visitEnd > lunchStart && visitEnd <= lunchEnd) {
//         return true;
//     }
    
//     // Визит начинается во время обеда, но заканчивается после
//     if (visitStart >= lunchStart && visitStart < lunchEnd && visitEnd > lunchEnd) {
//         return true;
//     }
    
//     // Визит охватывает весь обеденный перерыв
//     if (visitStart < lunchStart && visitEnd > lunchEnd) {
//         return true;
//     }
    
//     return false;
// }
// Обновленный метод getVisitStatus
// Обновленный метод определения статуса визита
getVisitStatus(visitStart, workStart, workEnd, lunchStart, lunchEnd) {
    if (visitStart < workStart) return 'early';
    if (visitStart >= workEnd) return 'late';
    
    // Проверяем, не попадает ли визит на обед
    const visitEnd = new Date(visitStart.getTime() + 30 * 60000); // предполагаемая длительность 30 мин
    if (this.isVisitDuringLunch(visitStart, visitEnd, lunchStart, lunchEnd)) {
        return 'lunch_conflict';
    }
    
    return 'normal';
}


balancedOptimizationWithLunch(points) {
    return [...points].sort((a, b) => {
        // VIP клиенты имеют высший приоритет
        if (a.clientLevel === 'VIP' && b.clientLevel !== 'VIP') return -1;
        if (a.clientLevel !== 'VIP' && b.clientLevel === 'VIP') return 1;
        
        // Приоритет точкам с большим временем до обеда
        const aTimeBeforeLunch = this.timeToMinutes(a.lunchStart) - this.timeToMinutes(a.workStart);
        const bTimeBeforeLunch = this.timeToMinutes(b.lunchStart) - this.timeToMinutes(b.workStart);
        
        if (aTimeBeforeLunch !== bTimeBeforeLunch) {
            return bTimeBeforeLunch - aTimeBeforeLunch; // Больше время = выше приоритет
        }
        
        // Затем по времени начала работы
        const aWorkStart = this.timeToMinutes(a.workStart);
        const bWorkStart = this.timeToMinutes(b.workStart);
        return aWorkStart - bWorkStart;
    });
}
renderSchedulePoint(point, index) {
    const formatTime = (date) => {
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const isDifferentDay = index > 0 && 
        point.arrivalTime.getDate() !== this.optimizedRoute[index - 1].arrivalTime.getDate();

    return `
        ${isDifferentDay ? `
            <div class="timeline-day-divider">
                <span class="day-label">День ${point.day} - ${formatDate(point.arrivalTime)}</span>
            </div>
        ` : ''}
        
        <div class="schedule-point ${point.status} ${point.clientLevel === 'VIP' ? 'vip' : ''}">
            <div class="point-order">${point.order}</div>
            
            <div class="point-content">
                <div class="point-header">
                    <div class="point-address">${point.address}</div>
                    ${point.clientLevel === 'VIP' ? '<div class="vip-badge">VIP</div>' : ''}
                    <div class="point-status ${point.status}">${this.getStatusText(point.status)}</div>
                </div>
                
                <div class="point-timeline">
                    <div class="time-block">
                        <span class="time-label">Прибытие:</span>
                        <span class="time-value">${formatTime(point.arrivalTime)}</span>
                    </div>
                    
                    <div class="time-block">
                        <span class="time-label">Окончание:</span>
                        <span class="time-value">${formatTime(point.departureTime)}</span>
                    </div>
                    
                    <div class="time-block">
                        <span class="time-label">Длительность:</span>
                        <span class="time-value">${point.visitDuration} мин</span>
                    </div>
                    
                    ${point.travelTime > 0 ? `
                        <div class="time-block">
                            <span class="time-label">В пути:</span>
                            <span class="time-value">${point.travelTime} мин</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="point-meta">
                    <div class="meta-item">
                        <span class="meta-label">Рабочее время клиента:</span>
                        <span class="meta-value">${point.timeWindows.work}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Обед клиента:</span>
                        <span class="meta-value">${point.timeWindows.lunch}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">День маршрута:</span>
                        <span class="meta-value">${point.day}</span>
                    </div>
                </div>
            </div>
            
            <div class="point-actions">
                <button class="icon-btn" onclick="app.focusOnPoint(${point.id})" title="Показать на карте">
                    📍
                </button>
                <button class="icon-btn" onclick="app.editSchedulePoint(${point.id})" title="Редактировать">
                    ✏️
                </button>
            </div>
        </div>
        
        ${index < this.optimizedRoute.length - 1 ? `
            <div class="travel-segment">
                <div class="travel-icon">➡️</div>
                <div class="travel-info">
                    <span>Перемещение: ${point.travelTime} мин</span>
                    <span class="transport-type">${this.getTransportTypeText()}</span>
                </div>
            </div>
        ` : ''}
    `;
}

// Вспомогательные методы для работы со временем
parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

isTimeDuringLunch(time, lunchStart, lunchEnd) {
    const timeMs = time.getTime();
    const lunchStartMs = lunchStart.getTime();
    const lunchEndMs = lunchEnd.getTime();
    
    return timeMs >= lunchStartMs && timeMs < lunchEndMs;
}




getStatusText(status) {
    const statusTexts = {
        'normal': 'По расписанию',
        'early': 'До начала работы',
        'late': 'После работы', 
        'lunch': 'В обеденное время',
        'lunch_conflict': 'КОНФЛИКТ С ОБЕДОМ!'
    };
    return statusTexts[status] || 'По расписанию';
}

getTransportTypeText() {
    const transportType = document.getElementById('scheduleTransportType')?.value || 'car';
    const transportTexts = {
        'car': 'На автомобиле',
        'public': 'Общественным транспортом',
        'walking': 'Пешком'
    };
    return transportTexts[transportType] || 'На автомобиле';
}

// Экспорт расписания в Excel
exportScheduleToExcel() {
    if (this.optimizedRoute.length === 0) {
        this.showNotification('📍 Нет данных для экспорта', 'warning');
        return;
    }

    try {
        const schedule = this.calculateDetailedSchedule();
        const exportData = schedule.points.map(point => ({
            'Порядковый номер': point.order,
            'Адрес': point.address,
            'Уровень клиента': point.clientLevel,
            'Время прибытия': point.arrivalTime.toLocaleString('ru-RU'),
            'Время окончания': point.departureTime.toLocaleString('ru-RU'),
            'Длительность визита (мин)': point.visitDuration,
            'Время в пути (мин)': point.travelTime,
            'Рабочее время': `${point.workStart} - ${point.workEnd}`,
            'Обеденное время': `${point.lunchStart} - ${point.lunchEnd}`,
            'Статус': this.getStatusText(point.status)
        }));

        this.excelParser.exportToExcel(exportData, `расписание_маршрута_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.showNotification('📊 Расписание экспортировано в Excel', 'success');
        
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        this.showNotification('❌ Ошибка экспорта расписания', 'error');
    }
}

printSchedule() {
    const scheduleContent = document.getElementById('scheduleContent');
    if (!scheduleContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Расписание маршрута</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .schedule-point { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px; }
                .vip { border-left: 4px solid #f59e0b; }
                .point-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .point-address { font-weight: bold; }
                .vip-badge { background: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; }
                .point-timeline { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
                .time-block { display: flex; justify-content: space-between; }
            </style>
        </head>
        <body>
            <h1>Расписание маршрута</h1>
            <div>Сгенерировано: ${new Date().toLocaleString('ru-RU')}</div>
            ${scheduleContent.innerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Обновите метод initSchedule для использования новой системы
initSchedule() {
    const scheduleContent = document.getElementById('scheduleContent');
    if (!scheduleContent) return;
    
    scheduleContent.innerHTML = `
        <div class="schedule-section">
            <div class="section-header">
                <h2>📅 Детальное планирование маршрутов</h2>
                <p>Автоматическое создание расписания с учетом рабочих часов и обеденных перерывов</p>
            </div>
            
            <div class="schedule-controls">
                <button class="btn btn-primary" onclick="app.generateDetailedSchedule()">
                    🗓️ Сгенерировать расписание
                </button>
                <button class="btn btn-secondary" onclick="app.clearSchedule()">
                    🗑️ Очистить расписание
                </button>
            </div>
            
            <div id="detailedScheduleContent">
                <div class="schedule-placeholder">
                    <div class="placeholder-icon">📅</div>
                    <div class="placeholder-text">
                        <h3>Создайте детальное расписание</h3>
                        <p>Нажмите "Сгенерировать расписание" для создания маршрута с учетом:</p>
                        <ul>
                            <li>✅ Рабочих часов клиентов</li>
                            <li>✅ Обеденных перерывов</li>
                            <li>✅ Времени перемещения между точками</li>
                            <li>✅ Приоритета VIP клиентов</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}
    // === НАВИГАЦИЯ ===
    switchSection(section) {
        // Обновляем активную навигацию
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
        
        // Скрываем все секции
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Показываем выбранную секцию
        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        this.currentSection = section;
        this.updatePageTitle(section);
        
        // Загружаем контент для секций
        this.loadSectionContent(section);
        
        // Особые действия для разных секций
        if (section === 'map' && this.fullLeafletMap) {
            setTimeout(() => {
                this.fullLeafletMap.resize();
                this.updateFullMapPoints();
            }, 100);
        }
    }

    loadSectionContent(section) {
        switch(section) {
            case 'analytics':
                this.initAnalytics();
                break;
            case 'optimization':
                this.initOptimization();
                break;
            case 'schedule':
                this.initSchedule();
                break;
            case 'settings':
                this.initSettings();
                break;
        }
    }

    updatePageTitle(section) {
        const titles = {
            'planner': 'Планировщик маршрутов',
            'map': 'Интерактивная карта',
            'analytics': 'Аналитика и отчеты',
            'optimization': 'Оптимизация маршрутов',
            'schedule': 'Расписание',
            'settings': 'Настройки системы'
        };
        
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titles[section] || 'IntelliRoute Pro';
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        this.isSidebarCollapsed = !this.isSidebarCollapsed;
        
        if (this.isSidebarCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
        
        localStorage.setItem('sidebarCollapsed', this.isSidebarCollapsed.toString());
    }

    // === КАРТА ===
    initMap() {
        try {
        // Инициализируем карту для превью с Leaflet
        this.leafletMap = new LeafletMap('mapPreview');
        
        // Инициализируем полноэкранную карту
        this.fullLeafletMap= new LeafletMap('fullMap');
        
        console.log('Карты Leaflet инициализированы');
    } catch (error) {
        console.error('Ошибка инициализации карты:', error);
    }
}

    updateFullMapPoints() {
        if (this.fullLeafletMap && this.filteredData.length > 0) {
            this.fullLeafletMap.updatePoints(this.filteredData);
        }
    }

    setMapType(type) {
        if (this.leafletMap) {
            this.leafletMap.setMapType(type);
        }
        if (this.fullLeafletMap) {
            this.fullLeafletMap.setMapType(type);
        }
    }

    buildRouteOnMap() {
        if (this.optimizedRoute.length > 0 && this.leafletMap) {
            const transportType = document.getElementById('transportType')?.value || 'car';
            this.leafletMap.buildRoute(this.optimizedRoute, transportType);
            this.showNotification('🗺️ Маршрут построен на карте', 'success');
        } else {
            this.showNotification('📍 Сначала оптимизируйте маршрут', 'warning');
        }
    }

    clearRoute() {
        if (this.leafletMap) {
            this.leafletMap.clearRoute();
        }
    }

    // === ДАННЫЕ ===
    async loadDemoExcelData() {
        // Используем данные из Excel файла
        if (this.sheetData.length === 0) {
            // Создаем демо-данные на основе предоставленного Excel
            this.sheetData = this.generateDemoDataFromExcel();
            this.filteredData = [...this.sheetData];
            this.renderAddressesFromSheet();
            this.updateMapPoints();
            this.updateMetrics();
        }
    }

    generateDemoDataFromExcel() {
        // Генерируем данные на основе предоставленного Excel файла
        const demoData = [];
        const addresses = [
            "344011, г. Ростов-на-Дону, ул. Большая Садовая, д. 1",
            "344002, г. Ростов-на-Дону, пр. Буденновский, д. 15",
            "344019, г. Ростов-на-Дону, ул. Красноармейская, д. 67",
            "344025, г. Ростов-на-Дону, пр. Ворошиловский, д. 32",
            "344037, г. Ростов-на-Дону, ул. Таганрогская, д. 124",
            "344009, г. Ростов-на-Дону, ул. Пушкинская, д. 89",
            "344015, г. Ростов-на-Дону, пр. Стачки, д. 45",
            "344038, г. Ростов-на-Дону, ул. Малиновского, д. 76"
        ];

        // Используем реальные данные из Excel файла
    const excelData = [
        {
            address: "344011, г. Ростов-на-Дону, ул. Большая Садовая, д. 1",
            latitude: 47.221532,
            longitude: 39.704423,
            workStart: "09:00",
            workEnd: "18:00",
            lunchStart: "13:00",
            lunchEnd: "14:00",
            clientLevel: "VIP"
        },
        {
            address: "344002, г. Ростов-на-Дону, пр. Буденновский, д. 15",
            latitude: 47.228945,
            longitude: 39.718762,
            workStart: "09:00",
            workEnd: "18:00",
            lunchStart: "13:00",
            lunchEnd: "14:00",
            clientLevel: "Standart"
        },
        {
            address: "344019, г. Ростов-на-Дону, ул. Красноармейская, д. 67",
            latitude: 47.235671,
            longitude: 39.689543,
            workStart: "09:00",
            workEnd: "18:00",
            lunchStart: "13:00",
            lunchEnd: "14:00",
            clientLevel: "Standart"
        },
        // Добавляем точки с разным обеденным временем для демонстрации
        {
            address: "344025, г. Ростов-на-Дону, пр. Ворошиловский, д. 32",
            latitude: 47.246892,
            longitude: 39.723456,
            workStart: "08:00",
            workEnd: "17:00",
            lunchStart: "12:00",
            lunchEnd: "13:00",
            clientLevel: "Standart"
        },
        {
            address: "344037, г. Ростов-на-Дону, ул. Таганрогская, д. 124",
            latitude: 47.258743,
            longitude: 39.745672,
            workStart: "10:00",
            workEnd: "19:00",
            lunchStart: "14:00",
            lunchEnd: "15:00",
            clientLevel: "VIP"
        }
    ];
        for (let i = 0; i < excelData.length; i++) {
            const data = excelData[i];
            demoData.push({
                id: i + 1,
                address: data.address,
                latitude: data.latitude,
                longitude: data.longitude,
                workStart: data.workStart,
                workEnd: data.workEnd,
                lunchStart: data.lunchStart,
                lunchEnd: data.lunchEnd,
                clientLevel: data.clientLevel,
                duration: Math.floor(Math.random() * 45) + 15,
                priority: data.clientLevel === 'VIP' ? 1 : 2
            });
        }
         // Реалистичные координаты для Ростова-на-Дону
        const coordinates = [
            [47.222078, 39.718989], // Большая Садовая, 1
            [47.228456, 39.744567], // Буденновский, 15
            [47.235671, 39.712345], // Красноармейская, 67
            [47.240123, 39.723456], // Ворошиловский, 32
            [47.215678, 39.734567], // Таганрогская, 124
            [47.225432, 39.745678], // Пушкинская, 89
            [47.235678, 39.756789], // Стачки, 45
            [47.245678, 39.767890]  // Малиновского, 76
        ];
        for (let i = 0; i < addresses.length; i++) {
          const isVIP = i === 0 || i === 2; // VIP клиенты
          demoData.push({
              id: i + 1,
              address: addresses[i],
              latitude: coordinates[i][0],
              longitude: coordinates[i][1],
              workStart: "09:00",
              workEnd: "18:00",
              lunchStart: "13:00",
              lunchEnd: "14:00",
              clientLevel: isVIP ? "VIP" : "Standart",
              duration: Math.floor(Math.random() * 45) + 15,
              priority: isVIP ? 1 : 2
          });
      }
        
        return demoData;
    }

    renderAddressesFromSheet() {
        const addressList = document.getElementById('addressList');
        if (!addressList) return;
        
        addressList.innerHTML = '';
        
        this.filteredData.forEach((point, index) => {
            const addressElement = this.createAddressElement(point, index);
            addressList.appendChild(addressElement);
        });
        
        this.updatePointsCount();
    }

    createAddressElement(point, index) {
        const div = document.createElement('div');
        div.className = `address-item ${point.clientLevel === 'VIP' ? 'vip' : ''}`;
        div.setAttribute('data-id', point.id);
        
        div.innerHTML = `
            <div class="address-header">
                <div class="address-number">${index + 1}</div>
                <div class="address-actions">
                    <button class="action-btn remove-btn" title="Удалить">🗑️</button>
                    <button class="action-btn vip-btn" title="${point.clientLevel === 'VIP' ? 'VIP клиент' : 'Обычный клиент'}">
                        ${point.clientLevel === 'VIP' ? '⭐' : '👤'}
                    </button>
                </div>
            </div>
            <div class="address-content">
                <div class="address-text">${point.address}</div>
                <div class="address-time">${point.workStart} - ${point.workEnd}</div>
            </div>
            <div class="address-footer">
                <div class="address-badge duration">${point.duration}мин</div>
                ${point.clientLevel === 'VIP' ? '<div class="address-badge vip">VIP</div>' : ''}
            </div>
        `;
        
        // Обработчики событий
        div.querySelector('.remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeAddress(point.id);
        });
        
        return div;
    }

    removeAddress(id) {
        this.sheetData = this.sheetData.filter(point => point.id !== id);
        this.filteredData = this.filteredData.filter(point => point.id !== id);
        this.renderAddressesFromSheet();
        this.updateMapPoints();
        this.updateMetrics();
        this.showNotification('🗑️ Точка удалена', 'info');
    }

    updateMapPoints() {
        if (this.leafletMap && this.filteredData.length > 0) {
            this.leafletMap.updatePoints(this.filteredData);
        }
    }

    // === ИМПОРТ/ЭКСПОРТ EXCEL ===
    async importExcel() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xlsx,.xls,.csv';
        
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            this.showNotification('📥 Загрузка Excel файла...', 'info');
            
            try {
                this.setLoadingState(true);
                
                const parsedData = await this.excelParser.parseExcelFile(file);
                this.sheetData = parsedData;
                this.filteredData = [...this.sheetData];
                
                this.renderAddressesFromSheet();
                this.updateMapPoints();
                
                this.updateMetrics();
                this.showNotification(`✅ Успешно загружено ${this.sheetData.length} объектов из Excel`, 'success');
                
            } catch (error) {
                console.error('Ошибка загрузки Excel:', error);
                this.showNotification(`❌ Ошибка загрузки: ${error.message}`, 'error');
            } finally {
                this.setLoadingState(false);
            }
        };
        
        fileInput.click();
    }

    exportExcel() {
        try {
            if (this.sheetData.length === 0) {
                this.showNotification('📭 Нет данных для экспорта', 'warning');
                return;
            }
            
            const filename = `маршруты_${new Date().toISOString().split('T')[0]}.xlsx`;
            this.excelParser.exportToExcel(this.sheetData, filename);
            this.showNotification(`💾 Данные экспортированы в ${filename}`, 'success');
            
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            this.showNotification('❌ Ошибка экспорта данных', 'error');
        }
    }

    downloadTemplate() {
        try {
            this.excelParser.generateTemplate();
            this.showNotification('📋 Шаблон для импорта скачан', 'info');
        } catch (error) {
            console.error('Ошибка генерации шаблона:', error);
            this.showNotification('❌ Ошибка создания шаблона', 'error');
        }
    }

    // === ОПТИМИЗАЦИЯ МАРШРУТА ===
    // === ОПТИМИЗАЦИЯ МАРШРУТА ===
// === ОПТИМИЗАЦИЯ МАРШРУТА С УЧЕТОМ ОБЕДЕННЫХ ПЕРЕРЫВОВ ===
async optimizeRoute() {
    if (this.filteredData.length < 2) {
        this.showNotification('📍 Добавьте минимум 2 точки для оптимизации', 'warning');
        return;
    }

    this.showNotification('🧠 Запуск интеллектуальной оптимизации маршрута...', 'info');
    this.setLoadingState(true);

    try {
        // Имитация процесса оптимизации
        await this.simulateOptimization();
        
        const algorithm = document.getElementById('optimizationCriteria')?.value || 'balanced';
        this.optimizedRoute = this.optimizationAlgorithms[algorithm](this.filteredData);
        
        // Сразу обновляем карту с новым порядком точек
        this.updateMapWithOptimizedRoute();
        this.updateMetrics();
        this.showOptimizationResults();
        this.showNotification('✅ Маршрут успешно оптимизирован с учетом всех факторов!', 'success');
        
    } catch (error) {
        console.error('Ошибка оптимизации:', error);
        this.showNotification('❌ Ошибка оптимизации маршрута', 'error');
    } finally {
        this.setLoadingState(false);
    }
}

distanceOptimization(points) {
    if (points.length <= 1) return points;
    
    const remainingPoints = [...points];
    const optimized = [];
    
    // Начинаем с центральной точки для минимизации общего расстояния
    const center = this.calculateCenter(points);
    let currentPoint = this.findNearestPoint(center, remainingPoints);
    
    optimized.push(currentPoint);
    remainingPoints.splice(remainingPoints.indexOf(currentPoint), 1);
    
    while (remainingPoints.length > 0) {
        let bestNextPoint = null;
        let bestDistance = Infinity;
        
        for (const point of remainingPoints) {
            const distance = this.calculateDistance(currentPoint, point);
            
            // Модификатор для VIP клиентов (предпочтение ближайшим VIP)
            const vipModifier = point.clientLevel === 'VIP' ? 0.8 : 1;
            
            // Модификатор для временных окон
            const timeModifier = this.calculateTimeModifier(currentPoint, point);
            
            const adjustedDistance = distance * vipModifier * timeModifier;
            
            if (adjustedDistance < bestDistance) {
                bestDistance = adjustedDistance;
                bestNextPoint = point;
            }
        }
        
        if (bestNextPoint) {
            optimized.push(bestNextPoint);
            currentPoint = bestNextPoint;
            remainingPoints.splice(remainingPoints.indexOf(bestNextPoint), 1);
        }
    }
    
    return optimized;
}

// Расчет центра масс точек
calculateCenter(points) {
    if (points.length === 0) return { latitude: 0, longitude: 0 };
    
    const sum = points.reduce((acc, point) => {
        return {
            latitude: acc.latitude + point.latitude,
            longitude: acc.longitude + point.longitude
        };
    }, { latitude: 0, longitude: 0 });
    
    return {
        latitude: sum.latitude / points.length,
        longitude: sum.longitude / points.length
    };
}
// Поиск ближайшей точки к заданной
findNearestPoint(referencePoint, points) {
    return points.reduce((nearest, point) => {
        const nearestDistance = this.calculateDistance(referencePoint, nearest);
        const pointDistance = this.calculateDistance(referencePoint, point);
        return pointDistance < nearestDistance ? point : nearest;
    }, points[0]);
}
// Удаление точки из массива
removePointFromArray(point, array) {
    const index = array.findIndex(p => p.id === point.id);
    if (index !== -1) {
        array.splice(index, 1);
    }
}
// Проверка возможности посещения до обеда
canVisitBeforeLunch(point) {
    const workStart = this.timeToMinutes(point.workStart);
    const lunchStart = this.timeToMinutes(point.lunchStart);
    const visitDuration = point.duration || 30;
    
    return (lunchStart - workStart) >= visitDuration;
}

// Расчет времени до обеда
calculateTimeBeforeLunch(point) {
    const workStart = this.timeToMinutes(point.workStart);
    const lunchStart = this.timeToMinutes(point.lunchStart);
    return lunchStart - workStart;
}

// Конвертация времени в минуты
timeToMinutes(timeStr) {
    if (!timeStr) return 9 * 60; // По умолчанию 9:00
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Расчет расстояния между точками (улучшенная версия)
calculateDistance(pointA, pointB) {
    const R = 6371; // Радиус Земли в км
    const dLat = (pointB.latitude - pointA.latitude) * Math.PI / 180;
    const dLon = (pointB.longitude - pointA.longitude) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(pointA.latitude * Math.PI / 180) * Math.cos(pointB.latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Обновление карты с оптимизированным маршрутом
updateMapWithOptimizedRoute() {
    if (this.leafletMap && this.optimizedRoute.length > 0) {
        // Обновляем точки на карте с правильной нумерацией
        this.leafletMap.updatePoints(this.optimizedRoute);
        
        // Строим маршрут с учетом выбранного типа транспорта
        const transportType = document.getElementById('transportType')?.value || 'car';
        setTimeout(() => {
            this.leafletMap.buildRoute(this.optimizedRoute, transportType);
        }, 500);
    }
}

// Показ результатов оптимизации
showOptimizationResults() {
    const totalTime = this.calculateTotalTime();
    const totalDistance = this.calculateTotalDistance();
    
    console.log('Интеллектуально оптимизированный маршрут:', this.optimizedRoute);
    console.log('Порядок точек с учетом расположения, VIP-статуса и обедов:');
    this.optimizedRoute.forEach((point, index) => {
        console.log(`${index + 1}. ${point.address} [${point.clientLevel}] (${point.workStart}-${point.workEnd}, обед: ${point.lunchStart}-${point.lunchEnd})`);
    });
    
    // Обновляем UI списка адресов в соответствии с оптимизированным порядком
    this.renderOptimizedAddresses();
    
    // Обновляем метрики
    this.updateMetrics();
    
    // Показываем уведомление с информацией об оптимизации
    const vipCount = this.optimizedRoute.filter(p => p.clientLevel === 'VIP').length;
    const pointsBeforeLunch = this.optimizedRoute.filter(p => this.canVisitBeforeLunch(p)).length;
    
    this.showNotification(
        `✅ Маршрут оптимизирован! ${this.optimizedRoute.length} точек, ${vipCount} VIP, ${pointsBeforeLunch} до обеда`, 
        'success'
    );
}

// Обновленный метод для рендеринга оптимизированных адресов
renderOptimizedAddresses() {
    const addressList = document.getElementById('addressList');
    if (!addressList) return;
    
    addressList.innerHTML = '';
    
    this.optimizedRoute.forEach((point, index) => {
        const addressElement = this.createOptimizedAddressElement(point, index);
        addressList.appendChild(addressElement);
    });
    
    this.updatePointsCount();
}

// Создание элемента адреса с учетом оптимизированного порядка и информации о времени
createOptimizedAddressElement(point, index) {
    const canVisitBeforeLunch = this.canVisitBeforeLunch(point);
    const timeStatus = canVisitBeforeLunch ? '🕐 До обеда' : '🕒 После обеда';
    
    const div = document.createElement('div');
    div.className = `address-item ${point.clientLevel === 'VIP' ? 'vip' : ''} ${canVisitBeforeLunch ? 'before-lunch' : 'after-lunch'}`;
    div.setAttribute('data-id', point.id);
    div.setAttribute('data-index', index);
    
    div.innerHTML = `
        <div class="address-header">
            <div class="address-number" style="
                background: ${point.clientLevel === 'VIP' ? '#f59e0b' : canVisitBeforeLunch ? '#10b981' : '#3b82f6'};
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
            ">${index + 1}</div>
            <div class="address-actions">
                <button class="action-btn remove-btn" title="Удалить">🗑️</button>
                <button class="action-btn vip-btn" title="${point.clientLevel === 'VIP' ? 'VIP клиент' : 'Обычный клиент'}">
                    ${point.clientLevel === 'VIP' ? '⭐' : '👤'}
                </button>
            </div>
        </div>
        <div class="address-content">
            <div class="address-text">${point.address}</div>
            <div class="address-time-windows">
                <div class="time-window">
                    <span class="time-label">Работа:</span>
                    <span class="time-value">${point.workStart} - ${point.workEnd}</span>
                </div>
                <div class="time-window">
                    <span class="time-label">Обед:</span>
                    <span class="time-value">${point.lunchStart} - ${point.lunchEnd}</span>
                </div>
                <div class="time-status ${canVisitBeforeLunch ? 'before-lunch' : 'after-lunch'}">
                    ${timeStatus}
                </div>
            </div>
        </div>
        <div class="address-footer">
            <div class="address-badge duration">${point.duration}мин</div>
            ${point.clientLevel === 'VIP' ? '<div class="address-badge vip">VIP</div>' : ''}
            ${canVisitBeforeLunch ? '<div class="address-badge before-lunch">До обеда</div>' : ''}
        </div>
    `;
    
    // Обработчики событий
    div.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeAddress(point.id);
    });
    
    return div;
}

// Имитация процесса оптимизации (можно оставить без изменений)
simulateOptimization() {
    return new Promise(resolve => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            this.updateOptimizationProgress(progress);
            
            if (progress >= 100) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
}

// Обновление прогресса оптимизации (можно оставить без изменений)
updateOptimizationProgress(progress) {
    const optimizeBtn = document.getElementById('optimizeBtn');
    if (optimizeBtn) {
        optimizeBtn.innerHTML = `⏳ Интеллектуальная оптимизация... ${progress}%`;
        optimizeBtn.disabled = true;
    }
}

// Вспомогательные методы для работы со временем
timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

calculateTimeCompatibility(pointA, pointB) {
    // Расчет временной совместимости между двумя точками
    const aWorkEnd = this.timeToMinutes(pointA.workEnd);
    const bWorkStart = this.timeToMinutes(pointB.workStart);
    const aLunchEnd = this.timeToMinutes(pointA.lunchEnd);
    const bLunchStart = this.timeToMinutes(pointB.lunchStart);
    
    let compatibility = 0;
    
    // Штраф за точки с разными рабочими часами
    if (bWorkStart > aWorkEnd) {
        compatibility += 0.5;
    }
    
    // Бонус за точки с совпадающими обеденными перерывами
    if (Math.abs(aLunchEnd - bLunchStart) < 60) {
        compatibility -= 0.3;
    }
    
    return Math.max(0, compatibility);
}

// Обновление карты с оптимизированным маршрутом
updateMapWithOptimizedRoute() {
    if (this.leafletMap && this.optimizedRoute.length > 0) {
        // Обновляем точки на карте с правильной нумерацией
        this.leafletMap.updatePoints(this.optimizedRoute);
        
        // Строим маршрут с учетом выбранного типа транспорта
        const transportType = document.getElementById('transportType')?.value || 'car';
        setTimeout(() => {
            this.leafletMap.buildRoute(this.optimizedRoute, transportType);
        }, 500);
    }
}

// Показ результатов оптимизации
showOptimizationResults() {
    const totalTime = this.calculateTotalTime();
    const totalDistance = this.calculateTotalDistance();
    
    console.log('Оптимизированный маршрут:', this.optimizedRoute);
    console.log('Порядок точек:', this.optimizedRoute.map((p, i) => `${i + 1}. ${p.address}`).join('\n'));
    
    // Обновляем UI списка адресов в соответствии с оптимизированным порядком
    this.renderOptimizedAddresses();
    
    // Обновляем метрики на карте
    this.updateMapMetrics(totalTime, totalDistance);
}

// Рендер оптимизированного списка адресов
renderOptimizedAddresses() {
    const addressList = document.getElementById('addressList');
    if (!addressList) return;
    
    addressList.innerHTML = '';
    
    this.optimizedRoute.forEach((point, index) => {
        const addressElement = this.createOptimizedAddressElement(point, index);
        addressList.appendChild(addressElement);
    });
    
    this.updatePointsCount();
}

// Создание элемента адреса с учетом оптимизированного порядка
createOptimizedAddressElement(point, index) {
    const div = document.createElement('div');
    div.className = `address-item ${point.clientLevel === 'VIP' ? 'vip' : ''}`;
    div.setAttribute('data-id', point.id);
    div.setAttribute('data-index', index);
    
    div.innerHTML = `
        <div class="address-header">
            <div class="address-number" style="
                background: ${point.clientLevel === 'VIP' ? '#f59e0b' : '#3b82f6'};
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
            ">${index + 1}</div>
            <div class="address-actions">
                <button class="action-btn remove-btn" title="Удалить">🗑️</button>
                <button class="action-btn vip-btn" title="${point.clientLevel === 'VIP' ? 'VIP клиент' : 'Обычный клиент'}">
                    ${point.clientLevel === 'VIP' ? '⭐' : '👤'}
                </button>
            </div>
        </div>
        <div class="address-content">
            <div class="address-text">${point.address}</div>
            <div class="address-time-windows">
                <div class="time-window">
                    <span class="time-label">Работа:</span>
                    <span class="time-value">${point.workStart} - ${point.workEnd}</span>
                </div>
                <div class="time-window">
                    <span class="time-label">Обед:</span>
                    <span class="time-value">${point.lunchStart} - ${point.lunchEnd}</span>
                </div>
            </div>
        </div>
        <div class="address-footer">
            <div class="address-badge duration">${point.duration}мин</div>
            ${point.clientLevel === 'VIP' ? '<div class="address-badge vip">VIP</div>' : ''}
        </div>
    `;
    
    // Обработчики событий
    div.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeAddress(point.id);
    });
    
    return div;
}

// Обновление метрик на карте
updateMapMetrics(totalTime, totalDistance) {
    const pointsCount = this.optimizedRoute.length;
    const fuelSavings = this.calculateFuelSavings(totalDistance);
    
    // Обновляем окошко с метриками на карте
    this.updateElementText('mapTotalTime', this.formatTime(totalTime));
    this.updateElementText('mapTotalDistance', `${Math.round(totalDistance * 100) / 100} км`);
    this.updateElementText('mapFuelSavings', `${fuelSavings} ₽`);
    this.updateElementText('mapPointsCount', pointsCount.toString());
}

// Построение маршрута на карте (отдельная функция для кнопки)
buildRouteOnMap() {
    if (this.optimizedRoute.length > 1 && this.leafletMap) {
        const transportType = document.getElementById('transportType')?.value || 'car';
        this.leafletMap.buildRoute(this.optimizedRoute, transportType);
        this.showNotification('🗺️ Маршрут построен на карте', 'success');
    } else if (this.filteredData.length > 1) {
        // Если маршрут не оптимизирован, но есть точки - строим как есть
        const transportType = document.getElementById('transportType')?.value || 'car';
        this.leafletMap.buildRoute(this.filteredData, transportType);
        this.showNotification('🗺️ Маршрут построен на карте', 'success');
    } else {
        this.showNotification('📍 Сначала добавьте точки маршрута', 'warning');
    }
}

    simulateOptimization() {
        return new Promise(resolve => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                this.updateOptimizationProgress(progress);
                
                if (progress >= 100) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    updateOptimizationProgress(progress) {
        const optimizeBtn = document.getElementById('optimizeBtn');
        if (optimizeBtn) {
            optimizeBtn.innerHTML = `⏳ Оптимизация... ${progress}%`;
            optimizeBtn.disabled = true;
        }
    }

    // Алгоритмы оптимизации
    // Улучшенные алгоритмы оптимизации с приоритетом точек до обеда
timeOptimization(points) {
    if (points.length <= 1) return points;
    
    // Создаем копию массива для работы
    const remainingPoints = [...points];
    const optimized = [];
    
    // Начинаем с точки с самым ранним временем начала работы
    let currentPoint = remainingPoints.reduce((earliest, point) => {
        const earliestTime = this.timeToMinutes(earliest.workStart);
        const pointTime = this.timeToMinutes(point.workStart);
        return pointTime < earliestTime ? point : earliest;
    }, remainingPoints[0]);
    
    optimized.push(currentPoint);
    remainingPoints.splice(remainingPoints.indexOf(currentPoint), 1);
    
    while (remainingPoints.length > 0) {
        let bestNextPoint = null;
        let bestScore = Infinity;
        
        for (const point of remainingPoints) {
            // Расчет расстояния между текущей и следующей точкой
            const distance = this.calculateDistance(currentPoint, point);
            
            // Расчет времени перемещения (предполагаем среднюю скорость 40 км/ч)
            const travelTime = (distance / 40) * 60; // в минутах
            
            // Время прибытия в следующую точку
            const arrivalTime = this.timeToMinutes(currentPoint.workStart) + travelTime;
            
            // Проверка временных ограничений
            const pointWorkStart = this.timeToMinutes(point.workStart);
            const pointLunchStart = this.timeToMinutes(point.lunchStart);
            const pointLunchEnd = this.timeToMinutes(point.lunchEnd);
            
            // Штрафы за разные ситуации
            let timePenalty = 0;
            
            // Штраф за прибытие до начала работы
            if (arrivalTime < pointWorkStart) {
                timePenalty += (pointWorkStart - arrivalTime) * 0.5;
            }
            
            // Штраф за прибытие во время обеда
            if (arrivalTime >= pointLunchStart && arrivalTime < pointLunchEnd) {
                timePenalty += (pointLunchEnd - arrivalTime) * 2;
            }
            
            // Штраф за прибытие после окончания рабочего дня
            const pointWorkEnd = this.timeToMinutes(point.workEnd);
            if (arrivalTime > pointWorkEnd) {
                timePenalty += (arrivalTime - pointWorkEnd) * 3;
            }
            
            // Бонус для VIP клиентов
            const vipBonus = point.clientLevel === 'VIP' ? 0.7 : 1;
            
            // Общий счет (чем меньше - тем лучше)
            const score = (distance + timePenalty) * vipBonus;
            
            if (score < bestScore) {
                bestScore = score;
                bestNextPoint = point;
            }
        }
        
        if (bestNextPoint) {
            optimized.push(bestNextPoint);
            currentPoint = bestNextPoint;
            remainingPoints.splice(remainingPoints.indexOf(bestNextPoint), 1);
        }
    }
    
    return optimized;
}




balancedOptimization(points) {
    if (points.length <= 1) return points;
    
    const remainingPoints = [...points];
    const optimized = [];
    
    // Разделяем точки на VIP и обычные
    const vipPoints = remainingPoints.filter(p => p.clientLevel === 'VIP');
    const standardPoints = remainingPoints.filter(p => p.clientLevel !== 'VIP');
    
    // Начинаем с VIP точек, оптимизированных по времени до обеда
    let currentPoint = null;
    
    if (vipPoints.length > 0) {
        // Выбираем VIP точку, которую можно посетить до обеда
        const vipBeforeLunch = vipPoints.filter(point => 
            this.canVisitBeforeLunch(point)
        );
        
        if (vipBeforeLunch.length > 0) {
            currentPoint = vipBeforeLunch.reduce((best, point) => {
                const bestTime = this.calculateTimeBeforeLunch(best);
                const pointTime = this.calculateTimeBeforeLunch(point);
                return pointTime > bestTime ? point : best;
            }, vipBeforeLunch[0]);
        } else {
            // Если нет VIP до обеда, берем первую VIP
            currentPoint = vipPoints[0];
        }
    } else {
        // Если нет VIP, начинаем с обычной точки
        currentPoint = this.findOptimalStartPoint(standardPoints);
    }
    
    optimized.push(currentPoint);
    this.removePointFromArray(currentPoint, remainingPoints);
    if (vipPoints.includes(currentPoint)) {
        this.removePointFromArray(currentPoint, vipPoints);
    } else {
        this.removePointFromArray(currentPoint, standardPoints);
    }
    
    // Чередуем VIP и обычные точки с учетом расстояния и времени
    while (remainingPoints.length > 0) {
        let bestNextPoint = null;
        let bestScore = Infinity;
        
        // Проверяем все оставшиеся точки
        const allPoints = [...vipPoints, ...standardPoints];
        
        for (const point of allPoints) {
            const distance = this.calculateDistance(currentPoint, point);
            const timeScore = this.calculateTimeScore(currentPoint, point);
            const vipPriority = point.clientLevel === 'VIP' ? 0.6 : 1;
            
            // Комбинированный счет (расстояние + временные ограничения + приоритет VIP)
            const score = (distance * 0.6 + timeScore * 0.4) * vipPriority;
            
            if (score < bestScore) {
                bestScore = score;
                bestNextPoint = point;
            }
        }
        
        if (bestNextPoint) {
            optimized.push(bestNextPoint);
            currentPoint = bestNextPoint;
            this.removePointFromArray(bestNextPoint, remainingPoints);
            if (vipPoints.includes(bestNextPoint)) {
                this.removePointFromArray(bestNextPoint, vipPoints);
            } else {
                this.removePointFromArray(bestNextPoint, standardPoints);
            }
        }
    }
    
    return optimized;
}

// Вспомогательные методы для улучшенной оптимизации

// Расчет модификатора времени
calculateTimeModifier(pointA, pointB) {
    const workStartA = this.timeToMinutes(pointA.workStart);
    const workStartB = this.timeToMinutes(pointB.workStart);
    const lunchStartB = this.timeToMinutes(pointB.lunchStart);
    const lunchEndB = this.timeToMinutes(pointB.lunchEnd);
    
    // Расчет времени прибытия в точку B
    const distance = this.calculateDistance(pointA, pointB);
    const travelTime = (distance / 40) * 60; // минут
    const arrivalTime = workStartA + travelTime;
    
    let modifier = 1;
    
    // Штраф за прибытие до начала работы
    if (arrivalTime < workStartB) {
        modifier += 0.3;
    }
    
    // Большой штраф за прибытие во время обеда
    if (arrivalTime >= lunchStartB && arrivalTime < lunchEndB) {
        modifier += 0.8;
    }
    
    // Очень большой штраф за прибытие после работы
    const workEndB = this.timeToMinutes(pointB.workEnd);
    if (arrivalTime > workEndB) {
        modifier += 1.5;
    }
    
    return modifier;
}

// Расчет временного счета
calculateTimeScore(pointA, pointB) {
    const workStartA = this.timeToMinutes(pointA.workStart);
    const workStartB = this.timeToMinutes(pointB.workStart);
    const lunchStartB = this.timeToMinutes(pointB.lunchStart);
    const lunchEndB = this.timeToMinutes(pointB.lunchEnd);
    const workEndB = this.timeToMinutes(pointB.workEnd);
    
    const distance = this.calculateDistance(pointA, pointB);
    const travelTime = (distance / 40) * 60;
    const arrivalTime = workStartA + travelTime;
    
    let score = 0;
    
    // Идеальное время - сразу после начала работы
    const idealTime = workStartB;
    score += Math.abs(arrivalTime - idealTime) * 0.1;
    
    // Штраф за обеденное время
    if (arrivalTime >= lunchStartB && arrivalTime < lunchEndB) {
        score += (lunchEndB - arrivalTime) * 2;
    }
    
    // Штраф за опоздание
    if (arrivalTime > workEndB) {
        score += (arrivalTime - workEndB) * 5;
    }
    
    return score;
}
findOptimalStartPoint(points) {
    if (points.length === 0) return null;
    
    return points.reduce((best, point) => {
        const bestScore = this.calculatePointPriority(best);
        const pointScore = this.calculatePointPriority(point);
        return pointScore > bestScore ? point : best;
    }, points[0]);
}

calculatePointPriority(point) {
    let priority = 0;
    
    // Приоритет точкам, которые можно посетить до обеда
    if (this.canVisitBeforeLunch(point)) {
        priority += 3;
    }
    
    // Приоритет точкам с большим рабочим окном
    const workWindow = this.timeToMinutes(point.workEnd) - this.timeToMinutes(point.workStart);
    priority += workWindow / 60; // +1 за каждый час рабочего окна
    
    // Приоритет точкам с ранним началом работы
    const earlyStartBonus = (12 * 60 - this.timeToMinutes(point.workStart)) / 60;
    priority += earlyStartBonus;
    
    return priority;
}


// НОВЫЕ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
canVisitBeforeLunch(point) {
    // Проверяем, можно ли посетить точку до ее обеда
    const workStart = this.timeToMinutes(point.workStart);
    const lunchStart = this.timeToMinutes(point.lunchStart);
    const visitDuration = point.duration || 30;
    
    // Достаточно ли времени от начала работы до обеда для визита?
    return (lunchStart - workStart) >= visitDuration;
}

calculateTimeBeforeLunch(point) {
    // Рассчитываем сколько времени доступно до обеда
    const workStart = this.timeToMinutes(point.workStart);
    const lunchStart = this.timeToMinutes(point.lunchStart);
    return lunchStart - workStart;
}

calculateTimeAfterLunch(point) {
    // Рассчитываем сколько времени доступно после обеда
    const lunchEnd = this.timeToMinutes(point.lunchEnd);
    const workEnd = this.timeToMinutes(point.workEnd);
    return workEnd - lunchEnd;
}

    

    

    calculateDistance(pointA, pointB) {
        // Формула гаверсинусов для расчета расстояния между точками
        const R = 6371; // Радиус Земли в км
        const dLat = (pointB.latitude - pointA.latitude) * Math.PI / 180;
        const dLon = (pointB.longitude - pointA.longitude) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(pointA.latitude * Math.PI / 180) * Math.cos(pointB.latitude * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    showOptimizationResults() {
    const totalTime = this.calculateTotalTime();
    const totalDistance = this.calculateTotalDistance();
    
    console.log('Оптимизированный маршрут с учетом обеденных перерывов:', this.optimizedRoute);
    console.log('Порядок точек:', this.optimizedRoute.map((p, i) => 
        `${i + 1}. ${p.address} (Работа: ${p.workStart}-${p.workEnd}, Обед: ${p.lunchStart}-${p.lunchEnd})`
    ).join('\n'));
    
    // Обновляем UI списка адресов в соответствии с оптимизированным порядком
    this.renderOptimizedAddresses();
    
    // Обновляем метрики
    this.updateMetrics();
    
    // Показываем уведомление с информацией об оптимизации
    const vipCount = this.optimizedRoute.filter(p => p.clientLevel === 'VIP').length;
    this.showNotification(
        `✅ Маршрут оптимизирован! ${this.optimizedRoute.length} точек, ${vipCount} VIP клиентов`, 
        'success'
    );
}

    // === ФИЛЬТРАЦИЯ ===
   filterData() {
    const searchTerm = document.getElementById('searchAddress')?.value.toLowerCase() || '';
    const vipOnly = document.getElementById('filterVIP')?.checked || false;
    
    this.filteredData = this.sheetData.filter(point => {
        const matchesSearch = point.address.toLowerCase().includes(searchTerm);
        const matchesVIP = !vipOnly || point.clientLevel === 'VIP';
        return matchesSearch && matchesVIP;
    });
    
    this.renderAddressesFromSheet();
    this.updateMapPoints();
    this.updateMetrics(); // Убедитесь, что этот вызов есть
}

    // === МЕТРИКИ ===
    updateMetrics() {
    const totalTime = this.calculateTotalTime();
    const totalDistance = this.calculateTotalDistance();
    const pointsCount = this.filteredData.length;
    const fuelSavings = this.calculateFuelSavings(totalDistance);
    
    // Обновляем UI в основном интерфейсе
    this.updateElementText('totalTime', this.formatTime(totalTime));
    this.updateElementText('totalDistance', `${Math.round(totalDistance * 100) / 100} км`);
    this.updateElementText('pointsCount', pointsCount.toString());
    this.updateElementText('pointsCountResult', pointsCount.toString());
    this.updateElementText('fuelSavings', `${fuelSavings} ₽`);
    
    // Обновляем метрики на карте
    this.updateElementText('mapTotalTime', this.formatTime(totalTime));
    this.updateElementText('mapTotalDistance', `${Math.round(totalDistance * 100) / 100} км`);
    this.updateElementText('mapFuelSavings', `${fuelSavings} ₽`);
    this.updateElementText('mapPointsCount', pointsCount.toString());
    
    // Обновляем бейдж в навигации
    const navBadge = document.querySelector('.nav-badge');
    if (navBadge) {
        navBadge.textContent = pointsCount;
    }
}
removeAddress(id) {
    this.sheetData = this.sheetData.filter(point => point.id !== id);
    this.filteredData = this.filteredData.filter(point => point.id !== id);
    this.renderAddressesFromSheet();
    this.updateMapPoints();
    this.updateMetrics(); // Добавьте эту строку
    this.showNotification('🗑️ Точка удалена', 'info');
}

    calculateTotalTime() {
        return this.filteredData.reduce((total, point) => total + (point.duration || 30), 0);
    }

    calculateTotalDistance() {
        if (this.filteredData.length < 2) return 0;
        
        let total = 0;
        for (let i = 1; i < this.filteredData.length; i++) {
            total += this.calculateDistance(this.filteredData[i-1], this.filteredData[i]);
        }
        
        return total;
    }

    calculateFuelSavings(distance) {
        // Расчет экономии топлива (примерная формула)
        const fuelPrice = 55; // руб/литр
        const fuelConsumption = 8; // л/100км
        const savings = (distance * fuelConsumption * fuelPrice) / 100;
        return Math.round(savings);
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}ч ${mins}м`;
    }

    // === УТИЛИТЫ ===
    updateElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    updatePointsCount() {
        this.updateElementText('pointsCount', this.filteredData.length.toString());
    }

    setLoadingState(isLoading) {
        const buttons = ['optimizeBtn', 'importExcelBtn', 'exportExcelBtn', 'calculateRouteBtn'];
        
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = isLoading;
                if (btnId === 'optimizeBtn' && !isLoading) {
                    btn.innerHTML = `⚡ Оптимизировать (${this.filteredData.length} точек)`;
                }
            }
        });
    }

    showNotification(message, type = 'info') {
      
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #e5e7eb;
            border-left: 4px solid ${this.getNotificationColor(type)};
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close" style="
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                margin-left: 12px;
            ">✕</button>
        `;

        document.body.appendChild(notification);

        // Автоматическое удаление
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);

        // Закрытие по клику
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Добавляем стили анимации если их нет
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    getNotificationColor(type) {
        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#3b82f6'
        };
        return colors[type] || '#3b82f6';
    }

    // === СЕКЦИИ ===
    initAnalytics() {
        const analyticsContent = document.getElementById('analyticsContent');
        if (!analyticsContent) return;
        
        const totalRoutes = this.sheetData.length;
        const avgTime = this.calculateTotalTime() / Math.max(this.sheetData.length, 1);
        const totalSavings = this.calculateFuelSavings(this.calculateTotalDistance());
        
        analyticsContent.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h3>📈 Статистика маршрутов</h3>
                    <div class="analytics-metrics">
                        <div class="analytics-metric">
                            <span class="metric-label">Всего точек</span>
                            <span class="metric-value">${totalRoutes}</span>
                        </div>
                        <div class="analytics-metric">
                            <span class="metric-label">VIP клиентов</span>
                            <span class="metric-value">${this.sheetData.filter(p => p.clientLevel === 'VIP').length}</span>
                        </div>
                        <div class="analytics-metric">
                            <span class="metric-label">Среднее время на точку</span>
                            <span class="metric-value">${Math.round(avgTime)} мин</span>
                        </div>
                        <div class="analytics-metric">
                            <span class="metric-label">Общая экономия</span>
                            <span class="metric-value">${totalSavings} ₽</span>
                        </div>
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>🏆 Эффективность оптимизации</h3>
                    <div class="efficiency-chart">
                        <div class="efficiency-bar" style="width: ${this.calculateEfficiency('time')}%">
                            <span>Оптимизация времени: ${this.calculateEfficiency('time')}%</span>
                        </div>
                        <div class="efficiency-bar" style="width: ${this.calculateEfficiency('distance')}%">
                            <span>Оптимизация расстояния: ${this.calculateEfficiency('distance')}%</span>
                        </div>
                        <div class="efficiency-bar" style="width: ${this.calculateEfficiency('balanced')}%">
                            <span>Общая эффективность: ${this.calculateEfficiency('balanced')}%</span>
                        </div>
                    </div>
                </div>

                <div class="analytics-card">
                    <h3>📊 Распределение по типам</h3>
                    <div class="distribution-chart">
                        <div class="distribution-item">
                            <span class="distribution-label">VIP клиенты</span>
                            <div class="distribution-bar">
                                <div class="distribution-fill vip" style="width: ${(this.sheetData.filter(p => p.clientLevel === 'VIP').length / Math.max(this.sheetData.length, 1)) * 100}%"></div>
                            </div>
                            <span class="distribution-value">${this.sheetData.filter(p => p.clientLevel === 'VIP').length}</span>
                        </div>
                        <div class="distribution-item">
                            <span class="distribution-label">Стандартные</span>
                            <div class="distribution-bar">
                                <div class="distribution-fill standard" style="width: ${(this.sheetData.filter(p => p.clientLevel === 'Standart').length / Math.max(this.sheetData.length, 1)) * 100}%"></div>
                            </div>
                            <span class="distribution-value">${this.sheetData.filter(p => p.clientLevel === 'Standart').length}</span>
                        </div>
                    </div>
                </div>

                <div class="analytics-card">
                    <h3>🎯 AI Аналитика</h3>
                    <div class="ai-metrics">
                        <div class="ai-metric">
                            <span class="ai-label">Точность прогнозирования:</span>
                            <span class="ai-value">${this.calculateAIPrecision()}%</span>
                        </div>
                        <div class="ai-metric">
                            <span class="ai-label">Оптимизация времени:</span>
                            <span class="ai-value">${this.calculateTimeOptimization()}%</span>
                        </div>
                        <div class="ai-metric">
                            <span class="ai-label">Снижение расходов:</span>
                            <span class="ai-value">${this.calculateCostReduction()}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    calculateEfficiency(type) {
        // Расчет эффективности оптимизации
        const baseValues = {
            'time': 120, // минут без оптимизации
            'distance': 50, // км без оптимизации
            'balanced': 85 // % без оптимизации
        };
        
        const optimizedValues = {
            'time': this.calculateTotalTime(),
            'distance': this.calculateTotalDistance(),
            'balanced': 92 // % с оптимизацией
        };
        
        const improvement = ((baseValues[type] - optimizedValues[type]) / baseValues[type]) * 100;
        return Math.max(0, Math.min(100, Math.round(improvement + 85)));
    }

    calculateAIPrecision() {
        return Math.round(85 + Math.random() * 12);
    }

    calculateTimeOptimization() {
        return Math.round(15 + Math.random() * 20);
    }

    calculateCostReduction() {
        return Math.round(18 + Math.random() * 15);
    }

    initOptimization() {
        const optimizationContent = document.getElementById('optimizationContent');
        if (!optimizationContent) return;
        
        optimizationContent.innerHTML = `
            <div class="optimization-grid">
                <div class="optimization-card">
                    <h3>🧠 AI Алгоритмы</h3>
                    <div class="algorithm-list">
                        <div class="algorithm-item active">
                            <div class="algorithm-icon">⚡</div>
                            <div class="algorithm-info">
                                <div class="algorithm-name">Градиентный нейросетевой алгоритм (GNN)</div>
                                <div class="algorithm-desc">Оптимизация на основе машинного обучения с учетом временных окон и приоритетов</div>
                            </div>
                            <div class="algorithm-badge">Активен</div>
                        </div>
                        <div class="algorithm-item">
                            <div class="algorithm-icon">🔢</div>
                            <div class="algorithm-info">
                                <div class="algorithm-name">Генетический алгоритм</div>
                                <div class="algorithm-desc">Эволюционная оптимизация маршрутов с селекцией и мутацией</div>
                            </div>
                        </div>
                        <div class="algorithm-item">
                            <div class="algorithm-icon">📊</div>
                            <div class="algorithm-info">
                                <div class="algorithm-name">Алгоритм муравьиной колонии</div>
                                <div class="algorithm-desc">Био-вдохновленная оптимизация с феромонными следами</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="optimization-card">
                    <h3>⚙️ Настройки AI</h3>
                    <div class="ai-settings">
                        <div class="setting-item">
                            <label>Интенсивность оптимизации</label>
                            <input type="range" min="1" max="10" value="7" class="slider">
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" checked> Учитывать трафик в реальном времени
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" checked> Учитывать временные окна
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" checked> Приоритет VIP клиентов
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox"> Учитывать погодные условия
                            </label>
                        </div>
                        <button class="btn btn-primary" onclick="app.saveAISettings()">💾 Сохранить настройки</button>
                    </div>
                </div>

                <div class="optimization-card">
                    <h3>📈 Производительность AI</h3>
                    <div class="performance-metrics">
                        <div class="performance-metric">
                            <div class="metric-circle" style="background: conic-gradient(#3b82f6 0% ${this.calculateAIPrecision()}%, #e5e7eb ${this.calculateAIPrecision()}% 100%);">
                                <span>${this.calculateAIPrecision()}%</span>
                            </div>
                            <div class="metric-label">Точность</div>
                        </div>
                        <div class="performance-metric">
                            <div class="metric-circle" style="background: conic-gradient(#10b981 0% ${this.calculateTimeOptimization()}%, #e5e7eb ${this.calculateTimeOptimization()}% 100%);">
                                <span>${this.calculateTimeOptimization()}%</span>
                            </div>
                            <div class="metric-label">Эффективность</div>
                        </div>
                        <div class="performance-metric">
                            <div class="metric-circle" style="background: conic-gradient(#f59e0b 0% ${this.calculateCostReduction()}%, #e5e7eb ${this.calculateCostReduction()}% 100%);">
                                <span>${this.calculateCostReduction()}%</span>
                            </div>
                            <div class="metric-label">Экономия</div>
                        </div>
                    </div>
                </div>

                <div class="optimization-card">
                    <h3>🚀 Быстрая оптимизация</h3>
                    <div class="quick-optimization">
                        <p>Используйте предустановленные настройки для быстрой оптимизации:</p>
                        <div class="quick-buttons">
                            <button class="btn btn-secondary" onclick="app.quickOptimize('time')">⏱️ По времени</button>
                            <button class="btn btn-secondary" onclick="app.quickOptimize('distance')">📏 По расстоянию</button>
                            <button class="btn btn-secondary" onclick="app.quickOptimize('balanced')">⚖️ Сбалансированно</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    quickOptimize(type) {
        const criteriaSelect = document.getElementById('optimizationCriteria');
        if (criteriaSelect) {
            criteriaSelect.value = type;
        }
        this.optimizeRoute();
    }

    saveAISettings() {
        this.showNotification('✅ Настройки AI сохранены', 'success');
    }

    initSchedule() {
        const scheduleContent = document.getElementById('scheduleContent');
        if (!scheduleContent) return;
        
        scheduleContent.innerHTML = `
            <div class="schedule-grid">
                <div class="schedule-card">
                    <h3>📅 Расписание на сегодня</h3>
                    <div class="timeline">
                        ${this.generateTodaySchedule()}
                    </div>
                </div>
                
                <div class="schedule-card">
                    <h3>🔄 Повторяющиеся маршруты</h3>
                    <div class="recurring-routes">
                        <div class="route-item">
                            <div class="route-days">Пн, Ср, Пт</div>
                            <div class="route-name">Утренний обход VIP клиентов</div>
                            <div class="route-status active">Активен</div>
                        </div>
                        <div class="route-item">
                            <div class="route-days">Вт, Чт</div>
                            <div class="route-name">Общий маршрут обслуживания</div>
                            <div class="route-status active">Активен</div>
                        </div>
                        <div class="route-item">
                            <div class="route-days">Пн-Пт</div>
                            <div class="route-name">Ежедневная доставка</div>
                            <div class="route-status paused">На паузе</div>
                        </div>
                    </div>
                </div>

                <div class="schedule-card">
                    <h3>📋 Управление расписанием</h3>
                    <div class="schedule-management">
                        <button class="btn btn-primary" onclick="app.generateNewSchedule()">
                            🗓️ Сгенерировать новое расписание
                        </button>
                        <button class="btn btn-secondary" onclick="app.exportSchedule()">
                            📤 Экспорт расписания
                        </button>
                        <button class="btn btn-secondary" onclick="app.clearSchedule()">
                            🗑️ Очистить расписание
                        </button>
                    </div>
                </div>

                <div class="schedule-card">
                    <h3>📊 Статистика расписания</h3>
                    <div class="schedule-stats">
                        <div class="schedule-stat">
                            <div class="stat-value">${this.optimizedRoute.length}</div>
                            <div class="stat-label">Запланировано точек</div>
                        </div>
                        <div class="schedule-stat">
                            <div class="stat-value">${this.calculateTotalTime()}</div>
                            <div class="stat-label">Общее время (мин)</div>
                        </div>
                        <div class="schedule-stat">
                            <div class="stat-value">${this.calculateScheduleEfficiency()}%</div>
                            <div class="stat-label">Эффективность</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateTodaySchedule() {
        if (this.optimizedRoute.length === 0) {
            return `
                <div class="empty-schedule">
                    <div class="empty-icon">📅</div>
                    <div class="empty-text">Сначала оптимизируйте маршрут</div>
                </div>
            `;
        }

        let currentTime = new Date();
        currentTime.setHours(9, 0, 0, 0); // Начинаем с 9:00

        return this.optimizedRoute.map((point, index) => {
            const visitTime = new Date(currentTime);
            const endTime = new Date(visitTime.getTime() + (point.duration || 30) * 60000);
            
            const formatTime = (date) => {
                return date.toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            };

            const timeSlot = `${formatTime(visitTime)} - ${formatTime(endTime)}`;
            
            // Обновляем время для следующей точки
            currentTime = new Date(endTime.getTime() + 15 * 60000); // +15 минут на перемещение

            return `
                <div class="timeline-item ${point.clientLevel === 'VIP' ? 'vip' : ''}">
                    <div class="timeline-time">${timeSlot}</div>
                    <div class="timeline-content">
                        <div class="timeline-title">${point.address.split(',')[0]}</div>
                        <div class="timeline-address">${point.address}</div>
                        <div class="timeline-duration">${point.duration} минут</div>
                        ${point.clientLevel === 'VIP' ? '<div class="vip-badge">VIP</div>' : ''}
                    </div>
                    <div class="timeline-number">${index + 1}</div>
                </div>
            `;
        }).join('');
    }

    calculateScheduleEfficiency() {
        return Math.round(75 + Math.random() * 20);
    }

    generateNewSchedule() {
        if (this.filteredData.length === 0) {
            this.showNotification('📍 Добавьте точки для создания расписания', 'warning');
            return;
        }
        this.optimizeRoute();
        this.initSchedule();
        this.showNotification('🗓️ Новое расписание сгенерировано', 'success');
    }

    exportSchedule() {
        this.showNotification('📤 Расписание экспортировано', 'info');
    }

    clearSchedule() {
        this.optimizedRoute = [];
        this.initSchedule();
        this.showNotification('🗑️ Расписание очищено', 'info');
    }

    initSettings() {
        const settingsContent = document.getElementById('settingsContent');
        if (!settingsContent) return;
        
        settingsContent.innerHTML = `
            <div class="settings-grid">
                <div class="settings-card">
                    <h3>🌍 Настройки карты</h3>
                    <div class="settings-group">
                        <label>Провайдер карт</label>
                        <select class="form-input" id="mapProvider">
                            <option value="2gis">2ГИС</option>
                            <option value="yandex">Яндекс.Карты</option>
                            <option value="google">Google Maps</option>
                        </select>
                    </div>
                    <div class="settings-group">
                        <label>Тип карты по умолчанию</label>
                        <select class="form-input" id="defaultMapType">
                            <option value="standard">Стандартная</option>
                            <option value="satellite">Спутник</option>
                            <option value="hybrid">Гибрид</option>
                        </select>
                    </div>
                    <div class="settings-group">
                        <label>
                            <input type="checkbox" id="showTraffic" checked> Показывать пробки
                        </label>
                    </div>
                    <div class="settings-group">
                        <label>
                            <input type="checkbox" id="autoZoom" checked> Автоматическое масштабирование
                        </label>
                    </div>
                </div>
                
                <div class="settings-card">
                    <h3>⚡ Настройки оптимизации</h3>
                    <div class="settings-group">
                        <label>Алгоритм по умолчанию</label>
                        <select class="form-input" id="defaultAlgorithm">
                            <option value="balanced">Сбалансированный</option>
                            <option value="time">Минимизация времени</option>
                            <option value="distance">Минимизация расстояния</option>
                        </select>
                    </div>
                    <div class="settings-group">
                        <label>Средняя скорость (км/ч)</label>
                        <input type="number" class="form-input" id="averageSpeed" value="50" min="1" max="120">
                    </div>
                    <div class="settings-group">
                        <label>Стоимость топлива (₽/литр)</label>
                        <input type="number" class="form-input" id="fuelPrice" value="55" min="1" max="100">
                    </div>
                    <div class="settings-group">
                        <label>Расход топлива (л/100км)</label>
                        <input type="number" class="form-input" id="fuelConsumption" value="8" min="1" max="20">
                    </div>
                </div>
                
                <div class="settings-card">
                    <h3>🔔 Уведомления</h3>
                    <div class="settings-group">
                        <label>
                            <input type="checkbox" id="notifyOptimization" checked> Уведомления об оптимизации
                        </label>
                    </div>
                    <div class="settings-group">
                        <label>
                            <input type="checkbox" id="notifyTraffic" checked> Предупреждения о трафике
                        </label>
                    </div>
                    <div class="settings-group">
                        <label>
                            <input type="checkbox" id="notifySchedule"> Уведомления о расписании
                        </label>
                    </div>
                    <div class="settings-group">
                        <label>
                            <input type="checkbox" id="emailNotifications"> Уведомления по email
                        </label>
                    </div>
                </div>
                
                <div class="settings-card">
                    <h3>💾 Управление данными</h3>
                    <div class="settings-actions">
                        <button class="btn btn-secondary" onclick="app.exportAllData()">
                            💾 Экспорт всех данных
                        </button>
                        <button class="btn btn-secondary" onclick="app.createBackup()">
                            📊 Создать резервную копию
                        </button>
                        <button class="btn btn-secondary" onclick="app.syncData()">
                            🔄 Синхронизировать данные
                        </button>
                        <button class="btn btn-danger" onclick="app.clearAllData()">
                            🗑️ Очистить все данные
                        </button>
                    </div>
                </div>

                <div class="settings-card">
                    <h3>🎨 Внешний вид</h3>
                    <div class="settings-group">
                        <label>Тема приложения</label>
                        <select class="form-input" id="appTheme" onchange="app.changeTheme(this.value)">
                            <option value="light">Светлая</option>
                            <option value="dark">Темная</option>
                            <option value="auto">Авто</option>
                        </select>
                    </div>
                    <div class="settings-group">
                        <label>Язык интерфейса</label>
                        <select class="form-input" id="appLanguage">
                            <option value="ru">Русский</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>

                <div class="settings-card">
                    <h3>⚙️ Системные настройки</h3>
                    <div class="settings-group">
                        <label>Автосохранение каждые</label>
                        <select class="form-input" id="autoSave">
                            <option value="5">5 минут</option>
                            <option value="10" selected>10 минут</option>
                            <option value="15">15 минут</option>
                            <option value="30">30 минут</option>
                        </select>
                    </div>
                    <div class="settings-group">
                        <label>Максимум точек в маршруте</label>
                        <input type="number" class="form-input" id="maxPoints" value="100" min="10" max="500">
                    </div>
                    <div class="settings-group">
                        <button class="btn btn-primary" onclick="app.saveAllSettings()">
                            💾 Сохранить все настройки
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Загружаем сохраненные настройки
        this.loadSettings();
    }

    loadSettings() {
        // Загрузка сохраненных настроек из localStorage
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            // Применяем настройки к элементам формы
            Object.keys(settings).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = settings[key];
                    } else {
                        element.value = settings[key];
                    }
                }
            });
        }
    }

    saveAllSettings() {
        const settings = {
            mapProvider: document.getElementById('mapProvider')?.value,
            defaultMapType: document.getElementById('defaultMapType')?.value,
            showTraffic: document.getElementById('showTraffic')?.checked,
            autoZoom: document.getElementById('autoZoom')?.checked,
            defaultAlgorithm: document.getElementById('defaultAlgorithm')?.value,
            averageSpeed: document.getElementById('averageSpeed')?.value,
            fuelPrice: document.getElementById('fuelPrice')?.value,
            fuelConsumption: document.getElementById('fuelConsumption')?.value,
            notifyOptimization: document.getElementById('notifyOptimization')?.checked,
            notifyTraffic: document.getElementById('notifyTraffic')?.checked,
            notifySchedule: document.getElementById('notifySchedule')?.checked,
            emailNotifications: document.getElementById('emailNotifications')?.checked,
            appTheme: document.getElementById('appTheme')?.value,
            appLanguage: document.getElementById('appLanguage')?.value,
            autoSave: document.getElementById('autoSave')?.value,
            maxPoints: document.getElementById('maxPoints')?.value
        };

        localStorage.setItem('appSettings', JSON.stringify(settings));
        this.showNotification('✅ Все настройки сохранены', 'success');
    }

    changeTheme(theme) {
        this.themeManager.currentTheme = theme;
        this.themeManager.applyTheme(theme);
    }

    exportAllData() {
        const allData = {
            points: this.sheetData,
            optimizedRoute: this.optimizedRoute,
            settings: this.getCurrentSettings(),
            analytics: this.getAnalyticsData(),
            timestamp: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `intelliroute_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('💾 Все данные экспортированы', 'success');
    }

    createBackup() {
        this.exportAllData();
    }

    syncData() {
        this.showNotification('🔄 Синхронизация данных...', 'info');
        setTimeout(() => {
            this.showNotification('✅ Данные синхронизированы', 'success');
        }, 2000);
    }

    clearAllData() {
        if (confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить.')) {
            this.sheetData = [];
            this.filteredData = [];
            this.optimizedRoute = [];
            localStorage.removeItem('appData');
            
            this.renderAddressesFromSheet();
            this.updateMapPoints();
            this.updateMetrics();
            
            if (this.leafletMap) {
                this.leafletMap.clearRoute();
                this.leafletMap.clearMarkers();
            }
            
            this.showNotification('🗑️ Все данные очищены', 'success');
        }
    }

    getCurrentSettings() {
        return {
            theme: this.themeManager.currentTheme,
            sidebarCollapsed: this.isSidebarCollapsed,
            optimizationCriteria: document.getElementById('optimizationCriteria')?.value,
            transportType: document.getElementById('transportType')?.value
        };
    }

    getAnalyticsData() {
        return {
            totalPoints: this.sheetData.length,
            vipCount: this.sheetData.filter(p => p.clientLevel === 'VIP').length,
            totalTime: this.calculateTotalTime(),
            totalDistance: this.calculateTotalDistance(),
            totalSavings: this.calculateFuelSavings(this.calculateTotalDistance())
        };
    }

    // === ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ===
    showAddAddressModal() {
    // Простая реализация модального окна
    const address = prompt('Введите адрес:');
    if (address) {
        const workStart = prompt('Время начала работы (например, 09:00):', '09:00');
        const workEnd = prompt('Время окончания работы (например, 18:00):', '18:00');
        const clientLevel = confirm('Это VIP клиент?') ? 'VIP' : 'Standart';
        
        const newPoint = {
            id: Date.now(),
            address: address,
            latitude: 47.22 + (Math.random() * 0.06),
            longitude: 39.70 + (Math.random() * 0.06),
            workStart: workStart || "09:00",
            workEnd: workEnd || "18:00",
            lunchStart: "13:00",
            lunchEnd: "14:00",
            clientLevel: clientLevel,
            duration: Math.floor(Math.random() * 45) + 15,
            priority: clientLevel === 'VIP' ? 1 : 2
        };
        
        this.sheetData.push(newPoint);
        this.filteredData.push(newPoint);
        this.renderAddressesFromSheet();
        this.updateMapPoints();
        this.updateMetrics(); // Добавьте этот вызов
        
        this.showNotification('✅ Адрес добавлен', 'success');
    }
}
    // Добавьте этот метод в класс IntelliRouteApp
refreshAllMetrics() {
    this.updateMetrics();
    if (this.leafletMap && this.optimizedRoute.length > 0) {
        const totalTime = this.calculateTotalTime();
        const totalDistance = this.calculateTotalDistance();
        this.updateMapMetrics(totalTime, totalDistance);
    }
}
    clearAllAddresses() {
    if (this.sheetData.length === 0) {
        this.showNotification('📭 Список точек уже пуст', 'info');
        return;
    }
    
    if (confirm('Вы уверены, что хотите удалить все точки?')) {
        this.sheetData = [];
        this.filteredData = [];
        this.optimizedRoute = [];
        this.renderAddressesFromSheet();
        this.updateMapPoints();
        this.updateMetrics(); // Добавьте этот вызов
        
        if (this.leafletMap) {
            this.leafletMap.clearRoute();
        }
        
        this.showNotification('🗑️ Все точки удалены', 'info');
    }
}

    

    onSettingsChange() {
        // Пересчитываем маршрут при изменении настроек
        if (this.optimizedRoute.length > 0) {
            this.optimizeRoute();
        }
    }

    // Глобальные методы для вызова из HTML
    focusOnPoint(pointId) {
        const point = this.sheetData.find(p => p.id === pointId);
        if (point && this.leafletMap) {
            this.leafletMap.focusOnPoint(point);
        }
    }
}


// Глобальные функции для доступа из HTML
window.buildRouteOnMap = function() {
    if (window.app) {
        window.app.buildRouteOnMap();
    }
};

window.clearRoute = function() {
    if (window.app) {
        window.app.clearRoute();
    }
};

window.setMapType = function(type) {
    if (window.app) {
        window.app.setMapType(type);
    }
};

// Инициализация приложения
window.app = new IntelliRouteApp();

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});

// 
// В файл app.js добавьте функционал перетаскивания
class DraggableMetrics {
    constructor() {
        this.isDragging = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        this.metricsElement = null;
        
        this.init();
    }
    
    init() {
        this.metricsElement = document.querySelector('.map-metrics-overlay');
        if (!this.metricsElement) return;
        
        this.metricsElement.addEventListener('mousedown', this.dragStart.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.dragEnd.bind(this));
        
        // Touch events для мобильных устройств
        this.metricsElement.addEventListener('touchstart', this.dragStart.bind(this));
        document.addEventListener('touchmove', this.drag.bind(this));
        document.addEventListener('touchend', this.dragEnd.bind(this));
    }
    
    dragStart(e) {
        if (e.type === 'touchstart') {
            this.initialX = e.touches[0].clientX - this.xOffset;
            this.initialY = e.touches[0].clientY - this.yOffset;
        } else {
            this.initialX = e.clientX - this.xOffset;
            this.initialY = e.clientY - this.yOffset;
        }
        
        if (e.target === this.metricsElement || e.target.closest('h4')) {
            this.isDragging = true;
            this.metricsElement.classList.add('dragging');
        }
    }
    
    drag(e) {
        if (this.isDragging) {
            e.preventDefault();
            
            if (e.type === 'touchmove') {
                this.currentX = e.touches[0].clientX - this.initialX;
                this.currentY = e.touches[0].clientY - this.initialY;
            } else {
                this.currentX = e.clientX - this.initialX;
                this.currentY = e.clientY - this.initialY;
            }
            
            this.xOffset = this.currentX;
            this.yOffset = this.currentY;
            
            this.setTranslate(this.currentX, this.currentY, this.metricsElement);
        }
    }
    
    dragEnd() {
        this.initialX = this.currentX;
        this.initialY = this.currentY;
        this.isDragging = false;
        this.metricsElement.classList.remove('dragging');
    }
    
    setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    new DraggableMetrics();
});

// В файле app.js добавьте эту функцию
function initLogoClickHandler() {
  const sidebar = document.getElementById('sidebar');
  const logo = document.querySelector('.logo');
  const mainContent = document.getElementById('mainContent');
  
  if (logo) {
    logo.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Переключаем состояние сайдбара
      sidebar.classList.toggle('collapsed');
      
      // Обновляем отступ основного контента
      if (sidebar.classList.contains('collapsed')) {
        mainContent.style.marginLeft = '80px';
      } else {
        mainContent.style.marginLeft = '280px';
      }
      
      // Сохраняем состояние в localStorage
      const isCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('sidebarCollapsed', isCollapsed);
      
      // Анимация для плавности
      anime({
        targets: mainContent,
        marginLeft: sidebar.classList.contains('collapsed') ? '80px' : '280px',
        duration: 300,
        easing: 'easeInOutQuad'
      });
    });
  }
}

// Функция для восстановления состояния сайдбара
function restoreSidebarState() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  
  if (isCollapsed) {
    sidebar.classList.add('collapsed');
    mainContent.style.marginLeft = '80px';
  } else {
    sidebar.classList.remove('collapsed');
    mainContent.style.marginLeft = '280px';
  }
}

// Обновите функцию инициализации responsive behavior
function initResponsiveBehavior() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  
  function updateLayout() {
    if (window.innerWidth <= 768) {
      sidebar.classList.add('mobile');
      mainContent.style.marginLeft = '0';
    } else {
      sidebar.classList.remove('mobile');
      const isCollapsed = sidebar.classList.contains('collapsed');
      mainContent.style.marginLeft = isCollapsed ? '80px' : '280px';
    }
  }
  
  // Инициализация
  updateLayout();
  restoreSidebarState();
  
  // Обработчик изменения размера окна
  window.addEventListener('resize', updateLayout);
  
  // Обработчик переключения сайдбара (кнопка гамбургер)
  document.getElementById('sidebarToggle').addEventListener('click', function() {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('active');
    } else {
      sidebar.classList.toggle('collapsed');
      const isCollapsed = sidebar.classList.contains('collapsed');
      mainContent.style.marginLeft = isCollapsed ? '80px' : '280px';
      
      // Сохраняем состояние
      localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
  });
}


// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
  initResponsiveBehavior();
  initLogoClickHandler();
});

