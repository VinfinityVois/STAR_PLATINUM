class LeafletMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.markers = [];
        this.routeLayer = null;
        this.routingControl = null;
        
        this.initMap();
    }

    initMap() {
        try {
            // Инициализация карты Leaflet с OpenStreetMap
            this.map = L.map(this.containerId, {
                center: [47.221532, 39.704423], // Центр Ростова-на-Дону
                zoom: 12,
                minZoom: 10,
                maxZoom: 18
            });

            // Добавляем слой OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(this.map);

            // Добавляем контроль масштаба
            L.control.zoom({ position: 'topright' }).addTo(this.map);
            L.control.scale().addTo(this.map);

            console.log('Leaflet карта успешно инициализирована');
        } catch (error) {
            console.error('Ошибка инициализации Leaflet карты:', error);
        }
    }

    // Добавление маркера на карту с номером
    addMarker(pointData, index) {
        if (!this.map) return null;

        // Создаем кастомную иконку с номером
        const icon = this.createNumberedIcon(index + 1, pointData.clientLevel);

        const marker = L.marker([pointData.latitude, pointData.longitude], {
            icon: icon
        })
        .addTo(this.map)
        .bindPopup(`
            <div class="map-popup">
                <h4>Точка #${index + 1}</h4>
                <p><strong>Адрес:</strong> ${pointData.address}</p>
                <p><strong>Время работы:</strong> ${pointData.workStart} - ${pointData.workEnd}</p>
                <p><strong>Уровень:</strong> ${pointData.clientLevel}</p>
                <button onclick="app.focusOnPoint(${pointData.id})" class="btn-small">Подробнее</button>
            </div>
        `);

        this.markers.push({
            id: pointData.id,
            marker: marker,
            data: pointData,
            index: index
        });

        return marker;
    }

    // Создание иконки с номером
    createNumberedIcon(number, clientLevel = 'Standart') {
        const isVIP = clientLevel === 'VIP';
        const size = 32;
        const color = isVIP ? '#f59e0b' : '#3b82f6';
        const borderColor = isVIP ? '#d97706' : '#2563eb';
        
        return L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background: ${color};
                    border: 3px solid ${borderColor};
                    border-radius: 50%;
                    width: ${size}px;
                    height: ${size}px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    cursor: pointer;
                ">${number}</div>
            `,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
        });
    }

    // Очистка всех маркеров
    clearMarkers() {
        this.markers.forEach(item => {
            this.map.removeLayer(item.marker);
        });
        this.markers = [];
    }

    // Обновление точек на карте с правильной нумерацией
    updatePoints(pointsData) {
        this.clearMarkers();
        
        pointsData.forEach((point, index) => {
            this.addMarker(point, index);
        });

        if (pointsData.length > 0) {
            this.fitToMarkers();
        }
    }

    // Подстройка карты под все маркеры
    fitToMarkers() {
        if (this.markers.length === 0) return;

        const group = new L.featureGroup(this.markers.map(item => item.marker));
        this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }

    // Основной метод построения маршрута по дорогам
    async buildRoute(points, routeType = 'car') {
        if (points.length < 2) {
            console.warn('Для построения маршрута нужно минимум 2 точки');
            return;
        }

        // Удаляем предыдущий маршрут
        this.clearRoute();

        try {
            console.log('Начинаем построение маршрута через OSRM...');
            
            // Строим маршрут через OSRM
            const route = await this.getOSRMRoute(points, routeType);
            
            if (route && route.coordinates) {
                // Отображаем маршрут на карте
                this.displayRoute(route.coordinates, routeType);
                
                // Обновляем метрики маршрута
                this.updateRouteMetrics(route);
                
                console.log('Маршрут успешно построен по дорогам');
                return route;
            } else {
                throw new Error('Не удалось получить маршрут от OSRM');
            }

        } catch (error) {
            console.error('Ошибка построения маршрута OSRM:', error);
            // Показываем упрощенный маршрут как запасной вариант
            this.showSimplifiedRoute(points);
        }
    }

    // Получение маршрута от OSRM сервера
    async getOSRMRoute(points, routeType = 'car') {
        // Формируем координаты для запроса
        const coordinates = points.map(point => 
            `${point.longitude},${point.latitude}`
        ).join(';');

        // Определяем профиль маршрута
        let profile = 'driving'; // по умолчанию автомобиль
        switch(routeType) {
            case 'walking':
                profile = 'walking';
                break;
            case 'public':
                profile = 'driving'; // для общественного транспорта используем автомобильный
                break;
            case 'car':
            default:
                profile = 'driving';
        }

        // URL OSRM сервера
        const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson&steps=true`;

        try {
            const response = await fetch(osrmUrl);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                
                // Преобразуем координаты в формат Leaflet
                const coordinates = route.geometry.coordinates.map(coord => 
                    [coord[1], coord[0]] // OSRM возвращает [lon, lat], Leaflet нужен [lat, lon]
                );

                return {
                    coordinates: coordinates,
                    distance: route.distance, // в метрах
                    duration: route.duration, // в секундах
                    legs: route.legs
                };
            } else {
                throw new Error('OSRM не вернул маршрут: ' + data.code);
            }
        } catch (error) {
            console.error('Ошибка OSRM запроса:', error);
            throw error;
        }
    }

    // Отображение маршрута на карте
    displayRoute(coordinates, routeType) {
        // Создаем полилинию маршрута
        this.routeLayer = L.polyline(coordinates, {
            color: this.getRouteColor(routeType),
            weight: 6,
            opacity: 0.8,
            lineJoin: 'round',
            lineCap: 'round',
            smoothFactor: 1
        }).addTo(this.map);

        // Добавляем стрелки направления
        this.addDirectionArrows(coordinates);

        // Подстраиваем карту под маршрут
        this.map.fitBounds(this.routeLayer.getBounds(), { 
            padding: [50, 50] 
        });

        return this.routeLayer;
    }

    // Цвет маршрута в зависимости от типа транспорта
    getRouteColor(routeType) {
        switch(routeType) {
            case 'walking':
                return '#10b981'; // зеленый
            case 'public':
                return '#f59e0b'; // оранжевый
            case 'car':
            default:
                return '#3b82f6'; // синий
        }
    }

    // Добавление стрелок направления на маршрут
    addDirectionArrows(coordinates) {
        // Упрощенная реализация стрелок направления
        // Добавляем стрелки через каждые 10% маршрута
        const totalPoints = coordinates.length;
        const arrowInterval = Math.max(1, Math.floor(totalPoints / 10));

        for (let i = arrowInterval; i < totalPoints - arrowInterval; i += arrowInterval) {
            const point = coordinates[i];
            const nextPoint = coordinates[i + 1];
            
            // Вычисляем направление
            const angle = this.calculateBearing(point, nextPoint);
            
            L.marker(point, {
                icon: L.divIcon({
                    className: 'direction-arrow',
                    html: `<div style="transform: rotate(${angle}deg);">➤</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                }),
                zIndexOffset: 1000
            }).addTo(this.map);
        }
    }

    // Вычисление угла направления между двумя точками
    calculateBearing(point1, point2) {
        const lat1 = point1[0] * Math.PI / 180;
        const lon1 = point1[1] * Math.PI / 180;
        const lat2 = point2[0] * Math.PI / 180;
        const lon2 = point2[1] * Math.PI / 180;

        const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
                Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
        
        const bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    }

    // Обновление метрик маршрута
    updateRouteMetrics(route) {
        if (window.app && route) {
            // Конвертируем метры в километры
            const distanceKm = (route.distance / 1000).toFixed(1);
            // Конвертируем секунды в минуты
            const durationMin = Math.round(route.duration / 60);
            
            // Обновляем метрики в приложении
            window.app.updateRouteMetricsFromOSRM(distanceKm, durationMin);
        }
    }

    // Упрощенный маршрут (запасной вариант)
    showSimplifiedRoute(points) {
        console.log('Используем упрощенный маршрут');
        
        const routePoints = points.map(point => 
            [point.latitude, point.longitude]
        );

        this.routeLayer = L.polyline(routePoints, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.7,
            dashArray: '5, 10',
            lineJoin: 'round'
        }).addTo(this.map);

        this.map.fitBounds(this.routeLayer.getBounds(), { padding: [50, 50] });
        
        return this.routeLayer;
    }

    // Фокус на конкретную точку
    focusOnPoint(pointId) {
        const markerItem = this.markers.find(item => item.id === pointId);
        if (markerItem) {
            this.map.setView(
                [markerItem.data.latitude, markerItem.data.longitude], 
                15
            );
            markerItem.marker.openPopup();
        }
    }

    // Поиск адреса через Nominatim (OpenStreetMap)
    async searchAddress(query) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=ru`
            );
            const results = await response.json();
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Ошибка поиска адреса:', error);
            return null;
        }
    }

    // Получение координат по адресу
    async geocodeAddress(address) {
        try {
            const result = await this.searchAddress(address);
            if (result) {
                return {
                    latitude: parseFloat(result.lat),
                    longitude: parseFloat(result.lon),
                    address: result.display_name
                };
            }
            return null;
        } catch (error) {
            console.error('Ошибка геокодирования:', error);
            return null;
        }
    }

    // Удаление маршрута
    clearRoute() {
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
            this.routeLayer = null;
        }
        
        // Удаляем стрелки направления
        this.map.eachLayer(layer => {
            if (layer instanceof L.Marker && layer.options.icon?.options?.className === 'direction-arrow') {
                this.map.removeLayer(layer);
            }
        });
    }

    // Изменение типа карты
    setMapType(type = 'standard') {
        this.map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                this.map.removeLayer(layer);
            }
        });

        let tileLayer;
        switch(type) {
            case 'satellite':
                tileLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    subdomains: ['mt0','mt1','mt2','mt3'],
                    attribution: '&copy; Google'
                });
                break;
            case 'hybrid':
                tileLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    subdomains: ['mt0','mt1','mt2','mt3'],
                    attribution: '&copy; Google'
                });
                break;
            case 'standard':
            default:
                tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                    maxZoom: 19
                });
        }

        tileLayer.addTo(this.map);

        // Восстанавливаем маркеры и маршрут
        this.markers.forEach(item => {
            item.marker.addTo(this.map);
        });
        
        if (this.routeLayer) {
            this.routeLayer.addTo(this.map);
        }
    }

    // Обновление нумерации маркеров
    updateMarkersOrder(orderedPoints) {
        this.clearMarkers();
        orderedPoints.forEach((point, index) => {
            this.addMarker(point, index);
        });
    }

    // Перерисовка карты
    resize() {
        this.map.invalidateSize();
    }
}