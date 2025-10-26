class RouteAnimations {
    constructor() {
        this.anime = window.anime;
    }

    // Анимация появления элемента
    fadeIn(element, duration = 500) {
        return this.anime({
            targets: element,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: duration,
            easing: 'easeOutCubic'
        });
    }

    // Анимация удаления элемента
    fadeOut(element, duration = 300) {
        return this.anime({
            targets: element,
            opacity: [1, 0],
            translateX: [0, -20],
            duration: duration,
            easing: 'easeInCubic',
            complete: () => element.remove()
        });
    }

    // Анимация перетаскивания
    dragAnimation(element) {
        return this.anime({
            targets: element,
            scale: [1, 1.02],
            boxShadow: ['0 2px 4px rgba(0,0,0,0.1)', '0 8px 25px rgba(0,0,0,0.15)'],
            duration: 200,
            easing: 'easeOutCubic'
        });
    }

    // Анимация прогресса маршрута
    routeProgressAnimation() {
        const timeline = this.anime.timeline({
            duration: 2000,
            loop: true
        });

        timeline
            .add({
                targets: '.route-line::before',
                width: '100%',
                duration: 1500,
                easing: 'easeInOutCubic'
            })
            .add({
                targets: '.route-dot',
                scale: [1, 1.3, 1],
                duration: 400,
                delay: this.anime.stagger(300),
                easing: 'easeInOutCubic'
            }, '-=1500');

        return timeline;
    }

    // Анимация метрик
    metricCounter(element, start, end, duration = 1500) {
        return this.anime({
            targets: element,
            innerHTML: [start, end],
            round: 1,
            duration: duration,
            easing: 'easeOutCubic'
        });
    }

    // Анимация уведомления
    notificationIn(notification) {
        return this.anime({
            targets: notification,
            opacity: [0, 1],
            translateX: [100, 0],
            duration: 400,
            easing: 'easeOutCubic'
        });
    }

    notificationOut(notification) {
        return this.anime({
            targets: notification,
            opacity: [1, 0],
            translateX: [0, 100],
            duration: 300,
            easing: 'easeInCubic',
            complete: () => notification.remove()
        });
    }

    // Сложная анимация расчета маршрута
    calculateRouteAnimation() {
        const timeline = this.anime.timeline({
            duration: 1000
        });

        timeline
            .add({
                targets: '#calculateRouteBtn',
                scale: [1, 0.95, 1],
                duration: 300,
                easing: 'easeInOutCubic'
            })
            .add({
                targets: '.address-item',
                translateX: [0, -10, 10, 0],
                duration: 600,
                delay: this.anime.stagger(100),
                easing: 'easeInOutCubic'
            }, '-=300')
            .add({
                targets: '.route-visualization',
                opacity: [0.5, 1],
                scale: [0.98, 1],
                duration: 800,
                easing: 'easeOutCubic'
            }, '-=400');

        return timeline;
    }

    // Анимация появления боковой панели
    sidebarAnimation(sidebar, isOpening) {
        return this.anime({
            targets: sidebar,
            translateX: isOpening ? [0, 0] : [-280, 0],
            opacity: [0, 1],
            duration: 400,
            easing: 'easeOutCubic'
        });
    }

    // Парящая анимация для элементов
    floatingAnimation(element) {
        return this.anime({
            targets: element,
            translateY: [0, -8, 0],
            duration: 2000,
            loop: true,
            easing: 'easeInOutSine'
        });
    }

    // Анимация загрузки
    loadingAnimation(element) {
        return this.anime({
            targets: element,
            rotate: '1turn',
            duration: 1000,
            loop: true,
            easing: 'linear'
        });
    }
}

// Создаем глобальный экземпляр анимаций
window.RouteAnimations = new RouteAnimations();